/**
 * GAME CONSTANTS
 * Configuration values and static data
 */

/**
 * Team avatar options
 */
export const TEAM_AVATARS = [
  { id: 'owl', emoji: '🦉', name: 'Wise Owls' },
  { id: 'fox', emoji: '🦊', name: 'Clever Foxes' },
  { id: 'dolphin', emoji: '🐬', name: 'Smart Dolphins' },
  { id: 'eagle', emoji: '🦅', name: 'Sharp Eagles' },
  { id: 'octopus', emoji: '🐙', name: 'Curious Octopi' },
  { id: 'bee', emoji: '🐝', name: 'Busy Bees' },
  { id: 'wolf', emoji: '🐺', name: 'Pack Wolves' },
  { id: 'rocket', emoji: '🚀', name: 'Rockets' }
];

/**
 * Encouragement messages for different outcomes
 */
export const ENCOURAGEMENTS = {
  correct: [
    'Great teamwork! 🎉',
    'Your skepticism paid off!',
    'Excellent critical thinking!',
    'You saw through that one!',
    'Truth hunters strike again!',
    'Sharp eyes, sharp minds!',
    "That's how it's done!",
    'Your team is on fire! 🔥'
  ],
  incorrect: [
    'Good try! That was a tricky one.',
    'Now you know for next time!',
    'Even experts get fooled sometimes.',
    'Learning moment! 📚',
    'This is how we grow!',
    "Tricky! But now you'll remember.",
    'The best learners make mistakes!',
    'Stay curious, keep questioning!'
  ],
  streak: [
    '2 in a row! Keep it up!',
    "3 in a row! You're on fire! 🔥",
    '4 in a row! Incredible teamwork!',
    '5 in a row! UNSTOPPABLE! ⚡',
    'LEGENDARY STREAK! 👑'
  ]
};

/**
 * Scoring matrix for confidence levels
 * Maps confidence level to points earned/lost for correct/incorrect answers
 */
export const POINTS_MATRIX = {
  1: { correct: 1, incorrect: -1 },
  2: { correct: 3, incorrect: -3 },
  3: { correct: 5, incorrect: -6 }
};

/**
 * Difficulty multipliers for scoring
 */
export const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  mixed: 1
};

/**
 * Difficulty configuration
 */
export const DIFFICULTY_CONFIG = {
  easy: {
    name: 'Beginner',
    description: 'Common myths and straightforward facts',
    discussTime: 150, // 2:30
    stakeTime: 45,
    pointMultiplier: 1,
    color: 'var(--accent-emerald)',
    icon: '🌱'
  },
  medium: {
    name: 'Standard',
    description: 'Mixed claims requiring careful analysis',
    discussTime: 120, // 2:00
    stakeTime: 30,
    pointMultiplier: 1.5,
    color: 'var(--accent-amber)',
    icon: '⚡'
  },
  hard: {
    name: 'Expert',
    description: 'Subtle errors and complex claims',
    discussTime: 90, // 1:30
    stakeTime: 25,
    pointMultiplier: 2,
    color: 'var(--accent-rose)',
    icon: '🔥'
  },
  mixed: {
    name: 'Progressive',
    description: 'Starts easy, gets harder each round',
    discussTime: 120,
    stakeTime: 30,
    pointMultiplier: 1,
    color: 'var(--accent-violet)',
    icon: '📈'
  }
};

/**
 * Background colors for difficulty badges
 */
export const DIFFICULTY_BG_COLORS = {
  easy: 'rgba(52, 211, 153, 0.2)',
  medium: 'rgba(251, 191, 36, 0.2)',
  hard: 'rgba(251, 113, 133, 0.2)',
  mixed: 'rgba(167, 139, 250, 0.2)'
};

/**
 * Hint types available during gameplay
 */
export const HINT_TYPES = [
  {
    id: 'source-hint',
    name: 'Source Check',
    description: 'Reveals if claim is AI-generated or expert-sourced',
    cost: 2,
    icon: '🔍'
  },
  {
    id: 'error-hint',
    name: 'Error Pattern',
    description: 'Hints at what type of error to look for',
    cost: 3,
    icon: '🎯'
  },
  {
    id: 'subject-hint',
    name: 'Subject Expert',
    description: 'Get context about this subject area',
    cost: 1,
    icon: '📚'
  }
];

