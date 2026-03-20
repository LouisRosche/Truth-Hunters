/**
 * Generic Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shuffleArray,
  getRandomItem,
  debounce,
  preventDoubleClick,
  formatTimeAgo,
  getRankDisplay,
  getRankColor
} from './generic';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    arr.forEach((item) => {
      expect(shuffled).toContain(item);
    });
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element array', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe('getRandomItem', () => {
  it('returns an item from the array', () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(getRandomItem(arr));
  });

  it('returns null for empty array', () => {
    expect(getRandomItem([])).toBeNull();
  });

  it('returns null for non-array', () => {
    expect(getRandomItem(null)).toBeNull();
    expect(getRandomItem(undefined)).toBeNull();
  });

  it('returns the only item for single-element array', () => {
    expect(getRandomItem([99])).toBe(99);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a', 'b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});

describe('preventDoubleClick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first click', () => {
    const fn = vi.fn();
    const throttled = preventDoubleClick(fn, 500);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('blocks rapid second click', () => {
    const fn = vi.fn();
    const throttled = preventDoubleClick(fn, 500);
    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows click after delay expires', () => {
    const fn = vi.fn();
    const throttled = preventDoubleClick(fn, 500);
    throttled();
    vi.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments through', () => {
    const fn = vi.fn();
    const throttled = preventDoubleClick(fn, 500);
    throttled('x', 'y');
    expect(fn).toHaveBeenCalledWith('x', 'y');
  });
});

describe('formatTimeAgo', () => {
  it('returns "Never" for falsy input', () => {
    expect(formatTimeAgo(null)).toBe('Never');
    expect(formatTimeAgo(0)).toBe('Never');
    expect(formatTimeAgo(undefined)).toBe('Never');
  });

  it('returns "Just now" for recent timestamps', () => {
    expect(formatTimeAgo(Date.now() - 10000)).toBe('Just now');
  });

  it('returns minutes ago', () => {
    expect(formatTimeAgo(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(formatTimeAgo(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago');
  });

  it('returns "Yesterday"', () => {
    expect(formatTimeAgo(Date.now() - 25 * 60 * 60 * 1000)).toBe('Yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    expect(formatTimeAgo(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
  });

  it('returns date string for 7+ days', () => {
    const result = formatTimeAgo(Date.now() - 10 * 24 * 60 * 60 * 1000);
    expect(result).toMatch(/\d/); // Contains a number (date)
    expect(result).not.toContain('ago');
  });
});

describe('getRankDisplay', () => {
  it('returns gold medal for 1st place', () => {
    expect(getRankDisplay(0)).toBe('🥇');
  });

  it('returns silver medal for 2nd place', () => {
    expect(getRankDisplay(1)).toBe('🥈');
  });

  it('returns bronze medal for 3rd place', () => {
    expect(getRankDisplay(2)).toBe('🥉');
  });

  it('returns numbered rank for 4th+ place', () => {
    expect(getRankDisplay(3)).toBe('#4');
    expect(getRankDisplay(9)).toBe('#10');
  });
});

describe('getRankColor', () => {
  it('returns gold for 1st place', () => {
    expect(getRankColor(0)).toBe('#ffd700');
  });

  it('returns silver for 2nd place', () => {
    expect(getRankColor(1)).toBe('#c0c0c0');
  });

  it('returns bronze for 3rd place', () => {
    expect(getRankColor(2)).toBe('#cd7f32');
  });

  it('returns muted color for other places', () => {
    expect(getRankColor(3)).toBe('var(--text-muted)');
  });
});
