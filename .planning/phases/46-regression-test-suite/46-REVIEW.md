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
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 46: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the `bin/install.js` installer (Eta engine wiring), `tests/bug-phase45-eta-wiring.test.cjs` (INTG integration tests), and `tests/install-eta-regression.test.cjs` (render-pipeline regression tests).

`bin/install.js` has correct Eta instance configuration — default delimiters, `autoEscape: false`, `useWith: true`, `views` pointing to `_etaSourceRoot` (repo root), and a `resolvePath` override anchoring all includes to the views root. The `renderEtaContent` export creates a fresh per-call Eta instance, correctly isolating test invocations from the global instance.

The test suite has no critical defects. Four warnings involve test assertions that are either regex-quote-blind (can produce false negatives) or vacuously pass when guarded directories or files are absent. These do not represent failures in the current repo state but are real gaps that could silently miss regressions if the codebase evolves.

## Warnings

### WR-01: Delimiter-absence regexes are single-quote-only — double-quoted variants bypass the check

**File:** `tests/bug-phase45-eta-wiring.test.cjs:65` and `:74`
**Issue:** The two `assert.doesNotMatch` assertions that verify custom Eta delimiter config is absent use regexes that only match single-quoted string literals:

- Line 65: `/tags\s*:\s*\[.*'\{%'.*'%}'.*\]/` — matches `'{%'` but not `"{%"`
- Line 74: `/parse\s*:\s*\{[^}]*raw\s*:\s*'~'[^}]*\}/` — matches `'~'` but not `"~"`

Since the assertion is `doesNotMatch`, a developer who writes the banned config using double quotes would get a false pass. The tests intend to assert that no custom delimiter/raw-prefix config exists; the regex should be quote-agnostic.

**Fix:**
```js
// Line 65 — match single OR double quotes
assert.doesNotMatch(
  installSrc,
  /tags\s*:\s*\[.*['"][{]%['"].*['"]%}['"].*\]/,
  'Eta instance must use default delimiters ...'
);

// Line 74 — match single OR double quotes
assert.doesNotMatch(
  installSrc,
  /parse\s*:\s*\{[^}]*raw\s*:\s*['"]~['"][^}]*\}/,
  'Eta instance must use default raw prefix ...'
);
```

---

### WR-02: "views points to repo root" test checks pattern co-existence, not binding identity

**File:** `tests/bug-phase45-eta-wiring.test.cjs:86-90`
**Issue:** The test verifies the Eta `views` config with two separate regexes: one matching any variable assigned `path.join(__dirname, '..')`, and another matching `views: _etaSourceRoot`. These are tested independently with `&&` — the test would pass if `_someOtherVar = path.join(__dirname, '..')` exists elsewhere in the file for an unrelated purpose and `views: _etaSourceRoot` is set to a different value entirely.

```js
const definesParentDirVar = /(?:const|let|var)\s+\w+\s*=\s*path\.join\(__dirname,\s*['"]\.\.['"]\s*\)/.test(installSrc);
const viewsSetToVar = /views\s*:\s*_etaSourceRoot/.test(installSrc);
// Both true if ANY var = path.join(__dirname, '..'), even if _etaSourceRoot != parent dir
assert.ok((definesParentDirVar && viewsSetToVar) || viewsSetInline, ...);
```

The current code happens to be correct (`_etaSourceRoot = path.join(__dirname, '..')` and `views: _etaSourceRoot` are both present and consistent), but the test would not catch a regression where `_etaSourceRoot` is reassigned to a different path.

**Fix:** Add a targeted regex that matches the specific assignment in one shot:
```js
const etaSourceRootIsParentDir = /const\s+_etaSourceRoot\s*=\s*path\.join\(__dirname,\s*['"]\.\.['"]\s*\)/.test(installSrc);
const viewsUsesEtaSourceRoot = /views\s*:\s*_etaSourceRoot/.test(installSrc);
assert.ok(
  etaSourceRootIsParentDir && viewsUsesEtaSourceRoot,
  'Eta views must use _etaSourceRoot = path.join(__dirname, "..")'
);
```

---

### WR-03: INTG-02 and INTG-03 directory walkers silently pass when guarded directory is absent

