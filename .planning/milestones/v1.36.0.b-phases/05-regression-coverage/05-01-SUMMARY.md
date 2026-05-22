---
phase: 05-regression-coverage
plan: 01
subsystem: testing
tags: [node-test-runner, regression, hooks, install, concurrency]

requires:
  - phase: 04-fix-hooks-installation
    provides: ensureHooksDist helper in bin/install.js that triggers on-demand hooks/dist/ build

provides:
  - 8-test regression suite confirming hooks install correctly when hooks/dist/ absent
  - Race condition fix: serial execution of hooks/dist/-mutating tests via run-tests.cjs
  - REQUIREMENTS.md FIX-01/02/03 all checked; traceability table Complete
  - ROADMAP.md Phase 4 and Phase 5 complete; v1.36.0.b milestone shipped 2026-04-17
  - PROJECT.md Validated section with FIX-02 and FIX-03 entries; Active section cleared

affects: [future phases, milestone state readers]

tech-stack:
  added: []
  patterns:
    - "Serial test isolation: tests that mutate shared filesystem state (hooks/dist/) run as a separate serial phase in run-tests.cjs using --test-concurrency=1 after all parallel tests"
    - "Outer describe({ concurrency: false }) wrapper: used to serialize intra-file describe blocks that share mutable state"

key-files:
  created:
    - .planning/phases/05-regression-coverage/05-01-SUMMARY.md
  modified:
    - tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs
    - scripts/run-tests.cjs
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md

key-decisions:
  - "Run hooks/dist-mutating test file serially (--test-concurrency=1) after all parallel tests to prevent cross-file race: concurrent installer subprocesses in other test files rebuild hooks/dist/ while our test has renamed it away"
  - "Wrap FIX-01 and FIX-02 describe blocks in an outer describe({ concurrency: false }) to serialize intra-file execution"
  - "SERIAL_FILES allowlist in run-tests.cjs: targeted approach that preserves concurrency=4 for the other 170+ test files"

patterns-established:
  - "Test files that rename/move shared repo directories must run in serial isolation from other test files"

requirements-completed: [FIX-03]

duration: 19min
completed: 2026-04-17
---

# Phase 5 Plan 1: Regression Coverage Summary

**8-test regression suite for hooks on-demand build passes; cross-file race condition fixed in run-tests.cjs; v1.36.0.b milestone closed with all three requirements validated**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-17T09:33:00Z
- **Completed:** 2026-04-17T09:52:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Full test suite (3933 parallel + 8 regression = 3941 tests) passes with 0 failures
- Fixed a race condition where FIX-02 tests saw "Installed hooks (bundled)" instead of "Installed hooks (built from source)" due to concurrent installer subprocesses in other test files rebuilding `hooks/dist/` while `hideHooksDist()` had renamed it away
- FIX-01, FIX-02, FIX-03 checked in REQUIREMENTS.md; traceability table updated to Complete
- ROADMAP.md Phase 4 (1/1) and Phase 5 (1/1) marked Complete 2026-04-17; v1.36.0.b milestone bullet checked and marked shipped
- PROJECT.md Validated section extended with FIX-02 and FIX-03 Phase 05 entries; Active section cleared

## Task Commits

1. **Task 1: Run full test suite and confirm regression test passes** - `6fa4c1d` (fix)
   - Outer `describe({ concurrency: false })` wrapper added to test file
   - `run-tests.cjs` updated to run hooks/dist-mutating test file serially after parallel batch

