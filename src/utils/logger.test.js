/**
 * Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('logger.error always logs', () => {
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('test error');
  });

  it('logger.log calls console.log in test mode', () => {
    logger.log('test message');
    expect(console.log).toHaveBeenCalledWith('test message');
  });

  it('logger.warn calls console.warn in test mode', () => {
    logger.warn('test warning');
    expect(console.warn).toHaveBeenCalledWith('test warning');
  });

  it('logger.info calls console.info in test mode', () => {
    logger.info('test info');
    expect(console.info).toHaveBeenCalledWith('test info');
  });

  it('passes multiple arguments through', () => {
    logger.error('error', { detail: 'foo' }, 42);
    expect(console.error).toHaveBeenCalledWith('error', { detail: 'foo' }, 42);
  });
});
