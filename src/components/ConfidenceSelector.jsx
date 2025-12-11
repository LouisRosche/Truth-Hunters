/**
 * CONFIDENCE SELECTOR COMPONENT
 * Allows users to select confidence level (1-3)
 */

export function ConfidenceSelector({ value, onChange, disabled }) {
  const levels = [
    { value: 1, label: 'We think so', risk: '+1 / -1', color: 'var(--confidence-1)' },
    { value: 2, label: 'Pretty sure', risk: '+3 / -3', color: 'var(--confidence-2)' },
    { value: 3, label: 'Certain', risk: '+5 / -6', color: 'var(--confidence-3)' }
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
          tabIndex={value === level.value ? 0 : -1}
          onClick={() => onChange(level.value)}
          onKeyDown={(e) => handleKeyDown(e, level.value)}
          disabled={disabled}
          className="confidence-option"
          style={{
            flex: '1 1 auto',
            minWidth: '140px',
            minHeight: '5rem',
            padding: '1.25rem 1rem',
            background: value === level.value ? `${level.color}20` : 'var(--bg-elevated)',
            border: `2px solid ${value === level.value ? level.color : 'var(--border)'}`,
            borderRadius: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: level.color,
              marginBottom: '0.375rem'
            }}
          >
            {'●'.repeat(level.value)}
            {'○'.repeat(3 - level.value)}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}
          >
            {level.label}
          </div>
          <div
            className="mono"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)'
            }}
          >
            {level.risk}
          </div>
        </button>
      ))}
    </div>
  );
}
