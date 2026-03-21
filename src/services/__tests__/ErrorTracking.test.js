import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorTracking, ErrorLevel, ErrorCategory, logError, logWarning, logInfo, logCritical } from '../ErrorTracking';

describe('ErrorTracking', () => {
  let originalEnabled;
  let originalInitialized;

  beforeEach(() => {
    originalEnabled = ErrorTracking.enabled;
    originalInitialized = ErrorTracking.initialized;
    ErrorTracking.enabled = true;
    ErrorTracking.errorQueue = [];
    localStorage.removeItem('truthHunters_errorLog');
  });

  afterEach(() => {
    ErrorTracking.enabled = originalEnabled;
    ErrorTracking.initialized = originalInitialized;
    ErrorTracking.errorQueue = [];
    localStorage.removeItem('truthHunters_errorLog');
  });

  describe('ErrorLevel and ErrorCategory exports', () => {
    it('exports all error levels', () => {
      expect(ErrorLevel.DEBUG).toBe('debug');
      expect(ErrorLevel.INFO).toBe('info');
      expect(ErrorLevel.WARNING).toBe('warning');
      expect(ErrorLevel.ERROR).toBe('error');
      expect(ErrorLevel.CRITICAL).toBe('critical');
    });

    it('exports all error categories', () => {
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.FIREBASE).toBe('firebase');
      expect(ErrorCategory.STORAGE).toBe('storage');
      expect(ErrorCategory.GAME_LOGIC).toBe('game_logic');
      expect(ErrorCategory.UI).toBe('ui');
      expect(ErrorCategory.AUDIO).toBe('audio');
      expect(ErrorCategory.UNKNOWN).toBe('unknown');
    });
  });

  describe('logError', () => {
    it('persists error to localStorage', () => {
      ErrorTracking.logError(new Error('test error'), { category: ErrorCategory.UI });
      const stored = JSON.parse(localStorage.getItem('truthHunters_errorLog'));
      expect(stored).toHaveLength(1);
      expect(stored[0].message).toBe('test error');
      expect(stored[0].level).toBe('error');
      expect(stored[0].category).toBe('ui');
    });

    it('accepts string errors', () => {
      ErrorTracking.logError('string error');
      const stored = JSON.parse(localStorage.getItem('truthHunters_errorLog'));
      expect(stored[0].message).toBe('string error');
    });

    it('does nothing when disabled', () => {
      ErrorTracking.enabled = false;
      ErrorTracking.logError('should not persist');
      const stored = localStorage.getItem('truthHunters_errorLog');
      expect(stored).toBeNull();
    });

    it('adds error to external queue', () => {
      ErrorTracking.logError('queued error');
      expect(ErrorTracking.errorQueue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('logWarning', () => {
    it('does not persist warnings to localStorage', () => {
      ErrorTracking.logWarning('a warning');
      const stored = localStorage.getItem('truthHunters_errorLog');
      expect(stored).toBeNull();
    });
  });

  describe('logInfo', () => {
    it('does not persist info to localStorage', () => {
      ErrorTracking.logInfo('an info message');
      const stored = localStorage.getItem('truthHunters_errorLog');
      expect(stored).toBeNull();
    });
  });

  describe('logCritical', () => {
    it('persists critical errors and flushes queue', () => {
      ErrorTracking.logCritical(new Error('critical'));
      const stored = JSON.parse(localStorage.getItem('truthHunters_errorLog'));
      expect(stored[0].level).toBe('critical');
      // Queue should be flushed (empty after flush)
      expect(ErrorTracking.errorQueue).toHaveLength(0);
    });
  });

  describe('getErrors', () => {
    it('returns empty array when no errors', () => {
      expect(ErrorTracking.getErrors()).toEqual([]);
    });

    it('filters by level', () => {
      ErrorTracking.logError('err1');
      ErrorTracking.logCritical('crit1');
      const criticals = ErrorTracking.getErrors({ level: 'critical' });
      expect(criticals).toHaveLength(1);
      expect(criticals[0].level).toBe('critical');
    });

    it('filters by category', () => {
      ErrorTracking.logError('err1', { category: ErrorCategory.NETWORK });
      ErrorTracking.logError('err2', { category: ErrorCategory.UI });
      const networkErrors = ErrorTracking.getErrors({ category: 'network' });
      expect(networkErrors).toHaveLength(1);
    });

    it('filters by timestamp', () => {
      ErrorTracking.logError('old error');
      const futureTimestamp = Date.now() + 10000;
      const recent = ErrorTracking.getErrors({ since: futureTimestamp });
      expect(recent).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      ErrorTracking.logError('err1', { category: ErrorCategory.UI });
      ErrorTracking.logError('err2', { category: ErrorCategory.NETWORK });
      ErrorTracking.logCritical('crit1');

      const stats = ErrorTracking.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byLevel.error).toBe(2);
      expect(stats.byLevel.critical).toBe(1);
      expect(stats.last24Hours).toBe(3);
    });
  });

  describe('clearErrors', () => {
    it('removes all errors from localStorage', () => {
      ErrorTracking.logError('err1');
      expect(ErrorTracking.clearErrors()).toBe(true);
      expect(ErrorTracking.getErrors()).toEqual([]);
    });
  });

  describe('localStorage limit', () => {
    it('keeps only the most recent 50 errors', () => {
      for (let i = 0; i < 55; i++) {
        ErrorTracking.logError(`error ${i}`);
      }
      const stored = JSON.parse(localStorage.getItem('truthHunters_errorLog'));
      expect(stored.length).toBeLessThanOrEqual(50);
    });
  });

  describe('convenience functions', () => {
    it('logError calls ErrorTracking.logError', () => {
      const spy = vi.spyOn(ErrorTracking, 'logError');
      logError('test');
      expect(spy).toHaveBeenCalledWith('test', undefined);
      spy.mockRestore();
    });

    it('logWarning calls ErrorTracking.logWarning', () => {
      const spy = vi.spyOn(ErrorTracking, 'logWarning');
      logWarning('test');
      expect(spy).toHaveBeenCalledWith('test', undefined);
      spy.mockRestore();
    });

    it('logInfo calls ErrorTracking.logInfo', () => {
      const spy = vi.spyOn(ErrorTracking, 'logInfo');
      logInfo('test');
      expect(spy).toHaveBeenCalledWith('test', undefined);
      spy.mockRestore();
    });

    it('logCritical calls ErrorTracking.logCritical', () => {
      const spy = vi.spyOn(ErrorTracking, 'logCritical');
      logCritical('test');
      expect(spy).toHaveBeenCalledWith('test', undefined);
      spy.mockRestore();
    });
  });

  describe('setUser', () => {
    it('sets user context', () => {
      ErrorTracking.setUser({ playerName: 'TestPlayer' });
      expect(ErrorTracking.userContext.playerName).toBe('TestPlayer');
    });

    it('defaults to Anonymous for missing player name', () => {
      ErrorTracking.setUser({});
      expect(ErrorTracking.userContext.playerName).toBe('Anonymous');
    });
  });

  describe('addBreadcrumb', () => {
    it('does not throw when enabled', () => {
      expect(() => ErrorTracking.addBreadcrumb('user clicked', { button: 'start' })).not.toThrow();
    });

    it('does nothing when disabled', () => {
      ErrorTracking.enabled = false;
      expect(() => ErrorTracking.addBreadcrumb('test')).not.toThrow();
    });
  });

  describe('_formatError', () => {
    it('includes context with url and viewport', () => {
      const formatted = ErrorTracking._formatError('test', ErrorLevel.ERROR, {});
      expect(formatted.id).toMatch(/^err_/);
      expect(formatted.timestamp).toBeTypeOf('number');
      expect(formatted.context.url).toBeDefined();
    });
  });
});
