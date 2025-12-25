/**
 * CONFIDENCE SELECTOR COMPONENT
 * Allows users to select confidence level (1-3)
 */

import { memo } from 'react';
import PropTypes from 'prop-types';

export const ConfidenceSelector = memo(function ConfidenceSelector({ value, onChange, disabled }) {
  const levels = [
    { value: 1, label: 'Not sure', risk: 'Right +1 · Wrong -1', color: 'var(--confidence-1)', levelText: 'Safe' },
    { value: 2, label: 'Pretty sure', risk: 'Right +3 · Wrong -3', color: 'var(--confidence-2)', levelText: 'Medium' },
    { value: 3, label: 'Certain!', risk: 'Right +5 · Wrong -6', color: 'var(--confidence-3)', levelText: 'Risky' }
  ];

  const handleKeyDown = (e, levelValue) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(3, levelValue + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(1, levelValue - 1);
      onChange(prev);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Confidence level"
      className="confidence-grid"
      style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
    >
      {levels.map((level) => (
        <button
          key={level.value}
          type="button"
          role="radio"
          aria-checked={value === level.value}
          aria-label={`${level.levelText} confidence: ${level.label}. Points: ${level.risk}`}
          tabIndex={value === level.value ? 0 : -1}
          onClick={() => onChange(level.value)}
          onKeyDown={(e) => handleKeyDown(e, level.value)}
          disabled={disabled}
          className="confidence-option"
          style={{
            flex: '1 1 0',
            minWidth: '150px',
            minHeight: '6rem',
            padding: '1rem',
            background: value === level.value ? `${level.color}25` : 'var(--bg-elevated)',
            border: `3px solid ${value === level.value ? level.color : 'var(--border)'}`,
            borderRadius: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            transform: value === level.value ? 'scale(1.02)' : 'scale(1)',
            boxShadow: value === level.value ? `0 4px 12px ${level.color}30` : 'none'
          }}
        >
          {/* Confidence level indicator with text label for accessibility */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div
              className="mono"
              aria-hidden="true"
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: level.color,
                lineHeight: 1
              }}
            >
              {'●'.repeat(level.value)}
              {'○'.repeat(3 - level.value)}
            </div>
            <span
              className="mono"
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: value === level.value ? level.color : 'var(--bg-card)',
                color: value === level.value ? 'var(--bg-deep)' : 'var(--text-muted)',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              {level.levelText}
            </span>
          </div>
          <div
            style={{
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            {level.label}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}
          >
            {level.risk}
          </div>
        </button>
      ))}
    </div>
  );
});

ConfidenceSelector.propTypes = {
  value: PropTypes.oneOf([1, 2, 3]).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

ConfidenceSelector.defaultProps = {
  disabled: false
};
