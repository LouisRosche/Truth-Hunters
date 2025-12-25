# Security Implementation Checklist

**Project**: Truth Hunters Security Enhancement
**Status**: PLANNING
**Priority**: CRITICAL
**Estimated Time**: 16-24 hours development + 8-12 hours testing

---

## Quick Start

### Priority Order

1. 🔴 **CRITICAL** - Must complete before production deployment
2. 🟡 **HIGH** - Should complete for robust security
3. 🟢 **MEDIUM** - Nice to have, improves UX
4. ⚪ **LOW** - Optional enhancements

### Recommended Approach

**Week 1**: Authentication (Phase 1)
**Week 2**: Firestore Security (Phase 2)
**Week 3**: Rate Limiting (Phase 3)
**Week 4**: Testing & Deployment (Phase 4)

---

## Phase 1: Authentication System

**Goal**: Implement Firebase Authentication with anonymous (students) and email/password (teachers)

**Estimated Time**: 6-8 hours

### Backend Setup (1-2 hours)

#### Firebase Console Configuration

- [ ] 🔴 Go to Firebase Console > Authentication
- [ ] 🔴 Click "Get Started"
- [ ] 🔴 Enable "Email/Password" provider
- [ ] 🔴 Enable "Anonymous" provider
- [ ] 🟡 Configure email templates (verification, password reset)
  - Customize sender name: "Truth Hunters"
  - Customize action URL: `https://yoursite.com/auth-action`
- [ ] 🟡 Set up email verification requirement
- [ ] 🟢 Configure password policy (min 8 chars, etc.)
- [ ] 🟢 Add authorized domains for production

**Validation**:
```bash
# Check providers are enabled
firebase auth:export users.json --project YOUR_PROJECT
# Should show anonymous and email/password enabled
```

#### Custom Claims Setup

- [ ] 🔴 Create Cloud Function for setting custom claims
  - File: `functions/src/setCustomClaims.js`
- [ ] 🔴 Deploy function: `firebase deploy --only functions:setCustomClaims`
- [ ] 🔴 Test setting admin role manually:
  ```bash
  firebase functions:shell
  > setCustomClaims({ uid: 'YOUR_UID', role: 'admin' })
  ```
- [ ] 🟡 Create admin approval workflow
- [ ] 🟢 Set up automated email notifications

### Code Implementation (3-4 hours)

#### Authentication Service

- [ ] 🔴 Create `src/services/auth.js`
  - Copy from `docs/security/useAuth.skeleton.jsx`
  - Implement all TODO items
- [ ] 🔴 Test anonymous login:
  ```javascript
  import { AuthService } from './services/auth';
  const user = await AuthService.loginAnonymous();
  console.log(user.uid); // Should print anonymous UID
  ```
- [ ] 🔴 Test teacher login:
  ```javascript
  const user = await AuthService.loginTeacher('test@school.edu', 'password');
  console.log(user.email); // Should print email
  ```

#### React Hook

- [ ] 🔴 Create `src/hooks/useAuth.js`
  - Copy from skeleton
  - Implement AuthProvider
  - Implement useAuth hook
- [ ] 🔴 Add AuthProvider to `src/App.jsx`:
  ```jsx
  import { AuthProvider } from './hooks/useAuth';

  function App() {
    return (
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    );
  }
  ```
- [ ] 🔴 Test in component:
  ```jsx
  function TestComponent() {
    const { user, isTeacher } = useAuth();
    return <div>{user?.uid}</div>;
  }
  ```

#### Auto-Login Component

- [ ] 🔴 Create `src/components/AutoLogin.jsx`
- [ ] 🔴 Wrap app in AutoLogin:
  ```jsx
  <AuthProvider>
    <AutoLogin>
      <RouterProvider router={router} />
    </AutoLogin>
  </AuthProvider>
  ```
- [ ] 🔴 Test: Open app in incognito, should auto-login anonymously
- [ ] 🟡 Add loading state UI
- [ ] 🟢 Add error handling for network failures

### UI Components (2-3 hours)

#### Teacher Login Screen

- [ ] 🔴 Create `src/components/TeacherLogin.jsx`
  - Login form (email + password)
  - Signup form (email + password + school info)
  - Password reset link
