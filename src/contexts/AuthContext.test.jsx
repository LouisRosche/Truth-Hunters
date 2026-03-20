/**
 * AuthContext Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockSignOut = vi.fn();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  signInAnonymously: (...args) => mockSignInAnonymously(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signOut: (...args) => mockSignOut(...args)
}));

// Mock Firebase service
vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    initialized: true,
    auth: { name: 'mock-auth' },
    initAsync: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Helper component that uses the auth context
function TestConsumer() {
  const { isLoading, isAuthenticated, userDisplayName, signInWithGoogle, signInAsGuest, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="display-name">{userDisplayName}</div>
      <button onClick={signInWithGoogle}>Sign In Google</button>
      <button onClick={signInAsGuest}>Sign In Guest</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // By default, onAuthStateChanged immediately fires with null user
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return vi.fn(); // unsubscribe
    });
  });

  it('provides auth context to children', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  it('shows loading state initially when auth is slow', async () => {
    // Don't immediately fire the callback
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    // Should show loading until auth state resolves
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('updates to authenticated when user signs in', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({ displayName: 'Test User', email: 'test@example.com' });
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('display-name')).toHaveTextContent('Test User');
    });
  });

  it('shows "Guest" for anonymous users', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({ isAnonymous: true, displayName: null });
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('display-name')).toHaveTextContent('Guest');
    });
  });

  it('calls signInWithPopup when signInWithGoogle is invoked', async () => {
    const user = userEvent.setup();
    mockSignInWithPopup.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Sign In Google'));
    await user.click(screen.getByText('Sign In Google'));
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });

  it('calls signInAnonymously when signInAsGuest is invoked', async () => {
    const user = userEvent.setup();
    mockSignInAnonymously.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('Sign In Guest'));
    await user.click(screen.getByText('Sign In Guest'));
    expect(mockSignInAnonymously).toHaveBeenCalled();
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error from React for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
