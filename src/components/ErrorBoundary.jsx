/**
 * ERROR BOUNDARY
 * Catches and displays React errors gracefully
 */

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Truth Hunters Error:', error);
    console.error('Component stack:', errorInfo?.componentStack);

    this.setState({ errorInfo });

    // Attempt to save error to localStorage for debugging (if available)
    try {
      const errorLog = {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      const existingLogs = JSON.parse(localStorage.getItem('truthHunters_errorLog') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 5 errors
      localStorage.setItem('truthHunters_errorLog', JSON.stringify(existingLogs.slice(-5)));
    } catch (e) {
      // localStorage not available, ignore
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-primary)',
            maxWidth: '600px',
            margin: '2rem auto'
          }}
        >
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
            An unexpected error occurred. Please refresh the page to restart the game.
          </p>

          {/* Show error details in development */}
          {isDev && this.state.error && (
            <details
              style={{
                textAlign: 'left',
                background: 'var(--bg-elevated)',
                padding: '1rem',
                borderRadius: '8px',
                margin: '1rem 0',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details
              </summary>
              <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString() + '\n\n' + (this.state.error.stack || '')}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-cyan)',
              color: 'var(--bg-deep)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              marginTop: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
