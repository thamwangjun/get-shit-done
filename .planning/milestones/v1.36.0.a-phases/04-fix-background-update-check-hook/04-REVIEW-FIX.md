---
phase: 04-fix-background-update-check-hook
fixed_at: 2026-04-17T07:34:55Z
review_path: .planning/phases/04-fix-background-update-check-hook/04-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-04-17T07:34:55Z
**Source review:** .planning/phases/04-fix-background-update-check-hook/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: `fs.existsSync` called with potentially `undefined` path when env vars are unset

**Files modified:** `hooks/gsd-check-update-worker.js`
**Commit:** 7b78d13
**Applied fix:** Added `|| ''` fallback to `GSD_PROJECT_VERSION_FILE` and `GSD_GLOBAL_VERSION_FILE` env var reads so `fs.existsSync` receives an empty string (returns `false`) instead of `undefined` (emits DEP0187 deprecation) when env vars are absent.

### WR-02: Stale-hook check does not normalize SHA length before comparison

**Files modified:** `hooks/gsd-check-update-worker.js`
**Commit:** 7b78d13
**Applied fix:** Introduced a local `norm` helper (committed alongside WR-01 in the same file) that slices both sides of the stale-hook comparison to 7 characters, preventing a full 40-char SHA in the VERSION file from causing false positives against 7-char hook headers.

### WR-03: TOCTOU race in statusline todo-file sorting

**Files modified:** `hooks/gsd-statusline.js`
**Commit:** 78ccec0
**Applied fix:** Wrapped the `fs.statSync` call inside a per-file `try/catch` that returns `null` on failure (file vanished between `readdirSync` and `statSync`), followed by `.filter(Boolean)` to drop nulls before sorting. This degrades gracefully on ENOENT without masking unrelated errors in the outer catch.

---

_Fixed: 2026-04-17T07:34:55Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
