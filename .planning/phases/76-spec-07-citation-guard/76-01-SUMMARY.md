---
phase: 76-spec-07-citation-guard
plan: 01
subsystem: documentation
tags: [spec, citation-guard, corpus-scanner, allowlist, behavioral-contract]

# Dependency graph
requires:
  - phase: 72-spec-08-test-infrastructure
    provides: SPEC-08 test infrastructure spec (Depends on edge SPEC-08 -> SPEC-07 preserved)
provides:
  - ".planning/spec/07-citation-guard/SPEC.md — complete behavioral-contract spec for citation-cleanup guard (Status: Ready)"
  - "07-INV-1 through 07-INV-5 — five EARS invariants for detection, two-tier allowlist, exclusion state machines, SCAN_DIRS scope"
  - ".planning/spec/INDEX.md SPEC-07 row — Status advanced Draft -> Ready"
affects:
  - 77-spec-review (cross-spec consistency review reads SPEC-07 Acceptance Tests table and traceability)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shape-normative advisory marking: enumerations marked 'current as of 2026-06-12'; normative claim is the shape, not literal values"
    - "Corpus-oracle-as-indirect-coverage: INV-3/INV-5 cite corpus describe block 'corpus scan — no issue citations' as functional oracle with no [MISSING] rows"
    - "Two-tier allowlist semantics: PLACEHOLDER_DIGITS (global) vs FILE_ALLOWLIST (per-file with test-backing clause) distinguished as separate invariants by scope of exemption"

key-files:
  created: []
  modified:
    - ".planning/spec/07-citation-guard/SPEC.md"
    - ".planning/spec/INDEX.md"

key-decisions:
  - "FILE_ALLOWLIST test-backing requirement (D-03): every FILE_ALLOWLIST entry must be backed by a sibling test requiring the cited digit's continued presence"
  - "Hex-color deliberate-false-positive tradeoff (D-04): inline regex hex lookbehind removed (260610-gku); false negatives worse than false positives"
  - "Two-tier-allowlist refactor settled (D-05): PLACEHOLDER_DIGITS (global) and FILE_ALLOWLIST (per-file) are different in kind; cannot collapse to single flat list"
  - "INV-5 stays standalone per RESEARCH Open-Question-1: scope constraint stated as its own claim, not embedded in detection invariant"
  - "07-INV-3 and 07-INV-5 oracle is corpus describe block, not a [MISSING] row: FILE_ALLOWLIST entries and SCAN_DIRS scope must be correct or corpus pass fails RED"

patterns-established:
  - "Five-invariant role-based decomposition: detection, global-tier, per-file-tier, exclusion-state-machines, scope — each a single falsifiable claim"
  - "Key Decision vs Invariant split: hex-policy is a settled decision + Out-of-scope bullet, NOT an invariant (deliberate non-behavior)"

requirements-completed: [SPEC-07, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05]

# Metrics
duration: 4min
completed: 2026-06-12
---

# Phase 76 Plan 01: SPEC-07 Citation Guard Summary

**Behavioral-contract spec for the citation-cleanup corpus guard — five EARS invariants (07-INV-1..07-INV-5), full Acceptance Tests traceability table with verbatim subtests from `tests/no-issue-citations.test.cjs`, three settled Key Decisions (FILE_ALLOWLIST test-backing, hex-policy, two-tier-refactor), advisory Code Context, Status: Ready**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-12T06:18:09Z
- **Completed:** 2026-06-12T06:22:11Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Authored the full body of `.planning/spec/07-citation-guard/SPEC.md` — Purpose, Scope, five 07-INV-M invariants, Acceptance Tests traceability table, three Key Decisions, advisory Code Context — advancing Status from Draft to Ready
- Produced a move-proof behavioral contract: all enumerations (five SCAN_DIRS, PLACEHOLDER_DIGITS members, FILE_ALLOWLIST entries, both regexes) marked advisory "current as of 2026-06-12"; normative claims are shapes, not literal values
- Advanced INDEX.md SPEC-07 Feature-Status row from Draft to Ready with SPEC-08 Depends-On and dependency edge preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Normative core — Purpose, Scope, Invariants, Acceptance Tests** - `66a5b0ac` (docs)
2. **Task 2: Key Decisions + Code Context + Status Ready** - `01241608` (docs)
3. **Task 3: INDEX.md SPEC-07 row Draft -> Ready** - `bc95081b` (docs)

## Files Created/Modified

- `/home/thamw/development/remote-dev/get-shit-done-outdated/.planning/spec/07-citation-guard/SPEC.md` — Full behavioral-contract spec body authored; Status advanced to Ready
- `/home/thamw/development/remote-dev/get-shit-done-outdated/.planning/spec/INDEX.md` — SPEC-07 Feature-Status row Status cell flipped Draft -> Ready

## Decisions Made

- INV-5 (SCAN_DIRS scope) kept standalone per RESEARCH Open-Question-1 recommendation — a reader scanning invariants should see the scope constraint explicitly as its own claim
- 07-INV-3 and 07-INV-5 Acceptance Tests rows cite the corpus describe block `'corpus scan — no issue citations'` as the functional oracle — not `[MISSING]` rows, per RESEARCH Open-Question-2 (the FILE_ALLOWLIST entries and SCAN_DIRS scope must be correct or the corpus pass fails RED)
- Confidence set to High (all source verified by direct codebase read, no inference required)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. This is a documentation-only phase.

## Next Phase Readiness

- SPEC-07 is Ready and consistent with INDEX.md; Phase 77 (Cross-Spec Consistency Review) can read this spec
- The Acceptance Tests table contains verbatim subtest names from `tests/no-issue-citations.test.cjs` keyed on 07-INV-M — mechanically checkable at Phase 77 review
- All QUAL-01 through QUAL-05 bars satisfied (numbered falsifiable invariants, full traceability, advisory marking, tier-1 citation, three settled Key Decisions with do-not-reopen)

---
*Phase: 76-spec-07-citation-guard*
*Completed: 2026-06-12*
