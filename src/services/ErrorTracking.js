/**
 * ERROR TRACKING SERVICE
 * Production error logging and monitoring
 *
 * Provides centralized error handling with optional integration
 * for external services (Sentry, LogRocket, etc.)
 */

const ERROR_LOG_KEY = 'truthHunters_errorLog';
const MAX_LOCAL_ERRORS = 50;
const MAX_ERROR_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Error severity levels
 */
export const ErrorLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error categories for better organization
 */
export const ErrorCategory = {
  NETWORK: 'network',
  FIREBASE: 'firebase',
  STORAGE: 'storage',
  VALIDATION: 'validation',
  GAME_LOGIC: 'game_logic',
  UI: 'ui',
  AUDIO: 'audio',
  UNKNOWN: 'unknown'
};

/**
 * Error Tracking Manager
 */
export const ErrorTracking = {
  enabled: true,
  initialized: false,
  errorQueue: [],

  /**
   * Initialize error tracking
   * @param {Object} config - Optional config (sentryDsn, logRocketAppId, etc.)
   */
  init(config = {}) {
    if (this.initialized) return;

    // Check for external service configuration
    const sentryDsn = config.sentryDsn || import.meta.env.VITE_SENTRY_DSN;
    const logRocketAppId = config.logRocketAppId || import.meta.env.VITE_LOGROCKET_APP_ID;
    const enableTracking = config.enabled !== false &&
                          (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'false');

    this.enabled = enableTracking;

    if (!this.enabled) {
      console.log('[ErrorTracking] Disabled in configuration');
      return;
    }

    // Initialize Sentry if configured
    if (sentryDsn && typeof window !== 'undefined') {
      this._initSentry(sentryDsn);
    }

    // Initialize LogRocket if configured
    if (logRocketAppId && typeof window !== 'undefined') {
      this._initLogRocket(logRocketAppId);
    }

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this._handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this._handleUnhandledRejection.bind(this));
    }

    // Clean up old errors
    this._cleanupOldErrors();

    this.initialized = true;
    console.log('[ErrorTracking] Initialized successfully');
  },

  /**
   * Initialize Sentry (load dynamically to avoid bundle bloat)
   */
  async _initSentry(dsn) {
    try {
      // In production, you would load Sentry SDK here
      console.log('[ErrorTracking] Sentry would be initialized with DSN:', dsn);
      // const Sentry = await import('@sentry/browser');
      // Sentry.init({ dsn, environment: import.meta.env.MODE });
    } catch (e) {
      console.warn('[ErrorTracking] Failed to initialize Sentry:', e);
    }
  },

  /**
   * Initialize LogRocket (load dynamically)
   */
  async _initLogRocket(appId) {
    try {
      console.log('[ErrorTracking] LogRocket would be initialized with ID:', appId);
      // const LogRocket = await import('logrocket');
      // LogRocket.init(appId);
    } catch (e) {
      console.warn('[ErrorTracking] Failed to initialize LogRocket:', e);
    }
  },

  /**
   * Log an error
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    if (!this.enabled) return;

    const errorData = this._formatError(error, ErrorLevel.ERROR, context);
    this._persistError(errorData);
    this._sendToExternal(errorData);

    // Also log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('[ErrorTracking]', errorData);
    }
  },

  /**
   * Log a warning
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  logWarning(message, context = {}) {
    if (!this.enabled) return;

    const errorData = this._formatError(message, ErrorLevel.WARNING, context);
    this._persistError(errorData);

    if (import.meta.env.MODE === 'development') {
      console.warn('[ErrorTracking]', errorData);
    }
  },

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  logInfo(message, context = {}) {
    if (!this.enabled) return;

    const errorData = this._formatError(message, ErrorLevel.INFO, context);

    if (import.meta.env.MODE === 'development') {
      console.log('[ErrorTracking]', errorData);
    }
  },

  /**
   * Log a critical error
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   */
  logCritical(error, context = {}) {
    if (!this.enabled) return;

    const errorData = this._formatError(error, ErrorLevel.CRITICAL, context);
    this._persistError(errorData);
    this._sendToExternal(errorData);

    console.error('[ErrorTracking] CRITICAL:', errorData);
  },

  /**
   * Format error into standard structure
   */
  _formatError(error, level, context) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    return {
      id: this._generateId(),
      timestamp: Date.now(),
      level,
      message: errorObj.message || String(error),
      stack: errorObj.stack,
      category: context.category || ErrorCategory.UNKNOWN,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      },
      environment: import.meta.env.MODE || 'production'
    };
  },

  /**
   * Handle global errors
   */
  _handleGlobalError(event) {
    this.logError(event.error || event.message, {
      category: ErrorCategory.UI,
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  },

  /**
   * Handle unhandled promise rejections
   */
  _handleUnhandledRejection(event) {
    this.logError(event.reason, {
      category: ErrorCategory.UNKNOWN,
      type: 'unhandled_rejection'
    });
  },

  /**
   * Persist error to localStorage
   */
  _persistError(errorData) {
    // Only persist errors and critical, not warnings/info
    if (![ErrorLevel.ERROR, ErrorLevel.CRITICAL].includes(errorData.level)) {
      return;
    }

    try {
      const stored = localStorage.getItem(ERROR_LOG_KEY);
      const errors = stored ? JSON.parse(stored) : [];

      errors.unshift(errorData);

      // Keep only recent errors
      const recentErrors = errors.slice(0, MAX_LOCAL_ERRORS);

      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('[ErrorTracking] Failed to persist error:', e);
    }
  },

  /**
   * Send error to external services
   */
  _sendToExternal(errorData) {
    // Only send errors and critical to external services
    if (![ErrorLevel.ERROR, ErrorLevel.CRITICAL].includes(errorData.level)) {
      return;
    }

    // Add to queue for batch sending
    this.errorQueue.push(errorData);

    // Send immediately for critical errors
    if (errorData.level === ErrorLevel.CRITICAL) {
      this._flushQueue();
    }
  },

  /**
   * Flush error queue to external services
   */
  _flushQueue() {
    if (this.errorQueue.length === 0) return;

    // In production, send to Sentry/LogRocket/etc.
    if (import.meta.env.MODE === 'development') {
      console.log('[ErrorTracking] Would send', this.errorQueue.length, 'errors to external service');
    }

    this.errorQueue = [];
  },

  /**
   * Get all logged errors
   */
  getErrors(filters = {}) {
    try {
      const stored = localStorage.getItem(ERROR_LOG_KEY);
      if (!stored) return [];

      let errors = JSON.parse(stored);

      // Apply filters
      if (filters.level) {
        errors = errors.filter(e => e.level === filters.level);
      }
      if (filters.category) {
        errors = errors.filter(e => e.category === filters.category);
      }
      if (filters.since) {
        errors = errors.filter(e => e.timestamp >= filters.since);
      }

      return errors;
    } catch (e) {
      console.warn('[ErrorTracking] Failed to get errors:', e);
      return [];
    }
  },

  /**
   * Get error statistics
   */
  getStats() {
    const errors = this.getErrors();

    const stats = {
      total: errors.length,
      byLevel: {},
      byCategory: {},
      last24Hours: 0,
      last7Days: 0
    };

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    errors.forEach(error => {
      // Count by level
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;

      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;

      // Time-based counts
      const age = now - error.timestamp;
      if (age < day) stats.last24Hours++;
      if (age < 7 * day) stats.last7Days++;
    });

    return stats;
  },

  /**
   * Clear all logged errors
   */
  clearErrors() {
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
      return true;
    } catch (e) {
      console.warn('[ErrorTracking] Failed to clear errors:', e);
      return false;
    }
  },

  /**
   * Clean up errors older than MAX_ERROR_AGE_MS
   */
  _cleanupOldErrors() {
    try {
      const errors = this.getErrors();
      const now = Date.now();

      const recentErrors = errors.filter(e => (now - e.timestamp) < MAX_ERROR_AGE_MS);

      if (recentErrors.length < errors.length) {
        localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(recentErrors));
        console.log(`[ErrorTracking] Cleaned up ${errors.length - recentErrors.length} old errors`);
      }
    } catch (e) {
      console.warn('[ErrorTracking] Failed to cleanup old errors:', e);
    }
  },

  /**
   * Generate unique error ID
   */
  _generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set user context (for associating errors with users)
   */
  setUser(userData) {
    if (!this.enabled) return;

    try {
      this.userContext = {
        playerName: userData.playerName || 'Anonymous',
        classCode: userData.classCode || null,
        sessionId: this._getSessionId()
      };
    } catch (e) {
      console.warn('[ErrorTracking] Failed to set user context:', e);
    }
  },

  /**
   * Get or create session ID
   */
  _getSessionId() {
    const SESSION_KEY = 'truthHunters_sessionId';
    try {
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'unknown';
    }
  },

  /**
   * Add breadcrumb (for debugging context)
   */
  addBreadcrumb(message, data = {}) {
    if (!this.enabled) return;

    // In production, this would be sent to Sentry/LogRocket
    if (import.meta.env.MODE === 'development') {
      console.log('[ErrorTracking] Breadcrumb:', message, data);
    }
  }
};

/**
 * Convenience functions
 */
export const logError = (error, context) => ErrorTracking.logError(error, context);
export const logWarning = (message, context) => ErrorTracking.logWarning(message, context);
export const logInfo = (message, context) => ErrorTracking.logInfo(message, context);
export const logCritical = (error, context) => ErrorTracking.logCritical(error, context);

// Auto-initialize with default config
ErrorTracking.init();
