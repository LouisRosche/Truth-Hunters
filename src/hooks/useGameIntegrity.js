/**
 * GAME INTEGRITY HOOK
 * Tracks tab visibility and detects potential cheating attempts
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ANTI_CHEAT } from '../data/constants';
import { logger } from '../utils/logger';

/**
 * Hook to track game integrity and prevent cheating via tab visibility monitoring
 * Automatically detects when students switch away from the game tab
 *
 * @param {boolean} isActive - Whether integrity tracking is active (usually !showResult)
 * @param {Function} onTabSwitch - Callback fired when tab is switched away, receives (switchCount)
 * @param {Function} onForfeit - Callback fired when max tab switches exceeded
 * @returns {Object} Integrity tracking state
 * @returns {number} .tabSwitches - Number of times tab was switched
 * @returns {boolean} .isTabVisible - Whether tab is currently visible
 * @returns {boolean} .isForfeit - Whether student has forfeited due to excessive switching
 * @returns {number} .totalTimeHidden - Total milliseconds spent with tab hidden
 * @returns {Function} .reset - Function to reset all tracking state
 * @returns {boolean} .hasWarning - Whether student has warnings (but not forfeited yet)
 * @returns {boolean} .isNearForfeit - Whether student is close to forfeiting
 * @returns {number} .penalty - Point penalty to apply for tab switches
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
    // Penalty: incremental for allowed switches, full forfeit penalty beyond max
    penalty: isForfeit
      ? ANTI_CHEAT.FORFEIT_PENALTY
      : tabSwitches * ANTI_CHEAT.TAB_SWITCH_PENALTY
  };
}