/**
 * Educational tips shown between rounds
 */
export const EDUCATIONAL_TIPS = [
  {
    category: 'AI Detection',
    tip: 'Watch for "exactly" or very specific numbers — AI often invents precise-sounding details.',
    icon: '🎯'
  },
  {
    category: 'Critical Thinking',
    tip: 'Ask yourself: "How would someone verify this?" If it seems hard to check, be skeptical.',
    icon: '🤔'
  },
  {
    category: 'Calibration',
    tip: "It's okay to say \"I'm not sure.\" Knowing what you don't know is a superpower!",
    icon: '🌟'
  },
  {
    category: 'Team Strategy',
    tip: 'The Skeptic role is crucial — even if you agree, try to find a reason it might be wrong.',
    icon: '🗣️'
  },
  {
    category: 'AI Detection',
    tip: 'AI loves to mix true facts with false details. Look for the "too good to be true" parts.',
    icon: '🔍'
  },
  {
    category: 'Humility',
    tip: "Getting it wrong doesn't mean you're bad at this — it means you're learning!",
    icon: '🌱'
  },
  {
    category: 'Critical Thinking',
    tip: "Famous stories (like Newton's apple) often get exaggerated over time. Question the dramatic details.",
    icon: '📚'
  },
  {
    category: 'Team Strategy',
    tip: 'Before locking in, ask: "Did everyone get to share their thoughts?"',
    icon: '🤝'
  },
  {
    category: 'Calibration',
    tip: "If your team disagrees, that's a sign to use lower confidence — disagreement = uncertainty.",
    icon: '⚖️'
  },
  {
    category: 'AI Detection',
    tip: 'AI often gets the "what" right but messes up the "when" or "where" — check those details!',
    icon: '📍'
  },
  {
    category: 'Humility',
    tip: "The smartest people aren't always right — they're the ones who update their beliefs with evidence.",
    icon: '🧠'
  },
  {
    category: 'Critical Thinking',
    tip: "Just because something sounds scientific doesn't mean it's true. Look for the source!",
    icon: '🔬'
  }
];

/**
 * Reflection prompts for end-of-game debrief
 */
export const REFLECTION_PROMPTS = [
  {
    question: 'What claim surprised you the most today?',
    followUp: 'What made it hard to judge?'
  },
  {
    question: 'Did your team disagree on any claims?',
    followUp: 'How did you work through the disagreement?'
  },
  {
    question: 'Which AI error pattern fooled you the most?',
    followUp: 'How will you watch for it next time?'
  },
  {
    question: 'When were you most confident but wrong?',
    followUp: 'What can you learn from that moment?'
  },
  {
    question: "What's one thing you'll check more carefully next time?",
    followUp: 'How will you remember to do this?'
  },
  {
    question: 'How did having different team roles help your group?',
    followUp: 'Which role helped you think differently?'
  }
];

/**
 * Subject-specific hints
 */
export const SUBJECT_HINTS = {
  'Biology': 'Think about what you learned in life science class!',
  'Physics': 'Consider the basic laws of how things move and interact.',
  'Chemistry': 'Remember: matter, elements, and reactions.',
  'History': 'Dates and places are often where errors hide.',
  'Geography': 'Double-check locations and measurements.',
  'Astronomy': 'Space facts often sound unbelievable but might be true!',
  'Neuroscience': 'The brain is complex - be careful with percentages.',
  'History of Science': 'Famous scientist stories often get embellished.',
  'Marine Biology': 'Ocean creatures can be surprisingly strange!',
  'Human Biology': 'Your own body can be surprising.',
  'Animal Science': 'Animal facts are often exaggerated in myths.',
  'Evolution': 'Think in millions of years, not thousands.',
  'Botany': 'Plant classifications can be counterintuitive.',
  'Weather Science': 'Weather phenomena are often misunderstood.',
  'Mathematics': 'Big numbers can be hard to grasp.',
  'Computer Science': 'Tech history has many misconceptions.',
  'Biotechnology': 'Cutting-edge science dates matter.',
  'Medical Science': 'Medical claims need careful scrutiny.'
};
