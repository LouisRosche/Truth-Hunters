import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    getStudentClaims: vi.fn(),
  }
}));

vi.mock('../services/playerProfile', () => ({
  PlayerProfile: {
    get: vi.fn()
  }
}));

vi.mock('../utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), log: vi.fn(), info: vi.fn() }
}));

import { StudentClaimNotifications } from './StudentClaimNotifications';
import { FirebaseBackend } from '../services/firebase';
import { PlayerProfile } from '../services/playerProfile';

describe('StudentClaimNotifications', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty profile state when no player name', () => {
    PlayerProfile.get.mockReturnValue({});
    render(<StudentClaimNotifications onClose={onClose} />);
    expect(screen.getByText(/Create a player profile/)).toBeInTheDocument();
  });

  it('shows close button in empty profile state', async () => {
    const user = userEvent.setup();
    PlayerProfile.get.mockReturnValue({});
    render(<StudentClaimNotifications onClose={onClose} />);
    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state while fetching', () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockReturnValue(new Promise(() => {})); // never resolves
    render(<StudentClaimNotifications onClose={onClose} />);
    expect(screen.getByText(/Loading your claims/)).toBeInTheDocument();
  });

  it('shows empty claims state', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText(/haven't submitted any claims/)).toBeInTheDocument();
    });
  });

  it('renders claims with status badges', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([
      { id: '1', claimText: 'Water boils at 100C', status: 'approved', answer: 'TRUE', subject: 'Science', timestamp: Date.now() },
      { id: '2', claimText: 'The sun is cold', status: 'pending', answer: 'FALSE', subject: 'Science', timestamp: Date.now() },
    ]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Water boils at 100C')).toBeInTheDocument();
      expect(screen.getByText('The sun is cold')).toBeInTheDocument();
    });
    // Status badges include icons with text
    expect(screen.getByText(/Approved/)).toBeInTheDocument();
    expect(screen.getByText(/Pending Review/)).toBeInTheDocument();
  });

  it('shows approval message for approved claims', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([
      { id: '1', claimText: 'Test claim', status: 'approved', answer: 'TRUE', subject: 'Science', timestamp: Date.now() }
    ]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText(/now in the game/)).toBeInTheDocument();
    });
  });

  it('shows teacher feedback for rejected claims', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([
      { id: '1', claimText: 'Test claim', status: 'rejected', answer: 'FALSE', subject: 'History', timestamp: Date.now(), reviewerNote: 'Please add a citation' }
    ]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText(/Needs Revision/)).toBeInTheDocument();
      expect(screen.getByText(/Please add a citation/)).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockRejectedValue(new Error('Network error'));
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load your submissions/)).toBeInTheDocument();
    });
  });

  it('retries on error', async () => {
    const user = userEvent.setup();
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([]);
    render(<StudentClaimNotifications onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Could not load/)).toBeInTheDocument();
    });

    await user.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText(/haven't submitted/)).toBeInTheDocument();
    });
  });

  it('shows header with title', async () => {
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Your Submitted Claims')).toBeInTheDocument();
    });
  });

  it('calls onClose from footer button', async () => {
    const user = userEvent.setup();
    PlayerProfile.get.mockReturnValue({ playerName: 'TestPlayer' });
    FirebaseBackend.getStudentClaims.mockResolvedValue([]);
    render(<StudentClaimNotifications onClose={onClose} />);
    await waitFor(() => screen.getByText('Close'));
    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
