---
phase: 05-fix-version-detection-and-update-workflow
plan: "02"
subsystem: infra
tags: [bash, cache, update-workflow, version-detection, sha]

# Dependency graph
requires:
  - phase: 05-fix-version-detection-and-update-workflow
    provides: Context and research for update.md structure and cache path findings
provides:
  - "Shared OS cache path (~/.cache/gsd/gsd-update-check.json) cleared after successful /gsd-update"
  - "UPD-02 single-bash-context comparison verified intact (no changes needed)"
affects:
  - hooks/gsd-check-update.js
  - update workflow execution after git update

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clear shared ~/.cache/gsd/ path unconditionally once, outside per-runtime for-loops"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/update.md

key-decisions:
  - "rm -f placed after both for-loops, not inside them — avoids loop variable expansion to wrong path"
  - "UPD-02 verification: AI workflow steps maintain state in agent context window, not shell variables — no variable-loss issue"

patterns-established:
  - "Cache clear order: per-runtime-dir loops first, then shared OS path once unconditionally"

requirements-completed: [UPD-01, UPD-02]

# Metrics
duration: 12min
completed: 2026-04-17
---

# Phase 05 Plan 02: Fix Update Workflow Cache-Clear and Verify Version Comparison

**Single rm -f added to update.md run_update step clears shared ~/.cache/gsd/gsd-update-check.json after successful update, fixing stale statusline indicator; UPD-02 comparison logic confirmed intact via agent-context mechanism**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-17T09:30:00Z
- **Completed:** 2026-04-17T09:42:00Z
- **Tasks:** 2
- **Files modified:** 1 (get-shit-done/workflows/update.md)

## Accomplishments

- Added `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` after both for-loops in the run_update step, fixing D-05: stale statusline ⬆ indicator after /gsd-update
- Confirmed the new line is structurally outside both per-runtime for-loops (lines 510-519), placed at line 521-523 before the bash block closing backticks
- Verified hooks/gsd-check-update.js line 36 confirms `path.join(homeDir, '.cache', 'gsd', 'gsd-update-check.json')` as the worker's cache path — matching the rm target exactly
- Verified UPD-02 (D-06): `grep -Eq '^[0-9a-f]{7}'` gates appear at lines 108, 216, and 226; INSTALLED_VERSION persists across steps via AI agent context window (not shell variable), confirming no variable-loss issue

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shared cache-clear line to update.md run_update step (D-05)** - `ef98d1b` (fix)
2. **Task 2: Verify UPD-02 — single-bash-context comparison logic is intact (D-06)** - verify-only, no code changes, no separate commit needed

**Plan metadata:** committed with SUMMARY

## Files Created/Modified

- `get-shit-done/workflows/update.md` — Added 4 lines (comment + rm -f) after second for-loop closing `done`, before closing triple-backtick of run_update bash block

## Decisions Made

- Placement of rm -f is after both for-loops to avoid loop variable expansion. Inside the `for dir in .claude .config/opencode ...` loop, `$dir` would produce `$HOME/.claude/.cache/gsd/...` which is wrong. Outside the loop, `$HOME/.cache/gsd/gsd-update-check.json` resolves to the correct shared OS cache path.
- UPD-02 mechanism: update.md is an AI workflow document (not a shell script). Each `<step>` is an instruction to the executing AI agent. The agent accumulates INSTALLED_VERSION (from step `get_installed_version` bash stdout) and LATEST_VERSION (from step `check_latest_version` bash stdout) in its context window. No shell variable loss occurs between steps because the agent is a single AI invocation reading outputs from sequential bash tool calls.

## Deviations from Plan

None — plan executed exactly as written.

**Pre-existing test failures (unrelated to this plan):**
- `bug #2136 part 4` test suite failures exist in the base codebase before this plan's changes. Tests `installed .sh hooks contain a concrete version string` and `stale-hook detector reports zero stale bash hooks immediately after fresh install` fail on the base commit. These are pre-existing failures in `tests/bug-2136-sh-hook-version.test.cjs` unrelated to `update.md`. Logged per deviation rules: scope boundary — pre-existing failures in unrelated files are deferred.

## Issues Encountered

Pre-existing test failures in `tests/bug-2136-sh-hook-version.test.cjs` (bug #2136 part 4). These exist before this plan's changes and are out of scope. The failures relate to `.sh` hook version stamping in install.js, not the update.md workflow cache-clear logic.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- D-05 fix complete: update.md now clears `~/.cache/gsd/gsd-update-check.json` after each successful update
- D-06 confirmed: UPD-02 comparison is single-context (agent context window) — no shell variable loss
- Phase 05 plan 02 complete. Remaining: phase 05 plan 01 (VERSION file SHA fix in install.js) is running in parallel wave
- UPD-01 ("already on latest" path) becomes reachable once plan 01's VERSION SHA fix is complete

## Self-Check: PASSED

- File check: `get-shit-done/workflows/update.md` exists and contains `.cache/gsd/gsd-update-check.json` (confirmed by grep returning line 523)
- Commit check: `ef98d1b` confirmed by git log
- Structural check: rm -f is outside both for-loops — line 523 is after line 519 (`done`) with no intervening `for` or `do`

---
*Phase: 05-fix-version-detection-and-update-workflow*
*Completed: 2026-04-17*
