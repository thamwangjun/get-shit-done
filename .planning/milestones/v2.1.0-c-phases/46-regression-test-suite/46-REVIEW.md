---
phase: 46-regression-test-suite
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/install.js
  - tests/bug-phase45-eta-wiring.test.cjs
  - tests/install-eta-regression.test.cjs
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 46: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the `bin/install.js` installer (Eta engine wiring and the `renderEtaContent` export), `tests/bug-phase45-eta-wiring.test.cjs` (INTG-01 through INTG-06 source-level checks), and `tests/install-eta-regression.test.cjs` (TEST-01 through TEST-05 render-pipeline regression tests).

The `renderEtaContent` implementation in `bin/install.js` is functionally correct — circular-include detection wraps `RangeError` to a descriptive `Error`, `EtaFileResolutionError` is rethrown correctly, and the per-call fresh Eta instance prevents global state pollution. The `autoEscape: false`, `useWith: true`, and `views: _etaSourceRoot` configuration is validated by INTG-01 assertions that hold against the current source.

One critical defect was found: TEST-01 in `install-eta-regression.test.cjs` does not exercise Eta rendering at all. The call to `installRuntimeArtifacts('claude', tmpDir, 'global', ...)` installs only SKILL.md files through a path that never invokes `renderEtaContent`, making the core regression assertion vacuously true regardless of whether Eta rendering is wired or broken. Three warnings were found covering a dead global Eta instance, vacuously-passing tests for missing SKILL.md files, and silent guards on missing source directories.

## Critical Issues

### CR-01: TEST-01 does not exercise Eta rendering — test passes vacuously

**File:** `tests/install-eta-regression.test.cjs:52-70`

**Issue:** `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)` resolves to the `skillsKind` layout for `claude + global` scope (per `runtime-artifact-layout.cjs:234`). This routes exclusively through:

1. `applyRuntimeContentRewritesInPlace` — path-replacement only, no `renderEtaContent` call.
2. `_copyStaged` — raw `fs.copyFileSync`, no transformation of any kind.

No agent `.md` files (the only files containing `<%~ include(...) %>` directives) are written to `tmpDir` by this code path. SKILL.md files, which are the only files installed, do not contain `@~/.claude/` bare-line references at source level (INTG-06 checks this). Consequently the assertion `!/^@~\/.claude\//m.test(content)` passes for every file in `tmpDir` regardless of whether `renderEtaContent` is wired, misconfigured, or deleted entirely.

This means a regression in Eta rendering of agent files — the exact failure mode Phase 45 was designed to prevent — would not be caught by this test.

**Fix:** Replace the `installRuntimeArtifacts` call with a direct invocation of `renderEtaContent` on a known agent that contains `include()` directives, then assert the `@~` reference is absent from the rendered output:

```javascript
test('Rendering gsd-executor.md with Eta leaves no bare @~/.claude/ refs', () => {
  const srcPath = path.join(REPO_ROOT, 'agents', 'gsd-executor.md');
  assert.ok(fs.existsSync(srcPath), `Agent source not found: ${srcPath}`);
  const source = fs.readFileSync(srcPath, 'utf8');
  const rendered = renderEtaContent(source, srcPath, REPO_ROOT);
  assert.ok(
    !/^@~\/.claude\//m.test(rendered),
    `Unresolved bare-line @~/.claude/ found in rendered output of ${srcPath}`
  );
});
```

---

## Warnings

### WR-01: Dead global `eta` instance in `bin/install.js`

**File:** `bin/install.js:1753-1765`

**Issue:** The module-scope `const eta = new Eta({...})` instance at line 1753, including its `resolvePath` override at line 1762, is never used. `renderEtaContent` — the sole Eta rendering function in the file — creates a fresh `Eta` instance on every call (lines 6419-6426) and does not reference the global `eta` variable. The only reference to `eta` after declaration is the `resolvePath` property assignment at line 1762. No `eta.renderString` or `eta.render` calls exist anywhere in the file.

This dead instance allocates resources on every `require('../bin/install.js')` and misleads readers into thinking it is the active rendering instance, when it is not.

**Fix:** Remove lines 1753-1765 (the `const eta = new Eta({...})` declaration and the `eta.resolvePath = ...` override). `renderEtaContent` is self-contained.

---

### WR-02: INTG-06 passes vacuously — no SKILL.md files exist in repo

**File:** `tests/bug-phase45-eta-wiring.test.cjs:239-294`

**Issue:** `findSkillFiles(REPO_ROOT)` returns an empty array because there are no `SKILL.md` files in the repository outside `node_modules`. The `for (const filePath of skillFiles)` loop body never executes, and `assert.strictEqual(survivors.length, 0, ...)` trivially passes with no files inspected. A future commit that introduces a `SKILL.md` containing a bare `@~/.claude/get-shit-done/` reference would go undetected until the `SKILL.md` is added — at which point the test might flag it, but only if the developer runs the full suite.

**Fix:** Add a guard that skips or fails explicitly when no SKILL.md files are found, making the vacuous-pass visible:

```javascript
const skillFiles = findSkillFiles(REPO_ROOT);
// If no SKILL.md files exist, the test provides no coverage — skip rather than false-green.
if (skillFiles.length === 0) {
  // node:test's skip mechanism: return early with a note
  return; // or: test.skip(...)
}
```

Alternatively, if SKILL.md files are expected to exist at review time, add: `assert.ok(skillFiles.length > 0, 'Expected at least one SKILL.md to validate — none found')`.

---

### WR-03: INTG-02 and INTG-03 walkers silently pass when source directories are absent

**File:** `tests/bug-phase45-eta-wiring.test.cjs:139` and `223`

**Issue:** Both the `findBareLineAtTildeRefs` helper (INTG-02) and the INTG-03 walker guard their walks with `if (fs.existsSync(dir)) { walkDir(dir); }`. If a guarded directory (`commands/gsd/`, `agents/`, `get-shit-done/workflows/`, `get-shit-done/references/`) were absent — due to an accidental deletion, a repository restructure, or a test running from a wrong working directory — all tests in INTG-02 and INTG-03 would return `survivors.length === 0` and pass silently with zero files inspected.

```javascript
if (fs.existsSync(dir)) {
  walkDir(dir);
}
return survivors; // empty if dir missing — test passes vacuously
```

**Fix:** Assert existence before walking:

```javascript
assert.ok(fs.existsSync(dir), `Source directory must exist for this check: ${dir}`);
walkDir(dir);
```

---

## Info

### IN-01: `loadSkillsManifest` / `resolveProfile` execute at module scope for all tests

**File:** `tests/install-eta-regression.test.cjs:25-26`

**Issue:** `MANIFEST` and `RESOLVED_CORE` are computed at module scope, meaning `loadSkillsManifest(REAL_COMMANDS_DIR)` and `resolveProfile(...)` run unconditionally when the file is loaded — even when running only TEST-02 through TEST-05, which do not use `RESOLVED_CORE`. If `install-profiles.cjs` or `REAL_COMMANDS_DIR` throws during module initialization, all five test suites in the file fail with a misleading module-load error instead of a per-test failure.

**Fix:** Move lines 24-26 (`REAL_COMMANDS_DIR`, `MANIFEST`, `RESOLVED_CORE`) inside the TEST-01 `describe` block or into the TEST-01 test body so they only execute when that test runs.

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
