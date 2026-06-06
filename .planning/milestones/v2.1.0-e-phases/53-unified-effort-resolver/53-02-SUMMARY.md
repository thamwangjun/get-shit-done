---
phase: 53-unified-effort-resolver
plan: "02"
subsystem: effort-resolver
tags: [resolver, effort, config-sites, golden-snapshot, tdd]
dependency_graph:
  requires: [53-01]
  provides: [CONFIG-02, CONFIG-03, CONFIG-04, D-08]
  affects: [get-shit-done/bin/lib/core.cjs, tests/feat-53-config-sites-and-golden.test.cjs]
tech_stack:
  added: []
  patterns: [parseModelEffort-routing, field-merge-effort-extraction, same-slot-golden-snapshot]
key_files:
  created: [tests/feat-53-config-sites-and-golden.test.cjs]
  modified:
    - get-shit-done/bin/lib/core.cjs
decisions:
  - "resolveTierEntry string shorthand path now calls parseModelEffort to extract ;effort — a ;effort suffix in model_profile_overrides string form is honoured as reasoning_effort (CONFIG-03 gap fixed)"
  - "malformed ;effort in model_profile_overrides string shorthand: warns via parseModelEffort, degrades model to base, field-merge preserves built-in reasoning_effort (CONFIG-04/D-05 — no separate reject pass)"
  - "CONFIG-04 tests on claude runtime (no per-tier fallback) to isolate slot-effort null degradation; codex per-tier fallback correctly fires when slot effort is null (expected behavior, not a bug)"
  - "D-08 golden snapshot iterates all ~33 MODEL_PROFILES agents across quality/balanced/budget/inherit on bare claude config — 276 tests total, all green"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-01"
  tasks: 2
  files_changed: 2
---

# Phase 53 Plan 02: Config-Site Acceptance + Cross-Resolver Golden Snapshot Summary

**One-liner:** `resolveTierEntry` string-shorthand fix routes `;effort` through `parseModelEffort` (CONFIG-03), plus 276-test golden snapshot guarding bare-config back-compat and same-slot invariant across all agents/profiles (D-08).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Config-site acceptance tests + confirm parseModelEffort routing | 634d3b34 | tests/feat-53-config-sites-and-golden.test.cjs, core.cjs |
| 2 | Cross-resolver golden snapshot (D-08) | 634d3b34 | tests/feat-53-config-sites-and-golden.test.cjs (same file, same commit) |

## What Was Built

### CONFIG-02: models.<phase-type> Accepts model;effort

Confirmed (no code change needed): `_resolveAgentSlot` (fixed in Plan 01) returns the full raw slot string including `;effort` suffix. `resolveReasoningEffortInternal` step 3 calls `parseModelEffort(tier).effort` — the effort is already parsed from the same slot that drives model resolution. CONFIG-02 was routing-complete from Plan 01; this plan proves it with tests.

Tests:
- `codex + models.execution = "opus;low"` → effort `"low"` (CONFIG-02 primary case)
- `claude + models.verification = "sonnet;high"` → effort `"high"`
- Bare `"opus"` on claude → effort null (back-compat)

### CONFIG-03: model_profile_overrides String Shorthand Accepts model;effort

**Code change in `resolveTierEntry` (core.cjs):** The string shorthand path (`typeof userRaw === 'string'`) previously produced `{ model: userRaw }` without parsing the `;effort` suffix. Now it calls `parseModelEffort(userRaw)` and, when effort is non-null, includes `reasoning_effort: effort` in the user entry. The field-merge then correctly lets the user's effort override the built-in.

