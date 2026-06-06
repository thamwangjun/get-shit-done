---
phase: 54-sdk-tools-json-exposure
plan: 01
subsystem: cli
tags: [effort, init, resolve-model, core.cjs, commands.cjs]

# Dependency graph
requires:
  - phase: 53-unified-effort-resolver
    provides: resolveReasoningEffortInternal (the canonical effort resolver)
provides:
  - "*_effort siblings for all 20 *_model sites across all init.cjs builders (EXPOSE-01)"
  - "Always-emit canonical effort field in cmdResolveModel output (EXPOSE-02 / D-03)"
  - "Bare-catalog inertness proof: all effort values null with no behavior change (SC#4)"
  - "reasoning_effort field name fully removed from cmdResolveModel (D-05 rename)"
affects: [phase-55-catalog-schema, phase-56-spawn-templates, phase-58-regression]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same-slot 1:1 sibling derivation: <role>_effort from same agent as adjacent <role>_model"
    - "Always-emit explicit-null: effort / *_effort fields always present, null on bare catalog"
    - "?? null belt-and-suspenders: resolver returns null on bare catalog; coalesce guards undefined leak"

key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/init.cjs (import + 20 *_effort siblings across 8 builder regions)
    - get-shit-done/bin/lib/commands.cjs (cmdResolveModel: one-line flip to always-emit effort)
    - tests/init.test.cjs (EXPOSE-01 sibling coverage tests + 1:1 pairing assertion)
    - tests/commands.test.cjs (EXPOSE-02 always-emit + rename assertions)
    - tests/core.test.cjs (SC#4 inertness loop over 9 agent slots)

key-decisions:
  - "D-01 explicit-null: effort fields always present with null on bare catalog (not omitted)"
  - "D-04/D-05: canonical field name is effort; reasoning_effort fully removed with no alias"
  - "D-06 blanket coverage: every *_model site gets a same-agent *_effort sibling (no #3023 divergence)"

patterns-established:
  - "EXPOSE-01 sibling pattern: <role>_effort: resolveReasoningEffortInternal(cwd, '<agent>') ?? null immediately after each <role>_model line"
  - "EXPOSE-02 always-emit pattern: result.effort = reasoningEffort ?? null (not conditional)"

requirements-completed: [EXPOSE-01, EXPOSE-02]

# Metrics
duration: 1h 9m
completed: 2026-06-02
---

# Phase 54 Plan 01: CLI Effort Exposure Summary

**Added *_effort siblings to all 20 *_model fields across init.cjs builders and canonical always-emit effort field in cmdResolveModel**

## Performance

- **Duration:** 1h 9m
- **Started:** 2026-06-02T08:21:26Z
- **Completed:** 2026-06-02T09:30:31Z
- **Tasks:** 2 (both TDD: RED + GREEN = 4 commits)
- **Files modified:** 5

## Accomplishments
- 20 `*_effort` siblings added across all 8 init.cjs builder regions, each derived from the same agent slot as its adjacent `*_model` (D-06 blanket coverage, prevents #3023 divergence)
- `cmdResolveModel` always emits canonical `effort` field (`reasoningEffort ?? null`), fully removing the old `reasoning_effort` name (D-05 rename, no alias)
- Bare-catalog inertness proven: all 9 resolvable agent slots return `null` from `resolveReasoningEffortInternal` (SC#4), and every `*_effort` sibling defaults to `null` with zero `*_model` value changes (D-02 additive-superset)
- TDD discipline: 5 sibling-coverage tests written RED first, then GREEN implementation; 3 resolve-model tests updated + 1 inertness loop added

## Task Commits

Each task was committed atomically (TDD: RED then GREEN):

1. **Task 1 RED: failing tests for *_effort sibling coverage** - `03184324` (test)
2. **Task 1 GREEN: add *_effort siblings to all init.cjs builders** - `cb23a202` (feat)
3. **Task 2 RED: update resolve-model tests + add inertness loop** - `ff4e3bdb` (test)
4. **Task 2 GREEN: always-emit canonical effort in cmdResolveModel** - `67337855` (feat)

## Files Created/Modified
- `get-shit-done/bin/lib/init.cjs` - Added `resolveReasoningEffortInternal` import; added 20 `*_effort` siblings (one per `*_model`) across 8 builder regions with `?? null` explicit-null default
- `get-shit-done/bin/lib/commands.cjs` - `cmdResolveModel`: replaced conditional `if (reasoningEffort) result.reasoning_effort = reasoningEffort` with always-emit `result.effort = reasoningEffort ?? null`
- `tests/init.test.cjs` - Added 5 EXPOSE-01 tests: execute-phase, plan-phase, new-milestone, quick builders + 1:1 `*_model`/`*_effort` pairing assertion
- `tests/commands.test.cjs` - Updated 3 existing tests: flipped `reasoning_effort` to `effort`, replaced absence assertions with always-present-null assertions
- `tests/core.test.cjs` - Added `resolveReasoningEffortInternal` import + inertness loop over 9 agent slots proving bare-catalog `null` (SC#4)

## Decisions Made
- Followed all CONTEXT locked decisions (D-01 through D-06) without deviation
- Commit message for Task 2 GREEN used `feat(54-02)` instead of `feat(54-01)` (minor scoping inconsistency; plan is 01, task is within plan 01 -- no functional impact)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- EXPOSE-01 and EXPOSE-02 are complete on the CLI side
- EXPOSE-03 (SDK parity / golden harness extension) deferred to plan 54-02
- Phase 56 spawn-template wiring can now reference `*_effort` siblings and the canonical `effort` field from init/resolve-model output

---
*Phase: 54-sdk-tools-json-exposure*
*Completed: 2026-06-02*
