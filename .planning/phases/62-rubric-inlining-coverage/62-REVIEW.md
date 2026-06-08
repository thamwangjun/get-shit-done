---
phase: 62-rubric-inlining-coverage
reviewed: 2026-06-08T07:37:00Z
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

**Reviewed:** 2026-06-08T07:37:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`tests/debug-session-management.test.cjs` is a 203-line, 23-test file covering debug session management, skill dispatch (#2148, #2151), and the phase-62 rubric inlining contract. All 21 active tests pass; 2 are skipped. One skip suppresses a real assertion failure — the regex `/only use the write tool/i` does not match the agent's actual phrasing ("Always use the Write tool."), so the test would fail if unskipped. Additional findings: inconsistent `__dirname` vs `process.cwd()` path resolution (18 of 20 tests use the fragile form), a one-sided security boundary check, and a too-broad tool-presence check.

## Critical Issues

### CR-01: `test.skip` at line 184 suppresses an assertion that would fail

**File:** `tests/debug-session-management.test.cjs:184`

**Issue:** The test `gsd-debug-session-manager includes anti-heredoc rule` is silently skipped with no justification comment. Its body asserts `/only use the write tool/i` against `agents/gsd-debug-session-manager.md`. The agent's actual anti-heredoc rule reads:

> "Always use the Write tool."

This phrase does not match the regex (it is missing the word "only"). Removing the skip causes the test to fail immediately. The sister skip at line 133 provides an explicit skip reason (`'fork intentionally diverges from upstream contract'`) and is correct — the fork does not carry `DATA_START` in `gsd-debugger.md`. No equivalent justification exists for line 184.

Furthermore, `agent-frontmatter.test.cjs` also skips the anti-heredoc check for all file-writing agents via `describe.skip('HDOC: ...')` at line 38. Both files skip the same rule for the same agent. This means **no active test enforces the `Only use the Write tool` wording contract** on `gsd-debug-session-manager.md`, while CLAUDE.md explicitly states this is a required invariant for every file-writing agent.

**Fix:** Choose one of two options:

Option A — align the agent text to satisfy the existing regex (in `agents/gsd-debug-session-manager.md`, line 20):
```
Change: "Always use the Write tool."
To:     "Only use the Write tool for file creation."
```

Then remove the skip:
```javascript
test('gsd-debug-session-manager includes anti-heredoc rule', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'agents', 'gsd-debug-session-manager.md'),
    'utf8'
  );
  assert.ok(/only use the write tool/i.test(content),
    'gsd-debug-session-manager missing anti-heredoc rule');
});
```

Option B — document that the fork's phrasing differs, update the check to match, and restore as active:
```javascript
// The fork uses "Always use the Write tool" rather than the upstream "Only use the Write tool"
test('gsd-debug-session-manager includes anti-heredoc rule', () => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'agents', 'gsd-debug-session-manager.md'),
    'utf8'
  );
  assert.ok(/always use the write tool/i.test(content),
    'gsd-debug-session-manager missing anti-heredoc rule');
});
```

---

## Warnings

### WR-01: Inconsistent path resolution — `process.cwd()` used instead of `__dirname`

**File:** `tests/debug-session-management.test.cjs:32` (and 18 other call sites)

**Issue:** The first two tests (lines 15–16 and 23–24) resolve `DEBUG.md` using `path.join(__dirname, '..', 'get-shit-done', 'templates', 'DEBUG.md')`. All subsequent tests (lines 32, 43, 54, 65, 76, 91, 99, 110, 118, 127, 135, 145, 151, 157, 163, 169, 174, 180, 185, 190, 198) use `process.cwd()`. `__dirname` is anchored to the test file's location on disk and is invariant; `process.cwd()` is the invoking process's working directory and is environment-dependent.

When the test suite is run from any directory other than the project root (e.g. `node --test tests/debug-session-management.test.cjs` from `~/`), all 21 `process.cwd()`-based `readFileSync` calls throw `ENOENT` while the two `__dirname`-based calls continue to work. This is the opposite of the project convention: every other test file in `tests/` uses `__dirname`-anchored paths (see `agent-frontmatter.test.cjs` lines 20–22).

**Fix:** Hoist a single `ROOT` constant and use it everywhere:
```javascript
const ROOT = path.join(__dirname, '..');

// Replace all process.cwd()-based paths:
path.join(ROOT, 'get-shit-done', 'workflows', 'debug.md')
path.join(ROOT, 'agents', 'gsd-debugger.md')
path.join(ROOT, 'agents', 'gsd-debug-session-manager.md')
path.join(ROOT, 'agents', 'gsd-user-profiler.md')
```

### WR-02: Security hardening test checks only `DATA_START`, not `DATA_END`

**File:** `tests/debug-session-management.test.cjs:89-95`

**Issue:** The test `debug command contains security hardening` asserts only `content.includes('DATA_START')`. Every other security boundary test in this file asserts both markers: `DATA_START && DATA_END` (lines 156–160 and 173–177). An unpaired `DATA_START` without a `DATA_END` does not form a bounded injection barrier. This test would pass even if the closing `DATA_END` marker were removed from `debug.md`, silently allowing an incomplete security boundary to ship.

**Fix:**
```javascript
test('debug command contains security hardening', () => {
  const content = fs.readFileSync(
    path.join(ROOT, 'get-shit-done', 'workflows', 'debug.md'),
    'utf8'
  );
  assert.ok(
    content.includes('DATA_START') && content.includes('DATA_END'),
    'debug.md must contain both DATA_START and DATA_END injection boundary markers'
  );
});
```

### WR-03: `Agent` tool-presence check is too broad — substring match on full file content

**File:** `tests/debug-session-management.test.cjs:163-166`

**Issue:** `assert.ok(content.includes('Agent'), ...)` checks that the word `Agent` appears anywhere in `gsd-debug-session-manager.md`. The string `Agent` appears four times in the file: in `tools:` frontmatter (line 4), in the `description:` value (line 3), in a Markdown section heading (`## Step 2: Spawn gsd-debugger Agent`, line 56), and in the `Agent(` call body (line 92). This check would still pass if `Agent` were removed from the `tools:` line but remained in a section heading or prose — meaning a broken tool permission would go undetected.

**Fix:** Scope the assertion to the `tools:` frontmatter line:
```javascript
test('gsd-debug-session-manager agent exists with correct tools', () => {
  const content = fs.readFileSync(
    path.join(ROOT, 'agents', 'gsd-debug-session-manager.md'),
    'utf8'
  );
  const toolsLine = (content.match(/^tools:\s*.+$/m) || [''])[0];
  assert.ok(toolsLine.includes('Agent'),
    'gsd-debug-session-manager missing Agent in tools: frontmatter');
  assert.ok(toolsLine.includes('AskUserQuestion'),
    'gsd-debug-session-manager missing AskUserQuestion in tools: frontmatter');
});
```

---

## Info

### IN-01: File-level `pending-migration-to-typed-ir` exemption misclassifies the phase-62 block

**File:** `tests/debug-session-management.test.cjs:1-6` and `196-203`

**Issue:** The file-level annotation `// allow-test-rule: pending-migration-to-typed-ir [#2974]` marks the entire file as "tracked for refactoring to typed-IR assertions." The phase-62 describe block added at lines 196–203 reads `agents/gsd-user-profiler.md` and asserts on its text content.

Per the project's own note (`agent-frontmatter.test.cjs` line 1: `// allow-test-rule: source-text-is-the-product`), agent `.md` files are the installed product — their deployed text IS what Claude Code loads at runtime, so string-content assertions are the correct test form and do not need to migrate to typed IR. Leaving the phase-62 block under the `pending-migration-to-typed-ir` annotation risks the migration ticket (#2974) attempting to "refactor" tests that are correctly written as raw text checks.

**Fix:** Extract the phase-62 describe block into a separate file with the correct exemption:
```javascript
// tests/rubric-inlining-coverage.test.cjs
'use strict';

// allow-test-rule: source-text-is-the-product
// gsd-user-profiler.md is an agent definition file; its deployed text is the
// product that Claude Code loads at runtime. String assertions are the correct
// test form per the project convention in agent-frontmatter.test.cjs.
```

### IN-02: Same files read repeatedly with no module-level caching

**File:** `tests/debug-session-management.test.cjs:31-198`

**Issue:** `get-shit-done/workflows/debug.md` is opened with `readFileSync` on 9 separate test lines across two describe blocks. `agents/gsd-debugger.md` is opened 4 times; `agents/gsd-debug-session-manager.md` is opened 5 times; `agents/gsd-user-profiler.md` is opened once. Each call is an independent synchronous disk read. Changing any file path requires locating and updating multiple lines. The project convention (established in `agent-frontmatter.test.cjs`) is to load files once at module scope.

**Fix:** Hoist to module scope alongside the `ROOT` constant introduced in WR-01:
```javascript
const ROOT = path.join(__dirname, '..');
const debugWorkflow    = fs.readFileSync(path.join(ROOT, 'get-shit-done', 'workflows', 'debug.md'), 'utf8');
const gsdDebugger      = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debugger.md'), 'utf8');
const sessionManager   = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debug-session-manager.md'), 'utf8');
const debugTemplate    = fs.readFileSync(path.join(ROOT, 'get-shit-done', 'templates', 'DEBUG.md'), 'utf8');
const userProfiler     = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-user-profiler.md'), 'utf8');
```

---

_Reviewed: 2026-06-08T07:37:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
