---
phase: 49-survey-and-normalization
plan: prewave3-fix
subsystem: tests
tags: [regression-fix, test-assertions, step-numbering]
dependency_graph:
  requires: [49-11, 49-12, 49-08]
  provides: [unblocked wave 3 execution]
  affects:
    - tests/bug-2410-stream-checkpoint-heartbeats.test.cjs
    - tests/bug-2523-quick-deferred-items.test.cjs
    - tests/bug-3657-verify-reapply-patches-pristine-drift.test.cjs
tech_stack:
  added: []
  patterns: [update test assertions to match renumbered step labels]
key_files:
  modified:
    - tests/bug-2410-stream-checkpoint-heartbeats.test.cjs
    - tests/bug-2523-quick-deferred-items.test.cjs
    - tests/bug-3657-verify-reapply-patches-pristine-drift.test.cjs
decisions:
  - Updated step-number string literals in test assertions to match labels renumbered by wave 2
  - No source file changes — all fixes are in test assertion strings only
metrics:
  duration: "~10 minutes"
  completed: "2026-05-30"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 3
---

# Phase 49 Pre-Wave-3 Fix: Resolve wave 2 test regressions

**Three test files updated to reference new whole-integer step labels after wave 2 renumbering**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-05-30
- **Tasks:** 3 (one per test file)
- **Files modified:** 3

## Accomplishments

- Fixed `bug-2410` assertions for execute-phase.md wave step numbers (3→4, 4→5, 5→6, 6→11, 7→12)
- Fixed `bug-2523` assertion for quick.md final commit step (`Step 8` → `Step 15`)
- Fixed `bug-3657` Finding 2 assertion for reapply-patches.md section label (`Step 5a: drift check` → `5a: Deterministic verifier`)

## Task Commits

1. **Fix all three wave-2 regression tests** — `4fbec7e5` (fix)

## Files Modified

- `tests/bug-2410-stream-checkpoint-heartbeats.test.cjs` — Updated step-number strings for execute-phase.md wave steps
- `tests/bug-2523-quick-deferred-items.test.cjs` — Updated `Step 8` → `Step 15` for quick.md final commit
- `tests/bug-3657-verify-reapply-patches-pristine-drift.test.cjs` — Updated `Step 5a: drift check` → `5a: Deterministic verifier`

## Decisions Made

All changes are test-assertion string updates only. The source files (execute-phase.md, quick.md, reapply-patches.md) were correctly renumbered by wave 2 plans; only the tests needed to catch up.

## Deviations from Plan

None — pre-wave fix, not a formal plan. All three regressions fixed in one commit as specified in the handoff.

## Issues Encountered

None.

## Next Phase Readiness

Wave 3 (plan 49-04) is unblocked. Run `/gsd-execute-phase 49` to continue.
