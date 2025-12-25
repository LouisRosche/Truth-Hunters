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
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleConnectFirebase = () => {
    setErrorMessage('');
    try {
      const config = JSON.parse(firebaseConfigText);

      // SECURITY: Validate required fields
      const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        setErrorMessage(`Missing required fields: ${missingFields.join(', ')}`);
        setFirebaseStatus('error');
        return;
      }

      // SECURITY: Validate field formats to prevent injection attacks
      if (typeof config.apiKey !== 'string' || config.apiKey.length < 20 || config.apiKey.length > 200) {
        setErrorMessage('Invalid Firebase API key format');
        setFirebaseStatus('error');
        return;
      }

      // Validate auth domain is from Firebase
      if (!config.authDomain.includes('firebaseapp.com') && !config.authDomain.includes('web.app')) {
        setErrorMessage('Invalid Firebase auth domain. Must end with firebaseapp.com or web.app');
        setFirebaseStatus('error');
        return;
      }

      // Validate project ID format (alphanumeric and dashes only)
      if (!/^[a-z0-9-]+$/.test(config.projectId)) {
        setErrorMessage('Invalid Firebase project ID format');
        setFirebaseStatus('error');
        return;
      }

      if (FirebaseBackend.init(config)) {
        setFirebaseStatus('connected');
        if (classCode) {
          FirebaseBackend.setClassCode(classCode);
        }
        setErrorMessage('');
      } else {
        setFirebaseStatus('error');
        setErrorMessage('Failed to connect. Check your Firebase project settings and ensure Firestore is enabled.');
      }
    } catch (e) {
      logger.error('Invalid Firebase config:', e);
      setFirebaseStatus('error');
      if (e instanceof SyntaxError) {
        setErrorMessage('Invalid JSON format. Please check for missing commas or quotes.');
      } else {
        setErrorMessage('Connection failed: ' + e.message);
      }
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
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>
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
          5-minute setup for class-wide leaderboards
        </p>
      </div>

      {/* Quick Start Guide Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
          border: '1px solid var(--accent-violet)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              Quick Start: Two Ways to Use Truth Hunters
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Option 1: Local Mode (No Setup)</strong> - Students play offline on their devices. No leaderboard sharing between teams.
              <br />
              <strong>Option 2: Cloud Mode (5 min)</strong> - Set up free Firebase to enable class-wide leaderboards, student claim submissions, and data export.
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map(step => (
          <div
            key={step}
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: firebaseStatus === 'connected' || currentStep >= step ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              border: `2px solid ${firebaseStatus === 'connected' || currentStep >= step ? 'var(--accent-cyan)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: firebaseStatus === 'connected' || currentStep >= step ? 'var(--bg-deep)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.875rem',
              transition: 'all 0.3s ease'
            }}
          >
            {firebaseStatus === 'connected' && step === 3 ? '✓' : step}
          </div>
        ))}
      </div>

      {/* Connection Status */}
      {firebaseStatus === 'connected' && (
        <div
          style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid var(--accent-emerald)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
            Connected to Firebase
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Your class can now use cloud leaderboards, submit claims, and you can export data!
          </div>
        </div>
      )}

      {/* Step 1: Setup Instructions */}
      {!firebaseStatus === 'connected' && currentStep === 1 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}
        >
          <h3 className="mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
            Step 1: Create Free Firebase Account
          </h3>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Firebase Console</a> and sign in with Google
              </li>
              <li style={{ marginBottom: '0.75rem' }}>Click "Add project" or "Create a project"</li>
              <li style={{ marginBottom: '0.75rem' }}>Name it (e.g., "truth-hunters-2025")</li>
              <li style={{ marginBottom: '0.75rem' }}>Disable Google Analytics (optional, not needed)</li>
              <li>Click "Create project" and wait ~30 seconds</li>
            </ol>
          </div>
          <button
            onClick={() => setCurrentStep(2)}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--accent-cyan)',
              color: 'var(--bg-deep)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Next: Enable Firestore →
          </button>
        </div>
      )}

      {/* Step 2: Enable Firestore */}
      {!firebaseStatus === 'connected' && currentStep === 2 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}
        >
          <h3 className="mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
            Step 2: Enable Firestore Database
          </h3>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>In your Firebase project, click "Firestore Database" in left sidebar</li>
              <li style={{ marginBottom: '0.75rem' }}>Click "Create database"</li>
              <li style={{ marginBottom: '0.75rem' }}>Choose "Start in test mode" (we'll secure it later)</li>
              <li style={{ marginBottom: '0.75rem' }}>Select any region (closest to you is best)</li>
              <li>Click "Enable"</li>
            </ol>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              style={{
                flex: 2,
                padding: '0.75rem',
                background: 'var(--accent-cyan)',
                color: 'var(--bg-deep)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Next: Get Config →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Get Config & Connect */}
      {firebaseStatus !== 'connected' && currentStep === 3 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', margin: 0 }}>
              Step 3: Connect to Firebase
            </h3>
            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: 'var(--accent-violet)'
              }}
            >
              {showHelp ? 'Hide' : 'Show'} Instructions
            </button>
          </div>

          {showHelp && (
            <div
              style={{
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid var(--accent-violet)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: 'var(--text-secondary)'
              }}
            >
              <strong style={{ color: 'var(--accent-violet)' }}>How to get your config:</strong>
              <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0 0 0' }}>
                <li>In Firebase Console, click the gear icon (⚙️) next to "Project Overview"</li>
                <li>Click "Project settings"</li>
                <li>Scroll down to "Your apps" section</li>
                <li>Click the web icon (&lt;/&gt;) to add a web app</li>
                <li>Give it a name (e.g., "Truth Hunters Web")</li>
                <li>Copy the <code>firebaseConfig</code> object (looks like JSON with apiKey, authDomain, etc.)</li>
                <li>Paste it below</li>
              </ol>
            </div>
          )}

          <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
            PASTE FIREBASE CONFIG JSON
          </label>
          <textarea
            value={firebaseConfigText}
            onChange={(e) => setFirebaseConfigText(e.target.value)}
            placeholder={`{\n  "apiKey": "AIza...",\n  "authDomain": "yourproject.firebaseapp.com",\n  "projectId": "yourproject",\n  "storageBucket": "yourproject.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123:web:abc"\n}`}
            rows={8}
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

          {errorMessage && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose)',
                borderRadius: '6px',
                color: 'var(--accent-rose)',
                fontSize: '0.8125rem'
              }}
            >
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => setCurrentStep(2)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleConnectFirebase}
              disabled={!firebaseConfigText.trim()}
              className="mono"
              style={{
                flex: 2,
                padding: '0.75rem',
                background: firebaseConfigText.trim() ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
                color: firebaseConfigText.trim() ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: firebaseConfigText.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Class Code (always visible) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <label
            className="mono"
            style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}
          >
            CLASS CODE (Recommended)
          </label>
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              maxWidth: '60%',
              textAlign: 'right'
            }}
          >
            Separates your class data from others
          </div>
        </div>
        <input
          type="text"
          value={classCode}
          onChange={handleClassCodeChange}
          placeholder="e.g., SMITH3RD, PERIOD5, ROOM201"
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
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
          Students will enter this code to join your class leaderboard. Make it memorable!
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {firebaseStatus === 'connected' && (
          <button
            onClick={handleDisconnectFirebase}
            className="mono"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid var(--accent-rose)',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Disconnect
          </button>
        )}
        <Button onClick={onBack} fullWidth={firebaseStatus !== 'connected'}>
          {firebaseStatus === 'connected' ? 'Done - Go to Dashboard →' : 'Skip & Use Local Mode'}
        </Button>
      </div>

      {/* Local Mode Note */}
      {firebaseStatus !== 'connected' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--bg-elevated)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontStyle: 'italic'
          }}
        >
          Don't have time now? Students can play in Local Mode without Firebase.
          <br />
          You can set this up later to enable cloud features.
        </div>
      )}
    </div>
  );
}
