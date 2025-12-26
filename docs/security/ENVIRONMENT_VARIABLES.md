# Environment Variables for Truth Hunters Security

This document outlines all environment variables needed for the secure implementation of Truth Hunters with Firebase Authentication and Cloud Functions.

---

## Overview

Truth Hunters uses environment variables to securely configure:
- Firebase connection (API keys, project ID)
- Authentication settings
- Cloud Functions configuration
- Feature flags
- Third-party services (optional)

**Security Note**: NEVER commit `.env` files to version control. Always use `.env.example` as a template.

---

## Required Variables

### Firebase Configuration

These are obtained from Firebase Console > Project Settings > General.

```bash
# Firebase Web App Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Optional: Firebase Database URL (if using Realtime Database)
# VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

**How to get these**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click gear icon → Project Settings
4. Scroll to "Your apps" section
5. Select your web app (or create one)
6. Copy the `firebaseConfig` values

---

## Optional Variables

### Authentication Settings

```bash
# Auto-login anonymous users on first visit (recommended: true)
VITE_AUTO_LOGIN_ANONYMOUS=true

# Require email verification for teachers (recommended: true)
VITE_REQUIRE_EMAIL_VERIFICATION=true

# Allowed email domains for teacher signup (comma-separated)
VITE_ALLOWED_TEACHER_DOMAINS=.edu,.k12.us,.schools.org

# Teacher approval mode: auto or manual (recommended: manual)
VITE_TEACHER_APPROVAL_MODE=manual
```

### Feature Flags

```bash
# Enable Firebase backend (set to false to run offline)
VITE_ENABLE_FIREBASE=true

# Enable authentication (set to false for testing without auth)
VITE_ENABLE_AUTH=true

# Enable Cloud Functions (set to false to use direct Firestore writes)
VITE_ENABLE_CLOUD_FUNCTIONS=true

# Enable rate limiting (recommended: true for production)
VITE_ENABLE_RATE_LIMITING=true

# Enable analytics (optional)
VITE_ENABLE_ANALYTICS=false
```

### Class Configuration

```bash
# Default class code for testing (optional)
VITE_DEFAULT_CLASS_CODE=TEST-2025

# Auto-join class on first visit (for single-class deployments)
VITE_AUTO_JOIN_CLASS=false

# Maximum students per class (default: 100)
VITE_MAX_STUDENTS_PER_CLASS=100
```

### Rate Limiting Configuration

```bash
# Games: submissions per time window
VITE_RATE_LIMIT_GAMES_MAX=1
VITE_RATE_LIMIT_GAMES_WINDOW_MS=30000

# Claims: submissions per time window
VITE_RATE_LIMIT_CLAIMS_MAX=3
VITE_RATE_LIMIT_CLAIMS_WINDOW_MS=60000

# Achievements: shares per time window
VITE_RATE_LIMIT_ACHIEVEMENTS_MAX=5
VITE_RATE_LIMIT_ACHIEVEMENTS_WINDOW_MS=10000
```

### Third-Party Services (Optional)

```bash
# Error tracking (Sentry)
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Session replay (LogRocket)
VITE_LOGROCKET_APP_ID=xxxxx/truth-hunters

# Content moderation (Perspective API)
VITE_PERSPECTIVE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Email service (SendGrid, for custom emails)
VITE_SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Cloud Functions Environment Variables

Cloud Functions have their own environment configuration, managed via Firebase CLI.

### Setting Cloud Function Config

```bash
# Set Firebase Functions config
firebase functions:config:set \
  rate_limit.games_max=1 \
  rate_limit.games_window_ms=30000 \
  rate_limit.claims_max=3 \
  rate_limit.claims_window_ms=60000

# Set email service config (if using custom emails)
firebase functions:config:set \
  email.service="sendgrid" \
  email.api_key="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  email.from="noreply@yourschool.edu"

# Set admin email for notifications
firebase functions:config:set \
  admin.email="admin@yourschool.edu"

# Set content moderation config
firebase functions:config:set \
  moderation.enabled=true \
  moderation.perspective_api_key="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Viewing Current Config

```bash
# View all Cloud Functions config
firebase functions:config:get

