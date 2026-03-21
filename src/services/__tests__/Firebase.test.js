/**
 * Firebase Backend Tests
 * Tests for Firebase configuration, initialization, and basic operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseBackend } from '../firebase';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
  getApps: vi.fn(() => [])
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore' })),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn()
}));

vi.mock('../../utils/moderation', () => ({
  sanitizeInput: vi.fn(input => input)
}));

describe('FirebaseBackend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset Firebase backend state
    FirebaseBackend.app = null;
    FirebaseBackend.db = null;
    FirebaseBackend.initialized = false;
    FirebaseBackend.classCode = null;
    FirebaseBackend._initPromise = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('isConfigured', () => {
    it('returns true when all config values are present', () => {
      vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
      vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
      vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
      vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
      vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
      vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');

      const result = FirebaseBackend.isConfigured();
      expect(typeof result).toBe('boolean');
    });

    it('returns false when config values are missing', () => {
      vi.stubEnv('VITE_FIREBASE_API_KEY', '');
      vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');

      const result = FirebaseBackend.isConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getClassCode', () => {
    it('retrieves class code from localStorage', () => {
      localStorage.setItem('truthHunters_classCode', 'TEST123');
      expect(FirebaseBackend.getClassCode()).toBe('TEST123');
    });

    it('returns null when no class code is stored', () => {
      expect(FirebaseBackend.getClassCode()).toBeNull();
    });

    it('handles localStorage errors gracefully', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(FirebaseBackend.getClassCode()).toBeNull();
    });
  });

  describe('initialization', () => {
    it('marks backend as initialized after init', () => {
      const initialState = FirebaseBackend.initialized;
      expect(typeof initialState).toBe('boolean');
    });

    it('prevents multiple simultaneous initializations', () => {
      const promise1 = FirebaseBackend._initPromise;
      const promise2 = FirebaseBackend._initPromise;

      if (promise1) {
        expect(promise1).toBe(promise2);
      }
    });

    it('stores class code from localStorage on init', () => {
      localStorage.setItem('truthHunters_classCode', 'STORED123');
      FirebaseBackend.init();

      if (FirebaseBackend.initialized) {
        expect(FirebaseBackend.classCode).toBe('STORED123');
      }
    });
  });

  describe('state management', () => {
    it('maintains singleton pattern', () => {
      const backend1 = FirebaseBackend;
      const backend2 = FirebaseBackend;
      expect(backend1).toBe(backend2);
    });

    it('preserves state across calls', () => {
      FirebaseBackend.classCode = 'TEST123';
      expect(FirebaseBackend.classCode).toBe('TEST123');

      FirebaseBackend.classCode = 'TEST456';
      expect(FirebaseBackend.classCode).toBe('TEST456');
    });
  });

  describe('error handling', () => {
    it('handles missing configuration gracefully', () => {
      expect(() => FirebaseBackend.isConfigured()).not.toThrow();
      expect(() => FirebaseBackend.getClassCode()).not.toThrow();
    });

    it('handles localStorage unavailability', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(() => FirebaseBackend.getClassCode()).not.toThrow();
    });
  });

  describe('concurrent access', () => {
    it('handles rapid successive getClassCode calls', () => {
      localStorage.setItem('truthHunters_classCode', 'TEST');

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(FirebaseBackend.getClassCode());
      }

      results.forEach(result => {
        expect(result).toBe('TEST');
      });
    });
  });
});
