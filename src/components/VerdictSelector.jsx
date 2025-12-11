/**
 * VERDICT SELECTOR COMPONENT
 * Allows users to select TRUE, MIXED, or FALSE
 */

export function VerdictSelector({ value, onChange, disabled }) {
  const verdicts = [
    { value: 'TRUE', emoji: '✓', color: 'var(--correct)' },
    { value: 'MIXED', emoji: '◐', color: 'var(--accent-amber)' },
    { value: 'FALSE', emoji: '✗', color: 'var(--incorrect)' }
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
            transition: 'all 0.2s ease'
          }}
        >
          <div
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
        </button>
      ))}
    </div>
  );
}
