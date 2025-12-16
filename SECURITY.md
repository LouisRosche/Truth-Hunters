# Security Documentation

## Overview

This document outlines the security measures, best practices, and potential vulnerabilities for the Truth Hunters application.

**Last Updated:** December 16, 2025

---

## Critical Security Requirements

### 1. Environment Variables

**IMPORTANT:** Never commit sensitive credentials to version control.

All Firebase configuration values must be stored in environment variables:

```bash
# Required in .env file (never commit this file!)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Security Rules

Ensure your Firebase Security Rules are restrictive. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Games collection - allow read for class, write authenticated
    match /games/{gameId} {
      allow read: if true;
      allow create: if request.resource.data.teamName is string &&
                      request.resource.data.score is number &&
                      request.resource.data.classCode is string;
      allow update, delete: if false;
    }

    // Pending claims - students can create, teachers can update
    match /pendingClaims/{claimId} {
      allow read: if true;
      allow create: if request.resource.data.claimText.size() >= 10 &&
                      request.resource.data.claimText.size() <= 500 &&
                      request.resource.data.status == 'pending';
      allow update: if request.resource.data.status in ['approved', 'rejected'];
      allow delete: if false;
    }

    // Class achievements - allow read, restricted write
    match /classAchievements/{achievementId} {
      allow read: if true;
      allow create: if request.resource.data.classCode is string &&
                      request.resource.data.achievementId is string;
      allow update, delete: if false;
    }

    // Class settings - teachers only (implement auth)
    match /classSettings/{classCode} {
      allow read: if true;
      allow write: if false; // TODO: Implement teacher authentication
    }

    // Reflections - allow create, read by class
    match /reflections/{reflectionId} {
      allow read: if true;
      allow create: if request.resource.data.teamName is string &&
                      request.resource.data.classCode is string;
      allow update, delete: if false;
    }
  }
}
```

### 3. Firebase App Check

To prevent unauthorized API usage, implement Firebase App Check:

```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Add to firebase.js after app initialization
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

---

## Security Measures Implemented

### Content Moderation ✅

- **Profanity Filter:** 100+ blocked words
- **Leetspeak Detection:** Catches obfuscated profanity (f*ck, sh1t, etc.)
- **HTML Sanitization:** Prevents XSS via input
- **Character Encoding:** Removes control characters
- **Input Validation:** Length limits, type checking

**Files:** `src/utils/moderation.js`

### Network Security ✅

**HTTP Headers (Netlify/Vercel):**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Legacy XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` - Restricts resource loading

**Files:** `netlify.toml`, `vercel.json`

### Input Validation ✅

All user inputs are validated and sanitized:

```javascript
// Team/player names
validateName(name) // 2-50 chars, no HTML, passes moderation

// Claim submissions
submitClaim(data) // Min 10 chars, valid types, rate limited

// Class codes
setClassCode(code) // Sanitized, uppercase
```

### Rate Limiting ✅

**Client-Side Rate Limiting:**
- Claim submissions: 3 per minute per session
- Duplicate detection via similarity matching

**Files:** `src/services/firebase.js`

---

## Security Gaps & Recommendations

### 🔴 HIGH PRIORITY

#### 1. No Authentication System
**Risk:** Anyone can submit data as "teacher" or modify settings

**Recommendation:**
```javascript
// Implement Firebase Authentication
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const AuthService = {
  async loginTeacher(email, password) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }
};
```

#### 2. localStorage Not Encrypted
**Risk:** Player data readable by malicious scripts on same origin

**Recommendation:**
- Encrypt sensitive data before storing
- Use TweetNaCl.js or similar library
- See implementation in `src/utils/encryption.js` (to be created)

#### 3. No Server-Side Validation
**Risk:** Client can bypass validation by modifying requests

**Recommendation:**
- Implement Firebase Security Rules (see above)
- Use Firebase Cloud Functions for sensitive operations

### 🟡 MEDIUM PRIORITY

#### 4. No HTTPS Enforcement
**Status:** Handled by deployment platforms (Netlify/Vercel)
**Recommendation:** Add HSTS header for additional security

#### 5. CSP Allows unsafe-inline
**Risk:** Potential XSS if third-party code is compromised

**Recommendation:**
```
Content-Security-Policy: default-src 'self';
  style-src 'self' 'nonce-{random}';
  script-src 'self' https://www.gstatic.com;
```

#### 6. No Subresource Integrity (SRI)
**Risk:** CDN compromise could inject malicious code

**Recommendation:**
```html
<link href="https://fonts.googleapis.com/..."
      integrity="sha384-..."
      crossorigin="anonymous">
```

---

## Incident Response

### If API Key is Compromised

1. **Immediately:**
   - Rotate Firebase API key in Firebase Console
   - Update `.env` file with new key
   - Rebuild and redeploy application
   - Review Firebase audit logs

2. **Within 24 hours:**
   - Implement Firebase App Check
   - Review all recent database writes
   - Check for unauthorized access patterns

3. **Within 1 week:**
   - Implement authentication system
   - Add server-side validation
   - Enable Firebase Security Monitoring

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, email security concerns to: [your-email@domain.com]

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## Security Checklist for Deployment

Before deploying to production:

- [ ] Environment variables configured (`.env` file)
- [ ] `.env` file added to `.gitignore`
- [ ] Firebase API key rotated from any previously exposed keys
- [ ] Firebase Security Rules deployed and tested
- [ ] Firebase App Check enabled
- [ ] HTTP security headers configured
- [ ] CSP policy tested and working
- [ ] All inputs validated and sanitized
- [ ] Rate limiting tested
- [ ] No sensitive data in localStorage without encryption
- [ ] HTTPS enforced on all pages
- [ ] Authentication system implemented (if needed)
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies updated and scanned for vulnerabilities

---

## Dependency Security

### Regular Audits

Run security audits regularly:

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies
npm update
```

### Automated Scanning

Consider adding to CI/CD:

```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm audit --audit-level=moderate
```

---

## Data Privacy

### Data Collection

**Collected:**
- Player names (first name + last initial)
- Game scores and statistics
- Team names and avatars
- Claim submissions and reflections
- Class codes

**NOT Collected:**
- Email addresses
- IP addresses (unless logged by hosting provider)
- Personal identifying information
- Location data
- Device fingerprints

### Data Storage

**Browser (localStorage):**
- Player profile and statistics
- Local leaderboard history
- Game state for crash recovery
- Preferences (sound, presentation mode)

**Firebase (Firestore):**
- Class-wide leaderboards
- Student claim submissions
- Team reflections
- Class settings
- Shared achievements

### Data Retention

**Automatic Deletion:**
- Local leaderboard: Last 100 games
- Recent games: Last 10 per player
- Error logs: Last 5 errors

**No Automatic Deletion:**
- Firebase data persists indefinitely
- Manual deletion via Firebase Console

---

## Compliance Considerations

### FERPA (Family Educational Rights and Privacy Act)

If deploying in US schools:
- Don't collect student email addresses without consent
- Provide data access/deletion mechanisms
- Implement role-based access (teacher vs. student)
- Log access to student data

### COPPA (Children's Online Privacy Protection Act)

For users under 13:
- No personal information collection
- No third-party advertising
- Parental consent for data collection
- Clear privacy policy

### GDPR (General Data Protection Regulation)

For EU users:
- Provide privacy policy
- Allow data export and deletion
- Implement consent mechanisms
- Notify users of data breaches

---

## Additional Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Document Version:** 1.0
**Maintained By:** Development Team
**Review Schedule:** Quarterly
