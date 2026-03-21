/**
 * Feature Flags Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlags, isFeatureEnabled, enableFeature, disableFeature, toggleFeature } from './featureFlags';

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
      expect(FeatureFlags.flags.enableMultiplayer).toBe(false);
    });

    it('does not re-initialize if already initialized', () => {
      FeatureFlags.init();
      FeatureFlags.flags.enableFirebase = false;
      FeatureFlags.init(); // Should not reset
      expect(FeatureFlags.flags.enableFirebase).toBe(false);
    });

    it('loads overrides from localStorage', () => {
      localStorage.setItem('truthHunters_featureFlags', JSON.stringify({
        enableMultiplayer: true
      }));
      FeatureFlags.init();
      expect(FeatureFlags.flags.enableMultiplayer).toBe(true);
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
      expect(FeatureFlags.isEnabled('enableMultiplayer')).toBe(false);
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
      FeatureFlags.enable('enableMultiplayer');
      expect(FeatureFlags.flags.enableMultiplayer).toBe(true);
    });

    it('disables a feature', () => {
      FeatureFlags.init();
      FeatureFlags.disable('enableFirebase');
      expect(FeatureFlags.flags.enableFirebase).toBe(false);
    });

    it('toggles a feature', () => {
      FeatureFlags.init();
      const result = FeatureFlags.toggle('enableMultiplayer');
      expect(result).toBe(true);
      expect(FeatureFlags.flags.enableMultiplayer).toBe(true);
      const result2 = FeatureFlags.toggle('enableMultiplayer');
      expect(result2).toBe(false);
    });

    it('persists to localStorage when persist=true', () => {
      FeatureFlags.init();
      FeatureFlags.enable('enableMultiplayer', true);
      const stored = JSON.parse(localStorage.getItem('truthHunters_featureFlags'));
      expect(stored.enableMultiplayer).toBe(true);
    });

    it('does not persist by default', () => {
      FeatureFlags.init();
      FeatureFlags.enable('enableMultiplayer');
      expect(localStorage.getItem('truthHunters_featureFlags')).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('notifies listeners on flag change', () => {
      FeatureFlags.init();
      const listener = vi.fn();
      FeatureFlags.subscribe(listener);
      FeatureFlags.enable('enableMultiplayer');
      expect(listener).toHaveBeenCalledWith('enableMultiplayer', true);
    });

    it('returns unsubscribe function', () => {
      FeatureFlags.init();
      const listener = vi.fn();
      const unsubscribe = FeatureFlags.subscribe(listener);
      unsubscribe();
      FeatureFlags.enable('enableMultiplayer');
      expect(listener).not.toHaveBeenCalled();
    });

    it('handles listener errors gracefully', () => {
      FeatureFlags.init();
      const badListener = vi.fn(() => { throw new Error('listener error'); });
      FeatureFlags.subscribe(badListener);
      expect(() => FeatureFlags.enable('enableMultiplayer')).not.toThrow();
    });
  });

  describe('setMultiple', () => {
    it('sets multiple flags at once', () => {
      FeatureFlags.init();
      FeatureFlags.setMultiple({
        enableMultiplayer: true,
        enableAIHints: true
      });
      expect(FeatureFlags.flags.enableMultiplayer).toBe(true);
      expect(FeatureFlags.flags.enableAIHints).toBe(true);
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
      FeatureFlags.enable('enableMultiplayer');
      FeatureFlags.reset();
      expect(FeatureFlags.flags.enableMultiplayer).toBe(false);
    });

    it('clears localStorage', () => {
      FeatureFlags.init();
      FeatureFlags.enable('enableMultiplayer', true);
      FeatureFlags.reset();
      expect(localStorage.getItem('truthHunters_featureFlags')).toBeNull();
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    FeatureFlags.reset();
    FeatureFlags.initialized = false;
    localStorage.clear();
  });

  it('isFeatureEnabled works', () => {
    expect(isFeatureEnabled('enableFirebase')).toBe(true);
    expect(isFeatureEnabled('enableMultiplayer')).toBe(false);
  });

  it('enableFeature works', () => {
    enableFeature('enableMultiplayer');
    expect(FeatureFlags.flags.enableMultiplayer).toBe(true);
  });

  it('disableFeature works', () => {
    disableFeature('enableFirebase');
    expect(FeatureFlags.flags.enableFirebase).toBe(false);
  });

  it('toggleFeature works', () => {
    const result = toggleFeature('enableMultiplayer');
    expect(result).toBe(true);
  });
});
