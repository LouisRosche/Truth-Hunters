/**
 * PREDICTION MODAL
 * End-of-game modal for predicting final score
 */

import { useState } from 'react';
import { Button } from './Button';

export function PredictionModal({ onSubmit, currentScore }) {
  const [prediction, setPrediction] = useState(currentScore);

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
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
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
          <span aria-hidden="true">🎯</span> FINAL PREDICTION
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}
        >
          What do you think your final score will be? If you're within ±2 points, you'll earn a
          calibration bonus!
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <div
            className="mono"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem'
            }}
          >
            Current Score: {currentScore}
          </div>
          <input
            type="number"
            value={prediction}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              // Bound prediction to reasonable range (-100 to 100)
              const bounded = Math.max(-100, Math.min(100, val));
              setPrediction(bounded);
            }}
            min="-100"
            max="100"
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
        </div>

        <Button onClick={() => onSubmit(prediction)} fullWidth>
          Lock In Prediction
        </Button>
      </div>
    </div>
  );
}
