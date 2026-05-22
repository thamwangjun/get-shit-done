---
status: complete
phase: 04-fix-background-update-check-hook
source: [04-01-SUMMARY.md]
started: 2026-04-17T08:00:00Z
updated: 2026-04-17T08:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Worker Exits Cleanly
expected: Run `node hooks/gsd-check-update-worker.js` directly. The script exits without throwing a ReferenceError or any crash. (Network failure is OK — the worker should silently write result with no update_available rather than crash.)
result: pass

### 2. SHA Match — No Update Notification
expected: When the installed SHA (7-char) matches the latest commit on thamw-main, `isNewer` returns false and no "update available" message appears in the statusline output.
result: pass
verified_by: tests/semver-compare.test.cjs — "same 7-char SHA — no update"

### 3. SHA Mismatch — Update Notification Fires
expected: When the installed SHA differs from the latest commit on thamw-main, `isNewer` returns true and the statusline shows an update notification.
result: pass
verified_by: tests/semver-compare.test.cjs — "different 7-char SHA — update available"

### 4. Stale Hooks Warning Renders Without Semver
expected: The statusline shows the stale-hooks warning line unconditionally (no semver parsing, no isDevInstall check). The warning appears when hooks are out of date.
result: pass

### 5. SHA Equality Tests Pass
expected: Running `npm test` (or `node --test tests/semver-compare.test.cjs`) shows all 9 SHA equality test cases passing. No semver test cases remain.
result: pass
verified_by: node --test tests/semver-compare.test.cjs — 9/9 pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
