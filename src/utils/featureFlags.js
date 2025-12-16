/**
 * FEATURE FLAGS SYSTEM
 * Centralized feature toggles for runtime configuration
 *
 * Allows enabling/disabling features without code changes
 * Useful for A/B testing, gradual rollouts, and emergency shutoffs
 */

/**
 * Default feature flags
 * Can be overridden by environment variables or localStorage
 */
const DEFAULT_FLAGS = {
  // Core features
  enableFirebase: true,
  enableAnalytics: true,
  enableErrorTracking: true,
  enableEncryption: true,

  // Game features
  enableSound: true,
  enableAchievements: true,
  enableHints: true,
  enablePredictionModal: true,
  enableLeaderboard: true,
  enableOfflineQueue: true,

  // Student features
  enableStudentClaims: true,
  enableReflections: true,
  enableAchievementSharing: true,

  // Teacher features
  enableTeacherDashboard: true,
  enableClassSettings: true,
  enableClaimModeration: true,

  // UI features
  enablePresentationMode: true,
  enableDarkMode: true,
  enableAccessibility: true,
  enableKeyboardShortcuts: true,

  // Experimental features (disabled by default)
  enableRealTimeUpdates: false,
  enableAIHints: false,
  enableMultiplayer: false,
  enableVideoHints: false,
  enableCustomThemes: false,

  // Debug features (only in development)
  enableDebugPanel: false,
  enablePerformanceMonitoring: false,
  enableVerboseLogging: false
};

/**
 * Feature Flags Manager
 */
export const FeatureFlags = {
  flags: { ...DEFAULT_FLAGS },
  listeners: [],
  initialized: false,

  /**
   * Initialize feature flags
   * Reads from environment variables and localStorage
   */
  init() {
    if (this.initialized) return;

    // Load from environment variables (build-time)
    this._loadFromEnv();

    // Load from localStorage (runtime overrides)
    this._loadFromStorage();

    // Enable debug features in development
    if (import.meta.env.MODE === 'development') {
      this.flags.enableDebugPanel = true;
      this.flags.enablePerformanceMonitoring = true;
      this.flags.enableVerboseLogging = true;
    }

    this.initialized = true;
    console.log('[FeatureFlags] Initialized:', this.flags);
  },

  /**
   * Load flags from environment variables
   */
  _loadFromEnv() {
    const envMapping = {
      VITE_ENABLE_FIREBASE: 'enableFirebase',
      VITE_ENABLE_ANALYTICS: 'enableAnalytics',
      VITE_ENABLE_ERROR_TRACKING: 'enableErrorTracking',
      VITE_ENABLE_ENCRYPTION: 'enableEncryption',
      VITE_ENABLE_SOUND: 'enableSound',
      VITE_ENABLE_LEADERBOARD: 'enableLeaderboard',
      VITE_ENABLE_REAL_TIME: 'enableRealTimeUpdates',
      VITE_ENABLE_AI_HINTS: 'enableAIHints'
    };

    Object.entries(envMapping).forEach(([envVar, flagName]) => {
      const envValue = import.meta.env[envVar];
      if (envValue !== undefined) {
        this.flags[flagName] = envValue === 'true' || envValue === true;
      }
    });
  },

  /**
   * Load flags from localStorage
   * Allows runtime toggling via developer tools
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('truthHunters_featureFlags');
      if (stored) {
        const overrides = JSON.parse(stored);
        this.flags = { ...this.flags, ...overrides };
      }
    } catch (e) {
      console.warn('[FeatureFlags] Failed to load from storage:', e);
    }
  },

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} Whether feature is enabled
   */
  isEnabled(featureName) {
    if (!this.initialized) {
      this.init();
    }
    return this.flags[featureName] ?? false;
  },

  /**
   * Enable a feature
   * @param {string} featureName - Name of the feature
   * @param {boolean} persist - Whether to persist to localStorage
   */
  enable(featureName, persist = false) {
    this.flags[featureName] = true;
    if (persist) {
      this._saveToStorage();
    }
    this._notifyListeners(featureName, true);
  },

  /**
   * Disable a feature
   * @param {string} featureName - Name of the feature
   * @param {boolean} persist - Whether to persist to localStorage
   */
  disable(featureName, persist = false) {
    this.flags[featureName] = false;
    if (persist) {
      this._saveToStorage();
    }
    this._notifyListeners(featureName, false);
  },

  /**
   * Toggle a feature
   * @param {string} featureName - Name of the feature
   * @param {boolean} persist - Whether to persist to localStorage
   */
  toggle(featureName, persist = false) {
    const newValue = !this.flags[featureName];
    this.flags[featureName] = newValue;
    if (persist) {
      this._saveToStorage();
    }
    this._notifyListeners(featureName, newValue);
    return newValue;
  },

  /**
   * Save current flags to localStorage
   */
  _saveToStorage() {
    try {
      localStorage.setItem('truthHunters_featureFlags', JSON.stringify(this.flags));
    } catch (e) {
      console.warn('[FeatureFlags] Failed to save to storage:', e);
    }
  },

  /**
   * Subscribe to flag changes
   * @param {Function} callback - Called when any flag changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  /**
   * Notify listeners of flag changes
   */
  _notifyListeners(featureName, newValue) {
    this.listeners.forEach(callback => {
      try {
        callback(featureName, newValue);
      } catch (e) {
        console.warn('[FeatureFlags] Listener error:', e);
      }
    });
  },

  /**
   * Get all flags
   * @returns {Object} All feature flags
   */
  getAll() {
    if (!this.initialized) {
      this.init();
    }
    return { ...this.flags };
  },

  /**
   * Reset to defaults
   */
  reset() {
    this.flags = { ...DEFAULT_FLAGS };
    try {
      localStorage.removeItem('truthHunters_featureFlags');
    } catch (e) {
      // Ignore
    }
    console.log('[FeatureFlags] Reset to defaults');
  },

  /**
   * Set multiple flags at once
   * @param {Object} newFlags - Object with flag names and values
   * @param {boolean} persist - Whether to persist to localStorage
   */
  setMultiple(newFlags, persist = false) {
    Object.entries(newFlags).forEach(([name, value]) => {
      this.flags[name] = value;
      this._notifyListeners(name, value);
    });

    if (persist) {
      this._saveToStorage();
    }
  },

  /**
   * Get feature flag statistics
   */
  getStats() {
    const all = this.getAll();
    const enabled = Object.values(all).filter(v => v === true).length;
    const disabled = Object.values(all).filter(v => v === false).length;

    return {
      total: Object.keys(all).length,
      enabled,
      disabled,
      percentage: Math.round((enabled / Object.keys(all).length) * 100)
    };
  }
};

