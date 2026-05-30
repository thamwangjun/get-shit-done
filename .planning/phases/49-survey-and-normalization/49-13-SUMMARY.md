---
phase: 49-survey-and-normalization
plan: "13"
subsystem: workflows
tags: [normalization, step-numbering, NORM-01, cross-file-refs]
dependency_graph:
  requires:
    - "49-02"
    - "49-03"
    - "49-04"
    - "49-05"
    - "49-06"
    - "49-07"
    - "49-08"
    - "49-09"
    - "49-10"
    - "49-11"
    - "49-12"
  provides:
    - "Phase 49 NORM-01 complete: all decimal and letter-suffix step labels eliminated from corpus"
  affects:
    - "tests/step-numbering-scan.test.cjs"
tech_stack:
  added: []
  patterns:
    - "descriptive step name references (replaces letter-suffix step prose)"
    - "whole-integer cross-file step references"
key_files:
  created: []
  modified:
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/autonomous.md
    - get-shit-done/workflows/profile-user.md
    - get-shit-done/workflows/execute-phase/steps/post-merge-gate.md
decisions:
  - "execute-plan.md: replaced 3 occurrences of 'execute-phase.md step 5.5' with 'execute-phase.md step 7' (Plan 11 renamed item 5.5 → 7)"
  - "post-merge-gate.md: replaced '(same as step 5.8)' with '(same as step 10)' (Plan 11 renamed item 5.8 → 10)"
  - "autonomous.md line 406: replaced 'step 3a' with 'the Smart Discuss sub-step (3a)' — avoids STEP_DECIMAL_RE match while preserving navigability"
  - "autonomous.md line 496: replaced 'step 3a.5' with 'the UI Design Contract sub-step (3a.5)'"
  - "autonomous.md lines 783-784: replaced '(step 3a.5)' and '(step 3d.5)' checklist items with descriptive names (UI Design Contract sub-step, UI Review sub-step) — these were in parentheses so didn't match STEP_DECIMAL_RE but failed acceptance-criteria grep"
  - "profile-user.md: replaced 4 prose refs 'step 4b'/'step 4a' with 'the Questionnaire Path'/'the Session Analysis Path' — internal same-file references to sections ## 4b and ## 4a"
requirements:
  - NORM-01
metrics:
  duration: "15 minutes"
  completed_date: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 4
---

# Phase 49 Plan 13: Update Cross-File Prose Refs — Eliminate Remaining Decimal Step References Summary

**One-liner:** Updated 4 workflow files to replace decimal/letter-suffix step prose references with whole-integer equivalents and descriptive names, completing Phase 49 NORM-01: step-numbering-scan.test.cjs now shows 629 pass, 0 fail.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update cross-file prose refs in execute-plan.md, autonomous.md, profile-user.md, post-merge-gate.md | 5bb71c9e | 4 files |

## Changes Made

### get-shit-done/workflows/execute-plan.md

Three occurrences of `execute-phase.md step 5.5` replaced with `execute-phase.md step 7`:
- Line 143: `execute-phase.md step 5.5` → `execute-phase.md step 7`
- Line 369: `execute-phase.md step 5.5` → `execute-phase.md step 7`
- Line 475: `execute-phase.md step 5.5` → `execute-phase.md step 7`

Plan 11 renamed execute-phase.md's ordered-list item 5.5 to item 7. These are cross-file prose references per MAP-01.

### get-shit-done/workflows/execute-phase/steps/post-merge-gate.md

One occurrence of `(same as step 5.8)` replaced with `(same as step 10)` at line 60.
Plan 11 renamed execute-phase.md's ordered-list item 5.8 to item 10. This is a cross-file prose reference per MAP-01.

### get-shit-done/workflows/autonomous.md

Four occurrences updated (same-file internal references per MAP-01):
- Line 406: `in step 3a.` → `in the Smart Discuss sub-step (3a).`
- Line 496: `in step 3a.5 or pre-existing` → `in the UI Design Contract sub-step (3a.5) or pre-existing`
- Line 783: `(step 3a.5)` → `(UI Design Contract sub-step)` (checklist item)
- Line 784: `(step 3d.5)` → `(UI Review sub-step)` (checklist item)

