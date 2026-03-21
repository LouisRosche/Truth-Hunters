# CLAUDE.md — Project Context for AI-Assisted Development

## Quick Reference

```bash
npm run dev          # Dev server (Vite, hot reload)
npm run build        # Production build (~2s)
npm test             # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Coverage report (v8)
npm run lint         # ESLint (MUST use ESLINT_USE_FLAT_CONFIG=false)
npm run lint:fix     # ESLint autofix
```

**Critical**: ESLint 8 uses legacy config. All lint commands require `ESLINT_USE_FLAT_CONFIG=false` (already set in package.json scripts and lint-staged).

## Architecture

React 19 + Vite 7 SPA. Firebase 12 optional backend (Firestore, Auth). No router — single-page game with phase-based navigation (`setup → playing → debrief`).

### Core Flow
- `App.jsx` — Game orchestrator. Manages phase transitions, scoring, Firebase saves, session tracking. ~980 lines. All game state lives here.
- `SetupScreen` → `PlayingScreen` → `DebriefScreen` — Lazy-loaded screen components.
- `PredictionModal` shown between setup and playing for metacognition priming.

### Key Patterns
- **Code-splitting**: `React.lazy()` for screen components.
- **Functional state updates**: `setGameState(prev => ...)` to avoid stale closures. The streak bug (fixed) was caused by reading `currentStreak` directly in a `useCallback`.
- **Resilient Firebase saves**: `resilientSave()` in `src/utils/firebaseResilience.js` tries Firebase first, falls back to `OfflineQueue` on failure. `removeSessionWithRetry()` handles session cleanup with retry logic. `withTimeout()` guards Firebase fetches against hanging.
- **Session cleanup**: Uses `visibilitychange` event (not `beforeunload`) for reliable cleanup.
- **Anti-cheat**: Tab switch detection, forfeit penalties (in `useGameIntegrity` hook).
- **Feature flags**: `src/utils/featureFlags.js` with localStorage persistence.

### Scoring Model
Confidence calibration: 1-3 confidence × correct/incorrect matrix with asymmetric stakes. Calibration bonus (+3) if final score within 2 of prediction. Difficulty multipliers applied per-claim.

### Data
- `src/data/claims.js` — ~375KB claims database, code-split as its own chunk.
- `src/data/achievements.js` — Game + lifetime achievement conditions.
- `src/data/constants.js` — Team avatars, game config, error patterns.

## Testing

Vitest 4 + @testing-library/react 16 + userEvent v14.

### Conventions
- Component tests: colocated as `ComponentName.test.jsx`
- Utility/service tests: in `__tests__/` subdirectories or colocated
- Mock Firebase, SoundManager, Analytics at module level
- userEvent v14: `const user = userEvent.setup()` then `await user.click(...)` — dispatches to **focused element**, not document
- Static data (like `LEVELS` arrays) hoisted to module scope to avoid re-creation

### Current Coverage
~67% statements overall. 64 test files, ~1,266 tests. Coverage thresholds enforced in `vite.config.js` (66/56/70/68). Key remaining gaps: App.jsx (0%), firebase.js (5%).

### Quality Gates
- **Pre-commit**: lint-staged runs ESLint with `--max-warnings=0`
- **Pre-push**: Husky runs full `vitest run`
- **CI**: Lint → test with coverage thresholds → build → deploy (GitHub Pages)

## Known Issues
- App.jsx at 0% test coverage (979 lines — integration-level testing needed)
- firebase.js at 5% coverage (mostly untestable without emulator)

## Accessibility
WCAG 2.2 targeted. Focus traps on modals, `radiogroup` pattern for verdict/confidence selectors, keyboard navigation with arrow keys, `aria-live` regions for timer urgency. Presentation mode for 4-students-per-Chromebook use case.
