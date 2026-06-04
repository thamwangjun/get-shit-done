---
phase: 56-spawn-template-wiring
plan: "02"
subsystem: workflows
tags: [effort-wiring, spawn-templates, group-a, d-04, d-08-medium-floor]
dependency_graph:
  requires: [56-01]
  provides: [group-a-effort-wired]
  affects:
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/quick.md
    - get-shit-done/workflows/new-project.md
    - get-shit-done/workflows/new-milestone.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/map-codebase.md
tech_stack:
  added: []
  patterns: [group-a-init-fed-effort-wiring, pre-built-token-shell-conditional]
key_files:
  created: []
  modified:
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/quick.md
    - get-shit-done/workflows/new-project.md
    - get-shit-done/workflows/new-milestone.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/map-codebase.md
decisions:
  - "D-04: pre-built token via shell conditional; empty token renders nothing for inherit/non-effort runtimes — no conditional render instruction in Agent() blocks"
  - "D-02 carrier: effort= argument adjacent to model= in every Agent() block (locked from Plan 01)"
metrics:
  duration: ~35 minutes
  completed: 2026-06-04
  tasks_completed: 2
  tasks_total: 2
---

# Phase 56 Plan 02: Group A Workflow Effort Wiring Summary

All 8 init-fed (Group A) workflows now parse `*_effort` siblings from init JSON, build pre-built `{<agent>_model_effort_arg}` tokens via shell conditional, and pass `effort=` adjacent to every `model=` line in every Agent() block.

## What Was Built

### Task 1: execute-phase.md + execute-plan.md + plan-phase.md + quick.md

**execute-phase.md:**
- Parse instruction extended: `executor_effort`, `verifier_effort` added adjacent to their `*_model` siblings
- Shell assignments added after parse block building `executor_model_effort_arg` and `verifier_model_effort_arg`
- Effort resolution note added to Model resolution paragraph (D-04: empty token renders nothing)
- `{executor_model_effort_arg}` added adjacent to `model="{executor_model}"` in executor Agent() block
- `{verifier_model_effort_arg}` added adjacent to `model="{verifier_model}"` in verifier Agent() block

**execute-plan.md:**
- Extract instruction extended: `executor_effort` added
- Shell assignment added building `executor_model_effort_arg`
- `{executor_model_effort_arg}` added to Pattern A prose Agent() reference

**plan-phase.md:**
- Parse instruction extended: `researcher_effort`, `planner_effort`, `checker_effort`
- Shell assignments added for all 3 tokens
- All 7 Agent() blocks updated (2 researcher, 4 planner, 1 checker)

**quick.md:**
- Parse instruction extended: `planner_effort`, `executor_effort`, `checker_effort`, `verifier_effort`
- Shell assignments added for all 4 tokens
- All 7 Agent() blocks updated (2 planner, 2 executor, 1 checker, 1 verifier) plus 1 revision planner

### Task 2: new-project.md + new-milestone.md + verify-work.md + map-codebase.md

**new-project.md:**
- Parse instruction extended: `researcher_effort`, `synthesizer_effort`, `roadmapper_effort`
- Shell assignments added for all 3 tokens
- All 7 Agent() blocks updated (4 researcher, 1 synthesizer, 2 roadmapper)

**new-milestone.md:**
- Extract instruction extended: `researcher_effort`, `synthesizer_effort`, `roadmapper_effort`
- Shell assignments added for all 3 tokens
- All 3 Agent() blocks updated (1 researcher, 1 synthesizer, 1 roadmapper)

**verify-work.md:**
- Parse instruction extended: `planner_effort`, `checker_effort`
- Shell assignments added for both tokens
- All 3 Agent() blocks updated (2 planner, 1 checker)

**map-codebase.md:**
- Extract instruction extended: `mapper_effort`
- Shell assignment added for `mapper_model_effort_arg`
- All 4 Agent() blocks updated + prose reference updated

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| D-04: token form | pre-built shell conditional | Empty string for inherit/non-effort runtimes; interpolates to nothing in Agent() call; no conditional instruction needed per spawn site |
| D-02 carrier | effort= argument adjacent to model= | Locked from Plan 01 (accept-argument-carrier) |
| verify-work effort fields | planner + checker only | Actual file has no verifier_model; wired to match actual Agent() blocks |

## Verification

```
npm test → 4220 pass, 0 fail (Task 1 gate)
npm test → exit code 0 (Task 2 gate)
grep -c "_model_effort_arg" get-shit-done/workflows/execute-phase.md → 5
grep -c "_model_effort_arg" get-shit-done/workflows/new-project.md → 10
```

Fork gates confirmed: agent-frontmatter, negative-framing, step-numbering, cross-file-refs all held.

## Deviations from Plan

**1. [Rule 1 - Scope] verify-work.md has no verifier_model**

RESEARCH.md D-07 table listed `verifier_effort` for verify-work.md, but the actual file only has `planner_model` and `checker_model` Agent() blocks — no `verifier_model`. Wired to match actual file contents (planner + checker only). This is a research-time enumeration error, not a scope change.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Template token is enum-constrained by `parseModelEffort` (T-56-A1 accepted per plan threat model).

## Self-Check: PASSED

- `get-shit-done/workflows/execute-phase.md` — exists, contains `executor_model_effort_arg` and `verifier_model_effort_arg` ✓
- `get-shit-done/workflows/execute-plan.md` — exists, contains `executor_model_effort_arg` ✓
- `get-shit-done/workflows/plan-phase.md` — exists, contains `researcher_model_effort_arg`, `planner_model_effort_arg`, `checker_model_effort_arg` ✓
- `get-shit-done/workflows/quick.md` — exists, contains all 4 effort_arg tokens ✓
- `get-shit-done/workflows/new-project.md` — exists, contains researcher/synthesizer/roadmapper_model_effort_arg ✓
- `get-shit-done/workflows/new-milestone.md` — exists, contains researcher/synthesizer/roadmapper_model_effort_arg ✓
- `get-shit-done/workflows/verify-work.md` — exists, contains planner/checker_model_effort_arg ✓
- `get-shit-done/workflows/map-codebase.md` — exists, contains mapper_model_effort_arg ✓
- Commit 4e4714ce exists ✓
- Commit 2bbba4f1 exists ✓
