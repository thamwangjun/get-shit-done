# Phase 5: Fix Version Detection and Update Workflow - Research

**Researched:** 2026-04-17
**Domain:** Node.js installer script patching; bash workflow version comparison; SHA-based versioning
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Remove the `curl`-to-GitHub-API block in `bin/install.js` (lines ~58–72). Replace with `git rev-parse --short HEAD` as the primary source of the installed SHA. This eliminates the offline-fallback problem entirely for local installs: git is always available in a local clone.

**D-02:** The GitHub API call is removed entirely — it is not kept as a secondary cross-check. For local installs, `git rev-parse` is the source of truth.

**D-03:** If `git rev-parse --short HEAD` fails (e.g., not in a git repo), write a sentinel value — `'no-network'` (or equivalent non-hex string) — to VERSION. This distinguishable fallback ensures downstream SHA comparisons (worker, update.md) never silently treat it as a valid SHA.

**D-04:** Tests verify: (a) VERSION contains a 7-char hex SHA after a normal install with git available; (b) VERSION contains a clearly non-SHA value after install in a non-git context.

**D-05:** Add `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` to the existing cache-clear loop in `update.md`. The worker write path (`~/.cache/gsd/gsd-update-check.json`) stays unchanged.

**D-06:** The single-bash-context version comparison mechanism in `update.md` is already correctly implemented. Phase 5 verifies it works end-to-end once INST-01/INST-02 are fixed — no changes to the comparison logic itself.

**D-07:** UPD-01 unblocks automatically once D-01–D-04 are delivered: VERSION will contain a valid 7-char SHA → update.md's `grep -Eq '^[0-9a-f]{7}'` check passes → INSTALLED_VERSION is set to the real SHA → SHA comparison works correctly → "already on latest" path is reachable.

**D-08:** This fork only supports local (git clone) installs for now. npm install support is explicitly out of scope.

### Claude's Discretion

- Whether to wrap `git rev-parse --short HEAD` in `execSync` (inline) or extract to a helper — planner decides based on existing patterns in install.js.
- Exact sentinel string for the non-git fallback (e.g., `'no-network'`, `'OFFLINE'`) — planner decides; must not match `^[0-9a-f]{7}`.

### Deferred Ideas (OUT OF SCOPE)

- **npm install support**: Future phase. When npm install support is added, the VERSION-writing strategy in install.js will need to handle the case where git is not available. At that point, the GitHub API call may be reintroduced as the primary source for npm installs.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | VERSION file always contains a 7-char hex SHA after a successful installation | D-01/D-02: `git rev-parse --short=7 HEAD` produces exactly 7 hex chars; `execSync` pattern already in install.js at line 61 |
| INST-02 | When GitHub API is unavailable at install time, VERSION contains a value distinguishable from a valid SHA | D-03: git is always available for local installs; sentinel `'no-network'` written only when `git rev-parse` itself fails (not-a-git-repo case) |
| UPD-01 | update.md correctly reports "already on latest" when installed SHA equals remote SHA | D-07: unblocks when INST-01/INST-02 pass — `grep -Eq '^[0-9a-f]{7}'` gate in update.md already correct; INT-01 cache path must also be fixed (D-05) |
| UPD-02 | Version comparison executes in a single bash context so variable state is not lost between steps | D-06: mechanism already correct in update.md (single inline bash pipeline); verify-only task confirms no regression |
</phase_requirements>

---

## Summary

Phase 5 is a targeted two-file fix: `bin/install.js` (lines 58–73) and `get-shit-done/workflows/update.md` (cache-clear step in `run_update`). The root cause of all four requirements is that the installer currently falls back to `pkg.version` (a semver string like `'1.36.0'`) when the GitHub API is unreachable. This semver string passes through `gsdVersion` and lands in the VERSION file, where it fails the `grep -Eq '^[0-9a-f]{7}'` gate in `update.md` — causing `INSTALLED_VERSION=unknown` and a forced reinstall on every `/gsd-update` call instead of the "already on latest" branch.

The fix replaces the curl-to-GitHub-API block with a single `execSync('git rev-parse --short=7 HEAD', ...)` call. Since this is a local-clone-only install path (D-08), git is always available. The try/catch silent-failure pattern already established in install.js (line 60–73) is reused. The fallback is a non-SHA sentinel (`'no-network'` or similar), not a semver string, so downstream grep gates correctly reject it.

