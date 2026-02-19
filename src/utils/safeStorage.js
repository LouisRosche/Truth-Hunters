/**
 * Safe localStorage wrapper with error handling
 * Prevents crashes from QuotaExceededError, SecurityError, and JSON parse errors
 */

import { logger } from './logger';

/**
 * Safely get an item from localStorage
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if retrieval fails
 * @returns {*} The parsed value or defaultValue
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    logger.error(`Failed to get localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage
 * @param {string} key - The localStorage key
 * @param {*} value - The value to store (will be JSON.stringify'd)
 * @returns {boolean} True if successful, false otherwise
 */
export function safeSetItem(key, value) {
  try {
    // Normalize undefined to null for consistent JSON serialization
    const serialized = JSON.stringify(value === undefined ? null : value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      logger.error(`localStorage quota exceeded when setting "${key}"`);
    } else if (error.name === 'SecurityError') {
      logger.error(`localStorage access denied (private browsing?) when setting "${key}"`);
    } else {
      logger.error(`Failed to set localStorage item "${key}":`, error);
    }
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param {string} key - The localStorage key
 * @returns {boolean} True if successful, false otherwise
 */
export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage
 * @returns {boolean} True if successful, false otherwise
 */
export function safeClear() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    logger.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}
