/**
 * LEADERBOARD VIEW
 * Displays local and cloud leaderboards with team/player tabs
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';
import { formatPlayerName } from '../utils/helpers';
import { logger } from '../utils/logger';

export function LeaderboardView({ onBack }) {
  const [leaderboardTab, setLeaderboardTab] = useState('teams');
  const [cloudTeams, setCloudTeams] = useState([]);
  const [cloudPlayers, setCloudPlayers] = useState([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const isMountedRef = useRef(true);

  // Load cloud leaderboard when Firebase is connected
  useEffect(() => {
    if (FirebaseBackend.initialized) {
      setLoadingCloud(true);
      Promise.all([FirebaseBackend.getTopTeams(10), FirebaseBackend.getTopPlayers(10)])
        .then(([teams, players]) => {
          if (isMountedRef.current) {
            setCloudTeams(teams);
            setCloudPlayers(players);
          }
        })
        .catch((e) => {
          logger.warn('Failed to load cloud leaderboard:', e);
        })
        .finally(() => {
          if (isMountedRef.current) {
            setLoadingCloud(false);
          }
        });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Local leaderboard data
  const topTeams = useMemo(() => LeaderboardManager.getTopTeams(10), []);
  const topPlayers = useMemo(() => LeaderboardManager.getTopPlayers(10), []);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="animate-in" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          className="mono"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          ← Back to Setup
        </button>
      </div>

      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
        <h2
          className="mono"
          style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}
        >
          LEADERBOARD
        </h2>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setLeaderboardTab('teams')}
          className="mono"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
            color: leaderboardTab === 'teams' ? 'var(--bg-deep)' : 'var(--text-secondary)',
            border: `1px solid ${leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--border)'}`,
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🎯 Top Teams
        </button>
        <button
          onClick={() => setLeaderboardTab('players')}
          className="mono"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
            color: leaderboardTab === 'players' ? 'var(--bg-deep)' : 'var(--text-secondary)',
            border: `1px solid ${leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--border)'}`,
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          👤 Top Players
        </button>
      </div>

      {/* Leaderboard Content */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {(() => {
          const displayData =
            leaderboardTab === 'teams'
              ? FirebaseBackend.initialized && cloudTeams.length > 0
                ? cloudTeams
                : topTeams
              : FirebaseBackend.initialized && cloudPlayers.length > 0
              ? cloudPlayers
              : topPlayers;

          if (displayData.length === 0) {
            return (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {loadingCloud ? 'Loading...' : 'No games played yet. Be the first!'}
              </div>
            );
          }

          return displayData.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: index < displayData.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: index < 3 ? 'rgba(251, 191, 36, 0.05)' : 'transparent'
              }}
            >
              <div
                className="mono"
                style={{
                  width: '2rem',
                  fontSize: index < 3 ? '1.25rem' : '0.875rem',
                  color:
                    index === 0
                      ? '#ffd700'
                      : index === 1
                      ? '#c0c0c0'
                      : index === 2
                      ? '#cd7f32'
                      : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {leaderboardTab === 'teams' ? (
                    <>
                      <span>{item.teamAvatar || '🔍'}</span> {item.teamName}
                    </>
                  ) : (
                    item.displayName
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {leaderboardTab === 'teams'
                    ? item.players?.map((p) => formatPlayerName(p.firstName, p.lastInitial)).join(', ') || 'Anonymous'
                    : `${item.gamesPlayed} games • avg: ${item.avgScore}`}
                </div>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color:
                    leaderboardTab === 'teams'
                      ? item.score >= 0
                        ? 'var(--correct)'
                        : 'var(--incorrect)'
                      : 'var(--accent-amber)'
                }}
              >
                {leaderboardTab === 'teams'
                  ? `${item.score >= 0 ? '+' : ''}${item.score}`
                  : `Best: ${item.bestScore}`}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
