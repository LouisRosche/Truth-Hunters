/**
 * LIVE CLASS LEADERBOARD
 * Real-time leaderboard showing all active game sessions in the class
 * Displays during gameplay to show student progress
 */

import { useState, useEffect } from 'react';
import { FirebaseBackend } from '../services/firebase';

export function LiveClassLeaderboard({ currentSessionId, isMinimized = false, onToggle }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to live leaderboard updates
  useEffect(() => {
    if (!FirebaseBackend.initialized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = FirebaseBackend.subscribeToLiveLeaderboard((updatedSessions) => {
      setSessions(updatedSessions);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Don't render if Firebase isn't available or no class code
  if (!FirebaseBackend.initialized || !FirebaseBackend.getClassCode()) {
    return null;
  }

  // Minimized view - just a small indicator
  if (isMinimized) {
    return (
      <button
        onClick={onToggle}
        className="mono"
        title="Show live class leaderboard"
        style={{
          padding: '0.375rem 0.625rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          fontSize: '0.6875rem',
          color: 'var(--accent-amber)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>🏆</span>
        <span>{sessions.length} playing</span>
      </button>
    );
  }

  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem'
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
          fontSize: '0.6875rem',
          color: 'var(--accent-amber)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span>🏆</span> LIVE CLASS SCORES
          <span style={{
            fontSize: '0.5625rem',
            padding: '0.125rem 0.375rem',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--correct)',
            borderRadius: '4px',
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
              padding: '0.125rem 0.375rem',
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
        <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Loading...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          No other teams playing yet
        </div>
      )}

      {/* Leaderboard entries */}
      {!isLoading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
          {sessions.map((session, index) => {
            const isCurrentTeam = session.sessionId === currentSessionId;
            return (
              <div
                key={session.sessionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.5rem',
                  background: isCurrentTeam ? 'rgba(167, 139, 250, 0.15)' : 'var(--bg-elevated)',
                  border: isCurrentTeam ? '1px solid var(--accent-violet)' : '1px solid transparent',
                  borderRadius: '6px'
                }}
              >
                {/* Rank */}
                <div
                  className="mono"
                  style={{
                    width: '1.25rem',
                    textAlign: 'center',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)'
                  }}
                >
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div style={{ fontSize: '1rem' }}>
                  {session.teamAvatar || '🔍'}
                </div>

                {/* Team info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrentTeam ? 600 : 400,
                    color: isCurrentTeam ? 'var(--accent-violet)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {session.teamName}
                    {isCurrentTeam && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (you)</span>}
                  </div>
                  <div className="mono" style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                    Round {session.currentRound}/{session.totalRounds}
                  </div>
                </div>

                {/* Score */}
                <div
                  className="mono"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: session.currentScore >= 0 ? 'var(--correct)' : 'var(--incorrect)'
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
        Class: {FirebaseBackend.getClassCode()} • {sessions.length} team{sessions.length !== 1 ? 's' : ''} playing
      </div>
    </div>
  );
}
