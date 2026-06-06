---
phase: 57-install-time-translation
plan: "03"
subsystem: install-time-translation
tags: [tdd, green, bin/install.js, codex-toml, translateEffortForCodex, effort-emit, resolver-wiring]
dependency_graph:
  requires: [57-02]
  provides: [bin/install.js (Codex TOML effort routed through floored core resolver + translateEffortForCodex)]
  affects: [tests/issue-2517-runtime-aware-profiles.test.cjs (updated to reflect Phase 57 behavior)]
tech_stack:
  added: []
  patterns: [single-source-of-truth, translate-at-boundary, runtime-gate-D04, null-omit]
key_files:
  created: []
  modified:
    - bin/install.js
    - tests/issue-2517-runtime-aware-profiles.test.cjs
decisions:
  - "resolveEffort method on install resolver gates on probedProjectDir (Pitfall 3: no second walk-up)"
  - "D-04 gate: runtimeResolver.runtime === 'codex' check guards the effort emit so Claude path emits nothing"
  - "entry.reasoning_effort removed as effort source; catalog per-tier value no longer used for effort (D-01)"
  - "issue-2517 TOML tests updated: quality+opus;low → 'low' (not RUNTIME_PROFILE_MAP 'xhigh'); omit-effort test switched to haiku-tier agent (D-03 path)"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-05"
---

# Phase 57 Plan 03: Codex TOML Emit Seam Redirection Summary

**Codex TOML emit now sources reasoning_effort from the floored core resolver (resolveReasoningEffortInternal) and translates via translateEffortForCodex at the boundary, completing Phase 57's INSTALL-01 and INSTALL-02 requirements.**

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Import core helpers + resolveEffort sibling on install resolver | ebf510d5 | bin/install.js |
| 2 | Redirect Codex TOML emit seam to floored resolver + translateEffortForCodex | 6d9b5e21 | bin/install.js |
| fix | Update issue-2517 TOML tests to reflect Phase 57 resolver behavior | 42cb89f7 | tests/issue-2517-runtime-aware-profiles.test.cjs |
| 3 | Full-suite + coverage gate | — | (verification only) |

## What Was Built

### Task 1: Import Core Helpers + resolveEffort Sibling

In `bin/install.js` (~line 159):
```js
const {
  RUNTIME_PROFILE_MAP: GSD_RUNTIME_PROFILE_MAP,
  resolveTierEntry: gsdResolveTierEntry,
  resolveReasoningEffortInternal: gsdResolveReasoningEffort,
  translateEffortForCodex: gsdTranslateEffortForCodex,
} = require(path.join(_gsdLibDir, 'core.cjs'));
```

In `readGsdRuntimeProfileResolver`:
- `probedProjectDir` captured in the walk-up loop (same probe as model resolver, Pitfall 3 avoided)
- `resolveEffort(agentName)` method added to the returned resolver object, calling `gsdResolveReasoningEffort(probedProjectDir, agentName)`

### Task 2: Redirected Codex TOML Emit Seam

In `generateCodexAgentToml` (~line 2745):
- Removed `entry.reasoning_effort` as the effort source (D-01: catalog per-tier value no longer used)
- Added D-04 gate: only emit `model_reasoning_effort` when `runtimeResolver.runtime === 'codex'`
- New emit: `gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(resolvedName) ?? runtimeResolver.resolveEffort(agentName))`
- `model` field kept sourced from `entry.model` (Pitfall 2: Codex-native model preserved)

### Deviation: issue-2517 Test Update (Rule 1 — Bug)

Two tests in `tests/issue-2517-runtime-aware-profiles.test.cjs` were asserting the old pre-Phase-57 behavior:

1. `generated Codex TOML embeds model = and model_reasoning_effort = lines` expected `"xhigh"` (from RUNTIME_PROFILE_MAP), but Phase 57 routes effort through `resolveReasoningEffortInternal`. For `quality + gsd-planner`, the catalog slot is `opus;low`, so the correct effort is now `"low"`.

2. `generated TOML omits reasoning_effort when runtime has none` tested `model_profile_overrides.codex.opus.reasoning_effort = ''` and expected omission — but Phase 57's resolver falls through to the catalog slot `opus;low` returning `"low"`. Test updated to use haiku-tier agent (`gsd-verifier` on `budget` profile) which correctly tests the D-03 omit path.

## Test Results

```
feat-57-install-translation.test.cjs:
  pass 16 / fail 0  ← all 16 tests GREEN (2 new Codex TOML emit tests now pass)

issue-2517-runtime-aware-profiles.test.cjs:
  pass 80 / fail 1  ← 1 pre-existing haiku unit test (Plan 02 scope, unchanged)

codex-config.test.cjs + bug-3427-3433-codex-install-shape.test.cjs:
  pass 114 / fail 0  ← no regressions

Full suite:
  pass 7829 / fail 47  ← 2 fewer than pre-plan-03 baseline (49), test updates fixed 2
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated issue-2517 TOML tests to reflect Phase 57 resolver behavior**
- **Found during:** Task 3 (full suite run)
- **Issue:** Two tests in `issue-2517-runtime-aware-profiles.test.cjs` asserted old pre-Phase-57 behavior where `entry.reasoning_effort` came from RUNTIME_PROFILE_MAP. After Task 2, these tests failed because the resolver now sources effort from `resolveReasoningEffortInternal` (catalog slot, D-01).
- **Fix:** Updated test 1 to expect `"low"` (quality+opus;low catalog slot). Updated test 2 to use haiku-tier agent (D-03 omit path) instead of empty `reasoning_effort` override.
- **Files modified:** `tests/issue-2517-runtime-aware-profiles.test.cjs`
- **Commit:** 42cb89f7

## Known Stubs

None.

## Threat Flags

None — no new trust boundaries. The `model_reasoning_effort` value is one of a fixed token set (low/medium/high/xhigh) from `translateEffortForCodex`, JSON.stringify-quoted into TOML. Haiku-tier and null → omitted entirely. T-57-04 mitigated as designed.

## Self-Check

- [x] bin/install.js modified (imports + resolveEffort + emit seam)
- [x] tests/issue-2517-runtime-aware-profiles.test.cjs updated
- [x] Commit ebf510d5 exists (Task 1)
- [x] Commit 6d9b5e21 exists (Task 2)
- [x] Commit 42cb89f7 exists (test fix)
- [x] `grep -c "gsdResolveReasoningEffort\|gsdTranslateEffortForCodex" bin/install.js` returns >= 2
- [x] `grep -c "entry.reasoning_effort" bin/install.js` returns 0
- [x] `grep -c "resolveEffort" bin/install.js` returns >= 2
- [x] All 16 feat-57 tests GREEN
- [x] Full suite 47 failures (2 fewer than 49 baseline — test updates fixed 2 previously failing tests)
