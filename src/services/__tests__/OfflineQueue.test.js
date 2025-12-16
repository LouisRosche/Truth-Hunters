/**
 * Tests for OfflineQueue service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage using vi.stubGlobal
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null)
  };
};

const localStorageMock = createStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

// Import after mocking
const { OfflineQueue } = await import('../offlineQueue.js');

describe('OfflineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    OfflineQueue.clear();
    vi.clearAllMocks();
  });

  describe('enqueue()', () => {
    it('should add item to queue', () => {
      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });

      const queue = OfflineQueue.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('game');
      expect(queue[0].data.teamName).toBe('Test');
    });

    it('should assign unique ID to each item', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });

      const queue = OfflineQueue.getQueue();
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it('should add timestamp to items', () => {
      const before = Date.now();
      OfflineQueue.enqueue('game', { score: 10 });
      const after = Date.now();

      const queue = OfflineQueue.getQueue();
      expect(queue[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(queue[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should initialize retries counter', () => {
      OfflineQueue.enqueue('game', { score: 10 });

      const queue = OfflineQueue.getQueue();
      expect(queue[0].retries).toBe(0);
    });

    it('should handle different item types', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'test' });
      OfflineQueue.enqueue('claim', { claimText: 'test claim' });

      const queue = OfflineQueue.getQueue();
      expect(queue).toHaveLength(3);
      expect(queue[0].type).toBe('game');
      expect(queue[1].type).toBe('reflection');
      expect(queue[2].type).toBe('claim');
    });
  });

  describe('getQueue()', () => {
    it('should return empty array when queue is empty', () => {
      const queue = OfflineQueue.getQueue();
      expect(queue).toEqual([]);
    });

    it('should return all queued items', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });
      OfflineQueue.enqueue('game', { score: 30 });

      const queue = OfflineQueue.getQueue();
      expect(queue).toHaveLength(3);
    });
  });

  describe('dequeue()', () => {
    it('should remove item by ID', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });

      const queue = OfflineQueue.getQueue();
      const idToRemove = queue[0].id;

      OfflineQueue.dequeue(idToRemove);

      const updated = OfflineQueue.getQueue();
      expect(updated).toHaveLength(1);
      expect(updated[0].data.score).toBe(20);
    });

    it('should handle removal of non-existent ID', () => {
      OfflineQueue.enqueue('game', { score: 10 });

      OfflineQueue.dequeue('non-existent-id');

      const queue = OfflineQueue.getQueue();
      expect(queue).toHaveLength(1);
    });
  });

  describe('clear()', () => {
    it('should remove all items from queue', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });
      OfflineQueue.enqueue('game', { score: 30 });

      expect(OfflineQueue.getQueue()).toHaveLength(3);

      OfflineQueue.clear();

      expect(OfflineQueue.getQueue()).toHaveLength(0);
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

  describe('hasPending()', () => {
    it('should return false when queue is empty', () => {
      expect(OfflineQueue.hasPending()).toBe(false);
    });

    it('should return true when queue has items', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      expect(OfflineQueue.hasPending()).toBe(true);
    });

    it('should filter by type', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'test' });

      expect(OfflineQueue.hasPending('game')).toBe(true);
      expect(OfflineQueue.hasPending('reflection')).toBe(true);
      expect(OfflineQueue.hasPending('claim')).toBe(false);
    });
  });

  describe('getCounts()', () => {
    it('should return counts by type', () => {
      OfflineQueue.enqueue('game', { score: 10 });
      OfflineQueue.enqueue('game', { score: 20 });
      OfflineQueue.enqueue('reflection', { text: 'test' });

      const counts = OfflineQueue.getCounts();
      expect(counts.game).toBe(2);
      expect(counts.reflection).toBe(1);
    });
  });

  describe('sync() with mock backend', () => {
    let mockBackend;

    beforeEach(() => {
      mockBackend = {
        initialized: true,
        save: vi.fn().mockResolvedValue(true),
        saveReflection: vi.fn().mockResolvedValue(true),
        submitClaim: vi.fn().mockResolvedValue({ success: true }),
        shareAchievement: vi.fn().mockResolvedValue({ success: true })
      };
    });

    it('should process queue items successfully', async () => {
      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });
      OfflineQueue.enqueue('reflection', { text: 'test reflection' });

      const result = await OfflineQueue.sync(mockBackend);

      expect(mockBackend.save).toHaveBeenCalledTimes(1);
      expect(mockBackend.saveReflection).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(2);
    });

    it('should remove successfully processed items', async () => {
      OfflineQueue.enqueue('game', { teamName: 'Test1', score: 10 });
      OfflineQueue.enqueue('game', { teamName: 'Test2', score: 20 });

      await OfflineQueue.sync(mockBackend);

      expect(OfflineQueue.size()).toBe(0);
    });

    it('should return early if backend not initialized', async () => {
      mockBackend.initialized = false;
      OfflineQueue.enqueue('game', { score: 10 });

      const result = await OfflineQueue.sync(mockBackend);

      expect(result.success).toBe(0);
      expect(OfflineQueue.size()).toBe(1);
    });

    it('should handle backend errors gracefully', async () => {
      mockBackend.save = vi.fn().mockRejectedValue(new Error('Network error'));

      OfflineQueue.enqueue('game', { teamName: 'Test', score: 10 });

      await expect(OfflineQueue.sync(mockBackend)).resolves.not.toThrow();
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

      const queue = OfflineQueue.getQueue();
      expect(queue).toEqual([]);

      // Restore
      localStorage.getItem = originalGetItem;
    });

    it('should handle corrupted queue data', () => {
      localStorage.setItem('truthHunters_offlineQueue', 'corrupted{json');

      const queue = OfflineQueue.getQueue();
      expect(queue).toEqual([]);
    });
  });

  describe('subscribe()', () => {
    it('should notify subscribers on queue changes', () => {
      const callback = vi.fn();
      const unsubscribe = OfflineQueue.subscribe(callback);

      OfflineQueue.enqueue('game', { score: 10 });

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop notifying after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = OfflineQueue.subscribe(callback);

      OfflineQueue.enqueue('game', { score: 10 });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      OfflineQueue.enqueue('game', { score: 20 });
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });
});
