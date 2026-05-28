---
id: plan-01
title: "Eta Setup & Phase 44 Cleanup"
phase: "45"
status: pending
depends_on: []
requirements: [INTG-01, INTG-04, INTG-05, INTG-06]
wave: 1
autonomous: true
files_modified:
  - package.json
  - bin/install.js
  - tests/resolve-includes.test.cjs

must_haves:
  truths:
    - "D-01: `eta` appears in `dependencies` in package.json (not devDependencies)"
    - "D-04: Module-level Eta instance exists in bin/install.js with autoEscape:false, useWith:true, tags:['{%','%}'], parse:{raw:'~'}, views=path.join(__dirname,'..')"
    - "D-11: `copyWithPathReplacement()` calls `content = eta.renderString(content, {})` immediately after `fs.readFileSync(srcPath, 'utf8')` at line ~6572, before any path-substitution regexes"
    - "D-12: Agent install loop calls `content = eta.renderString(content, {})` immediately after `fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8')` at line ~8786, before path-substitution regexes"
    - "D-05: `resolveIncludes()` function (lines 1760-1885) is deleted from bin/install.js"
    - "D-16: `resolveIncludes` is removed from `module.exports` block (line ~11540)"
    - "D-17: `tests/resolve-includes.test.cjs` is deleted"
    - "D-13: `applyRuntimeContentRewritesInPlace` (skills path) receives no Eta rendering call — confirmed 0 install-time include refs in SKILL.md files"
    - "`npm test` passes with no new failures after the changes"
  artifacts:
    - path: "package.json"
      provides: "eta in dependencies block"
      contains: '"eta"'
    - path: "bin/install.js"
      provides: "Eta instance and wiring"
      contains: "new Eta("
  key_links:
    - from: "bin/install.js Eta instance"
      to: "copyWithPathReplacement() line ~6572"
      via: "eta.renderString(content, {})"
      pattern: "eta\\.renderString"
    - from: "bin/install.js Eta instance"
      to: "agent install loop line ~8786"
      via: "eta.renderString(content, {})"
      pattern: "eta\\.renderString"
---

## Goal

Wire Eta v4 into `bin/install.js` as the install-time template renderer, then remove Phase 44's `resolveIncludes()` implementation and its associated test file.

## Tasks

### Task 1: Verify CJS import, add eta dependency, and run npm install

**Files:** `package.json`

**Steps:**

1. Before touching `package.json`, verify that `const { Eta } = require('eta')` works with Eta v4. Run:
   ```
   node -e "const { Eta } = require('eta'); const e = new Eta({}); console.log('ok');"
   ```
   If this fails with a module-not-found error (expected — eta is not yet installed), proceed to step 2. If it fails with a syntax or property error after install, stop and escalate — the CJS path may be broken in this version.

2. Add `eta` to `dependencies` in `package.json` (per D-01 — runtime dep, not devDep, because `npx get-shit-done-redux` installs dependencies at runtime; no build step). The `dependencies` block is at line 54. Add `"eta": "^4.6.0"` alongside `@anthropic-ai/claude-agent-sdk` and `ws`.

3. Run `npm install` to install eta and update `package-lock.json`.

4. Re-run the CJS import verification:
   ```
   node -e "const { Eta } = require('eta'); const e = new Eta({ autoEscape: false }); console.log('CJS import verified:', typeof e.renderString);"
   ```
   The output must include `CJS import verified: function`. If the output shows `undefined` or an error, halt — the CJS build of eta v4 is broken and the plan must be revised.

**Verification:** `node -e "const { Eta } = require('eta'); console.log('ok')"` exits 0 and prints `ok`. `cat package.json | grep '"eta"'` returns a line with `"eta": "^4.6.0"`.

**Done:** `eta` appears in `package.json` `dependencies` block and can be required via CJS without error.

---

### Task 2: Create Eta instance and wire into both copy loops in bin/install.js

**Files:** `bin/install.js`

**Steps:**

