/**
 * LEADERBOARD VIEW
 * Engaging, animated leaderboard with podium, score bars, and pill tabs
 */

import { useState, memo, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTeamLeaderboard, usePlayerLeaderboard } from '../hooks/useLeaderboard';
import { formatPlayerName } from '../utils/helpers';
import { sanitizeUserContent } from '../utils/sanitize';

/* ── Medal & podium constants ─────────────────────────────────── */
const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const MEDAL_EMOJI = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
const MEDAL_GLOW = [
  '0 0 18px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)',
  '0 0 14px rgba(192,192,192,0.45), 0 0 30px rgba(192,192,192,0.15)',
  '0 0 12px rgba(205,127,50,0.4), 0 0 26px rgba(205,127,50,0.12)',
];
const PODIUM_HEIGHTS = ['8.5rem', '10.5rem', '7rem']; // 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2]; // display order: silver, gold, bronze

const DIFFICULTY_PILLS = {
  hard:   { label: 'Hard',  bg: 'rgba(239,68,68,0.18)',  color: 'var(--accent-rose)',    icon: '\uD83D\uDD25' },
  medium: { label: 'Med',   bg: 'rgba(251,191,36,0.18)', color: 'var(--accent-amber)',   icon: '\u26A1' },
  easy:   { label: 'Easy',  bg: 'rgba(52,211,153,0.18)', color: 'var(--accent-emerald)', icon: '\u2728' },
  mixed:  { label: 'Mix',   bg: 'rgba(139,92,246,0.18)', color: 'var(--accent-violet)',  icon: '\uD83C\uDFB2' },
};

const BAR_GRADIENTS = [
  'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
  'linear-gradient(90deg, var(--accent-amber), var(--accent-rose))',
  'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
];

/* ── Animated row wrapper ─────────────────────────────────────── */
function StaggeredRow({ index, children, style }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 60 * index);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <div
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {children}
    </div>
  );
}

StaggeredRow.propTypes = {
  index: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
};

/* ── Podium block ─────────────────────────────────────────────── */
function PodiumBlock({ entry, rank, isTeams }) {
  const [bounced, setBounced] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBounced(true), rank === 0 ? 300 : rank === 1 ? 150 : 450);
    return () => clearTimeout(id);
  }, [rank]);

  const medalColor = MEDAL_COLORS[rank];
  const height = PODIUM_HEIGHTS[PODIUM_ORDER.indexOf(rank)];
  const name = isTeams
    ? sanitizeUserContent(entry.teamName || '', 30)
    : sanitizeUserContent(entry.displayName || '', 30);
  const avatar = isTeams ? (entry.teamAvatar || '\uD83D\uDD0D') : '\uD83D\uDC64';
  const score = isTeams ? entry.score : (entry.bestScore || 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: rank === 0 ? 1.3 : 1,
        opacity: bounced ? 1 : 0,
        transform: bounced ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.85)',
        transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          fontSize: rank === 0 ? '2.5rem' : '1.75rem',
          marginBottom: '0.25rem',
          filter: rank === 0 ? 'drop-shadow(0 0 8px rgba(255,215,0,0.6))' : 'none',
        }}
      >
        {avatar}
      </div>

      {/* Medal */}
      <div style={{ fontSize: rank === 0 ? '1.5rem' : '1.15rem', marginBottom: '0.15rem' }}>
        {MEDAL_EMOJI[rank]}
      </div>

      {/* Name */}
      <div
        className="mono"
        style={{
          fontSize: rank === 0 ? '0.85rem' : '0.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          maxWidth: '7rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '0.2rem',
        }}
      >
        {name}
      </div>

      {/* Score */}
      <div
        className="mono"
        style={{
          fontSize: rank === 0 ? '1.1rem' : '0.95rem',
          fontWeight: 800,
          color: medalColor,
          textShadow: rank === 0 ? '0 0 8px rgba(255,215,0,0.4)' : 'none',
          marginBottom: '0.35rem',
        }}
      >
        {isTeams ? `${score >= 0 ? '+' : ''}${score}` : score}
      </div>

      {/* Podium column */}
      <div
        style={{
          width: '100%',
          height,
          background: `linear-gradient(180deg, ${medalColor}33 0%, ${medalColor}11 100%)`,
          borderTop: `3px solid ${medalColor}`,
          borderRadius: '8px 8px 0 0',
          boxShadow: MEDAL_GLOW[rank],
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '0.5rem',
        }}
      >
        <span
          className="mono"
          style={{ fontSize: '1.5rem', fontWeight: 900, color: medalColor, opacity: 0.6 }}
        >
          {rank + 1}
        </span>
      </div>
    </div>
  );
}

PodiumBlock.propTypes = {
  entry: PropTypes.object.isRequired,
  rank: PropTypes.number.isRequired,
  isTeams: PropTypes.bool.isRequired,
};

