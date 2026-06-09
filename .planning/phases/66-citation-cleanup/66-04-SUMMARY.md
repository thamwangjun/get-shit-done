---
phase: 66-citation-cleanup
plan: "04"
subsystem: references
tags: [citation-cleanup, references, prose-repair]
dependency_graph:
  requires: []
  provides: [clean-references-slice]
  affects: [no-issue-citations.test.cjs]
tech_stack:
  added: []
  patterns: [per-file-agent-edit, code-fence-exclusion]
key_files:
  created: []
  modified:
    - get-shit-done/references/checkpoints.md
    - get-shit-done/references/git-integration.md
    - get-shit-done/references/model-profiles.md
    - get-shit-done/references/mvp-concepts.md
    - get-shit-done/references/planner-graphify-auto-update.md
    - get-shit-done/references/planner-human-verify-mode.md
    - get-shit-done/references/planning-config.md
    - get-shit-done/references/scout-codebase.md
    - get-shit-done/references/thinking-partner.md
    - get-shit-done/references/worktree-path-safety.md
decisions:
  - "Stale test filename feat-3347-graphify-auto-update-config.test.cjs updated to the actual file graphify-auto-update.test.cjs, removing the feat-3347 citation naturally"
  - "Code-fence content in worktree-path-safety.md (bash echo strings with #2924, #3097) left untouched per D-09; guard test correctly skips them"
metrics:
  duration_minutes: 12
  completed_date: "2026-06-09"
---

# Phase 66 Plan 04: Clean Citations from get-shit-done/references/ Summary

Removed all issue/PR number citations from 10 `get-shit-done/references/` files so the Phase 65 guard test goes GREEN for the references slice.

## What Was Built

Cleaned 10 reference `.md` files of bare `#NNN`, parenthetical `(#NNN)`, and `feat-NNNN` citations outside frontmatter and code fences. Prose repaired at each removal site so sentences read naturally.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Clean citations from 10 get-shit-done/references/ files | 5987c77f | 10 reference files |

## Citation Inventory (removed)

| File | Citations removed | Form |
|------|-------------------|------|
| checkpoints.md | `(#3309)` (line 21), `#3309` (line 25) | parenthetical, inline |
| git-integration.md | `(#2924)` (line 66) | parenthetical |
| model-profiles.md | `(#3023)` (line 22), `(#3024)` (line 136), `(#3023)` (line 174) | parenthetical ×3 |
| mvp-concepts.md | `#2826` (line 35) | inline |
| planner-graphify-auto-update.md | `#3347` (line 3), `feat-3347` (line 62), `#3347` (line 67) | inline, feat-form, inline |
| planner-human-verify-mode.md | `#3309` (lines 3, 7, 32) | inline ×3 |
| planning-config.md | `(#2493)` (line 272) | parenthetical |
| scout-codebase.md | `#2551` (line 4) | inline |
| thinking-partner.md | `#1729` (line 69), `(#1729)` (line 72) | inline, parenthetical |
| worktree-path-safety.md | `(#2924)` (line 14), `#2015` (line 15), `(#3097)` (line 39), `(#3099)` (line 69) | parenthetical, inline, parenthetical ×2 |

## Verification

Guard test output after cleanup:

```
CLEAN: references/
```

`node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖" | grep "get-shit-done/references/"` — no output (0 lines).

`node --test tests/agent-frontmatter.test.cjs` — 0 fail, 0 skip.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale test filename in planner-graphify-auto-update.md**
- **Found during:** Task 1 — line 62 referenced `tests/feat-3347-graphify-auto-update-config.test.cjs`
- **Issue:** The referenced test file does not exist; the actual file is `tests/graphify-auto-update.test.cjs`
- **Fix:** Updated the inline reference to the correct filename, which naturally removed the `feat-3347` citation
- **Files modified:** `get-shit-done/references/planner-graphify-auto-update.md`
- **Commit:** 5987c77f

### Notes

Code-fence content preserved per D-09: `worktree-path-safety.md` contains `(#2924)` and `(#3097)` inside bash `echo` strings within triple-backtick fences. These were not modified. The guard test's code-fence exclusion logic correctly skips them; the raw `grep` check in the acceptance criteria still shows 4 matches, all of which are inside code fences.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or security-relevant surface introduced.

## Self-Check: PASSED

- [x] All 10 reference files modified (confirmed via `git diff --stat`)
- [x] Commit 5987c77f exists (`git log --oneline -1`)
- [x] Guard test reports 0 ✖ lines for get-shit-done/references/ paths
- [x] agent-frontmatter.test.cjs passes with 0 failures
