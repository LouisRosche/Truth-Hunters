/**
 * PLAYING SCREEN
 * Main gameplay component - single unified screen for claim evaluation
 */

import { useState, useCallback } from 'react';
import { Button } from './Button';
import { ClaimCard } from './ClaimCard';
import { ConfidenceSelector } from './ConfidenceSelector';
import { VerdictSelector } from './VerdictSelector';
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
  teamAvatar
}) {
  const [confidence, setConfidence] = useState(2);
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [activeHint, setActiveHint] = useState(null);
  const [encouragement, setEncouragement] = useState('');
  const [calibrationTip, setCalibrationTip] = useState(null);

  const handleSubmitVerdict = useCallback(() => {
    if (!verdict || !claim) return;

    const correct = verdict === claim.answer;
    const points = calculatePoints(correct, confidence);

    SoundManager.play(correct ? 'correct' : 'incorrect');

    const msgs = correct ? ENCOURAGEMENTS.correct : ENCOURAGEMENTS.incorrect;
    setEncouragement(getRandomItem(msgs));

    // Determine calibration and show relevant tip
    let calibrationType = 'calibrated';
    if (correct && confidence === 1) calibrationType = 'underconfident';
    else if (!correct && confidence === 3) calibrationType = 'overconfident';
    else if (correct && confidence === 3) calibrationType = 'calibrated';
    else if (!correct && confidence === 1) calibrationType = 'calibrated';

    setCalibrationTip(getRandomItem(CALIBRATION_TIPS[calibrationType]));
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
    setCalibrationTip(null);
  }, [claim, resultData, reasoning, onSubmit]);

  const handleHintRequest = (hintType) => {
    const hint = HINT_TYPES.find((h) => h.id === hintType);
    if (!hint) return;

    const content = getHintContent(claim, hintType);
    setActiveHint({ ...hint, content });
    onUseHint(hint.cost);
    SoundManager.play('tick');
  };

  const isLastRound = round >= totalRounds;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Top Bar: Round + Streak */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <div
          className="mono"
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            background: 'var(--bg-elevated)',
            borderRadius: '4px',
            color: 'var(--text-secondary)'
          }}
        >
          Round {round} of {totalRounds}
        </div>

        {currentStreak >= 2 && (
          <div
            className={`mono ${currentStreak >= 5 ? 'animate-celebrate' : 'animate-pulse'}`}
            role="status"
            aria-live="polite"
            aria-label={`${currentStreak} correct answers in a row`}
            style={{
              padding: currentStreak >= 5 ? '0.375rem 0.875rem' : '0.25rem 0.625rem',
              background: currentStreak >= 5
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)'
                : 'rgba(251, 191, 36, 0.15)',
              border: `1px solid ${currentStreak >= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
              borderRadius: '4px',
              fontSize: currentStreak >= 5 ? '0.875rem' : '0.75rem',
              color: currentStreak >= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)',
              fontWeight: currentStreak >= 5 ? 700 : 400,
              boxShadow: currentStreak >= 5 ? '0 0 12px rgba(251, 191, 36, 0.4)' : 'none'
            }}
          >
            {currentStreak >= 5 ? '🔥🔥🔥' : '🔥'} {currentStreak} streak{currentStreak >= 5 ? '!' : ''}
          </div>
        )}
      </div>

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
            <h3
              className="mono"
              style={{ fontSize: '0.8125rem', color: 'var(--accent-violet)', marginBottom: '0.75rem' }}
            >
              💡 NEED A HINT? (costs points)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {HINT_TYPES.map((hint) => (
                <button
                  key={hint.id}
                  onClick={() => handleHintRequest(hint.id)}
                  disabled={activeHint?.id === hint.id}
                  className="mono"
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: activeHint?.id === hint.id ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                    color: activeHint?.id === hint.id ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: activeHint?.id === hint.id ? 'default' : 'pointer',
                    opacity: activeHint?.id === hint.id ? 0.7 : 1
                  }}
                >
                  {hint.icon} {hint.name} (-{hint.cost}pts)
                </button>
              ))}
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
                {ENCOURAGEMENTS.streak[Math.min(currentStreak, ENCOURAGEMENTS.streak.length) - 1] ||
                  `${currentStreak + 1} in a row!`}
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
