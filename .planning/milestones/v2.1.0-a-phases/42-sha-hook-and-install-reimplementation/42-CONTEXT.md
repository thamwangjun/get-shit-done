# Phase 42: SHA Hook and Install Reimplementation - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace semver version tracking with SHA-based versioning across three files: the background update-check worker (`hooks/gsd-check-update-worker.js`), the installer's VERSION write (`bin/install.js`), and the statusline stale-hooks display (`hooks/gsd-statusline.js`). Done when 7 currently-failing tests pass (5 in `semver-compare.test.cjs`, 2 in `version-detection.test.cjs`).

</domain>

<decisions>
## Implementation Decisions

### Worker async restructuring (hooks/gsd-check-update-worker.js)

- **D-01:** `isNewer(latest, installed)` uses SHA equality: `!!latest && latest.slice(0, 7) !== installed`. Defined before `writeResult` in source order (test assertion).
- **D-02:** `function writeResult(latest)` encapsulates result construction and cache write. Calls `isNewer(latest, installed)`. Stale hooks are computed before the fetch (sync, local file reads) and captured in a closure that `writeResult` reads.
- **D-03:** Replace `execFileSync('npm', ['view', ...])` with `https.get` to `https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}`. Parse JSON response, extract `.sha` as `latest`.
- **D-04:** Call `writeResult(null)` on all failure paths: network error, timeout (10s via `req.setTimeout(10000, () => req.destroy())`), non-200 HTTP status, malformed JSON. `req.destroy()` triggers the `error` event, which calls `writeResult(null)`.
- **D-05:** Worker source must contain `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template placeholders (replaced at install time to `thamwangjun/get-shit-done` / `main`).
- **D-06:** Worker must not reference `npmjs.com` or `get-shit-done-cc`/`get-shit-done-redux` as runtime lookup targets.

### Stale hook comparison

- **D-07:** Reuse `isNewer(installed, hookVersion)` for stale detection — with the new SHA `isNewer`, this means `!!installed && installed.slice(0,7) !== hookVersion` = "installed SHA differs from hook's SHA → stale". Semantics are correct. Template sentinel guard `!hookVersion.includes('{{')` is retained unchanged.
- **D-08:** Statusline (`gsd-statusline.js`) removes the `parseV()` semver dev-install divergence block entirely. Simplified: `if (cache.stale_hooks && cache.stale_hooks.length > 0)` → show `'⚠ stale hooks — run /gsd:update'`. No special-casing for dev installs.

### install.js VERSION write paths

- **D-09:** `gsdVersion` computed at module scope (before first function definition), initialized to sentinel `'no-network'`, then attempted via `execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8', timeout: 5000 }).trim()` in a try/catch. Computed once, available to all install paths.
- **D-10:** All VERSION file write locations (primary path line 8727, Codex early paths lines 8212/8282) use `gsdVersion` instead of `pkg.version`.
- **D-11:** All `{{GSD_VERSION}}` replacements in hook files (lines 7968, 8769, 8778, 8799, 9115, 9126) use `gsdVersion` instead of `pkg.version`. Hook file headers get the SHA so stale detection (hook SHA vs installed SHA) works end-to-end.
- **D-12:** `{{GSD_REPO}}` → `thamwangjun/get-shit-done` and `{{GSD_BRANCH}}` → `main` template replacements added to install.js hook processing, alongside existing `{{GSD_VERSION}}` replacement logic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source files being modified
- `hooks/gsd-check-update-worker.js` — current worker (full rewrite of bottom half)
- `hooks/gsd-statusline.js` — remove `parseV()` block (lines 403–416)
- `bin/install.js` — add `gsdVersion` at module scope, update all VERSION writes and `{{GSD_VERSION}}` replacements

### Tests defining exact required patterns (read before planning)
- `tests/semver-compare.test.cjs` — HOOK-03: `function isNewer` before `function writeResult`; `writeResult` body calls `isNewer()` within 300 chars. HOOK-04: exact URL `api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}`, `https.get`, no `npmjs.com`, no `get-shit-done-cc`.
- `tests/version-detection.test.cjs` — INST-01: `git rev-parse` in source. INST-02: `'no-network'` sentinel present; no `let gsdVersion = pkg.version`.

### Requirements
- `.planning/REQUIREMENTS.md` — HOOK-01 through HOOK-05, INST-01 through INST-04, STAT-01, STAT-02, TEST-01, TEST-02 (all pending)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsd-check-update-worker.js` stale hooks loop (lines ~50–85): stays intact, only `isNewer` function definition and bottom fetch section change
- `MANAGED_HOOKS` array: unchanged
- `cacheFile` / `projectVersionFile` / `globalVersionFile` env-var wiring: unchanged

### Established Patterns
- Worker is a plain Node.js script (no module system) — `require()` calls inline, no imports
- `execFileSync` already present at top of install.js for other uses — `gsdVersion` computation can reuse this require
- `{{TEMPLATE}}` placeholder pattern already used for `{{GSD_VERSION}}` in hook files — same mechanism for `{{GSD_REPO}}` / `{{GSD_BRANCH}}`
- Error handling pattern in worker: silent `catch(e) {}` blocks for file I/O — maintain this for https.get error handling

### Integration Points
- `bin/install.js` line 8727: primary VERSION write target (and Codex paths)
- `bin/install.js` hook content replacement loop: where `{{GSD_REPO}}` and `{{GSD_BRANCH}}` replacements must be added
- `hooks/gsd-statusline.js` lines 403–416: parseV block to remove
- GitHub Commits API response: `{ sha: "<40-char SHA>", ... }` — extract `.sha`, pass to `writeResult`

</code_context>

<specifics>
## Specific Ideas

- `writeResult(latest)` function must appear within 300 chars of its start and call `isNewer()` — keep it compact (test assertion boundary)
- `isNewer(latest, installed)` must appear in source BEFORE `function writeResult` — declaration order matters (test assertion)
- `req.setTimeout(10000, () => req.destroy())` — `destroy()` triggers `error` event which already calls `writeResult(null)`. No duplicate call needed.
- GitHub Commits API response parsing: collect chunks in `data += chunk`, then `JSON.parse(data).sha` in `response.on('end', ...)`. Guard with try/catch for malformed JSON.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-SHA Hook and Install Reimplementation*
*Context gathered: 2026-05-25*
