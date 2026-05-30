# Phase 46: Regression Test Suite — Research

**Researched:** 2026-05-29
**Domain:** Eta v4 delimiter normalization + Node.js test suite for install-time rendering pipeline
**Confidence:** HIGH

## Summary

Phase 46 has two independent plans. Plan 01 removes a custom Eta delimiter configuration (`{%`/`%}`) from `bin/install.js` and replaces all `{%~ include(` tags across 83 confirmed source files with the Eta default `<%~ include(`. Plan 02 adds five regression tests in a new file `tests/install-eta-regression.test.cjs` that exercise every critical failure mode of the Eta v4 pipeline wired in Phase 45.

All implementation decisions are already locked in CONTEXT.md. This research supplies the exact line-level findings and verified behavior needed for precise task descriptions.

**Primary recommendation:** The plan can proceed directly from CONTEXT.md decisions. The only discretionary gap is the TEST-04/TEST-05 invocation mechanism — research confirms that a thin exported helper (`renderEtaContent`) requires the fewest test scaffolding lines and avoids a full `installRuntimeArtifacts` call for error-path tests.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Remove `tags: ['{%', '%}']` and `parse: { raw: '~' }` from the Eta constructor in `bin/install.js` (lines ~1753–1760). Eta's default delimiters `<%` / `%>` work identically — there is no collision with `{{ }}` notation in GSD files, and `<%` / `%>` appear zero times in any source file.
- **D-02:** Replace all `{%~ include(` with `<%~ include(` and all closing `%}` on include lines with `%>` across the converted source files. A conversion script (Node.js or sed one-liner) should handle this atomically with a post-conversion grep verification confirming zero `{%~ include` survivors.
- **D-03:** After conversion, run `npm test` to confirm zero regressions before proceeding to Plan 02.
- **D-04:** All 5 tests live in one new file: `tests/install-eta-regression.test.cjs`. Runnable in isolation via `node --test tests/install-eta-regression.test.cjs`.
- **D-05:** All tests use `createTempDir()` from `tests/helpers.cjs` as the `configDir` — never the live `~/.claude/` installation. `cleanup(tmpDir)` runs in `afterEach`.
- **D-06:** **TEST-01** — Install Claude runtime to a temp dir via `installRuntimeArtifacts('claude', tmpDir, 'global', profile)`. Walk all installed `.md` files recursively. Assert zero matches for `/@~\/.claude\//`. Full tree scan, not spot-check.
- **D-07:** **TEST-02** — Same Claude runtime install. Find the installed copy of `execute-phase.md`. Assert the conditional `@~` expression (inside a `${}` JS template literal at original source line ~619) is preserved verbatim in the installed output.
- **D-08:** **TEST-03** — Install Claude runtime to a temp dir. Read the installed `agents/gsd-executor.md`. Assert the installed file contains `"Mandatory Initial Read"` — text that originates in `get-shit-done/references/mandatory-initial-read.md`, which `gsd-executor.md` includes.
- **D-09:** **TEST-04** — Add a try/catch wrapper around both `eta.renderString(content, {})` calls in `bin/install.js` (lines ~6455 and ~8670). Catch `RangeError` and rethrow as `new Error('Circular include detected in: ' + srcPath)`. Test creates a temp fixture file that includes itself and asserts the thrown error message contains the fixture file path.
- **D-10:** **TEST-05** — Create a temp fixture file containing `<%~ include('nonexistent-path-xyz.md') %>`. Pass it through the Eta rendering path. Assert an `EtaFileResolutionError` is thrown and the error message contains `'nonexistent-path-xyz.md'`.
- **D-11:** TEST-06 is dropped. Source-file agent size budget (in `agent-size-budget.test.cjs`) already guards against unbounded growth.

### Claude's Discretion

- Exact mechanism for TEST-04 and TEST-05 to invoke the Eta rendering path: either export a thin `renderEtaContent(content, srcPath)` helper from `bin/install.js` under `GSD_TEST_MODE`, or call `installRuntimeArtifacts` with a minimal fixture tree. Prefer whichever requires less test scaffolding.
- Whether to add an `// allow-test-rule: source-text-is-the-product` comment at the top of `install-eta-regression.test.cjs` (consistent with other install test files that read product `.md` files).
- Sed vs. Node.js script for the Plan 01 conversion — use whichever is cleaner to verify and commit atomically.

