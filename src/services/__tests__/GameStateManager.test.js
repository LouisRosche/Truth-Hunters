/**
 * Tests for GameStateManager service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage using vi.stubGlobal
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

const localStorageMock = createStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

// Import after mocking
const { GameStateManager } = await import('../gameState.js');

describe('GameStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Create a valid game state that passes validation
  const createValidGameState = (overrides = {}) => ({
    phase: 'playing',
    currentRound: 3,
    totalRounds: 5,
    claims: [{ id: 'claim1' }, { id: 'claim2' }],
    team: {
      name: 'Team Alpha',
      score: 15,
      players: [{ firstName: 'Alice', lastInitial: 'A' }]
    },
    ...overrides
  });

  describe('save()', () => {
    it('should save game state when phase is playing', () => {
      const gameState = createValidGameState();
      const result = GameStateManager.save(gameState);
      expect(result).toBe(true);

      const loaded = GameStateManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded.gameState.phase).toBe('playing');
      expect(loaded.gameState.currentRound).toBe(3);
    });

    it('should not save game state when phase is not playing', () => {
      const gameState = createValidGameState({ phase: 'setup' });
      const result = GameStateManager.save(gameState);
      expect(result).toBe(false);

      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should add timestamp to saved state', () => {
      const gameState = createValidGameState();
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.savedAt).toBeDefined();
      expect(typeof loaded.savedAt).toBe('number');
    });

    it('should add version to saved state', () => {
      const gameState = createValidGameState();
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.version).toBe(1);
    });

    it('should save currentStreak alongside gameState', () => {
      const gameState = createValidGameState();
      GameStateManager.save(gameState, 5);

      const loaded = GameStateManager.load();
      expect(loaded.currentStreak).toBe(5);
    });
  });

  describe('load()', () => {
    it('should return null if no saved state', () => {
      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should load saved state', () => {
      const gameState = createValidGameState();
      GameStateManager.save(gameState);

      const loaded = GameStateManager.load();
      expect(loaded.gameState.team.score).toBe(15);
      expect(loaded.gameState.phase).toBe('playing');
    });

    it('should return null if state is too old (24+ hours)', () => {
      const oldState = {
        version: 1,
        gameState: createValidGameState(),
        currentStreak: 0,
        savedAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorage.setItem('truthHunters_savedGame', JSON.stringify(oldState));

      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted data', () => {
      localStorage.setItem('truthHunters_savedGame', 'corrupted{json');
      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });

    it('should return null for wrong version', () => {
      const state = {
        version: 999,
        gameState: createValidGameState(),
        currentStreak: 0,
        savedAt: Date.now()
      };

      localStorage.setItem('truthHunters_savedGame', JSON.stringify(state));
      const loaded = GameStateManager.load();
      expect(loaded).toBeNull();
    });
  });

  describe('hasSavedGame()', () => {
    it('should return false if no saved game', () => {
      expect(GameStateManager.hasSavedGame()).toBe(false);
    });

    it('should return true if valid saved game exists', () => {
      GameStateManager.save(createValidGameState());
      expect(GameStateManager.hasSavedGame()).toBe(true);
    });

    it('should return false if saved game is too old', () => {
      const oldState = {
        version: 1,
        gameState: createValidGameState(),
        currentStreak: 0,
        savedAt: Date.now() - (25 * 60 * 60 * 1000)
      };

      localStorage.setItem('truthHunters_savedGame', JSON.stringify(oldState));
      expect(GameStateManager.hasSavedGame()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear saved state', () => {
      GameStateManager.save(createValidGameState());
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
      const gameState = createValidGameState();
      GameStateManager.save(gameState);

      const summary = GameStateManager.getSummary();
      expect(summary.teamName).toBe('Team Alpha');
      expect(summary.currentRound).toBe(3);
      expect(summary.totalRounds).toBe(5);
      expect(summary.score).toBe(15);
      expect(summary.playerCount).toBe(1);
    });

    it('should return null if no saved game', () => {
      const summary = GameStateManager.getSummary();
      expect(summary).toBeNull();
    });

    it('should return time ago text', () => {
      const gameState = createValidGameState();
      GameStateManager.save(gameState);

      const summary = GameStateManager.getSummary();
      expect(summary.timeAgoText).toBeDefined();
    });
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(GameStateManager.isAvailable()).toBe(true);
    });
  });
});
