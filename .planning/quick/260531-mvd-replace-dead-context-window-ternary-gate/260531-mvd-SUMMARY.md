---
phase: quick-260531-mvd
plan: 01
subsystem: workflows
tags: [execute-phase, references, dead-code, eta]
requires: []
provides: ["need-based reference loading in execute-phase.md (no context-window ternary gates)"]
affects: [get-shit-done/workflows/execute-phase.md, tests/prompt-thinning.test.cjs]
tech-stack:
  added: []
  patterns: ["need-based (functionality-based) reference loading replacing dead context-window ternary gates"]
key-files:
  created: []
  modified:
    - get-shit-done/workflows/execute-phase.md
    - tests/prompt-thinning.test.cjs
decisions:
  - "Removed all five ${CONTEXT_WINDOW ... ? ... : ...} ternary sites — dead code that rendered as literal text under both eta and Claude Code substitution"
  - "Updated prompt-thinning.test.cjs to assert need-based behavior rather than revert the change (fork test-precedence constraint)"
metrics:
  duration: ~10m
  completed: 2026-05-31
---

# Phase quick-260531-mvd: Replace Dead CONTEXT_WINDOW Ternary Gate Summary

Replaced dead `${CONTEXT_WINDOW ... ? ... : ...}` ternary gates in `execute-phase.md` with need-based reference loading, so cross-phase context (CONTEXT/RESEARCH/prior-wave SUMMARY) and `executor-examples.md` are always provided rather than gated on a never-evaluated JS ternary.

## What Was Done

The five ternary sites identified by the plan were already present as edits in the working tree at execution start (Task 1's top-of-file need-based note was committed on the base; Task 2's three ternary-wrapper removals plus the `reference_usage` addition were uncommitted). Verification confirmed every site matched the spec exactly:

- **CHANGE 1 + 2** (top of file): CONTEXT_WINDOW bash variable and the two tiering paragraphs are gone, replaced by a short need-based note plus 2 bullets referencing `executor-examples.md` and `planner-antipatterns.md`.
- **CHANGE 3** (executor `<execution_context>`): ternary replaced by a plain always-load `@~/.claude/get-shit-done/references/executor-examples.md` line matching sibling refs.
- **CHANGE 4** (executor `<files_to_read>`): ternary wrapper dropped; three CONTEXT/RESEARCH/prior-wave bullets always listed, `${phase_dir}` and `${prior_wave_summaries}` preserved verbatim.
- **CHANGE 5** (verifier `<files_to_read>`): ternary wrapper dropped; three bullets always listed.
- **reference_usage addition**: new paragraph documenting `executor-examples.md`.

Legitimate substitution variables (`${phase_dir}`, `${prior_wave_summaries}`, `${AGENT_SKILLS}`, `${VERIFIER_SKILLS}`) preserved verbatim (6 matches). No `{%~` eta syntax introduced.

## Verification

- `command grep -nE '\$\{CONTEXT_WINDOW' execute-phase.md` → NONE
- `command grep -n '{%~' execute-phase.md` → NONE
- Legit substitution vars → 6 matches
- `prompt-thinning.test.cjs` → 12/12 pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated prompt-thinning.test.cjs to match need-based intent**
- **Found during:** Task 2 verification (`npm test`)
- **Issue:** `tests/prompt-thinning.test.cjs` asserted the file MUST contain the `CONTEXT_WINDOW < 200000` and `CONTEXT_WINDOW >= 500000` ternaries — i.e., exactly the dead code this plan removes. The suite failed after the change.
- **Fix:** Per the fork's test-precedence constraint (CLAUDE.md: tests asserting the old behavior are modified, not reverted), rewrote the three affected blocks to assert the new need-based behavior: no `CONTEXT_WINDOW` reference remains, `executor-examples.md` is referenced for on-demand loading, and cross-phase CONTEXT/RESEARCH entries are always listed. The reference-file existence and agent-reference tests were left intact.
- **Files modified:** tests/prompt-thinning.test.cjs
- **Commit:** 817348c7

## Deferred Issues (Out of Scope)

Logged to `deferred-items.md`. Both pre-existing on the committed HEAD base, not caused by this plan:

- **INTG-02 bare-line `@~` survivors** — `execute-phase.md:603-605` and `execute-plan.md:11` are bare-line `@~` refs introduced by prior quick tasks (260531-lpp, 260531-mg7). This plan's added `executor-examples.md` ref (line 607) deliberately matches the same established sibling form.
- **W016 / `addAiIntegrationPhaseKey`** — config-health key test failures unrelated to execute-phase.md content.

## Self-Check: PASSED

- FOUND: get-shit-done/workflows/execute-phase.md (modified, no CONTEXT_WINDOW)
- FOUND: tests/prompt-thinning.test.cjs (12/12 pass)
- FOUND commit: 817348c7
