/**
 * ENCRYPTION UTILITIES
 * Lightweight encryption for localStorage data
 *
 * Uses a simple XOR cipher with session-based key for basic obfuscation.
 * NOT suitable for highly sensitive data, but prevents casual inspection.
 *
 * For production with sensitive data, consider:
 * - TweetNaCl.js (nacl-fast)
 * - CryptoJS
 * - Web Crypto API
 */

/**
 * Generate a session-based encryption key
 * Key persists for session but changes between sessions
 */
function getEncryptionKey() {
  const SESSION_KEY_STORAGE = 'truthHunters_encKey';

  try {
    // Try to get existing session key
    let key = sessionStorage.getItem(SESSION_KEY_STORAGE);

    if (!key) {
      // Generate new key for this session
      key = generateRandomKey(32);
      sessionStorage.setItem(SESSION_KEY_STORAGE, key);
    }

    return key;
  } catch (e) {
    // Fallback to deterministic key if sessionStorage unavailable
    return 'TruthHunters2025_DefaultKey';
  }
}

/**
 * Generate a random key
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
 * Simple XOR encryption
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

  // Convert to base64
  return btoa(String.fromCharCode(...encrypted));
}

/**
 * Simple XOR decryption
 * @param {string} encryptedBase64 - Base64 encoded encrypted text
 * @param {string} key - Encryption key
 * @returns {string} Decrypted text
 */
function xorDecrypt(encryptedBase64, key) {
  try {
    // Decode from base64
    const encryptedText = atob(encryptedBase64);
    const encrypted = new Uint8Array(encryptedText.length);
    for (let i = 0; i < encryptedText.length; i++) {
      encrypted[i] = encryptedText.charCodeAt(i);
    }

    const keyBytes = new TextEncoder().encode(key);
    const decrypted = new Uint8Array(encrypted.length);

    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed: ' + e.message);
  }
}

/**
 * Secure localStorage wrapper with encryption
 */
export const SecureStorage = {
  /**
   * Save encrypted data to localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  setItem(key, data) {
    try {
      const json = JSON.stringify(data);
      const encryptionKey = getEncryptionKey();
      const encrypted = xorEncrypt(json, encryptionKey);

      localStorage.setItem(key, encrypted);
      return true;
    } catch (e) {
      console.warn(`[SecureStorage] Failed to save ${key}:`, e);
      return false;
    }
  },

  /**
   * Get and decrypt data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found or decryption fails
   * @returns {any} Decrypted data
   */
  getItem(key, defaultValue = null) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return defaultValue;

      const encryptionKey = getEncryptionKey();
      const decrypted = xorDecrypt(encrypted, encryptionKey);
      return JSON.parse(decrypted);
    } catch (e) {
      console.warn(`[SecureStorage] Failed to read ${key}:`, e);
      return defaultValue;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[SecureStorage] Failed to remove ${key}:`, e);
      return false;
    }
  },

  /**
   * Clear all encrypted storage
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('[SecureStorage] Failed to clear storage:', e);
      return false;
    }
  },

  /**
   * Migrate existing unencrypted data to encrypted
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  migrateUnencrypted(key) {
    try {
      const existing = localStorage.getItem(key);
      if (!existing) return false;

      // Try to parse as JSON (unencrypted)
      try {
        const data = JSON.parse(existing);
        // If successful, it's unencrypted - re-save as encrypted
        this.setItem(key, data);
        console.log(`[SecureStorage] Migrated ${key} to encrypted storage`);
        return true;
      } catch {
        // Already encrypted or invalid - leave as is
        return false;
      }
    } catch (e) {
      console.warn(`[SecureStorage] Failed to migrate ${key}:`, e);
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
 * Migration helper - migrate all common keys to encrypted storage
 */
export function migrateAllToEncrypted() {
  const keysToMigrate = [
    'truthHunters_playerProfile',
    'truthHunters_leaderboard',
    'truthHunters_gameState',
    'truthHunters_analytics',
    'truthHunters_classCode'
  ];

  let migratedCount = 0;
  keysToMigrate.forEach(key => {
    if (SecureStorage.migrateUnencrypted(key)) {
      migratedCount++;
    }
  });

  if (migratedCount > 0) {
    console.log(`[SecureStorage] Migrated ${migratedCount} items to encrypted storage`);
  }

  return migratedCount;
}

/**
 * Example usage:
 *
 * // Save encrypted data
 * SecureStorage.setItem('truthHunters_playerProfile', {
 *   playerName: 'Alice',
 *   score: 100
 * });
 *
 * // Read encrypted data
 * const profile = SecureStorage.getItem('truthHunters_playerProfile', {});
 *
 * // Migrate existing data
 * migrateAllToEncrypted();
 */
