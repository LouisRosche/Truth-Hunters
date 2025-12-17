/**
 * PlayingScreen Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayingScreen } from './PlayingScreen';
import { TEAM_AVATARS } from '../data/constants';

// Mock the sound manager
vi.mock('../services/sound', () => ({
  SoundManager: {
    play: vi.fn(),
    init: vi.fn(),
    enabled: true
  }
}));

describe('PlayingScreen', () => {
  const mockClaim = {
    id: 'test-001',
    text: 'Test claim text for evaluation',
    answer: 'TRUE',
    source: 'expert-sourced',
    explanation: 'This is the explanation',
    subject: 'Biology',
    difficulty: 'easy'
  };

  const defaultProps = {
    claim: mockClaim,
    round: 1,
    totalRounds: 5,
    onSubmit: vi.fn(),
    difficulty: 'easy',
    currentStreak: 0,
    onUseHint: vi.fn(),
    teamAvatar: TEAM_AVATARS[0]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the claim text', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText(/Test claim text/i)).toBeInTheDocument();
  });

  it('displays round information', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText('1/5')).toBeInTheDocument();
  });

  it('shows difficulty badge', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText(/easy/i)).toBeInTheDocument();
  });

  it('renders verdict selector with TRUE, MIXED, FALSE options', () => {
    render(<PlayingScreen {...defaultProps} />);
    // Verdicts now have descriptive aria-labels: "TRUE: The claim is completely true"
    expect(screen.getByRole('radio', { name: /TRUE.*completely true/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /MIXED.*both true and false/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /FALSE.*false or misleading/i })).toBeInTheDocument();
  });

  it('renders confidence selector', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByRole('radiogroup', { name: /confidence/i })).toBeInTheDocument();
  });

  it('disables submit button when no verdict selected', () => {
    render(<PlayingScreen {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /lock in/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when verdict is selected', () => {
    render(<PlayingScreen {...defaultProps} />);

    // Select a verdict (using text content instead of aria-label)
    const trueButton = screen.getByText('TRUE');
    fireEvent.click(trueButton);

    const submitButton = screen.getByRole('button', { name: /lock in/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows streak indicator when streak >= 2', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={3} />);
    expect(screen.getByText(/🔥 3/i)).toBeInTheDocument();
  });

  it('does not show streak indicator when streak < 2', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={1} />);
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });

  it('renders hint buttons', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText(/Source Check/i)).toBeInTheDocument();
    expect(screen.getByText(/Error Pattern/i)).toBeInTheDocument();
    expect(screen.getByText(/Subject Expert/i)).toBeInTheDocument();
  });

  it('calls onUseHint when hint button clicked', () => {
    render(<PlayingScreen {...defaultProps} />);

    const sourceHintButton = screen.getByText(/Source Check/i);
    fireEvent.click(sourceHintButton);

    // Source check costs 2 points and hint type is 'source-hint'
    expect(defaultProps.onUseHint).toHaveBeenCalledWith(2, 'source-hint');
  });

  it('renders reasoning textarea', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByPlaceholderText(/What made you choose this/i)).toBeInTheDocument();
  });

  it('shows result after submitting answer', async () => {
    render(<PlayingScreen {...defaultProps} />);

    // Select verdict using text content
    const trueButton = screen.getByText('TRUE');
    fireEvent.click(trueButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /lock in/i });
    fireEvent.click(submitButton);

    // Should show result
    expect(screen.getByText(/CORRECT/i)).toBeInTheDocument();
  });

  it('shows incorrect result for wrong answer', async () => {
    render(<PlayingScreen {...defaultProps} />);

    // Select wrong verdict (claim answer is TRUE)
    const falseButton = screen.getByText('FALSE');
    fireEvent.click(falseButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /lock in/i });
    fireEvent.click(submitButton);

    // Should show incorrect
    expect(screen.getByText(/INCORRECT/i)).toBeInTheDocument();
  });

  it('shows "See Final Results" button on last round', async () => {
    render(<PlayingScreen {...defaultProps} round={5} totalRounds={5} />);

    // Select verdict and submit
    const trueButton = screen.getByText('TRUE');
    fireEvent.click(trueButton);

    const submitButton = screen.getByRole('button', { name: /lock in/i });
    fireEvent.click(submitButton);

    // Should show final results button
    expect(screen.getByText(/See Final Results/i)).toBeInTheDocument();
  });

  it('shows "Next Round" button when not on last round', async () => {
    render(<PlayingScreen {...defaultProps} round={3} totalRounds={5} />);

    // Select verdict and submit
    const trueButton = screen.getByText('TRUE');
    fireEvent.click(trueButton);

    const submitButton = screen.getByRole('button', { name: /lock in/i });
    fireEvent.click(submitButton);

    // Should show next round button
    expect(screen.getByText(/Next Round/i)).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when moving to next round', async () => {
    render(<PlayingScreen {...defaultProps} />);

    // Select verdict using text content
    const trueButton = screen.getByText('TRUE');
    fireEvent.click(trueButton);

    // Submit
    const submitButton = screen.getByRole('button', { name: /lock in/i });
    fireEvent.click(submitButton);

    // Click next round
    const nextButton = screen.getByText(/Next Round/i);
    fireEvent.click(nextButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        claimId: 'test-001',
        teamVerdict: 'TRUE',
        correct: true
      })
    );
  });
});
