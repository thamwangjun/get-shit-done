---
phase: 60-effort-wiring-coverage
plan: "01"
subsystem: tests
tags: [testing, effort-wiring, regression-guard, phase-60]
dependency_graph:
  requires: []
  provides: [phase-60-Group-B-effort-wiring-tests]
  affects: [tests/phase-56-effort-wiring.test.cjs]
tech_stack:
  added: []
  patterns: [node-test-runner, content-includes-assertions]
key_files:
  created: []
  modified:
    - tests/phase-56-effort-wiring.test.cjs
decisions:
  - EWC-04 and EWC-07 each use a single test with four asserts (two resolve-model-effort lines + two arg tokens) per D-12
  - read() call kept inside each individual test() block per plan-time flag to prevent copy-paste errors
metrics:
  duration: "~5 minutes"
  completed: "2026-06-07"
---

# Phase 60 Plan 01: Effort-Wiring Coverage (Group B) Summary

**One-liner:** Added 8 live regression guard tests asserting effort-wiring tokens in 8 previously-uncovered workflows (audit-fix, diagnose-issues, code-review, code-review-fix, explore, import, ingest-docs, discuss-phase-assumptions).

## What Was Built

Appended a new `describe('phase-60 Group B effort wiring: newly-covered workflows', ...)` block to `tests/phase-56-effort-wiring.test.cjs` with exactly 8 live test() blocks (no .skip).

Each test reads its target workflow file via the existing `read(rel)` helper and asserts substring presence of the `resolve-model-effort gsd-<agent>` capture line and `<agent>_model_effort_arg` token.

EWC-04 (code-review-fix.md) and EWC-07 (ingest-docs.md) are single tests carrying four asserts each (two agents per file).

## Verification

- `node --test tests/phase-56-effort-wiring.test.cjs` — 26 pass, 0 fail, 0 skip (8 new tests in the phase-60 block)
- `npm test` — 9112 pass, 0 fail, 11 skip (no new failures vs baseline)
- Only `tests/phase-56-effort-wiring.test.cjs` modified; no workflow .md file changed

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] File `tests/phase-56-effort-wiring.test.cjs` exists and contains the new block
- [x] Commit 569510d9 recorded
- [x] 8 tests live, not skipped
- [x] Full suite green

## Self-Check: PASSED
