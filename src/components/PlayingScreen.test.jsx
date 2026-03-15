/**
 * PlayingScreen Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// Mock child components that aren't rendered in current PlayingScreen JSX
vi.mock('./ClaimCard', () => ({
  ClaimCard: vi.fn(() => null)
}));

vi.mock('./VotingSection', () => ({
  VotingSection: vi.fn(() => null)
}));

vi.mock('./ResultPhase', () => ({
  ResultPhase: vi.fn(() => null)
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
    // Override the mock to simulate no tutorial seen
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
});
