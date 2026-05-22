---
phase: 33-positive-framing-pass
reviewed: 2026-05-14T09:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - agents/gsd-executor.md
  - agents/gsd-planner.md
  - commands/gsd/discuss-phase.md
  - get-shit-done/bin/lib/state.cjs
  - get-shit-done/workflows/edit-phase.md
  - get-shit-done/workflows/reapply-patches.md
  - get-shit-done/workflows/secure-phase.md
  - tests/bug-3242-state-update-progress-trample.test.cjs
  - tests/bug-3320-planner-deep-work-rules.test.cjs
  - tests/edit-phase.test.cjs
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-14T09:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase delivered a positive-framing pass, renaming `<anti_patterns>` blocks to `<expected_patterns>` throughout workflow files and updating associated tests. The implementation is coherent and focused. The agent and workflow source files read consistently.

Three quality defects were found:

1. `cmdStateUpdateProgress` in `state.cjs` still uses the old plan-only percent formula, inconsistent with the `computeProgressPercent` fix introduced for #3242 Bug B. The `state.update-progress` command path is the odd one out — `buildStateFrontmatter` and `cmdStateSync` were updated, this one was not.
2. A structural bug in `reapply-patches.md` — the `elif` chain for the OPENCODE runtime block accidentally re-uses `$XDG_CONFIG_HOME` in the same `elif` chain, meaning the kilo/opencode/XDG branches are mutually exclusive when they should be independent `if` checks.
3. `secure-phase.md` has an instruction paragraph spliced mid-sentence where the TEXT_MODE detection sentence runs directly into the `AskUserQuestion` instruction on the same level, making the conditional behaviour ambiguous for the executing agent.

---

## Warnings

### WR-01: `cmdStateUpdateProgress` uses plan-only percent formula, inconsistent with #3242 Bug B fix

**File:** `get-shit-done/bin/lib/state.cjs:467`

**Issue:** `cmdStateUpdateProgress` calculates `percent` with the raw plan-only formula:

```js
const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
```

This is exactly the formula that #3242 Bug B identified as incorrect when ROADMAP declares future phases that have no disk dirs. `buildStateFrontmatter` (line 906) and `cmdStateSync` (line 1649) were both updated to call `computeProgressPercent(totalDiskSummaries, totalDiskPlans, diskCompletedPhases, syncTotalPhases)`. `cmdStateUpdateProgress` was not. When `gsd-sdk query state.update-progress` is called (the executor calls it after every plan), the Progress body bar will display the inflated 100% that #3242 was supposed to fix.

The function also does not count `completedPhases` at all, so there is nothing to pass to `computeProgressPercent` without also adding a phase-complete count, matching what `cmdStateSync` already computes on lines 1587–1620.

**Fix:** Count `completedPhases` in the scan loop (alongside `totalPlans`/`totalSummaries`), read the ROADMAP-declared phase count via `getMilestonePhaseFilter(cwd).phaseCount` (matching lines 1627–1633 in `cmdStateSync`), then replace the raw formula with the shared helper:

```js
// inside the loop:
if (plans > 0 && summaries >= plans) completedPhases++;

// after the loop:
const isDirInMilestone = getMilestonePhaseFilter(cwd);
const roadmapTotal = isDirInMilestone.phaseCount > 0
  ? Math.max(phaseDirs.length, isDirInMilestone.phaseCount)
  : phaseDirs.length;
const percent = (() => {
  const p = computeProgressPercent(totalSummaries, totalPlans, completedPhases, roadmapTotal);
  return p !== null ? p : 0;
})();
```

---

### WR-02: `reapply-patches.md` OPENCODE runtime block uses `elif` where it should use `if`, causing silent fallback skip when `OPENCODE_CONFIG_DIR` is set but the candidate dir does not exist

**File:** `get-shit-done/workflows/reapply-patches.md:43-58`

**Issue:** The OPENCODE runtime detection block (lines 43–58) is structured as:

```bash
if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG_DIR" ]; then
  ...
elif [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG" ]; then
  ...
elif [ -z "$PATCHES_DIR" ] && [ -n "$XDG_CONFIG_HOME" ]; then
  ...
fi
```

When `$OPENCODE_CONFIG_DIR` is set but the candidate directory does not exist (so `PATCHES_DIR` remains empty), the shell falls through to the `elif` branches only if the `if` condition was `false`. But the `if` condition was `true` (because `OPENCODE_CONFIG_DIR` is non-empty) — so the `elif` branches are skipped entirely. A user who has `OPENCODE_CONFIG_DIR` set but patches in the `$XDG_CONFIG_HOME/opencode/gsd-local-patches` fallback path will never find their patches. The KILO block immediately above (lines 26–41) has the same structure but is a separate `if` statement, so that path is not affected.

Contrast with how the GEMINI (line 60) and CODEX (line 67) blocks are structured as independent `if [ -z "$PATCHES_DIR" ]` guards.

