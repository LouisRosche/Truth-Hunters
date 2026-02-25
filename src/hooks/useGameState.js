/**
 * useGameState Hook
 * Centralized game state management for Truth Hunters
 *
 * This hook extracts the complex game state logic from App.jsx
 * to improve testability, reusability, and maintainability.
 *
 * Usage in App.jsx:
 * ```
 * const {
 *   gameState,
 *   currentStreak,
 *   startGame,
 *   handleRoundSubmit,
 *   finishGame,
 *   resetGame
 * } = useGameState();
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { TEAM_AVATARS } from '../data/constants';
import { selectClaimsByDifficulty } from '../utils/helpers';
import { calculateGameStats, calculatePoints } from '../utils/scoring';
import { GameStateManager } from '../services/gameState';
import { PlayerProfile } from '../services/playerProfile';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';
import { OfflineQueue } from '../services/offlineQueue';
import { SoundManager } from '../services/sound';

/**
 * Initial game state
 */
const getInitialState = () => ({
  phase: 'setup',
  currentRound: 0,
  totalRounds: 5,
  claims: [],
  currentClaim: null,
  difficulty: 'mixed',
  team: {
    name: '',
    score: 0,
    predictedScore: 0,
    results: [],
    avatar: TEAM_AVATARS[0],
    players: []
  }
});

/**
 * Main game state hook
 */
export function useGameState() {
  // Core game state
  const [gameState, setGameState] = useState(getInitialState);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Track prediction for comparison
  const predictionRef = useRef(null);

  /**
   * Start a new game
   */
  const startGame = useCallback((settings) => {
    const { teamName, players, rounds, difficulty, predictedScore, avatar } = settings;

    // Select claims based on difficulty
    const selectedClaims = selectClaimsByDifficulty(difficulty, rounds);

    // CRITICAL: Validate we have enough claims to start the game
    if (!selectedClaims || selectedClaims.length === 0) {
      throw new Error('No claims available to start the game. Please try a different difficulty or subject.');
    }

    if (selectedClaims.length < rounds) {
      throw new Error(`Not enough claims available. Only ${selectedClaims.length} claims found for ${rounds} rounds. Please reduce the number of rounds or change your selection.`);
    }

    // Initialize game state
    const newState = {
      phase: 'playing',
      currentRound: 0,
      totalRounds: rounds,
      claims: selectedClaims,
      currentClaim: selectedClaims[0], // Safe: validated above
      difficulty,
      team: {
        name: teamName,
        score: 0,
        predictedScore: predictedScore || 0,
        results: [],
        avatar: avatar || TEAM_AVATARS[0],
        players: players || []
      }
    };

    setGameState(newState);
    setCurrentStreak(0);
    predictionRef.current = predictedScore;

    // Save state for crash recovery
    GameStateManager.save(newState, 0);

    // Play sound
    SoundManager.play('start');

    return newState;
  }, []);

  /**
   * Handle round submission
   */
  const handleRoundSubmit = useCallback((submission) => {
    const { answer, confidence, hintsUsed } = submission;
    const { currentClaim, currentRound, totalRounds, team, claims, difficulty } = gameState;

    // Calculate points
    const isCorrect = answer === currentClaim.answer;
    const points = calculatePoints(isCorrect, confidence, difficulty);
    const deduction = hintsUsed.length * 2; // 2 points per hint
    const netPoints = points - deduction;

    // Update streak
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(newStreak);

    // Record result
    const result = {
      claim: currentClaim,
      answer,
      correct: isCorrect,
      confidence,
      points: netPoints,
      hintsUsed,
      streak: newStreak
    };

    // Update team state
    const newResults = [...team.results, result];
    const newScore = team.score + netPoints;

    // Check if game is finished
    const isLastRound = currentRound + 1 >= totalRounds;

    if (isLastRound) {
      // Game finished - transition to debrief
      const finalState = {
        ...gameState,
        phase: 'debrief',
        currentRound: currentRound + 1,
        team: {
          ...team,
          score: newScore,
          results: newResults
        }
      };

      setGameState(finalState);
      GameStateManager.clear(); // Clear saved state

      // Save to leaderboard
      saveGameRecord(finalState);

      // Play completion sound
      SoundManager.play('complete');
    } else {
      // Continue to next round
      const nextRound = currentRound + 1;
      const nextClaim = claims[nextRound];

      // CRITICAL: Validate next claim exists (safety check)
      if (!nextClaim) {
        console.error(`Claim index out of bounds: round ${nextRound} but only ${claims.length} claims available`);
        // Force game to end if we've run out of claims
        const finalState = {
          ...gameState,
          phase: 'debrief',
          currentRound: nextRound,
          team: {
            ...team,
            score: newScore,
            results: newResults
          }
        };
        setGameState(finalState);
        GameStateManager.clear();
        saveGameRecord(finalState);
        SoundManager.play('complete');
        return { isCorrect, points: netPoints, streak: newStreak };
      }

      const newState = {
        ...gameState,
        currentRound: nextRound,
        currentClaim: nextClaim,
        team: {
          ...team,
          score: newScore,
          results: newResults
        }
      };

      setGameState(newState);
      GameStateManager.save(newState, newStreak);

      // Play feedback sound
      SoundManager.play(isCorrect ? 'correct' : 'incorrect');
    }

    return { isCorrect, points: netPoints, streak: newStreak };
  }, [gameState, currentStreak]);

  /**
   * Reset game to setup phase
   */
  const resetGame = useCallback(() => {
    setGameState(getInitialState());
    setCurrentStreak(0);
    GameStateManager.clear();
  }, []);

  /**
   * Pause/unpause game
   */
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  /**
   * Resume from saved game
   */
  const resumeSavedGame = useCallback(() => {
    const saved = GameStateManager.load();
    if (saved) {
      setGameState(saved.gameState);
      setCurrentStreak(saved.currentStreak || 0);
      return true;
    }
    return false;
  }, []);

  /**
   * Get game statistics
   */
  const getGameStats = useCallback(() => {
    return calculateGameStats(gameState.team.results, gameState.team.predictedScore);
  }, [gameState]);

  return {
    // State
    gameState,
    currentStreak,
    isPaused,

    // Actions
    startGame,
    handleRoundSubmit,
    resetGame,
    togglePause,
    resumeSavedGame,
    getGameStats
  };
}

