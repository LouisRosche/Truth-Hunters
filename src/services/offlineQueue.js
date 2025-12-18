/**
 * OFFLINE QUEUE SERVICE
 * Queues Firebase saves when offline and syncs when back online
 */

import { logger } from '../utils/logger';

const QUEUE_KEY = 'truthHunters_offlineQueue';

// Listeners for queue changes
const _listeners = new Set();

// Toast notification callback
let _toastCallback = null;

/**
 * Offline Queue Manager
 * Handles queuing and syncing of Firebase operations when offline
 */
export const OfflineQueue = {
  /**
   * Get all queued items
   * @returns {Array} Queued items
   */
  getQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      logger.warn('Failed to read offline queue:', e);
      return [];
    }
  },

  /**
   * Save queue to localStorage
   * @param {Array} queue - Queue to save
   */
  saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      // Notify listeners
      _listeners.forEach(cb => cb(queue));
    } catch (e) {
      logger.warn('Failed to save offline queue:', e);
    }
  },

  /**
   * Subscribe to queue changes
   * @param {Function} callback - Called when queue changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    _listeners.add(callback);
    return () => _listeners.delete(callback);
  },

  /**
   * Add item to queue
   * @param {string} type - Type of operation ('game' | 'reflection' | 'claim' | 'achievement')
   * @param {Object} data - Data to save
   */
  enqueue(type, data) {
    const queue = this.getQueue();
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    });
    this.saveQueue(queue);
    logger.log(`Queued ${type} for later sync`);
  },

  /**
   * Remove item from queue
   * @param {string} id - Item ID to remove
   */
  dequeue(id) {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    this.saveQueue(filtered);
  },

  /**
   * Get queue length
   * @returns {number} Number of items in queue
   */
  size() {
    return this.getQueue().length;
  },

  /**
   * Clear the queue
   */
  clear() {
    this.saveQueue([]);
  },

  /**
   * Process queue and sync with Firebase
   * @param {Object} FirebaseBackend - Firebase backend instance
   * @returns {Promise<{success: number, failed: number}>}
   */
  async sync(FirebaseBackend) {
    if (!FirebaseBackend?.initialized) {
      return { success: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        let result = false;

        switch (item.type) {
          case 'game':
            result = await FirebaseBackend.save(item.data);
            break;
          case 'reflection':
            result = await FirebaseBackend.saveReflection(item.data);
            break;
          case 'claim': {
            const claimResult = await FirebaseBackend.submitClaim(item.data);
            result = claimResult.success;
            break;
          }
          case 'achievement': {
            const achResult = await FirebaseBackend.shareAchievement(item.data.achievement, item.data.playerInfo);
            result = achResult.success;
            break;
          }
          default:
            logger.warn(`Unknown queue item type: ${item.type}`);
            result = false;
        }

        if (result) {
          this.dequeue(item.id);
          success++;
          logger.log(`Synced queued ${item.type}`);
        } else {
          // Increment retry count
          item.retries++;
          if (item.retries >= 3) {
            // Give up after 3 retries
            this.dequeue(item.id);
            failed++;
            logger.warn(`Gave up on queued ${item.type} after 3 retries`);
          }
        }
      } catch (e) {
        logger.warn(`Failed to sync queued ${item.type}:`, e);
        item.retries++;
        if (item.retries >= 3) {
          this.dequeue(item.id);
          failed++;
        }
      }
    }

    // Save updated retry counts
    this.saveQueue(this.getQueue());

    return { success, failed };
  },

  /**
   * Check if there are pending items of a specific type
   * @param {string} type - The type to check for
   * @returns {boolean} True if there are pending items of this type
   */
  hasPending(type = null) {
    const queue = this.getQueue();
    if (!type) return queue.length > 0;
    return queue.some(item => item.type === type);
  },

  /**
   * Get count of pending items by type
   * @returns {Object} Counts by type
   */
  getCounts() {
    const queue = this.getQueue();
    return queue.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  },

  /**
   * Set toast notification callback
   * @param {Function} callback - Function to call for toast notifications
   */
  setToastCallback(callback) {
    _toastCallback = callback;
  },

  /**
   * Show toast notification (internal helper)
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   */
  _showToast(message, type = 'info') {
    if (_toastCallback) {
      _toastCallback(message, type);
    }
  }
};

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    // Dynamic import to avoid circular dependency
    const { FirebaseBackend } = await import('./firebase');
    const result = await OfflineQueue.sync(FirebaseBackend);

    if (result.success > 0 || result.failed > 0) {
      if (result.success > 0 && result.failed === 0) {
        OfflineQueue._showToast(
          `Successfully synced ${result.success} queued ${result.success === 1 ? 'item' : 'items'}`,
          'success'
        );
        logger.log(`Synced ${result.success} queued items`);
      } else if (result.failed > 0 && result.success === 0) {
        OfflineQueue._showToast(
          `Failed to sync ${result.failed} queued ${result.failed === 1 ? 'item' : 'items'}. Will retry later.`,
          'error'
        );
        logger.warn(`Failed to sync ${result.failed} queued items`);
      } else {
        OfflineQueue._showToast(
          `Synced ${result.success} ${result.success === 1 ? 'item' : 'items'}, ${result.failed} failed`,
          'warning'
        );
        logger.log(`Synced ${result.success} items, ${result.failed} failed`);
      }
    }
  });
}
