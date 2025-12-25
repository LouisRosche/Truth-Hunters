/**
 * FIREBASE QUERY CACHE
 * Simple in-memory cache with TTL for Firebase queries
 * Reduces redundant reads and improves performance
 */

import { logger } from '../utils/logger';

/**
 * Cache entry structure:
 * {
 *   data: any,           // Cached data
 *   timestamp: number,   // When it was cached (ms)
 *   ttl: number         // Time to live (ms)
 * }
 */
class FirebaseCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60000; // 1 minute default TTL
  }

  /**
   * Generate cache key from function name and arguments
   * @param {string} fnName - Function name
   * @param {Array} args - Function arguments
   * @returns {string} Cache key
   */
  _generateKey(fnName, args) {
    // Create a stable key from function name and arguments
    const argsStr = args.map(arg => {
      if (arg === null || arg === undefined) return 'null';
      if (typeof arg === 'object') return JSON.stringify(arg);
      return String(arg);
    }).join('_');
    return `${fnName}:${argsStr}`;
  }

  /**
   * Get cached value if valid
   * @param {string} fnName - Function name
   * @param {Array} args - Function arguments
   * @returns {any|null} Cached value or null if expired/missing
   */
  get(fnName, ...args) {
    const key = this._generateKey(fnName, args);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.log(`Cache expired for ${fnName}`);
      return null;
    }

    logger.log(`Cache hit for ${fnName} (age: ${age}ms)`);
    return entry.data;
  }

  /**
   * Set cached value with TTL
   * @param {string} fnName - Function name
   * @param {Array} args - Function arguments
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(fnName, args, data, ttl = this.defaultTTL) {
    const key = this._generateKey(fnName, args);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    logger.log(`Cached ${fnName} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate cache for specific function or all cache
   * @param {string} fnName - Function name to invalidate (optional)
   */
  invalidate(fnName = null) {
    if (fnName) {
      // Invalidate all entries for this function
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${fnName}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      logger.log(`Invalidated cache for ${fnName} (${keysToDelete.length} entries)`);
    } else {
      // Clear all cache
      this.cache.clear();
      logger.log('Cleared all cache');
    }
  }

  /**
   * Invalidate all read caches when writes occur
   * This ensures data consistency after mutations
   */
  invalidateOnWrite() {
    // Invalidate leaderboard and stats queries
    this.invalidate('getTopTeams');
    this.invalidate('getTopPlayers');
    this.invalidate('getClassSettings');
    this.invalidate('getClassSeenClaims');
    this.invalidate('getPendingClaims');
    this.invalidate('getAllSubmittedClaims');
    this.invalidate('getApprovedClaims');
    this.invalidate('getClassReflections');
    this.invalidate('getClassAchievements');
    logger.log('Invalidated read caches after write operation');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age <= entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    };
  }

  /**
   * Clean up expired entries (periodic maintenance)
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const firebaseCache = new FirebaseCache();

// Periodic cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    firebaseCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Decorator to wrap Firebase functions with caching
 * @param {Function} fn - Firebase function to wrap
 * @param {string} fnName - Function name for cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} Wrapped function with caching
 */
export function withCache(fn, fnName, ttl) {
  return async function(...args) {
    // Check cache first
    const cached = firebaseCache.get(fnName, ...args);
    if (cached !== null) {
      return cached;
    }

    // Call original function
    const result = await fn.apply(this, args);

    // Cache result
    firebaseCache.set(fnName, args, result, ttl);

    return result;
  };
}
