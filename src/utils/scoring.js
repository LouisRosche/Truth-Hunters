/**
 * SCORING UTILITIES
 * Functions for calculating points and game statistics
 */

/**
 * Calculate points based on correctness and confidence
 * @param {boolean} correct - Whether the answer was correct
 * @param {1|2|3} confidence - Confidence level (1-3)
 * @returns {number} Points earned/lost
 */
export function calculatePoints(correct, confidence) {
  const pointsMatrix = {
    1: { correct: 1, incorrect: -1 },
    2: { correct: 3, incorrect: -3 },
    3: { correct: 5, incorrect: -6 }
  };
  return pointsMatrix[confidence][correct ? 'correct' : 'incorrect'];
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