- [ ] 🔴 Add route: `/teacher-login`
- [ ] 🔴 Test login flow:
  1. Create account
  2. Verify email
  3. Request teacher role
  4. Login
- [ ] 🟡 Add validation messages
- [ ] 🟡 Add "Forgot password" flow
- [ ] 🟢 Add "Remember me" checkbox
- [ ] 🟢 Add social login (Google) for teachers

#### Student Class Join

- [ ] 🔴 Create `src/components/ClassJoinDialog.jsx`
  - Input for class code
  - Submit button
  - Error messages
- [ ] 🔴 Show on first visit (after anonymous login)
- [ ] 🔴 Test joining class:
  ```javascript
  // Should add student UID to class.studentIds
  await joinClass('TEST-2025');
  ```
- [ ] 🟡 Add QR code scanner (optional)
- [ ] 🟢 Add "Skip for now" option

#### Authentication Status Indicator

- [ ] 🔴 Create `src/components/AuthStatus.jsx`
  - Show "Logged in as: [email/anonymous]"
  - Show user role (student/teacher/admin)
  - Logout button
- [ ] 🔴 Add to app header/navigation
- [ ] 🟡 Add profile dropdown
- [ ] 🟢 Add account settings link

### Testing (1 hour)

#### Unit Tests

- [ ] 🔴 Test anonymous login flow
- [ ] 🔴 Test teacher signup flow
- [ ] 🔴 Test teacher login flow
- [ ] 🟡 Test email verification
- [ ] 🟡 Test password reset
- [ ] 🟡 Test custom claims

**Run tests**:
```bash
npm run test -- auth.test.js
```

#### Integration Tests

- [ ] 🔴 Test AuthProvider context
- [ ] 🔴 Test useAuth hook
- [ ] 🔴 Test ProtectedRoute component
- [ ] 🔴 Test AutoLogin component

#### Manual Testing

- [ ] 🔴 Open app in incognito → should auto-login
- [ ] 🔴 Navigate to `/teacher-login` → signup works
- [ ] 🔴 Check email → verification link works
- [ ] 🔴 Login as teacher → should see teacher UI
- [ ] 🔴 Refresh page → should stay logged in

---

## Phase 2: Firestore Security Rules

**Goal**: Lock down database with authentication-based rules

**Estimated Time**: 4-6 hours

### Rules Development (2-3 hours)

#### Backup Current Rules

- [ ] 🔴 Backup existing rules:
  ```bash
  cp firestore.rules firestore.rules.backup
  ```
- [ ] 🔴 Test current rules work:
  ```bash
  firebase emulators:start --only firestore
  # Run tests to ensure current functionality works
  ```

#### Implement Secure Rules

- [ ] 🔴 Copy `docs/security/firestore.rules.secure` to `firestore.rules`
- [ ] 🔴 Review each collection's rules
- [ ] 🔴 Customize for your needs:
  - Adjust rate limits
  - Modify validation rules
  - Add custom collections
- [ ] 🟡 Add comments explaining complex rules
- [ ] 🟢 Optimize performance (avoid get() calls where possible)

#### Database Schema Updates

- [ ] 🔴 Add `userId` field to all collections:
  ```javascript
  // Migration script
  const games = await db.collection('games').get();
  games.forEach(doc => {
    if (!doc.data().userId) {
      doc.ref.update({ userId: 'MIGRATION_NEEDED' });
    }
  });
  ```
- [ ] 🔴 Add `classId` field to replace `classCode`:
  ```javascript
  // Map classCode to classId
  const classes = await db.collection('classes')
    .where('classCode', '==', doc.data().classCode)
    .limit(1)
    .get();

  if (!classes.empty) {
    doc.ref.update({ classId: classes.docs[0].id });
  }
  ```
- [ ] 🟡 Add audit fields (`createdBy`, `modifiedBy`, `createdAt`, `updatedAt`)
- [ ] 🟢 Add soft delete flag (`deleted`, `deletedAt`, `deletedBy`)

### Testing Rules (2-3 hours)

#### Emulator Testing

