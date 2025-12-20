/**
 * ANALYTICS SERVICE
 * Tracks game events and learning progression locally
 * Designed to be privacy-friendly - no external tracking
 * Users can opt-out via settings
 */

import { logger } from '../utils/logger';

const ANALYTICS_KEY = 'truthHunters_analytics';
const ANALYTICS_ENABLED_KEY = 'truthHunters_analytics_enabled';

/**
 * Analytics Event Types
 */
export const AnalyticsEvents = {
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  ROUND_COMPLETED: 'round_completed',
  HINT_USED: 'hint_used',
  ACHIEVEMENT_EARNED: 'achievement_earned',
  REFLECTION_SUBMITTED: 'reflection_submitted',
  STREAK_ACHIEVED: 'streak_achieved'
};

/**
 * Analytics Manager
 * Tracks game events locally for teacher insights
 */
export const Analytics = {
  /**
   * Check if analytics is enabled (user has not opted out)
   * @returns {boolean} True if analytics is enabled
   */
  isEnabled() {
    try {
      const setting = localStorage.getItem(ANALYTICS_ENABLED_KEY);
      // Default to enabled if not set
      return setting === null ? true : setting === 'true';
    } catch (e) {
      return true; // Default enabled if localStorage unavailable
    }
  },

  /**
   * Enable or disable analytics tracking
   * @param {boolean} enabled - Whether to enable analytics
   */
  setEnabled(enabled) {
    try {
      localStorage.setItem(ANALYTICS_ENABLED_KEY, String(enabled));
    } catch (e) {
      logger.warn('Failed to save analytics preference:', e);
    }
  },

  /**
   * Get all analytics data
   * @returns {Object} Analytics data
   */
  getData() {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultData();
    } catch (e) {
      logger.warn('Failed to read analytics:', e);
      return this.getDefaultData();
    }
  },

  /**
   * Get default analytics data structure
   */
  getDefaultData() {
    return {
      totalGamesStarted: 0,
      totalGamesCompleted: 0,
      totalRoundsPlayed: 0,
      totalCorrectAnswers: 0,
      totalIncorrectAnswers: 0,
      hintsUsed: { source: 0, error: 0, subject: 0 },
      achievementsEarned: {},
      streakData: { maxStreak: 0, streakCounts: {} },
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0, mixed: 0 },
      subjectPerformance: {},
      sessionHistory: [],
      firstPlayDate: null,
      lastPlayDate: null
    };
  },

  /**
   * Save analytics data
   * @param {Object} data - Analytics data to save
   */
  saveData(data) {
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
    } catch (e) {
      logger.warn('Failed to save analytics:', e);
    }
  },

  /**
   * Track an event
   * @param {string} eventType - Type of event from AnalyticsEvents
   * @param {Object} eventData - Additional event data
   */
  track(eventType, eventData = {}) {
    // Check if user has opted out of analytics
    if (!this.isEnabled()) {
      return; // Silently skip tracking if disabled
    }

    const data = this.getData();
    const now = Date.now();

    // Update timestamps
    if (!data.firstPlayDate) data.firstPlayDate = now;
    data.lastPlayDate = now;

    switch (eventType) {
      case AnalyticsEvents.GAME_STARTED:
        data.totalGamesStarted++;
        if (eventData.difficulty) {
          data.difficultyBreakdown[eventData.difficulty] =
            (data.difficultyBreakdown[eventData.difficulty] || 0) + 1;
        }
        break;

      case AnalyticsEvents.GAME_COMPLETED:
        data.totalGamesCompleted++;
        // Add to session history (keep last 50)
        data.sessionHistory.push({
          timestamp: now,
          score: eventData.score || 0,
          accuracy: eventData.accuracy || 0,
          difficulty: eventData.difficulty || 'mixed',
          rounds: eventData.rounds || 0
        });
        if (data.sessionHistory.length > 50) {
          data.sessionHistory = data.sessionHistory.slice(-50);
        }
        break;

      case AnalyticsEvents.ROUND_COMPLETED:
        data.totalRoundsPlayed++;
        if (eventData.correct) {
          data.totalCorrectAnswers++;
        } else {
          data.totalIncorrectAnswers++;
        }
        // Track subject performance
        if (eventData.subject) {
          if (!data.subjectPerformance[eventData.subject]) {
            data.subjectPerformance[eventData.subject] = { correct: 0, incorrect: 0 };
          }
          if (eventData.correct) {
            data.subjectPerformance[eventData.subject].correct++;
          } else {
            data.subjectPerformance[eventData.subject].incorrect++;
          }
        }
        break;

      case AnalyticsEvents.HINT_USED:
        if (eventData.hintType === 'source-hint') data.hintsUsed.source++;
        else if (eventData.hintType === 'error-hint') data.hintsUsed.error++;
        else if (eventData.hintType === 'subject-hint') data.hintsUsed.subject++;
        break;

      case AnalyticsEvents.ACHIEVEMENT_EARNED:
        if (eventData.achievementId) {
          data.achievementsEarned[eventData.achievementId] =
            (data.achievementsEarned[eventData.achievementId] || 0) + 1;
        }
        break;

      case AnalyticsEvents.STREAK_ACHIEVED:
        if (eventData.streak) {
          if (eventData.streak > data.streakData.maxStreak) {
            data.streakData.maxStreak = eventData.streak;
          }
          const streakKey = `streak_${eventData.streak}`;
          data.streakData.streakCounts[streakKey] =
            (data.streakData.streakCounts[streakKey] || 0) + 1;
        }
        break;

      case AnalyticsEvents.REFLECTION_SUBMITTED:
        // Track reflection submissions (count only, no content)
        data.reflectionsSubmitted = (data.reflectionsSubmitted || 0) + 1;
        break;

      default:
        logger.warn('Unknown analytics event:', eventType);
    }

    this.saveData(data);
  },

  /**
   * Get summary statistics
   * @returns {Object} Summary stats for display
   */
  getSummary() {
    const data = this.getData();
    const totalAnswers = data.totalCorrectAnswers + data.totalIncorrectAnswers;
    const accuracy = totalAnswers > 0
      ? Math.round((data.totalCorrectAnswers / totalAnswers) * 100)
      : 0;

    // Calculate subject strengths and weaknesses
    const subjectStats = Object.entries(data.subjectPerformance).map(([subject, stats]) => {
      const total = stats.correct + stats.incorrect;
      const subjectAccuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
      return { subject, ...stats, accuracy: subjectAccuracy, total };
    }).sort((a, b) => b.total - a.total);

    const strongSubjects = subjectStats.filter(s => s.accuracy >= 70 && s.total >= 3);
    const weakSubjects = subjectStats.filter(s => s.accuracy < 50 && s.total >= 3);

    return {
      gamesPlayed: data.totalGamesCompleted,
      gamesStarted: data.totalGamesStarted,
      completionRate: data.totalGamesStarted > 0
        ? Math.round((data.totalGamesCompleted / data.totalGamesStarted) * 100)
        : 0,
      totalRounds: data.totalRoundsPlayed,
      accuracy,
      maxStreak: data.streakData.maxStreak,
      hintsUsed: data.hintsUsed.source + data.hintsUsed.error + data.hintsUsed.subject,
      achievementsUnlocked: Object.keys(data.achievementsEarned).length,
      strongSubjects: strongSubjects.slice(0, 3).map(s => s.subject),
      weakSubjects: weakSubjects.slice(0, 3).map(s => s.subject),
      daysSinceFirstPlay: data.firstPlayDate
        ? Math.floor((Date.now() - data.firstPlayDate) / (1000 * 60 * 60 * 24))
        : 0,
      recentSessions: data.sessionHistory.slice(-5).reverse()
    };
  },

  /**
   * Export analytics data as JSON
   * @returns {string} JSON string of analytics
   */
  exportData() {
    return JSON.stringify(this.getData(), null, 2);
  },

  /**
   * Reset all analytics data
   */
  reset() {
    this.saveData(this.getDefaultData());
  }
};
