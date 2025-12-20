/**
 * SCROLLING LEADERBOARD COMPONENT
 * Displays a vertical carousel wheel effect leaderboard
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';

export function ScrollingLeaderboard({ onViewFull }) {
  const [entries, setEntries] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const isMountedRef = useRef(true);

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

  // Auto-scroll carousel
  const advanceCarousel = useCallback(() => {
    if (entries.length > 0) {
      setCurrentIndex(prev => (prev + 1) % entries.length);
    }
  }, [entries.length]);

  useEffect(() => {
    if (isPaused || entries.length <= 5) return;

    const interval = setInterval(advanceCarousel, 2500); // Move every 2.5 seconds
    return () => clearInterval(interval);
  }, [isPaused, entries.length, advanceCarousel]);

  // Calculate visible items with carousel wheel effect
  const getVisibleItems = () => {
    if (entries.length === 0) return [];

    const visibleCount = 7; // Number of visible slots
    const halfVisible = Math.floor(visibleCount / 2);
    const items = [];

    for (let i = -halfVisible; i <= halfVisible; i++) {
      const index = (currentIndex + i + entries.length) % entries.length;
      const entry = entries[index];
      const absoluteDistance = Math.abs(i);

      // Calculate transform properties for 3D wheel effect
      const scale = 1 - (absoluteDistance * 0.12);
      const opacity = 1 - (absoluteDistance * 0.25);
      const blur = absoluteDistance * 0.5;
      const yOffset = i * 56; // Vertical spacing

      items.push({
        entry,
        originalIndex: index,
        position: i,
        style: {
          transform: `translateY(${yOffset}px) scale(${scale})`,
          opacity: Math.max(0.15, opacity),
          filter: blur > 0 ? `blur(${blur}px)` : 'none',
          zIndex: visibleCount - absoluteDistance,
        }
      });
    }

    return items;
  };

  if (entries.length === 0) {
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No games played yet!<br />Be the first team on the board.
        </p>
      </div>
    );
  }

  const visibleItems = getVisibleItems();

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexShrink: 0
      }}>
        <h3 className="mono" style={{
          fontSize: '0.75rem',
          color: 'var(--accent-amber)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          🏆 LEADERBOARD
        </h3>
        <span className="mono" style={{
          fontSize: '0.5625rem',
          color: 'var(--text-muted)',
          padding: '0.125rem 0.375rem',
          background: isPaused ? 'rgba(251, 191, 36, 0.15)' : 'rgba(34, 211, 238, 0.15)',
          borderRadius: '4px'
        }}>
          {isPaused ? '⏸ PAUSED' : '▶ LIVE'}
        </span>
      </div>

      {/* Carousel wheel container */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '400px'
      }}>
        {/* Gradient overlays for fade effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, var(--bg-card) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 100%)',
          zIndex: 10,
          pointerEvents: 'none'
        }} />

        {/* Carousel items */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)'
        }}>
          {visibleItems.map(({ entry, originalIndex, position, style }) => (
            <div
              key={`${entry.id || originalIndex}-${position}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                ...style,
                transition: 'all 0.4s ease-out'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.625rem',
                background: originalIndex < 3 ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-elevated)',
                borderRadius: '8px',
                border: originalIndex < 3 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--border)',
                margin: '0 0.25rem'
              }}>
                {/* Rank */}
                <div className="mono" style={{
                  width: '1.75rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: originalIndex === 0 ? '#ffd700' : originalIndex === 1 ? '#c0c0c0' : originalIndex === 2 ? '#cd7f32' : 'var(--text-muted)'
                }}>
                  {originalIndex < 3 ? ['🥇', '🥈', '🥉'][originalIndex] : `${originalIndex + 1}`}
                </div>

                {/* Avatar */}
                <div style={{ fontSize: '1.125rem' }}>
                  {entry.teamAvatar || '🔍'}
                </div>

                {/* Team info - more granular */}
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
                    display: 'flex',
                    gap: '0.375rem',
                    fontSize: '0.5625rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.125rem'
                  }}>
                    <span>{entry.accuracy || 0}% acc</span>
                    <span>·</span>
                    <span>{entry.rounds || '?'}R</span>
                    {entry.difficulty && (
                      <>
                        <span>·</span>
                        <span style={{
                          color: entry.difficulty === 'hard' ? 'var(--accent-rose)' :
                                 entry.difficulty === 'medium' ? 'var(--accent-amber)' :
                                 'var(--accent-emerald)'
                        }}>
                          {entry.difficulty === 'hard' ? '🔥' : entry.difficulty === 'medium' ? '⚡' : '✨'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="mono" style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: entry.score >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)'
                }}>
                  {entry.score > 0 ? '+' : ''}{entry.score}
                </div>
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
          fontSize: '0.625rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
      >
        VIEW FULL LEADERBOARD →
      </button>
    </div>
  );
}
