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
      border: 'none',
      boxShadow: '0 2px 8px rgba(34, 211, 238, 0.3)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--accent-cyan)',
      border: '2px solid var(--accent-cyan)',
      boxShadow: 'none'
    },
    danger: {
      background: 'var(--accent-rose)',
      color: 'white',
      border: 'none',
      boxShadow: '0 2px 8px rgba(251, 113, 133, 0.3)'
    }
  };

  const sizes = {
    sm: { padding: '0.625rem 1rem', fontSize: '0.9375rem', minHeight: '44px' },
    md: { padding: '0.875rem 1.5rem', fontSize: '1.0625rem', minHeight: '48px' },
    lg: { padding: '1rem 2rem', fontSize: '1.1875rem', minHeight: '52px' }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className="mono btn-interactive"
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        letterSpacing: '0.025em',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = variant === 'primary'
            ? '0 4px 12px rgba(34, 211, 238, 0.4)'
            : variant === 'danger'
            ? '0 4px 12px rgba(251, 113, 133, 0.4)'
            : '0 2px 8px rgba(34, 211, 238, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow || 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
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
