/**
 * SETUP SCREEN
 * Team configuration and game settings
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { TEAM_AVATARS, DIFFICULTY_CONFIG, EDUCATIONAL_TIPS } from '../data/constants';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';
import { SoundManager } from '../services/sound';
import { validateName, isContentAppropriate, sanitizeInput } from '../utils/moderation';
import { formatPlayerName, getRandomItem } from '../utils/helpers';

export function SetupScreen({ onStart }) {
  const [teamName, setTeamName] = useState('');
  const [rounds, setRounds] = useState(5);
  const [difficulty, setDifficulty] = useState('mixed');
  const [selectedAvatar, setSelectedAvatar] = useState(TEAM_AVATARS[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('teams');
  const [validationError, setValidationError] = useState('');

  // Firebase/Class code state
  const [showTeacherSetup, setShowTeacherSetup] = useState(false);
  const [classCode, setClassCode] = useState(FirebaseBackend.getClassCode() || '');
  const [firebaseConfigText, setFirebaseConfigText] = useState('');
  const [firebaseStatus, setFirebaseStatus] = useState(
    FirebaseBackend.initialized ? 'connected' : 'disconnected'
  );
  const [cloudTeams, setCloudTeams] = useState([]);
  const [cloudPlayers, setCloudPlayers] = useState([]);
  const [loadingCloud, setLoadingCloud] = useState(false);

  // Player inputs (up to 4 players per group)
  const [players, setPlayers] = useState([
    { firstName: '', lastInitial: '' },
    { firstName: '', lastInitial: '' },
    { firstName: '', lastInitial: '' },
    { firstName: '', lastInitial: '' }
  ]);

  // Initialize sound manager
  useEffect(() => {
    SoundManager.init();
  }, []);

  // Load cloud leaderboard when showing leaderboard and Firebase is connected
  useEffect(() => {
    if (showLeaderboard && FirebaseBackend.initialized) {
      setLoadingCloud(true);
      Promise.all([FirebaseBackend.getTopTeams(10), FirebaseBackend.getTopPlayers(10)])
        .then(([teams, players]) => {
          setCloudTeams(teams);
          setCloudPlayers(players);
        })
        .catch((e) => {
          console.warn('Failed to load cloud leaderboard:', e);
        })
        .finally(() => {
          setLoadingCloud(false);
        });
    }
  }, [showLeaderboard]);

  // Handle Firebase configuration
  const handleConnectFirebase = () => {
    try {
      const config = JSON.parse(firebaseConfigText);
      if (FirebaseBackend.init(config)) {
        setFirebaseStatus('connected');
        if (classCode) {
          FirebaseBackend.setClassCode(classCode);
        }
      } else {
        setFirebaseStatus('error');
      }
    } catch (e) {
      console.error('Invalid Firebase config:', e);
      setFirebaseStatus('error');
    }
  };

  const handleDisconnectFirebase = () => {
    FirebaseBackend.disconnect();
    setFirebaseStatus('disconnected');
    setFirebaseConfigText('');
  };

  const handleClassCodeChange = (e) => {
    const code = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    setClassCode(code);
    FirebaseBackend.setClassCode(code);
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
      players: playersWithNames.map((p) => ({
        firstName: sanitizeInput(p.firstName),
        lastInitial: sanitizeInput(p.lastInitial)
      }))
    });
  };

  // Difficulty background colors
  const difficultyBgColors = {
    easy: 'rgba(52, 211, 153, 0.15)',
    medium: 'rgba(251, 191, 36, 0.15)',
    hard: 'rgba(251, 113, 133, 0.15)',
    mixed: 'rgba(167, 139, 250, 0.15)'
  };

  // Leaderboard data - showLeaderboard dep triggers refresh when viewing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topTeams = useMemo(() => LeaderboardManager.getTopTeams(10), [showLeaderboard]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topPlayers = useMemo(() => LeaderboardManager.getTopPlayers(10), [showLeaderboard]);

  // Leaderboard View
  if (showLeaderboard) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
        <div className="animate-in" style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowLeaderboard(false)}
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
            ← Back to Setup
          </button>
        </div>

        <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h2
            className="mono"
            style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-amber)' }}
          >
            LEADERBOARD
          </h2>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setLeaderboardTab('teams')}
            className="mono"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color: leaderboardTab === 'teams' ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${leaderboardTab === 'teams' ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎯 Top Teams
          </button>
          <button
            onClick={() => setLeaderboardTab('players')}
            className="mono"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              color: leaderboardTab === 'players' ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${leaderboardTab === 'players' ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👤 Top Players
          </button>
        </div>

        {/* Leaderboard Content */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {(() => {
            const displayData =
              leaderboardTab === 'teams'
                ? FirebaseBackend.initialized && cloudTeams.length > 0
                  ? cloudTeams
                  : topTeams
                : FirebaseBackend.initialized && cloudPlayers.length > 0
                ? cloudPlayers
                : topPlayers;

            if (displayData.length === 0) {
              return (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {loadingCloud ? 'Loading...' : 'No games played yet. Be the first!'}
                </div>
              );
            }

            return displayData.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: index < displayData.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: index < 3 ? 'rgba(251, 191, 36, 0.05)' : 'transparent'
                }}
              >
                <div
                  className="mono"
                  style={{
                    width: '2rem',
                    fontSize: index < 3 ? '1.25rem' : '0.875rem',
                    color:
                      index === 0
                        ? '#ffd700'
                        : index === 1
                        ? '#c0c0c0'
                        : index === 2
                        ? '#cd7f32'
                        : 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {leaderboardTab === 'teams' ? (
                      <>
                        <span>{item.teamAvatar || '🔍'}</span> {item.teamName}
                      </>
                    ) : (
                      item.displayName
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {leaderboardTab === 'teams'
                      ? item.players?.map((p) => formatPlayerName(p.firstName, p.lastInitial)).join(', ') || 'Anonymous'
                      : `${item.gamesPlayed} games • avg: ${item.avgScore}`}
                  </div>
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color:
                      leaderboardTab === 'teams'
                        ? item.score >= 0
                          ? 'var(--correct)'
                          : 'var(--incorrect)'
                        : 'var(--accent-amber)'
                  }}
                >
                  {leaderboardTab === 'teams'
                    ? `${item.score >= 0 ? '+' : ''}${item.score}`
                    : `Best: ${item.bestScore}`}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    );
  }

  // Teacher Setup View
  if (showTeacherSetup) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
        <div className="animate-in" style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowTeacherSetup(false)}
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
            ← Back to Setup
          </button>
        </div>

        <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <h2
            className="mono"
            style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}
          >
            TEACHER SETUP
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Enable class-wide leaderboards with Firebase (free)
          </p>
        </div>

        {/* Status */}
        <div
          style={{
            background: firebaseStatus === 'connected' ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-card)',
            border: `1px solid ${firebaseStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <span
            className="mono"
            style={{
              color:
                firebaseStatus === 'connected'
                  ? 'var(--accent-emerald)'
                  : firebaseStatus === 'error'
                  ? 'var(--accent-rose)'
                  : 'var(--text-muted)'
            }}
          >
            {firebaseStatus === 'connected'
              ? '✓ Connected to Firebase'
              : firebaseStatus === 'error'
              ? '✗ Connection Error'
              : '○ Not Connected'}
          </span>
        </div>

        {/* Class Code */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <label
            className="mono"
            style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}
          >
            CLASS CODE (optional)
          </label>
          <input
            type="text"
            value={classCode}
            onChange={handleClassCodeChange}
            placeholder="e.g., PERIOD3, SMITH5A"
            maxLength={10}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              textTransform: 'uppercase'
            }}
          />
        </div>

        {/* Firebase Config */}
        {firebaseStatus !== 'connected' && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <label className="mono" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              FIREBASE CONFIG JSON
            </label>
            <textarea
              value={firebaseConfigText}
              onChange={(e) => setFirebaseConfigText(e.target.value)}
              placeholder='{"apiKey": "...", "projectId": "...", ...}'
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                resize: 'vertical'
              }}
            />
            <button
              onClick={handleConnectFirebase}
              disabled={!firebaseConfigText.trim()}
              className="mono"
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: firebaseConfigText.trim() ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                color: firebaseConfigText.trim() ? 'var(--bg-deep)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: firebaseConfigText.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Connect Firebase
            </button>
          </div>
        )}

        {firebaseStatus === 'connected' && (
          <button
            onClick={handleDisconnectFirebase}
            className="mono"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--accent-rose)',
              border: '1px solid var(--accent-rose)',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Disconnect Firebase
          </button>
        )}

        <Button onClick={() => setShowTeacherSetup(false)} fullWidth>
          Done
        </Button>
      </div>
    );
  }

  // Main Setup View
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem' }}>
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

      {/* Leaderboard Button */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
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
          🏆 View Leaderboard
        </button>
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
                style={{
                  flex: 1,
                  padding: '0.5rem 0.625rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-serif)'
                }}
              />
              <input
                type="text"
                value={player.lastInitial}
                onChange={(e) => updatePlayer(index, 'lastInitial', e.target.value.charAt(0).toUpperCase())}
                placeholder="L"
                maxLength={1}
                autoComplete="off"
                style={{
                  width: '2.5rem',
                  padding: '0.5rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              />
            </div>
          ))}
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
        <Button onClick={handleStartGame} fullWidth size="lg" disabled={!teamName.trim()}>
          {selectedAvatar.emoji} START MISSION →
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
  );
}
