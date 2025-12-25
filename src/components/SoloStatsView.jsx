/**
 * SOLO STATS VIEW
 * Personal statistics dashboard for solo players
 * Shows lifetime progress, achievements, and areas to improve
 */

import { useState, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { PlayerProfile } from '../services/playerProfile';
import {
  LIFETIME_ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  getAllEarnedLifetimeAchievements
} from '../data/achievements';
import { AI_ERROR_PATTERNS } from '../data/claims';

function SoloStatsViewComponent({ onBack, onQuickStart }) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = useMemo(() => PlayerProfile.getDisplayStats(), []);

  const earnedAchievements = useMemo(() => {
    const profileData = PlayerProfile.get();
    return getAllEarnedLifetimeAchievements({
      ...profileData.stats,
      subjectStats: profileData.subjectStats,
      claimsSeen: profileData.claimsSeen.length
    });
  }, []);

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const groups = {};
    LIFETIME_ACHIEVEMENTS.forEach(a => {
      const cat = a.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        ...a,
        earned: earnedAchievements.some(ea => ea.id === a.id)
      });
    });
    return groups;
  }, [earnedAchievements]);

  // Calculate next milestones
  const nextMilestones = useMemo(() => {
    const milestones = [];

    // Games milestone
    const gameTargets = [1, 10, 25, 50, 100];
    const nextGameTarget = gameTargets.find(t => t > stats.totalGames);
    if (nextGameTarget) {
      milestones.push({
        label: `${nextGameTarget} games`,
        current: stats.totalGames,
        target: nextGameTarget,
        icon: '🎮'
      });
    }

    // Correct answers milestone
    const correctTargets = [100, 500, 1000];
    const nextCorrectTarget = correctTargets.find(t => t > stats.totalCorrect);
    if (nextCorrectTarget) {
      milestones.push({
        label: `${nextCorrectTarget} correct`,
        current: stats.totalCorrect,
        target: nextCorrectTarget,
        icon: '💯'
      });
    }

    // Claims seen
    if (stats.claimsSeen < stats.totalClaims) {
      milestones.push({
        label: 'See all claims',
        current: stats.claimsSeen,
        target: stats.totalClaims,
        icon: '🗺️'
      });
    }

    return milestones.slice(0, 3);
  }, [stats]);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'history', label: 'History', icon: '📈' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div className="animate-in" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {stats.avatar?.emoji || '🎯'}
        </div>
        <h1 className="mono" style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--accent-cyan)',
          marginBottom: '0.25rem'
        }}>
          {stats.playerName || 'Solo Hunter'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Last played: {formatTimeAgo(stats.lastPlayedAt)}
        </p>

        {/* Day streak badge */}
        {stats.currentDayStreak > 0 && (
          <div style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.375rem 0.75rem',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '20px',
            fontSize: '0.8125rem',
            color: 'var(--accent-amber)'
          }}>
            🔥 {stats.currentDayStreak} day streak
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="animate-in" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="mono"
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--bg-card)',
              color: activeTab === tab.id ? 'var(--bg-deep)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Stats Grid */}
          <div className="animate-in" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem'
          }}>
            {[
              { label: 'Games Played', value: stats.totalGames, icon: '🎮' },
              { label: 'Total Correct', value: stats.totalCorrect, icon: '✓' },
              { label: 'Accuracy', value: `${stats.accuracy}%`, icon: '🎯' },
              { label: 'Best Score', value: stats.bestScore, icon: '⭐' },
              { label: 'Best Streak', value: stats.bestStreak, icon: '🔥' },
              { label: 'Total Points', value: stats.totalPoints, icon: '💎' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div className="mono" style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  {stat.value}
                </div>
                <div className="mono" style={{
                  fontSize: '0.625rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Next Milestones */}
          {nextMilestones.length > 0 && (
            <div className="animate-in" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: 'var(--accent-amber)',
                marginBottom: '0.75rem'
              }}>
                NEXT MILESTONES
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {nextMilestones.map((milestone, i) => (
                  <div key={i}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {milestone.icon} {milestone.label}
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {milestone.current}/{milestone.target}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      background: 'var(--bg-elevated)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((milestone.current / milestone.target) * 100, 100)}%`,
                        background: 'var(--accent-cyan)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calibration Stats */}
          {stats.totalPredictions > 0 && (
            <div className="animate-in" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: 'var(--accent-violet)',
                marginBottom: '0.75rem'
              }}>
                CALIBRATION
              </h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-violet)' }}>
                    {stats.calibrationRate}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Predictions within +/-2
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.highConfAccuracy}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    High-confidence accuracy
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievement Summary */}
          <div className="animate-in" style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)' }}>
                  🏆 ACHIEVEMENTS
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {earnedAchievements.length} of {LIFETIME_ACHIEVEMENTS.length} unlocked
                </p>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                maxWidth: '150px',
                justifyContent: 'flex-end'
              }}>
                {earnedAchievements.slice(0, 6).map(a => (
                  <span key={a.id} title={a.name} style={{ fontSize: '1.25rem' }}>{a.icon}</span>
                ))}
                {earnedAchievements.length > 6 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    +{earnedAchievements.length - 6}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <>
          {/* Best Subjects */}
          {stats.bestSubjects.length > 0 && (
            <div className="animate-in" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: 'var(--accent-emerald)',
                marginBottom: '0.75rem'
              }}>
                YOUR STRENGTHS
              </h3>
              {stats.bestSubjects.map((subject, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: i < stats.bestSubjects.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {subject.name}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({subject.correct}/{subject.total})
                    </span>
                  </div>
                  <span className="mono" style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--accent-emerald)'
                  }}>
                    {subject.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Needs Work */}
          {stats.worstSubjects.length > 0 && stats.worstSubjects[0].accuracy < 70 && (
            <div className="animate-in" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: 'var(--accent-rose)',
                marginBottom: '0.75rem'
              }}>
                AREAS TO IMPROVE
              </h3>
              {stats.worstSubjects.filter(s => s.accuracy < 70).map((subject, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: i < stats.worstSubjects.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {subject.name}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({subject.correct}/{subject.total})
                    </span>
                  </div>
                  <span className="mono" style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--accent-rose)'
                  }}>
                    {subject.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error Patterns */}
          {stats.hardestPatterns.length > 0 && (
            <div className="animate-in" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: 'var(--accent-violet)',
                marginBottom: '0.75rem'
              }}>
                TRICKY ERROR PATTERNS
              </h3>
              {stats.hardestPatterns.map((pattern, i) => {
                const patternInfo = AI_ERROR_PATTERNS.find(p => p.id === pattern.id);
                return (
                  <div key={i} style={{
                    padding: '0.75rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    marginBottom: i < stats.hardestPatterns.length - 1 ? '0.5rem' : 0
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {patternInfo?.name || pattern.id}
                      </span>
                      <span className="mono" style={{
                        fontSize: '0.75rem',
                        color: pattern.catchRate < 50 ? 'var(--accent-rose)' : 'var(--accent-amber)'
                      }}>
                        {pattern.catchRate}% caught
                      </span>
                    </div>
                    {patternInfo?.teachingPoint && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tip: {patternInfo.teachingPoint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {stats.subjectCount === 0 && (
            <div className="animate-in" style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
              <p>Play some games to see your subject performance!</p>
            </div>
          )}
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="animate-in">
          {Object.entries(achievementsByCategory).map(([category, achievements]) => (
            <div key={category} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}>
              <h3 className="mono" style={{
                fontSize: '0.75rem',
                color: ACHIEVEMENT_CATEGORIES[category]?.color || 'var(--text-muted)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                {ACHIEVEMENT_CATEGORIES[category]?.icon} {ACHIEVEMENT_CATEGORIES[category]?.name || category.toUpperCase()}
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {achievements.filter(a => a.earned).length}/{achievements.length}
                </span>
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.5rem'
              }}>
                {achievements.map(achievement => (
                  <div key={achievement.id} style={{
                    padding: '0.75rem',
                    background: achievement.earned ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    opacity: achievement.earned ? 1 : 0.4,
                    border: achievement.earned ? '1px solid var(--accent-amber)' : '1px dashed var(--border)'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                      {achievement.earned ? achievement.icon : '🔒'}
                    </div>
                    <div className="mono" style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: achievement.earned ? 'var(--accent-amber)' : 'var(--text-muted)',
                      marginBottom: '0.125rem'
                    }}>
                      {achievement.name}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {achievement.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="animate-in">
          {stats.recentGames.length > 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {stats.recentGames.map((game, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  borderBottom: i < stats.recentGames.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div>
                    <div className="mono" style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: game.score >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)'
                    }}>
                      {game.score >= 0 ? '+' : ''}{game.score} pts
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {game.correct}/{game.rounds} correct
                      {game.maxStreak > 2 && ` • ${game.maxStreak} streak`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatTimeAgo(game.timestamp)}
                    </div>
                    {game.achievements && game.achievements.length > 0 && (
                      <div style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>
                        {game.achievements.slice(0, 3).map((a, j) => (
                          <span key={j} style={{ marginLeft: '0.125rem' }}>🏆</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <p>No games played yet. Start your journey!</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="animate-in" style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1.5rem'
      }}>
        <Button onClick={onBack} variant="secondary" fullWidth>
          Back
        </Button>
        <Button onClick={onQuickStart} fullWidth>
          Play Now
        </Button>
      </div>
    </div>
  );
}


SoloStatsViewComponent.propTypes = {
  onBack: PropTypes.func.isRequired,
  onQuickStart: PropTypes.func.isRequired
};

// Memoize to prevent re-renders - important for stats-heavy dashboard
export const SoloStatsView = memo(SoloStatsViewComponent);
export default SoloStatsView;
