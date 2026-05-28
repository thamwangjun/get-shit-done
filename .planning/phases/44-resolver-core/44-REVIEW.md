---
phase: 44-resolver-core
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - bin/install.js
  - tests/resolve-includes.test.cjs
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 44: Code Review Report

**Reviewed:** 2026-05-28
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the `resolveIncludes()` pure function added to `bin/install.js` (lines 1760–1885) and its four unit tests in `tests/resolve-includes.test.cjs`. The function resolves `@~/.claude/` style file includes with circular detection, depth limiting, template-expression guard, and fenced code block skipping.

One critical bug was found: the fenced-block toggle fires on any line starting with triple-backticks, including closing fences inside a fenced block, causing premature state exit for nested fence markers. Three warnings cover a regex that silently misses deeply nested template expressions, a templateDepth accumulation flaw across file boundaries, and an incomplete depth-limit error message. Two info items cover a tautological guard condition and a missing assertion in the missing-file test.

---

## Critical Issues

### CR-01: Fenced-block toggle breaks on nested triple-backtick content

**File:** `bin/install.js:1776`

**Issue:** The fenced-block detection toggles `inFencedBlock` on every line where `trimmed.startsWith('```')` — it does not distinguish openers from closers. Any content line inside a fenced block that itself begins with triple-backtick (e.g., documentation showing nested fence syntax, or a code example that opens another fence) will incorrectly toggle the state to `false`, causing subsequent lines to be processed for `@` expansion as if they were outside the block. In the worst case an `@~/.claude/` reference inside a code example (where it should be literal) gets silently expanded and the include content is injected into what was a code block. This is a data-corruption bug for any file that documents include syntax inside a fenced block.

**Fix:** Track the opening fence marker (the exact leading backtick sequence) and only toggle off when the same fence sequence appears on its own line:

```js
// Replace the single boolean with a fence marker string:
let fenceMarker = null; // null = not in block; string = current fence marker

// ...inside the loop, replace the toggle:
const fenceMatch = /^(`{3,}|~{3,})/.exec(trimmed);
if (fenceMatch) {
  if (fenceMarker === null) {
    fenceMarker = fenceMatch[1]; // opening
  } else if (trimmed.startsWith(fenceMarker)) {
    fenceMarker = null; // closing — must start with same marker
  }
  result.push(line);
  continue;
}

if (fenceMarker !== null) {
  result.push(line);
  continue;
}
```

---

## Warnings

### WR-01: `[^}]*` in template-guard regex fails to protect expressions with nested braces before `@`

**File:** `bin/install.js:1802`

**Issue:** The single-line template guard uses `/\$\{[^}]*@/.test(line)`. The character class `[^}]*` stops matching at the first `}`. If the template expression contains a nested function call or object literal before the `@` reference — for example `${fn({k:1}) ? '@~/.claude/foo.md' : ''}` — the `}` from `{k:1}` terminates the `[^}]*` match before reaching the `@`, the regex returns false, and the `@` line is expanded when it should be suppressed. This is a silent correctness failure: the include is incorrectly materialized.

The current tests pass only because the representative expression `${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/...'}` contains no nested braces before the `@`. Real workflow files may grow more complex expressions.

**Fix:** Replace the brittle `[^}]*` with a balanced-brace scan, or broaden the heuristic: if the line matches `/^\s*\$\{/` (starts with a template expression), treat the whole line as template and skip expansion entirely:

```js
// Simpler, safer heuristic — if the trimmed line begins with ${ it is a template expression:
const lineContainsTemplateExpr = /^\s*\$\{/.test(line) || /\$\{/.test(line) && templateDepth > 0;
```

Or, more accurately, check whether any `@` on the line appears inside an unbalanced `${`:

```js
function lineHasTemplateAt(line) {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '$' && line[i + 1] === '{') { depth++; i++; continue; }
    if (line[i] === '}' && depth > 0) { depth--; continue; }
    if (line[i] === '@' && depth > 0) return true;
  }
  return false;
}
```

---

### WR-02: `templateDepth` accumulates across recursive calls — depth from included files bleeds into parent

**File:** `bin/install.js:1770` and `1869`

**Issue:** `templateDepth` is local to each invocation frame, which is correct for the immediate file. However the `seen` set is passed by reference across recursive calls and reassembled via `new Set([...seen, includePath])` for child calls. The depth is tracked per frame, so depth doesn't actually bleed across frames in the current code. BUT `templateDepth` is never reset between distinct included files processed in sequence within one frame. If one included file (expanded via `result.push(expanded...)`) leaves a partial multi-line template expression open (i.e., the included file's content has an unmatched `${`), the `templateDepth` in the *parent* frame will not reflect that because expansion happens via the return value string, not line-by-line state in the parent. This is actually safe as-is.

