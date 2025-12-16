/**
 * PREDICTION MODAL
 * Start-of-game modal for predicting final score (metacognition priming)
 */

import { useState } from 'react';
import { Button } from './Button';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function PredictionModal({ onSubmit, totalRounds, difficulty, isStartOfGame: _isStartOfGame = true }) {
  // Default prediction based on rounds and difficulty (rough estimate)
  const defaultPrediction = Math.round(totalRounds * 2); // Assume ~2 points per round average
  const [prediction, setPrediction] = useState(defaultPrediction);
  const focusTrapRef = useFocusTrap(true);

  // Calculate potential score range for context
  const maxPossibleScore = totalRounds * 5; // All correct with high confidence
  const minPossibleScore = totalRounds * -6; // All wrong with high confidence

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        ref={focusTrapRef}
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '440px',
          width: '100%'
        }}
      >
        <h2
          id="prediction-modal-title"
          className="mono"
          style={{
            fontSize: '1.25rem',
            color: 'var(--accent-amber)',
            marginBottom: '0.5rem'
          }}
        >
          <span aria-hidden="true">🎯</span> PREDICT YOUR SCORE
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}
        >
          Before you start, how well do you think your team will do?
        </p>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          This is called <strong style={{ color: 'var(--accent-cyan)' }}>calibration</strong> — matching your confidence to reality.
          If your prediction is within ±2 points of your final score, you&apos;ll earn a <strong style={{ color: 'var(--accent-amber)' }}>+3 bonus</strong>!
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <div
            className="mono"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>{totalRounds} rounds • {difficulty} difficulty</span>
            <span>Range: {minPossibleScore} to {maxPossibleScore}</span>
          </div>
          <input
            type="number"
            value={prediction}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              // Bound prediction to possible range
              const bounded = Math.max(minPossibleScore, Math.min(maxPossibleScore, val));
              setPrediction(bounded);
            }}
            min={minPossibleScore}
            max={maxPossibleScore}
            autoFocus
            aria-label="Predicted final score"
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '1.5rem',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center'
            }}
          />
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}
          >
            Think about how confident you are and how hard the questions might be
          </div>
        </div>

        <Button onClick={() => onSubmit(prediction)} fullWidth>
          Lock In Prediction &amp; Start Game
        </Button>
      </div>
    </div>
  );
}
