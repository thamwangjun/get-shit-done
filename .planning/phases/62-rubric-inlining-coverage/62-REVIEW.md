---
phase: 62-rubric-inlining-coverage
reviewed: 2026-06-08T08:30:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - tests/debug-session-management.test.cjs
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 62: Code Review Report

**Reviewed:** 2026-06-08T08:30:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`tests/debug-session-management.test.cjs` is a 203-line, 23-test file covering debug session management, skill dispatch, and the new phase-62 rubric inlining coverage. All 21 active tests pass and 2 are skipped. One of those skips hides a real assertion failure — the test body would fail if unskipped because the pattern it checks (`/only use the write tool/i`) does not match the agent's actual anti-heredoc phrasing ("Always use the Write tool."). Additional findings include inconsistent path resolution strategy, a single-sided security boundary assertion, and an overly broad tool-presence check.

## Critical Issues

### CR-01: `test.skip` at line 184 silently hides a real assertion failure

**File:** `tests/debug-session-management.test.cjs:184`

**Issue:** The test `gsd-debug-session-manager includes anti-heredoc rule` uses `test.skip(...)` with no documented reason. The test body checks `/only use the write tool/i` against `agents/gsd-debug-session-manager.md`. The agent's actual anti-heredoc instruction reads "Always use the Write tool." — this phrase does not satisfy the regex. If the skip were removed, the test would fail immediately.

The sister skip at line 133 uses `{ skip: 'fork intentionally diverges from upstream contract' }` and is correct (the fork does not carry `DATA_START` in `gsd-debugger.md`). The skip at line 184 carries no such justification and its failure mode proves the underlying source text is out of conformance with the check intended.

`agent-frontmatter.test.cjs` defines `FILE_WRITING_AGENTS` as agents whose `tools:` line includes `Write`, then validates them in a `describe.skip('HDOC: ...')` block — meaning the frontmatter test suite also skips this check. Both the frontmatter test and this test skip the same rule for the same agent. This means **no active test enforces the anti-heredoc wording contract** on `gsd-debug-session-manager.md`.

**Fix:** Either align the agent text to satisfy the existing regex, or document why the fork uses different wording and update the check to match the fork's phrasing:

```javascript
// Option A — update the agent text (agents/gsd-debug-session-manager.md line 20):
// Change: "Always use the Write tool."
// To:     "Only use the Write tool for file creation."

// Option B — update the test to match fork phrasing and restore it as active:
test('gsd-debug-session-manager includes anti-heredoc rule', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'agents', 'gsd-debug-session-manager.md'),
    'utf8'
  );
  assert.ok(
    /always use the write tool/i.test(content),
    'gsd-debug-session-manager missing anti-heredoc instruction'
  );
});
```

---

## Warnings

### WR-01: Inconsistent path resolution strategy (`__dirname` vs `process.cwd()`) within the same file

**File:** `tests/debug-session-management.test.cjs:15-16` and `32`

**Issue:** The first two tests (lines 14–28) resolve the `DEBUG.md` template path using `path.join(__dirname, '..', 'get-shit-done', 'templates', 'DEBUG.md')`. Every subsequent test (lines 30–203) resolves paths using `process.cwd()`. `__dirname` is always anchored to the test file's location on disk; `process.cwd()` depends on the working directory of the calling process. When the test suite is invoked from a directory other than the project root, `process.cwd()`-based paths silently throw `ENOENT` while `__dirname`-based paths continue to work correctly.

The project convention used throughout all other test files is `__dirname`-relative (see `agent-frontmatter.test.cjs` lines 20–22, which defines `AGENTS_DIR`, `WORKFLOWS_DIR`, and `COMMANDS_DIR` all via `__dirname`).

**Fix:** Replace all `process.cwd()` calls in this file with `path.join(__dirname, '..')`:

```javascript
// At the top of the file, after the require() block:
const ROOT = path.join(__dirname, '..');

// Then every path becomes:
path.join(ROOT, 'get-shit-done/workflows/debug.md')
path.join(ROOT, 'agents', 'gsd-debugger.md')
path.join(ROOT, 'agents', 'gsd-debug-session-manager.md')
path.join(ROOT, 'agents', 'gsd-user-profiler.md')
```

### WR-02: Security hardening test checks only `DATA_START`, not `DATA_END`

**File:** `tests/debug-session-management.test.cjs:89-95`

**Issue:** The test `debug command contains security hardening` asserts only that `debug.md` contains the `DATA_START` marker. Every other security boundary test in this file (`lines 156–160`, `173–177`) correctly asserts both `DATA_START && DATA_END`. A `DATA_START` without a `DATA_END` does not constitute a properly bounded injection barrier — the asymmetric check would pass even if the closing `DATA_END` marker were removed from `debug.md`.

