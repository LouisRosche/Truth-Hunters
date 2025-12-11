/**
 * TRUTH HUNTERS - Main Application
 * Research-based epistemic training game for middle schoolers
 */

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import {
  ErrorBoundary,
  Header,
  Button,
  PredictionModal,
  MetacognitiveCheckpoint
} from './components';

// Lazy load screen components for code-splitting
const SetupScreen = lazy(() => import('./components/SetupScreen').then(m => ({ default: m.SetupScreen })));
const PlayingScreen = lazy(() => import('./components/PlayingScreen').then(m => ({ default: m.PlayingScreen })));
const DebriefScreen = lazy(() => import('./components/DebriefScreen').then(m => ({ default: m.DebriefScreen })));
import { TEAM_AVATARS, EDUCATIONAL_TIPS } from './data/constants';
import { ACHIEVEMENTS } from './data/achievements';
import { selectClaimsByDifficulty, getRandomItem } from './utils/helpers';
import { calculateGameStats } from './utils/scoring';
import { SoundManager } from './services/sound';
import { LeaderboardManager } from './services/leaderboard';
import { FirebaseBackend } from './services/firebase';

export function App() {
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
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState(null);
  const [playPhase, setPlayPhase] = useState('discuss');
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointShown, setCheckpointShown] = useState(false);

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

  // Start game with new settings object
  const startGame = useCallback((settings) => {
    const { teamName, rounds, difficulty, avatar, soundEnabled, players, subjects } = settings;

    // Select claims based on difficulty and subjects
    const selectedClaims = selectClaimsByDifficulty(difficulty, rounds, subjects);

    // Initialize sound manager with user preference
    SoundManager.enabled = soundEnabled;

    setGameState({
      phase: 'playing',
      currentRound: 1,
      totalRounds: rounds,
      claims: selectedClaims,
      currentClaim: selectedClaims[0],
      difficulty: difficulty,
      team: {
        name: teamName,
        score: 0,
        predictedScore: 0,
        results: [],
        avatar: avatar,
        players: players || []
      }
    });

    setCurrentStreak(0);
    setHintsUsed(0);
    setPlayPhase('discuss');
  }, []);

  // Handle hint usage (deduct points)
  const handleUseHint = useCallback((cost) => {
    setHintsUsed((prev) => prev + 1);
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

        if (isLastRound) {
          setShowPrediction(true);
        } else {
          // Show metacognitive checkpoint after round 3 (for games with 5+ rounds)
          if (prev.currentRound === 3 && prev.totalRounds >= 5 && !checkpointShown) {
            setShowCheckpoint(true);
            setCheckpointShown(true);
          } else if (Math.random() > 0.5) {
            // Show educational tip between rounds (50% chance)
            setCurrentTip(getRandomItem(EDUCATIONAL_TIPS));
            setShowTip(true);
          }
        }

        // Get next claim with bounds checking
        const nextRound = prev.currentRound + 1;
        const nextClaimIndex = prev.currentRound;
        const nextClaim =
          !isLastRound && nextClaimIndex < prev.claims.length ? prev.claims[nextClaimIndex] : null;

        return {
          ...prev,
          currentRound: isLastRound ? prev.currentRound : nextRound,
          currentClaim: nextClaim,
          team: {
            ...prev.team,
            score: newScore,
            results: newResults
          }
        };
      });
      setPlayPhase('discuss');
    },
    [currentStreak]
  );

  const handlePrediction = useCallback((prediction) => {
    setShowPrediction(false);
    setGameState((prev) => {
      // Calculate final score with calibration bonus
      const calibrationBonus = Math.abs(prev.team.score - prediction) <= 2 ? 3 : 0;
      const finalScore = prev.team.score + calibrationBonus;

      // Calculate accuracy percentage
      const correctCount = prev.team.results.filter((r) => r.correct).length;
      const totalRounds = prev.team.results.length;
      const accuracy = totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0;

      // Calculate achievements earned
      const gameStats = calculateGameStats(prev.team.results, prev.claims, prev.team.score, prediction);
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

      return {
        ...prev,
        phase: 'debrief',
        team: {
          ...prev.team,
          predictedScore: prediction
        }
      };
    });
  }, []);

  const handleDismissTip = useCallback(() => {
    setShowTip(false);
    setCurrentTip(null);
  }, []);

  const handleCheckpointContinue = useCallback(() => {
    setShowCheckpoint(false);
  }, []);

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
    setPlayPhase('discuss');
    setCurrentStreak(0);
    setHintsUsed(0);
    setShowTip(false);
    setShowCheckpoint(false);
    setCheckpointShown(false);
  }, []);

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
              phase={playPhase}
              setPhase={setPlayPhase}
              difficulty={gameState.difficulty}
              currentStreak={currentStreak}
              hintsUsed={hintsUsed}
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

      {/* Prediction Modal */}
      {showPrediction && (
        <PredictionModal onSubmit={handlePrediction} currentScore={gameState.team.score} />
      )}

      {/* Mid-game Metacognitive Checkpoint */}
      {showCheckpoint && (
        <MetacognitiveCheckpoint
          onContinue={handleCheckpointContinue}
          currentScore={gameState.team.score}
          correctCount={gameState.team.results.filter(r => r.correct).length}
          totalRounds={gameState.totalRounds}
        />
      )}

      {/* Educational Tip Modal (between rounds) */}
      {showTip && currentTip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tip-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="animate-in"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{currentTip.icon}</div>
            <div
              id="tip-modal-title"
              className="mono"
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-violet)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              💡 {currentTip.category}
            </div>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: '1.25rem'
              }}
            >
              {currentTip.tip}
            </p>
            <Button onClick={handleDismissTip} fullWidth>
              Got it! Next Round →
            </Button>
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
            color: 'var(--text-muted)'
          }}
        >
          Truth Hunters • Research-based epistemic training for middle schoolers •{' '}
          {gameState.team.avatar?.emoji || '🔍'}
        </p>
      </footer>
    </ErrorBoundary>
  );
}
