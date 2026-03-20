/**
 * PlayingScreen Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayingScreen } from './PlayingScreen';
import { TEAM_AVATARS } from '../data/constants';
import { SoundManager } from '../services/sound';

// Mock the sound manager
vi.mock('../services/sound', () => ({
  SoundManager: {
    play: vi.fn(),
    init: vi.fn(),
    enabled: true
  }
}));

// Mock safeStorage to suppress tutorial overlay by default
vi.mock('../utils/safeStorage', () => ({
  safeGetItem: vi.fn(() => ({ sessionId: 'test-session', seen: true })),
  safeSetItem: vi.fn()
}));

// Mock useGameIntegrity hook
vi.mock('../hooks/useGameIntegrity', () => ({
  useGameIntegrity: vi.fn(() => ({
    penalty: 0,
    reset: vi.fn(),
    tabSwitches: 0,
    isForfeit: false,
    isTabVisible: true,
    totalTimeHidden: 0
  }))
}));

// Mock scoring utility
vi.mock('../utils/scoring', () => ({
  calculatePoints: vi.fn(() => ({ points: 5, speedBonus: null }))
}));

// Mock helpers
vi.mock('../utils/helpers', () => ({
  getRandomItem: vi.fn((arr) => arr?.[0] || ''),
  getHintContent: vi.fn(() => 'Hint content here')
}));

// Render real child components with minimal markup for integration testing
vi.mock('./ClaimCard', () => ({
  ClaimCard: vi.fn(({ claim, showAnswer }) => (
    <div data-testid="claim-card">
      <span>{claim.text}</span>
      {showAnswer && <span data-testid="answer-reveal">{claim.answer}</span>}
    </div>
  ))
}));

vi.mock('./VotingSection', () => ({
  VotingSection: vi.fn(({ verdict, onVerdictChange, onSubmit, disabled }) => (
    <div data-testid="voting-section">
      <button data-testid="vote-true" onClick={() => onVerdictChange('TRUE')}>TRUE</button>
      <button data-testid="vote-false" onClick={() => onVerdictChange('FALSE')}>FALSE</button>
      <button data-testid="submit-verdict" onClick={onSubmit} disabled={!verdict || disabled}>Submit</button>
    </div>
  ))
}));

vi.mock('./ResultPhase', () => ({
  ResultPhase: vi.fn(({ resultData, isLastRound, onNext }) => (
    resultData ? (
      <div data-testid="result-phase">
        <span data-testid="result-correct">{resultData.correct ? 'Correct!' : 'Wrong!'}</span>
        <span data-testid="result-points">{resultData.points}</span>
        <button data-testid="next-round" onClick={onNext}>
          {isLastRound ? 'Results' : 'Next'}
        </button>
      </div>
    ) : null
  ))
}));

vi.mock('./LiveClassLeaderboard', () => ({
  LiveClassLeaderboard: vi.fn(() => null)
}));

vi.mock('./TutorialOverlay', () => ({
  TutorialOverlay: vi.fn(({ onClose }) => (
    <div data-testid="tutorial-overlay">
      <button onClick={onClose}>Got it!</button>
    </div>
  ))
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays round information', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByText('1/5')).toBeInTheDocument();
  });

  it('displays different round numbers correctly', () => {
    render(<PlayingScreen {...defaultProps} round={3} totalRounds={10} />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('shows streak indicator when streak >= 2', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={3} />);
    expect(screen.getByText(/🔥 3/)).toBeInTheDocument();
  });

  it('does not show streak indicator when streak < 2', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={1} />);
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it('does not show streak indicator when streak is 0', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={0} />);
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });

  it('shows streak with pulse animation for streak < 5', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={3} />);
    const streakEl = screen.getByRole('status');
    expect(streakEl.className).toContain('animate-pulse');
  });

  it('shows streak with celebrate animation for streak >= 5', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={5} />);
    const streakEl = screen.getByRole('status');
    expect(streakEl.className).toContain('animate-celebrate');
  });

  it('shows streak with correct aria-label', () => {
    render(<PlayingScreen {...defaultProps} currentStreak={4} />);
    const streakEl = screen.getByRole('status');
    expect(streakEl).toHaveAttribute('aria-label', '4 correct answers in a row');
  });

  it('renders the keyboard shortcut toggle button', () => {
    render(<PlayingScreen {...defaultProps} />);
    const kbButton = screen.getByTitle(/Keyboard/i);
    expect(kbButton).toBeInTheDocument();
  });

  it('shows tutorial overlay on first round with no prior session', async () => {
    const { safeGetItem } = await import('../utils/safeStorage');
    safeGetItem.mockReturnValueOnce(null);

    render(<PlayingScreen {...defaultProps} round={1} />);
    expect(screen.getByTestId('tutorial-overlay')).toBeInTheDocument();
  });

  it('does not show tutorial when tutorial was already seen in this session', () => {
    render(<PlayingScreen {...defaultProps} round={1} sessionId="test-session" />);
    expect(screen.queryByTestId('tutorial-overlay')).not.toBeInTheDocument();
  });

  it('renders loading state when claim is null', () => {
    render(<PlayingScreen {...defaultProps} claim={null} />);
    expect(screen.getByText(/Loading claim/i)).toBeInTheDocument();
  });

  it('renders loading state when claim has no id', () => {
    render(<PlayingScreen {...defaultProps} claim={{ text: 'test' }} />);
    expect(screen.getByText(/Loading claim/i)).toBeInTheDocument();
  });

  it('sets verdict via keyboard shortcut T', () => {
    render(<PlayingScreen {...defaultProps} />);
    fireEvent.keyDown(window, { key: 't' });
    expect(SoundManager.play).toHaveBeenCalledWith('tick');
  });

  it('sets verdict via keyboard shortcut F', () => {
    render(<PlayingScreen {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'f' });
    expect(SoundManager.play).toHaveBeenCalledWith('tick');
  });

  it('sets verdict via keyboard shortcut M', () => {
    render(<PlayingScreen {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'M' });
    expect(SoundManager.play).toHaveBeenCalledWith('tick');
  });

  it('renders the viewport container', () => {
    render(<PlayingScreen {...defaultProps} />);
    const container = document.querySelector('.viewport-container');
    expect(container).toBeInTheDocument();
  });

  // New tests for the completed PlayingScreen voting flow

  it('renders the ClaimCard component', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByTestId('claim-card')).toBeInTheDocument();
    expect(screen.getByText('Test claim text for evaluation')).toBeInTheDocument();
  });

  it('renders the VotingSection component', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByTestId('voting-section')).toBeInTheDocument();
  });

  it('does not render ResultPhase initially', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.queryByTestId('result-phase')).not.toBeInTheDocument();
  });

  it('shows keyboard shortcuts hint on first round', () => {
    render(<PlayingScreen {...defaultProps} round={1} />);
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText(/confidence/i)).toBeInTheDocument();
  });

  it('toggles keyboard shortcuts visibility', () => {
    render(<PlayingScreen {...defaultProps} round={2} />);
    // Round 2 should not show keyboard hint by default
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    // Press ? to toggle
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('shows previous rounds button when there are previous results', () => {
    const previousResults = [
      { claimId: 'c1', teamVerdict: 'TRUE', confidence: 2, correct: true, points: 3 }
    ];
    render(<PlayingScreen {...defaultProps} previousResults={previousResults} />);
    expect(screen.getByTitle('Review previous rounds')).toBeInTheDocument();
  });

  it('does not show previous rounds button when no previous results', () => {
    render(<PlayingScreen {...defaultProps} previousResults={[]} />);
    expect(screen.queryByTitle('Review previous rounds')).not.toBeInTheDocument();
  });

  it('toggles previous rounds drawer when button clicked', () => {
    const previousResults = [
      { claimId: 'c1', teamVerdict: 'TRUE', confidence: 2, correct: true, points: 3 }
    ];
    render(<PlayingScreen {...defaultProps} previousResults={previousResults} />);

    const toggleBtn = screen.getByTitle('Review previous rounds');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('R1: TRUE')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('shows ClaimCard without answer before submission', () => {
    render(<PlayingScreen {...defaultProps} />);
    expect(screen.getByTestId('claim-card')).toBeInTheDocument();
    expect(screen.queryByTestId('answer-reveal')).not.toBeInTheDocument();
  });
});
