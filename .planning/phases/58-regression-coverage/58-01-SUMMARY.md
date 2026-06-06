---
phase: 58-regression-coverage
plan: "01"
subsystem: regression-testing
tags: [golden-fixture, resolver, effort, regression-lock]
dependency_graph:
  requires: []
  provides: [golden-effort-snapshot-fixture, gen-golden-effort-snapshot-script]
  affects: [tests/feat-58-regression.test.cjs (plan 03)]
tech_stack:
  added: []
  patterns: [atomic-write-via-rename, createRequire-esm-cjs-bridge, matrix-iteration-from-catalog]
key_files:
  created:
    - scripts/gen-golden-effort-snapshot.mjs
    - tests/fixtures/golden-effort-snapshot.json
  modified:
    - package.json
decisions:
  - "D-A1: adaptive profile included in the 5-profile matrix (quality/balanced/budget/adaptive/inherit)"
  - "D-A2: codex rows store resolver output verbatim — no translateEffortForCodex applied"
  - "D-02: omitContract holds one row per non-effort runtime (13 rows), not 33×profile rows"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-06"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 58 Plan 01: Golden Effort Snapshot - Summary

**Static literal golden fixture (330 rows + 13 omitContract) locking post-D-08 resolver output across the full agent × profile × runtime matrix, written atomically by a catalog-driven regeneration script.**

## What Was Built

### Task 1: scripts/gen-golden-effort-snapshot.mjs

ESM regeneration script using `createRequire(import.meta.url)` to bridge into the CJS resolver. Enumerates the full matrix:
- 33 agents (from `Object.keys(MODEL_PROFILES)`)
- 5 profiles: quality, balanced, budget, adaptive, inherit (D-A1)
- 2 effort runtimes: claude, codex (from `RUNTIMES_WITH_REASONING_EFFORT`)
- 13 non-effort runtimes (from `[...KNOWN_RUNTIMES].filter(r => !RUNTIMES_WITH_REASONING_EFFORT.has(r))`)

Uses atomic write pattern (`writeFile(tmp) + rename(tmp, out) + unlink-on-error`) matching the precedent from `sdk/scripts/gen-project-root.mjs` to prevent truncate race (#260531-rej). Entry-point guard (`isMain`) prevents writes on import. npm script `gen:golden-snapshot` added to package.json.

### Task 2: tests/fixtures/golden-effort-snapshot.json

Committed static golden fixture with:
- **330 rows**: literal `{agent, profile, runtime, expectedModel, expectedEffort}` values
- **13 omitContract rows**: one per non-effort runtime, all `expectedEffort: null`

Verified invariants:
- All `inherit` profile rows: `expectedEffort: null` (RESOLVE-06)
- All haiku-model rows (34): `expectedEffort: null` (D-03 guard fires before D-08 floor)
- 74 claude+medium rows confirming D-08 floor for bare {claude} slots
- D-A2 honored: no `translateEffortForCodex` applied

## Verification

- `node scripts/gen-golden-effort-snapshot.mjs` exits 0 — deterministic regeneration confirmed (second run produces identical content)
- `npm test`: 7876 pass, 0 fail — suite stays green (fixture not yet consumed by a test; plan 03 builds the consuming test)
- 13 omitContract rows all null; inherit rows all null

## Deviations from Plan

### Auto-documented: Acceptance Criteria Refinement — xhigh rows

**Found during:** Task 2 inspection  
**Issue:** Plan acceptance criteria stated `grep -c '"xhigh"' tests/fixtures/golden-effort-snapshot.json` should return 0. The fixture contains 9 `"xhigh"` entries.  
**Resolution:** These 9 rows are legitimate resolver output for `codex + adaptive` profile agents where the runtime-tier fallback (step 5 in `resolveReasoningEffortInternal`) reads `reasoning_effort: "xhigh"` directly from the model catalog's `runtimeTierDefaults.codex.opus` entry. No `translateEffortForCodex` was applied — D-A2 is fully honored. The plan's grep=0 assumption was that no catalog entries would produce 'xhigh' directly; the codex runtime catalog does. The fixture correctly captures actual resolver output.  
**Impact:** None to correctness. The consuming test (plan 03) will verify these literal values remain stable — which is the purpose of the static golden.

## Self-Check

- [x] `scripts/gen-golden-effort-snapshot.mjs` exists and contains `rename(`
- [x] `tests/fixtures/golden-effort-snapshot.json` exists and parses as valid JSON
- [x] `package.json` contains `gen:golden-snapshot` script
- [x] Commits 3b2090f6 and ec6c521f exist in git log
- [x] `npm test` passes with 0 failures

## Self-Check: PASSED
