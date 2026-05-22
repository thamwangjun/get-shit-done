---
status: complete
phase: 32-quick-test-fixes
source: [32-01-SUMMARY.md]
started: 2026-05-14T00:00:00Z
updated: 2026-05-14T00:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Managed-hooks test suite passes
expected: Run the managed-hooks test file. All 3 subtests pass. `gsd-update-banner.js` is present in the MANAGED_HOOKS array in hooks/gsd-check-update-worker.js, alphabetically between `gsd-check-update.js` and `gsd-context-monitor.js`.
result: pass

### 2. Platform-gate tests show as skipped (not failing)
expected: Run `gsd-check-update-worker-platform-gate.test.cjs`. The Windows npm spawn describe block is `describe.skip` with an inline fork-architecture comment. The 4 subtests show as skipped on POSIX CI — zero failures in that file.
result: pass

### 3. Phase-30 affirmative replacements subtest passes
expected: Run `phase-30-affirmative-replacements.test.cjs`. The subtest that checks `extract-learnings.md` passes — the test name, readFile path, and assert message all use hyphen (not underscore).
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
