---
phase: 46-regression-test-suite
plan: "02"
subsystem: install-eta
tags: [eta, regression-test, install, renderEtaContent]
dependency_graph:
  requires: [46-01]
  provides: [eta-regression-tests, renderEtaContent-export]
  affects: [tests/install-eta-regression.test.cjs, bin/install.js]
tech_stack:
  added: []
  patterns: [renderEtaContent helper, direct source-file Eta rendering in tests]
key_files:
  created:
    - tests/install-eta-regression.test.cjs
  modified:
    - bin/install.js
decisions:
  - "Task 1 already complete from Phase 45 work (commit 079c3a72): renderEtaContent exported from bin/install.js, both renderString call sites replaced"
  - "TEST-02 and TEST-03 redesigned to call renderEtaContent directly on source files rather than installRuntimeArtifacts — the latter only installs skills for global Claude scope, which does not include workflows/ or agents/"
  - "REPO_ROOT constant (path.join(__dirname, '..')) used as viewsRoot for source-file rendering tests — matches the _etaSourceRoot used at install time"
metrics:
  duration: "10 minutes"
  completed_date: "2026-05-29"
requirements:
  - TEST-01
  - TEST-02
  - TEST-03
  - TEST-04
  - TEST-05
---

# Phase 46 Plan 02: Eta Regression Test Suite Summary

Five Eta v4 pipeline regression tests covering unresolved reference detection, conditional expression preservation, include inlining, circular include detection, and missing-file error propagation.

## What Was Done

### Task 1: Add renderEtaContent helper and RangeError try/catch to bin/install.js

**Status: Already complete from Phase 45/46 prior work (commit 079c3a72)**

The `renderEtaContent(content, srcPath, viewsRoot)` helper was already present in `bin/install.js` at line 6418, with both `eta.renderString(content, {})` call sites already replaced and the function exported in `module.exports` at line 11517.

Verification: `node -e "const { renderEtaContent } = require('./bin/install.js'); console.log(typeof renderEtaContent);"` → `function`

The function:
- Creates a fresh Eta instance scoped to `viewsRoot` (so tests can pass a temp dir without affecting the global `eta` instance)
- Catches `RangeError` (stack overflow from circular includes) and rethrows as a descriptive `Error` containing `srcPath`
- Propagates `EtaFileResolutionError` unchanged (it is not a `RangeError`)

### Task 2: Create tests/install-eta-regression.test.cjs with five passing tests

Created `tests/install-eta-regression.test.cjs` with all five tests. Key design decisions:

**TEST-01** uses `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)` to install skills to a temp dir, then walks all installed `.md` files checking for bare-line `@~/.claude/` references (line-anchored `/^@~\/.claude\//m` to avoid false positives from the `${...}` conditional expression in `execute-phase.md`).

**TEST-02 and TEST-03** read source files directly and render with `renderEtaContent(source, srcPath, REPO_ROOT)` — this exercises the same Eta configuration as install time. This approach was chosen because `installRuntimeArtifacts` with `global` Claude scope only installs skills (not `get-shit-done/workflows/` or `agents/`), so relying on it to install those files would require a full subprocess installer invocation.

**TEST-04** creates a self-referencing fixture `a.md` containing `<%~ include('a.md') %>` in a temp dir, passes `tmpDir` as `viewsRoot` so Eta resolves `a.md` from the temp location (per pitfall 2 in RESEARCH.md), and asserts the thrown `Error` contains the fixture path.

**TEST-05** creates a fixture with `<%~ include('nonexistent-path-xyz.md') %>`, passes through `renderEtaContent`, and asserts `EtaFileResolutionError` is thrown with the missing filename in the message.

All five tests pass in isolation and npm test exits with 7400 pass, 50 pre-existing failures (zero new failures).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TEST-02 and TEST-03 redesigned to use renderEtaContent directly**

- **Found during:** Task 2 test execution
- **Issue:** `installRuntimeArtifacts('claude', tmpDir, 'global', RESOLVED_CORE)` only installs skills to a `skills/` directory. It does not install `get-shit-done/workflows/` or `agents/`. The plan's assumption (from RESEARCH.md A1/A2) that these paths would be available after an `installRuntimeArtifacts` call was incorrect for global Claude scope.
- **Fix:** Rewrote TEST-02 and TEST-03 to read source files directly and render with `renderEtaContent(source, srcPath, REPO_ROOT)`. This directly tests the Eta rendering behavior (which is what the tests verify) without requiring a full subprocess install.
- **Files modified:** `tests/install-eta-regression.test.cjs`
- **Commit:** 978aad69

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 079c3a72 | feat(46-02): add renderEtaContent helper and replace both eta.renderString call sites |
| Task 2 | 978aad69 | test(46-02): add five Eta pipeline regression tests (TEST-01 through TEST-05) |

## Verification Results

1. `node -e "const { renderEtaContent } = require('./bin/install.js'); console.log(typeof renderEtaContent);"` — prints `function` (PASS)
2. `node --test tests/install-eta-regression.test.cjs` — 5/5 tests pass, exit 0 (PASS)
3. `npm test` — 7400 pass, 50 pre-existing failures, 0 new failures (PASS)
4. `grep -n "renderEtaContent" bin/install.js` — shows function definition (line 6418), both call sites (lines 6481, 8697), and module.exports entry (line 11517)

## Success Criteria Checklist

- [x] `tests/install-eta-regression.test.cjs` exists with five tests covering TEST-01 through TEST-05
- [x] `renderEtaContent(content, srcPath, viewsRoot)` is exported from `bin/install.js` and wraps both `eta.renderString` call sites with RangeError detection
- [x] TEST-01: Zero installed .md files contain a bare-line `@~/.claude/` reference after Claude runtime install
- [x] TEST-02: `renderEtaContent` on `execute-phase.md` preserves the `${CONTEXT_WINDOW < 200000 ? ...}` conditional expression verbatim
- [x] TEST-03: `renderEtaContent` on `agents/gsd-executor.md` produces output containing `"Mandatory Initial Read"` (confirms Eta inlined mandatory-initial-read.md)
- [x] TEST-04: Self-referencing fixture throws a descriptive Error (not RangeError) whose message contains the fixture path
- [x] TEST-05: Fixture with nonexistent include throws `EtaFileResolutionError` whose message contains `'nonexistent-path-xyz.md'`
- [x] `npm test` passes with zero new failures

## Self-Check: PASSED

- `tests/install-eta-regression.test.cjs` exists — confirmed at 978aad69
- `renderEtaContent` in `bin/install.js` — confirmed at 079c3a72 (lines 6418, 6481, 8697, 11517)
- `node --test tests/install-eta-regression.test.cjs` — 5 pass, 0 fail
- `npm test` — 7400 pass, 50 fail (50 are pre-existing baseline from 46-01 summary)
