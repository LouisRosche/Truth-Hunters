/**
 * Firebase resilience utilities — helpers for graceful degradation.
 *
 * - withTimeout: race a promise against a deadline
 */

/**
 * Race a promise against a timeout.
 * @param {Promise} promise - The promise to race
 * @param {number} ms - Timeout in milliseconds
 * @param {string} label - Label for the timeout error message
 * @returns {Promise} Resolves with the promise result or rejects on timeout
 */
export function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}
