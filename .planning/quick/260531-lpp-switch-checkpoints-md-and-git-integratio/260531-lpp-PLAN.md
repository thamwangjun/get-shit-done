---
id: 260531-lpp
title: Switch checkpoints.md and git-integration.md eta includes to @-references
type: quick
created: 2026-05-31
---

# Quick Task 260531-lpp: Switch reference includes to @-notation

## Objective

Replace the eta `<%~ include() %>` of two shared reference files with runtime
`@~/.claude/...` references, and add when-to-consult instructions so the
consuming workflows know when to read each file. Eta includes inline content at
render/install time; @-references are read on demand at runtime.

## Context

- `checkpoints.md` eta include lived in the workflow `execute-phase.md:616`,
  inside the execute-plan subagent `<execution_context>` block (not in the
  command file as originally assumed).
- `git-integration.md` eta include was nested in `execute-plan.md:9` inside
  `<required_reading>` (not included anywhere in execute-phase.md).
- The `@~/.claude/...` pattern already exists in `execute-phase.md:619` for
  `executor-examples.md`, so the switch is consistent with prior art.

## Tasks

### Task 1 — Convert checkpoints.md include to @-reference
- **files:** `get-shit-done/workflows/execute-phase.md`
- **action:** Replace `<%~ include('get-shit-done/references/checkpoints.md') %>`
  at line 616 with `@~/.claude/get-shit-done/references/checkpoints.md`. Add a
  `<reference_usage>` block after `</execution_context>` instructing the
  subagent to consult checkpoints.md when a plan task carries a checkpoint
  (`none`/`human-verify`/`decision`/`human-action`).
- **verify:** `command grep -n "checkpoints.md" get-shit-done/workflows/execute-phase.md`
  shows the @-ref and no eta include.
- **done:** checkpoints.md is an @-reference with consult guidance.

### Task 2 — Convert git-integration.md include to @-reference
- **files:** `get-shit-done/workflows/execute-plan.md`
- **action:** Replace `<%~ include('get-shit-done/references/git-integration.md') %>`
  at line 9 with `@~/.claude/get-shit-done/references/git-integration.md` inside
  `<required_reading>`. Add a sentence instructing the executor to read it before
  any commit/branch (atomic-commit sequence, message conventions, branch/worktree
  rules).
- **verify:** `command grep -n "git-integration.md" get-shit-done/workflows/execute-plan.md`
  shows the @-ref and no eta include.
- **done:** git-integration.md is an @-reference with consult guidance.

## must_haves

- **truths:**
  - No `<%~ include(...checkpoints.md...) %>` remains in execute-phase.md.
  - No `<%~ include(...git-integration.md...) %>` remains in execute-plan.md.
  - Both files reference their target via `@~/.claude/...` notation.
  - Each workflow contains when-to-consult instructions for its reference.
- **artifacts:**
  - `get-shit-done/workflows/execute-phase.md` (modified)
  - `get-shit-done/workflows/execute-plan.md` (modified)
- **key_links:**
  - `get-shit-done/references/checkpoints.md`
  - `get-shit-done/references/git-integration.md`
