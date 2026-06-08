---
phase: quick
plan: 260608-msc
subsystem: workflow/execute-phase
tags: [fidelity-restoration, prompt-engineering, compression-rollback]
requires: []
provides: [execute-phase.md with all 17 semantic losses restored]
affects: [get-shit-done/workflows/execute-phase.md]
key-files:
  modified:
    - get-shit-done/workflows/execute-phase.md
decisions:
  - Compressed prose style matched to post-compression file register — semantics restored, not wordcount
  - Document-order edits applied (top to bottom) regardless of severity tier
  - Three atomic commits grouped by document section (initialize/execute_waves / cleanup-failure-reference / tdd-verify-checkpoint-interactive-schema-offer)
metrics:
  duration: 8m
  completed: 2026-06-08T08:40:14Z
  tasks_completed: 3
  files_modified: 1
---

# Quick Task 260608-msc: execute-phase.md Fidelity Restoration Summary

**One-liner:** Restored all 17 semantic/operational losses from the a619eef4 compression of execute-phase.md using compressed prose matching the post-compression register.

## What Was Built

Commit a619eef4 compressed `get-shit-done/workflows/execute-phase.md` from ~1722 to ~704 lines (~59% reduction). A fidelity analysis documented 17 semantic losses — operationally significant instructions that executors following the compressed file would miss. This task restored all 17 using minimal compressed prose additions.

## Tasks Completed

| Task | Description | Commit | Losses |
|------|-------------|--------|--------|
| 1 | Restore initialize + execute_waves early sections | a2c7e047 | 1, 2, 3, 4, 6 |
| 2 | Restore worktree cleanup, failure handling, reference_usage | 104f7c78 | 5, 7, 8, 10, 11, 12 |
| 3 | Restore TDD, verify, checkpoint, interactive, schema, offer_next | bf1c4420 | 9, 13, 14, 15, 16, 17 |

## Restorations by Loss ID

**L1 — `response_language` injection:** Added "If `response_language` is set: include in all spawned subagent prompts so user-facing output stays in the configured language" after effort resolution block.

**L2 — Per-plan worktree dispatch gate:** Added "dispatch branches in step 5 MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`" note to step 4.

**L3 — REQUIRED ORDER truncation risk:** Appended "(truncation risk; #2070 rescue is not primary defense)" to REQUIRED ORDER lines in both worktree-mode and sequential-mode executor prompts.

**L4 — Copilot fallback parallel-with-spot-check:** Expanded Copilot bullet to explicitly state "rely on the spot-check fallback (commits visible + SUMMARY.md exists) to detect completion; do not trust the signal alone."

**L5 — Worktree cleanup "when to skip" conditions:** Replaced single-line "Skip if no worktrees used" with three explicit bullets (WAVE_WORKTREE_PLANS empty / custom-merge deviation / partial-worktree-set).

**L6 — Submodule per-plan justification:** Added sentence after SUBMODULE_PATHS block explaining the per-plan intersection avoids blanket disabling and flows into `execute_waves` step 4.

**L7 — Quota-exceeded routing specifics:** Expanded step 14 quota-exceeded entry with state.verify-against-disk routing, "Do not offer retry now", and explicit offer list.

**L8 — Dirty working tree warning:** Added warning block after cross-AI failure: "Review `git status` and `git diff` before proceeding — the external command may have left partial edits."

**L9 — TDD `--force-mvp-gate` escape hatch:** Added override command documentation with blocking vs. advisory policy distinction after the MVP+TDD escalation line.

**L10 — Heartbeat interval vs. threshold distinction:** Replaced single stall description with explicit `EXECUTOR_STALL_INTERVAL_MINUTES` (how often) vs. `EXECUTOR_STALL_THRESHOLD_MINUTES` (how long) distinction.

**L11 — Reference file purpose annotations:** Expanded reference_usage Consult bullets to include when-to-use purpose for checkpoints.md (segmentation/MAIN routing), summary.md (frontmatter fields), tdd.md (red-green-refactor), executor-examples.md (deviations/checkpoints).

**L12 — Worktree auto-detection mechanism:** Made `.git` is-a-file detection explicit: "auto-detects worktree mode (`.git` is a file, not a directory) and skips STATE.md/ROADMAP.md updates automatically."

**L13 — HUMAN-UAT.md structure:** Restored Step A (persist with `status: partial` frontmatter, Tests, Summary blocks) and Step B (present format) with audit-uat references.

**L14 — Auto-mode checkpoint type specifics:** Restored exact log strings (`⚡ Auto-approved checkpoint`, `⚡ Auto-selected: [option]`) and auth-gate clarification.

**L15 — Interactive mode presenter format:** Restored exact header format (`## Plan {id}: {name}` / `Objective:` / `Tasks:` / `Options: Execute / Review first / Skip / Stop`) and Review-first re-ask flow.

**L16 — Schema drift false-positive explanation:** Prepended purpose annotation ("Catches false-positive verification where build/types pass because TypeScript types come from config, not the live database") and added "(recommended)" to run-push-now option.

**L17 — offer_next recommended markers:** Replaced flat command list with two CONTEXT.md-conditional blocks, each with `← recommended` marker on the appropriate command.

## Deviations from Plan

None — plan executed exactly as written. All 17 losses restored in document order across three atomic commits.

## Verification

All 17 restoration marker greps returned >= 1. `npm test` passed (exit code 0) — no regressions.

## Self-Check: PASSED

- [x] `get-shit-done/workflows/execute-phase.md` modified and exists
- [x] Commit a2c7e047 exists (Task 1)
- [x] Commit 104f7c78 exists (Task 2)
- [x] Commit bf1c4420 exists (Task 3)
- [x] All 17 grep checks pass >= 1