# Output will be JSON:
# {
#   "rate_limit": {
#     "games_max": "1",
#     "games_window_ms": "30000"
#   },
#   "email": {
#     "service": "sendgrid",
#     "api_key": "SG.XXX",
#     "from": "noreply@yourschool.edu"
#   }
# }
```

### Using Config in Functions

```javascript
// functions/src/index.js
const functions = require('firebase-functions');

const rateLimitConfig = {
  games: {
    max: parseInt(functions.config().rate_limit?.games_max || '1'),
    windowMs: parseInt(functions.config().rate_limit?.games_window_ms || '30000')
  }
};

const emailConfig = {
  service: functions.config().email?.service || 'none',
  apiKey: functions.config().email?.api_key,
  from: functions.config().email?.from || 'noreply@example.com'
};
```

---

## Environment-Specific Configuration

### Development (.env.development)

```bash
# Use test Firebase project for development
VITE_FIREBASE_PROJECT_ID=truth-hunters-dev
VITE_FIREBASE_API_KEY=AIzaSy_DEV_KEY_HERE

# Relaxed rate limits for testing
VITE_RATE_LIMIT_GAMES_MAX=10
VITE_RATE_LIMIT_GAMES_WINDOW_MS=1000

# Disable email verification for faster testing
VITE_REQUIRE_EMAIL_VERIFICATION=false

# Auto-approve teachers for testing
VITE_TEACHER_APPROVAL_MODE=auto

# Enable debug logging
VITE_LOG_LEVEL=debug

# Use Firebase emulators (optional)
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIRESTORE_EMULATOR_HOST=localhost:8080
VITE_AUTH_EMULATOR_HOST=localhost:9099
VITE_FUNCTIONS_EMULATOR_HOST=localhost:5001
```

### Staging (.env.staging)

```bash
# Use staging Firebase project
VITE_FIREBASE_PROJECT_ID=truth-hunters-staging
VITE_FIREBASE_API_KEY=AIzaSy_STAGING_KEY_HERE

# Moderate rate limits
VITE_RATE_LIMIT_GAMES_MAX=2
VITE_RATE_LIMIT_GAMES_WINDOW_MS=15000

# Enable email verification but allow dev domains
VITE_REQUIRE_EMAIL_VERIFICATION=true
VITE_ALLOWED_TEACHER_DOMAINS=.edu,.k12.us,.gmail.com

# Manual teacher approval
VITE_TEACHER_APPROVAL_MODE=manual

# Enable analytics for testing
VITE_ENABLE_ANALYTICS=true

# Standard logging
VITE_LOG_LEVEL=info
```

### Production (.env.production)

```bash
# Production Firebase project
VITE_FIREBASE_PROJECT_ID=truth-hunters-prod
VITE_FIREBASE_API_KEY=AIzaSy_PRODUCTION_KEY_HERE

# Strict rate limits
VITE_RATE_LIMIT_GAMES_MAX=1
VITE_RATE_LIMIT_GAMES_WINDOW_MS=30000
VITE_RATE_LIMIT_CLAIMS_MAX=3
VITE_RATE_LIMIT_CLAIMS_WINDOW_MS=60000

# Require email verification
VITE_REQUIRE_EMAIL_VERIFICATION=true

# Strict email domain requirements
VITE_ALLOWED_TEACHER_DOMAINS=.edu,.k12.us

# Manual teacher approval (admin must approve)
VITE_TEACHER_APPROVAL_MODE=manual

# Enable all production features
VITE_ENABLE_FIREBASE=true
VITE_ENABLE_AUTH=true
VITE_ENABLE_CLOUD_FUNCTIONS=true
VITE_ENABLE_RATE_LIMITING=true
VITE_ENABLE_ANALYTICS=true

# Enable error tracking
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Minimal logging (errors only)
VITE_LOG_LEVEL=error
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore (should already be there)
.env
.env.local
.env.development.local
.env.staging.local
.env.production.local
```

### 2. Use Different Projects for Each Environment

Create separate Firebase projects:
- `truth-hunters-dev` (development)
- `truth-hunters-staging` (staging)
- `truth-hunters-prod` (production)

This prevents:
- Accidental data deletion
- Test data polluting production
- Cost overruns from development testing

### 3. Rotate API Keys Regularly

If an API key is compromised:

```bash
# 1. Create new Firebase web app
firebase apps:create web truth-hunters-web-v2

# 2. Update .env with new API key
VITE_FIREBASE_API_KEY=NEW_API_KEY_HERE

