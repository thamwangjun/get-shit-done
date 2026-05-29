---
phase: quick
plan: 260529-nyk
subsystem: observability
tags: [revert, cleanup, v1.01.0]
key_files:
  deleted:
    - get-shit-done/bin/lib/observability/event.cjs
    - get-shit-done/bin/lib/observability/logger.cjs
    - get-shit-done/bin/lib/observability/redaction.cjs
    - tests/observability/event.test.cjs
    - tests/observability/hub-logger-integration.test.cjs
    - tests/observability/logger.test.cjs
    - tests/observability/redaction.test.cjs
    - tests/dispatch/trace-correlation.test.cjs
  reverted:
    - get-shit-done/bin/lib/command-routing-hub.cjs
metrics:
  completed: "2026-05-29"
---

# Quick Task 260529-nyk: Revert Observability Layer to v1.01.0

**One-liner:** Deleted observability source (3 files) and all 5 observability/dispatch test files; reverted command-routing-hub.cjs to pre-observability state (d011a6fac, before #177/#178).

## What Was Done

- Deleted `get-shit-done/bin/lib/observability/` (3 source files: event.cjs, logger.cjs, redaction.cjs) — fork-specific additions not in v1.01.0
- Deleted `tests/observability/` (4 test files) — fork-specific additions
- Deleted `tests/dispatch/trace-correlation.test.cjs` — fork-specific addition
- Reverted `get-shit-done/bin/lib/command-routing-hub.cjs` to d011a6fac (pre-#177 state — removes observability seam while keeping #175 SDK-drop and #176 typed Result)

## Deviation from Plan

The plan specified reverting to `v1.01.0` tag content, but v1.01.0 still contains the original hub requiring a `mode` parameter. The current `phase-command-router.cjs` was already updated for the `#175` hub (no mode, CJS-only). Using v1.01.0 hub content caused test failures. Correct target was d011a6fac (the commit immediately before the observability seam was added in #177), which is the intended "remove observability" state.

`tests/command-routing-hub.test.cjs` required no changes — the working tree version already matched the pre-observability state.

## Self-Check: PASSED

- Commit `bef58d60` exists on branch dev
- npm test passes (all failures are pre-existing, confirmed by baseline run before changes)
- No remaining observability imports in get-shit-done/bin/