### Deferred Ideas (OUT OF SCOPE)

- **TEST-06 (installed agent size budgets):** Dropped. Source-file budgets in `agent-size-budget.test.cjs` are the right enforcement point.
- **Copilot runtime tool-name transformation test:** Deferred to Phase 47's matrix sweep.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Test verifies installed output files contain no unresolved `@~/.claude/` references | D-06: `installRuntimeArtifacts` + recursive `.md` walk + regex assert |
| TEST-02 | Test verifies conditional `@~` expression in `execute-phase.md` preserved verbatim | D-07: install + find file + assert exact string at line 619 |
| TEST-03 | Test verifies inlined reference content present in installed agent output | D-08: install + read `gsd-executor.md` + assert `"Mandatory Initial Read"` |
| TEST-04 | Test verifies circular include causes thrown error, not infinite recursion | D-09: try/catch + fixture self-include + assert error message |
| TEST-05 | Test verifies missing-file include causes thrown error naming missing path | D-10: try/catch + fixture bad-path + assert `EtaFileResolutionError` |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Eta delimiter normalization | Build / installer | — | `bin/install.js` owns the Eta constructor and all render call sites |
| Tag replacement across source files | Source files | Build verification | Files are owned at source level; installer reads them at install time |
| Circular include detection | Build / installer | — | Error surfaces during `eta.renderString()` inside install.js |
| Missing-file error surface | Build / installer | Eta engine | `EtaFileResolutionError` thrown by Eta v4, caught/rethrown by install.js |
| Installed-output assertions (TEST-01–03) | Test layer | Install layer | Tests verify the product of `installRuntimeArtifacts()` against installed temp dirs |
| Error-path assertions (TEST-04–05) | Test layer | Install layer | Tests invoke the Eta rendering seam in install.js directly or via helper |

---

## Plan 01: Default Delimiter Switch

### Exact Lines to Remove (D-01)

`bin/install.js` lines 1753–1759 (VERIFIED by direct read):

```javascript
const eta = new Eta({
  views: _etaSourceRoot,
  tags: ['{%', '%}'],        // REMOVE this line
  parse: { raw: '~' },      // REMOVE this line
  useWith: true,
  autoEscape: false,
});
```

After removal, the constructor becomes:

```javascript
const eta = new Eta({
  views: _etaSourceRoot,
  useWith: true,
  autoEscape: false,
});
```

**Why safe:** Verified by live test against Eta 4.6.0 — `eta.config.tags` defaults to `['<%', '%>']` and `eta.config.parse.raw` defaults to `'~'`. Removing the explicit settings produces identical runtime behavior. `eta.resolvePath` override at lines 1764–1767 is unaffected and must be preserved.

**Source:** `[VERIFIED: direct read of bin/install.js lines 1753–1759 + live Eta config inspection]`

### Conversion Scope (D-02)

**File count:** 83 files confirmed by `grep -rl '{%~ include(' commands/gsd agents get-shit-done --include='*.md'`. The CONTEXT.md states 81 — the actual count is 83. Both numbers are close enough that the post-conversion verification grep is the authoritative source of truth, not a pre-flight count.

**Occurrence count:** 191 individual `{%~ include(` occurrences across those 83 files.

**Sed one-liner** (from CONTEXT.md `<specifics>`):

```bash
find commands/gsd agents get-shit-done -name '*.md' | xargs sed -i 's/{%~ include(/<%~ include(/g; s/ %}/ %>/g'
```

**Post-conversion verification:**

```bash
grep -r '{%~ include' commands/ agents/ get-shit-done/
```

Zero output confirms complete conversion. Run before committing Plan 01.

**Source:** `[VERIFIED: grep -rl and grep -r counts from live repo]`

### Eta Default Delimiter Confirmation

Live test against installed Eta 4.6.0 (`node_modules/eta`):

- `eta.config.tags` with no explicit `tags:` → `['<%', '%>']`
- `eta.config.parse.raw` with no explicit `parse:` → `'~'`

