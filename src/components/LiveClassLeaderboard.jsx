/**
 * LIVE CLASS LEADERBOARD
 * Real-time leaderboard showing all active game sessions in the class
 * Compact, information-dense layout
 */

import PropTypes from 'prop-types';
import { useLiveLeaderboard } from '../hooks/useLeaderboard';
import { FirebaseBackend } from '../services/firebase';

export function LiveClassLeaderboard({ currentSessionId, isMinimized = false, onToggle }) {
  // Use unified hook for live sessions
  const { sessions, isLoading, hasFirebase } = useLiveLeaderboard();

  // Check if we have necessary context
  const classCode = FirebaseBackend.getClassCode();
  const canShowLeaderboard = hasFirebase && classCode;

  // Minimized view - just a small indicator
  if (isMinimized) {
    if (!canShowLeaderboard) return null;

    return (
      <button
        onClick={onToggle}
        className="mono"
        title="Show live class leaderboard"
        style={{
          padding: '0.25rem 0.5rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '0.625rem',
          color: 'var(--accent-amber)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}
      >
        <span style={{ fontSize: '0.75rem' }}>🏆</span>
        <span>{sessions.length} playing</span>
      </button>
    );
  }

  // Don't show if Firebase not available
  if (!canShowLeaderboard) {
    return null;
  }

  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.625rem',
        marginBottom: '0.625rem'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <h3 className="mono" style={{
          fontSize: '0.625rem',
          color: 'var(--accent-amber)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span>🏆</span> LIVE CLASS
          <span style={{
            fontSize: '0.5rem',
            padding: '0.125rem 0.25rem',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--correct)',
            borderRadius: '3px',
            fontWeight: 400
          }}>
            LIVE
          </span>
        </h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="mono"
            style={{
              padding: '0.125rem 0.25rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
          Loading...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
          No other teams playing yet
        </div>
      )}

      {/* Leaderboard entries - Compact grid */}
      {!isLoading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
          {sessions.map((session, index) => {
            const isCurrentTeam = session.sessionId === currentSessionId;
            return (
              <div
                key={session.sessionId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.25rem 1rem 1fr 3rem 2.5rem',
                  gap: '0.375rem',
                  padding: '0.3125rem 0.4375rem',
                  background: isCurrentTeam ? 'rgba(167, 139, 250, 0.15)' : 'var(--bg-elevated)',
                  border: isCurrentTeam ? '1px solid var(--accent-violet)' : '1px solid var(--border)',
                  borderRadius: '6px',
                  alignItems: 'center'
                }}
              >
                {/* Rank */}
                <div
                  className="mono"
                  style={{
                    textAlign: 'center',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)'
                  }}
                >
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div style={{ fontSize: '0.875rem' }}>
                  {session.teamAvatar || '🔍'}
                </div>

                {/* Team info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: isCurrentTeam ? 600 : 500,
                    color: isCurrentTeam ? 'var(--accent-violet)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {session.teamName}
                    {isCurrentTeam && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (you)</span>}
                  </div>
                  <div className="mono" style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                    {session.currentRound}/{session.totalRounds}R
                  </div>
                </div>

                {/* Accuracy badge */}
                <div className="mono" style={{
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.25rem',
                  borderRadius: '4px',
                  background: session.accuracy >= 80 ? 'rgba(16, 185, 129, 0.2)'
                    : session.accuracy >= 50 ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  color: session.accuracy >= 80 ? 'var(--correct)'
                    : session.accuracy >= 50 ? 'var(--accent-amber)'
                    : 'var(--incorrect)',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {session.accuracy || 0}%
                </div>

                {/* Score */}
                <div
                  className="mono"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: session.currentScore >= 0 ? 'var(--correct)' : 'var(--incorrect)',
                    textAlign: 'right'
                  }}
                >
                  {session.currentScore >= 0 ? '+' : ''}{session.currentScore}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer with class info */}
      <div className="mono" style={{
        marginTop: '0.5rem',
        paddingTop: '0.375rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.5625rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        Class: {classCode} • {sessions.length} team{sessions.length !== 1 ? 's' : ''} playing
      </div>
    </div>
  );
}

LiveClassLeaderboard.propTypes = {
  currentSessionId: PropTypes.string,
  isMinimized: PropTypes.bool,
  onToggle: PropTypes.func
};

LiveClassLeaderboard.defaultProps = {
  currentSessionId: null,
  isMinimized: false,
  onToggle: null
};
