/**
 * TEACHER DASHBOARD COMPONENT
 * Teacher-facing dashboard with class stats, reflections, claim moderation, and settings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FirebaseBackend } from '../services/firebase';
import { LeaderboardManager } from '../services/leaderboard';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getSubjects } from '../data/claims';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'games', label: '🎮 Games' },
  { id: 'reflections', label: '🪞 Reflections' },
  { id: 'claims', label: '📝 Claims' },
  { id: 'achievements', label: '🏆 Achievements' },
  { id: 'settings', label: '⚙️ Settings' }
];

export function TeacherDashboard({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [classCode, setClassCode] = useState('');
  const [editingClassCode, setEditingClassCode] = useState(false);
  const [editClassCodeValue, setEditClassCodeValue] = useState('');
  const [reflections, setReflections] = useState([]);
  const [games, setGames] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [classSettings, setClassSettings] = useState(null);
  const [classAchievements, setClassAchievements] = useState([]);
  const [claimFilter, setClaimFilter] = useState('pending');
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const isOnline = useOnlineStatus();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubClaims = FirebaseBackend.subscribeToPendingClaims((claims) => {
      if (isMountedRef.current) setPendingClaims(claims);
    });
    const unsubAchievements = FirebaseBackend.subscribeToClassAchievements((achievements) => {
      if (isMountedRef.current) setClassAchievements(achievements);
    });
    return () => {
      if (unsubClaims) unsubClaims();
      if (unsubAchievements) unsubAchievements();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const code = FirebaseBackend.getClassCode();
      setClassCode(code || '');
      setEditClassCodeValue(code || '');

      if (isOnline) {
        const [reflectionsData, gamesData, settings] = await Promise.all([
          FirebaseBackend.getClassReflections(),
          FirebaseBackend.getTopTeams(),
          FirebaseBackend.getClassSettings()
        ]);
        if (isMountedRef.current) {
          setReflections(reflectionsData || []);
          setGames(gamesData || []);
          setClassSettings(settings || FirebaseBackend._getDefaultClassSettings());
        }
      } else {
        // Fallback to local storage
        const localGames = LeaderboardManager.getAll();
        if (isMountedRef.current) {
          setGames(localGames || []);
          setClassSettings(FirebaseBackend._getDefaultClassSettings());
        }
      }

      if (isMountedRef.current) setLoading(false);
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleSaveClassCode = () => {
    FirebaseBackend.setClassCode(editClassCodeValue);
    setClassCode(editClassCodeValue);
    setEditingClassCode(false);
  };

  const handleReviewClaim = async (claimId, approved) => {
    const feedback = approved ? 'Approved' : 'Needs revision';
    await FirebaseBackend.reviewClaim(claimId, approved, feedback);
    setReviewingClaim(null);
  };

  const handleSaveSettings = async () => {
    await FirebaseBackend.saveClassSettings(classSettings);
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div>
        <div>{error}</div>
        <button onClick={onBack} aria-label="back">← Back</button>
      </div>
    );
  }

  // Compute stats
  const totalGames = games.length;
  const uniqueTeams = new Set(games.map(g => g.teamName)).size;
  const avgScore = games.length > 0
    ? (games.reduce((sum, g) => sum + g.score, 0) / games.length)
    : 0;

  const filteredClaims = claimFilter === 'all'
    ? pendingClaims
    : pendingClaims.filter(c => {
      if (claimFilter === 'pending') return !c.status || c.status === 'pending';
      if (claimFilter === 'approved') return c.status === 'approved';
      if (claimFilter === 'needswork') return c.status === 'rejected' || c.status === 'needswork';
      return true;
    });

  const pendingCount = pendingClaims.filter(c => !c.status || c.status === 'pending').length;
  const approvedCount = pendingClaims.filter(c => c.status === 'approved').length;
  const needsWorkCount = pendingClaims.filter(c => c.status === 'rejected' || c.status === 'needswork').length;

  const subjects = getSubjects();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={onBack} aria-label="back">← Back</button>
        <h1>Teacher Dashboard</h1>
        {!isOnline && <span>Offline Mode</span>}
      </div>

      {/* Welcome Banner */}
      <div style={{ marginBottom: '1rem' }}>
        <h2>Teacher Dashboard</h2>
        {/* Class Code Display */}
        <div>
          <span>{classCode}</span>
          {!editingClassCode ? (
            <button onClick={() => setEditingClassCode(true)} aria-label="change">Change</button>
          ) : (
            <div>
              <input
                value={editClassCodeValue}
                onChange={(e) => setEditClassCodeValue(e.target.value)}
              />
              <button onClick={handleSaveClassCode} aria-label="save">Save</button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div><div>Total Games</div><div>{totalGames}</div></div>
            <div><div>Unique Teams</div><div>{uniqueTeams}</div></div>
            <div><div>Avg Score</div><div>{avgScore}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Game History</h3>
            <button onClick={() => exportCSV(games, 'games.csv')}>📥 Export CSV</button>
          </div>
          {games.map((game, i) => (
            <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '0.5rem' }}>
              <div>{game.teamAvatar} {game.teamName}</div>
              <div>Score: {game.score} | Accuracy: {game.accuracy}%</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reflections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Student Reflections</h3>
            <button onClick={() => exportCSV(reflections, 'reflections.csv')}>📥 Export CSV</button>
          </div>
          {reflections.map((ref, i) => (
            <div key={ref.id || i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '0.5rem' }}>
              <div><strong>{ref.teamName}</strong></div>
              <div>{ref.reflectionResponse}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(ref.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'claims' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => setClaimFilter('pending')}>Pending ({pendingCount})</button>
            <button onClick={() => setClaimFilter('approved')}>Approved ({approvedCount})</button>
            <button onClick={() => setClaimFilter('needswork')}>Needs Work ({needsWorkCount})</button>
            <button onClick={() => setClaimFilter('all')}>All ({pendingClaims.length})</button>
          </div>
          {filteredClaims.map((claim) => (
            <div key={claim.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '0.5rem' }}>
              <div>{claim.claimText}</div>
              <div>{claim.subject} - {claim.submitterAvatar} {claim.submitterName}</div>
              {reviewingClaim === claim.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => handleReviewClaim(claim.id, true)}>✓ Approve</button>
                  <button onClick={() => handleReviewClaim(claim.id, false)}>✎ Needs Work</button>
                </div>
              ) : (
                <button onClick={() => setReviewingClaim(claim.id)}>Review This Claim</button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div>
          <p>Achievements earned by your class</p>
          {classAchievements.map((ach, i) => (
            <div key={ach.id || i}>
              <span>{ach.achievementIcon}</span> {ach.achievementName} - {ach.playerName}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <h3>Class Configuration</h3>
          {classSettings && (
            <div>
              <div>
                <label>Grade Level</label>
                <div>{classSettings.gradeLevel}</div>
              </div>
              <div>
                <label>Default Difficulty</label>
                <div>
                  {['easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setClassSettings({ ...classSettings, defaultDifficulty: d })}
                      style={{
                        background: classSettings.defaultDifficulty === d ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                        margin: '0.25rem'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label>Allowed Subjects</label>
                <div>
                  {subjects.map(s => (
                    <button key={s}>{s}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveSettings}>Save Settings</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
