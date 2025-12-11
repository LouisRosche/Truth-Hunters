/**
 * HEADER COMPONENT
 * Displays game title, score, round information, connection status, and presentation mode toggle
 */

import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function Header({ score, round, totalRounds, phase, presentationMode, onTogglePresentationMode }) {
  const isOnline = useOnlineStatus();

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
    </header>
  );
}
