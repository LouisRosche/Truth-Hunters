/**
 * GAME STATE MANAGER
 * Handles mid-game state persistence to localStorage for crash recovery
 */

const STORAGE_KEY = 'truthHunters_savedGame';

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

export const GameStateManager = {
  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable() {
    return LOCAL_STORAGE_AVAILABLE;
  },

  /**
   * Save current game state
   * @param {Object} gameState - Current game state
   * @param {number} currentStreak - Current streak count
   * @returns {boolean} True if save was successful
   */
  save(gameState, currentStreak = 0) {
    if (!LOCAL_STORAGE_AVAILABLE) {
      return false;
    }

    // Only save during active gameplay
    if (gameState.phase !== 'playing') {
      return false;
    }

    try {
      const saveData = {
        gameState,
        currentStreak,
        savedAt: Date.now(),
        version: 1 // For future migration support
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.warn('Failed to save game state:', e);
      return false;
    }
  },

  /**
   * Load saved game state
   * @returns {Object|null} Saved game data or null if none exists
   */
  load() {
    if (!LOCAL_STORAGE_AVAILABLE) {
      return null;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        this.clear();
        return null;
      }

      // Check version for future migration
      if (parsed.version !== 1) {
        console.warn('Saved game version mismatch, clearing');
        this.clear();
        return null;
      }

      // Validate game state exists and is in playing phase
      if (!parsed.gameState || parsed.gameState.phase !== 'playing') {
        this.clear();
        return null;
      }

      // Check if save is too old (24 hours)
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.savedAt > MAX_AGE) {
        console.log('Saved game too old, clearing');
        this.clear();
        return null;
      }

      // Validate required game state fields
      const gs = parsed.gameState;
      if (
        typeof gs.currentRound !== 'number' ||
        typeof gs.totalRounds !== 'number' ||
        !Array.isArray(gs.claims) ||
        !gs.team
      ) {
        console.warn('Saved game state invalid, clearing');
        this.clear();
        return null;
      }

      return parsed;
    } catch (e) {
      console.warn('Failed to load saved game:', e);
      this.clear();
      return null;
    }
  },

  /**
   * Check if a saved game exists
   * @returns {boolean}
   */
  hasSavedGame() {
    return this.load() !== null;
  },

  /**
   * Clear saved game state
   */
  clear() {
    if (!LOCAL_STORAGE_AVAILABLE) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear saved game:', e);
    }
  },

  /**
   * Get a summary of the saved game for display
   * @returns {Object|null} Summary object or null
   */
  getSummary() {
    const saved = this.load();
    if (!saved) return null;

    const { gameState, savedAt } = saved;
    const timeSince = Date.now() - savedAt;
    const minutesAgo = Math.floor(timeSince / 60000);
    const hoursAgo = Math.floor(timeSince / 3600000);

    let timeAgoText;
    if (minutesAgo < 1) {
      timeAgoText = 'just now';
    } else if (minutesAgo < 60) {
      timeAgoText = `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    } else {
      timeAgoText = `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
    }

    return {
      teamName: gameState.team.name || 'Team',
      currentRound: gameState.currentRound,
      totalRounds: gameState.totalRounds,
      score: gameState.team.score,
      savedAt,
      timeAgoText,
      playerCount: gameState.team.players?.length || 0
    };
  }
};
