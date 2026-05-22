# Phase 4: Fix Background Update-Check Hook - Research

**Researched:** 2026-04-17
**Domain:** Node.js hook scripting — GitHub API https fetch, SHA-based version comparison, statusline semver removal
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (HOOK-03):** Keep the `update_available: latest && isNewer(latest, installed)` call unchanged. Add an `isNewer` function definition in the worker that implements SHA equality: `function isNewer(latest, installed) { return !!latest && latest.slice(0, 7) !== installed; }`. The function name is retained for interface stability; the implementation changes from semver to SHA comparison.

**D-02 (HOOK-04):** Remove `execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], ...)`. Fetch the HEAD SHA from `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` using Node's built-in `https` module (no external dependencies). Parse `response.sha` from the JSON.

**D-03 (HOOK-01/02):** The `isNewer` function (D-01) performs the truncation — `latest.slice(0, 7) !== installed` — so the result object line needs no change. The `latest` value passed in is the full 40-char SHA from the API; `isNewer` truncates internally.

**D-04 (HOOK-01):** "GSD is up to date" means no false `⬆ /gsd-update` notification appears — no explicit "up to date" text is added to the statusline. Consistent with existing UX.

**D-05 (statusline isDevInstall):** Fix the `isDevInstall` check in `gsd-statusline.js` (lines 216–226). Drop the `isDevInstall` branch that would suppress the stale-hooks warning in favour of "re-run installer to sync hooks". Since SHA-based versioning has no ordered ahead/behind semantics without git history, always show the "stale hooks — run /gsd-update" variant when stale hooks are detected. The outer `if (cache.stale_hooks && cache.stale_hooks.length > 0)` remains; only the inner `isDevInstall` conditional and the associated `parseV` semver logic are removed.

**D-06 (fallback):** When the GitHub API is unavailable (network error, rate limit, timeout), keep `update_available: false` — silent failure, no false positive notifications. `latest` field in cache remains `null` or `'unknown'`.

### Claude's Discretion

- GitHub API fetch: whether to use `https.get()` with callback or a promisified wrapper — planner decides based on Node >=20 constraint.
- Timeout value for the GitHub API call (current npm call uses 10000ms — reasonable to keep).
- Whether to cache `remoteSha` in full or truncated form in `result.latest` — planner decides (truncated is simpler, matches installed format).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOK-01 | User sees no false "update available" notification when installed SHA matches remote HEAD SHA | D-01 defines `isNewer` with SHA equality; SHA mismatch is the only trigger for `update_available: true` |
| HOOK-02 | User sees an update notification only when fork's remote HEAD SHA (thamw-main) differs from installed SHA | D-01 + D-02 together replace npm comparison with GitHub API SHA fetch + `isNewer` equality check |
| HOOK-03 | Worker (`gsd-check-update-worker.js`) runs without crashing — no `ReferenceError` from undefined `isNewer` | `isNewer` is currently called (line 86) but never defined in the worker; D-01 adds the definition |
| HOOK-04 | Worker fetches latest version from fork's GitHub repo, not upstream npm registry | D-02 replaces `execFileSync('npm', ...)` with `https.get()` to the GitHub Commits API |

</phase_requirements>

---

## Summary

Phase 4 fixes two bugs in `hooks/gsd-check-update-worker.js` and one related regression in `hooks/gsd-statusline.js`.

**Bug 1 (HOOK-03 — crash):** `isNewer` is called at line 86 of the worker but is never defined anywhere in the file. The function lived inside a `node -e '...'` template string before the worker was extracted to its own file. The fix is to add the function definition with SHA semantics (D-01) before line 85.

**Bug 2 (HOOK-04 + HOOK-01/02 — wrong version source):** The worker fetches from the npm registry (`get-shit-done-cc`), which is the upstream package — not the fork. The fork publishes nothing to npm. The fix replaces the `execFileSync('npm', ...)` block with a Node built-in `https.get()` call to `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main`. The response SHA is truncated to 7 chars for comparison with `installed`.

