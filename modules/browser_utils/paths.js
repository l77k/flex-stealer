const path = require('path');
const os = require('os');

const BROWSER_TYPE = {
    OPERA: 'opera',
    OPERAGX: 'operagx',
    VIVALDI: 'vivaldi',
    FIREFOX: 'firefox',
    YANDEX: 'yandex',
    BRAVE: 'brave'
};

const FILE_TYPE = {
    COOKIES: 'cookies',
    LOGIN_DATA: 'login_data',
    WEB_DATA: 'web_data',
    HISTORY: 'history',
    BOOKMARKS: 'bookmarks',
    LOCAL_STATE: 'local_state'
};

const ENCRYPTION_TYPE = {
    DPAPI: 'dpapi'
};

/**
 * Returns the base path for a given browser's data directory.
 */
function getBrowserBasePath(browserType) {
    const appData = process.env.APPDATA;
    const localAppData = process.env.LOCALAPPDATA;

    switch (browserType) {
        case BROWSER_TYPE.OPERA:
            return path.join(appData, 'Opera Software', 'Opera Stable');
        case BROWSER_TYPE.OPERAGX:
            return path.join(appData, 'Opera Software', 'Opera GX Stable');
        case BROWSER_TYPE.VIVALDI:
            return path.join(localAppData, 'Vivaldi', 'User Data');
        case BROWSER_TYPE.YANDEX:
            return path.join(localAppData, 'Yandex', 'YandexBrowser', 'User Data');
        case BROWSER_TYPE.BRAVE:
            return path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
        case BROWSER_TYPE.FIREFOX:
            return path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
        default:
            return null;
    }
}

/**
 * Returns the specific file path for a Chromium-based browser.
 */
function getChromiumFilePath(browserType, fileType) {
    const basePath = getBrowserBasePath(browserType);
    if (!basePath) return null;

    if (fileType === FILE_TYPE.LOCAL_STATE) {
        return path.join(basePath, 'Local State');
    }

    // Most Chromium browsers use a 'Default' profile folder
    const profilePath = path.join(basePath, 'Default');

    switch (fileType) {
        case FILE_TYPE.COOKIES:
            return path.join(profilePath, 'Network', 'Cookies');
        case FILE_TYPE.LOGIN_DATA:
            return path.join(profilePath, 'Login Data');
        case FILE_TYPE.WEB_DATA:
            return path.join(profilePath, 'Web Data');
        case FILE_TYPE.HISTORY:
            return path.join(profilePath, 'History');
        case FILE_TYPE.BOOKMARKS:
            return path.join(profilePath, 'Bookmarks');
        default:
            return null;
    }
}

function getFirefoxBaseDir() {
    return path.join(process.env.APPDATA, 'Mozilla', 'Firefox', 'Profiles');
}

function getBrowserName(browserType) {
    return browserType;
}

module.exports = {
    BROWSER_TYPE,
    ENCRYPTION_TYPE,
    FILE_TYPE,
    getBrowserBasePath,
    getFirefoxBaseDir,
    getChromiumFilePath,
    getBrowserName
};