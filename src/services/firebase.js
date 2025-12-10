/**
 * FIREBASE BACKEND
 * Class-wide leaderboard support using Firestore (modular SDK)
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { sanitizeInput } from '../utils/moderation';
import { formatPlayerName } from '../utils/helpers';

const FIREBASE_CONFIG_KEY = 'truthHunters_firebaseConfig';
const FIREBASE_CLASS_KEY = 'truthHunters_classCode';

/**
 * Firebase Backend Manager for class-wide leaderboards
 * Provides cloud storage with fallback to localStorage
 */
export const FirebaseBackend = {
  app: null,
  db: null,
  initialized: false,
  classCode: null,

  /**
   * Check if Firebase is available and configured
   */
  isConfigured() {
    try {
      const config = localStorage.getItem(FIREBASE_CONFIG_KEY);
      return !!config;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get stored class code
   */
  getClassCode() {
    try {
      return localStorage.getItem(FIREBASE_CLASS_KEY) || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Set class code for filtering leaderboard
   */
  setClassCode(code) {
    try {
      if (code) {
        localStorage.setItem(FIREBASE_CLASS_KEY, sanitizeInput(code).toUpperCase());
      } else {
        localStorage.removeItem(FIREBASE_CLASS_KEY);
      }
      this.classCode = code;
    } catch (e) {
      console.warn('Failed to save class code:', e);
    }
  },

  /**
   * Initialize Firebase with config
   * @param {Object} config - Firebase configuration object
   */
  init(config) {
    try {
      // Don't reinitialize if already done
      if (this.initialized && this.db) {
        return true;
      }

      // Initialize Firebase app if not already initialized
      const apps = getApps();
      if (apps.length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = apps[0];
      }

      this.db = getFirestore(this.app);
      this.initialized = true;
      this.classCode = this.getClassCode();

      // Save config for future sessions
      try {
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      } catch (e) {
        // Ignore storage errors
      }

      console.log('Firebase backend initialized successfully');
      return true;
    } catch (e) {
      console.warn('Failed to initialize Firebase:', e);
      return false;
    }
  },

  /**
   * Try to initialize from stored config
   */
  tryAutoInit() {
    try {
      const storedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        return this.init(config);
      }
    } catch (e) {
      console.warn('Auto-init failed:', e);
    }
    return false;
  },

  /**
   * Save game record to Firestore
   * @param {Object} record - Game record to save
   */
  async save(record) {
    if (!this.initialized || !this.db) {
      return false;
    }

    try {
      const classCode = this.getClassCode() || 'PUBLIC';

      const docData = {
        ...record,
        classCode: classCode,
        createdAt: serverTimestamp(),
        // Ensure required fields
        teamName: sanitizeInput(record.teamName || 'Team'),
        score: typeof record.score === 'number' ? record.score : 0,
        players: (record.players || []).map(p => ({
          firstName: sanitizeInput(p.firstName || ''),
          lastInitial: sanitizeInput(p.lastInitial || '')
        }))
      };

      const gamesRef = collection(this.db, 'games');
      await addDoc(gamesRef, docData);
      return true;
    } catch (e) {
      console.warn('Failed to save to Firebase:', e);
      return false;
    }
  },

  /**
   * Get top teams from Firestore
   * @param {number} limitCount - Number of teams to fetch
   * @param {string} classFilter - Optional class code filter
   */
  async getTopTeams(limitCount = 10, classFilter = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const gamesRef = collection(this.db, 'games');

      let q;
      if (filterClass) {
        q = query(
          gamesRef,
          where('classCode', '==', filterClass),
          orderBy('score', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          gamesRef,
          orderBy('score', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      console.warn('Failed to fetch from Firebase:', e);
      return [];
    }
  },

  /**
   * Get top players aggregated from Firestore
   * @param {number} limitCount
   */
  async getTopPlayers(limitCount = 10) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const classCode = this.getClassCode();
      const gamesRef = collection(this.db, 'games');

      let q;
      if (classCode) {
        q = query(gamesRef, where('classCode', '==', classCode));
      } else {
        q = query(gamesRef);
      }

      const snapshot = await getDocs(q);
      const playerScores = {};

      snapshot.docs.forEach(doc => {
        const game = doc.data();
        if (!game.players) return;

        game.players.forEach(player => {
          const key = `${player.firstName}_${player.lastInitial}`.toLowerCase();
          const displayName = formatPlayerName(player.firstName, player.lastInitial);

          if (!playerScores[key]) {
            playerScores[key] = {
              displayName,
              totalScore: 0,
              gamesPlayed: 0,
              bestScore: -Infinity
            };
          }

          playerScores[key].totalScore += game.score || 0;
          playerScores[key].gamesPlayed += 1;
          playerScores[key].bestScore = Math.max(playerScores[key].bestScore, game.score || 0);
        });
      });

      return Object.values(playerScores)
        .filter(p => p.gamesPlayed > 0)
        .map(p => ({
          ...p,
          avgScore: Math.round(p.totalScore / p.gamesPlayed)
        }))
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, limitCount);
    } catch (e) {
      console.warn('Failed to fetch players from Firebase:', e);
      return [];
    }
  },

  /**
   * Disconnect and clear config
   */
  disconnect() {
    try {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
      localStorage.removeItem(FIREBASE_CLASS_KEY);
      this.initialized = false;
      this.db = null;
      this.app = null;
      this.classCode = null;
    } catch (e) {
      // Ignore
    }
  }
};

// Try to auto-initialize Firebase on load
FirebaseBackend.tryAutoInit();
