---
phase: 04-fix-background-update-check-hook
plan: "01"
subsystem: hooks
tags: [bugfix, hooks, update-check, sha-versioning, github-api]
dependency_graph:
  requires: []
  provides:
    - SHA-based update detection via GitHub API in gsd-check-update-worker.js
    - Stale-hooks warning without semver comparison in gsd-statusline.js
    - SHA equality test coverage replacing semver tests
  affects:
    - hooks/gsd-check-update-worker.js
    - hooks/gsd-statusline.js
    - tests/semver-compare.test.cjs
tech_stack:
  added:
    - Node.js built-in https module for GitHub API fetch
  patterns:
    - Callback-based async HTTPS GET (avoids top-level await / module type change)
    - SHA 7-char truncation comparison for fork versioning
    - writeResult() called only inside async callbacks (end/error/timeout)
key_files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - hooks/gsd-statusline.js
    - tests/semver-compare.test.cjs
decisions:
  - "D-01: Retain isNewer function name with new SHA equality body — latest.slice(0,7) !== installed"
  - "D-02: Replace npm exec with https.get() to GitHub Commits API"
  - "D-05: Remove isDevInstall IIFE entirely — SHA versioning has no ordered ahead/behind semantics"
  - "D-06: On network failure writeResult() called with latest=null, update_available=false — silent no-false-positive"
metrics:
  duration: ~10 minutes
  completed: "2026-04-17T07:21:37Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 4 Plan 01: Fix Background Update-Check Hook Summary

## What Was Built

Three targeted fixes to the GSD fork's update-check infrastructure, correcting all three bugs introduced when the worker was extracted to its own file.

**Task 1 — gsd-check-update-worker.js:** Replaced `execFileSync('npm', ['view', 'get-shit-done-cc', 'version', ...])` with a callback-based `https.get()` call to `api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main`. Defined `isNewer(latest, installed)` with SHA equality semantics (`!!latest && latest.slice(0, 7) !== installed`). Added `writeResult()` helper called only from async callbacks. Added SHA validation regex `/^[0-9a-f]{40}$/` before storing (T-04-01 mitigation).

**Task 2 — gsd-statusline.js:** Removed the `isDevInstall` IIFE and `parseV` semver split. `parseV` silently produced `NaN` for SHA strings like `a1b2c3d` (since `Number('a1b2c3d')` is `NaN`), making `isDevInstall` always return `false` — permanently dead code under SHA versioning. Replaced the conditional with a single unconditional stale-hooks warning line.

**Task 3 — tests/semver-compare.test.cjs:** Rewrote the test file from scratch. Replaced the semver `isNewer` mirror and 12 semver test cases with 9 SHA equality test cases covering: 7-char match/mismatch, 40-char truncation, null/undefined/empty guards, D-06 failure fallback, and `installed='unknown'` edge case.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | `66e355b` | fix(04-01): replace npm fetch with GitHub API, define isNewer in worker |
| Task 2 | `c7bb40d` | fix(04-01): remove isDevInstall semver branch from statusline |
| Task 3 | `1f5619b` | test(04-01): replace semver tests with SHA equality tests |

## Verification Results

All 8 plan verification checks passed:

1. `node hooks/gsd-check-update-worker.js` exits 0 — no ReferenceError
2. `grep execFileSync|get-shit-done-cc hooks/gsd-check-update-worker.js` — no matches
3. `grep https.get|function isNewer|thamwangjun hooks/gsd-check-update-worker.js` — all match (lines 77, 96, 97)
4. `grep parseV|isDevInstall|dev install hooks/gsd-statusline.js` — no matches
5. `grep 'stale hooks' hooks/gsd-statusline.js` — matches line 214
6. `grep 'SHA equality' tests/semver-compare.test.cjs` — matches line 20
7. `npm test` — 3930/3930 pass, 0 failures
8. `npm run build:hooks` — all 10 hooks copied to dist/, build complete

## Requirements Satisfied

| Requirement | Status |
|-------------|--------|
| HOOK-01: No spurious notification when SHA matches | Satisfied — isNewer returns false for same 7-char SHA |
| HOOK-02: Notification when SHA differs | Satisfied — isNewer returns true for different SHA |
| HOOK-03: Worker runs without ReferenceError | Satisfied — isNewer defined before use |
| HOOK-04: Worker compares against fork's GitHub repo | Satisfied — https.get to api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main |

## Deviations from Plan

None — plan executed exactly as written. All three targeted edits matched the plan's specified before/after blocks.

## Threat Surface Scan

No new security surface introduced. The `https.get()` call mirrors the existing pattern in `bin/install.js` (lines 58-73). SHA validation with `/^[0-9a-f]{40}$/` is in place per T-04-01.

## Self-Check: PASSED

- `hooks/gsd-check-update-worker.js`: FOUND
- `hooks/gsd-statusline.js`: FOUND (modified)
- `tests/semver-compare.test.cjs`: FOUND (modified)
- Commit `66e355b`: FOUND
- Commit `c7bb40d`: FOUND
- Commit `1f5619b`: FOUND
- npm test: 3930/3930 pass
