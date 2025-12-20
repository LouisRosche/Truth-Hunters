# Universal GitHub Repository Audit Framework - Usage Guide

**Version:** 1.0
**Last Updated:** December 20, 2024

This guide helps auditors use the [Universal GitHub Repository Audit Framework](audit/AUDIT_FRAMEWORK.md) effectively to conduct comprehensive, context-aware repository evaluations.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Conducting an Audit](#conducting-an-audit)
3. [Interpreting Scores](#interpreting-scores)
4. [Common Pitfalls](#common-pitfalls)
5. [Domain-Specific Guidance](#domain-specific-guidance)
6. [Example Audits](#example-audits)
7. [Automation Tools](#automation-tools)

---

## Quick Start

### What You Need

- [ ] Access to the repository to audit
- [ ] [AUDIT_TEMPLATE.md](audit/AUDIT_TEMPLATE.md) (copy this for your audit)
- [ ] [AUDIT_FRAMEWORK.md](audit/AUDIT_FRAMEWORK.md) (reference document)
- [ ] 2-8 hours (depending on repository complexity)

### Basic Workflow

1. **Copy the template**: Create a copy of `docs/audit/AUDIT_TEMPLATE.md` for your audit
2. **Classify the project**: Complete Section 1 (Context Classification)
3. **Review the code**: Clone/browse the repository
4. **Evaluate each criterion**: Use framework Section 1-8 as guides
5. **Score appropriately**: Use 1-5 scale relative to context
6. **Document findings**: Include specific file/line references
7. **Check for bias**: Complete the bias checklist
8. **Generate recommendations**: Prioritize improvements

---

## Conducting an Audit

### Phase 1: Context Classification (30-60 minutes)

**Objective:** Understand what standards to apply.

**Steps:**

1. **Read the README**: Understand the stated purpose
2. **Identify the domain**: Library? Application? Research? Game?
3. **Assess maturity**: Is this a prototype or production-ready?
4. **Determine scale**: Personal project or enterprise software?
5. **Evaluate criticality**: Hobby or safety-critical?

**Example:**

```
Domain:        Educational Application (Game-based Learning)
Maturity:      Stable (v1.0.0, production-ready)
Scale:         Team/Community (Educational institutional use)
Paradigm:      Declarative (React-based, functional components)
Criticality:   Production (deployed in schools)

Evaluation Baseline: Production educational software for K-12
environments requiring accessibility, security, and pedagogy.
```

**Why This Matters:**

A hobby CLI tool should **not** be judged by the same standards as a medical device firmware. Context classification prevents unfair comparisons.

---

### Phase 2: Initial Assessment (30-45 minutes)

**Objective:** Get oriented with the repository.

**Quick Checks:**

```bash
# Clone the repository
git clone <repo-url>
cd <repo-name>

# Check basic stats
git log --oneline | wc -l          # Total commits
git shortlog -sn --all             # Contributors
git log --since="30 days ago" --oneline | wc -l  # Recent activity

# Check structure
tree -L 2 -d                       # Directory structure
find . -name "*.test.*" | wc -l    # Test files
find . -name "README*"             # Documentation

# Check dependencies (example for Node.js)
cat package.json                   # Dependencies
npm audit                          # Vulnerabilities
```

**Document:**

- Primary languages
- License type
- Age of project
- Contributor count
- CI/CD presence

---

### Phase 3: Detailed Evaluation (2-6 hours)

**Objective:** Deep dive into each criterion.

#### 1. Fitness for Purpose (Framework Section 1)

**Key Questions:**

- Does it do what the README claims?
- Is the approach appropriate for the problem?
- Are core features complete?

**How to Evaluate:**

1. List claims from README
2. Test basic functionality (if possible)
3. Check for unimplemented features
4. Verify accuracy (for data/research projects)

**Red Flags:**

- ⚠️ README promises features not present in code
- ⚠️ Fundamental design mismatch (e.g., synchronous code for I/O-heavy tasks)
- ⚠️ Half-implemented core features

**Score Guide:**

- **5**: Perfect alignment, all features work as claimed
- **4**: Minor gaps, but core promise fulfilled
- **3**: Some mismatch, key features incomplete
- **2**: Significant gaps, misleading claims
- **1**: Doesn't deliver on stated purpose

---

#### 2. Code Quality (Framework Section 2)

**Key Dimensions:**

- Readability
- Complexity
- Modularity
- Idiomaticity
- Error handling

**How to Evaluate:**

```bash
# Language-specific tools
# Python
pylint <module>
radon cc <module>          # Cyclomatic complexity

# JavaScript
npx eslint .
npx complexity-report src/

# Go
golangci-lint run

# Rust
cargo clippy
```

**Manual Review:**

- Read 3-5 representative files
- Check naming conventions
- Look for code duplication
- Assess abstraction levels
- Review error handling patterns

**Domain-Specific Checks:**

Consult Framework Section 2 "Domain-Specific Considerations" table. For example:

- **ML/Data**: Check for random seed setting, experiment tracking
- **Frontend**: Check for accessibility attributes, responsive design
- **Embedded**: Check for memory management, hardware abstraction

**Score Guide:**

- **5**: Exemplary code, sets standards for the domain
- **4**: High quality, minor style inconsistencies
- **3**: Adequate, some tech debt but maintainable
- **2**: Poor structure, significant refactoring needed
- **1**: Unmaintainable, severe quality issues

---

#### 3. Documentation (Framework Section 3)

**Audience-First Approach:**

1. Identify target audience (users? contributors? operators?)
2. Check for minimum viable documentation (see Framework Section 3 table)
3. Assess quality signals

**Checklist:**

- [ ] README exists and is current
- [ ] Installation instructions work
- [ ] Basic usage examples provided
- [ ] API documentation (if library)
- [ ] Architecture docs (if complex)
- [ ] Contributing guide (if accepting PRs)
- [ ] Changelog maintained

**Quality Indicators:**

- ✅ Code comments explain *why*, not *what*
- ✅ Examples are copy-pasteable
- ✅ Troubleshooting section exists
- ✅ Screenshots/demos for UI projects

**Score Guide:**

- **5**: Excellent docs, users succeed quickly
- **4**: Good coverage, minor gaps
- **3**: Adequate, but requires reading code
- **2**: Sparse, blocks adoption
- **1**: Absent or misleading

---

#### 4. Testing (Framework Section 4)

**Context-Appropriate Standards:**

Use Framework Section 4 table to determine reasonable expectations.

**Metrics to Gather:**

```bash
# Run tests
npm test               # Node.js
pytest --cov           # Python
go test -cover ./...   # Go
cargo test             # Rust

# Check CI
cat .github/workflows/*.yml
cat .gitlab-ci.yml
```

**Evaluate:**

- [ ] Tests exist and pass
- [ ] Coverage is appropriate to project type
- [ ] Integration tests for key workflows
- [ ] Edge cases tested
- [ ] CI runs tests automatically

**Score Guide (Context-Dependent):**

**For Hobby Project:**
- **5**: Some tests, manual testing documented
- **3**: No tests, but examples work
- **1**: No tests, examples broken

**For Production Library:**
- **5**: Comprehensive tests, >80% coverage, CI
- **3**: Partial tests, key APIs covered
- **1**: No tests or failing tests

---

#### 5. Sustainability (Framework Section 5)

**Activity Metrics:**

```bash
# Commit activity
git log --since="6 months ago" --oneline | wc -l

# Contributors
git shortlog -sn --all

# Issue/PR velocity (requires GitHub CLI or API)
gh issue list --state all --limit 100
gh pr list --state all --limit 100
```

**Governance Indicators:**

- [ ] Clear ownership
- [ ] Versioning strategy (semver?)
- [ ] Release notes
- [ ] Roadmap or project board
- [ ] Response to issues/PRs

**Interpret in Context:**

- Low activity + "stable" label = Maintained ✅
- Low activity + no label + old issues = Abandoned ⚠️
- High activity + slow PR merges = Bottleneck ⚠️

**Score Guide:**

- **5**: Healthy activity, clear governance, responsive
- **4**: Active but with some bottlenecks
- **3**: Stable maintenance mode (acceptable for mature projects)
- **2**: Declining activity, unresponsive
- **1**: Abandoned

---

#### 6. Security (Framework Section 6)

**Risk Assessment:**

```bash
# Check for secrets
git log -p | grep -i "password\|api_key\|secret"

# Dependency vulnerabilities
npm audit               # Node.js
pip-audit              # Python
cargo audit            # Rust

# Code scanning (if available)
gh api repos/{owner}/{repo}/code-scanning/alerts
```

**Checklist:**

- [ ] No secrets in history
- [ ] Dependencies up-to-date
- [ ] Input validation present
- [ ] Security policy (SECURITY.md)
- [ ] Dependabot enabled

**Compliance (if applicable):**

- For healthcare: HIPAA considerations
- For EU users: GDPR compliance
- For finance: PCI-DSS standards

**Score Guide:**

- **5**: Proactive security, automated scanning
- **4**: Secure defaults, some automation
- **3**: Adequate, no critical vulnerabilities
- **2**: Known vulnerabilities, poor practices
- **1**: Critical security issues

---

#### 7. Accessibility (Framework Section 7)

**For UI Projects:**

```bash
# Check for ARIA attributes
grep -r "aria-" src/

# Check for accessibility tools
grep -r "a11y\|axe\|wcag" .
```

**Checklist:**

- [ ] Keyboard navigation works
- [ ] ARIA attributes present
- [ ] Color contrast sufficient
- [ ] Screen reader tested
- [ ] Internationalization support

**For Non-UI Projects:**

- [ ] Low barriers to contribution
- [ ] Platform support clear
- [ ] Code of Conduct (if community project)

**Score Guide:**

- **5**: WCAG AAA compliance (for UI)
- **4**: WCAG AA compliance
- **3**: Basic accessibility, keyboard nav
- **2**: Significant barriers
- **1**: Inaccessible

---

#### 8. Ecosystem Integration (Framework Section 8)

**Evaluate:**

- [ ] Follows language conventions (e.g., npm for Node, PyPI for Python)
- [ ] Uses standard formats (JSON, YAML, not custom)
- [ ] Interoperates with common tools
- [ ] Plugin/extension architecture (if appropriate)
- [ ] Dependency management reasonable

**Score Guide:**

- **5**: Seamlessly integrates, extensible
- **4**: Standard practices followed
- **3**: Works but with friction
- **2**: Non-standard, hard to integrate
- **1**: Isolated, incompatible

---

### Phase 4: Synthesis (30-60 minutes)

**Objective:** Draw conclusions and recommendations.

**Steps:**

1. **Calculate overall score**: Average of all criteria (weighted if needed)
2. **Identify patterns**: Do weaknesses cluster? Are strengths aligned?
3. **List strengths**: What should be celebrated?
4. **List concerns**: What needs improvement?
5. **Neutral observations**: What's context-dependent?
6. **Value proposition**: What's unique here?
7. **Use cases**: When to use/avoid this?
8. **Recommendations**: Prioritize improvements

**Recommendation Formula:**

- **Adopt**: Scores mostly 4-5, no critical concerns, clear value
- **Adopt with caveats**: Good scores, but specific limitations to know
- **Wait**: Promising but immature, watch for updates
- **Avoid**: Critical flaws, better alternatives exist

---

### Phase 5: Bias Check (15 minutes)

**Critical Step:** Before publishing, verify you haven't:

- [ ] Applied wrong standards (e.g., enterprise to hobby)
- [ ] Penalized unfamiliar patterns (different ≠ bad)
- [ ] Assumed inactivity = abandonment
- [ ] Ignored domain-specific norms
- [ ] Conflated "not to my taste" with "low quality"

**Self-Reflection Questions:**

1. Did I research domain-specific standards?
2. Did I consider resource constraints?
3. Did I evaluate against stated purpose?
4. Would I score a similar project in a different language the same?

---

## Interpreting Scores

### The 1-5 Scale (Context-Relative)

**5 - Exceptional**: Sets the standard for this type of project
**4 - Strong**: Above average, minor improvements possible
**3 - Adequate**: Meets expectations for context
**2 - Weak**: Below expectations, significant gaps
**1 - Poor**: Critical deficiencies

### Overall Score Interpretation

**4.5-5.0**: Exemplary, highly recommended
**3.5-4.4**: Strong project, safe to adopt
**2.5-3.4**: Adequate, evaluate trade-offs
**1.5-2.4**: Weak, adopt with caution
**<1.5**: Poor, avoid or contribute to fix

### Score Weighting (Optional)

For some contexts, weight criteria differently:

**Security-Critical Project:**
- Security: 30%
- Testing: 25%
- Code Quality: 20%
- Documentation: 15%
- Other: 10%

**Educational Project:**
- Fitness for Purpose: 25%
- Documentation: 25%
- Accessibility: 20%
- Code Quality: 15%
- Other: 15%

---

## Common Pitfalls

### Pitfall 1: Ignoring Context

**Problem:** Judging a weekend hobby project by enterprise standards.

**Example:** "This CLI tool lacks integration tests and a staging environment. Score: 2/5."

**Fix:** Adjust expectations. Hobby projects may not need staging. Score against "hobby CLI" standards, not "production SaaS."

---

### Pitfall 2: Confusing Different with Bad

**Problem:** Penalizing unfamiliar architectural choices.

**Example:** "This project uses Redux instead of Context API. Outdated. Score: 2/5."

**Fix:** Research if the choice is intentional and justified. Redux may be appropriate for complex state management.

---

### Pitfall 3: Recency Bias

**Problem:** Assuming low recent activity means abandonment.

**Example:** "Only 3 commits in 6 months. Score: 1/5 sustainability."

**Fix:** Check if the project is stable/complete. A finished library may not need frequent updates.

---

### Pitfall 4: Missing Domain Norms

**Problem:** Applying general software engineering rules without domain knowledge.

**Example:** "This research notebook lacks tests. Score: 1/5 testing."

**Fix:** Research code in notebooks is often exploratory. Reproducibility scripts matter more than unit tests.

---

### Pitfall 5: Overweighting Tooling

**Problem:** Focusing on CI badges and tooling over actual quality.

**Example:** "Has 5 CI badges! Score: 5/5 sustainability."

**Fix:** Badges indicate process, not quality. Read the actual code and docs.

---

## Domain-Specific Guidance

### Web Applications

**Key Criteria:**

- Accessibility (WCAG compliance)
- Security (XSS, CSRF protection)
- Performance (bundle size, load time)
- Browser compatibility

**Tools:**

- Lighthouse audit
- axe DevTools
- BundlePhobia
- WebPageTest

---

### Libraries/Frameworks

**Key Criteria:**

- API design (intuitive, composable)
- Documentation (API reference, examples)
- Testing (public API coverage)
- Versioning (semantic versioning)

**Red Flags:**

- Breaking changes in minor versions
- Undocumented APIs
- No migration guides

---

### Research/Academic

**Key Criteria:**

- Reproducibility (exact versions, seeds, data)
- Methodology (cited, peer-reviewed)
- Artifacts (data, models available)
- Transparency (limitations acknowledged)

**Tools:**

- Check for DOI, Zenodo archive
- Verify citations
- Test reproduction steps

---

### Infrastructure/DevOps

**Key Criteria:**

- Idempotency (can run multiple times safely)
- State management (declarative, version-controlled)
- Rollback capability
- Monitoring/observability

**Red Flags:**

- Imperative scripts without state tracking
- No rollback plan
- Hardcoded credentials

---

## Example Audits

### Example 1: Production Web App

**Context:**
- Domain: Application (E-commerce)
- Maturity: Stable
- Criticality: Production

**Scores:**
- Fitness: 5 (fully functional store)
- Code Quality: 4 (some tech debt)
- Documentation: 5 (deployment guides excellent)
- Testing: 5 (E2E tests, 85% coverage)
- Sustainability: 3 (small team, bus factor 2)
- Security: 5 (PCI-DSS compliant)

**Recommendation:** Adopt (4.5/5 overall)

---

### Example 2: Research Prototype

**Context:**
- Domain: Research/Academic (ML)
- Maturity: Prototype
- Criticality: Hobby

**Scores:**
- Fitness: 4 (reproduces paper results)
- Code Quality: 2 (exploratory notebooks)
- Documentation: 4 (methods clearly cited)
- Testing: 2 (validation scripts only)
- Sustainability: 2 (single author, no updates)
- Security: 3 (no PII, basic practices)

**Recommendation:** Adopt with caveats (2.8/5 overall, but appropriate for research)

**Key:** Scores are low but acceptable for context. Don't use in production.

---

## Automation Tools

### Useful Scripts

#### 1. Quick Stats

```bash
#!/bin/bash
# quick-audit-stats.sh

echo "=== Repository Quick Stats ==="
echo "Total commits: $(git log --oneline | wc -l)"
echo "Contributors: $(git shortlog -sn --all | wc -l)"
echo "Last commit: $(git log -1 --format=%cd)"
echo "Recent activity (30d): $(git log --since='30 days ago' --oneline | wc -l) commits"
echo "Test files: $(find . -name '*.test.*' -o -name '*_test.*' | wc -l)"
echo "Documentation files: $(find . -name '*.md' | wc -l)"
```

#### 2. Security Check

```bash
#!/bin/bash
# security-check.sh

echo "=== Security Audit ==="

# Check for common secrets patterns
echo "Checking for secrets..."
git log -p | grep -i "password\|api_key\|secret\|token" | head -5

# Dependency audit (Node.js example)
if [ -f "package.json" ]; then
    echo "Running npm audit..."
    npm audit --json
fi

# Check for security policy
if [ -f "SECURITY.md" ]; then
    echo "✓ SECURITY.md exists"
else
    echo "✗ No SECURITY.md"
fi
```

#### 3. Documentation Coverage

```bash
#!/bin/bash
# doc-coverage.sh

echo "=== Documentation Coverage ==="

checks=(
    "README.md"
    "CONTRIBUTING.md"
    "LICENSE"
    "CHANGELOG.md"
    "docs/"
)

for item in "${checks[@]}"; do
    if [ -e "$item" ]; then
        echo "✓ $item exists"
    else
        echo "✗ $item missing"
    fi
done
```

### Recommended Tools by Language

**JavaScript/TypeScript:**
- `npm audit` - Security vulnerabilities
- `eslint` - Code quality
- `jest --coverage` - Test coverage
- `lighthouse` - Web performance

**Python:**
- `pip-audit` - Security vulnerabilities
- `pylint` / `flake8` - Code quality
- `pytest --cov` - Test coverage
- `radon` - Complexity metrics

**Go:**
- `govulncheck` - Security vulnerabilities
- `golangci-lint` - Code quality
- `go test -cover` - Test coverage

**Rust:**
- `cargo audit` - Security vulnerabilities
- `clippy` - Code quality
- `cargo tarpaulin` - Test coverage

---

## Getting Help

### Questions?

- Check the main [AUDIT_FRAMEWORK.md](audit/AUDIT_FRAMEWORK.md) for detailed criteria
- Review the [AUDIT_TEMPLATE.md](audit/AUDIT_TEMPLATE.md) for structure
- Look at [AUDIT_REPORT.md](audit/AUDIT_REPORT.md) for a complete example

### Contributing

Found issues with the framework? Have suggestions?

1. Open an issue describing the problem
2. Propose changes via pull request
3. Share your audit experiences

---

## Changelog

### v1.0 (December 20, 2025)
- Initial release
- Comprehensive 8-criterion framework
- Domain-specific guidance
- Automation scripts
- Example audits

---

**Framework maintained by:** Louis Rosche
**License:** MIT
