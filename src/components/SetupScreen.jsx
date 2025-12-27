/**
 * SETUP SCREEN
 * Team configuration and game settings
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { LeaderboardView } from './LeaderboardView';
import { ScrollingLeaderboard } from './ScrollingLeaderboard';
import { SoloStatsView } from './SoloStatsView';
import { ClaimSubmissionForm } from './ClaimSubmissionForm';
import { StudentClaimNotifications } from './StudentClaimNotifications';
import { TEAM_AVATARS, DIFFICULTY_CONFIG, EDUCATIONAL_TIPS } from '../data/constants';
import { getSubjects } from '../data/subjects';
import { SoundManager } from '../services/sound';
import { PlayerProfile } from '../services/playerProfile';
import { validateName, isContentAppropriate, sanitizeInput } from '../utils/moderation';
import { sanitizeUserContent } from '../utils/sanitize';
import { getRandomItem, getUnseenClaimStats } from '../utils/helpers';
import { preloadClaims } from '../data/claimsLoader';

// Get all available subjects
const ALL_SUBJECTS = getSubjects();

export function SetupScreen({ onStart, isLoading = false }) {
  // Check if returning solo player
  const existingProfile = useMemo(() => PlayerProfile.get(), []);
  const isReturningPlayer = existingProfile.stats.totalGames > 0;
  const quickStartSettings = useMemo(() => PlayerProfile.getQuickStartSettings(), []);

  // Calculate unseen claims for returning players (async - use state instead of useMemo)
  const [unseenStats, setUnseenStats] = useState(null);

  useEffect(() => {
    if (!isReturningPlayer) {
      setUnseenStats(null);
      return;
    }

    // Load unseen stats asynchronously
    getUnseenClaimStats(existingProfile.claimsSeen || [])
      .then(stats => setUnseenStats(stats))
      .catch(() => setUnseenStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReturningPlayer, existingProfile.claimsSeen.length]); // Use length to avoid array reference changes

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

  // Calculate available claims for selected subjects (warn if too few) - async
  const [subjectClaimStats, setSubjectClaimStats] = useState(null);

  useEffect(() => {
    if (selectedSubjects.length === 0) {
      setSubjectClaimStats(null);
      return;
    }

    // Load subject stats asynchronously
    getUnseenClaimStats([], selectedSubjects)
      .then(stats => setSubjectClaimStats(stats))
      .catch(() => setSubjectClaimStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjects.length]); // Use length to avoid array reference changes

  // Player inputs (up to 6 players per group) - start with just 1 visible
  const [players, setPlayers] = useState([
    { firstName: isReturningPlayer ? quickStartSettings.playerName : '', lastInitial: '' }
  ]);
  const MAX_PLAYERS = 6;

  // Initialize sound manager and preload claims database
  useEffect(() => {
    SoundManager.init();

    // Preload claims database in background for better performance
    // This happens during setup phase when user is configuring their team
    preloadClaims();
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

  // Toggle subject selection (memoized to prevent re-creation)
  const toggleSubject = useCallback((subject) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      }
      return [...prev, subject];
    });
  }, []); // No dependencies - uses functional update

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
    <div className="viewport-container" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '0.5rem', height: '100%', overflow: 'hidden' }}>
      {/* Single-viewport CSS - all content must fit without scrolling */}

      {/* Scrolling Leaderboard - hidden on mobile, shown on larger screens */}
      <div className="leaderboard-sidebar" style={{
        display: 'none',
        width: '280px',
        flexShrink: 0
      }}>
        <ScrollingLeaderboard onViewFull={() => setShowLeaderboard(true)} />
      </div>

      {/* Main Setup Form - wider for better content fit, NO scrolling */}
      <div className="setup-form-container" style={{
        maxWidth: '720px',
        width: '100%',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
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
          Spot facts vs. fiction & learn when to trust yourself
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
            Welcome back, <strong style={{ color: 'var(--accent-cyan)' }}>{sanitizeUserContent(quickStartSettings.playerName || 'Hunter', 50)}</strong>!
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
              fontSize: '0.75rem',
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
              fontSize: '0.75rem',
              color: 'var(--accent-violet)'
            }}>
              🌟 You&apos;ve seen all {unseenStats.total} claims! Ready for a fresh challenge?
            </div>
          )}
        </div>
      )}

      {/* How To Play - collapsed by default */}
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
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.75rem', padding: 0, margin: '0.75rem 0 0 0' }}>
            {[
              { step: '1', text: 'Read claims together — some are AI-generated!' },
              { step: '2', text: 'Discuss as a team: Is it TRUE, FALSE, or MIXED?' },
              { step: '3', text: 'Choose your confidence level (higher = more points but riskier!)' },
              { step: '4', text: 'Submit your answer and see if you were right' },
              { step: '5', text: 'Learn from the explanation and try again!' }
            ].map((item) => (
              <li
                key={item.step}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.4
                }}
              >
                <span className="mono" style={{
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  minWidth: '1.25rem',
                  textAlign: 'center'
                }}>{item.step}.</span>
                <span>{item.text}</span>
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
        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
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

        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          MASCOT
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
          {TEAM_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar)}
              title={avatar.name}
              aria-label={`Select ${avatar.name} as team mascot`}
              aria-pressed={selectedAvatar.id === avatar.id}
              style={{
                padding: '0.5rem 0.375rem',
                background: selectedAvatar.id === avatar.id ? 'rgba(34, 211, 238, 0.15)' : 'var(--bg-elevated)',
                border: `2px solid ${selectedAvatar.id === avatar.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              <span role="img" aria-label={avatar.name}>{avatar.emoji}</span>
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
        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          👥 WHO&apos;S PLAYING?
        </label>
        {/* Column headers aligned with inputs below */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ width: '1rem' }}></span>
          <span className="mono" style={{ flex: 1, fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
            First Name Only
          </span>
          <span className="mono" style={{ width: '3rem', fontSize: '0.5625rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Initial
          </span>
          {players.length > 1 && <span style={{ width: '2rem' }}></span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.map((player, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '1rem' }}>
                {index + 1}.
              </span>
              <input
                type="text"
                value={player.firstName}
                onChange={(e) => updatePlayer(index, 'firstName', e.target.value)}
                placeholder="First name"
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
                placeholder=""
                title="Last name initial (e.g., S for Smith) - optional"
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
        <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
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
        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
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
                  fontSize: '0.75rem',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  opacity: selectedSubjects.length > 0 && !selectedSubjects.includes(subject) ? 0.5 : 1
                }}
              >
                {subject}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click subjects to focus on specific areas, or leave empty for all
        </div>
        {/* Warning if not enough claims for selected subjects */}
        {subjectClaimStats && subjectClaimStats.total < rounds && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.625rem',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--accent-amber)'
          }}>
            ⚠️ Only {subjectClaimStats.total} claims available for selected subjects. {rounds > subjectClaimStats.total ? `Other subjects will be mixed in to reach ${rounds} rounds.` : ''}
          </div>
        )}
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
        <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
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
        <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          ~{Math.ceil((rounds * (DIFFICULTY_CONFIG[difficulty]?.discussTime + DIFFICULTY_CONFIG[difficulty]?.stakeTime || 180)) / 60)}{' '}
          min
        </div>
      </div>

      {/* Sound Toggle + Start */}
      <div className="animate-in" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
        {/* iOS-style toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOUND</span>
          <button
            onClick={handleSoundToggle}
            role="switch"
            aria-checked={soundEnabled}
            aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              background: soundEnabled ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <span style={{
              position: 'absolute',
              top: '2px',
              left: soundEnabled ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              {soundEnabled ? 'I' : 'O'}
            </span>
          </button>
        </div>
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

      {/* Secondary Actions - consolidated below START */}
      <div
        className="leaderboard-mobile-btn animate-in"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.375rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setShowLeaderboard(true)}
          className="mono"
          style={{
            padding: '0.375rem 0.625rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '5px',
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
              padding: '0.375rem 0.625rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            📊 Stats
          </button>
        )}
        <button
          onClick={() => setShowClaimSubmission(true)}
          className="mono"
          style={{
            padding: '0.375rem 0.625rem',
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid var(--accent-violet)',
            borderRadius: '5px',
            color: 'var(--accent-violet)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          ✨ Submit Claim
        </button>
        <button
          onClick={() => setShowMySubmissions(true)}
          className="mono"
          style={{
            padding: '0.375rem 0.625rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '5px',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          📋 Submissions
        </button>
      </div>

      {/* Tip */}
      <div
        className="animate-in"
        style={{
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-elevated)',
          borderRadius: '6px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          💡 {getRandomItem(EDUCATIONAL_TIPS).tip}
        </div>
      </div>
      </div>
    </div>
  );
}

SetupScreen.propTypes = {
  onStart: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

SetupScreen.defaultProps = {
  isLoading: false
};
