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
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  doc,
  runTransaction
} from 'firebase/firestore';
import { sanitizeInput } from '../utils/moderation';
import { aggregatePlayerScores } from '../utils/leaderboardUtils';
import { logger } from '../utils/logger';

const FIREBASE_CLASS_KEY = 'truthHunters_classCode';
const FIREBASE_CLASS_SETTINGS_KEY = 'truthHunters_classSettings';

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
      logger.warn('Failed to save class code:', e);
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
      this.initialized = true;
      this.classCode = this.getClassCode();

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
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now()
      }));

      return results;
    } catch (e) {
      logger.warn('Failed to fetch teams from Firebase:', e);
      return [];
    }
  },

  /**
   * Get top players aggregated from Firestore
   * @param {number} limitCount - Number of players to fetch
   * @param {string} classFilter - Optional class code filter
   */
  async getTopPlayers(limitCount = 10, classFilter = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const gamesRef = collection(this.db, 'games');

      // PARTIAL FIX: Limit to recent games to reduce data fetched
      // NOTE: This is still a N+1 query pattern. Proper fix requires:
      //   1. Server-side Cloud Function to pre-aggregate player stats into 'playerStats' collection
      //   2. Scheduled aggregation (e.g., every 5 minutes)
      //   3. Query playerStats collection directly with orderBy('totalScore', 'desc').limit(N)
      // Current approach: Fetch recent 500 games as compromise between accuracy and performance
      let q;
      if (filterClass) {
        q = query(
          gamesRef,
          where('classCode', '==', filterClass),
          orderBy('createdAt', 'desc'),
          limit(500) // Limit to recent 500 games instead of ALL games
        );
      } else {
        q = query(
          gamesRef,
          orderBy('createdAt', 'desc'),
          limit(500)
        );
      }

      const snapshot = await getDocs(q);
      // Convert Firestore docs to game records
      const games = snapshot.docs.map(doc => ({
        ...doc.data(),
        score: doc.data().score || 0,
        players: doc.data().players || []
      }));

      // Use shared aggregation logic
      const aggregated = aggregatePlayerScores(games);
      const results = aggregated.slice(0, limitCount);

      return results;
    } catch (e) {
      logger.warn('Failed to fetch players from Firebase:', e);
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
   * STUDENT CLAIM CONTRIBUTIONS
   * Students can submit claims for teacher review
   */

  // Track recent submissions for rate limiting (in-memory, per session)
  _recentSubmissions: [],
  _RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  _RATE_LIMIT_MAX: 3, // Max 3 submissions per minute

  /**
   * Submit a new claim for teacher review
   * @param {Object} claimData - The claim submission
   */
  async submitClaim(claimData) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    // Validate required fields
    if (!claimData.claimText || claimData.claimText.trim().length < 10) {
      return { success: false, error: 'Claim text must be at least 10 characters' };
    }

    // Validate maximum length to prevent database bloat
    const MAX_CLAIM_LENGTH = 500;
    if (claimData.claimText.length > MAX_CLAIM_LENGTH) {
      return { success: false, error: `Claim text must be less than ${MAX_CLAIM_LENGTH} characters` };
    }

    // Validate answer field
    const validAnswers = ['TRUE', 'FALSE', 'MIXED'];
    if (!validAnswers.includes(claimData.answer)) {
      return { success: false, error: 'Invalid answer type' };
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    const difficulty = validDifficulties.includes(claimData.difficulty)
      ? claimData.difficulty
      : 'medium';

    // Rate limiting check
    const now = Date.now();
    this._recentSubmissions = this._recentSubmissions.filter(
      ts => now - ts < this._RATE_LIMIT_WINDOW_MS
    );
    if (this._recentSubmissions.length >= this._RATE_LIMIT_MAX) {
      return { success: false, error: 'Too many submissions. Please wait a minute before submitting again.' };
    }

    try {
      const classCode = this.getClassCode() || 'PUBLIC';
      // Use maxLength parameter for claim text (500 chars max)
      const sanitizedClaimText = sanitizeInput(claimData.claimText || '', MAX_CLAIM_LENGTH);
      const submitterName = sanitizeInput(claimData.submitterName || 'Anonymous', 50);

      // Check for duplicate claims by same student (simple text similarity)
      const existingClaims = await this.getStudentClaims(submitterName);
      const normalizedNewText = sanitizedClaimText.toLowerCase().replace(/\s+/g, ' ').trim();
      const isDuplicate = existingClaims.some(existing => {
        const normalizedExisting = (existing.claimText || '').toLowerCase().replace(/\s+/g, ' ').trim();
        // Check for exact match or very high similarity (>90% same)
        if (normalizedExisting === normalizedNewText) return true;
        // Simple length-based similarity check
        const shorter = Math.min(normalizedExisting.length, normalizedNewText.length);
        const longer = Math.max(normalizedExisting.length, normalizedNewText.length);
        if (shorter / longer > 0.9) {
          // Check if one contains the other
          if (normalizedExisting.includes(normalizedNewText) || normalizedNewText.includes(normalizedExisting)) {
            return true;
          }
        }
        return false;
      });

      if (isDuplicate) {
        return { success: false, error: 'You have already submitted a similar claim.' };
      }

      const docData = {
        classCode: classCode,
        status: 'pending', // pending, approved, rejected
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewerNote: null,
        // Student info
        submitterName: submitterName,
        submitterAvatar: claimData.submitterAvatar || '🔍',
        // Claim content
        claimText: sanitizedClaimText,
        answer: claimData.answer,
        explanation: sanitizeInput(claimData.explanation || ''),
        subject: claimData.subject || 'General',
        difficulty: difficulty,
        source: 'student-contributed',
        citation: sanitizeInput(claimData.citation || ''),
        // If it's a FALSE claim, optionally include error pattern
        errorPattern: claimData.errorPattern || null
      };

      const claimsRef = collection(this.db, 'pendingClaims');
      const docRef = await addDoc(claimsRef, docData);

      // Record this submission for rate limiting
      this._recentSubmissions.push(now);

      return { success: true, id: docRef.id };
    } catch (e) {
      logger.warn('Failed to submit claim:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get pending claims for teacher review
   * @param {string} classFilter - Optional class code filter
   */
  async getPendingClaims(classFilter = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const claimsRef = collection(this.db, 'pendingClaims');

      let q;
      if (filterClass) {
        q = query(
          claimsRef,
          where('classCode', '==', filterClass),
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
      } else {
        q = query(
          claimsRef,
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().submittedAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      logger.warn('Failed to fetch pending claims:', e);
      return [];
    }
  },

  /**
   * Get all claims (for teacher to see history)
   * @param {string} classFilter - Optional class code filter
   * @param {string} statusFilter - Optional status filter (pending, approved, rejected)
   */
  async getAllSubmittedClaims(classFilter = null, statusFilter = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const claimsRef = collection(this.db, 'pendingClaims');

      let q;
      if (filterClass && statusFilter) {
        q = query(
          claimsRef,
          where('classCode', '==', filterClass),
          where('status', '==', statusFilter),
          orderBy('submittedAt', 'desc'),
          limit(100)
        );
      } else if (filterClass) {
        q = query(
          claimsRef,
          where('classCode', '==', filterClass),
          orderBy('submittedAt', 'desc'),
          limit(100)
        );
      } else if (statusFilter) {
        q = query(
          claimsRef,
          where('status', '==', statusFilter),
          orderBy('submittedAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          claimsRef,
          orderBy('submittedAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().submittedAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      logger.warn('Failed to fetch submitted claims:', e);
      return [];
    }
  },

  /**
   * Approve or reject a claim
   * @param {string} claimId - The claim document ID
   * @param {boolean} approved - Whether to approve or reject
   * @param {string} reviewerNote - Optional note from teacher
   */
  async reviewClaim(claimId, approved, reviewerNote = '') {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const claimRef = doc(this.db, 'pendingClaims', claimId);

      await updateDoc(claimRef, {
        status: approved ? 'approved' : 'rejected',
        reviewedAt: serverTimestamp(),
        reviewerNote: sanitizeInput(reviewerNote || '')
      });

      return { success: true };
    } catch (e) {
      logger.warn('Failed to review claim:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get approved claims to add to game pool
   * @param {string} classFilter - Optional class code filter
   * @param {number} maxClaims - Maximum claims to return (default 50)
   */
  async getApprovedClaims(classFilter = null, maxClaims = 50) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const claimsRef = collection(this.db, 'pendingClaims');

      let q;
      if (filterClass) {
        q = query(
          claimsRef,
          where('classCode', '==', filterClass),
          where('status', '==', 'approved'),
          limit(maxClaims)
        );
      } else {
        q = query(
          claimsRef,
          where('status', '==', 'approved'),
          limit(maxClaims)
        );
      }

      const snapshot = await getDocs(q);
      const validAnswers = ['TRUE', 'FALSE', 'MIXED'];
      const validDifficulties = ['easy', 'medium', 'hard'];

      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          // Skip claims with invalid data
          if (!data.claimText || !validAnswers.includes(data.answer)) {
            return null;
          }
          return {
            id: `student-${doc.id}`,
            text: data.claimText,
            answer: data.answer,
            explanation: data.explanation || 'No explanation provided.',
            subject: data.subject || 'General',
            difficulty: validDifficulties.includes(data.difficulty) ? data.difficulty : 'medium',
            source: 'student-contributed',
            citation: data.citation || null,
            errorPattern: data.errorPattern || null,
            contributor: data.submitterName || 'Classmate',
            contributorAvatar: data.submitterAvatar || '🔍'
          };
        })
        .filter(claim => claim !== null);
    } catch (e) {
      logger.warn('Failed to fetch approved claims:', e);
      return [];
    }
  },

  /**
   * Get claims submitted by a specific student (for notifications)
   * @param {string} studentName - The student's name
   */
  async getStudentClaims(studentName) {
    if (!this.initialized || !this.db) {
      return [];
    }

    try {
      const classCode = this.getClassCode() || 'PUBLIC';
      const claimsRef = collection(this.db, 'pendingClaims');

      const q = query(
        claimsRef,
        where('classCode', '==', classCode),
        where('submitterName', '==', sanitizeInput(studentName)),
        orderBy('submittedAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().submittedAt?.toMillis() || Date.now(),
        reviewedTimestamp: doc.data().reviewedAt?.toMillis() || null
      }));
    } catch (e) {
      logger.warn('Failed to fetch student claims:', e);
      return [];
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
      logger.warn('Failed to save reflection to Firebase:', e);
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
      logger.warn('Failed to fetch reflections from Firebase:', e);
      return [];
    }
  },

  // ==================== REAL-TIME LISTENERS ====================

  // FIXED: Store active listener unsubscribe functions as arrays to support multiple subscribers
  // Previous design only allowed one subscriber per type, causing memory leaks
  _listeners: {},
  _nextListenerId: 0,

  /**
   * Subscribe to real-time pending claims updates
   * @param {Function} callback - Called with updated claims array
   * @param {string} classFilter - Optional class code filter
   * @returns {Function} Unsubscribe function
   */
  subscribeToPendingClaims(callback, classFilter = null) {
    if (!this.initialized || !this.db) {
      logger.warn('Firebase not initialized for real-time subscription');
      return () => {};
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      const claimsRef = collection(this.db, 'pendingClaims');

      let q;
      if (filterClass) {
        q = query(
          claimsRef,
          where('classCode', '==', filterClass),
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
      } else {
        q = query(
          claimsRef,
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const claims = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().submittedAt?.toMillis() || Date.now()
        }));
        callback(claims);
      }, (error) => {
        logger.warn('Real-time claims subscription error:', error);
      });

      // FIXED: Store listener with unique ID to support multiple subscribers
      const listenerId = this._nextListenerId++;
      const listenerKey = `pendingClaims_${listenerId}`;
      this._listeners[listenerKey] = unsubscribe;

      // Return cleanup function that only removes this specific listener
      return () => {
        if (this._listeners[listenerKey]) {
          this._listeners[listenerKey]();
          delete this._listeners[listenerKey];
        }
      };
    } catch (e) {
      logger.warn('Failed to set up real-time subscription:', e);
      return () => {};
    }
  },

  /**
   * Subscribe to real-time class achievements
   * @param {Function} callback - Called with updated achievements
   * @param {string} classFilter - Optional class code filter
   * @returns {Function} Unsubscribe function
   */
  subscribeToClassAchievements(callback, classFilter = null) {
    if (!this.initialized || !this.db) {
      return () => {};
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      if (!filterClass) {
        callback([]);
        return () => {};
      }

      const achievementsRef = collection(this.db, 'classAchievements');
      const q = query(
        achievementsRef,
        where('classCode', '==', filterClass),
        orderBy('earnedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const achievements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().earnedAt?.toMillis() || Date.now()
        }));
        callback(achievements);
      }, (error) => {
        logger.warn('Real-time achievements subscription error:', error);
      });

      // FIXED: Store listener with unique ID to support multiple subscribers
      const listenerId = this._nextListenerId++;
      const listenerKey = `classAchievements_${listenerId}`;
      this._listeners[listenerKey] = unsubscribe;

      // Return cleanup function that only removes this specific listener
      return () => {
        if (this._listeners[listenerKey]) {
          this._listeners[listenerKey]();
          delete this._listeners[listenerKey];
        }
      };
    } catch (e) {
      logger.warn('Failed to set up achievements subscription:', e);
      return () => {};
    }
  },

  /**
   * Unsubscribe from all real-time listeners
   */
  unsubscribeAll() {
    Object.values(this._listeners).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._listeners = {};
  },

  // ==================== LIVE GAME SESSION TRACKING ====================

  /**
   * Update active game session for live leaderboard
   * Called during gameplay to track in-progress scores
   * @param {string} sessionId - Unique session identifier
   * @param {Object} gameData - Current game state
   */
  async updateActiveSession(sessionId, gameData) {
    if (!this.initialized || !this.db) {
      return false;
    }

    try {
      const classCode = this.getClassCode() || 'PUBLIC';
      const sessionDoc = doc(this.db, 'activeSessions', sessionId);

      await setDoc(sessionDoc, {
        sessionId,
        classCode,
        teamName: sanitizeInput(gameData.teamName || 'Team'),
        teamAvatar: gameData.teamAvatar || '🔍',
        players: (gameData.players || []).map(p => ({
          firstName: sanitizeInput(p.firstName || ''),
          lastInitial: sanitizeInput(p.lastInitial || '')
        })),
        currentScore: typeof gameData.currentScore === 'number' ? gameData.currentScore : 0,
        currentRound: gameData.currentRound || 1,
        totalRounds: gameData.totalRounds || 10,
        accuracy: gameData.accuracy || 0,
        isActive: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (e) {
      logger.warn('Failed to update active session:', e);
      return false;
    }
  },

  /**
   * Remove active session when game ends
   * @param {string} sessionId - Session to remove
   */
  async removeActiveSession(sessionId) {
    if (!this.initialized || !this.db) {
      return false;
    }

    try {
      const sessionDoc = doc(this.db, 'activeSessions', sessionId);
      await deleteDoc(sessionDoc);
      return true;
    } catch (e) {
      logger.warn('Failed to remove active session:', e);
      return false;
    }
  },

  /**
   * Subscribe to live class leaderboard (active games in progress)
   * Shows real-time scores of all students in the same class
   * @param {Function} callback - Called with updated sessions array
   * @param {string} classFilter - Optional class code filter
   * @returns {Function} Unsubscribe function
   */
  subscribeToLiveLeaderboard(callback, classFilter = null) {
    if (!this.initialized || !this.db) {
      logger.warn('Firebase not initialized for live leaderboard');
      return () => {};
    }

    try {
      const filterClass = classFilter || this.getClassCode();
      if (!filterClass) {
        callback([]);
        return () => {};
      }

      const sessionsRef = collection(this.db, 'activeSessions');
      const q = query(
        sessionsRef,
        where('classCode', '==', filterClass),
        where('isActive', '==', true),
        orderBy('currentScore', 'desc'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().updatedAt?.toMillis() || Date.now()
        }));
        callback(sessions);
      }, (error) => {
        logger.warn('Live leaderboard subscription error:', error);
        callback([]);
      });

      // FIXED: Store listener with unique ID to support multiple subscribers
      const listenerId = this._nextListenerId++;
      const listenerKey = `liveLeaderboard_${listenerId}`;
      this._listeners[listenerKey] = unsubscribe;

      // Return cleanup function that only removes this specific listener
      return () => {
        if (this._listeners[listenerKey]) {
          this._listeners[listenerKey]();
          delete this._listeners[listenerKey];
        }
      };
    } catch (e) {
      logger.warn('Failed to set up live leaderboard subscription:', e);
      return () => {};
    }
  },

  // ==================== CLASS SETTINGS ====================

  /**
   * Get class settings from Firestore
   * @param {string} classCode - The class code
   */
  async getClassSettings(classCode = null) {
    if (!this.initialized || !this.db) {
      return this._getDefaultClassSettings();
    }

    const code = classCode || this.getClassCode();
    if (!code) return this._getDefaultClassSettings();

    try {
      const settingsDoc = doc(this.db, 'classSettings', code);
      const snapshot = await getDoc(settingsDoc);

      if (snapshot.exists()) {
        return { ...this._getDefaultClassSettings(), ...snapshot.data() };
      }
      return this._getDefaultClassSettings();
    } catch (e) {
      logger.warn('Failed to fetch class settings:', e);
      return this._getDefaultClassSettings();
    }
  },

  /**
   * Save class settings to Firestore (teacher only)
   * @param {Object} settings - The settings to save
   * @param {string} classCode - The class code
   */
  async saveClassSettings(settings, classCode = null) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    const code = classCode || this.getClassCode();
    if (!code) return { success: false, error: 'No class code set' };

    try {
      const settingsDoc = doc(this.db, 'classSettings', code);
      await setDoc(settingsDoc, {
        ...settings,
        classCode: code,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Cache locally
      try {
        localStorage.setItem(FIREBASE_CLASS_SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) { /* ignore */ }

      return { success: true };
    } catch (e) {
      logger.warn('Failed to save class settings:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get default class settings
   */
  _getDefaultClassSettings() {
    return {
      allowedDifficulties: ['easy', 'medium', 'hard', 'mixed'],
      allowedSubjects: [], // Empty = all subjects
      minRounds: 3,
      maxRounds: 10,
      defaultRounds: 5,
      defaultDifficulty: 'mixed',
      allowStudentClaims: true,
      requireClaimCitation: false,
      showLeaderboard: true,
      gradeLevel: 'middle', // elementary, middle, high, college
      customMessage: ''
    };
  },

  // ==================== CLASS SEEN CLAIMS TRACKING ====================

  /**
   * Get claims that have been seen by any group in this class today
   * Prevents different groups from getting the same claims in the same session
   * @param {string} classCode - The class code
   * @returns {Promise<Array<string>>} Array of claim IDs seen today
   */
  async getClassSeenClaims(classCode = null) {
    if (!this.initialized || !this.db) {
      return [];
    }

    const code = classCode || this.getClassCode();
    if (!code) return [];

    try {
      // Get today's date as string for partitioning (resets daily)
      const today = new Date().toISOString().split('T')[0];
      const docId = `${code}_${today}`;

      const seenDoc = doc(this.db, 'classSeenClaims', docId);
      const snapshot = await getDoc(seenDoc);

      if (snapshot.exists()) {
        return snapshot.data().claimIds || [];
      }
      return [];
    } catch (e) {
      logger.warn('Failed to fetch class seen claims:', e);
      return [];
    }
  },

  /**
   * Record claims as seen by this class
   * @param {Array<string>} claimIds - Array of claim IDs that were just played
   * @param {string} classCode - The class code
   */
  async recordClassSeenClaims(claimIds, classCode = null) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    const code = classCode || this.getClassCode();
    if (!code || !claimIds?.length) return { success: false, error: 'Missing data' };

    try {
      const today = new Date().toISOString().split('T')[0];
      const docId = `${code}_${today}`;
      const seenDoc = doc(this.db, 'classSeenClaims', docId);

      // FIXED: Use transaction to prevent race conditions when multiple games finish simultaneously
      // This ensures atomic read-modify-write operations
      await runTransaction(this.db, async (transaction) => {
        const snapshot = await transaction.get(seenDoc);

        let existingIds = [];
        if (snapshot.exists()) {
          existingIds = snapshot.data().claimIds || [];
        }

        // Merge new IDs (avoid duplicates)
        const allIds = [...new Set([...existingIds, ...claimIds])];

        transaction.set(seenDoc, {
          classCode: code,
          date: today,
          claimIds: allIds,
          updatedAt: serverTimestamp()
        });
      });

      return { success: true };
    } catch (e) {
      logger.warn('Failed to record class seen claims:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Clear class seen claims (for teacher to reset)
   * @param {string} classCode - The class code
   */
  async clearClassSeenClaims(classCode = null) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    const code = classCode || this.getClassCode();
    if (!code) return { success: false, error: 'No class code' };

    try {
      const today = new Date().toISOString().split('T')[0];
      const docId = `${code}_${today}`;
      const seenDoc = doc(this.db, 'classSeenClaims', docId);
      await setDoc(seenDoc, { classCode: code, date: today, claimIds: [], updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e) {
      logger.warn('Failed to clear class seen claims:', e);
      return { success: false, error: e.message };
    }
  },

  // ==================== DATA EXPORT ====================

  /**
   * Export class game data as CSV-friendly format
   * @param {string} classFilter - Class code to filter by
   * @param {number} days - Number of days to include (default 30)
   */
  async exportClassData(classFilter = null, days = 30) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized', data: null };
    }

    const filterClass = classFilter || this.getClassCode();
    if (!filterClass) return { success: false, error: 'No class code', data: null };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Fetch game records
      const gamesRef = collection(this.db, 'games');
      const q = query(
        gamesRef,
        where('classCode', '==', filterClass),
        orderBy('createdAt', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const games = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamName: data.teamName || 'Unknown',
          players: (data.players || []).map(p => typeof p === 'string' ? p : `${p.firstName || ''} ${p.lastInitial || ''}`.trim()).join(', '),
          score: data.score || 0,
          accuracy: data.accuracy || 0,
          rounds: data.rounds || 0,
          difficulty: data.difficulty || 'mixed',
          maxStreak: data.maxStreak || 0,
          timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          subjects: (data.subjects || []).join(', ')
        };
      });

      // Generate CSV content
      const headers = ['Date', 'Team', 'Players', 'Score', 'Accuracy %', 'Rounds', 'Difficulty', 'Max Streak', 'Subjects'];
      const rows = games.map(g => [
        g.timestamp.split('T')[0],
        g.teamName,
        g.players,
        g.score,
        g.accuracy,
        g.rounds,
        g.difficulty,
        g.maxStreak,
        g.subjects
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return {
        success: true,
        data: {
          games,
          csv: csvContent,
          summary: {
            totalGames: games.length,
            avgScore: games.length > 0 ? Math.round(games.reduce((s, g) => s + g.score, 0) / games.length) : 0,
            avgAccuracy: games.length > 0 ? Math.round(games.reduce((s, g) => s + g.accuracy, 0) / games.length) : 0
          }
        }
      };
    } catch (e) {
      logger.warn('Failed to export class data:', e);
      return { success: false, error: e.message, data: null };
    }
  },

  // ==================== ACHIEVEMENT SHARING ====================

  /**
   * Share an achievement with the class
   * @param {Object} achievement - The achievement to share
   * @param {Object} playerInfo - Player info (name, avatar)
   */
  async shareAchievement(achievement, playerInfo) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    const classCode = this.getClassCode();
    if (!classCode) return { success: false, error: 'No class code set' };

    try {
      const achievementsRef = collection(this.db, 'classAchievements');
      await addDoc(achievementsRef, {
        classCode: classCode,
        achievementId: achievement.id,
        achievementName: achievement.name,
        achievementIcon: achievement.icon,
        achievementDescription: achievement.description,
        playerName: sanitizeInput(playerInfo.playerName || 'Anonymous'),
        playerAvatar: playerInfo.avatar?.emoji || '🔍',
        earnedAt: serverTimestamp(),
        gameScore: playerInfo.gameScore || 0
      });

      return { success: true };
    } catch (e) {
      logger.warn('Failed to share achievement:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get recent class achievements
   * @param {string} classFilter - Optional class code filter
   * @param {number} limitCount - Max achievements to return
   */
  async getClassAchievements(classFilter = null, limitCount = 20) {
    if (!this.initialized || !this.db) {
      return [];
    }

    const filterClass = classFilter || this.getClassCode();
    if (!filterClass) return [];

    try {
      const achievementsRef = collection(this.db, 'classAchievements');
      const q = query(
        achievementsRef,
        where('classCode', '==', filterClass),
        orderBy('earnedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().earnedAt?.toMillis() || Date.now()
      }));
    } catch (e) {
      logger.warn('Failed to fetch class achievements:', e);
      return [];
    }
  },

  /**
   * Get class achievement stats (for leaderboard)
   */
  async getClassAchievementStats(classFilter = null) {
    const achievements = await this.getClassAchievements(classFilter, 100);

    // Aggregate by player
    const playerStats = {};
    achievements.forEach(a => {
      // Skip achievements with missing player name
      if (!a.playerName) return;
      const key = a.playerName.toLowerCase();
      if (!playerStats[key]) {
        playerStats[key] = {
          playerName: a.playerName,
          playerAvatar: a.playerAvatar,
          achievementCount: 0,
          achievements: []
        };
      }
      playerStats[key].achievementCount++;
      if (!playerStats[key].achievements.includes(a.achievementId)) {
        playerStats[key].achievements.push(a.achievementId);
      }
    });

    return Object.values(playerStats)
      .sort((a, b) => b.achievements.length - a.achievements.length)
      .slice(0, 10);
  }
};

// Try to auto-initialize Firebase on load
FirebaseBackend.tryAutoInit();
