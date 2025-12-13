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

// Lazy load screen components for code-splitting
const SetupScreen = lazy(() => import('./components/SetupScreen').then(m => ({ default: m.SetupScreen })));
const PlayingScreen = lazy(() => import('./components/PlayingScreen').then(m => ({ default: m.PlayingScreen })));
const DebriefScreen = lazy(() => import('./components/DebriefScreen').then(m => ({ default: m.DebriefScreen })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
import { TEAM_AVATARS } from './data/constants';
import { ACHIEVEMENTS, getNewLifetimeAchievements } from './data/achievements';
import { selectClaimsByDifficulty } from './utils/helpers';
import { calculateGameStats } from './utils/scoring';
import { SoundManager } from './services/sound';
import { LeaderboardManager } from './services/leaderboard';
import { FirebaseBackend } from './services/firebase';
import { GameStateManager } from './services/gameState';
import { PlayerProfile } from './services/playerProfile';

export function App() {
  // Check for teacher mode via URL parameter (?teacher=true or #teacher)
  const [isTeacherMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hashTeacher = window.location.hash === '#teacher';
    return params.get('teacher') === 'true' || hashTeacher;
  });

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

  // Check for saved game on mount
  useEffect(() => {
    const summary = GameStateManager.getSummary();
    if (summary) {
      setSavedGameSummary(summary);
    }
  }, []);

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

  // Auto-save game state during gameplay
  useEffect(() => {
    if (gameState.phase === 'playing') {
      GameStateManager.save(gameState, currentStreak);
    } else if (gameState.phase === 'debrief' || gameState.phase === 'setup') {
      // Clear saved game when game ends normally or returns to setup
      GameStateManager.clear();
    }
  }, [gameState, currentStreak]);

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

  // Start game with new settings object - but show prediction modal first
  const startGame = useCallback((settings) => {
    const { teamName, rounds, difficulty, avatar, soundEnabled, players, subjects } = settings;

    // Get previously seen claims for solo players to prioritize new content
    const playerProfile = PlayerProfile.get();
    const previouslySeenIds = playerProfile.claimsSeen || [];

    // Select claims based on difficulty and subjects, prioritizing unseen claims
    const selectedClaims = selectClaimsByDifficulty(difficulty, rounds, subjects, previouslySeenIds);

    // Initialize sound manager with user preference
    SoundManager.enabled = soundEnabled;

    // Store pending settings and show prediction modal
    setPendingGameSettings({
      claims: selectedClaims,
      rounds,
      difficulty,
      teamName,
      avatar,
      players: players || []
    });
    setShowPrediction(true);
  }, []);

  // After prediction is submitted, actually start the game
  const handleStartPrediction = useCallback((prediction) => {
    if (!pendingGameSettings) return;

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

  // Handle hint usage (deduct points)
  const handleUseHint = useCallback((cost) => {
    setGameState((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        score: prev.team.score - cost
      }
    }));
  }, []);

  const handleRoundSubmit = useCallback(
    (result) => {
      // Update streak
      if (result.correct) {
        setCurrentStreak((prev) => prev + 1);
        // Play streak sound if this will be 3+ in a row
        if (currentStreak >= 2) {
          if (streakSoundTimeoutRef.current) {
            clearTimeout(streakSoundTimeoutRef.current);
          }
          streakSoundTimeoutRef.current = setTimeout(() => {
            SoundManager.play('streak');
            streakSoundTimeoutRef.current = null;
          }, 300);
        }
      } else {
        setCurrentStreak(0);
      }

      setGameState((prev) => {
        const newResults = [...prev.team.results, { ...result, round: prev.currentRound }];
        const newScore = prev.team.score + result.points;
        const isLastRound = prev.currentRound >= prev.totalRounds;

        // Get next claim with bounds checking
        const nextRound = prev.currentRound + 1;
        const nextClaimIndex = prev.currentRound;
        const nextClaim =
          !isLastRound && nextClaimIndex < prev.claims.length ? prev.claims[nextClaimIndex] : null;

        // If last round, finalize the game
        if (isLastRound) {
          // Calculate final score with calibration bonus (prediction was made at start)
          const calibrationBonus = Math.abs(newScore - prev.team.predictedScore) <= 2 ? 3 : 0;
          const finalScore = newScore + calibrationBonus;

          // Calculate accuracy percentage
          const correctCount = newResults.filter((r) => r.correct).length;
          const totalRounds = newResults.length;
          const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0;

          // Calculate achievements earned
          const gameStats = calculateGameStats(newResults, prev.claims, newScore, prev.team.predictedScore);
          const earnedAchievementIds = ACHIEVEMENTS.filter((a) => a.condition(gameStats)).map((a) => a.id);

          // Save to leaderboard (local + Firebase if configured)
          const gameRecord = {
            teamName: prev.team.name,
            teamAvatar: prev.team.avatar?.emoji || '🔍',
            players: prev.team.players || [],
            score: finalScore,
            accuracy: accuracy,
            difficulty: prev.difficulty,
            rounds: prev.totalRounds,
            achievements: earnedAchievementIds
          };

          LeaderboardManager.save(gameRecord);

          // Also save to Firebase for class-wide leaderboard
          if (FirebaseBackend.initialized) {
            FirebaseBackend.save(gameRecord).catch((e) => {
              console.warn('Firebase save failed:', e);
            });
          }

          // Record to player profile for solo stats tracking
          const profileData = PlayerProfile.get();
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
    [currentStreak]
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

  // Teacher mode - render dashboard only
  if (isTeacherMode) {
    return (
      <ErrorBoundary>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--text-muted)'
          }}>
            Loading Teacher Dashboard...
          </div>
        }>
          <TeacherDashboard onBack={() => {
            // Navigate back to student app by removing teacher param
            window.location.href = window.location.pathname;
          }} />
        </Suspense>
      </ErrorBoundary>
    );
  }

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
      />

      <main id="main-content" role="main" style={{ flex: 1 }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            color: 'var(--text-muted)'
          }}>
            Loading...
          </div>
        }>
          {gameState.phase === 'setup' && <SetupScreen onStart={startGame} />}

          {gameState.phase === 'playing' && gameState.currentClaim && (
            <PlayingScreen
              claim={gameState.currentClaim}
              round={gameState.currentRound}
              totalRounds={gameState.totalRounds}
              onSubmit={handleRoundSubmit}
              difficulty={gameState.difficulty}
              currentStreak={currentStreak}
              onUseHint={handleUseHint}
              teamAvatar={gameState.team.avatar}
            />
          )}

          {gameState.phase === 'debrief' && (
            <DebriefScreen
              team={gameState.team}
              claims={gameState.claims}
              onRestart={restartGame}
              difficulty={gameState.difficulty}
              teamAvatar={gameState.team.avatar}
            />
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

      {/* Saved Game Recovery Modal */}
      {savedGameSummary && gameState.phase === 'setup' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💾</div>
            <h2
              id="recovery-title"
              className="mono"
              style={{
                fontSize: '1.125rem',
                marginBottom: '0.5rem',
                color: 'var(--accent-cyan)'
              }}
            >
              Game in Progress Found
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You have an unfinished game from {savedGameSummary.timeAgoText}.
            </p>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Team</span>
                <span className="mono" style={{ fontSize: '0.875rem' }}>{savedGameSummary.teamName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Progress</span>
                <span className="mono" style={{ fontSize: '0.875rem' }}>
                  Round {savedGameSummary.currentRound} of {savedGameSummary.totalRounds}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Score</span>
                <span className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>
                  {savedGameSummary.score} pts
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={discardSavedGame}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Start Fresh
              </button>
              <button
                onClick={resumeSavedGame}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg-deep)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Resume Game
              </button>
            </div>
          </div>
        </div>
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
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            marginBottom: '0.375rem'
          }}
        >
          Truth Hunters • Research-based epistemic training for middle schoolers •{' '}
          {gameState.team.avatar?.emoji || '🔍'}
        </p>
        <a
          href="?teacher=true"
          className="mono"
          style={{
            fontSize: '0.625rem',
            color: 'var(--accent-violet)',
            textDecoration: 'none',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => { e.target.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.target.style.opacity = '0.7'; }}
        >
          Teacher Dashboard
        </a>
      </footer>
    </ErrorBoundary>
  );
}
