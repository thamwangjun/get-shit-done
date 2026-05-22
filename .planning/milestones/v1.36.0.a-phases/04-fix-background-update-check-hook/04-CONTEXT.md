# Phase 4: Fix Background Update-Check Hook - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix `gsd-check-update-worker.js` so the background update-check runs without crashing and compares SHA versions correctly against the fork's GitHub repo. Also fix the `isDevInstall` detection in `gsd-statusline.js` which uses semver parsing that breaks once both `cache.installed` and `cache.latest` are SHAs.

</domain>

<decisions>
## Implementation Decisions

### HOOK-03: Define isNewer with SHA semantics
- **D-01:** Keep the `update_available: latest && isNewer(latest, installed)` call unchanged. Add a `isNewer` function definition in the worker that implements SHA equality: `function isNewer(latest, installed) { return !!latest && latest.slice(0, 7) !== installed; }`. The function name is retained for interface stability; the implementation changes from semver to SHA comparison.

### HOOK-04: Replace npm registry fetch with GitHub API
- **D-02:** Remove `execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], ...)`. Fetch the HEAD SHA from `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` using Node's built-in `https` module (no external dependencies). Parse `response.sha` from the JSON.

### HOOK-01 / HOOK-02: SHA comparison
- **D-03:** The `isNewer` function (D-01) performs the truncation — `latest.slice(0, 7) !== installed` — so the result object line needs no change. The `latest` value passed in is the full 40-char SHA from the API; `isNewer` truncates internally.
- **D-04:** "GSD is up to date" (HOOK-01) means no false `⬆ /gsd-update` notification appears — no explicit "up to date" text is added to the statusline. Consistent with existing UX.

### Statusline isDevInstall fix (in-scope for Phase 4)
- **D-05:** Fix the `isDevInstall` check in `gsd-statusline.js` (lines 216–226). After Phase 4, `cache.installed` and `cache.latest` will be 7-char SHAs — the existing `parseV()` semver split silently returns `NaN` values. Replace the check with: since SHA-based versioning has no ordered "ahead/behind" without git history, drop the dev-install heuristic entirely. The stale-hooks warning (the outer `if`) remains; only the `isDevInstall` branch that would suppress the warning in favor of "re-run installer to sync hooks" is removed or simplified. Acceptable simplification: always show the "stale hooks — run /gsd-update" variant when stale hooks are detected and the update is not a dev install that's trivially detectable.

### Error / fallback behavior
- **D-06:** When the GitHub API is unavailable (network error, rate limit, timeout), keep `update_available: false` — silent failure, no false positive notifications. `latest` field in cache remains `null` or `'unknown'`. This is consistent with existing behavior.

### Claude's Discretion
- GitHub API fetch implementation: whether to use `https.get()` with callback or a promisified wrapper — planner decides based on the existing Node.js version constraints (`>=20`).
- Timeout value for the GitHub API call (current npm call uses 10000ms — reasonable to keep).
- Whether to cache `remoteSha` in full or truncated form in `result.latest` — planner decides (truncated is simpler, matches installed format).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files under fix
- `hooks/gsd-check-update-worker.js` — the worker being rewritten (lines 76–95 are the npm/isNewer section to replace)
- `hooks/gsd-statusline.js` — isDevInstall check to fix (lines 216–226, the `parseV` semver block)

### Spawner and context
- `hooks/gsd-check-update.js` — spawns the worker via `spawn(process.execPath, [workerFile])` with env vars; no changes expected here

### Requirements
- `.planning/REQUIREMENTS.md` — HOOK-01, HOOK-02, HOOK-03, HOOK-04 are in scope for Phase 4

### Installer reference (for context, not to modify in Phase 4)
- `bin/install.js` lines 58–72 — shows how the installer fetches the SHA via `curl` and writes `sha.slice(0,7)` to VERSION; the worker should mirror this logic using Node `https` instead of curl

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/gsd-check-update-worker.js` lines 21–31: VERSION file reading logic — already correct, no changes needed
- `hooks/gsd-check-update-worker.js` lines 37–74: stale-hook detection loop — already correct, no changes needed
- `hooks/gsd-check-update-worker.js` lines 85–95: result JSON structure — keep `update_available`, `installed`, `latest`, `checked`, `stale_hooks` fields; downstream statusline expects these

### Established Patterns
- install.js uses `curl` + `execSync` for GitHub API; the worker should use Node's `https` module instead to avoid a curl dependency in the background worker
- Both files use `try/catch` with silent failure for all I/O and network ops — maintain this pattern
- GitHub API URL: `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` (same endpoint install.js uses)

### Integration Points
- `gsd-statusline.js` reads `cache.update_available` (boolean) and `cache.stale_hooks` (array | undefined) from `~/.cache/gsd/gsd-update-check.json`
- The `isDevInstall` branch in statusline (lines 217–226) reads `cache.installed` and `cache.latest` — after Phase 4, these will be 7-char SHAs

</code_context>

<specifics>
## Specific Ideas

- The GitHub API endpoint `/repos/thamwangjun/get-shit-done/commits/thamw-main` returns a JSON object with a top-level `sha` field (40-char hex). Truncate to 7 chars for comparison with `installed`.
- The `https` module call needs a `User-Agent` header — GitHub API requires it (returns 403 without). Use `User-Agent: gsd-check-update-worker` to match the pattern from install.js.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-fix-background-update-check-hook*
*Context gathered: 2026-04-17*
