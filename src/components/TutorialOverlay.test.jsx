/**
 * TutorialOverlay Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TutorialOverlay } from './TutorialOverlay';

// Mock dependencies
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

vi.mock('../utils/safeStorage', () => ({
  safeSetItem: vi.fn()
}));

describe('TutorialOverlay', () => {
  it('renders dialog with accessible role', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays welcome title', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByText(/Welcome to Truth Detector/)).toBeInTheDocument();
  });

  it('shows speed bonus instruction', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByText(/Gold timer = speed bonus zone/)).toBeInTheDocument();
  });

  it('warns about tab switching', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByText(/Do not switch tabs/)).toBeInTheDocument();
  });

  it('explains confidence scoring', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByText(/Higher confidence = higher stakes/)).toBeInTheDocument();
  });

  it('shows keyboard shortcuts', () => {
    render(<TutorialOverlay onClose={vi.fn()} />);
    expect(screen.getByText(/T\/F\/M for verdict/)).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TutorialOverlay onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('saves tutorial seen state to storage on close', async () => {
    const { safeSetItem } = await import('../utils/safeStorage');
    const user = userEvent.setup();
    render(<TutorialOverlay onClose={vi.fn()} sessionId="test-session" />);
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(safeSetItem).toHaveBeenCalledWith('truthDetector_tutorialSeen', {
      sessionId: 'test-session',
      seen: true
    });
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TutorialOverlay onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
