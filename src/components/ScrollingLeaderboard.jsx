/**
 * SCROLLING LEADERBOARD COMPONENT
 * Compact, information-dense vertical list with auto-refresh
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { useTeamLeaderboard } from '../hooks/useLeaderboard';
import { sanitizeUserContent } from '../utils/sanitize';

function ScrollingLeaderboardComponent({ onViewFull }) {
  // Use unified hook with auto-refresh enabled
  const { teams, isLoading, error } = useTeamLeaderboard({
    limit: 15,
    autoRefresh: true
  });

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0.75rem',
        height: '100%'
      }}>
        <h3 className="mono" style={{
          fontSize: '0.6875rem',
          color: 'var(--accent-amber)',
          marginBottom: '0.75rem'
        }}>
          🏆 TOP TEAMS
        </h3>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textAlign: 'center',
          marginTop: '1.5rem'
        }}>
          Loading...
        </p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0.75rem',
        height: '100%'
      }}>
        <h3 className="mono" style={{
          fontSize: '0.6875rem',
          color: 'var(--accent-amber)',
          marginBottom: '0.75rem'
        }}>
          🏆 TOP TEAMS
        </h3>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textAlign: 'center',
          marginTop: '1.5rem'
        }}>
          No games yet!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '0.75rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 className="mono" style={{
          fontSize: '0.6875rem',
          color: 'var(--accent-amber)',
          margin: 0
        }}>
          🏆 TOP TEAMS
        </h3>
        {error && (
          <span style={{ fontSize: '0.625rem', color: 'var(--incorrect)' }} title={error}>
            ⚠️
          </span>
        )}
      </div>

      {/* Compact list */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        overflow: 'hidden'
      }}>
        {teams.map((entry, index) => (
          <div
            key={entry.id || index}
            className="animate-in"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5rem 1.25rem 1fr 3rem 2.5rem',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              background: index < 3
                ? 'rgba(251, 191, 36, 0.1)'
                : 'var(--bg-elevated)',
              borderRadius: '6px',
              border: index < 3
                ? '1px solid rgba(251, 191, 36, 0.3)'
                : '1px solid var(--border)',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              fontSize: '0.75rem'
            }}
          >
            {/* Rank */}
            <div className="mono" style={{
              textAlign: 'center',
              fontSize: index < 3 ? '0.875rem' : '0.6875rem',
              fontWeight: 700,
              color: index === 0
                ? '#ffd700'
                : index === 1
                ? '#c0c0c0'
                : index === 2
                ? '#cd7f32'
                : 'var(--text-muted)'
            }}>
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}`}
            </div>

            {/* Avatar */}
            <div style={{ fontSize: '0.875rem' }}>
              {entry.teamAvatar || '🔍'}
            </div>

            {/* Team info */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {sanitizeUserContent(entry.teamName || '', 50)}
              </div>
              <div className="mono" style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '0.375rem',
                marginTop: '0.125rem'
              }}>
                <span>{entry.accuracy || 0}%</span>
                <span>•</span>
                <span>{entry.rounds || 0}R</span>
                {entry.difficulty && (
                  <>
                    <span>•</span>
                    <span>{
                      entry.difficulty === 'hard' ? '🔥' :
                      entry.difficulty === 'medium' ? '⚡' : '✨'
                    }</span>
                  </>
                )}
              </div>
            </div>

            {/* Difficulty badge */}
            <div className="mono" style={{
              fontSize: '0.625rem',
              padding: '0.125rem 0.25rem',
              borderRadius: '4px',
              background: entry.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)'
                : entry.difficulty === 'medium' ? 'rgba(251, 191, 36, 0.2)'
                : 'rgba(16, 185, 129, 0.2)',
              color: entry.difficulty === 'hard' ? 'var(--incorrect)'
                : entry.difficulty === 'medium' ? 'var(--accent-amber)'
                : 'var(--correct)',
              textAlign: 'center',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}>
              {entry.difficulty === 'hard' ? 'HARD'
                : entry.difficulty === 'medium' ? 'MED'
                : entry.difficulty === 'easy' ? 'EASY'
                : '—'}
            </div>

            {/* Score */}
            <div className="mono" style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: entry.score >= 0
                ? 'var(--accent-cyan)'
                : 'var(--accent-rose)',
              textAlign: 'right'
            }}>
              {entry.score > 0 ? '+' : ''}{entry.score}
            </div>
          </div>
        ))}
      </div>

      {/* View full button */}
      {onViewFull && (
        <button
          onClick={onViewFull}
          className="mono"
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.5rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--accent-amber)',
            fontSize: '0.625rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(251, 191, 36, 0.1)';
            e.target.style.borderColor = 'var(--accent-amber)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'var(--border)';
          }}
        >
          VIEW FULL LEADERBOARD →
        </button>
      )}
    </div>
  );
}

ScrollingLeaderboardComponent.propTypes = {
  onViewFull: PropTypes.func
};

// Memoize to prevent re-renders with auto-refresh enabled
export const ScrollingLeaderboard = memo(ScrollingLeaderboardComponent);
export default ScrollingLeaderboard;

ScrollingLeaderboard.defaultProps = {
  onViewFull: null
};
