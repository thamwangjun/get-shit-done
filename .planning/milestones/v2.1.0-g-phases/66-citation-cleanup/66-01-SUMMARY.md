---
phase: 66-citation-cleanup
plan: 01
subsystem: testing
tags: [citation-cleanup, guard-test, commands, prompt-content]

requires:
  - phase: 65-guard-test-red
    provides: "no-issue-citations.test.cjs guard test that detects bare #NNN, parenthetical (#NNN), and feat-NNNN citations across scoped directories"

provides:
  - "9 commands/gsd/ files cleaned of all issue/PR citations outside frontmatter and code fences"
  - "Guard test reports zero failing lines for commands/gsd/ paths"

affects: [66-citation-cleanup-02, 66-citation-cleanup-03, 66-citation-cleanup-04, 66-citation-cleanup-05]

tech-stack:
  added: []
  patterns:
    - "Citation removal: drop trailing 'by #NNN' / 'in #NNN' connectors as sole-purpose clauses; strip parenthetical (#NNN) when inline qualifier with no independent meaning; strip trailing (#NNN) when citation is standalone at sentence end"

key-files:
  created: []
  modified:
    - commands/gsd/config.md
    - commands/gsd/graphify.md
    - commands/gsd/ns-context.md
    - commands/gsd/ns-ideate.md
    - commands/gsd/ns-manage.md
    - commands/gsd/ns-project.md
    - commands/gsd/ns-review.md
    - commands/gsd/ns-workflow.md
    - commands/gsd/plan-phase.md

key-decisions:
  - "Stripped (post-)#NNN qualifiers in ns-* files as sole-purpose citation clauses with no independent meaning beyond the issue reference"
  - "Kept surrounding prose intact in graphify.md and plan-phase.md — only the parenthetical token was removed, the explanation sentence was preserved"

patterns-established:
  - "Connector removal pattern: when 'by #NNN', 'in #NNN', or 'post-#NNN' is the only informational content of a clause, remove the connector and the citation together"

requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]

duration: 15min
completed: 2026-06-09
---

# Phase 66 Plan 01: Citation Cleanup — commands/gsd/ Summary

**Removed 9 issue/PR citations from commands/gsd/ command files by stripping bare #NNN, parenthetical (#NNN), and inline post-#NNN qualifiers; guard test now reports zero violations for this directory.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-09T07:35:00Z
- **Completed:** 2026-06-09T07:50:12Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments

- All 9 failing `commands/gsd/` files cleaned of citations outside frontmatter and code fences
- Guard test (`tests/no-issue-citations.test.cjs`) reports zero `✖` lines for `commands/gsd/` paths
- YAML frontmatter blocks untouched — `agent-frontmatter.test.cjs` passes with same count
- Prose repairs applied: sentences read naturally with no double spaces, dangling connectors, or empty parentheses

## Task Commits

1. **Task 1: Clean citations from 9 commands/gsd/ files** - `9507d310` (fix)

## Files Modified

- `commands/gsd/config.md` - Removed `(#2439)` from `**Pre-flight check:**` label
- `commands/gsd/graphify.md` - Stripped `(#3166)` from anti-pattern rationale sentence
- `commands/gsd/ns-context.md` - Dropped trailing `by #2790` connector clause
- `commands/gsd/ns-ideate.md` - Dropped `by\n#2790` citation spanning lines 13–14; sentence terminates at modes list
- `commands/gsd/ns-manage.md` - Removed `post-#2790` qualifier from `consolidated entries` descriptor
- `commands/gsd/ns-project.md` - Dropped `by #2790` from deletion note
- `commands/gsd/ns-review.md` - Stripped trailing `in #2790` citation
- `commands/gsd/ns-workflow.md` - Removed `post-#2790` qualifier from targets descriptor
- `commands/gsd/plan-phase.md` - Stripped `(#3042)` from research-only mode description

## Decisions Made

- `post-#NNN` qualifier strings (e.g. `post-#2790`) treated as citation qualifiers and removed entirely — the resulting descriptor (`consolidated entries`, `consolidated targets`) reads cleanly without the qualifier.
- `by #NNN` trailing connectors treated as sole-purpose citation clauses (D-06) — connector and citation dropped together, sentence ends at the prior clause.
- Inline `(#NNN)` in prose with independent surrounding meaning (graphify.md, plan-phase.md) — citation stripped, prose kept intact (D-07).

## Deviations from Plan

None — plan executed exactly as written. All 9 files cleaned in a single pass with per-file Edit operations (per D-01). No regex script was created (per D-02).

## Issues Encountered

The guard test (`tests/no-issue-citations.test.cjs`) was not present in the worktree's git history (the worktree branch diverged from `dev` before Phase 65 commits landed). The test was copied from the main repo for local verification. The copy was not committed as it is outside this plan's scope and will be present when the worktree branch is merged.

## Post-Edit Guard Test Output

```
node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖" | grep "commands/gsd/" || echo "CLEAN: commands/gsd/"
CLEAN: commands/gsd/
```

Acceptance criteria:
- AC1: `node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖" | grep "commands/gsd/" | wc -l` → `0` PASS
- AC2: `grep -rEn '(^|[^&#])#[0-9]{3,}' commands/gsd/ | grep -vE '#(1|2|45|123)([^0-9]|$)' | wc -l` → `0` PASS
- AC3: `grep -rEn 'feat-[0-9]{3,}' commands/gsd/ | wc -l` → `0` PASS
- AC4: `git diff --stat commands/gsd/` shows 9 files changed PASS

## Next Phase Readiness

- `commands/gsd/` directory fully clean — no blockers for Phase 66 plans 02–05
- Other failing directories (workflows, agents, references, templates) are scoped to separate plans

---
*Phase: 66-citation-cleanup*
*Completed: 2026-06-09*
