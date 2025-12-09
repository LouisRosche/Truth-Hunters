/**
 * TIMER DISPLAY COMPONENT
 * Shows countdown timer with visual feedback
 */

export function TimerDisplay({ time, isActive, isPaused, label }) {
  const isLow = time <= 10;

  return (
    <div
      role="timer"
      aria-live={isLow ? 'assertive' : 'polite'}
      aria-label={`${label}: ${Math.floor(time / 60)} minutes ${time % 60} seconds remaining${isPaused ? ', paused' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem'
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: isPaused ? 'var(--accent-amber)' : 'var(--text-muted)'
        }}
      >
        {isPaused ? 'PAUSED' : label}
      </span>
      <div
        className={`mono ${isLow && isActive ? 'animate-pulse' : ''}`}
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: isLow ? 'var(--accent-rose)' : 'var(--accent-cyan)',
          textShadow: isLow ? '0 0 20px var(--accent-rose)' : 'none'
        }}
      >
        {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
      </div>
    </div>
  );
}
