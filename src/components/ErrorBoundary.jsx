/**
 * ERROR BOUNDARY
 * Catches and displays React errors gracefully with recovery mechanisms
 */

import React from 'react';
import PropTypes from 'prop-types';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging (development only)
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV === 'development') {
      console.error('Truth Hunters Error:', error);
      console.error('Component stack:', errorInfo?.componentStack);
    }

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Attempt to save error to localStorage for debugging (if available)
    const errorLog = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      fallbackUI: this.props.fallbackUI || 'default'
    };
    const existingLogs = safeGetItem('truthHunters_errorLog', []);
    existingLogs.push(errorLog);
    // Keep only last 10 errors
    safeSetItem('truthHunters_errorLog', existingLogs.slice(-10));

    // Call onError callback if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') {
          console.error('Error in onError callback:', callbackError);
        }
      }
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReset = () => {
    // Clear error and call onReset if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Use custom fallback UI if provided
      if (this.props.fallbackUI) {
        return this.props.fallbackUI(this.state.error, this.handleRetry, this.handleReset);
      }

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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: '1rem' }}>
            {this.state.errorCount > 2
              ? 'Persistent Error Detected'
              : 'Something went wrong'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
            {this.state.errorCount > 2
              ? 'This component keeps crashing. Please refresh the page or return to the main menu.'
              : 'An unexpected error occurred. You can try again or refresh the page.'}
          </p>

          {/* Show error message for users */}
          {this.state.error && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '0.75rem',
                borderRadius: '8px',
                margin: '1rem 0',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}
            >
              {this.state.error.message || 'Unknown error'}
            </div>
          )}

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
                Error Details (Dev Only)
              </summary>
              <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString() + '\n\n' + (this.state.error.stack || '')}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ overflow: 'auto', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {this.state.errorCount <= 2 && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--accent-cyan)',
                  color: 'var(--bg-deep)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Try Again
              </button>
            )}
            {this.props.onReset && (
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                {this.props.resetLabel || 'Reset to Setup'}
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackUI: PropTypes.func,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  resetLabel: PropTypes.string
};
