---
phase: 260610-heg
plan: "01"
subsystem: tests
tags: [refactor, allowlist, citation-guard]
dependency_graph:
  requires: []
  provides: [two-tier-allowlist-guard]
  affects: [tests/no-issue-citations.test.cjs]
tech_stack:
  added: []
  patterns: [per-file-allowlist, optional-chain-lookup]
key_files:
  modified:
    - tests/no-issue-citations.test.cjs
key_decisions:
  - "Two-tier allowlist: PLACEHOLDER_DIGITS (global) + FILE_ALLOWLIST (per-file) restricts functional cross-ref exemptions to only the specific files that need them"
  - "FILE_ALLOWLIST[relPath]?.has(digit) optional chaining means unit tests calling scanContent(literal) without relPath are unaffected — FILE_ALLOWLIST[undefined] is undefined, optional chain short-circuits"
metrics:
  duration: "5 minutes"
  completed_date: "2026-06-10"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 260610-heg Plan 01: Refactor no-issue-citations.test.cjs allowlist Summary

Two-tier citation guard: PLACEHOLDER_DIGITS slimmed to illustrative placeholders {1,2,45,123}; FILE_ALLOWLIST added to scope functional cross-refs (#1729, #2439, #2924, #3542) to exactly the three files that require them.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor allowlist to two-tier structure | 23089feb | tests/no-issue-citations.test.cjs |

## What Was Built

Modified `tests/no-issue-citations.test.cjs` with coordinated edits:

1. `PLACEHOLDER_DIGITS` slimmed from `new Set([1, 2, 45, 123, 1729, 2439, 2924, 3542])` to `new Set([1, 2, 45, 123])` — strictly illustrative placeholders only.

2. New `FILE_ALLOWLIST` constant added immediately after `PLACEHOLDER_DIGITS`, mapping three files to their functional cross-reference digit Sets:
   - `commands/gsd/config.md` → `{2439}`
   - `get-shit-done/references/thinking-partner.md` → `{1729}`
   - `agents/gsd-executor.md` → `{2924, 3542}`

3. `scanContent()` signature updated to `function scanContent(content, relPath)` with JSDoc `@param` for the new `relPath` parameter.

4. Inline skip changed from `if (PLACEHOLDER_DIGITS.has(digit)) continue;` to `if (PLACEHOLDER_DIGITS.has(digit) || FILE_ALLOWLIST[relPath]?.has(digit)) continue;`.

5. Corpus describe block updated to call `scanContent(content, relPath)`.

6. Module-level JSDoc `Allowlist policy:` section updated to document both tiers.

7. Redundant pre-`PLACEHOLDER_DIGITS` comment block replaced with a tight 2-line comment pointing to `FILE_ALLOWLIST`.

## Verification Results

All plan verification checks pass:
- `PLACEHOLDER_DIGITS` reads exactly `new Set([1, 2, 45, 123])` — one match
- `FILE_ALLOWLIST[relPath]?.has(digit)` in inline skip — one match
- `scanContent(content, relPath)` in corpus loop — one match
- All three FILE_ALLOWLIST entries present with correct keys and digit Sets
- `npm test`: 9019 pass, 0 fail, 10 skipped (exit code 0)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. This change modifies only a test file; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- File modified: `/Users/thamw/development/local/get-shit-done/tests/no-issue-citations.test.cjs` — FOUND
- Commit 23089feb — FOUND (current HEAD on dev branch)
- npm test: 9019 pass, 0 fail — VERIFIED
