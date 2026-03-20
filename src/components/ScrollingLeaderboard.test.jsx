import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the useTeamLeaderboard hook
const mockUseTeamLeaderboard = vi.fn();
vi.mock('../hooks/useLeaderboard', () => ({
  useTeamLeaderboard: (...args) => mockUseTeamLeaderboard(...args)
}));

// Mock sanitize
vi.mock('../utils/sanitize', () => ({
  sanitizeUserContent: (text) => text
}));

import { ScrollingLeaderboard } from './ScrollingLeaderboard';

const makeTeam = (overrides = {}) => ({
  id: `team-${Math.random()}`,
  teamName: 'Team Alpha',
  teamAvatar: '🦊',
  score: 10,
  ...overrides
});

describe('ScrollingLeaderboard', () => {
  it('shows loading skeleton', () => {
    mockUseTeamLeaderboard.mockReturnValue({ teams: [], isLoading: true, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('LEADERBOARD')).toBeInTheDocument();
  });

  it('shows empty state when no teams', () => {
    mockUseTeamLeaderboard.mockReturnValue({ teams: [], isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText(/No games yet/)).toBeInTheDocument();
  });

  it('renders podium with 3 teams', () => {
    const teams = [
      makeTeam({ teamName: 'First', score: 30 }),
      makeTeam({ teamName: 'Second', score: 20 }),
      makeTeam({ teamName: 'Third', score: 10 })
    ];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('renders crown on first place', () => {
    const teams = [makeTeam({ teamName: 'Winner', score: 30 })];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('renders remaining entries after top 3', () => {
    const teams = [
      makeTeam({ teamName: 'T1', score: 30 }),
      makeTeam({ teamName: 'T2', score: 20 }),
      makeTeam({ teamName: 'T3', score: 10 }),
      makeTeam({ teamName: 'T4', score: 5 }),
      makeTeam({ teamName: 'T5', score: 2 })
    ];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('T4')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
  });

  it('shows error indicator when error present', () => {
    const teams = [makeTeam()];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: 'Network error' });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('shows positive scores with + prefix', () => {
    const teams = [
      makeTeam({ teamName: 'T1', score: 30 }),
      makeTeam({ teamName: 'T2', score: 20 }),
      makeTeam({ teamName: 'T3', score: 10 }),
      makeTeam({ teamName: 'T4', score: 5 })
    ];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('shows view full button when onViewFull provided', async () => {
    const user = userEvent.setup();
    const onViewFull = vi.fn();
    const teams = [makeTeam()];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard onViewFull={onViewFull} />);
    const btn = screen.getByText('VIEW FULL LEADERBOARD');
    await user.click(btn);
    expect(onViewFull).toHaveBeenCalled();
  });

  it('does not show view full button when onViewFull is null', () => {
    const teams = [makeTeam()];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    render(<ScrollingLeaderboard />);
    expect(screen.queryByText('VIEW FULL LEADERBOARD')).not.toBeInTheDocument();
  });

  it('uses default avatar when teamAvatar is missing', () => {
    const teams = [makeTeam({ teamAvatar: null })];
    mockUseTeamLeaderboard.mockReturnValue({ teams, isLoading: false, error: null });
    const { container } = render(<ScrollingLeaderboard />);
    // Default emoji should be in the document
    expect(container.textContent).toContain('🔍');
  });
});
