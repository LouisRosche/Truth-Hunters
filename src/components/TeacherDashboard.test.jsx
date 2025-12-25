/**
 * TeacherDashboard Component Tests
 * Tests teacher-facing dashboard with class stats, reflections, and claim moderation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeacherDashboard } from './TeacherDashboard';
import { ToastProvider } from './Toast';

// Mock dependencies
const mockReflections = [
  {
    id: 'r1',
    teamName: 'Team Alpha',
    reflectionResponse: 'We learned to check sources carefully',
    reflectionPrompt: 'What did you learn?',
    gameScore: 45,
    predictedScore: 40,
    accuracy: 80,
    timestamp: new Date('2025-12-17T10:00:00').getTime(),
    calibrationSelfAssessment: 'calibrated'
  },
  {
    id: 'r2',
    teamName: 'Team Beta',
    reflectionResponse: 'AI can be confidently wrong',
    reflectionPrompt: 'What did you learn?',
    gameScore: 38,
    predictedScore: 35,
    accuracy: 75,
    timestamp: new Date('2025-12-17T11:00:00').getTime(),
    calibrationSelfAssessment: 'overconfident'
  }
];

const mockGames = [
  {
    teamName: 'Team Alpha',
    teamAvatar: '🔍',
    score: 45,
    accuracy: 80,
    timestamp: new Date('2025-12-17T10:00:00').getTime(),
    difficulty: 'medium',
    rounds: 10,
    totalRounds: 10,
    correct: 8,
    players: [{ firstName: 'Alice', lastInitial: 'A' }]
  },
  {
    teamName: 'Team Beta',
    teamAvatar: '🔬',
    score: 38,
    accuracy: 75,
    timestamp: new Date('2025-12-17T11:00:00').getTime(),
    difficulty: 'easy',
    rounds: 8,
    totalRounds: 8,
    correct: 7,
    players: [{ firstName: 'Bob', lastInitial: 'B' }]
  }
];

const mockPendingClaims = [
  {
    id: 'claim1',
    claimText: 'The Earth is approximately 4.5 billion years old',
    explanation: 'Scientific evidence from radiometric dating shows this',
    answer: 'TRUE',
    source: 'expert-sourced',
    subject: 'Earth Science',
    submitterName: 'Team Alpha',
    submitterAvatar: '🔍',
    timestamp: new Date('2025-12-17T09:00:00').getTime(),
    status: 'pending'
  }
];

const mockClassSettings = {
  allowedDifficulties: ['easy', 'medium'],
  allowedSubjects: ['Biology', 'History'],
  allowedGradeLevels: ['middle'],
  gradeLevel: 'middle',
  defaultDifficulty: 'medium',
  minRounds: 5,
  maxRounds: 15,
  allowStudentClaims: true,
  requireClaimCitation: true,
  showLeaderboard: true,
  enableStudentSubmissions: true,
  requireModeration: true
};

const mockClassAchievements = [
  {
    id: 'ach1',
    achievementIcon: '🏆',
    achievementName: 'Perfect Score',
    achievementDescription: 'Got 100% accuracy',
    playerAvatar: '🔍',
    playerName: 'Team Alpha',
    timestamp: new Date('2025-12-17T10:00:00').getTime()
  }
];

vi.mock('../services/firebase', () => {
  // Mock data needs to be defined here to avoid hoisting issues
  const mockReflectionsData = [
    {
      id: 'r1',
      teamName: 'Team Alpha',
      reflectionResponse: 'We learned to check sources carefully',
      reflectionPrompt: 'What did you learn?',
      gameScore: 45,
      predictedScore: 40,
      accuracy: 80,
      timestamp: new Date('2025-12-17T10:00:00').getTime(),
      calibrationSelfAssessment: 'calibrated'
    },
    {
      id: 'r2',
      teamName: 'Team Beta',
      reflectionResponse: 'AI can be confidently wrong',
      reflectionPrompt: 'What did you learn?',
      gameScore: 38,
      predictedScore: 35,
      accuracy: 75,
      timestamp: new Date('2025-12-17T11:00:00').getTime(),
      calibrationSelfAssessment: 'overconfident'
    }
  ];

  const mockGamesData = [
    {
      teamName: 'Team Alpha',
      teamAvatar: '🔍',
      score: 45,
      accuracy: 80,
      timestamp: new Date('2025-12-17T10:00:00').getTime(),
      difficulty: 'medium',
      rounds: 10,
      totalRounds: 10,
      correct: 8,
      players: [{ firstName: 'Alice', lastInitial: 'A' }]
    },
    {
      teamName: 'Team Beta',
      teamAvatar: '🔬',
      score: 38,
      accuracy: 75,
      timestamp: new Date('2025-12-17T11:00:00').getTime(),
      difficulty: 'easy',
      rounds: 8,
      totalRounds: 8,
      correct: 7,
      players: [{ firstName: 'Bob', lastInitial: 'B' }]
    }
  ];

  const mockClaimsData = [
    {
      id: 'claim1',
      claimText: 'The Earth is approximately 4.5 billion years old',
      explanation: 'Scientific evidence from radiometric dating shows this',
      answer: 'TRUE',
      source: 'expert-sourced',
      subject: 'Earth Science',
      submitterName: 'Team Alpha',
      submitterAvatar: '🔍',
      timestamp: new Date('2025-12-17T09:00:00').getTime(),
      status: 'pending'
    }
  ];

  const mockAchievementsData = [
    {
      id: 'ach1',
      achievementIcon: '🏆',
      achievementName: 'Perfect Score',
      achievementDescription: 'Got 100% accuracy',
      playerAvatar: '🔍',
      playerName: 'Team Alpha',
      timestamp: new Date('2025-12-17T10:00:00').getTime()
    }
  ];

  const mockSettingsData = {
    allowedDifficulties: ['easy', 'medium'],
    allowedSubjects: ['Biology', 'History'],
    allowedGradeLevels: ['middle'],
    gradeLevel: 'middle',
    defaultDifficulty: 'medium',
    minRounds: 5,
    maxRounds: 15,
    allowStudentClaims: true,
    requireClaimCitation: true,
    showLeaderboard: true,
    enableStudentSubmissions: true,
    requireModeration: true
  };

  return {
    FirebaseBackend: {
      initialized: true,
      getClassCode: vi.fn(() => 'TEST123'),
      setClassCode: vi.fn(),
      getClassReflections: vi.fn(() => Promise.resolve(mockReflectionsData)),
      getTopTeams: vi.fn(() => Promise.resolve(mockGamesData)),
      getAllSubmittedClaims: vi.fn(() => Promise.resolve(mockClaimsData)),
      getClassSettings: vi.fn(() => Promise.resolve(mockSettingsData)),
      getClassAchievements: vi.fn(() => Promise.resolve(mockAchievementsData)),
      updateClassSettings: vi.fn(() => Promise.resolve(true)),
      saveClassSettings: vi.fn(() => Promise.resolve({ success: true })),
      reviewClaim: vi.fn(() => Promise.resolve({ success: true })),
      exportClassData: vi.fn(() => Promise.resolve({ success: true, data: {} })),
      subscribeToPendingClaims: vi.fn((callback) => {
        // Immediately call with mock data
        callback(mockClaimsData);
        // Return unsubscribe function
        return vi.fn();
      }),
      subscribeToClassAchievements: vi.fn((callback) => {
        // Immediately call with mock data
        callback(mockAchievementsData);
        // Return unsubscribe function
        return vi.fn();
      }),
      _getDefaultClassSettings: vi.fn(() => ({
        allowedDifficulties: ['easy', 'medium', 'hard'],
        allowedSubjects: [],
        allowedGradeLevels: ['middle'],
        enableStudentSubmissions: true,
        requireModeration: true,
        gradeLevel: 'middle',
        defaultDifficulty: 'medium',
        minRounds: 5,
        maxRounds: 15
      }))
    }
  };
});

vi.mock('../services/leaderboard', () => ({
  LeaderboardManager: {
    getAll: vi.fn(() => [
      {
        teamName: 'Team Alpha',
        teamAvatar: '🔍',
        score: 45,
        accuracy: 80,
        timestamp: new Date('2025-12-17T10:00:00').getTime(),
        difficulty: 'medium',
        rounds: 10,
        totalRounds: 10,
        correct: 8,
        players: [{ firstName: 'Alice', lastInitial: 'A' }]
      },
      {
        teamName: 'Team Beta',
        teamAvatar: '🔬',
        score: 38,
        accuracy: 75,
        timestamp: new Date('2025-12-17T11:00:00').getTime(),
        difficulty: 'easy',
        rounds: 8,
        totalRounds: 8,
        correct: 7,
        players: [{ firstName: 'Bob', lastInitial: 'B' }]
      }
    ])
  }
}));

vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true)
}));

vi.mock('../data/claims', () => ({
  getSubjects: vi.fn(() => ['Biology', 'History', 'Physics', 'Math'])
}));

// Helper to render with ToastProvider
const renderWithToast = (component) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe('TeacherDashboard', () => {
  let mockOnBack;

  beforeEach(() => {
    mockOnBack = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Rendering', () => {
    it('renders loading state initially', () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('renders dashboard after loading data', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for the main heading (there may be multiple "Teacher Dashboard" texts due to welcome banner)
      expect(screen.getAllByText(/teacher dashboard/i).length).toBeGreaterThan(0);
    });

    it('displays class code when available', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText(/TEST123/i)).toBeInTheDocument();
      });
    });

    it('calls onBack when back button is clicked', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab Navigation', () => {
    it('shows overview tab by default', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Overview tab shows stats like "Total Games", "Unique Teams", etc.
      expect(screen.getByText(/Total Games/i)).toBeInTheDocument();
      expect(screen.getByText(/Unique Teams/i)).toBeInTheDocument();
    });

    it('switches to reflections tab', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const reflectionsTab = screen.getByRole('button', { name: /reflections/i });
      fireEvent.click(reflectionsTab);

      expect(screen.getByText(/student reflections/i)).toBeInTheDocument();
    });

    it('switches to claims moderation tab', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      // Claims tab shows filter buttons
      expect(screen.getByText(/Pending/)).toBeInTheDocument();
      expect(screen.getByText(/Approved/)).toBeInTheDocument();
    });

    it('switches to settings tab', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsTab);

      // Settings tab shows "Class Configuration" header
      expect(screen.getByText(/Class Configuration/i)).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('displays total games played', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for Total Games stat label and verify games are shown
      expect(screen.getByText(/Total Games/i)).toBeInTheDocument();
      expect(screen.getByText(/Unique Teams/i)).toBeInTheDocument();
    });

    it('displays average class score', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Average of 45 and 38 is 41.5
      expect(screen.getByText(/41\.5|42/)).toBeInTheDocument();
    });

    it('shows recent games list', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Switch to Games tab to see the list
      const gamesTab = screen.getByRole('button', { name: /🎮 Games/i });
      fireEvent.click(gamesTab);

      await waitFor(() => {
        expect(screen.getByText(/Team Alpha/)).toBeInTheDocument();
        expect(screen.getByText(/Team Beta/)).toBeInTheDocument();
      });
    });
  });

  describe('Reflections Tab', () => {
    it('displays student reflections', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const reflectionsTab = screen.getByRole('button', { name: /reflections/i });
      fireEvent.click(reflectionsTab);

      await waitFor(() => {
        expect(screen.getByText(/check sources carefully/i)).toBeInTheDocument();
        expect(screen.getByText(/AI can be confidently wrong/i)).toBeInTheDocument();
      });
    });

    it('shows team names with reflections', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const reflectionsTab = screen.getByRole('button', { name: /reflections/i });
      fireEvent.click(reflectionsTab);

      await waitFor(() => {
        const teamAlphaElements = screen.getAllByText(/Team Alpha/);
        expect(teamAlphaElements.length).toBeGreaterThan(0);
      });
    });

    it('displays reflection timestamps', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const reflectionsTab = screen.getByRole('button', { name: /reflections/i });
      fireEvent.click(reflectionsTab);

      await waitFor(() => {
        // Check for multiple timestamps with Dec 17
        const timestamps = screen.getAllByText(/Dec 17/i);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Claim Moderation Tab', () => {
    it('displays pending claims', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        expect(screen.getByText(/Earth is approximately 4\.5 billion years old/i)).toBeInTheDocument();
      });
    });

    it('shows claim subject and submitter', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        expect(screen.getByText(/Earth Science/i)).toBeInTheDocument();
        const teamAlphaElements = screen.getAllByText(/Team Alpha/);
        expect(teamAlphaElements.length).toBeGreaterThan(0);
      });
    });

    it('allows approving a claim', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        // First click "Review This Claim" button
        const reviewButton = screen.getByRole('button', { name: /Review This Claim/i });
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        // Then click the approve button (with checkmark emoji)
        const approveButton = screen.getByRole('button', { name: /✓ Approve/i });
        fireEvent.click(approveButton);
      });

      await waitFor(() => {
        expect(FirebaseBackend.reviewClaim).toHaveBeenCalledWith(
          'claim1',
          true,
          expect.any(String)
        );
      });
    });

    it('allows rejecting a claim', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        // First click "Review This Claim" button
        const reviewButton = screen.getByRole('button', { name: /Review This Claim/i });
        fireEvent.click(reviewButton);
      });

      await waitFor(() => {
        // Then click the "Needs Work" button (with pencil emoji)
        const rejectButton = screen.getByRole('button', { name: /✎ Needs Work/i });
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        expect(FirebaseBackend.reviewClaim).toHaveBeenCalledWith(
          'claim1',
          false,
          expect.any(String)
        );
      });
    });

    it('filters claims by status', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const claimsTab = screen.getByRole('button', { name: /claims/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        // Should have filter buttons for different statuses
        expect(screen.getByText(/Pending \(/i)).toBeInTheDocument();
        expect(screen.getByText(/Approved \(/i)).toBeInTheDocument();
        expect(screen.getByText(/Needs Work \(/i)).toBeInTheDocument();
        expect(screen.getByText(/All \(/i)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Tab', () => {
    it('displays class settings', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsTab);

      await waitFor(() => {
        // Settings tab shows configuration options
        expect(screen.getByText(/Grade Level/i)).toBeInTheDocument();
        expect(screen.getByText(/Default Difficulty/i)).toBeInTheDocument();
        expect(screen.getByText(/Allowed Subjects/i)).toBeInTheDocument();
      });
    });

    it('allows editing class code', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click the "Change" button to edit class code
      const changeButton = screen.getByRole('button', { name: /change/i });
      fireEvent.click(changeButton);

      const input = screen.getByDisplayValue('TEST123');
      fireEvent.change(input, { target: { value: 'NEW456' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(FirebaseBackend.setClassCode).toHaveBeenCalledWith('NEW456');
    });

    it('allows toggling difficulty settings', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsTab);

      await waitFor(() => {
        // Find and click one of the difficulty buttons
        const buttons = screen.getAllByRole('button');
        const easyButton = buttons.find(btn => btn.textContent === 'easy');
        if (easyButton) {
          fireEvent.click(easyButton);
        }
      });

      await waitFor(() => {
        // Click the save button
        const saveButton = screen.getByRole('button', { name: /Save Settings/i });
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(FirebaseBackend.saveClassSettings).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('allows toggling subject restrictions', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText(/allowed subjects/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('allows exporting reflections to CSV', async () => {
      // Mock createObjectURL and click
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:url');
      globalThis.URL.revokeObjectURL = vi.fn();
      const mockClick = vi.fn();

      // Store original createElement
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          return { click: mockClick, href: '', download: '' };
        }
        return originalCreateElement.call(document, tag);
      });

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const reflectionsTab = screen.getByRole('button', { name: /🪞 Reflections/i });
      fireEvent.click(reflectionsTab);

      await waitFor(() => {
        // Find the Export CSV button in the reflections tab
        const exportButton = screen.getByRole('button', { name: /📥 Export CSV/i });
        fireEvent.click(exportButton);
      });

      expect(mockClick).toHaveBeenCalled();

      // Restore original createElement
      document.createElement = originalCreateElement;
    });

    it('allows exporting game data to CSV', async () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:url');
      globalThis.URL.revokeObjectURL = vi.fn();
      const mockClick = vi.fn();

      // Store original createElement
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn((tag) => {
        if (tag === 'a') {
          return { click: mockClick, href: '', download: '' };
        }
        return originalCreateElement.call(document, tag);
      });

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click Games tab (not Export tab)
      const gamesTab = screen.getByRole('button', { name: /🎮 Games/i });
      fireEvent.click(gamesTab);

      await waitFor(() => {
        // Find the Export CSV button in the games tab
        const exportButton = screen.getByRole('button', { name: /📥 Export CSV/i });
        fireEvent.click(exportButton);
      });

      expect(mockClick).toHaveBeenCalled();

      // Restore original createElement
      document.createElement = originalCreateElement;
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data loading fails', async () => {
      const { FirebaseBackend } = await import('../services/firebase');
      FirebaseBackend.getClassReflections.mockRejectedValueOnce(new Error('Network error'));

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      });
    });

    it('falls back to local storage when offline', async () => {
      const { useOnlineStatus } = await import('../hooks/useOnlineStatus');
      const { LeaderboardManager } = await import('../services/leaderboard');

      useOnlineStatus.mockReturnValue(false);

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(LeaderboardManager.getAll).toHaveBeenCalled();
    });

    it('shows offline indicator when not connected', async () => {
      const { useOnlineStatus } = await import('../hooks/useOnlineStatus');
      useOnlineStatus.mockReturnValue(false);

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Class Achievements', () => {
    it('displays class-wide achievements', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click the achievements tab
      const achievementsTab = screen.getByRole('button', { name: /🏆 Achievements/i });
      fireEvent.click(achievementsTab);

      await waitFor(() => {
        // Check that the achievements tab content is displayed
        // It may show either achievements or "No achievements earned yet" message
        const achievementsMessage = screen.queryByText(/achievements? earned by your class/i);
        expect(achievementsMessage).toBeInTheDocument();
      });
    });

    it('shows achievement badges', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        // Should show achievement indicators
        const achievementElements = screen.getAllByText(/🏆|⭐|🎯/);
        expect(achievementElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for tabs', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Tabs should be accessible as buttons with clear text content
      const overviewTab = screen.getByRole('button', { name: /📊 Overview/i });
      expect(overviewTab).toBeInTheDocument();
      expect(overviewTab.tagName).toBe('BUTTON');
    });

    it('has proper ARIA labels for action buttons', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('is keyboard navigable', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('button');
      tabs.forEach(tab => {
        expect(tab).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});