2. **Task 2: Update REQUIREMENTS.md, ROADMAP.md, and PROJECT.md** - `a5cdf10` (docs)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — Wrapped both describe blocks in outer `describe('bug-1924: hooks dist on-demand build', { concurrency: false })` to prevent intra-file concurrency races
- `scripts/run-tests.cjs` — Added `SERIAL_FILES` list; runs hooks/dist-mutating test file with `--test-concurrency=1` as a separate serial phase after all parallel tests
- `.planning/REQUIREMENTS.md` — FIX-01, FIX-02, FIX-03 changed from `[ ]` to `[x]`; traceability Status changed from Pending to Complete for all three
- `.planning/ROADMAP.md` — Phase 4 and Phase 5 phase list entries marked `[x]`; Phase 5 plans section updated with `[x] 05-01-PLAN.md`; progress table Phase 4 and 5 rows updated to `1/1 | Complete | 2026-04-17`; milestone bullet marked `[x]` and `shipped 2026-04-17`
- `.planning/PROJECT.md` — FIX-02 removed from Active; Active section set to `(none — all v1.36.0.b requirements validated)`; FIX-02 and FIX-03 added to Validated with Phase 05 references

## Decisions Made

- **Serial test isolation via SERIAL_FILES in run-tests.cjs:** Tests that rename/restore `hooks/dist/` (shared mutable filesystem state) must not run concurrently with other test files that also spawn installer subprocesses. Targeted approach preserves concurrency=4 for the other 170+ test files.
- **Outer describe wrapper:** Node test runner with `--test-concurrency=4` runs top-level describe blocks within a file concurrently. Wrapping FIX-01 and FIX-02 in an outer `describe({ concurrency: false })` serializes them within the file context.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed cross-file race condition in FIX-02 regression tests**
- **Found during:** Task 1 (Run full test suite)
- **Issue:** `npm test` showed FIX-02 tests failing intermittently — `stdout` contained "Installed hooks (bundled)" instead of "Installed hooks (built from source)". Root cause: `--test-concurrency=4` runs test files concurrently; `bug-1924-preserve-user-artifacts.test.cjs` spawns installer subprocesses that call `ensureHooksDist`, which calls `build-hooks.js` and recreates `hooks/dist/` while our test's `hideHooksDist()` had renamed it away. When our FIX-02 test then ran the installer, `hooks/dist/` was present (rebuilt by the other file's subprocess) → "bundled" path taken → assertion failure.
- **Fix:** (a) Wrapped FIX-01 and FIX-02 describe blocks in outer `describe({ concurrency: false })` to serialize intra-file execution. (b) Modified `run-tests.cjs` to run `bug-1924-ensure-hooks-dist-on-demand.test.cjs` as a serial phase (`--test-concurrency=1`) after all parallel tests complete — preventing any concurrent installer subprocesses from interfering.
- **Files modified:** `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs`, `scripts/run-tests.cjs`
- **Verification:** `npm test` runs 3941 tests with 0 failures across 5 consecutive runs
- **Committed in:** `6fa4c1d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix — tests were failing without it. The plan's threat model (T-05-02) incorrectly assessed the concurrency risk as "accept" based on the wrong assumption that Node serializes describe blocks within a file and that cross-file races were absent. The fix is minimal: two files changed, no production code modified.

## Issues Encountered

- The plan's threat model T-05-02 note ("tests are in the same describe group and Node's test runner serializes within a describe block") was incorrect — Node's test runner runs top-level describe blocks concurrently. The actual race was also cross-file, not just intra-file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v1.36.0.b milestone is complete. All requirements validated. No blockers.
- The `thamw-main` branch is ready for the next upstream merge or new milestone.

---

## Self-Check

### Files exist

- `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` — FOUND
- `scripts/run-tests.cjs` — FOUND
- `.planning/REQUIREMENTS.md` — FOUND
- `.planning/ROADMAP.md` — FOUND
- `.planning/PROJECT.md` — FOUND

### Commits exist

- `6fa4c1d` — FOUND (fix(05-01): resolve cross-file race in hooks/dist regression tests)
- `a5cdf10` — FOUND (docs(05-01): mark FIX-01/02/03 complete and close v1.36.0.b milestone)

## Self-Check: PASSED

---
*Phase: 05-regression-coverage*
*Completed: 2026-04-17*
