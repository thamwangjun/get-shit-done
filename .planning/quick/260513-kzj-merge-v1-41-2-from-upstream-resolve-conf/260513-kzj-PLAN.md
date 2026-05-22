---
quick_id: 260513-kzj
slug: merge-v1-41-2-from-upstream-resolve-conf
description: Merge upstream v1.41.2 into fork branch thamw-v1.41.2 with conflict resolution
date: 2026-05-13
status: complete
---

# Quick Task 260513-kzj: Merge v1.41.2 from Upstream

## Description

Merge upstream `v1.41.2` tag into new fork branch `thamw-v1.41.2` (forked off `thamw-main`). Resolve conflicts case-by-case using fork policy (HDOC tests stay `describe.skip`; preserve fork-specific positive-framing edits; preserve fork-only fixes like the `gsd-tools` full node path; preserve fork's git-SHA versioning architecture).

## Tasks

### Task 1: Run merge and enumerate conflicts

- **Action:** `git merge --no-ff --no-commit v1.41.2`; capture conflict list and classify
- **Done:** 9 conflict files identified

### Task 2: Resolve conflicts and commit

- **Action:** Apply per-file resolution; verify fork-policy invariants
- **Done:** All 9 conflicts resolved, merge committed

### Task 3: Post-merge verification

- **Action:** `npm install` and run test suite
- **Done:** 8296 pass / 11 fail / 1 skip. Known fails tracked as follow-up (matches prior merge pattern).
