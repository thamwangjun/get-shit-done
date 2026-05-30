---
phase: 48-tdd-red-gate
plan: 02
subsystem: tests
tags: [tdd, scanner, step-numbering, red-gate, letter-suffix, gap-closure]
dependency-graph:
  requires: ["48-01"]
  provides: ["letter-suffix-detection"]
  affects: ["tests/step-numbering-scan.test.cjs"]
key-files:
  modified:
    - tests/step-numbering-scan.test.cjs
decisions:
  - "Letter-suffix steps (Step 7a, 7b, etc.) are violations requiring renumbering — STEP_DECIMAL_RE expanded from \\d+\\.\\d to \\d+(?:\\.\\d|[a-z])"
metrics:
  duration_minutes: 5
  tasks_completed: 1
  files_modified: 1
  completed_date: "2026-05-30"
---

# Phase 48 Plan 02: Expand Letter-Suffix Detection Summary

UAT gap closure: expand `STEP_DECIMAL_RE` in `tests/step-numbering-scan.test.cjs` to flag letter-suffix step labels (Step 7a, Step 7b, etc.) as Pattern A/B violations, adding `agents/gsd-verifier.md` to the RED failure corpus.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 76797cc8 | feat(48-02): expand STEP_DECIMAL_RE to flag letter-suffix steps as violations |

## What Was Done

Made three targeted edits to `tests/step-numbering-scan.test.cjs`:

**Edit 1 — Expanded STEP_DECIMAL_RE:**
Changed `\.\d` alternation target to `(?:\.\d|[a-z])` so the regex matches both decimal suffix forms (`Step 7.0`, `Step 2.5`) and letter-suffix forms (`Step 7a`, `Step 7b`). The leading boundary `(?:^|\s|\*\*)` was preserved unchanged.

**Edit 2 — Flipped the letter-suffix unit test:**
Replaced `does not flag letter-suffix step (Step 7a)` (asserts length === 0) with `flags letter-suffix step (Step 7a) as violation` (asserts length === 1). The test now correctly documents the user decision that letter-suffix steps are violations requiring renumbering.

**Edit 3 — Updated module-level JSDoc:**
Updated the Phase 48 RED expectation comment from 6 files to 7 files, adding `agents/gsd-verifier.md` (Step 2a, Step 2b, Step 2c, Step 3b, Step 4b, Step 7b, Step 7c, Step 9b) to the list.

## Verification Results

**Unit tests:** All 7 `scanContent()` and 7 `scanForOutOfOrder()` synthetic tests PASS GREEN.

**New corpus RED gate (Pattern A/B — letter-suffix):**
- `agents/gsd-verifier.md` — Step 2a, Step 2b, Step 2c, Step 3b, Step 4b, Step 7b, Step 7c, Step 9b

**Pre-existing corpus RED gate (Pattern A/B decimal — still failing as expected):**
- `agents/gsd-intel-updater.md` — Step 6.5
- `agents/gsd-phase-researcher.md` — Step 1.3, 1.5, 2.5, 2.6
- `get-shit-done/workflows/progress.md` — Step 1.5, 1.6
- `get-shit-done/workflows/quick.md` — Step 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5
- `get-shit-done/workflows/execute-phase.md` — Step 7.0–7.3
- `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` — inline "step 5.8" ref

**No false positives for `agents/gsd-verifier.md` in:**
- Pattern D (ordered-list decimal items) — PASS
- Out-of-order step numbering — PASS

## Deviations from Plan

None — plan executed exactly as written. All three edits applied verbatim from plan action blocks.

## Known Stubs

None.

## Threat Flags

None. The regex alternation `(?:\.\d|[a-z])` introduces no nested quantifiers and is linear (no ReDoS risk per T-48-03 in threat register).

## Self-Check

**PASSED.**

- [x] `STEP_DECIMAL_RE` uses `(?:\.\d|[a-z])` alternation (letter-suffix steps flagged as violations)
- [x] Unit test `flags letter-suffix step (Step 7a) as violation` passes GREEN
- [x] `agents/gsd-verifier.md` fails corpus Pattern A/B subtest
- [x] `does not flag letter-suffix` test name no longer exists in file
- [x] All pre-existing corpus failures (6 files from Plan 01) continue to fail RED
- [x] `scanContent() — decimal detection` block: 7 tests PASS
- [x] `scanForOutOfOrder() — synthetic content` block: 7 tests PASS
- [x] Pattern D and out-of-order subtests for `agents/gsd-verifier.md` remain PASS (no false positives)
