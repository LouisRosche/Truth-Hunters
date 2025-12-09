# Truth Hunters: The Calibration Game

A research-backed educational game for middle schoolers to develop epistemic skills, AI error detection, and confidence calibration.

## Overview

Truth Hunters helps students learn to:
- Identify AI-generated misinformation vs expert-sourced facts
- Recognize common AI error patterns (confident specificity, myth perpetuation, etc.)
- Calibrate confidence in their knowledge
- Work collaboratively using rotating team roles
- Think critically about claims before accepting them

## Features

- **36+ curated claims** across multiple subjects and difficulty levels
- **Progressive difficulty** system (easy, medium, hard, or mixed)
- **Team roles** that rotate each round (Reader, Skeptic, Researcher, Decider)
- **Confidence staking** with risk/reward scoring (+1/-1, +3/-3, +5/-6)
- **Hints system** that costs points but helps learning
- **Achievements** for various accomplishments
- **Local leaderboards** with optional Firebase class-wide support
- **Chromebook-optimized** for school environments
- **Content moderation** for appropriate team names

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
git clone https://github.com/LouisRosche/TruthDetector.git
cd TruthDetector

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
TruthDetector/
├── src/
│   ├── components/     # React components
│   │   ├── SetupScreen.jsx
│   │   ├── PlayingScreen.jsx
│   │   ├── DebriefScreen.jsx
│   │   └── ...
│   ├── data/           # Game data
│   │   ├── claims.js   # Claims database (36+ claims)
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
├── cms/                # Claims management system
├── index.html          # Original single-file version
└── index.html.new      # Vite entry point
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

## Firebase Setup (Optional)

For class-wide leaderboards:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Get your config object from Project Settings
4. In the game, go to "Teacher Setup" and paste the config
5. Optionally set a class code to filter leaderboards

## Gameplay

1. **Setup**: Enter team name, select players (up to 4), choose difficulty and rounds
2. **Discuss Phase**: Read the claim, use team roles, discuss as a group
3. **Stake Phase**: Vote TRUE/FALSE/MIXED and stake confidence (1-3)
4. **Result**: See if you were correct, learn from the explanation
5. **Repeat** for all rounds
6. **Prediction**: Guess your final score for calibration bonus
7. **Debrief**: Review achievements, stats, and reflect

## Scoring

| Confidence | Correct | Incorrect |
|------------|---------|-----------|
| Low (●○○)  | +1      | -1        |
| Medium (●●○)| +3      | -3        |
| High (●●●) | +5      | -6        |

**Calibration Bonus**: +3 points if your predicted final score is within ±2 of actual.

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
- **Vite** - Build tool
- **Vitest** - Testing framework
- **Firebase** - Optional backend for class leaderboards

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
- Sound effects using Web Audio API for Chromebook compatibility
- Accessible design with keyboard navigation and screen reader support
