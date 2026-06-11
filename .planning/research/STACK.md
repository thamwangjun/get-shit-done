# Stack Research: Spec Format and Tooling for Feature Reimplementation

**Domain:** Feature specification documents for AI-agent-guided reimplementation
**Researched:** 2026-06-11
**Confidence:** HIGH — findings cross-verified across Addy Osmani's 2025 AI spec guide, GitHub Spec Kit, the arXiv Spec-Driven Development paper (2602.00180), RFC 2119, and BDD/EARS industry standards.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Markdown | CommonMark | Per-feature spec file format | Human-readable, version-control native, renderable by all AI tools; the implementing agent reads it directly with no build step |
| RFC 2119 keyword vocabulary | N/A | Normative requirement levels (MUST/SHOULD/MAY) | Eliminates ambiguity between absolute invariants and preferred behaviors; directly actionable by an AI implementing agent |
| EARS notation | Alistair Mavin, 2009 | Unambiguous behavioral requirement phrasing | Five sentence patterns (Ubiquitous, Event-driven, State-driven, Unwanted-behavior, Optional-feature) that collapse to single, testable claims; adopted by GitHub Spec Kit and BMAD |
| Spec index file (`SPEC-INDEX.md`) | N/A | Registry of all per-feature specs with IDs and status | Gives the roadmapper and requirement agent a single entry point; enables traceability from spec ID to implementation task |

### Supporting Conventions

| Convention | Purpose | When to Use |
|------------|---------|-------------|
| `SPEC-XXX` identifier prefix per file | Stable cross-reference handle across spec, roadmap, and test files | Always — every feature spec gets a unique ID on creation |
| Behavior/invariant separation from implementation notes | Keeps the spec valid across refactors | Always — behavioral requirements go in the `## Invariants` section; implementation hints go in `## Implementation Notes` and are explicitly marked advisory |
| Traceability table (spec ID → acceptance test ID) | Closes the loop between spec and verification | Every spec file; list the test file and subtest name that verifies each MUST-level invariant |
| `<!-- advisory -->` HTML comment marker on implementation details | Machine-parseable signal that a section is non-normative | Use on any paragraph describing the current codebase's approach that may not survive the refactor |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `gsd-tools.cjs` CLI | Reading and writing `.planning/` state; linking spec IDs to roadmap phases | Existing project tool; no new installation needed |
| Git history / `git log --follow` | Recovering original implementation intent | Read-only reference; spec author uses it to verify behavior, but spec text itself does not cite commit SHAs |
| `npm test` (Node.js `--test` runner) | Running the acceptance tests that verify reimplementation | The test IDs in the traceability table point to subtests that must remain green after reimplementation |

---

## Recommended Document Format: Per-Feature Spec File

Each feature in `.planning/spec/` gets one Markdown file. The filename encodes the feature ID: `SPEC-NNN-feature-slug.md`. The sections below are the canonical template — rationale for each is provided immediately after the table.

### Section-by-Section Template

