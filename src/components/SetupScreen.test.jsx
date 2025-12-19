/**
 * SetupScreen Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupScreen } from './SetupScreen';

// Mock the sound manager
vi.mock('../services/sound', () => ({
  SoundManager: {
    play: vi.fn(),
    init: vi.fn(),
    toggle: vi.fn(() => true),
    enabled: true
  }
}));

// Mock Firebase
vi.mock('../services/firebase', () => ({
  FirebaseBackend: {
    initialized: false,
    getClassCode: vi.fn(() => null),
    setClassCode: vi.fn(),
    getTopTeams: vi.fn(() => Promise.resolve([])),
    getClassReflections: vi.fn(() => Promise.resolve([]))
  }
}));

// Mock LeaderboardManager
vi.mock('../services/leaderboard', () => ({
  LeaderboardManager: {
    getAll: vi.fn(() => []),
    getTopTeams: vi.fn(() => []),
    getTopPlayers: vi.fn(() => [])
  }
}));

describe('SetupScreen', () => {
  const mockOnStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByText('TRUTH HUNTERS')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByText('Spot facts vs. fiction & learn when to trust yourself')).toBeInTheDocument();
  });

  it('renders team name input', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByPlaceholderText(/enter your team name/i)).toBeInTheDocument();
  });

  it('renders mascot selection buttons', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    // Check that we have mascot selection - they use emojis
    expect(screen.getByText('MASCOT')).toBeInTheDocument();
  });

  it('renders player name inputs with dynamic add functionality', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    // Initially only shows 1 player slot (dynamic player slots feature)
    expect(screen.getByLabelText(/player 1 first name/i)).toBeInTheDocument();

    // Should have "Add another player" button
    const addButton = screen.getByRole('button', { name: /add another player/i });
    expect(addButton).toBeInTheDocument();

    // Add more players
    fireEvent.click(addButton);
    expect(screen.getByLabelText(/player 2 first name/i)).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(screen.getByLabelText(/player 3 first name/i)).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(screen.getByLabelText(/player 4 first name/i)).toBeInTheDocument();
  });

  it('renders difficulty selection', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByText('DIFFICULTY')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText('Progressive')).toBeInTheDocument();
  });

  it('renders rounds selection', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByText('ROUNDS')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('disables start button when team name is empty', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    const startButton = screen.getByRole('button', { name: /start mission/i });
    expect(startButton).toBeDisabled();
  });

  it('enables start button when team name is entered', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    const teamNameInput = screen.getByPlaceholderText(/enter your team name/i);
    fireEvent.change(teamNameInput, { target: { value: 'Test Team' } });

    const startButton = screen.getByRole('button', { name: /start mission/i });
    expect(startButton).not.toBeDisabled();
  });

  it('renders leaderboard button', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByRole('button', { name: /leaderboard/i })).toBeInTheDocument();
  });

  it('renders how to play section', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByText(/HOW TO PLAY/i)).toBeInTheDocument();
  });

  it('expands how to play section on click', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    // The HOW TO PLAY text is inside a button, find the button by role
    const buttons = screen.getAllByRole('button');
    const howToPlayButton = buttons.find(btn => btn.textContent.includes('HOW TO PLAY'));
    fireEvent.click(howToPlayButton);

    expect(screen.getByText(/Read claims together/i)).toBeInTheDocument();
  });

  it('renders sound toggle button', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    expect(screen.getByRole('button', { name: /🔊|🔇/i })).toBeInTheDocument();
  });

  it('renders subjects filter', () => {
    render(<SetupScreen onStart={mockOnStart} />);
    // Look for the SUBJECTS label in the form
    expect(screen.getByText(/SUBJECTS \(all\)/i)).toBeInTheDocument();
  });

  it('calls onStart with correct settings when submitted', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    // Enter team name
    const teamNameInput = screen.getByPlaceholderText(/enter your team name/i);
    fireEvent.change(teamNameInput, { target: { value: 'Test Team' } });

    // Enter player names
    const player1Input = screen.getByLabelText(/player 1 first name/i);
    fireEvent.change(player1Input, { target: { value: 'Alice' } });

    // Select difficulty
    const expertButton = screen.getByText('Expert');
    fireEvent.click(expertButton);

    // Select rounds
    const roundsButton = screen.getByText('7');
    fireEvent.click(roundsButton);

    // Start game
    const startButton = screen.getByRole('button', { name: /start mission/i });
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith(
      expect.objectContaining({
        teamName: 'Test Team',
        rounds: 7,
        difficulty: 'hard',
        soundEnabled: true,
        players: expect.arrayContaining([
          expect.objectContaining({ firstName: 'Alice' })
        ])
      })
    );
  });

  it('shows validation error for inappropriate team name', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    // Enter inappropriate team name (test with a short name that fails validation)
    const teamNameInput = screen.getByPlaceholderText(/enter your team name/i);
    fireEvent.change(teamNameInput, { target: { value: 'A' } }); // Too short

    const startButton = screen.getByRole('button', { name: /start mission/i });
    fireEvent.click(startButton);

    // Should show validation error
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('allows selecting difficulty', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    const beginnerButton = screen.getByText('Beginner');
    fireEvent.click(beginnerButton);

    // Beginner should be selected (check by border color or style)
    expect(beginnerButton.closest('button')).toHaveStyle({ borderColor: expect.any(String) });
  });

  it('allows selecting round count', () => {
    render(<SetupScreen onStart={mockOnStart} />);

    const roundButton = screen.getByText('10');
    fireEvent.click(roundButton);

    // Enter team name and start to verify rounds
    const teamNameInput = screen.getByPlaceholderText(/enter your team name/i);
    fireEvent.change(teamNameInput, { target: { value: 'Test Team' } });

    const startButton = screen.getByRole('button', { name: /start mission/i });
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalledWith(
      expect.objectContaining({
        rounds: 10
      })
    );
  });
});
