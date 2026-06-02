---
phase: 54-sdk-tools-json-exposure
plan: 02
subsystem: sdk
tags: [effort, sdk, resolve-model, init-handlers, golden-parity, config-query]

# Dependency graph
requires:
  - phase: 54-01
    provides: "*_effort siblings in CLI init.cjs + always-emit effort in cmdResolveModel"
provides:
  - "SDK resolveModel always-emit canonical effort field (EXPOSE-03 / D-07)"
  - "Static {claude, codex} runtimesWithReasoningEffort allowlist (D-07 / Pitfall 1)"
  - "SDK init handlers emit *_effort siblings for all 8 builder regions (EXPOSE-03)"
  - "New init.execute-phase golden parity row enforcing SDK<->CLI *_effort parity (EXPOSE-03 / D-08)"
  - "Bare-catalog inertness preserved: all SDK *_effort values null (SC#4 cross-language)"
affects: [phase-55-catalog-schema, phase-56-spawn-templates, phase-58-regression]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static set allowlist: runtimesWithReasoningEffort returns new Set(['claude', 'codex']) — not data-derived"
    - "4-step effort precedence chain in resolveModel: allowlist gate -> override suffix -> slot suffix -> Codex per-tier fallback"
    - "Always-emit explicit-null: effort field always present on all resolveModel return paths"
    - "getEffort() helper: same-slot invariant pattern mirroring getModelAlias in composer.ts and complex.ts"
    - "Volatile-key strip: omitInitExecutePhaseVolatile for init-builder golden row normalization"

key-files:
  created:
    - sdk/src/query/resolve-model-effort.test.ts (EXPOSE-03 unit tests — 12 tests)
  modified:
    - sdk/src/model-catalog.ts (static runtimesWithReasoningEffort allowlist)
    - sdk/src/query/config-query.ts (4-step effort precedence chain + always-emit effort)
    - sdk/src/query/config-query.test.ts (update reasoning_effort->effort; add effort:null to toEqual assertions)
    - sdk/src/handlers/init/composer.ts (getEffort helper + *_effort siblings in 6 builder regions)
    - sdk/src/handlers/init/complex.ts (getEffort helper + *_effort siblings in 2 builder regions)
    - sdk/src/golden/init-golden-normalize.ts (omitInitExecutePhaseVolatile strip helper)
    - sdk/src/golden/read-only-golden-rows.ts (init.execute-phase parity row)
    - sdk/src/golden/read-only-parity.integration.test.ts (volatile-strip test block for init.execute-phase)

key-decisions:
  - "D-07 static allowlist: runtimesWithReasoningEffort is hard-coded {claude, codex}, not data-derived — prevents effort leaking to new runtimes"
  - "D-05 parity: effort (not reasoning_effort) is the canonical emitted field name in the SDK too"
  - "D-08 golden row: init.execute-phase with volatile-key strip chosen over dedicated fixture (harness extension preferred)"
  - "Same-slot invariant: getEffort always uses same agentType as adjacent *_model (prevents #3023 divergence)"

requirements-completed: [EXPOSE-03]

# Metrics
duration: 27m
completed: 2026-06-02
---

# Phase 54 Plan 02: SDK Effort Exposure Summary

**Ported the CLI effort resolution logic into the SDK and extended the golden parity harness to enforce SDK<->CLI *_effort parity**

## Performance

- **Duration:** 27m
- **Started:** 2026-06-02T10:56:31Z
- **Completed:** 2026-06-02T11:23:xx
- **Tasks:** 2 (both TDD: RED + GREEN = 4 commits)
- **Files modified:** 9

## Accomplishments

- Static `{claude, codex}` allowlist replaces data-derived scan in `runtimesWithReasoningEffort()` (D-07 / Pitfall 1 mitigation — prevents effort leaking to future runtimes)
- 4-step effort precedence chain ported from `resolveReasoningEffortInternal` (core.cjs) into SDK `resolveModel`: allowlist gate → per-agent override suffix → shared slot suffix → Codex per-tier fallback
- `resolveModel` always emits canonical `effort` field on ALL return paths (override, no-config, unknown-agent, inherit, runtimeTier, omit, claude+resolve_model_ids, alias) — effort: null on bare catalog
- `reasoning_effort` removed from emitted output entirely (D-05 parity); reads only as internal Codex step-4 fallback from `runtimeTier.reasoning_effort`
- `getEffort()` helper added to composer.ts and complex.ts (same-slot invariant mirrors `getModelAlias`)
- `*_effort` sibling added next to every `*_model` in all 8 init builder regions across composer.ts (6) and complex.ts (2)
- All 12 EXPOSE-03 unit tests green; `resolve-model` golden parity row now passes; new `init.execute-phase` golden row with `omitInitExecutePhaseVolatile` strip enforces parity
- CLI tests: 0 regressions (5165 pass / 0 fail)
- SDK tests: no new regressions (only pre-existing failures in intel.*, golden-policy, history.digest, audit-open remain)

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: failing tests for SDK effort precedence + *_effort siblings** - `82c7f34f` (test)
2. **Task 1 GREEN: port effort resolution into SDK resolveModel + static allowlist** - `3132881c` (feat)
3. **Task 2 GREEN: SDK init *_effort siblings + init-builder golden parity row** - `44c150b4` (feat)

