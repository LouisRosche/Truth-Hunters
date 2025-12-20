/**
 * CLAIM MODERATION COMPONENT
 * For teacher dashboard - approve/reject student-submitted claims
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './Button';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

export function ClaimModeration({ classCode }) {
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPendingClaims = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const claims = await FirebaseBackend.getPendingClaims(classCode);
      if (isMountedRef.current) {
        setPendingClaims(claims || []);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(`Failed to load pending claims: ${err.message}`);
        logger.error('Error loading claims:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [classCode]);

  // Fetch pending claims from Firebase
  useEffect(() => {
    if (!FirebaseBackend.initialized) {
      setLoading(false);
      return;
    }

    loadPendingClaims();
  }, [loadPendingClaims]);

  const handleApprove = async (claim) => {
    if (!isMountedRef.current) return;
    setProcessingId(claim.id);

    try {
      await FirebaseBackend.approveClaim(claim.id, claim);
      if (isMountedRef.current) {
        setPendingClaims(prev => prev.filter(c => c.id !== claim.id));
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(`Failed to approve claim: ${err.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (claimId, reason) => {
    if (!isMountedRef.current) return;
    setProcessingId(claimId);

    try {
      await FirebaseBackend.rejectClaim(claimId, reason);
      if (isMountedRef.current) {
        setPendingClaims(prev => prev.filter(c => c.id !== claimId));
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(`Failed to reject claim: ${err.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setProcessingId(null);
      }
    }
  };

  if (!FirebaseBackend.initialized) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          🔌 Firebase not configured. Student claim submissions require Firebase setup.
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          See <a href="/docs/FIREBASE_SETUP.md" style={{ color: 'var(--accent-cyan)' }}>Firebase Setup Guide</a>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading pending claims...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--incorrect)',
          borderRadius: '8px',
          padding: '1rem',
          color: 'var(--incorrect)'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <Button onClick={loadPendingClaims} style={{ marginTop: '1rem' }}>
          Retry
        </Button>
      </div>
    );
  }

  if (pendingClaims.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <h3 className="mono" style={{ color: 'var(--correct)', marginBottom: '0.5rem' }}>
          All Caught Up!
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          No pending claims to review.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
          📋 Pending Claims ({pendingClaims.length})
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Review student-submitted claims before they appear in games.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pendingClaims.map((claim) => (
          <ClaimReviewCard
            key={claim.id}
            claim={claim}
            onApprove={() => handleApprove(claim)}
            onReject={(reason) => handleReject(claim.id, reason)}
            isProcessing={processingId === claim.id}
          />
        ))}
      </div>
    </div>
  );
}

function ClaimReviewCard({ claim, onApprove, onReject, isProcessing }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRejectSubmit = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Claim Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <span className="mono" style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Submitted by: {claim.submittedBy || 'Anonymous'} • {new Date(claim.submittedAt).toLocaleDateString()}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid var(--accent-violet)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--accent-violet)'
              }}>
                {claim.subject}
              </span>
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(34, 211, 238, 0.2)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)'
              }}>
                {claim.difficulty}
              </span>
              <span style={{
                padding: '0.25rem 0.5rem',
                background: claim.answer === 'TRUE'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${claim.answer === 'TRUE' ? 'var(--correct)' : 'var(--incorrect)'}`,
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: claim.answer === 'TRUE' ? 'var(--correct)' : 'var(--incorrect)'
              }}>
                {claim.answer}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Text */}
      <div style={{
        background: 'var(--bg-elevated)',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          &ldquo;{claim.text}&rdquo;
        </p>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent-cyan)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        {isExpanded ? 'Hide Details' : 'Show Details'}
      </button>

      {isExpanded && (
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Explanation:</strong>
            <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
              {claim.explanation || '(No explanation provided)'}
            </p>
          </div>
          {claim.citation && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Citation:</strong>
              <p style={{ marginTop: '0.25rem' }}>
                <a
                  href={claim.citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}
                >
                  {claim.citation}
                </a>
              </p>
            </div>
          )}
          {claim.source === 'ai-generated' && claim.errorPattern && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>AI Error Pattern:</strong>
              <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                {claim.errorPattern}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Button
          onClick={() => setShowRejectModal(true)}
          disabled={isProcessing}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--incorrect)',
            color: 'var(--incorrect)',
            fontSize: '0.875rem'
          }}
        >
          ✕ Reject
        </Button>
        <Button
          onClick={onApprove}
          disabled={isProcessing}
          style={{
            padding: '0.625rem 1rem',
            background: 'var(--correct)',
            border: 'none',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          {isProcessing ? 'Approving...' : '✓ Approve'}
        </Button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRejectModal(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3 className="mono" style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--accent-amber)' }}>
              Reject Claim
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Provide feedback for the student on why this claim was rejected:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Claim is not age-appropriate, needs citation, factually incorrect..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'var(--incorrect)',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: rejectReason.trim() ? 1 : 0.5
                }}
              >
                Submit Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
