/**
 * Header Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock useOnlineStatus
vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true
}));

describe('Header', () => {
  const defaultProps = {
    phase: 'setup',
    presentationMode: false,
    onTogglePresentationMode: vi.fn()
  };

  it('renders banner with title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('TRUTH HUNTERS')).toBeInTheDocument();
  });

  it('shows presentation mode toggle', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole('button', { name: /presentation mode/i })).toBeInTheDocument();
  });

  it('toggles presentation mode on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Header {...defaultProps} onTogglePresentationMode={onToggle} />);
    await user.click(screen.getByRole('button', { name: /presentation mode/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  describe('During gameplay', () => {
    const playingProps = {
      ...defaultProps,
      phase: 'playing',
      score: 12,
      round: 3,
      totalRounds: 10,
      onExitGame: vi.fn(),
      onTogglePause: vi.fn(),
      isPaused: false,
      onShowHelp: vi.fn(),
      soundEnabled: true,
      onToggleSound: vi.fn()
    };

    it('shows round counter', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByText(/ROUND/)).toHaveTextContent('ROUND 3/10');
    });

    it('shows score', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByText('+12 PTS')).toBeInTheDocument();
    });

    it('shows negative score without extra +', () => {
      render(<Header {...playingProps} score={-5} />);
      expect(screen.getByText('-5 PTS')).toBeInTheDocument();
    });

    it('shows exit button during gameplay', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByRole('button', { name: /exit game/i })).toBeInTheDocument();
    });

    it('shows pause button during gameplay', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    });

    it('shows help button when onShowHelp provided', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByRole('button', { name: /game rules/i })).toBeInTheDocument();
    });

    it('shows sound toggle when onToggleSound provided', () => {
      render(<Header {...playingProps} />);
      expect(screen.getByRole('button', { name: /mute sounds/i })).toBeInTheDocument();
    });
  });

  describe('Exit confirmation modal', () => {
    const playingProps = {
      ...defaultProps,
      phase: 'playing',
      score: 12,
      round: 3,
      totalRounds: 10,
      onExitGame: vi.fn()
    };

    it('shows exit confirmation when exit button clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...playingProps} />);
      await user.click(screen.getByRole('button', { name: /exit game/i }));
      expect(screen.getByText('Exit Game?')).toBeInTheDocument();
    });

    it('warns about permanent data loss', async () => {
      const user = userEvent.setup();
      render(<Header {...playingProps} />);
      await user.click(screen.getByRole('button', { name: /exit game/i }));
      expect(screen.getByText(/permanently lost/i)).toBeInTheDocument();
    });

    it('calls onExitGame when confirmed', async () => {
      const user = userEvent.setup();
      const onExitGame = vi.fn();
      render(<Header {...playingProps} onExitGame={onExitGame} />);
      await user.click(screen.getByRole('button', { name: /exit game/i }));
      await user.click(screen.getByRole('button', { name: /exit & discard/i }));
      expect(onExitGame).toHaveBeenCalledOnce();
    });

    it('closes modal when Continue Playing is clicked', async () => {
      const user = userEvent.setup();
      render(<Header {...playingProps} />);
      await user.click(screen.getByRole('button', { name: /exit game/i }));
      await user.click(screen.getByRole('button', { name: /continue playing/i }));
      expect(screen.queryByText('Exit Game?')).not.toBeInTheDocument();
    });
  });

  describe('Setup phase', () => {
    it('hides round counter during setup', () => {
      render(<Header {...defaultProps} />);
      expect(screen.queryByText('ROUND')).not.toBeInTheDocument();
    });

    it('hides exit button during setup', () => {
      render(<Header {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /exit game/i })).not.toBeInTheDocument();
    });
  });
});
