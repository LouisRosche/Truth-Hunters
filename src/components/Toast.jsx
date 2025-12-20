/**
 * TOAST NOTIFICATION SYSTEM
 * Simple toast notifications for user feedback
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    if (!isMountedRef.current) return;

    const id = ++toastId;
    const newToast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        if (isMountedRef.current) {
          setToasts(prev => prev.filter(t => t.id !== id));
        }
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    if (!isMountedRef.current) return;
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful degradation for tests - return no-op functions
    if (process.env.NODE_ENV === 'test') {
      return {
        showToast: () => {},
        dismissToast: () => {}
      };
    }
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        pointerEvents: 'none'
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
    error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✗' },
    warning: { bg: 'rgba(251, 191, 36, 0.95)', border: '#fbbf24', icon: '⚠' },
    info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' }
  };

  const color = colors[toast.type] || colors.info;

  return (
    <div
      className="animate-in"
      role="alert"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        color: 'white',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        minWidth: '250px',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>
        {color.icon}
      </span>
      <div style={{ flex: 1 }}>
        {toast.message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          opacity: 0.7,
          cursor: 'pointer',
          padding: '0.25rem',
          fontSize: '1.125rem',
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        ×
      </button>
    </div>
  );
}
