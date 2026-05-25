# Coding Conventions

**Analysis Date:** 2026-05-25

## Naming Patterns

**Files:**
- Source lib modules: `kebab-case.cjs` — e.g., `core.cjs`, `model-profiles.cjs`, `profile-pipeline.cjs`
- Generated CJS modules: `kebab-case.generated.cjs` — e.g., `phase-lifecycle.generated.cjs`, `configuration.generated.cjs`
- Test files: `kebab-case.test.cjs` — one test file per lib module plus integration/regression tests
- Bug regression tests: `bug-<issue-number>-<description>.test.cjs` — e.g., `bug-1891-file-resolution.test.cjs`
- Helper scripts in `scripts/`: `kebab-case.cjs`
- Suite-labeled test files: `<name>.<suite>.test.cjs` — e.g., `release-tarball-smoke.install.test.cjs`

**Functions:**
- All functions use `camelCase` — e.g., `findProjectRoot`, `atomicWriteFileSync`, `comparePhaseNum`
- CLI command handler functions prefixed with `cmd` — e.g., `cmdPhasesList`, `cmdStateLoad`, `cmdStatePatch`
- Internal-only helpers suffixed with `Internal` — e.g., `findPhaseInternal`, `generateSlugInternal`, `resolveModelInternal`

**Variables:**
- `camelCase` for local variables
- `SCREAMING_SNAKE_CASE` for module-level constants — e.g., `CONFIG_DEFAULTS`, `WORKSTREAM_SESSION_ENV_KEYS`, `TEST_ENV_BASE`
- Temporary directory variables named `tmpDir` (tests)
- Working directory parameter always named `cwd`

**Types:**
- No TypeScript in runtime code; CommonJS with runtime type checks only
- Module-level constant objects with `SCREAMING_SNAKE_CASE` keys (e.g., `ERROR_REASON` frozen enum in `core.cjs`)

## Code Style

**Formatting:**
- No Prettier or ESLint config detected — formatting is maintained by convention
- 2-space indentation (consistent across all `get-shit-done/bin/lib/*.cjs` files)
- Single quotes for string literals in most places
- Template literals used for multi-token string construction

**Language constraints:**
- CommonJS only (`require`, `module.exports`) — no ES modules in lib or test code
- `'use strict'` used explicitly in scripts (e.g., `scripts/run-tests.cjs`) and some test files
- The SDK layer at `sdk/src/*.ts` uses TypeScript with ES2022 modules; these are a separate compilation target

## Import Organization

**Order (within lib files):**
1. Node.js built-ins — `fs`, `path`, `os`, `child_process`
2. Internal lib modules — `require('./core.cjs')`, `require('./planning-workspace.cjs')`
3. Generated modules — `require('./configuration.generated.cjs')`

**Pattern:**
- Destructured imports are the norm: `const { output, error, ERROR_REASON } = require('./core.cjs')`
- Path-based requires only — no package aliases used in CJS lib files
- Tests use `require('node:test')` and `require('node:assert/strict')` (explicit node: protocol prefix)

## Error Handling

**Patterns:**
- `error(msg, ERROR_REASON.CODE)` in `get-shit-done/bin/lib/core.cjs` calls `process.exit(1)` — all lib modules use this
- Internal helpers return `null` for not-found rather than throwing
- CLI command handlers write to stdout via `output()` and return `undefined`
- Error codes are typed enum values in frozen object `ERROR_REASON` (`core.cjs:155`) — e.g., `ERROR_REASON.PHASE_NOT_FOUND`
- Lock files tracked in `_heldStateLocks` / `_heldPlanningLocks` Sets, removed on `process.on('exit')`
- Plan revision loop (max 3 iterations) in `plan-phase.md` workflow when `gsd-plan-checker` fails

**Output strategy:**
- In raw mode: writes `String(rawValue)` directly via `fs.writeSync(1, data)` (synchronous, avoids pipe teardown race)
- In JSON mode: serializes `result` as pretty-printed JSON
- For large payloads (>50KB): writes to a temp file and outputs `@file:/path/to/file.json` prefix
- Always uses `fs.writeSync(1, data)` — never `console.log` in lib code

## Logging

**Framework:** No logging framework — `console.error` for diagnostic messages to stderr only in scripts/tests

**Patterns:**
- Lib modules never use `console.log` — use `output()` from `core.cjs` for stdout
- Scripts use `console.error()` for user-facing messages (goes to stderr, not captured by callers)
- Issue numbers cited inline: `// (#1916)`, `// fix #1967`

## Comments

**When to Comment:**
- Module-level JSDoc block at the top of every lib file naming the module and its purpose
- Section separator banners (`// ─── Section Name ───`) to group related functions within a file
- Inline comments for non-obvious logic — concurrency, OS edge cases, issue references
- Issue numbers cited inline when fixing a specific bug: `// (#1916)`, `// fix #1967`
- `@param` and `@returns` tags used on helper functions and exported APIs

**Example module header:**
```javascript
/**
 * State — STATE.md operations and progression engine
 */
```

**Example section banner:**
```javascript
// ─── Configuration Module (generated CJS mirror) ────────────────────────────
```

## Function Design

**Parameters:**
- `cwd` (working directory string) is the **first** parameter for all functions that touch `.planning/`
- `raw` (boolean) is **last** parameter on CLI-facing functions that control output format
- Options objects used when a command has 3+ optional args: `cmdPhasesList(cwd, options, raw)`

**Return Values:**
- Internal helpers return plain values or `null` for not-found
- CLI command handlers write to stdout via `output()` and return `undefined`
- Functions that can fail return `null` rather than throwing (exception: `error()` calls `process.exit(1)`)

## Module Design

**Exports:**
- Single `module.exports = { ... }` block at the end of each lib file listing all exported names
- Internal helpers not needed by other modules are not exported (not prefixed, not in exports block)

**Entry Point:**
- `get-shit-done/bin/gsd-tools.cjs` is the CLI entry point that requires lib modules and dispatches commands

**Generated Modules:**
- Files ending in `.generated.cjs` are machine-generated from TypeScript SDK sources
- `scripts/gen-*.mjs` scripts regenerate them — do not edit by hand
- Comments at top of generated files note source file and regeneration command

## Concurrency Primitives

- File-locking via lock files (`.planning/STATE.md.lock`) for parallel-safe writes during wave execution
- Lock sets tracked in process-scoped `Set` instances (`_heldStateLocks`, `_heldPlanningLocks`)
- `process.on('exit')` cleanup registered to remove stale locks even on `process.exit(1)`
- Synchronous Atomics-based sleep in tests: `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)` — used only in retry helpers, never in lib code

---

*Convention analysis: 2026-05-25*
