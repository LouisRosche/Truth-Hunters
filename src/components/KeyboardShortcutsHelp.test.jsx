/**
 * KeyboardShortcutsHelp Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

describe('KeyboardShortcutsHelp', () => {
  it('renders dialog with accessible role', () => {
    render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    expect(screen.getByText('KEYBOARD SHORTCUTS')).toBeInTheDocument();
  });

  it('shows gameplay shortcuts category', () => {
    render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    expect(screen.getByText('Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Select confidence level')).toBeInTheDocument();
  });

  it('shows navigation shortcuts category', () => {
    render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Close modals/dialogs')).toBeInTheDocument();
  });

  it('shows sound & display shortcuts category', () => {
    render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    expect(screen.getByText('Sound & Display')).toBeInTheDocument();
    expect(screen.getByText('Toggle sound effects')).toBeInTheDocument();
  });

  it('renders keyboard keys as kbd elements', () => {
    const { container } = render(<KeyboardShortcutsHelp onClose={vi.fn()} />);
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
    // Check specific keys exist
    const keyTexts = Array.from(kbdElements).map((el) => el.textContent);
    expect(keyTexts).toContain('T');
    expect(keyTexts).toContain('Esc');
    expect(keyTexts).toContain('Enter');
  });

  it('calls onClose when "Got it!" button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /got it/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp onClose={onClose} />);
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });
});
