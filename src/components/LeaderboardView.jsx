/**
 * LEADERBOARD VIEW
 * Compact, information-dense leaderboard with responsive layout
 */

import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { useTeamLeaderboard, usePlayerLeaderboard } from '../hooks/useLeaderboard';
import { formatPlayerName } from '../utils/helpers';
import { sanitizeUserContent } from '../utils/sanitize';

function LeaderboardViewComponent({ onBack }) {
  const [leaderboardTab, setLeaderboardTab] = useState('teams');

  // Use unified hooks for consistent data fetching
  const { teams, isLoading: loadingTeams, error: errorTeams } = useTeamLeaderboard({ limit: 20 });
  const { players, isLoading: loadingPlayers, error: errorPlayers } = usePlayerLeaderboard({ limit: 20 });

  const displayData = leaderboardTab === 'teams' ? teams : players;
  const isLoading = leaderboardTab === 'teams' ? loadingTeams : loadingPlayers;
  const error = leaderboardTab === 'teams' ? errorTeams : errorPlayers;

  return (
    <div style={{ maxWidth: '100%', height: '100%', margin: '0 auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onBack}
            className="mono"
            style={{
              padding: '0.375rem 0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          <h2 className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-amber)', margin: 0 }}>
            🏆 LEADERBOARD
          </h2>
        </div>

        {/* Tab Selector - Compact */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setLeaderboardTab('teams')}
            className="mono"
            style={{
              padding: '0.375rem 0.75rem',
              background: leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color: leaderboardTab === 'teams' ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎯 Teams ({teams.length})
          </button>
          <button
            onClick={() => setLeaderboardTab('players')}
            className="mono"
            style={{
              padding: '0.375rem 0.75rem',
              background: leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color: leaderboardTab === 'players' ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👤 Players ({players.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '0.375rem 0.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--incorrect)',
          borderRadius: '6px',
          color: 'var(--incorrect)',
          fontSize: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Leaderboard Content */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading...
          </div>
        ) : displayData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No games played yet. Be the first!
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: leaderboardTab === 'teams'
                  ? '2rem 1fr 1fr 4rem 3.5rem 4rem'
                  : '2rem 1fr 4rem 3.5rem 4rem',
                gap: '0.5rem',
                padding: '0.5rem 0.625rem',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                position: 'sticky',
                top: 0
              }}
            >
              <div>Rank</div>
              <div>{leaderboardTab === 'teams' ? 'Team' : 'Player'}</div>
              {leaderboardTab === 'teams' && <div>Players</div>}
              <div>{leaderboardTab === 'teams' ? 'Difficulty' : 'Games'}</div>
              <div>{leaderboardTab === 'teams' ? 'Accuracy' : 'Avg'}</div>
              <div style={{ textAlign: 'right' }}>{leaderboardTab === 'teams' ? 'Score' : 'Best'}</div>
            </div>

            {/* Scrollable List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {displayData.map((item, index) => (
                <div
                  key={item.id || `item-${index}`}
                  className="animate-in"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: leaderboardTab === 'teams'
                      ? '2rem 1fr 1fr 4rem 3.5rem 4rem'
                      : '2rem 1fr 4rem 3.5rem 4rem',
                    gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    borderBottom: index < displayData.length - 1 ? '1px solid var(--border)' : 'none',
                    background: index < 3 ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = index < 3
                      ? 'rgba(251, 191, 36, 0.12)'
                      : 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index < 3
                      ? 'rgba(251, 191, 36, 0.05)'
                      : 'transparent';
                  }}
                >
                  {/* Rank */}
                  <div
                    className="mono"
                    style={{
                      fontSize: index < 3 ? '1.125rem' : '0.75rem',
                      color:
                        index === 0 ? '#ffd700'
                        : index === 1 ? '#c0c0c0'
                        : index === 2 ? '#cd7f32'
                        : 'var(--text-muted)',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  {/* Team/Player Name */}
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    {leaderboardTab === 'teams' && (
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.teamAvatar || '🔍'}</span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leaderboardTab === 'teams' ? sanitizeUserContent(item.teamName || '', 50) : sanitizeUserContent(item.displayName || '', 50)}
                    </span>
                  </div>

                  {/* Players (Teams Only) */}
                  {leaderboardTab === 'teams' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.players?.map((p) => formatPlayerName(p.firstName, p.lastInitial)).join(', ') || 'Anonymous'}
                    </div>
                  )}

                  {/* Difficulty */}
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.difficulty === 'hard' ? '🔥 Hard'
                      : item.difficulty === 'medium' ? '⚡ Med'
                      : item.difficulty === 'easy' ? '✨ Easy'
                      : item.difficulty === 'mixed' ? '🎲 Mix'
                      : leaderboardTab === 'players' ? `${item.gamesPlayed}G` : '—'}
                  </div>

                  {/* Accuracy */}
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {leaderboardTab === 'teams' ? `${item.accuracy || 0}%` : `${item.avgScore || 0}`}
                  </div>

                  {/* Score */}
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color:
                        leaderboardTab === 'teams'
                          ? item.score >= 0 ? 'var(--correct)' : 'var(--incorrect)'
                          : 'var(--accent-amber)',
                      textAlign: 'right'
                    }}
                  >
                    {leaderboardTab === 'teams'
                      ? `${item.score >= 0 ? '+' : ''}${item.score}`
                      : `${item.bestScore || 0}`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

LeaderboardViewComponent.propTypes = {
  onBack: PropTypes.func.isRequired
};

// Memoize to prevent unnecessary re-renders - important for Chromebook performance
export const LeaderboardView = memo(LeaderboardViewComponent);
export default LeaderboardView;
