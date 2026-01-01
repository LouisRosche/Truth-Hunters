/**
 * RESULT PHASE
 * Displays result after verdict submission with feedback and stats
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { ENCOURAGEMENTS } from '../data/constants';

/**
 * Result phase component showing outcome and feedback
 * @param {Object} props - Component props
 */
function ResultPhaseComponent({
  resultData,
  currentStreak,
  encouragement,
  calibrationTip,
  integrityPenalty,
  isLastRound,
  onNext
}) {
  if (!resultData) return null;

  return (
    <div
      className={`animate-in ${resultData.correct ? 'animate-celebrate' : 'animate-shake'}`}
      style={{
        marginTop: '0.25rem',
        background: resultData.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `2px solid ${resultData.correct ? 'var(--correct)' : 'var(--incorrect)'}`,
        borderRadius: '8px',
        padding: '0.5rem',
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
          marginBottom: resultData.speedBonus || integrityPenalty < 0 ? '0.375rem' : '0.5rem'
        }}
      >
        {resultData.points >= 0 ? '+' : ''}
        {resultData.points} points
      </div>

      {/* Speed Bonus & Penalty - Combined inline */}
      {(resultData.speedBonus || integrityPenalty < 0) && (
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
                border: '1px solid var(--accent-amber)',
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
          {integrityPenalty < 0 && (
            <div
              style={{
                padding: '0.375rem 0.625rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--incorrect)',
                borderRadius: '4px'
              }}
            >
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--incorrect)' }}>
                ⚠️ Tab: {integrityPenalty} pts
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
          ? (resultData.forfeitReason === 'tab-switch' ? '🚫 Round skipped - you left the tab' : '⏰ Time ran out before you answered')
          : encouragement
        }
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: calibrationTip ? '0.5rem' : '0.75rem' }}>
        {resultData.forfeited
          ? `No answer submitted · Time: ${resultData.timeElapsed || 0}s`
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
      <Button onClick={onNext} fullWidth>
        {isLastRound ? '📊 See Final Results' : '➡️ Next Round'}
      </Button>
    </div>
  );
}

ResultPhaseComponent.propTypes = {
  resultData: PropTypes.shape({
    correct: PropTypes.bool.isRequired,
    points: PropTypes.number.isRequired,
    confidence: PropTypes.number.isRequired,
    verdict: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']),
    speedBonus: PropTypes.shape({
      tier: PropTypes.string,
      icon: PropTypes.string,
      label: PropTypes.string,
      bonus: PropTypes.number
    }),
    forfeited: PropTypes.bool,
    forfeitReason: PropTypes.oneOf(['tab-switch', 'time-out']),
    timeElapsed: PropTypes.number
  }),
  currentStreak: PropTypes.number,
  encouragement: PropTypes.string,
  calibrationTip: PropTypes.string,
  integrityPenalty: PropTypes.number,
  isLastRound: PropTypes.bool.isRequired,
  onNext: PropTypes.func.isRequired
};

ResultPhaseComponent.defaultProps = {
  resultData: null,
  currentStreak: 0,
  encouragement: '',
  calibrationTip: null,
  integrityPenalty: 0
};

// Memoize to prevent re-renders - improves Chromebook performance during gameplay
export const ResultPhase = memo(ResultPhaseComponent);
export default ResultPhase;
