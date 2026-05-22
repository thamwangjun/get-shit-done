---
phase: 03-align-tests-with-fork-standards
plan: 02
subsystem: tests
tags: [test-alignment, positive-framing, execute-phase, bug-patterns, fork-standards]
dependency_graph:
  requires: [03-01]
  provides: [TEST-03, TEST-04]
  affects: [tests/bug-patterns-reference.test.cjs, tests/execute-phase-wave.test.cjs]
tech_stack:
  added: []
  patterns: [test-assertion alignment, positive-framing string matching]
key_files:
  modified:
    - tests/bug-patterns-reference.test.cjs
    - tests/execute-phase-wave.test.cjs
decisions:
  - "Renamed 'has title and intro' test to 'has separator' — accurately describes the single retained assertion after startsWith removal"
  - "Kept includes('---') assertion per D-08 — separator check remains as structural validation"
  - "Updated 2 string literals in execute-phase-wave.test.cjs to match Phase 2 positive-framing — correct fix is updating the test, not reverting execute-phase.md"
requirements_completed: [TEST-03, TEST-04]
metrics:
  duration: ~15 min
  completed: "2026-04-16T12:28:12Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 02: Remove startsWith Assertion and Update Wave Guardrail Test Strings Summary

Removed the `startsWith('# Common Bug Patterns')` assertion from `bug-patterns-reference.test.cjs` and updated 2 string literals in `execute-phase-wave.test.cjs` to match the positive-framing text Phase 2 introduced in `execute-phase.md`. Both target test files pass with 0 failures. No production file was modified.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove startsWith assertion from bug-patterns-reference.test.cjs | bb608f8 | tests/bug-patterns-reference.test.cjs |
| 2 | Update 2 string literals in execute-phase-wave.test.cjs and verify full suite | 43a9a7c | tests/execute-phase-wave.test.cjs |

## Changes Made

### Task 1 — tests/bug-patterns-reference.test.cjs

Lines changed: 43–52 → 43–48 (net -5 lines, 1 test block simplified)

- **Removed:** `assert.ok(content.startsWith('# Common Bug Patterns'), ...)` — 4 lines deleted
- **Retained:** `assert.ok(content.includes('---'), ...)` — separator assertion intact per D-08
- **Renamed test:** `'has title and intro'` → `'has separator'` — accurate name for the single retained assertion

Rationale (D-07): `common-bug-patterns.md` now opens with `<task>` XML opener per the fork standard, not `# Common Bug Patterns`. The `startsWith` check was asserting upstream heading convention, not fork behavior.

Test count: unchanged (7 tests — test method was simplified, not removed). `node --test tests/bug-patterns-reference.test.cjs`: pass 7, fail 0.

### Task 2 — tests/execute-phase-wave.test.cjs

Lines changed: 77 and 81 (2 string literals updated)

- **Line 77:** `content.includes('Do NOT run phase verification')` → `content.includes('phase verification is handled separately')`
- **Line 81:** `content.includes('Do NOT mark the phase complete')` → `content.includes('ROADMAP.md and STATE.md unchanged')`
- **Failure message strings** (lines 78, 82) left unchanged — accurately describe the behavior being tested

Rationale (TEST-04): Phase 2 commit `83f1d01` converted both `Do NOT` directives in the `handle_partial_wave_execution` step of `execute-phase.md` to positive framing. The test hardcoded the old text. The correct fix is updating the test, not reverting the fork-standard change.

`node --test tests/execute-phase-wave.test.cjs`: pass 15, fail 0.
`git diff get-shit-done/workflows/execute-phase.md`: empty — workflow not touched.

## Verification Results

```
node --test tests/bug-patterns-reference.test.cjs
tests 7 | pass 7 | fail 0

node --test tests/execute-phase-wave.test.cjs
tests 15 | pass 15 | fail 0
```

All plan-specific acceptance criteria met:
- `grep "startsWith" tests/bug-patterns-reference.test.cjs` → 0 matches (CLEAN)
- `grep "includes('---')" tests/bug-patterns-reference.test.cjs` → 1 match (D-08 retained)
- `grep "Do NOT run phase verification\|Do NOT mark the phase complete" tests/execute-phase-wave.test.cjs` → 0 matches (CLEAN)
- `grep "phase verification is handled separately" tests/execute-phase-wave.test.cjs` → 1 match
- `grep "ROADMAP.md and STATE.md unchanged" tests/execute-phase-wave.test.cjs` → 1 match
- `git diff get-shit-done/workflows/execute-phase.md` → empty (production file untouched)

## Decisions Made

1. Renamed `'has title and intro'` to `'has separator'` — the test name should describe what it actually checks (includes('---')), not the removed assertion.
2. Kept failure messages on lines 78 and 82 unchanged — "partial wave step should skip phase verification" and "partial wave step should skip phase completion" still accurately describe the behavior, regardless of which positive-framing string we check.
3. Pre-existing worktree failures logged to deferred-items.md and not fixed — they are outside this plan's scope and caused by the worktree's stale file state.

## Deviations from Plan

### Pre-Existing Issues Logged (not auto-fixed)

**[Scope Boundary] Worktree stale-state failures — 2 tests outside plan scope**

- **Found during:** Task 2 full-suite verification
- **Issue:** The worktree's working tree has `agents/gsd-debugger.md` and `get-shit-done/bin/lib/security.cjs` at older upstream versions. This causes `agent-frontmatter.test.cjs` and `prompt-injection-scan.test.cjs` to fail (2 failures). These failures pre-date this plan's changes and are not in the plan's `files_modified` list.
- **Action taken:** Logged to `deferred-items.md`. No production files modified.
- **Rationale:** Scope boundary rule — auto-fixes apply only to issues directly caused by the current task's changes. These failures existed before my first edit.
- **Confirmed:** Both target test files (`bug-patterns-reference.test.cjs`, `execute-phase-wave.test.cjs`) pass with 0 failures individually. After merge to thamw-main, the HEAD versions of gsd-debugger.md and security.cjs will be used, resolving these failures.

## Known Stubs

None.

## Threat Flags

None — changes are test file string literal replacements. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `tests/bug-patterns-reference.test.cjs` modified with startsWith removed: CONFIRMED
- `tests/execute-phase-wave.test.cjs` modified with positive-framing strings: CONFIRMED
- Commit `bb608f8` exists: CONFIRMED
- Commit `43a9a7c` exists: CONFIRMED
- `node --test tests/bug-patterns-reference.test.cjs` exits 0 (pass 7, fail 0): CONFIRMED
- `node --test tests/execute-phase-wave.test.cjs` exits 0 (pass 15, fail 0): CONFIRMED
- `git diff HEAD~2 -- get-shit-done/workflows/execute-phase.md` is empty: CONFIRMED
- `git diff HEAD~2 -- get-shit-done/references/common-bug-patterns.md` is empty: CONFIRMED
- TEST-03 satisfied: CONFIRMED
- TEST-04 satisfied: CONFIRMED