The second change (D-05) is a one-line addition to `update.md`'s `run_update` step: `rm -f "$HOME/.cache/gsd/gsd-update-check.json"`. The worker (Phase 4) writes its cache to `~/.cache/gsd/gsd-update-check.json` (a shared, runtime-agnostic path), but the current cache-clear loop in `update.md` only iterates runtime-specific dirs (`~/.claude/cache/`, etc.). This mismatch causes the ⬆ indicator to persist after a successful update.

**Primary recommendation:** Replace lines 58–73 in `bin/install.js` with a `git rev-parse --short=7 HEAD` call using the already-imported `execSync`. Add a single `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` line in `update.md`'s `run_update` step. Add two test assertions in a new test file to cover INST-01 (SHA regex match) and INST-02 (non-SHA sentinel).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version SHA capture at install time | Installer script (`bin/install.js`) | — | `gsdVersion` is a module-scope variable set once at startup; all downstream writes (VERSION file, manifest, hook content `{{GSD_VERSION}}` substitution) derive from it |
| VERSION file write | Installer script (`bin/install.js`) line 5739 | — | Single write point; `gsdVersion` is already in scope |
| Update version comparison | Bash workflow (`update.md`) | — | `grep -Eq '^[0-9a-f]{7}'` gate is correct; INSTALLED_VERSION variable set in `get_installed_version` step and consumed in `compare_versions` step within the same bash heredoc |
| Update cache clear | Bash workflow (`update.md`) `run_update` step | Background hook (`gsd-check-update.js`) writes it | Worker writes to `~/.cache/gsd/gsd-update-check.json`; workflow must clear the same path |
| Test coverage: VERSION content | Test file (`tests/`) | — | Uses static analysis (read file, assert regex) — no live `install()` execution needed for INST-01/INST-02 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `child_process.execSync` | Node >=20 [VERIFIED: already imported at line 61 of install.js] | Run `git rev-parse --short=7 HEAD` synchronously | Already imported in the try block at line 61; consistent with existing pattern |
| Node.js built-in `node:test` | Node >=20 [VERIFIED: used in all test files] | Unit tests for new INST-01/INST-02 assertions | Project-standard test runner; no external framework |
| `node:assert/strict` | Node >=20 [VERIFIED: used in all test files] | Assertions in tests | Project-standard |

### No New Dependencies

This phase requires zero new npm dependencies. All tools needed are:
- `child_process.execSync` — already imported at install.js line 61
- `fs`, `path` — already imported throughout install.js
- `node:test`, `node:assert/strict` — already used in all test files

---

## Architecture Patterns

### System Architecture Diagram

```
[bin/install.js startup]
        |
        v
[try: execSync('git rev-parse --short=7 HEAD')]
        |
   success?
   /       \
  yes       no (not-a-git-repo or git missing)
  |         |
  v         v
[gsdVersion = 7-char hex SHA]   [gsdVersion = 'no-network']
        |
        v
[install() called → VERSION file written with gsdVersion]
        |
        v
[update.md get_installed_version step]
        |
[grep -Eq '^[0-9a-f]{7}' VERSION]
        |
   matches?
   /       \
  yes       no
  |         |
  v         v
[INSTALLED_VERSION = SHA]   [INSTALLED_VERSION = 'unknown']
        |
        v
[compare_versions step: INSTALLED_VERSION == LATEST_VERSION?]
        |
   equal?
   /       \
  yes       no
  |         |
  v         v
["already on latest"]   [show changelog + update]
```

### Recommended Project Structure

No new directories or files required. Changes are confined to:

```
bin/
└── install.js          # Lines 58–73: replace curl block with git rev-parse
get-shit-done/workflows/
└── update.md           # run_update step: add rm -f ~/.cache/gsd/gsd-update-check.json
tests/
└── version-detection.test.cjs   # New: INST-01, INST-02 static assertions
```

### Pattern 1: Silent-Failure execSync in install.js

**What:** wrap the `git rev-parse` call in the same try/catch already surrounding the GitHub API call. On failure, fall through to a sentinel value.

