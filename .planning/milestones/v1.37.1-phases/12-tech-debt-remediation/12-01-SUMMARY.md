---
phase: 12-tech-debt-remediation
plan: "01"
subsystem: hooks, agents
tags: [tdz-fix, required-reading, positive-framing, infrastructure]
dependency_graph:
  requires: []
  provides: [IN-01-resolved, WR-03-resolved]
  affects: [hooks/gsd-check-update-worker.js, agents/gsd-intel-updater.md]
tech_stack:
  added: []
  patterns: [canonical-required-reading-block, positive-framing-directive]
key_files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - agents/gsd-intel-updater.md
decisions:
  - "let latest moved above writeResult() — purely declarative reorder, no logic change"
  - "required_reading prose replaced with canonical @file pattern matching gsd-debugger.md"
  - "NEVER prohibition reframed as positive skip-and-exclude directive per fork framing standard"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-21T11:59:55Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 12 Plan 01: Infrastructure Targeted Fixes Summary

Two isolated audit items fixed before Wave 2 begins: temporal dead zone in JS worker (IN-01) and malformed required_reading block plus unpaired NEVER directive in one agent file (WR-03).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | IN-01 — Move let latest = null above writeResult() | af0fe33 | hooks/gsd-check-update-worker.js |
| 2 | WR-03 — Replace prose required_reading block and reframe NEVER line | 4025e77 | agents/gsd-intel-updater.md |

## What Was Built

### Task 1: IN-01 — Temporal Dead Zone Fix

`let latest = null` was declared after `function writeResult()`, creating a temporal dead zone: `writeResult()` referenced `latest` before its declaration in source order. While `var` hoisting would allow this, `let` does not — the declaration was moved above the function definition.

Change: `let latest = null` on line 98 moved to line 85 (immediately before `function writeResult()`). Net effect: two lines reordered, identical logic.

### Task 2: WR-03 — required_reading Block and NEVER Line

Two edits to `agents/gsd-intel-updater.md`:

**Edit A (required_reading block):** The 5-line prose block explaining *why* to read required_reading files was replaced with the canonical 3-line `@file` reference pattern used by all other agents (e.g., `gsd-debugger.md` lines 35-37). The prose block was self-referential and non-functional — the `@file` pattern is what the runtime actually resolves.

**Edit B (NEVER line):** `When exploring, NEVER read or include in your output:` replaced with `When exploring, skip and exclude these file types from all output:` — positive action directive per fork framing standard. The forbidden file list following this line is unchanged.

## Verification

```
PASS: has @file ref
PASS: no prose block
PASS: no NEVER line
PASS: has skip-and-exclude
PASS: let latest appears before writeResult
```

Full test suite: **4142/4142 passing** (no regressions from baseline).

## Deviations from Plan

None — plan executed exactly as written.

The plan's verification script (`cd /home/thamw/development/happier/get-shit-done && node -e ...`) references the main repo path rather than the worktree path. Verification was run with the worktree-absolute path and passed. This is a documentation-only discrepancy with no functional impact.

## Known Stubs

None.

## Threat Flags

No new security-relevant surface introduced. Both changes are text/declaration reorders within existing files.

## Self-Check: PASSED

- [x] `hooks/gsd-check-update-worker.js` exists and modified
- [x] `agents/gsd-intel-updater.md` exists and modified
- [x] Commit af0fe33 exists in git log
- [x] Commit 4025e77 exists in git log
- [x] 4142/4142 tests pass
