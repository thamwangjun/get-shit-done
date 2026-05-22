---
phase: 33-positive-framing-pass
fixed_at: 2026-05-14T09:30:00Z
review_path: .planning/phases/33-positive-framing-pass/33-REVIEW.md
iteration: 1
fix_scope: all
findings_in_scope: 7
fixed: 5
skipped: 2
status: partial
---

# Phase 33: Code Review Fix Report

**Fixed at:** 2026-05-14T09:30:00Z
**Source review:** .planning/phases/33-positive-framing-pass/33-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 5
- Skipped: 2

## Fixed Issues

### WR-01: `cmdStateUpdateProgress` uses plan-only percent formula

**Files modified:** `get-shit-done/bin/lib/state.cjs`
**Commit:** f0bcf217
**Applied fix:** Added `completedPhases` counter to the scan loop, computed `roadmapTotal` via `getMilestonePhaseFilter(cwd).phaseCount` (matching `cmdStateSync` logic at line 1627), and replaced the raw `Math.round(totalSummaries / totalPlans * 100)` formula with `computeProgressPercent(totalSummaries, totalPlans, completedPhases, roadmapTotal)`.

### WR-02: `reapply-patches.md` OPENCODE runtime block uses `elif` chain instead of independent `if` guards

**Files modified:** `get-shit-done/workflows/reapply-patches.md`
**Commit:** bd696269
**Applied fix:** Converted the three-branch `if/elif/elif` OPENCODE block (lines 43-58) to three independent `if [ -z "$PATCHES_DIR" ]` guards, matching the structure used by the GEMINI and CODEX blocks. Each candidate path is now checked independently so a set-but-invalid `OPENCODE_CONFIG_DIR` no longer silently prevents the `XDG_CONFIG_HOME` fallback from running.

### WR-03: `secure-phase.md` TEXT_MODE detection spliced without structural separator

**Files modified:** `get-shit-done/workflows/secure-phase.md`
**Commit:** 45f4c7ea
**Applied fix:** Added explicit `**If TEXT_MODE is active:**` and `**If TEXT_MODE is inactive:**` labeled branches to Step 4, each with their own numbered option list. The TEXT_MODE detection sentence was separated from the branching options so the conditional behaviour is unambiguous for the executing agent.

### IN-01: Three tests pass unused `(t)` parameter

**Files modified:** `tests/bug-3242-state-update-progress-trample.test.cjs`
**Commit:** 7733a2dc
**Applied fix:** Replaced `(t) =>` with `() =>` for the three affected tests at lines 107, 201, and 254.

### IN-02: `gsd-executor.md` duplicate bullet in `<deviation_rules>`

**Files modified:** `agents/gsd-executor.md`
**Commit:** a2466a53
**Applied fix:** Removed the shorter first duplicate bullet "Continue to the next task (or return checkpoint if blocked)", keeping only the one with the clarifying clause "— the 3-attempt limit is the stop signal".

## Skipped Issues

### IN-03: `reapply-patches.md` `expand_home` inline duplication — minor, not a bug

**File:** `get-shit-done/workflows/reapply-patches.md:16-21`
**Reason:** REVIEW.md explicitly states "No action required." The `expand_home` function is correct and the inline placement is appropriate for a workflow instruction file.

### IN-04: `bug-3320-planner-deep-work-rules.test.cjs` reads `plan-phase.md` path not in reviewed file set

**File:** `tests/bug-3320-planner-deep-work-rules.test.cjs:14`
**Reason:** REVIEW.md explicitly states "No code change needed." This is a process note about future review scope, not a code defect.

---

_Fixed: 2026-05-14T09:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
