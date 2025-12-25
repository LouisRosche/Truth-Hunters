/**
 * KEYBOARD SHORTCUTS HELP MODAL
 * S-tier UX: Shows all available keyboard shortcuts
 * Accessible via ? key or Help button
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function KeyboardShortcutsHelp({ onClose }) {
  const focusTrapRef = useFocusTrap(true);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const shortcuts = [
    {
      category: 'Gameplay',
      items: [
        { keys: ['1', '2', '3'], action: 'Select confidence level' },
        { keys: ['T'], action: 'Select TRUE verdict' },
        { keys: ['M'], action: 'Select MIXED verdict' },
        { keys: ['F'], action: 'Select FALSE verdict' },
        { keys: ['Enter'], action: 'Submit answer (when form complete)' },
        { keys: ['Space'], action: 'Pause/Resume game' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['?'], action: 'Show this help' },
        { keys: ['Esc'], action: 'Close modals/dialogs' },
        { keys: ['Tab'], action: 'Move to next element' },
        { keys: ['Shift', 'Tab'], action: 'Move to previous element' },
      ]
    },
    {
      category: 'Sound & Display',
      items: [
        { keys: ['S'], action: 'Toggle sound effects' },
        { keys: ['P'], action: 'Toggle presentation mode' },
      ]
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        ref={focusTrapRef}
        onClick={(e) => e.stopPropagation()}
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⌨️</div>
          <h2
            id="shortcuts-title"
            className="mono"
            style={{
              fontSize: '1.25rem',
              color: 'var(--accent-cyan)',
              marginBottom: '0.5rem'
            }}
          >
            KEYBOARD SHORTCUTS
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Play faster with keyboard shortcuts
          </p>
        </div>

        {/* Shortcuts by category */}
        {shortcuts.map((category, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem' }}>
            <h3
              className="mono"
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-amber)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {category.category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {category.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {item.action}
                  </span>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {item.keys.map((key, keyIdx) => (
                      <kbd
                        key={keyIdx}
                        className="mono"
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--bg-deep)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--accent-cyan)',
                          minWidth: '2rem',
                          textAlign: 'center',
                          boxShadow: '0 2px 0 var(--border)'
                        }}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={onClose}
            className="mono"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-cyan)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--bg-deep)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.1s ease'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            autoFocus
          >
            Got it! (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

KeyboardShortcutsHelp.propTypes = {
  onClose: PropTypes.func.isRequired
};
