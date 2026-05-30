---
phase: 49-survey-and-normalization
plan: "08"
subsystem: workflows
tags: [step-numbering, normalization, reapply-patches, NORM-01]
dependency_graph:
  requires: ["49-01"]
  provides: ["reapply-patches.md violation-free"]
  affects: ["tests/step-numbering-scan.test.cjs"]
tech_stack:
  added: []
  patterns: ["label-removal: remove Step Na prefix, keep descriptive text"]
key_files:
  modified:
    - get-shit-done/workflows/reapply-patches.md
decisions:
  - "Option 1 chosen: remove the Step Na prefix entirely, use plain descriptive bold label (**drift check**)"
  - "Line 377 Step 5b prose reference replaced with plain 'hunk verification' — avoids stale cross-ref to renamed label"
metrics:
  duration: "3 minutes"
  completed: "2026-05-30"
---

# Phase 49 Plan 08: Remove Step 5a Label from reapply-patches.md Summary

Remove the single `STEP_DECIMAL_RE` violation `**Step 5a: drift check**` from `get-shit-done/workflows/reapply-patches.md` by replacing it with the plain bold label `**drift check**`. Also update the stale prose reference `Step 5b verification` on line 377 to `hunk verification`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace Step 5a label with plain descriptive label | 30535f53 | get-shit-done/workflows/reapply-patches.md |

## Changes Made

### Task 1: Replace **Step 5a:** label

**File:** `get-shit-done/workflows/reapply-patches.md`

Two edits in one commit:

1. Line 298: `**Step 5a: drift check**` → `**drift check**`
   - Removes the "Step 5a: " prefix; keeps the descriptive text
   - The `### 5a:` heading at line 270 is unchanged (no "Step" keyword — not a violation)

2. Line 377: `Step 5b verification` → `hunk verification`
   - Stale cross-reference in an ERROR message template
   - Updated in same commit per plan instruction (A9 note in RESEARCH.md)
   - The `### 5b:` heading at line 359 is unchanged (no "Step" keyword — not a violation)

## Verification

- `command grep -n "Step 5[a-z]" reapply-patches.md` → 0 results (PASS)
- `command grep -n "### 5a:\|### 5b:" reapply-patches.md` → 2 matches (unchanged headings present)
- `node --test tests/step-numbering-scan.test.cjs` → 3 reapply-patches.md subtests pass:
  - `no decimal Pattern A/B labels in get-shit-done/workflows/reapply-patches.md` PASS
  - `no decimal Pattern D items in get-shit-done/workflows/reapply-patches.md` PASS
  - `no out-of-order step numbering in get-shit-done/workflows/reapply-patches.md` PASS
- 12 pre-existing failures in other files (execute-phase.md, graphify.md, etc.) — no new failures introduced

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- [x] `get-shit-done/workflows/reapply-patches.md` exists and has been modified
- [x] Commit `30535f53` exists in git log
- [x] 0 `Step 5[a-z]` violations remain
- [x] `### 5a:` and `### 5b:` headings preserved
