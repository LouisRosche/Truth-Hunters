/**
 * Generic Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shuffleArray,
  getRandomItem,
  debounce
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
