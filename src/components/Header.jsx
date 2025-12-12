/**
 * HEADER COMPONENT
 * Displays game title, score, round information, connection status, and presentation mode toggle
 */

import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function Header({ score, round, totalRounds, phase, presentationMode, onTogglePresentationMode, onExitGame }) {
  const isOnline = useOnlineStatus();
  const [showExitModal, setShowExitModal] = useState(false);

  return (
    <header
      role="banner"
      aria-label="Game status"
      style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => {
            if (phase === 'playing') {
              // During gameplay, show confirmation modal
              setShowExitModal(true);
            } else if (phase === 'debrief' && onExitGame) {
              // During debrief, go directly to setup
              onExitGame();
            }
            // During setup, do nothing (already home)
          }}
          aria-label="Return to home screen"
          title={phase === 'setup' ? 'Truth Hunters' : 'Return to home screen'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'transparent',
            border: 'none',
            padding: '0.25rem 0.5rem',
            margin: '-0.25rem -0.5rem',
            borderRadius: '8px',
            cursor: phase === 'setup' ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: phase === 'setup' ? 1 : undefined
          }}
          onMouseEnter={(e) => {
            if (phase !== 'setup') {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🔍</span>
          <h1
            className="mono"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--accent-cyan)'
            }}
          >
            TRUTH HUNTERS
          </h1>
        </button>
        {!isOnline && (
          <span
            role="status"
            aria-live="polite"
            className="mono"
            style={{
              fontSize: '0.625rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid var(--accent-amber)',
              borderRadius: '4px',
              color: 'var(--accent-amber)'
            }}
          >
            📡 OFFLINE
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {/* Exit Game Button - shown during gameplay */}
        {phase === 'playing' && onExitGame && (
          <button
            onClick={() => setShowExitModal(true)}
            title="Exit game"
            className="mono"
            style={{
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s ease',
              minHeight: '36px'
            }}
          >
            <span style={{ fontSize: '1rem' }}>✕</span>
            <span>Exit</span>
          </button>
        )}

        {/* Presentation Mode Toggle - for group viewing */}
        <button
          onClick={onTogglePresentationMode}
          aria-pressed={presentationMode}
          title={presentationMode ? 'Switch to normal view' : 'Switch to large text for group viewing (4 scholars, 1 screen)'}
          className="mono"
          style={{
            padding: '0.5rem 0.75rem',
            background: presentationMode ? 'rgba(34, 211, 238, 0.2)' : 'transparent',
            border: `1px solid ${presentationMode ? 'var(--accent-cyan)' : 'var(--border)'}`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: presentationMode ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease',
            minHeight: '36px'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>{presentationMode ? '📺' : '👓'}</span>
          <span style={{ display: 'none' }} className="show-on-wide">{presentationMode ? 'Large' : 'Normal'}</span>
        </button>

        {phase !== 'setup' && phase !== 'debrief' && (
          <>
            <div
              className="mono"
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}
            >
              ROUND{' '}
              <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                {round}
              </span>
              /{totalRounds}
            </div>
            <div
              className="mono"
              style={{
                padding: '0.375rem 0.75rem',
                background: score >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${score >= 0 ? 'var(--correct)' : 'var(--incorrect)'}`,
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: score >= 0 ? 'var(--correct)' : 'var(--incorrect)'
              }}
            >
              {score >= 0 ? '+' : ''}
              {score} PTS
            </div>
          </>
        )}
      </div>

      {/* Exit Game Confirmation Modal */}
      {showExitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExitModal(false);
          }}
        >
          <div
            className="animate-in"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h2
              id="exit-modal-title"
              className="mono"
              style={{
                fontSize: '1.25rem',
                color: 'var(--accent-amber)',
                marginBottom: '0.5rem'
              }}
            >
              Exit Game?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You&apos;re on round {round} of {totalRounds} with {score} points.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your progress will not be saved to the leaderboard if you exit now.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  onExitGame();
                }}
                className="mono"
                style={{
                  padding: '0.875rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--incorrect)',
                  borderRadius: '8px',
                  color: 'var(--incorrect)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Exit &amp; Discard Progress
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="mono"
                style={{
                  padding: '0.875rem 1.25rem',
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg-deep)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
