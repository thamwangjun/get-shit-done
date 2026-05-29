---
phase: "44"
name: resolver-core
goal: >
  resolveIncludes() exists in bin/install.js as a correct, fully-tested pure function
  that handles all edge cases before any integration work begins — the hardest constraint
  (conditional guard) is validated first.
tasks:
  - id: "44.1"
    title: "Implement resolveIncludes() in bin/install.js"
    description: >
      Add the resolveIncludes(content, sourceRoot, seen, depth = 0) pure function to
      bin/install.js in the content-processing cluster (~line 1746, after
      replaceRelativePathReference). Include a // ─── Include Resolution ─── section
      banner. Export the function from the module.exports block at ~line 11430.
    files_to_create: []
    files_to_modify:
      - bin/install.js
    depends_on: []
    test_command: npm test
  - id: "44.2"
    title: "Write tests/resolve-includes.test.cjs — 4 unit tests"
    description: >
      Create tests/resolve-includes.test.cjs with exactly the 4 unit tests that map
      to the phase success criteria: (1) bare @~/.claude/ line inlining, (2) conditional
      guard pass-through, (3) circular-include detection error, (4) missing-file error.
    files_to_create:
      - tests/resolve-includes.test.cjs
    files_to_modify: []
    depends_on:
      - "44.1"
    test_command: npm test
---

## Plan

### Why 2 tasks, and in this order

The function specification is complete and unambiguous (D-01 through D-16). TDD was considered — RED first would normally be appropriate — but every behavioral rule, edge-case, and signature detail is already locked in the decisions. Implementing the function first (44.1) then writing the tests against it (44.2) is the correct order here because:

1. The test file imports `resolveIncludes` directly from `bin/install.js`. Writing the import before the export exists produces an immediate module load error that obscures test output.
2. The 4 test cases map exactly to the 4 success criteria — no design discovery is needed during testing. The tests are assertions against a fully-specified contract, not a design tool.
3. A single executor context handles 44.1 cleanly. Adding the 4 tests to the same task would push the context budget past ~30% without benefit.

### Function placement in bin/install.js

Insert between `replaceRelativePathReference` (ends ~line 1745) and `convertCopilotToolName` (~line 1753).

Exact insertion point: after the closing `}` of `replaceRelativePathReference` on ~line 1745, before the `/**` JSDoc of the next function.

Add a section banner before the function:

```
// ─── Include Resolution ───────────────────────────────────────────────────────
```

### module.exports addition

In the `module.exports` block that starts ~line 11415, add `resolveIncludes` to the exported names list. The block ends with a `};` — insert `resolveIncludes,` alongside the other content-processing helpers (`processAttribution`, `replaceRelativePathReference`).

### The 4 test cases (exact mapping from success criteria)

**Test 1 — bare `@~/.claude/` inlining (success criterion 1)**

Test name: `'inlines bare @~/.claude/ reference by reading file at sourceRoot path'`

Setup: Create a temp directory acting as `sourceRoot`. Write a file at `get-shit-done/workflows/execute-plan.md` inside it with content `# Execute Plan\nsome content`. Call `resolveIncludes` with content that has a bare `@~/.claude/get-shit-done/workflows/execute-plan.md` line.

Assert: the returned string contains `# Execute Plan` and does NOT contain the original `@~/.claude/` reference line.

Also cover the `` !`cat ~/.claude/foo` `` form in the same or adjacent assertion.

**Test 2 — conditional guard pass-through (success criterion 2, per D-12)**

Test name: `'passes through @~ inside ${...} template expression verbatim'`

Input content: a line containing `${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}` — this is the exact line from `execute-phase.md:619`.

Assert: `resolveIncludes(content, sourceRoot, new Set())` returns a string where `${CONTEXT_WINDOW < 200000 ?` is still present (the template expression was not expanded or corrupted).

No file at the referenced path needs to exist because the resolver must skip it before attempting any filesystem read.

**Test 3 — circular include detection (success criterion 3, per D-06)**

Test name: `'throws with full include chain on circular reference'`

Setup: Create two files in a temp sourceRoot: `a.md` whose content has a bare `@~/.claude/b.md` line, and `b.md` whose content has a bare `@~/.claude/a.md` line. Pre-populate `seen` with the path for `a.md` to simulate the call stack already processing `a.md` when it is about to include `b.md` which circles back.

