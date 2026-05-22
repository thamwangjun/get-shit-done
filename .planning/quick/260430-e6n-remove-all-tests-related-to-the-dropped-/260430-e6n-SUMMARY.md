---
quick_id: 260430-e6n
slug: remove-all-tests-related-to-the-dropped-
description: Remove all tests related to the dropped XML tag conversion requirement (fork-persona-tag.test.cjs, fork-intent-tag.test.cjs). Update npm test suite accordingly.
date: 2026-04-30
status: complete
---

# Summary: Quick Task 260430-e6n

## What Was Done

Deleted the two corpus-scan test files that enforced the now-dropped XML tag conversion requirements. Updated active planning docs to reflect their removal. Verified all failures in the test suite are pre-existing (not caused by this change).

## Changes Made

### Deleted test files
- `tests/fork-persona-tag.test.cjs` — 52 lines, 62 subtests (31 agents × 2 checks)
- `tests/fork-intent-tag.test.cjs` — 59 lines, 79 subtests (one per command file)

The test runner (`scripts/run-tests.cjs`) auto-discovers tests via `readdirSync` — no de-registration needed.

### `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`
- Four-level tag hierarchy note updated: tests are removed, not "remaining in suite"
- Upstream Merge Checklist: removed `fork-persona-tag.test.cjs` and `fork-intent-tag.test.cjs` references; simplified new-agent/command/workflow steps to positive framing only

### `.planning/PROJECT.md`
- Shipped Milestone v1.37.1b: added "(deleted 2026-04-30 — requirement dropped)" note to both test file entries
- Context section: updated test suite note; removed fork-specific test guard references

## Test Suite Verification

Pre-deletion baseline had multiple pre-existing failures (agent-frontmatter, negative-framing-scan, verification-overrides, hooks tests). All failures present before and after deletion — removal of these two files introduced zero new failures.
