/**
 * LoginScreen Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';

// Mock AuthContext
const mockSignInWithGoogle = vi.fn();
const mockSignInAsGuest = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInAsGuest: mockSignInAsGuest
  })
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithGoogle.mockResolvedValue(undefined);
    mockSignInAsGuest.mockResolvedValue(undefined);
  });

  it('renders title', () => {
    render(<LoginScreen />);
    expect(screen.getByText('TRUTH HUNTERS')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Research-based epistemic training')).toBeInTheDocument();
  });

  it('renders Google sign-in button', () => {
    render(<LoginScreen />);
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('renders Guest sign-in button', () => {
    render(<LoginScreen />);
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('calls signInAsGuest when Guest button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole('button', { name: /continue as guest/i }));
    expect(mockSignInAsGuest).toHaveBeenCalledOnce();
  });

  it('shows error when Google sign-in fails', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));
    await waitFor(() => {
      expect(screen.getByText(/Google sign-in failed/i)).toBeInTheDocument();
    });
  });

  it('shows error when Guest sign-in fails', async () => {
    mockSignInAsGuest.mockRejectedValue(new Error('Auth error'));
    const user = userEvent.setup();
    render(<LoginScreen />);
    await user.click(screen.getByRole('button', { name: /continue as guest/i }));
    await waitFor(() => {
      expect(screen.getByText(/Could not sign in as guest/i)).toBeInTheDocument();
    });
  });
});
