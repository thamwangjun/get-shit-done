---
phase: 04-fix-hooks-installation
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - bin/install.js
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

The phase 04 changes add an `ensureHooksDist(src)` helper function (lines 213–230) that builds `hooks/dist/` on-demand if it is absent, and update the success log message to reflect whether hooks were bundled or built from source (line 5824). The overall approach is sound and fixes the silent-skip bug. Two warnings and two info-level issues were found; no critical security issues were identified.

## Warnings

### WR-01: `spawnSync` spawn error (`result.error`) not surfaced in failure message

**File:** `bin/install.js:224-227`

**Issue:** When `spawnSync` fails to launch the process at the OS level (e.g., `buildScript` path does not exist, or the Node.js executable cannot be found), `result.status` is `null` and `result.error` is a non-null `Error` object, but `result.stderr` is an empty string. The current error handler logs `result.stderr` — which is empty — and exits without printing the actual spawn error, leaving the user with a blank "Could not build hooks/dist/:" message and no actionable information.

**Fix:**
```js
if (result.status !== 0) {
  console.error(`\n  ${yellow}Build failed!${reset} Could not build hooks/dist/:`);
  if (result.error) console.error(result.error.message);   // spawn-level error
  if (result.stderr) console.error(result.stderr);          // build-level stderr
  process.exit(1);
}
```

---

### WR-02: Missing existence check for `buildScript` before invoking `spawnSync`

**File:** `bin/install.js:218-220`

**Issue:** `buildScript` is constructed from `path.join(src, 'scripts', 'build-hooks.js')` without verifying that the file actually exists before passing it to `spawnSync`. If `scripts/build-hooks.js` is absent (e.g., an older install, a stripped npm publish, or an npm-packed tarball that omitted `scripts/`), Node.js exits with a `MODULE_NOT_FOUND` error and a large stack trace on stderr. WR-01's fix captures this error, but a pre-flight check gives a cleaner, more actionable message.

**Fix:**
```js
const buildScript = path.join(src, 'scripts', 'build-hooks.js');
if (!fs.existsSync(buildScript)) {
  console.error(`\n  ${yellow}Build failed!${reset} hooks/dist/ is missing and build script not found:`);
  console.error(`  ${buildScript}`);
  console.error(`  Re-install GSD or run: node scripts/build-hooks.js`);
  process.exit(1);
}
```

---

## Info

### IN-01: `require('child_process')` inside function body (inline require)

**File:** `bin/install.js:219`

**Issue:** `child_process` is already lazily required elsewhere in the file (line 61, inside a `try` block). Requiring it inside `ensureHooksDist` is not harmful — Node caches modules — but it is inconsistent with the surrounding style and adds a small amount of noise on each call. The module is always available in Node.js; there is no reason to defer it.

**Fix:** Hoist to the top-level requires (lines 1–8) alongside `fs`, `path`, and `os`:
```js
const { spawnSync } = require('child_process');
```
Then remove the inline `const { spawnSync } = require('child_process');` at line 219.

---

### IN-02: `builtFromSource` variable is unused for Codex/Copilot/Cursor/Windsurf/Trae/Cline runtimes

**File:** `bin/install.js:5772, 5774`

**Issue:** `ensureHooksDist(src)` is called unconditionally (line 5772) and its return value is captured in `builtFromSource`. However, the hooks installation block that uses `builtFromSource` (line 5824) is gated behind `if (!isCodex && !isCopilot && !isCursor && !isWindsurf && !isTrae && !isCline)`. For those runtimes, `builtFromSource` is computed but never read. This is a minor logic smell — the variable is always safe, but the on-demand build still runs even for runtimes that will not install hooks.

**Fix (option A — cosmetic):** Add a comment:
```js
// builtFromSource is only used in the Claude/Qwen hooks install block below;
// ensureHooksDist is called unconditionally so the build runs before the branch.
const builtFromSource = ensureHooksDist(src);
```

**Fix (option B — behavioural):** Move `ensureHooksDist` inside the `if (!isCodex && ...)` block so the build is skipped for runtimes that don't install hooks:
```js
if (!isCodex && !isCopilot && !isCursor && !isWindsurf && !isTrae && !isCline) {
  const builtFromSource = ensureHooksDist(src);
  // ... rest of hooks install ...
}
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
