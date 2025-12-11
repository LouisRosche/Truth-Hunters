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
