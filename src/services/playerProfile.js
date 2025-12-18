/**
 * PLAYER PROFILE SERVICE
 * Persistent player profile for solo learners
 * Tracks lifetime stats, achievements, and learning progress
 */

import { logger } from '../utils/logger';

const STORAGE_KEY = 'truthHunters_playerProfile';
const PROFILE_VERSION = 1;

/**
 * Default profile structure
 */
function createDefaultProfile() {
  return {
    version: PROFILE_VERSION,
    createdAt: Date.now(),
    lastPlayedAt: null,

    // Player identity
    playerName: '',
    avatar: null,

    // Lifetime stats
    stats: {
      totalGames: 0,
      totalRounds: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalPoints: 0,
      bestScore: 0,
      bestStreak: 0,
      currentDayStreak: 0,
      lastPlayDate: null,

      // Calibration tracking
      totalPredictions: 0,
      calibratedPredictions: 0, // Within +/- 2

      // Confidence patterns
      highConfidenceCorrect: 0,
      highConfidenceIncorrect: 0,
      lowConfidenceCorrect: 0,
      lowConfidenceIncorrect: 0,
    },

    // Subject performance: { [subject]: { correct, incorrect, lastPlayed } }
    subjectStats: {},

    // Error pattern performance: { [patternId]: { encountered, caught } }
    errorPatternStats: {},

    // Claims seen: Set of claim IDs (stored as array for JSON)
    claimsSeen: [],

    // Lifetime achievements earned (by ID)
    lifetimeAchievements: [],

    // Recent game history (last 10 games)
    recentGames: [],

    // Preferences
    preferences: {
      defaultDifficulty: 'mixed',
      defaultRounds: 5,
      soundEnabled: true,
      lastSubjects: []
    }
  };
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const testKey = '__profile_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const LOCAL_STORAGE_AVAILABLE = isLocalStorageAvailable();

/**
 * Player Profile Manager
 */
export const PlayerProfile = {
  /**
   * Check if storage is available
   */
  isAvailable() {
    return LOCAL_STORAGE_AVAILABLE;
  },

  /**
   * Check if a profile exists
   */
  exists() {
    if (!LOCAL_STORAGE_AVAILABLE) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },

  /**
   * Get the current profile (creates default if none exists)
   */
  get() {
    if (!LOCAL_STORAGE_AVAILABLE) {
      return createDefaultProfile();
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return createDefaultProfile();
      }

      const profile = JSON.parse(data);

      // Migrate old profiles if needed
      if (!profile.version || profile.version < PROFILE_VERSION) {
        return this._migrate(profile);
      }

      return profile;
    } catch (e) {
      logger.warn('Failed to load player profile:', e);
      return createDefaultProfile();
    }
  },

  /**
   * Save the profile
   */
  save(profile) {
    if (!LOCAL_STORAGE_AVAILABLE) return false;

    try {
      profile.version = PROFILE_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      logger.warn('Failed to save player profile:', e);
      return false;
    }
  },

  /**
   * Update player identity
   */
  updateIdentity(playerName, avatar) {
    const profile = this.get();
    profile.playerName = playerName;
    profile.avatar = avatar;
    return this.save(profile);
  },

  /**
   * Record a completed game
   */
  recordGame(gameData) {
    const profile = this.get();
    const now = Date.now();
    const today = new Date().toDateString();

    // Update last played
    profile.lastPlayedAt = now;

    // Update day streak
    const lastPlayDate = profile.stats.lastPlayDate;
    if (lastPlayDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = new Date(lastPlayDate).toDateString() === yesterday.toDateString();
      const wasToday = lastPlayDate === today;

      if (wasYesterday) {
        profile.stats.currentDayStreak++;
      } else if (!wasToday) {
        profile.stats.currentDayStreak = 1;
      }
    } else {
      profile.stats.currentDayStreak = 1;
    }
    profile.stats.lastPlayDate = today;

    // Update basic stats
    profile.stats.totalGames++;
    profile.stats.totalRounds += gameData.rounds.length;
    profile.stats.totalPoints += gameData.finalScore;
    profile.stats.bestScore = Math.max(profile.stats.bestScore, gameData.finalScore);
    profile.stats.bestStreak = Math.max(profile.stats.bestStreak, gameData.maxStreak || 0);

    // Update correct/incorrect counts
    const correct = gameData.rounds.filter(r => r.correct).length;
    const incorrect = gameData.rounds.length - correct;
    profile.stats.totalCorrect += correct;
    profile.stats.totalIncorrect += incorrect;

    // Update calibration stats
    if (gameData.predictedScore !== undefined) {
      profile.stats.totalPredictions++;
      if (Math.abs(gameData.finalScore - gameData.predictedScore) <= 2) {
        profile.stats.calibratedPredictions++;
      }
    }

    // Update confidence patterns
    gameData.rounds.forEach(round => {
      if (round.confidence === 3) {
        if (round.correct) {
          profile.stats.highConfidenceCorrect++;
        } else {
          profile.stats.highConfidenceIncorrect++;
        }
      } else if (round.confidence === 1) {
        if (round.correct) {
          profile.stats.lowConfidenceCorrect++;
        } else {
          profile.stats.lowConfidenceIncorrect++;
        }
      }
    });

    // Update subject stats
    gameData.claims.forEach((claim, i) => {
      const round = gameData.rounds[i];
      if (!round) return;

      const subject = claim.subject;
      if (!profile.subjectStats[subject]) {
        profile.subjectStats[subject] = { correct: 0, incorrect: 0, lastPlayed: now };
      }

      if (round.correct) {
        profile.subjectStats[subject].correct++;
      } else {
        profile.subjectStats[subject].incorrect++;
      }
      profile.subjectStats[subject].lastPlayed = now;
    });

    // Update error pattern stats
    gameData.claims.forEach((claim, i) => {
      const round = gameData.rounds[i];
      if (!round || !claim.errorPattern) return;

      const patternId = claim.errorPattern;
      if (!profile.errorPatternStats[patternId]) {
        profile.errorPatternStats[patternId] = { encountered: 0, caught: 0 };
      }

      profile.errorPatternStats[patternId].encountered++;
      if (round.correct) {
        profile.errorPatternStats[patternId].caught++;
      }
    });

    // Track claims seen
    gameData.claims.forEach(claim => {
      if (!profile.claimsSeen.includes(claim.id)) {
        profile.claimsSeen.push(claim.id);
      }
    });

    // Add to recent games (keep last 20)
    profile.recentGames.unshift({
      timestamp: now,
      score: gameData.finalScore,
      rounds: gameData.rounds.length,
      correct: correct,
      difficulty: gameData.difficulty,
      maxStreak: gameData.maxStreak || 0,
      achievements: gameData.achievements || []
    });
    profile.recentGames = profile.recentGames.slice(0, 20);

    // Update preferences based on last game
    profile.preferences.defaultDifficulty = gameData.difficulty;
    profile.preferences.defaultRounds = gameData.rounds.length;
    if (gameData.subjects && gameData.subjects.length > 0) {
      profile.preferences.lastSubjects = gameData.subjects;
    }

    return this.save(profile);
  },

  /**
   * Award a lifetime achievement
   */
  awardAchievement(achievementId) {
    const profile = this.get();
    if (!profile.lifetimeAchievements.includes(achievementId)) {
      profile.lifetimeAchievements.push(achievementId);
      return this.save(profile);
    }
    return true;
  },

  /**
   * Get computed stats for display
   */
  getDisplayStats() {
    const profile = this.get();
    const stats = profile.stats;

    // Calculate accuracy
    const totalAttempts = stats.totalCorrect + stats.totalIncorrect;
    const accuracy = totalAttempts > 0
      ? Math.round((stats.totalCorrect / totalAttempts) * 100)
      : 0;

    // Calculate calibration rate
    const calibrationRate = stats.totalPredictions > 0
      ? Math.round((stats.calibratedPredictions / stats.totalPredictions) * 100)
      : 0;

    // Calculate high confidence accuracy
    const highConfTotal = stats.highConfidenceCorrect + stats.highConfidenceIncorrect;
    const highConfAccuracy = highConfTotal > 0
      ? Math.round((stats.highConfidenceCorrect / highConfTotal) * 100)
      : 0;

    // Get best and worst subjects
    const subjects = Object.entries(profile.subjectStats)
      .map(([name, data]) => ({
        name,
        correct: data.correct,
        incorrect: data.incorrect,
        total: data.correct + data.incorrect,
        accuracy: data.correct + data.incorrect > 0
          ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
          : 0
      }))
      .filter(s => s.total >= 3) // Need at least 3 attempts
      .sort((a, b) => b.accuracy - a.accuracy);

    const bestSubjects = subjects.slice(0, 3);
    const worstSubjects = [...subjects].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

    // Get error patterns sorted by catch rate
    const errorPatterns = Object.entries(profile.errorPatternStats)
      .map(([id, data]) => ({
        id,
        encountered: data.encountered,
        caught: data.caught,
        catchRate: data.encountered > 0
          ? Math.round((data.caught / data.encountered) * 100)
          : 0
      }))
      .filter(p => p.encountered >= 2)
      .sort((a, b) => a.catchRate - b.catchRate);

    const hardestPatterns = errorPatterns.slice(0, 3);
    const easiestPatterns = [...errorPatterns].sort((a, b) => b.catchRate - a.catchRate).slice(0, 3);

    // Calculate claims seen percentage (of 150 total)
    const claimsSeenPercent = Math.round((profile.claimsSeen.length / 150) * 100);

    return {
      playerName: profile.playerName,
      avatar: profile.avatar,
      createdAt: profile.createdAt,
      lastPlayedAt: profile.lastPlayedAt,

      // Core stats
      totalGames: stats.totalGames,
      totalRounds: stats.totalRounds,
      totalCorrect: stats.totalCorrect,
      totalPoints: stats.totalPoints,
      bestScore: stats.bestScore,
      bestStreak: stats.bestStreak,
      currentDayStreak: stats.currentDayStreak,
      accuracy,

      // Calibration
      calibrationRate,
      totalPredictions: stats.totalPredictions,

      // Confidence
      highConfAccuracy,
      highConfTotal,

      // Subject analysis
      bestSubjects,
      worstSubjects,
      subjectCount: Object.keys(profile.subjectStats).length,

      // Error patterns
      hardestPatterns,
      easiestPatterns,

      // Progress
      claimsSeen: profile.claimsSeen.length,
      claimsSeenPercent,
      totalClaims: 150,

      // Achievements
      lifetimeAchievements: profile.lifetimeAchievements,

      // Recent games
      recentGames: profile.recentGames,

      // Preferences
      preferences: profile.preferences
    };
  },

  /**
   * Get quick start settings (for returning players)
   */
  getQuickStartSettings() {
    const profile = this.get();
    return {
      playerName: profile.playerName,
      avatar: profile.avatar,
      difficulty: profile.preferences.defaultDifficulty,
      rounds: profile.preferences.defaultRounds,
      soundEnabled: profile.preferences.soundEnabled,
      subjects: profile.preferences.lastSubjects
    };
  },

  /**
   * Update sound preference
   */
  setSoundEnabled(enabled) {
    const profile = this.get();
    profile.preferences.soundEnabled = enabled;
    return this.save(profile);
  },

  /**
   * Clear profile (for testing)
   */
  clear() {
    if (!LOCAL_STORAGE_AVAILABLE) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      logger.warn('Failed to clear player profile:', e);
    }
  },

  /**
   * Migrate old profile versions
   */
  _migrate(oldProfile) {
    // For now, merge with defaults
    const newProfile = createDefaultProfile();

    // Preserve what we can
    if (oldProfile.playerName) newProfile.playerName = oldProfile.playerName;
    if (oldProfile.avatar) newProfile.avatar = oldProfile.avatar;
    if (oldProfile.stats) {
      Object.assign(newProfile.stats, oldProfile.stats);
    }
    if (oldProfile.subjectStats) {
      newProfile.subjectStats = oldProfile.subjectStats;
    }
    if (oldProfile.lifetimeAchievements) {
      newProfile.lifetimeAchievements = oldProfile.lifetimeAchievements;
    }

    this.save(newProfile);
    return newProfile;
  }
};
