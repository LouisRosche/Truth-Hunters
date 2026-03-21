/**
 * ResultPhase Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultPhase } from './ResultPhase';

describe('ResultPhase', () => {
  const defaultProps = {
    resultData: { correct: true, points: 5 },
    isLastRound: false,
    onNext: vi.fn()
  };

  it('renders nothing when resultData is null', () => {
    const { container } = render(
      <ResultPhase resultData={null} isLastRound={false} onNext={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  describe('Correct answer', () => {
    it('shows checkmark for correct answer', () => {
      render(<ResultPhase {...defaultProps} />);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows positive points with plus sign', () => {
      render(<ResultPhase {...defaultProps} />);
      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('shows "Next →" button when not last round', () => {
      render(<ResultPhase {...defaultProps} />);
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('Incorrect answer', () => {
    it('shows X mark for incorrect answer', () => {
      render(<ResultPhase {...defaultProps} resultData={{ correct: false, points: -3 }} />);
      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('shows negative points without extra sign', () => {
      render(<ResultPhase {...defaultProps} resultData={{ correct: false, points: -3 }} />);
      expect(screen.getByText('-3')).toBeInTheDocument();
    });
  });

  describe('Last round', () => {
    it('shows "Results" button on last round', () => {
      render(<ResultPhase {...defaultProps} isLastRound={true} />);
      expect(screen.getByRole('button', { name: /results/i })).toBeInTheDocument();
    });
  });

  describe('Zero points', () => {
    it('shows zero points with plus prefix', () => {
      render(<ResultPhase {...defaultProps} resultData={{ correct: true, points: 0 }} />);
      expect(screen.getByText('+0')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onNext when button is clicked', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      render(<ResultPhase {...defaultProps} onNext={onNext} />);
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(onNext).toHaveBeenCalledOnce();
    });
  });
});
