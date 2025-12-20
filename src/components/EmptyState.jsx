/**
 * EMPTY STATE COMPONENT
 * S-tier UX: Helpful messages with actionable next steps
 */

import PropTypes from 'prop-types';
import { Button } from './Button';

export function EmptyState({ type, onAction }) {
  const states = {
    noGames: {
      emoji: '🎮',
      title: 'No games played yet',
      message: 'Start your first game to begin your fact-checking journey!',
      actionText: 'Start New Game',
      helpText: 'Tip: Choose "Easy" difficulty if you\'re new to fact-checking'
    },
    noLeaderboard: {
      emoji: '🏆',
      title: 'Leaderboard is empty',
      message: 'Be the first team to appear on the leaderboard!',
      actionText: 'Play a Game',
      helpText: 'Complete a game to earn your spot on the board'
    },
    noReflections: {
      emoji: '💭',
      title: 'No reflections yet',
      message: 'Students haven\'t shared their thoughts yet.',
      actionText: null,
      helpText: 'Reflections appear here after students complete games'
    },
    noAchievements: {
      emoji: '🌟',
      title: 'No achievements yet',
      message: 'Keep playing to unlock achievements!',
      actionText: 'View All Achievements',
      helpText: '9 achievements available: Perfect Game, AI Detective, Calibration Master, and more'
    },
    offline: {
      emoji: '📡',
      title: 'You\'re offline',
      message: 'Don\'t worry! You can still play using local data.',
      actionText: 'Continue Offline',
      helpText: 'Your progress will sync when you\'re back online'
    },
    noClaims: {
      emoji: '📋',
      title: 'No claims available',
      message: 'Unable to load claims for this subject/difficulty.',
      actionText: 'Try Different Settings',
      helpText: 'Try selecting a different subject or difficulty level'
    },
    error: {
      emoji: '⚠️',
      title: 'Something went wrong',
      message: 'We encountered an error loading this content.',
      actionText: 'Try Again',
      helpText: 'If the problem persists, try refreshing the page'
    }
  };

  const state = states[type] || states.error;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        minHeight: '300px'
      }}
    >
      {/* Emoji Icon */}
      <div
        style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          opacity: 0.9
        }}
        aria-hidden="true"
      >
        {state.emoji}
      </div>

      {/* Title */}
      <h3
        className="mono"
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}
      >
        {state.title}
      </h3>

      {/* Message */}
      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          maxWidth: '400px',
          lineHeight: 1.6
        }}
      >
        {state.message}
      </p>

      {/* Help Text */}
      {state.helpText && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            maxWidth: '380px',
            padding: '0.75rem 1rem',
            background: 'var(--bg-elevated)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}
        >
          💡 {state.helpText}
        </p>
      )}

      {/* Action Button */}
      {state.actionText && onAction && (
        <Button
          onClick={onAction}
          variant="primary"
          size="lg"
          style={{
            minWidth: '200px'
          }}
        >
          {state.actionText}
        </Button>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  type: PropTypes.oneOf([
    'noGames',
    'noLeaderboard',
    'noReflections',
    'noAchievements',
    'offline',
    'noClaims',
    'error'
  ]).isRequired,
  onAction: PropTypes.func
};
