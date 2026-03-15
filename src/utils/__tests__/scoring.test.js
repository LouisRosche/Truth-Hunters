/**
 * Comprehensive Scoring Utilities Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { calculatePoints, calculateSpeedBonus, calculateGameStats } from '../scoring';
import {
  POINTS_MATRIX,
  DIFFICULTY_MULTIPLIERS,
  SPEED_BONUS
} from '../../data/constants';

// Mock the logger to prevent console output and allow spy assertions
vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

// ---------------------------------------------------------------------------
// calculateSpeedBonus
// ---------------------------------------------------------------------------
describe('calculateSpeedBonus', () => {
  describe('returns no bonus when speed bonus is disabled or inputs invalid', () => {
    it('returns multiplier 1 and null tier when timeElapsed <= 0', () => {
      const result = calculateSpeedBonus(0, 30);
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });

    it('returns multiplier 1 and null tier when timeElapsed is negative', () => {
      const result = calculateSpeedBonus(-5, 30);
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });

    it('returns multiplier 1 and null tier when totalTime <= 0', () => {
      const result = calculateSpeedBonus(5, 0);
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });

    it('returns multiplier 1 and null tier when totalTime is negative', () => {
      const result = calculateSpeedBonus(5, -10);
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });
  });

  describe('tier assignment based on percentage of time used', () => {
    // Use 100 as totalTime so percentages map directly to elapsed seconds
    const total = 100;

    it('assigns ultra-lightning tier when <= 10% time used', () => {
      const result = calculateSpeedBonus(5, total); // 5%
      expect(result.tier).toBe('ultra-lightning');
      expect(result.multiplier).toBe(2.0);
      expect(result.icon).toBe('⚡⚡');
      expect(result.label).toBe('ULTRA LIGHTNING!');
    });

    it('assigns lightning tier when <= 20% time used', () => {
      const result = calculateSpeedBonus(15, total); // 15%
      expect(result.tier).toBe('lightning');
      expect(result.multiplier).toBe(1.75);
    });

    it('assigns very-fast tier when <= 35% time used', () => {
      const result = calculateSpeedBonus(25, total); // 25%
      expect(result.tier).toBe('very-fast');
      expect(result.multiplier).toBe(1.5);
    });

    it('assigns fast tier when <= 50% time used', () => {
      const result = calculateSpeedBonus(40, total); // 40%
      expect(result.tier).toBe('fast');
      expect(result.multiplier).toBe(1.25);
    });

    it('assigns quick tier when <= 75% time used', () => {
      const result = calculateSpeedBonus(60, total); // 60%
      expect(result.tier).toBe('quick');
      expect(result.multiplier).toBe(1.1);
    });

    it('returns no bonus when > 75% time used', () => {
      const result = calculateSpeedBonus(80, total); // 80%
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });

    it('returns no bonus when 100% time used', () => {
      const result = calculateSpeedBonus(100, total);
      expect(result.multiplier).toBe(1);
      expect(result.tier).toBeNull();
    });
  });

  describe('boundary conditions - exactly at thresholds', () => {
    const total = 100;

    it('exactly 10% gets ultra-lightning', () => {
      const result = calculateSpeedBonus(10, total);
      expect(result.tier).toBe('ultra-lightning');
      expect(result.multiplier).toBe(2.0);
    });

    it('exactly 20% gets lightning', () => {
      const result = calculateSpeedBonus(20, total);
      expect(result.tier).toBe('lightning');
      expect(result.multiplier).toBe(1.75);
    });

    it('exactly 35% gets very-fast', () => {
      const result = calculateSpeedBonus(35, total);
      expect(result.tier).toBe('very-fast');
      expect(result.multiplier).toBe(1.5);
    });

    it('exactly 50% gets fast', () => {
      const result = calculateSpeedBonus(50, total);
      expect(result.tier).toBe('fast');
      expect(result.multiplier).toBe(1.25);
    });

    it('exactly 75% gets quick', () => {
      const result = calculateSpeedBonus(75, total);
      expect(result.tier).toBe('quick');
      expect(result.multiplier).toBe(1.1);
    });

    it('just above 10% (10.01%) gets lightning instead of ultra-lightning', () => {
      const result = calculateSpeedBonus(10.01, total);
      expect(result.tier).toBe('lightning');
    });

    it('just above 75% (75.01%) gets no bonus', () => {
      const result = calculateSpeedBonus(75.01, total);
      expect(result.tier).toBeNull();
      expect(result.multiplier).toBe(1);
    });
  });

  describe('consistent with SPEED_BONUS constant tiers', () => {
    it('has correct number of tiers in constants', () => {
      expect(SPEED_BONUS.TIERS).toHaveLength(5);
    });

    it('tiers are in ascending threshold order', () => {
      for (let i = 1; i < SPEED_BONUS.TIERS.length; i++) {
        expect(SPEED_BONUS.TIERS[i].threshold).toBeGreaterThan(
          SPEED_BONUS.TIERS[i - 1].threshold
        );
      }
    });
  });
});

// ---------------------------------------------------------------------------
// calculatePoints - simple mode (no options)
// ---------------------------------------------------------------------------
describe('calculatePoints', () => {
  describe('input validation', () => {
    it('throws error for confidence = 0', () => {
      expect(() => calculatePoints(true, 0)).toThrow('Invalid confidence value');
    });

    it('throws error for confidence = 4', () => {
      expect(() => calculatePoints(true, 4)).toThrow('Invalid confidence value');
    });

    it('throws error for null confidence', () => {
      expect(() => calculatePoints(true, null)).toThrow('Invalid confidence value');
    });

    it('throws error for undefined confidence', () => {
      expect(() => calculatePoints(true, undefined)).toThrow('Invalid confidence value');
    });

    it('throws error for fractional confidence (1.5)', () => {
      expect(() => calculatePoints(true, 1.5)).toThrow('Invalid confidence value');
    });

    it('throws error for string confidence', () => {
      expect(() => calculatePoints(true, '2')).toThrow('Invalid confidence value');
    });

    it('throws error for NaN confidence', () => {
      expect(() => calculatePoints(true, NaN)).toThrow('Invalid confidence value');
    });

    it('throws error for Infinity confidence', () => {
      expect(() => calculatePoints(true, Infinity)).toThrow('Invalid confidence value');
    });

    it('throws error for negative confidence', () => {
      expect(() => calculatePoints(true, -1)).toThrow('Invalid confidence value');
    });

    it('throws error for non-boolean correct (string)', () => {
      expect(() => calculatePoints('true', 2)).toThrow('Invalid correct value');
    });

    it('throws error for non-boolean correct (number)', () => {
      expect(() => calculatePoints(1, 2)).toThrow('Invalid correct value');
    });

    it('throws error for non-boolean correct (null)', () => {
      expect(() => calculatePoints(null, 2)).toThrow('Invalid correct value');
    });

    it('throws error for non-boolean correct (undefined)', () => {
      expect(() => calculatePoints(undefined, 2)).toThrow('Invalid correct value');
    });

    it('accepts all valid confidence-correct combinations without throwing', () => {
      for (const conf of [1, 2, 3]) {
        for (const correct of [true, false]) {
          expect(() => calculatePoints(correct, conf)).not.toThrow();
        }
      }
    });
  });

  describe('base points with easy difficulty (default)', () => {
    it.each([
      [true,  1, POINTS_MATRIX[1].correct],
      [false, 1, POINTS_MATRIX[1].incorrect],
      [true,  2, POINTS_MATRIX[2].correct],
      [false, 2, POINTS_MATRIX[2].incorrect],
      [true,  3, POINTS_MATRIX[3].correct],
      [false, 3, POINTS_MATRIX[3].incorrect],
    ])('correct=%s confidence=%d returns %d', (correct, confidence, expected) => {
      expect(calculatePoints(correct, confidence)).toBe(expected);
      // Explicit default should match implicit default
      expect(calculatePoints(correct, confidence, 'easy')).toBe(expected);
    });
  });

  describe('difficulty multipliers', () => {
    const difficulties = ['easy', 'medium', 'hard', 'mixed'];

    for (const difficulty of difficulties) {
      const mult = DIFFICULTY_MULTIPLIERS[difficulty];

      describe(`${difficulty} difficulty (${mult}x)`, () => {
        it.each([1, 2, 3])('correct with confidence %d', (conf) => {
          const base = POINTS_MATRIX[conf].correct;
          const raw = base * mult;
          const expected = raw > 0 ? Math.round(raw) : -Math.round(Math.abs(raw));
          expect(calculatePoints(true, conf, difficulty)).toBe(expected);
        });

        it.each([1, 2, 3])('incorrect with confidence %d', (conf) => {
          const base = POINTS_MATRIX[conf].incorrect;
          const raw = base * mult;
          const expected = raw > 0 ? Math.round(raw) : -Math.round(Math.abs(raw));
          expect(calculatePoints(false, conf, difficulty)).toBe(expected);
        });
      });
    }
  });

  describe('unknown difficulty defaults to 1x multiplier', () => {
    it('treats unknown difficulty same as easy', () => {
      expect(calculatePoints(true, 2, 'unknown')).toBe(POINTS_MATRIX[2].correct);
      expect(calculatePoints(false, 3, 'nonexistent')).toBe(POINTS_MATRIX[3].incorrect);
    });
  });

  // ---------------------------------------------------------------------------
  // calculatePoints - enhanced mode (with options)
  // ---------------------------------------------------------------------------
  describe('enhanced mode with options', () => {
    it('returns an object with points, speedBonus, and breakdown', () => {
      const result = calculatePoints(true, 2, 'easy', {
        timeElapsed: 5,
        totalTime: 100
      });
      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('speedBonus');
      expect(result).toHaveProperty('breakdown');
    });

    describe('breakdown structure', () => {
      it('contains base, difficultyMultiplier, speedMultiplier, integrityPenalty', () => {
        const result = calculatePoints(true, 1, 'medium', {
          timeElapsed: 50,
          totalTime: 100
        });
        expect(result.breakdown).toEqual(expect.objectContaining({
          base: POINTS_MATRIX[1].correct,
          difficultyMultiplier: DIFFICULTY_MULTIPLIERS.medium,
          speedMultiplier: expect.any(Number),
          integrityPenalty: 0
        }));
      });
    });

    describe('speed bonus applied in enhanced mode', () => {
      it('applies ultra-lightning bonus (2x) to correct answer', () => {
        // 5% time used => ultra-lightning => 2.0x
        const result = calculatePoints(true, 2, 'easy', {
          timeElapsed: 5,
          totalTime: 100
        });
        // base=3, difficulty=1, speed=2.0 => 6
        expect(result.points).toBe(6);
        expect(result.speedBonus).not.toBeNull();
        expect(result.speedBonus.tier).toBe('ultra-lightning');
        expect(result.speedBonus.multiplier).toBe(2.0);
      });

      it('applies fast bonus (1.25x) to medium difficulty', () => {
        // 40% time used => fast => 1.25x
        const result = calculatePoints(true, 2, 'medium', {
          timeElapsed: 40,
          totalTime: 100
        });
        // base=3, difficulty=1.5, speed=1.25 => 3*1.5*1.25 = 5.625 => 6
        expect(result.points).toBe(6);
        expect(result.speedBonus.tier).toBe('fast');
      });

      it('applies speed bonus to incorrect answer (amplifies penalty)', () => {
        const result = calculatePoints(false, 3, 'easy', {
          timeElapsed: 5,
          totalTime: 100
        });
        // base=-6, difficulty=1, speed=2.0 => -12
        expect(result.points).toBe(-12);
      });

      it('no speed bonus when answering slowly', () => {
        const result = calculatePoints(true, 2, 'easy', {
          timeElapsed: 90,
          totalTime: 100
        });
        // base=3, difficulty=1, speed=1 => 3
        expect(result.points).toBe(3);
        expect(result.speedBonus).toBeNull();
      });

      it('speedBonus object includes bonus points calculation', () => {
        const result = calculatePoints(true, 2, 'easy', {
          timeElapsed: 5,
          totalTime: 100
        });
        // bonus = (3*1*2.0) - (3*1) = 3
        expect(result.speedBonus.bonus).toBe(3);
      });
    });

    describe('integrity penalty', () => {
      it('subtracts integrity penalty from total', () => {
        const result = calculatePoints(true, 2, 'easy', {
          timeElapsed: 90,
          totalTime: 100,
          integrityPenalty: -2
        });
        // base=3, difficulty=1, speed=1 => 3, then + (-2) => 1
        expect(result.points).toBe(1);
        expect(result.breakdown.integrityPenalty).toBe(-2);
      });

      it('integrity penalty can make positive score negative', () => {
        const result = calculatePoints(true, 1, 'easy', {
          timeElapsed: 90,
          totalTime: 100,
          integrityPenalty: -10
        });
        // base=1, difficulty=1, speed=1 => 1, then + (-10) => -9
        expect(result.points).toBe(-9);
      });

      it('no penalty when integrityPenalty is 0 or absent', () => {
        const withZero = calculatePoints(true, 2, 'easy', {
          timeElapsed: 90,
          totalTime: 100,
          integrityPenalty: 0
        });
        const withoutPenalty = calculatePoints(true, 2, 'easy', {
          timeElapsed: 90,
          totalTime: 100
        });
        expect(withZero.points).toBe(withoutPenalty.points);
      });
    });

    describe('combined speed bonus + difficulty + integrity', () => {
      it('applies all multipliers and penalty together', () => {
        // hard (2x), ultra-lightning (2x), confidence 3 correct (5 base), penalty -3
        const result = calculatePoints(true, 3, 'hard', {
          timeElapsed: 5,
          totalTime: 100,
          integrityPenalty: -3
        });
        // 5 * 2 * 2.0 = 20, then + (-3) = 17
        expect(result.points).toBe(17);
        expect(result.breakdown.base).toBe(5);
        expect(result.breakdown.difficultyMultiplier).toBe(2);
        expect(result.breakdown.speedMultiplier).toBe(2.0);
        expect(result.breakdown.integrityPenalty).toBe(-3);
      });
    });

    describe('options without timeElapsed/totalTime', () => {
      it('returns multiplier 1 when time fields are missing', () => {
        const result = calculatePoints(true, 2, 'easy', {
          integrityPenalty: -1
        });
        // base=3, difficulty=1, speed=1 => 3, penalty=-1 => 2
        expect(result.points).toBe(2);
        expect(result.speedBonus).toBeNull();
        expect(result.breakdown.speedMultiplier).toBe(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases and NaN/Infinity protection', () => {
    it('simple mode returns a finite number for all valid combos', () => {
      for (const diff of ['easy', 'medium', 'hard', 'mixed']) {
        for (const conf of [1, 2, 3]) {
          for (const correct of [true, false]) {
            const pts = calculatePoints(correct, conf, diff);
            expect(Number.isFinite(pts)).toBe(true);
          }
        }
      }
    });

    it('enhanced mode returns finite points for all valid combos', () => {
      for (const conf of [1, 2, 3]) {
        const result = calculatePoints(true, conf, 'hard', {
          timeElapsed: 5,
          totalTime: 100
        });
        expect(Number.isFinite(result.points)).toBe(true);
      }
    });
  });

  describe('rounding behavior', () => {
    it('rounds positive results to nearest integer', () => {
      // medium conf=1 correct: 1 * 1.5 = 1.5 => Math.round(1.5) = 2
      expect(calculatePoints(true, 1, 'medium')).toBe(2);
    });

    it('rounds negative results away from zero (uses -Math.round(Math.abs))', () => {
      // medium conf=1 incorrect: -1 * 1.5 = -1.5 => -Math.round(1.5) = -2
      expect(calculatePoints(false, 1, 'medium')).toBe(-2);
    });

    it('rounds .5 correctly for positive', () => {
      // 3 * 1.5 = 4.5 => Math.round(4.5) = 5 (banker's rounding differs, but JS rounds .5 up)
      expect(calculatePoints(true, 2, 'medium')).toBe(5);
    });

    it('rounds .5 correctly for negative', () => {
      // -3 * 1.5 = -4.5 => -Math.round(4.5) = -5
      expect(calculatePoints(false, 2, 'medium')).toBe(-5);
    });
  });
});

// ---------------------------------------------------------------------------
// calculateGameStats
// ---------------------------------------------------------------------------
describe('calculateGameStats', () => {
  const makeClaim = (id, overrides = {}) => ({
    id,
    answer: 'TRUE',
    source: 'expert-sourced',
    ...overrides
  });

  const makeResult = (claimId, overrides = {}) => ({
    claimId,
    correct: true,
    points: 3,
    confidence: 2,
    ...overrides
  });

  describe('basic counting', () => {
    it('counts correct and incorrect results', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: false, points: -3 }),
        makeResult('3', { correct: true })
      ];

      const stats = calculateGameStats(results, claims, 3, 5);
      expect(stats.totalCorrect).toBe(2);
      expect(stats.totalIncorrect).toBe(1);
    });
  });

  describe('streak tracking', () => {
    it('tracks maxStreak across all results', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3'), makeClaim('4'), makeClaim('5')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: true }),
        makeResult('3', { correct: false, points: -1 }),
        makeResult('4', { correct: true }),
        makeResult('5', { correct: true })
      ];

      const stats = calculateGameStats(results, claims, 5, 5);
      expect(stats.maxStreak).toBe(2);
      expect(stats.currentStreak).toBe(2);
    });

    it('maxStreak is longest even if current streak is shorter', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3'), makeClaim('4'), makeClaim('5')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: true }),
        makeResult('3', { correct: true }),
        makeResult('4', { correct: false, points: -1 }),
        makeResult('5', { correct: true })
      ];

      const stats = calculateGameStats(results, claims, 8, 8);
      expect(stats.maxStreak).toBe(3);
      expect(stats.currentStreak).toBe(1);
    });

    it('streak resets on incorrect answer', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: false, points: -3 })
      ];

      const stats = calculateGameStats(results, claims, 0, 0);
      expect(stats.maxStreak).toBe(1);
      expect(stats.currentStreak).toBe(0);
    });
  });

  describe('perfect game detection', () => {
    it('perfectGame is true when all answers correct', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: true })
      ];

      const stats = calculateGameStats(results, claims, 6, 6);
      expect(stats.perfectGame).toBe(true);
    });

    it('perfectGame is false when any answer incorrect', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: true }),
        makeResult('2', { correct: false, points: -3 })
      ];

      const stats = calculateGameStats(results, claims, 0, 0);
      expect(stats.perfectGame).toBe(false);
    });

    it('perfectGame is false for empty results', () => {
      const stats = calculateGameStats([], [], 0, 0);
      expect(stats.perfectGame).toBe(false);
    });
  });

  describe('calibration bonus', () => {
    it('calibrationBonus is true when score is within 2 of predicted', () => {
      const stats = calculateGameStats([], [], 10, 12);
      expect(stats.calibrationBonus).toBe(true);
    });

    it('calibrationBonus is true when score equals predicted', () => {
      const stats = calculateGameStats([], [], 5, 5);
      expect(stats.calibrationBonus).toBe(true);
    });

    it('calibrationBonus is true at exact boundary (diff = 2)', () => {
      const stats = calculateGameStats([], [], 8, 10);
      expect(stats.calibrationBonus).toBe(true);
    });

    it('calibrationBonus is false when diff > 2', () => {
      const stats = calculateGameStats([], [], 5, 8);
      expect(stats.calibrationBonus).toBe(false);
    });

    it('calibrationBonus handles negative scores', () => {
      const stats = calculateGameStats([], [], -1, 1);
      expect(stats.calibrationBonus).toBe(true); // diff = 2

      const stats2 = calculateGameStats([], [], -5, 0);
      expect(stats2.calibrationBonus).toBe(false); // diff = 5
    });
  });

  describe('special tracking fields', () => {
    it('tracks humbleCorrect (confidence 1 + correct)', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { confidence: 1, correct: true, points: 1 })];
      const stats = calculateGameStats(results, claims, 1, 1);
      expect(stats.humbleCorrect).toBe(1);
    });

    it('does not count humbleCorrect for incorrect low-confidence', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { confidence: 1, correct: false, points: -1 })];
      const stats = calculateGameStats(results, claims, -1, 0);
      expect(stats.humbleCorrect).toBe(0);
    });

    it('tracks boldCorrect (confidence 3 + correct)', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { confidence: 3, correct: true, points: 5 })];
      const stats = calculateGameStats(results, claims, 5, 5);
      expect(stats.boldCorrect).toBe(1);
    });

    it('does not count boldCorrect for incorrect high-confidence', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { confidence: 3, correct: false, points: -6 })];
      const stats = calculateGameStats(results, claims, -6, 0);
      expect(stats.boldCorrect).toBe(0);
    });

    it('tracks mixedCorrect for MIXED answer claims', () => {
      const claims = [makeClaim('1', { answer: 'MIXED' })];
      const results = [makeResult('1', { correct: true })];
      const stats = calculateGameStats(results, claims, 3, 3);
      expect(stats.mixedCorrect).toBe(1);
    });

    it('does not count mixedCorrect for incorrect MIXED answers', () => {
      const claims = [makeClaim('1', { answer: 'MIXED' })];
      const results = [makeResult('1', { correct: false, points: -3 })];
      const stats = calculateGameStats(results, claims, -3, 0);
      expect(stats.mixedCorrect).toBe(0);
    });

    it('tracks aiCaughtCorrect for ai-generated claims answered correctly', () => {
      const claims = [makeClaim('1', { source: 'ai-generated' })];
      const results = [makeResult('1', { correct: true })];
      const stats = calculateGameStats(results, claims, 3, 3);
      expect(stats.aiCaughtCorrect).toBe(1);
    });

    it('does not count aiCaughtCorrect for incorrectly answered ai-generated claims', () => {
      const claims = [makeClaim('1', { source: 'ai-generated' })];
      const results = [makeResult('1', { correct: false, points: -3 })];
      const stats = calculateGameStats(results, claims, -3, 0);
      expect(stats.aiCaughtCorrect).toBe(0);
    });

    it('tracks mythsBusted for myth-perpetuation error pattern', () => {
      const claims = [makeClaim('1', { errorPattern: 'myth-perpetuation' })];
      const results = [makeResult('1', { correct: true })];
      const stats = calculateGameStats(results, claims, 3, 3);
      expect(stats.mythsBusted).toBe(1);
    });

    it('does not count mythsBusted for incorrect myth-perpetuation answers', () => {
      const claims = [makeClaim('1', { errorPattern: 'myth-perpetuation' })];
      const results = [makeResult('1', { correct: false, points: -3 })];
      const stats = calculateGameStats(results, claims, -3, 0);
      expect(stats.mythsBusted).toBe(0);
    });
  });

  describe('comeback detection', () => {
    it('comeback is true when lowestPoint < 0 and final score > 0', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3')];
      const results = [
        makeResult('1', { correct: false, points: -6 }),
        makeResult('2', { correct: true, points: 5 }),
        makeResult('3', { correct: true, points: 5 })
      ];

      const stats = calculateGameStats(results, claims, 4, 0);
      expect(stats.comeback).toBe(true);
      expect(stats.lowestPoint).toBe(-6);
    });

    it('comeback is false when final score <= 0', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: false, points: -6 }),
        makeResult('2', { correct: true, points: 5 })
      ];

      const stats = calculateGameStats(results, claims, -1, 0);
      expect(stats.comeback).toBe(false);
    });

    it('comeback is false when score never went negative', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: true, points: 3 }),
        makeResult('2', { correct: true, points: 5 })
      ];

      const stats = calculateGameStats(results, claims, 8, 8);
      expect(stats.comeback).toBe(false);
      expect(stats.lowestPoint).toBe(0);
    });
  });

  describe('empty and edge cases', () => {
    it('handles empty results array', () => {
      const stats = calculateGameStats([], [], 0, 0);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(0);
      expect(stats.maxStreak).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.perfectGame).toBe(false);
      expect(stats.comeback).toBe(false);
      expect(stats.lowestPoint).toBe(0);
      expect(stats.gameCompleted).toBe(true);
    });

    it('handles results where claim is not found in claims array', () => {
      const claims = []; // no claims
      const results = [makeResult('missing-id', { correct: true })];

      // Should not throw; mixedCorrect, aiCaughtCorrect etc. use optional chaining
      const stats = calculateGameStats(results, claims, 3, 3);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.mixedCorrect).toBe(0);
      expect(stats.aiCaughtCorrect).toBe(0);
      expect(stats.mythsBusted).toBe(0);
    });

    it('handles NaN points in results gracefully (treats as 0)', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { correct: true, points: NaN })];

      const stats = calculateGameStats(results, claims, 0, 0);
      // NaN points should be treated as 0, so lowestPoint stays 0
      expect(stats.lowestPoint).toBe(0);
    });

    it('handles Infinity points in results gracefully (treats as 0)', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { correct: true, points: Infinity })];

      const stats = calculateGameStats(results, claims, 0, 0);
      expect(stats.lowestPoint).toBe(0);
    });

    it('handles undefined points in results gracefully (treats as 0)', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { correct: true, points: undefined })];

      const stats = calculateGameStats(results, claims, 0, 0);
      expect(stats.lowestPoint).toBe(0);
    });

    it('single round game works correctly', () => {
      const claims = [makeClaim('1')];
      const results = [makeResult('1', { correct: true, points: 5, confidence: 3 })];

      const stats = calculateGameStats(results, claims, 5, 5);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.totalIncorrect).toBe(0);
      expect(stats.maxStreak).toBe(1);
      expect(stats.currentStreak).toBe(1);
      expect(stats.perfectGame).toBe(true);
      expect(stats.boldCorrect).toBe(1);
    });

    it('all incorrect game', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3')];
      const results = [
        makeResult('1', { correct: false, points: -6, confidence: 3 }),
        makeResult('2', { correct: false, points: -3, confidence: 2 }),
        makeResult('3', { correct: false, points: -1, confidence: 1 })
      ];

      const stats = calculateGameStats(results, claims, -10, 0);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.totalIncorrect).toBe(3);
      expect(stats.maxStreak).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.perfectGame).toBe(false);
      expect(stats.humbleCorrect).toBe(0);
      expect(stats.boldCorrect).toBe(0);
    });
  });

  describe('return value structure', () => {
    it('returns all expected fields', () => {
      const stats = calculateGameStats([], [], 0, 0);
      const expectedKeys = [
        'totalCorrect',
        'totalIncorrect',
        'maxStreak',
        'currentStreak',
        'aiCaughtCorrect',
        'humbleCorrect',
        'boldCorrect',
        'mixedCorrect',
        'mythsBusted',
        'perfectGame',
        'gameCompleted',
        'calibrationBonus',
        'comeback',
        'lowestPoint'
      ];

      for (const key of expectedKeys) {
        expect(stats).toHaveProperty(key);
      }
    });
  });

  describe('running score tracking for lowestPoint', () => {
    it('tracks running score accurately across multiple rounds', () => {
      const claims = [makeClaim('1'), makeClaim('2'), makeClaim('3'), makeClaim('4')];
      const results = [
        makeResult('1', { correct: true, points: 3 }),   // running: 3
        makeResult('2', { correct: false, points: -6 }),  // running: -3
        makeResult('3', { correct: false, points: -6 }),  // running: -9
        makeResult('4', { correct: true, points: 10 })    // running: 1
      ];

      const stats = calculateGameStats(results, claims, 1, 0);
      expect(stats.lowestPoint).toBe(-9);
    });

    it('lowestPoint is 0 when score never goes negative', () => {
      const claims = [makeClaim('1'), makeClaim('2')];
      const results = [
        makeResult('1', { correct: true, points: 5 }),
        makeResult('2', { correct: true, points: 3 })
      ];

      const stats = calculateGameStats(results, claims, 8, 8);
      expect(stats.lowestPoint).toBe(0);
    });
  });
});
