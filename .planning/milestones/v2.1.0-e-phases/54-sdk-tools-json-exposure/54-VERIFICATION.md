---
phase: 54-sdk-tools-json-exposure
verified: 2026-06-02T11:50:00Z
status: passed
score: 10/10
overrides_applied: 0
---

# Phase 54: SDK & Tools JSON Exposure — Verification Report

**Phase Goal:** Expose resolved reasoning effort in the CLI init JSON and resolve-model JSON surface, and port matching effort shapes into the SDK with golden parity enforcement.
**Verified:** 2026-06-02T11:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The init JSON exposes a `*_effort` sibling for every resolved `*_model` field consumed by workflows | VERIFIED | `grep -c "resolveReasoningEffortInternal(cwd,"` returns 20; import added at line 8; 20 `?? null` siblings confirmed |
| 2 | `cmdResolveModel` / agent-skills output includes a canonical resolved `effort` field | VERIFIED | `commands.cjs:250` has `result.effort = reasoningEffort ?? null`; `grep -c "reasoning_effort"` returns 0; live run confirms `{"effort": null}` |
| 3 | SDK and CLI resolution produce byte-identical model+effort shapes, verified by a parity test | VERIFIED | `sdk/src/golden/read-only-golden-rows.ts` has new `init.execute-phase` parity row; `read-only-parity.integration.test.ts` uses `omitInitExecutePhaseVolatile`; resolve-model row updated; `resolve-model-effort.test.ts` has 12 tests (233 lines) |
| 4 | On a bare catalog, every exposed `*_effort` value is `null` — confirming inertness | VERIFIED | `tests/core.test.cjs` inertness loop (lines 2011–2041) asserts `null` for 9 agent slots; all 8594 tests pass |

**Score: 4/4 roadmap success criteria verified**

