/**
 * CLAIM CARD COMPONENT
 * Displays a claim with optional answer reveal
 */

import { memo } from 'react';
import PropTypes from 'prop-types';

function ClaimCardComponent({ claim, showAnswer = false }) {
  return (
    <div
      className="animate-in"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1rem',
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
            claim.source === 'student-contributed'
              ? 'linear-gradient(90deg, var(--accent-amber), var(--accent-violet))'
              : claim.source === 'ai-generated'
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
          marginBottom: '0.625rem'
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: '0.6875rem',
            padding: '0.1875rem 0.4375rem',
            background: 'var(--bg-elevated)',
            borderRadius: '3px',
            color: 'var(--text-secondary)'
          }}
        >
          {claim.subject}
        </span>

        {showAnswer && (
          <span
            className="mono"
            style={{
              fontSize: '0.6875rem',
              padding: '0.1875rem 0.4375rem',
              background:
                claim.source === 'student-contributed'
                  ? 'rgba(251, 191, 36, 0.2)'
                  : claim.source === 'ai-generated'
                  ? 'rgba(167, 139, 250, 0.2)'
                  : 'rgba(52, 211, 153, 0.2)',
              color:
                claim.source === 'student-contributed'
                  ? 'var(--accent-amber)'
                  : claim.source === 'ai-generated'
                  ? 'var(--accent-violet)'
                  : 'var(--accent-emerald)',
              borderRadius: '3px'
            }}
          >
            {claim.source === 'student-contributed'
              ? `✨ By ${claim.contributor || 'Classmate'}`
              : claim.source === 'ai-generated'
              ? '🤖 AI-Generated'
              : '📚 Expert-Sourced'}
          </span>
        )}
      </div>

      {/* Claim text - uses claim-text class for presentation mode scaling */}
      <blockquote
        className="claim-text"
        style={{
          fontSize: '1.0625rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          borderLeft: '3px solid var(--accent-cyan)',
          paddingLeft: '0.875rem',
          margin: '0.75rem 0'
        }}
      >
        &ldquo;{claim.text}&rdquo;
      </blockquote>

      {/* Answer reveal section */}
      {showAnswer && (
        <div className="animate-in" style={{ marginTop: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                padding: '0.3125rem 0.625rem',
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
                  fontSize: '0.6875rem',
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
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}
          >
            {claim.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// PropTypes validation
ClaimCardComponent.propTypes = {
  claim: PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string.isRequired,
    answer: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']).isRequired,
    difficulty: PropTypes.oneOf(['easy', 'medium', 'hard', 'expert']),
    subject: PropTypes.string,
    source: PropTypes.string,
    contributor: PropTypes.string,
    errorPattern: PropTypes.string,
    explanation: PropTypes.string
  }).isRequired,
  showAnswer: PropTypes.bool
};

ClaimCardComponent.defaultProps = {
  showAnswer: false
};

// Memoize to prevent re-renders when props haven't changed
export const ClaimCard = memo(ClaimCardComponent);

// Also export as default for flexibility
export default ClaimCard;