Default behavior is identical to the explicit custom config being removed. `<%~ include(` and `{%~ include(` are functionally equivalent given the raw prefix, but `<%` is the Eta default.

**Source:** `[VERIFIED: live node execution against node_modules/eta/dist/index.cjs]`

---

## Plan 02: Regression Tests

### Test File Location and Header Pattern

**File:** `tests/install-eta-regression.test.cjs`

**Allow-test-rule convention** (from scan of all test files): the `allow-test-rule` comment appears on line 1 of every install test file that reads product `.md` files. The standard value for tests that read installed `.md` content is `source-text-is-the-product`. The new test file should follow this convention.

**Header pattern** (modeled on `install-runtime-artifacts.test.cjs`):

```javascript
// allow-test-rule: source-text-is-the-product
// Tests the Eta v4 rendering pipeline wired in Phase 45.

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createTempDir, cleanup } = require('./helpers.cjs');
const { installRuntimeArtifacts } = require('../bin/install.js');
const { loadSkillsManifest, resolveProfile } = require('../get-shit-done/bin/lib/install-profiles.cjs');

const REAL_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'gsd');
const MANIFEST = loadSkillsManifest(REAL_COMMANDS_DIR);
const RESOLVED_CORE = resolveProfile({ modes: ['core'], manifest: MANIFEST });
```

**Source:** `[VERIFIED: direct read of install-runtime-artifacts.test.cjs lines 1–46]`

### installRuntimeArtifacts Signature

```javascript
installRuntimeArtifacts(runtime, configDir, mode, profile)
// e.g.:
installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)
```

`mode` is the string `'global'`. `profile` is the resolved profile object from `resolveProfile()`. Confirmed from usage at line 84 of `install-runtime-artifacts.test.cjs`.

**Source:** `[VERIFIED: direct read of tests/install-runtime-artifacts.test.cjs line 84]`

### TEST-01: No Unresolved `@~/.claude/` References

**Requirement:** TEST-01

**Approach:** Install Claude runtime to temp dir. Walk all installed `.md` files recursively using `fs.readdirSync` (or a recursive walk helper). Assert zero files contain `@~/.claude/`.

**Key assertion:**

```javascript
// Walk tmpDir recursively, collect all .md file paths
// For each file, read content and assert no match
assert.ok(
  !content.includes('@~/.claude/'),
  `Unresolved @~/.claude/ found in ${installedPath}`
);
```

Note: The regex from CONTEXT.md is `/@~\/.claude\//` — the `@~` at line start is what remains when Eta include resolution fails. The `${...}` conditional expression in execute-phase.md line 619 contains `'@~/.claude/get-shit-done/references/executor-examples.md'` as a string literal inside a JS template expression — this is inside `${}` so Eta does NOT treat it as an include tag and does NOT expand it. TEST-02 verifies it is preserved. TEST-01's scan must not flag it as unresolved.

**Disambiguation:** TEST-01 uses `/@~\/.claude\//` (or `@~/.claude/`) as a simple string search on installed output. The conditional expression at line 619 contains `'@~/.claude/...'` inside single quotes inside a `${}` JS template literal — it is not on its own line and is not an Eta include directive, so it will survive Eta rendering as a literal string. TEST-01 will flag it unless the search is scoped to bare-line occurrences (lines starting with `@~`). The planner should specify: assert no line in any installed `.md` file **starts with** `@~/.claude/` (i.e., use a `/^@~\/.claude\//m` anchored regex or check for bare-line occurrence).

**Source:** `[VERIFIED: direct read of execute-phase.md line 619]`

### TEST-02: Conditional `@~` Expression Preserved Verbatim

**Requirement:** TEST-02

**Exact string to assert** (from `get-shit-done/workflows/execute-phase.md` line 619, VERIFIED):

```
${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```

This is a JS template literal expression embedded in the workflow Markdown. Eta renders `{%~ include(` tags but must not touch `${...}` expressions. The test must assert this exact substring exists in the installed `execute-phase.md`.

**Locating the installed file:** After `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)`, the file is at:

