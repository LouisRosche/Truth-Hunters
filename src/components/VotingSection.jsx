/**
 * VOTING SECTION - ULTRA MINIMAL
 * Inline form with progressive disclosure
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { VerdictSelector } from './VerdictSelector';
import { ConfidenceSelector } from './ConfidenceSelector';
import { HINT_TYPES } from '../data/constants';

function VotingSectionComponent({
  verdict,
  onVerdictChange,
  confidence,
  onConfidenceChange,
  reasoning,
  onReasoningChange,
  usedHints,
  hintCostTotal,
  onHintRequest,
  onSubmit,
  teamAvatar,
  disabled
}) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {/* Verdict - inline, no card */}
      <div>
        <VerdictSelector value={verdict} onChange={onVerdictChange} />
      </div>

      {/* Confidence - inline, no card */}
      <div>
        <ConfidenceSelector value={confidence} onChange={onConfidenceChange} />
      </div>

      {/* Reasoning - hidden by default */}
      {!showReasoning ? (
        <button
          onClick={() => setShowReasoning(true)}
          className="mono"
          style={{
            padding: '0.25rem 0.5rem',
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.6875rem',
            cursor: 'pointer'
          }}
        >
          + Add reasoning
        </button>
      ) : (
        <div style={{ position: 'relative' }}>
          <textarea
            value={reasoning}
            onChange={(e) => onReasoningChange(e.target.value)}
            placeholder="Why? (optional)"
            rows={2}
            maxLength={500}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-serif)',
              resize: 'none'
            }}
          />
          <button
            onClick={() => setShowReasoning(false)}
            style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.125rem 0.25rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Hints - small icon buttons */}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {HINT_TYPES.map((hint) => {
          const isUsed = usedHints.includes(hint.id);
          return (
            <button
              key={hint.id}
              onClick={() => onHintRequest(hint.id)}
              disabled={isUsed}
              title={`${hint.name} (-${hint.cost})`}
              style={{
                padding: '0.25rem 0.375rem',
                background: isUsed ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                color: isUsed ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (isUsed ? 'var(--accent-violet)' : 'var(--border)'),
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: isUsed ? 'default' : 'pointer',
                opacity: isUsed ? 0.6 : 1
              }}
            >
              {hint.icon}
            </button>
          );
        })}
        {hintCostTotal > 0 && (
          <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--incorrect)', alignSelf: 'center' }}>
            -{hintCostTotal}
          </span>
        )}
      </div>

      {/* Submit */}
      <Button onClick={onSubmit} fullWidth disabled={!verdict || disabled}>
        {teamAvatar?.emoji || '✓'} Submit
      </Button>
    </div>
  );
}

VotingSectionComponent.propTypes = {
  verdict: PropTypes.oneOf(['TRUE', 'FALSE', 'MIXED']),
  onVerdictChange: PropTypes.func.isRequired,
  confidence: PropTypes.oneOf([1, 2, 3]).isRequired,
  onConfidenceChange: PropTypes.func.isRequired,
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

export const VotingSection = memo(VotingSectionComponent);
export default VotingSection;
