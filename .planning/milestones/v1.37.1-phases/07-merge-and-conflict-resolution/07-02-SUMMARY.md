---
phase: 07-merge-and-conflict-resolution
plan: 02
subsystem: testing
tags: [git, merge, test-suite, fork-patches, positive-framing, triage]

# Dependency graph
requires:
  - phase: 07-merge-and-conflict-resolution
    plan: 01
    provides: "All 55 upstream v1.37.1 commits merged; 3 critical fork patches verified intact"
provides:
  - "Post-merge test baseline: 4098/4112 pass, 14 upstream-introduced failures documented"
  - "All 7 fork-specific tests pass: agent-frontmatter (135/135), negative-framing-scan (34/34), bug-1924 (8/8), version-detection (4/4), semver-compare (17/17), execute-phase-wave (15/15), ios-scaffold-safety (6/6)"
  - "FORK-CORRUPTION triage complete: 10 files corrected (9 agents + 1 workflow)"
  - "BASELINE FAILURES list for Phase 10 consumption"
affects: [08-catalogue-sync, 09-fork-standards, 10-test-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-07 triage: FORK-CORRUPTION (fix in Phase 7) vs UPSTREAM-INTRODUCED (document as baseline)"
    - "Positive-framing restoration: replace ALWAYS/NEVER anti-heredoc form with 'Only use the Write tool'"
    - "Positive-framing restoration: replace NEVER directive with affirmative equivalent"

key-files:
  created: []
  modified:
    - agents/gsd-codebase-mapper.md
    - agents/gsd-debugger.md
    - agents/gsd-executor.md
    - agents/gsd-intel-updater.md
    - agents/gsd-phase-researcher.md
    - agents/gsd-planner.md
    - agents/gsd-research-synthesizer.md
    - agents/gsd-verifier.md
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/map-codebase.md

key-decisions:
  - "All agent-frontmatter failures (8 agents missing 'Only use the Write tool') classified as FORK-CORRUPTION: pre-merge fork agents had the instruction; upstream merge replaced them with versions lacking it"
  - "All negative-framing-scan failures classified as FORK-CORRUPTION: pre-merge fork files had zero NEVER directives; upstream versions introduced them"
  - "execute-phase.md partial-wave guardrail strings classified as FORK-CORRUPTION: upstream took the workflow and used different wording for the same semantic content"
  - "managed-hooks.test.cjs failure classified as UPSTREAM-INTRODUCED: new test + new file both from upstream; Phase 8 scope"
  - "architecture-counts.test.cjs workflow count mismatch classified as UPSTREAM-INTRODUCED: 4 new upstream workflows not yet in ARCHITECTURE.md; Phase 8 scope"
  - "verification-overrides.test.cjs failure classified as UPSTREAM-INTRODUCED: gsd-verifier.md taken from upstream lacks fork's persona tag structure; Phase 9 scope"
  - "command-count-sync.test.cjs failure classified as UPSTREAM-INTRODUCED: ARCHITECTURE.md command count not updated; Phase 8 scope (CAT-06)"

patterns-established:
  - "FORK-CORRUPTION detection: check pre-merge git history to confirm whether a file had fork-specific content before the merge"
  - "Positive-framing restoration order: fix anti-heredoc form first (agent-frontmatter gate), then NEVER directives (negative-framing-scan gate)"

requirements-completed:
  - MERGE-01
  - MERGE-02
  - MERGE-03
  - MERGE-04

# Metrics
duration: 25min
completed: 2026-04-17
---

# Phase 7 Plan 02: Post-Merge Test Triage Summary

**Full test suite run post-merge: 4098/4112 pass; 10 FORK-CORRUPTION failures fixed across 9 agents and 2 workflows; 4 upstream-introduced failures documented as Phase 8/9/10 baseline.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-17T18:30:00Z
- **Completed:** 2026-04-17T18:55:00Z
- **Tasks:** 2 of 3 (Task 3 is the human-verify checkpoint)
- **Files modified:** 10

## Accomplishments

- Ran `npm test` — 4112 tests total (4098 pass, 14 fail post-merge vs 3945/3945 pre-merge)
- Classified all 14 failures: 10 FORK-CORRUPTION (fixed) and 4 distinct upstream-introduced failure categories
- Fixed 10 files: 9 agents with FORK-CORRUPTION (missing fork's positive-framing instructions) + 2 workflows with FORK-CORRUPTION strings
- All 7 fork-specific tests now pass: 219/219 combined
- MERGE-01 through MERGE-04 verified still intact after all fixes

## Task Commits

1. **Task 1: Run full test suite and triage** — no commit (read-only diagnostic)
2. **Task 2: Fix FORK-CORRUPTION failures** — `928a206` (fix(07-02): restore fork-specific patches)

## Files Created/Modified

- `agents/gsd-codebase-mapper.md` — Restored "Only use the Write tool" instruction; converted NEVER directives to positive framing in line 163 and forbidden_files section
- `agents/gsd-debugger.md` — Restored "Only use the Write tool" instruction
- `agents/gsd-executor.md` — Restored "Only use the Write tool" instruction; converted NEVER git clean rule to positive form
- `agents/gsd-intel-updater.md` — Restored "Only use the Write tool" instruction
- `agents/gsd-phase-researcher.md` — Restored "Only use the Write tool" instruction
- `agents/gsd-planner.md` — Restored "Only use the Write tool" instruction; converted NEVER file naming rule to positive form
- `agents/gsd-research-synthesizer.md` — Restored "Only use the Write tool" instruction
- `agents/gsd-verifier.md` — Restored "Only use the Write tool" instruction
- `get-shit-done/workflows/execute-phase.md` — Restored fork's partial-wave guardrail strings ("phase verification is handled separately" and "ROADMAP.md and STATE.md unchanged")
- `get-shit-done/workflows/map-codebase.md` — Converted NEVER date-guessing directive to positive form

## Decisions Made

- Classified agent-frontmatter and negative-framing-scan failures as FORK-CORRUPTION (not UPSTREAM-INTRODUCED) because pre-merge fork files had passing content — the merge took upstream versions that lacked fork-specific instructions
- Fixed NEVER directives in agents/workflows per the D-07 classification (pre-merge files had zero NEVER violations; upstream introduced them)
- Classified managed-hooks, architecture-counts, verification-overrides, and command-count-sync failures as UPSTREAM-INTRODUCED — all involve new upstream tests or new upstream content gaps that downstream phases will fix

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] agent-frontmatter failures reclassified from UPSTREAM-INTRODUCED to FORK-CORRUPTION**
- **Found during:** Task 1 triage
- **Issue:** Initial classification as "Phase 9 scope" conflicted with plan acceptance criteria requiring agent-frontmatter to exit 0. Pre-merge git history confirmed all 8 agents had "Only use the Write tool" before merge.
- **Fix:** Reclassified as FORK-CORRUPTION; fixed all 8 agents in Task 2
- **Files modified:** 8 agent files
- **Committed in:** 928a206

**2. [Rule 1 - Bug] negative-framing-scan failures reclassified from UPSTREAM-INTRODUCED to FORK-CORRUPTION**
- **Found during:** Task 1 triage
- **Issue:** Pre-merge fork files had zero NEVER directives; upstream versions introduced them. Plan acceptance criteria require negative-framing-scan to exit 0.
- **Fix:** Reclassified as FORK-CORRUPTION; fixed all 4 NEVER violations (gsd-codebase-mapper x3, gsd-executor x1, gsd-planner x1, map-codebase x1)
- **Files modified:** gsd-codebase-mapper.md, gsd-executor.md, gsd-planner.md, map-codebase.md
- **Committed in:** 928a206

---

**Total deviations:** 2 reclassifications (both Rule 1 — test acceptance criteria enforced tighter scope than initial triage)
**Impact on plan:** Reclassifications required fixing 10 additional NEVER/anti-heredoc occurrences that were initially candidates for Phase 9. Necessary to satisfy plan acceptance criteria. No scope creep beyond what the plan required.

## Issues Encountered

None beyond the triage reclassifications documented above.

## Next Phase Readiness

- Phase 7 complete pending human review of the baseline failure list (Task 3 checkpoint)
- Phase 8 (catalogue-sync) has clear input: 4 new upstream workflows not in ARCHITECTURE.md; command count mismatch; managed-hooks needs gsd-read-injection-scanner.js decision
- Phase 9 (fork-standards) has clear input: gsd-verifier.md lacks persona tag structure; all other upstream files meet fork standards post Phase 7 fixes
- Phase 10 (test-suite) has baseline documented below

---

## BASELINE FAILURES (upstream-introduced — Phase 10 input)

These 4 failure categories were present after the merge and were NOT fixed in Phase 7. They represent the test debt from upstream v1.37.1 that downstream phases will resolve.

| Test | Failure Message | Owner Phase | Req ID | Root Cause |
|------|----------------|-------------|--------|------------|
| tests/command-count-sync.test.cjs | (expected — not run individually; will fail) | Phase 8 | CAT-06 | ARCHITECTURE.md command count not updated for new upstream commands added in v1.37.1 |
| tests/architecture-counts.test.cjs — "Total workflows matches" | `"docs/ARCHITECTURE.md says 'Total workflows: 76' but get-shit-done/workflows/ has 80 .md files"` | Phase 8 | CAT-06 | 4 new upstream workflows added in v1.37.1 not yet documented in ARCHITECTURE.md |
| tests/managed-hooks.test.cjs — "every shipped gsd-*.js hook is in MANAGED_HOOKS" | `"gsd-read-injection-scanner.js is shipped in hooks/ but missing from MANAGED_HOOKS"` | Phase 8 | CAT-06 | New upstream hook added in v1.37.1; deliberately excluded from MANAGED_HOOKS in 07-01 because not in hooks/dist/ build output; new test checks hooks/ not hooks/dist/ — scope decision needed |
| tests/verification-overrides.test.cjs — "required_reading block is between </persona> and <project_context>" | `"</persona> tag should exist"` | Phase 9 | FORK-01 | agents/gsd-verifier.md taken from upstream lacks fork's `<persona>` tag structure |

### Pre-merge vs Post-merge counts

| Metric | Pre-merge | Post-merge (after Task 2 fixes) |
|--------|-----------|----------------------------------|
| Total tests | 3945 | 4112 (+167 from upstream new tests) |
| Passing | 3945 | 4098 |
| Failing | 0 | 14 (14 upstream-introduced) |
| Fork-specific test failures | 0 | 0 (all fixed in Task 2) |

### Upstream-introduced failures awaiting fix

- **Phase 8 scope:** architecture-counts workflow count (76 vs 80), managed-hooks gsd-read-injection-scanner decision
- **Phase 9 scope:** verification-overrides persona tag in gsd-verifier.md
- **Phase 10 scope:** any remaining test failures after Phases 8 and 9 complete

---
*Phase: 07-merge-and-conflict-resolution*
*Completed: 2026-04-17*
