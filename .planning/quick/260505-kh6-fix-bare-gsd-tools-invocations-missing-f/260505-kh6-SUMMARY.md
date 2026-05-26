---
phase: quick-260505-kh6
plan: "01"
status: complete
subsystem: workflows
tags: [fix, shell-invocation, gsd-tools]
dependency_graph:
  requires: []
  provides: [plan-phase.md shell invocation fix]
  affects: [get-shit-done/workflows/plan-phase.md]
tech_stack:
  added: []
  patterns: [explicit node path invocation]
key_files:
  modified:
    - get-shit-done/workflows/plan-phase.md
decisions:
  - "Use full `node \"$HOME/.claude/get-shit-done/bin/gsd-tools.cjs\"` path instead of bare `gsd-tools` to avoid PATH dependency"
metrics:
  duration: "2m"
  completed_date: "2026-05-05"
---

# Quick Task 260505-kh6: Fix Bare gsd-tools Invocations Summary

**One-liner:** Replace bare `gsd-tools gap-analysis` with explicit `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" gap-analysis` to eliminate PATH dependency in plan-phase.md.

## What Was Done

Two lines in `get-shit-done/workflows/plan-phase.md` used a bare `gsd-tools` invocation that would fail on systems where gsd-tools is not on PATH. Both were replaced with the full node path invocation:

- Line 1427 (executable call): `gsd-tools gap-analysis --phase-dir "${PHASE_DIR}"` → `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" gap-analysis --phase-dir "${PHASE_DIR}"`
- Line 1431 (prose comment): updated to match the corrected invocation

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Verify fix and commit | bfbc0c7b | get-shit-done/workflows/plan-phase.md |

## Verification

- `grep -n 'gsd-tools gap-analysis' get-shit-done/workflows/plan-phase.md` returns no output (no bare invocations remain)
- `grep -n 'gsd-tools\.cjs.*gap-analysis' get-shit-done/workflows/plan-phase.md` returns 2 lines (both using full node path)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- File `get-shit-done/workflows/plan-phase.md` exists and contains the fix
- Commit `bfbc0c7b` exists in git log