```
path.join(tmpDir, 'get-shit-done', 'workflows', 'execute-phase.md')
```

(The Claude runtime installs `get-shit-done/` subtree under the configDir.)

**Source:** `[VERIFIED: direct read of get-shit-done/workflows/execute-phase.md line 619]`

### TEST-03: Inlined Reference Content Present

**Requirement:** TEST-03

**What to assert:** The installed `agents/gsd-executor.md` contains the string `"Mandatory Initial Read"`.

**Why this works:**
- Source `agents/gsd-executor.md` line 21: `{%~ include('get-shit-done/references/mandatory-initial-read.md') %}`
- `get-shit-done/references/mandatory-initial-read.md` line 1: `**CRITICAL: Mandatory Initial Read**`
- After Eta rendering, the include tag is replaced by the inlined content, so the installed file will contain `Mandatory Initial Read`.

**Locating the installed file:**

```
path.join(tmpDir, 'agents', 'gsd-executor.md')
```

**Source:** `[VERIFIED: direct read of agents/gsd-executor.md line 21 and get-shit-done/references/mandatory-initial-read.md line 1]`

### TEST-04: Circular Include Detection

**Requirement:** TEST-04

**Error behavior confirmed:** Live test against Eta 4.6.0 — a file that includes itself causes `RangeError: Maximum call stack size exceeded`. Eta does NOT detect circular includes at the engine level; the recursion simply overflows the stack.

**Required change to `bin/install.js`:** Add try/catch around both `eta.renderString` calls:

**Call site 1** — `copyWithPathReplacement()` at line 6455:
```javascript
// Before:
content = eta.renderString(content, {});

// After:
try {
  content = eta.renderString(content, {});
} catch (e) {
  if (e instanceof RangeError) {
    throw new Error('Circular include detected in: ' + srcPath);
  }
  throw e;
}
```

**Call site 2** — agent install loop at line 8670:
```javascript
// Before:
content = eta.renderString(content, {});

// After:
try {
  content = eta.renderString(content, {});
} catch (e) {
  if (e instanceof RangeError) {
    throw new Error('Circular include detected in: ' + srcPath);
  }
  throw e;
}
```

**`srcPath` availability:**
- Line 6455: `srcPath` is in scope — assigned at line 6446: `const srcPath = path.join(srcDir, entry.name);`
- Line 8670: `srcPath` equivalent is `path.join(agentsSrc, entry.name)` — the plan should introduce a `const srcPath = ...` variable at this call site if not already named `srcPath`.

**Test mechanism — invocation options:**

Option A (preferred by CONTEXT.md discretion): Export a thin helper from `bin/install.js` under `GSD_TEST_MODE`:
```javascript
// Added to module.exports (gated by GSD_TEST_MODE check inline, or unconditionally):
renderEtaContent,  // thin wrapper: (content, srcPath) => eta.renderString with try/catch
```
Tests call `renderEtaContent(content, fixturePath)` directly.

Option B: Call `installRuntimeArtifacts` with a fixture tree where one `.md` file self-includes. This exercises the full install path but requires more scaffolding (writing a fixture tree mimicking the source layout).

**Recommendation:** Option A. The try/catch logic exists in two call sites — a shared helper function (`renderEtaContent(content, srcPath)`) that both call sites delegate to is the cleanest refactor. Export it. Tests call it directly with 3 lines of setup (create temp dir, write fixture, call helper).

**Fixture design (from CONTEXT.md `<specifics>`):**

```javascript
const fs = require('node:fs');
const tmpDir = createTempDir();
const fixturePath = path.join(tmpDir, 'a.md');
fs.writeFileSync(fixturePath, "<%~ include('a.md') %>");
// Then: assert throws Error with message containing fixturePath
```

The `eta.resolvePath` override in `bin/install.js` resolves all includes relative to `_etaSourceRoot` (repo root). For the test to simulate this correctly, the fixture must either be placed in the repo root temp layout OR the helper must accept a views-root parameter. The simplest approach: the helper uses the same `eta` instance already configured with `views: _etaSourceRoot`. The fixture file must be placed under `_etaSourceRoot` (or the test must configure a separate Eta instance with the temp dir as views root).

