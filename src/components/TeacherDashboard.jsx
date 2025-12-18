/**
 * TEACHER DASHBOARD
 * View class performance, student reflections, and export data
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from './Button';
import { FirebaseBackend } from '../services/firebase';
import { LeaderboardManager } from '../services/leaderboard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getSubjects } from '../data/claims';

const ALL_SUBJECTS = getSubjects();
const GRADE_LEVELS = [
  { id: 'elementary', label: 'Elementary (K-5)', description: 'Ages 5-11' },
  { id: 'middle', label: 'Middle School (6-8)', description: 'Ages 11-14' },
  { id: 'high', label: 'High School (9-12)', description: 'Ages 14-18' },
  { id: 'college', label: 'College/University', description: 'Ages 18+' }
];

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
  const [pendingClaims, setPendingClaims] = useState([]);
  const [reviewedClaims, setReviewedClaims] = useState([]);
  const [classAchievements, setClassAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classCode, setClassCode] = useState(FirebaseBackend.getClassCode() || '');
  const [isEditing, setIsEditing] = useState(false);
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [claimFilter, setClaimFilter] = useState('pending'); // pending, approved, rejected, all
  const isOnline = useOnlineStatus();

  // Class settings state
  const [classSettings, setClassSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [exportError, setExportError] = useState(null);

  const isMountedRef = useRef(true);
  const settingsTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, []);

  // Load data from Firebase and local storage
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      // Load from Firebase if available
      if (FirebaseBackend.initialized && isOnline) {
        const [firebaseReflections, firebaseGames, claims, settings, achievements] = await Promise.all([
          FirebaseBackend.getClassReflections(),
          FirebaseBackend.getTopTeams(100),
          FirebaseBackend.getAllSubmittedClaims(),
          FirebaseBackend.getClassSettings(),
          FirebaseBackend.getClassAchievements()
        ]);
        if (isMountedRef.current) {
          setReflections(firebaseReflections);
          setGames(firebaseGames);
          setPendingClaims(claims.filter(c => c.status === 'pending'));
          setReviewedClaims(claims.filter(c => c.status !== 'pending'));
          setClassSettings(settings);
          setClassAchievements(achievements);
        }
      } else {
        // Fallback to local storage
        const localGames = LeaderboardManager.getAll();
        if (isMountedRef.current) {
          setGames(localGames);
          setReflections([]);
          setPendingClaims([]);
          setReviewedClaims([]);
          setClassSettings(FirebaseBackend._getDefaultClassSettings());
          setClassAchievements([]);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (isMountedRef.current) {
        setError('Failed to load data. Please try again.');
        // Fallback to local
        const localGames = LeaderboardManager.getAll();
        setGames(localGames);
        setClassSettings(FirebaseBackend._getDefaultClassSettings());
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isOnline]);

  // Set up real-time listener for pending claims
  useEffect(() => {
    if (!isOnline || !FirebaseBackend.initialized) return;

    const unsubscribe = FirebaseBackend.subscribeToPendingClaims((claims) => {
      if (isMountedRef.current) {
        setPendingClaims(claims);
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  // Set up real-time listener for class achievements
  useEffect(() => {
    if (!isOnline || !FirebaseBackend.initialized) return;

    const unsubscribe = FirebaseBackend.subscribeToClassAchievements((achievements) => {
      if (isMountedRef.current) {
        setClassAchievements(achievements);
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save class settings
  const handleSaveSettings = async () => {
    if (!classSettings || !isMountedRef.current) return;

    setSettingsLoading(true);
    setError(null);

    try {
      const result = await FirebaseBackend.saveClassSettings(classSettings);
      if (!isMountedRef.current) return;

      if (result.success) {
        setSettingsSaved(true);
        if (settingsTimeoutRef.current) clearTimeout(settingsTimeoutRef.current);
        settingsTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) setSettingsSaved(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (e) {
      if (isMountedRef.current) {
        setError('Failed to save settings');
      }
    } finally {
      if (isMountedRef.current) {
        setSettingsLoading(false);
      }
    }
  };

  // Update a specific setting
  const updateSetting = (key, value) => {
    setClassSettings(prev => ({ ...prev, [key]: value }));
    setSettingsSaved(false);
  };

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

  const [reviewLoading, setReviewLoading] = useState(false);

  // Handle claim review (approve/reject)
  const handleReviewClaim = async (claimId, approved) => {
    if (!isMountedRef.current) return;
    setReviewLoading(true);
    setError(null);
    try {
      const result = await FirebaseBackend.reviewClaim(claimId, approved, reviewNote);
      if (!isMountedRef.current) return;

      if (result.success) {
        // Move claim from pending to reviewed
        const claim = pendingClaims.find(c => c.id === claimId);
        if (claim) {
          const updatedClaim = { ...claim, status: approved ? 'approved' : 'rejected', reviewerNote: reviewNote };
          setPendingClaims(prev => prev.filter(c => c.id !== claimId));
          setReviewedClaims(prev => [updatedClaim, ...prev]);
        }
        setReviewingClaim(null);
        setReviewNote('');
      } else {
        setError(result.error || 'Failed to review claim. Please try again.');
      }
    } catch (e) {
      console.warn('Review claim error:', e);
      if (isMountedRef.current) {
        setError('An error occurred. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setReviewLoading(false);
      }
    }
  };

  // Get claims based on filter
  const filteredClaims = useMemo(() => {
    if (claimFilter === 'pending') return pendingClaims;
    if (claimFilter === 'approved') return reviewedClaims.filter(c => c.status === 'approved');
    if (claimFilter === 'rejected') return reviewedClaims.filter(c => c.status === 'rejected');
    return [...pendingClaims, ...reviewedClaims];
  }, [claimFilter, pendingClaims, reviewedClaims]);

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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'games', label: 'Games', icon: '🎮' },
          { id: 'reflections', label: 'Reflections', icon: '🪞' },
          { id: 'claims', label: `Claims${pendingClaims.length > 0 ? ` (${pendingClaims.length})` : ''}`, icon: '📝' },
          { id: 'achievements', label: 'Achievements', icon: '🏆' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
          { id: 'export', label: 'Export', icon: '📥' }
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

      {/* Student Claims Tab */}
      {!loading && activeTab === 'claims' && (
        <div className="animate-in">
          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { id: 'pending', label: 'Pending', count: pendingClaims.length },
              { id: 'approved', label: 'Approved', count: reviewedClaims.filter(c => c.status === 'approved').length },
              { id: 'rejected', label: 'Needs Work', count: reviewedClaims.filter(c => c.status === 'rejected').length },
              { id: 'all', label: 'All', count: pendingClaims.length + reviewedClaims.length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setClaimFilter(filter.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: claimFilter === filter.id ? 'var(--accent-violet)' : 'var(--bg-card)',
                  color: claimFilter === filter.id ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${claimFilter === filter.id ? 'var(--accent-violet)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {filteredClaims.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {claimFilter === 'pending'
                ? 'No pending claims to review.'
                : 'No claims found.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${claim.status === 'approved' ? 'var(--accent-emerald)' : claim.status === 'rejected' ? 'var(--accent-amber)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}
                >
                  {/* Claim Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{claim.submitterAvatar || '🔍'}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {claim.submitterName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(claim.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: claim.answer === 'TRUE' ? 'rgba(52, 211, 153, 0.2)' : claim.answer === 'FALSE' ? 'rgba(251, 113, 133, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                          color: claim.answer === 'TRUE' ? 'var(--accent-emerald)' : claim.answer === 'FALSE' ? 'var(--accent-rose)' : 'var(--accent-amber)'
                        }}
                      >
                        {claim.answer}
                      </span>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {claim.subject}
                      </span>
                    </div>
                  </div>

                  {/* Claim Text */}
                  <div
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      fontSize: '1rem',
                      lineHeight: '1.5'
                    }}
                  >
                    &ldquo;{claim.claimText}&rdquo;
                  </div>

                  {/* Explanation */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Student&apos;s Explanation:
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {claim.explanation}
                    </div>
                  </div>

                  {/* Citation if provided */}
                  {claim.citation && (
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Source:</strong> {claim.citation}
                    </div>
                  )}

                  {/* Error pattern if FALSE */}
                  {claim.answer === 'FALSE' && claim.errorPattern && (
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                      <strong>Error type:</strong> {claim.errorPattern}
                    </div>
                  )}

                  {/* Status badge and review note for reviewed claims */}
                  {claim.status !== 'pending' && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: claim.status === 'approved' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: claim.reviewerNote ? '0.5rem' : 0 }}>
                        <span>{claim.status === 'approved' ? '✅' : '📝'}</span>
                        <span style={{ fontWeight: 600, color: claim.status === 'approved' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          {claim.status === 'approved' ? 'Approved - In game pool' : 'Needs revision'}
                        </span>
                      </div>
                      {claim.reviewerNote && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Your note: {claim.reviewerNote}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Actions for pending claims */}
                  {claim.status === 'pending' && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      {reviewingClaim === claim.id ? (
                        <div>
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              Feedback for student (optional):
                            </label>
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Add feedback or suggestions..."
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                resize: 'vertical',
                                minHeight: '60px'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleReviewClaim(claim.id, true)}
                              disabled={reviewLoading}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'var(--accent-emerald)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: reviewLoading ? 'not-allowed' : 'pointer',
                                opacity: reviewLoading ? 0.6 : 1
                              }}
                            >
                              {reviewLoading ? 'Saving...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleReviewClaim(claim.id, false)}
                              disabled={reviewLoading}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'var(--accent-amber)',
                                color: 'var(--bg-deep)',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: reviewLoading ? 'not-allowed' : 'pointer',
                                opacity: reviewLoading ? 0.6 : 1
                              }}
                            >
                              {reviewLoading ? 'Saving...' : '✎ Needs Work'}
                            </button>
                            <button
                              onClick={() => { setReviewingClaim(null); setReviewNote(''); }}
                              disabled={reviewLoading}
                              style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                cursor: reviewLoading ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setReviewingClaim(claim.id)}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              background: 'var(--accent-violet)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Review This Claim
                          </button>
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

      {/* Achievements Tab */}
      {!loading && activeTab === 'achievements' && (
        <div className="animate-in">
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {classAchievements.length} achievement{classAchievements.length !== 1 ? 's' : ''} earned by your class
            </span>
          </div>

          {classAchievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No achievements earned yet. Students earn achievements by playing games!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classAchievements.map((achievement, i) => (
                <div
                  key={achievement.id || i}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{achievement.achievementIcon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {achievement.achievementName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {achievement.achievementDescription}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Earned by {achievement.playerAvatar} {achievement.playerName} • {formatDate(achievement.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {!loading && activeTab === 'settings' && classSettings && (
        <div className="animate-in">
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}
          >
            <h3 className="mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
              Class Configuration
            </h3>

            {/* Grade Level */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Grade Level
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {GRADE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => updateSetting('gradeLevel', level.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: classSettings.gradeLevel === level.id ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                      color: classSettings.gradeLevel === level.id ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${classSettings.gradeLevel === level.id ? 'var(--accent-violet)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Difficulty */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Default Difficulty
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['easy', 'medium', 'hard', 'mixed'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => updateSetting('defaultDifficulty', diff)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: classSettings.defaultDifficulty === diff ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
                      color: classSettings.defaultDifficulty === diff ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${classSettings.defaultDifficulty === diff ? 'var(--accent-emerald)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds Range */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Rounds Range: {classSettings.minRounds} - {classSettings.maxRounds}
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Min:</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={classSettings.minRounds}
                  onChange={(e) => updateSetting('minRounds', parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Max:</span>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={classSettings.maxRounds}
                  onChange={(e) => updateSetting('maxRounds', parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Subject Filters */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Allowed Subjects {classSettings.allowedSubjects?.length > 0 ? `(${classSettings.allowedSubjects.length} selected)` : '(All)'}
              </label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {ALL_SUBJECTS.map(subject => {
                  const isSelected = classSettings.allowedSubjects?.length === 0 || classSettings.allowedSubjects?.includes(subject);
                  return (
                    <button
                      key={subject}
                      onClick={() => {
                        const current = classSettings.allowedSubjects || [];
                        if (current.length === 0) {
                          // First selection - select only this one
                          updateSetting('allowedSubjects', [subject]);
                        } else if (current.includes(subject)) {
                          // Deselect - if last one, clear to "all"
                          const newSelection = current.filter(s => s !== subject);
                          updateSetting('allowedSubjects', newSelection);
                        } else {
                          // Add to selection
                          updateSetting('allowedSubjects', [...current, subject]);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: isSelected ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                        color: isSelected ? 'var(--bg-deep)' : 'var(--text-muted)',
                        border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border)'}`,
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        cursor: 'pointer'
                      }}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => updateSetting('allowedSubjects', [])}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset to All Subjects
              </button>
            </div>

            {/* Toggles */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Features
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { key: 'allowStudentClaims', label: 'Allow student claim submissions' },
                  { key: 'requireClaimCitation', label: 'Require citation for student claims' },
                  { key: 'showLeaderboard', label: 'Show class leaderboard to students' }
                ].map(toggle => (
                  <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={classSettings[toggle.key]}
                      onChange={(e) => updateSetting(toggle.key, e.target.checked)}
                      style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{toggle.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Custom Welcome Message (optional)
              </label>
              <textarea
                value={classSettings.customMessage || ''}
                onChange={(e) => updateSetting('customMessage', e.target.value)}
                placeholder="Add a message for your students..."
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Button
                onClick={handleSaveSettings}
                disabled={settingsLoading || !isOnline}
              >
                {settingsLoading ? 'Saving...' : settingsSaved ? '✓ Saved!' : 'Save Settings'}
              </Button>
              {!isOnline && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                  Settings require an internet connection to save.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {!loading && activeTab === 'export' && (
        <div className="animate-in">
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}
          >
            <h3 className="mono" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
              Export Class Data
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Download game records, performance data, and student analytics for your class.
            </p>

            {/* Export Options */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <Button
                onClick={async () => {
                  setExportLoading(true);
                  setExportError(null);
                  try {
                    const result = await FirebaseBackend.exportClassData(classCode, 30);
                    if (result.success) {
                      setExportData(result.data);
                    } else {
                      setExportError(result.error || 'Export failed');
                    }
                  } catch (e) {
                    setExportError(e.message);
                  }
                  setExportLoading(false);
                }}
                disabled={exportLoading || !isOnline || !classCode}
              >
                {exportLoading ? 'Loading...' : '📊 Load Export Data (Last 30 Days)'}
              </Button>

              {exportData && (
                <Button
                  onClick={() => {
                    const blob = new Blob([exportData.csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `truth-hunters-${classCode}-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ background: 'var(--accent-emerald)' }}
                >
                  📥 Download CSV
                </Button>
              )}

              <Button
                onClick={async () => {
                  const result = await FirebaseBackend.clearClassSeenClaims(classCode);
                  if (result.success) {
                    alert('Class seen claims cleared! Groups will now get fresh claims.');
                  } else {
                    alert('Failed to clear: ' + (result.error || 'Unknown error'));
                  }
                }}
                disabled={!isOnline || !classCode}
                style={{ background: 'var(--accent-amber)' }}
              >
                🔄 Reset Claim Pool
              </Button>
            </div>

            {exportError && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--incorrect)',
                  borderRadius: '6px',
                  color: 'var(--incorrect)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}
              >
                {exportError}
              </div>
            )}

            {exportData && (
              <div>
                {/* Summary Stats */}
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <h4 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                    Export Summary
                  </h4>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {exportData.summary.totalGames}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Games</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {exportData.summary.avgScore}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Score</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {exportData.summary.avgAccuracy}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Preview Table */}
                <div style={{ overflowX: 'auto' }}>
                  <h4 className="mono" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Preview (First 10 rows)
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Team</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Score</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Accuracy</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.games.slice(0, 10).map((game, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.5rem' }}>{game.timestamp.split('T')[0]}</td>
                          <td style={{ padding: '0.5rem' }}>{game.teamName}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{game.score}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{game.accuracy}%</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{game.difficulty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!classCode && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Set a class code above to enable data export.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
