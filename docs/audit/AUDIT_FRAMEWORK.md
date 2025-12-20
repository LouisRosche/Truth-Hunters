# Universal GitHub Repository Audit Framework

**Version:** 1.0
**Last Updated:** December 20, 2024
**Purpose:** Context-aware quality assessment for GitHub repositories

---

## PREAMBLE: CONTEXT CALIBRATION

Before scoring, classify the repository:

### Project Typology

| Dimension | Options |
|-----------|---------|
| **Domain** | Library, Framework, Application, Tool/CLI, Research/Academic, Data/ML, Infrastructure, Embedded, Game, Documentation, Curriculum, Other |
| **Maturity** | Prototype, Alpha, Beta, Stable, Maintenance, Archived |
| **Scale** | Personal, Team, Organization, Community, Enterprise |
| **Paradigm** | OOP, Functional, Procedural, Declarative, Multi-paradigm, Domain-specific |
| **Criticality** | Hobby, Production, Safety-critical, Regulated/Compliance |

### Evaluation Calibration

All criteria below must be **weighted and interpreted relative to the classification above**. A research prototype has legitimately different standards than production infrastructure. Absence of a feature is not inherently negative—evaluate appropriateness to context.

---

## 1. FITNESS FOR STATED PURPOSE

> "Does this repository accomplish what it claims?"

- **Scope alignment**: README claims vs. actual functionality
- **Problem-solution fit**: Is this the right approach for the stated problem?
- **Completeness**: Core features implemented vs. documented roadmap
- **Accuracy**: For data/research repos—methodology soundness, reproducibility

---

## 2. CODE CHARACTERISTICS

Evaluate against **the repository's own conventions and domain standards**, not universal defaults.

### Intrinsic Quality

| Dimension | Adaptive Criteria |
|-----------|-------------------|
| Readability | Consistent style (per language/community norms), meaningful naming, cognitive load management |
| Complexity | Proportionate to problem domain; flag only *unjustified* complexity |
| Modularity | Appropriate abstraction level for project scale |
| Idiomaticity | Adherence to language/framework conventions (Pythonic, Rustic, idiomatic Go, etc.) |
| Error handling | Appropriate to domain (fail-fast vs. resilient vs. safety-critical patterns) |

### Domain-Specific Considerations

| Domain | Key Evaluation Criteria |
|--------|------------------------|
| **ML/Data** | Reproducibility, experiment tracking, data versioning, notebook quality, random seed management |
| **Embedded/Systems** | Memory safety, resource constraints, real-time guarantees, hardware abstraction |
| **Research/Academic** | Citation of methods, statistical validity, artifact availability, peer review status |
| **Infrastructure/DevOps** | Idempotency, state management, rollback capability, drift detection |
| **Security Tools** | Responsible disclosure alignment, no weaponization risk, ethical use guidelines |
| **Frontend/UI** | Accessibility, responsive design, performance budgets, browser compatibility |
| **Game Development** | Frame rate stability, asset management, platform targeting, input handling |
| **Curriculum/Educational** | Learning progression, prerequisite clarity, assessment alignment, pedagogical soundness |

---

## 3. DOCUMENTATION ADEQUACY

Assess **sufficiency for the target audience**, not checkbox completion.

### Audience-Specific Requirements

| Audience | Minimum Viable Documentation |
|----------|------------------------------|
| End users | Installation, basic usage, examples |
| Contributors | Development setup, architecture overview, contribution process |
| Operators | Deployment, configuration, troubleshooting |
| Researchers | Methodology, data provenance, reproduction steps |
| Students/Learners | Prerequisites, learning objectives, exercises |

### Signals of Quality

- Time-to-first-success for stated audience
- Currency (last update vs. code changes)
- Accessibility (reading level appropriate to audience, i18n if relevant)
- Example quality and coverage of common use cases

---

## 4. TESTING & VERIFICATION

**Calibrate expectations to project type and criticality.**

### Context-Appropriate Testing Standards

| Project Type | Reasonable Expectations |
|--------------|------------------------|
| Hobby/Prototype | Manual testing documented, example usage |
| Library/Framework | Unit tests for public API, CI on PRs |
| Production Application | Integration tests, coverage tracking, staging environment |
| Safety-critical Systems | Formal verification, mutation testing, compliance evidence |
| Research Code | Reproducibility scripts, validation against known results |
| Data Pipelines | Data validation, schema tests, idempotency verification |

### Universal Signals

- Tests exist and pass on current main branch
- Tests cover documented behavior
- Failure modes are tested, not just happy paths
- Test isolation (no order dependencies, no shared mutable state)

---

## 5. SUSTAINABILITY & HEALTH

Interpret through project intent—a "finished" tool has different health signals than active development.

### Activity Patterns

| Indicator | Contextual Interpretation |
|-----------|--------------------------|
| Commit frequency | Active development vs. stable maintenance vs. abandonment |
| Issue response time | Appropriate to project's stated support model |
| PR merge velocity | Bottlenecks vs. careful review vs. inactive maintenance |
| Contributor distribution | Bus factor concerns only if project claims ongoing maintenance |
| Dependency updates | Security updates applied; feature updates per project policy |

### Governance Clarity