**When to use:** All I/O and external-process calls in install.js follow this pattern (lines 60–73, 125–134, etc.).

**Example:**
```javascript
// Source: bin/install.js lines 59–73 (existing pattern, adapted for git rev-parse)
let gsdVersion = 'no-network'; // distinguishable fallback; fails grep -Eq '^[0-9a-f]{7}'
try {
  const { execSync } = require('child_process');
  const sha = execSync('git rev-parse --short=7 HEAD', {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
    // cwd not needed: installer runs from the repo root
  }).trim();
  if (/^[0-9a-f]{7}$/.test(sha)) {
    gsdVersion = sha;
  }
} catch (e) {
  // Not a git repo or git not available — gsdVersion stays as 'no-network'
}
```

**Key notes:**
- `--short=7` forces exactly 7 characters regardless of `core.abbrev` git config [VERIFIED: `git rev-parse --short HEAD` and `git rev-parse --short=7 HEAD` produce identical output in this repo: `9b4f1ea`]
- The regex guard `if (/^[0-9a-f]{7}$/.test(sha))` defends against unexpected git output (e.g., dirty SHA with `-dirty` suffix in some git configurations)
- `windowsHide: true` matches the existing execSync call pattern at line 65
- `{ encoding: 'utf8' }` matches the existing pattern; `.trim()` removes the trailing newline

### Pattern 2: Cache-Clear Path in update.md

**What:** The `run_update` step in `update.md` already has a cache-clear loop over runtime dirs. The worker writes to a separate shared path. Add one `rm -f` line before or after the existing loop.

**When to use:** Immediately after the per-runtime-dir loop that clears `$dir/cache/gsd-update-check.json`.

**Example:**
```bash
# Source: update.md run_update step (addition to existing loop, ~line 519)
# After the for-loop that clears runtime-dir caches, add:
rm -f "$HOME/.cache/gsd/gsd-update-check.json"
```

This matches the exact path the worker writes to: `path.join(os.homedir(), '.cache', 'gsd', 'gsd-update-check.json')` [VERIFIED: hooks/gsd-check-update.js line 35–36].

### Pattern 3: Test File Structure for Static Assertions

**What:** New test file using `node:test` / `node:assert/strict`. Tests read the installed VERSION file path from a temp directory after calling `install()`, or use static analysis of install.js source to assert the git path is present and the semver fallback is removed.

**When to use:** Static analysis (grep source, assert regex) is preferred over executing `install()` for INST-01/INST-02 because live install with a real git repo requires no mocking while the non-git test case requires a temp dir outside any git repo.

**Example:**
```javascript
// Source: project test pattern (tests/semver-compare.test.cjs, tests/install-hooks-copy.test.cjs)
'use strict';
process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createTempDir, cleanup } = require('./helpers.cjs');

const INSTALL_SRC = path.join(__dirname, '..', 'bin', 'install.js');
const installSrc = fs.readFileSync(INSTALL_SRC, 'utf8');

// INST-01 (static): install.js uses git rev-parse, not curl
describe('INST-01: install.js uses git rev-parse for version', () => {
  test('install.js source contains git rev-parse --short', () => {
    assert.ok(installSrc.includes('git rev-parse'), ...);
  });
  test('install.js source does not use curl to GitHub API for version', () => {
    assert.ok(!installSrc.includes('api.github.com/repos/thamwangjun/get-shit-done/commits'), ...);
  });
});

// INST-02 (live): non-git context writes non-SHA sentinel
describe('INST-02: non-git install writes non-SHA sentinel', () => {
  let tmpDir;
  afterEach(() => cleanup(tmpDir));
  test('VERSION contains non-SHA value when not in git repo', () => {
    tmpDir = createTempDir();
    // Run install() with cwd pointing to tmpDir (not a git repo)
    // Assert VERSION content does not match /^[0-9a-f]{7}$/
  });
});
```

### Anti-Patterns to Avoid

