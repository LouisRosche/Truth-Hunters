/**
 * Tests for Analytics service
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
const { Analytics, AnalyticsEvents } = await import('../analytics.js');

describe('Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    Analytics.reset();
    vi.clearAllMocks();
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
  });

  describe('track()', () => {
    it('should record game start event', () => {
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty: 'medium', rounds: 5 });

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(1);
    });

    it('should record game completion event', () => {
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, { score: 15, accuracy: 0.8 });

      const data = Analytics.getData();
      expect(data.totalGamesCompleted).toBe(1);
    });

    it('should record round completion', () => {
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true, confidence: 3 });

      const data = Analytics.getData();
      expect(data.totalRoundsPlayed).toBe(1);
      expect(data.totalCorrectAnswers).toBe(1);
    });

    it('should track hints used', () => {
      Analytics.track(AnalyticsEvents.HINT_USED, { hintType: 'source-hint' });

      const data = Analytics.getData();
      expect(data.hintsUsed.source).toBe(1);
    });

    it('should track achievements earned', () => {
      Analytics.track(AnalyticsEvents.ACHIEVEMENT_EARNED, { achievementId: 'perfect-round' });

      const data = Analytics.getData();
      expect(data.achievementsEarned['perfect-round']).toBe(1);
    });
  });

  describe('difficulty breakdown', () => {
    it('should track games by difficulty', () => {
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty: 'easy' });
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty: 'easy' });
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty: 'medium' });
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty: 'hard' });

      const data = Analytics.getData();
      expect(data.difficultyBreakdown.easy).toBe(2);
      expect(data.difficultyBreakdown.medium).toBe(1);
      expect(data.difficultyBreakdown.hard).toBe(1);
    });
  });

  describe('subject performance', () => {
    it('should track correct answers by subject', () => {
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, {
        correct: true,
        subject: 'Biology'
      });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, {
        correct: true,
        subject: 'Biology'
      });

      const data = Analytics.getData();
      expect(data.subjectPerformance.Biology.correct).toBe(2);
    });

    it('should track incorrect answers by subject', () => {
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, {
        correct: false,
        subject: 'History'
      });

      const data = Analytics.getData();
      expect(data.subjectPerformance.History.incorrect).toBe(1);
    });

    it('should calculate subject accuracy', () => {
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true, subject: 'Math' });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true, subject: 'Math' });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: false, subject: 'Math' });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true, subject: 'Math' });

      const data = Analytics.getData();
      expect(data.subjectPerformance.Math.correct).toBe(3);
      expect(data.subjectPerformance.Math.incorrect).toBe(1);
    });
  });

  describe('streak tracking', () => {
    it('should track max streak', () => {
      Analytics.track(AnalyticsEvents.STREAK_ACHIEVED, { streak: 5 });
      Analytics.track(AnalyticsEvents.STREAK_ACHIEVED, { streak: 8 });
      Analytics.track(AnalyticsEvents.STREAK_ACHIEVED, { streak: 3 });

      const data = Analytics.getData();
      expect(data.streakData.maxStreak).toBe(8);
    });
  });

  describe('getSummary()', () => {
    it('should calculate completion rate', () => {
      Analytics.track(AnalyticsEvents.GAME_STARTED, {});
      Analytics.track(AnalyticsEvents.GAME_STARTED, {});
      Analytics.track(AnalyticsEvents.GAME_STARTED, {});
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, {});
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, {});

      const summary = Analytics.getSummary();
      expect(summary.completionRate).toBeCloseTo(67, 0);
    });

    it('should calculate overall accuracy', () => {
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: false });
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true });

      const summary = Analytics.getSummary();
      expect(summary.accuracy).toBe(75);
    });

    it('should handle zero games gracefully', () => {
      const summary = Analytics.getSummary();
      expect(summary.completionRate).toBe(0);
      expect(summary.accuracy).toBe(0);
    });
  });

  describe('reset()', () => {
    it('should reset all analytics data', () => {
      Analytics.track(AnalyticsEvents.GAME_STARTED, {});
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, {});
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, { correct: true });

      expect(Analytics.getData().totalGamesStarted).toBe(1);

      Analytics.reset();

      const data = Analytics.getData();
      expect(data.totalGamesStarted).toBe(0);
      expect(data.totalGamesCompleted).toBe(0);
      expect(data.totalRoundsPlayed).toBe(0);
    });
  });

  describe('exportData()', () => {
    it('should export analytics as JSON', () => {
      Analytics.track(AnalyticsEvents.GAME_STARTED, {});
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, { score: 15 });

      const exported = Analytics.exportData();
      // JSON.stringify with 2-space indent adds spaces after colons
      expect(exported).toContain('"totalGamesStarted": 1');
      expect(exported).toContain('"totalGamesCompleted": 1');
    });
  });

  describe('session history', () => {
    it('should track session history on game complete', () => {
      Analytics.track(AnalyticsEvents.GAME_COMPLETED, {
        score: 15,
        accuracy: 80,
        difficulty: 'medium',
        rounds: 5
      });

      const data = Analytics.getData();
      expect(data.sessionHistory).toHaveLength(1);
      expect(data.sessionHistory[0].score).toBe(15);
    });

    it('should limit session history to 50 entries', () => {
      // Add 55 sessions
      for (let i = 0; i < 55; i++) {
        Analytics.track(AnalyticsEvents.GAME_COMPLETED, { score: i });
      }

      const data = Analytics.getData();
      expect(data.sessionHistory.length).toBeLessThanOrEqual(50);
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
