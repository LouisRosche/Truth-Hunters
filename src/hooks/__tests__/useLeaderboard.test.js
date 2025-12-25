/**
 * useLeaderboard Hook Tests
 * Tests leaderboard data fetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTeamLeaderboard } from '../useLeaderboard';

vi.mock('../../services/leaderboard', () => ({
  LeaderboardManager: {
    getAll: vi.fn(() => [
      { teamName: 'Team A', score: 100 },
      { teamName: 'Team B', score: 90 }
    ])
  }
}));

vi.mock('../../services/firebase', () => ({
  FirebaseBackend: {
    initialized: false,
    getTopTeams: vi.fn(() => Promise.resolve([]))
  }
}));

describe('useTeamLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with valid state', () => {
    const { result } = renderHook(() => useTeamLeaderboard());
    // Should have the expected properties
    expect(result.current).toHaveProperty('teams');
    expect(result.current).toHaveProperty('isLoading');
  });

  it('fetches and returns team data', async () => {
    const { result } = renderHook(() => useTeamLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.teams).toBeDefined();
    expect(Array.isArray(result.current.teams)).toBe(true);
  });

  it('handles errors gracefully', async () => {
    const { LeaderboardManager } = await import('../../services/leaderboard');
    LeaderboardManager.getAll.mockImplementationOnce(() => {
      throw new Error('Fetch failed');
    });

    const { result } = renderHook(() => useTeamLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error or empty array
    expect(result.current.error || result.current.teams.length === 0).toBeTruthy();
  });
});
