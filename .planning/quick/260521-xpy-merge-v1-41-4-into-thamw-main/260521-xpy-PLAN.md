---
quick_id: 260521-xpy
slug: merge-v1-41-4-into-thamw-main
description: Merge v1.41.4 into thamw-main and resolve regression test failures
date: 2026-05-21
status: complete
---

# Quick Task 260521-xpy: Merge v1.41.4 into thamw-main

## Description

Merge tag `v1.41.4` into the `thamw-main` branch. Resolve regressions/test failures introduced by file size additions to `gsd-planner.md` and lack of config sandboxing in `tests/ai-evals.test.cjs`.

## Tasks

### Task 1: Sandbox config defaults lookup in tests/ai-evals.test.cjs
- **Action:** Add `{ HOME: tmpDir, USERPROFILE: tmpDir }` sandbox overrides to all `runGsdTools` calls in `tests/ai-evals.test.cjs` to ignore global defaults.json settings.
- **Verify:** Tests run and ignore global configurations.

### Task 2: Condense gsd-planner agent documentation to restore file limits
- **Action:** Compress the verbose `## Interface Context for Executors` block in `agents/gsd-planner.md` to be under 48K/50K characters.
- **Verify:** File size is under 48K chars.

### Task 3: Fast-forward thamw-main to v1.41.4
- **Action:** Check out `thamw-main` and fast-forward merge tag `v1.41.4`.
- **Verify:** HEAD points to the merged commits.

### Task 4: Run full verification
- **Action:** Run `npm run build:sdk && npm test` and ensure all tests pass.
- **Verify:** 8300+ tests pass with 0 failures.
