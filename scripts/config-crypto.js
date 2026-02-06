/**
 * DineStack Config Crypto Utilities
 * 
 * Provides AES-256-GCM encryption/decryption for bundled configuration.
 * Used at build time to encrypt secrets and at runtime to decrypt.
 */

const crypto = require('crypto');

// App-specific secret (combined with salt for key derivation)
// This provides obfuscation - not meant as ultimate security
const APP_SECRET = 'DineStack-2026-SecureConfig-v1';

/**
 * Derives a 256-bit key from the app secret
 */
function deriveKey(salt) {
    return crypto.scryptSync(APP_SECRET, salt, 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param {string} plaintext - The text to encrypt
 * @returns {string} - Base64 encoded encrypted payload (salt:iv:authTag:ciphertext)
 */
function encrypt(plaintext) {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(salt);
    const iv = crypto.randomBytes(12); // GCM recommended IV size

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine all parts: salt:iv:authTag:ciphertext (all base64 encoded)
    return [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted
    ].join(':');
}

/**
 * Decrypts an encrypted payload
 * @param {string} encryptedPayload - Base64 encoded encrypted payload
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedPayload) {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted payload format');
    }

    const [saltB64, ivB64, authTagB64, ciphertext] = parts;

    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const key = deriveKey(salt);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };
