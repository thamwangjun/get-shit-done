---
phase: quick
plan: 260529-inw
subsystem: test-suite
tags: [analysis, test-diff, upstream-comparison]
dependency_graph:
  requires: []
  provides: [test-suite-diff-analysis]
  affects: []
tech_stack:
  added: []
  patterns: []
key_files:
  created:
    - .planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/260529-inw-ANALYSIS.md
  modified: []
decisions:
  - Read-only analysis — no code changes made
metrics:
  completed: "2026-05-29"
---

# Quick Task 260529-inw: Test Suite Comparison Summary

**One-liner:** Structured diff of 84 test files (26 added, 58 modified, 0 deleted) between dev HEAD and upstream v1.01.0 commit 13c64e02, capturing five distinct divergence patterns.

## What Was Done

Fetched upstream commit 13c64e02999a41e180fa498085a4ac4674077a2d (already locally available), then ran a full file-structure and test-case-content diff across `tests/*.test.cjs` and `tests/**/*.test.cjs`. All findings written to ANALYSIS.md.

## Key Findings

The fork's test suite is substantially larger than upstream v1.01.0:
- 84 total files touched (26 added, 58 modified, 0 deleted)
- 7,867 lines inserted, 896 deleted
- 81 root-level test files in HEAD vs 55 in upstream (+26 fork-only)
- 5 test files in subdirectories (`tests/observability/`, `tests/dispatch/`) — none in upstream

Five structural divergence categories identified:

1. **SHA-based versioning (~15 files):** Upstream migrated to semver; fork reverted to 7-char git SHA equality. `semver-compare.test.cjs`, `bug-2992-check-latest-version.test.cjs`, and 5 other files were rewritten. `changeset-cli.test.cjs` lost its entire `extract` describe block (308 lines) as the semver extract subcommand was reverted.

2. **Eta template migration (~12 files):** Fork converted `@~/.claude/...` notation to Eta `<%~ include(...)` syntax. Tests that asserted the old syntax are either updated to dual-regex or skipped with `{ skip: 'fork intentionally diverges from upstream contract' }`.

3. **Fork-specific infrastructure (~10 new files):** Staging scripts, prompt engineering scanner (`negative-framing-scan.test.cjs`, 1,424 lines), CATALOGUE.json sync guard, commit verification snapshots, and bug regression tests for fork-only issues.

4. **Observability layer (4 new files):** `tests/observability/` directory and `tests/dispatch/trace-correlation.test.cjs` covering dispatch events, traceId propagation, logger behavior, and arg redaction.

5. **Positive framing enforcement:** Fork's CLAUDE.md mandates affirmative directives. Affected tests updated to match new wording; upstream tests that can't match are suppressed with `.skip` rather than deleted.

## Deviations from Plan

None — plan executed exactly as written. Read-only analysis, no code changes made.

## Self-Check: PASSED

- ANALYSIS.md exists at `.planning/quick/260529-inw-compare-test-suite-of-current-branch-vs-/260529-inw-ANALYSIS.md`
- Contains all four diff categories (Added Test Files, Removed Test Files, Renamed Test Files, Modified Test Files)
- Contains Observations / Why The Difference section
- No code changes committed
