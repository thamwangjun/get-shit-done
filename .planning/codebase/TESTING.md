# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:**
- Node.js built-in `node:test` runner (no external test framework)
- Requires Node.js >= 22.0.0
- Config: `scripts/run-tests.cjs` — custom runner that globs `tests/*.test.cjs` and invokes `node --test --test-concurrency=4`

**Assertion Library:**
- `node:assert/strict` — strict mode assertions only (`assert.strictEqual`, `assert.deepStrictEqual`, `assert.ok`)

**Coverage:**
- `c8` v11+ for code coverage
- Coverage target: ≥70% line coverage
- Coverage scope: `get-shit-done/bin/lib/*.cjs` only (excludes `tests/`, installer, hooks)

**Run Commands:**
```bash
npm test                  # Run all tests (concurrency=4)
node --test tests/phase.test.cjs   # Run a single test file
npm run test:coverage     # Run with c8 coverage, require ≥70% lines
TEST_CONCURRENCY=8 npm test        # Override concurrency
```

## Test File Organization

**Location:**
- All test files live in `tests/` at the project root — not co-located with source
- One corresponding test file per lib module (e.g., `tests/core.test.cjs` → `get-shit-done/bin/lib/core.cjs`)
- Additional integration tests per feature/command (e.g., `tests/config.test.cjs`, `tests/state.test.cjs`)
- Bug regression tests: `tests/bug-<issue>-<slug>.test.cjs`

**Naming:**
- All test files: `kebab-case.test.cjs`
- Bug regression tests: `bug-<issue-number>-<short-description>.test.cjs`

**Structure:**
```
tests/
├── helpers.cjs                         # Shared test utilities (NOT a test file)
├── core.test.cjs                       # Unit tests for lib/core.cjs
├── state.test.cjs                      # Integration tests for lib/state.cjs
├── phase.test.cjs                      # Integration tests for lib/phase.cjs
├── config.test.cjs                     # Integration tests for lib/config.cjs
├── frontmatter.test.cjs                # Unit tests for lib/frontmatter.cjs (pure functions)
├── template.test.cjs                   # Integration tests for lib/template.cjs
├── atomic-write.test.cjs               # Unit tests for atomicWriteFileSync
├── concurrency-safety.test.cjs         # Multi-process stress tests
├── agent-frontmatter.test.cjs          # Static analysis: validates all agent .md files
├── bug-1891-file-resolution.test.cjs   # Bug regression: #1891
└── ...
```

## Test Structure

**Suite Organization:**
```javascript
/**
 * GSD Tools Tests - Phase
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('phases list command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns empty array', () => {
    const result = runGsdTools('phases list', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.deepStrictEqual(output.directories, [], 'directories should be empty');
    assert.strictEqual(output.count, 0, 'count should be 0');
  });
});
```

**Patterns:**
- `beforeEach` creates a fresh `tmpDir` via `createTempProject()` or `createTempDir()`
- `afterEach` always calls `cleanup(tmpDir)` — no persistent temp files
- Test names describe expected behavior: `'lists phase directories sorted numerically'`
- Failure messages included in every assertion: `assert.ok(result.success, \`Command failed: ${result.error}\`)`
- JSON output from CLI is always parsed with `JSON.parse(result.output)` before asserting fields

## Test Helpers (`tests/helpers.cjs`)

All test files import shared utilities from `tests/helpers.cjs`. Use these — do not reimplement.

**`runGsdTools(args, cwd, env)`** — Runs `get-shit-done/bin/gsd-tools.cjs` as a subprocess:
```javascript
// String form: shell-style parsing
const result = runGsdTools('phases list --type plans', tmpDir);

// Array form: bypasses shell (safe for JSON, dollar signs)
const result = runGsdTools(['config-set', 'key', JSON.stringify(value)], tmpDir);

// Returns: { success: boolean, output: string, error?: string }
```

**`createTempProject(prefix?)`** — Creates a temp dir with `.planning/phases/` structure:
```javascript
const tmpDir = createTempProject();
// tmpDir/.planning/phases/ exists
```

**`createTempGitProject(prefix?)`** — Creates a temp dir with `.planning/` + initialized git repo + initial commit:
```javascript
const tmpDir = createTempGitProject();
// Has git history, config user.email, commit.gpgsign=false
```

**`createTempDir(prefix?)`** — Bare temp directory, no `.planning/` structure:
```javascript
const tmpDir = createTempDir();
```

**`cleanup(tmpDir)`** — Recursively deletes the temp directory:
```javascript
cleanup(tmpDir);
```

**Environment isolation:** `runGsdTools` clears all session env vars (`GSD_SESSION_KEY`, `CLAUDE_SESSION_ID`, etc.) to prevent CI environment bleed. Pass `{ HOME: tmpDir }` as env to sandbox `~/.gsd/defaults.json` lookups.

## Mocking

**Framework:** None — no mocking library used.

**Pattern:** Tests rely on filesystem state in `tmpDir` rather than mocking:
```javascript
// Write fixture files instead of mocking fs
fs.writeFileSync(
  path.join(tmpDir, '.planning', 'STATE.md'),
  `# Project State\n\n**Current Phase:** 03\n**Status:** In progress\n`
);

