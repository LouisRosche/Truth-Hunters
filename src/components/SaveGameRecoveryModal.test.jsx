/**
 * SaveGameRecoveryModal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveGameRecoveryModal } from './SaveGameRecoveryModal';

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

describe('SaveGameRecoveryModal', () => {
  const defaultProps = {
    summary: {
      timeAgoText: '5 minutes ago',
      teamName: 'Test Hawks',
      currentRound: 4,
      totalRounds: 10,
      score: 15
    },
    onResume: vi.fn(),
    onDiscard: vi.fn()
  };

  it('renders dialog with accessible role', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays recovery title', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByText('Game in Progress Found')).toBeInTheDocument();
  });

  it('shows time ago text', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
  });

  it('shows team name', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByText('Test Hawks')).toBeInTheDocument();
  });

  it('shows round progress', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByText(/Round 4 of 10/)).toBeInTheDocument();
  });

  it('shows score', () => {
    render(<SaveGameRecoveryModal {...defaultProps} />);
    expect(screen.getByText('15 pts')).toBeInTheDocument();
  });

  it('calls onResume when Resume button is clicked', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    render(<SaveGameRecoveryModal {...defaultProps} onResume={onResume} />);
    await user.click(screen.getByRole('button', { name: /resume game/i }));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('calls onDiscard when Start Fresh button is clicked', async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(<SaveGameRecoveryModal {...defaultProps} onDiscard={onDiscard} />);
    await user.click(screen.getByRole('button', { name: /start fresh/i }));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it('calls onDiscard when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(<SaveGameRecoveryModal {...defaultProps} onDiscard={onDiscard} />);
    await user.keyboard('{Escape}');
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
