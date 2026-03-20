import { describe, it, expect, vi } from 'vitest';
import {
  ACHIEVEMENTS,
  LIFETIME_ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getEarnedAchievements,
  getNewLifetimeAchievements,
  getAllEarnedLifetimeAchievements,
  getAchievementById
} from './achievements';

// Mock claimsLoader to avoid loading the full claims database
vi.mock('./claimsLoader', () => ({
  getClaimsCount: () => 100
}));

describe('ACHIEVEMENTS', () => {
  it('has 12 per-game achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(12);
  });

  it('each achievement has required fields', () => {
    ACHIEVEMENTS.forEach(a => {
      expect(a.id).toBeTypeOf('string');
      expect(a.name).toBeTypeOf('string');
      expect(a.description).toBeTypeOf('string');
      expect(a.icon).toBeTypeOf('string');
      expect(a.condition).toBeTypeOf('function');
    });
  });

  it('has unique IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('LIFETIME_ACHIEVEMENTS', () => {
  it('each has required fields including category', () => {
    LIFETIME_ACHIEVEMENTS.forEach(a => {
      expect(a.id).toBeTypeOf('string');
      expect(a.name).toBeTypeOf('string');
      expect(a.category).toBeTypeOf('string');
      expect(a.condition).toBeTypeOf('function');
    });
  });

  it('has unique IDs', () => {
    const ids = LIFETIME_ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all categories are valid', () => {
    const validCategories = Object.keys(ACHIEVEMENT_CATEGORIES);
    LIFETIME_ACHIEVEMENTS.forEach(a => {
      expect(validCategories).toContain(a.category);
    });
  });
});

describe('getEarnedAchievements', () => {
  it('returns empty for zero stats', () => {
    const stats = {
      totalCorrect: 0, totalIncorrect: 0, maxStreak: 0,
      aiCaughtCorrect: 0, calibrationBonus: false, humbleCorrect: 0,
      boldCorrect: 0, perfectGame: false, mythsBusted: 0,
      mixedCorrect: 0, gameCompleted: false, comeback: false
    };
    const earned = getEarnedAchievements(stats);
    expect(earned).toHaveLength(0);
  });

  it('awards first-truth for 1 correct', () => {
    const stats = { totalCorrect: 1, maxStreak: 0, aiCaughtCorrect: 0, calibrationBonus: false, humbleCorrect: 0, boldCorrect: 0, perfectGame: false, mythsBusted: 0, mixedCorrect: 0, gameCompleted: false, comeback: false };
    const earned = getEarnedAchievements(stats);
    expect(earned.some(a => a.id === 'first-truth')).toBe(true);
  });

  it('awards streak-3 for 3+ streak', () => {
    const stats = { totalCorrect: 3, maxStreak: 3, aiCaughtCorrect: 0, calibrationBonus: false, humbleCorrect: 0, boldCorrect: 0, perfectGame: false, mythsBusted: 0, mixedCorrect: 0, gameCompleted: false, comeback: false };
    const earned = getEarnedAchievements(stats);
    expect(earned.some(a => a.id === 'streak-3')).toBe(true);
  });

  it('awards perfect-round for perfect game', () => {
    const stats = { totalCorrect: 5, maxStreak: 5, aiCaughtCorrect: 0, calibrationBonus: false, humbleCorrect: 0, boldCorrect: 0, perfectGame: true, mythsBusted: 0, mixedCorrect: 0, gameCompleted: true, comeback: false };
    const earned = getEarnedAchievements(stats);
    expect(earned.some(a => a.id === 'perfect-round')).toBe(true);
  });

  it('awards calibrated for calibration bonus', () => {
    const stats = { totalCorrect: 3, maxStreak: 1, aiCaughtCorrect: 0, calibrationBonus: true, humbleCorrect: 0, boldCorrect: 0, perfectGame: false, mythsBusted: 0, mixedCorrect: 0, gameCompleted: true, comeback: false };
    const earned = getEarnedAchievements(stats);
    expect(earned.some(a => a.id === 'calibrated')).toBe(true);
  });

  it('awards comeback-kid for comeback', () => {
    const stats = { totalCorrect: 3, maxStreak: 1, aiCaughtCorrect: 0, calibrationBonus: false, humbleCorrect: 0, boldCorrect: 0, perfectGame: false, mythsBusted: 0, mixedCorrect: 0, gameCompleted: true, comeback: true };
    const earned = getEarnedAchievements(stats);
    expect(earned.some(a => a.id === 'comeback-kid')).toBe(true);
  });

  it('awards multiple achievements simultaneously', () => {
    const stats = { totalCorrect: 5, maxStreak: 5, aiCaughtCorrect: 3, calibrationBonus: true, humbleCorrect: 3, boldCorrect: 3, perfectGame: true, mythsBusted: 3, mixedCorrect: 3, gameCompleted: true, comeback: false };
    const earned = getEarnedAchievements(stats);
    // Should earn most achievements
    expect(earned.length).toBeGreaterThanOrEqual(8);
  });
});

