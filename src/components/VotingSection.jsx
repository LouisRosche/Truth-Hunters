/**
 * VOTING SECTION
 * Main voting interface with verdict, confidence, reasoning, and hints
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { VerdictSelector } from './VerdictSelector';
import { ConfidenceSelector } from './ConfidenceSelector';
import { HINT_TYPES } from '../data/constants';

/**
 * Voting section component for claim evaluation
 * @param {Object} props - Component props
 */
function VotingSectionComponent({
  verdict,
  onVerdictChange,
  confidence,
  onConfidenceChange,
  confidencePreview,
  reasoning,
  onReasoningChange,
  usedHints,
  hintCostTotal,
  onHintRequest,
  onSubmit,
  teamAvatar,
  disabled
}) {
  return (
    <div className="animate-in" style={{ marginTop: '0.5rem' }}>
      {/* Verdict Selection */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.5rem'
        }}
      >
        <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
          1. WHAT&apos;S YOUR VERDICT?
        </h3>
        <VerdictSelector value={verdict} onChange={onVerdictChange} />
      </div>

      {/* Confidence Selection with Risk Preview */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.5rem'
        }}
      >
        <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
          2. HOW CONFIDENT ARE YOU?
        </h3>
        <ConfidenceSelector value={confidence} onChange={onConfidenceChange} aria-describedby="confidence-preview" />
        {/* Risk Preview */}
        <div
          id="confidence-preview"
          className="mono"
          role="status"
          aria-live="polite"
          style={{
            marginTop: '0.5rem',
            padding: '0.625rem 0.75rem',
            background: 'rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          If right: <span style={{ color: 'var(--correct)', fontWeight: 700, fontSize: '1rem' }}>+{confidencePreview.ifCorrect}</span>
          {' | '}
          If wrong: <span style={{ color: 'var(--incorrect)', fontWeight: 700, fontSize: '1rem' }}>{confidencePreview.ifWrong}</span>
          <br />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'inline-block' }}>+ speed bonus (up to 2.0x)</span>
        </div>
      </div>

      {/* Reasoning (optional) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.5rem'
        }}
      >
        <label
          className="mono"
          style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}
        >
          3. WHY? (optional - helps you learn!)
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => onReasoningChange(e.target.value)}
          placeholder="What clues did you notice? What made you choose this answer?"
          rows={2}
          maxLength={500}
          aria-label="Explain your reasoning"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-serif)',
            resize: 'none',
            lineHeight: 1.5
          }}
        />
      </div>

      {/* Hint System */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3
            className="mono"
            style={{ fontSize: '0.875rem', color: 'var(--accent-violet)', margin: 0 }}
          >
            💡 NEED HELP?
          </h3>
          {hintCostTotal > 0 && (
            <span
              className="mono"
              style={{
                fontSize: '0.75rem',
                color: 'var(--incorrect)',
                padding: '0.25rem 0.5rem',
                background: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              -{hintCostTotal} pts
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {HINT_TYPES.map((hint) => {
            const isUsed = usedHints.includes(hint.id);
            return (
              <button
                key={hint.id}
                onClick={() => onHintRequest(hint.id)}
                disabled={isUsed}
                className="mono"
                style={{
                  padding: '0.5rem 0.75rem',
                  minHeight: '44px',
                  background: isUsed ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                  color: isUsed ? 'white' : 'var(--text-secondary)',
                  border: '2px solid ' + (isUsed ? 'var(--accent-violet)' : 'var(--border)'),
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: isUsed ? 'default' : 'pointer',
                  opacity: isUsed ? 0.7 : 1,
                  textDecoration: isUsed ? 'line-through' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {hint.icon} {hint.name} (-{hint.cost})
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={onSubmit} fullWidth disabled={!verdict || disabled}>
        {teamAvatar?.emoji || '✓'} Submit Answer
      </Button>
    </div>
  );
}

VotingSectionComponent.propTypes = {
  verdict: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']),
  onVerdictChange: PropTypes.func.isRequired,
  confidence: PropTypes.oneOf([1, 2, 3]).isRequired,
  onConfidenceChange: PropTypes.func.isRequired,
  confidencePreview: PropTypes.shape({
    ifCorrect: PropTypes.number.isRequired,
    ifWrong: PropTypes.number.isRequired
  }).isRequired,
  reasoning: PropTypes.string,
  onReasoningChange: PropTypes.func.isRequired,
  usedHints: PropTypes.arrayOf(PropTypes.string).isRequired,
  hintCostTotal: PropTypes.number.isRequired,
  onHintRequest: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  teamAvatar: PropTypes.shape({
    emoji: PropTypes.string,
    name: PropTypes.string
  }),
  disabled: PropTypes.bool
};

VotingSectionComponent.defaultProps = {
  verdict: null,
  reasoning: '',
  teamAvatar: null,
  disabled: false
};

// Memoize to prevent re-renders during gameplay - critical for Chromebook performance
export const VotingSection = memo(VotingSectionComponent);
export default VotingSection;
