<!-- generated-by: gsd-doc-writer -->
# Testing

This document describes how the test suite is organized, how to run tests, and how to write new ones.

## Test Framework and Setup

The project uses two test frameworks depending on the component being tested:

- **Node.js built-in test runner** (`node --test`) — used for the main `tests/` suite covering GSD tools, commands, workflows, and agent definitions. This is the primary test suite (210 test files).
- **Vitest ^4.1.2** — used for the `sdk/` package unit and integration tests.
- **c8 ^11.0.0** — used for coverage instrumentation and threshold enforcement.

No additional setup is required beyond installing dependencies:

```bash
npm install
```

## Running Tests

### Main test suite

Run all tests in the `tests/` directory:

```bash
npm test
```

This invokes `scripts/run-tests.cjs`, which discovers all `*.test.cjs` files in `tests/`, runs most files in parallel with a concurrency of 4, and runs tests that mutate shared filesystem state (such as `hooks/dist/`) serially with concurrency 1.

You can override the concurrency level:

```bash
TEST_CONCURRENCY=2 npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```

Coverage is collected using c8 and scoped to `get-shit-done/bin/lib/*.cjs`. This is the command run in CI.

### SDK tests (Vitest)

Run the SDK unit and integration test projects from the repository root:

```bash
npx vitest run
```

Or from within the `sdk/` directory:

```bash
cd sdk && npx vitest run
```

The SDK vitest configuration (`vitest.config.ts`) defines two projects:

| Project | Pattern | Timeout |
|---|---|---|
| `unit` | `sdk/src/**/*.test.ts` (excludes `*.integration.test.ts`) | default |
| `integration` | `sdk/src/**/*.integration.test.ts` | 120 seconds |

## Writing New Tests

### Main test suite (`tests/`)

- **File naming:** `tests/<description>.test.cjs` — all test files must end in `.test.cjs`.
- **Test framework:** Use Node.js built-in `node:test` (`require('node:test')`) and `node:assert/strict`.
- **Shared helpers:** `tests/helpers.cjs` exports utilities for running GSD tools and creating isolated temporary project directories:
  - `runGsdTools(args, cwd, env)` — invokes `get-shit-done/bin/gsd-tools.cjs` with the given arguments.
  - `createTempDir(prefix)` — creates a bare temp directory.
  - `createTempProject(prefix)` — creates a temp directory with a `.planning/phases/` structure.
  - `createTempGitProject(prefix)` — creates a temp directory with a `.planning/phases/` structure and an initialized git repo with an initial commit.
  - `cleanup(tmpDir)` — removes a temporary directory recursively.
- **Isolation:** Tests that mutate `hooks/dist/` must be added to the `SERIAL_FILES` set in `scripts/run-tests.cjs` to avoid race conditions.
- **Bug regression tests:** Use the naming pattern `bug-<issue-number>-<description>.test.cjs`.

Example structure for a new test file:

```js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('my feature', () => {
  test('does the expected thing', () => {
    const tmpDir = createTempProject();
    try {
      const result = runGsdTools(['my-command'], tmpDir);
      assert.ok(result.success);
      assert.ok(result.output.includes('expected output'));
    } finally {
      cleanup(tmpDir);
    }
  });
});
```

### SDK tests (`sdk/src/`)

- **Unit tests:** `sdk/src/**/*.test.ts` (must not match `*.integration.test.ts`)
- **Integration tests:** `sdk/src/**/*.integration.test.ts`
- Use Vitest's `test`, `describe`, `expect` imports from `vitest`.

## Coverage Requirements

Coverage is enforced on the `get-shit-done/bin/lib/*.cjs` files.

| Type | Threshold |
|---|---|
| Lines | 70% |

Coverage is checked using c8 with the `--check-coverage` flag. The build fails if the line coverage threshold is not met. No branch, function, or statement thresholds are currently configured.

## CI Integration

Tests run automatically via the **Tests** workflow (`.github/workflows/test.yml`).

**Triggers:**
- Push to `main`, `release/**`, or `hotfix/**` branches
- Pull requests targeting `main`
- Manual dispatch (`workflow_dispatch`)

**Matrix:**

| OS | Node.js versions |
|---|---|
| `ubuntu-latest` | 22, 24 |
| `macos-latest` | 24 |

The workflow runs `npm run test:coverage` on every matrix combination. The job times out after 10 minutes. Concurrent runs for the same branch or PR are cancelled automatically.
