---
phase: quick-260606-vf5
plan: 01
subsystem: sdk-effort-resolution, workflow-spawn-wiring
tags: [expose-03, spawn-02, effort-resolution, codex, model-catalog]
dependency_graph:
  requires: []
  provides: [EXPOSE-03, SPAWN-02]
  affects: [sdk/src/query/config-query.ts, 8 workflow files]
tech_stack:
  added: []
  patterns: [pre-strip slot pattern for effort resolution, Group B standalone resolve wiring]
key_files:
  created: []
  modified:
    - sdk/src/query/config-query.ts
    - sdk/src/query/config-query.test.ts
    - get-shit-done/workflows/audit-fix.md
    - get-shit-done/workflows/diagnose-issues.md
    - get-shit-done/workflows/code-review.md
    - get-shit-done/workflows/code-review-fix.md
    - get-shit-done/workflows/explore.md
    - get-shit-done/workflows/import.md
    - get-shit-done/workflows/ingest-docs.md
    - get-shit-done/workflows/discuss-phase-assumptions.md
decisions:
  - "runtimeTier step 3 must read rawSlotForRuntime (pre-strip) not tier (post-strip)"
  - "User model_profile_overrides[runtime][tier].reasoning_effort beats catalog slot effort (step 2.5)"
  - "8 workflows use Group B standalone resolve pattern per SPAWN-02 requirement"
metrics:
  duration: ~25 minutes
  completed: "2026-06-06"
  tasks_completed: 3
  files_changed: 10
---

# Quick 260606-vf5: Fix v2.1.0-e Audit Gaps — EXPOSE-03 + SPAWN-02 Summary

SDK codex runtimeTier now reads catalog slot effort before Codex built-in fallback; 8 agent-spawning workflows wired with resolve-model-effort.

## What Was Built

### Gap 1: EXPOSE-03 — SDK runtimeTier Pre-Strip Slot Effort

**Root cause confirmed:** In `resolveModel`, the `runtimeTier` block's step 3 called `parseModelEffort(tier).effort` where `tier` is the already-stripped alias (`'opus'`, no `;low` suffix). The strip happens at line 292: `const alias = parseModelEffort(rawAlias).model`. Any `;effort` suffix from the catalog slot (e.g., `'opus;low'` for `gsd-planner` quality profile) was discarded before step 3 could read it, causing the Codex built-in `'xhigh'` to win via step 4.

**Fix applied:**
1. Added `rawSlotForRuntime = typeof phaseTier === 'string' ? phaseTier : rawAlias` — mirrors the `rawSlot` pattern in the `claudePathEffort` block below.
2. Added step 2.5: check `model_profile_overrides[runtime][tier].reasoning_effort` first. This handles the case where the user explicitly set an effort in overrides (should beat catalog slot).
3. Step 3 now reads `parseModelEffort(rawSlotForRuntime).effort` — catalog slot suffix wins over built-in.
4. Step 4 (built-in) only fires when neither step 2.5 nor step 3 found an effort.

**New test:** `codex runtime quality-profile agent returns catalog slot effort not built-in (EXPOSE-03)` — asserts `effort='low'` (from `'opus;low'`) not `'xhigh'` (Codex built-in) for `runtime='codex', model_profile='quality', agent='gsd-planner'`.

All 32 config-query tests pass (31 original + 1 new).

### Gap 2: SPAWN-02 — 8 Workflow Effort Wiring

All 8 remaining agent-spawning workflows now capture agent model + effort tokens adjacent to their GSD_SDK setup, and interpolate `{<agent>_model_effort_arg}` into Agent() spawns.

| Workflow | Agent(s) Wired |
|----------|---------------|
| audit-fix.md | gsd-executor |
| diagnose-issues.md | gsd-debugger |
| code-review.md | gsd-code-reviewer |
| code-review-fix.md | gsd-code-fixer, gsd-code-reviewer (all 3 Agent() spawns) |
| explore.md | gsd-phase-researcher (GSD_SDK setup added inline before Agent()) |
| import.md | gsd-plan-checker |
| ingest-docs.md | gsd-doc-synthesizer, gsd-roadmapper (migrated from hardcoded path to $GSD_SDK) |
| discuss-phase-assumptions.md | gsd-assumptions-analyzer |

Fork quality constraints respected: no step renumbering, no frontmatter changes, no @-ref modifications.

## Commits

| Hash | Description |
|------|-------------|
| b4bc8cc0 | fix(quick-260606-vf5): EXPOSE-03 SDK runtimeTier reads pre-strip slot effort for codex path |
| cb74d35c | feat(quick-260606-vf5): SPAWN-02 wire effort into 8 remaining agent-spawning workflows |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 2.5 added to runtimeTier block — user overrides must beat catalog slot**
- **Found during:** Task 1 (GREEN verification)
- **Issue:** Initial fix (step 3 reads rawSlotForRuntime) caused regression: `model_profile_overrides[runtime][tier].reasoning_effort = 'high'` was being overridden by catalog slot `'opus;low' → 'low'`. User-supplied overrides must have higher precedence than catalog slot defaults.
- **Fix:** Added step 2.5 that reads `model_profile_overrides[runtime][tier].reasoning_effort` directly (before the merged runtimeTier). When user explicitly provided effort in overrides, use it; otherwise fall through to catalog slot (step 3) then built-in (step 4).
- **Files modified:** sdk/src/query/config-query.ts (additional logic in runtimeTier block)
- **Commit:** b4bc8cc0

**2. [Rule 2 - Enhancement] ingest-docs.md migrated from hardcoded `node "$HOME/..."` to $GSD_SDK pattern**
- **Found during:** Task 2
- **Issue:** ingest-docs.md used `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"` directly in the init step, bypassing the standard GSD_SDK resolution pattern (#3668). Added full SDK resolution block and $GSD_SDK variable before adding resolve-model calls.
- **Fix:** Replaced hardcoded node invocation with standard GSD_TOOLS resolution block. Also updated the finalize step commit command from hardcoded path to `$GSD_SDK query commit`.
- **Files modified:** get-shit-done/workflows/ingest-docs.md
- **Commit:** cb74d35c

## Verification

- SDK tests: 32/32 pass (31 original + 1 new EXPOSE-03 test)
- Full suite: 4794 pass, 0 fail
- Effort wiring spot-check: all 8 files contain `resolve-model-effort gsd-`
- Commits: 2 separate atomic commits as required

## Self-Check: PASSED

- sdk/src/query/config-query.ts: modified (EXPOSE-03 fix)
- sdk/src/query/config-query.test.ts: modified (new test)
- 8 workflow files: modified (SPAWN-02 wiring)
- Commits b4bc8cc0 and cb74d35c: both verified in git log
