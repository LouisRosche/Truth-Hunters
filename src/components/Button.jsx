/**
 * BUTTON COMPONENT
 * Reusable button with variants and double-click protection
 */

import { useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';

export const Button = memo(function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  fullWidth,
  size = 'md',
  ariaLabel,
  preventDoubleClickMs = 500
}) {
  const lastClickRef = useRef(0);

  const handleClick = useCallback(
    (e) => {
      if (disabled) return;

      // Prevent rapid double-clicks
      const now = Date.now();
      if (now - lastClickRef.current < preventDoubleClickMs) {
        e.preventDefault();
        return;
      }
      lastClickRef.current = now;

      onClick?.(e);
    },
    [onClick, disabled, preventDoubleClickMs]
  );

  const variants = {
    primary: {
      background: 'var(--accent-cyan)',
      color: 'var(--bg-deep)',
      border: 'none'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--accent-cyan)',
      border: '2px solid var(--accent-cyan)'
    },
    danger: {
      background: 'var(--accent-rose)',
      color: 'white',
      border: 'none'
    }
  };

  const sizes = {
    sm: { padding: '0.625rem 1rem', fontSize: '0.875rem', minHeight: '44px' },
    md: { padding: '0.875rem 1.5rem', fontSize: '1rem', minHeight: '44px' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem', minHeight: '48px' }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className="mono"
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        letterSpacing: '0.025em'
      }}
    >
      {children}
    </button>
  );
});

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  ariaLabel: PropTypes.string,
  preventDoubleClickMs: PropTypes.number
};

Button.defaultProps = {
  onClick: null,
  variant: 'primary',
  disabled: false,
  fullWidth: false,
  size: 'md',
  ariaLabel: null,
  preventDoubleClickMs: 500
};
