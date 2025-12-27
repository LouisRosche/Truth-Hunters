/**
 * PLAYING SCREEN
 * Main gameplay component - single unified screen for claim evaluation
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { ClaimCard } from './ClaimCard';
import { LiveClassLeaderboard } from './LiveClassLeaderboard';
import { TutorialOverlay } from './TutorialOverlay';
import { VotingSection } from './VotingSection';
import { ResultPhase } from './ResultPhase';
import { DIFFICULTY_CONFIG, DIFFICULTY_BG_COLORS, DIFFICULTY_MULTIPLIERS, HINT_TYPES, ENCOURAGEMENTS, ANTI_CHEAT } from '../data/constants';
import { calculatePoints } from '../utils/scoring';
import { getRandomItem, getHintContent } from '../utils/helpers';
import { SoundManager } from '../services/sound';
import { useGameIntegrity } from '../hooks/useGameIntegrity';
import { safeGetItem } from '../utils/safeStorage';

// Tips shown after each round based on how confidence matched the result
const CALIBRATION_TIPS = {
  overconfident: [
    "💡 You felt sure but got it wrong. Next time, ask yourself: 'Could this be false?'",
    "💡 Sometimes things that seem obvious can be tricky. Slow down on 'easy' ones!",
    "💡 When you feel 100% certain, that's a good time to double-check."
  ],
  underconfident: [
    "💡 You were right! Trust your thinking more — you knew it!",
    "💡 You doubted yourself but got it right. Your instincts are better than you think!",
    "💡 Nice work! When your team agrees, that's usually a good sign."
  ],
  calibrated: [
    "💡 Perfect! Your confidence matched how well you actually did.",
    "💡 Great job knowing what you know! Keep using clues to guide your confidence.",
    "💡 You're getting good at knowing when you're right!"
  ]
};

export function PlayingScreen({
  claim,
  round,
  totalRounds,
  onSubmit,
  difficulty,
  currentStreak,
  onUseHint,
  teamAvatar,
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
  const [showKeyboardHint, setShowKeyboardHint] = useState(round === 1); // Show on first round
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);
  const [showPreviousRounds, setShowPreviousRounds] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [forfeitAcknowledged, setForfeitAcknowledged] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const submittingRef = useRef(false); // Atomic lock to prevent double submission race condition

  // Check if tutorial should be shown (first time user in this session)
  useEffect(() => {
    const tutorialData = safeGetItem('truthDetector_tutorialSeen', null);
    const lastSessionId = tutorialData?.sessionId || null;

    // Show tutorial if: (1) never seen, OR (2) new session started
    // Note: rounds are 1-indexed, so first round is 1
    const shouldShow = round === 1 && (!tutorialData || lastSessionId !== sessionId);

    if (shouldShow) {
      setShowTutorial(true);
    }
  }, [round, sessionId]);

  // Get time limits from difficulty config
  const totalTimeAllowed = DIFFICULTY_CONFIG[difficulty]?.discussTime || 120;

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

  // Reset atomic lock when new claim loads
  useEffect(() => {
    submittingRef.current = false;
  }, [claim?.id]);

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
    if (pendingSubmit && claim && !isSubmitting) {
      setPendingSubmit(false);

      // CRITICAL: Atomic lock to prevent race condition
      // This prevents double submission if user clicks submit at same time as timer expires
      if (submittingRef.current) {
        return; // Already submitting, abort
      }
      submittingRef.current = true;
      setIsSubmitting(true);

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
      const pointsResult = calculatePoints(correct, confidence, difficulty, {
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
      setIsSubmitting(false); // Reset for next round
    }
  }, [pendingSubmit, verdict, claim, confidence, difficulty, totalTimeAllowed, integrity.penalty, isSubmitting]);

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
      submittingRef.current = false; // Reset atomic lock for next round
    }
  }, [pendingNext, resultData, claim, reasoning, onSubmit, integrity]);

  const handleSubmitVerdict = useCallback(() => {
    if (!verdict || !claim || isSubmitting) return;

    // CRITICAL: Atomic lock to prevent race condition
    if (submittingRef.current) {
      return; // Already submitting, abort
    }
    submittingRef.current = true;
    setIsSubmitting(true);

    // CRITICAL: Clear timer immediately to prevent race condition with auto-submit
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const correct = verdict === claim.answer;

    // Calculate time elapsed for speed bonus
    const timeElapsed = roundStartTimeRef.current
      ? Math.floor((Date.now() - roundStartTimeRef.current) / 1000)
      : totalTimeAllowed;

    // Calculate points with speed bonus and integrity penalties
    const pointsResult = calculatePoints(correct, confidence, difficulty, {
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
    setIsSubmitting(false); // Reset for next round
  }, [verdict, confidence, claim, difficulty, totalTimeAllowed, integrity.penalty, isSubmitting]);

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

  const handleHintRequest = useCallback((hintType) => {
    const hint = HINT_TYPES.find((h) => h.id === hintType);
    if (!hint || usedHints.includes(hintType)) return;

    const content = getHintContent(claim, hintType);
    setActiveHint({ ...hint, content });
    setUsedHints(prev => [...prev, hintType]);
    setHintCostTotal(prev => prev + hint.cost);
    onUseHint(hint.cost, hintType);
    SoundManager.play('tick');
  }, [claim, usedHints, onUseHint]);

  // Check if this is the last round (rounds are 1-indexed: 1, 2, 3)
  const isLastRound = round >= totalRounds;

  // Calculate confidence risk preview (memoized for performance)
  // Note: Must be called before any conditional returns to comply with Rules of Hooks
  const confidencePreview = useMemo(() => {
    const basePoints = {
      1: { correct: 1, incorrect: -1 },
      2: { correct: 3, incorrect: -3 },
      3: { correct: 5, incorrect: -6 }
    }[confidence];
    const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1;
    return {
      ifCorrect: Math.round(basePoints.correct * multiplier),
      ifWrong: -Math.round(Math.abs(basePoints.incorrect * multiplier))
    };
  }, [confidence, difficulty]);

  // Loading state check - placed after all hooks to comply with Rules of Hooks
  if (!claim || !claim.id) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Loading claim...
        </div>
      </div>
    );
  }

  return (
    <div className="viewport-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      height: '100%',
      overflow: 'hidden',
      padding: '0.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Single-viewport CSS - NO scrolling, everything must fit */}
      <style>{`
        @media (max-width: 700px) {
          .voting-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Tutorial Overlay - First Time Users */}
      {showTutorial && (
        <TutorialOverlay
          onClose={() => setShowTutorial(false)}
          sessionId={sessionId}
        />
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
            fontSize: '0.75rem'
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
            🚫 YOU LEFT THIS TAB!
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Switching tabs ends your round automatically.<br />
            <strong>Penalty: {ANTI_CHEAT.FORFEIT_PENALTY} points</strong>
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
              fontSize: '0.75rem',
              background: 'var(--bg-elevated)',
              borderRadius: '4px',
              color: 'var(--text-secondary)'
            }}
          >
            {round}/{totalRounds}
          </div>
          {/* Timer Display with speed bonus zones */}
          {!showResult && timeRemaining !== null && (() => {
            const elapsed = totalTimeAllowed - timeRemaining;
            const pct = elapsed / totalTimeAllowed;
            const inBonusZone = pct <= 0.50 && timeRemaining > 10;
            const bonusLabel = pct <= 0.10 ? '⚡2x' : pct <= 0.20 ? '⚡1.5x' : pct <= 0.35 ? '⚡1.3x' : pct <= 0.50 ? '⚡1.1x' : '';
            return (
              <div
                className="mono"
                role="timer"
                aria-live={timeRemaining <= 10 ? 'assertive' : 'off'}
                aria-atomic="true"
                aria-label={`Time remaining: ${Math.floor(timeRemaining / 60)} minutes ${timeRemaining % 60} seconds`}
                title={inBonusZone ? 'Answer quickly for bonus points!' : 'Time remaining'}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  background: (() => {
                    if (timeRemaining <= 10) return 'rgba(239, 68, 68, 0.15)';
                    if (pct <= 0.10) return 'rgba(251, 191, 36, 0.25)';
                    if (pct <= 0.20) return 'rgba(251, 191, 36, 0.2)';
                    if (pct <= 0.35) return 'rgba(251, 191, 36, 0.15)';
                    if (pct <= 0.50) return 'rgba(167, 139, 250, 0.15)';
                    return 'var(--bg-elevated)';
                  })(),
                  border: timeRemaining <= 10 ? '1px solid var(--incorrect)' : '1px solid transparent',
                  borderRadius: '4px',
                  color: timeRemaining <= 10 ? 'var(--incorrect)' : 'var(--accent-cyan)',
                  fontWeight: timeRemaining <= 10 ? 600 : 400
                }}
              >
                ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                {inBonusZone && <span style={{ marginLeft: '0.25rem', color: 'var(--accent-amber)', fontSize: '0.5625rem' }}>{bonusLabel}</span>}
              </div>
            );
          })()}
          {previousResults.length > 0 && (
            <button
              onClick={() => setShowPreviousRounds(!showPreviousRounds)}
              title="Review previous rounds"
              className="mono"
              style={{
                padding: '0.25rem 0.375rem',
                fontSize: '0.75rem',
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
              fontSize: '0.75rem',
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

      {/* Keyboard Shortcuts - shown on first round, toggleable after */}
      {showKeyboardHint && (
        <div
          className="animate-in mono"
          style={{
            marginBottom: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(167, 139, 250, 0.08)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}
        >
          {round === 1 && <span style={{ marginRight: '0.5rem' }}>⌨️ Keyboard shortcuts:</span>}
          <span style={{ color: 'var(--accent-violet)' }}>T</span>=True
          <span style={{ color: 'var(--accent-violet)' }}> F</span>=False
          <span style={{ color: 'var(--accent-violet)' }}> M</span>=Mixed
          {' · '}
          <span style={{ color: 'var(--accent-violet)' }}>1-3</span>=confidence
          {' · '}
          <span style={{ color: 'var(--accent-violet)' }}>Enter</span>=submit
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
            borderRadius: '6px'
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
                  fontSize: '0.75rem',
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <span
            className="mono"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
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

      {/* Main content area - uses remaining space */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Claim Card */}
        <ClaimCard claim={claim} showAnswer={showResult} />

        {/* Active Hint Display */}
        {activeHint && !showResult && (
          <div
            className="animate-in"
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(167, 139, 250, 0.1)',
              border: '1px solid var(--accent-violet)',
              borderRadius: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
              <span>{activeHint.icon}</span>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-violet)' }}>
                {activeHint.name}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{activeHint.content}</div>
          </div>
        )}

        {/* Voting Section - shown when not viewing result */}
        {!showResult && (
          <VotingSection
            verdict={verdict}
            onVerdictChange={setVerdict}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            confidencePreview={confidencePreview}
            reasoning={reasoning}
            onReasoningChange={setReasoning}
            usedHints={usedHints}
            hintCostTotal={hintCostTotal}
            onHintRequest={handleHintRequest}
            onSubmit={handleSubmitVerdict}
            teamAvatar={teamAvatar}
            disabled={isSubmitting}
          />
        )}

        {/* Result Phase */}
        {showResult && (
          <ResultPhase
            resultData={resultData}
            currentStreak={currentStreak}
            encouragement={encouragement}
            calibrationTip={calibrationTip}
            integrityPenalty={integrity.penalty}
            isLastRound={isLastRound}
            onNext={handleNextRound}
          />
        )}
      </div>
    </div>
  );
}

// PropTypes validation for production safety
PlayingScreen.propTypes = {
  claim: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    answer: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']).isRequired,
    difficulty: PropTypes.oneOf(['easy', 'medium', 'hard', 'expert']),
    category: PropTypes.string,
    source: PropTypes.string,
    context: PropTypes.string
  }).isRequired,
  round: PropTypes.number.isRequired,
  totalRounds: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
  difficulty: PropTypes.oneOf(['easy', 'medium', 'hard', 'expert']).isRequired,
  currentStreak: PropTypes.number,
  onUseHint: PropTypes.func,
  teamAvatar: PropTypes.shape({
    emoji: PropTypes.string,
    name: PropTypes.string
  }),
  previousResults: PropTypes.arrayOf(
    PropTypes.shape({
      claimId: PropTypes.string,
      teamVerdict: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']),
      confidence: PropTypes.oneOf([1, 2, 3]),
      correct: PropTypes.bool,
      points: PropTypes.number
    })
  ),
  claims: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ),
  currentScore: PropTypes.number,
  predictedScore: PropTypes.number,
  sessionId: PropTypes.string,
  showLiveLeaderboard: PropTypes.bool,
  onToggleLiveLeaderboard: PropTypes.func
};

PlayingScreen.defaultProps = {
  currentStreak: 0,
  onUseHint: () => {},
  teamAvatar: null,
  previousResults: [],
  claims: [],
  currentScore: 0,
  predictedScore: 0,
  sessionId: null,
  showLiveLeaderboard: true,
  onToggleLiveLeaderboard: () => {}
};
