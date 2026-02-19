/**
 * ACHIEVEMENTS & BADGES
 * Gamification elements to encourage engagement
 */

import { getClaimsCount } from './claimsLoader';

/**
 * Per-game achievements (earned during a single game session)
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-truth',
    name: 'Truth Seeker',
    description: 'Get your first answer correct',
    icon: '🔍',
    condition: (stats) => stats.totalCorrect >= 1
  },
  {
    id: 'streak-3',
    name: 'On Fire',
    description: 'Get 3 correct answers in a row',
    icon: '🔥',
    condition: (stats) => stats.maxStreak >= 3
  },
  {
    id: 'streak-5',
    name: 'Unstoppable',
    description: 'Get 5 correct answers in a row',
    icon: '⚡',
    condition: (stats) => stats.maxStreak >= 5
  },
  {
    id: 'ai-detector',
    name: 'AI Detector',
    description: 'Correctly identify 3 AI-generated claims',
    icon: '🤖',
    condition: (stats) => stats.aiCaughtCorrect >= 3
  },
  {
    id: 'calibrated',
    name: 'Well Calibrated',
    description: 'Predict your final score within ±2 points',
    icon: '🎯',
    condition: (stats) => stats.calibrationBonus
  },
  {
    id: 'humble-learner',
    name: 'Humble Learner',
    description: 'Use low confidence and get it right 3+ times',
    icon: '🌱',
    condition: (stats) => stats.humbleCorrect >= 3
  },
  {
    id: 'risk-taker',
    name: 'Calculated Risk',
    description: 'Use high confidence and get it right 3+ times',
    icon: '💎',
    condition: (stats) => stats.boldCorrect >= 3
  },
  {
    id: 'perfect-round',
    name: 'Perfect Game',
    description: 'Get every answer correct in a game',
    icon: '👑',
    condition: (stats) => stats.perfectGame
  },
  {
    id: 'myth-buster',
    name: 'Myth Buster',
    description: 'Correctly identify 3 myth perpetuation errors',
    icon: '💥',
    condition: (stats) => stats.mythsBusted >= 3
  },
  {
    id: 'mixed-master',
    name: 'Nuance Navigator',
    description: 'Correctly identify 3 MIXED claims',
    icon: '⚖️',
    condition: (stats) => stats.mixedCorrect >= 3
  },
  {
    id: 'team-player',
    name: 'Team Spirit',
    description: 'Complete a full game with your team',
    icon: '🤝',
    condition: (stats) => stats.gameCompleted
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Win after being in negative points',
    icon: '🚀',
    condition: (stats) => stats.comeback
  }
];

/**
 * Get achievements earned based on game stats
 * @param {Object} stats - Game statistics
 * @returns {Array} Earned achievements
 */
export function getEarnedAchievements(stats) {
  return ACHIEVEMENTS.filter(a => a.condition(stats));
}

/**
 * LIFETIME ACHIEVEMENTS
 * Cumulative achievements that persist across sessions for solo players
 */