**File:** `tests/bug-phase45-eta-wiring.test.cjs:139` and `:223`
**Issue:** Both `findBareLineAtTildeRefs` and the INTG-03 walker use an existence guard before walking:

```js
if (fs.existsSync(dir)) {
  walkDir(dir);
}
return survivors; // empty — test passes vacuously
```

If `commands/gsd/`, `agents/`, `get-shit-done/workflows/`, or `get-shit-done/references/` were accidentally deleted or the repo root changed, all four INTG-02 tests and the INTG-03 test would pass with 0 survivors — giving a false green signal. The same applies to the INTG-03 `agentsDir` guard at line 223.

**Fix:** Assert that the directory exists and contains at least one `.md` file before evaluating survivors:
```js
assert.ok(fs.existsSync(dir), `Source directory must exist: ${dir}`);
const survivors = findBareLineAtTildeRefs(dir);
assert.strictEqual(survivors.length, 0, ...);
```

---

### WR-04: INTG-06 never asserts that any SKILL.md files were found — passes vacuously

**File:** `tests/bug-phase45-eta-wiring.test.cjs:239-294`
**Issue:** The `INTG-06` test calls `findSkillFiles(REPO_ROOT)` and iterates over results. Currently there are zero `SKILL.md` files in the repository. The test therefore always passes with `survivors.length === 0` without having checked any file.

```js
const skillFiles = findSkillFiles(REPO_ROOT);
// skillFiles.length === 0 today — loop body never runs
for (const filePath of skillFiles) { ... }
assert.strictEqual(survivors.length, 0, ...); // trivially true
```

The test provides zero coverage value in the current repo state and would not catch a regression if a `SKILL.md` with bare `@~/.claude/` refs were added.

**Fix:** Add a guard assertion, or skip the test with a clear note when no files exist:
```js
const skillFiles = findSkillFiles(REPO_ROOT);
if (skillFiles.length === 0) {
  // No SKILL.md files in repo — test is vacuous. Skip rather than false-green.
  return;
}
// ... rest of test
```
Alternatively, require at least one `SKILL.md` to exist: `assert.ok(skillFiles.length > 0, 'Expected at least one SKILL.md to validate')`.

---

## Info

### IN-01: Orphaned JSDoc block for installRuntimeArtifacts separated from function definition

**File:** `bin/install.js:6257-6264`
**Issue:** A JSDoc comment documenting `installRuntimeArtifacts` (params: `runtime`, `configDir`, `scope`, `resolvedProfile`) appears at line 6257, but the actual `function installRuntimeArtifacts` declaration is at line 6299, separated by the `_snapshotDir` and `_restoreDir` helper functions. Most tooling (IDEs, documentation generators) will associate the JSDoc with `_snapshotDir` instead.

**Fix:** Move the JSDoc block to immediately precede `function installRuntimeArtifacts` at line 6299. The existing JSDoc on `_snapshotDir` at lines 6265-6270 is correctly placed and should remain.

---

### IN-02: Duplicated walkDir logic in INTG-02 and INTG-03

**File:** `tests/bug-phase45-eta-wiring.test.cjs:114-137` and `204-220`
**Issue:** The inner `walkDir` function is defined with near-identical logic in both `findBareLineAtTildeRefs` (called by INTG-02) and the INTG-03 anonymous block. The only difference is the pattern applied per line. This duplication makes future changes (e.g., adding `.yaml` file support) require edits in multiple places.

**Fix:** Extract a shared `walkMdFiles(dir)` helper that returns all `.md` file paths (similar to the `walkMdFiles` already defined in `install-eta-regression.test.cjs`), then apply patterns over the returned paths in each test.

---

### IN-03: TEST-01 header comment misstates what the test checks

**File:** `tests/install-eta-regression.test.cjs:3`
**Issue:** The file header says "TEST-01 checks installed skills output" but the test actually walks **all** `.md` files produced by `installRuntimeArtifacts` — including agents, commands, and workflows — not only skill files.

**Fix:** Update the comment to: `// TEST-01 checks all installed .md file output for unresolved @~/.claude/ bare-line references`.

---

_Reviewed: 2026-05-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
