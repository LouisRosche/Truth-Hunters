/**
 * DEBRIEF SCREEN
 * End-of-game summary with achievements and reflection
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';
import { ACHIEVEMENTS } from '../data/achievements';
import { AI_ERROR_PATTERNS } from '../data/claims';
import { REFLECTION_PROMPTS } from '../data/constants';
import { calculateGameStats } from '../utils/scoring';
import { getRandomItem } from '../utils/helpers';
import { SoundManager } from '../services/sound';
import { FirebaseBackend } from '../services/firebase';
import { Analytics, AnalyticsEvents } from '../services/analytics';

export function DebriefScreen({ team, claims, onRestart, difficulty: _difficulty, teamAvatar: _teamAvatar }) {
  const [showPatterns, setShowPatterns] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // 'copied' | 'error' | null
  const isMountedRef = useRef(true);
  const shareTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (shareTimeoutRef.current) {
        clearTimeout(shareTimeoutRef.current);
      }
    };
  }, []);

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

  // Get random reflection prompt (with fallback)
  const reflectionPrompt = useMemo(() => {
    const prompt = getRandomItem(REFLECTION_PROMPTS);
    return prompt || { question: 'What did you learn today?', followUp: 'Discuss with your team.' };
  }, []);

  // Save reflection to Firebase for teacher insights
  const handleSaveReflection = useCallback(async () => {
    if (reflectionSaved || !isMountedRef.current) return;

    const correctCount = team.results.filter((r) => r.correct).length;
    const accuracy = team.results.length > 0
      ? Math.round((correctCount / team.results.length) * 100)
      : 0;

    const reflectionData = {
      teamName: team.name,
      calibrationSelfAssessment: selectedReflection,
      reflectionResponse: reflectionResponse,
      reflectionPrompt: reflectionPrompt?.question || '',
      gameScore: finalScore,
      accuracy: accuracy,
      predictedScore: team.predictedScore,
      actualScore: team.score
    };

    const saved = await FirebaseBackend.saveReflection(reflectionData);
    if (saved && isMountedRef.current) {
      setReflectionSaved(true);
      SoundManager.play('tick');
      // Track reflection submission in analytics
      Analytics.track(AnalyticsEvents.REFLECTION_SUBMITTED);
    }
  }, [team, selectedReflection, reflectionResponse, reflectionPrompt, finalScore, reflectionSaved]);

  // Share results handler
  const handleShare = useCallback(async () => {
    if (!isMountedRef.current) return;

    const correctCount = team.results.filter((r) => r.correct).length;
    const accuracy = team.results.length > 0
      ? Math.round((correctCount / team.results.length) * 100)
      : 0;

    const shareText = `🔍 Truth Hunters Results

Team: ${team.name}
Score: ${finalScore} points${calibrationBonus > 0 ? ' (+3 calibration bonus!)' : ''}
Accuracy: ${correctCount}/${team.results.length} (${accuracy}%)
Best Streak: ${gameStats.maxStreak} in a row
${earnedAchievements.length > 0 ? `Achievements: ${earnedAchievements.map(a => a.icon + ' ' + a.name).join(', ')}` : ''}

Play Truth Hunters and test your fact-checking skills!`;

    try {
      // Try native share first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Truth Hunters Results',
          text: shareText
        });
        if (isMountedRef.current) {
          setShareStatus('shared');
        }
      } else {
        // Fall back to clipboard
        await navigator.clipboard.writeText(shareText);
        if (isMountedRef.current) {
          setShareStatus('copied');
          SoundManager.play('tick');
        }
      }
      // Clear status after 3 seconds
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setShareStatus(null);
      }, 3000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareText);
          if (isMountedRef.current) {
            setShareStatus('copied');
            SoundManager.play('tick');
          }
          if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
          shareTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setShareStatus(null);
          }, 3000);
        } catch {
          if (isMountedRef.current) {
            setShareStatus('error');
          }
          if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
          shareTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setShareStatus(null);
          }, 3000);
        }
      }
    }
  }, [team, finalScore, calibrationBonus, gameStats.maxStreak, earnedAchievements]);

  const correctCount = team.results.filter((r) => r.correct).length;
  const aiClaims = claims.filter((c) => c.source === 'ai-generated');
  const aiClaimResults = team.results.filter((r) => {
    const claim = claims.find((c) => c.id === r.claimId);
    return claim?.source === 'ai-generated';
  });
  const aiCorrectCount = aiClaimResults.filter((r) => r.correct).length;
  const aiCatchRate = aiClaims.length > 0 ? Math.round((aiCorrectCount / aiClaims.length) * 100) : 0;

  return (
    <div className="viewport-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Removed overly aggressive CSS - preserving educational content */}

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

        {calibrationBonus > 0 ? (
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
              +3 PREDICTION BONUS! 🎯
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              You guessed {team.predictedScore} pts and got {team.score} — great self-awareness!
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Predicted: {team.predictedScore} | Actual: {team.score} (off by {Math.abs(team.score - team.predictedScore)})
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
                      {claim?.text ? `${claim.text.substring(0, 50)}...` : 'Unknown claim'}
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
                {claim?.citation && (
                  <div
                    style={{
                      marginLeft: '2.25rem',
                      marginTop: '0.375rem',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    📚 Source:{' '}
                    <a
                      href={claim.citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}
                    >
                      {claim.citation?.length > 50 ? claim.citation.substring(0, 50) + '...' : claim.citation}
                    </a>
                  </div>
                )}
                {claim?.errorPattern && (
                  <div
                    style={{
                      marginLeft: '2.25rem',
                      marginTop: '0.375rem',
                      padding: '0.375rem 0.5rem',
                      background: 'rgba(167, 139, 250, 0.1)',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      color: 'var(--accent-violet)'
                    }}
                  >
                    🤖 Error Pattern: <strong>{AI_ERROR_PATTERNS.find(p => p.id === claim.errorPattern)?.name || claim.errorPattern}</strong>
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
                {pattern.teachingPoint && (
                  <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 500 }}>
                    💡 {pattern.teachingPoint}
                  </div>
                )}
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
            Were you good at knowing when you were right or wrong?
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '📈 Too confident', value: 'overconfident', description: 'I felt sure but was often wrong' },
              { label: '✅ Just right', value: 'calibrated', description: 'My guesses about my accuracy were correct' },
              { label: '📉 Not confident enough', value: 'underconfident', description: 'I doubted myself but was actually right' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedReflection(option.value)}
                aria-pressed={selectedReflection === option.value}
                aria-label={`${option.label} - ${option.description}`}
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
            aria-label="Team reflection response"
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
          {(selectedReflection || reflectionResponse.trim()) && !reflectionSaved && (
            <button
              onClick={handleSaveReflection}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'var(--accent-emerald)',
                color: 'var(--bg-deep)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              💾 Save Reflection
            </button>
          )}
          {reflectionSaved && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(52, 211, 153, 0.15)',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ✓ Reflection saved for your teacher
            </div>
          )}
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
      <div className="animate-in no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button onClick={onRestart} fullWidth>
            Play Again
          </Button>
          <Button onClick={handleShare} variant="secondary" fullWidth>
            {shareStatus === 'copied' ? '✓ Copied!' : shareStatus === 'shared' ? '✓ Shared!' : shareStatus === 'error' ? '✕ Failed' : '📤 Share'}
          </Button>
        </div>
        <Button onClick={() => window.print()} variant="secondary" fullWidth>
          🖨️ Print Results
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

DebriefScreen.propTypes = {
  team: PropTypes.shape({
    name: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    predictedScore: PropTypes.number.isRequired,
    results: PropTypes.arrayOf(PropTypes.shape({
      claimId: PropTypes.string.isRequired,
      correct: PropTypes.bool.isRequired,
      points: PropTypes.number.isRequired,
      teamVerdict: PropTypes.string.isRequired,
      confidence: PropTypes.number.isRequired,
      reasoning: PropTypes.string
    })).isRequired,
    players: PropTypes.arrayOf(PropTypes.shape({
      firstName: PropTypes.string,
      lastInitial: PropTypes.string
    }))
  }).isRequired,
  claims: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    source: PropTypes.string,
    explanation: PropTypes.string,
    citation: PropTypes.string,
    errorPattern: PropTypes.string
  })).isRequired,
  onRestart: PropTypes.func.isRequired,
  difficulty: PropTypes.string,
  teamAvatar: PropTypes.shape({
    emoji: PropTypes.string,
    name: PropTypes.string
  })
};

DebriefScreen.defaultProps = {
  difficulty: 'mixed',
  teamAvatar: null
};
