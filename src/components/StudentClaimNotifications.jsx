/**
 * STUDENT CLAIM NOTIFICATIONS
 * Shows students the status of their submitted claims
 */

import { useState, useEffect, useRef } from 'react';
import { FirebaseBackend } from '../services/firebase';
import { PlayerProfile } from '../services/playerProfile';
import { logger } from '../utils/logger';

export function StudentClaimNotifications({ onClose }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState(null);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const profile = PlayerProfile.get();
    if (profile?.playerName) {
      setPlayerName(profile.playerName);
      loadClaims(profile.playerName);
    } else {
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadClaims = async (name) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const results = await FirebaseBackend.getStudentClaims(name);
      if (isMountedRef.current) {
        setClaims(results);
      }
    } catch (e) {
      logger.warn('Failed to load claims:', e);
      if (isMountedRef.current) {
        setError('Could not load your submissions. Please try again.');
        setClaims([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { icon: '⏳', text: 'Pending Review', className: 'pending' };
      case 'approved':
        return { icon: '✅', text: 'Approved!', className: 'approved' };
      case 'rejected':
        return { icon: '📝', text: 'Needs Revision', className: 'rejected' };
      default:
        return { icon: '❓', text: 'Unknown', className: '' };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!playerName) {
    return (
      <div className="claim-notifications">
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p>Create a player profile to track your submitted claims.</p>
        </div>
        <button className="close-button" onClick={onClose}>Close</button>

        <style>{notificationStyles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="claim-notifications">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your claims...</p>
        </div>

        <style>{notificationStyles}</style>
      </div>
    );
  }

  return (
    <div className="claim-notifications">
      <div className="notifications-header">
        <h3>Your Submitted Claims</h3>
        <p className="subtitle">Track the status of claims you&apos;ve submitted for review</p>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => loadClaims(playerName)} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!error && claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>You haven&apos;t submitted any claims yet.</p>
          <p className="hint">Submit a claim to challenge your classmates!</p>
        </div>
      ) : !error && (
        <div className="claims-list">
          {claims.map((claim) => {
            const status = getStatusBadge(claim.status);
            return (
              <div key={claim.id} className={`claim-item ${claim.status}`}>
                <div className="claim-header">
                  <span className={`status-badge ${status.className}`}>
                    {status.icon} {status.text}
                  </span>
                  <span className="claim-date">
                    {formatDate(claim.timestamp)}
                  </span>
                </div>

                <p className="claim-text">{claim.claimText}</p>

                <div className="claim-meta">
                  <span className="answer-badge" data-answer={claim.answer}>
                    {claim.answer}
                  </span>
                  <span className="subject">{claim.subject}</span>
                </div>

                {claim.status === 'approved' && (
                  <div className="approval-message">
                    🎉 Your claim is now in the game! Others might see it soon.
                  </div>
                )}

                {claim.status === 'rejected' && claim.reviewerNote && (
                  <div className="feedback-message">
                    <strong>Teacher feedback:</strong> {claim.reviewerNote}
                  </div>
                )}

                {claim.reviewedTimestamp && (
                  <div className="reviewed-date">
                    Reviewed: {formatDate(claim.reviewedTimestamp)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="notifications-footer">
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>

      <style>{notificationStyles}</style>
    </div>
  );
}

const notificationStyles = `
  .claim-notifications {
    max-width: 600px;
    margin: 0 auto;
  }

  .notifications-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .notifications-header h3 {
    color: var(--accent-violet);
    margin-bottom: 0.25rem;
  }

  .notifications-header .subtitle {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .loading-state {
    text-align: center;
    padding: 3rem;
  }

  .error-state {
    text-align: center;
    padding: 2rem;
    background: rgba(251, 113, 133, 0.1);
    border: 1px solid var(--accent-rose);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .error-state p {
    color: var(--accent-rose);
    margin-bottom: 1rem;
  }

  .retry-button {
    padding: 0.5rem 1rem;
    background: var(--accent-rose);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .retry-button:hover {
    filter: brightness(1.1);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--accent-violet);
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-state .hint {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .claims-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .claim-item {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 1rem;
    transition: border-color 0.2s;
  }

  .claim-item.approved {
    border-color: var(--accent-emerald);
  }

  .claim-item.rejected {
    border-color: var(--accent-amber);
  }

  .claim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-badge.pending {
    background: rgba(167, 139, 250, 0.2);
    color: var(--accent-violet);
  }

  .status-badge.approved {
    background: rgba(52, 211, 153, 0.2);
    color: var(--accent-emerald);
  }

  .status-badge.rejected {
    background: rgba(251, 191, 36, 0.2);
    color: var(--accent-amber);
  }

  .claim-date {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .claim-text {
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .claim-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
  }

  .answer-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }

  .answer-badge[data-answer="TRUE"] {
    background: rgba(52, 211, 153, 0.2);
    color: var(--accent-emerald);
  }

  .answer-badge[data-answer="FALSE"] {
    background: rgba(251, 113, 133, 0.2);
    color: var(--accent-rose);
  }

  .answer-badge[data-answer="MIXED"] {
    background: rgba(251, 191, 36, 0.2);
    color: var(--accent-amber);
  }

  .subject {
    color: var(--text-secondary);
  }

  .approval-message {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(52, 211, 153, 0.1);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--accent-emerald);
  }

  .feedback-message {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(251, 191, 36, 0.1);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .feedback-message strong {
    color: var(--accent-amber);
  }

  .reviewed-date {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .notifications-footer {
    margin-top: 1.5rem;
    text-align: center;
  }

  .close-button {
    padding: 0.75rem 2rem;
    border: 2px solid var(--border-subtle);
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-button:hover {
    border-color: var(--text-muted);
    color: var(--text-primary);
  }
`;
