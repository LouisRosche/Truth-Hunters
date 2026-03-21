# Contributing to Truth Hunters

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md). This is an educational project for middle schoolers — maintain age-appropriate, inclusive language.

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/Truth-Hunters.git
cd Truth-Hunters
npm install
npm run dev        # http://localhost:3000
```

See [README.md](README.md) for full setup instructions and available commands.

## How to Contribute

### Bug Reports

Open a GitHub Issue with the "bug" label. Include: browser/OS, reproduction steps, expected vs. actual behavior, and console errors if any.

### Feature Requests

Open a GitHub Issue with the "enhancement" label. Include: what problem it solves, proposed solution, and how it supports epistemic skill development for ages 11-14.

### Contributing Claims

Claims are the core content. Use `npm run cms` to launch the Claims Management System, or edit `src/data/claims.js` directly.

**Requirements:**
- **TRUE claims**: Factually accurate, verifiable citation, age-appropriate, non-obvious
- **FALSE claims**: Map to an error pattern (Confident Specificity, Plausible Adjacency, Myth Perpetuation, Timeline Compression, Geographic Fabrication), plausible but wrong
- **MIXED claims**: Both true and false elements, teach nuanced evaluation

### Code Contributions

1. Fork and create a feature branch (`feature/description` or `fix/description`)
2. Follow existing patterns: functional components, ES6+, PropTypes/JSDoc
3. Add tests for new logic (see [Testing](#testing))
4. Ensure accessibility: ARIA attributes, keyboard navigation, focus management
5. Run `npm run lint && npm run test:run && npm run build` before pushing
6. Open a PR with a clear description of what changed and why

**We won't accept**: style-only changes, large refactors without justification, features misaligned with middle school education, or changes that reduce accessibility.

## Project Structure

```
src/
├── components/     # React components (colocated tests)
├── data/           # Claims database, achievements, constants
├── hooks/          # Custom React hooks
├── services/       # Firebase, analytics, leaderboard, sound
├── utils/          # Scoring, helpers, moderation, encryption
├── contexts/       # Auth context
├── styles/         # CSS
├── App.jsx         # Game orchestrator
└── main.jsx        # Entry point
```

## Testing

Vitest + @testing-library/react + userEvent v14. Tests colocated with source or in `__tests__/` subdirs.

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

**ESLint note**: Uses legacy config — requires `ESLINT_USE_FLAT_CONFIG=false` (already set in scripts).

## Pull Request Process

1. Sync with upstream, create feature branch
2. Write meaningful commits (imperative mood, explain *why*)
3. Push and open PR with description, testing steps, and screenshots for UI changes
4. Address review feedback; don't force-push after review starts

## Educational Philosophy

Grounded in research by Johnson & Johnson (cooperative learning), Wineburg et al. (lateral reading), and Barzilai & Chinn (epistemic education). Contributions should support critical thinking skill development for middle schoolers.
