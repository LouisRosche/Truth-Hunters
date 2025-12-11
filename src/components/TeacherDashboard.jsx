/**
 * TEACHER DASHBOARD
 * View class performance, student reflections, and export data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { FirebaseBackend } from '../services/firebase';
import { LeaderboardManager } from '../services/leaderboard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Export data to CSV format
 */
function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function TeacherDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [reflections, setReflections] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classCode, setClassCode] = useState(FirebaseBackend.getClassCode() || '');
  const [isEditing, setIsEditing] = useState(false);
  const isOnline = useOnlineStatus();

  // Load data from Firebase and local storage
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load from Firebase if available
      if (FirebaseBackend.initialized && isOnline) {
        const [firebaseReflections, firebaseGames] = await Promise.all([
          FirebaseBackend.getClassReflections(),
          FirebaseBackend.getTopTeams(100)
        ]);
        setReflections(firebaseReflections);
        setGames(firebaseGames);
      } else {
        // Fallback to local storage
        const localGames = LeaderboardManager.getAll();
        setGames(localGames);
        setReflections([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load data. Please try again.');
      // Fallback to local
      const localGames = LeaderboardManager.getAll();
      setGames(localGames);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate class statistics
  const stats = useMemo(() => {
    if (games.length === 0) {
      return {
        totalGames: 0,
        avgScore: 0,
        avgAccuracy: 0,
        topScore: 0,
        uniqueTeams: 0,
        totalPlayers: 0
      };
    }

    const totalGames = games.length;
    const avgScore = Math.round(games.reduce((sum, g) => sum + (g.score || 0), 0) / totalGames);
    const avgAccuracy = Math.round(games.reduce((sum, g) => sum + (g.accuracy || 0), 0) / totalGames);
    const topScore = Math.max(...games.map(g => g.score || 0));
    const uniqueTeams = new Set(games.map(g => g.teamName)).size;
    const totalPlayers = games.reduce((sum, g) => sum + (g.players?.length || 0), 0);

    return { totalGames, avgScore, avgAccuracy, topScore, uniqueTeams, totalPlayers };
  }, [games]);

  // Calibration analysis from reflections
  const calibrationStats = useMemo(() => {
    if (reflections.length === 0) return null;

    const counts = { overconfident: 0, calibrated: 0, underconfident: 0 };
    reflections.forEach(r => {
      if (r.calibrationSelfAssessment && counts[r.calibrationSelfAssessment] !== undefined) {
        counts[r.calibrationSelfAssessment]++;
      }
    });

    return counts;
  }, [reflections]);

  // Handle class code update
  const handleClassCodeSave = () => {
    FirebaseBackend.setClassCode(classCode.trim().toUpperCase());
    setIsEditing(false);
    loadData();
  };

  // Export handlers
  const handleExportGames = () => {
    const exportData = games.map(g => ({
      teamName: g.teamName,
      score: g.score,
      accuracy: g.accuracy,
      difficulty: g.difficulty,
      rounds: g.rounds,
      players: g.players?.map(p => `${p.firstName} ${p.lastInitial}`).join('; ') || '',
      achievements: g.achievements?.join('; ') || '',
      date: formatDate(g.timestamp)
    }));
    exportToCSV(exportData, 'truthhunters_games');
  };

  const handleExportReflections = () => {
    const exportData = reflections.map(r => ({
      teamName: r.teamName,
      score: r.gameScore,
      accuracy: r.accuracy,
      predicted: r.predictedScore,
      actual: r.actualScore,
      calibrationAssessment: r.calibrationSelfAssessment || '',
      reflectionPrompt: r.reflectionPrompt || '',
      reflectionResponse: r.reflectionResponse || '',
      date: formatDate(r.timestamp)
    }));
    exportToCSV(exportData, 'truthhunters_reflections');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="mono" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
            Teacher Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            View class performance and student reflections
          </p>
        </div>
        <Button onClick={onBack} variant="secondary">
          ← Back
        </Button>
      </div>

      {/* Online Status Indicator */}
      {!isOnline && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>📡</span>
          <span style={{ color: 'var(--accent-amber)', fontSize: '0.875rem' }}>
            You&apos;re offline. Showing local data only.
          </span>
        </div>
      )}

      {/* Class Code Configuration */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CLASS CODE</span>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SMITH-3RD"
                  maxLength={20}
                  style={{
                    padding: '0.5rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase'
                  }}
                />
                <Button onClick={handleClassCodeSave} size="sm">Save</Button>
                <Button onClick={() => setIsEditing(false)} variant="secondary" size="sm">Cancel</Button>
              </div>
            ) : (
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {FirebaseBackend.getClassCode() || 'PUBLIC (all classes)'}
              </div>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'games', label: 'Games', icon: '🎮' },
          { id: 'reflections', label: 'Reflections', icon: '🪞' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="mono"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--bg-card)',
              color: activeTab === tab.id ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--incorrect)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: 'var(--incorrect)'
          }}
        >
          {error}
          <button
            onClick={loadData}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Tab */}
      {!loading && activeTab === 'overview' && (
        <div className="animate-in">
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            {[
              { label: 'Total Games', value: stats.totalGames, icon: '🎮' },
              { label: 'Unique Teams', value: stats.uniqueTeams, icon: '👥' },
              { label: 'Avg Score', value: stats.avgScore, icon: '📈' },
              { label: 'Avg Accuracy', value: `${stats.avgAccuracy}%`, icon: '🎯' },
              { label: 'Top Score', value: stats.topScore, icon: '🏆' },
              { label: 'Total Players', value: stats.totalPlayers, icon: '🧑‍🎓' }
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Calibration Analysis */}
          {calibrationStats && reflections.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1rem'
              }}
            >
              <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-emerald)', marginBottom: '1rem' }}>
                Student Calibration Self-Assessment
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'overconfident', label: 'Too High', icon: '📈', color: 'var(--accent-rose)' },
                  { key: 'calibrated', label: 'Just Right', icon: '✅', color: 'var(--correct)' },
                  { key: 'underconfident', label: 'Too Low', icon: '📉', color: 'var(--accent-amber)' }
                ].map(item => (
                  <div
                    key={item.key}
                    style={{
                      flex: '1 1 100px',
                      padding: '0.75rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>{item.icon}</div>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color }}>
                      {calibrationStats[item.key]}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Games Tab */}
      {!loading && activeTab === 'games' && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {games.length} game{games.length !== 1 ? 's' : ''} recorded
            </span>
            <Button onClick={handleExportGames} variant="secondary" size="sm" disabled={games.length === 0}>
              📥 Export CSV
            </Button>
          </div>

          {games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No games recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {games.slice(0, 20).map((game, i) => (
                <div
                  key={game.id || i}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {game.teamAvatar || '🔍'} {game.teamName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {game.players?.map(p => `${p.firstName} ${p.lastInitial}`).join(', ') || 'No players listed'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {game.score}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {game.accuracy}% acc
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      className="mono"
                      style={{
                        padding: '0.125rem 0.375rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {game.difficulty}
                    </span>
                    <span
                      className="mono"
                      style={{
                        padding: '0.125rem 0.375rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {game.rounds} rounds
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {formatDate(game.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              {games.length > 20 && (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Showing 20 of {games.length} games. Export to see all.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reflections Tab */}
      {!loading && activeTab === 'reflections' && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {reflections.length} reflection{reflections.length !== 1 ? 's' : ''} submitted
            </span>
            <Button onClick={handleExportReflections} variant="secondary" size="sm" disabled={reflections.length === 0}>
              📥 Export CSV
            </Button>
          </div>

          {reflections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {isOnline
                ? 'No reflections submitted yet. Students can submit reflections at the end of each game.'
                : 'Reflections require an online connection to view.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reflections.map((reflection, i) => (
                <div
                  key={reflection.id || i}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {reflection.teamName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Score: {reflection.gameScore} | Predicted: {reflection.predictedScore} | Accuracy: {reflection.accuracy}%
                      </div>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {formatDate(reflection.timestamp)}
                    </div>
                  </div>

                  {reflection.calibrationSelfAssessment && (
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: '6px',
                        marginBottom: '0.75rem',
                        display: 'inline-block'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Self-assessment: </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {reflection.calibrationSelfAssessment === 'overconfident' && '📈 Too high'}
                        {reflection.calibrationSelfAssessment === 'calibrated' && '✅ Just right'}
                        {reflection.calibrationSelfAssessment === 'underconfident' && '📉 Too low'}
                      </span>
                    </div>
                  )}

                  {reflection.reflectionPrompt && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 500, marginBottom: '0.25rem' }}>
                        💭 {reflection.reflectionPrompt}
                      </div>
                      {reflection.reflectionResponse ? (
                        <div
                          style={{
                            padding: '0.75rem',
                            background: 'var(--bg-elevated)',
                            borderRadius: '6px',
                            borderLeft: '3px solid var(--accent-emerald)',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic'
                          }}
                        >
                          &ldquo;{reflection.reflectionResponse}&rdquo;
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No written response
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
