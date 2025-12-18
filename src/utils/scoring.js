/**
 * SCORING UTILITIES
 * Functions for calculating points and game statistics
 */

import { POINTS_MATRIX, DIFFICULTY_MULTIPLIERS, SPEED_BONUS } from '../data/constants';

/**
 * Calculate speed bonus multiplier based on response time
 * Uses granular tier system for more nuanced rewards
 * @param {number} timeElapsed - Time taken to answer (seconds)
 * @param {number} totalTime - Total time available (seconds)
 * @returns {Object} { multiplier, tier, icon, label } - Bonus info
 */
export function calculateSpeedBonus(timeElapsed, totalTime) {
  if (!SPEED_BONUS.ENABLED || timeElapsed <= 0 || totalTime <= 0) {
    return { multiplier: 1, tier: null };
  }

  const percentageUsed = timeElapsed / totalTime;

  // Check tiers in order (fastest to slowest)
  for (const tierConfig of SPEED_BONUS.TIERS) {
    if (percentageUsed <= tierConfig.threshold) {
      return {
        multiplier: tierConfig.multiplier,
        tier: tierConfig.tier,
        icon: tierConfig.icon,
        label: tierConfig.label
      };
    }
  }

  // No bonus if too slow
  return { multiplier: 1, tier: null };
}

/**
 * Calculate points based on correctness and confidence
 * @param {boolean} correct - Whether the answer was correct
 * @param {1|2|3} confidence - Confidence level (1-3)
 * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard', 'mixed')
 * @param {Object} options - Optional enhancements {timeElapsed, totalTime, integrityPenalty}
 * @returns {number|Object} Points or detailed object if options provided
 * @throws {Error} If confidence is not 1, 2, or 3
 */
export function calculatePoints(correct, confidence, difficulty = 'easy', options = null) {
  // Input validation: confidence must be 1, 2, or 3
  if (!confidence || typeof confidence !== 'number' || confidence < 1 || confidence > 3 || !Number.isInteger(confidence)) {
    throw new Error(`Invalid confidence value: ${confidence}. Must be 1, 2, or 3.`);
  }

  // Input validation: correct must be boolean
  if (typeof correct !== 'boolean') {
    throw new Error(`Invalid correct value: ${correct}. Must be a boolean.`);
  }

  // Base points from confidence (safe to access now after validation)
  const basePoints = POINTS_MATRIX[confidence][correct ? 'correct' : 'incorrect'];

  // Apply difficulty multiplier
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1;

  // If no options provided, return simple calculation (backwards compatible)
  if (!options) {
    const total = basePoints * difficultyMultiplier;
    return total > 0 ? Math.round(total) : -Math.round(Math.abs(total));
  }

  // Enhanced calculation with speed bonus
  const speedBonus = (options.timeElapsed !== undefined && options.totalTime !== undefined)
    ? calculateSpeedBonus(options.timeElapsed, options.totalTime)
    : { multiplier: 1, tier: null };

  // Apply all multipliers
  let total = basePoints * difficultyMultiplier * speedBonus.multiplier;

  // Apply integrity penalty (if any)
  if (options.integrityPenalty) {
    total += options.integrityPenalty;
  }

  // Round away from zero for fair scoring
  const finalPoints = total > 0 ? Math.round(total) : -Math.round(Math.abs(total));

  // Return detailed object when options provided
  return {
    points: finalPoints,
    speedBonus: speedBonus.tier ? {
      tier: speedBonus.tier,
      icon: speedBonus.icon,
      label: speedBonus.label,
      multiplier: speedBonus.multiplier,
      bonus: Math.round((basePoints * difficultyMultiplier * speedBonus.multiplier) - (basePoints * difficultyMultiplier))
    } : null,
    breakdown: {
      base: basePoints,
      difficultyMultiplier,
      speedMultiplier: speedBonus.multiplier,
      integrityPenalty: options.integrityPenalty || 0
    }
  };
}

/**
 * Calculate comprehensive game statistics for achievements
 * @param {Array} results - Round results
 * @param {Array} claims - Claims used in the game
 * @param {number} score - Current score
 * @param {number} predictedScore - Player's predicted score
 * @returns {Object} Game statistics
 */
export function calculateGameStats(results, claims, score, predictedScore) {
  const stats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    maxStreak: 0,
    currentStreak: 0,
    aiCaughtCorrect: 0,
    humbleCorrect: 0,      // low confidence + correct
    boldCorrect: 0,        // high confidence + correct
    mixedCorrect: 0,       // MIXED verdicts correct
    mythsBusted: 0,        // myth perpetuation caught
    perfectGame: false,
    gameCompleted: true,
    calibrationBonus: Math.abs(score - predictedScore) <= 2,
    comeback: false,
    lowestPoint: 0
  };

  let runningScore = 0;
  let currentStreak = 0;

  results.forEach((result) => {
    const claim = claims.find(c => c.id === result.claimId);

    if (result.correct) {
      stats.totalCorrect++;
      currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, currentStreak);

      // Track humble/bold correct
      if (result.confidence === 1) stats.humbleCorrect++;
      if (result.confidence === 3) stats.boldCorrect++;

      // Track MIXED correct
      if (claim?.answer === 'MIXED') stats.mixedCorrect++;

      // Track AI catches
      if (claim?.source === 'ai-generated') stats.aiCaughtCorrect++;

      // Track myths busted
      if (claim?.errorPattern === 'Myth perpetuation') stats.mythsBusted++;
    } else {
      stats.totalIncorrect++;
      currentStreak = 0;
    }

    runningScore += result.points;
    stats.lowestPoint = Math.min(stats.lowestPoint, runningScore);
  });

  stats.currentStreak = currentStreak;
  stats.perfectGame = stats.totalCorrect === results.length && results.length > 0;
  stats.comeback = stats.lowestPoint < 0 && score > 0;

  return stats;
}
