/**
 * METACOGNITIVE CHECKPOINT
 * Mid-game reflection modal to help students assess their progress
 */

import { useState } from 'react';
import { Button } from './Button';
import { useFocusTrap } from '../hooks/useFocusTrap';

const CHECKPOINT_PROMPTS = [
  {
    question: "How confident are you feeling about your team's progress so far?",
    options: [
      { label: '😰 Struggling', value: 'struggling' },
      { label: '🤔 Uncertain', value: 'uncertain' },
      { label: '😊 Good', value: 'good' },
      { label: '🔥 Crushing it!', value: 'excellent' }
    ]
  },
  {
    question: "Which strategy is helping your team most?",
    options: [
      { label: '🔍 Checking sources', value: 'sources' },
      { label: '🤝 Team discussion', value: 'discussion' },
      { label: '🧠 Prior knowledge', value: 'knowledge' },
      { label: '⚖️ Weighing confidence', value: 'confidence' }
    ]
  }
];

export function MetacognitiveCheckpoint({ onContinue, currentScore, correctCount, totalRounds }) {
  const [responses, setResponses] = useState({});
  const focusTrapRef = useFocusTrap(true);

  const handleSelect = (promptIndex, value) => {
    setResponses(prev => ({ ...prev, [promptIndex]: value }));
  };

  const allAnswered = Object.keys(responses).length === CHECKPOINT_PROMPTS.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-title"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: 'rgba(0, 0, 0, 0.85)',
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
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--accent-violet)',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '500px',
          width: '100%'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧠</div>
          <h2
            id="checkpoint-title"
            className="mono"
            style={{
              fontSize: '1.125rem',
              color: 'var(--accent-violet)',
              marginBottom: '0.25rem'
            }}
          >
            HALFTIME CHECK-IN
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Let's pause and reflect on how your team is doing!
          </p>
        </div>

        {/* Current Progress */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1.25rem',
            padding: '0.75rem',
            background: 'var(--bg-deep)',
            borderRadius: '8px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {correctCount}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>correct</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentScore}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>points</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
              {totalRounds - 3}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>rounds left</div>
          </div>
        </div>

        {/* Reflection Questions */}
        {CHECKPOINT_PROMPTS.map((prompt, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              {prompt.question}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {prompt.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(i, option.value)}
                  aria-pressed={responses[i] === option.value}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: responses[i] === option.value ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                    color: responses[i] === option.value ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${responses[i] === option.value ? 'var(--accent-violet)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Encouragement based on performance */}
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(167, 139, 250, 0.1)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)'
          }}
        >
          💡 <strong style={{ color: 'var(--accent-violet)' }}>Pro tip:</strong>{' '}
          {correctCount >= 2
            ? "Great start! Keep questioning everything and trusting your team's instincts."
            : "Remember: mistakes are learning opportunities! Discuss what patterns you're noticing."}
        </div>

        <Button onClick={() => onContinue(responses)} fullWidth disabled={!allAnswered}>
          {allAnswered ? 'Continue Game →' : 'Answer both questions to continue'}
        </Button>
      </div>
    </div>
  );
}
