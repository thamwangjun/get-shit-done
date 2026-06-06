---
phase: quick-260607-0kd
plan: "01"
subsystem: prompt-files
tags: [effort-args, null-omit, agent-invocations, sed-transformation]
dependency_graph:
  requires: [260606-x8b]
  provides: [null-omit-comments-on-effort-lines]
  affects: [agents/gsd-debug-session-manager.md, get-shit-done/workflows/]
tech_stack:
  added: []
  patterns: [sed-idempotent-transformation]
key_files:
  created: []
  modified:
    - agents/gsd-debug-session-manager.md
    - get-shit-done/workflows/validate-phase.md
    - get-shit-done/workflows/ui-review.md
    - get-shit-done/workflows/diagnose-issues.md
    - get-shit-done/workflows/debug.md
    - get-shit-done/workflows/scan.md
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/explore.md
    - get-shit-done/workflows/audit-milestone.md
    - get-shit-done/workflows/secure-phase.md
    - get-shit-done/workflows/map-codebase.md
    - get-shit-done/workflows/audit-fix.md
    - get-shit-done/workflows/docs-update.md
    - get-shit-done/workflows/import.md
    - get-shit-done/workflows/ui-phase.md
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/discuss-phase/modes/advisor.md
    - get-shit-done/workflows/ingest-docs.md
    - get-shit-done/workflows/quick.md
decisions:
  - "Used macOS-compatible BSD sed -i '' -E with /# omit this line when/! address guard for idempotency"
  - "Two spaces before # in replacement per CONTEXT.md Claude's Discretion"
metrics:
  duration: "5 minutes"
  completed: "2026-06-07"
  tasks: 2
  files_modified: 20
---

# Phase quick-260607-0kd Plan 01: Add null-omit comments to effort= lines in Agent invocations Summary

**One-liner:** Appended `# omit this line when <varname> == null` trailing comments to all 50 standalone `effort={*_effort_arg}` lines across 20 prompt files via BSD sed with idempotency guard.

## Tasks Completed

| # | Task | Commit | Result |
|---|------|--------|--------|
| 1 | Baseline count and apply sed transformation | 4de5a455 | 50/50 lines transformed, idempotency verified |
| 2 | Commit atomically | 4de5a455 | Single atomic commit, 50 additions / 50 removals confirmed |

## What Was Built

Applied a sed transformation across 20 .md prompt files (agents/ and get-shit-done/workflows/ recursively) to append a trailing comment to every standalone-line `effort={*_effort_arg}` pattern:

**Before:**
```
    effort={quick_effort_arg}
```

**After:**
```
    effort={quick_effort_arg}  # omit this line when quick_effort_arg == null
```

The comment documents the omission contract at the call site: when the corresponding `*_effort_arg` variable resolves to null, the `effort=` line must be omitted entirely from the rendered Agent invocation.

## Verification Results

All success criteria confirmed:

- D-01: 50/50 standalone effort= lines transformed (verified via grep count)
- D-02: Sed is idempotent — second pass produced zero additional changes (verified via git diff --stat comparison)
- D-03: Zero standalone uncommented effort= lines remain (grep returned 0)
- D-04: Staged diff contained only effort= line changes — no prose/documentation drift
- D-05: Single atomic commit with exact message `chore: add null-omit comments to effort= lines in Agent invocations`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- Commit 4de5a455 exists: confirmed
- 50 commented lines: confirmed (grep count = 50)
- 0 uncommented standalone lines: confirmed (grep count = 0)
- Working tree clean: confirmed (git status --porcelain empty)