**Fix:** Convert the OPENCODE block to three separate `if` guards instead of an `if/elif/elif` chain:

```bash
if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG_DIR" ]; then
  candidate="$(expand_home "$OPENCODE_CONFIG_DIR")/gsd-local-patches"
  if [ -d "$candidate" ]; then PATCHES_DIR="$candidate"; fi
fi
if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG" ]; then
  candidate="$(dirname "$(expand_home "$OPENCODE_CONFIG")")/gsd-local-patches"
  if [ -d "$candidate" ]; then PATCHES_DIR="$candidate"; fi
fi
if [ -z "$PATCHES_DIR" ] && [ -n "$XDG_CONFIG_HOME" ]; then
  candidate="$(expand_home "$XDG_CONFIG_HOME")/opencode/gsd-local-patches"
  if [ -d "$candidate" ]; then PATCHES_DIR="$candidate"; fi
fi
```

---

### WR-03: `secure-phase.md` TEXT_MODE detection instruction is spliced without a structural separator before `AskUserQuestion`, creating ambiguous branching for the executing agent

**File:** `get-shit-done/workflows/secure-phase.md:82-83`

**Issue:** Step 4 reads:

```
**Text mode (...):** Set `TEXT_MODE=true` if `--text` is present ... When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numbered list...
Call AskUserQuestion with threat table and options:
```

The `TEXT_MODE` instruction paragraph and the unconditional `Call AskUserQuestion` imperative are placed on consecutive lines with no structural separation (no blank line, no conditional label). An executing agent reads this as: (a) detect TEXT_MODE, and then (b) always call `AskUserQuestion`. The intended conditional — "if TEXT_MODE, use plain-text list; otherwise, call `AskUserQuestion`" — is expressed only through prose, which is easy to misread as two sequential unconditional steps.

**Fix:** Add explicit conditional structure so the branching is unambiguous:

```markdown
**If TEXT_MODE is active:** Replace `AskUserQuestion` with a plain-text numbered list; ask the user to type their choice.

**If TEXT_MODE is inactive:** Call AskUserQuestion with:
1. "Verify all open threats" → Step 5
2. "Accept all open — document in accepted risks log" → add to SECURITY.md accepted risks, set all CLOSED, Step 6
3. "Cancel" → exit
```

---

## Info

### IN-01: Three tests pass unused `(t)` parameter

**File:** `tests/bug-3242-state-update-progress-trample.test.cjs:107,201,254`

**Issue:** Tests at lines 107, 201, and 254 declare `(t)` as the test callback parameter but never use it (e.g., no `t.mock`, `t.diagnostic`, or sub-assertions through `t`). This is harmless but leaves a dead parameter that implies the test uses sub-test features when it does not.

**Fix:** Replace `(t) =>` with `() =>` for the three affected tests.

---

### IN-02: `gsd-executor.md` `<deviation_rules>` section has duplicate sentence at line 209

**File:** `agents/gsd-executor.md:208-210`

**Issue:** Lines 208–210 contain a duplicate sentence:

```
- Continue to the next task (or return checkpoint if blocked)
- Continue to the next task (or return checkpoint if blocked) — the 3-attempt limit is the stop signal
```

The first bullet is identical to the second (minus the clarifying clause). The duplicate adds no information.

**Fix:** Remove the first (shorter) duplicate bullet, keeping only: `"Continue to the next task (or return checkpoint if blocked) — the 3-attempt limit is the stop signal."`

---

### IN-03: `reapply-patches.md` `expand_home` function is defined locally but duplicated work — minor, not a bug

**File:** `get-shit-done/workflows/reapply-patches.md:16-21`

**Issue:** The `expand_home` function is embedded inline in the detection script block. It is simple and correct. This is an info-level note: if the function is shared across multiple scripts, a shared library call is cleaner, but since this is a workflow instruction file (not shell script source), the duplication risk is only in future edits.

**Fix:** No action required. Document it with a comment if the function is later extracted.

---

### IN-04: `bug-3320-planner-deep-work-rules.test.cjs` reads `plan-phase.md` but the path is not in the reviewed file set

**File:** `tests/bug-3320-planner-deep-work-rules.test.cjs:14`

**Issue:** `PLAN_PHASE_WORKFLOW` is set to `path.join(ROOT, 'get-shit-done', 'workflows', 'plan-phase.md')` and the tests assert on `deep_work_rules` content within it. The `plan-phase.md` workflow was not included in this review's file set, so assertions about its content cannot be verified by this review. This is not a bug in the test itself — the path is correct and the test structure is sound — but it means any future changes to `plan-phase.md` must keep the `deep_work_rules` block in sync with the contract words this test pins.

**Fix:** No code change needed. Ensure `plan-phase.md` is included in future reviews when `bug-3320-planner-deep-work-rules.test.cjs` is in scope.

---

_Reviewed: 2026-05-14T09:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
