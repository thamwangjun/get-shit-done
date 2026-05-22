---
phase: 04-fix-background-update-check-hook
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - hooks/gsd-check-update-worker.js
  - hooks/gsd-statusline.js
  - tests/semver-compare.test.cjs
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the background update-check worker, the statusline hook, and the SHA-comparison test suite. The core SHA-equality logic introduced in this phase is correct and well-tested. No security vulnerabilities were found. Three warnings were identified: missing env-var guards that emit Node.js deprecation warnings, a stale-hook comparison that does not normalize SHA length, and a TOCTOU file-system race in the statusline. Four informational items cover a redundant guard expression, a test-isolation gap, a session-ID path check that does not filter null bytes, and a hardcoded GitHub URL.

## Warnings

### WR-01: `fs.existsSync` called with potentially `undefined` path when env vars are unset

**File:** `hooks/gsd-check-update-worker.js:24`

**Issue:** `process.env.GSD_PROJECT_VERSION_FILE` and `process.env.GSD_GLOBAL_VERSION_FILE` are read without a fallback. If the worker is invoked directly (outside the parent hook, e.g., during development or testing), both variables are `undefined`. `fs.existsSync(undefined)` currently emits a Node.js `DEP0187` deprecation warning and returns `false` — it does not crash — but Node.js reserves the right to make this a thrown error in a future major release, which would break the worker silently since the outer `try/catch` at line 23 would swallow it and leave `installed = 'unknown'`.

**Fix:**
```js
const projectVersionFile = process.env.GSD_PROJECT_VERSION_FILE || '';
const globalVersionFile  = process.env.GSD_GLOBAL_VERSION_FILE  || '';

// Guard at use-site:
if (projectVersionFile && fs.existsSync(projectVersionFile)) {
  installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
  ...
}
```

---

### WR-02: Stale-hook check does not normalize SHA length before comparison

**File:** `hooks/gsd-check-update-worker.js:63`

**Issue:** The comparison `hookVersion !== installed` is a raw string equality check. The VERSION file stores a 7-char SHA at install time, and hook headers embed the same value, so in the normal flow this works. However, if a VERSION file ever contains a full 40-char SHA (e.g., from a manual write or an installer bug), every managed hook with a 7-char header will be permanently reported as stale even though it is current. The `isNewer` function directly below normalizes via `slice(0, 7)`, but that normalization is not applied to the stale-hook comparison path.

**Fix:**
```js
// Normalize both sides to 7-char prefix before comparing
const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
if (norm(hookVersion) !== norm(installed) && !hookVersion.includes('{{')) {
  staleHooks.push({ file: hookFile, hookVersion, installedVersion: installed });
}
```

---

### WR-03: TOCTOU race in statusline todo-file sorting

**File:** `hooks/gsd-statusline.js:183`

**Issue:** `fs.statSync` is called on each todo file inside `Array.map()` after `fs.readdirSync`. If a file is deleted between the `readdirSync` and the `statSync` call (e.g., Claude Code cleans up session files during a context compaction), `statSync` throws `ENOENT`. This is caught by the outer `try/catch` at line 192, which silently swallows the error and returns an empty task — the user-visible impact is a momentary blank task field. However, the outer catch is broad and will also swallow unrelated errors in the same block, masking other bugs.

**Fix:** Add a per-file guard so `statSync` failures degrade gracefully without masking other errors:
```js
.map(f => {
  try {
    return { name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime };
  } catch (e) {
    return null; // file vanished between readdir and stat
  }
})
.filter(Boolean)
.sort((a, b) => b.mtime - a.mtime)
```

---

## Info

### IN-01: Redundant truthy guard before `isNewer()` call

**File:** `hooks/gsd-check-update-worker.js:83`

**Issue:** `update_available: latest && isNewer(latest, installed)` — the `latest &&` short-circuit is unnecessary because `isNewer` already returns `false` for any falsy `latest` via `!!latest` on line 78. The redundant check adds noise and diverges from the function's intended self-sufficient contract.

**Fix:**
```js
update_available: isNewer(latest, installed),
```

---

### IN-02: Test mirrors worker implementation without divergence detection

**File:** `tests/semver-compare.test.cjs:16`

**Issue:** The comment at the top of the file correctly documents that `isNewer()` is duplicated because the worker has no exports. However, there is no automated check that the two implementations stay in sync. If the worker's `isNewer` changes, the test will silently test a stale copy.

**Fix:** Consider moving `isNewer` into `get-shit-done/bin/lib/` (e.g., `update-check.cjs`) so both the worker and the test can `require()` it. Alternatively, the test could read the worker file and assert that the extracted function body matches the mirror.

---

### IN-03: Session ID path check does not filter null bytes

**File:** `hooks/gsd-statusline.js:141`

**Issue:** The guard `!/[/\\]|\.\./.test(session)` blocks slashes and `..` traversal sequences before constructing the bridge file path. It does not filter null bytes (`\0`). On POSIX systems a null byte in a path is rejected at the syscall level, so this is not exploitable in practice, but it is a minor defense-in-depth gap.

**Fix:**
```js
const sessionSafe = session && !/[/\\]|\.\.|[\x00]/.test(session);
```

---

### IN-04: Hardcoded GitHub API URL references personal fork

**File:** `hooks/gsd-check-update-worker.js:97`

**Issue:** The update-check URL `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` is a magic string. If the repository is renamed, moved, or the branch changes, finding this string requires a code search rather than changing a named constant.

**Fix:** Extract to a named constant at the top of the file:
```js
const GSD_REPO_COMMITS_URL =
  'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main';
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
