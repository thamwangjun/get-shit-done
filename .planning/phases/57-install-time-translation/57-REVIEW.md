---
phase: 57-install-time-translation
reviewed: 2026-06-06T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - bin/install.js
  - get-shit-done/bin/lib/core.cjs
  - tests/feat-57-install-translation.test.cjs
  - tests/issue-2517-runtime-aware-profiles.test.cjs
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 57: Code Review Report

**Reviewed:** 2026-06-06
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 57 introduces install-time effort translation: a new `translateEffortForCodex` helper in
`core.cjs`, a haiku-tier effort exclusion in `resolveReasoningEffortInternal`, and a rewired Codex
TOML emit seam in `bin/install.js` that sources effort from the floored core resolver and translates
`max → xhigh` at the boundary.

The `translateEffortForCodex` helper is correct and well-scoped (`max→xhigh`, pass-through,
`null`/`undefined → null`). The haiku exclusion logic is correctly placed (both override and bareTier
paths short-circuit before the D-08 medium floor).

The chief blocker is that the haiku behavior change left a pre-existing test RED — `npm test` fails.
Three warnings concern config-source precedence divergence between the model and effort emit paths,
a `??` fallback that mis-handles intentional haiku `null`, and effort/model emit being decoupled.

## Critical Issues

### CR-01: Phase 57 leaves the test suite RED — stale haiku effort assertion not updated

**File:** `tests/issue-2517-runtime-aware-profiles.test.cjs:175-178`
**Issue:** The Phase 57 change `if (bareTier === 'haiku') return null;` (core.cjs:1663) makes
haiku-tier slots omit effort on every runtime. The sibling test at lines 550-565 was updated and the
new `feat-57` test at lines 123-134 covers it, but the duplicate assertion in a separate `describe`
block was missed and still expects `'medium'`:

```
test('haiku tier -> gpt-5.4-mini with reasoning_effort medium', () => {
  writeConfig(tmpDir, { runtime: 'codex', model_profile: 'budget' });
  assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-codebase-mapper'), 'gpt-5.4-mini');
  assert.strictEqual(resolveReasoningEffortInternal(tmpDir, 'gsd-codebase-mapper'), 'medium'); // now null
});
```

Confirmed failing:
```
✖ haiku tier -> gpt-5.4-mini with reasoning_effort medium
  null !== 'medium'  (tests/issue-2517-runtime-aware-profiles.test.cjs:178)
# tests 97 # pass 96 # fail 1
```

CLAUDE.md requires `npm test` to pass on every commit. A known-RED suite is a ship blocker.

**Fix:** Update the assertion to the intended Phase 57 behavior and rename the test:
```javascript
test('haiku tier -> gpt-5.4-mini with NO reasoning_effort (Phase 57 D-03)', () => {
  writeConfig(tmpDir, { runtime: 'codex', model_profile: 'budget' });
  assert.strictEqual(resolveModelInternal(tmpDir, 'gsd-codebase-mapper'), 'gpt-5.4-mini');
  assert.strictEqual(resolveReasoningEffortInternal(tmpDir, 'gsd-codebase-mapper'), null);
});
```

## Warnings

### WR-01: `resolveEffort()` ignores `~/.gsd/defaults.json`, diverging from `resolve()` precedence

**File:** `bin/install.js:1462-1518`; `get-shit-done/bin/lib/core.cjs:280, 515, 529-550`
**Issue:** The resolver computes the model via `resolve()`, which uses `merged` (install.js:1482-1495)
blending per-project config with `homeDefaults`. The new `resolveEffort()` instead delegates to
`gsdResolveReasoningEffort(probedProjectDir, agentName)` → `core.loadConfig(probedProjectDir)`.

Two structural facts make these paths diverge:
1. `resolveEffort` only fires when `probedProjectDir` is set, which requires a `.planning/config.json`
   to exist (install.js:1466-1469). So `core.loadConfig` always reads the project config's try-branch
   and never reaches the home-defaults fallback (only reached when `.planning/` is absent, core.cjs:515).
2. Even when the home-defaults fallback *is* reached, it omits `runtime` entirely (core.cjs:529-550 has
   no `runtime:` field), so `resolveReasoningEffortInternal`'s gate (core.cjs:1634) returns null.

