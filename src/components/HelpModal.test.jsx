/**
 * HelpModal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpModal } from './HelpModal';

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

describe('HelpModal', () => {
  it('renders dialog with accessible role', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays "How to Play" title', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByText('How to Play')).toBeInTheDocument();
  });

  it('shows scoring information', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByText(/High confidence correct: \+5 points/)).toBeInTheDocument();
    expect(screen.getByText(/High confidence wrong: -6 points/)).toBeInTheDocument();
  });

  it('shows keyboard shortcuts', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByText('T/F/M')).toBeInTheDocument();
    expect(screen.getByText('1/2/3')).toBeInTheDocument();
  });

  it('shows tips section', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByText(/Use hints if stuck/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /close help/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when "Got it!" button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    // Click the backdrop (dialog element itself, not the inner content)
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('has all four content sections', () => {
    render(<HelpModal onClose={vi.fn()} />);
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Scoring')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Tips')).toBeInTheDocument();
  });
});
