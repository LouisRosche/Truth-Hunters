/**
 * GAME INTEGRITY HOOK
 * Tracks tab visibility and detects potential cheating attempts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ANTI_CHEAT } from '../data/constants';
import { logger } from '../utils/logger';

/**
 * Hook to track game integrity and prevent cheating
 * @param {boolean} isActive - Whether integrity tracking is active
 * @param {Function} onTabSwitch - Callback when tab is switched away
 * @param {Function} onForfeit - Callback when max tab switches exceeded
 * @returns {Object} Integrity tracking data
 */
export function useGameIntegrity(isActive = false, onTabSwitch = null, onForfeit = null) {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isForfeit, setIsForfeit] = useState(false);
  const [totalTimeHidden, setTotalTimeHidden] = useState(0);

  const hiddenStartTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (!isActive || !ANTI_CHEAT.ENABLED || !ANTI_CHEAT.TAB_VISIBILITY_TRACKING) return;
    if (!isMountedRef.current) return;

    const isHidden = document.hidden;
    const now = Date.now();

    if (isHidden && !hiddenStartTimeRef.current) {
      // Tab just became hidden
      hiddenStartTimeRef.current = now;
      setIsTabVisible(false);
      logger.warn('Tab switched away during game');

      // Increment switch counter
      setTabSwitches(prev => {
        const newCount = prev + 1;

        // Trigger callback
        if (onTabSwitch) {
          onTabSwitch(newCount);
        }

        // Check if exceeded max switches
        if (newCount > ANTI_CHEAT.MAX_TAB_SWITCHES_PER_ROUND) {
          logger.warn('Max tab switches exceeded - forfeiting round');
          setIsForfeit(true);
          if (onForfeit) {
            onForfeit();
          }
        }

        return newCount;
      });
    } else if (!isHidden && hiddenStartTimeRef.current) {
      // Tab just became visible again
      const hiddenDuration = now - hiddenStartTimeRef.current;
      setTotalTimeHidden(prev => prev + hiddenDuration);
      hiddenStartTimeRef.current = null;
      setIsTabVisible(true);
      logger.log(`Tab visible again (was hidden for ${hiddenDuration}ms)`);
    }
  }, [isActive, onTabSwitch, onForfeit]);

  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Note: We DON'T track blur/focus because they fire on non-tab events
    // (clicking dev tools, iframes, address bar, etc) which would false-positive

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, handleVisibilityChange]);

  const reset = useCallback(() => {
    setTabSwitches(0);
    setIsForfeit(false);
    setTotalTimeHidden(0);
    hiddenStartTimeRef.current = null;
  }, []);

  return {
    tabSwitches,
    isTabVisible,
    isForfeit,
    totalTimeHidden,
    reset,
    // Helper flags
    hasWarning: tabSwitches > 0 && tabSwitches <= ANTI_CHEAT.MAX_TAB_SWITCHES_PER_ROUND,
    isNearForfeit: tabSwitches >= ANTI_CHEAT.MAX_TAB_SWITCHES_PER_ROUND,
    // Penalty calculation: use forfeit penalty if any switches occurred, otherwise 0
    penalty: tabSwitches > 0 ? ANTI_CHEAT.FORFEIT_PENALTY : 0
  };
}
