---
phase: quick-260608-on7
plan: 01
subsystem: workflows
tags: [fidelity-restore, execute-phase, prompt-compression]
key-files:
  modified:
    - get-shit-done/workflows/execute-phase.md
decisions:
  - Verified each alleged regression independently via diff before editing; 9/9 items confirmed and fixed
  - Each fix restored exact reference content from 57a000b1 without expansion
metrics:
  completed: 2026-06-08
  duration: ~15min
  tasks: 1
  files: 1
---

# Quick Task 260608-on7: Restore Fidelity in execute-phase.md Summary

Restored 9 confirmed fidelity losses in `get-shit-done/workflows/execute-phase.md` after prompt compression. All items were independently verified against `diff /tmp/ref.md HEAD` before any edits were made. Line count increased from 911 to 1003 (target was 1000-1100).

## Items Verified and Fixed

| Item | Description | Status |
|------|-------------|--------|
| A | CODEX RUNTIME rule in execute_waves: moved OUTSIDE and AFTER Agent() closing paren (was inside prompt= string between `<parallel_execution>` and `<execution_context>`) | CONFIRMED + FIXED |
| B | CODEX RUNTIME rule in verify_phase_goal: restored after gsd-verifier Agent() call (was entirely absent) | CONFIRMED + FIXED |
| C | check_blocking_antipatterns three sub-clauses: restored "own-words", "specific failure", and "concrete-step" qualifiers to each question | CONFIRMED + FIXED |
| D | available_agent_types enforcement preamble: restored "Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:" | CONFIRMED + FIXED |
| E | Cross-phase context files paragraph in initialize: restored "always provided" distinction vs conditional reference files (executor-examples.md, planner-antipatterns.md) | CONFIRMED + FIXED |
| F | Sequential dispatch CORRECT/WRONG contrast: restored `# CORRECT: one Agent() per message with run_in_background: true` / `# WRONG: multiple Agent() calls in one message -> .git/config.lock contention` code comment block | CONFIRMED + FIXED |
| G | Wave-close heartbeat ordering: restored correct order — spot-checks first (step 12), then heartbeat, then `## Wave N Complete` summary (was reversed: heartbeat at step 12, spot-checks at step 13) | CONFIRMED + FIXED |
| H | close_parent_artifacts detail: restored 6 explicit numbered steps with `$GSD_SDK query find-phase` SDK call and exact `--files .planning/phases/*${PARENT_PHASE}*/*-UAT.md .planning/debug/resolved/*.md` commit paths | CONFIRMED + FIXED |
| I | AskUserQuestion directive in regression_gate: restored `Use AskUserQuestion to present the options.` after the options block | CONFIRMED + FIXED |

## Commit

- `79c4c925`: fix(quick-260608-on7): restore confirmed fidelity losses in execute-phase.md

## Final Line Count

- Before: 911 lines
- After: 1003 lines
- Target: 1000-1100 lines

## Self-Check: PASSED

- File exists: `get-shit-done/workflows/execute-phase.md` — FOUND
- Commit `79c4c925` exists — FOUND
- CODEX RUNTIME appears at lines 407 and 851 (outside Agent() parens) — VERIFIED
- check_blocking_antipatterns sub-clauses present at lines 177-179 — VERIFIED
- AskUserQuestion present at line 797 — VERIFIED