Note: Task 2 RED was provided by the pre-existing failing test state (Task 1 unit tests covered all 12 EXPOSE-03 cases including init siblings, all of which were failing RED at commit `82c7f34f`).

## Files Created/Modified

- `sdk/src/query/resolve-model-effort.test.ts` — 12 EXPOSE-03 tests: static allowlist assertion, resolveModel always-emit effort, reasoning_effort absent, 6 init builder *_effort sibling assertions (RED at 82c7f34f, GREEN at 44c150b4)
- `sdk/src/model-catalog.ts` — `runtimesWithReasoningEffort()` replaced with `return new Set(['claude', 'codex'])` (D-07 static allowlist)
- `sdk/src/query/config-query.ts` — Added `parseModelEffort` import; added 4-step effort precedence chain; all 8 `resolveModel` return paths emit `effort: <value> ?? null`; `reasoning_effort` never emitted (only read internally)
- `sdk/src/query/config-query.test.ts` — Updated 8 failing tests: `reasoning_effort` → `effort`; added `effort: null` to exact `toEqual` assertions
- `sdk/src/handlers/init/composer.ts` — Added `getEffort()` helper; 6 builder regions updated with `*_effort` siblings + expanded Promise.all arrays
- `sdk/src/handlers/init/complex.ts` — Added `getEffort()` helper; 2 builder regions updated with `*_effort` siblings
- `sdk/src/golden/init-golden-normalize.ts` — Added `INIT_EXECUTE_PHASE_VOLATILE_KEYS` + `omitInitExecutePhaseVolatile` strip helper
- `sdk/src/golden/read-only-golden-rows.ts` — Added `init.execute-phase` parity row; updated `readOnlyGoldenCanonicals()` to include `init.execute-phase`
- `sdk/src/golden/read-only-parity.integration.test.ts` — Excluded `init.execute-phase` from generic `toEqual` loop; added dedicated describe block with `omitInitExecutePhaseVolatile` strip

## Decisions Made

- Followed D-07 static allowlist strictly (not data-derived) to prevent Pitfall 1 regression
- Used the `runtimeTier.reasoning_effort` merged value (from `resolveRuntimeTier`) as the Codex step-4 fallback rather than calling `resolveRuntimeTierDefault` again — this correctly includes user `model_profile_overrides`
- For the override path, split model and effort from the override string using `parseModelEffort` so `model_overrides: {'gsd-planner': 'opus;high'}` correctly yields `{model: 'opus', effort: 'high'}`
- Chose `init.execute-phase` (phase 9) for the golden row — deterministic, exists in all branches, emits `*_model/*_effort`; volatile strip removes `project_root`, `agents_installed`, `missing_agents`, `project_title`

## Deviations from Plan

**1. [Rule 1 - Bug] Updated existing config-query.test.ts tests expecting reasoning_effort**

- **Found during:** Task 1 GREEN
- **Issue:** 8 existing tests in `config-query.test.ts` asserted `reasoning_effort` in the output or used `toEqual` without `effort` field; these broke when we changed the output field name
- **Fix:** Changed `reasoning_effort` to `effort` in `toMatchObject` assertions; added `effort: null` to all `toEqual` assertions
- **Files modified:** `sdk/src/query/config-query.test.ts`
- **Commit:** `3132881c`

**2. [Rule 2 - Missing functionality] Added *_effort sibling to initVerifyWork**

- The plan's `<action>` listed composer.ts lines 449-450, 556-558, 648-650, 713-716, 788-789, 1115 and complex.ts 317-319, 492-493. Line 788-789 corresponds to `initVerifyWork`. This was included as part of the blanket *_model coverage (D-06).

No other deviations from plan.

## Issues Encountered

- **SDK bridge routing**: When running `gsd-tools.cjs init execute-phase 9` from the worktree, it routes through the SDK bridge (not the CJS fallback), so the output reflects the SDK's implementation. After building the worktree SDK, the CLI and SDK parity test matched correctly.

## User Setup Required

None.

## Next Phase Readiness

- EXPOSE-01, EXPOSE-02, EXPOSE-03 complete across both CLI and SDK
- Phase 55 can assign `model:effort` values in the catalog; all plumbing is in place
- Phase 56 spawn-template wiring can reference `*_effort` siblings and `effort` field from init/resolve-model output
- Phase 58 regression suite can use the golden parity harness to detect drift

---
*Phase: 54-sdk-tools-json-exposure*
*Completed: 2026-06-02*
