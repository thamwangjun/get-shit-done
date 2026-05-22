---
phase: 32-quick-test-fixes
plan: 01
subsystem: testing
tags: [test-fixes, managed-hooks, platform-gate, affirmative-replacements]

# Dependency graph
requires:
  - phase: 31-framing-scanner-expansion
    provides: test infrastructure; negative-framing-scan.test.cjs
provides:
  - MANAGED_HOOKS array includes gsd-update-banner.js (alphabetically ordered)
  - Windows npm spawn platform gate tests skipped with fork-architecture comment
  - extract-learnings.md path uses hyphen (corrected from underscore)
affects: [33-framing-violations-upstream, 34-final-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "describe.skip with inline comment to document fork-architecture test skips"

key-files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - tests/gsd-check-update-worker-platform-gate.test.cjs
    - tests/phase-30-affirmative-replacements.test.cjs

key-decisions:
  - "Windows npm spawn tests skipped (not deleted) with inline comment explaining fork replaces npm-based update architecture with GitHub API"
  - "extract-learnings.md path corrected throughout: test name, readFile call, and assert message all use hyphen for consistency"

patterns-established:
  - "Fork-divergence test skips: use describe.skip with inline comment citing the architectural reason (not silent omission)"

requirements-completed: [HOOKS-01, TEST-02, PATH-01]

# Metrics
duration: 10min
completed: 2026-05-13
---

# Phase 32 Plan 01: Quick Test Fixes Summary

**Three targeted single-file surgical fixes clear HOOKS-01, TEST-02, and PATH-01 test failures introduced by the v1.41.2 upstream merge**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-13T10:50:00Z
- **Completed:** 2026-05-13T11:00:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- MANAGED_HOOKS array now includes `gsd-update-banner.js` alphabetically between `gsd-check-update.js` and `gsd-context-monitor.js`; managed-hooks test suite passes (3/3 subtests)
- Windows npm spawn platform gate describe block changed to `describe.skip` with fork-architecture comment; 4 subtests now show as skipped rather than failing on POSIX CI
- `extract_learnings.md` (underscore) corrected to `extract-learnings.md` (hyphen) in test name, readFile call, and assert message; phase-30 affirmative replacements subtest passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gsd-update-banner.js to MANAGED_HOOKS** - `d635d382` (fix)
2. **Task 2: Skip Windows npm spawn platform gate tests** - `16bbf423` (fix)
3. **Task 3: Fix stale underscore path in phase-30 test** - `1ffd76cf` (fix)

## Files Created/Modified
- `hooks/gsd-check-update-worker.js` - Added `'gsd-update-banner.js'` to MANAGED_HOOKS array (1 line insertion)
- `tests/gsd-check-update-worker-platform-gate.test.cjs` - Changed `describe(` to `describe.skip(` with 2-line fork-architecture comment
- `tests/phase-30-affirmative-replacements.test.cjs` - Replaced 3 occurrences of `extract_learnings.md` with `extract-learnings.md`

## Decisions Made
- Skipped Windows npm spawn tests rather than deleting them: the tests lock a legitimate upstream contract (PR #3102 platform-gate) that may apply to the upstream codebase. Using `describe.skip` with an explanatory comment is the appropriate fork-divergence pattern.
- Updated all three occurrences in the phase-30 test (test name, readFile path, assert message) for consistency — mismatched descriptions cause confusion per plan guidance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All three fixes were single-line or minimal-change operations that matched the plan's exact specifications. The remaining test failures in the full suite are pre-existing framing violations from upstream v1.41.2 (affects agent/command/workflow files), which are addressed in Phase 33.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HOOKS-01, TEST-02, PATH-01 are cleared; test suite is ready for Phase 33 work
- Remaining failures are framing violations in upstream-verbatim files (`edit-phase.md`, `secure-phase.md`, and negative-framing corpus scans) — Phase 33 scope

---
*Phase: 32-quick-test-fixes*
*Completed: 2026-05-13*