Consequence for a user who configures GSD globally (home defaults) but not per-project: `resolve()`
emits a Codex model line (home-merged), while `resolveEffort()` returns null (no project config, or
project config lacks runtime/overrides), so `model_reasoning_effort` is silently omitted or wrong.

**Fix:** Thread the resolver's already-computed `merged` runtime/overrides into the effort path so it
honors the same precedence as `resolve()`, or narrow the resolver's doc contract and add a test
documenting that home-only config does not produce effort. Minimal version:
```js
resolveEffort(agentName) {
  if (!merged.runtime || !probedProjectDir) return null;
  return gsdResolveReasoningEffort(probedProjectDir, agentName /*, { runtime: merged.runtime, modelOverrides: merged.model_overrides } */);
}
```

### WR-02: `?? resolveEffort(agentName)` collapses an intentional haiku `null` and double-loads config

**File:** `bin/install.js:2763-2765`
**Issue:** `gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(resolvedName) ?? runtimeResolver.resolveEffort(agentName))`.
For a haiku-tier agent the first call correctly returns `null` (intended omit). Because `??` treats
`null` as "absent," it then probes `resolveEffort(agentName)` a second time. When `resolvedName !==
agentName` (frontmatter `name` differs from the file-derived `agentName`), the second lookup can
resolve a *different* slot and produce a non-null effort, emitting `model_reasoning_effort` for an
agent whose primary slot is haiku — contradicting D-03. Each call also re-enters `core.loadConfig`
(disk read), so this is a redundant config load per agent.

**Fix:** Resolve once against the canonical name and do not fall back on a meaningful `null`:
```js
const effortName = runtimeResolver.resolve(resolvedName) ? resolvedName : agentName;
const codexEffort = gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(effortName));
```
This keeps model and effort lines sourced from the same agent name and never treats an intentional
haiku `null` as a reason to probe a second slot.

### WR-03: Effort emit decoupled from model emit — no invariant ties the two TOML lines together

**File:** `bin/install.js:2747-2769`
**Issue:** Before Phase 57, `model_reasoning_effort` was emitted only inside the `else if
(runtimeResolver)` branch, so a per-agent `modelOverrides[agent]` model produced no effort line. The
new effort block (2762-2768) runs unconditionally, gated only on `runtimeResolver.runtime === 'codex'`,
outside the `if (modelOverride) ... else if (runtimeResolver)` chain. It happens to be consistent
today because `resolveReasoningEffortInternal` step-1 reads the same `model_overrides[agent]`
(core.cjs:1640), but the model line (raw override string) and the effort line (`parseModelEffort` of
the same override) are computed via independent code paths with no asserted invariant. A future change
to either path could emit a model line with a mismatched or missing effort.

**Fix:** Compute model and effort from a single resolved slot, or gate the effort emit on the same
branch that produced the model line:
```js
let modelEmitted = false;
// set modelEmitted = true in each branch that pushes a `model = ...` line
if (modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex') { /* emit */ }
```

## Info

### IN-01: Stale doc-comment lists haiku effort as "medium"

**File:** `tests/issue-2517-runtime-aware-profiles.test.cjs:11`
**Issue:** The file header still documents `haiku -> gpt-5.4-mini (medium)`, contradicting the Phase 57
haiku-omit behavior.
**Fix:** Update to `haiku -> gpt-5.4-mini (no reasoning_effort)`.

### IN-02: Stale `resolve()` contract comment after the effort seam moved

**File:** `bin/install.js:2751` (and resolver JSDoc near 1449)
**Issue:** The comment at 2751 still advertises that `resolve()` embeds "Codex-native model +
reasoning_effort," but Phase 57 removed the `entry.reasoning_effort` emit from the `resolve()` path
(now only `entry.model` is used, 2754-2756) and routed effort exclusively through `resolveEffort()`.
The JSDoc return shape near 1449 also omits the new `resolveEffort(agentName)` sibling. The lingering
comment misdescribes the data flow and may lead a future editor to re-add the removed line.
**Fix:** Trim the 2751 comment to "Embeds Codex-native model from RUNTIME_PROFILE_MAP" and document
`resolveEffort(agentName) -> string|null (Claude-form; translated at TOML boundary)` in the JSDoc.

---

_Reviewed: 2026-06-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
