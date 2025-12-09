/**
 * TIMER HOOK
 * Countdown timer with pause/resume and tab visibility handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing a countdown timer
 * @param {number} initialTime - Starting time in seconds
 * @param {Function} onComplete - Callback when timer reaches 0
 * @returns {Object} Timer state and controls
 */
export function useTimer(initialTime, onComplete) {
  const [time, setTime] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const callbackRef = useRef(onComplete);

  useEffect(() => {
    callbackRef.current = onComplete;
  }, [onComplete]);

  // Handle tab visibility - pause when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          setIsActive(false);
          callbackRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback((newTime) => {
    setTime(newTime ?? initialTime);
    setIsActive(false);
  }, [initialTime]);

  return { time, isActive, isPaused, start, pause, reset };
}
