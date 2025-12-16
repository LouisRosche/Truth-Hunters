/**
 * SETUP SCREEN
 * Team configuration and game settings
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { LeaderboardView } from './LeaderboardView';
import { ScrollingLeaderboard } from './ScrollingLeaderboard';
import { SoloStatsView } from './SoloStatsView';
import { ClaimSubmissionForm } from './ClaimSubmissionForm';
import { StudentClaimNotifications } from './StudentClaimNotifications';
import { TEAM_AVATARS, DIFFICULTY_CONFIG, EDUCATIONAL_TIPS } from '../data/constants';
import { getSubjects } from '../data/claims';
import { SoundManager } from '../services/sound';
import { PlayerProfile } from '../services/playerProfile';
import { validateName, isContentAppropriate, sanitizeInput } from '../utils/moderation';
import { getRandomItem, getUnseenClaimStats } from '../utils/helpers';

// Get all available subjects
const ALL_SUBJECTS = getSubjects();

export function SetupScreen({ onStart, isLoading = false }) {
  // Check if returning solo player
  const existingProfile = useMemo(() => PlayerProfile.get(), []);
  const isReturningPlayer = existingProfile.stats.totalGames > 0;
  const quickStartSettings = useMemo(() => PlayerProfile.getQuickStartSettings(), []);

  // Calculate unseen claims for returning players
  const unseenStats = useMemo(() => {
    if (!isReturningPlayer) return null;
    return getUnseenClaimStats(existingProfile.claimsSeen || []);
  }, [isReturningPlayer, existingProfile.claimsSeen]);

  const [teamName, setTeamName] = useState(isReturningPlayer ? quickStartSettings.playerName : '');
  const [rounds, setRounds] = useState(isReturningPlayer ? quickStartSettings.rounds : 5);
  const [difficulty, setDifficulty] = useState(isReturningPlayer ? quickStartSettings.difficulty : 'mixed');
  const [selectedAvatar, setSelectedAvatar] = useState(
    isReturningPlayer && quickStartSettings.avatar
      ? quickStartSettings.avatar
      : TEAM_AVATARS[0]
  );
  const [soundEnabled, setSoundEnabled] = useState(
    isReturningPlayer ? quickStartSettings.soundEnabled : true
  );
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSoloStats, setShowSoloStats] = useState(false);
  const [showClaimSubmission, setShowClaimSubmission] = useState(false);
  const [showMySubmissions, setShowMySubmissions] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(
    isReturningPlayer ? (quickStartSettings.subjects || []) : []
  );

  // Player inputs (up to 6 players per group) - start with just 1 visible
  const [players, setPlayers] = useState([
    { firstName: isReturningPlayer ? quickStartSettings.playerName : '', lastInitial: '' }
  ]);
  const MAX_PLAYERS = 6;

  // Initialize sound manager
  useEffect(() => {
    SoundManager.init();
  }, []);

  // Quick Solo Start - uses saved preferences
  const handleQuickSoloStart = () => {
    const playerName = quickStartSettings.playerName || 'Solo Hunter';
    onStart({
      teamName: playerName,
      rounds: quickStartSettings.rounds || 5,
      difficulty: quickStartSettings.difficulty || 'mixed',
      avatar: quickStartSettings.avatar || TEAM_AVATARS[0],
      soundEnabled: quickStartSettings.soundEnabled !== false,
      subjects: quickStartSettings.subjects || [],
      players: [{ firstName: playerName, lastInitial: '' }],
      isSoloMode: true
    });
  };

  const handleSoundToggle = () => {
    const newState = SoundManager.toggle();
    setSoundEnabled(newState);
    if (newState) SoundManager.play('tick');
  };

  const updatePlayer = (index, field, value) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (validationError) setValidationError('');
  };

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) {
      setPlayers((prev) => [...prev, { firstName: '', lastInitial: '' }]);
    }
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleTeamNameChange = (e) => {
    setTeamName(e.target.value);
    if (validationError) setValidationError('');
  };

  // Validate and start game
  const handleStartGame = () => {
    const teamValidation = validateName(teamName);
    if (!teamValidation.isValid) {
      setValidationError(teamValidation.error || 'Please enter a valid team name');
      return;
    }

    const playersWithNames = players.filter((p) => p.firstName.trim());
    for (const player of playersWithNames) {
      if (!isContentAppropriate(player.firstName)) {
        setValidationError('Please use appropriate player names');
        return;
      }
      if (player.lastInitial && !isContentAppropriate(player.lastInitial)) {
        setValidationError('Please use appropriate player names');
        return;
      }
    }

    setValidationError('');
    onStart({
      teamName: teamValidation.cleaned,
      rounds,
      difficulty,
      avatar: selectedAvatar,
      soundEnabled,
      subjects: selectedSubjects,
      players: playersWithNames.map((p) => ({
        firstName: sanitizeInput(p.firstName),
        lastInitial: sanitizeInput(p.lastInitial)
      }))
    });
  };

  // Toggle subject selection
  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      }
      return [...prev, subject];
    });
  };

  // Difficulty background colors
  const difficultyBgColors = {
    easy: 'rgba(52, 211, 153, 0.15)',
    medium: 'rgba(251, 191, 36, 0.15)',
    hard: 'rgba(251, 113, 133, 0.15)',
    mixed: 'rgba(167, 139, 250, 0.15)'
  };

  // Delegate to LeaderboardView component
  if (showLeaderboard) {
    return <LeaderboardView onBack={() => setShowLeaderboard(false)} />;
  }

  // Delegate to Solo Stats View
  if (showSoloStats) {
    return (
      <SoloStatsView
        onBack={() => setShowSoloStats(false)}
        onQuickStart={() => {
          setShowSoloStats(false);
          handleQuickSoloStart();
        }}
      />
    );
  }

  // Claim Submission Modal
  if (showClaimSubmission) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-violet)' }}>
            Submit a Claim
          </h1>
          <button
            onClick={() => setShowClaimSubmission(false)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
        <ClaimSubmissionForm
          onClose={() => setShowClaimSubmission(false)}
          onSubmitSuccess={() => {
            // Could show notification here
          }}
        />
      </div>
    );
  }

  // My Submissions View
  if (showMySubmissions) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-violet)' }}>
            My Submissions
          </h1>
          <button
            onClick={() => setShowMySubmissions(false)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
        <StudentClaimNotifications onClose={() => setShowMySubmissions(false)} />
      </div>
    );
  }

  // Main Setup View - with scrolling leaderboard on left for larger screens
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1.5rem' }}>
      {/* Scrolling Leaderboard - hidden on mobile, shown on larger screens */}
      <div className="leaderboard-sidebar" style={{
        display: 'none',
        width: '280px',
        flexShrink: 0
      }}>
        <ScrollingLeaderboard onViewFull={() => setShowLeaderboard(true)} />
      </div>

      {/* Main Setup Form */}
      <div style={{ maxWidth: '640px', width: '100%' }}>
      {/* Header */}
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
        <h1
          className="mono"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            marginBottom: '0.25rem',
            letterSpacing: '-0.025em'
          }}
        >
          TRUTH HUNTERS
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          The Calibration Game
        </p>
      </div>

      {/* Returning Solo Player Welcome */}
      {isReturningPlayer && (
        <div
          className="animate-in"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Welcome back, <strong style={{ color: 'var(--accent-cyan)' }}>{quickStartSettings.playerName || 'Hunter'}</strong>!
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={handleQuickSoloStart} size="sm" disabled={isLoading}>
              {isLoading ? 'Preparing...' : 'Quick Solo Play'}
            </Button>
            <button
              onClick={() => setShowSoloStats(true)}
              className="mono"
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              📊 My Stats
            </button>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {existingProfile.stats.totalGames} games played • {existingProfile.stats.totalCorrect} correct answers
            {existingProfile.stats.currentDayStreak > 1 && (
              <span style={{ color: 'var(--accent-amber)' }}> • 🔥 {existingProfile.stats.currentDayStreak} day streak</span>
            )}
          </div>
          {/* Unseen claims indicator */}
          {unseenStats && unseenStats.unseen > 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(52, 211, 153, 0.1)',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              color: 'var(--accent-emerald)'
            }}>
              🆕 {unseenStats.unseen} new claims waiting for you!
            </div>
          )}
          {unseenStats && unseenStats.unseen === 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(167, 139, 250, 0.1)',
              borderRadius: '6px',
              fontSize: '0.6875rem',
              color: 'var(--accent-violet)'
            }}>
              🌟 You&apos;ve seen all {unseenStats.total} claims! Ready for a fresh challenge?
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Button - shown on mobile only (desktop has sidebar) */}
      <div className="leaderboard-mobile-btn animate-in" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="mono"
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '6px',
            color: 'var(--accent-amber)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          🏆 Leaderboard
        </button>
        {!isReturningPlayer && (
          <button
            onClick={() => setShowSoloStats(true)}
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            📊 My Stats
          </button>
        )}
      </div>

      {/* Contribute Claims Section */}
      <div
        className="animate-in"
        style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
          border: '1px solid var(--accent-violet)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>✨</span> Help build the game!
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowClaimSubmission(true)}
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent-violet)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📝 Submit a Claim
          </button>
          <button
            onClick={() => setShowMySubmissions(true)}
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            📋 My Submissions
          </button>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Submit claims for your teacher to review. Approved claims get added to the game!
        </div>
      </div>

      {/* How To Play */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <button
          onClick={() => setShowHowToPlay(!showHowToPlay)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 0
          }}
        >
          <h2 className="mono" style={{ fontSize: '0.8125rem', color: 'var(--accent-amber)' }}>
            📋 HOW TO PLAY
          </h2>
          <span style={{ color: 'var(--text-muted)' }}>{showHowToPlay ? '▲' : '▼'}</span>
        </button>

        {showHowToPlay && (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[
              'Read claims together — some are AI-generated!',
              'Discuss as a team using assigned roles',
              'Vote TRUE, FALSE, or MIXED',
              'Stake confidence points',
              'Learn from mistakes!'
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem'
                }}
              >
                <span style={{ color: 'var(--accent-cyan)' }}>▸</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Team Name & Mascot */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          TEAM NAME *
        </label>
        <input
          type="text"
          value={teamName}
          onChange={handleTeamNameChange}
          placeholder="Enter your team name..."
          maxLength={25}
          required
          autoComplete="off"
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            background: 'var(--bg-elevated)',
            border: validationError ? '1px solid var(--accent-rose)' : '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-serif)',
            marginBottom: '0.75rem'
          }}
        />

        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          MASCOT
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
          {TEAM_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar)}
              title={avatar.name}
              style={{
                padding: '0.5rem 0.375rem',
                background: selectedAvatar.id === avatar.id ? 'rgba(34, 211, 238, 0.15)' : 'var(--bg-elevated)',
                border: `2px solid ${selectedAvatar.id === avatar.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              {avatar.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Player Inputs */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          👥 TEAM MEMBERS (for leaderboard)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.map((player, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', width: '1rem' }}>
                {index + 1}.
              </span>
              <input
                type="text"
                value={player.firstName}
                onChange={(e) => updatePlayer(index, 'firstName', e.target.value)}
                placeholder="First Name"
                maxLength={15}
                autoComplete="off"
                aria-label={`Player ${index + 1} first name`}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-serif)'
                }}
              />
              <input
                type="text"
                value={player.lastInitial}
                onChange={(e) => updatePlayer(index, 'lastInitial', e.target.value.charAt(0).toUpperCase())}
                placeholder="?"
                title="Last name initial (e.g., S for Smith)"
                maxLength={1}
                autoComplete="off"
                aria-label={`Player ${index + 1} last initial`}
                style={{
                  width: '3rem',
                  padding: '0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              />
              {players.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  aria-label={`Remove player ${index + 1}`}
                  title="Remove player"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    padding: 0,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {players.length < MAX_PLAYERS && (
          <button
            type="button"
            onClick={addPlayer}
            className="mono"
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px dashed var(--border)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem'
            }}
          >
            <span>+</span> Add another player
          </button>
        )}
        <div style={{ marginTop: '0.375rem', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
          {players.length === 1 ? 'Playing solo? That works too!' : `${players.length} players on team`}
        </div>
      </div>

      {/* Difficulty */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          DIFFICULTY
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem' }}>
          {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              style={{
                padding: '0.625rem',
                background: difficulty === key ? difficultyBgColors[key] : 'var(--bg-elevated)',
                border: `2px solid ${difficulty === key ? config.color : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: difficulty === key ? config.color : 'var(--text-primary)'
                  }}
                >
                  {config.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          📚 SUBJECTS {selectedSubjects.length > 0 ? `(${selectedSubjects.length} selected)` : '(all)'}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {ALL_SUBJECTS.map((subject) => {
            const isSelected = selectedSubjects.length === 0 || selectedSubjects.includes(subject);
            return (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                style={{
                  padding: '0.375rem 0.625rem',
                  background: selectedSubjects.includes(subject) ? 'rgba(34, 211, 238, 0.15)' : 'var(--bg-elevated)',
                  border: `1px solid ${selectedSubjects.includes(subject) ? 'var(--accent-cyan)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.6875rem',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  opacity: selectedSubjects.length > 0 && !selectedSubjects.includes(subject) ? 0.5 : 1
                }}
              >
                {subject}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '0.375rem', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
          Click subjects to focus on specific areas, or leave empty for all
        </div>
      </div>

      {/* Rounds */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <label className="mono" style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          ROUNDS
        </label>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {[3, 5, 7, 10].map((n) => (
            <button
              key={n}
              onClick={() => setRounds(n)}
              className="mono"
              style={{
                flex: 1,
                padding: '0.625rem 0.375rem',
                background: rounds === n ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                color: rounds === n ? 'var(--bg-deep)' : 'var(--text-secondary)',
                border: `1px solid ${rounds === n ? 'var(--accent-cyan)' : 'var(--border)'}`,
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          ~{Math.ceil((rounds * (DIFFICULTY_CONFIG[difficulty]?.discussTime + DIFFICULTY_CONFIG[difficulty]?.stakeTime || 180)) / 60)}{' '}
          min
        </div>
      </div>

      {/* Sound + Start */}
      <div className="animate-in" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={handleSoundToggle}
          className="mono"
          style={{
            padding: '0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <Button onClick={handleStartGame} fullWidth size="lg" disabled={!teamName.trim() || isLoading}>
          {isLoading ? '⏳ Preparing Mission...' : `${selectedAvatar.emoji} START MISSION →`}
        </Button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div
          role="alert"
          className="animate-in"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(251, 113, 133, 0.15)',
            border: '1px solid var(--accent-rose)',
            borderRadius: '8px',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⚠️</span>
          <span style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', fontWeight: 500 }}>
            {validationError}
          </span>
        </div>
      )}

      {/* Tip */}
      <div
        className="animate-in"
        style={{
          padding: '0.75rem',
          background: 'var(--bg-elevated)',
          borderRadius: '6px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          💡 {getRandomItem(EDUCATIONAL_TIPS).tip}
        </div>
      </div>
      </div>
    </div>
  );
}
