---
quick_id: "260525-o1n"
slug: "convert-commands-at-notation"
status: complete
date: "2026-05-25"
---

# Quick Task 260525-o1n: Convert @ notation in commands/gsd/

## Summary

Converted all `@` file-reference notation in `commands/gsd/` (117 occurrences across 54 files) to shell-cat form `! \`cat $HOME/...\``.

## What Was Done

**Task 1: Wrote failing test** (`tests/command-at-notation.test.cjs`)
- Detects any line starting with `@` followed by a path character (`~`, `$`, `.`, `/`) in `commands/gsd/*.md`
- Initially failed: 117 violations detected across 54 files
- Two test cases: presence check (failed) and format check (passed)

**Task 2: Applied conversion** (54 `commands/gsd/*.md` files)
- `@~/.claude/path` → `` ! `cat $HOME/.claude/path` ``
- `@$HOME/.claude/path` → `` ! `cat $HOME/.claude/path` ``
- `@.planning/path` → `` ! `cat .planning/path` ``
- Closing backtick added to each converted line

**Task 3: Updated dependent tests**
- `tests/plan-review-convergence.test.cjs`: updated assertion from exact `@$HOME/...` check to path-tail check
- `tests/ultraplan-phase.test.cjs`: updated assertion from exact `@~/.claude/...` check to path-tail check
- `tests/workspace.test.cjs`: updated `executionContextIncludes()` helper to parse both `@` and `` ! `cat ` `` formats

## Outcome

- `tests/command-at-notation.test.cjs`: 2/2 pass
- `tests/workspace.test.cjs`: 0 failures (was 3)
- Full test suite: clean