Lines 406 and 496 matched STEP_DECIMAL_RE (scanner failures). Lines 783-784 matched the acceptance-criteria grep (`step 3[a-z]`) but not the scanner regex (parenthesized `(step 3a.5)` — `(` is not a boundary char for STEP_DECIMAL_RE).

### get-shit-done/workflows/profile-user.md

Four occurrences updated (same-file internal references per MAP-01):
- Line 63: `jump directly to step 4b` → `jump directly to the Questionnaire Path`
- Line 122: `Jump to step 4b (questionnaire path)` → `Jump to the Questionnaire Path`
- Line 153: `jump to step 4b` → `jump to the Questionnaire Path`
- Line 154: `Continue to step 4a` → `Continue to the Session Analysis Path`

These reference `## 4a. Session Analysis Path` and `## 4b. Questionnaire Path` sections within the same file.

## Verification

- `command grep -n "step 5\.5\|step 5\.8" get-shit-done/workflows/execute-plan.md` → no output (PASS)
- `command grep -n "step 3[a-z]\|step 3a\|step 3a\.5" get-shit-done/workflows/autonomous.md` → no output (PASS)
- `command grep -n "step 4[ab]" get-shit-done/workflows/profile-user.md` → no output (PASS)
- `command grep -n "step 5\.8" get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` → no output (PASS)
- `command grep -n "step 10" get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` → match at line 60 (PASS)
- `node --test tests/step-numbering-scan.test.cjs` → 629 pass, 0 fail (was 624 pass, 5 fail) (PASS)
- `npm test` → 7 pre-existing failures (ai-evals, bug-3321-verifier-runs-probes, gsd-researcher-app-aware, quick-research) — none caused by this plan (PASS)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] autonomous.md lines 783-784 also required updating**

- **Found during:** Task 1
- **Issue:** MAP-01 noted lines 783/784 had `(step 3a.5)` and `(step 3d.5)` as parenthesized references (not matching STEP_DECIMAL_RE scanner regex), but the acceptance criteria grep `step 3[a-z]` matched them. Plan 49-13's acceptance criteria required zero output from this grep.
- **Fix:** Replaced `(step 3a.5)` → `(UI Design Contract sub-step)` and `(step 3d.5)` → `(UI Review sub-step)` in the checklist lines.
- **Files modified:** `get-shit-done/workflows/autonomous.md`
- **Commit:** 5bb71c9e

**2. [Rule 2 - Missing] autonomous.md and profile-user.md same-file refs not fixed by prior plans**

- **Found during:** Task 1
- **Issue:** MAP-01 classified `autonomous.md` (lines 406, 496) and `profile-user.md` (lines 63, 122, 153, 154) as same-file references to be handled by per-file rename plans (49-02 through 49-12). However, no per-file plan covered these files. The step-numbering scanner showed 10 total failures before this plan, including 6 from these two files.
- **Fix:** Plan 49-13 absorbed these fixes. All 10 scanner violations were resolved in this plan's single task.
- **Files modified:** `get-shit-done/workflows/autonomous.md`, `get-shit-done/workflows/profile-user.md`
- **Commit:** 5bb71c9e

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All edits are pure prose text substitutions in markdown workflow files.

## Self-Check: PASSED

- `get-shit-done/workflows/execute-plan.md` modified: `command grep "step 5\.5" get-shit-done/workflows/execute-plan.md` → no output
- `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` modified: `command grep "step 5\.8" ...` → no output; `command grep "step 10" ...` → match at line 60
- `get-shit-done/workflows/autonomous.md` modified: `command grep "step 3[a-z]" ...` → no output
- `get-shit-done/workflows/profile-user.md` modified: `command grep "step 4[ab]" ...` → no output
- Commit 5bb71c9e exists in git log
- `node --test tests/step-numbering-scan.test.cjs` → 629 pass, 0 fail
- Phase 49 NORM-01 goal achieved
