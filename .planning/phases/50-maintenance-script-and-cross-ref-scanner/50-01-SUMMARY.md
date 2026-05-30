---
phase: 50-maintenance-script-and-cross-ref-scanner
plan: 01
subsystem: testing
tags: [step-numbering, scanner, regex, list-markers, blockquote, corpus-scan]

# Dependency graph
requires: []
provides:
  - "Hardened scanForOutOfOrder() with list-marker and blockquote stripping before anchor match"
  - "Flipped G-01 limitation test: now asserts detection works rather than documents the limitation"
  - "Three new companion unit tests for numbered-list, blockquote, and asterisk-list prefixes"
affects: [50-02-normalize-script, 50-03-cross-file-scanner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "strip-then-match: strip leading list/blockquote markers before applying step-number anchor regex"
    - "permissive anchor ^[\\s*]*Step after marker stripping replaces narrow ^\\s*\\*?\\*?Step"

key-files:
  created: []
  modified:
    - tests/step-numbering-scan.test.cjs

key-decisions:
  - "Two-step strip-then-match chosen over widening the original single regex — cleaner and avoids false positives in the permissive anchor"
  - "Anchor widened from ^\\s*\\*?\\*? to ^[\\s*]* on the stripped string — handles any remaining ** bold markers after stripping list prefixes"
  - "G-01 limitation test renamed and flipped rather than deleted — preserves test intent, replaces documentation of limitation with active assertion"
  - "KNOWN LIMITATION comment block retained with updated Phase 50 Plan 1 attribution — historical context valuable for future maintainers"

patterns-established:
  - "Corpus regression gate (629 subtests) serves as safety net for any anchor changes — permissive widening risks are caught immediately"

requirements-completed: [NORM-02]

# Metrics
duration: 8min
completed: 2026-05-30
---

# Phase 50 Plan 01: Scanner Anchor Hardening Summary

**scanForOutOfOrder() hardened to detect list-marker and blockquote prefixed step labels via strip-then-match; G-01 limitation test flipped from asserting failure to asserting detection; subtest count rises 629 to 632**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-30T18:12:00Z
- **Completed:** 2026-05-30T18:13:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced single `line.match()` call in `scanForOutOfOrder()` with two-step strip-then-match: strip `/^(\s*(?:[-*+]|\d+\.|>)\s*)+/` then match `^[\s*]*Step\s+(\d+)(?![\.\da-z])/i`
- Flipped G-01 limitation test from `violations.length === 0` to `violations.length === 1`, renamed to `'detects out-of-order steps preceded by dash list markers'`
- Added three companion unit tests: numbered-list (`1. **Step N:**`), blockquote (`> **Step N:**`), asterisk-list (`* **Step N:**`)
- Updated KNOWN LIMITATION comment block to reference Phase 50 Plan 1 as source of change, preserving historical context
- All 629 original corpus subtests remain GREEN; total subtest count is now 632

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden scanForOutOfOrder anchor with list-marker/blockquote stripping** - `599b8959` (refactor)
2. **Task 2: Flip the G-01 limitation unit test and add companion blockquote/asterisk-list/numbered-list cases** - `efe7c8b6` (test)

## Files Created/Modified

- `tests/step-numbering-scan.test.cjs` - `scanForOutOfOrder()` hardened; G-01 test flipped; 3 companion tests added

## Decisions Made

- Two-step strip-then-match approach chosen over widening the original single regex — cleaner separation of concerns and avoids false positives from an excessively permissive single anchor
- Anchor on stripped string uses `^[\s*]*` rather than `^\s*` to handle any remaining `**` bold markers that may follow a stripped list prefix
- G-01 test renamed and flipped rather than deleted — the test name now accurately reflects what the hardened scanner does

## Deviations from Plan

None - plan executed exactly as written. Both task commits exist on the worktree branch; all 632 subtests pass with 0 failures.

## Issues Encountered

None. The two-step approach matched the plan specification precisely. Corpus regression gate confirmed no regressions from the permissive anchor change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scanner is ready as a stable foundation for Plan 2 (normalize script) and Plan 3 (cross-file scanner)
- `scanForOutOfOrder()` correctly classifies list-marker and blockquote prefixed step labels — NORM-02 idempotency guarantee is preserved
- No blockers

---
*Phase: 50-maintenance-script-and-cross-ref-scanner*
*Completed: 2026-05-30*
