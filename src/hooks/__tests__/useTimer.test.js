/**
 * useTimer Hook Tests
 * Tests countdown timer functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTimer } from '../useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes with provided time', () => {
    const { result } = renderHook(() => useTimer(60, vi.fn()));
    expect(result.current.time).toBe(60);
    expect(result.current.isActive).toBe(false);
  });

  it('starts countdown when start is called', () => {
    const { result } = renderHook(() => useTimer(10, vi.fn()));

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.time).toBe(9);
  });

  it('pauses countdown when pause is called', () => {
    const { result } = renderHook(() => useTimer(10, vi.fn()));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.time).toBe(8);

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be 8 after pausing
    expect(result.current.time).toBe(8);
  });

  it('calls onComplete when timer reaches zero', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(2, onComplete));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.time).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it('resets to initial time when reset is called', () => {
    const { result } = renderHook(() => useTimer(10, vi.fn()));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.time).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.time).toBe(10);
    expect(result.current.isActive).toBe(false);
  });

  it('can reset to a new time', () => {
    const { result } = renderHook(() => useTimer(10, vi.fn()));

    act(() => {
      result.current.reset(30);
    });

    expect(result.current.time).toBe(30);
  });
});
