/**
 * Tests for OfflineQueue service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

globalThis.localStorage = localStorageMock;

// Import after mocking
const { OfflineQueue } = await import('../offlineQueue.js');

describe('OfflineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isAvailable()', () => {
    it('should return true when localStorage is available', () => {
      expect(OfflineQueue.isAvailable()).toBe(true);
    });
  });

  describe('enqueue()', () => {
    it('should add item to queue', () => {
      const result = OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });
      expect(result).toBe(true);

      const queue = OfflineQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('game');
      expect(queue[0].data.teamName).toBe('Test');
    });

    it('should assign unique ID to each item', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });

      const queue = OfflineQueue.getAll();
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it('should add timestamp to items', () => {
      const before = Date.now();
      OfflineQueue.enqueue('game', { score: 10 });
      const after = Date.now();

      const queue = OfflineQueue.getAll();
      expect(queue[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(queue[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should initialize attempts counter', () => {
      OfflineQueue.enqueue('game', { score: 10 });

      const queue = OfflineQueue.getAll();
      expect(queue[0].attempts).toBe(0);
    });

    it('should handle different item types', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'test' });
      OfflineQueue.enqueue('claim', { claimText: 'test claim' });

      const queue = OfflineQueue.getAll();
      expect(queue).toHaveLength(3);
      expect(queue[0].type).toBe('game');
      expect(queue[1].type).toBe('reflection');
      expect(queue[2].type).toBe('claim');
    });
  });

  describe('getAll()', () => {
    it('should return empty array when queue is empty', () => {
      const queue = OfflineQueue.getAll();
      expect(queue).toEqual([]);
    });

    it('should return all queued items', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });
      OfflineQueue.enqueue('game', { score: 30 });

      const queue = OfflineQueue.getAll();
      expect(queue).toHaveLength(3);
    });
  });

  describe('remove()', () => {
    it('should remove item by ID', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });

      const queue = OfflineQueue.getAll();
      const idToRemove = queue[0].id;

      OfflineQueue.remove(idToRemove);

      const updated = OfflineQueue.getAll();
      expect(updated).toHaveLength(1);
      expect(updated[0].data.score).toBe(20);
    });

    it('should handle removal of non-existent ID', () => {
      OfflineQueue.enqueue('game', { score: 10 });

      OfflineQueue.remove('non-existent-id');

      const queue = OfflineQueue.getAll();
      expect(queue).toHaveLength(1);
    });
  });

  describe('clear()', () => {
    it('should remove all items from queue', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });
      OfflineQueue.enqueue('game', { score: 30 });

      expect(OfflineQueue.getAll()).toHaveLength(3);

      OfflineQueue.clear();

      expect(OfflineQueue.getAll()).toHaveLength(0);
    });
  });

  describe('size()', () => {
    it('should return queue size', () => {
      expect(OfflineQueue.size()).toBe(0);

      OfflineQueue.enqueue('game', { score: 10 });
      expect(OfflineQueue.size()).toBe(1);

      OfflineQueue.enqueue('game', { score: 20 });
      expect(OfflineQueue.size()).toBe(2);

      OfflineQueue.clear();
      expect(OfflineQueue.size()).toBe(0);
    });
  });

  describe('isEmpty()', () => {
    it('should return true when queue is empty', () => {
      expect(OfflineQueue.isEmpty()).toBe(true);
    });

    it('should return false when queue has items', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      expect(OfflineQueue.isEmpty()).toBe(false);
    });
  });

  describe('sync() with mock backend', () => {
    let mockBackend;

    beforeEach(() => {
      mockBackend = {
        save: vi.fn().mockResolvedValue(true),
        saveReflection: vi.fn().mockResolvedValue(true),
        submitClaim: vi.fn().mockResolvedValue({ success: true }),
        shareAchievement: vi.fn().mockResolvedValue({ success: true })
      };
    });

    it('should process queue items successfully', async () => {
      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'test reflection' });

      await OfflineQueue.sync(mockBackend);

      expect(mockBackend.save).toHaveBeenCalledTimes(1);
      expect(mockBackend.saveReflection).toHaveBeenCalledTimes(1);

      // Queue should be empty after successful sync
      expect(OfflineQueue.isEmpty()).toBe(true);
    });

    it('should remove successfully processed items', async () => {
      OfflineQueue.enqueue('game', { teamName: 'Test1', score: 10 });
      OfflineQueue.enqueue('game', { teamName: 'Test2', score: 20 });

      await OfflineQueue.sync(mockBackend);

      expect(OfflineQueue.size()).toBe(0);
    });

    it('should retry failed items up to max attempts', async () => {
      mockBackend.save = vi.fn().mockResolvedValue(false); // Simulate failure

      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });

      await OfflineQueue.sync(mockBackend);

      const queue = OfflineQueue.getAll();
      expect(queue[0].attempts).toBe(1);

      await OfflineQueue.sync(mockBackend);
      expect(queue[0].attempts).toBe(2);
    });

    it('should remove items after max retry attempts', async () => {
      mockBackend.save = vi.fn().mockResolvedValue(false);

      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });

      // Simulate max retries (default is 3)
      await OfflineQueue.sync(mockBackend);
      await OfflineQueue.sync(mockBackend);
      await OfflineQueue.sync(mockBackend);

      // Item should be removed after 3 failed attempts
      expect(OfflineQueue.isEmpty()).toBe(true);
    });

    it('should handle backend errors gracefully', async () => {
      mockBackend.save = vi.fn().mockRejectedValue(new Error('Network error'));

      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });

      await expect(OfflineQueue.sync(mockBackend)).resolves.not.toThrow();

      // Item should still be in queue
      expect(OfflineQueue.size()).toBe(1);
    });

    it('should process different item types correctly', async () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'reflection' });
      OfflineQueue.enqueue('claim', { claimText: 'test claim' });
      OfflineQueue.enqueue('achievement', {
        achievement: { id: 'test-achievement' },
        playerInfo: { playerName: 'Alice' }
      });

      await OfflineQueue.sync(mockBackend);

      expect(mockBackend.save).toHaveBeenCalledTimes(1);
      expect(mockBackend.saveReflection).toHaveBeenCalledTimes(1);
      expect(mockBackend.submitClaim).toHaveBeenCalledTimes(1);
      expect(mockBackend.shareAchievement).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOldestItem()', () => {
    it('should return null for empty queue', () => {
      expect(OfflineQueue.getOldestItem()).toBeNull();
    });

    it('should return oldest item by timestamp', () => {
      const oldTimestamp = Date.now() - 1000;

      // Manually create items with specific timestamps
      OfflineQueue.enqueue('game', { score: 10 });
      const queue1 = OfflineQueue.getAll();
      queue1[0].timestamp = oldTimestamp;
      localStorage.setItem('truthHunters_offlineQueue', JSON.stringify(queue1));

      OfflineQueue.enqueue('game', { score: 20 });

      const oldest = OfflineQueue.getOldestItem();
      expect(oldest.data.score).toBe(10);
    });
  });

  describe('age tracking', () => {
    it('should calculate item age in milliseconds', () => {
      const pastTime = Date.now() - 5000; // 5 seconds ago

      OfflineQueue.enqueue('game', { score: 10 });
      const queue = OfflineQueue.getAll();
      queue[0].timestamp = pastTime;
      localStorage.setItem('truthHunters_offlineQueue', JSON.stringify(queue));

      const item = OfflineQueue.getAll()[0];
      const age = Date.now() - item.timestamp;
      expect(age).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('storage persistence', () => {
    it('should persist queue across service reloads', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });

      // Simulate service reload by getting queue fresh from storage
      const stored = localStorage.getItem('truthHunters_offlineQueue');
      const parsed = JSON.parse(stored);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].data.score).toBe(10);
      expect(parsed[1].data.score).toBe(20);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      const queue = OfflineQueue.getAll();
      expect(queue).toEqual([]);

      // Restore
      localStorage.getItem = originalGetItem;
    });

    it('should handle corrupted queue data', () => {
      localStorage.setItem('truthHunters_offlineQueue', 'corrupted{json');

      const queue = OfflineQueue.getAll();
      expect(queue).toEqual([]);
    });
  });
});
