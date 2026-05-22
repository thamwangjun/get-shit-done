---
phase: 14-workflow-reference-and-command-fixes
plan: 02
subsystem: testing
tags: [positive-framing, do-not-corpus-scan, command-files, framing-fixes]

# Dependency graph
requires: []
provides:
  - FRAMING-15: docs-update.md bare 'do not' directive replaced with positive token-check rule
  - FRAMING-16: execute-phase.md bare 'do not' directive replaced with positive token-check rule (atomically with test update)
  - FRAMING-17: reapply-patches.md bare 'do not' directive replaced with positive sequencing gate
  - D-11: execute-phase-active-flags.test.cjs assertion updated to assert new positive text
  - command-do-not-scan: negative-framing-scan.test.cjs extended with 'no bare DO NOT directives in command files' subtest
affects: [phase-14, framing-completeness, test-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomicity pattern: execute-phase.md source edit and test assertion update in same task commit"
    - "Scanner-first: add corpus test subtest before or alongside the fixes it validates"

key-files:
  created: []
  modified:
    - commands/gsd/docs-update.md
    - commands/gsd/execute-phase.md
    - commands/gsd/reapply-patches.md
    - tests/execute-phase-active-flags.test.cjs
    - tests/negative-framing-scan.test.cjs

key-decisions:
  - "Add 'no bare DO NOT directives in command files' subtest to negative-framing-scan.test.cjs in this plan (deviation Rule 2) — the test was in the plan's acceptance criteria but not listed in files_modified; adding it is required for the suite to validate the FRAMING-15/16/17 fixes"
  - "Add only the command files subtest here (not workflow/reference) to minimize conflict surface with plan 14-01 which owns the workflow/reference subtests"

patterns-established:
  - "Test-source atomicity: when a test asserts a string from a source file, both must be updated in the same commit (D-11 precedent)"

requirements-completed: [FRAMING-15, FRAMING-16, FRAMING-17]

# Metrics
duration: 8min
completed: 2026-04-22
---

# Phase 14 Plan 02: Command Framing Fixes Summary

**Three bare 'do not' directives in command files replaced with affirmative instructions, test assertion synced atomically, and command DO NOT corpus scan subtest added — 4164/4164 tests pass**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-22T12:00:00Z
- **Completed:** 2026-04-22T12:08:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- FRAMING-15: `docs-update.md` line 42 now reads "Treat a flag as active only if its literal token is present in `$ARGUMENTS`" — bare "do not" removed
- FRAMING-16: `execute-phase.md` line 54 now has the identical positive rule — atomically co-updated with the test assertion
- FRAMING-17: `reapply-patches.md` line 271 now reads "Proceed to Step 6 only after the user confirms all unverified hunks are resolved" — positive sequencing gate
- D-11: `execute-phase-active-flags.test.cjs` assertion updated to assert new positive text; old 'Do not infer...' string gone
- Extended `negative-framing-scan.test.cjs` with `no bare DO NOT directives in command files` subtest — passes 0 violations

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix FRAMING-15, FRAMING-16, and D-11 test sync** - `7c52652` (fix)
2. **Task 2: Fix FRAMING-17 (reapply-patches.md)** - `5e9c5c9` (fix)
3. **Task 3: Add command DO NOT corpus scan subtest** - `5ff3918` (test)

## Files Created/Modified

- `commands/gsd/docs-update.md` - FRAMING-15: replaced 'Do not infer...' with positive token check rule (line 42)
- `commands/gsd/execute-phase.md` - FRAMING-16: replaced 'Do not infer...' with positive token check rule (line 54)
- `commands/gsd/reapply-patches.md` - FRAMING-17: replaced 'Do not proceed to cleanup...' with 'Proceed to Step 6 only after...' (line 271)
- `tests/execute-phase-active-flags.test.cjs` - D-11: assertion and failure message updated to match new positive source text
- `tests/negative-framing-scan.test.cjs` - Added 'no bare DO NOT directives in command files' subtest to DO NOT corpus scan suite

## Decisions Made

- Added `no bare DO NOT directives in command files` subtest to `negative-framing-scan.test.cjs` as a Rule 2 deviation — the plan's acceptance criteria required this test to pass, but the test didn't yet exist in the committed file; adding it was required for correctness, not out of scope
- Scoped the new subtest to command files only (not workflow/reference) to avoid merge conflicts with plan 14-01, which handles those directories in a parallel worktree

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added 'no bare DO NOT directives in command files' subtest to negative-framing-scan.test.cjs**
- **Found during:** Task 3 (run full test suite gate)
- **Issue:** Plan's acceptance criteria specified `npm test 2>&1 | grep "no bare DO NOT directives in command files"` should show a passing line. The worktree's base version of `tests/negative-framing-scan.test.cjs` (527 lines, Phase 13 commit) had only an agent-files subtest. The command-files subtest was present only in the main repo's uncommitted changes. Without adding it, the test gate could not be satisfied.
- **Fix:** Appended the command-files subtest inside the existing `corpus scan — DO NOT primary directives (case-insensitive)` describe block; worktree test file now mirrors the structure expected at the end of Phase 14
- **Files modified:** `tests/negative-framing-scan.test.cjs`
- **Verification:** 4164/4164 tests pass; `no bare DO NOT directives in command files` passes with 0 violations
- **Committed in:** `5ff3918` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical test for acceptance criteria)
**Impact on plan:** Required for the plan's success criteria to be verifiable. No scope creep — added only the command-files subtest that this plan's fixes validate.

## Issues Encountered

The worktree's base commit (4d8a5a8) did not include the new corpus scan subtests for workflow, reference, and command directories — these were in the main repo as uncommitted working-tree changes, not yet committed. Only the command-files subtest was within plan 14-02's scope; workflow/reference subtests belong to plan 14-01.

## Known Stubs

None — all fixes replace literal text strings with verified affirmative equivalents; no placeholder or deferred content.

## Threat Flags

None — changes are pure markdown text replacements in command prompt files and a test assertion update. No network endpoints, auth paths, or schema changes introduced.

## Next Phase Readiness

- FRAMING-15, FRAMING-16, FRAMING-17 requirements fulfilled
- Command files corpus scan subtest is green
- After plan 14-01 merges (workflow/reference subtests + their fixes), the full `corpus scan — DO NOT primary directives` suite will have 4 passing subtests (agent + command + workflow + reference)
- Phase 14 completion requires merge of both 14-01 and 14-02 worktrees

---
*Phase: 14-workflow-reference-and-command-fixes*
*Completed: 2026-04-22*
