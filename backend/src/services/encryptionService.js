// backend/src/services/encryptionService.js
const crypto = require('crypto');
const { AppError } = require('../middleware/errorHandler');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, a 12-byte IV is often recommended, but 16 is also common.
const KEY_LENGTH = 32; // For AES-256

let encryptionKey;

function getKey() {
  if (!encryptionKey) {
    const keyString = process.env.PASSWORD_ENCRYPTION_KEY;
    if (!keyString) {
      console.error('PASSWORD_ENCRYPTION_KEY environment variable is not set.');
      throw new AppError('Encryption key is not configured. Cannot perform encryption/decryption.', 500);
    }
    const decodedKey = Buffer.from(keyString, 'base64');
    if (decodedKey.length !== KEY_LENGTH) {
      console.error(`PASSWORD_ENCRYPTION_KEY must be a base64 encoded string of a ${KEY_LENGTH}-byte key. Current length: ${decodedKey.length}`);
      throw new AppError('Invalid encryption key length. Cannot perform encryption/decryption.', 500);
    }
    encryptionKey = decodedKey;
  }
  return encryptionKey;
}

/**
 * Encrypts text using AES-256-GCM.
 * @param {string} text - The text to encrypt.
 * @returns {{iv: string, encryptedData: string, authTag: string}} - Hex encoded IV, encrypted data, and authTag.
 */
function encrypt(text) {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new AppError('Encryption process failed.', 500);
  }
}

/**
 * Decrypts text using AES-256-GCM.
 * @param {{iv: string, encryptedData: string, authTag: string}} encryptedPayload - The encrypted payload object.
 * @returns {string} - The decrypted text.
 */
function decrypt(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.iv || !encryptedPayload.encryptedData || !encryptedPayload.authTag) {
    console.error('Decryption failed: Invalid payload structure. Missing iv, encryptedData, or authTag.');
    // It's important not to reveal too much detail about why decryption failed to an end-user.
    // For server logs, this detail is fine. For an API response, a generic "decryption failed" is better.
    throw new AppError('Decryption failed due to invalid payload.', 400); 
  }
  try {
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(encryptedPayload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, 'hex'));
    let decrypted = decipher.update(encryptedPayload.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Errors here can be due to incorrect key, IV, authTag, or corrupted data.
    console.error('Decryption failed:', error.message); // Log specific crypto error for server admin
    throw new AppError('Decryption failed. Data may be corrupt or key may be incorrect.', 500);
  }
}

module.exports = {
  encrypt,
  decrypt,
  // Expose for testing or if key needs to be pre-validated on startup
  isKeyConfigured: () => {
    try {
      getKey();
      return true;
    } catch (e) {
      return false;
    }
  }
};
