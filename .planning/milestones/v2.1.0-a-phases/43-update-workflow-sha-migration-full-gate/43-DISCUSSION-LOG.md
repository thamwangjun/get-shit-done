# Phase 43: Update Workflow SHA Migration + Full Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 43-update-workflow-sha-migration-full-gate
**Areas discussed:** Test injection pattern, Changelog display, Dev-install warning

---

## Test Injection Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Injectable `{ request }` fn | Keep same pattern as `{ spawn }` today — pass a request option to `checkLatestVersion()`. Tests mock the HTTP call the same way they mock npm today. `PACKAGE_NAME` export goes away; a `GITHUB_API_URL` constant replaces it. `bug-2992` test gets updated assertion targets but retains test-injection philosophy. | ✓ |
| Static source assertions only | Like `version-detection.test.cjs` — load source as string, assert it contains `api.github.com/repos/thamwangjun`. No HTTP mock needed. Simpler but less behavior coverage. | |
| Real HTTPS with nock/intercept | Use nock or similar to intercept `https.get` calls. More realistic but adds a test dependency not currently used in the suite. | |

**User's choice:** Injectable `{ request }` fn (recommended)

### CHECK_REASON rename

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to `FAIL_FETCH_FAILED` + `FAIL_INVALID_SHA` | Accurate names after npm removal. `bug-2992` test enum assertion updates. | ✓ |
| Keep same names (`FAIL_NPM_FAILED`, `FAIL_INVALID_OUTPUT`) | Minimize churn. Names are misleading but functionally equivalent. | |
| You decide | Use whatever names make the code clearest. | |

**User's choice:** Rename (clean break from npm naming)

---

## Changelog Display

| Option | Description | Selected |
|--------|-------------|----------|
| Link to GitHub commits page | Display: `[View changes](https://github.com/thamwangjun/get-shit-done/commits/main)`. Minimal, accurate. No extra API calls. | ✓ |
| Show last N commit messages from API response | Surface the last 5-10 commits inline. More informative but adds parsing/display logic and would need a second API call. | |
| Skip changelog section entirely | Drop the 'What's New' block entirely. Just show SHA comparison and confirm. | |

**User's choice:** Link to GitHub commits page (recommended)

### Confirmation block format

| Option | Description | Selected |
|--------|-------------|----------|
| GSD Update Available + SHA comparison + link | `## GSD Update Available\n\n**Installed:** {sha}\n**Latest:** {sha}\n\n[View changes](...)\n\n⚠️ Note: clean install...` | ✓ |
| Keep existing block structure, replace version strings with SHAs | Keep header + warning block. Replace `v{X.Y.Z}` with SHA strings. Replace changelog preview with commits link. | |
| You decide | Use whatever layout makes sense. | |

**User's choice:** Clean new block format (recommended)

---

## Dev-Install Warning

| Option | Description | Selected |
|--------|-------------|----------|
| Binary: match = up-to-date, any mismatch = update available | SHA comparison is equality only. Dev-install branch removed entirely. `no-network` sentinel triggers update available naturally. | ✓ |
| Detect dev install via `no-network` sentinel | If VERSION = `no-network`, show dev install message instead of update flow. | |
| Keep dev-install warning, trigger on `no-network` sentinel | Full warning block preserved, triggered by `no-network`. | |

**User's choice:** Binary comparison — remove dev-install branch entirely (recommended)

### Up-to-date display

| Option | Description | Selected |
|--------|-------------|----------|
| `## GSD Update\n\n**Installed:** {sha}\n**Latest:** {sha}\n\nYou're already on the latest version.` | Direct SHA replacement of semver strings in the existing up-to-date block. | ✓ |
| You decide | Use whatever makes sense. | |

**User's choice:** SHA-direct replacement of existing block format

---

## Claude's Discretion

- Error message wording for `FAIL_FETCH_FAILED` and `FAIL_INVALID_SHA` failure cases
- Manual-update instruction text (update from npm command to GitHub install command)
- Whether the `--json` result shape uses `.sha` or retains `.version` as field name

## Deferred Ideas

None — discussion stayed within phase scope.
