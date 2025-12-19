/**
 * TUTORIAL OVERLAY
 * First-time user onboarding overlay explaining game mechanics
 */

import PropTypes from 'prop-types';
import { Button } from './Button';
import { safeSetItem } from '../utils/safeStorage';

/**
 * Tutorial overlay component that shows gameplay instructions to first-time users
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback when tutorial is dismissed
 * @param {string} props.sessionId - Current session ID for storage
 */
export function TutorialOverlay({ onClose, sessionId }) {
  const handleClose = () => {
    onClose();
    // Store session ID to allow tutorial again in new sessions
    safeSetItem('truthDetector_tutorialSeen', { sessionId, seen: true });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--accent-violet)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          boxShadow: '0 0 30px rgba(167, 139, 250, 0.5)'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--accent-violet)' }}>
          🎮 Welcome to Truth Detector!
        </h2>
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--accent-amber)' }}>⚡ Gold timer = speed bonus zone</strong><br />
            Answer faster to earn multipliers up to 2.0x!
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--incorrect)' }}>⚠️ Do not switch tabs or round forfeits!</strong><br />
            Zero tolerance: ANY tab switch = -10 points
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>💡 Higher confidence = higher stakes</strong><br />
            Confidence ●●●: +5 pts if right, -6 pts if wrong
          </p>
          <p>
            <strong style={{ color: 'var(--accent-emerald)' }}>⌨️ Keyboard shortcuts</strong><br />
            T/F/M for verdict · 1-3 for confidence · Enter to submit · ? for help
          </p>
        </div>
        <Button onClick={handleClose} fullWidth>
          Got it! Let&apos;s play 🎯
        </Button>
      </div>
    </div>
  );
}

TutorialOverlay.propTypes = {
  onClose: PropTypes.func.isRequired,
  sessionId: PropTypes.string
};

TutorialOverlay.defaultProps = {
  sessionId: null
};
