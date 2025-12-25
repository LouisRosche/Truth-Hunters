/**
 * useGameState Hook Tests
 * Tests game state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameState } from '../useGameState';

// Mock dependencies
vi.mock('../../services/gameState', () => ({
  GameStateManager: {
    save: vi.fn(),
    load: vi.fn(() => null),
    clear: vi.fn(),
    hasSavedGame: vi.fn(() => false)
  }
}));

describe('useGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes without errors', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current).toBeDefined();
  });

  it('provides state management functions', () => {
    const { result } = renderHook(() => useGameState());

    // Check that basic properties exist
    expect(typeof result.current).toBe('object');
  });
});
