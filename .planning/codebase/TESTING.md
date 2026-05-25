# Testing Patterns

**Analysis Date:** 2026-05-25

## Test Framework

**Runner:**
- Node.js built-in `--test` runner (no external test framework)
- Requires Node.js >=20; CI matrix: Node 22 and 24 on ubuntu-latest, Node 24 on macos-latest
- Test dispatch: `scripts/run-tests.cjs` — resolves globs via Node, propagates `NODE_V8_COVERAGE` for c8

**Assertion Library:**
- `node:assert/strict` — always imported as strict mode assertions

**Coverage Tool:**
- `c8` ^11.0.0
- Scope: `get-shit-done/bin/lib/*.cjs` only — not SDK or scripts
- Target: ≥70% line coverage

**Run Commands:**
```bash
node scripts/run-tests.cjs              # Run all tests (all suites)
node scripts/run-tests.cjs --suite unit        # Unit tests only (no suite marker)
node scripts/run-tests.cjs --suite integration # Integration tests
node scripts/run-tests.cjs --suite install     # Install smoke tests
node scripts/run-tests.cjs --suite security    # Security tests
node --test tests/phase.test.cjs               # Run a single test file
npm run test:coverage                          # Run with c8 coverage gate
```

## Test File Organization

**Location:**
- All test files in `tests/` directory at repo root
- Flat structure — no subdirectories within `tests/`
- Total: 588+ test files as of 2026-05-25

**Naming:**
- Unit tests: `kebab-case.test.cjs` — e.g., `state.test.cjs`, `phase.test.cjs`, `roadmap.test.cjs`
- Suite-labeled tests: `<name>.<suite>.test.cjs` — e.g., `release-tarball-smoke.install.test.cjs`
- Bug regression tests: `bug-<issue-number>-<description>.test.cjs` — e.g., `bug-1891-file-resolution.test.cjs`, `bug-1826-phases-clear-confirm.test.cjs`
- Feature tests: `feat-<number>-<description>.test.cjs`

**Suite grouping convention:**
- `<name>.test.cjs` — `unit` suite (default, no marker)
- `<name>.integration.test.cjs` — `integration` suite
- `<name>.install.test.cjs` — `install` suite
- `<name>.security.test.cjs` — `security` suite
- `<name>.slow.test.cjs` — `slow` suite

**Concurrency:**
- Default: 4 parallel processes on Linux/macOS, 2 on Windows
- Override: `TEST_CONCURRENCY=<n>` env var

## Test Structure

**Suite Organization:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('command name', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('what it does when condition', () => {
    // arrange: write fixture files to tmpDir
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '...');

    // act: invoke CLI via runGsdTools
    const result = runGsdTools('state-snapshot', tmpDir);

    // assert: on structured JSON output, not raw text
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.current_phase, '03', 'current phase extracted');
  });
});
```

**Patterns:**
- `beforeEach` creates a fresh temp project via `createTempProject()` or `createTempDir()`
- `afterEach` calls `cleanup(tmpDir)` to remove the temp directory
- Test bodies follow arrange-act-assert structure
- Assertion messages always included as the second arg to assert calls: `assert.strictEqual(x, y, 'message')`

## Key Test Helpers

All helpers are in `tests/helpers.cjs`:

**`runGsdTools(args, cwd, env)`** — Invokes `gsd-tools.cjs` as a child process.
- `args`: string (shell-split) or `string[]` (bypasses shell — safe for JSON and dollar signs)
- Returns `{ success, output, error, exitCode }`
- Strips session env vars to isolate test from developer's active session

**`createTempProject(prefix?)`** — Creates `os.tmpdir()/gsd-test-XXXXX/` with `.planning/phases/` structure.

**`createTempDir(prefix?)`** — Creates bare temp directory with no `.planning/` structure.

**`createTempGitProject(prefix?)`** — Creates temp project with initialized git repo and initial commit.

**`cleanup(tmpDir)`** — `fs.rmSync` with `maxRetries: 20, retryDelay: 250` for Windows EBUSY resilience.

**`parseFrontmatter(content)`** — Parses YAML frontmatter block into `Record<string, string>`. Tests use this instead of `.includes('key: value')` to follow "tests parse, never grep" convention.

**`captureConsole(fn)`** — Captures `console.log/warn/error` output, strips ANSI colors, re-throws exceptions. Used for testing code that writes to console rather than stdout.

**`toPosixPath(p)`** — Normalizes path separators to `/` for cross-platform path comparisons.

**`runNpm(args, options?)`** — Cross-platform npm invocation with isolated HOME to prevent ~/.npm contamination.

## Anti-Patterns (Enforced by Linter)

`scripts/lint-no-source-grep.cjs` runs as part of `npm test` (`pretest` hook) and rejects:

1. **Source-grep theater**: `readFileSync` on `.cjs` source files to assert string presence. Proves a literal exists in source, not runtime behavior. Example violation:
   ```javascript
   // BANNED: reading .cjs source and asserting text
   const src = fs.readFileSync('../lib/core.cjs', 'utf-8');
   assert.ok(src.includes('someFunction'));
   ```

2. **Raw text matching on CLI output**: `assert.match` or `.includes()` on `.stdout`/`.stderr`. Tests must parse JSON from the SUT and assert on typed fields.
   ```javascript
   // BANNED:
   assert.match(result.stdout, /some text/);
   result.output.includes('some string');

   // CORRECT: parse JSON, assert on typed fields
   const output = JSON.parse(result.output);
   assert.strictEqual(output.phase_name, 'Foundation');
   ```

**Escape hatch:** Add `// allow-test-rule: <reason>` as the first line of the file to suppress enforcement. Valid reasons include:
- `source-text-is-the-product` — the `.md`/`.json`/`.yml` product files ARE what the runtime loads; testing their text IS testing the deployed contract
- `pending-migration-to-typed-ir [#issue]` — acknowledged violation tracked for future migration
- `structural-implementation-guard` — structural check required (e.g., wiring verification) that cannot be expressed as behavioral output assertion

