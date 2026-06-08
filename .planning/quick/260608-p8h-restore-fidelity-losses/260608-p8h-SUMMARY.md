---
phase: quick-260608-p8h
plan: 01
subsystem: execute-phase-workflow
tags: [fidelity-restore, execute-phase, prompt-engineering]
requires: []
provides: [execute-phase-fidelity-restored]
affects: [execute-phase-workflow]
tech-stack:
  added: []
  patterns: [surgical-edit]
key-files:
  modified:
    - get-shit-done/workflows/execute-phase.md
decisions:
  - Restored 9 of 10 confirmed fidelity losses (item 2 was already adequate in HEAD)
  - Preserved all compression wins; added only the missing operational instructions
metrics:
  duration: ~15 minutes
  completed: 2026-06-08
---

# Quick Task 260608-p8h: Restore Confirmed Fidelity Losses in execute-phase.md

Restored 9 confirmed operational instruction losses in execute-phase.md, diff-verified against commit 57a000b1. Changes are surgical — no compression wins removed.

## What Was Restored

### Essential Items (Task 1 — commit b42a3cdd)

1. **initialize error conditions** — Added explicit error handling for `phase_found=false`, `plan_count=0`, `state_exists=false` plus sequential-wave note when `parallelization=false`.
2. **auto-chain sync ordering constraint** — Restored "You MUST execute this bash block before any config reads" instruction (was softened to just "REQUIRED").
3. **schema_drift_gate timing** — Restored "Run after execution completes but BEFORE verification marks success" instruction.
4. **schema_drift_gate `orms` field** — Restored `orms` in the Parse JSON field list (was dropped; `unpushed_orms` remained but `orms` itself was absent).
5. **codebase_drift_gate non-blocking contract** — Restored "MUST fall through" and "phase is never failed by this gate" language (was softened to "(non-blocking by contract)").
6. **HUMAN-UAT template `## Gaps` section** — Restored the `## Gaps` section in the UAT template in `verify_phase_goal`'s human_needed branch.

### Notable Items (Task 2 — commit 1f14669a)

7. **cross_ai_delegation dirty working tree check** — Restored the pre-execution dirty working tree safety check BEFORE running the external command (previously only documented in the failure path).
8. **discover_and_group_plans Execution Plan table** — Restored the full `## Execution Plan` table template with wave/plans/what-it-builds columns (was replaced with bare prose).
9. **post-wave stash `#3542` comment** — Restored the note that `refs/stash` is shared across worktrees in the stash push line.
10. **failure_handling quota sentinel strings** — Restored the explicit list: `usage limit`, `rate limit`, `429`, `too many requests`, `RESOURCE_EXHAUSTED`, `usage_limit_reached`.

## Deviations from Plan

None — plan executed exactly as written. All 9 target edits applied. Item 2 (offer_next hallucination guard) was confirmed adequate in HEAD as noted in the plan.

## Verification

- All 11 grep checks from the plan pass (6 from Task 1, 5 from Task 2)
- File grew from 1003 to 1039 lines (+36, within expected ~30-40 range)
- npm test exit code 0; pre-existing failures are unrelated to this task's changes
- git diff shows only additions in expected locations

## Self-Check: PASSED

- `/Users/thamw/development/local/get-shit-done/get-shit-done/workflows/execute-phase.md` — FOUND
- Commit b42a3cdd exists in git log — FOUND
- Commit 1f14669a exists in git log — FOUND
