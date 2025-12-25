/**
 * PERFORMANCE MONITORING UTILITIES
 * Lightweight performance tracking for Chromebook optimization
 */

import { logger } from './logger';

/**
 * Performance metrics tracker
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF_MONITORING === 'true';
  }

  /**
   * Start measuring a performance metric
   * @param {string} label - Metric label
   */
  start(label) {
    if (!this.enabled) return;
    this.metrics.set(label, performance.now());
  }

  /**
   * End measuring and log the result
   * @param {string} label - Metric label
   * @param {boolean} logToConsole - Whether to log to console
   * @returns {number} Duration in milliseconds
   */
  end(label, logToConsole = true) {
    if (!this.enabled) return 0;

    const startTime = this.metrics.get(label);
    if (!startTime) {
      logger.warn(`Performance metric "${label}" was never started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(label);

    if (logToConsole) {
      logger.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure a function's execution time
   * @param {string} label - Metric label
   * @param {Function} fn - Function to measure
   * @returns {any} Function result
   */
  async measure(label, fn) {
    if (!this.enabled) return fn();

    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  /**
   * Get Web Vitals metrics if available
   * @returns {Object} Web Vitals metrics
   */
  getWebVitals() {
    if (!this.enabled || typeof window === 'undefined') return null;

    const vitals = {};

    // First Contentful Paint (FCP)
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }
    } catch (e) {
      // Ignore
    }

    // Largest Contentful Paint (LCP) - requires PerformanceObserver
    // Time to Interactive and other metrics would need dedicated observers

    // Navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      vitals.loadTime = timing.loadEventEnd - timing.navigationStart;
      vitals.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      vitals.firstByte = timing.responseStart - timing.navigationStart;
    }

    // Memory usage (Chrome only)
    if (performance.memory) {
      vitals.memoryUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB';
      vitals.memoryLimit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB';
    }

    return vitals;
  }

  /**
   * Log current performance metrics
   */
  logMetrics() {
    if (!this.enabled) return;

    const vitals = this.getWebVitals();
    if (vitals) {
      logger.log('📊 Performance Metrics:', vitals);
    }
  }

  /**
   * Check if device is likely a Chromebook (low-powered)
   * @returns {boolean}
   */
  isLowPowerDevice() {
    // Check for device memory API (Chrome only)
    if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
      return true;
    }

    // Check for hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      return true;
    }

    // Check connection type
    if (navigator.connection) {
      const connection = navigator.connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true;
      }
      if (connection.saveData) {
        return true; // User has enabled data saver
      }
    }

    return false;
  }

  /**
   * Get performance recommendations for current device
   * @returns {Object} Recommendations
   */
  getRecommendations() {
    const isLowPower = this.isLowPowerDevice();
    const vitals = this.getWebVitals();

    return {
      isLowPowerDevice: isLowPower,
      recommendations: isLowPower ? [
        'Consider reducing animation complexity',
        'Limit concurrent Firebase listeners',
        'Use smaller image assets',
        'Reduce polling frequency'
      ] : [],
      vitals
    };
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 * @param {string} componentName - Name of component
 */
export function useRenderMetrics(componentName) {
  if (!perfMonitor.enabled) return;

  const renderStart = performance.now();

  // Log on unmount
  return () => {
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16.67) { // More than one frame (60fps)
      logger.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  };
}

/**
 * Measure bundle size and log warnings
 */
export function checkBundleSize() {
  if (typeof window === 'undefined' || !perfMonitor.enabled) return;

  // Use Resource Timing API to get script sizes
  const resources = performance.getEntriesByType('resource');
  const scripts = resources.filter(r => r.initiatorType === 'script');

  let totalSize = 0;
  const largeScripts = [];

  scripts.forEach(script => {
    const size = script.transferSize || script.encodedBodySize || 0;
    totalSize += size;

    if (size > 500000) { // > 500KB
      largeScripts.push({
        name: script.name.split('/').pop(),
        size: (size / 1024).toFixed(2) + ' KB'
      });
    }
  });

  if (largeScripts.length > 0) {
    logger.warn('⚠️ Large bundles detected:', largeScripts);
  }

  logger.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
}

/**
 * Debounce function for performance
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function for performance
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Auto-check performance on load (dev only)
if (perfMonitor.enabled && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      perfMonitor.logMetrics();
      checkBundleSize();

      const recommendations = perfMonitor.getRecommendations();
      if (recommendations.isLowPowerDevice) {
        logger.warn('⚠️ Low-power device detected. Consider performance optimizations.');
        logger.log('💡 Recommendations:', recommendations.recommendations);
      }
    }, 1000);
  });
}
