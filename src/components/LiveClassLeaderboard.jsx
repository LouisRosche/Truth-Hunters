/**
 * LIVE CLASS LEADERBOARD - SIMPLIFIED
 * Minimal real-time leaderboard showing active game sessions
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLiveLeaderboard } from '../hooks/useLeaderboard';
import { FirebaseBackend } from '../services/firebase';
import { sanitizeUserContent } from '../utils/sanitize';

function LiveClassLeaderboardComponent({ currentSessionId, isMinimized = false, onToggle }) {
  const { sessions, isLoading, hasFirebase } = useLiveLeaderboard();
  const classCode = FirebaseBackend.getClassCode();
  const canShowLeaderboard = hasFirebase && classCode;

  // Simple deduplication - show top 5 only
  const topSessions = useMemo(() => {
    const seenIds = new Set();
    return sessions
      .filter(s => {
        const id = s.sessionId || s.id;
        if (!id || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .slice(0, 5); // Only show top 5
  }, [sessions]);

  // Minimized view
  if (isMinimized) {
    if (!canShowLeaderboard) return null;
    return (
      <button
        onClick={onToggle}
        className="mono"
        style={{
          padding: '0.125rem 0.25rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          fontSize: '0.625rem',
          color: 'var(--accent-amber)',
          cursor: 'pointer'
        }}
      >
        🏆 {topSessions.length}
      </button>
    );
  }

  if (!canShowLeaderboard || topSessions.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '0.25rem',
      marginBottom: '0.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.125rem' }}>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--accent-amber)' }}>
          🏆 LIVE
        </span>
        {onToggle && (
          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: 0
            }}
          >
            ×
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', fontSize: '0.625rem', color: 'var(--text-muted)', padding: '0.25rem' }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {topSessions.map((session, index) => {
            const isCurrentTeam = session.sessionId === currentSessionId;
            return (
              <div
                key={session.sessionId || session.id || index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.75rem 1fr 2rem 1.5rem',
                  gap: '0.25rem',
                  padding: '0.125rem 0.25rem',
                  background: isCurrentTeam ? 'rgba(167, 139, 250, 0.1)' : 'var(--bg-elevated)',
                  borderRadius: '3px',
                  fontSize: '0.625rem',
                  alignItems: 'center'
                }}
              >
                <span className="mono" style={{ color: index === 0 ? '#ffd700' : 'var(--text-muted)' }}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}`}
                </span>
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: isCurrentTeam ? 600 : 400
                }}>
                  {sanitizeUserContent(session.teamName || 'Team', 20)}
                </span>
                <span className="mono" style={{ textAlign: 'center', fontSize: '0.5625rem' }}>
                  {session.accuracy || 0}%
                </span>
                <span className="mono" style={{ textAlign: 'right', fontWeight: 700, color: session.currentScore >= 0 ? 'var(--correct)' : 'var(--incorrect)' }}>
                  {session.currentScore >= 0 ? '+' : ''}{session.currentScore}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

LiveClassLeaderboardComponent.propTypes = {
  currentSessionId: PropTypes.string,
  isMinimized: PropTypes.bool,
  onToggle: PropTypes.func
};

LiveClassLeaderboardComponent.defaultProps = {
  currentSessionId: null,
  isMinimized: false,
  onToggle: null
};

export const LiveClassLeaderboard = memo(LiveClassLeaderboardComponent);
export default LiveClassLeaderboard;
