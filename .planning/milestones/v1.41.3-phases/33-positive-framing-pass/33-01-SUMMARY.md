---
phase: 33-positive-framing-pass
plan: 01
subsystem: testing
tags: [negative-framing-scanner, positive-framing, prompt-engineering, fork-compliance]

# Dependency graph
requires: []
provides:
  - "All 12 negative-framing violations across 5 prompt files rewritten to affirmative form"
  - "negative-framing-scan.test.cjs passes at 99/99 (was 93/99 with 6 failing subtests)"
  - "Full test suite at 8303 pass, 0 fail, 1 intentional skip"
affects: [34-gate-and-merge]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fork test update precedent: tests asserting upstream negative-framing strings are updated to verify fork affirmative form"

key-files:
  created: []
  modified:
    - agents/gsd-executor.md
    - agents/gsd-planner.md
    - commands/gsd/discuss-phase.md
    - get-shit-done/workflows/edit-phase.md
    - get-shit-done/workflows/secure-phase.md
    - get-shit-done/workflows/reapply-patches.md
    - tests/bug-3320-planner-deep-work-rules.test.cjs
    - tests/edit-phase.test.cjs

key-decisions:
  - "Test updates for fork framing: two tests asserting upstream negative-framing strings (NEVER place, <anti_patterns>) updated to verify the fork's affirmative replacements — consistent with v1.36.0/v1.38.6 precedent"
  - "Shorter NEVER rewrite in gsd-planner.md: plan suggested a 153-char replacement but file was at 49,112/49,152 char limit; used equivalent shorter form (fenced code blocks go in <read_first>) to stay under 48K threshold"

patterns-established:
  - "mustNot bucket: every must not token is a hard fail regardless of complement — remove token entirely and lead with affirmative"
  - "antiPatterns bucket: rename <anti_patterns> opening and closing tags to <expected_patterns>"
  - "doNot/never/dont rewrites: replace prohibition with directive that specifies the correct behavior"

requirements-completed: [FRAME-01, FRAME-02, SCAN-12]

# Metrics
duration: 25min
completed: 2026-05-14
---

# Phase 33 Plan 01: Positive Framing Pass — Agent, Command, and Workflow Files Summary

**12 negative-framing violations across 5 prompt files rewritten to affirmative form; negative-framing-scan.test.cjs passes at 99/99 (all 6 formerly-failing subtests green)**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-14T08:40:00Z
- **Completed:** 2026-05-14T09:05:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- All 6 failing scanner subtests now green: doNot (agents), doNot (commands), never (agents), dont (workflows), antiPatterns (workflows), mustNot (workflows)
- Full test suite at 8303 pass, 0 fail, 1 intentional HDOC skip — zero regressions
- FRAME-01 confirmed pre-satisfied (debug.md already clean); FRAME-02 and SCAN-12 both resolved in this plan
- T-33-01 mitigation verified: secure-phase.md rewrite preserves semantic meaning ("empty-by-no-planning requires a real audit")

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix doNot and never violations in agent and command files** - `aae05518` (feat)
2. **Task 2: Fix mustNot, antiPatterns, and dont violations in workflow files** - `7c29299e` (feat)

**Plan metadata:** committed with SUMMARY.md

## Files Created/Modified

- `agents/gsd-executor.md` - DO NOT at line 517 replaced with Always HALT affirmative form
- `agents/gsd-planner.md` - NEVER place at line 203 replaced with Keep directive prose form
- `commands/gsd/discuss-phase.md` - Do not pre-load at line 33 replaced with Read first form
- `get-shit-done/workflows/edit-phase.md` - mustNot at line 191 fixed; anti_patterns→expected_patterns tag rename; 6 dont bullets rewritten affirmatively
- `get-shit-done/workflows/secure-phase.md` - mustNot + doNot at line 76 replaced with always proceed to Step 5 form
- `get-shit-done/workflows/reapply-patches.md` - two do not proceed directives converted to affirmative must-pass form
- `tests/bug-3320-planner-deep-work-rules.test.cjs` - updated assertion to verify affirmative Keep form instead of NEVER form
- `tests/edit-phase.test.cjs` - updated anti_patterns test to use expected_patterns per Phase 33 rename

## Decisions Made

- **Test updates for fork framing:** Two tests asserted the upstream negative-framing strings (NEVER place, \<anti_patterns\>). Updated to verify the fork's affirmative replacements per established precedent (v1.36.0 Phase 3, v1.38.6 AUDIT-03 — "tests should verify fork behavior, not upstream behavior").
- **Shorter NEVER rewrite in gsd-planner.md:** The plan suggested a 153-char replacement text but the file was at 49,112 chars against a 49,152-char (48K) limit. Used a semantically equivalent shorter form — "fenced code blocks go in `<read_first>`" instead of "fenced code blocks belong in `<read_first>` source files" — to stay within the threshold. Both forms satisfy the scanner and preserve the instruction intent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] planner-decomposition size gate failure from NEVER→Keep rewrite**
- **Found during:** Task 1 (Fix doNot and never violations in agent and command files)
- **Issue:** Initial replacement for NEVER place was 44 chars longer than original, pushing gsd-planner.md from 49,112 to 49,156 chars — 4 chars over the 49,152 (48K) threshold that `planner-decomposition.test.cjs` enforces
- **Fix:** Shortened replacement from 153 chars to 121 chars ("fenced code blocks go in `<read_first>`" vs "...belong in `<read_first>` source files") while preserving full semantic intent
- **Files modified:** agents/gsd-planner.md
- **Verification:** `node -e "..." content.length < 49152` returns true (49,139 chars); planner-decomposition test passes
- **Committed in:** aae05518 (Task 1 commit)

**2. [Rule 1 - Bug] Two tests asserting upstream negative-framing strings broke after fork rewrites**
- **Found during:** Task 1 verification (full suite run)
- **Issue:** `bug-3320-planner-deep-work-rules.test.cjs` asserted `/NEVER place fenced code blocks/`; `edit-phase.test.cjs` asserted `<anti_patterns>` tag existence — both now checking removed patterns
- **Fix:** Updated assertions to match fork affirmative forms: `Keep \`<action>\` as directive prose only` and `<expected_patterns>` respectively. Per PROJECT.md key decision: "tests that assert for upstream-style negative framing are modified, not reverted"
- **Files modified:** tests/bug-3320-planner-deep-work-rules.test.cjs, tests/edit-phase.test.cjs
- **Verification:** `node scripts/run-tests.cjs` 8303 pass, 0 fail
- **Committed in:** 7c29299e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bug)
**Impact on plan:** Both auto-fixes required for correctness — size gate and test gate. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 34 (Gate and Merge) can proceed: scanner at 99/99, full suite at 0 fail, all 6 formerly-failing subtests green
- FRAME-01, FRAME-02, SCAN-12 all satisfied
- Phase 33 Plan 02 (todo-3242 fixes) can run independently in parallel if needed

## Known Stubs

None.

## Threat Flags

None — all changes are prose rewrites within existing files; no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- All 8 modified files exist on disk: FOUND
- Task 1 commit aae05518: FOUND
- Task 2 commit 7c29299e: FOUND
- SUMMARY.md commit fe644530: FOUND
- Scanner: 99 pass, 0 fail
- Full suite: 8303 pass, 0 fail, 1 skip

---
*Phase: 33-positive-framing-pass*
*Completed: 2026-05-14*