**Cleaner approach for TEST-04/05:** Create a fresh Eta instance in the helper for testing, or accept views-root as parameter. The exported helper signature: `renderEtaContent(content, srcPath, viewsRoot)` where `viewsRoot` defaults to `_etaSourceRoot`.

**Source:** `[VERIFIED: live node execution confirming RangeError on circular include]`

### TEST-05: Missing-File Error

**Requirement:** TEST-05

**Error behavior confirmed:** Live test against Eta 4.6.0 — `<%~ include('nonexistent-path-xyz.md') %>` causes `EtaFileResolutionError` with message `Could not find template: /path/to/views/nonexistent-path-xyz.md`. The error class is exported from `eta` as `EtaFileResolutionError`.

**Import for test file:**

```javascript
const { EtaFileResolutionError } = require('eta');
```

(or `require('../node_modules/eta/dist/index.cjs')` for direct path — prefer package name)

**Test pattern:**

```javascript
const tmpDir = createTempDir();
const fixturePath = path.join(tmpDir, 'bad-include.md');
fs.writeFileSync(fixturePath, "<%~ include('nonexistent-path-xyz.md') %>");

assert.throws(
  () => renderEtaContent(content, fixturePath, tmpDir),
  (err) => {
    assert.ok(err instanceof EtaFileResolutionError);
    assert.ok(err.message.includes('nonexistent-path-xyz.md'));
    return true;
  }
);
```

**Note:** The try/catch in `bin/install.js` (D-09) catches `RangeError` and rethrows as a new Error. `EtaFileResolutionError` is NOT a `RangeError`, so it propagates naturally through the try/catch. TEST-05 asserts on the raw `EtaFileResolutionError` thrown by Eta.

**Source:** `[VERIFIED: live node execution confirming EtaFileResolutionError on missing include]`

---

## GSD_TEST_MODE Export Scope

`bin/install.js` exports `installRuntimeArtifacts` unconditionally (in the always-executed `module.exports` block at line 11374). The `if (!process.env.GSD_TEST_MODE)` block at line 11494 gates only the interactive `main()` logic. No additional export gating is needed for the new `renderEtaContent` helper.

**Source:** `[VERIFIED: direct read of bin/install.js lines 11374–11491]`

---

## Common Pitfalls

### Pitfall 1: TEST-01 flagging the conditional `@~` expression

**What goes wrong:** The regex `/@~\/.claude\//` matches the string literal `'@~/.claude/get-shit-done/references/executor-examples.md'` inside the `${}` expression on execute-phase.md line 619. TEST-01 fails even though the pipeline is working correctly.

**Why it happens:** The assertion scans for the substring anywhere in the file, including inside JS template literal string values.

**How to avoid:** Use a line-anchored check — assert no line **starts with** `@~/.claude/` using `/^@~\/.claude\//m`. The conditional expression is an interior part of a larger line, not a bare-line reference.

**Warning signs:** TEST-01 fails specifically on `execute-phase.md` while all other files pass.

### Pitfall 2: TEST-04 fixture resolves against repo root, not temp dir

**What goes wrong:** The `eta` instance in `bin/install.js` has `views: _etaSourceRoot` (repo root). If the test places the self-referencing fixture in `/tmp/...`, Eta cannot find `a.md` in the views root and throws `EtaFileResolutionError` instead of `RangeError` — testing the wrong failure mode.

**How to avoid:** The exported `renderEtaContent` helper should accept a `viewsRoot` parameter. Pass the temp dir as `viewsRoot` so Eta resolves `a.md` from the temp location.

**Warning signs:** TEST-04 throws `EtaFileResolutionError` instead of `RangeError`.

### Pitfall 3: `srcPath` not in scope at agent loop call site (line 8670)

**What goes wrong:** The try/catch rethrow uses `srcPath`, but at line 8670 the variable is `path.join(agentsSrc, entry.name)` — not yet bound to a named variable.

**How to avoid:** Introduce `const srcPath = path.join(agentsSrc, entry.name)` before the `fs.readFileSync` call and use `srcPath` throughout. Or if delegating to a `renderEtaContent(content, srcPath)` helper, pass the computed path expression as the argument.