- **Keeping semver as fallback:** The bug. `pkg.version` is `'1.36.0'` — the `norm('1.36.0').slice(0,7)` comparison in `isNewer()` evaluates to `'1.36.0'`, which never equals any hex SHA, causing permanent `update_available=true`. Do not retain `pkg.version` as any fallback path for `gsdVersion`.
- **Using `--short` without `=7`:** Without the explicit length, git may use a longer prefix if the repo has many objects and the default abbrev config is overridden. Use `--short=7` to guarantee the 7-char contract.
- **Adding `rm -f ~/.cache/gsd/...` to the per-runtime-dir loop body:** The `~/.cache/gsd/` path is NOT a per-runtime path — it is shared across all runtimes. It should be cleared once, outside the loop.
- **Changing the manifest version behavior:** `gsdVersion` feeds the manifest at line 5219 (`{ version: gsdVersion, ... }`). A sentinel value `'no-network'` will also be written there in the fallback case. This is acceptable — the manifest is informational. Do not add special-casing for the manifest.
- **Changing `{{GSD_VERSION}}` injection in hooks:** `gsdVersion` is used for hook version header injection at lines 5777, 5786, 5898, 5904. The sentinel value will appear in hook version headers when git is unavailable — acceptable, as it will mismatch any real SHA and trigger the stale-hooks warning, which is the correct behavior.

---

## Solved Problems

| Problem | Build Nothing — Use Instead | Why |
|---------|-----------------------------|-----|
| Executing shell commands synchronously in Node.js | `child_process.execSync` (built-in) | Already imported in install.js at line 61 — no new require needed |
| Getting repo HEAD SHA in exactly 7 chars | `git rev-parse --short=7 HEAD` | `--short=7` guarantees length regardless of `core.abbrev` config |
| Testing without network or GitHub API | Static source analysis + temp-dir install | install.js exports `install()` under `GSD_TEST_MODE=1`; `createTempDir()` from helpers.cjs provides non-git temp dirs |

---

## Common Pitfalls

### Pitfall 1: `git rev-parse` Output Includes Trailing Newline

**What goes wrong:** `execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' })` returns `'9b4f1ea\n'`. Without `.trim()`, the VERSION file contains `'9b4f1ea\n'`, and `grep -Eq '^[0-9a-f]{7}'` still matches (grep treats `\n` as line terminator), but string equality comparisons in tests or `isNewer()` may fail.

**Root cause:** execSync with `encoding: 'utf8'` returns the raw stdout including newline.

**Prevention:** Always call `.trim()` on the result before assigning to `gsdVersion`.

**Warning signs:** Tests asserting `VERSION content === '9b4f1ea'` fail with `'9b4f1ea\n' !== '9b4f1ea'`.

### Pitfall 2: install.js `gsdVersion` Is Module-Scope — All Three Write Points Inherit the Fix

**What goes wrong:** `gsdVersion` is used at line 5219 (manifest), 5739 (VERSION file), and lines 5777/5786/5898/5904 (hook `{{GSD_VERSION}}` substitution). A well-intentioned "only fix the VERSION write" approach that adds special logic at line 5739 but leaves the module-scope `gsdVersion` as `pkg.version` in the fallback case will not fix the worker comparison (which reads from the VERSION file) but may confuse future readers.

**Root cause:** All downstream writes derive from the single module-scope `gsdVersion` variable. The fix should be at the variable's initialization point (lines 58–73), not at the write points.

**Prevention:** Replace lines 58–73 entirely. Do not add overrides at lines 5739 or elsewhere.

**Warning signs:** VERSION file contains the correct SHA but `gsd-manifest.json` still shows `'1.36.0'`.

### Pitfall 3: The `rm -f` Must Target `$HOME/.cache/gsd/` Not a Runtime-Dir Subdirectory

**What goes wrong:** Adding `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` inside the existing for-loop body (which iterates `$dir` values like `~/.claude`) would expand to `~/.claude/.cache/gsd/gsd-update-check.json` — a path that does not exist. The actual cache path is an OS-level user cache directory, not a subdirectory of the runtime config dir.

**Root cause:** The worker (gsd-check-update.js) deliberately uses `~/.cache/gsd/` as a shared, runtime-agnostic location to avoid multi-runtime conflicts (comment at line 33–34 of gsd-check-update.js).

**Prevention:** Place the `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` line outside and after the existing for-loop, as a standalone unconditional command.

**Warning signs:** The ⬆ indicator still appears in the statusline after `/gsd-update` completes.