- Decision-making process documented (or implicit for solo projects)
- Succession/archival plan for critical dependencies
- Clear ownership and contact information
- Versioning and release strategy appropriate to audience

---

## 6. SECURITY & RISK

**Evaluate risk proportionate to deployment context and data sensitivity.**

### Risk Assessment Matrix

| Risk Factor | Assessment Method |
|-------------|-------------------|
| Secrets exposure | Scan history, not just current state |
| Dependency vulnerabilities | Severity-weighted, exploitability context |
| Input validation | Relevant to attack surface |
| Supply chain integrity | Provenance, reproducible builds (where applicable) |
| Data handling | PII exposure, encryption at rest/transit |

### Compliance Considerations (only if applicable)

- License compatibility with stated use cases
- Regulatory alignment (HIPAA, GDPR, SOC2, export controls) if domain-relevant
- Industry-specific standards (PCI-DSS, FERPA, etc.)

---

## 7. ACCESSIBILITY & INCLUSIVITY

- **Onboarding friction**: Barriers to entry for legitimate users
- **Internationalization**: If user-facing, language/locale support
- **Accessibility**: For UI components, WCAG alignment
- **Community conduct**: CoC existence and enforcement proportionate to community size
- **Platform support**: Reasonable coverage for target user base

---

## 8. ECOSYSTEM INTEGRATION

- **Interoperability**: Standards compliance, API conventions, data format choices
- **Extensibility**: Plugin architecture, hook points, customization options
- **Dependency philosophy**: Minimal vs. batteries-included (appropriate to domain)
- **Packaging/Distribution**: Available through expected channels for the ecosystem

---

## OUTPUT TEMPLATE

### Context Classification

```
Domain:        [classification]
Maturity:      [classification]
Scale:         [classification]
Paradigm:      [classification]
Criticality:   [classification]

Evaluation Baseline: [Standards this repo should be measured against]
```

### Assessment Scores (1-5, relative to context)

```
Fitness for Purpose:  [score] - [brief justification]
Code Quality:         [score] - [brief justification]
Documentation:        [score] - [brief justification]
Testing:              [score] - [brief justification]
Sustainability:       [score] - [brief justification]
Security:             [score] - [brief justification]
```

### Detailed Findings

**Strengths**
- [Evidence-based strength 1]
- [Evidence-based strength 2]
- [Evidence-based strength 3]

**Concerns**
- [Evidence-based concern 1 with specific reference]
- [Evidence-based concern 2 with specific reference]

**Neutral Observations**
- [Context-dependent observations that are neither positive nor negative]

### Synthesis

**Overall Value Proposition**
[What unique value does this provide?]

**Appropriate Use Cases**
- [Use case 1]
- [Use case 2]

**Inappropriate Use Cases**
- [Anti-pattern 1]
- [Anti-pattern 2]

**Adoption Recommendation**
[Adopt | Adopt with caveats | Wait | Avoid] — [Rationale]

### Actionable Improvements

| Priority | Item | Rationale | Effort |
|----------|------|-----------|--------|
| Critical | [item] | [why] | [S/M/L] |
| High | [item] | [why] | [S/M/L] |
| Medium | [item] | [why] | [S/M/L] |
| Low | [item] | [why] | [S/M/L] |

---

## META-GUIDELINES FOR AUDITORS

### Core Principles

1. **No universal thresholds**: "80% coverage" or "cyclomatic complexity <10" are heuristics, not laws. Justify any numeric standards used with domain context.

2. **Absence ≠ deficiency**: Missing CI, missing tests, missing docs may be appropriate for context. Evaluate fit, not completeness.

3. **Community norms vary**: Rust expects different things than JavaScript. Scientific Python differs from web Python. Research code differs from production code.

4. **Intent matters**: A pedagogical repository has different goals than a production library. Audit against stated purpose.

5. **Avoid recency bias**: Inactivity may indicate stability, not abandonment. Check for context clues before judging.

6. **Consider ecosystem position**: A foundational library has different responsibilities than a leaf application.

7. **Evaluate trajectory**: Is the project improving, stable, or declining? Recent changes matter.

8. **Respect resource constraints**: Solo maintainers and volunteer projects have different capacity than funded teams.

### Bias Checklist

Before finalizing audit, verify you have not:

- [ ] Applied enterprise standards to hobby projects
- [ ] Applied web development norms to embedded/systems code
- [ ] Applied English-language documentation expectations universally
- [ ] Penalized legitimate architectural choices that differ from your preferences
- [ ] Conflated "unfamiliar" with "low quality"
- [ ] Assumed inactivity equals abandonment
- [ ] Applied production standards to research/prototype code
- [ ] Ignored domain-specific best practices in favor of general software engineering

---

## REFERENCES

This framework draws from:

- DORA State of DevOps metrics (deployment frequency, lead time, MTTR, change failure rate)
- IEEE/ACM software engineering standards
- GitHub Octoverse maintainability research
- Domain-specific standards bodies (MISRA for embedded, FAIR for research data, WCAG for accessibility)
- Open Source Initiative governance best practices
- CHAOSS community health metrics

---

## VERSION HISTORY

### v1.0 (December 20, 2025)
- Initial release
- Comprehensive domain-specific evaluation criteria
- Context-aware scoring methodology
- Meta-guidelines for bias avoidance
