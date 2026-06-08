# Phase 61: Worktree Safety Coverage - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 1 (modified)
**Analogs found:** 1 / 1

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | test | request-response (file read + assertion) | itself — existing `describe('bug #3097...')` and `describe('bug #3099...')` blocks | exact |

## Pattern Assignments

### `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` (test, file-I/O + assertion)

**Analog:** Same file — existing describe blocks (lines 30–103).

**Imports pattern** (lines 1–25): already present, no new imports needed. The new describe block reuses `executorSrc` already read at module scope.

```js
'use strict';
// allow-test-rule: reads markdown product files (gsd-executor.md, ...) to verify structural protocol — not source-grep

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const executorSrc = fs.readFileSync(
  path.join(ROOT, 'agents', 'gsd-executor.md'), 'utf8',
);
```

**Block-slice pattern** (lines 32–35 and 43–45 and 65–68 — identical across every test):

```js
const protocolIdx = executorSrc.indexOf('<task_commit_protocol>');
const protocolEnd = executorSrc.indexOf('</task_commit_protocol>');
assert.ok(protocolIdx !== -1 && protocolEnd !== -1, 'task_commit_protocol block not found');
const protocol = executorSrc.slice(protocolIdx, protocolEnd);
```

Repeat this exact slice at the top of each `test()` body. Never assert on `executorSrc` directly — assertions must be scoped to `protocol` (SC-3).

**Core assertion pattern** (lines 36–39 and 46–49 and 69–74 — `assert.ok` with descriptive failure message):

```js
assert.ok(
  protocol.includes('<TOKEN>'),
  'task_commit_protocol missing <TOKEN> — <what fix is not applied>',
);
```

Use one `assert.ok` per logical assertion. The message names the file (implicit via context) and the missing token.

**Describe block naming convention** (line 30 and 64):

```js
describe('bug #3097: cwd-drift sentinel in gsd-executor.md', () => { ... });
describe('bug #3099: absolute-path safety guidance in gsd-executor.md', () => { ... });
```

For the new phase-61 block, follow D-01: name it `'phase-61: submodule exclusion guard'`, not a bug number.

```js
describe('phase-61: submodule exclusion guard', () => { ... });
```

**Tokens to assert** — extracted directly from `agents/gsd-executor.md` lines 455–463:

| Token | Line in agent | What it proves |
|-------|---------------|----------------|
| `.git/worktrees/` | 457, 465 | Worktree-positive condition (SC-1) |
| `GIT_CONTENT=` | 462 | Behavioral reset that makes the guard skip for non-worktree `.git` files (D-02.1) |
| `skip worktree guards` | 461 | Intent-documenting comment text — source-text-is-the-product assertion (D-02.2) |

**Existing coverage check** (lines 46–49 — `describe('bug #3097...')`):

```js
assert.ok(
  protocol.includes('rev-parse --git-dir') || protocol.includes('worktrees/'),
  'cwd-drift detection does not use git rev-parse --git-dir or .git/worktrees/ pattern',
);
```

This assertion uses a disjunction and covers `worktrees/` (not the full token `.git/worktrees/`). Per the CONTEXT.md `<specifics>` note, the new test should assert `.git/worktrees/` unconditionally and standalone for SC-1 compliance. The new assertion is not a strict duplicate.

---

## Shared Patterns

### Block-slice guard
**Source:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` lines 32–35
**Apply to:** Every `test()` body in the new describe block

```js
const protocolIdx = executorSrc.indexOf('<task_commit_protocol>');
const protocolEnd = executorSrc.indexOf('</task_commit_protocol>');
assert.ok(protocolIdx !== -1 && protocolEnd !== -1, 'task_commit_protocol block not found');
const protocol = executorSrc.slice(protocolIdx, protocolEnd);
```

### Assertion style
**Source:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` lines 36–39
**Apply to:** All new assertions

```js
assert.ok(
  protocol.includes('<TOKEN>'),
  '<file> task_commit_protocol missing <TOKEN> — <description>',
);
```

One `assert.ok` per token. Never combine tokens in a disjunction for the new SC-1/SC-2 assertions — each must be standalone so failures name the exact missing token.

---

## No Analog Found

None — the exact pattern exists in the same file being modified.

---

## Metadata

**Analog search scope:** `tests/` directory, specifically `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs`
**Files scanned:** 2 (`tests/bug-3097-3099-executor-worktree-path-safety.test.cjs`, `agents/gsd-executor.md` lines 450–465)
**Pattern extraction date:** 2026-06-08
