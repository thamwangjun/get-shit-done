# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- Source lib modules: `kebab-case.cjs` (e.g., `core.cjs`, `model-profiles.cjs`, `profile-pipeline.cjs`)
- Test files: `kebab-case.test.cjs` — one test file per lib module plus many integration/regression tests
- Bug regression tests: `bug-<issue-number>-<description>.test.cjs` (e.g., `bug-1891-file-resolution.test.cjs`)
- Helper scripts: `kebab-case.cjs` in `scripts/`

**Functions:**
- All functions use `camelCase` (e.g., `findProjectRoot`, `atomicWriteFileSync`, `comparePhaseNum`)
- CLI command handler functions are prefixed with `cmd` (e.g., `cmdPhasesList`, `cmdStateLoad`, `cmdStatePatch`)
- Internal-only helpers are suffixed with `Internal` (e.g., `findPhaseInternal`, `generateSlugInternal`, `resolveModelInternal`)
- Boolean predicates use `is`/`has`/`can` prefix implicitly via natural English (e.g., `stateExists`, `configExists`)

**Variables:**
- `camelCase` for local variables
- `SCREAMING_SNAKE_CASE` for module-level constants (e.g., `CONFIG_DEFAULTS`, `WORKSTREAM_SESSION_ENV_KEYS`, `TEST_ENV_BASE`)
- Temporary directory variables named `tmpDir`

**Types / Constants:**
- No TypeScript; runtime type checks only
- Module-level constant objects with `SCREAMING_SNAKE_CASE` keys
- `tsconfig.json` and `vitest.config.ts` exist for tooling but the runtime code is all CommonJS

## Code Style

**Formatting:**
- No Prettier or ESLint config detected in the repository root — formatting is maintained by convention
- 2-space indentation (consistent across all `get-shit-done/bin/lib/*.cjs` files)
- Single quotes for string literals in most places
- Template literals used for multi-token string construction

**Module format:**
- CommonJS only (`require`, `module.exports`) — no ES modules in lib or test code
- All lib files: `'use strict'` is implied but not always declared explicitly
- `scripts/run-tests.cjs` uses `'use strict';` explicitly

## Section Organization Within Files

Files organize code using ASCII banner comments as section separators:

```javascript
// ─── Path helpers ─────────────────────────────────────────────────────────────

// ─── File & Config utilities ──────────────────────────────────────────────────

// ─── Atomic file writes ───────────────────────────────────────────────────────
```

Each lib file starts with a JSDoc block comment naming the module:

```javascript
/**
 * Core — Shared utilities, constants, and internal helpers
 */
```

## Import Organization

**Order:**
1. Node built-ins (`fs`, `path`, `os`, `crypto`, `child_process`)
2. Internal lib modules via relative paths (`./core.cjs`, `./frontmatter.cjs`, `./state.cjs`)

**Pattern:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const { escapeRegex, loadConfig, planningDir, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
```

Destructured imports are used when consuming multiple named exports from internal modules.

**No path aliases** — all imports use relative paths.

## Error Handling

**Strategy:** Fail-fast with process exit for unrecoverable errors; return structured results for expected failures.

**Patterns:**

The `error()` helper in `get-shit-done/bin/lib/core.cjs` writes to stderr and exits:
```javascript
function error(message) {
  fs.writeSync(2, 'Error: ' + message + '\n');
  process.exit(1);
}
```

Silent swallow with empty catch blocks is used for non-critical operations (file cleanup, lock release):
```javascript
try { fs.unlinkSync(lockPath); } catch { /* already gone */ }
```

`safeReadFile` pattern — returns `null` on read failure rather than throwing:
```javascript
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
```

Structured error returns in CLI output — commands return JSON with an `error` field rather than throwing:
```javascript
output({ files: [], count: 0, phase_dir: null, error: 'Phase not found' }, raw, '');
```

## Output

**Pattern:** All CLI commands output via the `output(result, raw, rawValue)` helper in `get-shit-done/bin/lib/core.cjs`. This function:
- In raw mode: writes `String(rawValue)` directly
- In JSON mode: serializes `result` as pretty-printed JSON
- For large payloads (>50KB): writes to a temp file and outputs `@file:/path/to/file.json`
- Always uses `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race)

```javascript
function output(result, raw, rawValue) {
  // ... writes to stdout via fs.writeSync(1, data)
}
```

## Concurrency Primitives

Use `withPlanningLock(cwd, fn)` from `get-shit-done/bin/lib/core.cjs` for any write to `.planning/` files. Use `atomicWriteFileSync(filePath, content)` for writes that must survive process crashes:

```javascript
function atomicWriteFileSync(filePath, content, encoding = 'utf-8') {
  const tmpPath = filePath + '.tmp.' + process.pid;
  try {
    fs.writeFileSync(tmpPath, content, encoding);
    fs.renameSync(tmpPath, filePath);
  } catch (renameErr) {
    try { fs.unlinkSync(tmpPath); } catch { }
    fs.writeFileSync(filePath, content, encoding);
  }
}
```

## Comments

**When to Comment:**
- Module-level JSDoc block at the top of every lib file naming the module and its purpose
- Section separator banners (`// ─── Section Name ───`) to group related functions
- Inline comments for non-obvious logic, especially around concurrency, OS edge cases, and issue references
- Issue numbers cited inline: `// (#1916)`, `// fix #1967`

**JSDoc usage:**
- Used on public/exported functions that are called by many consumers
- `@param` and `@returns` tags used on helper functions

**Example:**
```javascript
/**
 * Acquire a file-based lock for .planning/ writes.
 * Prevents concurrent worktrees from corrupting shared planning files.
 * Lock is auto-released after the callback completes.
 */
function withPlanningLock(cwd, fn) { ... }
```

## Function Design

**Size:** Functions are medium-sized (20–100 lines typical); large state/init modules have some functions exceeding 100 lines for command handlers that parse complex structured data.

**Parameters:**
- `cwd` (working directory string) is the first parameter for all functions that touch `.planning/`
- `raw` (boolean) is last parameter on CLI-facing functions that control output format
- Options objects used when a command has 3+ optional args (e.g., `cmdPhasesList(cwd, options, raw)`)

**Return Values:**
- Internal helpers return plain values or `null` for not-found
- CLI command handlers write to stdout via `output()` and return `undefined`
- Functions that can fail return `null` rather than throwing

## Module Design

**Exports:**
- Single `module.exports = { ... }` block at the end of each lib file listing all exported names
- Internal helpers not needed by other modules are not exported (not prefixed, not in exports block)
- `get-shit-done/bin/gsd-tools.cjs` is the CLI entry point that requires lib modules and dispatches commands

**No barrel files** — each module is imported directly by path.