The real risk is subtler: if a single input file has an unbalanced `${` (malformed content), `templateDepth` will be non-zero for all remaining lines in that file, causing every subsequent `@` line to be silently suppressed. No error is thrown. This silent swallowing can hide real include directives in malformed files.

**Fix:** After the loop completes, assert `templateDepth === 0` and throw if not, so the caller knows the input was malformed:

```js
// After the for loop, before return:
if (templateDepth !== 0) {
  throw new Error(
    'resolveIncludes: unbalanced template expression (${...}) in "' + sourceFile + '"'
  );
}
```

---

### WR-03: Depth-limit error message omits the file that would have been included next

**File:** `bin/install.js:1762`

**Issue:** When `depth >= 3`, the error reports `[...seen].join(' → ')`, which is the set of already-visited paths. It does not include the path of the file that would have triggered the next level (the `sourceFile` of the call hitting the limit). This makes the error message less actionable — the developer cannot tell which include chain led to the limit without tracing back manually.

**Fix:**

```js
if (depth >= 3) {
  throw new Error(
    'Include depth limit exceeded (max 3) at "' + sourceFile + '": ' + [...seen, sourceFile].join(' → ')
  );
}
```

---

## Info

### IN-01: Tautological guard `trimmed === line.trim()` is always true

**File:** `bin/install.js:1816` and `1818`

**Issue:** `trimmed` is assigned `line.trim()` at line 1773. The conditions on lines 1816 and 1818 (`atMatch && trimmed === line.trim()`) compare `trimmed` against `line.trim()` which always produces the same value. The guard is dead code and never filters anything. The original intent was probably to ensure the `@` reference is the *entire* line (not embedded mid-line), which `atMatch` already enforces by matching `trimmed` (the full trimmed line) against `/^@(.+)$/`. The redundant check can be silently removed without any behavioral change.

**Fix:** Remove the redundant guard:

```js
if (atMatch) {
  rawRef = atMatch[1];
} else if (catMatch) {
  rawRef = catMatch[1].trim();
}
```

---

### IN-02: Missing-file test does not assert the source-file context in the error message

**File:** `tests/resolve-includes.test.cjs:97`

**Issue:** The phase specification says the error should name "both source file and unresolvable path." Test 4 only asserts `err.message.includes('no/such/file.md')`. When `resolveIncludes` is called without a `sourceFile` argument it defaults to `'unknown'`, so the error reads `included from "unknown"`. The test passes but does not verify that the source-file component is populated correctly. If a caller passes a real `sourceFile` and the function omits it from the error, the test would not catch the regression.

**Fix:** Add an assertion, and pass a synthetic source file path to the test:

```js
test('throws naming both source file and unresolvable path when referenced file is missing', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    const fakeSource = path.join(sourceRoot, 'caller.md');
    const content = '@~/.claude/no/such/file.md\n';

    assert.throws(
      () => resolveIncludes(content, sourceRoot, new Set(), 0, fakeSource),
      (err) => {
        assert.ok(err instanceof Error, 'should throw an Error');
        assert.ok(err.message.includes('no/such/file.md'), 'error message should contain the missing path');
        assert.ok(err.message.includes('caller.md'), 'error message should contain the source file name');
        return true;
      }
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});
```

---

_Reviewed: 2026-05-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
