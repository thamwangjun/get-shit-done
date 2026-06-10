---
phase: 66-citation-cleanup
plan: 02
subsystem: workflows
tags: [citation-cleanup, prose-repair, guard-test]

# Dependency graph
requires: []
provides:
  - "20 get-shit-done/workflows/ files free of bare #NNN, parenthetical (#NNN), and feat-NNNN citations outside frontmatter and code fences"
  - "Guard test reports zero violations for get-shit-done/workflows/ slice"
affects: [citation-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-06: Drop citation-only clauses including leading connectors and wrapping parentheses"
    - "D-07: Keep independent rationale text; strip only the citation token and surrounding whitespace"

key-files:
  created: []
  modified:
    - get-shit-done/workflows/execute-plan.md
    - get-shit-done/workflows/add-backlog.md
    - get-shit-done/workflows/ai-integration-phase.md
    - get-shit-done/workflows/discuss-phase.md
    - get-shit-done/workflows/ingest-docs.md
    - get-shit-done/workflows/new-milestone.md
    - get-shit-done/workflows/new-project.md
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/quick.md
    - get-shit-done/workflows/reapply-patches.md
    - get-shit-done/workflows/settings-integrations.md
    - get-shit-done/workflows/settings.md
    - get-shit-done/workflows/update.md
    - get-shit-done/workflows/verify-phase.md
    - get-shit-done/workflows/discuss-phase/modes/advisor.md
    - get-shit-done/workflows/discuss-phase/modes/chain.md
    - get-shit-done/workflows/discuss-phase/templates/context.md
    - get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md
    - get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md
    - get-shit-done/workflows/help/modes/full.md

key-decisions:
  - "D-06 applied: citation-only clauses dropped with leading connectors — e.g. '(Bug #3491 — never ...)' became '(never ...)'"
  - "D-07 applied: independent rationale text preserved — e.g. 'prevents destructive HEAD-on-master self-recovery path' kept; only '(#2924)' stripped"
  - "Dense execute-plan.md line-111 paragraph handled by stripping three citation tokens while preserving every worktree branch-check instruction"

requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]

# Metrics
duration: 20min
completed: 2026-06-09
---

# Phase 66 Plan 02: Clean Workflows Citations Summary

**Removed all issue/PR citations from 20 get-shit-done/workflows/ files (13 top-level + 6 subdirs + execute-plan.md), including the dense multi-citation paragraph at execute-plan.md line 111, with every technical instruction preserved.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-09T07:37:00Z
- **Completed:** 2026-06-09T07:57:58Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments

- All 20 `get-shit-done/workflows/` files cleaned of bare `#NNN`, parenthetical `(#NNN)`, and `feat-NNNN` citations outside frontmatter and code fences
- The dense multi-citation paragraph at execute-plan.md line 111 (three citations: two `#2924` and one `#2015`) rewritten with every technical worktree-branch-check instruction intact
- Guard test (`tests/no-issue-citations.test.cjs`) reports zero `✖` lines for `get-shit-done/workflows/` after cleanup
- `agent-frontmatter.test.cjs` passes at 165/165 — no YAML frontmatter was touched

## Task Commits

1. **Task 1: Clean 13 top-level workflows/ files** - `4c05a70f` (fix)
2. **Task 2: Clean 6 workflows/ subdirectory files** - `9c11aacb` (fix)
3. **Task 3: Clean execute-plan.md** - `2cb5b7b6` (fix)

## Files Created/Modified

All 20 `get-shit-done/workflows/` files listed in plan frontmatter `files_modified` were edited. Key patterns applied:

- `#SDK-resolution` comment lines across many files: stripped `(#3668)` suffix
- `execute-plan.md` line 111: removed `(#2924)`, `— #2015)`, `(#2924)` while preserving HALT/worktree-branch-check/HEAD-assertion instructions
- `quick.md`: stripped 8 citations including `#2916` (branching guard), `#3707` (orphan sweep), `#36182` (path-resolution drift), `#3384`/`#3174` (manifest guard)
- `plan-phase.md`: stripped 7 citations including `#3569` (closed-phase gate), `#3042`/`#3044` (research-only mode), `#1009` (nested subcontext), `#3045` (CR finding), `#3718` (shell-free gate), `#2492` (translation gate)

## Decisions Made

- Applied D-07 (keep independent rationale) to all cases where prose had meaning beyond the citation: "prevents destructive HEAD-on-master self-recovery path" was kept; only the trailing `(#2924)` dropped
- Applied D-06 (drop citation-only clauses) for clauses like `Bug #3491 —` and `(see #1009)` where the number was the only content and the surrounding text stood alone without it
- For `codebase-drift-gate.md` line 3 (`Post-execution structural drift detection (#2003)`): dropped parenthetical only; explanatory text preserved
- `per-plan-worktree-gate.md` heading `# Per-plan worktree decision (#2772)`: dropped parenthetical; heading meaning unchanged
- `discuss-phase/templates/context.md` `savings introduced by issue #2551`: rewritten as "this lazy-load approach provides" — clause preserved, citation removed

## Deviations from Plan

None — plan executed exactly as written. All 20 files were cleaned in three atomic commits matching the task structure.

## Issues Encountered

One additional citation (`#2070`) was discovered in execute-plan.md at line 148 and two duplicate occurrences at lines 374 and 480 (all in prose, not code blocks) that were not reported in the Phase 64 findings. Applied D-07 to each: stripped `see #2070` citation while preserving "Truncation at this boundary is a known failure mode" rationale.

## Guard Test Output (post-cleanup)

```
node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖" | grep "get-shit-done/workflows/" | wc -l
0
```

Zero violations for the entire `get-shit-done/workflows/` slice.

## execute-plan.md Line 111 Handling

The dense paragraph near line 111 contained three inline citations:
1. `never self-recover via 'git update-ref refs/heads/<protected>' (#2924)` → kept prose, stripped `(#2924)`
2. `creates branches from main instead of the feature branch HEAD (affects all platforms — #2015)` → kept prose, stripped `— #2015`
3. `prevents the destructive HEAD-on-master self-recovery path (#2924)` → kept prose, stripped `(#2924)`

Every technical instruction (HALT condition, `git symbolic-ref HEAD` assertion, `git merge-base` / `git reset --hard` sequence, `[ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && exit 1` verification) is preserved verbatim.

## Self-Check

Files exist and commits recorded:
- `4c05a70f` — 13 top-level files
- `9c11aacb` — 6 subdirectory files
- `2cb5b7b6` — execute-plan.md

Guard test: 0 violations for `get-shit-done/workflows/`
agent-frontmatter.test.cjs: 165 pass / 0 fail

## Self-Check: PASSED

---
*Phase: 66-citation-cleanup*
*Completed: 2026-06-09*