describe('getNewLifetimeAchievements', () => {
  it('returns newly earned achievements', () => {
    const stats = { totalGames: 10, totalCorrect: 0, bestStreak: 0, currentDayStreak: 0, bestScore: 0, highConfidenceCorrect: 0, lowConfidenceCorrect: 0, totalPoints: 0, subjectStats: {}, claimsSeen: 0 };
    const alreadyEarned = ['lifetime-first-game'];
    const newAch = getNewLifetimeAchievements(stats, alreadyEarned);
    expect(newAch.some(a => a.id === 'lifetime-first-game')).toBe(false);
    expect(newAch.some(a => a.id === 'lifetime-10-games')).toBe(true);
  });

  it('returns empty when nothing new earned', () => {
    const stats = { totalGames: 0, totalCorrect: 0, bestStreak: 0, currentDayStreak: 0, bestScore: 0, highConfidenceCorrect: 0, lowConfidenceCorrect: 0, totalPoints: 0, subjectStats: {}, claimsSeen: 0 };
    const newAch = getNewLifetimeAchievements(stats, []);
    expect(newAch).toHaveLength(0);
  });
});

describe('getAllEarnedLifetimeAchievements', () => {
  it('returns all matching achievements', () => {
    const stats = { totalGames: 100, totalCorrect: 1000, bestStreak: 10, currentDayStreak: 30, bestScore: 50, highConfidenceCorrect: 25, lowConfidenceCorrect: 25, totalPoints: 1000, calibratedPredictions: 20, subjectStats: {}, claimsSeen: 100 };
    const earned = getAllEarnedLifetimeAchievements(stats);
    expect(earned.length).toBeGreaterThan(10);
  });
});

describe('getAchievementById', () => {
  it('finds per-game achievement', () => {
    expect(getAchievementById('first-truth')).toBeDefined();
    expect(getAchievementById('first-truth').name).toBe('Truth Seeker');
  });

  it('finds lifetime achievement', () => {
    expect(getAchievementById('lifetime-first-game')).toBeDefined();
    expect(getAchievementById('lifetime-first-game').name).toBe('First Steps');
  });

  it('returns undefined for nonexistent ID', () => {
    expect(getAchievementById('nonexistent')).toBeUndefined();
  });
});

describe('subject-master lifetime achievement', () => {
  it('awards when subject has 80%+ accuracy over 10 questions', () => {
    const ach = LIFETIME_ACHIEVEMENTS.find(a => a.id === 'lifetime-subject-master');
    expect(ach.condition({ subjectStats: { Biology: { correct: 9, incorrect: 1 } } })).toBe(true);
  });

  it('does not award with <10 questions', () => {
    const ach = LIFETIME_ACHIEVEMENTS.find(a => a.id === 'lifetime-subject-master');
    expect(ach.condition({ subjectStats: { Biology: { correct: 4, incorrect: 0 } } })).toBe(false);
  });

  it('does not award with <80% accuracy', () => {
    const ach = LIFETIME_ACHIEVEMENTS.find(a => a.id === 'lifetime-subject-master');
    // 7/10 = 70% < 80%
    expect(ach.condition({ subjectStats: { Biology: { correct: 7, incorrect: 3 } } })).toBe(false);
    // 6/10 = 60% < 80%
    expect(ach.condition({ subjectStats: { Biology: { correct: 6, incorrect: 4 } } })).toBe(false);
  });
});

describe('explorer-all lifetime achievement', () => {
  it('awards when all claims seen (mocked count = 100)', () => {
    const ach = LIFETIME_ACHIEVEMENTS.find(a => a.id === 'lifetime-explorer-all');
    expect(ach.condition({ claimsSeen: 100 })).toBe(true);
    expect(ach.condition({ claimsSeen: 99 })).toBe(false);
  });
});
