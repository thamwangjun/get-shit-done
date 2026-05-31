---
quick_id: 260531-rej
slug: fix-race-condition-in-gen-project-root-m
status: complete
date: 2026-05-31
commit: 67a55407
---

# Quick Task 260531-rej: Atomic write in gen-project-root.mjs — Summary

## Problem

`npm test` had 1 intermittent failure — order/timing dependent, passed in isolation:

```
test at tests/feat-3310-followup-typed-codes.test.cjs:153
✖ graphify query missing term → usage
  TypeError: findProjectRoot is not a function
      at main (get-shit-done/bin/gsd-tools.cjs:514)
```

## Root cause (race condition)

- `tests/gen-staleness-check.test.cjs` subtest C runs the **real** `gen-project-root.mjs`
  against the repo root (no `GSD_REPO_ROOT` override).
- `sdk/scripts/gen-project-root.mjs` `main()` wrote the committed file
  `get-shit-done/bin/lib/project-root.generated.cjs` via a direct, non-atomic
  `writeFile(outPath, content)` — truncate-then-write leaves a window where the file is empty/partial.
- Concurrently, other test files spawn `gsd-tools.cjs` subprocesses; each `require`s `core.cjs` →
  `project-root.generated.cjs` at startup. A subprocess requiring during the truncate window reads a
  file missing `module.exports = { findProjectRoot }`, so `core.findProjectRoot` is `undefined`.

## Fix

`sdk/scripts/gen-project-root.mjs` `main()` now writes atomically: write `content` to a unique
sibling temp path (`${outPath}.tmp-${pid}-${Date.now()}`), then `rename` over `outPath` (atomic on
the same filesystem). Best-effort `unlink` of the temp file on error, then rethrow so
`main().catch` still exits 1. Import updated to `{ writeFile, rename, unlink }`.

Scope was deliberately limited to this one generator: `project-root.generated.cjs` is the only
generated file `require`d by every `gsd-tools` subprocess at startup (via `core.cjs`), so it is the
only one on the hot race path.

## Verification

- Regeneration (`node sdk/scripts/gen-project-root.mjs`) is byte-identical — no git diff on the
  committed `.generated.cjs`.
- `node --test tests/gen-staleness-check.test.cjs tests/feat-3310-followup-typed-codes.test.cjs`:
  50 pass, 0 fail.
- Full `npm test`: 5029 pass, 0 fail, 3 skipped.

## Commit

- `67a55407` — fix(260531-rej): write project-root.generated.cjs atomically to fix parallel-test race

## Note

The fix was originally committed in a worktree (`6f8f3d52`); during worktree cleanup the branch was
removed before the merge landed on `dev`, so the commit was cherry-picked onto `dev` as `67a55407`.
The change content is identical.
