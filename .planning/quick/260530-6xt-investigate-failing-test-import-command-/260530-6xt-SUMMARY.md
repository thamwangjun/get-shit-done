---
phase: quick
plan: 260530-6xt
subsystem: tests
tags: [investigation, test-bug, eta-syntax]
key-files:
  read:
    - tests/ingest-docs.test.cjs
    - commands/gsd/import.md
decisions: []
completed: 2026-05-30
---

# Quick 260530-6xt: Failing Test — import command loads doc-conflict-engine reference

**One-liner:** Test regex uses `%\}` (curly brace) as closing delimiter instead of `%>` (angle bracket), so it never matches the correct Eta include syntax in commands/gsd/import.md.

---

## Root Cause

The bug is in the test, not in the command file.

`tests/ingest-docs.test.cjs:300` contains this regex:

```js
const hasEtaRef = /<%~\s*include\(['"]get-shit-done\/references\/doc-conflict-engine\.md['"]\)\s*%\}/.test(cmdContent);
```

The closing delimiter in the regex is `%\}` — an escaped curly brace `}`.

`commands/gsd/import.md:27` contains:

```
<%~ include('get-shit-done/references/doc-conflict-engine.md') %>
```

The actual Eta closing delimiter is `%>` — an angle bracket `>`.

These two characters (`}` vs `>`) do not match. The regex will never return `true` for any correctly-formed Eta include tag.

The legacy fallback branch (`hasLegacyRef`) on line 299 checks for the string:

```
@~/.claude/get-shit-done/references/doc-conflict-engine.md
```

This string is absent from the current `commands/gsd/import.md` — Phase 260525-o1n converted all bare `@`-notation references to Eta `<%~ include(...) %>` form. So both branches of the `hasLegacyRef || hasEtaRef` OR condition return `false`, and the assertion fails.

---

## Evidence

### Test file — tests/ingest-docs.test.cjs, lines 297-302

```js
test('import command loads doc-conflict-engine reference', () => {
  // Accept both legacy @-notation and Eta include tag form (Phase 45 converted bare-line refs)
  const hasLegacyRef = cmdContent.includes('@~/.claude/get-shit-done/references/doc-conflict-engine.md');
  const hasEtaRef = /<%~\s*include\(['"]get-shit-done\/references\/doc-conflict-engine\.md['"]\)\s*%\}/.test(cmdContent);
  //                                                                                              ^^^
  //                                                                                   Bug: %\} should be %> 
  assert.ok(hasLegacyRef || hasEtaRef, '/gsd-import must load the shared conflict-engine contract (@-notation or Eta include form)');
});
```

### Command file — commands/gsd/import.md, line 27

```
<%~ include('get-shit-done/references/doc-conflict-engine.md') %>
                                                               ^^
                                                    Correct Eta closer: %>
```

### Confirmed failure

Running `node --test --test-name-pattern "import command loads doc-conflict-engine" tests/ingest-docs.test.cjs` produces:

```
✖ import command loads doc-conflict-engine reference (0.947ms)
  AssertionError: /gsd-import must load the shared conflict-engine contract (@-notation or Eta include form)
    actual: false
    expected: true
```

---

## Resolution Options

### Option A — Fix the test regex (recommended)

Change `%\}` to `%>` on `tests/ingest-docs.test.cjs:300`.

Current:
```js
const hasEtaRef = /<%~\s*include\(['"]get-shit-done\/references\/doc-conflict-engine\.md['"]\)\s*%\}/.test(cmdContent);
```

Fixed:
```js
const hasEtaRef = /<%~\s*include\(['"]get-shit-done\/references\/doc-conflict-engine\.md['"]\)\s*%>/.test(cmdContent);
```

Impact: 1-character change to the test only. The command file is already correct. The other two tests in the same `describe` block (`import workflow cites the shared reference`, `import workflow retains BLOCKER/WARNING/INFO labels`) pass today and are unaffected.

### Option B — Restore the legacy @-notation in the command file

Add the line `@~/.claude/get-shit-done/references/doc-conflict-engine.md` back to `commands/gsd/import.md` so the `hasLegacyRef` branch passes.

Impact: Partially reverts the Eta conversion that Phase 260525-o1n performed for this file. The command file would then carry both forms (the Eta include and a bare @-notation line), which is inconsistent and would diverge from the rest of the converted commands.

Not recommended.

### Option C — Remove or skip the test

Delete or mark the `'import command loads doc-conflict-engine reference'` test case as skipped.

Impact: Removes the regression guard that was added in the #2387 refactor. If the doc-conflict-engine reference is accidentally dropped from import.md in a future change, no test will catch it.

Not recommended unless the guard is considered obsolete.

---

## Recommendation

**Option A.** One-character fix (`}` → `>`) in the test regex. The command file is correct. The test has a typo in the closing delimiter — it was written with `%\}` instead of `%>`, likely a transcription error when the test was added or updated during the Phase 260525-o1n Eta conversion.

---

## Self-Check

- [x] Root cause confirmed: regex closing delimiter mismatch (`%\}` vs `%>`)
- [x] Evidence shown: exact lines from both files side-by-side
- [x] Test run confirmed failure (exit code non-zero, assertion message matches)
- [x] Three resolution options presented with tradeoffs
- [x] Recommendation stated
- [x] No source files modified
- [x] No commits made
