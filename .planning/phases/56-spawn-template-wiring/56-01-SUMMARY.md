---
phase: 56-spawn-template-wiring
plan: "01"
subsystem: core-cli
tags: [effort-resolution, d-08-floor, resolver, cli-query, tdd]
dependency_graph:
  requires: []
  provides: [resolve-model-effort-query, d-08-medium-floor]
  affects: [core.cjs, commands.cjs, gsd-tools.cjs]
tech_stack:
  added: []
  patterns: [tdd-red-green, thin-wrapper-query, single-source-of-truth-floor]
key_files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
    - get-shit-done/bin/lib/commands.cjs
    - get-shit-done/bin/gsd-tools.cjs
    - tests/core.test.cjs
    - tests/commands.test.cjs
decisions:
  - "D-02: accept-argument-carrier — Agent() effort= argument accepted as forward-compatible template convention"
  - "D-08: floor lands in resolveReasoningEffortInternal (return 'medium') — single source of truth for all callers"
metrics:
  duration: ~25 minutes
  completed: 2026-06-04
  tasks_completed: 3
  tasks_total: 3
---

# Phase 56 Plan 01: Effort-Resolution Foundation Summary

D-08 medium floor in `resolveReasoningEffortInternal` and `resolve-model-effort` CLI query emitting pre-built `effort="medium"` carrier token for Plans 02/03 spawn-site wiring.

## What Was Built

### Task 1: D-02 carrier-verification gate (resolved by orchestrator)

Decision: **accept-argument-carrier** — the `Agent()` `effort=` argument is accepted as the forward-compatible template convention, consistent with `isolation=` / `run_in_background=` orchestrator-interpreted pseudocode precedent and honoring locked D-01 exactly.

Residual risk acknowledged: the `effort=` argument may be inert in the current Claude Code runtime (per-invocation effort not yet documented in the official 4-step model-resolution chain). The wiring is forward-compatible — it will activate when/if Claude Code confirms per-invocation support. The verified fallback (frontmatter `effort:`) was rejected because it contradicts D-01 and cannot vary per-spawn-site (D-03).

Plans 02/03 are unblocked and proceed with `effort="{executor_model_effort_arg}"` Agent() args.

### Task 2: D-08 medium floor in resolveReasoningEffortInternal (core.cjs)

- Replaced `return null` at the final fallthrough of `resolveReasoningEffortInternal` with `return 'medium'`
- Added D-08 rationale comment: allowlist gate at line 1617 scopes to `{claude,codex}` runtimes; inherit slots return null at line 1635 before reaching the floor
- Updated stale JSDoc comment at line 1609 from "bare claude configs without catalog slot effort → null" to state the D-08 floor + inherit/non-effort exceptions
- All earlier precedence returns are untouched (allowlist gate, inherit-null, per-agent override, phase-type slot, catalog suffix, runtime-tier entry)
- 5 unit tests added: bare claude adaptive profile floors to medium, inherit→null, non-effort runtime→null, explicit catalog suffix preserved, inherit override→null

Key insight: the existing SC#4 test (balanced profile) still passes because balanced profile slots carry `;medium` suffix — the floor only fires for the `adaptive` profile where slots are bare (e.g., `sonnet` with no `;effort`). D-08 correctly targets the uncovered gap.

### Task 3: resolve-model-effort query (commands.cjs + gsd-tools.cjs)

- `cmdResolveModelEffort(cwd, agentType, raw)` added in commands.cjs immediately after `cmdResolveModel`
- Thin wrapper: calls `resolveReasoningEffortInternal`, builds `token = effort !== null ? \`effort="${effort}"\` : ''`, emits `output({ effort, token }, raw, token)` — raw mode is always the token (never null)
- Exported in `module.exports` alongside `cmdResolveModel`
- `case 'resolve-model-effort':` registered in gsd-tools.cjs immediately after `case 'resolve-model':`
- `resolve-model-effort` added to help string adjacent to `resolve-model`
- 4 unit tests: no-agent-type error, raw token for present effort (adaptive profile), empty string for absent effort (no runtime), JSON `{effort, token}` shape

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| D-02: carrier form | accept-argument-carrier | Honors D-01; consistent with isolation=/run_in_background= precedent; zero rework if Claude Code confirms per-invocation effort |
| D-08: floor placement | resolveReasoningEffortInternal (core.cjs) | Single source of truth — resolve-model, resolve-model-effort, and SDK surfaces all share one floor |
| Thin wrapper | cmdResolveModelEffort wraps resolveReasoningEffortInternal directly | D-04/D-06 — no new resolution logic; all callers share the floor |

**D-02 residual risk:** `effort=` Agent() argument may be inert today (per-invocation effort unconfirmed in Claude Code's 4-step resolution chain). Wiring is forward-compatible. Acknowledged and accepted.

## Verification

```
node --test tests/core.test.cjs          → 172 pass, 0 fail
node --test tests/commands.test.cjs      → all pass
npm test                                 → 4714 pass, 0 fail, 4 skipped
node gsd-tools.cjs query resolve-model-effort gsd-debugger --raw --cwd <claude-adaptive-project>
  → effort="medium"
```

Fork gates confirmed: 4714 pass, 0 fail (agent-frontmatter, negative-framing, step-numbering, cross-file-refs gates all held).

## Deviations from Plan

### TDD gate adjustment

The initial RED tests (using balanced profile) unexpectedly passed because `balanced` profile slots carry `;medium` effort suffix — they flow through step 4 (catalog slot effort), not the floor. The tests were revised to use `adaptive` profile (bare `sonnet` slot, no `;effort`) which correctly failed before D-08 and passed after. This is a test-precision fix, not a scope change.

**Rule applied:** Rule 1 (auto-fix) — test was not correctly exercising the floor's target case.

## Commits

| Task | Commit | Files |
|---|---|---|
| Task 2: D-08 floor | 149f7f52 | core.cjs, tests/core.test.cjs |
| Task 3: resolve-model-effort query | a2b46163 | commands.cjs, gsd-tools.cjs, tests/commands.test.cjs |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The emitted token is enum-constrained by `parseModelEffort` (T-56-01 accepted per plan threat model).

## Self-Check: PASSED

- `get-shit-done/bin/lib/core.cjs` — exists, contains `return 'medium'` at floor ✓
- `get-shit-done/bin/lib/commands.cjs` — exists, contains `cmdResolveModelEffort` definition and export ✓
- `get-shit-done/bin/gsd-tools.cjs` — exists, contains `case 'resolve-model-effort':` and help string ✓
- `tests/core.test.cjs` — exists, contains D-08 test suite ✓
- `tests/commands.test.cjs` — exists, contains resolve-model-effort test suite ✓
- Commit 149f7f52 exists ✓
- Commit a2b46163 exists ✓
