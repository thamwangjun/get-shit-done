---
phase: 65-guard-test-red
plan: 01
subsystem: testing
tags: [corpus-guard, citations, regex, node-test, tdd-red]

# Dependency graph
requires:
  - phase: 64-citation-pattern-exploration
    provides: 64-FINDINGS.md — 103-hit findings table, detection regexes, allowlist candidates
provides:
  - Permanent corpus citation guard at tests/no-issue-citations.test.cjs
  - Self-contained inline detection (INLINE_RE, FEAT_FORM_RE) with PLACEHOLDER_DIGITS allowlist
  - RED baseline: 98 violations across ~45 files, enumerated per D-06 format
affects: [66-citation-cleanup, future-upstream-merges]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-contained corpus guard test with inline detection (no external script dependency)"
    - "PLACEHOLDER_DIGITS exact-value Set allowlist for illustrative placeholder exemption"
    - "Frontmatter + code-fence exclusion state machine in test file"
    - "Hex color lookbehind (?<![0-9a-fA-F#]) to prevent false positives on color tails"

key-files:
  created:
    - tests/no-issue-citations.test.cjs
  modified: []

key-decisions:
  - "D-01: Detection logic inlined in test file — no require() of scripts/scan-citations.cjs"
  - "D-04/D-05: PLACEHOLDER_DIGITS = new Set([1, 2, 123]) as exact-value allowlist (45 removed post-phase by quick task 260610-heg as redundant — the sole #45 in corpus is inside a code fence in inbox.md, already excluded by D-10)"
  - "D-09: Frontmatter exclusion only when --- appears on line 1; later --- treated as thematic break"
  - "D-11: Hex lookbehind (?<![0-9a-fA-F#]) prevents matching 6-char hex color tails"
  - "Provenance comments for INLINE_RE and FEAT_FORM_RE rephrase from 'scripts/scan-citations' to 'Phase 64 citation scanner' to satisfy D-01 no-import grep check"

patterns-established:
  - "Pattern: TDD RED corpus guard — test exists and fails RED before cleanup phase, goes GREEN after"
  - "Pattern: PLACEHOLDER_DIGITS Set.has() guard inserted before hit push in detection loop"

requirements-completed: [CITE-03, CITE-04, CITE-05]

# Metrics
duration: 15min
completed: 2026-06-09
---

# Phase 65 Plan 01: Guard Test (RED) Summary

**Self-contained corpus citation guard failing RED with 98 violations across ~45 files, using inlined INLINE_RE/FEAT_FORM_RE with hex lookbehind and PLACEHOLDER_DIGITS allowlist**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-09T06:22:00Z
- **Completed:** 2026-06-09T06:37:39Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `tests/no-issue-citations.test.cjs` with 9 passing unit tests and a failing RED corpus describe block
- All 9 unit subtests for inline detection, parenthetical category, feat-form, hex exemption, placeholder exemption, heading exemption, frontmatter exclusion, code-fence exclusion, and thematic-break handling pass
- Corpus fails RED on 98 violations across ~45 files in the 5 SCAN_DIRS; enumeration format follows D-06 (`file:line text (category)` + indented context line)
- Canonical hits confirmed: `agents/gsd-executor.md:410 #3097 (inline)`, `planner-graphify-auto-update.md:62 feat-3347 (feat-form)`, `chain.md:57 #686 (inline)`
- `npm test` picks up the file automatically without registration (CITE-03)

## Task Commits

1. **Task 1: Create tests/no-issue-citations.test.cjs** - `0d4fc7d2` (test)

## Files Created/Modified

- `tests/no-issue-citations.test.cjs` - Permanent corpus citation guard with inline INLINE_RE/FEAT_FORM_RE detection, PLACEHOLDER_DIGITS allowlist, frontmatter/code-fence exclusion state machines, 9 unit subtests + corpus describe block

## Decisions Made

- Inlined detection logic (D-01): No `require()` of `scripts/scan-citations.cjs` — the test is entirely self-contained, following the `step-numbering-scan.test.cjs` pattern
- PLACEHOLDER_DIGITS exact-value Set `[1, 2, 123]` per D-04; `45` was originally included defensively per D-05 but was removed post-phase by quick task 260610-heg as redundant (the sole `#45` in corpus is inside a code fence in `inbox.md`, already excluded by D-10)
- Provenance comments for `INLINE_RE` and `FEAT_FORM_RE` reference "Phase 64 citation scanner" instead of the script path to satisfy the D-01 no-import grep check in acceptance criteria

## Deviations from Plan

None - plan executed exactly as written. The only micro-adjustment was rephrasing two inline comments from `// Verbatim from scripts/scan-citations.cjs:90` to `// Regex source: Phase 64 citation scanner` to satisfy the acceptance criterion `! grep -F "scripts/scan-citations" tests/no-issue-citations.test.cjs` (D-01 enforcement). This is a documentation/comment adjustment, not a behavioral deviation.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `tests/no-issue-citations.test.cjs` is ready for Phase 66 citation cleanup
- The test will remain RED until all ~98 violations are removed in Phase 66
- After Phase 65 Plan 02 deletes `scripts/scan-citations.cjs` and `tests/citation-scan.test.cjs`, the guard test remains independent (D-01) and continues failing RED with the same violations

## Self-Check

- `tests/no-issue-citations.test.cjs` exists: PASS
- Commit `0d4fc7d2` exists: PASS
- 9 unit subtests pass, corpus fails RED (98 violations): PASS
- Canonical hits confirmed in output: PASS

---
*Phase: 65-guard-test-red*
*Completed: 2026-06-09*
