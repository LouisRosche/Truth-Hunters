# Repository Audit Template

**Repository:** [Name/URL]
**Audit Date:** [Date]
**Auditor:** [Name/Organization]
**Framework Version:** Universal GitHub Repository Audit Framework v1.0

---

## STEP 1: CONTEXT CLASSIFICATION

### Project Typology

| Dimension | Classification | Notes |
|-----------|----------------|-------|
| **Domain** | [ ] Library<br>[ ] Framework<br>[ ] Application<br>[ ] Tool/CLI<br>[ ] Research/Academic<br>[ ] Data/ML<br>[ ] Infrastructure<br>[ ] Embedded<br>[ ] Game<br>[ ] Documentation<br>[ ] Curriculum<br>[ ] Other: _______ | |
| **Maturity** | [ ] Prototype<br>[ ] Alpha<br>[ ] Beta<br>[ ] Stable<br>[ ] Maintenance<br>[ ] Archived | |
| **Scale** | [ ] Personal<br>[ ] Team<br>[ ] Organization<br>[ ] Community<br>[ ] Enterprise | |
| **Paradigm** | [ ] OOP<br>[ ] Functional<br>[ ] Procedural<br>[ ] Declarative<br>[ ] Multi-paradigm<br>[ ] Domain-specific | |
| **Criticality** | [ ] Hobby<br>[ ] Production<br>[ ] Safety-critical<br>[ ] Regulated/Compliance | |

### Evaluation Baseline

**Standards this repository should be measured against:**

[Describe the appropriate standards based on the classification above. For example: "Production educational software for K-12 environments requiring accessibility, security, and pedagogical soundness."]

---

## STEP 2: INITIAL ASSESSMENT

### Repository Overview

- **Primary Language(s):**
- **License:**
- **Stars/Forks:**
- **Age:**
- **Contributors:**
- **Last Updated:**
- **CI/CD:** [ ] Yes [ ] No
- **Documentation:** [ ] README [ ] Wiki [ ] Docs folder [ ] API docs [ ] Other: _______

### Stated Purpose

**What does the README claim this repository does?**

---

## STEP 3: DETAILED EVALUATION

### 1. Fitness for Purpose

**Score (1-5):** _____

**Evidence:**

- [ ] Scope alignment: README claims match actual functionality
- [ ] Problem-solution fit: Appropriate approach for stated problem
- [ ] Completeness: Core features implemented
- [ ] Accuracy: (For data/research) Methodology sound and reproducible

**Findings:**

### 2. Code Quality

**Score (1-5):** _____

**Intrinsic Quality Checklist:**

- [ ] **Readability**: Consistent style, meaningful naming
- [ ] **Complexity**: Proportionate to problem domain
- [ ] **Modularity**: Appropriate abstraction level
- [ ] **Idiomaticity**: Follows language/framework conventions
- [ ] **Error Handling**: Appropriate to domain

**Domain-Specific Considerations:**

[Choose relevant domain from Section 2 of framework and evaluate specific criteria]

- [ ] Criterion 1:
- [ ] Criterion 2:
- [ ] Criterion 3:

**Findings:**

### 3. Documentation Adequacy

**Score (1-5):** _____

**Target Audience:** [End users | Contributors | Operators | Researchers | Students]

**Minimum Viable Documentation Checklist:**

- [ ] Installation instructions
- [ ] Basic usage examples
- [ ] Configuration options (if applicable)
- [ ] Development setup (if open to contributions)
- [ ] Architecture overview (for complex projects)
- [ ] Troubleshooting guide

**Quality Signals:**

- [ ] Time-to-first-success is reasonable
- [ ] Documentation is current (updated with code changes)
- [ ] Reading level appropriate to audience
- [ ] Examples cover common use cases

**Findings:**

### 4. Testing & Verification

**Score (1-5):** _____

**Context-Appropriate Standards:**

[Based on project type, what testing is expected?]

**Testing Checklist:**

- [ ] Tests exist and pass on main branch
- [ ] Tests cover documented behavior
- [ ] Failure modes tested, not just happy paths
- [ ] Tests are isolated (no order dependencies)
- [ ] CI runs tests automatically
- [ ] Coverage reporting configured (if appropriate)

**Test Statistics:**

- **Test Files:**
- **Coverage:**
- **Last Test Run:**