const result = runGsdTools('state-snapshot', tmpDir);
const output = JSON.parse(result.output);
assert.strictEqual(output.current_phase, '03');
```

**Mock these:** Nothing — use real filesystem via `createTempProject()`/`createTempDir()`.

**Do not mock these:** `fs`, `path`, `child_process` — tests execute real CLI commands as subprocesses.

## Fixtures and Test Data

**Test Data Pattern:**
```javascript
// Write fixture files inline in test body or beforeEach
function writeConfig(tmpDir, obj) {
  const configPath = path.join(tmpDir, '.planning', 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(obj, null, 2), 'utf-8');
}

function writeMinimalRoadmap(tmpDir, phases = ['1']) {
  const lines = phases.map(n => `### Phase ${n}: Phase ${n} Description`).join('\n');
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'ROADMAP.md'),
    `# Roadmap\n\n${lines}\n`
  );
}
```

**No fixture files on disk** — all fixture data is written inline in tests. Local helper functions at the top of each test file prepare state before tests run.

**Location:** Fixture helpers are either in `tests/helpers.cjs` (shared) or defined at the top of the individual test file (file-local).

## Coverage

**Requirements:** ≥70% line coverage enforced by `npm run test:coverage`

**Scope:** Only `get-shit-done/bin/lib/*.cjs` is measured — the installer (`bin/install.js`), hooks, and agents are excluded.

**View Coverage:**
```bash
npm run test:coverage
# Runs c8 with --reporter text, outputs table to stdout
# Fails if lines < 70%
```

## Test Types

**Unit Tests:**
- Pure function tests that `require` lib modules directly (no subprocess)
- Examples: `tests/frontmatter.test.cjs`, `tests/atomic-write.test.cjs`, `tests/core.test.cjs`
- Pattern: import named exports, call directly, assert return values

```javascript
const { extractFrontmatter } = require('../get-shit-done/bin/lib/frontmatter.cjs');

test('parses simple key-value pairs', () => {
  const content = '---\nname: foo\ntype: execute\n---\nbody';
  const result = extractFrontmatter(content);
  assert.strictEqual(result.name, 'foo');
});
```

**Integration Tests (CLI subprocess):**
- Most tests invoke `runGsdTools()` which spawns `gsd-tools.cjs` as a subprocess
- Tests assert on parsed JSON output from the CLI command
- Each test gets a fresh `tmpDir` via `createTempProject()`

**Static Analysis Tests:**
- `tests/agent-frontmatter.test.cjs` reads all agent `.md` files from `agents/` and validates frontmatter structure
- No subprocess, no filesystem fixtures — reads the actual source files
- Used for enforcing structural invariants across all agent files

**Regression Tests:**
- Files named `bug-<issue>-<description>.test.cjs` or referencing issue numbers in comments
- Each regression test documents the original bug and asserts the specific behavior that was fixed
- Example: `tests/bug-1891-file-resolution.test.cjs`, `tests/bug-2015-worktree-base-branch.test.cjs`

**Stress / Concurrency Tests:**
- `tests/concurrency-safety.test.cjs` runs multi-process concurrent writes and 50-phase stress tests
- Uses `execAsync` (promisified `exec`) to spawn parallel subprocesses
- Performance benchmarks use `perf_hooks.performance` for timing assertions

## Common Patterns

**Async Testing:**
```javascript
// Most tests are synchronous (execFileSync in runGsdTools)
// Async tests use promisified exec for parallel subprocess spawning
const { promisify } = require('util');
const execAsync = promisify(exec);

test('concurrent writes do not corrupt state', async () => {
  const promises = Array.from({ length: 5 }, () =>
    execAsync(`node ${TOOLS_PATH} state-advance-plan`, { cwd: tmpDir })
  );
  await Promise.all(promises);
  // assert final state
});
```

**Error Testing:**
```javascript
test('missing STATE.md returns error', () => {
  const result = runGsdTools('state-snapshot', tmpDir);
  assert.ok(result.success, `Command should succeed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.error, 'STATE.md not found');
});

// For commands expected to fail (non-zero exit):
test('invalid args cause failure', () => {
  const result = runGsdTools('unknown-command', tmpDir);
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Unknown command'));
});
```

**Idempotency Testing:**
```javascript
test('is idempotent — returns already_exists on second call', () => {
  const first = runGsdTools('config-ensure-section', tmpDir);
  assert.ok(first.success);
  assert.strictEqual(JSON.parse(first.output).created, true);

  const second = runGsdTools('config-ensure-section', tmpDir);
  assert.ok(second.success);
  assert.strictEqual(JSON.parse(second.output).created, false);
  assert.strictEqual(JSON.parse(second.output).reason, 'already_exists');
});
```

**JSON Output Assertions:**
```javascript
// Always parse output before asserting — never match raw strings
const output = JSON.parse(result.output);
assert.strictEqual(output.current_phase, '03', 'current phase extracted');
assert.strictEqual(output.total_phases, 6, 'total phases extracted');
assert.deepStrictEqual(output.directories, ['01-foundation', '02-api', '10-final']);
```