export const LIFETIME_ACHIEVEMENTS = [
  // Game milestones
  {
    id: 'lifetime-first-game',
    name: 'First Steps',
    description: 'Complete your first game',
    icon: '🎮',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 1
  },
  {
    id: 'lifetime-10-games',
    name: 'Getting Started',
    description: 'Complete 10 games',
    icon: '🌟',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 10
  },
  {
    id: 'lifetime-25-games',
    name: 'Dedicated Learner',
    description: 'Complete 25 games',
    icon: '📚',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 25
  },
  {
    id: 'lifetime-50-games',
    name: 'Truth Hunter Veteran',
    description: 'Complete 50 games',
    icon: '🏆',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 50
  },
  {
    id: 'lifetime-100-games',
    name: 'Master Truth Hunter',
    description: 'Complete 100 games',
    icon: '👑',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 100
  },

  // Accuracy milestones
  {
    id: 'lifetime-100-correct',
    name: 'Century Club',
    description: 'Get 100 answers correct',
    icon: '💯',
    category: 'accuracy',
    condition: (stats) => stats.totalCorrect >= 100
  },
  {
    id: 'lifetime-500-correct',
    name: 'Knowledge Seeker',
    description: 'Get 500 answers correct',
    icon: '🧠',
    category: 'accuracy',
    condition: (stats) => stats.totalCorrect >= 500
  },
  {
    id: 'lifetime-1000-correct',
    name: 'Walking Encyclopedia',
    description: 'Get 1000 answers correct',
    icon: '📖',
    category: 'accuracy',
    condition: (stats) => stats.totalCorrect >= 1000
  },

  // Streak achievements
  {
    id: 'lifetime-streak-7',
    name: 'Hot Streak',
    description: 'Achieve a 7-answer streak',
    icon: '🔥',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 7
  },
  {
    id: 'lifetime-streak-10',
    name: 'Unstoppable Force',
    description: 'Achieve a 10-answer streak',
    icon: '⚡',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 10
  },
  {
    id: 'lifetime-day-streak-3',
    name: 'Three Day Warrior',
    description: 'Play for 3 days in a row',
    icon: '📅',
    category: 'dedication',
    condition: (stats) => stats.currentDayStreak >= 3
  },
  {
    id: 'lifetime-day-streak-7',
    name: 'Week Warrior',
    description: 'Play for 7 days in a row',
    icon: '🗓️',
    category: 'dedication',
    condition: (stats) => stats.currentDayStreak >= 7
  },
  {
    id: 'lifetime-day-streak-30',
    name: 'Monthly Master',
    description: 'Play for 30 days in a row',
    icon: '🌙',
    category: 'dedication',
    condition: (stats) => stats.currentDayStreak >= 30
  },

  // Calibration achievements
  {
    id: 'lifetime-calibrated-5',
    name: 'Self-Aware',
    description: 'Predict your score within +/-2 five times',
    icon: '🎯',
    category: 'calibration',
    condition: (stats) => (stats.calibratedPredictions || 0) >= 5
  },
  {
    id: 'lifetime-calibrated-20',
    name: 'Master Calibrator',
    description: 'Predict your score within +/-2 twenty times',
    icon: '🔮',
    category: 'calibration',
    condition: (stats) => (stats.calibratedPredictions || 0) >= 20
  },

  // Subject mastery
  {
    id: 'lifetime-subject-master',
    name: 'Subject Expert',
    description: 'Achieve 80%+ accuracy in any subject (min 10 questions)',
    icon: '🎓',
    category: 'mastery',
    condition: (stats) => {
      if (!stats.subjectStats) return false;
      return Object.values(stats.subjectStats).some(s => {
        const total = s.correct + s.incorrect;
        return total >= 10 && (s.correct / total) >= 0.8;
      });
    }
  },
  {
    id: 'lifetime-polymath',
    name: 'Polymath',
    description: 'Play questions from 10+ different subjects',
    icon: '🌐',
    category: 'mastery',
    condition: (stats) => Object.keys(stats.subjectStats || {}).length >= 10
  },

  // Explorer achievements
  {
    id: 'lifetime-explorer-25',
    name: 'Curious Mind',
    description: 'See 25 different claims',
    icon: '🔍',
    category: 'explorer',
    condition: (stats) => stats.claimsSeen >= 25
  },
  {
    id: 'lifetime-explorer-50',
    name: 'Truth Explorer',
    description: 'See 50 different claims',
    icon: '🗺️',
    category: 'explorer',
    condition: (stats) => stats.claimsSeen >= 50
  },
  {
    id: 'lifetime-explorer-100',
    name: 'Claim Collector',
    description: 'See 100 different claims',
    icon: '📜',
    category: 'explorer',
    condition: (stats) => stats.claimsSeen >= 100
  },
  {
    id: 'lifetime-explorer-all',
    name: 'Seen It All',
    description: 'See every claim in the game',
    icon: '🌟',
    category: 'explorer',
    condition: (stats) => {
      const total = getClaimsCount();
      // Only award if we know the actual count and player has seen them all
      return total !== null && stats.claimsSeen >= total;
    }
  },

  // Score achievements
  {
    id: 'lifetime-score-20',
    name: 'High Scorer',
    description: 'Score 20+ points in a single game',
    icon: '⭐',
    category: 'score',
    condition: (stats) => stats.bestScore >= 20
  },
  {
    id: 'lifetime-score-30',
    name: 'Star Performer',
    description: 'Score 30+ points in a single game',
    icon: '💫',
    category: 'score',
    condition: (stats) => stats.bestScore >= 30
  },
  {
    id: 'lifetime-score-50',
    name: 'Legendary Score',
    description: 'Score 50+ points in a single game',
    icon: '🏅',
    category: 'score',
    condition: (stats) => stats.bestScore >= 50
  },

  // Confidence achievements
  {
    id: 'lifetime-bold-master',
    name: 'Bold and Right',
    description: 'Get 25 high-confidence answers correct',
    icon: '💎',
    category: 'confidence',
    condition: (stats) => stats.highConfidenceCorrect >= 25
  },
  {
    id: 'lifetime-humble-master',
    name: 'Wisely Cautious',
    description: 'Get 25 low-confidence answers correct',
    icon: '🌱',
    category: 'confidence',
    condition: (stats) => stats.lowConfidenceCorrect >= 25
  },

  // Points milestones
  {
    id: 'lifetime-points-100',
    name: 'Point Collector',
    description: 'Earn 100 total points',
    icon: '💰',
    category: 'points',
    condition: (stats) => stats.totalPoints >= 100
  },
  {
    id: 'lifetime-points-500',
    name: 'Point Hoarder',
    description: 'Earn 500 total points',
    icon: '💎',
    category: 'points',
    condition: (stats) => stats.totalPoints >= 500
  },
  {
    id: 'lifetime-points-1000',
    name: 'Point Master',
    description: 'Earn 1000 total points',
    icon: '👑',
    category: 'points',
    condition: (stats) => stats.totalPoints >= 1000
  }
];

