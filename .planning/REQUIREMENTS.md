# Requirements: GSD — SHA Versioning Reimplementation (v2.1.0-a)

**Defined:** 2026-05-25
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships

## v1 Requirements

Requirements for v2.1.0-a. Each maps to roadmap phases.

### Background Hook (Update Check Worker)

- [x] **HOOK-01**: `hooks/gsd-check-update-worker.js` contains SHA-based `isNewer()` function using `latest.slice(0, 7) !== installed` comparison (not semver)
- [x] **HOOK-02**: Worker fetches the latest SHA via `https.get` to `api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}`
- [x] **HOOK-03**: Worker contains `function writeResult()` that calls `isNewer()` and writes the result cache file
- [x] **HOOK-04**: Worker source contains `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template placeholders (not hardcoded values)
- [x] **HOOK-05**: Worker does not contact `npmjs.com` and does not reference `get-shit-done-cc` or `get-shit-done-redux` as a runtime lookup target

### Installation

- [x] **INST-01**: `bin/install.js` uses `git rev-parse --short=7 HEAD` to obtain the 7-char SHA for the VERSION file
- [x] **INST-02**: `bin/install.js` uses `'no-network'` as the initial/fallback `gsdVersion` value when git is unavailable (not `pkg.version`)
- [x] **INST-03**: `bin/install.js` replaces `{{GSD_REPO}}` with `thamwangjun/get-shit-done` and `{{GSD_BRANCH}}` with `main` in hook files during installation
- [x] **INST-04**: `{{GSD_VERSION}}` in hook file headers is populated with the SHA (not `pkg.version`) at install time

### Statusline

- [x] **STAT-01**: `hooks/gsd-statusline.js` removes the semver `parseV()` dev-install detection block
- [x] **STAT-02**: Any stale-hooks condition (hook SHA ≠ installed SHA) displays "stale hooks — run /gsd:update" without the semver-based "dev install" divergence path

### Update Workflow

- [ ] **UPD-01**: `get-shit-done/bin/check-latest-version.cjs` fetches the latest SHA from the GitHub Commits API (`api.github.com/repos/thamwangjun/get-shit-done/commits/main`) instead of npm registry
- [ ] **UPD-02**: `get-shit-done/workflows/update.md` `check_latest_version` step handles SHA-based comparison and simplified changelog display (no semver `--from`/`--to` changelog extraction)

### Tests

- [x] **TEST-01**: `tests/semver-compare.test.cjs` all 17/17 subtests pass (currently 5 failing: HOOK-03 writeResult, HOOK-04 GitHub API)
- [x] **TEST-02**: `tests/version-detection.test.cjs` all 4/4 subtests pass (currently 2 failing: INST-01 git rev-parse, INST-02 no-network sentinel)
- [ ] **TEST-03**: `tests/bug-2992-check-latest-version.test.cjs` updated for SHA-based behavior and passing
- [ ] **GATE-01**: Full `npm test` suite passes with 0 regressions beyond pre-existing 2 failures in `ai-evals.test.cjs`

## Out of Scope

| Feature | Reason |
|---------|--------|
| Updating `get-shit-done/scripts/changeset/cli.cjs` to support SHA ranges | Changelog extraction for SHA ranges is a larger standalone change; update workflow simplified to not depend on it |
| Changing `package.json` version field from semver to SHA | Package version stays as semver for npm publishing; only the installed VERSION file switches to SHA |
| Adding GitHub API auth tokens | Rate limit (60 req/hr unauthenticated) is sufficient for an occasional update check |
| Retroactively updating hook version headers on installed hooks | Stale hooks warning will appear on first install after this change — expected and correct |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOOK-01 | Phase 42 | Complete |
| HOOK-02 | Phase 42 | Complete |
| HOOK-03 | Phase 42 | Complete |
| HOOK-04 | Phase 42 | Complete |
| HOOK-05 | Phase 42 | Complete |
| INST-01 | Phase 42 | Complete |
| INST-02 | Phase 42 | Complete |
| INST-03 | Phase 42 | Complete |
| INST-04 | Phase 42 | Complete |
| STAT-01 | Phase 42 | Complete |
| STAT-02 | Phase 42 | Complete |
| UPD-01 | Phase 43 | Pending |
| UPD-02 | Phase 43 | Pending |
| TEST-01 | Phase 42 | Complete |
| TEST-02 | Phase 42 | Complete |
| TEST-03 | Phase 43 | Pending |
| GATE-01 | Phase 43 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after initial definition*
