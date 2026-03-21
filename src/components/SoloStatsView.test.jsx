/**
 * SoloStatsView Component Tests
 * Tests the solo player statistics dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoloStatsView } from './SoloStatsView';
import { PlayerProfile } from '../services/playerProfile';

// Mock PlayerProfile
const mockStats = {
  playerName: 'TestPlayer',
  avatar: { emoji: '🦊', name: 'Fox' },
  totalGames: 15,
  totalCorrect: 42,
  accuracy: 73,
  bestScore: 28,
  bestStreak: 5,
  totalPoints: 180,
  currentDayStreak: 3,
  lastPlayedAt: Date.now() - 3600000, // 1 hour ago
  claimsSeen: 50,
  totalClaims: 100,
  totalPredictions: 5,
  calibrationRate: 60,
  highConfAccuracy: 80,
  bestSubjects: [
    { name: 'History', accuracy: 80, total: 10 },
    { name: 'Biology', accuracy: 67, total: 15 }
  ],
  worstSubjects: [
    { name: 'Physics', accuracy: 40, total: 5 }
  ],
  hardestPatterns: [
    { id: 'hallucination', name: 'Hallucination', accuracy: 50, total: 10 }
  ],
  subjectStats: {
    Biology: { correct: 10, total: 15, accuracy: 67 },
    History: { correct: 8, total: 10, accuracy: 80 }
  },
  subjectCount: 2,
  recentGames: [
    { timestamp: Date.now() - 86400000, score: 20, correct: 4, rounds: 5 },
    { timestamp: Date.now() - 172800000, score: 15, correct: 3, rounds: 5 }
  ]
};

vi.mock('../services/playerProfile', () => ({
  PlayerProfile: {
    getDisplayStats: vi.fn(() => mockStats),
    get: vi.fn(() => ({
      stats: mockStats,
      subjectStats: mockStats.subjectStats,
      claimsSeen: Array.from({ length: 50 }, (_, i) => `claim-${i}`)
    }))
  }
}));

// Mock achievements
vi.mock('../data/achievements', () => ({
  LIFETIME_ACHIEVEMENTS: [
    { id: 'first-game', name: 'First Game', description: 'Play your first game', icon: '🎮', category: 'milestones' },
    { id: 'ten-games', name: '10 Games', description: 'Play 10 games', icon: '🏅', category: 'milestones' },
    { id: 'sharp-eye', name: 'Sharp Eye', description: '80% accuracy', icon: '👁️', category: 'skill' }
  ],
  ACHIEVEMENT_CATEGORIES: {
    milestones: { name: 'Milestones', icon: '🏅' },
    skill: { name: 'Skill', icon: '🎯' }
  },
  getAllEarnedLifetimeAchievements: vi.fn(() => [
    { id: 'first-game', name: 'First Game', icon: '🎮', category: 'milestones' },
    { id: 'ten-games', name: '10 Games', icon: '🏅', category: 'milestones' }
  ])
}));

// Mock claims data
vi.mock('../data/claims', () => ({
  AI_ERROR_PATTERNS: [
    { id: 'hallucination', name: 'Hallucination', description: 'AI makes up facts' },
    { id: 'outdated', name: 'Outdated Info', description: 'AI uses old data' }
  ]
}));

describe('SoloStatsView', () => {
  const defaultProps = {
    onBack: vi.fn(),
    onQuickStart: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================
  // Header and basic rendering
  // ==========================================================
  it('renders player name and avatar', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('🦊')).toBeInTheDocument();
  });

  it('renders last played time', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });

  it('shows day streak badge when streak > 0', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText(/3 day streak/)).toBeInTheDocument();
  });

  it('renders all four tab buttons', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
    expect(screen.getByText(/Subjects/)).toBeInTheDocument();
    expect(screen.getByText(/Achievements/)).toBeInTheDocument();
    expect(screen.getByText(/History/)).toBeInTheDocument();
  });

  // ==========================================================
  // Overview tab (default)
  // ==========================================================
  it('shows key stats on overview tab', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument(); // totalGames
    expect(screen.getByText('42')).toBeInTheDocument(); // totalCorrect
    expect(screen.getByText('73%')).toBeInTheDocument(); // accuracy
    expect(screen.getByText('28')).toBeInTheDocument(); // bestScore
  });

  it('shows milestone progress bars', () => {
    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText(/25 games/)).toBeInTheDocument(); // next milestone after 15
  });

  // ==========================================================
  // Tab switching
  // ==========================================================
  it('switches to subjects tab', () => {
    render(<SoloStatsView {...defaultProps} />);
    fireEvent.click(screen.getByText(/Subjects/));
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('switches to achievements tab', () => {
    render(<SoloStatsView {...defaultProps} />);
    fireEvent.click(screen.getByText(/Achievements/));
    expect(screen.getByText('First Game')).toBeInTheDocument();
    expect(screen.getByText('10 Games')).toBeInTheDocument();
  });

  it('switches to history tab', () => {
    render(<SoloStatsView {...defaultProps} />);
    fireEvent.click(screen.getByText(/History/));
    // History tab shows recent game entries with score and correct/total
    expect(screen.getByText(/\+20 pts/)).toBeInTheDocument();
    expect(screen.getByText(/4\/5 correct/)).toBeInTheDocument();
  });

  // ==========================================================
  // Action buttons
  // ==========================================================
  it('calls onBack when back button clicked', () => {
    render(<SoloStatsView {...defaultProps} />);
    const backBtn = screen.getByText(/Back/i);
    fireEvent.click(backBtn);
    expect(defaultProps.onBack).toHaveBeenCalledOnce();
  });

  it('calls onQuickStart when play now button clicked', () => {
    render(<SoloStatsView {...defaultProps} />);
    const playBtn = screen.getByText(/Play Now/i);
    fireEvent.click(playBtn);
    expect(defaultProps.onQuickStart).toHaveBeenCalledOnce();
  });

  // ==========================================================
  // Edge cases
  // ==========================================================
  it('shows "Solo Hunter" when no player name', () => {
    PlayerProfile.getDisplayStats.mockReturnValueOnce({
      ...mockStats,
      playerName: null,
      avatar: null,
      currentDayStreak: 0,
      lastPlayedAt: null
    });

    render(<SoloStatsView {...defaultProps} />);
    expect(screen.getByText('Solo Hunter')).toBeInTheDocument();
    expect(screen.getByText(/Never/)).toBeInTheDocument();
  });
});