### Pitfall 4: UPD-02 Is Verify-Only — No Code Changes to update.md Comparison Logic

**What goes wrong:** Attempting to rewrite or "improve" the single-bash-context SHA comparison in `update.md`'s `check_latest_version` and `compare_versions` steps when the mechanism is already correct (D-06).

**Root cause:** The steps are separate XML `<step>` elements but each contains a single bash block — the comparison variables set in `get_installed_version` are not available in subsequent steps unless the workflow executes them as a single bash heredoc. The existing implementation already handles this correctly.

**Prevention:** Do not modify the comparison logic. The UPD-02 deliverable is a verification/confirmation task, not a code change task.

---

## Code Examples

### Replacement block for bin/install.js lines 58–73

```javascript
// Source: bin/install.js lines 58–73 (to be replaced)
// BEFORE:
let gsdVersion = pkg.version; // fallback
try {
  const { execSync } = require('child_process');
  const shaJson = execSync(
    'curl -sS -H "User-Agent: gsd-install" -H "Accept: application/vnd.github.v3+json" ' +
    '"https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main"',
    { encoding: 'utf8', timeout: 15000, windowsHide: true }
  );
  const sha = JSON.parse(shaJson).sha;
  if (sha && /^[0-9a-f]{40}$/.test(sha)) {
    gsdVersion = sha.slice(0, 7);
  }
} catch (e) {
  // GitHub API unavailable - gsdVersion remains as the fallback semver
}

// AFTER (D-01, D-02, D-03, D-08):
// Local-only install: git is always available in a git clone.
// Note: npm install support is not implemented — revisit if added in a future phase.
let gsdVersion = 'no-network'; // non-SHA sentinel; fails grep -Eq '^[0-9a-f]{7}' intentionally
try {
  const { execSync } = require('child_process');
  const sha = execSync('git rev-parse --short=7 HEAD', {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  }).trim();
  if (/^[0-9a-f]{7}$/.test(sha)) {
    gsdVersion = sha;
  }
} catch (e) {
  // Not in a git repo — gsdVersion stays as 'no-network'
}
```

### Addition to update.md run_update step

```bash
# Source: update.md run_update step (addition after the existing for-loop at ~line 519)
# The worker (gsd-check-update.js:35) writes to $HOME/.cache/gsd/ — not a runtime-dir subpath.
# This rm must be outside the loop that iterates runtime dirs.
rm -f "$HOME/.cache/gsd/gsd-update-check.json"
```

The existing loop (lines 516–519 of update.md) clears `$dir/cache/gsd-update-check.json` for runtime dirs. The new line clears the shared cache written by the worker.

### Static analysis test assertions (INST-01)

