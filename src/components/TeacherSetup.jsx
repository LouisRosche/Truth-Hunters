/**
 * TEACHER SETUP
 * Firebase configuration and class code management for cloud leaderboards
 */

import { useState } from 'react';
import { Button } from './Button';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

export function TeacherSetup({ onBack }) {
  const [classCode, setClassCode] = useState(FirebaseBackend.getClassCode() || '');
  const [firebaseConfigText, setFirebaseConfigText] = useState('');
  const [firebaseStatus, setFirebaseStatus] = useState(
    FirebaseBackend.initialized ? 'connected' : 'disconnected'
  );

  const handleConnectFirebase = () => {
    try {
      const config = JSON.parse(firebaseConfigText);
      if (FirebaseBackend.init(config)) {
        setFirebaseStatus('connected');
        if (classCode) {
          FirebaseBackend.setClassCode(classCode);
        }
      } else {
        setFirebaseStatus('error');
      }
    } catch (e) {
      logger.error('Invalid Firebase config:', e);
      setFirebaseStatus('error');
    }
  };

  const handleDisconnectFirebase = () => {
    FirebaseBackend.disconnect();
    setFirebaseStatus('disconnected');
    setFirebaseConfigText('');
  };

  const handleClassCodeChange = (e) => {
    const code = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setClassCode(code);
    FirebaseBackend.setClassCode(code);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
      <div className="animate-in" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          className="mono"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          ← Back to Setup
        </button>
      </div>

      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
        <h2
          className="mono"
          style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}
        >
          TEACHER SETUP
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Enable class-wide leaderboards with Firebase (free)
        </p>
      </div>

      {/* Status */}
      <div
        style={{
          background: firebaseStatus === 'connected' ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-card)',
          border: `1px solid ${firebaseStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}
      >
        <span
          className="mono"
          style={{
            color:
              firebaseStatus === 'connected'
                ? 'var(--accent-emerald)'
                : firebaseStatus === 'error'
                ? 'var(--accent-rose)'
                : 'var(--text-muted)'
          }}
        >
          {firebaseStatus === 'connected'
            ? '✓ Connected to Firebase'
            : firebaseStatus === 'error'
            ? '✗ Connection Error'
            : '○ Not Connected'}
        </span>
      </div>

      {/* Class Code */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}
      >
        <label
          className="mono"
          style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}
        >
          CLASS CODE (optional)
        </label>
        <input
          type="text"
          value={classCode}
          onChange={handleClassCodeChange}
          placeholder="e.g., PERIOD3, SMITH5A"
          maxLength={10}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            textTransform: 'uppercase'
          }}
        />
      </div>

      {/* Firebase Config */}
      {firebaseStatus !== 'connected' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
            FIREBASE CONFIG JSON
          </label>
          <textarea
            value={firebaseConfigText}
            onChange={(e) => setFirebaseConfigText(e.target.value)}
            placeholder='{"apiKey": "...", "projectId": "...", ...}'
            rows={5}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleConnectFirebase}
            disabled={!firebaseConfigText.trim()}
            className="mono"
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: firebaseConfigText.trim() ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color: firebaseConfigText.trim() ? 'var(--bg-deep)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: firebaseConfigText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Connect Firebase
          </button>
        </div>
      )}

      {firebaseStatus === 'connected' && (
        <button
          onClick={handleDisconnectFirebase}
          className="mono"
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-rose)',
            border: '1px solid var(--accent-rose)',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          Disconnect Firebase
        </button>
      )}

      <Button onClick={onBack} fullWidth>
        Done
      </Button>
    </div>
  );
}