// calculatePoints is now imported from '../utils/scoring'

/**
 * Helper: Save game record to leaderboard and Firebase
 */
async function saveGameRecord(gameState) {
  const { team, difficulty, totalRounds, claims } = gameState;
  const stats = calculateGameStats(team.results, claims, team.score, team.predictedScore);

  const record = {
    teamName: team.name,
    teamAvatar: team.avatar,
    players: team.players,
    score: team.score,
    accuracy: stats.accuracy,
    difficulty,
    rounds: totalRounds,
    achievements: stats.achievements.map(a => a.id),
    timestamp: Date.now()
  };

  // Save to local leaderboard
  LeaderboardManager.save(record);

  // Save to Firebase (async, may fail)
  FirebaseBackend.save(record).catch(() => {
    // If Firebase fails, queue for later
    OfflineQueue.enqueue('game', record);
  });

  // Update player profile if solo player
  if (team.players.length === 1) {
    PlayerProfile.recordGame({
      score: team.score,
      accuracy: stats.accuracy,
      difficulty,
      rounds: totalRounds,
      achievements: stats.achievements
    });
  }
}

/**
 * Example migration from App.jsx:
 *
 * BEFORE:
 * ```jsx
 * const [gameState, setGameState] = useState({...});
 * const [currentStreak, setCurrentStreak] = useState(0);
 *
 * const handleStartGame = (settings) => {
 *   // 50 lines of logic...
 * };
 *
 * const handleRoundSubmit = (submission) => {
 *   // 80 lines of logic...
 * };
 * ```
 *
 * AFTER:
 * ```jsx
 * const {
 *   gameState,
 *   currentStreak,
 *   startGame,
 *   handleRoundSubmit,
 *   resetGame
 * } = useGameState();
 *
 * // Use directly
 * <SetupScreen onStart={startGame} />
 * <PlayingScreen
 *   claim={gameState.currentClaim}
 *   onSubmit={handleRoundSubmit}
 * />
 * ```
 */
