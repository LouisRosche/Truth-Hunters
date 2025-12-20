# Configuration Files Reference

This document explains all configuration files in the Truth Hunters repository.

---

## Firebase Configuration

### `firebase.json`

Firebase CLI configuration file that defines which Firebase services are used and where their configuration files are located.

```json
{
  "firestore": {
    "rules": "firestore.rules",      // Security rules for Firestore database
    "indexes": "firestore.indexes.json"  // Database indexes for query optimization
  }
}
```

**What it does:**
- Tells Firebase CLI where to find Firestore security rules
- Points to database index definitions for complex queries
- Used when deploying Firebase configuration with `firebase deploy`

**When to modify:**
- When adding new Firebase services (Storage, Functions, Hosting, etc.)
- When changing the location of rules or index files
- Rarely needs modification for this project

---

### `.firebaserc`

Firebase project configuration that maps project aliases to Firebase project IDs.

```json
{
  "projects": {
    "default": "truth-hunters-classroom"  // Default Firebase project ID
  }
}
```

**What it does:**
- Associates this codebase with a specific Firebase project
- Allows multiple environments (dev, staging, production) using aliases
- Used by Firebase CLI to know which project to deploy to

**When to modify:**
- When setting up Firebase for the first time (automatically created)
- When adding multiple environments (e.g., `"staging": "truth-hunters-dev"`)
- Each teacher/school will have their own project ID here

---

## Build & Development Configuration

### `vite.config.js`

Vite build tool configuration for development server and production builds.

**Key settings:**
- **Server port:** 3000 (development server)
- **Source maps:** Enabled in development, should be disabled in production
- **Build output:** `dist/` directory
- **Base path:** `/Truth-Hunters/` for GitHub Pages deployment

**Environment variables:**
All environment variables must be prefixed with `VITE_` to be exposed to the browser:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- etc.

See `.env.example` for the complete list.

---

### `.eslintrc.cjs`

ESLint configuration for code quality and consistency.

**Key rules:**
- **React refresh warnings only:** Allows flexible component exports for educational codebase
- **Prop-types validation:** Currently disabled but should be added for production
- **Unused vars:** Warns but doesn't error to allow iterative development

**Disabled rules and why:**
- `react/prop-types`: Should be enabled with PropTypes validation (TODO)
- `react-refresh/only-export-components`: Relaxed to "warn" for flexibility
- These are intentionally relaxed for an educational project

**When to modify:**
- When enforcing stricter code quality standards
- When adding TypeScript (would replace with TSConfig)
- When project moves beyond educational/prototype phase

---

## Package Management

### `package.json`

npm package configuration and scripts.

**Key scripts:**
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm test` - Run tests in watch mode
- `npm run lint` - Check code quality
- `npm run cms` - Start Claims Management System

**Dependencies:**
- **React 18:** UI framework
- **Firebase 11:** Backend services (optional)
- **DOMPurify:** XSS protection for user-generated content
- **Vite 6:** Build tool and dev server

**Dev Dependencies:**
- **Vitest:** Testing framework
- **ESLint:** Code linting
- **@testing-library/react:** Component testing utilities

---

## Firebase Security

### `firestore.rules`

Security rules that control who can read/write to Firestore database.

**Key permissions:**
- Game results: Anyone can read, only authenticated users can write
- Reflections: Public read, authenticated write (with validation)
- Claims: Teachers can approve/reject, students can submit
- Leaderboards: Public read, system write only

**IMPORTANT:** These rules protect student data and prevent abuse. Only modify if you understand Firebase Security Rules syntax.

---

### `firestore.indexes.json`

Database indexes for efficient querying.

**Current indexes:**
- Class leaderboards by score (descending)
- Games by timestamp (for recent games)
- Pending claims by submission date

**When to add indexes:**
Firebase will warn you in the console when a query needs an index. Follow the provided link to automatically generate the index definition.

---

## Deployment Configuration

### `netlify.toml`

Netlify deployment configuration.

**Key settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: Redirects all routes to `index.html`
- Security headers: CSP, X-Frame-Options, etc.

---

### `vercel.json`

Vercel deployment configuration.

**Key settings:**
- Build output: `dist`
- SPA rewrites: `/*` → `/index.html`
- Security headers: Same as Netlify

---

## Environment Variables

### `.env.example`

Template for environment variables. Copy to `.env` and fill in your values.

**Required for Firebase:**
- `VITE_FIREBASE_API_KEY` - From Firebase Console
- `VITE_FIREBASE_AUTH_DOMAIN` - From Firebase Console
- `VITE_FIREBASE_PROJECT_ID` - From Firebase Console
- `VITE_FIREBASE_STORAGE_BUCKET` - From Firebase Console
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - From Firebase Console
- `VITE_FIREBASE_APP_ID` - From Firebase Console

**Optional:**
- `VITE_DEFAULT_CLASS_CODE` - For testing
- `VITE_ENABLE_FIREBASE` - Feature flag (default: true)
- `VITE_SENTRY_DSN` - Error tracking (production)

**IMPORTANT:**
- Never commit `.env` to version control
- `.env` is in `.gitignore` to prevent accidental commits
- Each deployment environment should have its own `.env` file

---

## GitHub Actions

### `.github/workflows/ci.yml`

Continuous Integration pipeline that runs on every push.

**What it does:**
1. Installs dependencies
2. Runs ESLint
3. Runs tests
4. Builds production bundle
5. Deploys to GitHub Pages (if on main branch)

**When tests fail:**
- Check the Actions tab in GitHub
- Fix failing tests before merging to main
- CI badge in README shows current status

---

## Testing Configuration

### `vitest.config.js`

Test framework configuration (uses Vite config as base).

**Key settings:**
- Environment: jsdom (simulates browser)
- Coverage: enabled with Istanbul
- Global test utilities: React Testing Library
- Mock file system for localStorage tests

---

## Questions?

- **General setup:** See [README.md](../README.md)
- **Contributing:** See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Firebase setup:** See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **Deployment:** See [README.md#deployment](../README.md#deployment)
