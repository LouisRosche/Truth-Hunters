import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks and services
const mockUseLiveLeaderboard = vi.fn();
vi.mock('../hooks/useLeaderboard', () => ({
  useLiveLeaderboard: () => mockUseLiveLeaderboard()
}));

vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    getClassCode: vi.fn(() => 'CLASS123')
  }
}));

vi.mock('../utils/sanitize', () => ({
  sanitizeUserContent: (text) => text
}));

import { LiveClassLeaderboard } from './LiveClassLeaderboard';
import { FirebaseBackend } from '../services/firebase';

const makeSession = (overrides = {}) => ({
  sessionId: `session-${Math.random()}`,
  teamName: 'Team Test',
  teamAvatar: '🦊',
  currentScore: 10,
  accuracy: 80,
  currentRound: 3,
  totalRounds: 5,
  ...overrides
});

describe('LiveClassLeaderboard', () => {
  it('returns null when no Firebase or class code', () => {
    FirebaseBackend.getClassCode.mockReturnValue(null);
    mockUseLiveLeaderboard.mockReturnValue({ sessions: [], isLoading: false, hasFirebase: false });
    const { container } = render(<LiveClassLeaderboard />);
    expect(container.firstChild).toBeNull();
    FirebaseBackend.getClassCode.mockReturnValue('CLASS123');
  });

  it('returns null when no sessions and not minimized', () => {
    mockUseLiveLeaderboard.mockReturnValue({ sessions: [], isLoading: false, hasFirebase: true });
    const { container } = render(<LiveClassLeaderboard />);
    expect(container.firstChild).toBeNull();
  });

  it('shows minimized button with session count', () => {
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession(), makeSession()],
      isLoading: false,
      hasFirebase: true
    });
    const onToggle = vi.fn();
    render(<LiveClassLeaderboard isMinimized={true} onToggle={onToggle} />);
    expect(screen.getByRole('button')).toHaveTextContent('2');
  });

  it('calls onToggle when minimized button clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession()],
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard isMinimized={true} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('renders live leaderboard with sessions', () => {
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession({ teamName: 'Alpha', currentScore: 15, accuracy: 75 })],
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession()],
      isLoading: true,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('highlights current team session', () => {
    const sessionId = 'my-session';
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession({ sessionId, teamName: 'My Team' })],
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard currentSessionId={sessionId} />);
    expect(screen.getByText('My Team')).toBeInTheDocument();
  });

  it('deduplicates sessions by ID', () => {
    const dupeId = 'dupe-session';
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [
        makeSession({ sessionId: dupeId, teamName: 'Team A' }),
        makeSession({ sessionId: dupeId, teamName: 'Team A Dupe' })
      ],
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard />);
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.queryByText('Team A Dupe')).not.toBeInTheDocument();
  });

  it('limits to top 5 sessions', () => {
    const sessions = Array.from({ length: 8 }, (_, i) =>
      makeSession({ sessionId: `s-${i}`, teamName: `Team ${i}` })
    );
    mockUseLiveLeaderboard.mockReturnValue({
      sessions,
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard />);
    expect(screen.getByText('Team 0')).toBeInTheDocument();
    expect(screen.getByText('Team 4')).toBeInTheDocument();
    expect(screen.queryByText('Team 5')).not.toBeInTheDocument();
  });

  it('shows close button when onToggle provided', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    mockUseLiveLeaderboard.mockReturnValue({
      sessions: [makeSession()],
      isLoading: false,
      hasFirebase: true
    });
    render(<LiveClassLeaderboard onToggle={onToggle} />);
    const closeBtn = screen.getByText('×');
    await user.click(closeBtn);
    expect(onToggle).toHaveBeenCalled();
  });
});