```javascript
// Source: tests/semver-compare.test.cjs pattern (static analysis of source file)
const INSTALL_SRC = path.join(__dirname, '..', 'bin', 'install.js');
const installSrc = fs.readFileSync(INSTALL_SRC, 'utf8');

test('INST-01: install.js uses git rev-parse for version', () => {
  assert.ok(
    installSrc.includes('git rev-parse'),
    'install.js must use git rev-parse for SHA-based versioning'
  );
});

test('INST-01: install.js does not call GitHub API for version at startup', () => {
  // The GitHub API URL appears in update.md and gsd-check-update-worker.js but
  // must NOT appear in the module-scope gsdVersion initialization block.
  // Verify by checking the block before any function definition.
  const moduleScope = installSrc.slice(0, installSrc.indexOf('\nfunction '));
  assert.ok(
    !moduleScope.includes('api.github.com/repos/thamwangjun/get-shit-done/commits'),
    'install.js module-scope must not call GitHub API for version'
  );
});

test('INST-02: install.js fallback is a non-SHA sentinel string', () => {
  // gsdVersion initial value must not match /^[0-9a-f]{7}/ pattern
  assert.ok(
    !installSrc.includes("let gsdVersion = pkg.version"),
    'install.js must not fall back to pkg.version (semver breaks SHA comparison)'
  );
  assert.ok(
    installSrc.includes("'no-network'") || installSrc.includes('"no-network"') ||
    installSrc.includes("'OFFLINE'") || installSrc.includes('"OFFLINE"'),
    'install.js must have a named non-SHA sentinel value as fallback'
  );
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `curl` to GitHub API for install-time SHA | `git rev-parse --short=7 HEAD` | Phase 5 (this phase) | Eliminates network dependency at install time; offline installs produce distinguishable sentinel instead of semver |
| `pkg.version` semver fallback (`'1.36.0'`) | `'no-network'` sentinel | Phase 5 (this phase) | Prevents `isNewer()` from treating semver as SHA, eliminating permanent false-positive `update_available=true` |
| Cache clear iterates only runtime dirs | Cache clear also removes `~/.cache/gsd/gsd-update-check.json` | Phase 5 (this phase) | Fixes ⬆ indicator persisting after `/gsd-update` |

**Deprecated/outdated:**
- `curl -sS ... api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` in install.js: removed in this phase. The same URL remains valid in `update.md`'s `check_latest_version` step and in `gsd-check-update-worker.js` — those are intentional and unchanged.
- `pkg.version` fallback for `gsdVersion`: removed. The package.json `version` field is `'1.36.0'` — a semver string that never matches `grep -Eq '^[0-9a-f]{7}'`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `git rev-parse --short=7 HEAD` guarantees exactly 7 chars regardless of repo size | Code Examples | If some git version ignores `=7`, SHA length could vary; downstream grep `^[0-9a-f]{7}` would fail to match. Mitigation: the regex guard `if (/^[0-9a-f]{7}$/.test(sha))` catches this and falls through to sentinel. [VERIFIED in this repo: both `--short` and `--short=7` produce `9b4f1ea`] |
| A2 | The existing for-loop in update.md `run_update` clears `$dir/cache/gsd-update-check.json` (not `$dir/.cache/gsd/...`) | Common Pitfalls / Code Examples | If the loop already clears `~/.cache/gsd/`, the new `rm -f` line is redundant but harmless. [VERIFIED: update.md lines 510–519 iterate runtime dirs and call `rm -f "$dir/cache/gsd-update-check.json"` and `rm -f "$HOME/$dir/cache/gsd-update-check.json"` — neither matches `~/.cache/gsd/`] |
| A3 | `install.js` is always run from the repo root (so `git rev-parse HEAD` resolves to the fork's HEAD) | Code Examples | If `cwd` when running the installer is not the repo root, git may resolve a different HEAD or fail. For `node bin/install.js` and `npx github:...`, cwd is the temp unpack dir — which is a git repo for `npx github:` installs. [ASSUMED: `npx github:` unpacks to a temp git repo; `node bin/install.js` is run from the cloned repo.] |

---

## Open Questions

1. **Should `gsdVersion` sentinel be `'no-network'` or `'OFFLINE'`?**
   - What we know: either string satisfies the constraint of not matching `^[0-9a-f]{7}`. Both are readable in the VERSION file.
   - What is unclear: whether one is more descriptive to an end user who reads the VERSION file.
   - Recommendation: use `'no-network'` — it describes the cause (git unavailable, not network) accurately and is already mentioned in CONTEXT.md's D-03.

2. **Does `npx github:thamwangjun/get-shit-done#thamw-main` unpack to a directory with `.git/`?**
   - What we know: `npx github:` uses `npm pack` under the hood, which does NOT include `.git/`. [ASSUMED based on npm behavior]
   - What is unclear: whether the temp unpack directory is a git repo.
   - Recommendation: if `git rev-parse` fails in the npx case, the sentinel `'no-network'` is written — which is acceptable per D-03 and D-08 (npm installs are out of scope). The `install()` function is called after the npx unpack, so this is the current behavior for `npx`-triggered installs. This is fine for now; the deferred npm support phase will address it.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `git` CLI | `git rev-parse --short=7 HEAD` in install.js | ✓ [VERIFIED: `git rev-parse --short=7 HEAD` returns `9b4f1ea`] | git 2.x | `'no-network'` sentinel (D-03) |
