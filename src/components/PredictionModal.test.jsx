/**
 * PredictionModal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionModal } from './PredictionModal';

// Mock useFocusTrap
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null })
}));

describe('PredictionModal', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    totalRounds: 10,
    difficulty: 'mixed'
  };

  it('renders modal with dialog role', () => {
    render(<PredictionModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays prediction title', () => {
    render(<PredictionModal {...defaultProps} />);
    expect(screen.getByText(/predict your score/i)).toBeInTheDocument();
  });

  it('shows round count and difficulty', () => {
    render(<PredictionModal {...defaultProps} />);
    expect(screen.getByText(/10 rounds/)).toBeInTheDocument();
    expect(screen.getByText(/mixed difficulty/)).toBeInTheDocument();
  });

  it('shows score range based on rounds', () => {
    render(<PredictionModal {...defaultProps} />);
    // max = 10 * 5 = 50, min = 10 * -6 = -60
    expect(screen.getByText(/Range: -60 to 50/)).toBeInTheDocument();
  });

  it('displays number input with default prediction', () => {
    render(<PredictionModal {...defaultProps} />);
    const input = screen.getByRole('spinbutton', { name: /predicted final score/i });
    // Default = totalRounds * 2 = 20
    expect(input).toHaveValue(20);
  });

  it('explains calibration bonus', () => {
    render(<PredictionModal {...defaultProps} />);
    expect(screen.getByText(/calibration/i)).toBeInTheDocument();
    expect(screen.getByText(/\+3 bonus/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<PredictionModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /lock in prediction/i })).toBeInTheDocument();
  });

  it('calls onSubmit with prediction when button clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PredictionModal {...defaultProps} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /lock in prediction/i }));
    expect(onSubmit).toHaveBeenCalledWith(20);
  });

  it('allows changing prediction value', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PredictionModal {...defaultProps} onSubmit={onSubmit} />);
    const input = screen.getByRole('spinbutton', { name: /predicted final score/i });
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /lock in prediction/i }));
    expect(onSubmit).toHaveBeenCalledWith(15);
  });

  it('bounds prediction to valid range', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PredictionModal {...defaultProps} onSubmit={onSubmit} />);
    const input = screen.getByRole('spinbutton', { name: /predicted final score/i });
    await user.clear(input);
    await user.type(input, '999');
    await user.click(screen.getByRole('button', { name: /lock in prediction/i }));
    // Should be capped to max (50)
    expect(onSubmit).toHaveBeenCalledWith(50);
  });

  it('calls onSubmit with current prediction on Escape', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PredictionModal {...defaultProps} onSubmit={onSubmit} />);
    await user.keyboard('{Escape}');
    expect(onSubmit).toHaveBeenCalledWith(20);
  });
});
