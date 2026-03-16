/**
 * SCROLLING LEADERBOARD COMPONENT
 * Compact, engaging sidebar leaderboard with podium mini-view and auto-refresh
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { useTeamLeaderboard } from '../hooks/useLeaderboard';
import { sanitizeUserContent } from '../utils/sanitize';

const MEDAL_COLORS = {
  0: { bg: 'rgba(255, 215, 0, 0.15)', border: 'rgba(255, 215, 0, 0.4)', text: '#ffd700', label: '1ST' },
  1: { bg: 'rgba(192, 192, 192, 0.12)', border: 'rgba(192, 192, 192, 0.35)', text: '#c0c0c0', label: '2ND' },
  2: { bg: 'rgba(205, 127, 50, 0.12)', border: 'rgba(205, 127, 50, 0.35)', text: '#cd7f32', label: '3RD' }
};

function ScrollingLeaderboardComponent({ onViewFull }) {
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
        <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
          LEADERBOARD
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '2rem',
              background: 'var(--bg-elevated)',
              borderRadius: '6px',
              opacity: 0.5 - (i * 0.1)
            }} />
          ))}
        </div>
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
        <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.375rem' }}>
          LEADERBOARD
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
          No games yet — be the first to claim the top spot!
        </p>
      </div>
    );
  }

  const topThree = teams.slice(0, 3);
  const rest = teams.slice(3);
  const maxScore = teams[0]?.score || 1;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '0.5rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.125rem' }}>
        <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', margin: 0 }}>
          LEADERBOARD
        </h3>
        {error && (
          <span style={{ fontSize: '0.625rem', color: 'var(--incorrect)' }} title={error}>offline</span>
        )}
      </div>

      {/* Mini Podium for Top 3 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '0.25rem',
        marginBottom: '0.5rem',
        padding: '0.25rem 0'
      }}>
        {/* 2nd place */}
        {topThree[1] && (
          <div style={{
            flex: 1,
            background: MEDAL_COLORS[1].bg,
            border: `1px solid ${MEDAL_COLORS[1].border}`,
            borderRadius: '8px 8px 0 0',
            padding: '0.375rem 0.25rem',
            textAlign: 'center',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '1.125rem' }}>{topThree[1].teamAvatar || '🔍'}</div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: MEDAL_COLORS[1].text, fontWeight: 700 }}>
              {sanitizeUserContent(topThree[1].teamName || '', 8)}
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: MEDAL_COLORS[1].text }}>
              {topThree[1].score}
            </div>
          </div>
        )}

        {/* 1st place (tallest) */}
        {topThree[0] && (
          <div style={{
            flex: 1,
            background: MEDAL_COLORS[0].bg,
            border: `1px solid ${MEDAL_COLORS[0].border}`,
            borderRadius: '8px 8px 0 0',
            padding: '0.5rem 0.25rem',
            textAlign: 'center',
            minHeight: '76px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div className="crown-float" style={{ fontSize: '0.75rem', position: 'absolute', top: '-2px', lineHeight: 1 }}>👑</div>
            <div style={{ fontSize: '1.375rem', marginTop: '0.25rem' }}>{topThree[0].teamAvatar || '🔍'}</div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: MEDAL_COLORS[0].text, fontWeight: 700 }}>
              {sanitizeUserContent(topThree[0].teamName || '', 8)}
            </div>
            <div className="mono" style={{ fontSize: '0.875rem', fontWeight: 700, color: MEDAL_COLORS[0].text }}>
              {topThree[0].score}
            </div>
          </div>
        )}

        {/* 3rd place */}
        {topThree[2] && (
          <div style={{
            flex: 1,
            background: MEDAL_COLORS[2].bg,
            border: `1px solid ${MEDAL_COLORS[2].border}`,
            borderRadius: '8px 8px 0 0',
            padding: '0.375rem 0.25rem',
            textAlign: 'center',
            minHeight: '52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '1rem' }}>{topThree[2].teamAvatar || '🔍'}</div>
            <div className="mono" style={{ fontSize: '0.5625rem', color: MEDAL_COLORS[2].text, fontWeight: 700 }}>
              {sanitizeUserContent(topThree[2].teamName || '', 8)}
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: MEDAL_COLORS[2].text }}>
              {topThree[2].score}
            </div>
          </div>
        )}
      </div>

      {/* Remaining entries with score bars */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1875rem',
        overflow: 'hidden'
      }}>
        {rest.map((entry, index) => {
          const rank = index + 4;
          const barWidth = maxScore > 0 ? Math.max(5, (entry.score / maxScore) * 100) : 5;

          return (
            <div
              key={entry.id || `team-${rank}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.25rem 1rem 1fr 2.5rem',
                gap: '0.25rem',
                padding: '0.25rem 0.375rem',
                background: 'var(--bg-elevated)',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                alignItems: 'center',
                fontSize: '0.6875rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Score bar background */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${barWidth}%`,
                background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.06), rgba(34, 211, 238, 0.02))',
                borderRadius: '5px',
                pointerEvents: 'none'
              }} />

              {/* Rank */}
              <div className="mono" style={{
                textAlign: 'center',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                position: 'relative'
              }}>
                {rank}
              </div>

              {/* Avatar */}
              <div style={{ fontSize: '0.75rem', position: 'relative' }}>
                {entry.teamAvatar || '🔍'}
              </div>

              {/* Name */}
              <div style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                position: 'relative'
              }}>
                {sanitizeUserContent(entry.teamName || '', 50)}
              </div>

              {/* Score */}
              <div className="mono" style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: entry.score >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)',
                textAlign: 'right',
                position: 'relative'
              }}>
                {entry.score > 0 ? '+' : ''}{entry.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* View full button */}
      {onViewFull && (
        <button
          onClick={onViewFull}
          className="mono"
          style={{
            marginTop: '0.375rem',
            padding: '0.375rem 0.375rem',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '6px',
            color: 'var(--accent-amber)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(251, 191, 36, 0.15)';
            e.target.style.borderColor = 'var(--accent-amber)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(251, 191, 36, 0.08)';
            e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
          }}
        >
          VIEW FULL LEADERBOARD
        </button>
      )}
    </div>
  );
}

ScrollingLeaderboardComponent.propTypes = {
  onViewFull: PropTypes.func
};

ScrollingLeaderboardComponent.defaultProps = {
  onViewFull: null
};

export const ScrollingLeaderboard = memo(ScrollingLeaderboardComponent);
export default ScrollingLeaderboard;
