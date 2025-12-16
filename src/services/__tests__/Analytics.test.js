/**
 * Tests for Analytics service
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
const { Analytics } = await import('../analytics.js');

describe('Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(Analytics.isAvailable()).toBe(true);
    });
  });

  describe('trackEvent()', () => {
    it('should record game start event', () => {
      Analytics.trackEvent('game_start', { difficulty: 'medium', rounds: 5 });

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(1);
    });

    it('should record game completion event', () => {
      Analytics.trackEvent('game_complete', { score: 15, accuracy: 0.8 });

      const data = Analytics.getData();
      expect(data.totalGamesCompleted).toBe(1);
    });

    it('should record round completion', () => {
      Analytics.trackEvent('round_complete', { correct: true, confidence: 3 });

      const data = Analytics.getData();
      expect(data.totalRoundsPlayed).toBe(1);
      expect(data.totalCorrectAnswers).toBe(1);
    });

    it('should track hints used', () => {
      Analytics.trackEvent('hint_used', { hintType: 'source' });

      const data = Analytics.getData();
      expect(data.hintsUsed).toBe(1);
    });

    it('should track achievements earned', () => {
      Analytics.trackEvent('achievement_earned', { achievementId: 'perfect-round' });

      const data = Analytics.getData();
      expect(data.achievementsEarned).toBe(1);
    });
  });

  describe('session tracking', () => {
    it('should record session start', () => {
      const sessionId = Analytics.startSession();

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('should track session duration', () => {
      const sessionId = Analytics.startSession();

      // Simulate 2-second session
      const startTime = Date.now();
      vi.useFakeTimers();
      vi.advanceTimersByTime(2000);

      Analytics.endSession(sessionId);
      vi.useRealTimers();

      const data = Analytics.getData();
      const session = data.sessionHistory.find(s => s.id === sessionId);

      expect(session).toBeDefined();
      expect(session.duration).toBeGreaterThanOrEqual(2000);
    });

    it('should store session events', () => {
      const sessionId = Analytics.startSession();

      Analytics.trackEvent('game_start', { difficulty: 'easy' });
      Analytics.trackEvent('round_complete', { correct: true });

      Analytics.endSession(sessionId);

      const data = Analytics.getData();
      const session = data.sessionHistory.find(s => s.id === sessionId);

      expect(session.events).toHaveLength(2);
    });

    it('should limit session history to 50 sessions', () => {
      // Create 51 sessions
      for (let i = 0; i < 51; i++) {
        const id = Analytics.startSession();
        Analytics.endSession(id);
      }

      const data = Analytics.getData();
      expect(data.sessionHistory.length).toBeLessThanOrEqual(50);
    });
  });

  describe('difficulty breakdown', () => {
    it('should track games by difficulty', () => {
      Analytics.trackEvent('game_start', { difficulty: 'easy' });
      Analytics.trackEvent('game_start', { difficulty: 'easy' });
      Analytics.trackEvent('game_start', { difficulty: 'medium' });
      Analytics.trackEvent('game_start', { difficulty: 'hard' });

      const data = Analytics.getData();
      expect(data.difficultyBreakdown.easy).toBe(2);
      expect(data.difficultyBreakdown.medium).toBe(1);
      expect(data.difficultyBreakdown.hard).toBe(1);
    });
  });

  describe('subject performance', () => {
    it('should track correct answers by subject', () => {
      Analytics.trackEvent('round_complete', {
        correct: true,
        subject: 'Biology'
      });
      Analytics.trackEvent('round_complete', {
        correct: true,
        subject: 'Biology'
      });

      const data = Analytics.getData();
      expect(data.subjectPerformance.Biology.correct).toBe(2);
    });

    it('should track incorrect answers by subject', () => {
      Analytics.trackEvent('round_complete', {
        correct: false,
        subject: 'History'
      });

      const data = Analytics.getData();
      expect(data.subjectPerformance.History.incorrect).toBe(1);
    });

    it('should calculate subject accuracy', () => {
      Analytics.trackEvent('round_complete', { correct: true, subject: 'Math' });
      Analytics.trackEvent('round_complete', { correct: true, subject: 'Math' });
      Analytics.trackEvent('round_complete', { correct: false, subject: 'Math' });
      Analytics.trackEvent('round_complete', { correct: true, subject: 'Math' });

      const data = Analytics.getData();
      expect(data.subjectPerformance.Math.correct).toBe(3);
      expect(data.subjectPerformance.Math.incorrect).toBe(1);
    });
  });

  describe('streak tracking', () => {
    it('should track best streak', () => {
      Analytics.trackEvent('streak_achieved', { streak: 5 });
      Analytics.trackEvent('streak_achieved', { streak: 8 });
      Analytics.trackEvent('streak_achieved', { streak: 3 });

      const data = Analytics.getData();
      expect(data.streakData.bestStreak).toBe(8);
    });

    it('should track total streaks', () => {
      Analytics.trackEvent('streak_achieved', { streak: 5 });
      Analytics.trackEvent('streak_achieved', { streak: 3 });

      const data = Analytics.getData();
      expect(data.streakData.totalStreaks).toBe(2);
    });
  });

  describe('getData()', () => {
    it('should return default analytics data when none exists', () => {
      const data = Analytics.getData();

      expect(data).toHaveProperty('totalGamesStarted');
      expect(data).toHaveProperty('totalGamesCompleted');
      expect(data).toHaveProperty('difficultyBreakdown');
      expect(data).toHaveProperty('subjectPerformance');
      expect(data.totalGamesStarted).toBe(0);
    });

    it('should return persisted analytics data', () => {
      Analytics.trackEvent('game_start', { difficulty: 'hard' });
      Analytics.trackEvent('game_complete', { score: 20 });

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(1);
      expect(data.totalGamesCompleted).toBe(1);
    });
  });

  describe('getStats()', () => {
    it('should calculate completion rate', () => {
      Analytics.trackEvent('game_start', {});
      Analytics.trackEvent('game_start', {});
      Analytics.trackEvent('game_start', {});
      Analytics.trackEvent('game_complete', {});
      Analytics.trackEvent('game_complete', {});

      const stats = Analytics.getStats();
      expect(stats.completionRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate overall accuracy', () => {
      Analytics.trackEvent('round_complete', { correct: true });
      Analytics.trackEvent('round_complete', { correct: true });
      Analytics.trackEvent('round_complete', { correct: false });
      Analytics.trackEvent('round_complete', { correct: true });

      const stats = Analytics.getStats();
      expect(stats.overallAccuracy).toBe(0.75);
    });

    it('should calculate hints per game', () => {
      Analytics.trackEvent('game_complete', {});
      Analytics.trackEvent('game_complete', {});
      Analytics.trackEvent('hint_used', {});
      Analytics.trackEvent('hint_used', {});
      Analytics.trackEvent('hint_used', {});
      Analytics.trackEvent('hint_used', {});

      const stats = Analytics.getStats();
      expect(stats.avgHintsPerGame).toBe(2);
    });

    it('should handle zero games gracefully', () => {
      const stats = Analytics.getStats();
      expect(stats.completionRate).toBe(0);
      expect(stats.overallAccuracy).toBe(0);
      expect(stats.avgHintsPerGame).toBe(0);
    });
  });

  describe('clear()', () => {
    it('should reset all analytics data', () => {
      Analytics.trackEvent('game_start', {});
      Analytics.trackEvent('game_complete', {});
      Analytics.trackEvent('round_complete', { correct: true });

      expect(Analytics.getData().totalGamesStarted).toBe(1);

      Analytics.clear();

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(0);
      expect(data.totalGamesCompleted).toBe(0);
      expect(data.totalRoundsPlayed).toBe(0);
    });
  });

  describe('export() and import()', () => {
    it('should export analytics as JSON', () => {
      Analytics.trackEvent('game_start', {});
      Analytics.trackEvent('game_complete', { score: 15 });

      const exported = Analytics.export();
      expect(exported).toContain('"totalGamesStarted":1');
      expect(exported).toContain('"totalGamesCompleted":1');
    });

    it('should import analytics from JSON', () => {
      const mockData = {
        totalGamesStarted: 10,
        totalGamesCompleted: 8,
        totalRoundsPlayed: 50
      };

      const result = Analytics.import(JSON.stringify(mockData));
      expect(result).toBe(true);

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(10);
      expect(data.totalGamesCompleted).toBe(8);
    });

    it('should reject invalid JSON on import', () => {
      const result = Analytics.import('invalid{json}');
      expect(result).toBe(false);
    });
  });

  describe('time tracking', () => {
    it('should track total play time', () => {
      const sessionId = Analytics.startSession();

      vi.useFakeTimers();
      vi.advanceTimersByTime(300000); // 5 minutes

      Analytics.endSession(sessionId);
      vi.useRealTimers();

      const data = Analytics.getData();
      expect(data.totalPlayTimeMs).toBeGreaterThanOrEqual(300000);
    });

    it('should accumulate play time across sessions', () => {
      const session1 = Analytics.startSession();
      vi.useFakeTimers();
      vi.advanceTimersByTime(60000); // 1 minute
      Analytics.endSession(session1);

      const session2 = Analytics.startSession();
      vi.advanceTimersByTime(120000); // 2 minutes
      Analytics.endSession(session2);
      vi.useRealTimers();

      const data = Analytics.getData();
      expect(data.totalPlayTimeMs).toBeGreaterThanOrEqual(180000);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      const data = Analytics.getData();
      expect(data).toHaveProperty('totalGamesStarted');

      localStorage.getItem = originalGetItem;
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('truthHunters_analytics', 'corrupted{json');

      const data = Analytics.getData();
      expect(data).toHaveProperty('totalGamesStarted');
      expect(data.totalGamesStarted).toBe(0);
    });
  });
});