/* ── Score bar row (positions 4+) ─────────────────────────────── */
function ScoreBarRow({ entry, index, maxScore, isTeams }) {
  const barRef = useRef(null);
  const [barWidth, setBarWidth] = useState(0);
  const rank = index + 1;
  const score = isTeams ? entry.score : (entry.bestScore || 0);
  const pct = maxScore > 0 ? Math.max((Math.abs(score) / Math.abs(maxScore)) * 100, 4) : 4;

  useEffect(() => {
    const id = setTimeout(() => setBarWidth(pct), 80 * (index - 3));
    return () => clearTimeout(id);
  }, [pct, index]);

  const name = isTeams
    ? sanitizeUserContent(entry.teamName || '', 50)
    : sanitizeUserContent(entry.displayName || '', 50);
  const avatar = isTeams ? (entry.teamAvatar || '\uD83D\uDD0D') : null;
  const gradient = BAR_GRADIENTS[index % BAR_GRADIENTS.length];

  const diffInfo = isTeams ? DIFFICULTY_PILLS[entry.difficulty] : null;

  return (
    <StaggeredRow index={index - 3} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.6rem 0.75rem',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.2s ease',
          cursor: 'default',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Score bar background */}
        <div
          ref={barRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${barWidth}%`,
            background: gradient,
            opacity: 0.08,
            transition: 'width 0.6s cubic-bezier(0.33,1,0.68,1)',
            borderRadius: '0 6px 6px 0',
            pointerEvents: 'none',
          }}
        />

        {/* Rank number */}
        <div
          className="mono"
          style={{
            width: '2rem',
            textAlign: 'center',
            fontSize: rank <= 10 ? '1rem' : '0.8rem',
            fontWeight: rank <= 10 ? 800 : 600,
            color: rank <= 10 ? 'var(--accent-cyan)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          #{rank}
        </div>

        {/* Avatar */}
        {isTeams && (
          <span style={{ fontSize: rank <= 7 ? '1.25rem' : '1rem', flexShrink: 0 }}>{avatar}</span>
        )}

        {/* Name */}
        <div
          style={{
            flex: 1,
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {name}
        </div>

        {/* Players list (teams only) */}
        {isTeams && (
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              maxWidth: '8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {entry.players?.map((p) => formatPlayerName(p.firstName, p.lastInitial)).join(', ') || 'Anonymous'}
          </div>
        )}

        {/* Difficulty pill (teams) / Games (players) */}
        {isTeams ? (
          diffInfo ? (
            <span
              className="mono"
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                background: diffInfo.bg,
                color: diffInfo.color,
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}
            >
              {diffInfo.icon} {diffInfo.label}
            </span>
          ) : (
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              —
            </span>
          )
        ) : (
          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            {entry.gamesPlayed}G
          </span>
        )}

        {/* Accuracy (teams) / Avg (players) */}
        <div
          className="mono"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, width: '3rem', textAlign: 'right' }}
        >
          {isTeams ? `${entry.accuracy || 0}%` : `avg ${entry.avgScore || 0}`}
        </div>

        {/* Score */}
        <div
          className="mono"
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            flexShrink: 0,
            width: '4rem',
            textAlign: 'right',
            color: isTeams
              ? (score >= 0 ? 'var(--correct)' : 'var(--incorrect)')
              : 'var(--accent-amber)',
          }}
        >
          {isTeams ? `${score >= 0 ? '+' : ''}${score}` : score}
        </div>
      </div>
    </StaggeredRow>
  );
}

ScoreBarRow.propTypes = {
  entry: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  maxScore: PropTypes.number.isRequired,
  isTeams: PropTypes.bool.isRequired,
};

/* ── Empty state ──────────────────────────────────────────────── */
function EmptyState({ isTeams }) {
  return (
    <div
      className="animate-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '3.5rem' }}>{isTeams ? '\uD83C\uDFC6' : '\uD83C\uDF1F'}</div>
      <div
        className="mono"
        style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}
      >
        No {isTeams ? 'teams' : 'players'} on the board yet!
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '22rem', lineHeight: 1.5 }}>
        {isTeams
          ? 'Be the first team to play and claim the top spot. Your team could be #1!'
          : 'Start a game and see your name up in lights. Every legend starts somewhere!'}
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '2rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        {'\uD83D\uDC49'} {isTeams ? '\uD83C\uDFAF' : '\uD83C\uDFAE'} {'\uD83D\uDC48'}
      </div>
    </div>
  );
}

EmptyState.propTypes = { isTeams: PropTypes.bool.isRequired };

/* ── Pill tab segmented control ───────────────────────────────── */
function PillTabs({ activeTab, onTabChange, teamCount, playerCount }) {
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll('[data-tab]');
    const activeBtn = Array.from(buttons).find(
      (b) => b.getAttribute('data-tab') === activeTab,
    );
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  const tabStyle = (tab) => ({
    position: 'relative',
    zIndex: 1,
    padding: '0.45rem 1rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: activeTab === tab ? 'var(--bg-deep)' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'color 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    whiteSpace: 'nowrap',
  });

  const badgeStyle = (tab) => ({
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '0.1rem 0.4rem',
    borderRadius: '999px',
    background: activeTab === tab ? 'rgba(0,0,0,0.2)' : 'var(--bg-elevated)',
    color: activeTab === tab ? 'var(--bg-deep)' : 'var(--text-muted)',
    lineHeight: 1.4,
    transition: 'all 0.25s ease',
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        background: 'var(--bg-elevated)',
        borderRadius: '999px',
        padding: '3px',
        border: '1px solid var(--border)',
      }}
    >
      {/* Sliding indicator */}
      <div
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: indicatorStyle.left || 0,
          width: indicatorStyle.width || 0,
          background: 'var(--accent-cyan)',
          borderRadius: '999px',
          transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1), width 0.3s ease',
          boxShadow: '0 0 10px rgba(34,211,238,0.3)',
        }}
      />

      <button
        data-tab="teams"
        className="mono"
        onClick={() => onTabChange('teams')}
        style={tabStyle('teams')}
      >
        {'\uD83C\uDFAF'} Teams
        <span className="mono" style={badgeStyle('teams')}>{teamCount}</span>
      </button>

      <button
        data-tab="players"
        className="mono"
        onClick={() => onTabChange('players')}
        style={tabStyle('players')}
      >
        {'\uD83D\uDC64'} Players
        <span className="mono" style={badgeStyle('players')}>{playerCount}</span>
      </button>
    </div>
  );
}

PillTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  teamCount: PropTypes.number.isRequired,
  playerCount: PropTypes.number.isRequired,
};

/* ── Main component ───────────────────────────────────────────── */
function LeaderboardViewComponent({ onBack }) {
  const [leaderboardTab, setLeaderboardTab] = useState('teams');

  const { teams, isLoading: loadingTeams, error: errorTeams } = useTeamLeaderboard({ limit: 20 });
  const { players, isLoading: loadingPlayers, error: errorPlayers } = usePlayerLeaderboard({ limit: 20 });

  const displayData = leaderboardTab === 'teams' ? teams : players;
  const isLoading = leaderboardTab === 'teams' ? loadingTeams : loadingPlayers;
  const error = leaderboardTab === 'teams' ? errorTeams : errorPlayers;
  const isTeams = leaderboardTab === 'teams';

  const topThree = displayData.slice(0, 3);
  const rest = displayData.slice(3);
  const maxScore = displayData.length > 0
    ? Math.abs(isTeams ? displayData[0].score : (displayData[0].bestScore || 0))
    : 0;

  return (
    <div
      style={{
        maxWidth: '100%',
        height: '100%',
        margin: '0 auto',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onBack}
            className="mono"
            style={{
              padding: '0.375rem 0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {'\u2190'} Back
          </button>
          <h2
            className="mono"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--accent-amber)',
              margin: 0,
              letterSpacing: '0.04em',
              textShadow: '0 0 20px rgba(251,191,36,0.25)',
            }}
          >
            {'\uD83C\uDFC6'} LEADERBOARD
          </h2>
        </div>

        <PillTabs
          activeTab={leaderboardTab}
          onTabChange={setLeaderboardTab}
          teamCount={teams.length}
          playerCount={players.length}
        />
      </div>

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '0.4rem 0.6rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--incorrect)',
            borderRadius: '8px',
            color: 'var(--incorrect)',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          {'\u26A0\uFE0F'} {error}
        </div>
      )}

      {/* ── Content card ─────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '2rem', animation: 'spin 1.2s linear infinite' }}>{'\u23F3'}</div>
            <span className="mono">Loading leaderboard...</span>
          </div>
        ) : displayData.length === 0 ? (
          <EmptyState isTeams={isTeams} />
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* ── Podium ───────────────────────────────────── */}
            {topThree.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1.25rem 1rem 0',
                  background: 'linear-gradient(180deg, var(--bg-elevated) 0%, transparent 100%)',
                }}
              >
                {PODIUM_ORDER.map((rankIdx) => {
                  const entry = topThree[rankIdx];
                  if (!entry) return <div key={rankIdx} style={{ flex: 1 }} />;
                  return (
                    <PodiumBlock
                      key={entry.id || `podium-${rankIdx}`}
                      entry={entry}
                      rank={rankIdx}
                      isTeams={isTeams}
                    />
                  );
                })}
              </div>
            )}

            {/* ── Divider ──────────────────────────────────── */}
            {rest.length > 0 && (
              <div
                style={{
                  height: '1px',
                  margin: '0.75rem 1rem 0.25rem',
                  background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                }}
              />
            )}

            {/* ── Remaining rows ───────────────────────────── */}
            {rest.map((entry, i) => {
              const globalIndex = i + 3;
              return (
                <ScoreBarRow
                  key={entry.id || `row-${globalIndex}`}
                  entry={entry}
                  index={globalIndex}
                  maxScore={maxScore}
                  isTeams={isTeams}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Inline keyframes for pulse / spin used in empty & loading states */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

LeaderboardViewComponent.propTypes = {
  onBack: PropTypes.func.isRequired,
};

// Memoize to prevent unnecessary re-renders - important for Chromebook performance
export const LeaderboardView = memo(LeaderboardViewComponent);
export default LeaderboardView;
