---
phase: 33-positive-framing-pass
plan: "02"
subsystem: state-cjs
tags: [bug-fix, state, progress, cross-milestone]
dependency_graph:
  requires: []
  provides: [cmdStateJson-curated-progress-preservation]
  affects: [state.cjs, bug-3242-test]
tech_stack:
  added: []
  patterns: [frontmatter-heuristic, type-coercion]
key_files:
  created: []
  modified:
    - get-shit-done/bin/lib/state.cjs
    - tests/bug-3242-state-update-progress-trample.test.cjs
decisions:
  - "Coerce YAML string values to numbers when preserving curated progress block — extractFrontmatter returns all values as strings but test assertions use strict number equality"
  - "Discriminating heuristic: existingFm.progress.total_phases > built.progress.total_phases signals curated cross-milestone aggregate; equal or lower signals stale frontmatter"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
requirements_satisfied: [SCAN-12]
---

# Phase 33 Plan 02: Fix #3242 Bug A — cmdStateJson Curated Progress Preservation Summary

**One-liner:** JWT-style heuristic in cmdStateJson preserves curated cross-milestone progress (total_phases=12, completed_plans=22) when frontmatter total_phases exceeds disk-derived total_phases, without breaking #1589 disk-freshness behavior.

## What Was Built

Fixed `cmdStateJson` in `state.cjs` to preserve curated cross-milestone progress when STATE.md frontmatter contains a progress block whose `total_phases` exceeds the disk-derived count. Activated all 3 previously-todo-marked tests in `bug-3242-state-update-progress-trample.test.cjs`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix cmdStateJson to preserve curated cross-milestone progress | 2b0e557f | get-shit-done/bin/lib/state.cjs |
| 2 | Remove todo markers from bug-3242 test file | b0aad035 | tests/bug-3242-state-update-progress-trample.test.cjs |

## Implementation Details

### Task 1: cmdStateJson fix

Added a curated-progress preservation block after the existing `status` preservation block in `cmdStateJson` (state.cjs):

```javascript
if (
  existingFm &&
  existingFm.progress &&
  built.progress &&
  Number(existingFm.progress.total_phases) > Number(built.progress.total_phases)
) {
  const p = existingFm.progress;
  built.progress = {
    total_phases: Number(p.total_phases),
    completed_phases: Number(p.completed_phases),
    total_plans: Number(p.total_plans),
    completed_plans: Number(p.completed_plans),
    percent: Number(p.percent),
  };
}
```

The `Number()` coercion on preserved values is critical: `extractFrontmatter` returns all YAML values as strings, but `built.progress` contains numbers, and the test uses `assert.strictEqual` (strict type equality).

### Task 2: Todo marker removal

Removed `{ todo: 'fix pending: #3242 Bug A not yet implemented' }` from 1 test and `{ todo: 'fix pending: #3242 Bug B not yet implemented' }` from 2 tests. All 5 leaf tests now active and passing.

## Verification Results

```
node --test tests/bug-3242-state-update-progress-trample.test.cjs
# tests 5, pass 5, fail 0, todo 0, skipped 0

node --test tests/state.test.cjs
# pass 104, fail 0, todo 0 (no #1589 regression)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Type coercion required for preserved progress values**
- **Found during:** Task 1 verification
- **Issue:** `extractFrontmatter` returns all YAML values as strings (e.g., `'22'` not `22`). The plan's code snippet used `built.progress = existingFm.progress` directly, which would have preserved string values, causing `assert.strictEqual(fm.progress.completed_plans, 22)` to fail with `'22' !== 22`.
- **Fix:** Replaced direct assignment with explicit object construction converting each field via `Number()`.
- **Files modified:** get-shit-done/bin/lib/state.cjs
- **Commit:** 2b0e557f

## Threat Surface Scan

No new security-relevant surface introduced. The changes are entirely within the `cmdStateJson` read path — no new network endpoints, auth paths, or file write paths created. T-33-03 (Tampering) and T-33-04 (Information Disclosure) already documented in plan threat model.

## Self-Check: PASSED

- [x] `get-shit-done/bin/lib/state.cjs` exists and contains `existingFm.progress.total_phases` (grep count: 2)
- [x] `tests/bug-3242-state-update-progress-trample.test.cjs` exists and contains 0 todo markers
- [x] Commit 2b0e557f exists: `fix(33-02): cmdStateJson preserves curated cross-milestone progress`
- [x] Commit b0aad035 exists: `test(33-02): activate Bug A and Bug B tests — remove 3 todo markers`
- [x] bug-3242 tests: pass 5, fail 0, todo 0
- [x] state.test.cjs: pass 104, fail 0 (no #1589 regression)
- [x] D-03 satisfied: #3242 Bug A fixed in Phase 33
