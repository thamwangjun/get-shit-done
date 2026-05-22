---
phase: 05-fix-version-detection-and-update-workflow
plan: "01"
subsystem: testing
tags: [install, version-detection, git, semver, sha]

# Dependency graph
requires: []
provides:
  - bin/install.js uses git rev-parse for SHA-based versioning instead of GitHub API curl
  - tests/version-detection.test.cjs covers INST-01 and INST-02
affects: [update-workflow, version-comparison, gsd-update]

# Tech tracking
tech-stack:
  added: []
  patterns: ["git rev-parse --short=7 HEAD for local SHA versioning", "non-SHA sentinel 'no-network' for git-unavailable fallback"]

key-files:
  created: [tests/version-detection.test.cjs]
  modified: [bin/install.js]

key-decisions:
  - "Use git rev-parse --short=7 HEAD directly (not GitHub API) — eliminates network dependency at install time"
  - "Initial gsdVersion is 'no-network' sentinel that intentionally fails grep -Eq '^[0-9a-f]{7}' gate"
  - "Regex guard /^[0-9a-f]{7}$/ validates git output before assignment (T-05-01 mitigation)"

patterns-established:
  - "Local git-based versioning: git rev-parse --short=7 HEAD with .trim() and regex guard"
  - "Non-SHA sentinel pattern: 'no-network' used to trigger 'unknown' path in downstream version checks"

requirements-completed: [INST-01, INST-02]

# Metrics
duration: 15min
completed: 2026-04-17
---

# Phase 05-01: Fix Version Detection Summary

**Replaced GitHub API curl with `git rev-parse --short=7 HEAD` in install.js, eliminating offline-fallback semver and adding INST-01/INST-02 test coverage**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-04-17
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced curl-to-GitHub-API block (lines 58–73) with local `git rev-parse --short=7 HEAD`
- Changed fallback from `pkg.version` (semver `1.36.0`) to `'no-network'` sentinel
- Added regex guard `/^[0-9a-f]{7}$/` to validate git output before assignment
- Created `tests/version-detection.test.cjs` with 4 passing tests covering INST-01 and INST-02

## Task Commits

1. **Task 1: Fix gsdVersion initialization** - `c8ef573` (fix)
2. **Task 2: Create version-detection tests** - `1a312ef` (test)

## Files Created/Modified
- `bin/install.js` — replaced curl block with git rev-parse, changed initial value to 'no-network'
- `tests/version-detection.test.cjs` — INST-01 and INST-02 static analysis tests (4 tests, all passing)

## Decisions Made
- Used `--short=7` to guarantee exactly 7 characters regardless of `core.abbrev` config
- `.trim()` included to remove trailing newline from execSync stdout
- `windowsHide: true` preserved (matched existing execSync options)
- Live install tests implemented as static analysis only — install() has broad side effects making live tests fragile

## Deviations from Plan
None — plan executed exactly as written. Static-analysis-only approach for live tests was pre-approved in the plan task description.

## Issues Encountered
- Test file was created in worktree but not committed by the executor agent — rescued and committed by orchestrator before worktree removal

## Next Phase Readiness
- install.js now writes a 7-char hex SHA to VERSION on `git install`, enabling the `grep -Eq '^[0-9a-f]{7}'` gate in update.md to succeed
- UPD-01/UPD-02 path unblocked — `/gsd-update` can now reach the "already on latest" branch

---
*Phase: 05-fix-version-detection-and-update-workflow*
*Completed: 2026-04-17*
