---
quick_id: 260531-rej
slug: fix-race-condition-in-gen-project-root-m
status: ready
---

# Quick Task 260531-rej: Atomic write in gen-project-root.mjs

## Problem

`npm test` has 1 intermittent failure (race condition, order/timing dependent):

```
test at tests/feat-3310-followup-typed-codes.test.cjs:153:3
✖ graphify query missing term → usage
  TypeError: findProjectRoot is not a function
      at main (get-shit-done/bin/gsd-tools.cjs:514:11)
```

### Root cause

- `tests/gen-staleness-check.test.cjs` subtest C ("exits 0 when dist is newer than TS source", ~line 178)
  runs the **real** `gen-project-root.mjs` against the repo root (no `GSD_REPO_ROOT` override).
- `sdk/scripts/gen-project-root.mjs:86` calls `writeFile(outPath, content)` directly on the committed
  file `get-shit-done/bin/lib/project-root.generated.cjs`. `writeFile` truncates-then-writes — a
  non-atomic window where the file is empty/partial.
- Concurrently, other test files spawn `gsd-tools.cjs` subprocesses; each `require`s `core.cjs` →
  `project-root.generated.cjs` at startup. A subprocess that requires during the truncate window reads a
  file missing `module.exports = { findProjectRoot }`, so `core.findProjectRoot` is `undefined` →
  `findProjectRoot is not a function` at `gsd-tools.cjs:514`.

Passes in isolation, fails in the full parallel suite — classic non-atomic-write race.

## Decision (user-confirmed)

- Scope: fix **only** `gen-project-root.mjs` (the sole generated file on the hot startup require path).
- Fix the generator only; leave the staleness test as-is.

## Task

### Task 1: Make gen-project-root.mjs write atomically

- **files:** `sdk/scripts/gen-project-root.mjs`
- **action:** Replace the direct `writeFile(outPath, content)` in `main()` with an atomic
  write-temp-then-rename. Write to a unique sibling temp path (same directory, so `rename` stays on the
  same filesystem and is atomic), then `rename(tmpPath, outPath)`. On error, best-effort unlink the temp
  file. Update the `node:fs/promises` import to include `rename` (and `unlink` if used).
- **verify:** Run `node sdk/scripts/gen-project-root.mjs` — it still writes a byte-identical
  `get-shit-done/bin/lib/project-root.generated.cjs` (no git diff on that file). Run
  `node --test tests/gen-staleness-check.test.cjs tests/feat-3310-followup-typed-codes.test.cjs` green.
  Then run full `npm test` and confirm 0 failures.
- **done:** Generator writes via temp-file + rename; committed generated file unchanged; full suite passes.

## must_haves

- truths:
  - `gen-project-root.mjs` no longer truncates the committed `.generated.cjs` in place.
  - A concurrent reader of `project-root.generated.cjs` during regeneration sees either the complete old
    or complete new file, never a partial/empty one.
- artifacts:
  - `sdk/scripts/gen-project-root.mjs` (atomic write)
- key_links:
  - `get-shit-done/bin/lib/project-root.generated.cjs` content byte-identical after regeneration.
