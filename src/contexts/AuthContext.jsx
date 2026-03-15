/**
 * AUTH CONTEXT
 * Provides authentication state and methods (Google OAuth + Guest mode)
 * Uses Firebase Auth with the modular SDK
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { FirebaseBackend } from '../services/firebase';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Ensure Firebase is initialized before listening
    const setupAuthListener = async () => {
      try {
        // Try async init if not already initialized
        if (!FirebaseBackend.initialized) {
          await FirebaseBackend.initAsync();
        }

        const auth = FirebaseBackend.auth;
        if (!auth) {
          logger.warn('Firebase auth not available, falling back to guest mode');
          setIsLoading(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        logger.warn('Auth listener setup failed:', err);
        setIsLoading(false);
      }
    };

    let unsubscribe;
    setupAuthListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const auth = FirebaseBackend.auth;
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      // Don't log popup-closed-by-user as an error
      if (err.code === 'auth/popup-closed-by-user') {
        logger.log('Google sign-in popup closed by user');
        return;
      }
      logger.error('Google sign-in failed:', err);
      throw err;
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    try {
      const auth = FirebaseBackend.auth;
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      await signInAnonymously(auth);
    } catch (err) {
      logger.error('Guest sign-in failed:', err);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      const auth = FirebaseBackend.auth;
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      logger.error('Sign-out failed:', err);
      throw err;
    }
  }, []);

  const isAuthenticated = !!user;
  const userDisplayName = user?.displayName || (user?.isAnonymous ? 'Guest' : '');
  const userPhotoURL = user?.photoURL || null;
  const userEmail = user?.email || null;

  const value = {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInAsGuest,
    signOut: signOutUser,
    userDisplayName,
    userPhotoURL,
    userEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
