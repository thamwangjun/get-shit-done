# Phase 43: Update Workflow SHA Migration + Full Gate - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate `get-shit-done/bin/check-latest-version.cjs` and `get-shit-done/workflows/update.md` from npm registry / semver comparison to GitHub Commits API / SHA comparison. Update `tests/bug-2992-check-latest-version.test.cjs` to match the new SHA-based behavior. Full `npm test` gate: 0 regressions beyond the 2 pre-existing `ai-evals.test.cjs` failures.

</domain>

<decisions>
## Implementation Decisions

### Test Injection Pattern (check-latest-version.cjs)

- **D-01:** Keep the injectable function pattern — pass `{ request }` option to `checkLatestVersion()`, same philosophy as `{ spawn }` today. Tests mock the GitHub HTTPS call via the injection point.
- **D-02:** `PACKAGE_NAME` export is removed. Replace with a `GITHUB_API_URL` constant pointing to `https://api.github.com/repos/thamwangjun/get-shit-done/commits/main`. Export it for test assertions.
- **D-03:** `CHECK_REASON` enum renames: `FAIL_NPM_FAILED` → `FAIL_FETCH_FAILED`, `FAIL_INVALID_OUTPUT` → `FAIL_INVALID_SHA`. `OK` stays. The `bug-2992` test's enum key assertion updates to `['FAIL_FETCH_FAILED', 'FAIL_INVALID_SHA', 'OK']`.

### Changelog Display (update.md)

- **D-04:** Remove the `show_changes_and_confirm` step's changelog extraction block entirely (the `changeset/cli.cjs extract --from --to` call and `CHANGELOG_TMP` logic).
- **D-05:** Replace the changelog preview with a link to GitHub commits: `[View changes](https://github.com/thamwangjun/get-shit-done/commits/main)`.
- **D-06:** Confirmation block format:
  ```
  ## GSD Update Available

  **Installed:** {installed_sha}
  **Latest:** {latest_sha}

  [View changes](https://github.com/thamwangjun/get-shit-done/commits/main)

  ⚠️  Note: The installer performs a clean install of GSD folders:
  - `commands/gsd/` will be wiped and replaced
  - `get-shit-done/` will be wiped and replaced
  - `agents/gsd-*` files will be replaced

  Update? Yes / No
  ```

### Dev-Install Warning (update.md)

- **D-07:** SHA comparison is binary — equality means up-to-date, any mismatch means update available. No ordinal "installed > latest" concept.
- **D-08:** The `compare_versions` dev-install branch (`installed > latest` → dev install warning) is removed entirely.
- **D-09:** Up-to-date display:
  ```
  ## GSD Update

  **Installed:** {sha}
  **Latest:** {sha}

  You're already on the latest version.
  ```
- **D-10:** If `VERSION` contains `no-network`, `isNewer('some-real-sha', 'no-network')` returns `true` (SHA mismatch) → update available path runs normally. No special-case needed.

### Version Detection in update.md (`get_installed_version` step)

- **D-11:** The `grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+'` semver validity check on the VERSION file must be replaced with a hex SHA or sentinel check (e.g., `grep -Eq '^[0-9a-f]{7}|no-network'`). A semver-format VERSION file now indicates a stale install from before the SHA migration.

### Claude's Discretion

- Error message wording for `FAIL_FETCH_FAILED` and `FAIL_INVALID_SHA` cases — match existing style of `check-latest-version.cjs` error returns.
- Manual-update instruction text in the failure path — update from npm command to GitHub install command.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Active requirements for Phase 43: UPD-01, UPD-02, TEST-03, GATE-01. Out of Scope table (no SHA range for changeset CLI).
- `.planning/ROADMAP.md` §Phase 43 — Success criteria and depends-on chain.

### Target Source Files
- `get-shit-done/bin/check-latest-version.cjs` — Full file to be migrated from npm/semver to GitHub API/SHA.
- `get-shit-done/workflows/update.md` — Steps `check_latest_version`, `compare_versions`, `show_changes_and_confirm` to be updated.
- `tests/bug-2992-check-latest-version.test.cjs` — Test file to be updated for SHA-based assertions (TEST-03).

### Existing Test Patterns (precedents to follow)
- `tests/semver-compare.test.cjs` — Pattern for testing SHA worker via static source assertions + mirrored function. Reference for HOOK-03/HOOK-04 assertion style.
- `tests/version-detection.test.cjs` — Pattern for static source analysis tests (INST-01/INST-02). No live execution needed.

### Worker Implementation (Phase 42 precedent)
- `hooks/gsd-check-update-worker.js` — Already uses SHA `isNewer()` + GitHub Commits API. The `check-latest-version.cjs` migration mirrors this API endpoint and comparison logic.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/gsd-check-update-worker.js` — `isNewer(latest, installed)` function: `!!latest && latest.slice(0, 7) !== installed`. Mirror this exact comparison in `check-latest-version.cjs`.
- `get-shit-done/bin/lib/shell-command-projection.cjs` — `execNpm` seam used today by `check-latest-version.cjs`. After migration, `execNpm` import is removed; replaced with `https.get` call behind the injectable `{ request }` option.

### Established Patterns
- **Injectable spawn/request pattern:** `checkLatestVersion(opts = {})` with `opts.spawn || defaultSpawn`. Maintain the same option-bag approach for the `request` function.
- **CHECK_REASON frozen enum:** `Object.freeze({ ... })` pattern must be preserved for the renamed keys.
- **`--json` CLI flag:** `main()` function outputs structured JSON when `--json` is passed. This contract is used by `update.md`'s `check_latest_version` step — keep it intact, update the result shape to carry `sha` instead of `version`.
- **`jq` parsing in update.md:** The workflow parses `LATEST_RESULT` via `jq`. After migration, `.version` field → `.sha` (or keep `.version` as a generic field name — planner's call).

### Integration Points
- `update.md` `check_latest_version` step: calls `node "$GSD_DIR/get-shit-done/bin/check-latest-version.cjs" --json`. This invocation stays the same; only the script internals and result shape change.
- `update.md` `get_installed_version` step: semver regex `grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+'` on VERSION file must become a SHA/sentinel regex.
- `update.md` shared cache clear step (line ~617): references the update-check hook cache — stays unchanged.

</code_context>

<specifics>
## Specific Ideas

- The `GITHUB_API_URL` constant should be the full endpoint string: `https://api.github.com/repos/thamwangjun/get-shit-done/commits/main`. Export it so tests can assert against it (replaces the `PACKAGE_NAME` export assertion in `bug-2992` test).
- Result shape from `checkLatestVersion()` on success: `{ ok: true, sha: '...' (7-char), reason: CHECK_REASON.OK }`. The `update.md` workflow parses `.sha` via jq (or the planner may keep `.version` as the field name — planner's call).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 43-update-workflow-sha-migration-full-gate*
*Context gathered: 2026-05-26*
