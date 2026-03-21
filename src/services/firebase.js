/**
 * FIREBASE BACKEND
 * Game data persistence using Firestore (modular SDK)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { sanitizeInput } from '../utils/moderation';
import { logger } from '../utils/logger';

const FIREBASE_CLASS_KEY = 'truthHunters_classCode';

// Firebase configuration from environment variables
// SECURITY: Never hardcode API keys in source code
const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Firebase Backend Manager
 * Provides cloud storage for game records
 */
export const FirebaseBackend = {
  app: null,
  db: null,
  auth: null,
  currentUser: null,
  initialized: false,
  classCode: null,

  /**
   * Check if Firebase is available and configured
   */
  isConfigured() {
    // Check if all required Firebase config values are present
    return !!(
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.authDomain &&
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.storageBucket &&
      FIREBASE_CONFIG.messagingSenderId &&
      FIREBASE_CONFIG.appId
    );
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
   * Initialize Firebase with environment config
   * Uses Promise-based singleton to prevent race conditions
   */
  _initPromise: null,

  init() {
    // Return cached result if already initialized
    if (this.initialized && this.db) {
      return true;
    }

    // If initialization is in progress, wait for it
    // This prevents race conditions where multiple callers try to initialize simultaneously
    if (this._initPromise) {
      // For synchronous callers, return false to indicate "not ready yet"
      // They should retry or use async patterns
      return false;
    }

    // Start initialization
    this._initPromise = this._performInit()
      .finally(() => {
        this._initPromise = null;
      });

    // Trigger the promise but return synchronously for backwards compatibility
    this._initPromise.catch(() => {}); // Prevent unhandled rejection

    return this.initialized;
  },

  /**
   * Async initialization for Promise-based callers
   * @returns {Promise<boolean>} True if initialization succeeded
   */
  async initAsync() {
    // Already initialized
    if (this.initialized && this.db) {
      return true;
    }

    // Wait for in-progress initialization
    if (this._initPromise) {
      return this._initPromise;
    }

    // Start new initialization
    this._initPromise = this._performInit()
      .finally(() => {
        this._initPromise = null;
      });

    return this._initPromise;
  },

  /**
   * Internal initialization logic
   * @private
   */
  async _performInit() {
    try {
      // Check if Firebase is properly configured
      if (!this.isConfigured()) {
        logger.warn('Firebase configuration missing. Please set VITE_FIREBASE_* environment variables.');
        return false;
      }

      // Initialize Firebase app if not already initialized
      const apps = getApps();
      if (apps.length === 0) {
        this.app = initializeApp(FIREBASE_CONFIG);
      } else {
        this.app = apps[0];
      }

      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.initialized = true;
      this.classCode = this.getClassCode();

      // Track auth state changes (sign-in is now handled by AuthContext)
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
      });

      logger.log('Firebase backend initialized successfully');
      return true;
    } catch (e) {
      logger.warn('Failed to initialize Firebase:', e);
      this.initialized = false;
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
   * Sign in with Google using popup
   * @returns {Promise<import('firebase/auth').UserCredential>}
   */
  async signInWithGoogle() {
    if (!this.auth) {
      throw new Error('Firebase auth not initialized');
    }
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOutUser() {
    if (!this.auth) {
      throw new Error('Firebase auth not initialized');
    }
    return firebaseSignOut(this.auth);
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
      logger.warn('Failed to save to Firebase:', e);
      return false;
    }
  }
};

// Try to auto-initialize Firebase on load
FirebaseBackend.tryAutoInit();
