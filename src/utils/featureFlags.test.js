/**
 * Feature Flags Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlags } from './featureFlags';

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('FeatureFlags', () => {
  beforeEach(() => {
    FeatureFlags.reset();
    FeatureFlags.listeners = [];
    FeatureFlags.initialized = false;
    localStorage.clear();
  });

  describe('init', () => {
    it('initializes with default flags', () => {
      FeatureFlags.init();
      expect(FeatureFlags.initialized).toBe(true);
      expect(FeatureFlags.flags.enableFirebase).toBe(true);
      expect(FeatureFlags.flags.enableSound).toBe(true);
    });

    it('does not re-initialize if already initialized', () => {
      FeatureFlags.init();
      FeatureFlags.flags.enableFirebase = false;
      FeatureFlags.init(); // Should not reset
      expect(FeatureFlags.flags.enableFirebase).toBe(false);
    });

    it('loads overrides from localStorage', () => {
      localStorage.setItem('truthHunters_featureFlags', JSON.stringify({
        enableSound: false
      }));
      FeatureFlags.init();
      expect(FeatureFlags.flags.enableSound).toBe(false);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('truthHunters_featureFlags', 'not-valid-json');
      expect(() => FeatureFlags.init()).not.toThrow();
    });
  });

  describe('isEnabled', () => {
    it('returns true for enabled features', () => {
      FeatureFlags.init();
      expect(FeatureFlags.isEnabled('enableFirebase')).toBe(true);
    });

    it('returns false for disabled features', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound');
      expect(FeatureFlags.isEnabled('enableSound')).toBe(false);
    });

    it('returns false for unknown features', () => {
      FeatureFlags.init();
      expect(FeatureFlags.isEnabled('nonExistentFeature')).toBe(false);
    });

    it('auto-initializes if not already initialized', () => {
      expect(FeatureFlags.isEnabled('enableFirebase')).toBe(true);
      expect(FeatureFlags.initialized).toBe(true);
    });
  });

  describe('enable/disable/toggle', () => {
    it('enables a feature', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound');
      expect(FeatureFlags.flags.enableSound).toBe(false);
      FeatureFlags.enable('enableSound');
      expect(FeatureFlags.flags.enableSound).toBe(true);
    });

    it('disables a feature', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableFirebase');
      expect(FeatureFlags.flags.enableFirebase).toBe(false);
    });

    it('toggles a feature', () => {
      FeatureFlags.init();
      // enableSound starts as true
      const result = FeatureFlags.toggle('enableSound');
      expect(result).toBe(false);
      expect(FeatureFlags.flags.enableSound).toBe(false);
      const result2 = FeatureFlags.toggle('enableSound');
      expect(result2).toBe(true);
    });

    it('persists to localStorage when persist=true', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound', true);
      const stored = JSON.parse(localStorage.getItem('truthHunters_featureFlags'));
      expect(stored.enableSound).toBe(false);
    });

    it('does not persist by default', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound');
      expect(localStorage.getItem('truthHunters_featureFlags')).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('notifies listeners on flag change', () => {
      FeatureFlags.init();
      const listener = vi.fn();
      FeatureFlags.subscribe(listener);
      FeatureFlags.disable('enableSound');
      expect(listener).toHaveBeenCalledWith('enableSound', false);
    });

    it('returns unsubscribe function', () => {
      FeatureFlags.init();
      const listener = vi.fn();
      const unsubscribe = FeatureFlags.subscribe(listener);
      unsubscribe();
      FeatureFlags.disable('enableSound');
      expect(listener).not.toHaveBeenCalled();
    });

    it('handles listener errors gracefully', () => {
      FeatureFlags.init();
      const badListener = vi.fn(() => { throw new Error('listener error'); });
      FeatureFlags.subscribe(badListener);
      expect(() => FeatureFlags.disable('enableSound')).not.toThrow();
    });
  });

  describe('setMultiple', () => {
    it('sets multiple flags at once', () => {
      FeatureFlags.init();
      FeatureFlags.setMultiple({
        enableSound: false,
        enableHints: false
      });
      expect(FeatureFlags.flags.enableSound).toBe(false);
      expect(FeatureFlags.flags.enableHints).toBe(false);
    });
  });

  describe('getAll and getStats', () => {
    it('returns copy of all flags', () => {
      FeatureFlags.init();
      const all = FeatureFlags.getAll();
      all.enableFirebase = false; // Mutate copy
      expect(FeatureFlags.flags.enableFirebase).toBe(true); // Original unchanged
    });

    it('returns correct statistics', () => {
      FeatureFlags.init();
      const stats = FeatureFlags.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled + stats.disabled).toBe(stats.total);
      expect(stats.percentage).toBeGreaterThan(0);
      expect(stats.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('reset', () => {
    it('restores default flags', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound');
      expect(FeatureFlags.flags.enableSound).toBe(false);
      FeatureFlags.reset();
      expect(FeatureFlags.flags.enableSound).toBe(true);
    });

    it('clears localStorage', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableSound', true);
      FeatureFlags.reset();
      expect(localStorage.getItem('truthHunters_featureFlags')).toBeNull();
    });
  });
});
