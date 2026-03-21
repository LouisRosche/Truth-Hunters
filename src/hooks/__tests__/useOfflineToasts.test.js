/**
 * useOfflineToasts Hook Tests
 * Tests that the hook wires OfflineQueue notifications to the Toast system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock OfflineQueue
const mockSetToastCallback = vi.fn();
vi.mock('../../services/offlineQueue', () => ({
  OfflineQueue: {
    setToastCallback: (...args) => mockSetToastCallback(...args),
  }
}));

// Mock useToast
const mockShowToast = vi.fn();
vi.mock('../../components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { useOfflineToasts } from '../useOfflineToasts';

describe('useOfflineToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers showToast callback with OfflineQueue on mount', () => {
    renderHook(() => useOfflineToasts());

    expect(mockSetToastCallback).toHaveBeenCalledWith(mockShowToast);
  });

  it('unregisters callback (sets null) on unmount', () => {
    const { unmount } = renderHook(() => useOfflineToasts());

    expect(mockSetToastCallback).toHaveBeenCalledWith(mockShowToast);

    unmount();

    expect(mockSetToastCallback).toHaveBeenCalledWith(null);
    expect(mockSetToastCallback).toHaveBeenCalledTimes(2);
  });

  it('passes the showToast function reference (not a wrapper)', () => {
    renderHook(() => useOfflineToasts());

    // Verify it passes the exact mockShowToast reference, not a different function
    const passedCallback = mockSetToastCallback.mock.calls[0][0];
    expect(passedCallback).toBe(mockShowToast);
  });
});
