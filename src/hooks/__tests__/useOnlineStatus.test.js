/**
 * useOnlineStatus Hook Tests
 * Tests online/offline status detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  let onlineHandler;
  let offlineHandler;

  beforeEach(() => {
    // Store event handlers
    const listeners = {};
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      listeners[event] = handler;
      if (event === 'online') onlineHandler = handler;
      if (event === 'offline') offlineHandler = handler;
    });
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe('boolean');
  });

  it('updates to false when offline event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      if (offlineHandler) offlineHandler();
    });

    expect(result.current).toBe(false);
  });

  it('updates to true when online event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());

    // First go offline
    act(() => {
      if (offlineHandler) offlineHandler();
    });

    // Then go online
    act(() => {
      if (onlineHandler) onlineHandler();
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
