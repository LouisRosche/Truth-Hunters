/**
 * DebriefScreen Component Tests
 * Tests the end-of-game summary with achievements, stats, and reflection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebriefScreen } from './DebriefScreen';

// Mock dependencies
vi.mock('../services/sound', () => ({
  SoundManager: {
    play: vi.fn()
  }
}));

vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    saveReflection: vi.fn(() => Promise.resolve(true))
  }
}));

vi.mock('../services/analytics', () => ({
  Analytics: {
    track: vi.fn()
  },
  AnalyticsEvents: {
    REFLECTION_SUBMITTED: 'reflection_submitted'
  }
}));

vi.mock('../utils/scoring', () => ({
  calculateGameStats: vi.fn((results) => ({
    totalCorrect: results.filter(r => r.correct).length,
    totalIncorrect: results.filter(r => !r.correct).length,
    accuracy: results.length > 0 ? Math.round((results.filter(r => r.correct).length / results.length) * 100) : 0,
    maxStreak: 2,
    perfectGame: results.length > 0 && results.every(r => r.correct)
  }))
}));

vi.mock('../utils/helpers', () => ({
  getRandomItem: vi.fn(() => ({
    question: 'What did your team learn?',
    followUp: 'Discuss with your team.'
  }))
}));

vi.mock('../data/achievements', () => ({
  ACHIEVEMENTS: [
    {
      id: 'perfect-game',
      name: 'Perfect Game',
      description: 'Got every claim right',
      icon: '🎯',
      condition: (stats) => stats.perfectGame
    },
    {
      id: 'ai-detector',
      name: 'AI Detector',
      description: 'Caught all AI claims',
      icon: '🤖',
      condition: (stats) => stats.totalCorrect >= 2
    }
  ]
}));

vi.mock('../data/constants', () => ({
  REFLECTION_PROMPTS: [
    {
      question: 'What did your team learn?',
      followUp: 'Discuss with your team.'
    }
  ]
}));

vi.mock('../data/claims', () => ({
  AI_ERROR_PATTERNS: [
    {
      id: 'myth-perpetuation',
      name: 'Myth Perpetuation',
      description: 'Repeating common misconceptions',
      example: 'Lightning never strikes the same place twice',
      teachingPoint: 'Always verify popular claims'
    },
    {
      id: 'confident-specificity',
      name: 'Confident Specificity',
      description: 'False precision to appear authoritative',
      example: 'Humans use exactly 10% of their brains',
      teachingPoint: 'Question overly specific claims'
    }
  ]
}));

describe('DebriefScreen', () => {
  const mockTeam = {
    name: 'Test Team',
    score: 15,
    predictedScore: 14,
    results: [
      {
        claimId: 'claim-1',
        teamVerdict: 'TRUE',
        correct: true,
        points: 5,
        confidence: 3,
        reasoning: 'This makes sense based on our knowledge'
      },
      {
        claimId: 'claim-2',
        teamVerdict: 'FALSE',
        correct: false,
        points: -6,
        confidence: 3
      },
      {
        claimId: 'claim-3',
        teamVerdict: 'MIXED',
        correct: true,
        points: 3,
        confidence: 2
      }
    ]
  };

  const mockClaims = [
    {
      id: 'claim-1',
      text: 'The Earth revolves around the Sun',
      answer: 'TRUE',
      explanation: 'This is a fundamental fact of astronomy',
      subject: 'Science',
      source: 'expert-sourced',
      citation: 'https://example.com/astronomy'
    },
    {
      id: 'claim-2',
      text: 'Lightning never strikes twice',
      answer: 'TRUE',
      explanation: 'Actually, lightning can strike the same place multiple times',
      subject: 'Science',
      source: 'ai-generated',
      errorPattern: 'myth-perpetuation'
    },
    {
      id: 'claim-3',
      text: 'The Great Wall is visible from space',
      answer: 'MIXED',
      explanation: 'It depends on what you mean by "visible from space"',
      subject: 'Geography',
      source: 'expert-sourced'
    }
  ];

  const mockOnRestart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    it('displays team name and final score', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Test Team')).toBeInTheDocument();
      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument();
      // Final score should be 15 (base) + 3 (calibration bonus) = 18
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('displays FINAL SCORE label', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument();
    });
  });

  describe('Calibration Bonus', () => {
    it('awards +3 bonus when prediction is within ±2 of actual score', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/\+3 PREDICTION BONUS!/i)).toBeInTheDocument();
      expect(screen.getByText(/You guessed 14 pts and got 15/i)).toBeInTheDocument();
    });

    it('does not award bonus when prediction is off by more than 2', () => {
      const teamWithNoBonu = {
        ...mockTeam,
        predictedScore: 10
      };

      render(
        <DebriefScreen
          team={teamWithNoBonu}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.queryByText(/\+3 PREDICTION BONUS!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Predicted: 10 \| Actual: 15 \(off by 5\)/i)).toBeInTheDocument();
    });

    it('awards bonus for exact prediction match', () => {
      const perfectTeam = {
        ...mockTeam,
        predictedScore: 15
      };

      render(
        <DebriefScreen
          team={perfectTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/\+3 PREDICTION BONUS!/i)).toBeInTheDocument();
    });
  });

  describe('Stats Grid', () => {
    it('displays accuracy in fraction format', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('2/3')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('displays AI detection rate', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('AI Detection')).toBeInTheDocument();
      // 0 out of 1 AI claim correct = 0%
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays best streak from game stats', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Best Streak')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays predicted score', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Predicted')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
    });
  });

  describe('Achievements', () => {
    it('shows achievements section when achievements are earned', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/ACHIEVEMENTS UNLOCKED/i)).toBeInTheDocument();
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
      expect(screen.getByText('AI Detector')).toBeInTheDocument();
    });

    it('can toggle achievements section', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /achievements unlocked/i });

      // Should be visible initially
      expect(screen.getByText('Caught all AI claims')).toBeInTheDocument();

      // Click to hide
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Caught all AI claims')).not.toBeInTheDocument();

      // Click to show again
      fireEvent.click(toggleButton);
      expect(screen.getByText('Caught all AI claims')).toBeInTheDocument();
    });

    it('does not show achievements section when none earned', () => {
      const teamNoAchievements = {
        ...mockTeam,
        results: []
      };

      render(
        <DebriefScreen
          team={teamNoAchievements}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.queryByText(/ACHIEVEMENTS UNLOCKED/i)).not.toBeInTheDocument();
    });
  });

  describe('Round Breakdown', () => {
    it('displays round breakdown section', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('ROUND BREAKDOWN')).toBeInTheDocument();
    });

    it('shows correct/incorrect indicators for each result', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const checkmarks = screen.getAllByText('✓');
      const xmarks = screen.getAllByText('✗');

      expect(checkmarks.length).toBe(2); // 2 correct
      expect(xmarks.length).toBe(1); // 1 incorrect
    });

    it('displays team verdict and confidence for each round', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/TRUE • ●●●/)).toBeInTheDocument(); // First result
      expect(screen.getByText(/FALSE • ●●●/)).toBeInTheDocument(); // Second result
      expect(screen.getByText(/MIXED • ●●/)).toBeInTheDocument(); // Third result
    });

    it('displays points earned/lost for each round', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('+5')).toBeInTheDocument();
      expect(screen.getByText('-6')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('shows reasoning when provided', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/Your reasoning:/)).toBeInTheDocument();
      expect(screen.getByText(/This makes sense based on our knowledge/)).toBeInTheDocument();
    });

    it('shows explanation only for incorrect answers', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      // Only the incorrect answer (claim-2) should show "Actually:"
      expect(screen.getByText(/Actually:/)).toBeInTheDocument();
      expect(screen.getByText(/lightning can strike the same place multiple times/i)).toBeInTheDocument();
    });

    it('displays citation links when available', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/📚 Source:/)).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /example\.com\/astronomy/i });
      expect(link).toHaveAttribute('href', 'https://example.com/astronomy');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('displays error pattern for AI-generated claims', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/🤖 Error Pattern:/)).toBeInTheDocument();
      expect(screen.getByText(/Myth Perpetuation/)).toBeInTheDocument();
    });

    it('handles missing claims gracefully', () => {
      const teamWithMissingClaim = {
        ...mockTeam,
        results: [
          {
            claimId: 'nonexistent-claim',
            teamVerdict: 'TRUE',
            correct: true,
            points: 5,
            confidence: 3
          }
        ]
      };

      render(
        <DebriefScreen
          team={teamWithMissingClaim}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Unknown claim')).toBeInTheDocument();
    });
  });

  describe('AI Error Patterns Section', () => {
    it('displays AI error patterns section', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/🤖 AI ERROR PATTERNS TO REMEMBER/i)).toBeInTheDocument();
    });

    it('can toggle AI error patterns section', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /ai error patterns/i });

      // Initially hidden
      expect(screen.queryByText('Confident Specificity')).not.toBeInTheDocument();

      // Click to show
      fireEvent.click(toggleButton);
      expect(screen.getByText('Confident Specificity')).toBeInTheDocument();
      expect(screen.getAllByText('Myth Perpetuation').length).toBeGreaterThan(0);
      expect(screen.getByText(/Repeating common misconceptions/)).toBeInTheDocument();
      expect(screen.getByText(/💡 Always verify popular claims/)).toBeInTheDocument();

      // Click to hide
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Confident Specificity')).not.toBeInTheDocument();
    });
  });

  describe('Reflection Section', () => {
    it('displays reflection section with prompt', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('🪞 TEAM REFLECTION')).toBeInTheDocument();
      expect(screen.getByText(/What did your team learn?/)).toBeInTheDocument();
      expect(screen.getByText(/Discuss with your team./)).toBeInTheDocument();
    });

    it('displays calibration self-assessment options', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/Were you good at knowing when you were right or wrong?/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📈 Too confident/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /✅ Just right/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /📉 Not confident enough/i })).toBeInTheDocument();
    });

    it('allows selecting calibration assessment', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const justRightButton = screen.getByRole('button', { name: /✅ Just right/i });
      fireEvent.click(justRightButton);

      expect(justRightButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('allows entering reflection response', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const textarea = screen.getByPlaceholderText(/Share your team's thoughts.../);
      fireEvent.change(textarea, { target: { value: 'We learned a lot!' } });

      expect(textarea).toHaveValue('We learned a lot!');
    });

    it('shows save button when reflection is entered', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const textarea = screen.getByPlaceholderText(/Share your team's thoughts.../);
      fireEvent.change(textarea, { target: { value: 'Great learning!' } });

      expect(screen.getByRole('button', { name: /💾 Save Reflection/i })).toBeInTheDocument();
    });

    it('saves reflection to Firebase when save button clicked', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const justRightButton = screen.getByRole('button', { name: /✅ Just right/i });
      fireEvent.click(justRightButton);

      const textarea = screen.getByPlaceholderText(/Share your team's thoughts.../);
      fireEvent.change(textarea, { target: { value: 'We learned about calibration!' } });

      const saveButton = screen.getByRole('button', { name: /💾 Save Reflection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(FirebaseBackend.saveReflection).toHaveBeenCalledWith({
          teamName: 'Test Team',
          calibrationSelfAssessment: 'calibrated',
          reflectionResponse: 'We learned about calibration!',
          reflectionPrompt: 'What did your team learn?',
          gameScore: 18, // 15 + 3 bonus
          accuracy: 67,
          predictedScore: 14,
          actualScore: 15
        });
      });
    });

    it('shows saved confirmation after successful save', async () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const textarea = screen.getByPlaceholderText(/Share your team's thoughts.../);
      fireEvent.change(textarea, { target: { value: 'Great game!' } });

      const saveButton = screen.getByRole('button', { name: /💾 Save Reflection/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/✓ Reflection saved for your teacher/)).toBeInTheDocument();
      });
    });

    it('displays growth mindset message', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/🌱 Growth Mindset:/)).toBeInTheDocument();
      expect(screen.getByText(/Great balance of confidence and caution/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onRestart when Play Again button clicked', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const playAgainButton = screen.getByRole('button', { name: /Play Again/i });
      fireEvent.click(playAgainButton);

      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it('displays share button', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByRole('button', { name: /📤 Share/i })).toBeInTheDocument();
    });

    it('displays print button', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByRole('button', { name: /🖨️ Print Results/i })).toBeInTheDocument();
    });

    it('updates share button text after sharing', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve())
        }
      });

      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      const shareButton = screen.getByRole('button', { name: /📤 Share/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /✓ Copied!/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty results array', () => {
      const emptyTeam = {
        ...mockTeam,
        results: []
      };

      render(
        <DebriefScreen
          team={emptyTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Test Team')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument(); // Accuracy
    });

    it('handles zero score', () => {
      const zeroTeam = {
        ...mockTeam,
        score: 0,
        predictedScore: 0
      };

      render(
        <DebriefScreen
          team={zeroTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      // Final score should be 0 + 3 (calibration bonus) = 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles negative score', () => {
      const negativeTeam = {
        ...mockTeam,
        score: -10,
        predictedScore: -8
      };

      render(
        <DebriefScreen
          team={negativeTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      // Final score should be -10 + 3 (calibration bonus) = -7
      expect(screen.getByText('-7')).toBeInTheDocument();
    });

    it('handles missing difficulty prop', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Test Team')).toBeInTheDocument();
    });

    it('handles missing teamAvatar prop', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText('Test Team')).toBeInTheDocument();
    });
  });

  describe('Research Attribution', () => {
    it('displays research citations', () => {
      render(
        <DebriefScreen
          team={mockTeam}
          claims={mockClaims}
          onRestart={mockOnRestart}
        />
      );

      expect(screen.getByText(/Research Base:/)).toBeInTheDocument();
      expect(screen.getByText(/Johnson & Johnson \(2009\) cooperative learning/)).toBeInTheDocument();
      expect(screen.getByText(/Wineburg et al\. \(2022\) lateral reading/)).toBeInTheDocument();
    });
  });
});
