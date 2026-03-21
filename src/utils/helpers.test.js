/**
 * Helper Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { shuffleArray, getRandomItem, getHintContent } from './helpers';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('contains same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('does not modify original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe('getRandomItem', () => {
  it('returns item from array', () => {
    const arr = ['a', 'b', 'c'];
    const item = getRandomItem(arr);
    expect(arr).toContain(item);
  });

  it('handles single element array', () => {
    expect(getRandomItem(['only'])).toBe('only');
  });
});

describe('getHintContent', () => {
  it('returns source hint for AI claim', () => {
    const claim = { source: 'ai-generated' };
    const hint = getHintContent(claim, 'source-hint');
    expect(hint).toContain('AI');
  });

  it('returns source hint for expert claim', () => {
    const claim = { source: 'expert-sourced' };
    const hint = getHintContent(claim, 'source-hint');
    expect(hint).toContain('expert');
  });

  it('returns error pattern for AI claim', () => {
    const claim = { source: 'ai-generated', errorPattern: 'Myth perpetuation' };
    const hint = getHintContent(claim, 'error-hint');
    expect(hint).toContain('Myth perpetuation');
  });

  it('returns neutral message for expert claim error hint', () => {
    const claim = { source: 'expert-sourced' };
    const hint = getHintContent(claim, 'error-hint');
    expect(hint).toContain("doesn't contain");
  });

  it('returns subject hint', () => {
    const claim = { subject: 'Biology' };
    const hint = getHintContent(claim, 'subject-hint');
    expect(hint.length).toBeGreaterThan(0);
  });

  it('returns fallback for unknown hint type', () => {
    const claim = {};
    const hint = getHintContent(claim, 'unknown-hint');
    expect(hint).toBe('No hint available.');
  });
});
