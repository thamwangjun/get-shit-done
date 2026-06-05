---
phase: 57-install-time-translation
plan: "02"
subsystem: install-time-translation
tags: [tdd, green, core.cjs, haiku-exclusion, translateEffortForCodex, effort-translation]
dependency_graph:
  requires: [57-01]
  provides: [get-shit-done/bin/lib/core.cjs (haiku exclusion + translateEffortForCodex)]
  affects: [bin/install.js (plan 57-03 reads translateEffortForCodex)]
tech_stack:
  added: []
  patterns: [single-source-of-truth, pure-string-clamp, null-passthrough, CommonJS named export]
key_files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
decisions:
  - "haiku exclusion placed before steps 3/3a/4/5 so a catalog haiku slot with reasoning_effort='medium' still resolves to null (Pitfall 1)"
  - "translateEffortForCodex uses == null (covers both null and undefined) not strict === null"
  - "override path checks parseModelEffort(override).model (not the raw string) so haiku;high correctly hits the guard"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-05"
---

# Phase 57 Plan 02: Core.cjs Haiku Exclusion + translateEffortForCodex Summary

**Haiku-tier always returns null from the resolver (D-03 + A1), and the translateEffortForCodex helper translates Claude max to Codex xhigh at the boundary (D-02), with both changes exported from core.cjs.**

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add haiku exclusion to resolveReasoningEffortInternal | c04edb89 | get-shit-done/bin/lib/core.cjs |
| 2 | Add and export translateEffortForCodex helper | da392e9e | get-shit-done/bin/lib/core.cjs |

## What Was Built

### Task 1: Haiku Exclusion (D-03 + A1)

Two guards added to `resolveReasoningEffortInternal` in `core.cjs`:

1. **Override path** (~line 1626): `if (parseModelEffort(override).model === 'haiku') return null;` — A1 compliance: explicit `haiku;high` override returns null (haiku exclusion wins over any effort suffix).

2. **bareTier path** (~line 1645): `if (bareTier === 'haiku') return null;` — placed before steps 3/3a/4/5 and the D-08 floor, so a catalog haiku entry with `reasoning_effort='medium'` never reaches step 5 (Pitfall 1 from research).

Both paths are runtime-neutral: haiku returns null on `claude` and `codex` alike.

### Task 2: translateEffortForCodex Helper (D-02)

Added `translateEffortForCodex(effort)` near the other effort helpers, mirroring `parseModelEffort`'s JSDoc-first shape:

```js
function translateEffortForCodex(effort) {
  if (effort == null) return null;
  return effort === 'max' ? 'xhigh' : effort;
}
```

Exported as `translateEffortForCodex,` in the single trailing `module.exports` block alongside `parseModelEffort` and `resolveTierEntry`.

## Test Results

```
feat-57-install-translation.test.cjs (post-plan-02):
  ℹ pass 14
  ℹ fail 2  ← Codex TOML emit tests (plan 57-03 scope, expected RED)

feat-53-unified-effort-resolver.test.cjs:
  ℹ pass 13
  ℹ fail 0  ← no regression
```

Tests that went GREEN this plan:
- translateEffortForCodex is exported as a function (INSTALL-01)
- translateEffortForCodex("max") === "xhigh"
- translateEffortForCodex("low/medium/high") pass through
- translateEffortForCodex(null/undefined) === null
- resolver returns "max" verbatim on both runtimes (D-01)
- haiku slot → null on codex (no medium floor)
- haiku slot → null on claude
- model_overrides[agent] = "haiku;high" → null (A1)

Tests remaining RED (plan 57-03 scope):
- Codex TOML emits xhigh for opus;max (generateCodexAgentToml not yet wired)
- Codex TOML emits no model_reasoning_effort for haiku-tier agent

## Deviations from Plan

None — plan executed exactly as written. Both insertions match the action spec locations and comment style.

## Known Stubs

None.

## Threat Flags

None — pure resolver + helper change, fixed-token output, no new trust boundaries.

## Self-Check

- [x] get-shit-done/bin/lib/core.cjs exists and is modified
- [x] Commit c04edb89 exists (Task 1)
- [x] Commit da392e9e exists (Task 2)
- [x] `grep -c "bareTier === 'haiku'" get-shit-done/bin/lib/core.cjs` returns 1
- [x] `grep -c "=== 'haiku'" get-shit-done/bin/lib/core.cjs` returns >= 2
- [x] `grep -c "function translateEffortForCodex" get-shit-done/bin/lib/core.cjs` returns 1
- [x] `grep -c "translateEffortForCodex," get-shit-done/bin/lib/core.cjs` returns >= 1
- [x] 14/16 feat-57 tests pass; 2 remaining are plan 57-03 scope
