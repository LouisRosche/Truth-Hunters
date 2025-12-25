/**
 * SafeStorage Tests
 * Tests for safe localStorage wrapper with error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeClear,
  isStorageAvailable
} from '../safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('safeGetItem', () => {
    it('retrieves and parses valid JSON data', () => {
      localStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      const result = safeGetItem('test');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('retrieves string data correctly', () => {
      localStorage.setItem('test', JSON.stringify('hello'));
      const result = safeGetItem('test');
      expect(result).toBe('hello');
    });

    it('retrieves number data correctly', () => {
      localStorage.setItem('test', JSON.stringify(42));
      const result = safeGetItem('test');
      expect(result).toBe(42);
    });

    it('retrieves boolean data correctly', () => {
      localStorage.setItem('test', JSON.stringify(true));
      const result = safeGetItem('test');
      expect(result).toBe(true);
    });

    it('retrieves array data correctly', () => {
      localStorage.setItem('test', JSON.stringify([1, 2, 3]));
      const result = safeGetItem('test');
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns default value for non-existent key', () => {
      const result = safeGetItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('returns null as default when no default value provided', () => {
      const result = safeGetItem('nonexistent');
      expect(result).toBeNull();
    });

    it('returns default value for corrupted JSON', () => {
      localStorage.setItem('test', 'corrupted{json');
      const result = safeGetItem('test', 'fallback');
      expect(result).toBe('fallback');
    });

    it('handles localStorage.getItem throwing error', () => {
      const getSpy = vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      const result = safeGetItem('test', 'fallback');
      expect(result).toBe('fallback');
      getSpy.mockRestore();
    });

    it('handles JSON.parse throwing error', () => {
      localStorage.setItem('test', '{invalid json}');
      const result = safeGetItem('test', 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('safeSetItem', () => {
    it('stores string data correctly', () => {
      const success = safeSetItem('test', 'hello');
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe(JSON.stringify('hello'));
    });

    it('stores number data correctly', () => {
      const success = safeSetItem('test', 123);
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe(JSON.stringify(123));
    });

    it('stores boolean data correctly', () => {
      const success = safeSetItem('test', false);
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe(JSON.stringify(false));
    });

    it('stores object data correctly', () => {
      const data = { name: 'Test', score: 100 };
      const success = safeSetItem('test', data);
      expect(success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test'))).toEqual(data);
    });

    it('stores array data correctly', () => {
      const data = [1, 2, 3];
      const success = safeSetItem('test', data);
      expect(success).toBe(true);
      expect(JSON.parse(localStorage.getItem('test'))).toEqual(data);
    });

    it('stores null correctly', () => {
      const success = safeSetItem('test', null);
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe('null');
    });

    it('stores undefined as null', () => {
      const success = safeSetItem('test', undefined);
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBe('null');
    });

    it('handles QuotaExceededError gracefully', () => {
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const success = safeSetItem('test', 'data');
      expect(success).toBe(false);
      setSpy.mockRestore();
    });

    it('handles SecurityError gracefully (private browsing)', () => {
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      });

      const success = safeSetItem('test', 'data');
      expect(success).toBe(false);
      setSpy.mockRestore();
    });

    it('handles generic storage errors', () => {
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Generic storage error');
      });

      const success = safeSetItem('test', 'data');
      expect(success).toBe(false);
      setSpy.mockRestore();
    });

    it('handles JSON.stringify errors (circular references)', () => {
      const circular = { a: 1 };
      circular.self = circular; // Create circular reference

      const success = safeSetItem('test', circular);
      expect(success).toBe(false);
    });
  });

  describe('safeRemoveItem', () => {
    it('removes existing item successfully', () => {
      localStorage.setItem('test', 'value');
      const success = safeRemoveItem('test');
      expect(success).toBe(true);
      expect(localStorage.getItem('test')).toBeNull();
    });

    it('handles removal of non-existent item', () => {
      const success = safeRemoveItem('nonexistent');
      expect(success).toBe(true); // removeItem doesn't error for missing keys
    });

    it('handles localStorage.removeItem throwing error', () => {
      const removeSpy = vi.spyOn(localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const success = safeRemoveItem('test');
      expect(success).toBe(false);
      removeSpy.mockRestore();
    });

    it('removes multiple items independently', () => {
      localStorage.setItem('test1', 'value1');
      localStorage.setItem('test2', 'value2');
      localStorage.setItem('test3', 'value3');

      expect(safeRemoveItem('test1')).toBe(true);
      expect(localStorage.getItem('test1')).toBeNull();
      expect(localStorage.getItem('test2')).toBe('value2');
      expect(localStorage.getItem('test3')).toBe('value3');
    });
  });

  describe('safeClear', () => {
    it('clears all localStorage items', () => {
      localStorage.setItem('test1', 'value1');
      localStorage.setItem('test2', 'value2');
      localStorage.setItem('test3', 'value3');

      const success = safeClear();
      expect(success).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    it('handles clearing already empty storage', () => {
      const success = safeClear();
      expect(success).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    it('handles localStorage.clear throwing error', () => {
      const clearSpy = vi.spyOn(localStorage, 'clear').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const success = safeClear();
      expect(success).toBe(false);

      // Restore the mock
      clearSpy.mockRestore();
    });
  });

  describe('isStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage.setItem throws', () => {
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });

      expect(isStorageAvailable()).toBe(false);
      setSpy.mockRestore();
    });

    it('returns false when localStorage.removeItem throws', () => {
      const removeSpy = vi.spyOn(localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });

      expect(isStorageAvailable()).toBe(false);
      removeSpy.mockRestore();
    });

    it('cleans up test key after checking', () => {
      isStorageAvailable();
      expect(localStorage.getItem('__storage_test__')).toBeNull();
    });

    it('handles private browsing mode (SecurityError)', () => {
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      });

      expect(isStorageAvailable()).toBe(false);
      setSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('handles full write-read-remove cycle', () => {
      const data = { score: 100, name: 'Test Player' };

      // Write
      expect(safeSetItem('player', data)).toBe(true);

      // Read
      expect(safeGetItem('player')).toEqual(data);

      // Remove
      expect(safeRemoveItem('player')).toBe(true);
      expect(safeGetItem('player')).toBeNull();
    });

    it('handles multiple items independently', () => {
      safeSetItem('item1', 'value1');
      safeSetItem('item2', { foo: 'bar' });
      safeSetItem('item3', [1, 2, 3]);

      expect(safeGetItem('item1')).toBe('value1');
      expect(safeGetItem('item2')).toEqual({ foo: 'bar' });
      expect(safeGetItem('item3')).toEqual([1, 2, 3]);
    });

    it('survives partial failures', () => {
      safeSetItem('item1', 'value1');

      // Mock failure for next operation
      const setSpy = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(safeSetItem('item2', 'value2')).toBe(false);

      // Restore and continue
      setSpy.mockRestore();
      expect(safeSetItem('item3', 'value3')).toBe(true);

      expect(safeGetItem('item1')).toBe('value1');
      expect(safeGetItem('item2')).toBeNull();
      expect(safeGetItem('item3')).toBe('value3');
    });
  });

  describe('edge cases', () => {
    it('handles very long strings', () => {
      const longString = 'a'.repeat(10000);
      const success = safeSetItem('test', longString);
      expect(success).toBe(true);
      expect(safeGetItem('test')).toBe(longString);
    });

    it('handles deeply nested objects', () => {
      const nested = { a: { b: { c: { d: { e: 'deep' } } } } };
      const success = safeSetItem('test', nested);
      expect(success).toBe(true);
      expect(safeGetItem('test')).toEqual(nested);
    });

    it('handles special characters in keys', () => {
      const key = 'test-key_with.special@chars';
      const success = safeSetItem(key, 'value');
      expect(success).toBe(true);
      expect(safeGetItem(key)).toBe('value');
    });

    it('handles empty string as key', () => {
      const success = safeSetItem('', 'value');
      expect(success).toBe(true);
      expect(safeGetItem('')).toBe('value');
    });

    it('handles empty string as value', () => {
      const success = safeSetItem('test', '');
      expect(success).toBe(true);
      expect(safeGetItem('test')).toBe('');
    });

    it('handles empty object', () => {
      const success = safeSetItem('test', {});
      expect(success).toBe(true);
      expect(safeGetItem('test')).toEqual({});
    });

    it('handles empty array', () => {
      const success = safeSetItem('test', []);
      expect(success).toBe(true);
      expect(safeGetItem('test')).toEqual([]);
    });
  });
});
