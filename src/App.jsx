/**
 * TRUTH HUNTERS - Main Application
 * Research-based epistemic training game for middle schoolers
 */

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import {
  ErrorBoundary,
  Header,
  PredictionModal
} from './components';
import { HelpModal } from './components/HelpModal';
import { PauseOverlay } from './components/PauseOverlay';
import { SaveGameRecoveryModal } from './components/SaveGameRecoveryModal';
import { logger } from './utils/logger';

// Lazy load screen components for code-splitting
const SetupScreen = lazy(() => import('./components/SetupScreen').then(m => ({ default: m.SetupScreen })));
const PlayingScreen = lazy(() => import('./components/PlayingScreen').then(m => ({ default: m.PlayingScreen })));
const DebriefScreen = lazy(() => import('./components/DebriefScreen').then(m => ({ default: m.DebriefScreen })));
import { TEAM_AVATARS } from './data/constants';
import { ACHIEVEMENTS, getNewLifetimeAchievements } from './data/achievements';
import { selectClaimsByDifficulty } from './utils/helpers';
import { calculateGameStats } from './utils/scoring';
import { SoundManager } from './services/sound';
import { GameStateManager } from './services/gameState';
import { PlayerProfile } from './services/playerProfile';
import { Analytics, AnalyticsEvents } from './services/analytics';
import { useOfflineToasts } from './hooks/useOfflineToasts';
import { useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';

export function App() {
  // Connect offline queue to toast notifications
  useOfflineToasts();

  // Auth gate
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [gameState, setGameState] = useState({
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

  const [showPrediction, setShowPrediction] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [savedGameSummary, setSavedGameSummary] = useState(null);
  const [isPreparingGame, setIsPreparingGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Session tracking
  const [sessionId, setSessionId] = useState(null);

  // Sound state - synced with SoundManager
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Check for saved game on mount
  useEffect(() => {
    const summary = GameStateManager.getSummary();
    if (summary) {
      setSavedGameSummary(summary);
    }
  }, []);

  // Atomic lock to prevent rapid clicking of Start Game button
  const preparingGameRef = useRef(false);

  // Presentation mode for group viewing (larger text for 4 scholars sharing 1 screen)
  const [presentationMode, setPresentationMode] = useState(() => {
    // Load from localStorage if available
    try {
      return localStorage.getItem('presentationMode') === 'true';
    } catch {
      return false;
    }
  });

  // Toggle presentation mode and persist preference
  const togglePresentationMode = useCallback(() => {
    setPresentationMode((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem('presentationMode', String(newValue));
      } catch {
        // Ignore localStorage errors
      }
      return newValue;
    });
  }, []);

  // Toggle sound and persist preference
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      SoundManager.enabled = newValue;
      try {
        localStorage.setItem('soundEnabled', String(newValue));
      } catch {
        // Ignore localStorage errors
      }
      return newValue;
    });
  }, []);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Apply presentation mode class to document
  useEffect(() => {
    if (presentationMode) {
      document.documentElement.classList.add('presentation-mode');
    } else {
      document.documentElement.classList.remove('presentation-mode');
    }
  }, [presentationMode]);

  // Ref for sound timeout cleanup
  const streakSoundTimeoutRef = useRef(null);

  // Cleanup sound timeouts on unmount
  useEffect(() => {
    return () => {
      if (streakSoundTimeoutRef.current) {
        clearTimeout(streakSoundTimeoutRef.current);
      }
    };
  }, []);

  // Warn before leaving during active gameplay
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (gameState.phase === 'playing') {
        e.preventDefault();
        e.returnValue = 'You have an active game in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState.phase]);

  // Pending game settings (waiting for prediction)
  const [pendingGameSettings, setPendingGameSettings] = useState(null);

  // Resume saved game
  const resumeSavedGame = useCallback(() => {
    const saved = GameStateManager.load();
    if (saved) {
      setGameState(saved.gameState);
      setCurrentStreak(saved.currentStreak || 0);
      setSavedGameSummary(null);
    }
  }, []);

  // Discard saved game and start fresh
  const discardSavedGame = useCallback(() => {
    GameStateManager.clear();
    setSavedGameSummary(null);
  }, []);

  // CRITICAL: Add Escape key handler for modals (WCAG 2.1.2 No Keyboard Trap)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (isPaused && gameState.phase === 'playing') {
          togglePause();
        } else if (savedGameSummary && gameState.phase === 'setup') {
          discardSavedGame();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showHelp, isPaused, savedGameSummary, gameState.phase, togglePause, discardSavedGame]);

  // Auto-save game state during gameplay
  useEffect(() => {
    if (gameState.phase === 'playing') {
      GameStateManager.save(gameState, currentStreak);
    } else if (gameState.phase === 'debrief' || gameState.phase === 'setup') {
      // Clear saved game when game ends normally or returns to setup
      GameStateManager.clear();
    }
  }, [gameState, currentStreak]);

  // Start game with new settings object - but show prediction modal first
  const startGame = useCallback(async (settings) => {
    const { teamName, rounds, difficulty, avatar, soundEnabled, players, subjects } = settings;

    // CRITICAL: Atomic lock to prevent rapid clicking
    if (preparingGameRef.current) {
      return; // Already preparing, abort
    }

    preparingGameRef.current = true;

    // Validation before starting game
    if (!teamName || teamName.trim().length === 0) {
      logger.error('Cannot start game: Team name is required');
      alert('Please enter a team name before starting the game.');
      preparingGameRef.current = false;
      return;
    }

    if (!rounds || rounds < 1 || rounds > 20) {
      logger.error('Cannot start game: Invalid rounds value', { rounds });
      alert('Please select a valid number of rounds (1-20).');
      preparingGameRef.current = false;
      return;
    }

    if (!difficulty || !['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      logger.error('Cannot start game: Invalid difficulty', { difficulty });
      alert('Please select a valid difficulty level.');
      preparingGameRef.current = false;
      return;
    }

    if (!avatar) {
      logger.error('Cannot start game: Avatar is required');
      alert('Please select a team avatar.');
      preparingGameRef.current = false;
      return;
    }
    setIsPreparingGame(true);

    try {
      // Get previously seen claims for solo players to prioritize new content
      const playerProfile = PlayerProfile.get();
      const previouslySeenIds = playerProfile.claimsSeen || [];

      // Select claims based on difficulty, subjects, and previously seen claims
      const selectedClaims = await selectClaimsByDifficulty(
        difficulty,
        rounds,
        subjects,
        previouslySeenIds
      );

      // Validate that we have enough claims to start the game
      if (!selectedClaims || selectedClaims.length === 0) {
        logger.error('Cannot start game: No claims available');
        alert('Unable to load game content. Please check your internet connection and try again.');
        preparingGameRef.current = false;
        return;
      }

      if (selectedClaims.length < rounds) {
        logger.warn('Not enough claims for requested rounds', { available: selectedClaims.length, requested: rounds });
        alert(`Only ${selectedClaims.length} claims available. Starting game with ${selectedClaims.length} rounds instead of ${rounds}.`);
      }

      // Track game start in analytics
      Analytics.track(AnalyticsEvents.GAME_STARTED, { difficulty, rounds });

      // Initialize sound manager with user preference
      SoundManager.enabled = soundEnabled;

      // Store pending settings and show prediction modal
      setPendingGameSettings({
        claims: selectedClaims,
        rounds: Math.min(rounds, selectedClaims.length), // Adjust rounds if needed
        difficulty,
        teamName,
        avatar,
        players: players || []
      });
      setShowPrediction(true);
    } catch (error) {
      logger.error('Failed to start game', error);
      alert('An error occurred while starting the game. Please try again.');
    } finally {
      setIsPreparingGame(false);
      preparingGameRef.current = false;
    }
  }, []);

  // After prediction is submitted, actually start the game
  const handleStartPrediction = useCallback((prediction) => {
    if (!pendingGameSettings) return;
    // Validate claims exist before starting
    if (!pendingGameSettings.claims?.length) {
      logger.error('No claims available to start game');
      setShowPrediction(false);
      setPendingGameSettings(null);
      return;
    }

    // Generate a unique session ID for game tracking
    const newSessionId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(newSessionId);

    setShowPrediction(false);
    setGameState({
      phase: 'playing',
      currentRound: 1,
      totalRounds: pendingGameSettings.rounds,
      claims: pendingGameSettings.claims,
      currentClaim: pendingGameSettings.claims[0],
      difficulty: pendingGameSettings.difficulty,
      team: {
        name: pendingGameSettings.teamName,
        score: 0,
        predictedScore: prediction, // Store prediction at start
        results: [],
        avatar: pendingGameSettings.avatar,
        players: pendingGameSettings.players
      }
    });

    setCurrentStreak(0);
    setPendingGameSettings(null);
  }, [pendingGameSettings]);

  // Handle hint usage (deduct points and track analytics)
  const handleUseHint = useCallback((cost, hintType = 'unknown') => {
    // Track hint usage in analytics
    Analytics.track(AnalyticsEvents.HINT_USED, { hintType });

    setGameState((prev) => {
      // CRITICAL: Validate cost to prevent NaN/Infinity propagation
      const validCost = typeof cost === 'number' && isFinite(cost) ? cost : 0;
      if (!isFinite(cost)) {
        logger.error('Invalid hint cost, using 0', { cost });
      }

      return {
        ...prev,
        team: {
          ...prev.team,
          score: prev.team.score - validCost
        }
      };
    });
  }, []);

  const handleRoundSubmit = useCallback(
    (result) => {
      // Track round completion in analytics
      Analytics.track(AnalyticsEvents.ROUND_COMPLETED, {
        correct: result.correct,
        subject: result.subject || gameState.currentClaim?.subject
      });

      // Update streak and track achievements using functional update
      // to avoid stale closure over currentStreak
      if (result.correct) {
        setCurrentStreak((prev) => {
          const newStreak = prev + 1;
          // Track streak achievements (3+ in a row)
          if (newStreak >= 3) {
            Analytics.track(AnalyticsEvents.STREAK_ACHIEVED, { streak: newStreak });
          }
          // Play streak sound for 3+ in a row
          if (newStreak >= 3) {
            if (streakSoundTimeoutRef.current) {
              clearTimeout(streakSoundTimeoutRef.current);
            }
            streakSoundTimeoutRef.current = setTimeout(() => {
              SoundManager.play('streak');
              streakSoundTimeoutRef.current = null;
            }, 300);
          }
          return newStreak;
        });
      } else {
        setCurrentStreak(0);
      }

      setGameState((prev) => {
        const newResults = [...prev.team.results, { ...result, round: prev.currentRound }];

        // CRITICAL: Validate result.points to prevent NaN/Infinity propagation
        const validPoints = typeof result.points === 'number' && isFinite(result.points) ? result.points : 0;
        if (!isFinite(result.points)) {
          logger.error('Invalid points in result, using 0', { result });
        }

        const newScore = prev.team.score + validPoints;
        const isLastRound = prev.currentRound >= prev.totalRounds;

        // Get next claim with bounds checking
        const nextRound = prev.currentRound + 1;
        // Convert 1-indexed round to 0-indexed array (round 1 = claims[0])
        const nextClaimIndex = nextRound - 1;
        const nextClaim =
          !isLastRound && nextClaimIndex < prev.claims.length ? prev.claims[nextClaimIndex] : null;

        // If last round, finalize the game
        if (isLastRound) {
          // Calculate final score with calibration bonus (prediction was made at start)
          // CRITICAL: Validate scores to prevent NaN/Infinity in calibration calculation
          const validNewScore = isFinite(newScore) ? newScore : 0;
          const validPredictedScore = isFinite(prev.team.predictedScore) ? prev.team.predictedScore : 0;

          const calibrationBonus = Math.abs(validNewScore - validPredictedScore) <= 2 ? 3 : 0;
          const finalScore = validNewScore + calibrationBonus;

          // Calculate accuracy percentage
          const correctCount = newResults.filter((r) => r.correct).length;
          const totalRounds = newResults.length;
          const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0;

          // Calculate achievements earned
          const gameStats = calculateGameStats(newResults, prev.claims, newScore, prev.team.predictedScore);
          const earnedAchievementIds = ACHIEVEMENTS.filter((a) => a.condition(gameStats)).map((a) => a.id);

          // Record to player profile for solo stats tracking
          const maxStreak = Math.max(
            ...newResults.map((_, i) => {
              let streak = 0;
              for (let j = i; j >= 0 && newResults[j].correct; j--) {
                streak++;
              }
              return streak;
            }),
            0
          );

          PlayerProfile.recordGame({
            finalScore: finalScore,
            rounds: newResults,
            claims: prev.claims,
            difficulty: prev.difficulty,
            predictedScore: prev.team.predictedScore,
            maxStreak: maxStreak,
            achievements: earnedAchievementIds,
            subjects: [] // Could track if we stored selected subjects
          });

          // Update player identity if this is their first game or name changed
          if (prev.team.players && prev.team.players.length > 0) {
            const playerName = prev.team.players[0].firstName || prev.team.name;
            PlayerProfile.updateIdentity(playerName, prev.team.avatar);
          }

          // Check for newly earned lifetime achievements
          const updatedProfile = PlayerProfile.get();
          const newLifetimeAchievements = getNewLifetimeAchievements(
            {
              ...updatedProfile.stats,
              subjectStats: updatedProfile.subjectStats,
              claimsSeen: updatedProfile.claimsSeen.length
            },
            updatedProfile.lifetimeAchievements
          );

          // Award new lifetime achievements
          newLifetimeAchievements.forEach(a => {
            PlayerProfile.awardAchievement(a.id);
          });

          // Track game completion in analytics
          Analytics.track(AnalyticsEvents.GAME_COMPLETED, {
            score: finalScore,
            accuracy,
            difficulty: prev.difficulty,
            rounds: totalRounds
          });

          // Track achievements earned
          earnedAchievementIds.forEach(achievementId => {
            Analytics.track(AnalyticsEvents.ACHIEVEMENT_EARNED, { achievementId });
          });

          return {
            ...prev,
            phase: 'debrief',
            team: {
              ...prev.team,
              score: newScore, // Keep raw score, debrief calculates bonus
              results: newResults
            }
          };
        }

        return {
          ...prev,
          currentRound: nextRound,
          currentClaim: nextClaim,
          team: {
            ...prev.team,
            score: newScore,
            results: newResults
          }
        };
      });
    },
    [gameState.currentClaim?.subject]
  );


  const restartGame = useCallback(() => {
    setGameState({
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
    setCurrentStreak(0);
  }, []);

  // Auth loading state
  if (authLoading) {
    return (
      <ErrorBoundary>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: 'var(--text-muted)',
            gap: '1rem'
          }}
        >
          <div
            className="mono"
            style={{
              width: '2rem',
              height: '2rem',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span className="mono" style={{ fontSize: '0.9rem' }}>Loading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </ErrorBoundary>
    );
  }

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <a
          href="#login-content"
          className="sr-only"
          style={{
            position: 'absolute',
            top: '-40px',
            left: 0,
            background: 'var(--accent-cyan)',
            color: 'var(--bg-deep)',
            padding: '0.5rem 1rem',
            zIndex: 9999,
            transition: 'top 0.2s ease'
          }}
          onFocus={(e) => { e.target.style.top = '0'; }}
          onBlur={(e) => { e.target.style.top = '-40px'; }}
        >
          Skip to main content
        </a>
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  // Authenticated - render main app
  return (
    <ErrorBoundary>
      {/* Skip to main content link for screen reader users */}
      <a
        href="#main-content"
        className="sr-only"
        style={{
          position: 'absolute',
          top: '-40px',
          left: 0,
          background: 'var(--accent-cyan)',
          color: 'var(--bg-deep)',
          padding: '0.5rem 1rem',
          zIndex: 9999,
          transition: 'top 0.2s ease'
        }}
        onFocus={(e) => { e.target.style.top = '0'; }}
        onBlur={(e) => { e.target.style.top = '-40px'; }}
      >
        Skip to main content
      </a>

      <Header
        score={gameState.team.score}
        round={gameState.currentRound}
        totalRounds={gameState.totalRounds}
        phase={gameState.phase}
        presentationMode={presentationMode}
        onTogglePresentationMode={togglePresentationMode}
        onExitGame={restartGame}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onShowHelp={() => setShowHelp(true)}
      />

      <main id="main-content" role="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            color: 'var(--text-muted)'
          }}>
            Loading...
          </div>
        }>
          {gameState.phase === 'setup' && (
            <ErrorBoundary
              onReset={restartGame}
              resetLabel="Reset Setup"
            >
              <SetupScreen onStart={startGame} isLoading={isPreparingGame} />
            </ErrorBoundary>
          )}

          {gameState.phase === 'playing' && gameState.currentClaim && (
            <ErrorBoundary
              onReset={restartGame}
              resetLabel="Exit to Setup"
            >
              <PlayingScreen
                claim={gameState.currentClaim}
                round={gameState.currentRound}
                totalRounds={gameState.totalRounds}
                onSubmit={handleRoundSubmit}
                difficulty={gameState.difficulty}
                currentStreak={currentStreak}
                onUseHint={handleUseHint}
                teamAvatar={gameState.team.avatar}
                isPaused={isPaused}
                previousResults={gameState.team.results}
                claims={gameState.claims}
                currentScore={gameState.team.score}
                predictedScore={gameState.team.predictedScore}
                sessionId={sessionId}
              />
            </ErrorBoundary>
          )}

          {gameState.phase === 'debrief' && (
            <ErrorBoundary
              onReset={restartGame}
              resetLabel="Return to Setup"
            >
              <DebriefScreen
                team={gameState.team}
                claims={gameState.claims}
                onRestart={restartGame}
                difficulty={gameState.difficulty}
                teamAvatar={gameState.team.avatar}
              />
            </ErrorBoundary>
          )}
        </Suspense>
      </main>

      {/* Prediction Modal - shown at start of game for metacognition priming */}
      {showPrediction && pendingGameSettings && (
        <PredictionModal
          onSubmit={handleStartPrediction}
          totalRounds={pendingGameSettings.rounds}
          difficulty={pendingGameSettings.difficulty}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {/* Pause Overlay */}
      {isPaused && gameState.phase === 'playing' && (
        <PauseOverlay
          currentRound={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          score={gameState.team.score}
          onResume={togglePause}
        />
      )}

      {/* Saved Game Recovery Modal */}
      {savedGameSummary && gameState.phase === 'setup' && (
        <SaveGameRecoveryModal
          summary={savedGameSummary}
          onResume={resumeSavedGame}
          onDiscard={discardSavedGame}
        />
      )}

      <footer
        className="no-print"
        style={{
          padding: '0.875rem',
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}
      >
        <p
          className="mono"
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '0.375rem'
          }}
        >
          Truth Hunters • Research-based epistemic training for middle schoolers •{' '}
          {gameState.team.avatar?.emoji || '🔍'}
        </p>
      </footer>
    </ErrorBoundary>
  );
}
