---
phase: 49-survey-and-normalization
plan: "04"
subsystem: agents
tags: [normalization, step-renaming, gsd-verifier]
dependency_graph:
  requires:
    - 49-03 (touches tests/agent-frontmatter.test.cjs — must run before this plan)
  provides:
    - agents/gsd-verifier.md with sequential whole-integer steps 0-18
  affects:
    - tests/agent-frontmatter.test.cjs (two updated assertions)
    - tests/verification-overrides.test.cjs (two updated assertions — D-02 co-located fix)
tech_stack:
  added: []
  patterns:
    - Step numbering: sequential whole integers 0-18, no letter-suffix labels
key_files:
  created: []
  modified:
    - agents/gsd-verifier.md
    - tests/agent-frontmatter.test.cjs
    - tests/verification-overrides.test.cjs
decisions:
  - "Updated verification-overrides.test.cjs Step 3b assertions to Step 7 (deviation Rule 2: co-located assertions broken by prior rename work in this wave)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 3
requirements:
  - NORM-01
---

# Phase 49 Plan 04: Rename letter-suffix steps in gsd-verifier.md to whole integers Summary

Renamed 8 letter-suffix step violations in `agents/gsd-verifier.md` to sequential whole integers (full 19-step scheme, Step 0–18), updated all same-file prose cross-references, and updated co-located test assertions in both `tests/agent-frontmatter.test.cjs` and `tests/verification-overrides.test.cjs`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename letter-suffix steps and update co-located test assertions | d587529b | agents/gsd-verifier.md, tests/agent-frontmatter.test.cjs, tests/verification-overrides.test.cjs |

## Verification

All acceptance criteria passed:

- `command grep` for `Step 2[abc]\|Step 3b\|Step 4b\|Step 7[bc]\|Step 9b` in `gsd-verifier.md` returns no output (exit 1 = no matches)
- `## Step 9: Data-Flow Trace` found at line 264
- `## Step 13: Behavioral Spot-Checks` found at line 446
- `## Step 17: Filter Deferred Items` found at line 577
- `tests/agent-frontmatter.test.cjs` has `Step 9: Data-Flow Trace` and `Step 13: Behavioral Spot-Checks` assertions
- No `Step 4b` or `Step 7b` in test file (exit 1 = no matches)
- Plan 03's `Step 6: Environment Availability Audit` assertion at line 341 — intact
- `npm test` exits 0 with 8 failures (all pre-existing, down from 10 before this plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Updated verification-overrides.test.cjs Step 3b assertions**

- **Found during:** Task 1 — npm test run revealed 2 new test failures in `verification-overrides.test.cjs`
- **Issue:** `tests/verification-overrides.test.cjs` had two assertions referencing `Step 3b` (renamed to `Step 7` by prior wave work on this worktree). The plan only mentioned updating `agent-frontmatter.test.cjs` but the co-located D-02 rule requires all assertions to update in the same commit as the rename.
- **Fix:** Updated two tests in `verification-overrides.test.cjs`: `Step 3b for override check` → `Step 7 for override check` and `Step 3b section should exist` → `Step 7: Check Verification Overrides section should exist`. Also updated the section-boundary search from `## Step 4` to `## Step 8`.
- **Files modified:** `tests/verification-overrides.test.cjs`
- **Commit:** d587529b (included in same commit per D-02)

**2. [Rule 1 - Bug] Updated prose reference "neither 2a nor 2b" in gsd-verifier.md**

- **Found during:** Task 1 — grep scan for prose refs after heading renames
- **Issue:** Line 151 had `"If neither 2a nor 2b produced any truths"` — old label form that was missed by initial scan
- **Fix:** Updated to `"If neither Step 3 nor Step 4 produced any truths"`
- **Files modified:** `agents/gsd-verifier.md`
- **Commit:** d587529b

## Known Stubs

None.

## Threat Flags

None — text-only rename operation; no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `agents/gsd-verifier.md` exists and has sequential steps 0-18
- `tests/agent-frontmatter.test.cjs` has updated Step 9 and Step 13 assertions
- `tests/verification-overrides.test.cjs` has updated Step 7 assertions
- Commit d587529b confirmed in git log
- npm test exit 0 with 8 pre-existing failures (2 fewer than before this plan)