**Findings:**

### 5. Sustainability & Health

**Score (1-5):** _____

**Activity Metrics:**

- **Commit Frequency:**
- **Recent Commits:** (last 30 days)
- **Open Issues:**
- **Closed Issues:**
- **Open PRs:**
- **Merged PRs:** (last 30 days)
- **Contributor Count:**
- **Bus Factor:**

**Governance:**

- [ ] Decision-making process documented
- [ ] Clear ownership/contact information
- [ ] Versioning strategy documented
- [ ] Dependency updates regular

**Findings:**

### 6. Security & Risk

**Score (1-5):** _____

**Risk Assessment:**

- [ ] **Secrets Exposure**: No credentials in history
- [ ] **Dependency Vulnerabilities**: Dependencies up-to-date
- [ ] **Input Validation**: Appropriate to attack surface
- [ ] **Supply Chain**: Provenance clear, reproducible builds
- [ ] **Data Handling**: PII/sensitive data handled appropriately

**Compliance (if applicable):**

- [ ] License compatible with intended use
- [ ] Regulatory requirements met (HIPAA, GDPR, etc.)
- [ ] Industry-specific standards addressed

**Security Tools Used:**

- [ ] Dependabot/Renovate
- [ ] Code scanning (e.g., CodeQL)
- [ ] Secret scanning
- [ ] Security policy (SECURITY.md)

**Findings:**

### 7. Accessibility & Inclusivity

**Score (1-5):** _____

**Checklist:**

- [ ] **Onboarding**: Low barriers to entry
- [ ] **Internationalization**: Language/locale support (if user-facing)
- [ ] **Accessibility**: WCAG compliance (for UI components)
- [ ] **Community Conduct**: Code of Conduct exists (if accepting contributions)
- [ ] **Platform Support**: Reasonable coverage for target users

**Findings:**

### 8. Ecosystem Integration

**Score (1-5):** _____

**Checklist:**

- [ ] **Interoperability**: Standards compliance, API conventions
- [ ] **Extensibility**: Plugin architecture, customization options
- [ ] **Dependencies**: Appropriate philosophy (minimal vs. batteries-included)
- [ ] **Packaging**: Available through expected channels

**Findings:**

---

## STEP 4: SYNTHESIS

### Strengths

1.
2.
3.

### Concerns

1.
2.
3.

### Neutral Observations

1.
2.

### Overall Value Proposition

[What unique value does this repository provide?]

### Appropriate Use Cases

-
-

### Inappropriate Use Cases

-
-

### Adoption Recommendation

**[ ] Adopt | [ ] Adopt with caveats | [ ] Wait | [ ] Avoid**

**Rationale:**

---

## STEP 5: ACTIONABLE IMPROVEMENTS

| Priority | Item | Rationale | Effort |
|----------|------|-----------|--------|
| Critical |  |  | S/M/L |
| High |  |  | S/M/L |
| Medium |  |  | S/M/L |
| Low |  |  | S/M/L |

---

## STEP 6: BIAS CHECK

Before finalizing, verify you have not:

- [ ] Applied enterprise standards to hobby projects
- [ ] Applied web development norms to embedded/systems code
- [ ] Applied English-language documentation expectations universally
- [ ] Penalized legitimate architectural choices that differ from your preferences
- [ ] Conflated "unfamiliar" with "low quality"
- [ ] Assumed inactivity equals abandonment
- [ ] Applied production standards to research/prototype code
- [ ] Ignored domain-specific best practices in favor of general software engineering

---

## FINAL SCORES SUMMARY

| Criterion | Score (1-5) |
|-----------|-------------|
| Fitness for Purpose | |
| Code Quality | |
| Documentation | |
| Testing | |
| Sustainability | |
| Security | |
| Accessibility | |
| Ecosystem Integration | |
| **Overall** | |

**Overall Assessment:** [Summary statement]

---

## AUDIT METADATA

**Audit Methodology:**
- [ ] Codebase static analysis
- [ ] Git history analysis
- [ ] CI/CD configuration review
- [ ] Security configuration audit
- [ ] Documentation review
- [ ] Accessibility audit
- [ ] Testing infrastructure review
- [ ] Runtime testing performed

**Scope:**

**Limitations:**

**Time Spent:** _____ hours

---

**Auditor Signature:** _______________
**Date:** _______________
