---
phase: "43"
plan: "01"
status: complete
subsystem: update-workflow
tags: [sha-migration, check-latest-version, update-workflow, test-rewrite]
decisions:
  - Remove npm/semver dependency from check-latest-version.cjs in favour of GitHub Commits API SHA
  - Replace changeset changelog extraction in update.md with direct GitHub commits link
  - Binary SHA equality replaces semver comparison (no ordering needed for SHAs)
  - Remove dev-install warning branch from compare_versions (no "installed > latest" concept with SHAs)
tech_stack:
  added: []
  patterns: [injectable-request-seam, sha-based-versioning]
requirements_completed: [UPD-01, UPD-02, TEST-03, GATE-01]
key_files:
  created: []
  modified:
    - get-shit-done/bin/check-latest-version.cjs
    - tests/bug-2992-check-latest-version.test.cjs
    - get-shit-done/workflows/update.md
    - tests/changeset-cli.test.cjs
---

# Phase 43 Plan 01 Summary: SHA Migration + Full Gate

## What Was Done

Migrated the GSD update workflow from npm/semver to a GitHub Commits API SHA-based approach. The check-latest-version.cjs script now fetches the latest commit SHA from `https://api.github.com/repos/thamwangjun/get-shit-done/commits/main` instead of running npm commands. The update.md workflow was updated to use `LATEST_SHA` instead of `LATEST_VERSION`, binary SHA equality for version comparison, and a direct GitHub commits link instead of changelog extraction via the changeset CLI.

## Key Changes

### get-shit-done/bin/check-latest-version.cjs
- Replaced npm/semver logic with `https.get` call to GitHub Commits API
- Added `GITHUB_API_URL` constant (hardcoded, not parameterised)
- `CHECK_REASON` enum: `OK`, `FAIL_FETCH_FAILED`, `FAIL_INVALID_SHA` (removed `FAIL_NPM_FAILED`, `FAIL_INVALID_OUTPUT`)
- `checkLatestVersion(opts)` is async with injectable `request` seam for testing
- 15-second timeout via `req.setTimeout` + `req.destroy`
- SHA validation: `/^[0-9a-f]{7}/i.test(sha)` — 7+ hex chars required
- Success result: `{ ok: true, sha: sha.slice(0, 7), reason: CHECK_REASON.OK }`
- Exports: `{ checkLatestVersion, CHECK_REASON, GITHUB_API_URL }` (no `PACKAGE_NAME`)

### tests/bug-2992-check-latest-version.test.cjs
- Complete rewrite for SHA-based assertions (9 tests, all passing)
- `makeFakeRequest` and `makeFakeRawRequest` helpers using `https.get` signature
- Tests cover: constants, success paths (full 40-char SHA truncation), all error paths

### get-shit-done/workflows/update.md
- `check_latest_version` step: updated description, `LATEST_VERSION` → `LATEST_SHA`, `jq -r '.version // empty'` → `jq -r '.sha // empty'`, manual-update instruction → `npx get-shit-done-cc`
- `compare_versions` step: replaced semver comparison with binary SHA equality; removed dev-install warning branch
- `show_changes_and_confirm` step: removed all changelog extraction (CHANGELOG_TMP, curl/wget, cli.cjs extract, CHANGELOG_PREVIEW); replaced with SHA display block and GitHub commits link

### tests/changeset-cli.test.cjs
- Updated F1 test to assert SHA-based approach instead of cli.cjs extract invocation
- New assertions: `LATEST_SHA` variable present, GitHub commits link present, cli.cjs extract absent

## Verification

1. Module exports: `["checkLatestVersion","CHECK_REASON","GITHUB_API_URL"]` — PASSED
2. `node --test tests/bug-2992-check-latest-version.test.cjs` exits 0 (9/9 pass) — PASSED
3. `grep -c 'grep -Eq.*0-9a-f' update.md` returns 3 — PASSED
4. `grep -c 'CHANGELOG_TMP' update.md` returns 0 — PASSED
5. `npm test` non-ai-evals failures: 185 (same as pre-existing baseline) — PASSED

## Commits

- `c4b7e980`: feat(43-01): migrate check-latest-version to GitHub SHA API (Tasks 1 + 2)
- `78d77c43`: feat(43-01): migrate update.md to SHA-based version check and comparison (Task 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated F1 test in changeset-cli.test.cjs**
- **Found during:** Task 4 (npm test gate)
- **Issue:** Removing the changeset CLI extract from update.md caused a previously-passing test `F1: workflows/update.md contains concrete extract subcommand invocation` to fail (1 new failure introduced)
- **Fix:** Updated the F1 test to assert the new SHA-based approach (LATEST_SHA variable, GitHub commits link, no cli.cjs extract)
- **Files modified:** `tests/changeset-cli.test.cjs`
- **Commit:** `78d77c43`

## Self-Check: PASSED

- `get-shit-done/bin/check-latest-version.cjs` — exists and exports correct keys
- `tests/bug-2992-check-latest-version.test.cjs` — 9/9 tests pass
- `get-shit-done/workflows/update.md` — 3 SHA grep patterns, 0 CHANGELOG_TMP refs
- `tests/changeset-cli.test.cjs` — F1 test updated and passing
- Commits `c4b7e980` and `78d77c43` verified in git log
- npm test: 185 non-ai-evals failures (matches pre-existing baseline)
