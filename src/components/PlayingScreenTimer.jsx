/**
 * PLAYING SCREEN TIMER
 * Prominent timer component for student gameplay
 */

import PropTypes from 'prop-types';

export function PlayingScreenTimer({ timeRemaining, totalTimeAllowed, showResult }) {
  if (showResult || timeRemaining === null) return null;

  const elapsed = totalTimeAllowed - timeRemaining;
  const pct = elapsed / totalTimeAllowed;
  const inBonusZone = pct <= 0.50 && timeRemaining > 10;
  const isLowTime = timeRemaining <= 30;
  const bonusLabel = pct <= 0.10 ? '⚡2x' : pct <= 0.20 ? '⚡1.5x' : pct <= 0.35 ? '⚡1.3x' : pct <= 0.50 ? '⚡1.1x' : '';

  return (
    <div
      className={`mono ${isLowTime ? 'animate-pulse' : ''}`}
      role="timer"
      aria-live={timeRemaining <= 10 ? 'assertive' : 'off'}
      aria-atomic="true"
      aria-label={`Time remaining: ${Math.floor(timeRemaining / 60)} minutes ${timeRemaining % 60} seconds`}
      title={inBonusZone ? 'Answer quickly for bonus points!' : 'Time remaining'}
      style={{
        padding: '0.5rem 0.75rem',
        fontSize: '1rem',
        background: (() => {
          if (timeRemaining <= 10) return 'rgba(239, 68, 68, 0.25)';
          if (timeRemaining <= 30) return 'rgba(251, 191, 36, 0.25)';
          if (pct <= 0.10) return 'rgba(251, 191, 36, 0.25)';
          if (pct <= 0.20) return 'rgba(251, 191, 36, 0.2)';
          if (pct <= 0.35) return 'rgba(251, 191, 36, 0.15)';
          if (pct <= 0.50) return 'rgba(167, 139, 250, 0.15)';
          return 'var(--bg-elevated)';
        })(),
        border: `2px solid ${timeRemaining <= 10 ? 'var(--incorrect)' : timeRemaining <= 30 ? 'var(--accent-amber)' : 'var(--border)'}`,
        borderRadius: '8px',
        color: timeRemaining <= 10 ? 'var(--incorrect)' : timeRemaining <= 30 ? 'var(--accent-amber)' : 'var(--accent-cyan)',
        fontWeight: 700
      }}
    >
      ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
      {inBonusZone && (
        <span style={{ marginLeft: '0.375rem', color: 'var(--accent-amber)', fontSize: '0.75rem', fontWeight: 600 }}>
          {bonusLabel}
        </span>
      )}
    </div>
  );
}

PlayingScreenTimer.propTypes = {
  timeRemaining: PropTypes.number,
  totalTimeAllowed: PropTypes.number.isRequired,
  showResult: PropTypes.bool.isRequired
};

PlayingScreenTimer.defaultProps = {
  timeRemaining: null
};
