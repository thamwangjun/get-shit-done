---
phase: 14-workflow-reference-and-command-fixes
plan: 01
subsystem: testing
tags: [positive-framing, corpus-scan, workflow, reference, markdown]

# Dependency graph
requires: []
provides:
  - FRAMING-07 fix in analyze-dependencies.md
  - FRAMING-08 fix in discuss-phase.md
  - FRAMING-09 fix in execute-plan.md
  - FRAMING-10 fix in import.md (Anti-Patterns -> Required Patterns block rewrite)
  - FRAMING-11 + FRAMING-12 fix in transition.md (deleted bare Do NOT lines)
  - FRAMING-13 fix in verify-phase.md
  - FRAMING-14 fix in planner-source-audit.md
  - corpus scan workflow subtest passing (0 bare DO NOT violations)
  - corpus scan reference subtest passing (0 bare DO NOT violations)
affects:
  - phase-14-plan-02 (command fixes)
  - negative-framing-scan test suite

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Affirmative rewrite: replace bare do-not directives with positive imperative instructions specifying correct behavior"
    - "Block rewrite: use Edit tool with full old_string for multi-line section replacements to avoid content drop"
    - "Deletion rewrite: use Edit with blank new_string to delete prohibited lines while preserving adjacent gate lines"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/analyze-dependencies.md
    - get-shit-done/workflows/discuss-phase.md
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/import.md
    - get-shit-done/workflows/transition.md
    - get-shit-done/workflows/verify-phase.md
    - get-shit-done/references/planner-source-audit.md

key-decisions:
  - "Line 523 of transition.md ('other active workstreams. Do NOT suggest completing...') was not modified — scanner correctly identifies it as having a positive complement (period+uppercase triggers hasPositiveComplement), so it is not a bare violation"
  - "FRAMING-10 applied as atomic block rewrite (Anti-Patterns section -> Required Patterns) per threat model T-14-02 mitigation"

patterns-established:
  - "Verify scanner exclusion rules before editing: some Do NOT occurrences pass scanner checks (hasPeriodUpper, hasPositiveComplement) and should not be modified"

requirements-completed: [FRAMING-07, FRAMING-08, FRAMING-09, FRAMING-10, FRAMING-11, FRAMING-12, FRAMING-13, FRAMING-14]

# Metrics
duration: 3min
completed: 2026-04-22
---

# Phase 14 Plan 01: Workflow and Reference Do-Not Framing Fixes Summary

**8 bare "do not" violations removed from 7 prompt files; corpus scan workflow and reference subtests now pass (0 violations in both directories)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-22T13:25:39Z
- **Completed:** 2026-04-22T13:28:34Z
- **Tasks:** 3 (2 edit tasks + 1 verification task)
- **Files modified:** 7

## Accomplishments

- Replaced 8 bare "do not" directive violations across 6 workflow files and 1 reference file with affirmative positive instructions
- import.md Anti-Patterns section fully rewritten as Required Patterns with 7 positive imperative list items
- transition.md FRAMING-11/12 deleted both violation lines while preserving the "Stop here." gate immediately after
- `npm test` corpus scan subtests: "no bare DO NOT directives in workflow files" and "no bare DO NOT directives in reference files" both pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix FRAMING-07 through FRAMING-09** - `14bb66c` (fix)
2. **Task 2: Fix FRAMING-10 through FRAMING-14** - `5ed0ee0` (fix)
3. **Task 3: Run corpus scan gate** - no code commit (verification only — tests passed without additional edits)

## Files Created/Modified

- `get-shit-done/workflows/analyze-dependencies.md` - FRAMING-07: "Do not reorder phases" -> "Preserve the existing phase order — relocate only the dependency field"
- `get-shit-done/workflows/discuss-phase.md` - FRAMING-08: "Do not continue with the steps below" -> "Stop here — power mode handles all remaining steps"
- `get-shit-done/workflows/execute-plan.md` - FRAMING-09: bare scope boundary -> affirmative "Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched"
- `get-shit-done/workflows/import.md` - FRAMING-10: Anti-Patterns block (with "Do NOT:" header) -> Required Patterns block with affirmative conventions
- `get-shit-done/workflows/transition.md` - FRAMING-11+12: deleted "Do NOT suggest" and "Do NOT auto-invoke" lines; "Stop here." line preserved
- `get-shit-done/workflows/verify-phase.md` - FRAMING-13: "Do NOT invent example inputs." -> "Source inputs exclusively from actual test fixtures and codebase examples."
- `get-shit-done/references/planner-source-audit.md` - FRAMING-14: "Do not flag these as MISSING:" -> "Treat these as expected and exclude them from MISSING flags:"

## Decisions Made

- Line 523 of transition.md (`other active workstreams. Do NOT suggest completing the milestone or advancing`) was left unmodified. The scanner's `hasPositiveComplement` check triggers on the period-then-uppercase pattern (`. Do NOT...`), so this occurrence is not a bare violation — confirmed by running the scanner logic against the exact line text before the edit pass.
- FRAMING-10 applied as an atomic block rewrite using full old_string to satisfy the threat model T-14-02 mitigation requirement (read full block before edit).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can now proceed to fix the remaining 3 bare DO NOT violations in command files (docs-update.md, execute-phase.md, reapply-patches.md)
- The corpus scan "no bare DO NOT directives in command files" subtest remains failing (3 violations) — those are Plan 02's scope

---
*Phase: 14-workflow-reference-and-command-fixes*
*Completed: 2026-04-22*
