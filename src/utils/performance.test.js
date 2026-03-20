/**
 * Performance Monitoring Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { perfMonitor, debounce, throttle } from './performance';

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('PerformanceMonitor', () => {
  it('start/end measures duration', () => {
    perfMonitor.start('test-metric');
    const duration = perfMonitor.end('test-metric', false);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(typeof duration).toBe('number');
  });

  it('end returns 0 for unstarted metric', () => {
    const duration = perfMonitor.end('never-started', false);
    expect(duration).toBe(0);
  });

  it('cleans up metric after end', () => {
    perfMonitor.start('cleanup-test');
    perfMonitor.end('cleanup-test', false);
    // Second call should return 0 (metric was deleted)
    const secondCall = perfMonitor.end('cleanup-test', false);
    expect(secondCall).toBe(0);
  });

  it('measure wraps a function and returns its result', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const result = await perfMonitor.measure('test-measure', fn);
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('measure re-throws errors from measured function', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('test error'));
    await expect(perfMonitor.measure('error-measure', fn)).rejects.toThrow('test error');
  });

  it('isLowPowerDevice returns a boolean', () => {
    const result = perfMonitor.isLowPowerDevice();
    expect(typeof result).toBe('boolean');
  });

  it('getRecommendations returns recommendations object', () => {
    const result = perfMonitor.getRecommendations();
    expect(result).toHaveProperty('isLowPowerDevice');
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

describe('debounce (performance)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets delay on rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('blocks subsequent calls within limit', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows calls after limit expires', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);
    throttled();
    vi.advanceTimersByTime(200);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments through', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 200);
    throttled('a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});
