---
phase: 05-regression-coverage
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs
  - scripts/run-tests.cjs
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two new source files were reviewed: the regression test suite for the hooks on-demand build fix (bug-1924) and the cross-platform test runner script. The test suite correctly models the fresh-clone scenario, uses proper setup/teardown lifecycle hooks, and makes meaningful assertions. The runner correctly separates serial from parallel test files.

Two warnings were found: a cross-platform path separator bug in the serial/parallel file segregation logic that would silently cause race conditions on Windows, and a missing timeout on `spawnSync` that can cause the test suite to hang indefinitely. One info item notes the global `before()` setup uses `execFileSync` without error handling context, which produces cryptic failures when the build script fails.

---

## Warnings

### WR-01: Serial file list uses hardcoded forward-slash paths — breaks on Windows

**File:** `scripts/run-tests.cjs:24-26`

**Issue:** `SERIAL_FILES` contains forward-slash paths (`'tests/bug-1924-...'`), but `allFiles` is built using `path.join('tests', f)` which produces backslash-separated paths on Windows (e.g., `tests\bug-1924-...`). The `Array.includes()` comparison is strict string equality, so on Windows no entry in `allFiles` will ever match `SERIAL_FILES`. The bug-1924 test file — which mutates the shared `hooks/dist/` directory — would then run as a parallel test, creating race conditions between concurrent test runners.

**Fix:** Use `path.join` (or `path.normalize`) consistently when constructing `SERIAL_FILES`, or normalise both sides before comparison:

```js
// Option A: normalize SERIAL_FILES to use OS-native separators
const SERIAL_FILES = new Set([
  'tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs',
].map(f => path.normalize(f)));

const serialFiles  = allFiles.filter(f => SERIAL_FILES.has(f));
const parallelFiles = allFiles.filter(f => !SERIAL_FILES.has(f));
```

---

### WR-02: `spawnSync` in `runInstaller` has no timeout — test suite can hang indefinitely

**File:** `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs:88-96`

**Issue:** `spawnSync` is called without a `timeout` option. If the installer or the on-demand build hangs (e.g., due to a subprocess waiting for stdin, a network call, or a deadlock), every test that calls `runInstaller` will block forever. Each of the eight tests in the suite calls `runInstaller`, so a single hung child process stalls the entire run with no output and no automatic recovery.

**Fix:** Add a reasonable timeout (e.g., 30 seconds) and handle the `ETIMEDOUT` signal in the result:

```js
const result = spawnSync(
  process.execPath,
  [INSTALL_SCRIPT, '--claude', '--global', '--yes'],
  {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    timeout: 30_000,  // 30 s — well above typical install time
  }
);

// result.signal === 'SIGTERM' when timeout fires
return {
  stdout: result.stdout || '',
  stderr: result.stderr || '',
  status: result.signal ? 1 : result.status,
  timedOut: result.signal === 'SIGTERM',
};
```

Callers can then assert `!result.timedOut` for a clearer failure message.

---

## Info

### IN-01: Global `before()` build failure produces an unformatted crash rather than a test-level diagnostic

**File:** `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs:40-45`

**Issue:** `execFileSync` in the global `before()` hook throws a raw `Error` with a long stack trace when the build script exits non-zero. The thrown error propagates through `node:test`'s lifecycle as an unhandled exception, making it hard to distinguish a build failure from a test failure. Adding explicit error handling would produce a clearer diagnostic.

**Fix:**

```js
before(() => {
  const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    throw new Error(
      `Global setup: build-hooks.js failed (exit ${result.status}).\n` +
      `stderr:\n${result.stderr}\nstdout:\n${result.stdout}`
    );
  }
});
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
