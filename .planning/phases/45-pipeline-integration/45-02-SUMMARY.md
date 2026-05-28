---
phase: 45-pipeline-integration
plan: "02"
subsystem: installer
tags: [eta, template-engine, conversion, references, commands, agents, workflows]

# Dependency graph
requires:
  - phase: 45-01
    provides: "Eta v4 wired into bin/install.js; resolveIncludes removed"
provides:
  - "scripts/convert-refs.cjs — idempotent D-06/D-07 conversion script"
  - "55 command files with Eta include tags instead of static ref forms"
  - "7 agent files with Eta include tags for bare-line @~/.claude/get-shit-done/ refs"
  - "19 workflow files with Eta include tags for bare-line @~/.claude/get-shit-done/ refs"
  - "3 reference files with Eta include tags for bare-line refs"
  - "agents/gsd-planner.md @.planning/ refs converted to !cat form (D-07)"
  - "5 test helpers updated to recognize Eta include tags in execution_context blocks"
affects: [45-03, 45-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-06: bare-line @~/.claude/get-shit-done/X and !cat HOME/.claude/get-shit-done/X → {%~ include('get-shit-done/X') %}"
    - "D-07: bare-line @.planning/X → !backtick cat .planning/X backtick (agents layer)"
    - "D-08: inline prose @~ references (mid-sentence, inside backticks, inside template literals) retained as-is"
    - "Conversion script is idempotent: second run produces 0 changes"

key-files:
  created:
    - "scripts/convert-refs.cjs"
  modified:
    - "commands/gsd/*.md (55 files)"
    - "agents/gsd-debugger.md"
    - "agents/gsd-executor.md"
    - "agents/gsd-phase-researcher.md"
    - "agents/gsd-plan-checker.md"
    - "agents/gsd-planner.md"
    - "agents/gsd-user-profiler.md"
    - "agents/gsd-verifier.md"
    - "get-shit-done/workflows/*.md (19 files)"
    - "get-shit-done/references/model-profile-resolution.md"
    - "get-shit-done/references/planner-antipatterns.md"
    - "get-shit-done/references/tdd.md"
    - "tests/workspace.test.cjs"
    - "tests/bug-3135-capture-backlog-workflow.test.cjs"
    - "tests/bug-2948-spike-wrap-up-dispatch.test.cjs"
    - "tests/reapply-patches.test.cjs"
    - "tests/mvp-phase-command.test.cjs"

key-decisions:
  - "D-08 as bare-line-only constraint: trimmed line must be ENTIRELY the pattern — mid-sentence @~ refs in prose, backtick spans, template literals are all retained unchanged"
  - "Test helpers updated rather than reverting conversion: the 5 executionContextIncludes() helper functions in tests expected legacy @-notation only; all updated to also recognize Eta include tags"
  - "Conversion idempotent by design: only writes files that changed; second run produces 0 changes (verified)"
  - "196 lines converted across 84 files (slightly above planned ~180 — extra references in planner-antipatterns.md)"

patterns-established:
  - "executionContextIncludes() helpers in tests now recognize 3 ref forms: @-notation, !cat-notation, and {%~ include(...) %} Eta tags"
  - "convert-refs.cjs sets the pattern for future bulk ref migrations: dry-run flag, idempotent write, line-count summary"

requirements-completed: [INTG-01, INTG-02, INTG-03]

# Metrics
duration: 35min
completed: 2026-05-28
---

# Phase 45 Plan 02: Bulk Reference Conversion Summary

**84 source files across 4 layers converted to Eta include tags via idempotent convert-refs.cjs script; 5 test helpers updated to recognize new format**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-28T12:20:00Z
- **Completed:** 2026-05-28T12:55:00Z
- **Tasks:** 2
- **Files modified:** 84 converted + 5 test files + 1 new script = 90 files total

## Accomplishments

- Wrote `scripts/convert-refs.cjs` implementing D-06 (4 input forms → Eta include tag), D-07 (bare @.planning/ → backtick cat form), and D-08 (inline prose retained unchanged)
- Converted all 4 target layers: 55 command files, 7 agent files, 19 workflow files, 3 reference files — 196 lines in 84 files
- Verified `agents/gsd-planner.md` lines 465-467 converted from `@.planning/X` to `!cat .planning/X` form (D-07)
- Post-conversion dry-run confirms 0 files would change (idempotent)
- `grep -rl '@~/.claude/get-shit-done/' commands/ agents/ get-shit-done/ | wc -l` = 0 bare-line survivors
- Updated 5 test helper functions (`executionContextIncludes()`, `parseExecutionContextRefs()`, `parseCommandContract()`) to recognize Eta include tags alongside legacy @-notation

## Task Commits

Each task was committed atomically:

1. **Task 1: Write scripts/convert-refs.cjs** - `cbac2b24` (feat)
2. **Task 2: Run conversion and fix tests** - `4aaf09fd` (feat)

## Files Created/Modified

- `scripts/convert-refs.cjs` - Idempotent D-06/D-07 conversion script with --dry-run mode
- `commands/gsd/*.md` (55 files) - All command files now use `{%~ include('get-shit-done/...') %}` tags
- `agents/gsd-{debugger,executor,phase-researcher,plan-checker,planner,user-profiler,verifier}.md` - Bare-line refs converted; gsd-planner.md @.planning/ refs converted to !cat form
- `get-shit-done/workflows/*.md` (19 files) - Bare-line @~/.claude/get-shit-done/ refs converted
- `get-shit-done/references/{model-profile-resolution,planner-antipatterns,tdd}.md` - Bare-line refs converted
- `tests/{workspace,bug-3135-capture-backlog-workflow,bug-2948-spike-wrap-up-dispatch,reapply-patches,mvp-phase-command}.test.cjs` - executionContextIncludes helpers updated

## Decisions Made

- D-08 constraint is bare-line only: a line is "bare" only if trimmed content is ENTIRELY the reference pattern. This correctly retains inline prose refs (inside backticks, mid-sentence, in template literals) that are instructional text for the AI, not include directives.
- Test helper updates treated as Rule 1 auto-fix: the 5 test files' `executionContextIncludes()` functions only recognized legacy @-notation; they needed to also handle Eta include tags to correctly assert structural routing contracts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated 5 test helpers to recognize Eta include tags in execution_context blocks**
- **Found during:** Task 2 (post-conversion verification: `npm test`)
- **Issue:** After converting bare-line @~ refs to `{%~ include(...) %}` tags, 5 test files' `executionContextIncludes()` helper functions only checked for lines starting with `@` or `!cat ` — the new Eta format was silently ignored, causing 5 tests to fail asserting that execution_context blocks include specific workflow files
- **Fix:** Added an `else if` branch to each helper to also recognize `{%~ include('get-shit-done/X') %}` lines and extract the path tail
- **Files modified:** tests/workspace.test.cjs, tests/bug-3135-capture-backlog-workflow.test.cjs, tests/bug-2948-spike-wrap-up-dispatch.test.cjs, tests/reapply-patches.test.cjs, tests/mvp-phase-command.test.cjs
- **Verification:** All 5 previously-failing tests now pass (135 total tests across 5 files: 0 failures)
- **Committed in:** 4aaf09fd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test helper bug caused by our own conversion)
**Impact on plan:** The auto-fix was necessary to restore the test suite to working state. No scope creep; same logical assertion, updated to handle new syntax form.

