---
phase: 05-regression-coverage
fixed_at: 2026-04-17T00:00:00Z
review_path: .planning/phases/05-regression-coverage/05-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-04-17
**Source review:** .planning/phases/05-regression-coverage/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Serial file list uses hardcoded forward-slash paths — breaks on Windows

**Files modified:** `scripts/run-tests.cjs`
**Commit:** 86e7bcd
**Applied fix:** Converted `SERIAL_FILES` from a plain array of string literals to a `Set` built by mapping each entry through `join(f)` (single-arg `path.join`), which normalises path separators to the OS-native form. Comparison uses `SERIAL_FILES.has(f)` instead of `Array.includes()`. This ensures the string comparison works correctly on Windows where `path.join('tests', f)` produces backslash-separated paths.

### WR-02: `spawnSync` in `runInstaller` has no timeout — test suite can hang indefinitely

**Files modified:** `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs`
**Commit:** 3737ea2
**Applied fix:** Added `timeout: 30_000` (30 seconds) to the `spawnSync` options object in `runInstaller`. Updated the return value to expose `timedOut: result.signal === 'SIGTERM'` and map a signalled exit to `status: 1`, matching the reviewer's suggested interface so callers can assert `!result.timedOut` for a clear failure message.

---

_Fixed: 2026-04-17_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
