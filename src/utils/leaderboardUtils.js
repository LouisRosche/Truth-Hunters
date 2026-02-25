/**
 * LEADERBOARD UTILITIES
 * Shared logic for leaderboard aggregation and player statistics
 */

/**
 * Aggregate player scores from game records
 * Players on the same team share the team's score
 * @param {Array} records - Game records with players and scores
 * @returns {Array} Aggregated player statistics
 */
export function aggregatePlayerScores(records) {
  const playerScores = {};

  records.forEach(game => {
    if (!game.players) return;

    game.players.forEach(player => {
      const key = `${player.firstName}_${player.lastInitial}`.toLowerCase();
      const displayName = `${player.firstName} ${player.lastInitial}.`;

      if (!playerScores[key]) {
        playerScores[key] = {
          displayName,
          totalScore: 0,
          gamesPlayed: 0,
          bestScore: -Infinity
        };
      }

      // Each player on the team shares the team's score
      playerScores[key].totalScore += game.score;
      playerScores[key].gamesPlayed += 1;
      playerScores[key].bestScore = Math.max(playerScores[key].bestScore, game.score);
    });
  });

  return Object.values(playerScores)
    .filter(p => p.gamesPlayed > 0) // Guard against division by zero
    .map(p => ({
      ...p,
      avgScore: Math.round(p.totalScore / p.gamesPlayed)
    }))
    .sort((a, b) => b.bestScore - a.bestScore);
}

/**
 * Get top players from aggregated scores
 * @param {Array} records - Game records
 * @param {number} limit - Number of top players to return
 * @returns {Array} Top player records
 */
export function getTopPlayers(records, limit = 10) {
  const aggregated = aggregatePlayerScores(records);
  return aggregated.slice(0, limit);
}
