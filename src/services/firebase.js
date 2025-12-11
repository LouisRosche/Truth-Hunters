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

const FIREBASE_CLASS_KEY = 'truthHunters_classCode';

// Hardcoded Firebase config - no setup needed
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC26tRrNxPR2CPshuXG91k6vNWGXpo-NYk",
  authDomain: "truth-hunters-classroom.firebaseapp.com",
  projectId: "truth-hunters-classroom",
  storageBucket: "truth-hunters-classroom.firebasestorage.app",
  messagingSenderId: "694501248854",
  appId: "1:694501248854:web:e7a183e2cae3323b8e10f7"
};

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
    return true; // Always configured now
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
   * Initialize Firebase with hardcoded config
   */
  init() {
    try {
      // Don't reinitialize if already done
      if (this.initialized && this.db) {
        return true;
      }

      // Initialize Firebase app if not already initialized
      const apps = getApps();
      if (apps.length === 0) {
        this.app = initializeApp(FIREBASE_CONFIG);
      } else {
        this.app = apps[0];
      }

      this.db = getFirestore(this.app);
      this.initialized = true;
      this.classCode = this.getClassCode();

      console.log('Firebase backend initialized successfully');
      return true;
    } catch (e) {
      console.warn('Failed to initialize Firebase:', e);
      return false;
    }
  },

  /**
   * Auto-initialize on load
   */
  tryAutoInit() {
    return this.init();
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
   * Clear class code (config is hardcoded, can't be cleared)
   */
  disconnect() {
    try {
      localStorage.removeItem(FIREBASE_CLASS_KEY);
      this.classCode = null;
    } catch (e) {
      // Ignore
    }
  },

  /**
   * Save team reflection data for teacher insights
   * @param {Object} reflectionData - Reflection data to save
   */
  async saveReflection(reflectionData) {
    if (!this.initialized || !this.db) {
      return false;
    }

    try {
      const classCode = this.getClassCode() || 'PUBLIC';

      const docData = {
        ...reflectionData,
        classCode: classCode,
        createdAt: serverTimestamp(),
        teamName: sanitizeInput(reflectionData.teamName || 'Team'),
        calibrationSelfAssessment: reflectionData.calibrationSelfAssessment || null,
        reflectionResponse: sanitizeInput(reflectionData.reflectionResponse || ''),
        reflectionPrompt: reflectionData.reflectionPrompt || '',
        gameScore: typeof reflectionData.gameScore === 'number' ? reflectionData.gameScore : 0,
        accuracy: typeof reflectionData.accuracy === 'number' ? reflectionData.accuracy : 0
      };

      const reflectionsRef = collection(this.db, 'reflections');
      await addDoc(reflectionsRef, docData);
      return true;
    } catch (e) {
      console.warn('Failed to save reflection to Firebase:', e);
      return false;
    }
  },

  /**
   * Get class reflections for teacher dashboard
   * @param {string} classFilter - Optional class code filter
   */
  async getClassReflections(classFilter = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const reflectionsRef = collection(this.db, 'reflections');

      let q;
      if (filterClass) {
        q = query(
          reflectionsRef,
          where('classCode', '==', filterClass),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      } else {
        q = query(
          reflectionsRef,
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      console.warn('Failed to fetch reflections from Firebase:', e);
      return [];
    }
  }
};

// Try to auto-initialize Firebase on load
FirebaseBackend.tryAutoInit();
