/**
 * GENERIC UTILITIES
 * Reusable utility functions with no game-specific dependencies
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 * @template T
 * @param {T[]} array - Array to shuffle
 * @returns {T[]} Shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random item from array
 * @template T
 * @param {T[]} array - Array to pick from
 * @returns {T} Random item
 */
export function getRandomItem(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Create a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Create a throttled click handler that prevents double-clicks
 * @param {Function} fn - Click handler
 * @param {number} delay - Minimum delay between clicks (default 500ms)
 * @returns {Function} Throttled function
 */
export function preventDoubleClick(fn, delay = 500) {
  let lastClick = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastClick >= delay) {
      lastClick = now;
      fn(...args);
    }
  };
}

/**
 * Format a timestamp as a relative time string (e.g., "2h ago", "Yesterday")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get rank display for leaderboard (emoji for top 3, number otherwise)
 * @param {number} index - Zero-based index
 * @returns {string} Rank display (e.g., "🥇", "🥈", "#4")
 */
export function getRankDisplay(index) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

/**
 * Get rank color for leaderboard display
 * @param {number} index - Zero-based index
 * @returns {string} CSS color value
 */
export function getRankColor(index) {
  if (index === 0) return '#ffd700'; // Gold
  if (index === 1) return '#c0c0c0'; // Silver
  if (index === 2) return '#cd7f32'; // Bronze
  return 'var(--text-muted)';
}
