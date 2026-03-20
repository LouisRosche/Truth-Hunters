/**
 * HELP MODAL COMPONENT
 * Displays game instructions, scoring, keyboard shortcuts, and tips.
 */

import { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFocusTrap } from '../hooks/useFocusTrap';

function HelpModalComponent({ onClose }) {
  const focusTrapRef = useFocusTrap(true);
  const previousFocusRef = useRef(null);

  // Store and restore focus on mount/unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      ref={focusTrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2
            id="help-title"
            className="mono"
            style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}
          >
            How to Play
          </h2>
          <button
            onClick={onClose}
            aria-label="Close help"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
              Goal
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Evaluate claims and determine if they are TRUE, FALSE, or MIXED (partially true). Score points for correct answers!
            </p>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
              Scoring
            </h3>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0 }}>
              <li>High confidence correct: +5 points</li>
              <li>Medium confidence correct: +3 points</li>
              <li>Low confidence correct: +1 point</li>
              <li>High confidence wrong: -6 points</li>
              <li>Medium confidence wrong: -3 points</li>
              <li>Low confidence wrong: -1 point</li>
              <li>Calibration bonus: +3 pts if prediction is within 2 of actual!</li>
            </ul>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              Keyboard Shortcuts
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem' }}>
              <span className="mono" style={{ color: 'var(--accent-violet)' }}>T/F/M</span>
              <span>Select TRUE/FALSE/MIXED</span>
              <span className="mono" style={{ color: 'var(--accent-violet)' }}>1/2/3</span>
              <span>Set confidence level</span>
              <span className="mono" style={{ color: 'var(--accent-violet)' }}>Enter</span>
              <span>Submit answer / Next round</span>
              <span className="mono" style={{ color: 'var(--accent-violet)' }}>?</span>
              <span>Toggle shortcut hints</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
            <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
              Tips
            </h3>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0 }}>
              <li>Use hints if stuck (costs points)</li>
              <li>Discuss with your team before answering</li>
              <li>Watch for AI-generated misinformation patterns</li>
              <li>Calibrate your confidence - it affects scoring!</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mono"
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--accent-cyan)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--bg-deep)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

HelpModalComponent.propTypes = {
  onClose: PropTypes.func.isRequired
};

export const HelpModal = memo(HelpModalComponent);
