---
phase: 49-survey-and-normalization
plan: "05"
subsystem: workflows
tags: [step-numbering, normalization, NORM-01]
dependency_graph:
  requires: ["49-01"]
  provides: ["post-merge-gate step labels normalized"]
  affects: ["get-shit-done/workflows/execute-phase/steps/post-merge-gate.md"]
tech_stack:
  added: []
  patterns: ["letter-suffix to integer rename"]
key_files:
  modified:
    - get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
decisions:
  - "Line 60 '(same as step 5.8)' left untouched per D-03; handled by plan 49-13"
metrics:
  duration: "< 5 minutes"
  completed: "2026-05-30"
---

# Phase 49 Plan 05: Rename Step A/B in post-merge-gate.md Summary

Renamed two letter-suffix step violations in `post-merge-gate.md`: Step A (Build gate) → Step 1, Step B (Test gate) → Step 2, satisfying NORM-01 and D-01.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename Step A → Step 1 and Step B → Step 2 | e0e14578 | get-shit-done/workflows/execute-phase/steps/post-merge-gate.md |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `command grep -c "Step A\|Step B" post-merge-gate.md` → 0 (PASS)
- `command grep -n "Step 1" post-merge-gate.md` → line 8: `**Step 1 — Build gate:**` (PASS)
- `command grep -n "Step 2" post-merge-gate.md` → line 62: `**Step 2 — Test gate:**` (PASS)
- `command grep -n "5\.8" post-merge-gate.md` → line 60: unchanged `(same as step 5.8)` (PASS)
- `npm test` → exit 0, no new failures (PASS)

## Self-Check: PASSED

- File exists: get-shit-done/workflows/execute-phase/steps/post-merge-gate.md (confirmed modified)
- Commit exists: e0e14578 (confirmed)
- No Step A or Step B remains in target file
- Cross-file ref `(same as step 5.8)` preserved on line 60
