# Phase 7: Merge and Conflict Resolution - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 3 (conflict-resolution targets) + 4 (supporting fork-only files)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `hooks/gsd-check-update-worker.js` | service (background worker) | event-driven, request-response | `tests/semver-compare.test.cjs` (mirrors the isNewer fn), `tests/version-detection.test.cjs` | exact — fork's SHA semantics mirrored in both test files |
| `bin/install.js` | utility (installer) | batch, file-I/O | `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | exact — test directly covers the ensureHooksDist + gsdVersion fork patches |
| `tests/agent-frontmatter.test.cjs` | test | transform (content assertion) | `tests/negative-framing-scan.test.cjs` | role-match — same Node.js test runner pattern, same fork-standards scanning approach |
| `scripts/run-tests.cjs` | utility (test orchestrator) | batch | itself — fork-only SERIAL_FILES patch on top of original runner | role-match — additive fork change; upstream did not modify this file |
| `hooks/gsd-check-update.js` | hook (parent spawner) | event-driven | `hooks/gsd-check-update-worker.js` | role-match |
| `hooks/gsd-statusline.js` | hook | event-driven | `hooks/gsd-check-update-worker.js` | partial-match — same hook tier, different function |
| `tests/semver-compare.test.cjs` | test | transform | `tests/version-detection.test.cjs` | exact — both test fork SHA semantics via static source analysis |

---

## Pattern Assignments

### `hooks/gsd-check-update-worker.js` (service, event-driven)

**Analog:** fork's own current version at `/home/thamw/development/happy/get-shit-done/hooks/gsd-check-update-worker.js`
**Upstream contrast:** `git show upstream/main:hooks/gsd-check-update-worker.js`
**Resolution strategy (from RESEARCH.md):** Take fork's version as-is. The two files are architecturally different, not just textually different.

**Fork patch 1 — SHA equality isNewer** (lines 80-82):
```javascript
// PRESERVE THIS — fork's SHA equality semantics (NOT semver)
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
```

**Upstream version to reject** (lines 22-30 of upstream):
```javascript
// DO NOT TAKE THIS — upstream npm semver comparison
function isNewer(a, b) {
  const pa = (a || '').split('.').map(s => Number(s.replace(/-.*/, '')) || 0);
  const pb = (b || '').split('.').map(s => Number(s.replace(/-.*/, '')) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}
```

**Fork patch 2 — GitHub API URL** (lines 99-107):
```javascript
// PRESERVE THIS — thamwangjun GitHub repo, NOT npm registry
const req = https.get(
  'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main',
  {
    headers: {
      'User-Agent': 'gsd-check-update-worker',
      'Accept': 'application/vnd.github.v3+json',
    },
    timeout: 10000,
  },
```

**Upstream version to reject** (lines 82-88 of upstream):
```javascript
// DO NOT TAKE THIS — upstream calls npm registry
latest = execFileSync('npm', ['view', 'get-shit-done-cc', 'version'], {
  encoding: 'utf8',
  timeout: 10000,
  windowsHide: true,
}).trim();
```

**Fork patch 3 — initialization values** (lines 17-21):
```javascript
// PRESERVE THIS — fork's initialization: '' sentinels, 'unknown' installed
const projectVersionFile = process.env.GSD_PROJECT_VERSION_FILE || '';
const globalVersionFile  = process.env.GSD_GLOBAL_VERSION_FILE  || '';
let installed = 'unknown';
```

**Upstream version to reject** (lines 16-18 of upstream):
```javascript
// DO NOT TAKE THIS — upstream leaves vars undefined, installed = '0.0.0'
const projectVersionFile = process.env.GSD_PROJECT_VERSION_FILE;
const globalVersionFile = process.env.GSD_GLOBAL_VERSION_FILE;
let installed = '0.0.0';
```

**Fork patch 4 — async writeResult pattern** (lines 84-95):
```javascript
// PRESERVE THIS — fork's async callback-based writeResult
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
```

**Upstream version to reject** (upstream writes result synchronously inline, no writeResult function):
```javascript
// DO NOT TAKE THIS — upstream writes result inline without writeResult function
const result = { update_available: ..., ... };
if (cacheFile) {
  try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
}
```

**Fork patch 5 — MANAGED_HOOKS array** (lines 37-48):
```javascript
// EVALUATE: upstream adds 'gsd-read-injection-scanner.js' to MANAGED_HOOKS
// Check: ls hooks/dist/ | grep injection
// If file present in dist/, add it to fork's MANAGED_HOOKS; otherwise keep as-is
const MANAGED_HOOKS = [
  'gsd-check-update-worker.js',
  'gsd-check-update.js',
  'gsd-context-monitor.js',
  'gsd-phase-boundary.sh',
  'gsd-prompt-guard.js',
  'gsd-read-guard.js',
  // 'gsd-read-injection-scanner.js',  // upstream adds; evaluate for fork
  'gsd-session-state.sh',
  'gsd-statusline.js',
  'gsd-validate-commit.sh',
  'gsd-workflow-guard.js',
];
```

**Fork patch 6 — stale hook norm() normalization** (lines 65-66):
```javascript
// PRESERVE THIS — fork's 7-char prefix normalization before hook version compare
const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
if (norm(hookVersion) !== norm(installed) && !hookVersion.includes('{{')) {
```

**Upstream version to reject** (upstream uses reversed semver isNewer call, no norm()):
```javascript
// DO NOT TAKE THIS — upstream uses semver isNewer with reversed argument order
if (isNewer(installed, hookVersion) && !hookVersion.includes('{{')) {
```

**Verification command after resolution:**
```bash
grep thamwangjun hooks/gsd-check-update-worker.js
# Expected: line with https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main
```

---

### `bin/install.js` (utility, batch + file-I/O)

**Analog:** fork's own current version at `/home/thamw/development/happy/get-shit-done/bin/install.js`
**Resolution strategy (from RESEARCH.md):** Start with upstream's version of the file. Apply 5 fork patch locations on top. Safer than starting from fork and adding 29 upstream hunks.

**Fork patch 1 — gsdVersion block** (lines 58-73):
```javascript
// PRESERVE THIS — SHA-based version detection (not pkg.version / semver)
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

**Fork patch 2 — ensureHooksDist function** (lines 207-237):
```javascript
// PRESERVE THIS — on-demand hooks build trigger
/**
 * Ensure hooks/dist/ exists. If absent, builds it on-demand using scripts/build-hooks.js.
 * Aborts the installer with a non-zero exit if the build fails.
 * @param {string} src - GSD package root directory
 * @returns {boolean} true if an on-demand build was triggered, false if dist/ was already present
 */
function ensureHooksDist(src) {
  const hooksDist = path.join(src, 'hooks', 'dist');
  if (fs.existsSync(hooksDist)) return false;

  console.log(`  ${cyan}▶${reset} Building hooks from source...`);
  const buildScript = path.join(src, 'scripts', 'build-hooks.js');
  if (!fs.existsSync(buildScript)) {
    console.error(`\n  ${yellow}Build failed!${reset} hooks/dist/ is missing and build script not found:`);
    console.error(`  ${buildScript}`);
    console.error(`  Re-install GSD or run: node scripts/build-hooks.js`);
    process.exit(1);
  }
  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, [buildScript], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error(`\n  ${yellow}Build failed!${reset} Could not build hooks/dist/:`);
    if (result.error) console.error(result.error.message);
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }
  return true;
}
```

**Fork patch 3 — banner uses gsdVersion** (line 448):
```javascript
// PRESERVE THIS — banner uses gsdVersion (7-char SHA), NOT pkg.version (semver)
'  Get Shit Done ' + dim + 'v' + gsdVersion + reset + '\n' +
```

**Fork patch 4 — ensureHooksDist call site** (line 5779):
```javascript
// PRESERVE THIS — ensureHooksDist call before hooks copy loop
// Ensure hooks/dist/ is built — triggers on-demand build if absent (fixes silent-skip bug)
const builtFromSource = ensureHooksDist(src);
```

**Fork patch note — hasPortableHooks:** The fork's current `bin/install.js` does NOT have `hasPortableHooks`. Upstream added this in commit `62261a3`. Per D-05, non-fork-patched content defaults to upstream's version. Restore `hasPortableHooks` and associated `buildHookCommand` portable path logic from upstream when applying the upstream-first resolution strategy. Verify no explicit removal commit exists in `git log thamw-main --oneline -- bin/install.js` before restoring.

**Verification command after resolution:**
```bash
grep ensureHooksDist bin/install.js
# Expected: both function definition (line ~207) and call site (line ~5779)
```

---

### `tests/agent-frontmatter.test.cjs` (test, transform)

**Analog:** `tests/negative-framing-scan.test.cjs` — same Node.js test runner pattern, same fork-standards enforcement approach

**Imports pattern** (lines 1-18 of fork's current file):
```javascript
// Node.js built-in test runner — no jest/mocha/vitest
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
```

**Fork patch 1 — positive-framing assertion** (lines 38-41):
```javascript
// PRESERVE THIS — positive-framing assertion (/only use the write tool/i)
assert.ok(
  /only use the write tool/i.test(content),
  `${agent} missing 'Only use the Write tool' instruction`
);
```

**Upstream version to reject** (upstream lines 38-41):
```javascript
// DO NOT TAKE THIS — upstream prohibition-form assertion
assert.ok(
  content.includes("never use `Bash(cat << 'EOF')` or heredoc"),
  `${agent} missing anti-heredoc instruction`
);
```

**Fork patch 2 — skip condition in heredoc scanner** (line 53):
```javascript
// PRESERVE THIS — fork's skip condition: does NOT include 'never use' check
if (line.includes('NEVER') || line.trim().startsWith('```')) continue;
```

**Upstream version to reject** (upstream line 53):
```javascript
// DO NOT TAKE THIS — upstream adds 'never use' to the skip condition
// This would cause all lines containing 'never use' to be skipped,
// defeating the positive-framing standard scanner
if (line.includes('never use') || line.includes('NEVER') || line.trim().startsWith('```')) continue;
```

**Resolution approach:** Take upstream's file structure (it shares same shape as fork beyond these 2 assertions). Swap in 2 fork assertions. The file structure beyond lines 38-41 and line 53 is identical between fork and upstream.

**Verification command after resolution:**
```bash
grep -i "only use" tests/agent-frontmatter.test.cjs
# Expected: line with /only use the write tool/i.test(content)
```

---

## Shared Patterns

### Node.js Built-in Test Runner Pattern
**Source:** `tests/agent-frontmatter.test.cjs`, `tests/negative-framing-scan.test.cjs`, `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs`
**Apply to:** All test files created or modified in Phase 7

```javascript
'use strict';
const { describe, test, before, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
```

No jest/mocha/vitest — this project uses Node.js v18+ built-in `node:test` exclusively.

### Static Source Analysis Test Pattern
**Source:** `tests/version-detection.test.cjs` (lines 22-27), `tests/semver-compare.test.cjs` (lines 17-23)
**Apply to:** Any test that must verify fork patch content in `bin/install.js` or `hooks/gsd-check-update-worker.js`

```javascript
// Load source as string for static analysis — avoids require() side effects
const installSrc = fs.readFileSync(INSTALL_SRC, 'utf8');
// For worker: mirror the function rather than require() it (no module.exports)
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
```

### Conflict Marker Verification Pattern
**Source:** `plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md` (verification section)
**Apply to:** Post-resolution check across all files before committing

```bash
grep -r "<<<<<<\|=======\|>>>>>>>" agents/ commands/gsd/ get-shit-done/ hooks/ bin/ tests/
# Expected: no output
```

### Grep Verification (Fork Patch Survival) Pattern
**Source:** RESEARCH.md §Validation Architecture + CONTEXT.md D-02/D-03/D-04
**Apply to:** Immediately after all conflicts staged, before `git commit`

```bash
# MERGE-02: worker preserves thamwangjun GitHub URL
grep thamwangjun hooks/gsd-check-update-worker.js

# MERGE-03: installer preserves ensureHooksDist
grep ensureHooksDist bin/install.js

# MERGE-04: test preserves positive-framing assertion
grep -i "only use" tests/agent-frontmatter.test.cjs

# MERGE-01: all 55 upstream commits now reachable
git log --oneline upstream/main ^thamw-main | wc -l
# Expected: 0
```

### SERIAL_FILES Test Isolation Pattern
**Source:** `scripts/run-tests.cjs` (lines 25-29) — fork-only patch
**Apply to:** `scripts/run-tests.cjs` if it conflicts during merge; preserve this block

```javascript
// Tests that mutate hooks/dist/ (shared filesystem state) must run serially
const SERIAL_FILES = new Set([
  'tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs',
].map(f => join(f)));
const serialFiles = allFiles.filter(f => SERIAL_FILES.has(f));
const parallelFiles = allFiles.filter(f => !SERIAL_FILES.has(f));
```

---

## Likely Unexpected Conflict Files

These are not the 3 primary high-risk files but may appear in `git diff --name-only --diff-filter=U` after the merge runs. Patterns for each:

### `hooks/gsd-check-update.js` (unexpected conflict, low-risk)
**Resolution:** Take upstream's comment additions. Fork only removed an inline comment block. No fork-specific logic. Use `git checkout --theirs hooks/gsd-check-update.js` is safe here (unlike the 3 high-risk files).

### `hooks/gsd-statusline.js` (unexpected conflict, medium-risk)
**Resolution pattern (D-05):** Take upstream's version. The statusline's dynamic `CLAUDE_CODE_AUTO_COMPACT_WINDOW` calculation is runtime code, not a fork patch.

**Fork's version to NOT preserve:**
```javascript
// Fork had this hardcoded constant — not a fork patch, just a stale state
const AUTO_COMPACT_BUFFER_PCT = 16.5;
```

**Upstream version to take:**
```javascript
// Take upstream's dynamic acw-based calculation
```

### `scripts/run-tests.cjs` (likely auto-merges cleanly)
Git will likely auto-merge because upstream did not modify this file. Verify it is NOT in `git diff --name-only --diff-filter=U` output. If it does conflict, preserve the `SERIAL_FILES` block (see Shared Patterns above).

### `tests/semver-compare.test.cjs` (unexpected conflict, medium-risk)
**Resolution:** Take fork's version. Fork rewrote for SHA equality semantics (139 lines). Upstream version (81 lines) tests npm semver — incompatible with fork's worker architecture.

**Verification after resolution:**
```bash
grep "SHA equality" tests/semver-compare.test.cjs
# Expected: line from fork's test header comment
```

---

## No Analog Found

All files in this phase have analogs or are self-referential (resolving their own conflicts). No files require falling back to RESEARCH.md patterns exclusively.

---

## Resolution Order

Per CONTEXT.md (Claude's discretion), recommended order based on risk and verification dependency:

1. `tests/agent-frontmatter.test.cjs` — smallest diff (6 lines), fastest verification
2. `hooks/gsd-check-update-worker.js` — take fork's version; check MANAGED_HOOKS for injection scanner
3. `bin/install.js` — largest file (6700+ lines, 29 hunks); start from upstream, apply 5 fork patches
4. Any unexpected conflict files (check with `git diff --name-only --diff-filter=U`)

---

## Metadata

**Analog search scope:** `/home/thamw/development/happy/get-shit-done/hooks/`, `tests/`, `bin/`, `scripts/`, `plans/`
**Files scanned:** 7 primary + upstream/main contrast reads for 3 high-risk files
**Pattern extraction date:** 2026-04-17

---

## Canonical Reference Checklist

Before executing Plan 07-01, downstream agents MUST also read:
- `/home/thamw/development/happy/get-shit-done/.planning/REQUIREMENTS.md` §Merge Integration (MERGE-01 through MERGE-04)
- `/home/thamw/development/happy/get-shit-done/.planning/PROJECT.md` §Key Decisions
- `/home/thamw/development/happy/get-shit-done/plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md` (canonical conflict resolution playbook)