Assert: calling `resolveIncludes` with `a.md` content, sourceRoot, a `seen` Set pre-seeded with `a.md`'s resolved path, and `depth = 0` throws an `Error` whose message contains both filenames (the chain).

**Test 4 — missing file error (success criterion 4)**

Test name: `'throws naming both source file and unresolvable path when referenced file is missing'`

Setup: Call `resolveIncludes` with content containing `@~/.claude/nonexistent/path.md` as a bare line. The file does not exist in sourceRoot. Pass a notional source file path as context so the error can name it.

Assert: the thrown `Error` message contains both the source file identifier and the missing path.

### Key implementation rules (executor reference)

These are the D-NN decisions the executor must apply. Each is cited in the task action below.

| Decision | Rule |
|----------|------|
| D-03 | Signature: `resolveIncludes(content, sourceRoot, seen, depth = 0)` |
| D-04 | `seen` = `Set` of resolved file paths in current call stack; callers pass `new Set()` |
| D-05 | `seen` for circular detection; `depth` integer for depth limiting — separate mechanisms |
| D-06 | Circular: if file-to-include is in `seen`, throw Error with full chain |
| D-07 | Depth: if `depth >= 3`, throw with descriptive error naming the chain |
| D-09 | Expand any bare `@filepath` line (trim-and-check), not just `@~/.claude/` |
| D-10 | Expand bare `` !`cat <path>` `` lines (cat commands only) |
| D-11 | Skip patterns inside fenced code blocks (toggle on triple-backtick) |
| D-12 | Skip `@~` and `` !`...` `` patterns inside `${...}` template expressions |
| D-13 | `sourceRoot` = project root (contains `get-shit-done/`, `bin/`, `agents/`) |
| D-14 | `@~/.claude/foo` and `@$HOME/.claude/foo`: strip prefix, `path.join(sourceRoot, remainder)` |
| D-15 | Same strip logic for `` !`cat ~/.claude/foo` `` and `` !`cat $HOME/.claude/foo` `` |
| D-16 | Other bare `@`-references: resolve relative to the source file's directory |

---

## Tasks (detailed)

### Task 44.1 — Implement `resolveIncludes()` in `bin/install.js`

**Files modified:** `bin/install.js`

**Action:**

Read `bin/install.js` lines 1735–1755 to confirm the exact end-of-`replaceRelativePathReference` line. Insert the `// ─── Include Resolution ───` banner and the `resolveIncludes` function immediately after the closing `}` of `replaceRelativePathReference`.

Implement `resolveIncludes(content, sourceRoot, seen, depth = 0)` (per D-03) with this behavior:

- Split content into lines. Maintain a boolean `inFencedBlock` toggled on every line whose trim equals ```` ``` ```` or starts with ```` ``` ```` (triple-backtick fence open/close) — per D-11.
- For each line, before pattern-matching, check if the line contains an unbalanced `${` that opened earlier and has not yet closed (D-12). Track `${...}` nesting depth across the line. If the current line is inside a template expression, emit it verbatim.
- D-12 detail: scan each character. When `${` is seen, increment template depth; when `}` is seen and template depth > 0, decrement. A line is "inside template" only if a `${` opened on a prior line and no matching `}` has appeared — this handles multi-line template literals. For single-line `${...}` the expression opens and closes on the same line, so any `@` or `` !`...` `` on that line IS inside `${...}` and must be skipped.
- Bare `@` line detection (per D-09): `line.trim()` starts with `@` and the trim is the entire meaningful content of the line. Apply to any `@`-reference, not just `@~/.claude/`.
- Bare `` !`cat ` `` line detection (per D-10): `line.trim()` matches `` /^!`cat\s+([^`]+)`$/ ``.
- Path resolution (per D-14, D-15, D-16):
  - `@~/.claude/foo` or `@$HOME/.claude/foo` → strip `@`, strip `~/.claude/` or `$HOME/.claude/` prefix → `path.join(sourceRoot, remainder)`
  - `` !`cat ~/.claude/foo` `` or `` !`cat $HOME/.claude/foo` `` → same strip logic applied to the cat argument
  - Other bare `@path` (per D-16) → resolve relative to the directory of the file currently being processed (callers must pass the source file path; add optional `sourceFile` param or thread it through `seen` metadata — use a clean approach)
- Circular detection (per D-04, D-05, D-06): before recursing, check if the resolved absolute path is already in `seen`. If yes, throw `new Error('Circular include detected: ' + [...seen, resolvedPath].join(' → '))`.
- Depth limiting (per D-05, D-07): if `depth >= 3`, throw `new Error('Include depth limit exceeded at depth ' + depth + ': ' + [...seen].join(' → '))`.
- For each matched include: read the file with `fs.readFileSync(resolvedPath, 'utf8')`. If the file does not exist, throw `new Error('resolveIncludes: cannot read "' + resolvedPath + '" included from "' + (sourceFile || 'unknown') + '"')` — names both the source and the unresolvable path (per success criterion 4).
- Recurse: `resolveIncludes(fileContent, sourceRoot, new Set([...seen, resolvedPath]), depth + 1)` (per D-04, D-05). The `new Set([...seen, resolvedPath])` creates a fresh Set per branch so sibling includes do not block each other.
- Replace the original bare line with the resolved (recursed) content.

Add `resolveIncludes` to `module.exports` alongside `processAttribution` and `replaceRelativePathReference` (per the instructions — exact line ~11430).

**Verify:** `node --test tests/resolve-includes.test.cjs` — all 4 tests pass. Also run `npm test` to confirm no regressions in the install test suite.

**Done:** `resolveIncludes` is exported from `bin/install.js`, handles all 4 success criteria behaviors, and passes `npm test`.

---

### Task 44.2 — Write `tests/resolve-includes.test.cjs`

**Files created:** `tests/resolve-includes.test.cjs`

**Action (per D-01, D-02):**

Create `tests/resolve-includes.test.cjs`. Follow the module header pattern from `tests/frontmatter.test.cjs`: `'use strict';`, `process.env.GSD_TEST_MODE = '1';`, `require('node:test')`, `require('node:assert/strict')`, import from `'../bin/install.js'`.

Write exactly 4 tests, each mapping to one success criterion:

**Test 1 — `@~/.claude/` inlining**
```
test('inlines bare @~/.claude/ reference by reading file at sourceRoot path', ...)
```
- Create a temp dir as `sourceRoot` using `fs.mkdtempSync`.
- Write `path.join(sourceRoot, 'get-shit-done/workflows/sample.md')` with content `'# Sample\nsome content\n'`.
- Input content: `'preamble\n@~/.claude/get-shit-done/workflows/sample.md\npostamble\n'`.
- Call `resolveIncludes(content, sourceRoot, new Set())`.
- Assert output contains `'# Sample'` and does NOT contain `'@~/.claude/'`.
- Clean up temp dir in `afterEach` or inline `finally`.

**Test 2 — conditional guard pass-through**
```
test('passes ${...} template expression containing @~ verbatim without expansion', ...)
```
- Input: `"line before\n${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}\nline after\n"` — the exact pattern from `execute-phase.md:619`.
- `sourceRoot` = any real directory (no file needs to exist at the `@~` path because the resolver must skip it).
- Call `resolveIncludes(content, anySourceRoot, new Set())`.
- Assert output contains `'${CONTEXT_WINDOW < 200000 ?'` unchanged.

**Test 3 — circular detection**
```
test('throws with full include chain on circular reference', ...)
```
- Create temp sourceRoot. Write `get-shit-done/a.md` with content `'@~/.claude/get-shit-done/b.md\n'`.
- Write `get-shit-done/b.md` with content `'@~/.claude/get-shit-done/a.md\n'`.
- Seed `seen` with the resolved absolute path of `get-shit-done/a.md`.
- Call `resolveIncludes(aContent, sourceRoot, seenWithA, 0)`.
- Assert it throws. Assert `err.message` contains both `'a.md'` and `'b.md'`.

**Test 4 — missing file**
```
test('throws naming both source file and unresolvable path when referenced file is missing', ...)
```
- Input content: `'@~/.claude/no/such/file.md\n'`.
- `sourceRoot` = real temp dir (no matching file created).
- Call `resolveIncludes(content, sourceRoot, new Set())`.
- Assert it throws. Assert `err.message` contains `'no/such/file.md'` (the missing path).
- The executor should also verify the error message names the caller context if the function signature supports it — adjust based on the actual implementation in 44.1.

**Verify:** `node --test tests/resolve-includes.test.cjs` passes all 4 tests, `npm test` passes.

**Done:** `tests/resolve-includes.test.cjs` exists with 4 passing tests; each test maps 1:1 to a success criterion; no tests are skipped or `todo`-marked.
