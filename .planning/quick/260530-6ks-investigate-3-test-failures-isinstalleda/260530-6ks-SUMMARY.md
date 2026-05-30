---
phase: quick
plan: 260530-6ks
subsystem: tests
tags: [test-fix, semver, eta-template]
key-files:
  modified:
    - tests/gsd-statusline.test.cjs
    - tests/ingest-docs.test.cjs
decisions:
  - Remove upstream semver tests with no corresponding implementation in this fork
  - Fix eta template regex to match CLAUDE.md mandate (<%~ not {%~)
metrics:
  completed: 2026-05-30
---

# Quick 260530-6ks: Fix 3 Test Failures Summary

SHA-based fork removed semver comparison; removed dead upstream test artifacts and corrected banned eta template syntax in test regex.

## What Was Fixed

### Fix 1 & 2 — Remove dead semver tests (tests/gsd-statusline.test.cjs)

Removed `isInstalledAheadOfLatest` from the destructured import and deleted the entire `describe('isInstalledAheadOfLatest', ...)` block (2 tests). The function was removed from `hooks/gsd-statusline.js` in commit `292c92e5` when the fork switched from semver-based to SHA-based dev-install detection. These were upstream artifacts with no corresponding implementation.

### Fix 3 — Fix eta regex in ingest-docs test (tests/ingest-docs.test.cjs)

Changed `\{%~` to `<%~` in the regex on line 300. The file `commands/gsd/import.md` correctly uses the angle-bracket form `<%~`. CLAUDE.md mandates `<%~` and bans `{%~`. The test was asserting for the banned form and therefore never matched.

## Files Changed

| File | Change |
|------|--------|
| `tests/gsd-statusline.test.cjs` | Removed dead import + 2 dead tests (11 lines deleted) |
| `tests/ingest-docs.test.cjs` | Fixed regex: `{%~` → `<%~` |

## Commit

`ffa2703b` — fix(260530-6ks): remove dead semver tests and fix eta regex in ingest-docs test

## Self-Check: PASSED

- Commit ffa2703b exists in git log
- Both files modified as specified
- No SUMMARY.md or PLAN.md committed (orchestrator handles docs commit)
