/**
 * VOTING SECTION
 * Main voting interface with verdict, confidence, reasoning, and hints
 */

import PropTypes from 'prop-types';
import { Button } from './Button';
import { VerdictSelector } from './VerdictSelector';
import { ConfidenceSelector } from './ConfidenceSelector';
import { HINT_TYPES } from '../data/constants';

/**
 * Voting section component for claim evaluation
 * @param {Object} props - Component props
 */
export function VotingSection({
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
    <div className="animate-in" style={{ marginTop: '0.75rem' }}>
      {/* Verdict & Confidence side-by-side to save vertical space */}
      <div className="voting-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {/* Verdict Selection */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}
        >
          <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
            VERDICT
          </h3>
          <VerdictSelector value={verdict} onChange={onVerdictChange} />
        </div>

        {/* Confidence Selection with Risk Preview */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}
        >
          <h3 className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
            CONFIDENCE
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
              padding: '0.375rem 0.5rem',
              background: 'rgba(167, 139, 250, 0.1)',
              borderRadius: '4px',
              fontSize: '0.625rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            If right: <span style={{ color: 'var(--correct)', fontWeight: 600 }}>+{confidencePreview.ifCorrect}</span>
            {' | '}
            If wrong: <span style={{ color: 'var(--incorrect)', fontWeight: 600 }}>{confidencePreview.ifWrong}</span>
            <br />
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>+ speed bonus (up to 2.0x)</span>
          </div>
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
          style={{ display: 'block', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}
        >
          WHY? (optional)
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => onReasoningChange(e.target.value)}
          placeholder="What made you choose this?"
          rows={2}
          maxLength={500}
          aria-label="Explain your reasoning"
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-serif)',
            resize: 'none'
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
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3
            className="mono"
            style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', margin: 0 }}
          >
            💡 HINTS
          </h3>
          {hintCostTotal > 0 && (
            <span
              className="mono"
              style={{
                fontSize: '0.625rem',
                color: 'var(--incorrect)',
                padding: '0.125rem 0.375rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '3px'
              }}
            >
              -{hintCostTotal} pts
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {HINT_TYPES.map((hint) => {
            const isUsed = usedHints.includes(hint.id);
            return (
              <button
                key={hint.id}
                onClick={() => onHintRequest(hint.id)}
                disabled={isUsed}
                className="mono"
                style={{
                  padding: '0.375rem 0.5rem',
                  background: isUsed ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                  color: isUsed ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  cursor: isUsed ? 'default' : 'pointer',
                  opacity: isUsed ? 0.7 : 1,
                  textDecoration: isUsed ? 'line-through' : 'none'
                }}
              >
                {hint.icon} {hint.name} (-{hint.cost})
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={onSubmit} fullWidth disabled={!verdict || disabled}>
        {teamAvatar?.emoji || '🔒'} Lock In Answer
      </Button>
    </div>
  );
}

VotingSection.propTypes = {
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

VotingSection.defaultProps = {
  verdict: null,
  reasoning: '',
  teamAvatar: null,
  disabled: false
};