- [ ] 🔴 Create `firestore.rules.test.js`
  - Test unauthenticated access (should fail)
  - Test student access (limited)
  - Test teacher access (class-level)
  - Test cross-class access (should fail)
  - Test rate limiting
- [ ] 🔴 Run tests:
  ```bash
  npm run test:rules
  ```
- [ ] 🟡 Add edge case tests (empty strings, SQL injection, etc.)
- [ ] 🟢 Add performance tests (large queries)

#### Security Validation

- [ ] 🔴 Test all CRITICAL scenarios:
  - [ ] Unauthenticated user cannot read games
  - [ ] Student cannot access other classes
  - [ ] Student cannot approve claims
  - [ ] Student cannot modify class settings
  - [ ] Teacher can only modify own classes
  - [ ] Rate limiting prevents spam
- [ ] 🟡 Test all HIGH scenarios:
  - [ ] Field validation works
  - [ ] Invalid data is rejected
  - [ ] Server timestamps required
- [ ] 🟢 Penetration testing
  - Try to bypass rules with direct API calls
  - Test injection attacks
  - Test concurrent modification

### Deployment (1 hour)

#### Deploy to Test Environment

- [ ] 🔴 Deploy rules to test project:
  ```bash
  firebase deploy --only firestore:rules --project truth-hunters-dev
  ```
- [ ] 🔴 Monitor error logs:
  ```bash
  firebase functions:log --project truth-hunters-dev
  ```
- [ ] 🔴 Test with real client:
  ```bash
  VITE_FIREBASE_PROJECT_ID=truth-hunters-dev npm run dev
  ```
- [ ] 🟡 Test with multiple users simultaneously
- [ ] 🟡 Monitor Firebase usage (reads/writes)

#### Deploy to Production

- [ ] 🔴 **STOP**: Ensure all tests pass first
- [ ] 🔴 Create deployment plan:
  - Backup production database
  - Schedule maintenance window
  - Notify users of downtime
- [ ] 🔴 Deploy rules:
  ```bash
  firebase deploy --only firestore:rules --project truth-hunters-prod
  ```
- [ ] 🔴 Monitor error rates (should not spike)
- [ ] 🔴 Have rollback plan ready:
  ```bash
  # If issues arise
  firebase deploy --only firestore:rules --project truth-hunters-prod
  # Paste in backup rules
  ```

---

## Phase 3: Rate Limiting

**Goal**: Implement server-side rate limiting via Cloud Functions

**Estimated Time**: 4-6 hours

### Cloud Functions Setup (1-2 hours)

#### Initialize Functions

- [ ] 🔴 Initialize Firebase Functions (if not already done):
  ```bash
  firebase init functions
  # Select JavaScript or TypeScript
  # Install dependencies
  ```
- [ ] 🔴 Configure functions region:
  ```javascript
  // functions/index.js
  const functions = require('firebase-functions');
  const region = 'us-central1'; // Closest to users
  ```
- [ ] 🟡 Set up ESLint and testing
- [ ] 🟢 Configure TypeScript (if preferred)

#### Set Environment Variables

- [ ] 🔴 Configure rate limits:
  ```bash
  firebase functions:config:set \
    rate_limit.games_max=1 \
    rate_limit.games_window_ms=30000 \
    rate_limit.claims_max=3 \
    rate_limit.claims_window_ms=60000
  ```
- [ ] 🟡 Set email config (for notifications):
  ```bash
  firebase functions:config:set \
    email.admin="admin@school.edu"
  ```
- [ ] 🟢 Set up Sentry for error tracking

### Implementation (2-3 hours)

#### Rate Limiter Function

- [ ] 🔴 Create `functions/src/rateLimiter.js`
  - Implement checkRateLimit function
  - Implement withRateLimit middleware
- [ ] 🔴 Create unit tests:
  ```bash
  npm run test -- rateLimiter.test.js
  ```
- [ ] 🟡 Add Redis cache for better performance (optional)
- [ ] 🟢 Add distributed rate limiting (multi-region)

#### Protected Operations

- [ ] 🔴 Create `functions/src/index.js`
  - Implement submitGame (rate-limited)
  - Implement submitClaim (rate-limited)
  - Implement shareAchievement (rate-limited)