**Warning signs:** `ReferenceError: srcPath is not defined` at agent install loop.

### Pitfall 4: Plan 01 sed replaces `%}` globally, not just on include lines

**What goes wrong:** The sed pattern `s/ %}/ %>/g` replaces any occurrence of ` %}` in the file, including in prose or code blocks that happen to contain `{%` / `%}` for non-Eta reasons.

**How to avoid:** The source files exclusively use `{%` / `%}` for Eta tags. Verify with grep after conversion that no semantic `{%` remain. Post-conversion grep for `{%` (not just `{%~ include(`) provides a broader safety check.

**Warning signs:** Post-conversion test failures in files with other `{%`/`%}` patterns (none expected, but worth verifying).

### Pitfall 5: File count discrepancy (81 vs 83)

**What goes wrong:** CONTEXT.md states 81 files; live grep shows 83. Planning tasks that hardcode "81 files" create misleading success criteria.

**How to avoid:** Plan verification tasks should run the post-conversion grep rather than assert a specific file count. The authoritative check is zero survivors of `{%~ include`, not a file-count match.

---

## Code Examples

### Verified: Eta constructor before and after Plan 01

```javascript
// BEFORE (lines 1753–1759 of bin/install.js):
const eta = new Eta({
  views: _etaSourceRoot,
  tags: ['{%', '%}'],
  parse: { raw: '~' },
  useWith: true,
  autoEscape: false,
});

// AFTER (D-01):
const eta = new Eta({
  views: _etaSourceRoot,
  useWith: true,
  autoEscape: false,
});
// resolvePath override at lines 1764–1767 unchanged
```

### Verified: TEST-02 verbatim assertion target

From `get-shit-done/workflows/execute-phase.md` line 619:

```
       ${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}
```

The test should assert `installedContent.includes("${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}")`.

### Verified: EtaFileResolutionError import

```javascript
// From eta CJS build — confirmed exported:
const { EtaFileResolutionError } = require('eta');
```

### Verified: Circular include produces RangeError

```javascript
// Confirmed by live test:
// File content: "<%~ include('a.md') %>"
// eta.renderString(content, {}) → throws RangeError: Maximum call stack size exceeded
```

### Verified: Missing include produces EtaFileResolutionError

```javascript
// Confirmed by live test:
// File content: "<%~ include('nonexistent-path-xyz.md') %>"
// eta.renderString(content, {}) → throws EtaFileResolutionError
// err.message: "Could not find template: /path/to/views/nonexistent-path-xyz.md"
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` (v22+) |
| Config file | none |
| Quick run command | `node --test tests/install-eta-regression.test.cjs` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | No unresolved `@~/.claude/` in installed output | integration | `node --test tests/install-eta-regression.test.cjs` | No — Wave 0 |
| TEST-02 | Conditional `@~` expression preserved verbatim | integration | `node --test tests/install-eta-regression.test.cjs` | No — Wave 0 |
| TEST-03 | Inlined reference content (`Mandatory Initial Read`) present in installed agent | integration | `node --test tests/install-eta-regression.test.cjs` | No — Wave 0 |
| TEST-04 | Circular include → `Error: Circular include detected in: <path>` | unit | `node --test tests/install-eta-regression.test.cjs` | No — Wave 0 |
| TEST-05 | Missing include → `EtaFileResolutionError` naming missing path | unit | `node --test tests/install-eta-regression.test.cjs` | No — Wave 0 |

### Wave 0 Gaps

- [ ] `tests/install-eta-regression.test.cjs` — new file; all five tests live here
- [ ] `renderEtaContent` helper export in `bin/install.js` — needed by TEST-04 and TEST-05 unless `installRuntimeArtifacts` with fixture tree is chosen instead

*(No shared fixture files or conftest needed — each test uses `createTempDir()` + `cleanup()` from existing helpers.cjs)*

---

## Environment Availability