**Bug 3 (statusline regression — D-05):** Once the worker writes 7-char SHAs into `cache.installed` and `cache.latest`, the `parseV` semver split in `gsd-statusline.js` lines 216–226 silently returns `NaN` for all three version segments, making the `isDevInstall` heuristic meaningless. Since SHA-based versioning has no numeric ordering, the whole `isDevInstall` branch is removed — stale hooks always show the standard "stale hooks — run /gsd-update" warning.

**Primary recommendation:** Make the three targeted edits (define `isNewer`, replace npm fetch, remove `isDevInstall` branch) and update `tests/semver-compare.test.cjs` to mirror the new SHA-equality semantics.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version detection | Background worker (`hooks/gsd-check-update-worker.js`) | — | Detached background child process; no UI involvement |
| Remote SHA fetch | Background worker | — | Single outbound https call; result written to shared cache file |
| Update notification display | Frontend hook (`hooks/gsd-statusline.js`) | — | Reads cache file and appends ANSI string to statusline output |
| Stale-hook detection | Background worker | — | Hook version headers scanned in the same worker pass |
| Cache I/O | Background worker writes; statusline reads | — | Shared `~/.cache/gsd/gsd-update-check.json` decouples writer from reader |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `https` | built-in (Node >=20) | Make HTTPS requests without external deps | No npm install; ships with every Node runtime; already used idiomatically throughout the codebase |
| Node.js built-in `fs` | built-in | Read VERSION file, write cache JSON | Already present in the worker |

[VERIFIED: codebase grep — install.js uses execSync+curl; worker already requires fs, path, child_process]

### Supporting (test layer only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node built-in `node:test` | built-in | Test runner | Existing project convention — no external test framework |
| Node built-in `node:assert/strict` | built-in | Assertions | Same convention as all other test files |

[VERIFIED: codebase — all test files use `require('node:test')` and `require('node:assert/strict')`]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `https.get()` callback | `https` promisified with `util.promisify` or `async/await` via `http.request` | Callbacks are synchronous-feeling in short scripts; promisified is cleaner but requires wrapping `http.request` manually (Node >=20 has `fetch` as well) |
| `https.get()` | `globalThis.fetch` (Node >=18 global) | `fetch` is cleaner but is marked experimental until Node 21; project targets >=20 so it works — however existing hooks never use it, so `https.get()` is consistent with existing patterns |

