/**
 * HELPER UTILITIES
 * Re-exports from focused utility modules for backwards compatibility
 *
 * For new code, prefer importing directly from:
 * - './generic' for reusable utilities (shuffleArray, getRandomItem, debounce, preventDoubleClick)
 * - './game' for game-specific functions (selectClaimsByDifficulty, formatPlayerName, getHintContent)
 */

// Generic utilities
export { shuffleArray, getRandomItem, debounce, preventDoubleClick } from './generic';

// Game-specific utilities
export { selectClaimsByDifficulty, formatPlayerName, getHintContent, getUnseenClaimStats } from './game';