```markdown
# SPEC-NNN: [Feature Name]

**ID:** SPEC-NNN
**Status:** Draft | Ready | Implemented | Verified
**Confidence:** HIGH | MEDIUM | LOW
**Specced:** YYYY-MM-DD
**Reimplementation target:** [upstream version or milestone name this spec targets]

---

## Purpose

One paragraph. What problem does this feature solve and for whom? This is the "why" — the design rationale that an AI implementing agent needs to avoid optimizing for the wrong thing. Describe the user-observable outcome, not the mechanism.

---

## Scope

What is covered by this spec and what is explicitly out of scope. Use a two-item bulleted list:

**In scope:**
- [behavioral boundary A]
- [behavioral boundary B]

**Out of scope:**
- [adjacent concern intentionally excluded]

---

## Invariants

The normative behavioral contract. Use RFC 2119 MUST/SHOULD/MAY keywords. Each invariant is a single, testable claim in EARS notation where possible.

EARS patterns:
- Ubiquitous: `The [system] SHALL [action].`
- Event-driven: `WHEN [trigger] THE [system] SHALL [action].`
- State-driven: `WHILE [state] THE [system] SHALL [action].`
- Unwanted-behavior: `IF [condition] THEN THE [system] SHALL [response].`
- Optional-feature: `WHERE [feature included] THE [system] SHALL [action].`

Example structure:

**INV-1 (MUST):** WHEN [X happens], THE system SHALL [produce observable result Y].
**INV-2 (MUST):** The system MUST NOT [do Z under any condition].
**INV-3 (SHOULD):** WHERE [optional context], the system SHOULD [preferred behavior].
**INV-4 (MAY):** The system MAY [optional extension].

Write as many invariants as needed to fully specify behavior. Group by sub-concern if the feature has distinct sub-behaviors.

---

## Acceptance Tests

Map each MUST-level invariant to an existing test or a test that MUST exist after reimplementation.

| Invariant | Test File | Subtest Name / Description |
|-----------|-----------|---------------------------|
| INV-1 | `tests/example.test.cjs` | `'description of subtest'` |
| INV-2 | `tests/example.test.cjs` | `'description of subtest'` |

If no test exists yet for an invariant, write: `[MISSING — must be created during reimplementation]`.

---

## Key Decisions

Decisions already made that the reimplementer MUST honor, plus the rationale. Use the decision table format from PROJECT.md:

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [What was decided] | [Why — the constraint that drove the decision] | [Observable consequence] |

Decisions here are binding. They explain WHY the feature works the way it does, so the reimplementer does not unknowingly reverse them.

---

## Behavior vs. Current Implementation

**This section is advisory, not normative.** It describes how the feature is currently implemented in this fork. It exists to help the reimplementer understand the shape of the problem — not to dictate that the same code structure must be reproduced.

Current implementation locations (as of this spec):
- `[file path]` — [what it does, one line]
- `[file path]` — [what it does, one line]

Mark any detail that may not survive the upstream refactor with `<!-- advisory -->`.

Do NOT transcribe the implementation line-by-line. Do NOT include code blocks that reproduce the existing implementation in full. Do include short illustrative snippets only when they clarify an invariant that would otherwise be ambiguous.

---

## Edge Cases and Known Pitfalls

Conditions that caused bugs or required special handling in the original implementation. Each entry is a mini-pitfall the reimplementer needs to handle:

- **[Edge case name]:** [What condition triggers it] → [What the correct behavior is]
- **[Pitfall name]:** [What goes wrong without the guard] → [How to prevent it]

---

## Verification Checklist

After reimplementation, an implementing agent or developer verifies the feature by checking each item:

- [ ] All MUST-level invariants pass their acceptance tests (`npm test`)
- [ ] No MUST NOT invariants are violated (negative test cases pass)
- [ ] Key Decisions are honored (check each decision's observable consequence)
- [ ] Edge cases listed above are handled
- [ ] `npm test` passes with 0 regressions beyond any pre-existing failures

---

## References

- [Relevant PROJECT.md section or requirement ID that drove this feature]
- [Link to the original milestone roadmap if available]
- [Any external standard, RFC, or design pattern that the feature follows]
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| One Markdown file per feature | Single mega-spec document | An AI agent receives one feature spec per context window; one file per feature enables focused, clean context injection without irrelevant spec text |
| RFC 2119 keywords (MUST/SHOULD/MAY) | Prose requirements only | Prose is ambiguous about strength; MUST vs SHOULD maps directly to "test must pass" vs "preferred but flexible"; RFC 2119 is machine-parseable |
| EARS notation for invariant phrasing | Free-form behavioral sentences | EARS collapses to a single testable claim per sentence; free-form prose often encodes multiple claims or contains implicit scope |
| Traceability table linking invariants to test subtests | No traceability section | Without traceability, the implementing agent cannot confirm coverage; a separate verifier agent cannot check the spec against the test suite |
| Advisory/normative separation within Implementation Notes | Keeping current code paths normative | Current file paths and code structure will not survive the upstream refactor; marking them advisory prevents the reimplementer from being anchored to obsolete structure |
| `SPEC-NNN` ID prefix | No canonical ID | Cross-references in the roadmap, test files, and spec index all need a stable handle that survives file renames |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Transcribing the full current implementation | Anchors the reimplementer to obsolete structure; produces a migration diff guide, not a spec | Describe observable behavior in EARS invariants; add a brief advisory section with file locations only |
| Git commit SHAs as spec references | SHAs are meaningless after a rebase; the new upstream has a divergent history | Reference requirement IDs (e.g., `HOOK-01`) from PROJECT.md or milestone roadmap file names |
| PRD-style user-story format ("As a user I want...") alone | User-story format expresses goals, not behavioral contracts; an AI agent cannot derive test cases from it without additional precision | Combine purpose (one-para why) with EARS invariants (testable contract) |
| ADR format alone | ADRs record decisions already made, not behavioral requirements; they have no invariants or test contracts section | Use ADR-style Key Decisions section inside the per-feature spec as one section, not as the entire document |
| RFC/proposal format | RFCs solicit feedback on a proposed solution; the solution here is already implemented and the goal is to specify it for reimplementation | Use the per-feature spec template; it captures what IS, not what SHOULD BE debated |
| Vague language ("the system should handle errors gracefully") | Unverifiable; an AI agent cannot generate a passing test from it | Apply EARS: "IF an error condition occurs THEN THE system SHALL [specific observable response]" |

---

## Spec Index Convention

The `SPEC-INDEX.md` file at `.planning/spec/SPEC-INDEX.md` is the single entry point. It lists all per-feature specs in a table:

```markdown
# Fork Feature Spec Index

