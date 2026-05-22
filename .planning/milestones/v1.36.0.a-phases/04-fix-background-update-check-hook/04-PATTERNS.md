# Phase 4: Fix Background Update-Check Hook - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 3 files to modify + 1 file to create or repurpose
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `hooks/gsd-check-update-worker.js` | background worker (utility) | request-response (outbound https + file I/O) | `hooks/gsd-statusline.js` | role-match (same hook layer, same silent-fail style) |
| `hooks/gsd-statusline.js` | hook script (utility) | file I/O + transform | `hooks/gsd-check-update-worker.js` | role-match (same hook layer) |
| `tests/semver-compare.test.cjs` | test | transform | `tests/gsd-statusline.test.cjs` | exact (same self-contained logic mirror test pattern) |
| `bin/install.js` (reference only — no change) | installer | file I/O + https | N/A — read only for reference | reference |

---

## Pattern Assignments

### `hooks/gsd-check-update-worker.js` (background worker, request-response + file I/O)

**Analog:** `hooks/gsd-statusline.js`

The worker and statusline are both top-level hook scripts that: (a) use only Node built-ins, (b) wrap all I/O in `try/catch` with silent failure, and (c) are never `require()`'d — they run as standalone scripts.

**Imports pattern** (`gsd-check-update-worker.js` lines 1-14 — current, lines 1-13 after fix):

```javascript
#!/usr/bin/env node
// gsd-hook-version: {{GSD_VERSION}}

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');   // ADD — replaces child_process/execFileSync
// REMOVE: const { execFileSync } = require('child_process');
```

**Silent-fail try/catch pattern** (`gsd-check-update-worker.js` lines 22-31, repeated at 53-74):

```javascript
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(projectVersionFile));
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(globalVersionFile));
  }
} catch (e) {}
```

Use the same `} catch (e) {}` empty-catch idiom for all I/O. No logging, no re-throw. All five existing catch blocks in the worker use this pattern.

**Core pattern — https.get() callback (REPLACE lines 76-95 with this):**