### Plan 01 Must-Have Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every `*_model` field in every init.cjs builder has a sibling `*_effort` key (1:1, same agent) | VERIFIED | `grep -c` returns 20 for both patterns; executor_effort → `gsd-executor`, verifier_effort → `gsd-verifier` confirmed at lines 198–200 |
| 2 | `cmdResolveModel` always emits a canonical `effort` field (never omitted) | VERIFIED | `commands.cjs:250`: `result.effort = reasoningEffort ?? null` |
| 3 | On a bare catalog every exposed `*_effort` / `effort` value is `null` (SC#4 inertness) | VERIFIED | Inertness loop in `tests/core.test.cjs`; all pass |
| 4 | D-05: `reasoning_effort` no longer emitted from cmdResolveModel output (renamed to effort, no alias) | VERIFIED | `grep -c "reasoning_effort" commands.cjs` = 0 |
| 5 | D-06: each `*_effort` sibling derives from the SAME agent slot as its adjacent `*_model` (no #3023 divergence) | VERIFIED | Sampled line 198/200: `executor_model` uses `gsd-executor`; `executor_effort` uses same agent |

### Plan 02 Must-Have Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | SDK resolveModel emits a canonical `effort` field (always present, `?? null`) matching the CLI cmdResolveModel shape | VERIFIED | `config-query.ts` has 4-step chain; all return paths emit `effort`; 8 `reasoning_effort` refs are internal Codex reads only, never emitted |
| 7 | SDK init handlers emit a `*_effort` sibling for every `*_model`, mirroring the CLI init builders | VERIFIED | `composer.ts` has 15 `_effort` occurrences + 16 `getEffort` calls; `complex.ts` has 5 `_effort` + 6 `getEffort` |
| 8 | SDK `runtimesWithReasoningEffort` uses the static `{claude, codex}` allowlist | VERIFIED | `model-catalog.ts:71`: `return new Set(['claude', 'codex'])` |
| 9 | The existing resolve-model golden parity row passes with both sides emitting `effort: null` | VERIFIED | `read-only-golden-rows.ts:69` confirms row present; all tests pass (8594/0) |
| 10 | A NEW init-builder golden row enforces `*_effort` sibling parity with volatile keys stripped | VERIFIED | `read-only-golden-rows.ts:64–69` has `init.execute-phase` row; `init-golden-normalize.ts:24–37` has `omitInitExecutePhaseVolatile` |

**Score: 10/10 must-haves verified**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/bin/lib/init.cjs` | `*_effort` siblings for all 20 `*_model` sites + import | VERIFIED | Import at line 8; exactly 20 `resolveReasoningEffortInternal(cwd, ...)` calls with `?? null` |
| `get-shit-done/bin/lib/commands.cjs` | `cmdResolveModel` always-emit `effort` field | VERIFIED | Line 250; `reasoning_effort` count = 0 |
| `tests/init.test.cjs` | 1:1 `*_model`/`*_effort` pairing + bare-catalog null assertions | VERIFIED | Tests present; part of 8594 passing |
| `tests/commands.test.cjs` | Always-emit effort assertions; `reasoning_effort` absence | VERIFIED | 3 tests updated to assert `output.effort` |
| `tests/core.test.cjs` | Bare-catalog inertness loop over all 9 agent slots | VERIFIED | Lines 2011–2041 with `resolveReasoningEffortInternal` import |
| `sdk/src/model-catalog.ts` | Static `{claude, codex}` `runtimesWithReasoningEffort` | VERIFIED | Line 71: `new Set(['claude', 'codex'])` |
| `sdk/src/query/config-query.ts` | 4-step effort precedence chain + always-emit `effort` | VERIFIED | `reasoning_effort` count = 6, all internal reads; `effort` emitted on all paths |
| `sdk/src/handlers/init/composer.ts` | `getEffort` helper + `*_effort` siblings in 6 regions | VERIFIED | 16 `getEffort` occurrences; 15 `_effort` field entries |
| `sdk/src/handlers/init/complex.ts` | `getEffort` helper + `*_effort` siblings in 2 regions | VERIFIED | 6 `getEffort` occurrences; 5 `_effort` field entries |
| `sdk/src/golden/read-only-golden-rows.ts` | New `init.execute-phase` parity row | VERIFIED | Row at line 69; excluded from generic loop at line 83 |
| `sdk/src/golden/init-golden-normalize.ts` | `omitInitExecutePhaseVolatile` strip helper | VERIFIED | Lines 24–37 |
| `sdk/src/query/resolve-model-effort.test.ts` | 12 EXPOSE-03 unit tests | VERIFIED | File exists, 233 lines |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `init.cjs *_effort` siblings | `core.cjs resolveReasoningEffortInternal` | `resolveReasoningEffortInternal(cwd, '<agent>') ?? null` | VERIFIED | Pattern confirmed at lines 198, 200, 346, 348 etc.; exactly 20 matches |
| `commands.cjs cmdResolveModel` | `result.effort` | always-emit `?? null` | VERIFIED | Line 250 |
| `sdk/src/query/config-query.ts resolveModel` | CLI 4-step precedence chain | ported mirror | VERIFIED | Allowlist gate, override, slot, Codex fallback all present; `effort` field always emitted |
| `sdk/src/handlers/init/composer.ts + complex.ts` | `resolveModel effort` | `getEffort` helper reading `data.effort` | VERIFIED | `getEffort` defined and called at all `*_model` sites |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `resolve-model gsd-planner` returns `effort: null`, no `reasoning_effort` | `node gsd-tools.cjs resolve-model gsd-planner` | `{"model":"opus","profile":"balanced","effort":null}` — `reasoning_effort` absent | PASS |
| All CLI tests pass with zero new regressions | `npm test` | 8594 pass / 0 fail / 11 skipped | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXPOSE-01 | 54-01-PLAN.md | Init JSON exposes `*_effort` sibling for every `*_model` | VERIFIED | 20 siblings in init.cjs; tests assert 1:1 pairing |
| EXPOSE-02 | 54-01-PLAN.md | `cmdResolveModel` always emits canonical `effort` field | VERIFIED | `result.effort = reasoningEffort ?? null`; `reasoning_effort` count = 0 |
| EXPOSE-03 | 54-02-PLAN.md | SDK and CLI produce byte-identical model+effort shapes | VERIFIED | Golden parity rows green; `resolve-model-effort.test.ts` 12 tests pass |

### Anti-Patterns Found

No blockers found. No `TBD`, `FIXME`, or `XXX` markers detected in modified files. No stubs — all `effort` fields carry live resolver results (null on bare catalog per the explicit-null contract, not a stub).

### Human Verification Required

None — all success criteria are programmatically verifiable. The golden parity harness enforces byte-identical SDK↔CLI shapes. Bare-catalog inertness is proven by the unit test loop.

---

_Verified: 2026-06-02T11:50:00Z_
_Verifier: Claude (gsd-verifier)_
