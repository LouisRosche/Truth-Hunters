# Truth Hunters Security Implementation Plan

**Status**: CRITICAL - 3 Major Security Issues
**Priority**: HIGH
**Complexity**: Medium-High (requires architectural changes)
**Estimated Time**: 16-24 hours of development

---

## Executive Summary

Truth Hunters currently has three critical security vulnerabilities that must be addressed before production deployment:

1. **No Authentication System** - Anyone can perform any action
2. **Unrestricted Firestore Writes** - Database is vulnerable to abuse
3. **Client-Side Only Rate Limiting** - Trivially bypassed

This document provides a comprehensive plan to implement proper security while maintaining the educational game's ease of use.

---

## Table of Contents

- [Current Security State](#current-security-state)
- [Security Architecture Overview](#security-architecture-overview)
- [Implementation Plan](#implementation-plan)
  - [Phase 1: Authentication System](#phase-1-authentication-system)
  - [Phase 2: Firestore Security Rules](#phase-2-firestore-security-rules)
  - [Phase 3: Rate Limiting](#phase-3-rate-limiting)
  - [Phase 4: Data Migration](#phase-4-data-migration)
- [User Roles & Permissions](#user-roles--permissions)
- [Implementation Checklist](#implementation-checklist)
- [Testing Requirements](#testing-requirements)
- [Deployment Strategy](#deployment-strategy)

---

## Current Security State

### Critical Issues

#### 1. No Authentication System
**Risk Level**: CRITICAL
**Impact**: Anyone can impersonate teachers, approve claims, modify settings

**Current State**:
- No user login or signup
- No session management
- No identity verification
- Teacher dashboard accessible to anyone via URL parameter

**Exploitation Scenario**:
```
1. Student discovers ?teacher=true URL parameter
2. Student accesses Teacher Dashboard
3. Student approves malicious claims
4. Student modifies class settings
5. Student views all student submissions
```

#### 2. Unrestricted Firestore Writes
**Risk Level**: CRITICAL
**Impact**: Database can be filled with spam, costs spike, data integrity compromised

**Current State** (`firestore.rules`):
```javascript
// Line 91: All reads are public
allow read: if true;

// Line 94-114: Anyone can create games with basic validation only
allow create: if [basic validation only];

// Line 218-229: Anyone can modify class settings
allow create, update: if validClassCode(classCode);
```

**Exploitation Scenario**:
```javascript
// Attacker script (runs in browser console)
for (let i = 0; i < 10000; i++) {
  await addDoc(collection(db, 'games'), {
    teamName: 'Spam ' + i,
    score: 100,
    classCode: 'VICTIM-CLASS',
    createdAt: serverTimestamp()
  });
}
// Result: Database flooded, Firebase bill increases, leaderboard unusable
```

#### 3. Client-Side Rate Limiting
**Risk Level**: HIGH
**Impact**: Spam prevention easily bypassed

**Current State** (`firebase.js` lines 342-385):
```javascript
// In-memory rate limiting (cleared on page refresh)
_recentSubmissions: [],
_RATE_LIMIT_WINDOW_MS: 60000,
_RATE_LIMIT_MAX: 3,

// Easy bypass methods:
// 1. Open incognito window
// 2. Clear browser cache
// 3. Use different browser
// 4. Refresh page
```

**Exploitation Scenario**:
```bash
# Attacker uses multiple browser profiles
for i in {1..100}; do
  chrome --user-data-dir=/tmp/profile$i https://truthhunters.com &
done
# Each browser instance has fresh rate limit counter
```

### Non-Critical Issues

#### 4. Class Code as Access Control
**Risk Level**: MEDIUM
**Impact**: Predictable class codes allow cross-class access

Class codes like `PERIOD1`, `MATH101` are easily guessed, allowing:
- Students to see other classes' leaderboards
- Cross-class claim submissions
- Leaderboard pollution

#### 5. No Audit Trail
**Risk Level**: MEDIUM
**Impact**: Cannot track who did what

No logging of:
- Who approved/rejected claims
- Who modified class settings
- When data was deleted
- Source IP or user agent

---

## Security Architecture Overview

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Anonymous Students          Authenticated Teachers         │
│  ├─ Play games              ├─ Email/password login         │
│  ├─ View leaderboards       ├─ Manage class settings        │
│  ├─ Submit claims           ├─ Review student claims        │
│  └─ Earn achievements       └─ View analytics               │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FIREBASE AUTH LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ├─ Anonymous Auth (students) - auto-generated IDs          │
│  ├─ Email/Password Auth (teachers) - verified accounts      │
│  └─ Custom Claims (roles: student, teacher, admin)          │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FIRESTORE SECURITY RULES                   │
├─────────────────────────────────────────────────────────────┤
│  ├─ Read: Authenticated users only, filtered by class       │
│  ├─ Write (Students): Validated, rate-limited               │
│  ├─ Write (Teachers): Admin operations only                 │
│  └─ Custom validation per collection                        │
└──────────────────┬──────────────────────┬───────────────────┘
                   │                      │
                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUD FUNCTIONS LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  ├─ Rate limiting (per-user quotas)                         │
│  ├─ Content moderation (AI-powered)                         │
│  ├─ Data sanitization                                       │
│  ├─ Audit logging                                           │
│  └─ Teacher role assignment                                 │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. Anonymous Auth for Students
**Why**: Reduces friction, no PII collection, FERPA-compliant

**Implementation**:
- Students auto-login with Firebase Anonymous Auth
- Persistent user ID stored in browser
- No email/password required
- Can link to email later if desired

**Benefits**:
- ✅ No signup forms
- ✅ No email collection
- ✅ Persistent identity across sessions
- ✅ Rate limiting per user (not per browser)

#### 2. Email/Password Auth for Teachers
**Why**: Need verified identity for administrative actions

**Implementation**:
- Teachers create accounts with school email
- Email verification required
- Password reset flow
- Custom claims for role assignment

**Benefits**:
- ✅ Verified teacher identity
- ✅ Account recovery
- ✅ Audit trail (who approved what)
- ✅ Role-based access control

#### 3. Firestore Security Rules as Primary Defense
**Why**: Server-side enforcement, cannot be bypassed

**Implementation**:
- Rules check `request.auth.uid` (requires authentication)
- Custom claims verify roles (`request.auth.token.role`)
- Field-level validation
- Rate limiting via server timestamps

**Benefits**:
- ✅ Enforced server-side
- ✅ Cannot be bypassed by client
- ✅ Granular permissions
- ✅ Performance (no Cloud Function overhead for reads)

#### 4. Cloud Functions for Complex Operations
**Why**: Advanced logic that can't fit in security rules

**Implementation**:
- Rate limiting beyond simple timestamp checks
- Content moderation (profanity filter, spam detection)
- Teacher role assignment (admin approval)
- Scheduled cleanup (old sessions, expired claims)

**Benefits**:
- ✅ Complex business logic
- ✅ Third-party API integration
- ✅ Scheduled tasks
- ✅ Centralized monitoring

---

## Implementation Plan

### Phase 1: Authentication System

**Estimated Time**: 6-8 hours
**Priority**: CRITICAL (blocks other phases)

#### 1.1 Firebase Auth Setup

**File**: `src/services/auth.js` (new)

```javascript
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

export const AuthService = {
  auth: null,

  init() {
    this.auth = getAuth(FirebaseBackend.app);
  },

  // Student login (anonymous)
  async loginAnonymous() {
    const result = await signInAnonymously(this.auth);
    return result.user;
  },

  // Teacher login
  async loginTeacher(email, password) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);

    // Verify email is confirmed
    if (!result.user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Verify teacher role (custom claim)
    const tokenResult = await result.user.getIdTokenResult();
    if (tokenResult.claims.role !== 'teacher') {
      throw new Error('Unauthorized: Teacher access required');
    }

    return result.user;
  },

  // Teacher signup
  async signupTeacher(email, password, schoolInfo) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);

    // Send verification email
    await sendEmailVerification(result.user);

    // Request teacher role (requires admin approval)
    await this.requestTeacherRole(result.user.uid, schoolInfo);

    return result.user;
  },

  // Request teacher role via Cloud Function
  async requestTeacherRole(uid, schoolInfo) {
    const requestTeacherRoleFunction = httpsCallable(getFunctions(), 'requestTeacherRole');
    await requestTeacherRoleFunction({
      uid,
      schoolName: schoolInfo.schoolName,
      gradeLevel: schoolInfo.gradeLevel,
      verificationDocument: schoolInfo.verificationDocument // optional: school email domain, ID, etc.
    });
  },

  // Logout
  async logout() {
    await signOut(this.auth);
  },

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  },

  // Listen for auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(this.auth, callback);
  }
};
```

#### 1.2 React Auth Hook

**File**: `src/hooks/useAuth.js` (new)

```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import { AuthService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Initialize auth service
    AuthService.init();

    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChange(async (user) => {
      if (user) {
        setUser(user);
        setIsAnonymous(user.isAnonymous);

        // Check for teacher role
        if (!user.isAnonymous) {
          const tokenResult = await user.getIdTokenResult();
          setIsTeacher(tokenResult.claims.role === 'teacher');
        } else {
          setIsTeacher(false);
        }
      } else {
        setUser(null);
        setIsAnonymous(false);
        setIsTeacher(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    isTeacher,
    isAnonymous,
    loginAnonymous: () => AuthService.loginAnonymous(),
    loginTeacher: (email, password) => AuthService.loginTeacher(email, password),
    signupTeacher: (email, password, schoolInfo) => AuthService.signupTeacher(email, password, schoolInfo),
    logout: () => AuthService.logout()
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 1.3 Auto-Login on First Visit

**File**: `src/App.jsx` (modify)

```javascript
function App() {
  const { user, loginAnonymous, isAnonymous } = useAuth();

  useEffect(() => {
    // Auto-login anonymous users on first visit
    if (!user) {
      loginAnonymous().catch(err => {
        console.warn('Anonymous login failed:', err);
      });
    }
  }, [user, loginAnonymous]);

  return (
    <AuthProvider>
      {/* App content */}
    </AuthProvider>
  );
}
```

#### 1.4 Teacher Login UI

**File**: `src/components/TeacherLogin.jsx` (new)

```javascript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function TeacherLogin() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: '',
    gradeLevel: 'middle'
  });
  const [error, setError] = useState('');
  const { loginTeacher, signupTeacher } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await loginTeacher(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validate school email domain (optional)
    const schoolDomains = ['.edu', '.k12.', 'schools.', 'district.'];
    const hasSchoolDomain = schoolDomains.some(d => email.includes(d));

    if (!hasSchoolDomain) {
      setError('Please use a school email address (.edu, .k12, etc.)');
      return;
    }

    try {
      await signupTeacher(email, password, schoolInfo);
      setMode('verify');
    } catch (err) {
      setError(err.message);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="teacher-login-card">
        <h2>Check Your Email</h2>
        <p>We've sent a verification link to <strong>{email}</strong></p>
        <p>Please click the link to verify your email, then return here to log in.</p>
        <button onClick={() => setMode('login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="teacher-login-card">
      <h2>{mode === 'login' ? 'Teacher Login' : 'Teacher Signup'}</h2>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        <input
          type="email"
          placeholder="School Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="School Name"
              value={schoolInfo.schoolName}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, schoolName: e.target.value })}
              required
            />

            <select
              value={schoolInfo.gradeLevel}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, gradeLevel: e.target.value })}
            >
              <option value="elementary">Elementary</option>
              <option value="middle">Middle School</option>
              <option value="high">High School</option>
              <option value="college">College</option>
            </select>
          </>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit">
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <button className="link-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </div>
  );
}
```

#### 1.5 Class Enrollment Flow

**Concept**: Teachers create classes, students join with class codes

**Database Schema**:
```javascript
// New collection: classes
{
  id: "auto-generated",
  classCode: "PERIOD1-2025", // teacher-chosen, validated unique
  className: "6th Grade Science - Period 1",
  teacherId: "firebase-auth-uid",
  teacherName: "Ms. Johnson",
  teacherEmail: "mjohnson@school.edu",
  createdAt: serverTimestamp(),
  settings: {
    allowedDifficulties: ['easy', 'medium', 'hard'],
    defaultRounds: 5,
    gradeLevel: 'middle'
  },
  studentIds: [], // array of anonymous auth UIDs
  archived: false
}

// Modified collection: games
{
  // existing fields...
  userId: "firebase-auth-uid", // anonymous student ID
  classId: "class-document-id" // reference to classes collection
}
```

**Flow**:
1. Teacher creates class (auto-generates secure class code)
2. Teacher shares class code with students (on board, printed sheet)
3. Student enters class code on first visit
4. Student's anonymous auth UID added to class.studentIds
5. All game data linked to userId + classId

**Benefits**:
- ✅ No guessable class codes (crypto.randomBytes)
- ✅ Teacher controls class membership
- ✅ Students can be removed from class
- ✅ Cross-class access prevented
- ✅ Audit trail (who joined when)

---

### Phase 2: Firestore Security Rules

**Estimated Time**: 4-6 hours
**Priority**: CRITICAL (blocks production deployment)

#### 2.1 Updated Security Rules

**File**: `firestore.rules` (replace)

See: `docs/security/firestore.rules.secure` (created in next section)

**Key Changes**:
- All operations require authentication (`request.auth != null`)
- Teacher operations check custom claims (`request.auth.token.role == 'teacher'`)
- Students can only modify their own data
- Rate limiting enforced server-side
- Field-level validation
- Audit fields (createdBy, modifiedBy) required

#### 2.2 Per-Collection Security

**Games Collection**:
```javascript
match /games/{gameId} {
  // Read: Only members of the class
  allow read: if request.auth != null &&
                 isClassMember(resource.data.classId);

  // Create: Authenticated students only, with validation
  allow create: if request.auth != null &&
                   request.resource.data.userId == request.auth.uid &&
                   isClassMember(request.resource.data.classId) &&
                   validGameData(request.resource.data) &&
                   !isRateLimited('games');

  // No updates or deletes (games are immutable)
  allow update, delete: if false;
}

function isClassMember(classId) {
  let classDoc = get(/databases/$(database)/documents/classes/$(classId));
  return request.auth.uid in classDoc.data.studentIds ||
         request.auth.uid == classDoc.data.teacherId;
}

function validGameData(data) {
  return data.keys().hasAll(['userId', 'classId', 'teamName', 'score', 'createdAt']) &&
         data.userId is string &&
         data.classId is string &&
         validStringLength(data.teamName, 2, 50) &&
         validNumber(data.score, -50, 100) &&
         data.createdAt == request.time;
}

function isRateLimited(operation) {
  // Check if user has written to this collection in last 30 seconds
  let userRateDoc = get(/databases/$(database)/documents/rateLimits/$(request.auth.uid));
  return exists(/databases/$(database)/documents/rateLimits/$(request.auth.uid)) &&
         userRateDoc.data[operation + 'LastWrite'] != null &&
         (request.time - userRateDoc.data[operation + 'LastWrite']).toMillis() < 30000;
}
```

**Classes Collection**:
```javascript
match /classes/{classId} {
  // Read: Class members only
  allow read: if request.auth != null && isClassMember(classId);

  // Create: Teachers only
  allow create: if request.auth != null &&
                   request.auth.token.role == 'teacher' &&
                   request.resource.data.teacherId == request.auth.uid &&
                   validClassCode(request.resource.data.classCode) &&
                   isUniqueClassCode(request.resource.data.classCode);

  // Update: Class teacher only
  allow update: if request.auth != null &&
                   request.auth.token.role == 'teacher' &&
                   resource.data.teacherId == request.auth.uid;

  // Delete: Class teacher only, only if no games exist
  allow delete: if request.auth != null &&
                   request.auth.token.role == 'teacher' &&
                   resource.data.teacherId == request.auth.uid &&
                   !hasClassGames(classId);
}

function isUniqueClassCode(code) {
  // Query to check if class code already exists
  return !exists(/databases/$(database)/documents/classes/$(code));
}

function hasClassGames(classId) {
  // This is expensive - better handled by Cloud Function
  // For rules, we'll allow delete and handle in application layer
  return false;
}
```

**Pending Claims Collection**:
```javascript
match /pendingClaims/{claimId} {
  // Read: Class members and teachers
  allow read: if request.auth != null &&
                 (isClassMember(resource.data.classId) ||
                  request.auth.token.role == 'teacher');

  // Create: Authenticated students only
  allow create: if request.auth != null &&
                   request.resource.data.submitterId == request.auth.uid &&
                   isClassMember(request.resource.data.classId) &&
                   validClaimData(request.resource.data) &&
                   !isRateLimited('claims');

  // Update: Teachers only (for review)
  allow update: if request.auth != null &&
                   request.auth.token.role == 'teacher' &&
                   request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['status', 'reviewedAt', 'reviewedBy', 'reviewerNote']) &&
                   request.resource.data.reviewedBy == request.auth.uid;

  // Delete: Teachers only
  allow delete: if request.auth != null &&
                   request.auth.token.role == 'teacher';
}

function validClaimData(data) {
  return data.keys().hasAll(['claimText', 'answer', 'explanation', 'submitterId', 'classId', 'status', 'submittedAt']) &&
         validStringLength(data.claimText, 20, 500) &&
         data.answer in ['TRUE', 'FALSE', 'MIXED'] &&
         validStringLength(data.explanation, 10, 1000) &&
         data.status == 'pending' &&
         data.submittedAt == request.time;
}
```

**Rate Limits Collection**:
```javascript
match /rateLimits/{userId} {
  // Users can read their own rate limit doc
  allow read: if request.auth != null && request.auth.uid == userId;

  // Users can update their own rate limit doc (auto-updated on write)
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

#### 2.3 Testing Security Rules

**File**: `firestore.rules.test.js` (new)

```javascript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  describe('Games Collection', () => {
    it('denies unauthenticated reads', async () => {
      const db = getFirestore(null); // no auth
      await assertFails(getDoc(doc(db, 'games', 'game1')));
    });

    it('allows authenticated class members to read', async () => {
      const db = getFirestore({ uid: 'student1' });
      await assertSucceeds(getDoc(doc(db, 'games', 'game1')));
    });

    it('denies writes with invalid score', async () => {
      const db = getFirestore({ uid: 'student1' });
      await assertFails(addDoc(collection(db, 'games'), {
        userId: 'student1',
        classId: 'class1',
        teamName: 'Team',
        score: 999, // invalid: exceeds max
        createdAt: serverTimestamp()
      }));
    });
  });

  describe('Classes Collection', () => {
    it('denies class creation by students', async () => {
      const db = getFirestore({ uid: 'student1', role: 'student' });
      await assertFails(addDoc(collection(db, 'classes'), {
        classCode: 'TEST123',
        teacherId: 'student1',
        createdAt: serverTimestamp()
      }));
    });

    it('allows class creation by teachers', async () => {
      const db = getFirestore({ uid: 'teacher1', role: 'teacher' });
      await assertSucceeds(addDoc(collection(db, 'classes'), {
        classCode: 'TEST123',
        teacherId: 'teacher1',
        createdAt: serverTimestamp()
      }));
    });
  });
});
```

---

### Phase 3: Rate Limiting

**Estimated Time**: 4-6 hours
**Priority**: HIGH (prevents abuse)

#### 3.1 Cloud Functions Rate Limiter

**File**: `functions/src/rateLimiter.js` (new)

```javascript
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

const db = getFirestore();

// Rate limit configuration
const RATE_LIMITS = {
  games: {
    windowMs: 30000, // 30 seconds
    maxRequests: 1
  },
  claims: {
    windowMs: 60000, // 1 minute
    maxRequests: 3
  },
  achievements: {
    windowMs: 10000, // 10 seconds
    maxRequests: 5
  }
};

/**
 * Check if user is rate limited for a specific operation
 * Returns: { allowed: boolean, retryAfter: number }
 */
exports.checkRateLimit = onCall(async (request) => {
  const { operation } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  if (!RATE_LIMITS[operation]) {
    throw new HttpsError('invalid-argument', 'Invalid operation type');
  }

  const config = RATE_LIMITS[operation];
  const rateLimitDoc = db.collection('rateLimits').doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitDoc);
      const now = Date.now();

      if (!doc.exists) {
        // First request - allow and create doc
        transaction.set(rateLimitDoc, {
          [operation]: {
            count: 1,
            windowStart: now
          }
        });
        return { allowed: true, retryAfter: 0 };
      }

      const data = doc.data();
      const opData = data[operation] || { count: 0, windowStart: now };

      // Check if window has expired
      if (now - opData.windowStart > config.windowMs) {
        // New window - reset counter
        transaction.update(rateLimitDoc, {
          [operation]: {
            count: 1,
            windowStart: now
          }
        });
        return { allowed: true, retryAfter: 0 };
      }

      // Within window - check limit
      if (opData.count >= config.maxRequests) {
        const retryAfter = config.windowMs - (now - opData.windowStart);
        logger.warn(`Rate limit exceeded for user ${userId} on operation ${operation}`);
        return { allowed: false, retryAfter };
      }

      // Increment counter
      transaction.update(rateLimitDoc, {
        [`${operation}.count`]: FieldValue.increment(1)
      });
      return { allowed: true, retryAfter: 0 };
    });

    return result;
  } catch (error) {
    logger.error('Rate limit check failed:', error);
    // On error, allow request (fail open to not block legitimate users)
    return { allowed: true, retryAfter: 0 };
  }
});

/**
 * Middleware-style rate limiter for callable functions
 */
exports.withRateLimit = (operation, handler) => {
  return onCall(async (request) => {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const rateLimitCheck = await exports.checkRateLimit({
      data: { operation },
      auth: { uid: userId }
    });

    if (!rateLimitCheck.allowed) {
      throw new HttpsError(
        'resource-exhausted',
        `Too many requests. Please try again in ${Math.ceil(rateLimitCheck.retryAfter / 1000)} seconds.`,
        { retryAfter: rateLimitCheck.retryAfter }
      );
    }

    return handler(request);
  });
};
```

#### 3.2 Rate-Limited Cloud Functions

**File**: `functions/src/index.js` (new)

```javascript
const { withRateLimit } = require('./rateLimiter');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

const db = getFirestore();

/**
 * Submit a game score (rate-limited)
 */
exports.submitGame = withRateLimit('games', async (request) => {
  const { teamName, score, classId, players } = request.data;
  const userId = request.auth.uid;

  // Validation
  if (!teamName || typeof score !== 'number' || !classId) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  // Verify user is member of class
  const classDoc = await db.collection('classes').doc(classId).get();
  if (!classDoc.exists) {
    throw new HttpsError('not-found', 'Class not found');
  }

  const classData = classDoc.data();
  if (!classData.studentIds.includes(userId) && classData.teacherId !== userId) {
    throw new HttpsError('permission-denied', 'Not a member of this class');
  }

  // Create game record
  const gameData = {
    userId,
    classId,
    teamName: sanitize(teamName),
    score,
    players: (players || []).map(p => ({
      firstName: sanitize(p.firstName),
      lastInitial: sanitize(p.lastInitial)
    })),
    createdAt: FieldValue.serverTimestamp()
  };

  const gameRef = await db.collection('games').add(gameData);

  logger.info(`Game created: ${gameRef.id} by user ${userId}`);

  return { success: true, gameId: gameRef.id };
});

/**
 * Submit a claim for review (rate-limited)
 */
exports.submitClaim = withRateLimit('claims', async (request) => {
  const { claimText, answer, explanation, classId, subject, difficulty } = request.data;
  const userId = request.auth.uid;

  // Validation
  if (!claimText || !answer || !explanation || !classId) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  if (claimText.length < 20 || claimText.length > 500) {
    throw new HttpsError('invalid-argument', 'Claim text must be 20-500 characters');
  }

  // Content moderation
  const moderationResult = await moderateContent(claimText);
  if (moderationResult.flagged) {
    logger.warn(`Inappropriate claim submitted by ${userId}: ${moderationResult.reason}`);
    throw new HttpsError('invalid-argument', 'Claim contains inappropriate content');
  }

  // Create claim
  const claimData = {
    submitterId: userId,
    classId,
    claimText: sanitize(claimText),
    answer,
    explanation: sanitize(explanation),
    subject: subject || 'General',
    difficulty: difficulty || 'medium',
    status: 'pending',
    submittedAt: FieldValue.serverTimestamp()
  };

  const claimRef = await db.collection('pendingClaims').add(claimData);

  logger.info(`Claim created: ${claimRef.id} by user ${userId}`);

  return { success: true, claimId: claimRef.id };
});

/**
 * Moderate content using simple profanity filter
 * (Replace with AI moderation service like Perspective API for production)
 */
async function moderateContent(text) {
  const lowerText = text.toLowerCase();

  // Simple profanity check (expand as needed)
  const profanityList = ['badword1', 'badword2']; // Use proper list
  const hasProfanity = profanityList.some(word => lowerText.includes(word));

  if (hasProfanity) {
    return { flagged: true, reason: 'Contains inappropriate language' };
  }

  // Spam detection (too many repeated characters)
  const repeatedChars = /(.)\1{5,}/;
  if (repeatedChars.test(text)) {
    return { flagged: true, reason: 'Appears to be spam' };
  }

  return { flagged: false };
}

function sanitize(text) {
  return String(text).trim().slice(0, 500);
}
```

#### 3.3 Client-Side Rate Limit Handling

**File**: `src/services/firebase.js` (modify)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

export const FirebaseBackend = {
  // ... existing code ...

  /**
   * Submit game with server-side rate limiting
   */
  async save(record) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const functions = getFunctions(this.app);
      const submitGame = httpsCallable(functions, 'submitGame');

      const result = await submitGame({
        teamName: record.teamName,
        score: record.score,
        classId: this.classId,
        players: record.players
      });

      return { success: true, gameId: result.data.gameId };
    } catch (error) {
      if (error.code === 'functions/resource-exhausted') {
        // Rate limit exceeded
        const retryAfter = error.details?.retryAfter || 30000;
        return {
          success: false,
          error: error.message,
          rateLimited: true,
          retryAfter
        };
      }

      logger.warn('Failed to save game:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Submit claim with server-side rate limiting
   */
  async submitClaim(claimData) {
    if (!this.initialized || !this.db) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const functions = getFunctions(this.app);
      const submitClaim = httpsCallable(functions, 'submitClaim');

      const result = await submitClaim({
        claimText: claimData.claimText,
        answer: claimData.answer,
        explanation: claimData.explanation,
        classId: this.classId,
        subject: claimData.subject,
        difficulty: claimData.difficulty
      });

      return { success: true, claimId: result.data.claimId };
    } catch (error) {
      if (error.code === 'functions/resource-exhausted') {
        const retryAfter = error.details?.retryAfter || 60000;
        return {
          success: false,
          error: error.message,
          rateLimited: true,
          retryAfter
        };
      }

      logger.warn('Failed to submit claim:', error);
      return { success: false, error: error.message };
    }
  }
};
```

---

### Phase 4: Data Migration

**Estimated Time**: 2-3 hours
**Priority**: MEDIUM (only needed if existing data exists)

#### 4.1 Migration Strategy

**Problem**: Existing games/claims don't have userId/classId fields

**Solution**: One-time migration script

**File**: `scripts/migrateData.js` (new)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateGames() {
  console.log('Migrating games collection...');

  const gamesSnapshot = await db.collection('games').get();
  let migrated = 0;

  const batch = db.batch();

  for (const doc of gamesSnapshot.docs) {
    const data = doc.data();

    // Skip if already migrated
    if (data.userId) {
      continue;
    }

    // Create anonymous user ID based on class code + team name
    // This is imperfect but best we can do without real user IDs
    const syntheticUserId = `migrated_${data.classCode}_${data.teamName}`.replace(/[^a-zA-Z0-9]/g, '_');

    // Try to find or create class for this class code
    let classId = await findOrCreateClass(data.classCode);

    batch.update(doc.ref, {
      userId: syntheticUserId,
      classId: classId,
      migrated: true,
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    migrated++;

    // Commit every 500 docs (Firestore batch limit)
    if (migrated % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${migrated} games...`);
    }
  }

  if (migrated % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Migrated ${migrated} games total`);
}

async function findOrCreateClass(classCode) {
  // Try to find existing class with this code
  const classesSnapshot = await db.collection('classes')
    .where('classCode', '==', classCode)
    .limit(1)
    .get();

  if (!classesSnapshot.empty) {
    return classesSnapshot.docs[0].id;
  }

  // Create new class for migration
  const newClass = await db.collection('classes').add({
    classCode: classCode,
    className: `Migrated Class: ${classCode}`,
    teacherId: 'MIGRATION_NEEDED', // Teacher must claim this class
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    migrated: true,
    studentIds: []
  });

  console.log(`Created new class for code ${classCode}: ${newClass.id}`);
  return newClass.id;
}

async function main() {
  try {
    await migrateGames();
    // Add other migration functions as needed
    console.log('✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
```

**Usage**:
```bash
# Install dependencies
cd scripts
npm install firebase-admin

# Download service account key from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key
# Save as scripts/serviceAccountKey.json

# Run migration
node migrateData.js

# Review results in Firebase Console
# Verify userId and classId fields exist on all documents
```

---

## User Roles & Permissions

### Role Hierarchy

```
┌────────────────────────────────────────┐
│           SUPER ADMIN                  │
│  - Manage all teachers                 │
│  - Access all classes                  │
│  - Delete any data                     │
│  - View analytics across all schools   │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│            TEACHER                     │
│  - Create/manage own classes           │
│  - Review student claims               │
│  - View class analytics                │
│  - Export class data                   │
│  - Modify class settings               │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│           STUDENT (Anonymous)          │
│  - Play games                          │
│  - Submit scores                       │
│  - Submit claims for review            │
│  - View class leaderboard              │
│  - Earn achievements                   │
└────────────────────────────────────────┘
```

### Permission Matrix

| Action | Student | Teacher | Admin |
|--------|---------|---------|-------|
| **Games** |
| Play game | ✅ | ✅ | ✅ |
| View own scores | ✅ | ✅ | ✅ |
| View class leaderboard | ✅ | ✅ | ✅ |
| View other classes | ❌ | ❌ | ✅ |
| Delete game records | ❌ | ✅ (own class) | ✅ |
| **Claims** |
| Submit claim | ✅ | ✅ | ✅ |
| View pending claims | ✅ (own) | ✅ (own class) | ✅ |
| Approve/reject claims | ❌ | ✅ (own class) | ✅ |
| Edit claims | ❌ | ✅ (own class) | ✅ |
| Delete claims | ❌ | ✅ (own class) | ✅ |
| **Classes** |
| Join class | ✅ | ✅ | ✅ |
| Create class | ❌ | ✅ | ✅ |
| Modify class settings | ❌ | ✅ (own class) | ✅ |
| Delete class | ❌ | ✅ (own class) | ✅ |
| View class roster | ❌ | ✅ (own class) | ✅ |
| **Analytics** |
| View own stats | ✅ | ✅ | ✅ |
| View class stats | ❌ | ✅ (own class) | ✅ |
| View school-wide stats | ❌ | ❌ | ✅ |
| Export data | ❌ | ✅ (own class) | ✅ |

### Custom Claims Implementation

**File**: `functions/src/teacherApproval.js` (new)

```javascript
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const auth = getAuth();
const db = getFirestore();

/**
 * Request teacher role (requires admin approval)
 */
exports.requestTeacherRole = onCall(async (request) => {
  const { uid, schoolName, gradeLevel, verificationDocument } = request.data;
  const requesterId = request.auth?.uid;

  if (!requesterId || requesterId !== uid) {
    throw new HttpsError('permission-denied', 'Can only request role for yourself');
  }

  // Create teacher request document
  await db.collection('teacherRequests').doc(uid).set({
    uid,
    email: request.auth.token.email,
    schoolName,
    gradeLevel,
    verificationDocument: verificationDocument || null,
    status: 'pending',
    requestedAt: FieldValue.serverTimestamp()
  });

  // TODO: Send email to admin for approval
  // TODO: Send confirmation email to requester

  return { success: true, message: 'Teacher role requested. An admin will review your request.' };
});

/**
 * Approve teacher request (admin only)
 */
exports.approveTeacherRequest = onCall(async (request) => {
  const { uid } = request.data;
  const adminUid = request.auth?.uid;

  // Verify requester is admin
  const adminToken = await auth.getUser(adminUid);
  if (adminToken.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  // Get request
  const requestDoc = await db.collection('teacherRequests').doc(uid).get();
  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Teacher request not found');
  }

  // Set custom claim
  await auth.setCustomUserClaims(uid, { role: 'teacher' });

  // Update request status
  await db.collection('teacherRequests').doc(uid).update({
    status: 'approved',
    approvedBy: adminUid,
    approvedAt: FieldValue.serverTimestamp()
  });

  // TODO: Send approval email to teacher

  return { success: true, message: 'Teacher role granted' };
});

/**
 * Set admin role (can only be done via Firebase CLI or this function with existing admin)
 */
exports.setAdminRole = onCall(async (request) => {
  const { uid } = request.data;
  const requesterId = request.auth?.uid;

  // Verify requester is already admin
  const requesterToken = await auth.getUser(requesterId);
  if (requesterToken.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  // Set admin claim
  await auth.setCustomUserClaims(uid, { role: 'admin' });

  return { success: true, message: 'Admin role granted' };
});
```

**Manual Admin Creation** (first admin):
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Set custom claim for first admin
firebase functions:shell

# In shell:
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims('FIRST_ADMIN_UID_HERE', { role: 'admin' });
```

---

## Implementation Checklist

### Phase 1: Authentication (Week 1)

**Backend Setup**:
- [ ] Enable Firebase Authentication in Firebase Console
- [ ] Enable Email/Password provider
- [ ] Enable Anonymous provider
- [ ] Configure email templates (verification, password reset)
- [ ] Set up custom claims for roles

**Code Implementation**:
- [ ] Create `src/services/auth.js`
- [ ] Create `src/hooks/useAuth.js`
- [ ] Create `src/context/AuthContext.jsx`
- [ ] Create `src/components/TeacherLogin.jsx`
- [ ] Create `src/components/StudentClassJoin.jsx`
- [ ] Update `src/App.jsx` with AuthProvider
- [ ] Add auto-login for anonymous users

**Testing**:
- [ ] Test anonymous auth flow
- [ ] Test teacher signup flow
- [ ] Test teacher login flow
- [ ] Test email verification
- [ ] Test password reset
- [ ] Test auth persistence (page refresh)

### Phase 2: Firestore Security (Week 2)

**Rules Development**:
- [ ] Create `firestore.rules.secure` (new secure rules)
- [ ] Add authentication checks to all rules
- [ ] Add role checks for teacher operations
- [ ] Add rate limiting functions
- [ ] Add validation functions
- [ ] Add helper functions (isClassMember, etc.)

**Database Schema**:
- [ ] Create `classes` collection schema
- [ ] Update `games` collection schema (add userId, classId)
- [ ] Update `pendingClaims` schema (add submitterId, classId)
- [ ] Create `teacherRequests` collection schema
- [ ] Document all schemas in `/docs/DATABASE_SCHEMA.md`

**Testing**:
- [ ] Create `firestore.rules.test.js`
- [ ] Test unauthenticated access (should fail)
- [ ] Test student access (limited permissions)
- [ ] Test teacher access (class-level permissions)
- [ ] Test cross-class access (should fail)
- [ ] Test rate limiting
- [ ] Run Firebase emulator tests

**Deployment**:
- [ ] Deploy rules to test environment
- [ ] Run integration tests
- [ ] Deploy rules to production
- [ ] Monitor error logs

### Phase 3: Rate Limiting (Week 3)

**Cloud Functions Setup**:
- [ ] Initialize Firebase Functions: `firebase init functions`
- [ ] Create `functions/src/rateLimiter.js`
- [ ] Create `functions/src/index.js`
- [ ] Create `functions/src/teacherApproval.js`
- [ ] Configure function regions (nearest to users)
- [ ] Set up function environment variables

**Implementation**:
- [ ] Implement checkRateLimit function
- [ ] Implement withRateLimit middleware
- [ ] Implement submitGame function
- [ ] Implement submitClaim function
- [ ] Implement content moderation
- [ ] Update client-side firebase.js

**Testing**:
- [ ] Test rate limiter with Firebase emulator
- [ ] Test rate limit enforcement
- [ ] Test rate limit reset (time window)
- [ ] Test concurrent requests
- [ ] Test error handling

**Deployment**:
- [ ] Deploy functions to test environment
- [ ] Monitor function logs
- [ ] Test from client
- [ ] Deploy to production

### Phase 4: UI Updates (Week 4)

**Components**:
- [ ] Create TeacherDashboard improvements
- [ ] Add authentication indicators (logged in as...)
- [ ] Add class creation UI
- [ ] Add class management UI
- [ ] Add student class join UI
- [ ] Add rate limit feedback (cooldown timers)
- [ ] Add error messages for auth failures

**User Experience**:
- [ ] Add loading states
- [ ] Add success/error toasts
- [ ] Add confirmation dialogs (delete class, etc.)
- [ ] Add help tooltips
- [ ] Mobile responsive design

**Documentation**:
- [ ] Update README with new auth flow
- [ ] Create teacher setup guide
- [ ] Create student quick-start guide
- [ ] Create troubleshooting FAQ

---

## Testing Requirements

### Unit Tests

**Auth Service** (`auth.test.js`):
```javascript
describe('AuthService', () => {
  test('loginAnonymous creates anonymous user', async () => {
    const user = await AuthService.loginAnonymous();
    expect(user.isAnonymous).toBe(true);
    expect(user.uid).toBeTruthy();
  });

  test('loginTeacher requires verified email', async () => {
    await expect(
      AuthService.loginTeacher('unverified@test.com', 'password')
    ).rejects.toThrow('verify your email');
  });

  test('signupTeacher sends verification email', async () => {
    const user = await AuthService.signupTeacher('new@school.edu', 'password', {
      schoolName: 'Test School',
      gradeLevel: 'middle'
    });

    expect(user.emailVerified).toBe(false);
    // Check that verification email was sent
  });
});
```

### Integration Tests

**End-to-End Flow** (`e2e.test.js`):
```javascript
describe('Student Gameplay with Auth', () => {
  test('new student can play game', async () => {
    // 1. Auto-login anonymous
    // 2. Join class with code
    // 3. Play game
    // 4. Submit score
    // 5. View leaderboard
    // 6. Verify score appears
  });
});

describe('Teacher Workflow with Auth', () => {
  test('teacher can create class and approve claims', async () => {
    // 1. Teacher signup
    // 2. Verify email
    // 3. Request teacher role
    // 4. Admin approves role
    // 5. Teacher creates class
    // 6. Teacher reviews pending claim
    // 7. Teacher approves claim
    // 8. Verify claim appears in approved list
  });
});
```

### Security Tests

**Firestore Rules** (`firestore.rules.test.js`):
```javascript
describe('Firestore Security', () => {
  test('student cannot access other classes', async () => {
    const db = getFirestore({ uid: 'student1', classId: 'class1' });

    // Try to read game from class2
    await assertFails(
      getDoc(doc(db, 'games', 'class2-game1'))
    );
  });

  test('student cannot modify class settings', async () => {
    const db = getFirestore({ uid: 'student1', role: 'student' });

    await assertFails(
      updateDoc(doc(db, 'classes', 'class1'), {
        allowedDifficulties: ['easy']
      })
    );
  });

  test('teacher can only modify own classes', async () => {
    const db = getFirestore({ uid: 'teacher1', role: 'teacher' });

    // Own class - should succeed
    await assertSucceeds(
      updateDoc(doc(db, 'classes', 'teacher1-class1'), {
        allowedDifficulties: ['easy']
      })
    );

    // Other teacher's class - should fail
    await assertFails(
      updateDoc(doc(db, 'classes', 'teacher2-class1'), {
        allowedDifficulties: ['easy']
      })
    );
  });
});
```

### Performance Tests

**Rate Limiting** (`rateLimit.perf.test.js`):
```javascript
describe('Rate Limit Performance', () => {
  test('handles 100 concurrent requests correctly', async () => {
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        FirebaseBackend.submitClaim({ /* claim data */ })
      );
    }

    const results = await Promise.allSettled(promises);

    // First 3 should succeed (rate limit: 3 per minute)
    const succeeded = results.filter(r => r.status === 'fulfilled');
    expect(succeeded.length).toBe(3);

    // Rest should be rate limited
    const rateLimited = results.filter(
      r => r.status === 'rejected' && r.reason.code === 'functions/resource-exhausted'
    );
    expect(rateLimited.length).toBe(97);
  });
});
```

---

## Deployment Strategy

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, security)
- [ ] Security rules reviewed and tested
- [ ] Rate limits configured appropriately
- [ ] Environment variables documented
- [ ] Database backups enabled
- [ ] Error monitoring configured (Sentry, LogRocket)
- [ ] Cost monitoring configured (Firebase budget alerts)
- [ ] Documentation updated

### Phased Rollout

#### Stage 1: Test Environment (Week 1)
- Deploy to Firebase test project
- Test with small group (5-10 teachers)
- Monitor error logs closely
- Gather feedback
- Fix critical bugs

#### Stage 2: Beta (Week 2-3)
- Deploy to production with feature flag
- Invite beta teachers (20-50)
- Monitor performance and costs
- Collect usage analytics
- Refine UX based on feedback

#### Stage 3: Soft Launch (Week 4)
- Enable for all new users
- Existing users remain on old system
- Gradual migration (10% per day)
- Monitor error rates
- Rollback plan ready

#### Stage 4: Full Migration (Week 5-6)
- Force migration for remaining users
- Show migration notice
- Provide support channel
- Monitor user complaints
- Fix edge cases

### Rollback Plan

**If critical issues arise**:

1. **Immediate** (< 1 hour):
   - Revert Firestore rules to old version
   - Disable authentication requirement
   - Post status update

2. **Short-term** (1-24 hours):
   - Investigate root cause
   - Fix in development
   - Test fix thoroughly
   - Redeploy

3. **Communication**:
   - Email all active teachers
   - Post in-app notice
   - Update status page
   - Provide ETA for fix

### Monitoring

**Key Metrics to Track**:

- **Authentication**:
  - Anonymous auth success rate
  - Teacher login success rate
  - Email verification rate
  - Password reset requests
  - Auth errors (by type)

- **Security**:
  - Permission denied errors (by collection)
  - Rate limit triggers (by operation)
  - Suspicious activity (rapid requests, unusual patterns)
  - Failed authentication attempts

- **Performance**:
  - Cloud Function execution time
  - Firestore read/write latency
  - Client-side auth check time
  - Page load time with auth

- **Costs**:
  - Firestore reads/writes (daily)
  - Cloud Function invocations
  - Authentication operations
  - Storage usage

**Alerts**:
- Error rate > 5% (critical)
- Rate limit triggers > 100/hour (warning)
- Firebase costs > budget (warning)
- Permission denied > 50/hour (investigate)

---

## Risk Assessment

### High Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Students can't login** | Medium | Critical | - Thorough testing<br>- Fallback to anonymous<br>- Clear error messages<br>- Support channel |
| **Teachers locked out** | Low | Critical | - Email verification backup<br>- Password reset flow<br>- Admin override capability<br>- 24h support during rollout |
| **Rate limits too strict** | Medium | High | - Conservative initial limits<br>- Monitor trigger rates<br>- Easy adjustment (Cloud Functions)<br>- Whitelist for testing |
| **Cost explosion** | Low | High | - Firebase budget alerts<br>- Optimize queries<br>- Cache aggressively<br>- Monitor daily costs |
| **Data migration fails** | Medium | Medium | - Test on copy of production DB<br>- Backup before migration<br>- Rollback script ready<br>- Manual fix process |

### Medium Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Class code collisions** | Low | Medium | - Crypto random generation<br>- Uniqueness check in rules<br>- Allow teacher to regenerate |
| **Email verification delays** | Medium | Low | - Clear instructions<br>- Resend button<br>- Check spam folder reminder<br>- Support email |
| **Cross-class data leaks** | Low | High | - Extensive security rules testing<br>- Regular audits<br>- Firestore rules simulator<br>- Penetration testing |

---

## Cost Estimate

### Firebase Costs (Monthly)

**Small School** (50 teachers, 1000 students, 5000 games/month):
- Firestore reads: ~500,000 = FREE (within free tier)
- Firestore writes: ~50,000 = FREE (within free tier)
- Cloud Functions: ~10,000 invocations = FREE
- Authentication: FREE (unlimited)
- **Total**: $0/month

**Medium School** (200 teachers, 5000 students, 30,000 games/month):
- Firestore reads: ~3,000,000 = FREE + $0.18 (3M - 50K free)
- Firestore writes: ~300,000 = FREE + $5.40 (300K - 20K free)
- Cloud Functions: ~60,000 invocations = FREE + $0.24
- Authentication: FREE
- **Total**: ~$6/month

**Large School District** (1000 teachers, 25,000 students, 150,000 games/month):
- Firestore reads: ~15,000,000 = $18.00
- Firestore writes: ~1,500,000 = $53.10
- Cloud Functions: ~300,000 invocations = $1.20
- Authentication: FREE
- **Total**: ~$72/month

**Compared to**:
- EdTech SaaS: $5-15 per student/year = $5,000-15,000/year
- Truth Hunters: $0-900/year (depending on size)

---

## Next Steps

### Immediate Actions (This Week)

1. **Review this plan with team**
   - Identify any concerns or blockers
   - Adjust timeline as needed
   - Assign responsibilities

2. **Set up test Firebase project**
   - Create separate project for development
   - Enable Authentication and Firestore
   - Configure test environment variables

3. **Create detailed task breakdown**
   - Break phases into specific GitHub issues
   - Estimate hours per task
   - Prioritize critical path items

### Long-term Considerations (Post-MVP)

1. **Advanced Authentication**
   - Google Sign-In (for schools using Google Workspace)
   - Microsoft SSO (for schools using Office 365)
   - SAML integration for enterprise SSO
   - Multi-factor authentication for teachers

2. **Enhanced Security**
   - AI-powered content moderation (Perspective API)
   - Automated abuse detection
   - IP-based rate limiting
   - CAPTCHA for suspicious activity

3. **Compliance**
   - COPPA compliance audit
   - FERPA compliance documentation
   - GDPR considerations (EU schools)
   - Data retention policies
   - Privacy impact assessment

4. **Analytics & Monitoring**
   - Teacher analytics dashboard
   - Student progress tracking
   - Usage analytics (games played, claims submitted)
   - A/B testing framework
   - Error tracking (Sentry integration)

---

## Questions for Team

1. **Authentication approach**: Are we comfortable with anonymous auth for students, or do we want email signup?
2. **Teacher approval**: Should teacher role requests be auto-approved or require admin review?
3. **Class enrollment**: How should students join classes? Manual code entry, or QR code/link?
4. **Data retention**: How long should we keep game records? Archive old data?
5. **Cost limits**: What's the monthly budget for Firebase costs? Set up alerts?
6. **Timeline**: Is 4-6 weeks realistic, or do we need to adjust scope?

---

## Conclusion

This implementation plan addresses all three critical security issues:

1. ✅ **Authentication**: Firebase Auth with anonymous (students) and email/password (teachers)
2. ✅ **Firestore Security**: Comprehensive rules with authentication and role checks
3. ✅ **Rate Limiting**: Server-side enforcement via Cloud Functions

**Estimated Effort**: 16-24 hours of focused development + 8-12 hours of testing

**Timeline**: 4-6 weeks for phased rollout

**Risk Level**: Medium (can be mitigated with proper testing and rollback plan)

**Priority**: CRITICAL for production deployment

The proposed architecture maintains Truth Hunters' ease of use while adding robust security. Students can still play immediately (anonymous auth), teachers get proper admin tools, and the database is protected from abuse.

Ready to implement? See **Implementation Checklist** section to get started.
