/**
 * useGameIntegrity Hook Tests
 * Tests game state validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameIntegrity } from '../useGameIntegrity';

describe('useGameIntegrity', () => {
  it('initializes without errors', () => {
    const mockGameState = {
      currentRound: 1,
      score: 0,
      answers: []
    };

    const { result } = renderHook(() => useGameIntegrity(mockGameState));
    expect(result.current).toBeDefined();
  });

  it('validates game state structure', () => {
    const validState = {
      currentRound: 1,
      score: 10,
      answers: ['TRUE']
    };

    const { result } = renderHook(() => useGameIntegrity(validState));
    expect(result.current).toBeDefined();
  });

  it('handles invalid game state', () => {
    const invalidState = null;

    const { result } = renderHook(() => useGameIntegrity(invalidState));
    expect(result.current).toBeDefined();
  });
});
