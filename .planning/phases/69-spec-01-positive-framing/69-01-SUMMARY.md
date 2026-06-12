---
phase: 69-spec-01-positive-framing
plan: 01
subsystem: spec
tags: [spec, positive-framing, documentation, scanner]
dependency_graph:
  requires: [spec/00-CONVENTIONS.md, tests/negative-framing-scan.test.cjs]
  provides: [spec/01-positive-framing/SPEC.md (Status: Ready)]
  affects: [.planning/spec/INDEX.md (SPEC-01 row), Phase 77 cross-spec review]
tech_stack:
  added: []
  patterns: [block-header frontmatter, EARS invariants, NN-INV-M ID scheme, advisory marking]
key_files:
  modified:
    - .planning/spec/01-positive-framing/SPEC.md
decisions:
  - "D-02 shape-normative: branch enumeration marked 'current as of 2026-06-12'; detection SHAPE is the contract, not the count"
  - "D-05 affirmative-rewrite rule documented in Purpose + Key Decisions, NOT as a MUST invariant (no tier-1 test for rewriting)"
  - "01-INV-4 split from 01-INV-5: Scan scope (directories) and code-fence exclusion are separate falsifiable invariants"
metrics:
  duration: 2m
  completed: 2026-06-12
  tasks: 2
  files: 1
---

# Phase 69 Plan 01: spec-01-positive-framing Summary

Behavioral-contract spec for the negative-framing corpus scanner — five EARS invariants with full traceability to `tests/negative-framing-scan.test.cjs`, Status advanced Draft -> Ready.

## What Was Built

Authored the full body of `.planning/spec/01-positive-framing/SPEC.md`, filling the Phase 68
stub (frontmatter + empty 7-section skeleton) with:

- **Purpose**: affirmative-framing standard rationale, tier-1 test citation, consequence of
  absence (non-conforming negative directives ship unflagged).
- **Scope**: in-scope (scanner detection behavior, two-tier severity, exception classes, code-fence
  exclusion, rewrite rule as authoring standard) and out-of-scope (rewrite ACT, non-.md files,
  runtime edits, tier-4 guides).
- **Invariants** (five, `01-INV-1`..`01-INV-5`): Detection (Event-driven MUST), Two-tier severity
  (Unwanted-behavior MUST / SHALL NOT), Exception suppression (Unwanted-behavior MUST NOT), Scan
  scope (Ubiquitous MUST), Code-fence exclusion (Ubiquitous MUST NOT). Branch enumeration in
  01-INV-1 is advisory, marked `current as of 2026-06-12` per D-02.
- **Acceptance Tests**: 29-row traceability table keyed on `01-INV-M`, all citing
  `tests/negative-framing-scan.test.cjs` with verbatim subtest names lifted from RESEARCH.md §6.
- **Key Decisions**: three settled decisions (two-tier severity / warn-only membership, affirmative-
  rewrite replacement rule, shape-normative-not-count), each with rationale and "Settled — do not
  reopen. Consequence of reopening: …".
- **Code Context**: `<!-- advisory -->` section listing scanner function, SCAN_DIRS, file collector,
  and all seven exception predicate names with advisory line ranges.
- **Frontmatter**: Status advanced `Draft -> Ready`; Confidence set to `High`; Specced set to
  `2026-06-12`.

## Verification Results

All plan-level verification checks passed:

- `01-INV-` count: 35 occurrences (>= 5 required).
- Section headers: 6 exact matches, locked order per 00-CONVENTIONS.md §1.
- `**Status:** Ready` and `**Specced:** 2026-06-12` present.
- All 9 block-set tokens + 3 warn-only tokens named in spec body — no MISSING TOKEN.
- Acceptance Tests table cites `tests/negative-framing-scan.test.cjs`; `'flags bare NEVER directive'` present.
- `current as of 2026-06-12` marker present on branch enumeration.
- Zero `to be filled` placeholders remaining.
- No `[MISSING — write test first]` row in Acceptance Tests table (one prose mention in Key Decision (b) explaining the D-05 rationale is intentional and correct).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | e98f2ded | Author normative core — Purpose, Scope, five invariants, Acceptance Tests table |
| Task 2 | 2eb4bf55 | Advance Status Draft -> Ready; set Confidence High and Specced 2026-06-12 |

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed in sequence; all acceptance criteria satisfied on first pass. The Key Decisions and Code Context sections were authored in the same write as the normative core (Task 1) since all source data was available; the frontmatter advancement (Task 2) was a minimal targeted edit as specified.

## ROADMAP Success Criteria Satisfied

1. SPEC.md enumerates all 12+ detection branches (`current as of 2026-06-12` marker), the affirmative-rewrite replacement rule (Purpose + Key Decision b), the paired-pattern exception (01-INV-3 class 1), and the four scan directories (01-INV-4 advisory detail). **[SPEC-01]**
2. SPEC.md states 5 numbered EARS invariants citing `tests/negative-framing-scan.test.cjs` as tier-1; the 29-row Acceptance Tests table maps each MUST invariant to real verbatim subtests. **[QUAL-01, QUAL-02, QUAL-04]**
3. All paths/symbols advisory-marked in Code Context; Key Decisions section records three settled decisions "do not reopen" with consequence; Status advanced to `Ready`. **[QUAL-03, QUAL-05]**

## Self-Check: PASSED

- `.planning/spec/01-positive-framing/SPEC.md` — FOUND
- Commit e98f2ded — verified (git log)
- Commit 2eb4bf55 — verified (git log)