## Issues Encountered

- The conversion introduced test failures in 5 test files because their `executionContextIncludes()` helpers used `startsWith('@')` guards that did not match the new `{%~ include(...) %}` format. All 5 were fixed inline. Pre-existing failures (negative-framing-scan for gsd-executor.md line 733 "Do not fall back...", and gsd-planner.md line 581 "are forbidden") were confirmed pre-existing via `git show 0626b377:agents/gsd-executor.md` — these lines were NOT changed by our conversion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 84 source files now contain Eta include tags — ready for 45-03 to wire template variables into eta.renderString context
- The conversion is complete and idempotent: a second run of convert-refs.cjs confirms 0 changes
- 5 test helpers are forward-compatible with Eta include tags for future assertions

---
*Phase: 45-pipeline-integration*
*Completed: 2026-05-28*

## Self-Check: PASSED

- scripts/convert-refs.cjs: FOUND
- 45-02-SUMMARY.md: FOUND (this file)
- Commit cbac2b24: FOUND
- Commit 4aaf09fd: FOUND
- D-06 bare-line survivors: 0 (confirmed via dry-run showing 0 changes)
- D-07 gsd-planner.md @.planning/ survivors: 0 (confirmed via grep)
- D-10 commands with include tags: 55 files (confirmed via grep -rl)
- 5 test helpers updated and passing: CONFIRMED (135/135 pass)
