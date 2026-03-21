/**
 * SAVE GAME RECOVERY MODAL
 * Prompts user to resume or discard an interrupted game session.
 */

import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';

function SaveGameRecoveryModalComponent({ summary, onResume, onDiscard }) {
  const focusTrapRef = useFocusTrap(true);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onDiscard();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onDiscard]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
      ref={focusTrapRef}
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
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">&#x1F4BE;</div>
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
          You have an unfinished game from {summary.timeAgoText}.
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
            <span className="mono" style={{ fontSize: '0.875rem' }}>{summary.teamName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Progress</span>
            <span className="mono" style={{ fontSize: '0.875rem' }}>
              Round {summary.currentRound} of {summary.totalRounds}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Score</span>
            <span className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>
              {summary.score} pts
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onDiscard}
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
            onClick={onResume}
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
  );
}

SaveGameRecoveryModalComponent.propTypes = {
  summary: PropTypes.shape({
    timeAgoText: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    currentRound: PropTypes.number.isRequired,
    totalRounds: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired
  }).isRequired,
  onResume: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired
};

export const SaveGameRecoveryModal = memo(SaveGameRecoveryModalComponent);
