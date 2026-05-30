---
phase: 49-survey-and-normalization
plan: "12"
subsystem: workflows
tags: [normalization, step-rename, quick-workflow, tests]
dependency_graph:
  requires: [49-01]
  provides: [quick.md sequential step labels 1-15]
  affects: [get-shit-done/workflows/quick.md, tests/quick-branching.test.cjs, tests/bug-2432-quick-plan-predispatch-commit.test.cjs]
tech_stack:
  added: []
  patterns: [bottom-up rename to avoid conflicts, prose cross-reference scan]
key_files:
  modified:
    - get-shit-done/workflows/quick.md
    - tests/quick-branching.test.cjs
    - tests/bug-2432-quick-plan-predispatch-commit.test.cjs
decisions:
  - Applied bottom-up rename strategy (Step 8→15 first, Step 2.5→3 last) to prevent conflicts
  - Updated all 5 prose cross-references within quick.md to match new step numbers
  - Updated all test string-matching assertions including error messages and test names
metrics:
  duration: "~8 minutes"
  completed: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 3
---

# Phase 49 Plan 12: Rename decimal step labels in quick.md to sequential whole integers (1-15)

Full 15-step renumber of `get-shit-done/workflows/quick.md` — all 7 decimal step violations resolved, two co-located test files updated in the same commit.

## What Was Built

Renamed all 7 decimal step labels in `get-shit-done/workflows/quick.md` to sequential whole integers, producing a clean 15-step workflow. Updated 5 prose cross-references within the file and updated two co-located test files to match the new step labels.

### Renaming Map Applied

| Old Label | New Label |
|-----------|-----------|
| Step 1 | Step 1 (no change) |
| Step 2 | Step 2 (no change) |
| Step 2.5: Handle quick-task branching | Step 3: Handle quick-task branching |
| Step 3: Create task directory | Step 4: Create task directory |
| Step 4: Create quick task directory | Step 5: Create quick task directory |
| Step 4.5: Discussion phase | Step 6: Discussion phase |
| Step 4.75: Research phase | Step 7: Research phase |
| Step 5: Spawn planner | Step 8: Spawn planner |
| Step 5.5: Plan-checker loop | Step 9: Plan-checker loop |
| Step 5.6: Pre-dispatch plan commit | Step 10: Pre-dispatch plan commit |
| Step 6: Spawn executor | Step 11: Spawn executor |
| Step 6.25: Code review | Step 12: Code review |
| Step 6.5: Verification | Step 13: Verification |
| Step 7: Update STATE.md | Step 14: Update STATE.md |
| Step 8: Final commit | Step 15: Final commit |

### Prose Cross-References Updated in quick.md

| Location | Old | New |
|----------|-----|-----|
| Step 6 discussion phase | "skip to Step 5" | "skip to Step 8" |
| Step 9 checker result | "proceed to step 6" | "proceed to step 11" |
| Step 10 skip condition | "committed in Step 8" | "committed in Step 15" |
| Step 11 executor constraints | "docs commit in Step 8" | "docs commit in Step 15" |
| Step 13 verification table | "continue to step 7" | "continue to step 14" |

### Test Files Updated

**tests/quick-branching.test.cjs:**
- Regex `/^\*\*Step 2\.5:\s*Handle quick-task branching\*\*\s*$/` → `Step 3:` pattern
- `content.indexOf('Step 2.5: Handle quick-task branching')` → `content.indexOf('Step 3: Handle quick-task branching')`
- Test names and error messages updated throughout

**tests/bug-2432-quick-plan-predispatch-commit.test.cjs:**
- `content.indexOf('Step 5.5')` → `content.indexOf('Step 9')`
- `content.indexOf('Step 5.6')` → `content.indexOf('Step 10')`
- `content.indexOf('Step 6:')` → `content.indexOf('Step 11:')`
- Test names, assertion messages updated throughout

## Verification

```
command grep -c "Step 2\.5\|Step 4\.5\|Step 4\.75\|Step 5\.5\|Step 5\.6\|Step 6\.25\|Step 6\.5" get-shit-done/workflows/quick.md
→ 0 (PASS)

node --test tests/quick-branching.test.cjs tests/bug-2432-quick-plan-predispatch-commit.test.cjs
→ 14 tests, 0 failures (PASS)
```

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Rename all steps and update test files | 1c931e29 | get-shit-done/workflows/quick.md, tests/quick-branching.test.cjs, tests/bug-2432-quick-plan-predispatch-commit.test.cjs |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `get-shit-done/workflows/quick.md` exists and has steps 1-15 sequential
- [x] `tests/quick-branching.test.cjs` references "Step 3: Handle quick-task branching"
- [x] `tests/bug-2432-quick-plan-predispatch-commit.test.cjs` indexOf calls reference Step 9, Step 10, Step 11
- [x] Commit 1c931e29 exists: `git log --oneline | grep 1c931e29`
- [x] npm test (targeted) passes 14/14 tests with 0 failures