- [ ] 🔴 Test each function locally:
  ```bash
  firebase emulators:start --only functions
  ```
- [ ] 🟡 Add content moderation (profanity filter)
- [ ] 🟢 Add AI-powered moderation (Perspective API)

#### Teacher Management Functions

- [ ] 🔴 Create `functions/src/teacherApproval.js`
  - requestTeacherRole
  - approveTeacherRequest
  - rejectTeacherRequest
- [ ] 🟡 Add email notifications
- [ ] 🟢 Add Slack/Discord webhooks for admin alerts

### Client Integration (1-2 hours)

#### Update Firebase Service

- [ ] 🔴 Modify `src/services/firebase.js`:
  - Replace direct Firestore writes with Cloud Function calls
  - Handle rate limit errors gracefully
  - Show user-friendly messages
- [ ] 🔴 Test rate limiting:
  ```javascript
  // Trigger 5 game submissions rapidly
  for (let i = 0; i < 5; i++) {
    await FirebaseBackend.save(gameData);
  }
  // First should succeed, rest should show rate limit error
  ```
- [ ] 🟡 Add retry logic with exponential backoff
- [ ] 🟢 Add rate limit countdown timer in UI

#### Error Handling

- [ ] 🔴 Catch `functions/resource-exhausted` errors
- [ ] 🔴 Show toast notification: "Too many requests. Please wait X seconds."
- [ ] 🟡 Disable submit button during cooldown
- [ ] 🟢 Show countdown timer

### Deployment (1 hour)

#### Deploy Functions

- [ ] 🔴 Deploy to test environment:
  ```bash
  firebase deploy --only functions --project truth-hunters-dev
  ```
- [ ] 🔴 Test each function:
  ```bash
  # Get function URL
  firebase functions:config:get
  # Test with curl or Postman
  curl -X POST https://us-central1-PROJECT.cloudfunctions.net/submitGame \
    -H "Authorization: Bearer $(firebase login:ci)" \
    -d '{"teamName":"Test","score":50}'
  ```
- [ ] 🟡 Monitor function logs:
  ```bash
  firebase functions:log
  ```
- [ ] 🟡 Check function performance (execution time, memory)

#### Production Deployment

- [ ] 🔴 Review function costs:
  ```bash
  # Estimate: 1000 games/day × $0.40 per million = $0.012/day
  # Well within free tier (2M invocations/month)
  ```
- [ ] 🔴 Deploy to production:
  ```bash
  firebase deploy --only functions --project truth-hunters-prod
  ```
- [ ] 🔴 Monitor error rates (Firebase Console > Functions)
- [ ] 🟡 Set up billing alerts (Firebase Console > Billing)

---

## Phase 4: Testing & Deployment

**Goal**: Comprehensive testing and phased production rollout

**Estimated Time**: 8-12 hours

### Testing (4-6 hours)

#### Unit Tests

- [ ] 🔴 Authentication service tests
  - `src/services/auth.test.js`
- [ ] 🔴 Firestore rules tests
  - `firestore.rules.test.js`
- [ ] 🔴 Cloud Functions tests
  - `functions/test/rateLimiter.test.js`
  - `functions/test/teacherApproval.test.js`
- [ ] 🟡 React component tests
  - `src/components/TeacherLogin.test.jsx`
  - `src/hooks/useAuth.test.js`

**Run all tests**:
```bash
npm run test
npm run test:rules
cd functions && npm run test
```

#### Integration Tests

- [ ] 🔴 End-to-end student flow:
  1. Auto-login anonymous
  2. Join class
  3. Play game
  4. Submit score
  5. View leaderboard
- [ ] 🔴 End-to-end teacher flow:
  1. Signup
  2. Verify email
  3. Request teacher role
  4. Admin approves
  5. Login
  6. Create class
  7. Review claim
  8. Approve claim
- [ ] 🟡 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] 🟡 Mobile testing (iOS Safari, Android Chrome)

#### Security Audit

- [ ] 🔴 Verify all authentication checks work
- [ ] 🔴 Attempt to bypass security rules (should fail):
  - Direct Firestore API calls
  - Manipulated POST requests
  - Cross-class data access
