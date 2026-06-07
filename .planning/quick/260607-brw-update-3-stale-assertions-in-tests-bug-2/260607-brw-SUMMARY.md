---
phase: quick-260607-brw
plan: "01"
subsystem: tests
tags: [bug-fix, test-assertions, regression, sdk-resolution]
dependency_graph:
  requires: []
  provides: [BUG-2801-STALE]
  affects: [tests/bug-2801-ingest-docs-handler.test.cjs]
tech_stack:
  added: []
  patterns: [#3668 SDK-resolution fallback pattern]
key_files:
  created: []
  modified:
    - tests/bug-2801-ingest-docs-handler.test.cjs
decisions:
  - Strip bash comments before scanning for gsd-sdk references (comment line contained the token)
metrics:
  duration: ~5min
  completed: 2026-06-07
---

# Phase quick-260607-brw Plan 01: Update stale bug-2801 test assertions Summary

**One-liner:** Relaxed the 3 stale bug-2801 test assertions to accept the #3668 SDK-resolution fallback block while preserving the original primary-gsd-sdk-call prohibition.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Relax no-gsd-sdk assertion to allow #3668 fallback lines | 29fa5de8 | tests/bug-2801-ingest-docs-handler.test.cjs |
| 2 | Reconcile init assertion with #3668 fallback form | 29fa5de8 | tests/bug-2801-ingest-docs-handler.test.cjs |

## Changes Made

### Task 1: No-gsd-sdk assertion

The original `assert.deepStrictEqual(sdkCalls, [])` was a blanket ban on all `gsd-sdk` references. The #3668 fallback block added three legitimate references:
- `command -v gsd-sdk` (PATH probe)
- `GSD_SDK="gsd-sdk"` (variable assignment)
- `gsd-sdk not found` (error message)

The updated test filters out these three patterns, then asserts the remaining set is empty. A separate positive guard asserts no line matches `/\bgsd-sdk\s+(query|init)\b/` (the original bug-2801 regression form). Both filters also skip comment lines (`/^\s*#/`) to avoid false positives from the SDK-resolution comment header.

The describe block title was updated to: `'bug-2801: ingest-docs.md workflow uses #3668 SDK-resolution (no primary gsd-sdk call)'`.

### Task 2: Init-step assertion

The old assertion required a literal `node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs init ingest-docs` line. Under #3668, the workflow builds the path via a `GSD_TOOLS` variable. The updated assertion checks for all three required elements:
1. `GSD_TOOLS=.*get-shit-done/bin/gsd-tools.cjs` — local path resolution
2. `GSD_SDK="node $GSD_TOOLS"` — canonical node invocation assignment
3. `$GSD_SDK (query )?init.*ingest-docs` — init call via the resolved variable

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `node --test tests/bug-2801-ingest-docs-handler.test.cjs`: 9/9 pass, 0 fail
- `git status --porcelain get-shit-done/workflows/`: empty (workflow untouched)
- Only `tests/bug-2801-ingest-docs-handler.test.cjs` modified

## Self-Check: PASSED

- [x] Commit 29fa5de8 exists and contains only the test file
- [x] All 9 tests pass
- [x] Workflow files unmodified
