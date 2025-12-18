/**
 * LOGGER UTILITY
 * Production-safe logging that can be disabled in builds
 */

const IS_DEVELOPMENT = import.meta.env.DEV;
const IS_TEST = import.meta.env.MODE === 'test';

/**
 * Logger that respects environment
 * In production, only errors are logged
 * In development, all logs are shown
 */
export const logger = {
  /**
   * Log informational message (dev/test only)
   */
  log(...args) {
    if (IS_DEVELOPMENT || IS_TEST) {
      console.log(...args);
    }
  },

  /**
   * Log warning (dev/test only)
   */
  warn(...args) {
    if (IS_DEVELOPMENT || IS_TEST) {
      console.warn(...args);
    }
  },

  /**
   * Log error (always shown)
   */
  error(...args) {
    console.error(...args);
  },

  /**
   * Log info (dev/test only)
   */
  info(...args) {
    if (IS_DEVELOPMENT || IS_TEST) {
      console.info(...args);
    }
  },

  /**
   * Log debug information (dev only)
   */
  debug(...args) {
    if (IS_DEVELOPMENT) {
      console.debug(...args);
    }
  }
};
