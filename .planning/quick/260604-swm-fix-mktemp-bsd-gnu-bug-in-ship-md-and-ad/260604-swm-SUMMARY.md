---
phase: quick-260604-swm
plan: "01"
subsystem: workflows
tags: [bugfix, portability, mktemp, bsd, shell]
dependency_graph:
  requires: []
  provides: [portable-mktemp-in-workflows]
  affects: [get-shit-done/workflows/ship.md, get-shit-done/workflows/profile-user.md]
tech_stack:
  added: []
  patterns: [portable-mktemp-command-substitution]
key_files:
  created:
    - tests/bug-260604-swm-mktemp-portable-template.test.cjs
  modified:
    - get-shit-done/workflows/ship.md
    - get-shit-done/workflows/profile-user.md
decisions:
  - "Use X{3,}\\. as the detection regex: simple, precise, matches exactly the dot-suffix-inside-template pattern without false-positives on portable forms"
metrics:
  duration: "~5 min"
  completed: "2026-06-04"
  tasks_completed: 2
  files_changed: 3
---

# Quick 260604-swm: Fix BSD/GNU mktemp Incompatibility in ship.md and profile-user.md

Three non-portable `mktemp` invocations fixed across two workflow files; structural regression test added to prevent recurrence.

## Tasks Completed

| # | Task | Commit |
|---|------|--------|
| 1 | Fix non-portable mktemp templates in ship.md and profile-user.md | 389d5ab5 |
| 2 | Add regression test for portable mktemp templates | fc47ba94 |

## Changes

**Task 1 — Fix mktemp invocations (3 occurrences):**

- `ship.md:210`: `PR_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body.XXXXXX.md")` changed to `PR_BODY_FILE="$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body-XXXXXX").md"`
- `profile-user.md:231`: `ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)` changed to `ANSWERS_PATH="$(mktemp /tmp/gsd-profile-answers-XXXXXX").json"`
- `profile-user.md:245`: `ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)` changed to `ANALYSIS_PATH="$(mktemp /tmp/gsd-profile-analysis-XXXXXX").json"`

**Task 2 — Regression test:**

`tests/bug-260604-swm-mktemp-portable-template.test.cjs` scans all `get-shit-done/workflows/*.md` recursively with the pattern `/mktemp\b[^\n]*X{3,}\./` — matches the dot-suffix-inside-template form, does not match the portable form where the dot appears outside the command substitution.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `grep -rnE` for bad mktemp pattern in workflows returns nothing.
- `node --test tests/bug-260604-swm-mktemp-portable-template.test.cjs` passes.
- `npm test` — 4735 pass, 0 fail, 4 skipped. No regressions.

## Self-Check: PASSED

- tests/bug-260604-swm-mktemp-portable-template.test.cjs: FOUND
- Commits 389d5ab5 and fc47ba94: FOUND
