---
phase: 49-survey-and-normalization
plan: "06"
subsystem: workflows
tags: [step-normalization, plan-review-convergence, NORM-01]
dependency_graph:
  requires: ["49-01"]
  provides: ["plan-review-convergence.md step labels 1-10"]
  affects: ["tests/step-numbering-scan.test.cjs subtest for plan-review-convergence.md"]
tech_stack:
  added: []
  patterns: ["bottom-up rename order to avoid label conflicts during text substitution"]
key_files:
  modified:
    - get-shit-done/workflows/plan-review-convergence.md
decisions:
  - "Applied renaming bottom-to-top (Step 5d→10 first, Step 1.5→2 last) to prevent label conflicts"
  - "Updated prose 'skip to step 5' to 'skip to step 6' (old Step 5 = Convergence Loop becomes Step 6)"
  - "Updated prose 'step 5a' to 'step 7' at line 322 (old Step 5a = Review becomes Step 7)"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 49 Plan 06: plan-review-convergence.md Step Label Normalization Summary

Renamed all step labels in `get-shit-done/workflows/plan-review-convergence.md` from decimal/letter-suffix notation to sequential whole integers (Steps 1-10), eliminating `## 1.5.` and `### 5a/5b/5c/5d.` violations.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename all step labels to sequential whole integers | 92c1aa5f | get-shit-done/workflows/plan-review-convergence.md |

## What Was Done

`get-shit-done/workflows/plan-review-convergence.md` had two violation types:
1. `## 1.5. Config Gate` — decimal step label
2. `### 5a.`, `### 5b.`, `### 5c.`, `### 5d.` — letter-suffix step labels (the convergence loop sub-steps)

Applied full renaming map from RESEARCH.md Section A6 in bottom-to-top order:

| Old | New | Heading |
|-----|-----|---------|
| Step 1 | Step 1 | Parse and Normalize Arguments |
| Step 1.5 | Step 2 | Config Gate |
| Step 2 | Step 3 | Initialize |
| Step 3 | Step 4 | Validate Phase + Pre-flight Gate |
| Step 4 | Step 5 | Initial Planning |
| Step 5 | Step 6 | Convergence Loop |
| Step 5a | Step 7 | Review (Spawn Agent) |
| Step 5b | Step 8 | Extract HIGH Count from CYCLE_SUMMARY Contract |
| Step 5c | Step 9 | Stall Detection + Escalation Check |
| Step 5d | Step 10 | Replan (Spawn Agent) |

Also updated two same-file prose cross-references:
- Line 107: `Skip to step 5` → `Skip to step 6` (old Step 5 = Convergence Loop became Step 6)
- Line 322: `go back to **step 5a**` → `go back to **step 7**` (old Step 5a = Review became Step 7)

## Verification

- `command grep -n "Step 1\.5\|step 1\.5\|Step 5[abcd]\|step 5[abcd]" get-shit-done/workflows/plan-review-convergence.md` returns no output — PASS
- `command grep -n "step 7\|Step 7" get-shit-done/workflows/plan-review-convergence.md` returns match at line 322 — PASS
- `command grep -n "step 6\|Step 6" get-shit-done/workflows/plan-review-convergence.md` returns match at line 107 — PASS
- `node --test tests/step-numbering-scan.test.cjs` shows all 6 plan-review-convergence.md subtests PASSING
- `npm test` 2675 pass, 2 fail (both pre-existing failures in ai-evals.test.cjs and lock test — unrelated to this change)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `get-shit-done/workflows/plan-review-convergence.md` exists and contains Steps 1-10 as sequential whole integers
- [x] Commit 92c1aa5f exists: `git log --oneline | grep 92c1aa5f` confirms
- [x] No unexpected file deletions
- [x] Scanner subtests for plan-review-convergence.md all GREEN
