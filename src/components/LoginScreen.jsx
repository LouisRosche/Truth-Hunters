/**
 * LOGIN SCREEN
 * Beautiful dark-themed login screen for Truth Hunters
 * Supports Google OAuth and Guest (anonymous) authentication
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginScreen() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInAsGuest();
    } catch (err) {
      setError('Could not sign in as guest. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      className="animate-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'var(--bg-deep)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow effect */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* App icon */}
      <div
        className="animate-bounce-in"
        style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 0 20px rgba(0, 245, 255, 0.3))'
        }}
      >
        🔍
      </div>

      {/* Title */}
      <h1
        className="mono"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 800,
          letterSpacing: '0.15em',
          color: 'var(--accent-cyan)',
          textShadow: '0 0 40px rgba(0, 245, 255, 0.3), 0 0 80px rgba(0, 245, 255, 0.1)',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}
      >
        TRUTH HUNTERS
      </h1>

      {/* Subtitle */}
      <p
        className="serif"
        style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          textAlign: 'center'
        }}
      >
        Research-based epistemic training
      </p>

      {/* Login card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Google Sign-In button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 500,
            fontFamily: 'inherit',
            color: '#3c4043',
            background: '#ffffff',
            border: '1px solid #dadce0',
            borderRadius: '0.5rem',
            cursor: isSigningIn ? 'wait' : 'pointer',
            opacity: isSigningIn ? 0.7 : 1,
            transition: 'box-shadow 0.2s ease, opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSigningIn) e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = 'none';
          }}
        >
          {/* Google "G" logo SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span className="mono">or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Guest button */}
        <button
          onClick={handleGuestSignIn}
          disabled={isSigningIn}
          className="mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            cursor: isSigningIn ? 'wait' : 'pointer',
            opacity: isSigningIn ? 0.7 : 1,
            transition: 'border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSigningIn) {
              e.target.style.borderColor = 'var(--accent-cyan)';
              e.target.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.color = 'var(--text-secondary)';
          }}
        >
          Continue as Guest
        </button>

        {/* Error message */}
        {error && (
          <p
            style={{
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: 0
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Footer text */}
      <p
        className="mono"
        style={{
          marginTop: '2rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}
      >
        Your school Google account works here
      </p>
    </div>
  );
}