1. Near the top of `bin/install.js`, after the existing `require()` calls and before the first function definition, add a `// ─── Eta Template Engine ───` section banner and create the module-level Eta instance (per D-02, D-03, D-04, D-15):

   ```javascript
   // ─── Eta Template Engine ───
   const { Eta } = require('eta');
   // sourceRoot = repo root (contains get-shit-done/, agents/, commands/)
   // bin/install.js lives one level inside: path.join(__dirname, '..') resolves to repo root
   const _etaSourceRoot = path.join(__dirname, '..');
   const eta = new Eta({
     views: _etaSourceRoot,
     tags: ['{%', '%}'],
     parse: { raw: '~' },
     useWith: true,
     autoEscape: false,
   });
   ```

   Place this block in the module-level constants area (around lines 1572–1750) rather than at file top, to stay near the content-processing cluster as noted in the discretion section of CONTEXT.md.

2. Wire Eta rendering into `copyWithPathReplacement()` (per D-11). At line 6572, the existing code reads:
   ```javascript
   let content = fs.readFileSync(srcPath, 'utf8');
   ```
   Immediately after that line, before the `if (!isCopilot && !isAntigravity)` block, insert:
   ```javascript
   content = eta.renderString(content, {});
   ```
   This makes Eta the **first** transform step, before path substitution regexes.

3. Wire Eta rendering into the agent install loop (per D-12). At line 8786, the existing code reads:
   ```javascript
   let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
   ```
   Immediately after that line, before the `const dirRegex = /~\/\.claude\//g;` block, insert:
   ```javascript
   content = eta.renderString(content, {});
   ```

4. Confirm `applyRuntimeContentRewritesInPlace` (skills path) receives no Eta call (per D-13). Grep for `applyRuntimeContentRewritesInPlace` and confirm no adjacent Eta call is introduced.

**Verification:**
```bash
node -e "
const path = require('path');
process.env.GSD_TEST_MODE = '1';
const m = require('./bin/install.js');
console.log('eta wired:', typeof m.resolveIncludes === 'undefined' ? 'resolveIncludes removed' : 'still present');
"
```
Also: `command grep -n "eta.renderString" bin/install.js` must return exactly 2 lines (one for each wiring point).

**Done:** Two `eta.renderString(content, {})` calls exist in `bin/install.js` — one inside `copyWithPathReplacement()` immediately after the `readFileSync` at line ~6572, one inside the agent install loop immediately after the `readFileSync` at line ~8786.

---

### Task 3: Remove resolveIncludes and delete its test file

**Files:** `bin/install.js`, `tests/resolve-includes.test.cjs`

**Steps:**

1. Delete the `resolveIncludes()` function from `bin/install.js`. The function starts with the JSDoc block at line ~1750 (`/** Resolve @-reference...`) and ends at line ~1885 (the closing `}` after `return result.join('\n');`). Remove the entire block including its JSDoc comment.

2. Remove `resolveIncludes,` from the `module.exports` block at line ~11540 (per D-16). The entry is on its own line — remove the line entirely.

3. Delete `tests/resolve-includes.test.cjs` (per D-17):
   ```bash
   rm tests/resolve-includes.test.cjs
   ```

4. Run `npm test` to confirm the test suite still passes. The deleted test file's 5 tests will no longer run (expected). Watch for any other test that imports or references `resolveIncludes` — fix those if found.

**Verification:**
```bash
npm test 2>&1 | tail -20
```
Must show passing test suite with no new failures. `command grep -n "resolveIncludes" bin/install.js` must return 0 lines.

**Done:** `resolveIncludes` is absent from `bin/install.js` (function and export removed). `tests/resolve-includes.test.cjs` does not exist. `npm test` passes.

## Success Criteria

- `package.json` contains `"eta": "^4.6.0"` in the `dependencies` block
- `node -e "const { Eta } = require('eta'); console.log('ok')"` exits 0
- `command grep -c "eta.renderString" bin/install.js` returns `2`
- `command grep -c "resolveIncludes" bin/install.js` returns `0`
- `tests/resolve-includes.test.cjs` does not exist
- `npm test` passes with no new failures

## Verification

```bash
# CJS import works
node -e "const { Eta } = require('eta'); console.log('ok')"

# eta in dependencies
node -e "const p = require('./package.json'); console.log(p.dependencies.eta)"

# Two wiring points exist
command grep -n "eta.renderString" bin/install.js

# resolveIncludes is gone
command grep -c "resolveIncludes" bin/install.js

# Test file is deleted
test ! -f tests/resolve-includes.test.cjs && echo "deleted"

# Full test suite
npm test
```
