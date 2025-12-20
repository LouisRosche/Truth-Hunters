/**
 * SCROLLING LEADERBOARD COMPONENT
 * Simple, clean vertical list with auto-refresh
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

export function ScrollingLeaderboard({ onViewFull }) {
  const [entries, setEntries] = useState([]);
  const isMountedRef = useRef(true);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      let data = [];

      // Try Firebase first, fallback to local
      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopTeams(10);
        } catch (e) {
          logger.warn('Firebase leaderboard fetch failed:', e);
        }
      }

      // Fallback to local leaderboard
      if (data.length === 0) {
        data = LeaderboardManager.getTopTeams(10);
      }

      if (isMountedRef.current) {
        setEntries(data);
      }
    };

    loadLeaderboard();

    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  if (entries.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem',
        height: '100%'
      }}>
        <h3 className="mono" style={{
          fontSize: '0.75rem',
          color: 'var(--accent-amber)',
          marginBottom: '1rem'
        }}>
          🏆 LEADERBOARD
        </h3>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          No games played yet!<br />
          Be the first team on the board.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <h3 className="mono" style={{
        fontSize: '0.75rem',
        color: 'var(--accent-amber)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🏆 TOP TEAMS
      </h3>

      {/* Simple vertical list */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        overflow: 'auto'
      }}>
        {entries.map((entry, index) => (
          <div
            key={entry.id || index}
            className="animate-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.625rem',
              background: index < 3
                ? 'rgba(251, 191, 36, 0.1)'
                : 'var(--bg-elevated)',
              borderRadius: '8px',
              border: index < 3
                ? '1px solid rgba(251, 191, 36, 0.3)'
                : '1px solid var(--border)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Rank */}
            <div className="mono" style={{
              width: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
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
            <div style={{ fontSize: '1rem' }}>
              {entry.teamAvatar || '🔍'}
            </div>

            {/* Team info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {entry.teamName}
              </div>
              <div style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                marginTop: '0.125rem'
              }}>
                {entry.accuracy || 0}% • {entry.rounds || 0}R
                {entry.difficulty && ` • ${
                  entry.difficulty === 'hard' ? '🔥' :
                  entry.difficulty === 'medium' ? '⚡' : '✨'
                }`}
              </div>
            </div>

            {/* Score */}
            <div className="mono" style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: entry.score >= 0
                ? 'var(--accent-cyan)'
                : 'var(--accent-rose)'
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
            marginTop: '0.75rem',
            padding: '0.5rem',
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

ScrollingLeaderboard.propTypes = {
  onViewFull: PropTypes.func
};

ScrollingLeaderboard.defaultProps = {
  onViewFull: null
};
