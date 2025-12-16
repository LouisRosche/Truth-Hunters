/**
 * Tests for PlayerProfile service
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
const { PlayerProfile } = await import('../playerProfile.js');

describe('PlayerProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(PlayerProfile.isAvailable()).toBe(true);
    });
  });

  describe('exists()', () => {
    it('should return false when no profile exists', () => {
      expect(PlayerProfile.exists()).toBe(false);
    });

    it('should return true when profile exists', () => {
      const profile = PlayerProfile.get();
      PlayerProfile.save(profile);
      expect(PlayerProfile.exists()).toBe(true);
    });
  });

  describe('get()', () => {
    it('should return default profile when none exists', () => {
      const profile = PlayerProfile.get();

      expect(profile).toHaveProperty('version');
      expect(profile).toHaveProperty('createdAt');
      expect(profile).toHaveProperty('playerName');
      expect(profile).toHaveProperty('stats');
      expect(profile).toHaveProperty('subjectStats');
      expect(profile.stats.totalGames).toBe(0);
    });

    it('should return saved profile', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'Alice';
      profile.stats.totalGames = 5;
      PlayerProfile.save(profile);

      const loaded = PlayerProfile.get();
      expect(loaded.playerName).toBe('Alice');
      expect(loaded.stats.totalGames).toBe(5);
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('truthHunters_playerProfile', 'corrupted{json');

      const profile = PlayerProfile.get();
      expect(profile).toHaveProperty('version');
      expect(profile.stats.totalGames).toBe(0);
    });
  });

  describe('save()', () => {
    it('should save profile to localStorage', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'Bob';

      const result = PlayerProfile.save(profile);
      expect(result).toBe(true);

      const stored = localStorage.getItem('truthHunters_playerProfile');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored).playerName).toBe('Bob');
    });

    it('should add version to profile', () => {
      const profile = PlayerProfile.get();
      delete profile.version;

      PlayerProfile.save(profile);

      const loaded = PlayerProfile.get();
      expect(loaded.version).toBeDefined();
    });
  });

  describe('updateIdentity()', () => {
    it('should update player name and avatar', () => {
      const result = PlayerProfile.updateIdentity('Charlie', { emoji: '🎯' });
      expect(result).toBe(true);

      const profile = PlayerProfile.get();
      expect(profile.playerName).toBe('Charlie');
      expect(profile.avatar).toEqual({ emoji: '🎯' });
    });
  });

  describe('recordGame()', () => {
    const createGameData = (overrides = {}) => ({
      rounds: [
        { correct: true, confidence: 2, points: 3 },
        { correct: false, confidence: 3, points: -6 },
        { correct: true, confidence: 1, points: 1 }
      ],
      claims: [
        { id: 'claim1', subject: 'Biology' },
        { id: 'claim2', subject: 'History' },
        { id: 'claim3', subject: 'Biology' }
      ],
      finalScore: 15,
      maxStreak: 2,
      difficulty: 'medium',
      predictedScore: 12,
      ...overrides
    });

    it('should update totalGames counter', () => {
      PlayerProfile.recordGame(createGameData());

      const profile = PlayerProfile.get();
      expect(profile.stats.totalGames).toBe(1);
    });

    it('should update totalRounds counter', () => {
      PlayerProfile.recordGame(createGameData());

      const profile = PlayerProfile.get();
      expect(profile.stats.totalRounds).toBe(3);
    });

    it('should track best score', () => {
      PlayerProfile.recordGame(createGameData({ finalScore: 10 }));
      PlayerProfile.recordGame(createGameData({ finalScore: 20 }));
      PlayerProfile.recordGame(createGameData({ finalScore: 15 }));

      const profile = PlayerProfile.get();
      expect(profile.stats.bestScore).toBe(20);
    });

    it('should track best streak', () => {
      PlayerProfile.recordGame(createGameData({ maxStreak: 2 }));
      PlayerProfile.recordGame(createGameData({ maxStreak: 5 }));
      PlayerProfile.recordGame(createGameData({ maxStreak: 3 }));

      const profile = PlayerProfile.get();
      expect(profile.stats.bestStreak).toBe(5);
    });

    it('should track correct and incorrect counts', () => {
      PlayerProfile.recordGame(createGameData());

      const profile = PlayerProfile.get();
      expect(profile.stats.totalCorrect).toBe(2);
      expect(profile.stats.totalIncorrect).toBe(1);
    });

    it('should track claims seen', () => {
      PlayerProfile.recordGame(createGameData());

      const profile = PlayerProfile.get();
      expect(profile.claimsSeen).toContain('claim1');
      expect(profile.claimsSeen).toContain('claim2');
      expect(profile.claimsSeen).toContain('claim3');
    });

    it('should update lastPlayedAt timestamp', () => {
      const before = Date.now();
      PlayerProfile.recordGame(createGameData());
      const after = Date.now();

      const profile = PlayerProfile.get();
      expect(profile.lastPlayedAt).toBeGreaterThanOrEqual(before);
      expect(profile.lastPlayedAt).toBeLessThanOrEqual(after);
    });

    it('should track calibration stats', () => {
      // Calibrated prediction (within +/- 2)
      PlayerProfile.recordGame(createGameData({ finalScore: 12, predictedScore: 10 }));

      const profile = PlayerProfile.get();
      expect(profile.stats.totalPredictions).toBe(1);
      expect(profile.stats.calibratedPredictions).toBe(1);
    });

    it('should update subject stats', () => {
      PlayerProfile.recordGame(createGameData());

      const profile = PlayerProfile.get();
      expect(profile.subjectStats.Biology).toBeDefined();
      expect(profile.subjectStats.Biology.correct).toBe(2);
      expect(profile.subjectStats.History).toBeDefined();
      expect(profile.subjectStats.History.incorrect).toBe(1);
    });
  });

  describe('awardAchievement()', () => {
    it('should add achievement to lifetimeAchievements', () => {
      PlayerProfile.awardAchievement('first-game');
      PlayerProfile.awardAchievement('perfect-round');

      const profile = PlayerProfile.get();
      expect(profile.lifetimeAchievements).toContain('first-game');
      expect(profile.lifetimeAchievements).toContain('perfect-round');
    });

    it('should not duplicate achievements', () => {
      PlayerProfile.awardAchievement('first-game');
      PlayerProfile.awardAchievement('first-game');

      const profile = PlayerProfile.get();
      const count = profile.lifetimeAchievements.filter(a => a === 'first-game').length;
      expect(count).toBe(1);
    });
  });

  describe('getDisplayStats()', () => {
    it('should return computed stats', () => {
      const profile = PlayerProfile.get();
      profile.stats.totalGames = 5;
      profile.stats.totalCorrect = 8;
      profile.stats.totalIncorrect = 2;
      profile.stats.bestScore = 25;
      PlayerProfile.save(profile);

      const stats = PlayerProfile.getDisplayStats();
      expect(stats.totalGames).toBe(5);
      expect(stats.accuracy).toBe(80); // 8/10 = 80%
      expect(stats.bestScore).toBe(25);
    });

    it('should handle zero rounds gracefully', () => {
      const stats = PlayerProfile.getDisplayStats();
      expect(stats.accuracy).toBe(0);
      expect(stats.calibrationRate).toBe(0);
    });
  });

  describe('getQuickStartSettings()', () => {
    it('should return last used settings', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'TestPlayer';
      profile.avatar = { emoji: '🦊' };
      profile.preferences.defaultDifficulty = 'hard';
      profile.preferences.defaultRounds = 10;
      PlayerProfile.save(profile);

      const settings = PlayerProfile.getQuickStartSettings();
      expect(settings.playerName).toBe('TestPlayer');
      expect(settings.difficulty).toBe('hard');
      expect(settings.rounds).toBe(10);
    });
  });

  describe('setSoundEnabled()', () => {
    it('should update sound preference', () => {
      PlayerProfile.setSoundEnabled(false);

      const profile = PlayerProfile.get();
      expect(profile.preferences.soundEnabled).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should remove profile from storage', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'Dave';
      PlayerProfile.save(profile);

      expect(PlayerProfile.exists()).toBe(true);

      PlayerProfile.clear();
      expect(PlayerProfile.exists()).toBe(false);
    });
  });
});
