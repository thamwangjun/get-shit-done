---
quick_id: "260525-o1n"
slug: "convert-commands-at-notation"
status: complete
date: "2026-05-25"
commits:
  - 4ba5dde1
  - 9892c377
  - 8e3f1d31
  - 74330028
---

# Quick Task 260525-o1n: Convert @ notation in commands/gsd/

## Summary

Converted all `@` file-reference notation in `commands/gsd/` (117 occurrences across 54 files) to shell-cat form `` !`cat $HOME/...` ``. Added regression tests to enforce the format.

## What Was Done

**Task 1: Wrote failing test** (`tests/command-at-notation.test.cjs`) — commit `4ba5dde1`
- Detects any line starting with `@` followed by a path character (`~`, `$`, `.`, `/`) in `commands/gsd/*.md`
- Initially failed: 117 violations detected across 54 files
- Two test cases: `@` presence check (failed) and shell-cat format check (passed)

**Task 2: Applied conversion** (54 `commands/gsd/*.md` files) — commit `4ba5dde1`
- `` @~/.claude/path `` → `` !`cat $HOME/.claude/path` ``
- `` @$HOME/.claude/path `` → `` !`cat $HOME/.claude/path` ``
- `` @.planning/path `` → `` !`cat .planning/path` ``
- Closing backtick added to each converted line

**Task 3: Updated dependent tests** — commit `4ba5dde1`
- `tests/plan-review-convergence.test.cjs`: relaxed exact `@$HOME/...` assertion to path-tail check
- `tests/ultraplan-phase.test.cjs`: relaxed exact `@~/.claude/...` assertion to path-tail check
- `tests/workspace.test.cjs`: updated `executionContextIncludes()` helper to parse both `@` and `` !`cat ` `` formats

**Fix: Removed spurious space between `!` and backtick** — commit `9892c377`
- Initial `sed` replacement wrote `` ! `cat `` (with space) instead of the correct `` !`cat ``
- Re-ran `sed` across all 55 affected files to remove the space
- Updated test regex and workspace helper to match corrected form

**Task 4: Added `!` format correctness guard** — commits `8e3f1d31`, `74330028`
- Test `'all ! notation lines use !`...` form (no space, closes with backtick)'` catches:
  - Lines matching `^! \`` — space before backtick
  - Lines matching `^!`` but not ending with `` ` `` — missing closing backtick

## Lessons

The space error came from writing the `sed` replacement string by hand rather than copying the exact format from the task instructions. The new format guard test would have caught this immediately had it existed first.

## Outcome

- `tests/command-at-notation.test.cjs`: 3/3 pass
- `tests/workspace.test.cjs`: 0 failures (was 3 after initial conversion)
- Full test suite: clean (pre-existing `windows-test-parity-guard` failure unrelated)
