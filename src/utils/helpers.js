/**
 * HELPER UTILITIES
 * Re-exports from focused utility modules for backwards compatibility
 *
 * For new code, prefer importing directly from:
 * - './generic' for reusable utilities (shuffleArray, getRandomItem, debounce)
 * - './game' for game-specific functions (selectClaimsByDifficulty, getHintContent)
 */

// Generic utilities
export { shuffleArray, getRandomItem, debounce } from './generic';

// Game-specific utilities
export { selectClaimsByDifficulty, getHintContent, getUnseenClaimStats } from './game';
