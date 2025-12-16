/**
 * Tests for PlayerProfile service
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

globalThis.localStorage = localStorageMock;

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
    it('should update totalGames counter', () => {
      const gameData = {
        rounds: [{}, {}, {}],
        finalScore: 15,
        maxStreak: 2
      };

      PlayerProfile.recordGame(gameData);

      const profile = PlayerProfile.get();
      expect(profile.stats.totalGames).toBe(1);
    });

    it('should update totalRounds counter', () => {
      const gameData = {
        rounds: [{}, {}, {}, {}, {}],
        finalScore: 20,
        maxStreak: 3
      };

      PlayerProfile.recordGame(gameData);

      const profile = PlayerProfile.get();
      expect(profile.stats.totalRounds).toBe(5);
    });

    it('should track best score', () => {
      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 0 });
      PlayerProfile.recordGame({ rounds: [], finalScore: 20, maxStreak: 0 });
      PlayerProfile.recordGame({ rounds: [], finalScore: 15, maxStreak: 0 });

      const profile = PlayerProfile.get();
      expect(profile.stats.bestScore).toBe(20);
    });

    it('should track best streak', () => {
      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 2 });
      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 5 });
      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 3 });

      const profile = PlayerProfile.get();
      expect(profile.stats.bestStreak).toBe(5);
    });

    it('should increment day streak for consecutive days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const profile = PlayerProfile.get();
      profile.stats.lastPlayDate = yesterday.toDateString();
      profile.stats.currentDayStreak = 1;
      PlayerProfile.save(profile);

      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 0 });

      const updated = PlayerProfile.get();
      expect(updated.stats.currentDayStreak).toBe(2);
    });

    it('should reset day streak for non-consecutive days', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const profile = PlayerProfile.get();
      profile.stats.lastPlayDate = threeDaysAgo.toDateString();
      profile.stats.currentDayStreak = 5;
      PlayerProfile.save(profile);

      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 0 });

      const updated = PlayerProfile.get();
      expect(updated.stats.currentDayStreak).toBe(1);
    });

    it('should update lastPlayedAt timestamp', () => {
      const before = Date.now();
      PlayerProfile.recordGame({ rounds: [], finalScore: 10, maxStreak: 0 });
      const after = Date.now();

      const profile = PlayerProfile.get();
      expect(profile.lastPlayedAt).toBeGreaterThanOrEqual(before);
      expect(profile.lastPlayedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('recordClaim()', () => {
    it('should add claim ID to claimsSeen', () => {
      PlayerProfile.recordClaim('claim-1');
      PlayerProfile.recordClaim('claim-2');

      const profile = PlayerProfile.get();
      expect(profile.claimsSeen).toContain('claim-1');
      expect(profile.claimsSeen).toContain('claim-2');
      expect(profile.claimsSeen.length).toBe(2);
    });

    it('should not duplicate claim IDs', () => {
      PlayerProfile.recordClaim('claim-1');
      PlayerProfile.recordClaim('claim-1');
      PlayerProfile.recordClaim('claim-1');

      const profile = PlayerProfile.get();
      expect(profile.claimsSeen.length).toBe(1);
    });
  });

  describe('hasSeenClaim()', () => {
    it('should return false for unseen claims', () => {
      expect(PlayerProfile.hasSeenClaim('claim-new')).toBe(false);
    });

    it('should return true for seen claims', () => {
      PlayerProfile.recordClaim('claim-1');
      expect(PlayerProfile.hasSeenClaim('claim-1')).toBe(true);
    });
  });

  describe('getUnseenClaimCount()', () => {
    it('should return total count when no claims seen', () => {
      const count = PlayerProfile.getUnseenClaimCount(['claim-1', 'claim-2', 'claim-3']);
      expect(count).toBe(3);
    });

    it('should return correct unseen count', () => {
      PlayerProfile.recordClaim('claim-1');
      PlayerProfile.recordClaim('claim-2');

      const count = PlayerProfile.getUnseenClaimCount(['claim-1', 'claim-2', 'claim-3', 'claim-4']);
      expect(count).toBe(2);
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

  describe('export() and import()', () => {
    it('should export profile as JSON', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'Eve';
      profile.stats.totalGames = 10;
      PlayerProfile.save(profile);

      const exported = PlayerProfile.export();
      expect(exported).toContain('"playerName":"Eve"');
      expect(exported).toContain('"totalGames":10');
    });

    it('should import profile from JSON', () => {
      const profile = PlayerProfile.get();
      profile.playerName = 'Frank';
      profile.stats.totalGames = 20;
      const json = JSON.stringify(profile);

      PlayerProfile.clear();
      expect(PlayerProfile.exists()).toBe(false);

      const result = PlayerProfile.import(json);
      expect(result).toBe(true);

      const imported = PlayerProfile.get();
      expect(imported.playerName).toBe('Frank');
      expect(imported.stats.totalGames).toBe(20);
    });

    it('should reject invalid JSON on import', () => {
      const result = PlayerProfile.import('invalid{json}');
      expect(result).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return current stats', () => {
      const profile = PlayerProfile.get();
      profile.stats.totalGames = 5;
      profile.stats.totalPoints = 100;
      profile.stats.bestScore = 25;
      PlayerProfile.save(profile);

      const stats = PlayerProfile.getStats();
      expect(stats.totalGames).toBe(5);
      expect(stats.totalPoints).toBe(100);
      expect(stats.bestScore).toBe(25);
    });

    it('should calculate accuracy', () => {
      const profile = PlayerProfile.get();
      profile.stats.totalCorrect = 8;
      profile.stats.totalIncorrect = 2;
      PlayerProfile.save(profile);

      const stats = PlayerProfile.getStats();
      expect(stats.accuracy).toBe(0.8);
    });

    it('should handle zero rounds gracefully', () => {
      const stats = PlayerProfile.getStats();
      expect(stats.accuracy).toBe(0);
    });
  });

  describe('achievement tracking', () => {
    it('should add lifetime achievements', () => {
      PlayerProfile.addLifetimeAchievement('first-game');
      PlayerProfile.addLifetimeAchievement('perfect-round');

      const profile = PlayerProfile.get();
      expect(profile.lifetimeAchievements).toContain('first-game');
      expect(profile.lifetimeAchievements).toContain('perfect-round');
    });

    it('should not duplicate achievements', () => {
      PlayerProfile.addLifetimeAchievement('first-game');
      PlayerProfile.addLifetimeAchievement('first-game');

      const profile = PlayerProfile.get();
      const count = profile.lifetimeAchievements.filter(a => a === 'first-game').length;
      expect(count).toBe(1);
    });

    it('should check if achievement is earned', () => {
      PlayerProfile.addLifetimeAchievement('master');

      expect(PlayerProfile.hasAchievement('master')).toBe(true);
      expect(PlayerProfile.hasAchievement('novice')).toBe(false);
    });
  });

  describe('preferences', () => {
    it('should update default difficulty', () => {
      PlayerProfile.setPreference('defaultDifficulty', 'hard');

      const profile = PlayerProfile.get();
      expect(profile.preferences.defaultDifficulty).toBe('hard');
    });

    it('should update default rounds', () => {
      PlayerProfile.setPreference('defaultRounds', 10);

      const profile = PlayerProfile.get();
      expect(profile.preferences.defaultRounds).toBe(10);
    });

    it('should get preference value', () => {
      PlayerProfile.setPreference('soundEnabled', false);

      const value = PlayerProfile.getPreference('soundEnabled');
      expect(value).toBe(false);
    });
  });
});