Step 2.6: All dependencies are in the local Node.js environment — no external services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | Yes | v22+ (from CLAUDE.md) | — |
| `eta` package | Plan 01 + Plan 02 | Yes | 4.6.0 | — |
| `tests/helpers.cjs` | TEST-01 through TEST-05 | Yes | current | — |
| `bin/install.js` | TEST-01 through TEST-05 | Yes | current | — |
| `install-profiles.cjs` | Profile setup in tests | Yes | current | — |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Installed `execute-phase.md` is at `path.join(tmpDir, 'get-shit-done', 'workflows', 'execute-phase.md')` for Claude runtime | TEST-02 | Test cannot find the file to assert; adjust path |
| A2 | Installed `gsd-executor.md` is at `path.join(tmpDir, 'agents', 'gsd-executor.md')` for Claude runtime | TEST-03 | Test cannot find the file to assert; adjust path |
| A3 | `renderEtaContent` is chosen as the TEST-04/05 invocation mechanism | TEST-04/05 | If `installRuntimeArtifacts` with fixture tree is chosen instead, task descriptions differ |

**All other claims in this research were verified by direct file reads or live code execution.**

---

## Open Questions

1. **TEST-01 regex scope: bare-line vs. substring**
   - What we know: The conditional expression at execute-phase.md line 619 contains `'@~/.claude/...'` as a string literal on an interior line position.
   - What's unclear: Whether the planner should use a bare-line anchor (`/^@~\/.claude\//m`) or a full-line substring check.
   - Recommendation: Use `/^@~\/.claude\//m` to avoid false positives from the conditional expression. Document the decision in the test comment.

2. **`renderEtaContent` helper: export unconditionally or gate on GSD_TEST_MODE**
   - What we know: `installRuntimeArtifacts` is exported unconditionally. Other helpers are exported unconditionally.
   - What's unclear: Whether the team convention prefers GSD_TEST_MODE gating for test-only helpers.
   - Recommendation: Export unconditionally (consistent with all other helpers in `module.exports`). The function is pure and has no side effects.

---

## Sources

### Primary (HIGH confidence)
- Direct read: `bin/install.js` lines 1740–1768 — Eta constructor, exact lines 1753–1759 identified
- Direct read: `bin/install.js` lines 6440–6480 — `copyWithPathReplacement()` `eta.renderString` at line 6455
- Direct read: `bin/install.js` lines 8650–8710 — agent install loop `eta.renderString` at line 8670
- Direct read: `bin/install.js` lines 11374–11491 — full `module.exports` block (no `renderEtaContent` yet)
- Direct read: `get-shit-done/workflows/execute-phase.md` lines 610–638 — exact TEST-02 assertion string at line 619
- Direct read: `agents/gsd-executor.md` line 21 — `{%~ include('get-shit-done/references/mandatory-initial-read.md') %}`
- Direct read: `get-shit-done/references/mandatory-initial-read.md` — `"Mandatory Initial Read"` at line 1
- Direct read: `tests/helpers.cjs` — `createTempDir()`, `cleanup()`, `parseFrontmatter()` signatures
- Direct read: `tests/install-runtime-artifacts.test.cjs` — `installRuntimeArtifacts` signature, profile setup pattern, `allow-test-rule` header
- Live execution: Eta 4.6.0 default config confirms `tags: ['<%', '%>']` and `parse.raw: '~'`
- Live execution: Circular include → `RangeError: Maximum call stack size exceeded` (confirmed)
- Live execution: Missing include → `EtaFileResolutionError: Could not find template: ...` (confirmed)
- Live execution: `EtaFileResolutionError` importable from `eta` CJS export (confirmed)
- Live grep: 83 files with `{%~ include(`, 191 occurrences

### Secondary (MEDIUM confidence)
- `.planning/phases/46-regression-test-suite/46-CONTEXT.md` — all locked decisions, code insights, specifics

---

## Metadata

**Confidence breakdown:**
- Plan 01 scope + exact lines: HIGH — verified by direct file read and live grep
- Plan 02 test patterns: HIGH — verified by direct file read of parallel test file and live Eta behavior
- TEST-04/05 invocation mechanism: MEDIUM — mechanism is discretionary; recommendation is based on code structure analysis

**Research date:** 2026-05-29
**Valid until:** 2026-06-29 (stable codebase — no external dependencies expected to change)