Before: `"gpt-5-pro;high"` → `{ model: "gpt-5-pro;high" }` → merged with built-in → `reasoning_effort: "xhigh"` (wrong — user's "high" ignored)
After: `"gpt-5-pro;high"` → `{ model: "gpt-5-pro", reasoning_effort: "high" }` → merged with built-in → `reasoning_effort: "high"` (correct — user wins)

Tests:
- `codex + model_profile_overrides.codex.opus = "gpt-5-pro;high"` → effort `"high"` (CONFIG-03)
- `"gpt-5-pro"` bare shorthand → `"xhigh"` from built-in (back-compat preserved)
- Object form `{ model, reasoning_effort }` → still works (unchanged path)

### CONFIG-04: Malformed Effort Token Degrades via parseModelEffort

No additional code change needed. `parseModelEffort` owns the one-time warn-and-degrade path. Both config sites route through it naturally:
- `models.<phase-type> = "opus;hihg"` (tested on claude): warns, slot effort null, resolver returns null (no per-tier fallback on claude)
- `model_profile_overrides.codex.opus = "gpt-5-pro;hihg"`: warns, model degrades to `"gpt-5-pro"`, built-in `reasoning_effort: "xhigh"` preserved via field-merge — result is `"xhigh"` (correct: malformed slot effort stripped, built-in still active)
- One-time warn: verified second call on same label produces no additional stderr output

### D-08: Cross-Resolver Golden Snapshot

276 tests covering all ~33 agents in MODEL_PROFILES across 4 profiles (quality/balanced/budget/inherit):

**Bare-config back-compat (claude runtime):** `resolveReasoningEffortInternal` returns null for every agent/profile combination — no `;effort` in bare config → no effort emitted.

**Same-slot invariant:** For each agent/profile, `parseModelEffort(_resolveAgentSlot(...))` is called and:
- `parsed.effort === null` (bare config carries no `;effort` in slot)
- `resolveReasoningEffortInternal` matches (both null)
- `resolveModelInternal` returns a string with no semicolon (no `;effort` contamination in model output)

**#3023 fixture:** `{ runtime: 'codex', model_profile: 'inherit', models: { execution: 'opus' } }` on `gsd-executor`:
- `_resolveAgentSlot` returns `'opus'` (phase-type wins over `inherit` profile)
- `resolveModelInternal` returns the codex opus model (not `'inherit'` or `'sonnet'`)
- `resolveReasoningEffortInternal` returns `'xhigh'` (Codex per-tier fallback for opus tier, same slot)
- With `models.execution = 'opus;low'`: effort `'low'` (slot effort wins over per-tier)

## Verification Results

- `node --test tests/feat-53-config-sites-and-golden.test.cjs` → 276/276 pass
- `npm test` → 8588/8588 pass, 0 failures, 11 pre-existing skips

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] resolveTierEntry string shorthand did not parse ;effort suffix (CONFIG-03 gap)**
- **Found during:** Task 1 — writing CONFIG-03 tests confirmed the string shorthand path produced `{ model: "gpt-5-pro;high" }` without parsing the effort
- **Issue:** `resolveTierEntry` treated string shorthand as `{ model: userRaw }` verbatim, so a `"model;effort"` shorthand left `reasoning_effort` undefined in the user entry; the field-merge then used the built-in value instead of the user's intended override
- **Fix:** When `userRaw` is a string, call `parseModelEffort(userRaw)` and include `reasoning_effort: effort` in the user entry when effort is non-null; bare strings still yield `{ model }` only (built-in preserved)
- **Files modified:** `get-shit-done/bin/lib/core.cjs` (`resolveTierEntry` function body)
- **Commit:** 634d3b34

**2. [Rule 1 - Test Adjustment] CONFIG-04 tests initially used codex runtime**
- **Found during:** Task 1 test execution — codex per-tier fallback masked the slot-effort null degradation, causing false failures
- **Fix:** Moved CONFIG-04 malformed `models.<phase-type>` tests to claude runtime (no per-tier fallback) to isolate the null degradation case; added separate clarifying comment for `model_profile_overrides` malformed test asserting `xhigh` (built-in active) rather than null

## Known Stubs

None.

## Threat Flags

None — the `resolveTierEntry` change is a local string-parsing addition within an already-bounded function. No new network endpoints, auth paths, or untrusted input paths.

## Self-Check

- [x] `tests/feat-53-config-sites-and-golden.test.cjs` created with 276 tests, all passing
- [x] `get-shit-done/bin/lib/core.cjs` `resolveTierEntry` updated to parse `parseModelEffort` on string shorthand
- [x] Commit 634d3b34 exists in git log
- [x] `npm test` 8588 pass, 0 failures
