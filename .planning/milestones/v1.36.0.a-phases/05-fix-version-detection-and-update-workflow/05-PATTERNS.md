# Phase 5: Fix Version Detection and Update Workflow - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `bin/install.js` (modify lines 58–73) | installer/utility | transform (external-process → module-scope var) | `bin/install.js` lines 60–73 (same file, existing try/catch block) | exact |
| `get-shit-done/workflows/update.md` (add 1 line in `run_update`) | workflow/config | event-driven (bash shell) | `get-shit-done/workflows/update.md` lines 510–519 (same file, existing for-loop) | exact |
| `tests/version-detection.test.cjs` (new file) | test | transform (static analysis + live install) | `tests/install-hooks-copy.test.cjs` + `tests/semver-compare.test.cjs` | role-match (exact pattern combination) |

---

## Pattern Assignments

### `bin/install.js` — lines 58–73 (installer utility, transform)

**Analog:** `bin/install.js` lines 58–73 (the block being replaced) + `bin/install.js` line 61 (`execSync` import pattern)

**Existing block to replace** (lines 58–73):
```javascript
// Fetch HEAD SHA from GitHub for version display (fork uses SHA-based versioning)
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
```

**Silent-failure execSync pattern** — copy these structural elements:
- `let gsdVersion = <sentinel>` as module-scope variable initialised before try
- `const { execSync } = require('child_process')` inside try (already imported at line 61 — matches this exact pattern)
- `{ encoding: 'utf8', timeout: ..., windowsHide: true }` options object — matches existing call at line 65
- `.trim()` on the result before assignment — removes trailing newline from stdout
- regex guard on the result before trusting it — existing pattern uses `/^[0-9a-f]{40}$/`, replacement uses `/^[0-9a-f]{7}$/`
- empty catch with comment — matches existing catch at line 71–73

**Replacement block** (copy this exact structure):
```javascript
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

**Key constraints carried from analog:**
- Do NOT add any additional write-point overrides at line 5739 (VERSION write), line 5219 (manifest), or lines 5777/5786/5898/5904 (hook `{{GSD_VERSION}}` injection). All derive from the single module-scope `gsdVersion` variable — fix at initialization only.
- `windowsHide: true` must be present — matches existing `execSync` option at line 65.
- `--short=7` (with explicit length) rather than `--short` — guards against `core.abbrev` config variations.

---

### `get-shit-done/workflows/update.md` — `run_update` step (workflow, event-driven bash)

**Analog:** `get-shit-done/workflows/update.md` lines 510–519 (the existing cache-clear for-loops immediately preceding the insertion point)

**Existing for-loops** (lines 510–519, for reference):
```bash
for dir in "${CACHE_DIRS[@]}"; do
  if [ -n "$dir" ]; then
    rm -f "$dir/cache/gsd-update-check.json"
  fi
done

for dir in .claude .config/opencode .opencode .gemini .config/kilo .kilo .codex; do
  rm -f "./$dir/cache/gsd-update-check.json"
  rm -f "$HOME/$dir/cache/gsd-update-check.json"
done
```

**Line to add** (append immediately after line 519, outside and after both for-loops):
```bash
# The worker (gsd-check-update.js) writes to a shared OS cache path — not a
# runtime-dir subpath. Clear it unconditionally once, outside the per-runtime loop.
rm -f "$HOME/.cache/gsd/gsd-update-check.json"
```

**Structural constraint:** This line goes AFTER the closing `done` of the second for-loop (line 519), not inside any loop body. The `~/.cache/gsd/` path is runtime-agnostic (written by `gsd-check-update-worker.js` at `path.join(os.homedir(), '.cache', 'gsd', 'gsd-update-check.json')` — verified at hooks/gsd-check-update.js lines 35–36).

**No-change verification:** Lines 108, 216, 226 (`grep -Eq '^[0-9a-f]{7}'` gate and INSTALLED_VERSION logic) — do NOT modify. The comparison mechanism is correct per D-06.

---

### `tests/version-detection.test.cjs` (new test file, unit test, static analysis + live)

**Primary analog:** `tests/install-hooks-copy.test.cjs` — static analysis of install.js source using `fs.readFileSync` + `describe`/`test`/`assert.ok`

**Secondary analog:** `tests/semver-compare.test.cjs` — static analysis of a worker source file using `fs.readFileSync` on a source path, with multi-assertion `describe` blocks

**File header pattern** (copy from `tests/install-hooks-copy.test.cjs` lines 1–21):
```javascript
/**
 * [Brief description of what this test file covers]
 */
'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { cleanup, createTempDir, createTempGitProject } = require('./helpers.cjs');

const INSTALL_SRC = path.join(__dirname, '..', 'bin', 'install.js');
```

**Static analysis test pattern** (copy from `tests/semver-compare.test.cjs` lines 17–18 and `tests/install-hooks-copy.test.cjs` lines 143–174):
```javascript
// Load source as string for static analysis assertions
const installSrc = fs.readFileSync(INSTALL_SRC, 'utf8');

