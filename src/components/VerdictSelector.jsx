/**
 * VERDICT SELECTOR COMPONENT
 * Allows users to select TRUE, MIXED, or FALSE
 */

import { useState } from 'react';

export function VerdictSelector({ value, onChange, disabled }) {
  const [showMixedHelp, setShowMixedHelp] = useState(false);

  const verdicts = [
    { value: 'TRUE', emoji: '✓', color: 'var(--correct)', description: 'The claim is completely true', shortHelp: 'Everything in this claim is accurate' },
    { value: 'MIXED', emoji: '◐', color: 'var(--accent-amber)', description: 'The claim contains both true and false elements', shortHelp: 'Some parts are true, but other parts are false or misleading', hasExplainer: true },
    { value: 'FALSE', emoji: '✗', color: 'var(--incorrect)', description: 'The claim is false or misleading', shortHelp: 'This claim is incorrect or misleading' }
  ];

  const handleKeyDown = (e, currentIndex) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % verdicts.length;
      onChange(verdicts[next].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + verdicts.length) % verdicts.length;
      onChange(verdicts[prev].value);
    }
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Verdict selection"
        className="verdict-grid"
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        {verdicts.map((v, i) => (
          <button
            key={v.value}
            type="button"
            role="radio"
            aria-checked={value === v.value}
            aria-label={`${v.value}: ${v.description}`}
            tabIndex={value === v.value || (value === null && i === 0) ? 0 : -1}
            onClick={() => onChange(v.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={disabled}
            className="verdict-option"
            style={{
              flex: 1,
              padding: '1.5rem 1.25rem',
              minHeight: '5.5rem',
              background: value === v.value ? `${v.color}20` : 'var(--bg-elevated)',
              border: `2px solid ${value === v.value ? v.color : 'var(--border)'}`,
              borderRadius: '10px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                fontSize: '2rem',
                marginBottom: '0.375rem',
                color: v.color
              }}
            >
              {v.emoji}
            </div>
            <div
              className="mono"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: value === v.value ? v.color : 'var(--text-secondary)'
              }}
            >
              {v.value}
            </div>
            {v.hasExplainer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMixedHelp(!showMixedHelp);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMixedHelp(!showMixedHelp);
                  }
                }}
                aria-label="What does MIXED mean?"
                style={{
                  position: 'absolute',
                  bottom: '0.375rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid var(--accent-amber)',
                  color: 'var(--accent-amber)',
                  fontSize: '0.5625rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                What&apos;s this?
              </button>
            )}
          </button>
        ))}
      </div>

      {/* MIXED Explainer Panel */}
      {showMixedHelp && (
        <div
          className="animate-in"
          style={{
            marginTop: '0.75rem',
            padding: '1rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h4 className="mono" style={{ fontSize: '0.8125rem', color: 'var(--accent-amber)', margin: 0 }}>
              What does MIXED mean?
            </h4>
            <button
              type="button"
              onClick={() => setShowMixedHelp(false)}
              aria-label="Close help"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0 0.25rem'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
            A <strong style={{ color: 'var(--accent-amber)' }}>MIXED</strong> claim has some truth to it, but also contains errors, exaggerations, or misleading parts.
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <strong>Example:</strong> &quot;Humans only use 10% of their brain, which is why we sleep.&quot;
            <br />
            <span style={{ color: 'var(--correct)' }}>✓ True:</span> We do sleep
            <br />
            <span style={{ color: 'var(--incorrect)' }}>✗ False:</span> The &quot;10% of brain&quot; claim is a myth
          </div>
        </div>
      )}
    </div>
  );
}
