import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firebaseCache, withCache } from '../firebaseCache';

describe('firebaseCache', () => {
  beforeEach(() => {
    firebaseCache.invalidate(); // Clear all cache
  });

  describe('get/set', () => {
    it('returns null for missing entries', () => {
      expect(firebaseCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves cached values', () => {
      firebaseCache.set('getTopTeams', [], { teams: ['a', 'b'] }, 60000);
      expect(firebaseCache.get('getTopTeams')).toEqual({ teams: ['a', 'b'] });
    });

    it('returns null for expired entries', () => {
      // Manually inject a cache entry with a past timestamp
      const key = firebaseCache._generateKey('expired', []);
      firebaseCache.cache.set(key, {
        data: 'old data',
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 1 // 1ms TTL
      });
      expect(firebaseCache.get('expired')).toBeNull();
    });

    it('handles args in cache key generation', () => {
      firebaseCache.set('fn', ['arg1', 'arg2'], 'result1', 60000);
      expect(firebaseCache.get('fn', 'arg1', 'arg2')).toBe('result1');
      expect(firebaseCache.get('fn', 'arg1', 'arg3')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('invalidates a specific function', () => {
      firebaseCache.set('getTopTeams', [], 'data1', 60000);
      firebaseCache.set('getSettings', [], 'data2', 60000);
      firebaseCache.invalidate('getTopTeams');
      expect(firebaseCache.get('getTopTeams')).toBeNull();
      expect(firebaseCache.get('getSettings')).toBe('data2');
    });

    it('invalidates all cache when called without args', () => {
      firebaseCache.set('fn1', [], 'data1', 60000);
      firebaseCache.set('fn2', [], 'data2', 60000);
      firebaseCache.invalidate();
      expect(firebaseCache.get('fn1')).toBeNull();
      expect(firebaseCache.get('fn2')).toBeNull();
    });
  });

  describe('invalidateOnWrite', () => {
    it('clears read caches', () => {
      firebaseCache.set('getTopTeams', [], 'data', 60000);
      firebaseCache.set('getClassSettings', [], 'settings', 60000);
      firebaseCache.invalidateOnWrite();
      expect(firebaseCache.get('getTopTeams')).toBeNull();
      expect(firebaseCache.get('getClassSettings')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('returns correct stats', () => {
      firebaseCache.set('fn1', [], 'data', 60000);
      firebaseCache.set('fn2', [], 'data', 60000);
      const stats = firebaseCache.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('removes expired entries', () => {
      firebaseCache.set('fresh', [], 'data', 60000);
      // Manually inject an expired entry
      const staleKey = firebaseCache._generateKey('stale', []);
      firebaseCache.cache.set(staleKey, {
        data: 'data',
        timestamp: Date.now() - 10000,
        ttl: 1
      });
      firebaseCache.cleanup();
      expect(firebaseCache.get('fresh')).toBe('data');
      expect(firebaseCache.getStats().totalEntries).toBe(1);
    });
  });

  describe('_generateKey', () => {
    it('creates unique keys for different args', () => {
      const key1 = firebaseCache._generateKey('fn', ['a']);
      const key2 = firebaseCache._generateKey('fn', ['b']);
      expect(key1).not.toBe(key2);
    });

    it('creates same key for same args', () => {
      const key1 = firebaseCache._generateKey('fn', ['a', 1]);
      const key2 = firebaseCache._generateKey('fn', ['a', 1]);
      expect(key1).toBe(key2);
    });
  });
});

describe('withCache', () => {
  beforeEach(() => {
    firebaseCache.invalidate();
  });

  it('caches function results', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = withCache(fn, 'testFn', 60000);

    const r1 = await cached('arg1');
    const r2 = await cached('arg1');

    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1); // Only called once, second was from cache
  });

  it('calls function again for different args', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = withCache(fn, 'testFn', 60000);

    await cached('arg1');
    await cached('arg2');

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