- [ ] 🔴 Test rate limiting enforcement
- [ ] 🟡 Penetration testing (OWASP Top 10)
- [ ] 🟢 Hire security consultant for audit

#### Performance Testing

- [ ] 🔴 Load testing:
  - Simulate 100 concurrent users
  - Monitor latency and error rates
- [ ] 🟡 Database query optimization
  - Check for missing indexes
  - Optimize slow queries
- [ ] 🟡 Function cold start testing
  - Measure first invocation time
  - Consider keeping functions warm

### Deployment Strategy (2-3 hours)

#### Staging Deployment

- [ ] 🔴 Deploy all changes to staging:
  ```bash
  firebase deploy --project truth-hunters-staging
  ```
- [ ] 🔴 Run full test suite on staging
- [ ] 🔴 Invite beta testers (5-10 teachers)
- [ ] 🟡 Collect feedback for 1 week
- [ ] 🟡 Fix critical bugs

#### Production Rollout Plan

- [ ] 🔴 Create rollout plan:
  - **Week 1**: Deploy with feature flag (10% of users)
  - **Week 2**: Increase to 50% if no issues
  - **Week 3**: Full rollout (100%)
- [ ] 🔴 Implement feature flag:
  ```javascript
  const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';
  if (ENABLE_AUTH) {
    // Use new auth system
  } else {
    // Use old system
  }
  ```
- [ ] 🔴 Set up monitoring and alerts
- [ ] 🟡 Prepare rollback plan

#### Production Deployment

- [ ] 🔴 **Pre-deployment checklist**:
  - [ ] All tests passing
  - [ ] Staging validated
  - [ ] Rollback plan ready
  - [ ] Team on standby
  - [ ] Users notified
- [ ] 🔴 Deploy to production:
  ```bash
  # 1. Deploy Firestore rules first
  firebase deploy --only firestore:rules --project truth-hunters-prod

  # 2. Deploy Cloud Functions
  firebase deploy --only functions --project truth-hunters-prod

  # 3. Deploy web app
  npm run build
  firebase deploy --only hosting --project truth-hunters-prod
  ```
- [ ] 🔴 Monitor for 24 hours:
  - Error rates
  - Function invocations
  - Database reads/writes
  - User complaints
- [ ] 🟡 Send post-deployment email to users

### Post-Deployment (2-3 hours)

#### Monitoring Setup

- [ ] 🔴 Set up Firebase alerts:
  - Error rate > 5% (critical)
  - Function failures > 10/hour (warning)
  - Auth failures > 50/hour (investigate)
- [ ] 🔴 Set up cost alerts:
  - Daily spending > $5 (warning)
  - Monthly spending > $100 (critical)
- [ ] 🟡 Integrate with Sentry for error tracking
- [ ] 🟡 Set up uptime monitoring (UptimeRobot, Pingdom)

#### Documentation

- [ ] 🔴 Update README with auth instructions
- [ ] 🔴 Create teacher onboarding guide
- [ ] 🔴 Create student quick-start guide
- [ ] 🟡 Record video tutorial
- [ ] 🟢 Create FAQ page

#### User Communication

- [ ] 🔴 Email all teachers:
  - Explain new login system
  - Provide setup instructions
  - Offer support contact
- [ ] 🟡 Create in-app announcement
- [ ] 🟡 Post on social media
- [ ] 🟢 Write blog post about security improvements

---

## Verification Checklist

### Before Declaring "Done"

- [ ] 🔴 **Authentication works**:
  - Students auto-login anonymously
  - Teachers can signup/login
  - Email verification works
  - Password reset works
  - Roles are properly assigned
- [ ] 🔴 **Security rules enforced**:
  - Unauthenticated users blocked
  - Students cannot access other classes
  - Teachers cannot modify other teachers' classes
  - All validation rules working
- [ ] 🔴 **Rate limiting works**:
  - Server-side rate limiting enforced
  - User-friendly error messages
  - Cannot be bypassed
- [ ] 🔴 **All tests passing**:
  - Unit tests: 100% pass
  - Integration tests: 100% pass
  - Security tests: 100% pass
