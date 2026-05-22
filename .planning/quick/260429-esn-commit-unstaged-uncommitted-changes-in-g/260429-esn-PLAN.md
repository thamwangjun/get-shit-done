---
quick_id: 260429-esn
slug: commit-unstaged-uncommitted-changes-in-g
description: Commit unstaged uncommitted changes in git workspace
date: 2026-04-29
status: in-progress
---

# Quick Task 260429-esn: Commit Unstaged Changes

## Context

All workspace changes form a single coherent refactor: moving fork-specific reference
files from `refs/` → `.planning/references/` and `plans/` → `.planning/fork_plans/`,
with all path references updated consistently.

## Changes Breakdown

| Group | Files | Change Type |
|-------|-------|-------------|
| New dirs | `.planning/fork_plans/` (4 files), `.planning/references/` (3 files) | Untracked → add |
| Deletions | `plans/` (4 files), `refs/` (3 files) | Tracked deletions |
| Path ref updates | All `.planning/milestones/**`, `.planning/research/**`, `README*.md`, `docs/**` | Unstaged modifications |
| Staged | `.planning/PROJECT.md` | Already staged |

## Plan

### Task 1: Stage and commit all changes as one atomic refactor commit

**Files:**
- `.planning/fork_plans/` (all files — new)
- `.planning/references/` (all files — new)
- `plans/` (all files — deleted)
- `refs/` (all files — deleted)
- All modified planning/milestone/README files

**Action:** `git add` all changes, then commit with message:
`refactor: move plans/ and refs/ into .planning/{fork_plans,references}/`

**Verify:** `git status` shows clean working tree

**Done:** Commit hash returned by git commit

## Commit Message

```
refactor: move plans/ and refs/ into .planning/{fork_plans,references}/

Fork-specific reference files and plan templates relocated from top-level
dirs into .planning/ to consolidate all planning artifacts. All path
references updated consistently across planning docs, milestones, research
files, and README variants.

- refs/ → .planning/references/ (PROMPT_ENGINEERING_GUIDE_V09.md, PROMPT_IMPROVEMENT_GUIDE_V01.md, UPSTREAM_TO_FORK_CHANGES_GUIDE.md)
- plans/ → .planning/fork_plans/ (A0, B0, C0, D0 plan templates)
```
