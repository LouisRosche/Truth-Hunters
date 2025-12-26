# Contributing to Truth Hunters

Thank you for your interest in contributing to Truth Hunters! This educational game helps middle schoolers develop critical thinking skills and AI error detection abilities. We welcome contributions from educators, developers, researchers, and anyone passionate about epistemic education.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Claims](#contributing-claims)
  - [Code Contributions](#code-contributions)
  - [Documentation](#documentation)
  - [Educational Research](#educational-research)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read the full [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

**Key principles:**
- Be respectful of differing viewpoints and experiences
- Use welcoming and inclusive language
- Focus on what is best for the community and students
- Show empathy toward other community members
- Respect educational and pedagogical expertise

By participating in this project, you agree to abide by our Code of Conduct. Violations may result in temporary or permanent exclusion from the project.

---

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report, please:

1. **Check existing issues** to see if it's already reported
2. **Verify it's reproducible** in the latest version
3. **Collect information**:
   - Browser version and OS
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots if applicable
   - Error messages from browser console (F12 → Console)

**Submit via GitHub Issues** with the "bug" label and include:
- **Clear title**: "Bug: [Brief description]"
- **Environment**: Browser, OS, device type (Chromebook, desktop, etc.)
- **Reproduction steps**: Numbered list of exact steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Impact**: Does this affect gameplay, accessibility, data integrity?

### Suggesting Enhancements

We welcome ideas for new features, UI improvements, or pedagogical enhancements! Before suggesting:

1. **Check existing issues** for similar requests
2. **Consider the target audience** (middle school students, ages 11-14)
3. **Think about educational value** vs. feature complexity

**Submit via GitHub Issues** with the "enhancement" label and include:
- **Clear title**: "Enhancement: [Brief description]"
- **Problem statement**: What need does this address?
- **Proposed solution**: How would it work?
- **Pedagogical rationale**: How does this improve learning outcomes?
- **Alternatives considered**: What other approaches did you think about?
- **Mockups/examples**: Visual aids if applicable

### Contributing Claims

Claims are the heart of Truth Hunters. To contribute new claims:

#### Educational Standards for Claims

**TRUE Claims (Expert-Sourced)**:
- Must be **factually accurate** and verifiable
- Include **credible citations** (peer-reviewed sources, textbooks, .edu/.gov sites)
- Age-appropriate for **middle school comprehension**
- Interesting and **non-obvious** (avoid trivial facts)

**FALSE Claims (AI-Generated Errors)**:
- Must map to one of our **error pattern taxonomy**:
  - Confident Specificity
  - Plausible Adjacency
  - Myth Perpetuation
  - Timeline Compression
  - Geographic Fabrication
- Should be **plausible but wrong** (not obviously absurd)
- Include **clear explanation** of why it's false and which pattern it uses

**MIXED Claims**:
- Contain both true and false elements
- Designed to teach **nuanced evaluation**
- Clearly explain which parts are accurate/inaccurate

#### Claim Submission Process

1. **Use the Claims Management System (CMS)**:
   ```bash
   npm run cms
   ```
   Navigate to `http://localhost:3001` and use the GUI

2. **OR manually edit `src/data/claims.js`** following this format:
   ```javascript
   {
     id: 'biology-medium-101',
     text: 'Your claim text here (clear, specific, grade-appropriate)',
     answer: 'TRUE', // or 'FALSE' or 'MIXED'
     source: 'expert-sourced', // or 'ai-generated'
     explanation: 'Detailed explanation of why this is true/false/mixed',
     errorPattern: 'N/A - Accurate', // For AI claims: pattern name
     subject: 'Biology', // See SUBJECTS in constants.js
     difficulty: 'medium', // easy | medium | hard
     gradeLevel: 'middle', // elementary | middle | high | college
     citation: 'https://example.edu/source', // For TRUE claims
     lastVerified: '2025-12-17', // Date you verified accuracy
     reviewedBy: ['yourGitHubUsername']
   }
   ```

3. **Verification requirements**:
   - For TRUE claims: Verify citation URL still works
   - For FALSE claims: Double-check the real fact to avoid accidental misinformation
   - Test with students if possible

4. **Submit PR** with:
   - Claim details in description
   - Why this claim is pedagogically valuable
   - Citations for verification

### Code Contributions

We accept PRs for:
- **Bug fixes**
- **Feature implementations** (discuss in issue first for large changes)
- **UI/UX improvements**
- **Accessibility enhancements**
- **Performance optimizations**
- **Test coverage**
- **Documentation**

**What we generally won't accept**:
- Style-only changes (formatting, renaming) without functional benefit
- Large refactors without clear justification
- Features that don't align with middle school education
- Changes that reduce accessibility
- Dependencies without strong rationale

### Documentation

Help us make Truth Hunters easier to use:
- **Improve README** with clearer instructions
- **Add code comments** where logic is complex
- **Create tutorials** for teachers
- **Translate documentation** (if we add i18n support)
- **Fix typos** (small but valuable!)

### Educational Research

If you're a researcher:
- **Share findings** from using Truth Hunters in studies
- **Contribute citations** to relevant educational research
- **Suggest improvements** based on learning science
- **Validate claims** for factual accuracy
- **Assess age-appropriateness** of content

---

## Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **Git**
- **Modern browser** (Chrome, Firefox, Edge, Safari)
- **Code editor** (VS Code recommended)

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Truth-Hunters.git
cd Truth-Hunters

# 3. Add upstream remote
git remote add upstream https://github.com/LouisRosche/Truth-Hunters.git

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

### Available Commands

```bash
npm run dev          # Start dev server (hot reload)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
npm run lint         # Check for linting errors
npm run cms          # Start claims management system
```

### Before Committing

```bash
# Run linter and fix issues
npm run lint

# Run tests
npm run test:run

# Build to ensure no build errors
npm run build
```

---

## Project Structure

```
Truth-Hunters/
├── src/
│   ├── components/          # React components
│   │   ├── SetupScreen.jsx     # Game setup
│   │   ├── PlayingScreen.jsx   # Active gameplay
│   │   ├── DebriefScreen.jsx   # Post-game review
│   │   └── ...                 # Shared components
│   ├── data/                # Game data
│   │   ├── claims.js           # Claims database (726 claims)
│   │   ├── achievements.js     # Achievement definitions
│   │   └── constants.js        # Game constants
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic services
│   │   ├── firebase.js         # Firebase backend
│   │   ├── analytics.js        # Local analytics
│   │   ├── leaderboard.js      # Leaderboard management
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── scoring.js          # Point calculation
│   │   ├── helpers.js          # General helpers
│   │   └── moderation.js       # Content filtering
│   ├── styles/              # CSS
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── cms/                     # Claims Management System
├── .github/workflows/       # CI/CD automation
├── tests/                   # Test files (alongside source)
└── public/                  # Static assets
```

---

## Coding Standards

### JavaScript/React

- **ES6+ syntax** (const/let, arrow functions, destructuring)
- **Functional components** with hooks (no class components)
- **PropTypes or JSDoc** for prop documentation
- **Meaningful names**: `handleRoundSubmit` not `submit`
- **Comments**: Explain *why*, not *what* (code should be self-explanatory)

### Example:

```javascript
/**
 * Calculate points based on correctness and confidence level
 * Uses variable stakes to reward calibrated confidence
 */
export function calculatePoints(correct, confidence) {
  // Point structure encourages accurate confidence calibration
  const pointMatrix = {
    1: { correct: 1, incorrect: -1 },   // Low confidence (safe)
    2: { correct: 3, incorrect: -3 },   // Medium confidence
    3: { correct: 5, incorrect: -6 }    // High confidence (risky)
  };

  const outcome = correct ? 'correct' : 'incorrect';
  return pointMatrix[confidence][outcome];
}
```

### Accessibility

- **ARIA attributes** for screen readers (`aria-label`, `role`, `aria-live`)
- **Keyboard navigation** for all interactive elements
- **Color contrast** WCAG AA minimum (4.5:1 for normal text)
- **Focus indicators** visible on all focusable elements
- **Semantic HTML** (`<button>` for buttons, not `<div onclick>`)

### Content Standards

- **Age-appropriate language** (no profanity, violence, adult themes)
- **Inclusive terminology** (avoid bias, stereotypes)
- **Clear explanations** readable by 6th graders
- **Factual accuracy** for all TRUE claims (cite sources)

---

## Testing Guidelines

### What to Test

- **Utility functions**: `src/utils/*.js` should have comprehensive unit tests
- **Services**: Core logic in `src/services/*.js` should be tested
- **Components**: Critical user interactions (form submission, game flow)
- **Edge cases**: Empty states, error conditions, boundary values

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { calculatePoints } from './scoring';

describe('calculatePoints', () => {
  it('awards +5 points for correct answer with high confidence', () => {
    expect(calculatePoints(true, 3)).toBe(5);
  });

  it('deducts -6 points for incorrect answer with high confidence', () => {
    expect(calculatePoints(false, 3)).toBe(-6);
  });

  it('handles edge case of invalid confidence level', () => {
    // Should either throw or default to medium confidence
    expect(() => calculatePoints(true, 99)).not.toThrow();
  });
});
```

### Coverage Goals

- **Utilities**: 90%+ coverage (these are business logic)
- **Services**: 80%+ coverage
- **Components**: Focus on critical paths (form validation, game flow)

---

## Pull Request Process

### 1. Create a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write code following our standards
- Add/update tests as needed
- Update documentation if changing behavior
- Run linter and tests locally

### 3. Commit with Meaningful Messages

```bash
# Good commit messages:
git commit -m "Add hint penalty to scoring system

- Deduct 1 point when students use hints
- Track hint usage in analytics
- Update scoring documentation

Closes #42"

# Bad commit messages:
git commit -m "fix stuff"
git commit -m "asdf"
```

**Format**:
- **First line**: Imperative mood summary (<50 chars)
- **Body** (optional): Detailed explanation, why not just what
- **Footer**: Reference issues ("Closes #42", "Relates to #38")

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

On GitHub:
- Click "Create Pull Request"
- **Title**: Clear, descriptive (same as first commit line)
- **Description**:
  - What changed and why
  - How to test
  - Screenshots if UI change
  - Link to related issues
- **Labels**: bug, enhancement, documentation, etc.
- **Request review** from maintainers

### 5. Code Review

- Address feedback promptly
- Push new commits to same branch (PR updates automatically)
- Don't force-push after review starts (makes review harder)
- Engage respectfully with reviewers

### 6. Merge

Once approved:
- Maintainer will merge (squash or merge commit)
- Delete your feature branch after merge
- Celebrate! 🎉

---

## Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions, ideas, sharing results
- **Email**: [Maintainer contact] for private inquiries

### Recognition

Contributors will be recognized:
- In release notes for significant contributions
- In README contributors section (if you'd like)
- Via GitHub's built-in contributor tracking

### License

By contributing, you agree that your contributions will be licensed under the **MIT License**, the same as this project.

---

## Educational Philosophy

Truth Hunters is grounded in research:

- **Johnson & Johnson (2009)**: Cooperative learning structures
- **Wineburg et al. (2022)**: Lateral reading and web credibility
- **Barzilai & Chinn (2018)**: Epistemic education goals
- **Lichtenstein et al.**: Calibration training methods

When contributing, consider:
- **Does this support epistemic skill development?**
- **Is it age-appropriate for middle schoolers (11-14)?**
- **Does it encourage collaboration and discussion?**
- **Will it help students recognize AI-generated misinformation?**

---

## Questions?

Don't hesitate to ask! Open an issue with the "question" label or start a discussion. We're here to help and appreciate your interest in improving epistemic education.

**Thank you for contributing to Truth Hunters!** 🔍
