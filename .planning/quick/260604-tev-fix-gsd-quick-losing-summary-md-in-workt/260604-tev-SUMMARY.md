---
phase: quick-260604-tev
plan: "01"
type: summary
completed: "2026-06-04T13:17:30Z"
duration: "~15min"
tasks_completed: 3
tasks_total: 3
key_decisions:
  - "Positive-framing replacement: old 'Do NOT commit docs artifacts' prohibition replaced with affirmative executor instruction to commit SUMMARY.md to per-agent branch"
  - "Scope boundary: executor commits ONLY SUMMARY.md; STATE.md, ROADMAP.md remain orchestrator-owned; PLAN.md is pre-dispatch committed; Step 15 stays as idempotent safety net"
  - "rescueSummaryArtifacts marked as defense-in-depth fallback (comment only, no behavioral change)"
---

# Quick 260604-tev: Fix gsd-quick Losing SUMMARY.md in Worktree Mode Summary

Executor now commits SUMMARY.md to its per-agent branch so it survives worktree teardown; old negative prohibition removed and replaced with affirmative constraint per fork positive-framing rule.

## What Was Built

**Root cause:** `quick.md` line 782 told the executor `Do NOT commit docs artifacts (SUMMARY.md, STATE.md, PLAN.md)`. The intended rescue fallback (`rescueSummaryArtifacts`) never ran because the cleanup manifest stayed empty. Claude Code's native worktree teardown deleted the uncommitted SUMMARY.md before Step 15 could stage it.

**Fix:** The executor now commits its SUMMARY.md as a `docs(quick-${quick_id})` commit on the per-agent branch. Committed work merges back via `worktree.cleanup-wave` (Step 11) and survives teardown — the same pattern PLAN.md already used.

## Second Fix: cleanup-wave Merge Abort on Committed SUMMARY (#260604-tev follow-up)

**Root cause discovered by running the real cleanup path:** Once the executor commits SUMMARY.md, `worktree.cleanup-wave` began FAILING to merge the per-agent branch. `rescueSummaryArtifacts` in `worktree-safety.cjs` walked the worktree filesystem (`defaultFindSummaryFiles`) and copied EVERY `*SUMMARY.md` into the main tree as an untracked file — including the now-committed SUMMARY. `git merge <branch>` then aborted:

```
error: The following untracked working tree files would be overwritten by merge:
  .planning/quick/260604-tev-.../260604-tev-SUMMARY.md
Please move or remove them before you merge. Aborting
```

The defense-in-depth comment from the first fix was insufficient — the rescue actively broke the merge by creating a conflicting untracked copy of an already-committed file.

**Fix:** `rescueSummaryArtifacts` now rescues only SUMMARY files that are genuinely uncommitted (untracked OR modified) in the worktree. It consults the worktree's git status once via a new injectable `deps.getWorktreeDirtyPaths(worktreePath) -> Set<relPath>` (real-git default `defaultGetWorktreeDirtyPaths`, fail-safe to empty on git error). Committed-and-clean summaries are skipped entirely — not copied and not added to `rescuedRelPaths`. The merge brings committed files over naturally; clean files never appear in porcelain so they need no filtering. The legacy uncommitted path (genuine safety net for non-worktree-committing callers) is unchanged.

Also removed the dead, unused `parseWorktreeListPaths` helper (lint cleanup, in-scope).

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Move SUMMARY.md commit responsibility to executor | a8ab00d1 | get-shit-done/workflows/quick.md |
| 2 | Update commit-boundary regression test | d6c8c670 | tests/quick-commit-boundary.test.cjs |
| 3 | Full suite pass + defense-in-depth comment | 1209e310 | get-shit-done/bin/lib/worktree-safety.cjs |
| 4 | Rescue only uncommitted summaries (cleanup-wave merge fix) + regression test | (this commit) | get-shit-done/bin/lib/worktree-safety.cjs, tests/worktree-safety.test.cjs |

## Deviations from Plan

The second fix (rescue committed-clean SUMMARY abort) was a follow-up discovered by running the actual `worktree.cleanup-wave` path after the first fix landed — see "Second Fix" section above. Plan tasks 1-3 executed as written.

## Test Results

`npm test` — 4736 pass, 0 fail, 4 skipped (~21s) on this branch after second fix. (Re-run against the integration baseline after merge: 7860 pass, 0 fail, 12 skipped.)

`node --test tests/worktree-safety.test.cjs` — 36/36 pass, including:
- `#3804: rescues uncommitted SUMMARY.md from worktree .planning/ before dirty check`
- `#3804: still blocks when worktree has non-SUMMARY dirty files alongside SUMMARY`
- `#3804 follow-up: committed-and-clean SUMMARY.md is NOT rescued (avoids merge abort)`

(First fix recorded below: `npm test` — 4735 pass, 0 fail, 4 skipped at that time.)

`node --test tests/quick-commit-boundary.test.cjs` — 5/5 tests pass:
- `quick.md exists`
- `executor constraints instruct committing SUMMARY.md for worktree survival (#260604-tev)`
- `Step 8 explicitly stages artifacts with git add before commit`
- `Step 8 includes PLAN.md in file list`
- `Step 8 runs unconditionally`

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- get-shit-done/workflows/quick.md: FOUND, "Do NOT commit docs artifacts" absent, "Commit your SUMMARY.md" present
- tests/quick-commit-boundary.test.cjs: FOUND, new contract test passing
- get-shit-done/bin/lib/worktree-safety.cjs: FOUND, defense-in-depth comment added
- All 3 task commits verified: a8ab00d1, d6c8c670, 1209e310