/**
 * Get newly earned lifetime achievements
 * @param {Object} profileStats - Player profile stats
 * @param {Array} alreadyEarned - Achievement IDs already earned
 * @returns {Array} Newly earned achievements
 */
export function getNewLifetimeAchievements(profileStats, alreadyEarned = []) {
  return LIFETIME_ACHIEVEMENTS.filter(a =>
    !alreadyEarned.includes(a.id) && a.condition(profileStats)
  );
}

/**
 * Get all earned lifetime achievements
 * @param {Object} profileStats - Player profile stats
 * @returns {Array} All earned achievements
 */
export function getAllEarnedLifetimeAchievements(profileStats) {
  return LIFETIME_ACHIEVEMENTS.filter(a => a.condition(profileStats));
}

/**
 * Get achievement by ID (from either list)
 */
export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) ||
         LIFETIME_ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Achievement categories for display grouping
 */
export const ACHIEVEMENT_CATEGORIES = {
  milestone: { name: 'Milestones', icon: '🎮', color: 'var(--accent-cyan)' },
  accuracy: { name: 'Accuracy', icon: '🎯', color: 'var(--accent-emerald)' },
  streak: { name: 'Streaks', icon: '🔥', color: 'var(--accent-amber)' },
  dedication: { name: 'Dedication', icon: '📅', color: 'var(--accent-violet)' },
  calibration: { name: 'Calibration', icon: '🔮', color: 'var(--accent-rose)' },
  mastery: { name: 'Mastery', icon: '🎓', color: 'var(--accent-cyan)' },
  explorer: { name: 'Explorer', icon: '🔍', color: 'var(--accent-amber)' },
  score: { name: 'Scoring', icon: '⭐', color: 'var(--accent-emerald)' },
  confidence: { name: 'Confidence', icon: '💎', color: 'var(--accent-violet)' },
  points: { name: 'Points', icon: '💰', color: 'var(--accent-amber)' }
};
