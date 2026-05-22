---
phase: 17-working-tree-and-docs-housekeeping
plan: "01"
subsystem: testing
tags: [node-test, negative-framing-scan, housekeeping, mise, planning-artifacts]

# Dependency graph
requires:
  - phase: 15-test-suite-gate
    provides: negative-framing-scan test suite baseline
  - phase: 14-workflow-reference-and-command-fixes
    provides: workflow and command fixes that necessitated the scanner improvements
provides:
  - Deduped test file with single canonical DO NOT corpus scan describe block
  - Improved isConditionalOrFactual function with broader verb patterns and relative clause detection
  - mise.toml dev tool version pin committed to repo
  - v1.37.1a milestone audit artifact under .planning/
  - Phase 14 planning artifact (14-PATTERNS.md) committed in place
  - Scanner bug dev notes committed under .planning/notes/
affects: [17-02, 17-03, future-test-maintenance]

# Tech tracking
tech-stack:
  added: [mise]
  patterns: [single canonical describe block per test concern, extended isConditionalOrFactual verb list]

key-files:
  created:
    - mise.toml
    - .planning/v1.37.1a-MILESTONE-AUDIT.md
    - .planning/phases/14-workflow-reference-and-command-fixes/14-PATTERNS.md
    - .planning/notes/2026-04-22-scanner-bug-isconditionalorfactual.md
  modified:
    - tests/negative-framing-scan.test.cjs

key-decisions:
  - "Removed duplicate describe block from tests/negative-framing-scan.test.cjs — canonical block at line 400 retained (2 subtests covering agent and command files)"
  - "isConditionalOrFactual improvements (broader verb list, relative clause detection) kept as they improve scanner accuracy — only the redundant describe block was deleted"
  - "Post-dedup test count is 4164 (down from 4168 with duplicate) — this is the new baseline for Plan 03"

patterns-established:
  - "Each test concern has exactly one describe block — duplication indicates a working-tree artifact that must be removed before committing"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-04-23
---

# Phase 17 Plan 01: Working Tree Housekeeping — Test Dedup and Untracked Artifacts Summary

**Duplicate DO NOT corpus-scan describe block removed from tests/negative-framing-scan.test.cjs; four untracked planning artifacts (mise.toml, v1.37.1a audit, 14-PATTERNS, scanner bug note) committed to git**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-23T09:15:00Z
- **Completed:** 2026-04-23T09:30:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Removed duplicate `describe('corpus scan — DO NOT primary directives (case-insensitive)', ...)` block (lines 557–657) from tests/negative-framing-scan.test.cjs; exactly 1 such block now exists (at the original location)
- npm test passes with 0 failures and 4164 passing tests (down from 4168 with the duplicate 4-subtest block)
- All four previously untracked planning artifacts committed to version control

## npm test result (needed by Plan 03)

```
ℹ tests 4164
ℹ pass  4164
ℹ fail  0
```

**Actual pass count: 4164** — this is the authoritative post-dedup baseline for Plan 03 Task 1.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove duplicate describe block** - included in `a7ba4c0` (chore)
2. **Task 2: Run npm test — 0 failures** - verification only, no commit
3. **Task 3: Commit test file dedup and untracked artifacts** - `a7ba4c0` (chore)

**Plan metadata:** committed in final SUMMARY commit

## Files Created/Modified

- `tests/negative-framing-scan.test.cjs` — Removed duplicate corpus-scan describe block (lines 557–657); now 556 lines with exactly 1 DO NOT scan block
- `mise.toml` — Dev tool version pin, newly committed to repo root
- `.planning/v1.37.1a-MILESTONE-AUDIT.md` — Milestone audit artifact for v1.37.1a
- `.planning/phases/14-workflow-reference-and-command-fixes/14-PATTERNS.md` — Phase 14 planning artifact
- `.planning/notes/2026-04-22-scanner-bug-isconditionalorfactual.md` — Scanner bug dev notes

## Decisions Made

- The duplicate describe block was a working-tree artifact (unstaged modification to the main repo); the canonical committed version already had the block removed; the fix was applied to the working tree and then committed via the worktree
- The `isConditionalOrFactual` improvements in the working tree (broader verb list, relative clause detection, subject+verb factual patterns) were intentional improvements and were retained — only the redundant second describe block was removed
- Tasks 1 and 3 collapsed into a single commit (`a7ba4c0`) since Task 1 (the edit) and Task 3 (the commit) logically form one atomic operation

## Deviations from Plan

### Context Differences

**1. [Context - Working Tree State] Test file was 657 lines in main working tree, 548 lines in committed HEAD**
- **Found during:** Task 1
- **Issue:** The plan described a 657-line file with 2 describe blocks. The worktree (reset to `6d075a7`) had the committed version at 548 lines with 1 block. The main working tree had the 657-line version with the duplicate as an unstaged modification.
- **Fix:** Edited the main working tree file to remove the duplicate block (lines 557–657), then copied the fixed file into the worktree working directory for committing. This correctly captured both the `isConditionalOrFactual` improvements AND removed the duplicate.
- **Files modified:** tests/negative-framing-scan.test.cjs
- **Verification:** grep -c outputs 1; wc -l outputs 556; npm test passes with 0 failures
- **Committed in:** a7ba4c0

---

**Total deviations:** 1 context difference (working tree vs committed state)
**Impact on plan:** No scope change. The outcome matches the plan's success criteria exactly.

## Issues Encountered

None — the working tree state difference was handled transparently by editing the main working tree file and copying into the worktree before committing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Test suite is clean: 4164 passing, 0 failing, exactly 1 DO NOT corpus scan describe block
- All previously untracked files are now under version control
- Plan 03 should use **4164** as the `ℹ pass N` baseline when updating Phase 15 SUMMARY

---
*Phase: 17-working-tree-and-docs-housekeeping*
*Completed: 2026-04-23*
