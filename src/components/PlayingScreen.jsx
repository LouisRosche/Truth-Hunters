/**
 * PLAYING SCREEN
 * Main gameplay component with discussion and voting phases
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTimer } from '../hooks/useTimer';
import { usePhaseTimer } from '../hooks/usePhaseTimer';
import { Button } from './Button';
import { TimerDisplay } from './TimerDisplay';
import { ClaimCard } from './ClaimCard';
import { ConfidenceSelector } from './ConfidenceSelector';
import { VerdictSelector } from './VerdictSelector';
import { DIFFICULTY_CONFIG, DIFFICULTY_BG_COLORS, HINT_TYPES, ENCOURAGEMENTS } from '../data/constants';
import { calculatePoints } from '../utils/scoring';
import { getRotatingRoles, getRandomItem, getHintContent } from '../utils/helpers';
import { SoundManager } from '../services/sound';

export function PlayingScreen({
  claim,
  round,
  totalRounds: _totalRounds,
  onSubmit,
  phase,
  setPhase,
  difficulty,
  currentStreak,
  hintsUsed: _hintsUsed,
  onUseHint,
  teamAvatar
}) {
  const [confidence, setConfidence] = useState(1);
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [activeHint, setActiveHint] = useState(null);
  const [encouragement, setEncouragement] = useState('');
  const submitRef = useRef(null);
  const phaseTimer = usePhaseTimer();

  // Get timing based on difficulty
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const discussTime = diffConfig.discussTime;
  const stakeTime = diffConfig.stakeTime;

  const discussTimer = useTimer(discussTime, () => setPhase('stake'));
  const stakeTimer = useTimer(stakeTime, () => {
    if (submitRef.current) {
      submitRef.current();
    } else {
      setTimeoutWarning(true);
    }
  });

  // Get rotating roles for this round
  const roles = useMemo(() => getRotatingRoles(round), [round]);

  useEffect(() => {
    // Track phase transitions for analytics
    phaseTimer.endPhase();
    phaseTimer.startPhase(phase);

    if (phase === 'discuss') {
      discussTimer.reset(discussTime);
      discussTimer.start();
      setTimeoutWarning(false);
      setActiveHint(null);
    } else if (phase === 'stake') {
      stakeTimer.reset(stakeTime);
      stakeTimer.start();
      setTimeoutWarning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, discussTime, stakeTime]);

  const handleSubmitVerdict = useCallback(() => {
    if (!verdict || !claim) return;

    const correct = verdict === claim.answer;
    const points = calculatePoints(correct, confidence);

    SoundManager.play(correct ? 'correct' : 'incorrect');

    const msgs = correct ? ENCOURAGEMENTS.correct : ENCOURAGEMENTS.incorrect;
    setEncouragement(getRandomItem(msgs));

    setResultData({ correct, points, confidence, verdict });
    setShowResult(true);
    setPhase('result');
  }, [verdict, confidence, claim, setPhase]);

  useEffect(() => {
    if (verdict) {
      submitRef.current = handleSubmitVerdict;
    } else {
      submitRef.current = null;
    }
  }, [verdict, handleSubmitVerdict]);

  useEffect(() => {
    if (!showResult || !resultData || !claim) return;

    const timeoutId = setTimeout(() => {
      // Get phase timing stats for this round
      phaseTimer.endPhase();
      const phaseTiming = phaseTimer.getStats();

      onSubmit({
        claimId: claim.id,
        teamVerdict: resultData.verdict,
        confidence: resultData.confidence,
        correct: resultData.correct,
        points: resultData.points,
        reasoning,
        phaseTiming
      });

      // Reset phase timer for next round
      phaseTimer.reset();

      setConfidence(1);
      setVerdict(null);
      setReasoning('');
      setShowResult(false);
      setResultData(null);
      setActiveHint(null);
    }, 5500);

    return () => clearTimeout(timeoutId);
  }, [showResult, resultData, claim, reasoning, onSubmit, phaseTimer]);

  const handleHintRequest = (hintType) => {
    const hint = HINT_TYPES.find((h) => h.id === hintType);
    if (!hint) return;

    const content = getHintContent(claim, hintType);
    setActiveHint({ ...hint, content });
    onUseHint(hint.cost);
    SoundManager.play('tick');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Top Bar: Phase + Streak */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {['discuss', 'stake', 'result'].map((p, i) => (
            <div
              key={p}
              className="mono"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.6875rem',
                background: phase === p ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                color: phase === p ? 'var(--bg-deep)' : 'var(--text-muted)',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}
            >
              {i + 1}. {p}
            </div>
          ))}
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

      {/* Timer */}
      {(phase === 'discuss' || phase === 'stake') && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <TimerDisplay
            time={phase === 'discuss' ? discussTimer.time : stakeTimer.time}
            isActive={phase === 'discuss' ? discussTimer.isActive : stakeTimer.isActive}
            isPaused={phase === 'discuss' ? discussTimer.isPaused : stakeTimer.isPaused}
            label={phase === 'discuss' ? 'Discussion Time' : 'Make Your Decision'}
          />
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
      {activeHint && (
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

      {/* Discussion Phase */}
      {phase === 'discuss' && (
        <div className="animate-in" style={{ marginTop: '1.25rem' }}>
          {/* Team Roles */}
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
              style={{
                fontSize: '0.8125rem',
                color: 'var(--accent-amber)',
                marginBottom: '0.75rem'
              }}
            >
              🗣️ TEAM ROLES (Round {round})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {roles.map((r, i) => (
                <div
                  key={r.role}
                  style={{
                    padding: '0.625rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '6px',
                    borderLeft: i === 0 ? '3px solid var(--accent-cyan)' : 'none'
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.6875rem',
                      color: i === 0 ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      marginBottom: '0.125rem'
                    }}
                  >
                    {i === 0 ? '👤 ' : ''}
                    {r.role}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.task}</div>
                </div>
              ))}
            </div>
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

          <Button onClick={() => setPhase('stake')} fullWidth>
            Ready to Vote →
          </Button>
        </div>
      )}

      {/* Stake Phase */}
      {phase === 'stake' && (
        <div className="animate-in" style={{ marginTop: '1.25rem' }}>
          {timeoutWarning && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                padding: '0.625rem 1rem',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid var(--accent-amber)',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span aria-hidden="true">⚠️</span>
              <span style={{ color: 'var(--accent-amber)', fontSize: '0.8125rem' }}>
                Time&apos;s up! Select a verdict to continue.
              </span>
            </div>
          )}

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

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
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

          <Button onClick={handleSubmitVerdict} fullWidth disabled={!verdict}>
            {teamAvatar?.emoji || '🔒'} Lock In Answer →
          </Button>
        </div>
      )}

      {/* Result Phase */}
      {phase === 'result' && resultData && (
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
              {currentStreak >= 5 && (
                <div
                  style={{
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-violet)'
                  }}
                >
                  Legendary streak! Your team is unstoppable!
                </div>
              )}
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
        </div>
      )}
    </div>
  );
}
