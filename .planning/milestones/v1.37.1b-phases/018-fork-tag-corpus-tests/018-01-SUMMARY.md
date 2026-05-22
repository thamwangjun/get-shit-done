---
phase: 018-fork-tag-corpus-tests
plan: "01"
subsystem: testing
tags: [node-test, corpus-scan, fork-standards, persona, intent, regression-guard]

# Dependency graph
requires: []
provides:
  - PERSONA-01 regression guard — fork-persona-tag.test.cjs with 62 subtests (31 agents x 2 checks)
  - INTENT-01 regression guard — fork-intent-tag.test.cjs with 79 subtests (one per command file)
affects: [TEST-GATE-01, upstream-merge-workflow, agent-files, command-files]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-file subtest loop inside describe() for corpus scanning"
    - "Code-fence stripping via regex before content assertions to avoid false positives in documentation examples"
    - "Strict line equality (trimmed === '<tag>') for bare block detection"
    - "BY DESIGN failure documentation in test file headers for known corpus gaps"

key-files:
  created:
    - tests/fork-persona-tag.test.cjs
    - tests/fork-intent-tag.test.cjs
  modified: []

key-decisions:
  - "Code-fence stripping in persona test prevents false positives when agent files document upstream <role> tag in prose examples"
  - "Strict line equality (trimmed === '<tag>') for intent test avoids false positives from attribute values or prose mentions"
  - "33 <objective> failures in intent test are BY DESIGN — corpus state differs from plan estimate of 32 by one file; test is correct"
  - "Intent test guards both <task> and <objective> as specified in D-01 locked decision"

patterns-established:
  - "Corpus scan test pattern: readdirSync at module scope, readFileSync inside test() callback"
  - "Expected-failure documentation: file header states count, date, and rationale with BY DESIGN marker"

requirements-completed:
  - PERSONA-01
  - INTENT-01

# Metrics
duration: 3min
completed: 2026-04-28
---

# Phase 18 Plan 01: Fork Tag Corpus Tests Summary

**Two corpus-scan regression guards added: fork-persona-tag.test.cjs (62 subtests, 62 pass) and fork-intent-tag.test.cjs (79 subtests, 46 pass / 33 fail by design)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-28T06:56:56Z
- **Completed:** 2026-04-28T06:59:10Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- PERSONA-01 guard: all 31 agents checked for `<persona>` presence and `<role>` absence (outside code fences); 62/62 pass on current corpus
- INTENT-01 guard: all 79 command files scanned for bare `<task>` or `<objective>` blocks; 46 pass, 33 fail by design (corpus gap documented)
- Deliberate guard verified: injecting `<role>` into any agent file causes that file's 2 persona subtests to fail immediately
- Both test files auto-discovered by scripts/run-tests.cjs without any registration changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Write fork-persona-tag.test.cjs (PERSONA-01)** - `cbb896c5` (feat)
2. **Task 2: Write fork-intent-tag.test.cjs (INTENT-01)** - `31afc84b` (feat)

**Plan metadata:** committed with SUMMARY.md

## Files Created/Modified
- `tests/fork-persona-tag.test.cjs` - PERSONA-01 regression guard: 31 agents x 2 subtests = 62 subtests; asserts `<persona>` presence and `<role>` absence with code-fence stripping
- `tests/fork-intent-tag.test.cjs` - INTENT-01 regression guard: 79 subtests (one per command file); detects bare `<task>` or `<objective>` blocks via strict line equality

## Decisions Made
- Code-fence stripping (`.replace(/```[\s\S]*?```/g, '')`) in the persona test prevents false positives when agent files document the upstream `<role>` tag in prose examples
- Strict line equality check (`trimmed === '<task>'`) prevents false matches on attribute values or inline prose mentions

## Deviations from Plan

### Corpus State Difference — Intent Test Failure Count

The plan estimated 47 pass / 32 fail for fork-intent-tag.test.cjs. Actual result: 46 pass / 33 fail.

- **Found during:** Task 2 verification
- **Root cause:** The corpus at execution time has 33 files with bare `<objective>` blocks, not 32 as the plan estimated. The plan's research was conducted before the plan was written; one additional file was counted differently.
- **Action:** None required. The test file content, structure, and behavior are all correct. The test accurately detects the actual corpus state. The test header documents "BY DESIGN" failures with the 2026-04-28 date; the exact count (33 vs 32) is a documentation note, not a test correctness issue.
- **Impact:** Zero — the test functions as designed. The acceptance criteria for Task 2 specified "47 pass and 32 fail (matching the current corpus state)" but the actual current corpus state is 46 pass / 33 fail. The test reflects reality correctly.

---

**Total deviations:** 1 (corpus count estimate off by 1)
**Impact on plan:** No code changes needed; test behavior is correct.

## Issues Encountered
- Initial guard check for the persona test produced an error because `cp` was run against the wrong path structure (agents/ is a symlink or flat directory); resolved by using `/tmp` as backup location instead of `.bak` extension in place.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Test files read from the local filesystem only (agents/ and commands/gsd/ directories).

**T-018-02 mitigation verified:** Both test files document expected failures with "BY DESIGN" markers and date annotations, satisfying the repudiation threat mitigation requirement in the plan's threat register.

## Known Stubs
None — both test files are fully wired to the live corpus via `readdirSync`.

## Next Phase Readiness
- Both regression guards active and running
- TEST-GATE-01 (full test suite gate) is the remaining requirement for Phase 18
- The 33 <objective> command files remain unconverted — conversion deferred to a follow-on phase as designed
- Upstream merge risk is now guarded: any revert of `<persona>` or conversion of `<intent>` back to upstream tags will be caught immediately

---
*Phase: 018-fork-tag-corpus-tests*
*Completed: 2026-04-28*
