/**
 * PLAYING SCREEN
 * Main gameplay component - single unified screen for claim evaluation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from './Button';
import { ClaimCard } from './ClaimCard';
import { ConfidenceSelector } from './ConfidenceSelector';
import { VerdictSelector } from './VerdictSelector';
import { LiveClassLeaderboard } from './LiveClassLeaderboard';
import { DIFFICULTY_CONFIG, DIFFICULTY_BG_COLORS, DIFFICULTY_MULTIPLIERS, HINT_TYPES, ENCOURAGEMENTS, ANTI_CHEAT } from '../data/constants';
import { calculatePoints } from '../utils/scoring';
import { getRandomItem, getHintContent } from '../utils/helpers';
import { SoundManager } from '../services/sound';
import { useGameIntegrity } from '../hooks/useGameIntegrity';

// Calibration-based tips that rotate based on performance
const CALIBRATION_TIPS = {
  overconfident: [
    "💡 High confidence but wrong? Consider checking sources before committing.",
    "💡 When very confident, ask: 'What would make this false?'",
    "💡 Overconfidence is common! Slow down on claims that feel 'obvious'."
  ],
  underconfident: [
    "💡 You knew more than you thought! Trust your team's reasoning.",
    "💡 Low confidence but correct? Your instincts are good - trust them more!",
    "💡 When uncertain, your first group consensus is often right."
  ],
  calibrated: [
    "💡 Great calibration! Your confidence matched reality.",
    "💡 Well calibrated! Keep using evidence to guide confidence.",
    "💡 Nice work matching confidence to accuracy!"
  ]
};

export function PlayingScreen({
  claim,
  round,
  totalRounds,
  onSubmit,
  difficulty: _difficulty,
  currentStreak,
  onUseHint,
  teamAvatar,
  isPaused: _isPaused,
  previousResults = [],
  claims = [],
  currentScore = 0,
  predictedScore = 0,
  sessionId = null,
  showLiveLeaderboard = true,
  onToggleLiveLeaderboard = () => {}
}) {
  const [confidence, setConfidence] = useState(2);
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [activeHint, setActiveHint] = useState(null);
  const [usedHints, setUsedHints] = useState([]); // Track all hints used this round
  const [hintCostTotal, setHintCostTotal] = useState(0); // Running total of hint costs
  const [encouragement, setEncouragement] = useState('');
  const [calibrationTip, setCalibrationTip] = useState(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);
  const [showPreviousRounds, setShowPreviousRounds] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [forfeitAcknowledged, setForfeitAcknowledged] = useState(true);

  const roundStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Check if tutorial should be shown (first time user in this session)
  useEffect(() => {
    const tutorialData = localStorage.getItem('truthDetector_tutorialSeen');
    const lastSessionId = tutorialData ? JSON.parse(tutorialData).sessionId : null;

    // Show tutorial if: (1) never seen, OR (2) new session started
    const shouldShow = round === 1 && (!tutorialData || lastSessionId !== sessionId);

    if (shouldShow) {
      setShowTutorial(true);
    }
  }, [round, sessionId]);

  // Get time limits from difficulty config
  const totalTimeAllowed = DIFFICULTY_CONFIG[_difficulty]?.discussTime || 120;

  // Anti-cheat integrity tracking
  const integrity = useGameIntegrity(
    !showResult, // Active when not showing result
    (switchCount) => {
      // Show warning on tab switch - requires acknowledgment now
      setTabSwitchWarning(switchCount);
      setForfeitAcknowledged(false);
      SoundManager.play('incorrect'); // Play warning sound
    },
    () => {
      // Auto-forfeit on max switches exceeded
      if (!showResult) {
        // Force submit with forfeit penalty - no verdict since they cheated
        const correct = false;
        const points = ANTI_CHEAT.FORFEIT_PENALTY;
        const timeElapsed = roundStartTimeRef.current
          ? Math.floor((Date.now() - roundStartTimeRef.current) / 1000)
          : 0;
        setResultData({ correct, points, confidence, verdict: null, forfeited: true, timeElapsed, forfeitReason: 'tab-switch' });
        setShowResult(true);
      }
    }
  );

  // Keyboard shortcuts for faster gameplay
  // Memoize the handler to prevent memory leaks from stale closures
  const handleKeyDown = useCallback((e) => {
    // Don't trigger if user is typing in textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    if (!showResult) {
      // Verdict shortcuts
      if (e.key === 't' || e.key === 'T') {
        setVerdict('TRUE');
        SoundManager.play('tick');
      } else if (e.key === 'f' || e.key === 'F') {
        setVerdict('FALSE');
        SoundManager.play('tick');
      } else if (e.key === 'm' || e.key === 'M') {
        setVerdict('MIXED');
        SoundManager.play('tick');
      }
      // Confidence shortcuts
      else if (e.key === '1') {
        setConfidence(1);
        SoundManager.play('tick');
      } else if (e.key === '2') {
        setConfidence(2);
        SoundManager.play('tick');
      } else if (e.key === '3') {
        setConfidence(3);
        SoundManager.play('tick');
      }
      // Submit with Enter when verdict is selected
      else if (e.key === 'Enter' && verdict) {
        e.preventDefault();
        setPendingSubmit(true);
      }
      // Show keyboard hint with ?
      else if (e.key === '?') {
        setShowKeyboardHint(prev => !prev);
      }
    } else {
      // In result view, Enter advances to next round
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setPendingNext(true);
      }
    }
  }, [showResult, verdict]); // Include all dependencies used inside handler

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]); // Now depends on the memoized handler

  // Timer effect - starts when claim loads, resets when showResult changes
  useEffect(() => {
    if (!showResult && claim) {
      // Start timer
      roundStartTimeRef.current = Date.now();
      setTimeRemaining(totalTimeAllowed);

      // Update timer every second
      timerIntervalRef.current = setInterval(() => {
        if (roundStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - roundStartTimeRef.current) / 1000);
          const remaining = Math.max(0, totalTimeAllowed - elapsed);
          setTimeRemaining(remaining);

          // Auto-submit when time runs out (forfeit always - let interval check verdict)
          if (remaining === 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            // Set a flag to trigger submission check
            setPendingSubmit(true);
          }
        }
      }, 1000);
    } else {
      // Clear timer when showing result
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [showResult, claim, totalTimeAllowed]); // Removed verdict dependency

  // Handle pending keyboard actions and timer auto-submit (to avoid circular dependencies)
  useEffect(() => {
    if (pendingSubmit && claim) {
      setPendingSubmit(false);

      // If no verdict selected (time ran out), forfeit the round
      if (!verdict) {
        const timeElapsed = roundStartTimeRef.current
          ? Math.floor((Date.now() - roundStartTimeRef.current) / 1000)
          : totalTimeAllowed;

        setResultData({
          correct: false,
          points: ANTI_CHEAT.FORFEIT_PENALTY,
          confidence,
          verdict: null,
          forfeited: true,
          timeElapsed,
          forfeitReason: 'time-out'
        });
        setShowResult(true);
        SoundManager.play('incorrect');
        return;
      }

      // Normal verdict submission
      const correct = verdict === claim.answer;

      // Calculate time elapsed for speed bonus
      const timeElapsed = roundStartTimeRef.current
        ? Math.floor((Date.now() - roundStartTimeRef.current) / 1000)
        : totalTimeAllowed;

      // Calculate points with speed bonus and integrity penalties
      const pointsResult = calculatePoints(correct, confidence, _difficulty, {
        timeElapsed,
        totalTime: totalTimeAllowed,
        integrityPenalty: integrity.penalty
      });

      const points = typeof pointsResult === 'number' ? pointsResult : pointsResult.points;
      const speedBonus = typeof pointsResult === 'object' ? pointsResult.speedBonus : null;

      SoundManager.play(correct ? 'correct' : 'incorrect');
      const msgs = correct ? ENCOURAGEMENTS.correct : ENCOURAGEMENTS.incorrect;
      setEncouragement(getRandomItem(msgs) || (correct ? 'Nice work!' : 'Keep trying!'));
      let calibrationType = 'calibrated';
      if (correct && confidence === 1) calibrationType = 'underconfident';
      else if (!correct && confidence === 3) calibrationType = 'overconfident';
      setCalibrationTip(getRandomItem(CALIBRATION_TIPS[calibrationType]) || null);
      setResultData({ correct, points, confidence, verdict, speedBonus, timeElapsed });
      setShowResult(true);
    }
  }, [pendingSubmit, verdict, claim, confidence, _difficulty, totalTimeAllowed, integrity.penalty]);

  useEffect(() => {
    if (pendingNext && resultData) {
      setPendingNext(false);
      onSubmit({
        claimId: claim.id,
        teamVerdict: resultData.verdict,
        confidence: resultData.confidence,
        correct: resultData.correct,
        points: resultData.points,
        reasoning
      });
      // Reset for next round
      setConfidence(2);
      setVerdict(null);
      setReasoning('');
      setShowResult(false);
      setResultData(null);
      setActiveHint(null);
      setUsedHints([]);
      setHintCostTotal(0);
      setCalibrationTip(null);
      setForfeitAcknowledged(true); // Reset forfeit warning for next round
      integrity.reset(); // Reset anti-cheat tracking
    }
  }, [pendingNext, resultData, claim, reasoning, onSubmit, integrity]);

  const handleSubmitVerdict = useCallback(() => {
    if (!verdict || !claim) return;

    const correct = verdict === claim.answer;

    // Calculate time elapsed for speed bonus
    const timeElapsed = roundStartTimeRef.current
      ? Math.floor((Date.now() - roundStartTimeRef.current) / 1000)
      : totalTimeAllowed;

    // Calculate points with speed bonus and integrity penalties
    const pointsResult = calculatePoints(correct, confidence, _difficulty, {
      timeElapsed,
      totalTime: totalTimeAllowed,
      integrityPenalty: integrity.penalty
    });

    const points = typeof pointsResult === 'number' ? pointsResult : pointsResult.points;
    const speedBonus = typeof pointsResult === 'object' ? pointsResult.speedBonus : null;

    SoundManager.play(correct ? 'correct' : 'incorrect');

    const msgs = correct ? ENCOURAGEMENTS.correct : ENCOURAGEMENTS.incorrect;
    setEncouragement(getRandomItem(msgs) || (correct ? 'Nice work!' : 'Keep trying!'));

    // Determine calibration and show relevant tip
    let calibrationType = 'calibrated';
    if (correct && confidence === 1) calibrationType = 'underconfident';
    else if (!correct && confidence === 3) calibrationType = 'overconfident';
    else if (correct && confidence === 3) calibrationType = 'calibrated';
    else if (!correct && confidence === 1) calibrationType = 'calibrated';

    setCalibrationTip(getRandomItem(CALIBRATION_TIPS[calibrationType]) || null);
    setResultData({ correct, points, confidence, verdict, speedBonus, timeElapsed });
    setShowResult(true);
  }, [verdict, confidence, claim, _difficulty, totalTimeAllowed, integrity.penalty]);

  const handleNextRound = useCallback(() => {
    onSubmit({
      claimId: claim.id,
      teamVerdict: resultData.verdict,
      confidence: resultData.confidence,
      correct: resultData.correct,
      points: resultData.points,
      reasoning
    });

    // Reset for next round
    setConfidence(2);
    setVerdict(null);
    setReasoning('');
    setShowResult(false);
    setResultData(null);
    setActiveHint(null);
    setUsedHints([]);
    setHintCostTotal(0);
    setCalibrationTip(null);
    setForfeitAcknowledged(true); // Reset forfeit warning for next round
    integrity.reset(); // Reset anti-cheat tracking
  }, [claim, resultData, reasoning, onSubmit, integrity]);

  const handleHintRequest = (hintType) => {
    const hint = HINT_TYPES.find((h) => h.id === hintType);
    if (!hint || usedHints.includes(hintType)) return;

    const content = getHintContent(claim, hintType);
    setActiveHint({ ...hint, content });
    setUsedHints(prev => [...prev, hintType]);
    setHintCostTotal(prev => prev + hint.cost);
    onUseHint(hint.cost, hintType);
    SoundManager.play('tick');
  };

  const isLastRound = round >= totalRounds;

  // Calculate confidence risk preview
  const getConfidencePreview = () => {
    const basePoints = {
      1: { correct: 1, incorrect: -1 },
      2: { correct: 3, incorrect: -3 },
      3: { correct: 5, incorrect: -6 }
    }[confidence];
    const multiplier = DIFFICULTY_MULTIPLIERS[_difficulty] || 1;
    return {
      ifCorrect: Math.round(basePoints.correct * multiplier),
      ifWrong: -Math.round(Math.abs(basePoints.incorrect * multiplier))
    };
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0.75rem' }}>
      {/* Mobile responsive CSS */}
      <style>{`
        @media (max-width: 700px) {
          .voting-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Tutorial Overlay - First Time Users */}
      {showTutorial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--accent-violet)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '500px',
              boxShadow: '0 0 30px rgba(167, 139, 250, 0.5)'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-violet)' }}>
              🎮 Welcome to Truth Detector!
            </h2>
            <div style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--accent-amber)' }}>⚡ Gold timer = speed bonus zone</strong><br />
                Answer faster to earn multipliers up to 2.0x!
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--incorrect)' }}>⚠️ Don't switch tabs or round forfeits!</strong><br />
                Zero tolerance: ANY tab switch = -10 points
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>💡 Higher confidence = higher stakes</strong><br />
                Confidence ●●●: +5 pts if right, -6 pts if wrong
              </p>
              <p>
                <strong style={{ color: 'var(--accent-emerald)' }}>⌨️ Keyboard shortcuts</strong><br />
                T/F/M for verdict · 1-3 for confidence · Enter to submit · ? for help
              </p>
            </div>
            <Button
              onClick={() => {
                setShowTutorial(false);
                // Store session ID to allow tutorial again in new sessions
                localStorage.setItem('truthDetector_tutorialSeen', JSON.stringify({ sessionId, seen: true }));
              }}
              fullWidth
            >
              Got it! Let's play 🎯
            </Button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '3px',
          background: 'var(--bg-elevated)',
          borderRadius: '2px',
          marginBottom: '0.5rem',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${(round / totalRounds) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Calibration Tracker - shows predicted vs current score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}
      >
        <div
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'var(--bg-elevated)',
            borderRadius: '4px',
            fontSize: '0.625rem'
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Predicted: <span style={{ color: 'var(--accent-violet)' }}>{predictedScore}</span>
          </span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>
            Current: <span style={{ color: currentScore >= 0 ? 'var(--correct)' : 'var(--incorrect)' }}>{currentScore >= 0 ? '+' : ''}{currentScore}</span>
          </span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{
            color: Math.abs(currentScore - predictedScore) <= 2 ? 'var(--correct)' : 'var(--accent-amber)',
            fontWeight: Math.abs(currentScore - predictedScore) <= 2 ? 600 : 400
          }}>
            {Math.abs(currentScore - predictedScore) <= 2 ? '✓ On track' : `${currentScore > predictedScore ? '+' : ''}${currentScore - predictedScore} off`}
          </span>
        </div>
      </div>

      {/* Live Class Leaderboard - shows all students' scores in real-time */}
      {sessionId && (
        <LiveClassLeaderboard
          currentSessionId={sessionId}
          isMinimized={!showLiveLeaderboard}
          onToggle={onToggleLiveLeaderboard}
        />
      )}

      {/* Tab Switch Warning - PERSISTENT (requires acknowledgment) */}
      {tabSwitchWarning !== null && ANTI_CHEAT.ENABLED && !forfeitAcknowledged && (
        <div
          className="animate-shake"
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '3px solid var(--incorrect)',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
          }}
        >
          <div className="mono" style={{ fontSize: '1rem', color: 'var(--incorrect)', fontWeight: 700, marginBottom: '0.5rem' }}>
            🚫 TAB SWITCH DETECTED!
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            This round has been forfeited.<br />
            <strong>{ANTI_CHEAT.FORFEIT_PENALTY} points penalty</strong>
          </div>
          <Button
            onClick={() => {
              setForfeitAcknowledged(true);
              setTabSwitchWarning(null);
            }}
            fullWidth
          >
            I Understand
          </Button>
        </div>
      )}

      {/* Top Bar: Round + Timer + Streak + Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div
            className="mono"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.6875rem',
              background: 'var(--bg-elevated)',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}
          >
            {round}/{totalRounds}
          </div>
          {/* Timer Display with speed bonus zones */}
          {!showResult && timeRemaining !== null && (
            <div
              className="mono"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.6875rem',
                background: (() => {
                  if (timeRemaining <= 10) return 'rgba(239, 68, 68, 0.15)';
                  const elapsed = totalTimeAllowed - timeRemaining;
                  const pct = elapsed / totalTimeAllowed;
                  if (pct <= 0.10) return 'rgba(251, 191, 36, 0.25)'; // Ultra lightning zone
                  if (pct <= 0.20) return 'rgba(251, 191, 36, 0.2)'; // Lightning zone
                  if (pct <= 0.35) return 'rgba(251, 191, 36, 0.15)'; // Very fast zone
                  if (pct <= 0.50) return 'rgba(167, 139, 250, 0.15)'; // Fast zone
                  return 'var(--bg-elevated)';
                })(),
                border: timeRemaining <= 10 ? '1px solid var(--incorrect)' : '1px solid transparent',
                borderRadius: '4px',
                color: timeRemaining <= 10 ? 'var(--incorrect)' : 'var(--accent-cyan)',
                fontWeight: timeRemaining <= 10 ? 600 : 400
              }}
            >
              ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </div>
          )}
          {previousResults.length > 0 && (
            <button
              onClick={() => setShowPreviousRounds(!showPreviousRounds)}
              title="Review previous rounds"
              className="mono"
              style={{
                padding: '0.25rem 0.375rem',
                fontSize: '0.625rem',
                background: showPreviousRounds ? 'var(--accent-emerald)' : 'transparent',
                color: showPreviousRounds ? 'white' : 'var(--text-muted)',
                border: `1px solid ${showPreviousRounds ? 'var(--accent-emerald)' : 'var(--border)'}`,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋
            </button>
          )}
          <button
            onClick={() => setShowKeyboardHint(prev => !prev)}
            title="Keyboard: T/F/M for verdict, 1-3 for confidence, Enter to submit"
            className="mono"
            style={{
              padding: '0.25rem 0.375rem',
              fontSize: '0.625rem',
              background: showKeyboardHint ? 'var(--accent-violet)' : 'transparent',
              color: showKeyboardHint ? 'white' : 'var(--text-muted)',
              border: `1px solid ${showKeyboardHint ? 'var(--accent-violet)' : 'var(--border)'}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⌨
          </button>
        </div>

        {currentStreak >= 2 && (
          <div
            className={`mono ${currentStreak >= 5 ? 'animate-celebrate' : 'animate-pulse'}`}
            role="status"
            aria-live="polite"
            aria-label={`${currentStreak} correct answers in a row`}
            style={{
              padding: '0.25rem 0.5rem',
              background: currentStreak >= 5
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)'
                : 'rgba(251, 191, 36, 0.15)',
              border: `1px solid ${currentStreak >= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: currentStreak >= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)',
              fontWeight: currentStreak >= 5 ? 700 : 400
            }}
          >
            🔥 {currentStreak}
          </div>
        )}
      </div>

      {/* Compact Keyboard Hints - inline */}
      {showKeyboardHint && (
        <div
          className="animate-in mono"
          style={{
            marginBottom: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(167, 139, 250, 0.08)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '6px',
            fontSize: '0.625rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}
        >
          <span style={{ color: 'var(--accent-violet)' }}>T</span>rue
          <span style={{ color: 'var(--accent-violet)' }}> F</span>alse
          <span style={{ color: 'var(--accent-violet)' }}> M</span>ixed
          {' · '}
          <span style={{ color: 'var(--accent-violet)' }}>1-3</span> confidence
          {' · '}
          <span style={{ color: 'var(--accent-violet)' }}>Enter</span> submit
        </div>
      )}

      {/* Previous Rounds - compact dropdown */}
      {showPreviousRounds && previousResults.length > 0 && (
        <div
          className="animate-in"
          style={{
            marginBottom: '0.75rem',
            padding: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            maxHeight: '150px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {previousResults.map((result, i) => (
              <div
                key={i}
                title={claims.find(c => c.id === result.claimId)?.text || `Round ${i + 1}`}
                className="mono"
                style={{
                  padding: '0.25rem 0.5rem',
                  background: result.correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${result.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
                  borderRadius: '4px',
                  fontSize: '0.625rem',
                  color: result.correct ? 'var(--correct)' : 'var(--incorrect)',
                  cursor: 'help'
                }}
              >
                R{i + 1} {result.correct ? '✓' : '✗'} {result.points >= 0 ? '+' : ''}{result.points}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Badge with Multiplier */}
      {claim.difficulty && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <span
            className="mono"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.625rem',
              background: DIFFICULTY_BG_COLORS[claim.difficulty] || 'rgba(167, 139, 250, 0.2)',
              color: DIFFICULTY_CONFIG[claim.difficulty]?.color,
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}
            title={`Points multiplier: ${DIFFICULTY_MULTIPLIERS[claim.difficulty] || 1}x`}
          >
            {DIFFICULTY_CONFIG[claim.difficulty]?.icon} {claim.difficulty} • {DIFFICULTY_MULTIPLIERS[claim.difficulty] || 1}x
          </span>
        </div>
      )}

      {/* Claim Card */}
      <ClaimCard claim={claim} showAnswer={showResult} />

      {/* Active Hint Display */}
      {activeHint && !showResult && (
        <div
          className="animate-in"
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid var(--accent-violet)',
            borderRadius: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <span>{activeHint.icon}</span>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--accent-violet)' }}>
              {activeHint.name}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{activeHint.content}</div>
        </div>
      )}

      {/* Voting Section - shown when not viewing result */}
      {!showResult && (
        <div className="animate-in" style={{ marginTop: '0.75rem' }}>
          {/* Verdict & Confidence side-by-side to save vertical space */}
          <div className="voting-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {/* Verdict Selection */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem'
              }}
            >
              <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
                VERDICT
              </h3>
              <VerdictSelector value={verdict} onChange={setVerdict} />
            </div>

            {/* Confidence Selection with Risk Preview */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem'
              }}
            >
              <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
                CONFIDENCE
              </h3>
              <ConfidenceSelector value={confidence} onChange={setConfidence} />
              {/* Risk Preview */}
              <div
                className="mono"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.375rem 0.5rem',
                  background: 'rgba(167, 139, 250, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.625rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                {(() => {
                  const preview = getConfidencePreview();
                  return (
                    <>
                      If right: <span style={{ color: 'var(--correct)', fontWeight: 600 }}>+{preview.ifCorrect}</span>
                      {' | '}
                      If wrong: <span style={{ color: 'var(--incorrect)', fontWeight: 600 }}>{preview.ifWrong}</span>
                      <br />
                      <span style={{ fontSize: '0.5625rem', opacity: 0.7 }}>+ speed bonus (up to 2.0x)</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Reasoning (optional) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.5rem'
            }}
          >
            <label
              className="mono"
              style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}
            >
              WHY? (optional)
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="What made you choose this?"
              rows={2}
              maxLength={500}
              aria-label="Explain your reasoning"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-serif)',
                resize: 'none'
              }}
            />
          </div>

          {/* Hint System */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3
                className="mono"
                style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', margin: 0 }}
              >
                💡 HINTS
              </h3>
              {hintCostTotal > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: '0.625rem',
                    color: 'var(--incorrect)',
                    padding: '0.125rem 0.375rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '3px'
                  }}
                >
                  -{hintCostTotal} pts
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {HINT_TYPES.map((hint) => {
                const isUsed = usedHints.includes(hint.id);
                return (
                  <button
                    key={hint.id}
                    onClick={() => handleHintRequest(hint.id)}
                    disabled={isUsed}
                    className="mono"
                    style={{
                      padding: '0.375rem 0.5rem',
                      background: isUsed ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                      color: isUsed ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      cursor: isUsed ? 'default' : 'pointer',
                      opacity: isUsed ? 0.7 : 1,
                      textDecoration: isUsed ? 'line-through' : 'none'
                    }}
                  >
                    {hint.icon} {hint.name} (-{hint.cost})
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSubmitVerdict} fullWidth disabled={!verdict}>
            {teamAvatar?.emoji || '🔒'} Lock In Answer
          </Button>
        </div>
      )}

      {/* Result Phase */}
      {showResult && resultData && (
        <div
          className={`animate-in ${resultData.correct ? 'animate-celebrate' : 'animate-shake'}`}
          style={{
            marginTop: '0.75rem',
            background: resultData.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${resultData.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{resultData.correct ? '✓' : '✗'}</div>
          <div
            className="mono"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: resultData.correct ? 'var(--correct)' : 'var(--incorrect)',
              marginBottom: '0.25rem'
            }}
          >
            {resultData.correct ? 'CORRECT!' : 'INCORRECT'}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '1rem',
              color: resultData.points >= 0 ? 'var(--correct)' : 'var(--incorrect)',
              marginBottom: resultData.speedBonus || integrity.penalty < 0 ? '0.375rem' : '0.5rem'
            }}
          >
            {resultData.points >= 0 ? '+' : ''}
            {resultData.points} points
          </div>

          {/* Speed Bonus & Penalty - Combined inline */}
          {(resultData.speedBonus || integrity.penalty < 0) && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              {resultData.speedBonus && (
                <div
                  className="animate-celebrate"
                  style={{
                    padding: '0.375rem 0.625rem',
                    background: resultData.speedBonus.tier === 'ultra-lightning'
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.35) 0%, rgba(245, 158, 11, 0.3) 100%)'
                      : resultData.speedBonus.tier === 'lightning'
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)'
                      : 'rgba(251, 191, 36, 0.15)',
                    border: `1px solid var(--accent-amber)`,
                    borderRadius: '4px',
                    boxShadow: resultData.speedBonus.tier === 'ultra-lightning' ? '0 0 10px rgba(251, 191, 36, 0.4)' : 'none'
                  }}
                >
                  <span className="mono" style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-amber)',
                    fontWeight: 600
                  }}>
                    {resultData.speedBonus.icon} {resultData.speedBonus.label} +{resultData.speedBonus.bonus}
                  </span>
                </div>
              )}
              {integrity.penalty < 0 && (
                <div
                  style={{
                    padding: '0.375rem 0.625rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--incorrect)',
                    borderRadius: '4px'
                  }}
                >
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--incorrect)' }}>
                    ⚠️ Tab: {integrity.penalty} pts
                  </span>
                </div>
              )}
            </div>
          )}

          {resultData.correct && currentStreak >= 2 && (
            <div
              className={currentStreak >= 5 ? 'animate-celebrate' : ''}
              style={{
                marginBottom: '0.375rem',
                padding: '0.375rem 0.625rem',
                background: currentStreak >= 5
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(167, 139, 250, 0.2) 100%)'
                  : 'rgba(251, 191, 36, 0.15)',
                borderRadius: '4px',
                display: 'inline-block',
                border: currentStreak >= 5 ? '1px solid var(--accent-amber)' : 'none'
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-amber)',
                  fontWeight: 600
                }}
              >
                {currentStreak >= 5 && '⭐ '}
                {ENCOURAGEMENTS?.streak?.[Math.min(currentStreak - 1, (ENCOURAGEMENTS?.streak?.length || 1) - 1)] ||
                  `${currentStreak} in a row!`}
                {currentStreak >= 5 && ' ⭐'}
              </span>
            </div>
          )}

          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.375rem' }}>
            {resultData.forfeited
              ? (resultData.forfeitReason === 'tab-switch' ? '🚫 Round forfeited for tab switching' : '⏰ Time ran out - no verdict submitted')
              : encouragement
            }
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: calibrationTip ? '0.5rem' : '0.75rem' }}>
            {resultData.forfeited
              ? `No verdict submitted · Time: ${resultData.timeElapsed || 0}s`
              : `${resultData.verdict} · ${'●'.repeat(resultData.confidence)} confidence${resultData.timeElapsed ? ` · ⏱️ ${resultData.timeElapsed}s` : ''}`
            }
          </div>

          {/* Calibration Tip - Compact */}
          {calibrationTip && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(167, 139, 250, 0.08)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--accent-violet)',
                textAlign: 'left'
              }}
            >
              {calibrationTip}
            </div>
          )}

          {/* Next Round Button */}
          <Button onClick={handleNextRound} fullWidth>
            {isLastRound ? '📊 Results' : '➡️ Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
