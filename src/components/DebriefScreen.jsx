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

export function DebriefScreen({ team, claims, onRestart, difficulty: _difficulty, teamAvatar: _teamAvatar }) {
  const [showPatterns, setShowPatterns] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);
  const [selectedReflection, setSelectedReflection] = useState(null);
  const [reflectionResponse, setReflectionResponse] = useState('');
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
    <div className="viewport-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0.5rem',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Single-viewport CSS - NO scrolling, everything must fit */}

      {/* Final Score - CELEBRATORY */}
      <div
        className="animate-celebrate"
        style={{
          background: finalScore >= 0
            ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)'
            : 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
          border: `3px solid ${finalScore >= 0 ? 'var(--accent-cyan)' : 'var(--border)'}`,
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          boxShadow: finalScore >= 0 ? '0 8px 24px rgba(34, 211, 238, 0.2)' : 'none'
        }}
      >
        <div
          className="mono"
          style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em', fontWeight: 600 }}
        >
          FINAL SCORE
        </div>
        <div
          className="mono"
          style={{
            fontSize: '5rem',
            fontWeight: 700,
            color: finalScore >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)',
            lineHeight: 1,
            marginBottom: '0.75rem',
            textShadow: finalScore >= 0 ? '0 2px 8px rgba(34, 211, 238, 0.3)' : 'none'
          }}
        >
          {finalScore}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>{team.name}</div>

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
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
              {stat.label}
            </div>
            <div className="mono" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Achievements Section - REDESIGNED */}
      {(() => {
        // Rarity mapping for achievement visual tiers
        const ACHIEVEMENT_RARITY = {
          'first-truth': 'common',
          'team-player': 'common',
          'streak-3': 'rare',
          'ai-detector': 'rare',
          'humble-learner': 'rare',
          'streak-5': 'epic',
          'risk-taker': 'epic',
          'myth-buster': 'epic',
          'mixed-master': 'epic',
          'calibrated': 'epic',
          'perfect-round': 'legendary',
          'comeback-kid': 'legendary'
        };

        const RARITY_STYLES = {
          common: {
            border: '2px solid var(--border)',
            boxShadow: 'none',
            glowColor: 'transparent',
            label: 'Common',
            labelColor: 'var(--text-muted)'
          },
          rare: {
            border: '2px solid rgba(34, 211, 238, 0.6)',
            boxShadow: '0 0 12px rgba(34, 211, 238, 0.3), inset 0 0 12px rgba(34, 211, 238, 0.05)',
            glowColor: 'rgba(34, 211, 238, 0.15)',
            label: 'Rare',
            labelColor: 'var(--accent-cyan)'
          },
          epic: {
            border: '2px solid rgba(167, 139, 250, 0.7)',
            boxShadow: '0 0 16px rgba(167, 139, 250, 0.35), inset 0 0 16px rgba(167, 139, 250, 0.05)',
            glowColor: 'rgba(167, 139, 250, 0.15)',
            label: 'Epic',
            labelColor: 'var(--accent-violet)'
          },
          legendary: {
            border: '2px solid rgba(251, 191, 36, 0.8)',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.15), inset 0 0 20px rgba(251, 191, 36, 0.05)',
            glowColor: 'rgba(251, 191, 36, 0.2)',
            label: 'Legendary',
            labelColor: 'var(--accent-amber)'
          }
        };

        // Calculate near-miss achievements
        const nearMissAchievements = ACHIEVEMENTS
          .filter(a => !a.condition(gameStats))
          .map(a => {
            let progress = 0;
            let current = 0;
            let target = 0;
            let progressLabel = '';

            switch (a.id) {
              case 'streak-3':
                current = gameStats.maxStreak;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 streak`;
                break;
              case 'streak-5':
                current = gameStats.maxStreak;
                target = 5;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/5 streak`;
                break;
              case 'ai-detector':
                current = gameStats.aiCaughtCorrect || 0;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 AI caught`;
                break;
              case 'calibrated': {
                const diff = Math.abs(gameStats.actualScore - gameStats.predictedScore);
                if (diff <= 7) {
                  progress = Math.max(0, 1 - ((diff - 2) / 5));
                  progressLabel = `off by ${diff} (need ±2)`;
                }
                break;
              }
              case 'humble-learner':
                current = gameStats.humbleCorrect || 0;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 humble wins`;
                break;
              case 'risk-taker':
                current = gameStats.boldCorrect || 0;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 bold wins`;
                break;
              case 'myth-buster':
                current = gameStats.mythsBusted || 0;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 myths busted`;
                break;
              case 'mixed-master':
                current = gameStats.mixedCorrect || 0;
                target = 3;
                progress = current >= 1 ? current / target : 0;
                progressLabel = `${current}/3 mixed correct`;
                break;
              case 'perfect-round':
                current = gameStats.totalCorrect || 0;
                target = gameStats.totalCorrect + gameStats.totalIncorrect || 1;
                progress = target > 0 ? current / target : 0;
                if (gameStats.totalIncorrect > 0) {
                  progressLabel = `${current}/${target} correct`;
                }
                break;
              case 'first-truth':
                current = gameStats.totalCorrect || 0;
                target = 1;
                progress = 0;
                break;
              case 'team-player':
                progress = 0;
                break;
              case 'comeback-kid':
                if (gameStats.lowestScore < 0 && !gameStats.comeback) {
                  progress = 0.5;
                  progressLabel = 'went negative but didn\'t recover';
                }
                break;
              default:
                break;
            }

            return { ...a, progress: Math.min(progress, 0.99), progressLabel };
          })
          .filter(a => a.progress > 0)
          .sort((a, b) => b.progress - a.progress);

        // Shimmer keyframes injected via style tag
        const shimmerStyle = `
          @keyframes achievementShimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes legendaryPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.15); }
            50% { box-shadow: 0 0 28px rgba(251, 191, 36, 0.6), 0 0 56px rgba(251, 191, 36, 0.25); }
          }
          @keyframes trophyBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15) rotate(-5deg); }
          }
        `;

        // Don't render section if nothing to show
        if (earnedAchievements.length === 0 && nearMissAchievements.length === 0) {
          return null;
        }

        return (
          <>
            <style>{shimmerStyle}</style>
            <div
              className="animate-celebrate"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(167, 139, 250, 0.12) 50%, rgba(34, 211, 238, 0.12) 100%)',
                border: '3px solid var(--accent-amber)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 8px 24px rgba(251, 191, 36, 0.2)'
              }}
            >
              {/* Header with animated trophy and count */}
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
                  padding: 0,
                  marginBottom: showAchievements ? '1.25rem' : 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '2rem',
                    animation: earnedAchievements.length > 0 ? 'trophyBounce 2s ease-in-out infinite' : 'none',
                    display: 'inline-block'
                  }}>
                    🏆
                  </span>
                  <div style={{ textAlign: 'left' }}>
                    <h3 className="mono" style={{ fontSize: '1.125rem', color: 'var(--accent-amber)', fontWeight: 700, margin: 0 }}>
                      ACHIEVEMENTS UNLOCKED
                    </h3>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {earnedAchievements.length} of {ACHIEVEMENTS.length} earned
                      {nearMissAchievements.length > 0 && ` · ${nearMissAchievements.length} almost there`}
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>{showAchievements ? '▲' : '▼'}</span>
              </button>

              {showAchievements && (
                <>
                  {/* Earned Achievements Grid */}
                  {earnedAchievements.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.875rem'
                      }}
                    >
                      {earnedAchievements.map((achievement, idx) => {
                        const rarity = ACHIEVEMENT_RARITY[achievement.id] || 'common';
                        const rarityStyle = RARITY_STYLES[rarity];
                        const isLegendary = rarity === 'legendary';

                        return (
                          <div
                            key={achievement.id}
                            className="animate-bounce-in"
                            style={{
                              padding: '1.25rem 1rem',
                              background: `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)`,
                              borderRadius: '14px',
                              textAlign: 'center',
                              border: rarityStyle.border,
                              boxShadow: rarityStyle.boxShadow,
                              transform: 'scale(1)',
                              transition: 'all 0.3s ease',
                              animationDelay: `${idx * 0.1}s`,
                              position: 'relative',
                              overflow: 'hidden',
                              ...(isLegendary ? { animation: 'legendaryPulse 3s ease-in-out infinite' } : {})
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {/* Shimmer overlay */}
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(110deg, transparent 30%, ${rarityStyle.glowColor} 50%, transparent 70%)`,
                              backgroundSize: '200% 100%',
                              animation: 'achievementShimmer 3s ease-in-out infinite',
                              pointerEvents: 'none',
                              borderRadius: '14px'
                            }} />

                            {/* Rarity label */}
                            {rarity !== 'common' && (
                              <div className="mono" style={{
                                position: 'absolute',
                                top: '0.375rem',
                                right: '0.5rem',
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                color: rarityStyle.labelColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                opacity: 0.8
                              }}>
                                {rarityStyle.label}
                              </div>
                            )}

                            {/* Icon with circular background */}
                            <div style={{
                              width: '4rem',
                              height: '4rem',
                              borderRadius: '50%',
                              background: rarityStyle.glowColor || 'var(--bg-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 0.625rem',
                              border: `1px solid ${rarityStyle.glowColor || 'var(--border)'}`,
                              position: 'relative'
                            }}>
                              <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>
                                {achievement.icon}
                              </span>
                            </div>

                            {/* Achievement name */}
                            <div
                              className="mono"
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: 700,
                                color: rarityStyle.labelColor || 'var(--text-primary)',
                                marginBottom: '0.25rem',
                                position: 'relative'
                              }}
                            >
                              {achievement.name}
                            </div>

                            {/* Description */}
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                              position: 'relative'
                            }}>
                              {achievement.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {earnedAchievements.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1.5rem 1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem'
                    }}>
                      No achievements earned yet — keep playing to unlock them!
                    </div>
                  )}

                  {/* Near-Miss / Almost Earned Section */}
                  {nearMissAchievements.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div className="mono" style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>🔓</span>
                        ALMOST EARNED — SO CLOSE!
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem'
                      }}>
                        {nearMissAchievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="animate-in"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              background: 'var(--bg-card)',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              opacity: 0.85
                            }}
                          >
                            {/* Icon */}
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'var(--bg-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              filter: 'grayscale(0.5)',
                              border: '1px solid var(--border)'
                            }}>
                              <span style={{ fontSize: '1.375rem', lineHeight: 1 }}>
                                {achievement.icon}
                              </span>
                            </div>

                            {/* Info + progress bar */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                                marginBottom: '0.25rem'
                              }}>
                                <div className="mono" style={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 600,
                                  color: 'var(--text-secondary)'
                                }}>
                                  {achievement.name}
                                </div>
                                <div className="mono" style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                  marginLeft: '0.5rem'
                                }}>
                                  {achievement.progressLabel}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div style={{
                                height: '6px',
                                background: 'var(--bg-elevated)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.round(achievement.progress * 100)}%`,
                                  background: achievement.progress >= 0.75
                                    ? 'linear-gradient(90deg, var(--accent-amber), var(--accent-amber))'
                                    : achievement.progress >= 0.5
                                    ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-cyan))'
                                    : 'var(--text-muted)',
                                  borderRadius: '3px',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        );
      })()}

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
                      fontSize: '0.75rem',
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
                      fontSize: '0.75rem',
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
