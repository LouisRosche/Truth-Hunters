/**
 * UNIFIED LEADERBOARD HOOK
 * Provides consistent data fetching for all leaderboard components
 * Handles Firebase initialization, fallback to local storage, and loading states
 */

import { useState, useEffect, useRef } from 'react';
import { LeaderboardManager } from '../services/leaderboard';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

/**
 * Hook for fetching team leaderboard data
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Number of teams to fetch (default: 10)
 * @param {boolean} options.autoRefresh - Auto-refresh every 30 seconds (default: false)
 * @param {string} options.classCode - Optional class code filter (uses stored class code if not provided)
 * @returns {Object} { teams, isLoading, error, refresh }
 */
export function useTeamLeaderboard({ limit = 10, autoRefresh = false, classCode = null } = {}) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const limitRef = useRef(limit);
  const classCodeRef = useRef(classCode);

  // Update refs when props change
  limitRef.current = limit;
  classCodeRef.current = classCode;

  useEffect(() => {
    isMountedRef.current = true;

    // Stable fetch function using refs to avoid infinite loops
    const fetchTeams = async () => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        let data = [];

        // Try Firebase first if initialized
        if (FirebaseBackend.initialized) {
          try {
            data = await FirebaseBackend.getTopTeams(limitRef.current, classCodeRef.current);
          } catch (e) {
            logger.warn('Firebase team fetch failed, falling back to local:', e);
            if (isMountedRef.current) {
              setError('Cloud leaderboard unavailable');
            }
          }
        }

        // Fallback to local storage if Firebase failed or returned no data
        if (data.length === 0) {
          data = LeaderboardManager.getTopTeams(limitRef.current);
        }

        if (isMountedRef.current) {
          setTeams(data);
          setIsLoading(false);
        }
      } catch (e) {
        logger.error('Failed to fetch team leaderboard:', e);
        if (isMountedRef.current) {
          setError(e.message);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchTeams();

    // Set up auto-refresh if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchTeams, 30000); // 30 seconds
    }

    return () => {
      isMountedRef.current = false;
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]); // Only depend on autoRefresh, use refs for other values

  // Manual refresh function
  const refresh = async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      let data = [];

      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopTeams(limitRef.current, classCodeRef.current);
        } catch (e) {
          logger.warn('Firebase team fetch failed, falling back to local:', e);
          if (isMountedRef.current) {
            setError('Cloud leaderboard unavailable');
          }
        }
      }

      if (data.length === 0) {
        data = LeaderboardManager.getTopTeams(limitRef.current);
      }

      if (isMountedRef.current) {
        setTeams(data);
        setIsLoading(false);
      }
    } catch (e) {
      logger.error('Failed to fetch team leaderboard:', e);
      if (isMountedRef.current) {
        setError(e.message);
        setIsLoading(false);
      }
    }
  };

  return {
    teams,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook for fetching player leaderboard data
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Number of players to fetch (default: 10)
 * @param {string} options.classCode - Optional class code filter
 * @returns {Object} { players, isLoading, error, refresh }
 */
export function usePlayerLeaderboard({ limit = 10, classCode = null } = {}) {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const limitRef = useRef(limit);
  const classCodeRef = useRef(classCode);

  // Update refs when props change
  limitRef.current = limit;
  classCodeRef.current = classCode;

  useEffect(() => {
    isMountedRef.current = true;

    const fetchPlayers = async () => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        let data = [];

        // Try Firebase first if initialized
        if (FirebaseBackend.initialized) {
          try {
            data = await FirebaseBackend.getTopPlayers(limitRef.current, classCodeRef.current);
          } catch (e) {
            logger.warn('Firebase player fetch failed, falling back to local:', e);
            if (isMountedRef.current) {
              setError('Cloud leaderboard unavailable');
            }
          }
        }

        // Fallback to local storage if Firebase failed or returned no data
        if (data.length === 0) {
          data = LeaderboardManager.getTopPlayers(limitRef.current);
        }

        if (isMountedRef.current) {
          setPlayers(data);
          setIsLoading(false);
        }
      } catch (e) {
        logger.error('Failed to fetch player leaderboard:', e);
        if (isMountedRef.current) {
          setError(e.message);
          setIsLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array - use refs for values

  // Manual refresh function
  const refresh = async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      let data = [];

      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopPlayers(limitRef.current, classCodeRef.current);
        } catch (e) {
          logger.warn('Firebase player fetch failed, falling back to local:', e);
          if (isMountedRef.current) {
            setError('Cloud leaderboard unavailable');
          }
        }
      }

      if (data.length === 0) {
        data = LeaderboardManager.getTopPlayers(limitRef.current);
      }

      if (isMountedRef.current) {
        setPlayers(data);
        setIsLoading(false);
      }
    } catch (e) {
      logger.error('Failed to fetch player leaderboard:', e);
      if (isMountedRef.current) {
        setError(e.message);
        setIsLoading(false);
      }
    }
  };

  return {
    players,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook for subscribing to live game sessions (real-time leaderboard)
 * @param {Object} options - Configuration options
 * @param {string} options.classCode - Class code filter (uses stored class code if not provided)
 * @returns {Object} { sessions, isLoading, error, hasFirebase }
 */
export function useLiveLeaderboard({ classCode = null } = {}) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFirebase, setHasFirebase] = useState(false);
  const classCodeRef = useRef(classCode);

  // Update ref when prop changes
  classCodeRef.current = classCode;

  useEffect(() => {
    // Don't subscribe if Firebase isn't initialized
    if (!FirebaseBackend.initialized) {
      setIsLoading(false);
      setHasFirebase(false);
      return;
    }

    setHasFirebase(true);
    setIsLoading(true);
    setError(null);

    // Subscribe to live sessions
    const unsubscribe = FirebaseBackend.subscribeToLiveLeaderboard(
      (updatedSessions) => {
        setSessions(updatedSessions);
        setIsLoading(false);
      },
      classCodeRef.current
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array - use refs for values

  return {
    sessions,
    isLoading,
    error,
    hasFirebase
  };
}
