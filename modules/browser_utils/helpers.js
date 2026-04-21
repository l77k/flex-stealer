const fs = require('fs');
const path = require('path');
const os = require('os');

const AES_GCM_IV_SIZE = 12;

function fileExists(filePath) {
    if (!filePath) return false;
    return fs.existsSync(filePath);
}

function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function copyToTemp(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const tempDir = os.tmpdir();
        const fileName = path.basename(filePath);
        const targetPath = path.join(tempDir, `flex_browser_${Date.now()}_${fileName}`);
        fs.copyFileSync(filePath, targetPath);
        return targetPath;
    } catch (e) {
        return null;
    }
}

function deleteTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {}
}

/**
 * Converts a WebKit/Chromium timestamp (microseconds since 1601-01-01) to a JS Date.
 */
function unixTimestampToDate(timestamp) {
    if (!timestamp) return null;
    const unixEpochDiff = 11644473600000;
    const milliseconds = timestamp / 1000 - unixEpochDiff;
    return new Date(milliseconds);
}

function hasV10Prefix(data) {
    const str = data ? data.toString() : "";
    return str.startsWith('v10');
}

function hasV20Prefix(data) {
    const str = data ? data.toString() : "";
    return str.startsWith('v20');
}

module.exports = {
    AES_GCM_IV_SIZE,
    fileExists,
    readJsonFile,
    copyToTemp,
    deleteTempFile,
    unixTimestampToDate,
    hasV10Prefix,
    hasV20Prefix
};