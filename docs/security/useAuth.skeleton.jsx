/**
 * AUTHENTICATION HOOK - SKELETON IMPLEMENTATION
 *
 * This is a starter template for implementing Firebase Authentication
 * in Truth Hunters. Copy this to src/hooks/useAuth.js and complete
 * the TODO items.
 *
 * Features:
 * - Anonymous authentication for students (auto-login)
 * - Email/password authentication for teachers
 * - Custom claims for role-based access control
 * - React Context for global auth state
 * - Auto-reauth on page refresh
 *
 * Usage:
 *   import { useAuth } from '../hooks/useAuth';
 *
 *   function MyComponent() {
 *     const { user, isTeacher, loginTeacher, logout } = useAuth();
 *
 *     if (!user) return <div>Loading...</div>;
 *     return <div>Hello, {isTeacher ? 'Teacher' : 'Student'}!</div>;
 *   }
 */

import { useState, useEffect, createContext, useContext } from 'react';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

// ==================== AUTH CONTEXT ====================

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the app to provide authentication state globally
 *
 * TODO: Add this to src/App.jsx:
 *   import { AuthProvider } from './hooks/useAuth';
 *
 *   function App() {
 *     return (
 *       <AuthProvider>
 *         <YourAppContent />
 *       </AuthProvider>
 *     );
 *   }
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User metadata
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // TODO: Initialize Firebase first
    if (!FirebaseBackend.initialized) {
      FirebaseBackend.init();
    }

    const auth = getAuth(FirebaseBackend.app);

    // Listen for auth state changes (login, logout, page refresh)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in
          setUser(firebaseUser);
          setIsAnonymous(firebaseUser.isAnonymous);

          // Check for custom claims (roles)
          if (!firebaseUser.isAnonymous) {
            const tokenResult = await firebaseUser.getIdTokenResult();
            const role = tokenResult.claims.role || 'student';

            setUserRole(role);
            setIsTeacher(role === 'teacher');
            setIsAdmin(role === 'admin');

            logger.log(`User logged in: ${firebaseUser.email} (${role})`);
          } else {
            setUserRole('student');
            setIsTeacher(false);
            setIsAdmin(false);

            logger.log(`Anonymous user logged in: ${firebaseUser.uid}`);
          }
        } else {
          // User is logged out
          setUser(null);
          setIsAnonymous(false);
          setIsTeacher(false);
          setIsAdmin(false);
          setUserRole(null);

          logger.log('User logged out');
        }
      } catch (err) {
        logger.warn('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // ==================== AUTH ACTIONS ====================

  /**
   * Login anonymously (for students)
   * Called automatically on first visit
   */
  const loginAnonymous = async () => {
    try {
      setError(null);
      const auth = getAuth(FirebaseBackend.app);
      const result = await signInAnonymously(auth);

      logger.log('Anonymous login successful:', result.user.uid);
      return result.user;
    } catch (err) {
      logger.warn('Anonymous login failed:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Login with email/password (for teachers)
   */
  const loginTeacher = async (email, password) => {
    try {
      setError(null);
      const auth = getAuth(FirebaseBackend.app);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Verify email is confirmed
      if (!result.user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }

      // Verify teacher role (custom claim)
      const tokenResult = await result.user.getIdTokenResult();
      const role = tokenResult.claims.role;

      if (role !== 'teacher' && role !== 'admin') {
        await signOut(auth);
        throw new Error('Unauthorized: Teacher access required. Your account may still be pending approval.');
      }

      logger.log('Teacher login successful:', result.user.email);
      return result.user;
    } catch (err) {
      logger.warn('Teacher login failed:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Signup for teacher account
   * Requires email verification and admin approval
   */
  const signupTeacher = async (email, password, schoolInfo) => {
    try {
      setError(null);
      const auth = getAuth(FirebaseBackend.app);

      // Validate school email domain (optional but recommended)
      const schoolDomains = ['.edu', '.k12.', 'schools.', 'district.', 'academy.'];
      const hasSchoolDomain = schoolDomains.some(domain => email.toLowerCase().includes(domain));

      if (!hasSchoolDomain) {
        logger.warn('Non-school email used for signup:', email);
        // You can choose to block or just warn
        // throw new Error('Please use a school email address (.edu, .k12, etc.)');
      }

      // Create user account
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(result.user, {
        displayName: schoolInfo.teacherName || 'Teacher'
      });

      // Send verification email
      await sendEmailVerification(result.user);

      // Request teacher role (requires admin approval)
      // TODO: Implement Cloud Function to handle this
      await requestTeacherRole(result.user.uid, {
        email,
        schoolName: schoolInfo.schoolName,
        gradeLevel: schoolInfo.gradeLevel,
        teacherName: schoolInfo.teacherName
      });

      logger.log('Teacher signup successful:', email);

      // Sign out until email is verified
      await signOut(auth);

      return {
        user: result.user,
        message: 'Signup successful! Please check your email to verify your account.'
      };
    } catch (err) {
      logger.warn('Teacher signup failed:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Request teacher role (via Firestore, admin approves later)
   * TODO: Replace with Cloud Function call for better security
   */
  const requestTeacherRole = async (uid, info) => {
    try {
      // For now, write directly to Firestore
      // TODO: Replace with Cloud Function: httpsCallable(getFunctions(), 'requestTeacherRole')
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

      await addDoc(collection(FirebaseBackend.db, 'teacherRequests'), {
        uid,
        email: info.email,
        schoolName: info.schoolName,
        gradeLevel: info.gradeLevel,
        teacherName: info.teacherName,
        status: 'pending',
        requestedAt: serverTimestamp()
      });

      logger.log('Teacher role requested for:', uid);
    } catch (err) {
      logger.warn('Failed to request teacher role:', err);
      // Don't throw - account is created, just role request failed
    }
  };

  /**
   * Password reset
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      const auth = getAuth(FirebaseBackend.app);
      await sendPasswordResetEmail(auth, email);

      logger.log('Password reset email sent:', email);
      return { message: 'Password reset email sent. Check your inbox.' };
    } catch (err) {
      logger.warn('Password reset failed:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      setError(null);
      const auth = getAuth(FirebaseBackend.app);
      await signOut(auth);

      logger.log('User logged out');
    } catch (err) {
      logger.warn('Logout failed:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Refresh user token (to get updated custom claims)
   * Call this after admin approves teacher role
   */
  const refreshToken = async () => {
    try {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true); // force refresh
        const role = tokenResult.claims.role || 'student';

        setUserRole(role);
        setIsTeacher(role === 'teacher');
        setIsAdmin(role === 'admin');

        logger.log('Token refreshed, new role:', role);
        return role;
      }
    } catch (err) {
      logger.warn('Token refresh failed:', err);
      throw err;
    }
  };

  // ==================== CONTEXT VALUE ====================

  const value = {
    // User state
    user,
    loading,
    error,
    isTeacher,
    isAdmin,
    isAnonymous,
    userRole,

    // Auth actions
    loginAnonymous,
    loginTeacher,
    signupTeacher,
    resetPassword,
    logout,
    refreshToken,

    // Helpers
    isAuthenticated: !!user,
    uid: user?.uid || null,
    email: user?.email || null,
    displayName: user?.displayName || (user?.isAnonymous ? 'Student' : 'User')
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * useAuth Hook
 * Provides access to authentication state and actions
 *
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

// ==================== HELPER COMPONENTS ====================

/**
 * ProtectedRoute Component
 * Redirects to login if not authenticated or not authorized
 *
 * Usage:
 *   <ProtectedRoute requireTeacher>
 *     <TeacherDashboard />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({ children, requireTeacher = false, requireAdmin = false }) {
  const { user, isTeacher, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <div className="error">Please log in to access this page.</div>;
  }

  if (requireAdmin && !isAdmin) {
    return <div className="error">Admin access required.</div>;
  }

  if (requireTeacher && !isTeacher && !isAdmin) {
    return <div className="error">Teacher access required.</div>;
  }

  return children;
}

/**
 * AutoLogin Component
 * Automatically logs in anonymous users on first visit
 *
 * Usage in App.jsx:
 *   <AuthProvider>
 *     <AutoLogin>
 *       <YourApp />
 *     </AutoLogin>
 *   </AuthProvider>
 */
export function AutoLogin({ children }) {
  const { user, loginAnonymous, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !user && !initialized) {
      loginAnonymous()
        .then(() => setInitialized(true))
        .catch(err => {
          logger.warn('Auto-login failed:', err);
          setInitialized(true); // Continue anyway
        });
    } else if (user) {
      setInitialized(true);
    }
  }, [user, loginAnonymous, loading, initialized]);

  if (!initialized) {
    return <div className="loading">Initializing...</div>;
  }

  return children;
}

// ==================== EXPORTS ====================

export default useAuth;
