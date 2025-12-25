/**
 * useGameState Hook Tests
 * Tests game state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

vi.mock('../../services/playerProfile', () => ({
  PlayerProfile: {
    recordGame: vi.fn(),
    get: vi.fn(() => ({ games: [] }))
  }
}));

vi.mock('../../services/leaderboard', () => ({
  LeaderboardManager: {
    save: vi.fn(),
    getAll: vi.fn(() => [])
  }
}));

vi.mock('../../services/firebase', () => ({
  FirebaseBackend: {
    save: vi.fn(() => Promise.resolve()),
    init: vi.fn()
  }
}));

vi.mock('../../services/offlineQueue', () => ({
  OfflineQueue: {
    enqueue: vi.fn(),
    sync: vi.fn()
  }
}));

vi.mock('../../services/sound', () => ({
  SoundManager: {
    play: vi.fn(),
    init: vi.fn()
  }
}));

vi.mock('../../utils/helpers', () => ({
  selectClaimsByDifficulty: vi.fn(() => Promise.resolve([
    { id: '1', difficulty: 'easy', answer: 'TRUE' },
    { id: '2', difficulty: 'easy', answer: 'FALSE' },
    { id: '3', difficulty: 'medium', answer: 'MIXED' }
  ]))
}));

vi.mock('../../utils/scoring', () => ({
  calculateGameStats: vi.fn(() => ({
    accuracy: 75,
    achievements: [{ id: 'first-game', name: 'First Game' }]
  })),
  calculatePoints: vi.fn(() => 5)
}));

describe('useGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes without errors', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current).toBeDefined();
    });

    it('provides state management functions', () => {
      const { result } = renderHook(() => useGameState());

      expect(result.current).toHaveProperty('gameState');
      expect(result.current).toHaveProperty('currentStreak');
      expect(result.current).toHaveProperty('startGame');
      expect(result.current).toHaveProperty('handleRoundSubmit');
      expect(result.current).toHaveProperty('resetGame');
      expect(result.current).toHaveProperty('togglePause');
      expect(result.current).toHaveProperty('resumeSavedGame');
      expect(result.current).toHaveProperty('getGameStats');
    });

    it('initializes with setup phase', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current.gameState.phase).toBe('setup');
    });

    it('initializes with zero current round', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current.gameState.currentRound).toBe(0);
    });

    it('initializes with default 5 rounds', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current.gameState.totalRounds).toBe(5);
    });

    it('initializes with zero streak', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current.currentStreak).toBe(0);
    });

    it('initializes not paused', () => {
      const { result } = renderHook(() => useGameState());
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('startGame', () => {
    it('starts a new game with valid settings', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          players: [{ name: 'Player 1' }],
          rounds: 3,
          difficulty: 'easy',
          predictedScore: 10,
          avatar: '🎮'
        });
      });

      expect(result.current.gameState.phase).toBe('playing');
      expect(result.current.gameState.team.name).toBe('Test Team');
      expect(result.current.gameState.totalRounds).toBe(3);
      expect(result.current.gameState.difficulty).toBe('easy');
    });

    it('initializes with first claim', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      expect(result.current.gameState.currentClaim).toBeDefined();
      expect(result.current.gameState.currentClaim.id).toBe('1');
    });

    it('saves game state for crash recovery', async () => {
      const { GameStateManager } = await import('../../services/gameState');
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      expect(GameStateManager.save).toHaveBeenCalled();
    });

    it('plays start sound', async () => {
      const { SoundManager } = await import('../../services/sound');
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      expect(SoundManager.play).toHaveBeenCalledWith('start');
    });

    it('throws error when no claims available', async () => {
      const { selectClaimsByDifficulty } = await import('../../utils/helpers');
      selectClaimsByDifficulty.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useGameState());

      await expect(async () => {
        await act(async () => {
          await result.current.startGame({
            teamName: 'Test Team',
            rounds: 3,
            difficulty: 'easy'
          });
        });
      }).rejects.toThrow('No claims available');
    });

    it('throws error when not enough claims for rounds', async () => {
      const { selectClaimsByDifficulty } = await import('../../utils/helpers');
      selectClaimsByDifficulty.mockResolvedValueOnce([
        { id: '1', difficulty: 'easy', answer: 'TRUE' }
      ]);

      const { result } = renderHook(() => useGameState());

      await expect(async () => {
        await act(async () => {
          await result.current.startGame({
            teamName: 'Test Team',
            rounds: 5,
            difficulty: 'easy'
          });
        });
      }).rejects.toThrow('Not enough claims available');
    });
  });

  describe('handleRoundSubmit', () => {
    beforeEach(async () => {
      // Start a game before each test
      const { result } = renderHook(() => useGameState());
      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });
    });

    it('processes correct answer', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      let submitResult;
      act(() => {
        submitResult = result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(submitResult.isCorrect).toBe(true);
      expect(result.current.currentStreak).toBe(1);
    });

    it('processes incorrect answer', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      let submitResult;
      act(() => {
        submitResult = result.current.handleRoundSubmit({
          answer: 'FALSE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(submitResult.isCorrect).toBe(false);
      expect(result.current.currentStreak).toBe(0);
    });

    it('advances to next round', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      const initialRound = result.current.gameState.currentRound;

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.gameState.currentRound).toBe(initialRound + 1);
    });

    it('transitions to debrief on last round', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 1,
          difficulty: 'easy'
        });
      });

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.gameState.phase).toBe('debrief');
    });

    it('increases streak on consecutive correct answers', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.currentStreak).toBe(1);

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'FALSE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.currentStreak).toBe(2);
    });

    it('resets streak on incorrect answer', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.currentStreak).toBe(1);

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE', // Wrong answer for claim 2 which is FALSE
          confidence: 2,
          hintsUsed: []
        });
      });

      expect(result.current.currentStreak).toBe(0);
    });

    it('deducts points for hints used', async () => {
      const { calculatePoints } = await import('../../utils/scoring');
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      let submitResult;
      act(() => {
        submitResult = result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: ['hint1', 'hint2']
        });
      });

      // Points should be deducted: 5 - (2 * 2) = 1
      expect(submitResult.points).toBeLessThan(5);
    });
  });

  describe('resetGame', () => {
    it('resets to initial state', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.gameState.phase).toBe('setup');
      expect(result.current.gameState.currentRound).toBe(0);
      expect(result.current.currentStreak).toBe(0);
    });

    it('clears saved game state', async () => {
      const { GameStateManager } = await import('../../services/gameState');
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy'
        });
      });

      act(() => {
        result.current.resetGame();
      });

      expect(GameStateManager.clear).toHaveBeenCalled();
    });
  });

  describe('togglePause', () => {
    it('toggles pause state', () => {
      const { result } = renderHook(() => useGameState());

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('resumeSavedGame', () => {
    it('resumes from saved state', () => {
      const { GameStateManager } = require('../../services/gameState');
      GameStateManager.load.mockReturnValueOnce({
        gameState: {
          phase: 'playing',
          currentRound: 2,
          totalRounds: 5
        },
        currentStreak: 3
      });

      const { result } = renderHook(() => useGameState());

      let resumed;
      act(() => {
        resumed = result.current.resumeSavedGame();
      });

      expect(resumed).toBe(true);
      expect(result.current.gameState.phase).toBe('playing');
      expect(result.current.gameState.currentRound).toBe(2);
      expect(result.current.currentStreak).toBe(3);
    });

    it('returns false when no saved game', () => {
      const { GameStateManager } = require('../../services/gameState');
      GameStateManager.load.mockReturnValueOnce(null);

      const { result } = renderHook(() => useGameState());

      let resumed;
      act(() => {
        resumed = result.current.resumeSavedGame();
      });

      expect(resumed).toBe(false);
    });
  });

  describe('getGameStats', () => {
    it('calculates game statistics', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 3,
          difficulty: 'easy',
          predictedScore: 10
        });
      });

      const stats = result.current.getGameStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('accuracy');
      expect(stats).toHaveProperty('achievements');
    });
  });

  describe('edge cases', () => {
    it('handles missing next claim gracefully', async () => {
      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.startGame({
          teamName: 'Test Team',
          rounds: 1,
          difficulty: 'easy'
        });
      });

      // Manually break the claims array
      result.current.gameState.claims = [];

      act(() => {
        result.current.handleRoundSubmit({
          answer: 'TRUE',
          confidence: 2,
          hintsUsed: []
        });
      });

      // Should transition to debrief instead of crashing
      expect(result.current.gameState.phase).toBe('debrief');
    });

    it('handles zero rounds request', async () => {
      const { result } = renderHook(() => useGameState());

      await expect(async () => {
        await act(async () => {
          await result.current.startGame({
            teamName: 'Test Team',
            rounds: 0,
            difficulty: 'easy'
          });
        });
      }).rejects.toThrow();
    });
  });
});