- [ ] 🔴 **Documentation complete**:
  - Setup guide for teachers
  - Environment variables documented
  - Security rules explained
  - Troubleshooting guide
- [ ] 🟡 **Performance acceptable**:
  - Page load < 3 seconds
  - Auth check < 500ms
  - Cloud Functions < 1 second
- [ ] 🟡 **Costs within budget**:
  - Daily cost tracking
  - Alerts configured
  - Free tier not exceeded (or budget approved)

---

## Rollback Procedures

### If Critical Issues Arise

#### Emergency Rollback (< 5 minutes)

```bash
# 1. Revert Firestore rules
firebase deploy --only firestore:rules --project truth-hunters-prod
# Paste in backup rules from firestore.rules.backup

# 2. Disable auth requirement via feature flag
firebase functions:config:set app.require_auth=false
firebase deploy --only functions --project truth-hunters-prod

# 3. Revert web app to previous version
git revert HEAD
npm run build
firebase deploy --only hosting --project truth-hunters-prod
```

#### Partial Rollback (keep some features)

```bash
# Keep auth, rollback rules
firebase deploy --only firestore:rules # deploy old rules
# Keep rules, disable Cloud Functions rate limiting
firebase functions:config:set rate_limit.enabled=false
```

#### Communication During Rollback

```
Subject: Truth Hunters Maintenance Update

We've temporarily reverted some recent changes while we investigate an issue.
Your data is safe, and the game continues to work normally.

We'll send another update within 24 hours.

Thank you for your patience!
```

---

## Success Metrics

### How to Know If Implementation Succeeded

#### Week 1 (Post-Launch)
- [ ] Error rate < 2%
- [ ] No critical bugs reported
- [ ] 90%+ of teachers successfully logged in
- [ ] Firebase costs < $10/month

#### Week 2-4 (Ongoing)
- [ ] No security incidents
- [ ] Rate limiting prevents >100 spam attempts/week
- [ ] Teacher satisfaction > 4/5 stars
- [ ] Zero data breaches

#### Long-term (3+ months)
- [ ] Auth adoption rate > 95%
- [ ] Zero unauthorized access incidents
- [ ] Costs remain predictable
- [ ] No major user complaints

---

## Resources

### Documentation
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)

### Tools
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firestore Rules Playground](https://firebase.google.com/docs/rules/simulator)
- [Firebase Console](https://console.firebase.google.com)

### Support
- [Firebase Support](https://firebase.google.com/support)
- [Truth Hunters Issues](https://github.com/LouisRosche/Truth-Hunters/issues)
- Email: (add support email here)

---

## Final Notes

### Time Estimates Summary

| Phase | Time Estimate | Priority |
|-------|---------------|----------|
| Phase 1: Authentication | 6-8 hours | 🔴 CRITICAL |
| Phase 2: Firestore Security | 4-6 hours | 🔴 CRITICAL |
| Phase 3: Rate Limiting | 4-6 hours | 🟡 HIGH |
| Phase 4: Testing & Deployment | 8-12 hours | 🔴 CRITICAL |
| **Total** | **22-32 hours** | |

### Tips for Success

1. **Start with test environment** - Never test in production first
2. **Deploy incrementally** - Don't deploy everything at once
3. **Monitor closely** - Watch error logs for first 48 hours
4. **Have rollback ready** - Be prepared to revert quickly
5. **Communicate proactively** - Tell users about changes in advance
6. **Test thoroughly** - Security bugs are worse than delays
7. **Document everything** - Future you will thank present you

### When to Ask for Help

- **Blocker**: If you're stuck for > 2 hours, ask for help
- **Security concern**: If unsure about a security decision, consult expert
- **Performance issue**: If function takes > 5 seconds, optimize or ask
- **Cost spike**: If daily costs > $10, investigate immediately

---

**Ready to start?** Begin with **Phase 1, Step 1** and check off items as you go!

**Questions?** See [Security Implementation Plan](./SECURITY_IMPLEMENTATION_PLAN.md) for detailed guidance.

**Need help?** Open an issue on GitHub or contact the team.
