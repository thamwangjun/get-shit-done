---
phase: 46-regression-test-suite
plan: "01"
subsystem: install-eta
tags: [eta, delimiter, regression-test, install]
dependency_graph:
  requires: []
  provides: [default-eta-delimiters, intg-01-test-alignment]
  affects: [bin/install.js, tests/bug-phase45-eta-wiring.test.cjs]
tech_stack:
  added: []
  patterns: [doesNotMatch assertion for absence verification]
key_files:
  created: []
  modified:
    - tests/bug-phase45-eta-wiring.test.cjs
decisions:
  - "D-01 already satisfied by Phase 45: custom Eta delimiter config (tags/parse.raw) removed from bin/install.js before this plan ran"
  - "D-02 already satisfied by Phase 45: all 83 source .md files already use <%~ include( — zero {%~ include( survivors"
  - "INTG-01 tests updated from assert-presence to assert-absence for custom delimiter config — tests now verify the desired default-delimiter state"
metrics:
  duration: "5 minutes"
  completed_date: "2026-05-29"
requirements:
  - INTG-01
---

# Phase 46 Plan 01: Default Delimiter Switch Summary

Aligned INTG-01 regression tests with Phase 45's completed delimiter removal, confirming Eta uses default `<%`/`%>` delimiters with zero custom config and zero source file survivors.

## What Was Done

### Task 1: Remove custom delimiter config from Eta constructor

**Status: Already complete from Phase 45**

The Eta constructor in `bin/install.js` already contained no `tags:` or `parse.raw:` lines. The constructor shape at lines 1753–1757:

```javascript
const eta = new Eta({
  views: _etaSourceRoot,
  useWith: true,
  autoEscape: false,
});
```

Verification grep returned zero results for both `tags: ['{%'` and `parse: { raw:`.

### Task 2: Convert all source files from {%~ to <%~ delimiter

**Status: Already complete from Phase 45**

All 83 source `.md` files already use `<%~ include(`. Post-task grep across `commands/gsd/`, `agents/`, `get-shit-done/workflows/`, and `get-shit-done/references/` returned zero survivors.

Counts of `<%~ include(` occurrences confirmed present:
- `commands/gsd/`: 115 occurrences
- `agents/`: 26 occurrences  
- `get-shit-done/workflows/`: 43 occurrences

### Task 3: Confirm npm test passes with zero new failures

**Status: Complete — required test fix**

Running `npm test` revealed two INTG-01 subtests were asserting the OLD delimiter config (presence of `tags:["{%","%}"]` and `parse:{raw:"~"}`). These tests were written in Phase 45 before the delimiter removal decision, and now incorrectly asserted the wrong state.

Fix applied in `tests/bug-phase45-eta-wiring.test.cjs`:
- `bin/install.js has Eta instance with tags:["{%","%}"]` → updated to `bin/install.js Eta instance uses default delimiters — no custom tags config` using `assert.doesNotMatch`
- `bin/install.js has Eta instance with parse:{raw:"~"}` → updated to `bin/install.js Eta instance uses default raw prefix — no custom parse.raw config` using `assert.doesNotMatch`

Result: All 12 INTG-01/02/03/06 subtests pass. `npm test` final totals: 7395 pass, 50 fail — the 50 failures are pre-existing baseline (hooks/workspace/slash-command tests), zero new failures from this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed INTG-01 tests asserting old delimiter presence**
- **Found during:** Task 3 (npm test run)
- **Issue:** Two tests in `tests/bug-phase45-eta-wiring.test.cjs` used `assert.match` to assert the presence of `tags:["{%","%}"]` and `parse:{raw:"~"}` — the exact config that D-01 removes. Phase 45 removed the config but left these tests asserting the old state.
- **Fix:** Replaced both `assert.match` calls with `assert.doesNotMatch` confirming the custom config is absent, which is the correct D-01 state.
- **Files modified:** `tests/bug-phase45-eta-wiring.test.cjs`
- **Commit:** c5254a5c

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1+2+3 | c5254a5c | fix(46-01): update INTG-01 tests to assert default Eta delimiter state |

## Verification Results

1. `grep -n "tags: \['{%" bin/install.js` — returns no output (PASS)
2. `grep -n "parse: { raw:" bin/install.js` — returns no output (PASS)
3. `grep -r '{%~ include' commands/ agents/ get-shit-done/` — returns no output (PASS)
4. `npm test` — 7395 pass, 50 pre-existing failures, 0 new failures (PASS)
5. `node --test tests/bug-phase45-eta-wiring.test.cjs` — 12/12 pass (PASS)

## Success Criteria Checklist

- [x] Eta constructor in `bin/install.js` uses default delimiters (no custom `tags` or `parse.raw` config)
- [x] All source `.md` files use `<%~ include(` instead of `{%~ include(`
- [x] `npm test` passes with zero new failures
- [x] INTG-01 tests reflect the correct default-delimiter state

## Self-Check: PASSED

- `tests/bug-phase45-eta-wiring.test.cjs` — confirmed modified and committed at c5254a5c
- `grep -n "tags: \['{%" bin/install.js` — returns no output
- `grep -r '{%~ include' commands/ agents/ get-shit-done/` — returns no output
- `git log --oneline | grep c5254a5c` — commit confirmed in history
