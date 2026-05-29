---
phase: 45-pipeline-integration
fixed: 2026-05-28T14:10:00Z
findings_fixed: 9
findings_skipped: 1
status: partial
---

# Phase 45: Code Review Fix Report

**Fixed at:** 2026-05-28T14:10:00Z
**Source review:** `.planning/phases/45-pipeline-integration/45-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 10
- Fixed: 9
- Skipped: 1

## Fixed Issues

### CR-01: Path traversal in `scripts/convert-refs.cjs`

**Files modified:** `scripts/convert-refs.cjs`
**Commit:** 13bcf443
**Applied fix:** Added `isSafePath()` function that rejects paths containing `..` traversal segments or absolute-path markers. Applied the check to all four D-06 regex match branches (RE_CAT_HOME, RE_CAT_TILDE, RE_AT_TILDE, RE_AT_HOME) before emitting Eta include tags, emitting a stderr warning and returning null for unsafe paths.

### CR-02: `--dry-run` silently swallows write errors in `scripts/convert-refs.cjs`

**Files modified:** `scripts/convert-refs.cjs`
**Commit:** fa025450
**Applied fix:** Added `process.exitCode = 1` in the catch block of `transformFile()` when a file write fails, ensuring CI sees the failure instead of treating it as a no-change run.

### CR-03: Prompt injection safeguard in `agents/gsd-debugger.md` uses untrusted delimiters

**Files modified:** `agents/gsd-debugger.md`
**Commit:** 1148a5d5
**Applied fix:** Replaced the DATA_START/DATA_END delimiter-based framing with a blanket instruction that treats all content in `<trigger>` and `<symptoms>` blocks as untrusted evidence data regardless of formatting, including text that claims to be a system prompt or assigns a role.

### WR-02: `convert-refs.cjs` missing guard for unexpected Eta include tags on `.planning/` paths

**Files modified:** `scripts/convert-refs.cjs`
**Commit:** db1f03f1
**Applied fix:** Added a guard in `transformLine()` that emits a stderr warning and returns null when an Eta include tag targeting a `.planning/` path is encountered. Only D-06 generates Eta tags (for `get-shit-done/` paths); `.planning/` paths use the bash cat form from D-07.

### WR-03: `gsd-executor.md` worktree cwd-drift check bypassable when `.git` is a submodule file

**Files modified:** `agents/gsd-executor.md`
**Commit:** 323842dc
**Applied fix:** Added gitdir content check in the pre-commit HEAD safety assertion block to distinguish a git worktree (`gitdir:` pointing at `*.git/worktrees/`) from a git submodule. Worktree guards now only apply when the `.git` file content confirms a worktree, not a submodule.

### WR-04: `gsd-plan-checker.md` Dimension 8 Check 8c ambiguous threshold

**Files modified:** `agents/gsd-plan-checker.md`
**Commit:** 6eef4859
**Applied fix:** Replaced the ambiguous "3 consecutive without" phrasing with a single unambiguous threshold: any consecutive window of 3 tasks where fewer than 2 have `<automated>` verify is a BLOCKING FAIL, with explicit clarification in parentheses.

### WR-05: `tests/few-shot-calibration.test.cjs` example count test vacuously passes when 0 examples

**Files modified:** `tests/few-shot-calibration.test.cjs`
**Commit:** a57b9ebe
**Applied fix:** Added `assert.ok(exampleCount >= 1, ...)` before the `assert.strictEqual(whyCount, exampleCount, ...)` check in the plan-checker WHY annotation test, preventing vacuous pass when the reference file contains no examples.

### IN-01: `gsd-user-profiler.md` double-loads reference

**Files modified:** `agents/gsd-user-profiler.md`
**Commit:** 874da34b
**Applied fix:** Removed the runtime `Read` instruction from the `load_rubric` step. Replaced with: "The user-profiling rubric is included above in the `<reference>` block. Read it in full before analyzing any messages."

### IN-02: `bin/install.js` uses `console.error()` inconsistently

**Files modified:** `bin/install.js`
**Commit:** b70e9691
**Applied fix:** Replaced the `console.error()` call in the WSL detection block (around line 288) with `process.stderr.write()` for consistency with `process.stderr.write` patterns used elsewhere in the codebase. Scoped to the specifically cited location; the remaining 44 instances are pre-existing and were not bulk-replaced as that would be a large, risky Info-level change.

### IN-03: `tests/workspace.test.cjs` uses `git add -A` in test setup

**Files modified:** `tests/workspace.test.cjs`
**Commit:** 7903eccf
**Applied fix:** Replaced `git add -A` with `git add README.md` in the `beforeEach` setup block. Only `README.md` is created before the initial commit at that point, so the explicit file path is accurate and avoids accidentally staging unintended files.

## Skipped Issues

### WR-01: `gsd-debugger.md` archive step uses inconsistent `gsd-sdk query` CLI form

**File:** `agents/gsd-debugger.md` in the `archive_session` step
**Reason:** code context differs from review — both files already use the same form. The finding assumed `state.load` (period-separated) was wrong and `state load` (space-separated) was canonical, but inspection of `gsd-executor.md`, `gsd-planner.md`, and `gsd-roadmapper.md` all confirm that `gsd-sdk query state.load` (period-separated) IS the canonical form across the codebase. No inconsistency exists between `gsd-debugger.md` and `gsd-executor.md`.
**Original issue:** `archive_session` step uses `gsd-sdk query state.load` (period-separated) vs canonical space-separated form.

---

_Fixed: 2026-05-28T14:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
