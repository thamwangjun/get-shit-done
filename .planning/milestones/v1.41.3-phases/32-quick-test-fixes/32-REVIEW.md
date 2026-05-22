---
phase: 32-quick-test-fixes
reviewed: 2026-05-13T11:12:44Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - hooks/gsd-check-update-worker.js
  - tests/gsd-check-update-worker-platform-gate.test.cjs
  - tests/phase-30-affirmative-replacements.test.cjs
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 32: Code Review Report

**Reviewed:** 2026-05-13T11:12:44Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the GitHub API update worker hook, the Windows npm spawn platform gate test suite, and the Phase 30 affirmative replacements test.

The affirmative replacements test is clean — all 9 tests pass, all target strings are present in their respective workflow/agent files, and the `readFile` helper and `PROJECT_ROOT` calculation are correct.

The platform gate test file is intentionally skipped via `describe.skip`, consistent with the fork decision recorded in project memory (HDOC skip pattern). The skip is appropriate and the annotation (`allow-test-rule`) satisfies the `lint-no-source-grep` rule.

The worker hook (`gsd-check-update-worker.js`) has two defects worth addressing:

1. A potential double invocation of `writeResult()` when a request times out — `req.destroy()` can emit an `error` event that fires the `req.on('error')` handler, and then the `req.on('timeout')` callback continues to call `writeResult()` a second time.

2. The `isNewer` function's comment ("SHA equality semantics") implies a normalised comparison, and the stale-hook checker nearby uses `norm()` on both sides for exactly this reason — but `isNewer` compares a 7-char `latest` against the raw `installed` string without normalising `installed`. In the current install path `installed` is always a 7-char SHA (via `git rev-parse --short=7`), so there is no production breakage today. However, the asymmetry makes the code fragile: any future change that stores a full 40-char SHA in the VERSION file (e.g. a tarball install path change) would cause `isNewer` to return `true` permanently, producing a persistent false "update available" banner. The stale-hook check already has the correct defensive pattern with `norm()`; `isNewer` should match it.

## Warnings

### WR-01: `isNewer` does not normalise `installed` to 7-char prefix — asymmetric comparison

**File:** `hooks/gsd-check-update-worker.js:86`
**Issue:** `latest` is always a 7-char string (set via `sha.slice(0, 7)` on line 121), but `installed` is passed in as-is from the VERSION file without normalisation. The comment on line 84 states "SHA equality semantics (D-01)" and the adjacent stale-hook check at lines 70–71 explicitly uses `norm()` on both sides to guard against this exact asymmetry. If `installed` ever holds a full 40-char SHA (e.g. future tarball install, manual edit, or a change to the install path that drops `--short=7`), `isNewer` will permanently return `true` regardless of actual version match, flooding the user with false update banners.

**Fix:**
```js
// Before (line 86):
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

// After — normalise both sides, mirroring the stale-hook check at lines 70-71:
function isNewer(latest, installed) {
  if (!latest) return false;
  const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
  return norm(latest) !== norm(installed);
}
```

---

### WR-02: `writeResult()` may be called twice on request timeout

**File:** `hooks/gsd-check-update-worker.js:128-129`
**Issue:** The timeout handler calls `req.destroy()` and then immediately calls `writeResult()`. In Node.js, `req.destroy()` can synchronously emit an `error` event on the underlying socket, which fires the `req.on('error')` handler (line 128) — also calling `writeResult()` — before the timeout callback returns. The result is two `fs.writeFileSync` calls against `cacheFile` in rapid succession. In the current implementation both writes produce identical data (since `latest` is `null` at timeout time), so there is no data corruption, but the pattern is fragile: if `writeResult` ever gains a side effect (e.g. a counter increment, a log call) or if write ordering ever matters, this silent double-fire becomes a real bug.

**Fix:** Guard with a `wrote` flag to ensure `writeResult` is called at most once:
```js
let wrote = false;
function writeResult() {
  if (wrote) return;
  wrote = true;
  const result = { /* ... */ };
  if (cacheFile) {
    try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
  }
}
```

---

## Info

### IN-01: Platform gate test's `describe.skip` silently drops 4 tests from the test counter

**File:** `tests/gsd-check-update-worker-platform-gate.test.cjs:39`
**Issue:** `describe.skip(...)` causes node:test to report `0 tests, 0 skipped` for the entire suite — the inner tests do not appear in skip counts. This is different from wrapping each test with `test.skip()`, which would surface them as `skipped: 4`. Anyone auditing the total test count will see 0 from this file, not 4 skipped. This is consistent with the project's existing HDOC skip decision (recorded in project memory) and does not represent incorrect behavior, but readers expecting a skip count may be surprised.

**Fix:** If visibility in the skip counter matters, replace `describe.skip(...)` with individual `test.skip(...)` calls inside a plain `describe(...)`. If the current invisibility is intentional (keeping the count clean), document it explicitly in the file's header comment, as the HDOC pattern does.

---

_Reviewed: 2026-05-13T11:12:44Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
