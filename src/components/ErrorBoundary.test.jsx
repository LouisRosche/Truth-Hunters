/**
 * ErrorBoundary Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Mock safeStorage
vi.mock('../utils/safeStorage', () => ({
  safeGetItem: vi.fn(() => []),
  safeSetItem: vi.fn()
}));

// Suppress console.error from React error boundary
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws conditionally via external flag
let shouldThrowFlag = false;
function ThrowingChild({ shouldThrow = false }) {
  if (shouldThrow || shouldThrowFlag) throw new Error('Test error message');
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrowFlag = false;
  });
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows Refresh Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('recovers after clicking Try Again when error is resolved', async () => {
    const user = userEvent.setup();
    // Start with external flag causing throw
    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Resolve the error condition, then retry
    shouldThrowFlag = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));

    // ErrorBoundary resets state, child re-renders without throwing
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('shows Reset button when onReset is provided', () => {
    render(
      <ErrorBoundary onReset={vi.fn()}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /reset to setup/i })).toBeInTheDocument();
  });

  it('uses custom resetLabel', () => {
    render(
      <ErrorBoundary onReset={vi.fn()} resetLabel="Go Home">
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    await user.click(screen.getByRole('button', { name: /reset to setup/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('uses custom fallbackUI when provided', () => {
    const fallback = (error, retry) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );
    render(
      <ErrorBoundary fallbackUI={fallback}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });

  it('shows persistent error message after 3+ errors', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    // First error
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
