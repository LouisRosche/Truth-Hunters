/**
 * useGameIntegrity Hook Tests
 * Tests anti-cheat tab visibility monitoring, forfeit logic, penalties, and reset
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameIntegrity } from '../useGameIntegrity';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: { warn: vi.fn(), log: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

// Mock constants with controllable values
vi.mock('../../data/constants', () => ({
  ANTI_CHEAT: {
    ENABLED: true,
    TAB_VISIBILITY_TRACKING: true,
    TAB_SWITCH_PENALTY: -2,
    MAX_TAB_SWITCHES_PER_ROUND: 1,
    FORFEIT_PENALTY: -10,
    WARN_ON_TAB_SWITCH: true,
    PAUSE_ON_TAB_SWITCH: true
  }
}));

/**
 * Simulate a visibilitychange event by setting document.hidden and dispatching.
 */
function simulateVisibilityChange(hidden) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useGameIntegrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document.hidden to visible
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    // Restore document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  it('returns correct initial state when inactive', () => {
    const { result } = renderHook(() => useGameIntegrity(false));

    expect(result.current.tabSwitches).toBe(0);
    expect(result.current.isTabVisible).toBe(true);
    expect(result.current.isForfeit).toBe(false);
    expect(result.current.totalTimeHidden).toBe(0);
    expect(result.current.hasWarning).toBe(false);
    expect(result.current.isNearForfeit).toBe(false);
    expect(Math.abs(result.current.penalty)).toBe(0);
    expect(typeof result.current.reset).toBe('function');
  });

  it('does not track tab switches when inactive', () => {
    const onTabSwitch = vi.fn();
    renderHook(() => useGameIntegrity(false, onTabSwitch));

    act(() => simulateVisibilityChange(true));

    expect(onTabSwitch).not.toHaveBeenCalled();
  });

  it('detects tab switch when active and calls onTabSwitch', () => {
    const onTabSwitch = vi.fn();
    const { result } = renderHook(() => useGameIntegrity(true, onTabSwitch));

    act(() => simulateVisibilityChange(true));

    expect(result.current.tabSwitches).toBe(1);
    expect(result.current.isTabVisible).toBe(false);
    expect(onTabSwitch).toHaveBeenCalledWith(1);
  });

  it('tracks time hidden when tab returns to visible', () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    const { result } = renderHook(() => useGameIntegrity(true));

    act(() => simulateVisibilityChange(true)); // hidden at t=1000

    nowSpy.mockReturnValue(4000);
    act(() => simulateVisibilityChange(false)); // visible at t=4000

    expect(result.current.isTabVisible).toBe(true);
    expect(result.current.totalTimeHidden).toBe(3000);

    nowSpy.mockRestore();
  });

  it('applies incremental penalty per tab switch', () => {
    const { result } = renderHook(() => useGameIntegrity(true));

    act(() => simulateVisibilityChange(true)); // first switch
    // TAB_SWITCH_PENALTY is -2, so 1 switch = -2
    expect(result.current.penalty).toBe(-2);
    expect(result.current.hasWarning).toBe(true);
  });

  it('triggers forfeit after exceeding MAX_TAB_SWITCHES_PER_ROUND', () => {
    const onForfeit = vi.fn();
    const onTabSwitch = vi.fn();
    const { result } = renderHook(() => useGameIntegrity(true, onTabSwitch, onForfeit));

    // First switch (allowed — MAX is 1, so count 1 is at the limit)
    act(() => simulateVisibilityChange(true));
    act(() => simulateVisibilityChange(false)); // return visible

    // Second switch — exceeds max
    act(() => simulateVisibilityChange(true));

    expect(result.current.isForfeit).toBe(true);
    expect(result.current.penalty).toBe(-10); // FORFEIT_PENALTY
    expect(onForfeit).toHaveBeenCalledOnce();
    expect(onTabSwitch).toHaveBeenCalledTimes(2);
  });

  it('sets isNearForfeit when at MAX_TAB_SWITCHES_PER_ROUND', () => {
    const { result } = renderHook(() => useGameIntegrity(true));

    act(() => simulateVisibilityChange(true)); // 1 switch = MAX

    expect(result.current.isNearForfeit).toBe(true);
  });

  it('reset clears all tracking state', () => {
    const { result } = renderHook(() => useGameIntegrity(true));

    // Trigger a tab switch
    act(() => simulateVisibilityChange(true));
    expect(result.current.tabSwitches).toBe(1);

    // Reset
    act(() => result.current.reset());

    expect(result.current.tabSwitches).toBe(0);
    expect(result.current.isForfeit).toBe(false);
    expect(result.current.totalTimeHidden).toBe(0);
    expect(Math.abs(result.current.penalty)).toBe(0);
  });

  it('does not double-count if tab is already hidden', () => {
    const { result } = renderHook(() => useGameIntegrity(true));

    act(() => simulateVisibilityChange(true));
    act(() => simulateVisibilityChange(true)); // still hidden — no-op

    expect(result.current.tabSwitches).toBe(1);
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useGameIntegrity(true));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('stops tracking when isActive changes to false', () => {
    const onTabSwitch = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useGameIntegrity(active, onTabSwitch),
      { initialProps: { active: true } }
    );

    // Deactivate
    rerender({ active: false });

    act(() => simulateVisibilityChange(true));
    expect(onTabSwitch).not.toHaveBeenCalled();
  });
});
