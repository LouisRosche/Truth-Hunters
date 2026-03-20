import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), log: vi.fn(), info: vi.fn() }
}));

vi.mock('../../services/offlineQueue', () => ({
  OfflineQueue: { enqueue: vi.fn() }
}));

vi.mock('../../services/firebase', () => ({
  FirebaseBackend: { removeActiveSession: vi.fn() }
}));

import { resilientSave, removeSessionWithRetry, withTimeout } from '../firebaseResilience';
import { logger } from '../logger';
import { OfflineQueue } from '../../services/offlineQueue';
import { FirebaseBackend } from '../../services/firebase';

describe('firebaseResilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // ==========================================
  // resilientSave
  // ==========================================
  describe('resilientSave', () => {
    it('calls saveFn and does not enqueue on success', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      await resilientSave('game', saveFn, { id: '123' });

      expect(saveFn).toHaveBeenCalledOnce();
      expect(OfflineQueue.enqueue).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('enqueues to OfflineQueue when saveFn rejects', async () => {
      const error = new Error('Network error');
      const saveFn = vi.fn().mockRejectedValue(error);
      const queueData = { type: 'game', data: { score: 10 } };

      await resilientSave('game', saveFn, queueData);

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith('game', queueData);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Firebase game save failed'),
        error
      );
    });

    it('enqueues with correct type for achievement saves', async () => {
      const saveFn = vi.fn().mockRejectedValue(new Error('fail'));
      const queueData = { achievementId: 'first-win' };

      await resilientSave('achievement', saveFn, queueData);

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith('achievement', queueData);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Firebase achievement save failed'),
        expect.any(Error)
      );
    });

    it('does not throw even when saveFn throws', async () => {
      const saveFn = vi.fn().mockRejectedValue(new Error('explosion'));
      await expect(resilientSave('game', saveFn, {})).resolves.toBeUndefined();
    });
  });

  // ==========================================
  // removeSessionWithRetry
  // ==========================================
  describe('removeSessionWithRetry', () => {
    it('removes session on first try', async () => {
      FirebaseBackend.removeActiveSession.mockResolvedValue(undefined);
      await removeSessionWithRetry('session-abc');

      expect(FirebaseBackend.removeActiveSession).toHaveBeenCalledWith('session-abc');
      expect(FirebaseBackend.removeActiveSession).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds on second attempt', async () => {
      vi.useFakeTimers();
      FirebaseBackend.removeActiveSession
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);

      const promise = removeSessionWithRetry('session-abc');

      // First call fails, setTimeout(200ms) is called
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(FirebaseBackend.removeActiveSession).toHaveBeenCalledTimes(2);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs error after exhausting all retries', async () => {
      vi.useFakeTimers();
      const error = new Error('persistent failure');
      FirebaseBackend.removeActiveSession.mockRejectedValue(error);

      const promise = removeSessionWithRetry('session-abc', 2);

      // First fail → wait 200ms → second fail (exhausted)
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(FirebaseBackend.removeActiveSession).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to remove session after 2 retries'),
        expect.any(Error)
      );
    });

    it('respects custom maxRetries parameter', async () => {
      vi.useFakeTimers();
      FirebaseBackend.removeActiveSession.mockRejectedValue(new Error('fail'));

      const promise = removeSessionWithRetry('session-abc', 1);
      await promise;

      expect(FirebaseBackend.removeActiveSession).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ==========================================
  // withTimeout
  // ==========================================
  describe('withTimeout', () => {
    it('resolves when promise finishes before timeout', async () => {
      const result = await withTimeout(
        Promise.resolve('data'),
        1000,
        'Test fetch'
      );
      expect(result).toBe('data');
    });

    it('rejects with timeout error when promise exceeds deadline', async () => {
      vi.useFakeTimers();
      const neverResolves = new Promise(() => {});

      const promise = withTimeout(neverResolves, 5000, 'Class settings fetch');
      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const rejection = expect(promise).rejects.toThrow('Class settings fetch timed out after 5000ms');
      await vi.advanceTimersByTimeAsync(5000);
      await rejection;
    });

    it('preserves original rejection when promise rejects before timeout', async () => {
      vi.useFakeTimers();
      const error = new Error('Network error');
      const promise = withTimeout(Promise.reject(error), 5000, 'Fetch');
      const rejection = expect(promise).rejects.toThrow('Network error');
      await vi.advanceTimersByTimeAsync(5000);
      await rejection;
    });

    it('includes label and ms in timeout error message', async () => {
      vi.useFakeTimers();
      const promise = withTimeout(new Promise(() => {}), 3000, 'My operation');
      const rejection = expect(promise).rejects.toThrow('My operation timed out after 3000ms');
      await vi.advanceTimersByTimeAsync(3000);
      await rejection;
    });
  });
});
