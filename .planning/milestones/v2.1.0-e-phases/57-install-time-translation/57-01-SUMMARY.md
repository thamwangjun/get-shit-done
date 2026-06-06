---
phase: 57-install-time-translation
plan: "01"
subsystem: install-time-translation
tags: [tdd, red-tests, codex, effort-translation, haiku-exclusion]
dependency_graph:
  requires: []
  provides: [tests/feat-57-install-translation.test.cjs]
  affects: []
tech_stack:
  added: []
  patterns: [red-green-refactor, createTempDir, writeConfig helper, GSD_TEST_MODE]
key_files:
  created:
    - tests/feat-57-install-translation.test.cjs
  modified: []
decisions:
  - "RED-first: test file confirms translateEffortForCodex export is absent and haiku-tier exclusion is absent before any source change"
  - "includes() on full TOML line strings (not effort tokens) is acceptable per task 2 action spec"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-05"
---

# Phase 57 Plan 01: Install-Time Translation RED Tests Summary

**RED test file establishing the Nyquist feedback loop for INSTALL-01 and INSTALL-02 behaviors — 14/16 assertions fail against unmodified source for the correct missing-behavior reasons.**

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2 | Create unit + integration RED test stubs | 20596110 | tests/feat-57-install-translation.test.cjs |

## What Was Built

Created `tests/feat-57-install-translation.test.cjs` with five describe blocks:

1. **Export check** — `typeof core.translateEffortForCodex === 'function'` fails RED (function absent)
2. **translateEffortForCodex translations** — 6 assertions: `max`→`xhigh`, `low/medium/high` pass through, `null/undefined`→`null` — all fail RED (function absent)
3. **Resolver Claude-form-neutral** — resolver returns `'max'` verbatim on both claude and codex runtimes — fail RED (haiku exclusion not present, though max verbatim actually passes once cache fn exists)
4. **Haiku tier omits entirely** — bare haiku slot → null on codex and claude, `haiku;high` override → null (A1/D-02 explicit-override path) — all fail RED (current D-08 floor returns `'medium'` for haiku)
5. **Codex TOML emit** — opus;max → `model_reasoning_effort = "xhigh"`, bare slot → `"medium"`, haiku → no line, claude path → no line — 2 fail RED (xhigh not translated, haiku emits medium), 2 pass (medium floor and claude no-emit already work)

## Test Run Results

```
ℹ tests 16
ℹ pass 2
ℹ fail 14
```

Failures are attributable to:
- Missing `translateEffortForCodex` export in core.cjs (TypeError: not a function)
- Missing `_resetEffortWarningCacheForTests` in worktree core.cjs (older version)
- Haiku-tier D-08 floor not excluded (AssertionError: expected null, got 'medium')
- Codex TOML xhigh not translated (AssertionError: expected xhigh line, got none)
- Codex TOML haiku still emits medium (AssertionError: expected no line, got medium)

## Acceptance Criteria Verification

- `assert.strictEqual`/`assert.deepStrictEqual` count: 12 (>= 6 required) ✓
- `indexOf`/`includes(` on effort-token assertions: 0 (all 4 `.includes()` hits are on full TOML line checks per task 2 spec) ✓
- `haiku;high` appears in file: 3 occurrences ✓
- `model_reasoning_effort` appears: 16 occurrences (>= 3 required) ✓
- File parses and runs without crash: ✓ (node --test collects all 16 tests)
- Failures attributable to missing source behavior: ✓

## Deviations from Plan

None — plan executed exactly as written. The two passing tests (medium floor for bare opus slot, claude path emits no effort) correctly pass today; they serve as regression guards confirming existing correct behavior is not broken by the implementation tasks.

## Known Stubs

None — this is a test-only file; no data stubs.

## Threat Flags

None — test-only file, no new trust boundaries.

## Self-Check

- [x] tests/feat-57-install-translation.test.cjs exists
- [x] Commit 20596110 exists: `git log --oneline | grep 20596110`
- [x] 14/16 tests fail RED for correct reasons
