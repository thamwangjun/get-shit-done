---
id: 260531-lpp
title: Switch checkpoints.md and git-integration.md eta includes to @-references
type: quick
status: complete
created: 2026-05-31
completed: 2026-05-31
---

# Quick Task 260531-lpp: Summary

## Outcome

Converted two shared reference files from eta `<%~ include() %>` (inlined at
render time) to runtime `@~/.claude/...` references, and added when-to-consult
instructions in each consuming workflow.

## Changes

### Task 1 — checkpoints.md → @-reference
- `get-shit-done/workflows/execute-phase.md:616`: replaced
  `<%~ include('get-shit-done/references/checkpoints.md') %>` with
  `@~/.claude/get-shit-done/references/checkpoints.md`.
- Added a `<reference_usage>` block after `</execution_context>` directing the
  subagent to read checkpoints.md when a plan task carries a checkpoint
  (`none`/`human-verify`/`decision`/`human-action`) before acting on it.

### Task 2 — git-integration.md → @-reference
- `get-shit-done/workflows/execute-plan.md:9`: replaced
  `<%~ include('get-shit-done/references/git-integration.md') %>` with
  `@~/.claude/get-shit-done/references/git-integration.md` inside
  `<required_reading>`.
- Added a sentence instructing the executor to read it before any commit/branch
  (atomic-commit sequence, message conventions, branch/worktree rules).

## Deviations from Plan

None — plan executed exactly as written. Note the original request named the
command file `commands/gsd/execute-phase.md`; investigation showed the includes
were in the workflow files (`execute-phase.md` and the nested `execute-plan.md`),
which were edited per user confirmation.

## Verification

- `node --test tests/eta-template-syntax.test.cjs` — passes (1/1).
- `command grep -n "checkpoints.md" get-shit-done/workflows/execute-phase.md` —
  shows @-reference, no eta include.
- `command grep -n "git-integration.md" get-shit-done/workflows/execute-plan.md`
  — shows @-reference, no eta include.
