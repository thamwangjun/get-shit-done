---
phase: quick-260607-1fz
plan: "01"
subsystem: tests
tags: [regression-guard, effort-args, null-omit, convention]
dependency_graph:
  requires: [260607-0kd]
  provides: [null-omit-comment-scan regression guard]
  affects: [tests/]
tech_stack:
  added: []
  patterns: [paren-depth state machine, standalone-regex anchor]
key_files:
  created:
    - tests/null-omit-comment-scan.test.cjs
  modified: []
decisions:
  - "Reused paren-depth state machine verbatim from bare-effort-arg-scan.test.cjs for consistency"
  - "Standalone regex anchor (^\\s*effort=) naturally excludes inline cases without special-case lists"
metrics:
  duration: 8min
  completed: "2026-06-07"
---

# Phase quick-260607-1fz Plan 01: Create null-omit-comment-scan Test Summary

## One-liner

Regression guard for null-omit comment convention: scans agent/workflow/command files for standalone effort= lines missing the '# omit this line when' comment.

## What Was Built

Created `tests/null-omit-comment-scan.test.cjs` — a 145-line regression test that verifies every standalone `effort={*_effort_arg}` line inside an `Agent()` invocation carries the `# omit this line when` null-omit comment established in quick task 260607-0kd.

The scanner:
1. Uses the same paren-depth state machine as `bare-effort-arg-scan.test.cjs` (verbatim copy per plan spec) to identify lines inside `Agent()` invocations.
2. Applies a `^\s*effort=` anchored regex — this correctly excludes the known inline cases in `code-review-fix.md`, `new-milestone.md`, and `discuss-phase-assumptions.md` where `effort=` appears mid-line, without needing an explicit exclusion list.
3. Reports violations with file, line, column, and variable name for precise fix guidance.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create tests/null-omit-comment-scan.test.cjs | f52b0b79 | tests/null-omit-comment-scan.test.cjs |
| 2 | Run full test suite and commit | f52b0b79 | (same commit) |

## Verification

- `node --test --test-name-pattern='null-omit-comment-scan' tests/null-omit-comment-scan.test.cjs` — PASSED (1 test, 0 violations)
- `npm test` — 6 pre-existing failures unrelated to this change (prompt-injection-scan/docs-update.md size, model-profiles, parse-model-effort, issue-2517 — all pre-existed on HEAD before this task)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — test-only change, no new network endpoints or auth paths.

## Self-Check: PASSED

- [x] `tests/null-omit-comment-scan.test.cjs` exists
- [x] Commit `f52b0b79` exists in git log
- [x] Single test passes with zero violations
- [x] Pre-existing test failures are not caused by this change
