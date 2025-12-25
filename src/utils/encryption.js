/**
 * ENCRYPTION UTILITIES
 * Secure encryption for localStorage data using Web Crypto API
 *
 * Uses AES-GCM encryption with session-based keys for strong security.
 * Maintains backward compatibility with legacy XOR-encrypted data.
 */

import { logger } from './logger';

// Version prefix for encrypted data (used for migration)
const ENCRYPTION_VERSION = 'v2:';
const LEGACY_XOR_MARKER = 'xor:';

/**
 * Generate or retrieve session-based encryption key using Web Crypto API
 * @returns {Promise<CryptoKey>} The encryption key
 */
async function getEncryptionKey() {
  const SESSION_KEY_STORAGE = 'truthHunters_encKey_v2';

  try {
    // Try to get existing session key
    let keyData = sessionStorage.getItem(SESSION_KEY_STORAGE);

    if (keyData) {
      // Import existing key
      const keyBuffer = base64ToBuffer(keyData);
      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }

    // Generate new key for this session
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export and store key for session persistence
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    sessionStorage.setItem(SESSION_KEY_STORAGE, bufferToBase64(exportedKey));

    return key;
  } catch (e) {
    logger.warn('[Encryption] Web Crypto API unavailable, using fallback:', e);
    // Fallback to XOR for environments without Web Crypto API
    return null;
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt text using AES-GCM
 * @param {string} text - Text to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted text with IV
 */
async function aesEncrypt(text) {
  try {
    const key = await getEncryptionKey();

    // Fallback to XOR if Web Crypto unavailable
    if (!key) {
      return LEGACY_XOR_MARKER + xorEncrypt(text, getLegacyKey());
    }

    // Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Encrypt using AES-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Return version prefix + base64 encoded result
    return ENCRYPTION_VERSION + bufferToBase64(combined);
  } catch (e) {
    logger.error('[Encryption] AES encryption failed:', e);
    // Fallback to XOR on error
    return LEGACY_XOR_MARKER + xorEncrypt(text, getLegacyKey());
  }
}

/**
 * Decrypt text using AES-GCM (with backward compatibility for XOR)
 * @param {string} encryptedText - Base64 encoded encrypted text with IV
 * @returns {Promise<string>} Decrypted text
 */
async function aesDecrypt(encryptedText) {
  try {
    // Check for legacy XOR encryption
    if (encryptedText.startsWith(LEGACY_XOR_MARKER)) {
      return xorDecrypt(encryptedText.substring(LEGACY_XOR_MARKER.length), getLegacyKey());
    }

    // Check for v2 encryption
    if (!encryptedText.startsWith(ENCRYPTION_VERSION)) {
      // Assume legacy XOR without marker (backward compatibility)
      try {
        return xorDecrypt(encryptedText, getLegacyKey());
      } catch {
        throw new Error('Unknown encryption format');
      }
    }

    const key = await getEncryptionKey();
    if (!key) {
      throw new Error('Encryption key unavailable');
    }

    // Remove version prefix and decode
    const combined = base64ToBuffer(encryptedText.substring(ENCRYPTION_VERSION.length));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt using AES-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    throw new Error('Decryption failed: ' + e.message);
  }
}

// ===== LEGACY XOR ENCRYPTION (for backward compatibility) =====

/**
 * Get legacy XOR encryption key
 */
function getLegacyKey() {
  const SESSION_KEY_STORAGE = 'truthHunters_encKey';
  try {
    let key = sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (!key) {
      key = generateRandomKey(32);
      sessionStorage.setItem(SESSION_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return 'TruthHunters2025_DefaultKey';
  }
}

/**
 * Generate a random key (legacy)
 */
function generateRandomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Simple XOR encryption (legacy - kept for backward compatibility)
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Base64 encoded encrypted text
 */
function xorEncrypt(text, key) {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return bufferToBase64(encrypted);
}

/**
 * Simple XOR decryption (legacy - kept for backward compatibility)
 * @param {string} encryptedBase64 - Base64 encoded encrypted text
 * @param {string} key - Encryption key
 * @returns {string} Decrypted text
 */
function xorDecrypt(encryptedBase64, key) {
  try {
    const encrypted = base64ToBuffer(encryptedBase64);
    const keyBytes = new TextEncoder().encode(key);
    const decrypted = new Uint8Array(encrypted.byteLength);

    for (let i = 0; i < encrypted.byteLength; i++) {
      decrypted[i] = new Uint8Array(encrypted)[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed: ' + e.message);
  }
}

/**
 * Secure localStorage wrapper with AES-GCM encryption
 */
export const SecureStorage = {
  /**
   * Save encrypted data to localStorage (async for Web Crypto API)
   * @param {string} key - Storage key
   * @param {any} data - Data to store (will be JSON stringified)
   * @returns {Promise<boolean>} Success status
   */
  async setItem(key, data) {
    try {
      const json = JSON.stringify(data);
      const encrypted = await aesEncrypt(json);

      localStorage.setItem(key, encrypted);
      return true;
    } catch (e) {
      logger.warn(`[SecureStorage] Failed to save ${key}:`, e);
      return false;
    }
  },

  /**
   * Get and decrypt data from localStorage (async for Web Crypto API)
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found or decryption fails
   * @returns {Promise<any>} Decrypted data
   */
  async getItem(key, defaultValue = null) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return defaultValue;

      const decrypted = await aesDecrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (e) {
      logger.warn(`[SecureStorage] Failed to read ${key}:`, e);
      return defaultValue;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      logger.warn(`[SecureStorage] Failed to remove ${key}:`, e);
      return false;
    }
  },

  /**
   * Clear all encrypted storage
   * @returns {boolean} Success status
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      logger.warn('[SecureStorage] Failed to clear storage:', e);
      return false;
    }
  },

  /**
   * Migrate existing unencrypted or legacy XOR data to AES-GCM
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async migrateUnencrypted(key) {
    try {
      const existing = localStorage.getItem(key);
      if (!existing) return false;

      // Check if already using v2 encryption
      if (existing.startsWith(ENCRYPTION_VERSION)) {
        return false; // Already migrated
      }

      // Try to parse as JSON (unencrypted)
      try {
        const data = JSON.parse(existing);
        // If successful, it's unencrypted - re-save with AES-GCM
        await this.setItem(key, data);
        logger.log(`[SecureStorage] Migrated ${key} to AES-GCM encryption`);
        return true;
      } catch {
        // Not plain JSON - might be legacy XOR, try to decrypt and re-encrypt
        try {
          const decrypted = await aesDecrypt(existing); // Will use legacy XOR fallback
          const data = JSON.parse(decrypted);
          await this.setItem(key, data); // Re-encrypt with AES-GCM
          logger.log(`[SecureStorage] Migrated ${key} from XOR to AES-GCM`);
          return true;
        } catch {
          // Invalid data - leave as is
          return false;
        }
      }
    } catch (e) {
      logger.warn(`[SecureStorage] Failed to migrate ${key}:`, e);
      return false;
    }
  },

  /**
   * Check if data is available
   * @param {string} key - Storage key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Migration helper - migrate all common keys to AES-GCM encryption
 * @returns {Promise<number>} Number of items migrated
 */
export async function migrateAllToEncrypted() {
  const keysToMigrate = [
    'truthHunters_playerProfile',
    'truthHunters_leaderboard',
    'truthHunters_gameState',
    'truthHunters_analytics',
    'truthHunters_classCode'
  ];

  let migratedCount = 0;

  // Process migrations sequentially to avoid race conditions
  for (const key of keysToMigrate) {
    try {
      const migrated = await SecureStorage.migrateUnencrypted(key);
      if (migrated) {
        migratedCount++;
      }
    } catch (e) {
      logger.warn(`[SecureStorage] Failed to migrate ${key}:`, e);
    }
  }

  if (migratedCount > 0) {
    logger.log(`[SecureStorage] Migrated ${migratedCount} items to AES-GCM encryption`);
  }

  return migratedCount;
}

/**
 * Example usage:
 *
 * // Save encrypted data (async)
 * await SecureStorage.setItem('truthHunters_playerProfile', {
 *   playerName: 'Alice',
 *   score: 100
 * });
 *
 * // Read encrypted data (async)
 * const profile = await SecureStorage.getItem('truthHunters_playerProfile', {});
 *
 * // Migrate existing data (async)
 * await migrateAllToEncrypted();
 */