describe('INST-01: install.js uses git rev-parse for version', () => {
  test('install.js source contains git rev-parse --short', () => {
    assert.ok(
      installSrc.includes('git rev-parse'),
      'install.js must use git rev-parse for SHA-based versioning'
    );
  });

  test('install.js module-scope does not call GitHub API for version', () => {
    const moduleScope = installSrc.slice(0, installSrc.indexOf('\nfunction '));
    assert.ok(
      !moduleScope.includes('api.github.com/repos/thamwangjun/get-shit-done/commits'),
      'install.js module-scope must not call GitHub API for gsdVersion'
    );
  });
});

describe('INST-02: install.js fallback is a non-SHA sentinel string', () => {
  test('install.js does not fall back to pkg.version (semver)', () => {
    assert.ok(
      !installSrc.includes("let gsdVersion = pkg.version"),
      'install.js must not fall back to pkg.version (semver breaks SHA comparison)'
    );
  });

  test('install.js has a named non-SHA sentinel as fallback', () => {
    assert.ok(
      installSrc.includes("'no-network'") || installSrc.includes('"no-network"'),
      'install.js must have no-network sentinel as initial gsdVersion value'
    );
  });
});
```

**Live install test pattern** — use `createTempGitProject` / `createTempDir` from helpers.cjs (lines 86–108 of helpers.cjs):
- `createTempGitProject()` returns a temp dir with `.git/` and an initial commit — use for INST-01 live test
- `createTempDir()` returns a bare temp dir (no `.git/`) — use for INST-02 non-git test
- `cleanup(tmpDir)` in `afterEach` — mandatory per existing test pattern

**`beforeEach`/`afterEach` lifecycle pattern** (copy from `tests/install-hooks-copy.test.cjs` lines 84–93):
```javascript
describe('INST-01: VERSION contains 7-char hex SHA when git available', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject('gsd-ver-det-');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // ... test bodies ...
});
```

**UPD-02 static analysis pattern** (copy from `tests/semver-compare.test.cjs` pattern for reading a workflow source file and asserting structural properties):
```javascript
const UPDATE_MD = path.join(__dirname, '..', 'get-shit-done', 'workflows', 'update.md');
const updateSrc = fs.readFileSync(UPDATE_MD, 'utf8');

describe('UPD-02: update.md cache-clear includes shared cache path', () => {
  test('update.md run_update step clears ~/.cache/gsd/ path', () => {
    assert.ok(
      updateSrc.includes('.cache/gsd/gsd-update-check.json'),
      'update.md must clear $HOME/.cache/gsd/gsd-update-check.json (worker write path)'
    );
  });
});
```

---

## Shared Patterns

### Silent-Failure execSync
**Source:** `bin/install.js` lines 58–73 (the existing block)
**Apply to:** The replacement block in the same file
```javascript
try {
  const { execSync } = require('child_process');
  // ... external process call ...
  const result = execSync('...', {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  }).trim();
  if (/<validation regex>/.test(result)) {
    variable = result;
  }
} catch (e) {
  // Descriptive comment — variable stays as sentinel
}
```

### Static Source Analysis in Tests
**Source:** `tests/install-hooks-copy.test.cjs` lines 143–257 and `tests/semver-compare.test.cjs` lines 17–99
**Apply to:** `tests/version-detection.test.cjs` (INST-01, INST-02, UPD-02 assertions)

Pattern: read source file as string at describe-block scope, assert `includes()`/`!includes()` / regex match on the string. Avoids executing the installer or workflow.

### `GSD_TEST_MODE = '1'` Guard
**Source:** `tests/install-hooks-copy.test.cjs` line 11
**Apply to:** `tests/version-detection.test.cjs` — must be set before `require(INSTALL_SRC)` if the test requires install.js exports
```javascript
process.env.GSD_TEST_MODE = '1';
```

### `createTempGitProject` for Live Git Tests
**Source:** `tests/helpers.cjs` lines 86–104
**Apply to:** `tests/version-detection.test.cjs` INST-01 live assertion (needs a real git repo with a commit for `git rev-parse HEAD` to succeed)
```javascript
const tmpDir = createTempGitProject('gsd-ver-det-');
// tmpDir contains: .git/, .planning/, an initial commit
// git rev-parse --short=7 HEAD produces a valid 7-char SHA here
```

---

## No Analog Found

All three files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

---

## Metadata

**Analog search scope:** `bin/`, `get-shit-done/workflows/`, `tests/`
**Files scanned:** `bin/install.js`, `get-shit-done/workflows/update.md`, `tests/install-hooks-copy.test.cjs`, `tests/semver-compare.test.cjs`, `tests/helpers.cjs`
**Pattern extraction date:** 2026-04-17
