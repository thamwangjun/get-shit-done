---
phase: 49-survey-and-normalization
plan: "01"
subsystem: planning-artifacts
tags: [map, survey, cross-file-refs, step-numbering]
dependency_graph:
  requires: []
  provides: [MAP-01]
  affects: [49-13-cross-file-refs-plan]
tech_stack:
  added: []
  patterns: [read-only-survey, grep-audit]
key_files:
  created:
    - .planning/phases/49-survey-and-normalization/49-MAP-01.md
  modified: []
key_decisions:
  - autonomous.md step 3a/3a.5 references are SAME-FILE (autonomous.md has internal 3a/3a.5 sub-steps at lines 178/289)
  - profile-user.md step 4a/4b references are SAME-FILE (profile-user.md has ## 4a and ## 4b sections at lines 158/209)
  - Only 4 true cross-file refs found: execute-plan.md x3 (to execute-phase.md step 5.5) and post-merge-gate.md x1 (to execute-phase.md step 5.8)
requirements_completed: [MAP-01]
metrics:
  duration: ~15 minutes
  completed: 2026-05-30
---

# Phase 49 Plan 01: MAP-01 Cross-File Step Reference Survey Summary

Produced the MAP-01 pre-normalization cross-file step reference index at `.planning/phases/49-survey-and-normalization/49-MAP-01.md`, enumerating all 4 cross-file prose step references across the in-scope corpus before any renaming begins.

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Produce MAP-01 cross-file step reference index | 600a15e5 | `.planning/phases/49-survey-and-normalization/49-MAP-01.md` |

## Deviations from Plan

### Research findings that refined the plan's assumptions

**autonomous.md and profile-user.md classified as same-file references**

- **Found during:** Task 1 (survey grep + file reads)
- **Issue:** RESEARCH.md Section B listed `autonomous.md` lines 406, 496, 783 and `profile-user.md` lines 63, 122, 153, 154 as requiring MAP-01 inclusion (described as "unknown" cross-file target). Survey confirmed these are SAME-FILE references.
- **Autonomous.md:** `step 3a` references `**3a. Smart Discuss**` at line 178; `step 3a.5` references `**3a.5. UI Design Contract**` at line 289. Both internal to the file.
- **Profile-user.md:** `step 4a` references `## 4a. Session Analysis Path` at line 158; `step 4b` references `## 4b. Questionnaire Path` at line 209. Both internal to the file.
- **Impact on plan 49-13:** The cross-file refs plan scope is smaller than the research estimated — only `execute-plan.md` (3 occurrences) and `post-merge-gate.md` (1 occurrence) need cross-file prose updates.
- **Files modified:** `.planning/phases/49-survey-and-normalization/49-MAP-01.md` (documented in "Survey Findings: References Classified as NOT Cross-File" section)

## Verification Results

All acceptance criteria passed:

```
test -f .planning/phases/49-survey-and-normalization/49-MAP-01.md        -> PASS (file exists)
command grep "| Source File |" 49-MAP-01.md                              -> PASS (table header present)
command grep "execute-plan.md" 49-MAP-01.md                              -> PASS (known cross-file ref included)
command grep "post-merge-gate.md" 49-MAP-01.md                           -> PASS (known cross-file ref included)
git diff --name-only agents/ get-shit-done/workflows/ commands/gsd/       -> PASS (empty — no source files modified)
```

MAP-01 table contains 4 data rows (execute-plan.md x3, post-merge-gate.md x1) — exceeds minimum of 4 required by done criteria.

## Self-Check: PASSED

- `.planning/phases/49-survey-and-normalization/49-MAP-01.md` exists on disk
- Commit `600a15e5` exists in git log
- No source files in `agents/`, `commands/gsd/`, or `get-shit-done/workflows/` modified
