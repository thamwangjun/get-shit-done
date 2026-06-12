# Phase 76: spec-07 Citation Guard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 76-spec-07-citation-guard
**Areas discussed:** Invariant decomposition, Two-tier allowlist semantics, FILE_ALLOWLIST test coupling, Hex-color / false-positive policy

---

## Invariant Decomposition

| Option | Description | Selected |
|--------|-------------|----------|
| 5 invariants, detection unified | INV-1 detection (inline+parenthetical+feat-form); INV-2 PLACEHOLDER tier; INV-3 FILE_ALLOWLIST tier; INV-4 exclusion state machines (D-09+D-10); INV-5 5-dir scope | ✓ |
| 6 invariants, detection split | Split inline/parenthetical from feat-form as separate invariants | |
| 4 invariants, exclusions folded | Fold frontmatter+code-fence exclusions into the detection invariant as clauses | |

**User's choice:** 5 invariants, detection unified (Recommended)
**Notes:** Detection unified because inline+parenthetical differ only by paren-context within one regex pass and share one corpus oracle. Exclusion state machines kept standalone (they have a dedicated unit describe block). ROADMAP pre-locks the two allowlist tiers as separate invariants.

---

## Two-tier Allowlist Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Scope-of-exemption as the axis | INV-2: PLACEHOLDER exempt everywhere; INV-3: FILE_ALLOWLIST exempt only in listed file, flagged elsewhere | ✓ |
| Purpose-of-citation as the axis | Frame by intent (illustrative vs functional cross-ref); scope as consequence | |
| Both axes, dual-clause invariants | Each invariant states both scope and purpose as separate MUST clauses | |

**User's choice:** Scope-of-exemption as the axis (Recommended)
**Notes:** Scope (global vs per-file) is the testable rule; purpose is the consequence. Dual-axis rejected as multi-claim (weakens QUAL-01 falsifiability). Member values are dated advisory; the rule is normative.

---

## FILE_ALLOWLIST Test Coupling

| Option | Description | Selected |
|--------|-------------|----------|
| Invariant clause + Key Decision | INV-3 clause: every entry MUST be backed by a sibling test; Key Decision records why | ✓ |
| Key Decision + Code Context only | State as policy + advisory list, not a normative invariant clause | |
| Code Context only | Narrate the 4 sibling tests advisorily with no normative weight | |

**User's choice:** Invariant clause + Key Decision (Recommended)
**Notes:** An unbacked allowlist entry is indistinguishable from an un-cleaned citation — making the test-backing a normative clause prevents silent permanent exemptions. Four backing tests confirmed present 2026-06-12.

---

## Hex-color / False-positive Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Key Decision + Out-of-scope bullet | Settled Key Decision (false-negatives worse than false-positives) + visible Out-of-scope bullet; no invariant | ✓ |
| Invariant + Key Decision | Add an invariant for hex-in-frontmatter/fence MUST NOT flag, plus the Key Decision | |
| Key Decision only | Record the tradeoff and nothing else | |

**User's choice:** Key Decision + Out-of-scope bullet (Recommended)
**Notes:** Hex tolerance is a deliberate non-behavior, so no invariant. The protected-context guarantee (hex in frontmatter/fence) is already covered by INV-4's exclusion state machines; the Out-of-scope bullet keeps the deliberate non-coverage visible.

---

## Claude's Discretion

- Exact EARS pattern per invariant (single falsifiable claim mapping to a subtest).
- Exact subtest/assertion-shape strings in the Acceptance Tests table (read from the test file).
- Whether INV-5 (five-directory scope) stays standalone or folds into the detection invariant.
- Whether to abbreviate SCAN_DIRS / allowlist enumerations to representative classes vs literal lists.
- Confidence value stamped in frontmatter when the body is finalized.

## Deferred Ideas

None — discussion stayed within phase scope. No remediation/normalizer tool exists to spec (the guard is detection-only by design).