## Mocking

**Framework:** None — no mocking library used in the test suite.

**Patterns:**
- Tests exercise the CLI through `runGsdTools()` as black-box subprocess calls — no internal mocking
- Isolation provided by `createTempProject()` / `createTempDir()` giving each test a fresh filesystem state
- Session env vars cleared via `TEST_ENV_BASE` in `helpers.cjs` to prevent developer session state leaking
- `captureConsole(fn)` used when testing code that calls `console.log` directly (not CLI output)

**What to NOT mock:**
- Filesystem I/O — tests write real files to temp directories and read real output
- `gsd-tools.cjs` internals — test only via the CLI subprocess interface

## Fixtures and Factories

**Test Data — Inline fixture construction:**
```javascript
// Write STATE.md fixture
fs.writeFileSync(
  path.join(tmpDir, '.planning', 'STATE.md'),
  `# Project State\n\n**Current Phase:** 03\n**Status:** In progress\n`
);

// Build PLAN.md with frontmatter
function validPlanContent({ wave = 1, dependsOn = '[]', autonomous = 'true' } = {}) {
  return [
    '---',
    'phase: 01-test',
    `wave: ${wave}`,
    `depends_on: ${dependsOn}`,
    '---',
    '<tasks>...</tasks>',
  ].join('\n');
}
```

**Local test helper functions** are defined at the top of each test file for repeated fixture patterns:
```javascript
function writeState(tmpDir, extra = '') { ... }
function writeRoadmap(tmpDir, content) { ... }
function mkPhaseDir(tmpDir, name, opts = {}) { ... }
```

**Location:**
- No separate fixtures directory — all fixture data is constructed inline in test files
- Shared helpers only in `tests/helpers.cjs`

## Coverage

**Requirements:** ≥70% line coverage on `get-shit-done/bin/lib/*.cjs`

**View Coverage:**
```bash
npm run test:coverage
# or
c8 --check-coverage --lines 70 --reporter text --include 'get-shit-done/bin/lib/*.cjs' node scripts/run-tests.cjs
```

**Exclusions:**
- `tests/**` excluded from coverage measurement
- SDK TypeScript files covered by `sdk/vitest.config.ts` separately

## Test Types

**Unit Tests** (`*.test.cjs` — the `unit` suite):
- The majority of the 588 test files
- Each exercises one or a small group of CLI subcommands through `runGsdTools()`
- Isolated via temp directories; no network access required

**Regression Tests** (`bug-*.test.cjs`):
- Named after the bug issue number
- Verify the exact behavior that was broken
- Same structure as unit tests — `describe` + `test` + `runGsdTools`

**Install Tests** (`*.install.test.cjs`):
- `release-tarball-smoke.install.test.cjs` — packs and installs from tarball, verifies the installed CLI works
- Requires npm access; slower than unit tests

**Security Tests** (`*.security.test.cjs`):
- `security-scan.test.cjs`, `security-prompt-injection.test.cjs`, `security.test.cjs`
- Assert security properties of the system (no secret leakage, injection resistance)

## Common Patterns

**Async Testing:**
```javascript
// Tests are synchronous — runGsdTools uses execFileSync
// No async/await needed in most tests
test('does the thing', () => {
  const result = runGsdTools('state-snapshot', tmpDir);
  assert.ok(result.success);
});
```

**Error Path Testing:**
```javascript
test('missing STATE.md returns error', () => {
  const result = runGsdTools('state-snapshot', tmpDir);
  // Command still succeeds (exit 0) but output contains error field
  assert.ok(result.success, `Command should succeed: ${result.error}`);
  const output = JSON.parse(result.output);
  assert.strictEqual(output.error, 'STATE.md not found', 'should report missing file');
});
```

**Frontmatter Testing:**
```javascript
// Use parseFrontmatter() instead of .includes() checks
const { parseFrontmatter } = require('./helpers.cjs');
const content = fs.readFileSync(path.join(agentsDir, 'gsd-planner.md'), 'utf-8');
const fm = parseFrontmatter(content);
assert.strictEqual(fm.name, 'gsd-planner');
```

**Structural Guards (with allow-test-rule):**
```javascript
// allow-test-rule: structural-implementation-guard
// When wiring cannot be tested behaviorally, read source text
// but annotate the file with allow-test-rule at line 1

const src = fs.readFileSync(GSD_TOOLS_SRC, 'utf-8');
assert.ok(
  src.includes("captured.startsWith('@file:')"),
  'main() should check for @file: prefix'
);
```

---

*Testing analysis: 2026-05-25*
