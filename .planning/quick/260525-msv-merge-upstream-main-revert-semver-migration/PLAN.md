---
quick_id: 260525-msv
status: complete
date: 2026-05-25
---

# Quick Task 260525-msv: Merge upstream/main → revert semver migration

Merge `upstream/main` into `thamw-main`. One conflicted file:
`tests/semver-compare.test.cjs`. Upstream replaced SHA-based version
tracking with a new `semver-compare.cjs` module. Fork decision: keep
SHA-based inline versioning (Option A). Revert the semver migration files,
resolve the conflict by keeping HEAD, and complete the merge.

## Steps

1. Analyse conflict and present options to user
2. Revert `hooks/gsd-check-update-worker.js` to HEAD (inline `isNewer()`)
3. Revert `hooks/gsd-statusline.js` to HEAD (inline `parseV()`)
4. Unstage + delete `get-shit-done/bin/lib/semver-compare.cjs`
5. Unstage + delete `tests/bug-10-semver-policy-consolidation.test.cjs`
6. Resolve conflict in `tests/semver-compare.test.cjs` → keep HEAD
7. Stage all changes and commit merge
8. Run `npm test` to verify
