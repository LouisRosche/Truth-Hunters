/**
 * SCROLLING LEADERBOARD COMPONENT
 * Displays an auto-scrolling leaderboard on the landing page sidebar
 */

import { useState, useEffect, useRef } from 'react';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';

export function ScrollingLeaderboard({ onViewFull }) {
  const [entries, setEntries] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      let data = [];

      // Try Firebase first, fallback to local
      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopTeams(20);
        } catch (e) {
          console.warn('Firebase leaderboard fetch failed:', e);
        }
      }

      // Fallback to local leaderboard
      if (data.length === 0) {
        data = LeaderboardManager.getTopTeams(20);
      }

      setEntries(data);
    };

    loadLeaderboard();

    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || entries.length <= 5 || isPaused) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    const itemHeight = 64; // approximate height of each entry
    const totalHeight = entries.length * itemHeight;

    const animate = () => {
      scrollPosition += scrollSpeed;

      // Reset when scrolled past all items
      if (scrollPosition >= totalHeight) {
        scrollPosition = 0;
      }

      scrollContainer.scrollTop = scrollPosition;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [entries, isPaused]);

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
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 LEADERBOARD
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
          No games played yet!<br />Be the first team on the board.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h3 className="mono" style={{
        fontSize: '0.75rem',
        color: 'var(--accent-amber)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 LEADERBOARD
        </span>
        <span style={{
          fontSize: '0.625rem',
          color: 'var(--text-muted)',
          fontWeight: 400
        }}>
          {isPaused ? '⏸ Paused' : '▶ Live'}
        </span>
      </h3>

      {/* Scrolling container */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          minHeight: '300px',
          maxHeight: '500px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.625rem',
                background: index < 3 ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-elevated)',
                borderRadius: '8px',
                border: index < 3 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--border)'
              }}
            >
              {/* Rank */}
              <div
                className="mono"
                style={{
                  width: '1.5rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-muted)'
                }}
              >
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </div>

              {/* Avatar */}
              <div style={{ fontSize: '1.25rem' }}>
                {entry.teamAvatar || '🔍'}
              </div>

              {/* Team info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {entry.teamName}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {entry.accuracy}% accuracy
                </div>
              </div>

              {/* Score */}
              <div
                className="mono"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)'
                }}
              >
                {entry.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View full leaderboard button */}
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
          fontSize: '0.6875rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        View Full Leaderboard →
      </button>
    </div>
  );
}
