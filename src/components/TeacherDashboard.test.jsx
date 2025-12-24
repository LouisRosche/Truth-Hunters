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
    reflection: 'We learned to check sources carefully',
    timestamp: new Date('2025-12-17T10:00:00').getTime(),
    score: 45
  },
  {
    id: 'r2',
    teamName: 'Team Beta',
    reflection: 'AI can be confidently wrong',
    timestamp: new Date('2025-12-17T11:00:00').getTime(),
    score: 38
  }
];

const mockGames = [
  {
    teamName: 'Team Alpha',
    score: 45,
    timestamp: new Date('2025-12-17T10:00:00').getTime(),
    difficulty: 'medium',
    totalRounds: 10,
    correct: 8
  },
  {
    teamName: 'Team Beta',
    score: 38,
    timestamp: new Date('2025-12-17T11:00:00').getTime(),
    difficulty: 'easy',
    totalRounds: 8,
    correct: 7
  }
];

const mockPendingClaims = [
  {
    id: 'claim1',
    text: 'The Earth is approximately 4.5 billion years old',
    answer: 'TRUE',
    source: 'expert-sourced',
    subject: 'Earth Science',
    submittedBy: 'Team Alpha',
    timestamp: new Date('2025-12-17T09:00:00').getTime(),
    status: 'pending'
  }
];

const mockClassSettings = {
  allowedDifficulties: ['easy', 'medium'],
  allowedSubjects: ['Biology', 'History'],
  allowedGradeLevels: ['middle'],
  enableStudentSubmissions: true,
  requireModeration: true
};

const mockClassAchievements = [
  {
    teamName: 'Team Alpha',
    achievements: ['first_perfect', 'streak_5'],
    timestamp: new Date('2025-12-17T10:00:00').getTime()
  }
];

vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    initialized: true,
    getClassCode: vi.fn(() => 'TEST123'),
    setClassCode: vi.fn(),
    getClassReflections: vi.fn(() => Promise.resolve(mockReflections)),
    getTopTeams: vi.fn(() => Promise.resolve(mockGames)),
    getAllSubmittedClaims: vi.fn(() => Promise.resolve(mockPendingClaims)),
    getClassSettings: vi.fn(() => Promise.resolve(mockClassSettings)),
    getClassAchievements: vi.fn(() => Promise.resolve(mockClassAchievements)),
    updateClassSettings: vi.fn(() => Promise.resolve(true)),
    reviewClaim: vi.fn(() => Promise.resolve(true)),
    subscribeToPendingClaims: vi.fn((callback) => {
      // Immediately call with mock data
      callback(mockPendingClaims);
      // Return unsubscribe function
      return vi.fn();
    }),
    subscribeToClassAchievements: vi.fn((callback) => {
      // Immediately call with mock data
      callback(mockClassAchievements);
      // Return unsubscribe function
      return vi.fn();
    }),
    _getDefaultClassSettings: vi.fn(() => ({
      allowedDifficulties: ['easy', 'medium', 'hard'],
      allowedSubjects: [],
      allowedGradeLevels: ['middle'],
      enableStudentSubmissions: true,
      requireModeration: true
    }))
  }
}));

vi.mock('../services/leaderboard', () => ({
  LeaderboardManager: {
    getAll: vi.fn(() => mockGames)
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

      expect(screen.getByText(/teacher dashboard/i)).toBeInTheDocument();
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

      expect(screen.getByText(/class overview/i)).toBeInTheDocument();
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

      expect(screen.getByText(/claim moderation/i)).toBeInTheDocument();
    });

    it('switches to settings tab', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsTab);

      expect(screen.getByText(/class settings/i)).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('displays total games played', async () => {
      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/2/)).toBeInTheDocument(); // 2 games
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

      expect(screen.getByText(/Team Alpha/)).toBeInTheDocument();
      expect(screen.getByText(/Team Beta/)).toBeInTheDocument();
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
        expect(screen.getByText(/Dec 17/i)).toBeInTheDocument();
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
        const approveButtons = screen.getAllByRole('button', { name: /approve/i });
        fireEvent.click(approveButtons[0]);
      });

      await waitFor(() => {
        expect(FirebaseBackend.reviewClaim).toHaveBeenCalledWith(
          'claim1',
          'approved',
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
        const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
        fireEvent.click(rejectButtons[0]);
      });

      await waitFor(() => {
        expect(FirebaseBackend.reviewClaim).toHaveBeenCalledWith(
          'claim1',
          'rejected',
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
        // Should have filter dropdown
        const filterSelect = screen.getByLabelText(/filter/i);
        expect(filterSelect).toBeInTheDocument();
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
        expect(screen.getByText(/allowed difficulties/i)).toBeInTheDocument();
      });
    });

    it('allows editing class code', async () => {
      const { FirebaseBackend } = await import('../services/firebase');

      renderWithToast(<TeacherDashboard onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit code/i });
      fireEvent.click(editButton);

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
        const easyCheckbox = screen.getByLabelText(/easy/i);
        fireEvent.click(easyCheckbox);
      });

      await waitFor(() => {
        expect(FirebaseBackend.updateClassSettings).toHaveBeenCalled();
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

      const reflectionsTab = screen.getByRole('button', { name: /reflections/i });
      fireEvent.click(reflectionsTab);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
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

      const exportTab = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportTab);

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export games/i });
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

      await waitFor(() => {
        const teamAlphaElements = screen.getAllByText(/Team Alpha/);
        expect(teamAlphaElements.length).toBeGreaterThan(0);
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

      const overviewTab = screen.getByRole('button', { name: /overview/i });
      expect(overviewTab).toHaveAttribute('aria-label');
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
