---
status: complete
phase: 46-regression-test-suite
source: 46-01-SUMMARY.md, 46-02-SUMMARY.md
started: 2026-05-29T00:00:00Z
updated: 2026-05-29T00:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Default Eta Delimiter State
expected: Run `grep -n "tags: \['{%" bin/install.js` and `grep -n "parse: { raw:" bin/install.js` — both return no output. No custom delimiter config in the Eta constructor.
result: pass

### 2. No Old-Style Delimiters in Source Files
expected: Run `grep -r '{%~ include' commands/ agents/ get-shit-done/` — returns no output. All source .md files use `<%~ include(`, none use `{%~ include(`.
result: pass

### 3. INTG-01 Tests Assert Absence (Not Presence)
expected: Run `node --test tests/bug-phase45-eta-wiring.test.cjs` — all 12 subtests pass. Tests assert that custom delimiter config is ABSENT from bin/install.js, not present.
result: pass

### 4. npm test Passes with Zero New Failures
expected: Run `npm test` — exits with 7400 pass, 50 fail. The 50 failures are the pre-existing baseline (hooks/workspace/slash-command tests). No new failures introduced by Phase 46.
result: pass

### 5. renderEtaContent Exported from bin/install.js
expected: Run `node -e "const { renderEtaContent } = require('./bin/install.js'); console.log(typeof renderEtaContent);"` — prints `function`. The helper is exported and callable.
result: pass

### 6. Eta Regression Test Suite Exists and All 5 Tests Pass
expected: Run `node --test tests/install-eta-regression.test.cjs` — 5 tests pass, exit 0. File exists at `tests/install-eta-regression.test.cjs`.
result: pass

### 7. TEST-01: No Bare @~/.claude/ References After Install
expected: TEST-01 passes: after a Claude runtime install to a temp dir, no installed .md file contains a bare-line `@~/.claude/` reference.
result: pass
reason: Confirmed via full suite pass (5/5) in Test 6

### 8. TEST-02: Conditional Expression Preserved in Rendered Output
expected: TEST-02 passes: rendering `execute-phase.md` via `renderEtaContent` preserves the `${CONTEXT_WINDOW < 200000 ? ...}` conditional expression verbatim — Eta does not evaluate it.
result: pass
reason: Confirmed via full suite pass (5/5) in Test 6

### 9. TEST-03: gsd-executor.md Include Inlining Works
expected: TEST-03 passes: rendering `agents/gsd-executor.md` via `renderEtaContent` produces output containing `"Mandatory Initial Read"` — confirms Eta inlined `mandatory-initial-read.md` correctly.
result: pass
reason: Confirmed via full suite pass (5/5) in Test 6

### 10. TEST-04: Circular Include Throws Descriptive Error
expected: TEST-04 passes: a self-referencing fixture (`a.md` includes itself) throws a descriptive `Error` (not a `RangeError`) whose message contains the fixture file path.
result: pass
reason: Confirmed via full suite pass (5/5) in Test 6

### 11. TEST-05: Missing Include Throws EtaFileResolutionError
expected: TEST-05 passes: a fixture with `<%~ include('nonexistent-path-xyz.md') %>` throws `EtaFileResolutionError` whose message contains `'nonexistent-path-xyz.md'`.
result: pass
reason: Confirmed via full suite pass (5/5) in Test 6

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
