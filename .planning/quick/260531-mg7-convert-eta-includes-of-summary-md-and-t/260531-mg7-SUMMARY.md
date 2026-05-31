---
phase: 260531-mg7
plan: 01
subsystem: workflows
tags: [eta, references, context-budget, execute-phase]
requires: []
provides: [execute-phase lazy-loaded summary.md/tdd.md @-refs]
affects: [get-shit-done/workflows/execute-phase.md]
tech-stack:
  added: []
  patterns: [lazy @-ref include over eager eta include]
key-files:
  created: []
  modified: [get-shit-done/workflows/execute-phase.md]
decisions: []
metrics:
  duration: ~3m
  completed: 2026-05-31
---

# Phase 260531-mg7 Plan 01: Convert summary.md/tdd.md eta includes to @-refs Summary

Converted the eager eta includes of `summary.md` and `tdd.md` in the `<execution_context>` block of `execute-phase.md` to lazy-load `@~/.claude/...` @-ref notation, and documented consult-when guidance for both in `<reference_usage>`.

## What Was Done

- **EDIT 1** — In `<execution_context>`, replaced `<%~ include('get-shit-done/templates/summary.md') %>` with `@~/.claude/get-shit-done/templates/summary.md` and `<%~ include('get-shit-done/references/tdd.md') %>` with `@~/.claude/get-shit-done/references/tdd.md`. The `execute-plan.md`, `worktree-path-safety.md`, and `executor-examples.md` lines are unchanged.
- **EDIT 2** — Extended `<reference_usage>` with one affirmative consult-when sentence each for `summary.md` (writing the SUMMARY.md structure/frontmatter) and `tdd.md` (TDD-flagged/behavior-adding tasks, red-green-refactor cycle), matching the existing checkpoints.md prose style.

Frontmatter untouched; no `{%~` syntax introduced.

## Verification

- `command grep` confirms both new @-refs present and no `include('...summary.md')`/`include('...tdd.md')` remains.
- `node --test tests/eta-template-syntax.test.cjs tests/agent-frontmatter.test.cjs` — 141 pass, 0 fail.

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- caee50fa: refactor(260531-mg7-01): lazy-load summary.md/tdd.md via @-refs in execute-phase

## Self-Check: PASSED

- FOUND: get-shit-done/workflows/execute-phase.md (modified)
- FOUND commit: caee50fa
