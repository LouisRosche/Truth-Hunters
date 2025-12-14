/**
 * CLAIM SUBMISSION FORM
 * Allows students to submit new claims for teacher review
 */

import { useState, useEffect } from 'react';
import { FirebaseBackend } from '../services/firebase';
import { PlayerProfile } from '../services/playerProfile';
import { SUBJECT_HINTS } from '../data/constants';

const SUBJECTS = Object.keys(SUBJECT_HINTS);

const ERROR_PATTERNS = [
  'Inverted cause and effect',
  'Exaggerated numbers',
  'Wrong date or timeframe',
  'Misattributed discovery',
  'Confused similar concepts',
  'Outdated information',
  'Regional vs global claim',
  'Correlation vs causation',
  'Oversimplified process',
  'Fabricated statistic'
];

export function ClaimSubmissionForm({ onClose, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    claimText: '',
    answer: 'TRUE',
    explanation: '',
    subject: 'Biology',
    difficulty: 'medium',
    citation: '',
    errorPattern: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    const profile = PlayerProfile.get();
    if (profile?.playerName) {
      setPlayerInfo({
        name: profile.playerName,
        avatar: profile.avatar?.emoji || '🔍'
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validation
    if (!formData.claimText.trim()) {
      setError('Please enter your claim text.');
      setSubmitting(false);
      return;
    }

    if (formData.claimText.trim().length < 20) {
      setError('Your claim should be at least 20 characters long.');
      setSubmitting(false);
      return;
    }

    if (!formData.explanation.trim()) {
      setError('Please explain why this claim is true or false.');
      setSubmitting(false);
      return;
    }

    const claimData = {
      claimText: formData.claimText.trim(),
      answer: formData.answer,
      explanation: formData.explanation.trim(),
      subject: formData.subject,
      difficulty: formData.difficulty,
      citation: formData.citation.trim() || null,
      errorPattern: formData.answer === 'FALSE' ? formData.errorPattern : null,
      submitterName: playerInfo?.name || 'Anonymous',
      submitterAvatar: playerInfo?.avatar || '🔍'
    };

    const result = await FirebaseBackend.submitClaim(claimData);

    if (result.success) {
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(claimData);
      }
    } else {
      setError(result.error || 'Failed to submit claim. Please try again.');
    }

    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="claim-submission-success">
        <div className="success-icon">🎉</div>
        <h3>Claim Submitted!</h3>
        <p>Your claim has been sent to your teacher for review.</p>
        <p className="success-detail">
          You'll see a notification when it's been approved or if feedback is needed.
        </p>
        <button className="primary-button" onClick={onClose}>
          Done
        </button>

        <style>{`
          .claim-submission-success {
            text-align: center;
            padding: 2rem;
          }
          .success-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .claim-submission-success h3 {
            color: var(--accent-emerald);
            margin-bottom: 0.5rem;
          }
          .success-detail {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="claim-submission-form">
      <div className="form-header">
        <h3>Submit a Claim</h3>
        <p>Create a fact-check challenge for your classmates!</p>
        {playerInfo && (
          <div className="submitter-info">
            <span className="avatar">{playerInfo.avatar}</span>
            <span className="name">{playerInfo.name}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="claimText">Your Claim Statement *</label>
          <textarea
            id="claimText"
            value={formData.claimText}
            onChange={(e) => setFormData(prev => ({ ...prev, claimText: e.target.value }))}
            placeholder="Write a statement that could be true or false. Make it interesting and challenging!"
            rows={3}
            maxLength={500}
          />
          <span className="char-count">{formData.claimText.length}/500</span>
        </div>

        <div className="form-group">
          <label>Is this claim TRUE or FALSE? *</label>
          <div className="answer-buttons">
            {['TRUE', 'FALSE', 'MIXED'].map(answer => (
              <button
                key={answer}
                type="button"
                className={`answer-btn ${formData.answer === answer ? 'selected' : ''} ${answer.toLowerCase()}`}
                onClick={() => setFormData(prev => ({ ...prev, answer }))}
              >
                {answer === 'TRUE' && '✓ TRUE'}
                {answer === 'FALSE' && '✗ FALSE'}
                {answer === 'MIXED' && '⚡ MIXED'}
              </button>
            ))}
          </div>
          {formData.answer === 'MIXED' && (
            <p className="hint-text">Mixed claims contain both true and false elements.</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="explanation">Explanation *</label>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder={formData.answer === 'TRUE'
              ? "Explain why this is true. What facts support it?"
              : "Explain what's wrong with this claim. What's the real truth?"}
            rows={3}
            maxLength={1000}
          />
          <span className="char-count">{formData.explanation.length}/1000</span>
        </div>

        {formData.answer === 'FALSE' && (
          <div className="form-group">
            <label htmlFor="errorPattern">Error Type (optional)</label>
            <select
              id="errorPattern"
              value={formData.errorPattern}
              onChange={(e) => setFormData(prev => ({ ...prev, errorPattern: e.target.value }))}
            >
              <option value="">Choose an error pattern...</option>
              {ERROR_PATTERNS.map(pattern => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            >
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group half">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
            >
              <option value="easy">Easy - Obvious answer</option>
              <option value="medium">Medium - Requires thought</option>
              <option value="hard">Hard - Very tricky</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="citation">Source/Citation (optional)</label>
          <input
            type="text"
            id="citation"
            value={formData.citation}
            onChange={(e) => setFormData(prev => ({ ...prev, citation: e.target.value }))}
            placeholder="Where did you learn this? (e.g., Wikipedia, textbook, etc.)"
            maxLength={200}
          />
        </div>

        {error && (
          <div className="form-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>

      <style>{`
        .claim-submission-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .form-header h3 {
          color: var(--accent-violet);
          margin-bottom: 0.25rem;
        }

        .form-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .submitter-info {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-tertiary);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          margin-top: 0.75rem;
        }

        .submitter-info .avatar {
          font-size: 1.25rem;
        }

        .submitter-info .name {
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .form-group textarea,
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group textarea:focus,
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent-violet);
        }

        .char-count {
          display: block;
          text-align: right;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .answer-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .answer-btn {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .answer-btn:hover {
          border-color: var(--text-muted);
        }

        .answer-btn.selected.true {
          background: rgba(52, 211, 153, 0.2);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
        }

        .answer-btn.selected.false {
          background: rgba(251, 113, 133, 0.2);
          border-color: var(--accent-rose);
          color: var(--accent-rose);
        }

        .answer-btn.selected.mixed {
          background: rgba(251, 191, 36, 0.2);
          border-color: var(--accent-amber);
          color: var(--accent-amber);
        }

        .hint-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-group.half {
          flex: 1;
        }

        .form-error {
          background: rgba(251, 113, 133, 0.15);
          border: 1px solid var(--accent-rose);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--accent-rose);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .secondary-button {
          padding: 0.75rem 1.5rem;
          border: 2px solid var(--border-subtle);
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }

        .primary-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          background: var(--accent-violet);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }

          .answer-buttons {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
