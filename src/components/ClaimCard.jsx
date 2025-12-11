/**
 * CLAIM CARD COMPONENT
 * Displays a claim with optional answer reveal
 */

export function ClaimCard({ claim, showAnswer = false }) {
  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background:
            claim.source === 'ai-generated'
              ? 'linear-gradient(90deg, var(--accent-violet), var(--accent-rose))'
              : 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))'
        }}
      />

      {/* Subject and source badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            background: 'var(--bg-elevated)',
            borderRadius: '4px',
            color: 'var(--text-secondary)'
          }}
        >
          {claim.subject}
        </span>

        {showAnswer && (
          <span
            className="mono"
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              background:
                claim.source === 'ai-generated'
                  ? 'rgba(167, 139, 250, 0.2)'
                  : 'rgba(52, 211, 153, 0.2)',
              color:
                claim.source === 'ai-generated'
                  ? 'var(--accent-violet)'
                  : 'var(--accent-emerald)',
              borderRadius: '4px'
            }}
          >
            {claim.source === 'ai-generated' ? '🤖 AI-Generated' : '📚 Expert-Sourced'}
          </span>
        )}
      </div>

      {/* Claim text - uses claim-text class for presentation mode scaling */}
      <blockquote
        className="claim-text"
        style={{
          fontSize: '1.25rem',
          lineHeight: 1.75,
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          borderLeft: '4px solid var(--accent-cyan)',
          paddingLeft: '1.25rem',
          margin: '1.25rem 0'
        }}
      >
        &ldquo;{claim.text}&rdquo;
      </blockquote>

      {/* Answer reveal section */}
      {showAnswer && (
        <div className="animate-in" style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                background:
                  claim.answer === 'TRUE'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : claim.answer === 'FALSE'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(251, 191, 36, 0.2)',
                color:
                  claim.answer === 'TRUE'
                    ? 'var(--correct)'
                    : claim.answer === 'FALSE'
                    ? 'var(--incorrect)'
                    : 'var(--accent-amber)'
              }}
            >
              {claim.answer}
            </span>
            {claim.source === 'ai-generated' && (
              <span
                className="mono"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-rose)'
                }}
              >
                Error: {claim.errorPattern}
              </span>
            )}
          </div>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: 1.6
            }}
          >
            {claim.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
