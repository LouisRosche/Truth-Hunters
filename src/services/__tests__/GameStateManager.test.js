/**
 * Tests for GameStateManager service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

// Import after mocking
const { GameStateManager } = await import('../GameStateManager.js');

describe('GameStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('save()', () => {
    it('should save game state', () => {
      const gameState = {
        phase: 'playing',
        currentRound: 3,
        totalRounds: 5,
        teamName: 'Team Alpha',
        score: 15,
        claimsUsed: ['claim1', 'claim2'],
        roundHistory: [
          { correct: true, points: 5 },
          { correct: false, points: -3 }
        ]
      };

      const result = GameStateManager.save(gameState);
      expect(result).toBe(true);

      const loaded = GameStateManager.load();
      expect(loaded.phase).toBe('playing');
      expect(loaded.currentRound).toBe(3);
      expect(loaded.score).toBe(15);
    });

    it('should add timestamp to saved state', () => {
      const gameState = { phase: 'playing', score: 10 };
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.savedAt).toBeDefined();
      expect(typeof loaded.savedAt).toBe('number');
    });

    it('should add version to saved state', () => {
      const gameState = { phase: 'playing', score: 10 };
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.version).toBe(1);
    });
  });

  describe('load()', () => {
    it('should return null if no saved state', () => {
      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should load saved state', () => {
      const gameState = { phase: 'playing', score: 15 };
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.score).toBe(15);
      expect(loaded.phase).toBe('playing');
    });

    it('should return null if state is too old', () => {
      const oldState = {
        phase: 'playing',
        score: 10,
        savedAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorage.setItem('truthHunters_gameState', JSON.stringify(oldState));

      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted data', () => {
      localStorage.setItem('truthHunters_gameState', 'corrupted{json');
      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });
  });

  describe('hasSavedGame()', () => {
    it('should return false if no saved game', () => {
      expect(GameStateManager.hasSavedGame()).toBe(false);
    });

    it('should return true if valid saved game exists', () => {
      GameStateManager.save({ phase: 'playing', score: 10 });
      expect(GameStateManager.hasSavedGame()).toBe(true);
    });

    it('should return false if saved game is too old', () => {
      const oldState = {
        phase: 'playing',
        score: 10,
        savedAt: Date.now() - (25 * 60 * 60 * 1000)
      };

      localStorage.setItem('truthHunters_gameState', JSON.stringify(oldState));
      expect(GameStateManager.hasSavedGame()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear saved state', () => {
      GameStateManager.save({ phase: 'playing', score: 10 });
      expect(GameStateManager.hasSavedGame()).toBe(true);

      GameStateManager.clear();
      expect(GameStateManager.hasSavedGame()).toBe(false);
    });

    it('should not throw if no saved state exists', () => {
      expect(() => GameStateManager.clear()).not.toThrow();
    });
  });

  describe('getSummary()', () => {
    it('should return summary of saved game', () => {
      const gameState = {
        phase: 'playing',
        currentRound: 3,
        totalRounds: 5,
        teamName: 'Team Alpha',
        score: 15
      };

      GameStateManager.save(gameState);

      const summary = GameStateManager.getSummary();
      expect(summary.teamName).toBe('Team Alpha');
      expect(summary.currentRound).toBe(3);
      expect(summary.totalRounds).toBe(5);
      expect(summary.score).toBe(15);
    });

    it('should return null if no saved game', () => {
      const summary = GameStateManager.getSummary();
      expect(summary).toBeNull();
    });
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(GameStateManager.isAvailable()).toBe(true);
    });
  });
});
