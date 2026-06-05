---
phase: 57-install-time-translation
reviewed: 2026-06-05T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/install.js
  - get-shit-done/bin/lib/core.cjs
  - tests/feat-57-install-translation.test.cjs
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 57: Code Review Report

**Reviewed:** 2026-06-05
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Phase 57 diff regions only: the `translateEffortForCodex` helper and the
haiku-tier exclusion in `core.cjs`, plus the Codex TOML emit-seam redirect and the new
`resolveEffort()` sibling on the install resolver in `bin/install.js`.

The `translateEffortForCodex` helper is correct and well-scoped (`max→xhigh`, pass-through,
`null`/`undefined → null`). The haiku exclusion logic in `resolveReasoningEffortInternal` is
correct and well-placed (override path and bareTier path both short-circuit before the D-08
medium floor). No Critical defects found.

The chief concern is a **config-source precedence inconsistency** between the resolver's
`resolve()` (model) and `resolveEffort()` (effort) methods: `resolve()` merges
`~/.gsd/defaults.json` home defaults with the project config, but `resolveEffort()` delegates
to `core.loadConfig`, which reads **only** `.planning/config.json` and never consults home
defaults. This means a user with `runtime`/`model_profile`/`model_overrides` set globally (not
per-project) gets a Codex model line but no — or a wrong — `model_reasoning_effort` line, even
though the function's own doc comment (lines 1430-1437) claims both paths honor the same
precedence "end-to-end."

## Warnings

### WR-01: `resolveEffort()` ignores `~/.gsd/defaults.json`, diverging from `resolve()` precedence

**File:** `bin/install.js:1515-1518` (and `2762-2764`); `get-shit-done/bin/lib/core.cjs:280` (`loadConfig`)
**Issue:** The resolver object computes the model via `resolve()`, which uses the `merged`
object (lines 1482-1495) blending per-project config with `homeDefaults` from
`~/.gsd/defaults.json`. The new `resolveEffort()` instead calls
`gsdResolveReasoningEffort(probedProjectDir, agentName)` → `core.loadConfig(probedProjectDir)`,
which reads only `<probedProjectDir>/.planning/config.json` and performs **no** home-defaults
merge (that merge lives in `config.cjs`, not in the core `loadConfig` at core.cjs:280).

Consequences for a user who configures GSD globally rather than per-project:
- `runtime`/`model_profile` only in `~/.gsd/defaults.json` → `resolve()` emits a Codex model,
  but `resolveEffort()` sees `config.runtime == null` and returns `null` at core.cjs:1634, so
  `model_reasoning_effort` is silently omitted. The two TOML lines disagree about runtime.
- `model_overrides` only in `~/.gsd/defaults.json` → effort override (e.g. `opus;max`) is
  ignored by `resolveEffort()` (core.cjs:1640 sees no override), so `xhigh` is never emitted
  even though the model line reflects the override.

The docstring at lines 1430-1437 explicitly promises both paths honor `loadConfig`'s precedence
"end-to-end," so this is a contract violation, not just a latent gap.

**Fix:** Make `resolveEffort()` consult the same merged config the resolver already computed.
Either pass the merged runtime/overrides into the core resolver, or have the core resolver
accept an injected config. Minimal version — guard on merged runtime and reuse merged state:
```js
resolveEffort(agentName) {
  if (!merged.runtime || !probedProjectDir) return null;
  // core.loadConfig reads only .planning/config.json; thread the home-merged
  // runtime + model_overrides so global-only config is honored, matching resolve().
  return gsdResolveReasoningEffort(probedProjectDir, agentName, {
    runtime: merged.runtime,
    modelOverrides: merged.model_overrides,
  });
}
```
(requires `resolveReasoningEffortInternal` to accept an optional config-override arg; or, if
that is too invasive for this phase, narrow the docstring claim and add a test asserting the
home-only-config case is unsupported.)

### WR-02: `?? resolveEffort(agentName)` second probe can re-trigger full config reload and mask intended null

**File:** `bin/install.js:2763-2765`
**Issue:** `gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(resolvedName) ?? runtimeResolver.resolveEffort(agentName))`.
For a haiku-tier agent the first call correctly returns `null` (intended omit). Because `??`
treats `null` as "absent," it then calls `resolveEffort(agentName)` a second time. When
`resolvedName !== agentName` (frontmatter `name` differs from the file-derived `agentName`),
the second lookup can resolve a *different* agent slot and produce a non-null effort, emitting a
`model_reasoning_effort` line for an agent whose primary slot is haiku — contradicting D-03.
The model line at 2750-2756 uses the same `resolve(resolvedName) || resolve(agentName)` fallback,
but for the effort path a `null` from the primary name is a *deliberate signal* (haiku omit),
not "not found," so collapsing it with `??` is semantically wrong. Each call also re-enters
`core.loadConfig` (disk read), so this is a double config load per agent.

**Fix:** Resolve once against the canonical name and do not fall back on a meaningful `null`:
```js
const effortName = runtimeResolver.resolve(resolvedName) ? resolvedName : agentName;
const codexEffort = gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(effortName));
```
This keeps the model and effort lines sourced from the *same* agent name, and never treats an
intentional haiku `null` as a reason to probe a second slot.

### WR-03: Effort emitted under runtime gate independent of whether a model line was emitted

**File:** `bin/install.js:2747-2769`
**Issue:** The effort block (2762-2769) is gated only on `runtimeResolver.runtime === 'codex'`,
decoupled from the model-emit block above it. When a `modelOverride` is present (2748-2749) the
code pushes a `model` line from the raw override string but then *also* runs `resolveEffort()`,
which derives effort from the core resolver's own override parse — generally consistent, but the
two values are computed from independent code paths (raw string vs. `parseModelEffort`). If the
override string and the core resolver ever disagree (e.g. a future override format the install
path passes through verbatim but core rejects), the TOML emits a `model` line with no matching
effort, or vice-versa, with no invariant tying them together. There is no assertion that an
effort line is only emitted alongside a model line.

**Fix:** Compute model and effort from a single resolved slot so they cannot diverge, or gate
the effort emit on the same branch that produced the model line:
```js
let modelEmitted = false;
// ... in each branch that pushes a `model = ...` line, set modelEmitted = true ...
if (modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex') {
  // emit effort
}
```

## Info

### IN-01: `resolveEffort` doc contract not reflected in the resolver's return-shape JSDoc

**File:** `bin/install.js:1449`
**Issue:** The JSDoc return shape still reads
`{ runtime, resolve(agentName) -> { model, reasoning_effort? } | null }` and does not mention
the newly added `resolveEffort(agentName)` sibling. Callers reading the contract will not learn
that effort now flows through a separate method.
**Fix:** Update the `@returns` line to document `resolveEffort(agentName) -> string|null` and
note its Claude-form output (translation happens at the TOML boundary).

### IN-02: Stale `reasoning_effort?` reference in `resolve()` contract after seam moved

**File:** `bin/install.js:1449`, `2751`
**Issue:** The comment at 2751 still advertises that `resolve()` embeds "Codex-native model +
reasoning_effort," but the Phase 57 change removed the `entry.reasoning_effort` emit from the
`resolve()` path (now only `entry.model` is used, 2754-2756) and routed effort exclusively
through `resolveEffort()`. The lingering comment misdescribes the current data flow and may lead
a future editor to re-add the removed line.
**Fix:** Trim the comment to "Embeds Codex-native model from RUNTIME_PROFILE_MAP" and point to
the dedicated effort block below for `model_reasoning_effort`.

---

_Reviewed: 2026-06-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
