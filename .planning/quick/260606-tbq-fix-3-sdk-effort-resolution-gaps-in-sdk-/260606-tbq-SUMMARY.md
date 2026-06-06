---
phase: quick
plan: 260606-tbq
subsystem: sdk/effort-resolver
tags: [effort-resolution, sdk-parity, d-08, tdd]
dependency_graph:
  requires: []
  provides: [sdk-effort-parity-gaps-1-2-3]
  affects: [sdk/src/query/config-query.ts, sdk/src/query/resolve-model-effort.test.ts, sdk/src/query/config-query.test.ts]
tech_stack:
  added: []
  patterns: [tdd-red-green, parity-testing]
key_files:
  created: []
  modified:
    - sdk/src/query/config-query.ts
    - sdk/src/query/resolve-model-effort.test.ts
    - sdk/src/query/config-query.test.ts
decisions:
  - "effortAllowed uses explicit runtime check (runtime !== '') matching CLI step 0 gate"
  - "rawSlot preserves phaseTier or rawAlias including ;effort suffix for step 4 chain"
  - "Gap 3 test uses models.execution (not models.execute) matching gsd-executor phaseType"
  - "5 existing config-query.test.ts assertions updated to reflect D-08 floor behavior"
metrics:
  duration: 25min
  completed: 2026-06-06
  tasks_completed: 1
  files_modified: 3
---

# Quick Task 260606-tbq: Fix 3 SDK Effort Resolution Gaps

SDK resolveModel now produces identical model+effort shapes to the CLI resolveReasoningEffortInternal for all three previously-diverging runtime/catalog combinations.

## What Was Built

Patched `sdk/src/query/config-query.ts` `resolveModel` to mirror the CLI's `resolveReasoningEffortInternal` precedence chain for the three confirmed gaps:

**Gap 1 — claude path: model_profile_overrides ;suffix extracted**
The claude path previously skipped step 3a entirely because `resolveRuntimeTier` returns null for claude. Added explicit step 3a: checks `model_profile_overrides[effectiveRuntime][bareTier]` for a `;effort` string shorthand or `reasoning_effort` object field.

**Gap 2 — D-08 medium floor on claude path**
Added D-08 floor after step 4: when `claudePathEffort` is still null after steps 3a and 4, set to `'medium'` (matching CLI line 1719).

**Gap 3 — haiku guard in runtimeTier block**
Added `bareTierForGuard !== 'haiku'` guard before the effort computation inside the `runtimeTier?.model` block. The codex catalog has `haiku.reasoning_effort = 'medium'`; without the guard this leaked to callers.

**Supporting fix — effortAllowed gate**
Changed `effortAllowed = RUNTIMES_WITH_REASONING_EFFORT.has(effectiveRuntime)` to `effortAllowed = runtime !== '' && RUNTIMES_WITH_REASONING_EFFORT.has(effectiveRuntime)`. When `runtime` is absent/null (implicit claude), the CLI's step 0 gate `if (!config.runtime || ...) return null` fires; the SDK now matches.

**Supporting fix — rawSlot for step 4**
Added `rawSlot = typeof phaseTier === 'string' ? phaseTier : rawAlias` to preserve the full catalog slot value including `;effort` suffix for step 4 (the SDK previously stripped the suffix into `alias` too early).

## Deviations from Plan

**1. [Rule 1 - Bug] Gap 3 test fixture used wrong models key**
- **Found during:** RED confirmation
- **Issue:** Plan specified `models: { execute: 'haiku' }` but gsd-executor's `phaseType` is `'execution'`, not `'execute'`. The wrong key caused the test to fall back to the `'sonnet;medium'` balanced slot rather than `'haiku'`, making the test fail for the wrong reason.
- **Fix:** Changed test fixture to `models: { execution: 'haiku' }`.
- **Files modified:** `sdk/src/query/resolve-model-effort.test.ts`

**2. [Rule 1 - Bug] 5 existing config-query.test.ts assertions used pre-D-08 expected values**
- **Found during:** GREEN verification
- **Issue:** Existing tests at lines 283, 297, 327, 341, 355 asserted `effort: null` for `runtime:'claude'` scenarios. These were written before the D-08 milestone amendment (2026-06-04). The corrected implementation now produces `effort:'medium'` or `effort:'low'` (slot-derived) for these scenarios.
- **Fix:** Updated 5 assertions to reflect D-08 behavior:
  - `gsd-executor balanced` (sonnet;medium slot): `null` → `'medium'`
  - `gsd-planner quality` (opus;low slot): `null` → `'low'`
  - `gsd-executor budget+models.execution=opus` (bare opus, D-08 floor): `null` → `'medium'`
  - `gsd-executor balanced, no resolve_model_ids`: `null` → `'medium'`
  - `gsd-executor balanced, resolve_model_ids:'omit'`: `null` → `'medium'`
- **Files modified:** `sdk/src/query/config-query.test.ts`

**3. [Rule 1 - Bug] Step 4 (catalog slot effort) was missing from claude-path chain**
- **Found during:** Implementing GREEN (the plan described Gap 1 as model_profile_overrides, but the actual structural cause was step 4 being absent from the claude path)
- **Issue:** The SDK's `tier` variable had the `;effort` suffix stripped (via `alias = parseModelEffort(rawAlias).model`), so `parseModelEffort(tier).effort` always returned null. The raw slot value was needed for step 4.
- **Fix:** Added `rawSlot` variable that preserves the unstripped slot value; used for step 4 in the claude-path effort chain.

## Test Results

- `cd sdk && npx vitest run --project unit`: 2011 passed, 0 failed
- `npm test` (root): 8243 passed, 0 failed
- Three new Gap tests in `resolve-model-effort.test.ts`: all pass
- All 31 `config-query.test.ts` tests: pass

## Commits

- `d340e2b5`: feat(quick-260606-tbq): fix 3 SDK effort resolution gaps in config-query.ts

## Self-Check: PASSED

Files exist:
- `sdk/src/query/config-query.ts` — FOUND (modified)
- `sdk/src/query/resolve-model-effort.test.ts` — FOUND (modified)
- `sdk/src/query/config-query.test.ts` — FOUND (modified)

Commit exists: d340e2b5 — FOUND