| ID | Feature | File | Status | Acceptance Tests |
|----|---------|------|--------|-----------------|
| SPEC-001 | Positive framing standard | SPEC-001-positive-framing.md | Ready | tests/negative-framing-scan.test.cjs |
| SPEC-002 | SHA-based versioning | SPEC-002-sha-versioning.md | Draft | tests/version-detection.test.cjs |
| ... | | | | |
```

The roadmapper reads this index to assign spec IDs to roadmap phases. Each phase in the roadmap references one or more `SPEC-NNN` IDs.

---

## Stack Patterns by Context

**When a feature has no existing acceptance test:**
- Write the invariants first (they are normative)
- Mark the Acceptance Tests table row `[MISSING — must be created during reimplementation]`
- Add a note in the Verification Checklist that the test must be created before the feature is considered verified
- Do NOT leave the Acceptance Tests section empty — its absence signals an unspecifiable feature

**When a feature is tightly coupled to upstream file layout:**
- Describe only the observable inputs and outputs in Invariants
- Confine all file-path details to the Implementation Notes section with `<!-- advisory -->` markers
- Invariants should be expressible in terms of behavior visible at a CLI or test boundary, not internal code paths

**When a feature involves multiple interacting components:**
- Write one spec per behavioral boundary, not one per code file
- The spec for "SHA-based versioning" covers the whole feature (install.js write, update worker check, statusline display, sentinel fallback) — it is one behavioral contract with multiple invariants, not four separate specs

**When a Key Decision was reversed or was controversial:**
- Include both the decision made AND the alternative that was rejected, with the rationale for rejection
- This prevents the reimplementer from "re-discovering" the alternative and making the same reversal mistake

---

## Sources

- [Addy Osmani — How to write a good spec for AI agents](https://addyosmani.com/blog/good-spec/) — six-element model, three-tier boundaries, verifiability conventions
- [arXiv 2602.00180 — Spec-Driven Development: From Code to Contract in the Age of AI Coding Assistants](https://arxiv.org/abs/2602.00180) — spec-anchored tier, four-phase artifact chain, EARS notation adoption
- [GitHub Spec Kit — spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) — task command artifact structure, constitution file, testability-first ordering constraint
- [RFC 2119 — Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119.html) — MUST/SHOULD/MAY normative vocabulary
- [Thoughtworks — Spec-Driven Development (2025)](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices) — "Assess" ring warning on heavy up-front specification antipattern
- [TDAD arXiv 2603.08806 — Test-Driven AI Agent Definition](https://arxiv.org/pdf/2603.08806) — specification as the single source of truth; behavioral completeness checklist
- [Automated Acceptance Tests and Requirements Traceability](https://www.softwaretestingmagazine.com/knowledge/automated-acceptance-tests-and-requirements-traceability/) — traceability relation between requirements, implementation, and acceptance tests
- [Gherkin BDD best practices — TestQuality](https://testquality.com/best-practices-for-writing-maintainers-gherkin-test-cases/) — scenario independence, implementation-decoupled feature files
- [Fix framework — Three Levels of Requirements Inspired by RFC 2119](https://fixrb.dev/framework/testing/2024/12/30/the-three-levels-of-requirements-inspired-by-rfc-2119.html) — applying RFC 2119 levels to test specifications

---
*Stack research for: feature specification format and tooling (v2.1.0-h)*
*Researched: 2026-06-11*