| `node` >=20 | All Node.js code | ✓ [VERIFIED: project requires Node >=20 per CLAUDE.md] | >=20 | — |
| `child_process.execSync` | install.js | ✓ [VERIFIED: already required at line 61] | built-in | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `git` — if unavailable, sentinel `'no-network'` is written (D-03).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | none (run via `node --test`) |
| Quick run command | `node --test tests/version-detection.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INST-01 | install.js uses `git rev-parse`, not GitHub API, for `gsdVersion` | unit (static analysis) | `node --test tests/version-detection.test.cjs` | no — Wave 0 |
| INST-01 | VERSION file contains 7-char hex SHA when git is available | unit (live install in temp git repo) | `node --test tests/version-detection.test.cjs` | no — Wave 0 |
| INST-02 | VERSION file contains non-SHA sentinel when not in git repo | unit (live install in temp non-git dir) | `node --test tests/version-detection.test.cjs` | no — Wave 0 |
| UPD-01 | update.md `grep -Eq '^[0-9a-f]{7}'` gate passes once INST-01/INST-02 are satisfied | integration (end-to-end manual) | manual — requires real install + `/gsd-update` invocation | n/a — manual-only |
| UPD-02 | Version comparison in update.md is single-bash-context | unit (static analysis of update.md) | `node --test tests/version-detection.test.cjs` | no — Wave 0 |

**UPD-01 manual note:** The "already on latest" path requires a running runtime session and a real installed SHA matching the remote HEAD. Automated testing would require mocking the GitHub API and the runtime. The test plan covers the upstream conditions (INST-01, INST-02) automatically; the resulting UPD-01 path is verified by the planner/verifier confirming the logic flow analysis.

**UPD-02 manual note:** update.md is a prompt-based workflow, not executable code. Static analysis confirms the bash pipeline in `check_latest_version` is self-contained. No behavioral change is made.

### Sampling Rate

- **Per task commit:** `node --test tests/version-detection.test.cjs`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/version-detection.test.cjs` — covers INST-01 (static + live git), INST-02 (non-git sentinel), UPD-02 (static analysis of update.md)

---

## Security Domain

> `security_enforcement` is not explicitly `false` in config.json — section included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (minor) | `git rev-parse` output validated with `/^[0-9a-f]{7}$/` before assignment; GitHub API SHA validated with `/^[0-9a-f]{40}$/` in update.md (existing) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Command injection via git SHA output | Tampering | `git rev-parse --short=7 HEAD` output is validated with regex before use; execSync does not pass it to a shell |
| Cache poisoning via stale `gsd-update-check.json` | Tampering | Fixed by D-05; `rm -f` on update clears the shared cache path |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: bin/install.js lines 58–73] — exact code to replace; `execSync` import at line 61 confirmed reusable
- [VERIFIED: bin/install.js line 5739] — VERSION file write point; `gsdVersion` feeds all downstream writes
- [VERIFIED: get-shit-done/workflows/update.md lines 108, 216, 226, 510–519] — `grep -Eq '^[0-9a-f]{7}'` gate, INSTALLED_VERSION logic, cache-clear loop confirmed
- [VERIFIED: hooks/gsd-check-update.js lines 35–36] — worker writes to `path.join(homeDir, '.cache', 'gsd', 'gsd-update-check.json')`
- [VERIFIED: tests/semver-compare.test.cjs] — existing test pattern for static analysis of worker source
- [VERIFIED: tests/install-hooks-copy.test.cjs] — `GSD_TEST_MODE=1` pattern for requiring install.js in tests
- [VERIFIED: git rev-parse --short=7 HEAD] — produces `9b4f1ea` (7 chars) in this repo

### Secondary (MEDIUM confidence)

- [CITED: .planning/phases/05-fix-version-detection-and-update-workflow/05-CONTEXT.md] — all locked decisions (D-01 through D-08)
- [CITED: .planning/v1.36.0.a-MILESTONE-AUDIT.md] — gap evidence for INST-01, INST-02, UPD-01, UPD-02, INT-01, FLOW-03

### Flagged for Validation (LOW confidence)

- A3: `npx github:` unpacks to a temp git repo containing `.git/` — not verified. Risk: if it does not, `git rev-parse` fails at install time and sentinel is written, which is acceptable per D-03/D-08.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tools confirmed in codebase
- Architecture: HIGH — exact line numbers verified by reading source files
- Pitfalls: HIGH — root cause confirmed by reading install.js, update.md, gsd-check-update.js, and audit report
- Test patterns: HIGH — patterns confirmed from existing test files

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable codebase; no fast-moving external dependencies)
