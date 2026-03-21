import { describe, it, expect, vi, beforeEach } from 'vitest';

import { withTimeout } from '../firebaseResilience';

describe('firebaseResilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
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
