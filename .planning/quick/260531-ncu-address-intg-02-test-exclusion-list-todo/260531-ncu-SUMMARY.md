---
phase: quick-260531-ncu
plan: 01
subsystem: testing
tags: [intg-02, allowlist, deferred-items, verify-health]
requires: [tests/bug-phase45-eta-wiring.test.cjs, .planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md]
provides: [INTG-02 precise allowlist, resolved deferred items]
affects: [tests/bug-phase45-eta-wiring.test.cjs]
key-files:
  modified:
    - tests/bug-phase45-eta-wiring.test.cjs
    - .planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md
decisions:
  - "Allowlist keyed by exact relative path + exact trimmed ref string so new refs still flag (D-01)"
  - "Fix in the test, not the workflow files — 5 deliberate refs untouched (D-02)"
metrics:
  duration: ~5m
  completed: 2026-05-31
---

# Phase quick-260531-ncu: Address INTG-02 test exclusion-list TODO Summary

Added a precise INTG-02 allowlist in `tests/bug-phase45-eta-wiring.test.cjs` that exempts only the 5 deliberate bare-line `@~` refs (keyed by exact path + ref string), turning INTG-02 green without reverting the conversions, and marked the INTG-02 TODO and W016 deferred items resolved.

## What Was Done

### Task 1 — INTG-02 allowlist (commit 8e410352)
- Added a documented module-level `ALLOWLIST` in the INTG-02 describe block mapping relative file path → Set of allowed bare-line ref strings, populated with exactly the 5 known pairs (4 in `execute-phase.md`, 1 in `execute-plan.md`).
- Applied the filter inside `findBareLineAtTildeRefs` immediately after the walk: a survivor is dropped only when its `path.relative(REPO_ROOT, fullPath)` matches an allowlist key AND its trimmed line content is in that key's Set. Any new bare-line `@~` ref is still flagged (D-01).
- Workflow source files were NOT modified (D-02). `git status` confirmed only the test file changed.

### Task 2 — Verify W016 + mark deferred items resolved (commit 4b8fcba2)
- Ran `node --test tests/verify-health.test.cjs` → 37 pass, fail 0. W016/addAiIntegrationPhaseKey no longer reproduces (D-03).
- Updated the deferred-items file: the INTG-02 TODO section now points at the implemented allowlist and is marked RESOLVED 2026-05-31; the W016 section is marked resolved/no-longer-reproducing as of 2026-05-31.

## Verification

- `node --test tests/bug-phase45-eta-wiring.test.cjs` → 12 pass, fail 0 (INTG-02 fully green)
- `node --test tests/verify-health.test.cjs` → 37 pass, fail 0
- 5 deliberate bare-line `@~` refs remain unchanged in the workflow files.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: tests/bug-phase45-eta-wiring.test.cjs (contains ALLOWLIST)
- FOUND: .planning/quick/260531-mvd-replace-dead-context-window-ternary-gate/260531-mvd-deferred-items.md (resolved markers)
- FOUND commit: 8e410352 (Task 1)
- FOUND commit: 4b8fcba2 (Task 2)
