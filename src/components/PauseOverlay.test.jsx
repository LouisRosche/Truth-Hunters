/**
 * PauseOverlay Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PauseOverlay } from './PauseOverlay';

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

describe('PauseOverlay', () => {
  const defaultProps = {
    currentRound: 3,
    totalRounds: 10,
    score: 12,
    onResume: vi.fn()
  };

  it('renders dialog with accessible role', () => {
    render(<PauseOverlay {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays "GAME PAUSED" title', () => {
    render(<PauseOverlay {...defaultProps} />);
    expect(screen.getByText('GAME PAUSED')).toBeInTheDocument();
  });

  it('shows current round progress', () => {
    render(<PauseOverlay {...defaultProps} />);
    expect(screen.getByText(/Round 3 of 10/)).toBeInTheDocument();
  });

  it('shows current score', () => {
    render(<PauseOverlay {...defaultProps} />);
    expect(screen.getByText(/12 points/)).toBeInTheDocument();
  });

  it('calls onResume when resume button is clicked', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    render(<PauseOverlay {...defaultProps} onResume={onResume} />);
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('calls onResume when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    render(<PauseOverlay {...defaultProps} onResume={onResume} />);
    await user.keyboard('{Escape}');
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('displays negative score correctly', () => {
    render(<PauseOverlay {...defaultProps} score={-5} />);
    expect(screen.getByText(/-5 points/)).toBeInTheDocument();
  });
});
