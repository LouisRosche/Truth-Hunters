/**
 * Scoring Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { calculatePoints, calculateGameStats } from './scoring';

describe('calculatePoints', () => {
  it('returns +1 for correct answer with low confidence', () => {
    expect(calculatePoints(true, 1)).toBe(1);
  });

  it('returns -1 for incorrect answer with low confidence', () => {
    expect(calculatePoints(false, 1)).toBe(-1);
  });

  it('returns +3 for correct answer with medium confidence', () => {
    expect(calculatePoints(true, 2)).toBe(3);
  });

  it('returns -3 for incorrect answer with medium confidence', () => {
    expect(calculatePoints(false, 2)).toBe(-3);
  });

  it('returns +5 for correct answer with high confidence', () => {
    expect(calculatePoints(true, 3)).toBe(5);
  });

  it('returns -6 for incorrect answer with high confidence', () => {
    expect(calculatePoints(false, 3)).toBe(-6);
  });
});

describe('calculateGameStats', () => {
  const mockClaims = [
    { id: '1', answer: 'TRUE', source: 'ai-generated', errorPattern: 'Myth perpetuation' },
    { id: '2', answer: 'FALSE', source: 'expert-sourced' },
    { id: '3', answer: 'MIXED', source: 'ai-generated', errorPattern: 'Confident specificity' }
  ];

  it('calculates correct count properly', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 },
      { claimId: '2', correct: false, points: -3, confidence: 2 },
      { claimId: '3', correct: true, points: 5, confidence: 3 }
    ];

    const stats = calculateGameStats(results, mockClaims, 3, 3);
    expect(stats.totalCorrect).toBe(2);
    expect(stats.totalIncorrect).toBe(1);
  });

  it('calculates max streak properly', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 },
      { claimId: '2', correct: true, points: 3, confidence: 2 },
      { claimId: '3', correct: false, points: -6, confidence: 3 }
    ];

    const stats = calculateGameStats(results, mockClaims, -2, 0);
    expect(stats.maxStreak).toBe(2);
  });

  it('identifies perfect game', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 },
      { claimId: '2', correct: true, points: 3, confidence: 2 }
    ];

    const stats = calculateGameStats(results, mockClaims, 4, 4);
    expect(stats.perfectGame).toBe(true);
  });

  it('identifies calibration bonus eligibility', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 }
    ];

    // Within ±2 points
    const stats1 = calculateGameStats(results, mockClaims, 1, 2);
    expect(stats1.calibrationBonus).toBe(true);

    // Outside ±2 points
    const stats2 = calculateGameStats(results, mockClaims, 1, 10);
    expect(stats2.calibrationBonus).toBe(false);
  });

  it('tracks AI detection correctly', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 }, // AI claim correct
      { claimId: '2', correct: true, points: 3, confidence: 2 }, // Expert claim correct
      { claimId: '3', correct: false, points: -6, confidence: 3 } // AI claim incorrect
    ];

    const stats = calculateGameStats(results, mockClaims, -2, 0);
    expect(stats.aiCaughtCorrect).toBe(1);
  });

  it('tracks humble and bold correct answers', () => {
    const results = [
      { claimId: '1', correct: true, points: 1, confidence: 1 }, // humble correct
      { claimId: '2', correct: true, points: 5, confidence: 3 }, // bold correct
      { claimId: '3', correct: true, points: 3, confidence: 2 }  // medium correct
    ];

    const stats = calculateGameStats(results, mockClaims, 9, 9);
    expect(stats.humbleCorrect).toBe(1);
    expect(stats.boldCorrect).toBe(1);
  });

  it('detects comeback', () => {
    const results = [
      { claimId: '1', correct: false, points: -6, confidence: 3 }, // -6
      { claimId: '2', correct: true, points: 5, confidence: 3 },  // -1
      { claimId: '3', correct: true, points: 5, confidence: 3 }   // +4
    ];

    const stats = calculateGameStats(results, mockClaims, 4, 0);
    expect(stats.comeback).toBe(true);
    expect(stats.lowestPoint).toBe(-6);
  });
});
