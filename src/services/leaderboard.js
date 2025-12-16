/**
 * LEADERBOARD MANAGER
 * Handles local storage of game records
 */

import { sanitizeInput, isContentAppropriate } from '../utils/moderation';
import { formatPlayerName } from '../utils/helpers';

const STORAGE_KEY = 'truthHunters_leaderboard';

/**
 * Check if localStorage is available and working
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Cache the result since it won't change during session
const LOCAL_STORAGE_AVAILABLE = isLocalStorageAvailable();

export const LeaderboardManager = {
  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable() {
    return LOCAL_STORAGE_AVAILABLE;
  },

  /**
   * Get all game records from localStorage
   * Includes validation and corruption recovery
   * @returns {Array} Game records
   */
  getAll() {
    if (!LOCAL_STORAGE_AVAILABLE) {
      return [];
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);

      // Validate that it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Leaderboard data is not an array, resetting');
        this.clear();
        return [];
      }

      // Filter out corrupted entries and validate required fields
      const validated = parsed.filter(record => {
        // Must be an object
        if (!record || typeof record !== 'object') return false;
        // Must have required fields
        if (typeof record.score !== 'number') return false;
        if (typeof record.timestamp !== 'number') return false;
        // Team name must be a string (can be empty)
        if (typeof record.teamName !== 'string') record.teamName = 'Unknown Team';
        // Players must be an array
        if (!Array.isArray(record.players)) record.players = [];
        // Sanitize player entries
        record.players = record.players.filter(p =>
          p && typeof p === 'object' &&
          typeof p.firstName === 'string' &&
          typeof p.lastInitial === 'string'
        );
        return true;
      });

      // If we filtered out corrupted entries, save the cleaned data
      if (validated.length !== parsed.length) {
        console.warn(`Removed ${parsed.length - validated.length} corrupted leaderboard entries`);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
        } catch (e) {
          // Ignore save errors during cleanup
        }
      }

      return validated;
    } catch (e) {
      console.warn('Failed to load leaderboard (data may be corrupted):', e);
      // Attempt to clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        // Ignore
      }
      return [];
    }
  },

  /**
   * Save a new game record
   * @param {Object} record - Game record to save
   * @returns {boolean} True if save was successful
   */
  save(record) {
    try {
      const records = this.getAll();

      // Sanitize team name and player names before saving
      const sanitizedRecord = {
        ...record,
        teamName: sanitizeInput(record.teamName || 'Team'),
        players: (record.players || []).map(p => ({
          firstName: sanitizeInput(p.firstName || ''),
          lastInitial: sanitizeInput(p.lastInitial || ''),
          displayName: sanitizeInput(formatPlayerName(p.firstName, p.lastInitial))
        })),
        id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        timestamp: Date.now()
      };

      // Validate content before saving
      if (!isContentAppropriate(sanitizedRecord.teamName)) {
        sanitizedRecord.teamName = 'Team';
      }

      sanitizedRecord.players = sanitizedRecord.players.filter(p =>
        isContentAppropriate(p.firstName) && isContentAppropriate(p.lastInitial)
      );

      records.push(sanitizedRecord);

      // Keep only last 100 games to prevent storage bloat
      const trimmed = records.slice(-100);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (quotaError) {
        // Handle quota exceeded - try to save fewer records
        if (quotaError.name === 'QuotaExceededError' ||
            quotaError.code === 22 ||
            quotaError.code === 1014) {
          console.warn('Storage quota exceeded, reducing stored games');
          // Keep only last 50 games
          const reduced = trimmed.slice(-50);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
          } catch (retryError) {
            // Last resort: keep only last 10 games
            const minimal = trimmed.slice(-10);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
          }
        } else {
          throw quotaError;
        }
      }
      return true;
    } catch (e) {
      console.warn('Failed to save to leaderboard:', e);
      return false;
    }
  },

  /**
   * Get top teams by score
   * @param {number} limit - Number of teams to return
   * @returns {Array} Top team records
   */
  getTopTeams(limit = 10) {
    const records = this.getAll();
    return records
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /**
   * Get top players by aggregated score
   * @param {number} limit - Number of players to return
   * @returns {Array} Top player records
   */
  getTopPlayers(limit = 10) {
    const records = this.getAll();
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
            bestScore: 0
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
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, limit);
  },

  /**
   * Get recent games
   * @param {number} limit - Number of games to return
   * @returns {Array} Recent game records
   */
  getRecent(limit = 10) {
    const records = this.getAll();
    return records
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  /**
   * Clear all records (for testing)
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear leaderboard:', e);
    }
  },

  /**
   * Get leaderboard statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const records = this.getAll();

    if (records.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        highestScore: 0,
        averageAccuracy: 0
      };
    }

    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalAccuracy = records.reduce((sum, r) => sum + (r.accuracy || 0), 0);
    const highestScore = Math.max(...records.map(r => r.score || 0));

    return {
      totalGames: records.length,
      averageScore: Math.round(totalScore / records.length),
      highestScore,
      averageAccuracy: totalAccuracy / records.length
    };
  }
};
