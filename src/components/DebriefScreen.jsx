/**
 * DEBRIEF SCREEN
 * End-of-game summary with achievements and reflection
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { ACHIEVEMENTS } from '../data/achievements';
import { AI_ERROR_PATTERNS } from '../data/claims';
import { REFLECTION_PROMPTS } from '../data/constants';
import { calculateGameStats } from '../utils/scoring';
import { getRandomItem } from '../utils/helpers';
import { SoundManager } from '../services/sound';

export function DebriefScreen({ team, claims, onRestart, difficulty: _difficulty, teamAvatar: _teamAvatar }) {
  const [showPatterns, setShowPatterns] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [reflectionResponse, setReflectionResponse] = useState('');

  const calibrationBonus = Math.abs(team.score - team.predictedScore) <= 2 ? 3 : 0;
  const finalScore = team.score + calibrationBonus;

  // Calculate comprehensive stats
  const gameStats = useMemo(
    () => calculateGameStats(team.results, claims, team.score, team.predictedScore),
    [team.results, claims, team.score, team.predictedScore]
  );

  // Determine earned achievements
  const earnedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.condition(gameStats)),
    [gameStats]
  );

  // Play achievement sound on mount if achievements earned
  useEffect(() => {
    let timeoutId = null;
    if (earnedAchievements.length > 0) {
      timeoutId = setTimeout(() => SoundManager.play('achievement'), 500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [earnedAchievements.length]);

  // Get random reflection prompt
  const reflectionPrompt = useMemo(() => getRandomItem(REFLECTION_PROMPTS), []);

  const correctCount = team.results.filter((r) => r.correct).length;
  const aiClaims = claims.filter((c) => c.source === 'ai-generated');
  const aiClaimResults = team.results.filter((r) => {
    const claim = claims.find((c) => c.id === r.claimId);
    return claim?.source === 'ai-generated';
  });
  const aiCorrectCount = aiClaimResults.filter((r) => r.correct).length;
  const aiCatchRate = aiClaims.length > 0 ? Math.round((aiCorrectCount / aiClaims.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Final Score */}
      <div
        className="animate-in"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <div
          className="mono"
          style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}
        >
          FINAL SCORE
        </div>
        <div
          className="mono"
          style={{
            fontSize: '4rem',
            fontWeight: 700,
            color: finalScore >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)',
            lineHeight: 1,
            marginBottom: '0.5rem'
          }}
        >
          {finalScore}
        </div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{team.name}</div>

        {calibrationBonus > 0 && (
          <div
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid var(--accent-amber)',
              borderRadius: '8px'
            }}
          >
            <span className="mono" style={{ color: 'var(--accent-amber)' }}>
              +3 CALIBRATION BONUS! 🎯
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div
        className="animate-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}
      >
        {[
          { label: 'Accuracy', value: `${correctCount}/${team.results.length}`, sub: 'correct' },
          { label: 'AI Detection', value: `${aiCatchRate}%`, sub: 'caught' },
          { label: 'Best Streak', value: gameStats.maxStreak, sub: 'in a row' },
          { label: 'Predicted', value: team.predictedScore, sub: 'estimate' }
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.875rem',
              textAlign: 'center'
            }}
          >
            <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
              {stat.label}
            </div>
            <div className="mono" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Achievements Section */}
      {earnedAchievements.length > 0 && (
        <div
          className="animate-in"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
            border: '1px solid var(--accent-amber)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}
        >
          <button
            onClick={() => setShowAchievements(!showAchievements)}
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
            <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)' }}>
              🏆 ACHIEVEMENTS UNLOCKED ({earnedAchievements.length})
            </h3>
            <span style={{ color: 'var(--text-muted)' }}>{showAchievements ? '▲' : '▼'}</span>
          </button>

          {showAchievements && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem'
              }}
            >
              {earnedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="animate-in"
                  style={{
                    padding: '0.875rem',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>{achievement.icon}</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--accent-amber)',
                      marginBottom: '0.25rem'
                    }}
                  >
                    {achievement.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{achievement.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Round Results */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', marginBottom: '1rem' }}>
          ROUND BREAKDOWN
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {team.results.map((result, i) => {
            const claim = claims.find((c) => c.id === result.claimId);
            return (
              <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: result.reasoning ? '0.5rem' : 0
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: result.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      color: result.correct ? 'var(--correct)' : 'var(--incorrect)'
                    }}
                  >
                    {result.correct ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {claim?.text.substring(0, 50)}...
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {result.teamVerdict} • {'●'.repeat(result.confidence)}
                    </div>
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontWeight: 600,
                      flexShrink: 0,
                      color: result.points >= 0 ? 'var(--correct)' : 'var(--incorrect)'
                    }}
                  >
                    {result.points >= 0 ? '+' : ''}
                    {result.points}
                  </div>
                </div>
                {result.reasoning && (
                  <div
                    style={{
                      marginLeft: '2.25rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-card)',
                      borderRadius: '6px',
                      borderLeft: '2px solid var(--accent-cyan)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.25rem' }}>Your reasoning:</span>
                    {result.reasoning}
                  </div>
                )}
                {!result.correct && claim?.explanation && (
                  <div
                    style={{
                      marginLeft: '2.25rem',
                      marginTop: result.reasoning ? '0.375rem' : 0,
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '6px',
                      borderLeft: '2px solid var(--incorrect)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span style={{ color: 'var(--incorrect)', marginRight: '0.25rem' }}>Actually:</span>
                    {claim.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Error Patterns */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-violet)' }}>
            🤖 AI ERROR PATTERNS TO REMEMBER
          </h3>
          <span style={{ color: 'var(--text-muted)' }}>{showPatterns ? '▲' : '▼'}</span>
        </button>

        {showPatterns && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {AI_ERROR_PATTERNS.map((pattern, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--accent-violet)'
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem'
                  }}
                >
                  {pattern.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {pattern.description}
                </div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  e.g., {pattern.example}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reflection Section */}
      <div
        className="animate-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        <h3 className="mono" style={{ fontSize: '0.875rem', color: 'var(--accent-emerald)', marginBottom: '1rem' }}>
          🪞 TEAM REFLECTION
        </h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            How was your confidence calibration?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '📈 Too high', value: 'overconfident' },
              { label: '✅ Just right', value: 'calibrated' },
              { label: '📉 Too low', value: 'underconfident' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedReflection(option.value)}
                style={{
                  padding: '0.5rem 0.875rem',
                  background: selectedReflection === option.value ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
                  color: selectedReflection === option.value ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: `1px solid ${selectedReflection === option.value ? 'var(--accent-emerald)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-elevated)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--accent-emerald)'
          }}
        >
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
            💭 {reflectionPrompt.question}
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginBottom: '0.75rem'
            }}
          >
            {reflectionPrompt.followUp}
          </p>
          <textarea
            value={reflectionResponse}
            onChange={(e) => setReflectionResponse(e.target.value)}
            placeholder="Share your team's thoughts..."
            rows={2}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-serif)',
              resize: 'none'
            }}
          />
        </div>

        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(52, 211, 153, 0.1)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)'
          }}
        >
          <strong style={{ color: 'var(--accent-emerald)' }}>🌱 Growth Mindset:</strong>{' '}
          {gameStats.totalIncorrect > gameStats.totalCorrect
            ? "Mistakes are proof you're trying! Every wrong answer teaches us something new."
            : gameStats.perfectGame
            ? "Amazing work! Stay curious — there's always more to learn."
            : 'Great balance of confidence and caution. Keep questioning everything!'}
        </div>
      </div>

      {/* Actions */}
      <div className="animate-in no-print" style={{ display: 'flex', gap: '1rem' }}>
        <Button onClick={onRestart} fullWidth>
          Play Again
        </Button>
        <Button onClick={() => window.print()} variant="secondary" fullWidth>
          Print Results
        </Button>
      </div>

      {/* Research Attribution */}
      <div
        className="animate-in"
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <strong>Research Base:</strong> Johnson & Johnson (2009) cooperative learning • Wineburg et al. (2022) lateral
        reading • Barzilai & Chinn (2018) epistemic education • Lichtenstein et al. calibration training
      </div>
    </div>
  );
}