# 3. Rebuild and deploy
npm run build
# Deploy to hosting

# 4. After 48 hours, delete old app
firebase apps:delete OLD_APP_ID
```

### 4. Restrict API Keys

In Google Cloud Console:
1. Go to APIs & Services > Credentials
2. Find your Firebase API key
3. Click Edit
4. Under "Application restrictions":
   - Choose "HTTP referrers"
   - Add: `https://yourschool.edu/*`
   - Add: `https://yourdomain.com/*`
5. Save

This prevents API key abuse from other domains.

### 5. Use Environment Variables in CI/CD

**GitHub Actions**:
```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  run: npm run build
```

**Add secrets in GitHub**:
1. Go to repo Settings > Secrets > Actions
2. Add each secret:
   - `FIREBASE_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - etc.

**Netlify**:
1. Go to Site Settings > Build & Deploy > Environment
2. Add each variable
3. Redeploy site

**Vercel**:
1. Go to Project Settings > Environment Variables
2. Add each variable (separate for Production/Preview/Development)
3. Redeploy

---

## Validation

### Checking Environment Variables

Create a validation script:

**File**: `scripts/validateEnv.js`

```javascript
#!/usr/bin/env node

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const optionalVars = [
  'VITE_ENABLE_FIREBASE',
  'VITE_ENABLE_AUTH',
  'VITE_REQUIRE_EMAIL_VERIFICATION'
];

let hasErrors = false;

console.log('Validating environment variables...\n');

// Check required variables
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ Missing required variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

// Check optional variables
console.log('\nOptional variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: not set (using default)`);
  }
});

if (hasErrors) {
  console.error('\n❌ Environment validation failed!');
  console.error('Please check your .env file and add missing variables.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
  process.exit(0);
}
```

**Usage**:
```bash
# Add to package.json scripts:
{
  "scripts": {
    "validate:env": "node scripts/validateEnv.js"
  }
}

# Run before build:
npm run validate:env
npm run build
```

---

## Troubleshooting

### "Firebase configuration missing" error

**Cause**: Environment variables not loaded

**Fix**:
1. Check `.env` file exists in project root
2. Verify file is named exactly `.env` (not `.env.txt`)
3. Restart dev server: `npm run dev`
4. Check Vite config includes env loading:

```javascript
// vite.config.js
export default defineConfig({
  envPrefix: 'VITE_',
  // ...
});
```

### "API key invalid" error

**Cause**: Wrong API key or restricted key

**Fix**:
1. Verify API key is correct (copy from Firebase Console)
2. Check for extra spaces in `.env`
3. Check API key restrictions in Google Cloud Console
4. Try unrestricted key first for testing

### Environment variables not updating

**Cause**: Cached build or dev server not restarted

**Fix**:
```bash
# Clear build cache
rm -rf dist/
rm -rf node_modules/.vite/

# Restart dev server
npm run dev
```

### Different values in production

**Cause**: Hosting platform uses different env vars

**Fix**:
1. Check hosting platform environment variables
2. Verify `.env.production` is being used
3. Check build command includes environment:
   ```bash
   NODE_ENV=production npm run build
   ```

---

## Summary

### Minimum Required for Basic Setup

```bash
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### Recommended for Production

Add to above:
```bash
VITE_ENABLE_AUTH=true
VITE_REQUIRE_EMAIL_VERIFICATION=true
VITE_TEACHER_APPROVAL_MODE=manual
VITE_ALLOWED_TEACHER_DOMAINS=.edu,.k12.us
VITE_ENABLE_RATE_LIMITING=true
VITE_SENTRY_DSN=xxx (for error tracking)
```

### Template Files

Copy `.env.example` to create your environment files:

```bash
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production

# Edit each file with appropriate values
nano .env.development
```

---

## Next Steps

1. ✅ Copy `.env.example` to `.env`
2. ✅ Fill in Firebase configuration values
3. ✅ Set optional features (auth, rate limiting)
4. ✅ Run validation script: `npm run validate:env`
5. ✅ Test locally: `npm run dev`
6. ✅ Configure production environment variables in hosting platform
7. ✅ Deploy: `npm run build && npm run deploy`

For more details, see:
- [Firebase Setup Guide](../FIREBASE_SETUP.md)
- [Security Documentation](./README.md)
- [Security Summary](./SECURITY_SUMMARY.md)