**Fix:**
```javascript
test('debug command contains security hardening', () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'get-shit-done/workflows/debug.md'),
    'utf8'
  );
  assert.ok(
    content.includes('DATA_START') && content.includes('DATA_END'),
    'debug.md must contain both DATA_START and DATA_END injection boundary markers'
  );
});
```

### WR-03: Weak `Agent` tool-presence check uses substring match on full file content

**File:** `tests/debug-session-management.test.cjs:163-165`

**Issue:** The test `gsd-debug-session-manager agent exists with correct tools` checks `content.includes('Agent')`. The string `Agent` appears four times in the file: in the `tools:` frontmatter line, the `description:` value, a Markdown section header (`## Step 2: Spawn gsd-debugger Agent`), and the `Agent(` call in the process body. This check would pass even if `Agent` were removed from the `tools:` line but remained present in a heading or prose description, falsely asserting the required tool permission is set.

**Fix:** Scope the assertion to the frontmatter `tools:` line:
```javascript
test('gsd-debug-session-manager agent exists with correct tools', () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'agents', 'gsd-debug-session-manager.md'),
    'utf8'
  );
  const toolsLine = content.match(/^tools:\s*.+$/m);
  assert.ok(toolsLine, 'gsd-debug-session-manager missing tools: frontmatter');
  assert.ok(toolsLine[0].includes('Agent'), 'gsd-debug-session-manager missing Agent tool in tools: line');
  assert.ok(toolsLine[0].includes('AskUserQuestion'), 'gsd-debug-session-manager missing AskUserQuestion tool in tools: line');
});
```

---

## Info

### IN-01: Phase-62 describe block uses `pending-migration-to-typed-ir` exemption when `source-text-is-the-product` applies

**File:** `tests/debug-session-management.test.cjs:1-6` and `196-203`

**Issue:** The file-level `// allow-test-rule: pending-migration-to-typed-ir [#2974]` annotation designates the entire file as "tracked for correction." The newly added `phase-62: rubric inlining coverage` describe block (lines 196–203) reads `agents/gsd-user-profiler.md` and asserts on its text content.

Per `CONTRIBUTING.md`, `source-text-is-the-product` is the correct exemption for tests that assert on workflow, agent, and command `.md` files: "the deployed text IS what the runtime loads." CONTRIBUTING.md also states: "New tests cannot use this category [pending-migration-to-typed-ir] — they must refactor production to expose typed IR."

The phase-62 block is not a migration candidate — its raw-text assertions ARE the appropriate test form for source-is-product files. Leaving it under the pending-migration annotation obscures this distinction and may cause the migration ticket (#2974) to attempt to "fix" tests that should stay as-is.

**Fix:** Move the phase-62 describe block to its own file with the correct exemption:

```javascript
// tests/rubric-inlining-coverage.test.cjs
'use strict';

// allow-test-rule: source-text-is-the-product
// gsd-user-profiler.md is an agent definition; its deployed text is the product.
// String-content assertions are the correct test form per CONTRIBUTING.md.
```

### IN-02: Repeated `readFileSync` calls for the same files — no module-level caching

**File:** `tests/debug-session-management.test.cjs:31-203`

**Issue:** `get-shit-done/workflows/debug.md` is read 7 times across separate test cases (lines 31, 42, 53, 64, 75, 91, 99, 151, 157, 190 — some spread across two describe blocks). `agents/gsd-debugger.md` is read 4 times; `agents/gsd-debug-session-manager.md` is read 5 times. Each call is an independent synchronous disk read.

This is not a correctness issue, but it goes against the project convention established in `agent-frontmatter.test.cjs`, which pre-reads all agent files once at the module level using `ALL_AGENTS.filter(...)`. The repeated reads make the test file harder to maintain (changing a file path requires updating multiple lines) and slower on constrained CI environments.

**Fix:** Hoist file reads to module scope, following the pattern in `agent-frontmatter.test.cjs`:

```javascript
const ROOT = path.join(__dirname, '..');
const debugWorkflow = fs.readFileSync(path.join(ROOT, 'get-shit-done/workflows/debug.md'), 'utf8');
const gsdDebugger = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debugger.md'), 'utf8');
const sessionManager = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debug-session-manager.md'), 'utf8');
const debugTemplate = fs.readFileSync(path.join(ROOT, 'get-shit-done', 'templates', 'DEBUG.md'), 'utf8');
const userProfiler = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-user-profiler.md'), 'utf8');
```

---

_Reviewed: 2026-06-08T08:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