/**
 * Convenience functions
 */
export const isFeatureEnabled = (featureName) => FeatureFlags.isEnabled(featureName);
export const enableFeature = (featureName, persist) => FeatureFlags.enable(featureName, persist);
export const disableFeature = (featureName, persist) => FeatureFlags.disable(featureName, persist);
export const toggleFeature = (featureName, persist) => FeatureFlags.toggle(featureName, persist);

/**
 * React hook for feature flags (optional)
 * Usage: const isEnabled = useFeatureFlag('enableSound');
 */
export function useFeatureFlag(featureName) {
  if (typeof window === 'undefined') return false;

  const [isEnabled, setIsEnabled] = React.useState(() =>
    FeatureFlags.isEnabled(featureName)
  );

  React.useEffect(() => {
    const unsubscribe = FeatureFlags.subscribe((name, value) => {
      if (name === featureName) {
        setIsEnabled(value);
      }
    });

    return unsubscribe;
  }, [featureName]);

  return isEnabled;
}

/**
 * Debug helper - print all flags to console
 */
export function debugFlags() {
  const all = FeatureFlags.getAll();
  const stats = FeatureFlags.getStats();

  console.group('🚩 Feature Flags');
  console.log('Statistics:', stats);
  console.table(
    Object.entries(all).map(([name, enabled]) => ({
      Feature: name,
      Enabled: enabled ? '✅' : '❌'
    }))
  );
  console.groupEnd();
}

// Auto-initialize
FeatureFlags.init();

// Expose to window for debugging (development only)
if (import.meta.env.MODE === 'development' && typeof window !== 'undefined') {
  window.FeatureFlags = FeatureFlags;
  window.debugFlags = debugFlags;
  console.log('💡 Debug helpers available: window.FeatureFlags, window.debugFlags()');
}

/**
 * Example usage:
 *
 * // Check if feature is enabled
 * if (isFeatureEnabled('enableSound')) {
 *   SoundManager.play('correct');
 * }
 *
 * // Toggle feature
 * toggleFeature('enableDarkMode', true); // persist to localStorage
 *
 * // Subscribe to changes
 * const unsubscribe = FeatureFlags.subscribe((name, value) => {
 *   console.log(`Feature ${name} is now ${value}`);
 * });
 *
 * // Debug in console
 * debugFlags();
 *
 * // Disable feature temporarily (emergency hotfix)
 * window.FeatureFlags.disable('enableRealTimeUpdates');
 */
