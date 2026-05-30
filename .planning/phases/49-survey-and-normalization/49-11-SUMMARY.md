---
phase: 49-survey-and-normalization
plan: "11"
subsystem: workflows
tags: [normalization, step-numbering, execute-phase, pattern-d, pattern-ab]
dependency_graph:
  requires: [49-01]
  provides: [execute-phase.md Pattern D and A/B violations resolved]
  affects: [tests/execute-phase-step-7-deviation-doc.test.cjs]
tech_stack:
  added: []
  patterns: [bottom-up ordered-list renumber, ### heading counter reset for scanner]
key_files:
  modified:
    - get-shit-done/workflows/execute-phase.md
    - tests/execute-phase-step-7-deviation-doc.test.cjs (renamed from execute-phase-step-5-5-deviation-doc.test.cjs)
decisions:
  - "Renamed bold Step labels to Step 7/8/9/10 (PREFERRED approach per RESEARCH.md); added ### Regression Gate Execution heading to reset out-of-order counter caused by new Step 7-10 labels"
  - "Old ordered-list items 7→12, 7b→12b, 8→13, 9→14 to avoid duplicate item numbers after 5.5→7 and 5.6→8"
metrics:
  duration: ~20m
  completed: 2026-05-30
  tasks_completed: 1
  files_modified: 2
---

# Phase 49 Plan 11: execute-phase.md Pattern D/A/B Renumber Summary

Renamed all Pattern D ordered-list decimal items and Pattern A/B bold Step 7.x labels in `get-shit-done/workflows/execute-phase.md`. Co-updated the co-located test file and renamed it to reflect new step numbers.

## What Was Built

Pattern D renumber (ordered-list items, bottom-up): 2.5→3, 3→4, 4→5, 5→6, 5.5→7, 5.6→8, 5.7→9, 5.8→10, 6→11, with cascading shift of old 7→12, 7b→12b, 8→13, 9→14 to avoid duplicate item numbers.

Pattern A/B rename (bold inline labels inside old item 7): Step 7.0→Step 7, Step 7.1→Step 8, Step 7.2→Step 9, Step 7.3→Step 10.

Same-file prose cross-references updated: "step 2.5" → "step 3" (3 occurrences), "step 5.5" → "step 7", "step 5.6" → "step 8", "executor dispatch in step 3" → "step 4", "Optional step 2.5" → "Optional step 3".

Test file `execute-phase-step-5-5-deviation-doc.test.cjs` renamed to `execute-phase-step-7-deviation-doc.test.cjs`; `extractStep55Block` → `extractStep7Block`; `indexOf('\n5.5.')` → `indexOf('\n7.')`, `indexOf('\n5.6.')` → `indexOf('\n8.')`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Out-of-order scanner failure created by Step 7.0→Step 7 rename**
- **Found during:** Task 1 (after verifying scanner results)
- **Issue:** Before our changes, `Step 7.0`, `Step 7.1`, `Step 7.2`, `Step 7.3` were excluded from the `scanForOutOfOrder` lookahead `(?![\.\da-z])` because they had decimal suffixes. After renaming to `Step 7`, `Step 8`, `Step 9`, `Step 10`, these became visible to the out-of-order scanner. The scanner then tracked Step 7-10 inside `execute_waves` and reported out-of-order when it found `Step 1` inside the later `regression_gate` section (no `##`/`###` heading between them to reset the counter).
- **Fix:** Added `### Regression Gate Execution` heading before `**Step 1: Discover prior phases' test files**` in the `regression_gate` step to reset the scanner's per-section counter.
- **Files modified:** `get-shit-done/workflows/execute-phase.md`
- **Commit:** 506f94c3

**2. [Rule 1 - Bug] Old ordered-list items 7, 7b, 8, 9 not in RESEARCH.md renaming map**
- **Found during:** Task 1 (analysis of numbered list)
- **Issue:** RESEARCH.md A4 renaming map only covered items 2.5 through 6. After renaming 5.5→7 and old 6→11, the existing items 7, 7b, 8, 9 would have created duplicate item numbers.
- **Fix:** Cascaded renaming to old 7→12, 7b→12b, 8→13, 9→14 (bottom-up, before renaming 5.5→7).
- **Files modified:** `get-shit-done/workflows/execute-phase.md`
- **Commit:** 506f94c3

## Known Stubs

None.

## Threat Flags

None — text-only renaming in markdown workflow and test files; no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `get-shit-done/workflows/execute-phase.md` exists: FOUND
- `tests/execute-phase-step-7-deviation-doc.test.cjs` exists: FOUND
- Commit 506f94c3 exists: FOUND
- Pattern D grep returns 0: PASS
- Pattern A/B grep returns 0: PASS
- `npm test` exits 0: PASS
- Step 7 in ordered list exists: PASS (line 741)
- Step 11 in ordered list exists: PASS (line 893)
