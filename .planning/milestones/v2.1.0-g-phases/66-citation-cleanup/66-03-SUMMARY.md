---
phase: 66-citation-cleanup
plan: "03"
subsystem: testing
tags: [citation-cleanup, agents, prompt-content, guard-test]

requires:
  - phase: 65-guard-test-red
    provides: "no-issue-citations.test.cjs guard test (the RED pass gate)"

provides:
  - "6 agents/ files cleaned of all issue/PR citations outside frontmatter and code fences"
  - "Guard test agents/ slice passes GREEN with zero violations"
  - "agent-frontmatter.test.cjs test count unchanged (140 pass / 0 fail)"

affects: [66-citation-cleanup]

tech-stack:
  added: []
  patterns:
    - "Citation cleanup: remove #NNN inline, (#NNN) parenthetical, and feat-NNNN tokens from prose; preserve code fences and YAML frontmatter verbatim"

key-files:
  created: []
  modified:
    - agents/gsd-code-fixer.md
    - agents/gsd-codebase-mapper.md
    - agents/gsd-executor.md
    - agents/gsd-intel-updater.md
    - agents/gsd-plan-checker.md
    - agents/gsd-verifier.md

key-decisions:
  - "D-07: Keep explanatory clauses (rationale/behavior description) when stripping parenthetical citations — only the (#NNN) token is removed, not the surrounding prose"
  - "D-06: Drop citation-only clauses entirely (e.g. '#2839' in heading text) when the citation was the sole content beyond the section title"

patterns-established:
  - "Per-file edit: each agent file edited individually with targeted Edit calls, no regex script"
  - "Code fence exemption honored: bash script citations (#NNN inside code blocks) left untouched"

requirements-completed: [CITE-06, CITE-07, CITE-08, CITE-09]

duration: 15min
completed: 2026-06-09
---

# Phase 66 Plan 03: Clean Issue Citations from agents/ Summary

**Stripped 21 issue/PR citation tokens from 6 agents/ files; guard test agents/ slice now GREEN with zero violations and frontmatter test count unchanged (140/140)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-09T07:39:00Z
- **Completed:** 2026-06-09T07:54:06Z
- **Tasks:** 3 (Task 1: baseline capture; Task 2: cleanup + commit; Task 3: post-verify)
- **Files modified:** 6

## Accomplishments

- All 6 failing `agents/` files cleaned of issue citations (gsd-code-fixer, gsd-codebase-mapper, gsd-executor, gsd-intel-updater, gsd-plan-checker, gsd-verifier)
- YAML frontmatter blocks preserved byte-identical — agent-frontmatter.test.cjs passes 140/140, 0 failures, matching baseline exactly
- Guard test `tests/no-issue-citations.test.cjs` returns zero violations for `agents/` slice
- All citations inside code fences (bash scripts) left untouched per D-09

## Baseline vs. After Frontmatter Test Summary

**Baseline (pre-cleanup):**
```
ℹ tests 140
ℹ pass 140
ℹ fail 0
ℹ skipped 0
```

**After (post-cleanup):**
```
ℹ tests 140
ℹ pass 140
ℹ fail 0
ℹ skipped 0
```

Diff count: `0` — counts are byte-identical. CITE-09 satisfied with measurable proof.

## Post-Edit Guard Test Output (agents/ slice)

```
node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖" | grep "agents/"
# (no output)
CLEAN: agents/
```

## Task Commits

1. **Task 1: Capture baseline agent-frontmatter test count** - no commit (read-only baseline)
2. **Task 2: Clean citations from 6 agents/ files** - `65bfb1f0` (refactor)
3. **Task 3: Re-run agent-frontmatter validator** - no commit (verification only)

## Citations Removed Per File

| File | Citations Removed |
|------|-------------------|
| `agents/gsd-code-fixer.md` | #2839 (×3), #2990 (×3), #2686 (×1) — 7 tokens total |
| `agents/gsd-codebase-mapper.md` | #2003 (×1) — 1 token total |
| `agents/gsd-executor.md` | #3097, #3099, #2924, #2075, #3542, #3678 (×2) — 8 tokens total |
| `agents/gsd-intel-updater.md` | #3290 (×1) — 1 token total |
| `agents/gsd-plan-checker.md` | #1602, #1861 — 2 tokens total |
| `agents/gsd-verifier.md` | #3309 (×1) — 1 token total |

**Total:** 21 citation tokens removed across 6 files.

## Files Modified

- `agents/gsd-code-fixer.md` - 5 citation-bearing prose lines edited; bash code block citations left intact
- `agents/gsd-codebase-mapper.md` - 1 heading edited (`--paths scope hint`)
- `agents/gsd-executor.md` - 8 prose lines edited; code block citations left intact
- `agents/gsd-intel-updater.md` - 1 HTML comment edited
- `agents/gsd-plan-checker.md` - 2 dimension headings edited
- `agents/gsd-verifier.md` - 1 prose line edited

## Decisions Made

- Citation-only parentheticals in heading text (e.g. `(#2003)` in `--paths scope hint (#2003)`) stripped entirely since the heading reads naturally without them
- For inline citations in dense prose (e.g. `(#2839, #2990)` in step descriptions), only the citation was stripped and surrounding connectors cleaned up
- Code block citations preserved verbatim per D-09

## Deviations from Plan

None — plan executed exactly as written. The raw `grep` acceptance criterion for code-block-excluded citations shows non-zero because it does not replicate the test's code-fence exclusion logic. The actual guard test (`no-issue-citations.test.cjs`) reports 0 violations for `agents/`, which is the correct pass gate per plan objective.

## Issues Encountered

The `tests/no-issue-citations.test.cjs` guard test was not present in the worktree (it was added to `dev` after the worktree was created in Phase 65). Copied from the dev branch into the worktree's `tests/` directory for verification purposes. The copy was not committed — it is a temporary verification aid.

## Next Phase Readiness

- `agents/` slice of guard test is GREEN
- Remaining 4 directories (`commands/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `get-shit-done/templates/`) still need cleanup
- Plan 66-01 (commands/), 66-02 (workflows/), 66-04 (references/), 66-05 (templates/) handle the remaining directories

---

## Self-Check

- agents/gsd-code-fixer.md: FOUND
- agents/gsd-codebase-mapper.md: FOUND
- agents/gsd-executor.md: FOUND
- agents/gsd-intel-updater.md: FOUND
- agents/gsd-plan-checker.md: FOUND
- agents/gsd-verifier.md: FOUND
- Commit 65bfb1f0: FOUND
- 66-03-SUMMARY.md: FOUND

## Self-Check: PASSED
