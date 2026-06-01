---
phase: 53-unified-effort-resolver
plan: "01"
subsystem: effort-resolver
tags: [resolver, effort, model-catalog, core, tdd]
dependency_graph:
  requires: [52-parser-foundation]
  provides: [RESOLVE-01, RESOLVE-02, RESOLVE-03, RESOLVE-04, RESOLVE-05, RESOLVE-06, CONFIG-01, CONFIG-04]
  affects: [get-shit-done/bin/lib/core.cjs, get-shit-done/bin/lib/model-catalog.cjs]
tech_stack:
  added: []
  patterns: [unified-precedence-chain, static-allowlist, same-slot-invariant, tdd-red-green]
key_files:
  created: [tests/feat-53-unified-effort-resolver.test.cjs]
  modified:
    - get-shit-done/bin/lib/model-catalog.cjs
    - get-shit-done/bin/lib/core.cjs
    - tests/issue-2517-runtime-aware-profiles.test.cjs
    - tests/feat-3023-model-phase-types.test.cjs
decisions:
  - "D-07: RUNTIMES_WITH_REASONING_EFFORT is a static {claude, codex} literal — not data-derived from catalog scan"
  - "D-01: model_overrides[agent] ;effort parsed via parseModelEffort().effort; bare override yields null naturally (removes old early-null)"
  - "D-08: _resolveAgentSlot extended to accept ;effort-suffixed phase-type tiers by validating base alias only; raw string returned for effort extraction"
  - "D-03: max returned verbatim from resolver on both claude and codex paths; no max→xhigh clamp in resolver — that is the downstream Codex emit boundary's job"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-01"
  tasks: 2
  files_changed: 4
---

# Phase 53 Plan 01: Unified Effort Resolver Summary

**One-liner:** Static `{claude, codex}` allowlist + unified resolver precedence chain on `_resolveAgentSlot` with slot `;effort` extraction, override `.effort` emission, and verbatim `max` on both runtimes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace data-derived allowlist with static {claude, codex} Set | 1084a1fe | model-catalog.cjs, 2 test files |
| 2 (RED) | Add failing tests for unified effort resolver | 7ac515e0 | tests/feat-53-unified-effort-resolver.test.cjs |
| 2 (GREEN) | Rewrite resolveReasoningEffortInternal as unified resolver | b3be0462 | core.cjs |

## What Was Built

### Task 1: Static Allowlist (model-catalog.cjs)

Replaced the 5-line data-derived `RUNTIMES_WITH_REASONING_EFFORT` expression (which scanned `runtimeTierDefaults` for any runtime carrying `reasoning_effort`) with the static literal `new Set(['claude', 'codex'])`. The data-derived form was the exact anti-pattern RESOLVE-01 forbids — it would auto-admit any future runtime gaining an effort field.

Updated comment intent in two existing test files: the "bare-config Claude returns null" assertion (issue-2517:147 and feat-3023:345) still passes because the allowlist admitting claude does not change behavior for bare configs with no `;effort` suffix — the back-compat invariant holds.

### Task 2: Rewritten resolveReasoningEffortInternal (core.cjs)

**Unified precedence chain:**

1. **Outermost gate**: `!RUNTIMES_WITH_REASONING_EFFORT.has(config.runtime)` → null (RESOLVE-05/D-02). Absolute, runs before override emit — non-{claude,codex} installs with override `;effort` still return null.
2. **Per-agent override**: `parseModelEffort(override).effort` (D-01/CONFIG-01). Removes old early-null at former line 1545. Bare override → null naturally.
3. **Shared slot**: `_resolveAgentSlot(cwd, agentType)`. inherit/null → null (RESOLVE-06).
4. **Slot effort**: `parseModelEffort(tier).effort` — wins over Codex per-tier fallback (RESOLVE-03). max returned verbatim, no clamp (D-03/RESOLVE-04).
5. **Codex per-tier fallback**: `_resolveRuntimeTier(config, bareTier).reasoning_effort` — uses bare alias (before `;`) to avoid passing suffixed string to the tier lookup (D-06 step 3).

**_resolveAgentSlot extension (same-slot invariant, D-08):**

The shared slot helper was extended to accept `;effort`-suffixed phase-type tiers. Previously, `VALID_TIERS.has("opus;low")` was false, causing the slot to fall through to profile-based resolution and losing the effort suffix. Now the base alias is extracted via `parseModelEffort(phaseTypeTier).model` before the VALID_TIERS check, and the full raw string is returned intact for the effort resolver to extract the `;effort` portion. This is the #3023 same-slot invariant: model and effort derive from the same slot.

### New Test Suite (tests/feat-53-unified-effort-resolver.test.cjs)

13 tests covering all `<behavior>` cases:
- claude + slot `;high` → effort "high" (RESOLVE-01)
- bare-config back-compat invariant → null
- override `;max` verbatim (D-03), bare override → null (D-01)
- codex per-tier fallback "xhigh", slot `;low` wins (RESOLVE-03), slot `;max` verbatim (RESOLVE-04)
- opencode override `;high` → null (RESOLVE-05)
- no runtime set → null
- inherit profile/tier → null (RESOLVE-06)
- malformed "opus;hihg" → null + one-time stderr warning (CONFIG-04)

## Verification Results

- `node --test tests/feat-53-unified-effort-resolver.test.cjs` → 13/13 pass
- `node --test tests/issue-2517-runtime-aware-profiles.test.cjs tests/feat-3023-model-phase-types.test.cjs` → 108/108 pass
- `npm test` → 5130/5133 pass (3 pre-existing skips, 0 failures)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] _resolveAgentSlot did not pass ;effort-suffixed slot strings through**
- **Found during:** Task 2 GREEN phase
- **Issue:** `_resolveAgentSlot` checked `VALID_TIERS.has(phaseTypeTier)` where VALID_TIERS = `{'opus','sonnet','haiku','inherit'}`. A phase-type tier like `"opus;low"` failed this check and fell through to profile-derived resolution, discarding the `;effort` suffix entirely. The PATTERNS.md spec ("returns the raw tier/slot string so a ';effort' suffix in the slot survives") was not yet implemented.
- **Fix:** Extract `parseModelEffort(phaseTypeTier).model` as the base alias for the VALID_TIERS check; return the full raw `phaseTypeTier` string intact when valid. This lets the effort resolver extract `.effort` from the same slot via `parseModelEffort(tier).effort`.
- **Files modified:** `get-shit-done/bin/lib/core.cjs` (_resolveAgentSlot function body)
- **Commit:** b3be0462 (included in the GREEN implementation commit)

## Known Stubs

None — all behavior is fully wired. Bare configs return null (back-compat invariant). Effort values with `;effort` suffixes in slots will be assigned by the user in Phase 55 (USER-HANDOVER).

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns. The resolver reads only from the existing `loadConfig` path. All string parsing is through `parseModelEffort` which handles malformed input gracefully.

## Self-Check

- [x] `get-shit-done/bin/lib/model-catalog.cjs` exists and contains `new Set(['claude', 'codex'])` at line 92
- [x] `get-shit-done/bin/lib/core.cjs` contains rewritten `resolveReasoningEffortInternal` with unified chain
- [x] `tests/feat-53-unified-effort-resolver.test.cjs` created with 13 tests, all passing
- [x] Commits 1084a1fe, 7ac515e0, b3be0462 exist in git log
