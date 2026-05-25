---
quick_id: 260525-msv
status: complete
date: 2026-05-25
commit: e773e485
---

# Quick Task 260525-msv: Summary

## What was done

Merged `upstream/main` into `thamw-main`. The merge had one conflicted
file (`tests/semver-compare.test.cjs`) caused by upstream's semver
migration. User chose Option A (full SHA rollback). Reverted the semver
migration files before committing the merge.

## Fork decision: SHA versioning stays

Upstream introduced `get-shit-done/bin/lib/semver-compare.cjs` and rewrote
`gsd-check-update-worker.js` to import `isSemverNewer` from it, checking
`npm view get-shit-done-redux version` for updates. The fork does not
publish to npm under that name and tracks upstream by git, so the semver
module is not needed.

**Reverted files (restored to HEAD):**
- `hooks/gsd-check-update-worker.js` — keeps inline `isNewer()` (semver
  tuple comparison, no external module)
- `hooks/gsd-statusline.js` — keeps inline `parseV()` for dev-install
  detection, no `isSemverNewer` import

**Dropped from merge (new upstream files not adopted):**
- `get-shit-done/bin/lib/semver-compare.cjs` — extracted module, not needed
- `tests/bug-10-semver-policy-consolidation.test.cjs` — depended on both
  `semver-compare.cjs` and `isInstalledAheadOfLatest` (not exported by
  HEAD statusline)

**Conflict resolved:** `tests/semver-compare.test.cjs` → kept HEAD version
(SHA `isNewer` mirror + HOOK-03/HOOK-04 static assertions).

## Future merge note

`gsd-check-update-worker.js` and `gsd-statusline.js` are now intentionally
diverged from upstream. Any future upstream merge that modifies these files
will conflict — resolve by keeping HEAD and checking whether upstream
changes are semver-module-related or unrelated (unrelated changes should
be cherry-picked in).

## Test status

`npm test` passes (exit code 0).
