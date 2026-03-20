/**
 * PAUSE OVERLAY COMPONENT
 * Displays game-paused dialog with current progress and resume button.
 */

import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';

function PauseOverlayComponent({ currentRound, totalRounds, score, onResume }) {
  const focusTrapRef = useFocusTrap(true);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onResume();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onResume]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      ref={focusTrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
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
          border: '1px solid var(--accent-amber)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }} aria-hidden="true">&#x23F8;&#xFE0F;</div>
        <h2
          id="pause-title"
          className="mono"
          style={{ fontSize: '1.5rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}
        >
          GAME PAUSED
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Round {currentRound} of {totalRounds} &bull; {score} points
        </p>
        <button
          onClick={onResume}
          className="mono"
          style={{
            width: '100%',
            padding: '1rem',
            background: 'var(--accent-cyan)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--bg-deep)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          &#x25B6;&#xFE0F; Resume Game
        </button>
      </div>
    </div>
  );
}

PauseOverlayComponent.propTypes = {
  currentRound: PropTypes.number.isRequired,
  totalRounds: PropTypes.number.isRequired,
  score: PropTypes.number.isRequired,
  onResume: PropTypes.func.isRequired
};

export const PauseOverlay = memo(PauseOverlayComponent);
