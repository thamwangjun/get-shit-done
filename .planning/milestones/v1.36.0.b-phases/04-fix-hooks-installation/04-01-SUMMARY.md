---
phase: 04-fix-hooks-installation
plan: 01
subsystem: installer
tags: [install, hooks, child_process, spawnSync, build-hooks]

# Dependency graph
requires: []
provides:
  - ensureHooksDist(src) helper in bin/install.js (line 213)
  - On-demand hooks/dist/ build triggered when absent at install time
  - Conditional success message: "built from source" vs "bundled"
affects: [hooks-installation, codex-install, claude-install]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - spawnSync with stdio pipe inside helper function to suppress subprocess output
    - Boolean return value from helper used for conditional console output

key-files:
  created: []
  modified:
    - bin/install.js

key-decisions:
  - "Used spawnSync (not execSync) so stdout is suppressed via stdio pipe while stderr is captured for error reporting"
  - "ensureHooksDist placed in helper region at line 213 — before OpenCode/Kilo helpers, after color constants and getDirName/getConfigDirFromHome"
  - "Call site placed before if (!isCodex && ...) block so both Claude and Codex copy paths benefit from guaranteed hooks/dist/"
  - "require('child_process') scoped inside function body per CRITICAL pitfall — module cache makes this cost-free"

patterns-established:
  - "Helper-function pattern: extract build trigger as named helper so both Claude and Codex install paths can call it without duplicating logic"
  - "Boolean-flag pattern: helper returns true/false indicating whether build was triggered; caller uses flag for conditional output"

requirements-completed: [FIX-01, FIX-02]

# Metrics
duration: 17min
completed: 2026-04-17
---

# Phase 04 Plan 01: Fix Hooks Installation Summary

**ensureHooksDist(src) helper added to bin/install.js: triggers on-demand build of hooks/dist/ when absent on fresh clone, surfacing `▶ Building hooks from source...` notice and conditional `✓ Installed hooks (built from source)` success message**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-04-17T07:36:00Z
- **Completed:** 2026-04-17T07:53:15Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added `ensureHooksDist(src)` helper at line 213 in the helper region of bin/install.js
- Helper detects missing hooks/dist/, runs scripts/build-hooks.js on-demand via spawnSync with suppressed stdout and captured stderr
- Call site `const builtFromSource = ensureHooksDist(src)` placed at line 5772, before the `if (!isCodex && ...)` block, so both Claude and Codex copy paths benefit
- Success message updated to ternary: `✓ Installed hooks (built from source)` or `✓ Installed hooks (bundled)` based on builtFromSource flag
- All existing tests pass: install-hooks-copy (24/24) and bug-1834-sh-hooks-installed (8/8)

## Task Commits

1. **Task 1: Add ensureHooksDist helper and call site** - `ffb54af` (feat)
2. **Task 2: Update success message to distinguish bundled vs built-from-source** - `25b8c21` (feat)

## Files Created/Modified
- `bin/install.js` - Added ensureHooksDist helper (lines 207–233), call site (line 5772), and updated success message ternary (line 5824)

## Key Implementation Details

**ensureHooksDist insertion point:** Line 213 (after `getConfigDirFromHome` at line 178, before `getOpencodeGlobalDir` at line 237 — within the helper region, well before line 500).

**Call site line:** 5772 — two lines before the `if (!isCodex && !isCopilot && ...)` block at line 5774. This guarantees hooks/dist/ exists for both the Claude copy block (inside the if-block) and the Codex copy block (~line 5940).

**Subprocess method chosen:** `spawnSync` (not `execSync`) because:
- `stdio: ['pipe', 'pipe', 'pipe']` suppresses build-hooks.js stdout output (individual "✓ Copying …" lines) per D-05
- stderr is captured in `result.stderr` for surfacing to user on build failure
- `result.status` gives the exit code cleanly without needing a try/catch

**Success message ternary:**
```javascript
console.log(`  ${green}✓${reset} Installed hooks (${builtFromSource ? 'built from source' : 'bundled'})`);
```
Line 5824. `builtFromSource` is `true` when on-demand build was triggered, `false` when hooks/dist/ was already present.

**Codex copy block:** Unchanged — its success message at line 5940 (`✓ Installed hooks`) has no path qualifier and was left as-is per the plan.

## Decisions Made
- Used `spawnSync` over `execSync`: cleaner stdio control (suppresses stdout, captures stderr) without needing try/catch for error propagation
- `require('child_process')` declared inside function body (not module scope) to avoid the critical pitfall where `execSync` is already scoped inside a try-block at line 61
- Helper placed after `getConfigDirFromHome` to stay in the same "small helper" region before the larger runtime-specific helper functions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-commit hook read-before-edit enforcement required reading the file before each Edit call; adapted by reading the relevant section before each edit. No impact on functionality.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Fix is complete. bin/install.js correctly handles fresh clone installs where hooks/dist/ is absent (gitignored).
- Phase 5 (regression test for dev-install path) can proceed — the fix is in place to test against.
- Manual smoke test (optional): rename hooks/dist/ temporarily, run installer, confirm `▶ Building hooks from source...` and `✓ Installed hooks (built from source)` appear in output.

---
*Phase: 04-fix-hooks-installation*
*Completed: 2026-04-17*
