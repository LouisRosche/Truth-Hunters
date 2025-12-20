# Audit Tools

Automation scripts to assist with repository auditing using the [Universal GitHub Repository Audit Framework](../AUDIT_FRAMEWORK.md).

## Available Scripts

### 1. quick-stats.sh

Generates quick statistics about a repository for initial assessment.

**Usage:**
```bash
./quick-stats.sh [path-to-repo]
```

**What it checks:**
- Git metrics (commits, contributors, activity)
- File statistics (tests, documentation, source files)
- Lines of code
- Key files (README, LICENSE, etc.)
- CI/CD configuration
- Dependency management systems

**Example output:**
```
📊 Git Metrics:
  Total commits:        93
  Contributors:         2
  Last commit:          51 minutes ago
  Recent activity (30d): 45 commits

📁 File Statistics:
  Test files:           12
  Documentation files:  7
  Source files (approx): 56
```

---

### 2. security-check.sh

Performs basic security checks on a repository.

**Usage:**
```bash
./security-check.sh [path-to-repo]
```

**What it checks:**
- Secrets in git history
- Environment files (.env)
- .gitignore configuration
- SECURITY.md existence
- Dependency vulnerabilities (npm, pip, cargo, go)
- Hardcoded IPs/URLs
- Insecure code patterns (eval, exec, SQL concatenation)

**Example output:**
```
🔒 Checking for potential secrets in git history...
  ✓ No obvious secrets found in git history

📦 Dependency Security:
  Running npm audit...
  Vulnerabilities: 0 total (0 critical, 0 high)
```

---

### 3. doc-coverage.sh

Evaluates documentation coverage and quality.

**Usage:**
```bash
./doc-coverage.sh [path-to-repo]
```

**What it checks:**
- Essential documentation files
- Documentation structure
- README quality (sections, examples, badges)
- Inline code documentation
- API documentation
- Documentation score (0-100%)

**Example output:**
```
📚 Essential Documentation:
  ✓ README.md (283 lines) - Describes project purpose
  ✓ LICENSE (21 lines) - Legal terms
  ✓ CONTRIBUTING.md (349 lines) - Guide for contributors

📊 Documentation Score:
  Score: 9/10 (90%)
  ✓ Excellent documentation coverage
```

---

## Installation

**Make scripts executable:**
```bash
chmod +x audit-tools/*.sh
```

**Optional dependencies:**

For enhanced functionality, install:

```bash
# Lines of code counter
npm install -g cloc

# Node.js security
npm install -g npm-audit

# Python security
pip install pip-audit

# Rust security
cargo install cargo-audit

# Go security
go install golang.org/x/vuln/cmd/govulncheck@latest

# JSON processor (for npm audit)
apt-get install jq  # or: brew install jq
```

---

## Complete Audit Workflow

**1. Clone and enter repository:**
```bash
git clone <repo-url>
cd <repo-name>
```

**2. Run all audit scripts:**
```bash
# Quick overview
/path/to/audit-tools/quick-stats.sh .

# Security check
/path/to/audit-tools/security-check.sh .

# Documentation coverage
/path/to/audit-tools/doc-coverage.sh .
```

**3. Manual review:**
- Review code quality manually
- Test functionality
- Evaluate against domain-specific criteria

**4. Use the template:**
- Copy [AUDIT_TEMPLATE.md](../AUDIT_TEMPLATE.md)
- Fill in findings from scripts + manual review
- Score using framework criteria

**5. Generate report:**
- Complete the synthesis section
- Create actionable recommendations
- Perform bias check

---

## Integration with CI/CD

You can run these scripts in your CI pipeline:

**GitHub Actions example:**

```yaml
name: Repository Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run audit scripts
        run: |
          chmod +x audit-tools/*.sh
          ./audit-tools/quick-stats.sh
          ./audit-tools/security-check.sh
          ./audit-tools/doc-coverage.sh

      - name: Upload audit results
        uses: actions/upload-artifact@v3
        with:
          name: audit-results
          path: audit-*.txt
```

---

## Customization

Feel free to modify these scripts for your needs:

**Add custom checks:**
```bash
# In security-check.sh, add custom pattern detection
if grep -rE 'YOUR_PATTERN' . ; then
    echo "  ⚠️  Found custom security concern"
fi
```

**Adjust thresholds:**
```bash
# In doc-coverage.sh, change scoring weights
[ -f "README.md" ] && ((score+=5))  # Increase README importance
```

**Add language-specific checks:**
```bash
# In quick-stats.sh, add Ruby/PHP/etc. checks
if [ -f "Gemfile" ]; then
    echo "  ✓ Bundler (Ruby)"
fi
```

---

## Limitations

These scripts provide **automated checks only**. They cannot replace:

- Manual code review for quality and architecture
- Domain-specific expertise
- Understanding of project context
- Human judgment on trade-offs

**Always combine automated checks with manual review.**

---

## Contributing

Found a bug or want to add a check?

1. Fork the repository
2. Modify the scripts
3. Test on multiple repositories
4. Submit a pull request with description

---

## License

These scripts are part of the Universal GitHub Repository Audit Framework and are licensed under the MIT License.

---

## See Also

- [Audit Framework](../AUDIT_FRAMEWORK.md) - Complete evaluation criteria
- [Audit Template](../AUDIT_TEMPLATE.md) - Template for conducting audits
- [Usage Guide](../docs/AUDIT_FRAMEWORK_GUIDE.md) - Step-by-step instructions
- [Example Audit](../AUDIT_REPORT.md) - See the framework in action
