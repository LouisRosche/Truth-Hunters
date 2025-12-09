/**
 * ACHIEVEMENTS & BADGES
 * Gamification elements to encourage engagement
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
