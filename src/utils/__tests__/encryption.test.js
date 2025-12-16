/**
 * Tests for encryption utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage using vi.stubGlobal
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null)
  };
};

const sessionStorageMock = createStorageMock();
const localStorageMock = createStorageMock();
vi.stubGlobal('sessionStorage', sessionStorageMock);
vi.stubGlobal('localStorage', localStorageMock);

const { SecureStorage, migrateAllToEncrypted } = await import('../encryption.js');

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('setItem()', () => {
    it('should store encrypted data', () => {
      const data = { name: 'Alice', score: 100 };
      const result = SecureStorage.setItem('test', data);

      expect(result).toBe(true);

      // Check that data is actually encrypted (not plain JSON)
      const stored = localStorage.getItem('test');
      expect(stored).not.toContain('Alice');
      expect(stored).not.toContain('100');
    });

    it('should handle objects', () => {
      const data = { complex: { nested: { value: 42 } } };
      SecureStorage.setItem('test', data);

      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toEqual(data);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 'four', { five: 5 }];
      SecureStorage.setItem('test', data);

      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toEqual(data);
    });

    it('should handle strings', () => {
      const data = 'Hello, World!';
      SecureStorage.setItem('test', data);

      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toBe(data);
    });

    it('should handle numbers', () => {
      const data = 42;
      SecureStorage.setItem('test', data);

      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toBe(data);
    });
  });

  describe('getItem()', () => {
    it('should return null for non-existent key', () => {
      const result = SecureStorage.getItem('nonexistent');
      expect(result).toBeNull();
    });

    it('should return default value for non-existent key', () => {
      const result = SecureStorage.getItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should decrypt stored data', () => {
      const data = { name: 'Bob', score: 200 };
      SecureStorage.setItem('test', data);

      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toEqual(data);
    });

    it('should return default value for corrupted data', () => {
      localStorage.setItem('test', 'corrupted-base64!!!');
      const result = SecureStorage.getItem('test', 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('removeItem()', () => {
    it('should remove stored item', () => {
      SecureStorage.setItem('test', { data: 'value' });
      expect(SecureStorage.has('test')).toBe(true);

      SecureStorage.removeItem('test');
      expect(SecureStorage.has('test')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear all storage', () => {
      SecureStorage.setItem('test1', 'value1');
      SecureStorage.setItem('test2', 'value2');

      SecureStorage.clear();

      expect(SecureStorage.has('test1')).toBe(false);
      expect(SecureStorage.has('test2')).toBe(false);
    });
  });

  describe('has()', () => {
    it('should return true for existing key', () => {
      SecureStorage.setItem('test', 'value');
      expect(SecureStorage.has('test')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(SecureStorage.has('nonexistent')).toBe(false);
    });
  });

  describe('migrateUnencrypted()', () => {
    it('should migrate unencrypted JSON data', () => {
      const plainData = { name: 'Charlie', score: 300 };
      localStorage.setItem('test', JSON.stringify(plainData));

      const result = SecureStorage.migrateUnencrypted('test');
      expect(result).toBe(true);

      // Verify data is now encrypted
      const stored = localStorage.getItem('test');
      expect(stored).not.toContain('Charlie');

      // Verify data is still accessible
      const retrieved = SecureStorage.getItem('test');
      expect(retrieved).toEqual(plainData);
    });

    it('should return false for already encrypted data', () => {
      SecureStorage.setItem('test', { data: 'value' });
      const result = SecureStorage.migrateUnencrypted('test');
      expect(result).toBe(false);
    });

    it('should return false for non-existent key', () => {
      const result = SecureStorage.migrateUnencrypted('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('encryption consistency', () => {
    it('should encrypt same data differently each time (if key rotates)', () => {
      SecureStorage.setItem('test1', 'same data');
      const encrypted1 = localStorage.getItem('test1');

      sessionStorage.clear(); // Force new key generation

      SecureStorage.setItem('test2', 'same data');
      const encrypted2 = localStorage.getItem('test2');

      // Different encryption (different session keys)
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should maintain data integrity across encrypt/decrypt', () => {
      const testCases = [
        { name: 'simple', value: 'hello' },
        { name: 'number', value: 42 },
        { name: 'array', value: [1, 2, 3] },
        { name: 'object', value: { a: 1, b: { c: 2 } } },
        { name: 'special chars', value: 'Hello! @#$%^&*() 你好' },
        { name: 'unicode', value: '🎮🔍🎯' }
      ];

      testCases.forEach(({ name, value }) => {
        SecureStorage.setItem(name, value);
        const retrieved = SecureStorage.getItem(name);
        expect(retrieved).toEqual(value);
      });
    });
  });
});

describe('migrateAllToEncrypted()', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should migrate all specified keys', () => {
    // Add unencrypted data
    localStorage.setItem('truthHunters_playerProfile', JSON.stringify({ name: 'Alice' }));
    localStorage.setItem('truthHunters_leaderboard', JSON.stringify([{ score: 100 }]));

    const migrated = migrateAllToEncrypted();
    expect(migrated).toBe(2);

    // Verify data is now encrypted but accessible
    const profile = SecureStorage.getItem('truthHunters_playerProfile');
    expect(profile).toEqual({ name: 'Alice' });
  });

  it('should return 0 if no data to migrate', () => {
    const migrated = migrateAllToEncrypted();
    expect(migrated).toBe(0);
  });
});
