/**
 * PLAYING SCREEN
 * Main gameplay component - single unified screen for claim evaluation
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from './Button';
import { ClaimCard } from './ClaimCard';
import { ConfidenceSelector } from './ConfidenceSelector';
import { VerdictSelector } from './VerdictSelector';
import { LiveClassLeaderboard } from './LiveClassLeaderboard';
import { DIFFICULTY_CONFIG, DIFFICULTY_BG_COLORS, HINT_TYPES, ENCOURAGEMENTS } from '../data/constants';
import { calculatePoints } from '../utils/scoring';
import { getRandomItem, getHintContent } from '../utils/helpers';
import { SoundManager } from '../services/sound';

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

  // Keyboard shortcuts for faster gameplay
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, verdict]);

  // Handle pending keyboard actions (to avoid circular dependencies)
  useEffect(() => {
    if (pendingSubmit && verdict && claim) {
      setPendingSubmit(false);
      // Trigger submit logic inline
      const correct = verdict === claim.answer;
      const points = calculatePoints(correct, confidence);
      SoundManager.play(correct ? 'correct' : 'incorrect');
      const msgs = correct ? ENCOURAGEMENTS.correct : ENCOURAGEMENTS.incorrect;
      setEncouragement(getRandomItem(msgs) || (correct ? 'Nice work!' : 'Keep trying!'));
      let calibrationType = 'calibrated';
      if (correct && confidence === 1) calibrationType = 'underconfident';
      else if (!correct && confidence === 3) calibrationType = 'overconfident';
      setCalibrationTip(getRandomItem(CALIBRATION_TIPS[calibrationType]) || null);
      setResultData({ correct, points, confidence, verdict });
      setShowResult(true);
    }
  }, [pendingSubmit, verdict, claim, confidence]);

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
    }
  }, [pendingNext, resultData, claim, reasoning, onSubmit]);

  const handleSubmitVerdict = useCallback(() => {
    if (!verdict || !claim) return;

    const correct = verdict === claim.answer;
    const points = calculatePoints(correct, confidence);

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
    setResultData({ correct, points, confidence, verdict });
    setShowResult(true);
  }, [verdict, confidence, claim]);

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
  }, [claim, resultData, reasoning, onSubmit]);

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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'var(--bg-elevated)',
          borderRadius: '2px',
          marginBottom: '0.75rem',
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
          marginBottom: '0.75rem'
        }}
      >
        <div
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.375rem 0.75rem',
            background: 'var(--bg-elevated)',
            borderRadius: '6px',
            fontSize: '0.6875rem'
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

      {/* Top Bar: Round + Streak + Quick Actions */}
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

      {/* Difficulty Badge */}
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
          >
            {DIFFICULTY_CONFIG[claim.difficulty]?.icon} {claim.difficulty}
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
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid var(--accent-violet)',
            borderRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>{activeHint.icon}</span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-violet)' }}>
              {activeHint.name}
            </span>
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{activeHint.content}</div>
        </div>
      )}

      {/* Voting Section - shown when not viewing result */}
      {!showResult && (
        <div className="animate-in" style={{ marginTop: '1.25rem' }}>
          {/* Verdict Selection */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}
          >
            <h3 className="mono" style={{ fontSize: '0.8125rem', color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
              VERDICT
            </h3>
            <VerdictSelector value={verdict} onChange={setVerdict} />
          </div>

          {/* Confidence Selection */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}
          >
            <h3 className="mono" style={{ fontSize: '0.8125rem', color: 'var(--accent-amber)', marginBottom: '0.75rem' }}>
              CONFIDENCE
            </h3>
            <ConfidenceSelector value={confidence} onChange={setConfidence} />
          </div>

          {/* Reasoning (optional) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}
          >
            <label
              className="mono"
              style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}
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
                padding: '0.625rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
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
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3
                className="mono"
                style={{ fontSize: '0.8125rem', color: 'var(--accent-violet)', margin: 0 }}
              >
                💡 NEED A HINT? (costs points)
              </h3>
              {hintCostTotal > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--incorrect)',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '4px'
                  }}
                >
                  Hints used: -{hintCostTotal} pts
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {HINT_TYPES.map((hint) => {
                const isUsed = usedHints.includes(hint.id);
                return (
                  <button
                    key={hint.id}
                    onClick={() => handleHintRequest(hint.id)}
                    disabled={isUsed}
                    className="mono"
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: isUsed ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                      color: isUsed ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: isUsed ? 'default' : 'pointer',
                      opacity: isUsed ? 0.7 : 1,
                      textDecoration: isUsed ? 'line-through' : 'none'
                    }}
                  >
                    {hint.icon} {hint.name} (-{hint.cost}pts)
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
            marginTop: '1.25rem',
            background: resultData.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${resultData.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{resultData.correct ? '✓' : '✗'}</div>
          <div
            className="mono"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: resultData.correct ? 'var(--correct)' : 'var(--incorrect)',
              marginBottom: '0.375rem'
            }}
          >
            {resultData.correct ? 'CORRECT!' : 'INCORRECT'}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '1.125rem',
              color: resultData.points >= 0 ? 'var(--correct)' : 'var(--incorrect)',
              marginBottom: '0.5rem'
            }}
          >
            {resultData.points >= 0 ? '+' : ''}
            {resultData.points} points
          </div>

          {resultData.correct && currentStreak >= 2 && (
            <div
              className={currentStreak >= 5 ? 'animate-celebrate' : ''}
              style={{
                marginTop: '0.5rem',
                padding: currentStreak >= 5 ? '0.625rem 1rem' : '0.375rem 0.75rem',
                background: currentStreak >= 5
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(167, 139, 250, 0.2) 100%)'
                  : 'rgba(251, 191, 36, 0.15)',
                borderRadius: currentStreak >= 5 ? '8px' : '4px',
                display: 'inline-block',
                border: currentStreak >= 5 ? '2px solid var(--accent-amber)' : 'none',
                boxShadow: currentStreak >= 5 ? '0 0 20px rgba(251, 191, 36, 0.3)' : 'none'
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: currentStreak >= 5 ? '1rem' : '0.8125rem',
                  color: 'var(--accent-amber)',
                  fontWeight: currentStreak >= 5 ? 700 : 400
                }}
              >
                {currentStreak >= 5 && '⭐ '}
                {ENCOURAGEMENTS?.streak?.[Math.min(currentStreak - 1, (ENCOURAGEMENTS?.streak?.length || 1) - 1)] ||
                  `${currentStreak} in a row!`}
                {currentStreak >= 5 && ' ⭐'}
              </span>
            </div>
          )}

          <div style={{ marginTop: '0.75rem', fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {encouragement}
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            You said <strong>{resultData.verdict}</strong> with{' '}
            <strong aria-label={`${resultData.confidence} out of 3`}>{'●'.repeat(resultData.confidence)}</strong>{' '}
            confidence
          </div>

          {/* Calibration Tip */}
          {calibrationTip && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid var(--accent-violet)',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: 'var(--accent-violet)',
                textAlign: 'left'
              }}
            >
              {calibrationTip}
            </div>
          )}

          {/* Next Round Button */}
          <div style={{ marginTop: '1.25rem' }}>
            <Button onClick={handleNextRound} fullWidth>
              {isLastRound ? '📊 See Final Results' : '➡️ Next Round'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
