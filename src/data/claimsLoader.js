/**
 * CLAIMS DATABASE LOADER
 * Lazy-loads the claims database for code-splitting
 * The claims database is ~375KB and should not be in the main bundle
 */

let claimsCache = null;
let claimsPromise = null;

/**
 * Lazy-load the claims database
 * Uses caching to avoid repeated loads
 * @returns {Promise<Array>} Claims database
 */
export async function loadClaimsDatabase() {
  // Return cached claims if already loaded
  if (claimsCache) {
    return claimsCache;
  }

  // Return existing promise if currently loading
  if (claimsPromise) {
    return claimsPromise;
  }

  // Start loading
  claimsPromise = import('./claims.js')
    .then(module => {
      claimsCache = module.CLAIMS_DATABASE;
      claimsPromise = null;
      return claimsCache;
    })
    .catch(error => {
      claimsPromise = null;
      throw new Error(`Failed to load claims database: ${error.message}`);
    });

  return claimsPromise;
}

/**
 * Load filtered claims by grade level
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Filtered claims
 */
export async function loadFilteredClaims(filters) {
  const module = await import('./claims.js');
  return module.getFilteredClaims(filters);
}

/**
 * Check if claims are already loaded (for optimization)
 * @returns {boolean}
 */
export function areClaimsLoaded() {
  return claimsCache !== null;
}

/**
 * Preload claims database (for optimization during setup phase)
 * Call this when user is on setup screen to load claims in background
 */
export function preloadClaims() {
  if (!claimsCache && !claimsPromise) {
    loadClaimsDatabase().catch(() => {
      // Ignore errors during preload - will retry when actually needed
    });
  }
}
