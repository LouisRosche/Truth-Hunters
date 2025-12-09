/**
 * HEADER COMPONENT
 * Displays game title, score, and round information
 */

export function Header({ score, round, totalRounds, phase }) {
  return (
    <header
      role="banner"
      aria-label="Game status"
      style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🔍</span>
        <h1
          className="mono"
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--accent-cyan)'
          }}
        >
          TRUTH HUNTERS
        </h1>
      </div>

      {phase !== 'setup' && phase !== 'debrief' && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div
            className="mono"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}
          >
            ROUND{' '}
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
              {round}
            </span>
            /{totalRounds}
          </div>
          <div
            className="mono"
            style={{
              padding: '0.375rem 0.75rem',
              background: score >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${score >= 0 ? 'var(--correct)' : 'var(--incorrect)'}`,
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: score >= 0 ? 'var(--correct)' : 'var(--incorrect)'
            }}
          >
            {score >= 0 ? '+' : ''}
            {score} PTS
          </div>
        </div>
      )}
    </header>
  );
}