**Planner note (Claude's Discretion):** `https.get()` with a callback is recommended for consistency with the existing codebase style. All hooks use `try/catch` + callback patterns, not async/await. The install.js reference uses `curl` + `execSync` — the worker equivalent is `https.get()` with a callback accumulator.

---

## Architecture Patterns

### System Architecture Diagram

```
SessionStart hook fires
        │
        ▼
gsd-check-update.js (spawner)
  sets env vars: GSD_CACHE_FILE, GSD_PROJECT_VERSION_FILE, GSD_GLOBAL_VERSION_FILE
  spawns gsd-check-update-worker.js as detached child
        │
        ▼
gsd-check-update-worker.js (background worker — THIS IS WHAT WE FIX)
  ┌─────────────────────────────────────────┐
  │ 1. Read VERSION file → installed (7-char SHA or 'unknown')
  │ 2. Scan hooks/ for stale version headers → staleHooks[]
  │ 3. [FIXED] https.get() → GitHub API → remoteSha (40-char)
  │            truncate to 7 chars → latest
  │ 4. [FIXED] isNewer(latest, installed) → boolean
  │            (SHA equality: latest.slice(0,7) !== installed)
  │ 5. Write result JSON → ~/.cache/gsd/gsd-update-check.json
  └─────────────────────────────────────────┘
        │ (worker exits; detached, no wait)
        ▼
Next session / statusline invocation
gsd-statusline.js reads ~/.cache/gsd/gsd-update-check.json
  ┌─────────────────────────────────────────┐
  │ cache.update_available → show "⬆ /gsd-update" or nothing
  │ cache.stale_hooks → show "⚠ stale hooks" warning
  │ [FIXED] isDevInstall branch REMOVED — always show stale warning
  └─────────────────────────────────────────┘
        │
        ▼
ANSI string written to stdout → Claude Code statusline
```

### Recommended Edit Structure

Three discrete, independently verifiable edits:

```
Edit 1: hooks/gsd-check-update-worker.js
  - Remove line 14: const { execFileSync } = require('child_process');
    (only used for npm call; fs and path remain)
  - Add https require at top
  - Replace lines 76-83 (execFileSync npm block) with https.get() fetch
  - Add isNewer() function definition before line 85

Edit 2: hooks/gsd-statusline.js
  - Replace lines 216-226 (isDevInstall IIFE + conditional) with
    the simple stale-hooks display branch only

Edit 3: tests/semver-compare.test.cjs
  - Rename/repurpose to test SHA equality semantics of the new isNewer
  - OR: add a new test file tests/sha-compare.test.cjs
    (see Anti-Patterns section for guidance)
```

### Pattern 1: https.get() with accumulated response body

The install.js reference uses `curl` + `execSync`. The worker equivalent using Node's https module:

```javascript
// Source: Node.js built-in https module — standard streaming pattern [VERIFIED: codebase style]
const https = require('https');

let latest = null;
try {
  latest = await new Promise((resolve, reject) => {
    const req = https.get(
      'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main',
      {
        headers: {
          'User-Agent': 'gsd-check-update-worker',
          'Accept': 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const sha = JSON.parse(body).sha;
            if (sha && /^[0-9a-f]{40}$/.test(sha)) {
              resolve(sha.slice(0, 7));
            } else {
              resolve(null);
            }
          } catch (e) { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
} catch (e) {}
```

**Important:** The worker runs synchronously top-to-bottom. If we wrap the fetch in a Promise, the script must use top-level `await` (requires `--input-type=module`) OR the worker must restructure so the cache-write happens inside the callback. The **simplest pattern** consistent with the existing synchronous style is callback-based with the cache-write moved inside the response handler. See Pattern 2.

### Pattern 2: Callback-based (no async/await, matches existing style)

```javascript
// [VERIFIED: consistent with existing worker style — no async/await anywhere in worker]
const https = require('https');

let latest = null;

function writeResult() {
  const result = {
    update_available: latest && isNewer(latest, installed),
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000),
    stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
  };
  if (cacheFile) {
    try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
  }
}

function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

try {
  const req = https.get(
    'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main',
    {
      headers: {
        'User-Agent': 'gsd-check-update-worker',
        'Accept': 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const sha = JSON.parse(body).sha;
          if (sha && /^[0-9a-f]{40}$/.test(sha)) {
            latest = sha.slice(0, 7);
          }
        } catch (e) {}
        writeResult();
      });
    }
  );
  req.on('error', () => writeResult());
  req.on('timeout', () => { req.destroy(); writeResult(); });
} catch (e) {
  writeResult();
}
```

**Planner recommendation:** Use Pattern 2 (callback-based). It avoids restructuring the module to use async/await and matches the existing style perfectly. `writeResult()` replaces the current synchronous block at lines 85–95.

### Pattern 3: isNewer with SHA semantics (D-01)

```javascript
// [VERIFIED: from CONTEXT.md D-01 — user-locked decision]
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
```

This function is called at line 86: `update_available: latest && isNewer(latest, installed)`.
The double-guard (`latest &&` before calling, plus `!!latest` inside) is redundant but harmless. The result is always falsy when `latest` is null/undefined/'unknown'.

### Pattern 4: Statusline isDevInstall removal (D-05)

Current code (lines 213–229 of gsd-statusline.js):
```javascript
if (cache.stale_hooks && cache.stale_hooks.length > 0) {
  const isDevInstall = (() => {
    if (!cache.installed || !cache.latest || cache.latest === 'unknown') return false;
    const parseV = v => v.replace(/^v/, '').split('.').map(Number);
    const [ai, bi, ci] = parseV(cache.installed);
    const [an, bn, cn] = parseV(cache.latest);
    return ai > an || (ai === an && bi > bn) || (ai === an && bi === bn && ci > cn);
  })();
  if (isDevInstall) {
    gsdUpdate += '\x1b[33m⚠ dev install — re-run installer to sync hooks\x1b[0m │ ';
  } else {
    gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ ';
  }
}
```

Replace with (D-05):
```javascript
if (cache.stale_hooks && cache.stale_hooks.length > 0) {
  gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ ';
}
```

### Anti-Patterns to Avoid

- **Rewriting the worker as an async module:** Adding `type: "module"` or top-level await would require changing the spawn invocation in `gsd-check-update.js` and touching CI — out of scope. Use callback pattern.
- **Storing the full 40-char SHA in `result.latest`:** The installed version is a 7-char SHA. Storing 40-chars in `latest` while comparing with 7-chars forces callers to slice — inconsistent. Store the truncated 7-char form in `result.latest` (Claude's Discretion recommendation: truncate before storing).
- **Calling `https.request()` instead of `https.get()`:** `https.get()` is the correct idiom for GET requests without a body; `request()` requires manually calling `req.end()`. Using `get()` avoids this footgun.
- **Leaving the `const { execFileSync } = require('child_process');` line:** After removing the npm call, `execFileSync` is unused. Remove the destructured import to avoid lint warnings. The `child_process` module itself is not needed anywhere else in the worker.

---

## Solved Problems

| Problem | Build Nothing — Use Instead | Why |
|---------|-----------------------------|-----|
| Making HTTPS requests in Node hook | `require('https')` built-in | No npm install; no dependency management; already the pattern used by install.js via curl |
| Fetching latest commit SHA | GitHub Commits API `/repos/:owner/:repo/commits/:branch` | Returns full 40-char SHA in `response.sha`; same endpoint already used by install.js |
| SHA regex validation | `/^[0-9a-f]{40}$/.test(sha)` | Already present in install.js lines 68–70 — copy the pattern |

**Key insight:** The installer (install.js lines 58–73) already shows the exact fetch-and-truncate pattern. The worker should mirror it using `https` instead of `curl`. No new logic needs to be invented.

---

## Common Pitfalls

### Pitfall 1: Race between the cache write and statusline read

**What goes wrong:** The worker is detached and runs asynchronously. If the callback-based `writeResult()` is accidentally placed outside the response handler (e.g., after the `https.get()` call synchronously), it executes before the response arrives and writes `latest: 'unknown'` every time.
**Root cause:** Misunderstanding that `https.get()` callback is async — the synchronous code after the call runs before any network response.
**Prevention:** Place `writeResult()` exclusively inside `res.on('end', ...)`, `req.on('error', ...)`, and `req.on('timeout', ...)`. Never call it after the `https.get()` block synchronously.
**Warning signs:** Cache file always shows `latest: 'unknown'` even when network is available.

### Pitfall 2: Forgetting the User-Agent header

**What goes wrong:** GitHub API returns HTTP 403 with `{"message":"Must provide User-Agent"}` when the `User-Agent` header is absent.
**Root cause:** GitHub API policy — unauthenticated requests require a User-Agent.
**Prevention:** Include `'User-Agent': 'gsd-check-update-worker'` in the request headers (see Specific Ideas in CONTEXT.md).
**Warning signs:** `res.statusCode` is 403; JSON body contains `{"message":"Must provide User-Agent"}` — the `sha` field is absent, so the regex check returns `null` silently.

### Pitfall 3: Timeout handling with https.get()

**What goes wrong:** `https.get()` accepts a `timeout` option in milliseconds but it only fires a `timeout` event — it does NOT automatically abort the request. If you add `timeout: 10000` without a `req.on('timeout', ...)` handler, the request hangs indefinitely.
**Root cause:** Node.js `http`/`https` timeout option is advisory, not destructive.
**Prevention:** Always pair `timeout` option with `req.on('timeout', () => { req.destroy(); writeResult(); })` handler. [VERIFIED: Node.js docs behavior — ASSUMED exact option name, cross-verify with Node 20 docs]
**Warning signs:** Worker process hangs; background child never exits; Claude Code session startup is slow.

### Pitfall 4: semver-compare test file describes the old semantics

**What goes wrong:** `tests/semver-compare.test.cjs` documents the semver comparison logic. After this phase, that logic no longer exists. If the file is left unchanged, it creates misleading documentation and may fail if it tries to import or mirror the updated `isNewer`.
**Root cause:** The test mirrors the old implementation — per the comment at the top of the file, it's an intentional duplicate. The duplicate must be updated to match the new implementation.
**Prevention:** Update `tests/semver-compare.test.cjs` to test the new SHA-equality `isNewer` semantics (equal SHAs → false, different SHAs → true, null/unknown → false). Rename the describe block to `isNewer (SHA equality)`.

### Pitfall 5: isDevInstall removal breaks an existing test assertion

**What goes wrong:** If `tests/gsd-statusline.test.cjs` has any test case that asserts the isDevInstall branch output ("re-run installer to sync hooks"), removing the branch causes the test to fail.
**Root cause:** The statusline test file (`tests/gsd-statusline.test.cjs`) only tests `parseStateMd`, `formatGsdState`, and `readGsdState` helpers — it does NOT test the `runStatusline` function or the cache-reading gsdUpdate logic. The isDevInstall branch is inside `runStatusline` which reads stdin and is not exported. [VERIFIED: gsd-statusline.test.cjs — confirmed by reading the test file]
**Prevention:** No action needed for existing tests. The isDevInstall removal will not break any current test.

---

## Code Examples

### GitHub Commits API response shape

```json
{
  "sha": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "commit": { "message": "...", ... },
  "author": { ... }
}
```

Only `sha` is needed. [CITED: https://docs.github.com/en/rest/commits/commits#get-a-commit — ASSUMED exact current shape is stable; cross-verified against install.js which parses `.sha`]

### Install.js reference (the pattern to mirror)

From `bin/install.js` lines 58–73 [VERIFIED: read directly]:
```javascript
const shaJson = execSync(
  'curl -sS -H "User-Agent: gsd-install" -H "Accept: application/vnd.github.v3+json" ' +
  '"https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main"',
  { encoding: 'utf8', timeout: 15000, windowsHide: true }
);
const sha = JSON.parse(shaJson).sha;
if (sha && /^[0-9a-f]{40}$/.test(sha)) {
  gsdVersion = sha.slice(0, 7);
}
```

The worker mirrors this logic using `https.get()` instead of `curl`:
- Same endpoint URL
- Same `User-Agent` style (renamed to `gsd-check-update-worker`)
- Same regex validation `/^[0-9a-f]{40}$/`
- Same truncation `.slice(0, 7)`
- Same silent-failure pattern (catch → leave as null)

### Cache file schema (unchanged after fix)

```json
{
  "update_available": false,
  "installed": "a1b2c3d",
  "latest": "a1b2c3d",
  "checked": 1713340000,
  "stale_hooks": undefined
}
```

`gsd-statusline.js` reads `cache.update_available` (boolean) and `cache.stale_hooks` (array | undefined). These fields must remain in the result object — they are locked by D-03 and the existing statusline integration contract. [VERIFIED: gsd-statusline.js lines 210–228, gsd-check-update-worker.js lines 85–95]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `isNewer` inlined in `node -e '...'` template string | Defined as named function in worker file | Bug #2136 era — worker extracted to own file | Function was not carried over, causing ReferenceError |
| npm registry fetch (`get-shit-done-cc`) | GitHub Commits API for fork's SHA | This phase (Phase 4) | Correct source for fork versioning |
| semver ordering for isDevInstall detection | SHA equality only (no ordering) | This phase (Phase 4) | parseV semver split silently returns NaN for SHA values |

**Deprecated/outdated:**
- `execFileSync('npm', ['view', 'get-shit-done-cc', 'version'])`: Queries the upstream npm package, not the fork. The fork does not publish to npm. This call will return whatever the upstream maintainer has published — irrelevant to fork users.
- `parseV` semver split in isDevInstall: Depends on dotted-numeric version strings. SHA strings (`a1b2c3d`) split on `.` produce `['a1b2c3d']`, and `Number('a1b2c3d')` is `NaN`. All comparisons with `NaN` return false, so `isDevInstall` always returns false — the branch silently becomes dead code rather than crashing.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `https.get()` `timeout` option fires a `timeout` event (not auto-destroy) in Node 20+ | Common Pitfalls #3 | If it auto-destroys, `req.on('timeout', ...)` is harmless-redundant — no risk |
| A2 | GitHub Commits API response shape has top-level `sha` field (40-char hex) | Code Examples | Low risk — install.js already parses `JSON.parse(shaJson).sha` proving the field exists |
| A3 | Removing the `isDevInstall` branch will not break any existing test | Common Pitfalls #5 | Verified by reading gsd-statusline.test.cjs — confirmed no tests cover runStatusline internals |

**A3 is VERIFIED** (not merely assumed) — included for transparency.

---

## Open Questions (RESOLVED)

1. **Test file naming for SHA-compare tests**
   - What we know: `tests/semver-compare.test.cjs` mirrors the old semver `isNewer` and will need updating
   - What is unclear: Should the file be renamed to `sha-compare.test.cjs` (cleaner) or kept as `semver-compare.test.cjs` with updated content (less git history disruption)?
   - Recommendation: Rename to `tests/sha-compare.test.cjs` and update the git-tracked filename. The old name is semantically wrong after this fix.
   - **RESOLVED:** Repurpose `tests/semver-compare.test.cjs` in place — rewrite its content to test SHA equality semantics without renaming the file. Avoids git history disruption and unnecessary file rename churn.

2. **`result.latest` — full 40-char or truncated 7-char SHA?**
   - What we know: `installed` is always 7-char; `isNewer` truncates internally; `gsd-statusline.js` reads `cache.latest` but only uses it inside the now-removed `isDevInstall` branch
   - What is unclear: Whether any future consumer of `cache.latest` expects full or truncated form
   - Recommendation (Claude's Discretion): Store 7-char truncated form in `result.latest`. It matches `installed`, keeps the cache compact, and the `isNewer` function already performs truncation — storing truncated means `isNewer`'s slice is a no-op that still works correctly.
   - **RESOLVED:** Store 7-char truncated SHA in `result.latest`. This matches the `installed` format and keeps the cache compact.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >=20 | Worker + https module | ✓ | v24.14.1 | — |
| `https` built-in | GitHub API fetch | ✓ | built-in | — |
| `fs` built-in | VERSION file read, cache write | ✓ | built-in | — |
| `path` built-in | Path construction | ✓ | built-in | — |
| GitHub API network | Remote SHA fetch | [ASSUMED: available] | — | Silent failure → `update_available: false` per D-06 |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** GitHub API unavailability → D-06 silent failure is the designed fallback.

---

## Security Domain

This phase does not introduce user-controlled inputs, authentication, session management, or cryptographic operations. The only external call is an outbound HTTPS GET to `api.github.com` — unauthenticated, read-only, result is validated with a regex before use.

**Input validation:** The SHA regex `/^[0-9a-f]{40}$/` rejects any malformed API response before the value is stored in the cache file or passed to `isNewer`. [VERIFIED: install.js uses the same validation — mirroring it is the correct approach]

**No ASVS categories apply** to this phase's change surface.

---

## Sources

### Primary (HIGH confidence)
- `hooks/gsd-check-update-worker.js` — read directly; all line references verified
- `hooks/gsd-statusline.js` — read directly; all line references verified
- `hooks/gsd-check-update.js` — read directly; spawner pattern confirmed
- `bin/install.js` lines 55–73 — read directly; GitHub API pattern confirmed
- `tests/semver-compare.test.cjs` — read directly; old isNewer implementation confirmed
- `tests/gsd-statusline.test.cjs` — read directly; confirmed no test covers runStatusline internals
- `tests/managed-hooks.test.cjs` — read directly; MANAGED_HOOKS coverage test confirmed
- `.planning/phases/04-fix-background-update-check-hook/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Node.js `https` module behavior — standard built-in; patterns consistent with established Node.js idioms [ASSUMED based on training knowledge, consistent with install.js curl-equivalent pattern]

### Flagged for Validation (LOW confidence)
- None — all critical claims verified against source files in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external libraries; only Node built-ins already present in the runtime
- Architecture: HIGH — read directly from all three hook files and confirmed data flow
- Pitfalls: HIGH for Pitfalls 1–3 (derived from code reading); MEDIUM for Pitfall 4 (derived from test file content)

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable internal hooks — changes only on new bugs)
