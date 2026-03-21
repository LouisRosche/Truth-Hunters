/**
 * EmptyState Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders with status role for accessibility', () => {
    render(<EmptyState type="noGames" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays correct content for noGames type', () => {
    render(<EmptyState type="noGames" />);
    expect(screen.getByText('No games played yet')).toBeInTheDocument();
    expect(screen.getByText(/Start your first game/)).toBeInTheDocument();
  });

  it('displays correct content for offline type', () => {
    render(<EmptyState type="offline" />);
    expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    expect(screen.getByText(/sync when you're back online/)).toBeInTheDocument();
  });

  it('displays correct content for error type', () => {
    render(<EmptyState type="error" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows action button when onAction is provided', () => {
    render(<EmptyState type="noGames" onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: /start new game/i })).toBeInTheDocument();
  });

  it('hides action button when no onAction callback', () => {
    render(<EmptyState type="noGames" />);
    expect(screen.queryByRole('button', { name: /start new game/i })).not.toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EmptyState type="noGames" onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: /start new game/i }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('falls back to error state for unknown type', () => {
    // PropTypes would warn, but the component handles it
    render(<EmptyState type="unknownType" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows help text with tip icon', () => {
    render(<EmptyState type="noClaims" />);
    expect(screen.getByText(/Try selecting a different subject/)).toBeInTheDocument();
  });
});