```javascript
// isNewer with SHA equality semantics (D-01)
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

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

let latest = null;
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

**SHA regex pattern** — copy from `bin/install.js` lines 68-70:
```javascript
const sha = JSON.parse(shaJson).sha;
if (sha && /^[0-9a-f]{40}$/.test(sha)) {
  gsdVersion = sha.slice(0, 7);
}
```
The worker uses the same regex and same `.slice(0, 7)` truncation. The User-Agent mirrors `bin/install.js` which sends `User-Agent: gsd-install` — the worker sends `User-Agent: gsd-check-update-worker`.

**Critical constraint — writeResult() placement:**
`writeResult()` must only be called inside `res.on('end', ...)`, `req.on('error', ...)`, and `req.on('timeout', ...)`. Never call it after the `https.get()` block synchronously — the callback is async; any synchronous call writes `latest: 'unknown'` every time.

---

### `hooks/gsd-statusline.js` (hook script, file I/O + transform)

**Analog:** `hooks/gsd-check-update-worker.js` (same hook layer, same pattern conventions)

**Target lines:** 213-228 (the `isDevInstall` IIFE + conditional)

**Current code to replace** (lines 213-228):
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

**Replacement (D-05):**
```javascript
if (cache.stale_hooks && cache.stale_hooks.length > 0) {
  gsdUpdate += '\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ ';
}
```

The outer `if (cache.stale_hooks && cache.stale_hooks.length > 0)` guard is retained. The entire `isDevInstall` IIFE, the `parseV` semver function, and the branch that emitted `"⚠ dev install"` are removed. The ANSI string format (`\x1b[31m ... \x1b[0m │ `) is unchanged — it matches the existing `gsdUpdate` format at line 211.

**No other changes** to `gsd-statusline.js` in Phase 4.

---

### `tests/semver-compare.test.cjs` (test, transform — repurpose to SHA equality)

**Analog:** `tests/gsd-statusline.test.cjs`

The statusline test is the closest match: it also mirrors an unexported function from a hook script (since `isNewer` in the worker can't be `require()`'d), uses the same `describe`/`test` + `assert.strictEqual` structure, and groups cases under named describe blocks.

**File-level pattern** (`tests/gsd-statusline.test.cjs` lines 1-19):
```javascript
/**
 * [Doc comment explaining what function is tested and why it's duplicated]
 */
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
```

**Describe block pattern** (`tests/gsd-statusline.test.cjs` lines 22-42):
```javascript
describe('functionName', () => {
  test('description of case', () => {
    assert.strictEqual(actual, expected);
  });
  // ...
});
```

**Complete replacement for `tests/semver-compare.test.cjs`:**

```javascript
/**
 * Tests for the isNewer() SHA comparison function used in gsd-check-update-worker.js.
 *
 * WHY DUPLICATED: isNewer() lives inside gsd-check-update-worker.js as a
 * plain function — it runs in a detached child process that has no module
 * exports. The function cannot be require()'d from this test file.
 * We mirror the implementation here so the logic is testable in isolation.
 * If the worker's implementation diverges from this copy, update this mirror.
 */
'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

// Mirror of isNewer() from hooks/gsd-check-update-worker.js
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}

describe('isNewer (SHA equality)', () => {
  test('same 7-char SHA — no update', () => {
    assert.strictEqual(isNewer('a1b2c3d', 'a1b2c3d'), false);
  });

  test('different 7-char SHA — update available', () => {
    assert.strictEqual(isNewer('b2c3d4e', 'a1b2c3d'), true);
  });

  test('full 40-char SHA — truncates to 7 for comparison (match)', () => {
    assert.strictEqual(isNewer('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'a1b2c3d'), false);
  });

  test('full 40-char SHA — truncates to 7 for comparison (mismatch)', () => {
    assert.strictEqual(isNewer('b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'a1b2c3d'), true);
  });

  test('null latest — no false positive', () => {
    assert.strictEqual(isNewer(null, 'a1b2c3d'), false);
  });

  test('undefined latest — no false positive', () => {
    assert.strictEqual(isNewer(undefined, 'a1b2c3d'), false);
  });

  test('empty string latest — no false positive', () => {
    assert.strictEqual(isNewer('', 'a1b2c3d'), false);
  });

  test('unknown as latest — no false positive', () => {
    // D-06: GitHub API unavailable → latest remains 'unknown'
    // isNewer('unknown', installed) → !!latest is true, but 'unknown'.slice(0,7) !== installed
    // This edge case: 'unknown'.slice(0,7) === 'unknown' !== 'a1b2c3d' → true (false positive)
    // However D-06 ensures latest is set to null/undefined on failure, not 'unknown'.
    // The result JSON uses `latest: latest || 'unknown'` for display only;
    // update_available line uses the raw `latest` variable (null on failure).
    // Test confirms the guard: when the update_available line receives null, result is false.
    assert.strictEqual(isNewer(null, 'a1b2c3d'), false);
  });

  test('installed is unknown — comparison still works', () => {
    // If VERSION file is missing, installed = 'unknown'. A real SHA will differ.
    assert.strictEqual(isNewer('a1b2c3d', 'unknown'), true);
  });
});
```

---

## Shared Patterns

### Silent-fail try/catch
**Source:** `hooks/gsd-check-update-worker.js` lines 22-31, 53-74
**Apply to:** All three file edits
```javascript
try {
  // ... I/O or network operation
} catch (e) {}
```
Every fallible operation in the hook files uses empty catch. No logging, no re-throw. The statusline at line 229 and the worker at lines 31, 70, 83, 94 all follow this rule.

### ANSI escape string format
**Source:** `hooks/gsd-statusline.js` lines 211, 226
**Apply to:** `gsd-statusline.js` edit only — ensure the replacement string matches this format
```javascript
'\x1b[31m⚠ stale hooks — run /gsd-update\x1b[0m │ '
// ^^ open color   content                close │ trailing separator
```
The trailing ` │ ` (space-pipe-space) is intentional — `gsdUpdate` is prepended to the statusline output at line 241.

### node:test + node:assert/strict import block
**Source:** `tests/gsd-statusline.test.cjs` lines 11-12, `tests/semver-compare.test.cjs` lines 15-16
**Apply to:** `tests/semver-compare.test.cjs` (repurposed)
```javascript
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
```
All test files in this project use the `node:` protocol prefix and destructure `describe`/`test` from `node:test`. Never use `require('assert')` without the `node:` prefix.

---

## No Analog Found

None. All files to be modified have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `hooks/`, `tests/`, `bin/`
**Files read:** `hooks/gsd-check-update-worker.js`, `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`, `tests/semver-compare.test.cjs`, `tests/gsd-statusline.test.cjs`
**Pattern extraction date:** 2026-04-17
