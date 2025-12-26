# Truth Hunters: The Calibration Game

[![CI/CD](https://github.com/LouisRosche/Truth-Hunters/actions/workflows/ci.yml/badge.svg)](https://github.com/LouisRosche/Truth-Hunters/actions/workflows/ci.yml)

A research-backed educational game for middle schoolers to develop epistemic skills, AI error detection, and confidence calibration.

---

## ⚠️ Project Status: BETA (Not Production Ready)

**Current Status:** Active development with known issues requiring remediation

### Critical Notices

**Legal Compliance:** Missing required legal documentation (Privacy Policy, Terms of Service). COPPA/GDPR compliance gaps exist. See [legal-compliance-audit-report.json](legal-compliance-audit-report.json) for details.

**Security:** Authentication system requires implementation before production deployment. Teacher dashboard currently accessible via URL parameter. See [docs/security/README.md](docs/security/README.md).

**Accessibility:** Partial WCAG 2.2 compliance. 47 accessibility issues documented in [accessibility-audit-report.json](accessibility-audit-report.json). Keyboard navigation implemented; screen reader support in progress.

**Internationalization:** Infrastructure configured (react-i18next) but component integration pending. Currently English-only in practice.

**Remediation Estimate:** 352-484 hours across legal, accessibility, security, and i18n domains. See [COMPREHENSIVE_AUDIT_SUMMARY.md](COMPREHENSIVE_AUDIT_SUMMARY.md) and [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md).

**Safe for:** Development, testing, classroom pilots with informed consent and supervision
**Not ready for:** Unsupervised production deployment, public release without legal review

---

## Overview

Truth Hunters helps students learn to:
- Identify AI-generated misinformation vs expert-sourced facts
- Recognize common AI error patterns (confident specificity, myth perpetuation, etc.)
- Calibrate confidence in their knowledge
- Work collaboratively as a team
- Think critically about claims before accepting them

## Features

### Core Gameplay ✅
- **726 curated claims** across 22 subjects (Biology, History, Physics, Media Literacy, and more)
- **Progressive difficulty** system (easy, medium, hard, or mixed)
- **Calibration-based tips** that help students learn from their confidence patterns
- **Confidence staking** with risk/reward scoring
- **Hints system** that costs points but helps learning
- **Achievements** for various accomplishments
- **Local leaderboards** with Firebase class-wide integration available
- **Web-based design** compatible with Chromebooks (standard Web Audio API)
- **Content moderation** for profanity in team names

### In Development 🚧
- **Accessibility:** Keyboard navigation functional; working toward full WCAG 2.2 AA compliance (47 issues in remediation)
- **Internationalization:** react-i18next infrastructure ready; component integration in progress (currently English-only)
- **Authentication:** Firebase authentication system (required for production)

## 📚 Documentation

**→ See [DOCUMENTATION.md](DOCUMENTATION.md) for complete documentation index**

Quick links:
- [Contributing Guidelines](CONTRIBUTING.md) - Code contributions, claim submissions, bug reports
- [Firebase Setup](docs/FIREBASE_SETUP.md) - Class-wide leaderboards setup for IT admins
- [Internationalization](docs/I18N_GUIDE.md) - i18n infrastructure and translation framework
- [Security Documentation](docs/security/README.md) - Security architecture and implementation status

## Research Foundation

This game is informed by educational research including:
- **Johnson & Johnson (2009)** - Cooperative learning structures
- **Wineburg et al. (2022)** - Lateral reading and web credibility
- **Barzilai & Chinn (2018)** - Epistemic education goals
- **Lichtenstein et al.** - Calibration training methods

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/LouisRosche/Truth-Hunters.git
cd Truth-Hunters

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Run Tests

```bash
npm test          # Watch mode
npm run test:run  # Single run
```

## Project Structure

```
Truth-Hunters/
├── src/
│   ├── components/     # React components
│   │   ├── SetupScreen.jsx
│   │   ├── PlayingScreen.jsx
│   │   ├── DebriefScreen.jsx
│   │   └── ...
│   ├── data/           # Game data
│   │   ├── claims.js   # Claims database (726 claims)
│   │   ├── achievements.js
│   │   └── constants.js
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Firebase, leaderboard, sound
│   ├── styles/         # CSS styles
│   ├── utils/          # Utility functions
│   │   ├── scoring.js
│   │   ├── helpers.js
│   │   └── moderation.js
│   ├── App.jsx
│   └── main.jsx
├── cms/                    # Claims management system
├── .github/workflows/      # CI/CD automation
├── index.html              # Vite entry point
├── index.standalone.html   # Standalone single-file version (no build needed)
├── netlify.toml            # Netlify deployment config
└── vercel.json             # Vercel deployment config
```

## Claims Management (CMS)

A simple CMS is included for managing claims:

```bash
npm run cms
```

This launches a local interface at `http://localhost:3001` where you can:
- View all claims (built-in + custom)
- Add new custom claims
- Edit/delete custom claims
- Filter by difficulty, source, or search text
- Export/import custom claims as JSON

Custom claims are stored in localStorage and can be exported for sharing.

## Adding New Claims

### Using the CMS
1. Run `npm run cms`
2. Click "Add Claim"
3. Fill in the form with claim text, answer, source, etc.
4. Save

### Manually in Code

Add claims to `src/data/claims.js`:

```javascript
{
  id: 'custom-001',
  text: 'Your claim text here',
  answer: 'TRUE', // or 'FALSE' or 'MIXED'
  source: 'expert-sourced', // or 'ai-generated'
  explanation: 'Explanation of why this is true/false/mixed',
  errorPattern: 'N/A - Accurate', // For AI claims, use a pattern name
  subject: 'Biology',
  difficulty: 'medium' // easy, medium, or hard
}
```

### Error Patterns (for AI-generated claims)
- **Confident Specificity** - Precise but fabricated numbers/dates
- **Plausible Adjacency** - Almost-right terminology swaps
- **Myth Perpetuation** - Common misconceptions stated as fact
- **Timeline Compression** - Events merged or incorrectly dated
- **Geographic Fabrication** - Made-up but plausible location details

## Firebase Integration

Firebase provides **optional enhanced features** for classroom use:
- Class-wide leaderboards
- Teacher dashboard
- Student claim submissions
- Cross-device synchronization

**Note:** Firebase is a production dependency. The app functions without Firebase configuration (local-only mode), but teacher features require Firebase setup.

**Quick Setup:**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Get your config object from Project Settings
4. In the game, go to "Teacher Setup" and paste the config
5. Optionally set a class code to filter leaderboards

**⚠️ Security Notice:** Current implementation uses URL parameter authentication (`?teacher=true`) for teacher mode. Production deployment requires Firebase Authentication implementation. See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) and [docs/security/README.md](docs/security/README.md).

## Gameplay

1. **Setup**: Enter team name, select players (up to 4), choose difficulty, subjects, and rounds
2. **Play**: Read each claim, discuss with your team, vote TRUE/FALSE/MIXED, and set confidence (1-3)
3. **Learn**: See results with explanations and calibration tips based on your confidence accuracy
4. **Repeat**: Click "Next Round" to continue through all claims
5. **Prediction**: Guess your final score for calibration bonus (+3 if within ±2)
6. **Debrief**: Review achievements, stats, round-by-round breakdown, and team reflection

## Scoring

| Confidence | Correct | Incorrect |
|------------|---------|-----------|
| Low (●○○)  | +1      | -1        |
| Medium (●●○)| +2      | -1        |
| High (●●●) | +3      | -2        |

**Calibration Bonus**: +3 points if your predicted final score is within ±2 of actual.
**Hints**: Using hints costs points (-1 each) but helps learning.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Run ESLint
- `npm run cms` - Start claims management system

### Technologies

- **React 18** - UI framework
- **Vite 7** - Build tool and dev server
- **Vitest** - Testing framework
- **Firebase 12** - Backend integration for class features

## Deployment

### ⚠️ Pre-Deployment Requirements

**Before production deployment, address:**
- [ ] Legal compliance (Privacy Policy, Terms of Service, COPPA/GDPR) - See [legal-compliance-audit-report.json](legal-compliance-audit-report.json)
- [ ] Firebase Authentication implementation - See [docs/security/README.md](docs/security/README.md)
- [ ] Critical accessibility fixes - See [accessibility-audit-report.json](accessibility-audit-report.json)
- [ ] Security hardening (authentication, secure Firestore rules)

**Current deployment suitable for:** Development, testing, supervised classroom pilots only

### GitHub Pages (Automatic - Development/Testing)

The repository includes CI/CD that automatically deploys to GitHub Pages on every push to `main`:

1. Enable GitHub Pages in your repository settings (Settings → Pages → Source: GitHub Actions)
2. Push to `main` branch
3. Your site will be live at `https://[username].github.io/Truth-Hunters/`

### Netlify (One-Click)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LouisRosche/Truth-Hunters)

Or manually:
1. Connect your repository to Netlify
2. Build settings are auto-detected from `netlify.toml`
3. Deploy!

### Vercel (One-Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LouisRosche/Truth-Hunters)

Or manually:
1. Import your repository in Vercel
2. Settings are auto-detected from `vercel.json`
3. Deploy!

### Static Hosting (Manual)

For any static host (S3, Firebase Hosting, Apache, nginx, etc.):

```bash
npm run build
# Upload contents of dist/ to your server
```

**Important**: Configure your server to serve `index.html` for all routes (SPA fallback).

### Standalone Version

For quick deployment without a build step, use `index.standalone.html`:
- Single HTML file with everything embedded
- No build tools required
- Just upload to any web server
- Note: Uses CDN-hosted React/Firebase (requires internet connection)

### Security Headers

Production deployments should include these security headers (pre-configured in `netlify.toml` and `vercel.json`):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (restricts script sources)
- `Referrer-Policy: strict-origin-when-cross-origin`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding Claims

When adding claims, ensure:
- Claims are factually accurate (TRUE claims) or intentionally false/mixed
- Explanations are clear and educational
- AI-generated claims have identifiable error patterns
- Difficulty is appropriate for middle school students

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Research-based design informed by epistemic education literature
- Sound effects using Web Audio API for cross-platform compatibility
- Accessibility features implementing WCAG 2.2 guidelines (in progress)
- Comprehensive security and quality audits informing ongoing development
