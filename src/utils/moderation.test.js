/**
 * Content Moderation Tests
 */

import { describe, it, expect } from 'vitest';
import { isContentAppropriate, sanitizeInput, validateName } from './moderation';

describe('isContentAppropriate', () => {
  it('returns true for normal text', () => {
    expect(isContentAppropriate('Team Awesome')).toBe(true);
    expect(isContentAppropriate('Smart Dolphins')).toBe(true);
    expect(isContentAppropriate('Maya T.')).toBe(true);
  });

  it('returns true for empty or null input', () => {
    expect(isContentAppropriate('')).toBe(true);
    expect(isContentAppropriate(null)).toBe(true);
    expect(isContentAppropriate(undefined)).toBe(true);
  });

  it('blocks profanity', () => {
    expect(isContentAppropriate('damn it')).toBe(false);
    expect(isContentAppropriate('this is crap')).toBe(false);
  });

  it('blocks leetspeak variations', () => {
    expect(isContentAppropriate('sh1t')).toBe(false);
    expect(isContentAppropriate('f*ck')).toBe(false);
  });

  it('does not false positive on normal words', () => {
    // Words that contain blocked substrings but are legitimate
    expect(isContentAppropriate('assistant')).toBe(true);
    expect(isContentAppropriate('class')).toBe(true);
    expect(isContentAppropriate('scrap')).toBe(true);
    expect(isContentAppropriate('hello')).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('limits length to 50 characters', () => {
    const longString = 'a'.repeat(100);
    expect(sanitizeInput(longString).length).toBe(50);
  });

  it('escapes HTML characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('handles null and undefined', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('removes control characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });
});

describe('validateName', () => {
  it('validates normal names', () => {
    const result = validateName('Team Alpha');
    expect(result.isValid).toBe(true);
    expect(result.cleaned).toBe('Team Alpha');
  });

  it('rejects empty names', () => {
    const result = validateName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name cannot be empty');
  });

  it('rejects names that are too short', () => {
    const result = validateName('A');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters');
  });

  it('rejects inappropriate names', () => {
    const result = validateName('damn team');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please choose an appropriate name');
  });

  it('allows international characters', () => {
    expect(validateName('José').isValid).toBe(true);
    expect(validateName('François').isValid).toBe(true);
    expect(validateName('李明').isValid).toBe(true);
  });
});
