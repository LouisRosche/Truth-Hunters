/**
 * PHASE TIMER HOOK
 * Tracks time spent in each game phase for analytics
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for tracking duration of game phases
 * @returns {Object} Phase timing utilities
 */
export function usePhaseTimer() {
  const phaseStartRef = useRef(null);
  const phaseDurationsRef = useRef({
    discuss: [],
    stake: [],
    result: []
  });

  /**
   * Start timing a new phase
   */
  const startPhase = useCallback((phase) => {
    phaseStartRef.current = {
      phase,
      startTime: Date.now()
    };
  }, []);

  /**
   * End current phase and record duration
   */
  const endPhase = useCallback(() => {
    if (!phaseStartRef.current) return null;

    const { phase, startTime } = phaseStartRef.current;
    const duration = Date.now() - startTime;

    if (phaseDurationsRef.current[phase]) {
      phaseDurationsRef.current[phase].push(duration);
    }

    phaseStartRef.current = null;
    return { phase, duration };
  }, []);

  /**
   * Get aggregated stats for all phases
   */
  const getStats = useCallback(() => {
    const stats = {};

    Object.entries(phaseDurationsRef.current).forEach(([phase, durations]) => {
      if (durations.length === 0) {
        stats[phase] = { avg: 0, min: 0, max: 0, total: 0, count: 0 };
        return;
      }

      const total = durations.reduce((a, b) => a + b, 0);
      stats[phase] = {
        avg: Math.round(total / durations.length),
        min: Math.min(...durations),
        max: Math.max(...durations),
        total,
        count: durations.length
      };
    });

    return stats;
  }, []);

  /**
   * Reset all timings (for new game)
   */
  const reset = useCallback(() => {
    phaseStartRef.current = null;
    phaseDurationsRef.current = {
      discuss: [],
      stake: [],
      result: []
    };
  }, []);

  /**
   * Get raw duration arrays
   */
  const getRawDurations = useCallback(() => {
    return { ...phaseDurationsRef.current };
  }, []);

  return {
    startPhase,
    endPhase,
    getStats,
    getRawDurations,
    reset
  };
}

/**
 * Format milliseconds to human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
