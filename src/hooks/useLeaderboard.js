/**
 * UNIFIED LEADERBOARD HOOK
 * Provides consistent data fetching for all leaderboard components
 * Handles Firebase initialization, fallback to local storage, and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data = [];

      // Try Firebase first if initialized
      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopTeams(limit, classCode);
        } catch (e) {
          logger.warn('Firebase team fetch failed, falling back to local:', e);
          setError('Cloud leaderboard unavailable');
        }
      }

      // Fallback to local storage if Firebase failed or returned no data
      if (data.length === 0) {
        data = LeaderboardManager.getTopTeams(limit);
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
  }, [limit, classCode]);

  useEffect(() => {
    isMountedRef.current = true;
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
  }, [fetchTeams, autoRefresh]);

  return {
    teams,
    isLoading,
    error,
    refresh: fetchTeams
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

  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data = [];

      // Try Firebase first if initialized
      if (FirebaseBackend.initialized) {
        try {
          data = await FirebaseBackend.getTopPlayers(limit, classCode);
        } catch (e) {
          logger.warn('Firebase player fetch failed, falling back to local:', e);
          setError('Cloud leaderboard unavailable');
        }
      }

      // Fallback to local storage if Firebase failed or returned no data
      if (data.length === 0) {
        data = LeaderboardManager.getTopPlayers(limit);
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
  }, [limit, classCode]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchPlayers();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPlayers]);

  return {
    players,
    isLoading,
    error,
    refresh: fetchPlayers
  };
}

/**
 * Hook for subscribing to live game sessions (real-time leaderboard)
 * @param {Object} options - Configuration options
 * @param {string} options.classCode - Class code filter (uses stored class code if not provided)
 * @returns {Object} { sessions, isLoading, error }
 */
export function useLiveLeaderboard({ classCode = null } = {}) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Don't subscribe if Firebase isn't initialized
    if (!FirebaseBackend.initialized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to live sessions
    const unsubscribe = FirebaseBackend.subscribeToLiveLeaderboard(
      (updatedSessions) => {
        setSessions(updatedSessions);
        setIsLoading(false);
      },
      classCode
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [classCode]);

  return {
    sessions,
    isLoading,
    error
  };
}
