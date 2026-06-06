---
phase: quick-260606-x8b
plan: "01"
subsystem: workflows/agents
tags: [effort-wiring, agent-spawn, prompt-engineering]
dependency_graph:
  requires: []
  provides: [effort= keyword prefix on all Agent() invocation effort_arg tokens]
  affects: [agents/gsd-debug-session-manager.md, get-shit-done/workflows/*]
tech_stack:
  added: []
  patterns: [Node.js line-by-line transform with guard predicates]
key_files:
  created: []
  modified:
    - agents/gsd-debug-session-manager.md
    - get-shit-done/workflows/audit-fix.md
    - get-shit-done/workflows/audit-milestone.md
    - get-shit-done/workflows/code-review-fix.md
    - get-shit-done/workflows/code-review.md
    - get-shit-done/workflows/debug.md
    - get-shit-done/workflows/diagnose-issues.md
    - get-shit-done/workflows/discuss-phase-assumptions.md
    - get-shit-done/workflows/discuss-phase/modes/advisor.md
    - get-shit-done/workflows/docs-update.md
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/explore.md
    - get-shit-done/workflows/import.md
    - get-shit-done/workflows/ingest-docs.md
    - get-shit-done/workflows/map-codebase.md
    - get-shit-done/workflows/new-milestone.md
    - get-shit-done/workflows/new-project.md
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/quick.md
    - get-shit-done/workflows/scan.md
    - get-shit-done/workflows/secure-phase.md
    - get-shit-done/workflows/ui-phase.md
    - get-shit-done/workflows/ui-review.md
    - get-shit-done/workflows/validate-phase.md
    - get-shit-done/workflows/verify-work.md
decisions:
  - "Included discuss-phase/modes/advisor.md (not in plan's files_modified list) because it contained an identical un-prefixed {ADVISOR_MODEL_effort_arg} standalone token in an Agent() block — D-01 compliance required fixing it"
  - "Used Node.js line-by-line transform with three guard predicates: shell assignment detection, backtick meta-doc detection, and idempotency prefix check"
metrics:
  duration: ~15min
  completed: "2026-06-07"
---

# Phase quick-260606-x8b Plan 01: Add effort= keyword prefix to Agent() invocation effort_arg tokens

**One-liner:** Added `effort=` prefix to 67 bare `{*_effort_arg}` tokens across 26 files so Agent() calls bind the effort value to the named `effort` parameter.

## What Was Done

Every `{*_effort_arg}` token appearing as an Agent() invocation argument — standalone-line, inline within an Agent() call, or in prose Agent descriptions — was prefixed with `effort=`. Shell variable definition lines (`*_effort_arg=$(...)`) and backtick-wrapped meta-documentation references were left unchanged per D-02 and D-03.

## Task Summary

### Task 1: Add effort= prefix to all Agent-invocation effort_arg tokens
**Commit:** `405b9526`
**Status:** Complete

**Total files edited:** 26 (25 planned + 1 extra: `discuss-phase/modes/advisor.md`)
**Total lines changed:** 66 insertions + 66 deletions (from `git diff --stat`)

**Per-file token count:**

| File | Tokens prefixed |
|------|----------------|
| agents/gsd-debug-session-manager.md | 1 |
| get-shit-done/workflows/audit-fix.md | 1 |
| get-shit-done/workflows/audit-milestone.md | 1 |
| get-shit-done/workflows/code-review-fix.md | 3 |
| get-shit-done/workflows/code-review.md | 1 |
| get-shit-done/workflows/debug.md | 2 |
| get-shit-done/workflows/diagnose-issues.md | 1 |
| get-shit-done/workflows/discuss-phase-assumptions.md | 1 |
| get-shit-done/workflows/discuss-phase/modes/advisor.md | 1 (extra) |
| get-shit-done/workflows/docs-update.md | 10 |
| get-shit-done/workflows/execute-phase.md | 2 (invocation lines only; meta-doc preserved) |
| get-shit-done/workflows/execute-plan.md | 1 (prose Agent description) |
| get-shit-done/workflows/explore.md | 1 |
| get-shit-done/workflows/import.md | 1 |
| get-shit-done/workflows/ingest-docs.md | 2 |
| get-shit-done/workflows/map-codebase.md | 4 (3 standalone + 1 prose) |
| get-shit-done/workflows/new-milestone.md | 3 (inline Agent() args) |
| get-shit-done/workflows/new-project.md | 7 (inline Agent() args) |
| get-shit-done/workflows/plan-phase.md | 7 |
| get-shit-done/workflows/quick.md | 7 |
| get-shit-done/workflows/scan.md | 1 |
| get-shit-done/workflows/secure-phase.md | 1 |
| get-shit-done/workflows/ui-phase.md | 2 |
| get-shit-done/workflows/ui-review.md | 1 |
| get-shit-done/workflows/validate-phase.md | 1 |
| get-shit-done/workflows/verify-work.md | 3 |

**Total: 67 tokens prefixed across 26 files**

## Verification Command Outputs

### Check 1: No un-prefixed effort_arg tokens remain in Agent-invocation contexts
```
PASS: No un-prefixed tokens remain
```

### Check 2: No double prefix (effort=effort={...})
```
PASS: No double prefix found
```

### Check 3: Shell var definition intact (D-02 compliance)
```
PASS: Shell var definition intact
```
Verified: `executor_model_effort_arg=$(...)` in execute-plan.md unchanged.

### Check 4: Meta-doc prose intact (D-03 compliance)
```
PASS: Meta-doc contains 'tokens are empty when'
```
Verified: Line 87 of execute-phase.md still has `` `{executor_model_effort_arg}` `` and `` `{verifier_model_effort_arg}` `` in backtick code spans without `effort=` prefix.

### Check 4b (extra): Meta-doc backtick tokens not prefixed
```
PASS: Meta-doc backtick tokens not prefixed
```

### Spot-checks (from plan's verification section)

**execute-plan.md line 111** (prose Agent description):
```
...spawn Agent(subagent_type="gsd-executor", model=executor_model, effort={executor_model_effort_arg})...
```
Shell var on line 53 unchanged: `executor_model_effort_arg=$(...)`

**ui-phase.md lines 176, 230** (standalone-line tokens):
```
  effort={UI_RESEARCHER_MODEL_effort_arg}
  effort={UI_CHECKER_MODEL_effort_arg}
```

**execute-phase.md line 87** (meta-doc, unchanged):
```
The `{executor_model_effort_arg}` and `{verifier_model_effort_arg}` tokens are empty when effort is absent...
```

### npm test
4789 tests passed, 5 failures. The 5 failures are pre-existing (confirmed by testing against HEAD before changes) — unrelated to this task.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing coverage] Fixed discuss-phase/modes/advisor.md (not in plan's files_modified list)**
- **Found during:** Verification Check 1
- **Issue:** `get-shit-done/workflows/discuss-phase/modes/advisor.md` line 106 contained a bare `{ADVISOR_MODEL_effort_arg}` standalone token inside an Agent() block. This file was not listed in the plan's `files_modified` but meets D-01 criteria.
- **Fix:** Applied the same `effort=` prefix transformation to line 106.
- **Files modified:** `get-shit-done/workflows/discuss-phase/modes/advisor.md`
- **Commit:** `405b9526` (included in the main task commit)

**2. [Rule 1 - Bug] Reverted incorrect meta-doc transformation in execute-phase.md**
- **Found during:** Post-transformation review
- **Issue:** The Node.js transformation script incorrectly modified the meta-doc line 87 of `execute-phase.md` (the line describing what the tokens mean), changing `` `{executor_model_effort_arg}` `` to `` `effort={executor_model_effort_arg}` `` inside backtick code spans. This violated D-03.
- **Fix:** Reverted line 87 to its original form using the Edit tool.
- **Files modified:** `get-shit-done/workflows/execute-phase.md`
- **Commit:** Included in `405b9526`

## Known Stubs

None.

## Threat Flags

None — this task modifies only prompt-content `.md` files (no network endpoints, auth paths, file access patterns, or schema changes).

## Self-Check: PASSED

- [x] All task files modified (26 files)
- [x] Commit 405b9526 exists: `git log --oneline | grep 405b9526` → confirmed
- [x] Verification checks 1-4 all PASS
- [x] D-02 compliance: shell assignment lines unchanged
- [x] D-03 compliance: meta-doc backtick references unchanged
- [x] No double-prefix introduced
- [x] npm test pre-existing failures only (5 failures existed before this task)
