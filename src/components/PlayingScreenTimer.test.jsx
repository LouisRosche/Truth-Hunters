/**
 * PlayingScreenTimer Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayingScreenTimer } from './PlayingScreenTimer';

describe('PlayingScreenTimer', () => {
  const defaultProps = {
    timeRemaining: 90,
    totalTimeAllowed: 120,
    showResult: false
  };

  it('renders nothing when showResult is true', () => {
    const { container } = render(
      <PlayingScreenTimer {...defaultProps} showResult={true} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when timeRemaining is null', () => {
    const { container } = render(
      <PlayingScreenTimer timeRemaining={null} totalTimeAllowed={120} showResult={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('displays time in minutes:seconds format', () => {
    render(<PlayingScreenTimer {...defaultProps} timeRemaining={90} />);
    expect(screen.getByRole('timer')).toHaveTextContent('1:30');
  });

  it('displays zero-padded seconds', () => {
    render(<PlayingScreenTimer {...defaultProps} timeRemaining={65} />);
    expect(screen.getByRole('timer')).toHaveTextContent('1:05');
  });

  it('displays seconds-only time correctly', () => {
    render(<PlayingScreenTimer {...defaultProps} timeRemaining={45} />);
    expect(screen.getByRole('timer')).toHaveTextContent('0:45');
  });

  it('has accessible timer role', () => {
    render(<PlayingScreenTimer {...defaultProps} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('has aria-label with time description', () => {
    render(<PlayingScreenTimer {...defaultProps} timeRemaining={90} />);
    expect(screen.getByRole('timer')).toHaveAttribute(
      'aria-label',
      'Time remaining: 1 minutes 30 seconds'
    );
  });

  describe('Speed bonus zone', () => {
    it('shows 2x bonus when within 10% of time', () => {
      // elapsed = 120 - 110 = 10, pct = 10/120 = 0.083
      render(<PlayingScreenTimer timeRemaining={110} totalTimeAllowed={120} showResult={false} />);
      expect(screen.getByRole('timer')).toHaveTextContent('2x');
    });

    it('shows 1.5x bonus when within 20% of time', () => {
      // elapsed = 120 - 100 = 20, pct = 20/120 = 0.167
      render(<PlayingScreenTimer timeRemaining={100} totalTimeAllowed={120} showResult={false} />);
      expect(screen.getByRole('timer')).toHaveTextContent('1.5x');
    });

    it('does not show bonus when past 50% of time', () => {
      // elapsed = 120 - 50 = 70, pct = 70/120 = 0.583
      render(<PlayingScreenTimer timeRemaining={50} totalTimeAllowed={120} showResult={false} />);
      expect(screen.getByRole('timer')).not.toHaveTextContent(/\dx/);
    });

    it('does not show bonus in last 10 seconds even if fast', () => {
      // timeRemaining <= 10 suppresses bonus zone
      render(<PlayingScreenTimer timeRemaining={5} totalTimeAllowed={120} showResult={false} />);
      expect(screen.getByRole('timer')).not.toHaveTextContent(/\dx/);
    });
  });

  describe('Low time alerts', () => {
    it('applies pulse animation when time is low (<=30s)', () => {
      const { container } = render(
        <PlayingScreenTimer timeRemaining={25} totalTimeAllowed={120} showResult={false} />
      );
      expect(container.firstChild.className).toContain('animate-pulse');
    });

    it('sets assertive aria-live when time <= 10', () => {
      render(<PlayingScreenTimer timeRemaining={8} totalTimeAllowed={120} showResult={false} />);
      expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'assertive');
    });

    it('sets aria-live off when time is sufficient', () => {
      render(<PlayingScreenTimer {...defaultProps} />);
      expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    });
  });
});
