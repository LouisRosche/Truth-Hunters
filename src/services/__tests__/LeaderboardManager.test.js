/**
 * Tests for LeaderboardManager service
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

// Import after mocking localStorage
const { LeaderboardManager } = await import('../LeaderboardManager.js');

describe('LeaderboardManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('save()', () => {
    it('should save a game record', () => {
      const record = {
        teamName: 'Team Alpha',
        score: 15,
        accuracy: 0.8,
        difficulty: 'medium',
        rounds: 5,
        players: [{ firstName: 'Alice', lastInitial: 'A' }]
      };

      const result = LeaderboardManager.save(record);
      expect(result).toBe(true);

      const all = LeaderboardManager.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].teamName).toBe('Team Alpha');
      expect(all[0].score).toBe(15);
    });

    it('should add timestamp to record', () => {
      const record = {
        teamName: 'Test',
        score: 10,
        accuracy: 0.5,
        difficulty: 'easy',
        rounds: 3,
        players: []
      };

      LeaderboardManager.save(record);
      const all = LeaderboardManager.getAll();

      expect(all[0].timestamp).toBeDefined();
      expect(typeof all[0].timestamp).toBe('number');
    });

    it('should limit to MAX_RECORDS (100)', () => {
      // Add 101 records
      for (let i = 0; i < 101; i++) {
        LeaderboardManager.save({
          teamName: `Team ${i}`,
          score: i,
          accuracy: 0.5,
          difficulty: 'easy',
          rounds: 3,
          players: []
        });
      }

      const all = LeaderboardManager.getAll();
      expect(all).toHaveLength(100);
    });

    it('should keep highest scores when trimming', () => {
      // Add records with varying scores
      for (let i = 0; i < 101; i++) {
        LeaderboardManager.save({
          teamName: `Team ${i}`,
          score: i,
          accuracy: 0.5,
          difficulty: 'easy',
          rounds: 3,
          players: []
        });
      }

      const all = LeaderboardManager.getAll();
      const lowestScore = all[all.length - 1].score;

      // Lowest score should be >= 1 (since we added 0-100)
      expect(lowestScore).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTopTeams()', () => {
    beforeEach(() => {
      // Add test data
      LeaderboardManager.save({ teamName: 'A', score: 30, accuracy: 0.9, difficulty: 'hard', rounds: 5, players: [] });
      LeaderboardManager.save({ teamName: 'B', score: 20, accuracy: 0.8, difficulty: 'medium', rounds: 5, players: [] });
      LeaderboardManager.save({ teamName: 'C', score: 10, accuracy: 0.7, difficulty: 'easy', rounds: 5, players: [] });
    });

    it('should return top teams sorted by score', () => {
      const top = LeaderboardManager.getTopTeams(2);
      expect(top).toHaveLength(2);
      expect(top[0].teamName).toBe('A');
      expect(top[0].score).toBe(30);
      expect(top[1].teamName).toBe('B');
      expect(top[1].score).toBe(20);
    });

    it('should default to top 10', () => {
      const top = LeaderboardManager.getTopTeams();
      expect(top.length).toBeLessThanOrEqual(10);
    });

    it('should return all teams if fewer than limit', () => {
      const top = LeaderboardManager.getTopTeams(10);
      expect(top).toHaveLength(3);
    });
  });

  describe('getTopPlayers()', () => {
    beforeEach(() => {
      LeaderboardManager.save({
        teamName: 'Team 1',
        score: 30,
        accuracy: 0.9,
        difficulty: 'hard',
        rounds: 5,
        players: [
          { firstName: 'Alice', lastInitial: 'A' },
          { firstName: 'Bob', lastInitial: 'B' }
        ]
      });

      LeaderboardManager.save({
        teamName: 'Team 2',
        score: 20,
        accuracy: 0.8,
        difficulty: 'medium',
        rounds: 5,
        players: [
          { firstName: 'Alice', lastInitial: 'A' },
          { firstName: 'Charlie', lastInitial: 'C' }
        ]
      });
    });

    it('should aggregate player statistics', () => {
      const players = LeaderboardManager.getTopPlayers(10);

      const alice = players.find(p => p.displayName === 'Alice A.');
      expect(alice).toBeDefined();
      expect(alice.gamesPlayed).toBe(2);
      expect(alice.totalScore).toBe(50); // 30 + 20
      expect(alice.avgScore).toBe(25);
      expect(alice.bestScore).toBe(30);
    });

    it('should sort players by best score', () => {
      const players = LeaderboardManager.getTopPlayers(10);
      expect(players[0].bestScore).toBeGreaterThanOrEqual(players[1]?.bestScore || 0);
    });

    it('should limit to requested count', () => {
      const players = LeaderboardManager.getTopPlayers(2);
      expect(players.length).toBeLessThanOrEqual(2);
    });
  });

  describe('clear()', () => {
    it('should clear all records', () => {
      LeaderboardManager.save({ teamName: 'Test', score: 10, accuracy: 0.5, difficulty: 'easy', rounds: 3, players: [] });
      expect(LeaderboardManager.getAll()).toHaveLength(1);

      LeaderboardManager.clear();
      expect(LeaderboardManager.getAll()).toHaveLength(0);
    });
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(LeaderboardManager.isAvailable()).toBe(true);
    });
  });

  describe('getStats()', () => {
    beforeEach(() => {
      LeaderboardManager.save({ teamName: 'A', score: 30, accuracy: 0.9, difficulty: 'hard', rounds: 5, players: [] });
      LeaderboardManager.save({ teamName: 'B', score: 20, accuracy: 0.8, difficulty: 'medium', rounds: 5, players: [] });
      LeaderboardManager.save({ teamName: 'C', score: 10, accuracy: 0.5, difficulty: 'easy', rounds: 3, players: [] });
    });

    it('should return correct statistics', () => {
      const stats = LeaderboardManager.getStats();

      expect(stats.totalGames).toBe(3);
      expect(stats.averageScore).toBe(20); // (30 + 20 + 10) / 3
      expect(stats.highestScore).toBe(30);
      expect(stats.averageAccuracy).toBeCloseTo(0.733, 1);
    });

    it('should handle empty leaderboard', () => {
      LeaderboardManager.clear();
      const stats = LeaderboardManager.getStats();

      expect(stats.totalGames).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.highestScore).toBe(0);
    });
  });
});
