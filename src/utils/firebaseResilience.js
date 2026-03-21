/**
 * Firebase resilience utilities — extracted from App.jsx for testability.
 *
 * These helpers ensure Firebase operations degrade gracefully:
 * - resilientSave: try Firebase, fall back to OfflineQueue
 * - removeSessionWithRetry: retry session removal with backoff
 * - withTimeout: race a promise against a deadline
 */
import { logger } from './logger';
import { OfflineQueue } from '../services/offlineQueue';
import { FirebaseBackend } from '../services/firebase';

/**
 * Attempt a Firebase save, falling back to offline queue on failure.
 * @param {'game'|'achievement'} type - Queue item type
 * @param {Function} saveFn - Async function that performs the save
 * @param {Object} queueData - Data to enqueue if save fails
 */
export async function resilientSave(type, saveFn, queueData) {
  try {
    await saveFn();
  } catch (e) {
    logger.warn(`Firebase ${type} save failed, queuing for retry:`, e);
    OfflineQueue.enqueue(type, queueData);
  }
}

/**
 * Remove a Firebase session with retry logic.
 * @param {string} sid - Session ID to remove
 * @param {number} maxRetries - Maximum retry attempts
 */
export async function removeSessionWithRetry(sid, maxRetries = 3) {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      await FirebaseBackend.removeActiveSession(sid);
      return;
    } catch (err) {
      retries--;
      if (retries === 0) {
        logger.error(`Failed to remove session after ${maxRetries} retries:`, err);
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
}

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
