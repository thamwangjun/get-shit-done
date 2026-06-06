---
phase: 53-unified-effort-resolver
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - get-shit-done/bin/lib/core.cjs
  - get-shit-done/bin/lib/model-catalog.cjs
  - tests/feat-3023-model-phase-types.test.cjs
  - tests/issue-2517-runtime-aware-profiles.test.cjs
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 53: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the unified effort-resolver work: the runtime-aware model/effort
resolution chain in `core.cjs` (`resolveModelInternal`,
`resolveReasoningEffortInternal`, `_resolveAgentSlot`, `resolveTierEntry`,
`parseModelEffort`), the catalog-derived constant tables in `model-catalog.cjs`,
and the two feature test suites. All 108 tests pass.

The implementation is well-tested and the precedence chain is internally
consistent. No correctness-breaking bugs or security vulnerabilities were
found. The findings below concern resolver robustness, an unguarded `.length`
in a formatting helper, a dual source-of-truth for `VALID_PHASE_TYPES`, and a
validation gap where the `models.<phase_type>` slot is silently parsed but never
warned about for unknown values.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `models.<phase_type>` slot accepts unknown tier values silently (no warn)

**File:** `get-shit-done/bin/lib/core.cjs:1366-1380`
**Issue:** `_resolveAgentSlot` validates `phaseTypeTier` against
`VALID_TIERS = {opus, sonnet, haiku, inherit}` and silently falls through to the
profile tier when the value is invalid (e.g. `models: { research: 'haiku3' }` or
a full ID `'openai/gpt-5'`). The tests at lines 184-209 of
`feat-3023-model-phase-types.test.cjs` confirm the fall-through, but unlike the
`runtime`/`model_profile_overrides` paths (which emit a one-shot stderr warning
via `_warnUnknownProfileOverrides`) and the `;effort` suffix path (which warns
via `parseModelEffort`), an invalid `models.<phase_type>` value produces **no
diagnostic at all**. A user who typos `haiku3` gets the profile default with no
indication their override was ignored — the exact silent-misconfiguration class
the runtime/effort warning gates were added to prevent.
**Fix:** Emit a one-shot stderr warning in `_resolveAgentSlot` (or in
`loadConfig` alongside `_warnUnknownProfileOverrides`) when a `models.<slot>`
base alias is non-empty and not in `VALID_TIERS`:
```js
if (phaseTypeTier && !phaseTypeTierValid && !_warnedConfigKeys.has(key)) {
  _warnedConfigKeys.add(key);
  process.stderr.write(
    `gsd: warning — models.${phaseType} has unrecognized tier "${phaseTypeTier}". ` +
    `Allowed: opus, sonnet, haiku, inherit. Falling back to profile. (#3023)\n`);
}
```

### WR-02: `formatAgentToModelMapAsTable` assumes every map value is a string

**File:** `get-shit-done/bin/lib/model-catalog.cjs:101-111`
**Issue:** `Math.max('Model'.length, ...Object.values(agentToModelMap).map((m) => m.length))`
and `m.padEnd(...)` call `.length` / `.padEnd` directly on each value. If any
value is `undefined` (e.g. an alias that maps to `undefined` through
`MODEL_ALIAS_MAP` when a catalog `entry?.model` is missing — see IN-02) or any
non-string, this throws `TypeError: Cannot read properties of undefined`. The
function is a display helper, so a crash here degrades a diagnostic surface
rather than core resolution, but it is an unguarded assumption on
externally-derived (catalog JSON) data.
**Fix:** Coerce values before measuring/padding:
```js
const val = (m) => String(m ?? '');
const modelWidth = Math.max('Model'.length, ...Object.values(agentToModelMap).map((m) => val(m).length));
// ...
out += ` ${agent.padEnd(agentWidth)} │ ${val(model).padEnd(modelWidth)}\n`;
```

### WR-03: `VALID_PHASE_TYPES` has two independent definitions that can drift

**File:** `get-shit-done/bin/lib/model-catalog.cjs:51` and `get-shit-done/bin/lib/core.cjs:9`
**Issue:** `model-catalog.cjs:51` defines and exports
`VALID_PHASE_TYPES = new Set(catalog.phaseTypes)`, but `core.cjs:9` imports
`VALID_PHASE_TYPES` from `model-profiles.cjs` instead, and the test suite
(`feat-3023-model-phase-types.test.cjs:33`) also imports it from
`model-profiles.cjs`. Two modules each materialize their own `VALID_PHASE_TYPES`
Set. They currently agree (both derive from the same catalog — verified at
review time), but the catalog-export copy in `model-catalog.cjs` is dead weight
that no in-repo consumer reads, and the parallel definition invites drift if a
future edit touches one derivation path and not the other. A structural pass for
unused exports should flag `VALID_PHASE_TYPES` from `model-catalog.cjs`.
**Fix:** Make `model-profiles.cjs` re-export `VALID_PHASE_TYPES` from
`model-catalog.cjs` (single derivation), or remove the unused export from
`model-catalog.cjs` so there is exactly one source of truth.

### WR-04: `resolveModelInternal` and `resolveReasoningEffortInternal` load config twice per call

**File:** `get-shit-done/bin/lib/core.cjs:1383,1405` and `:1566,1585`
**Issue:** `resolveModelInternal` calls `loadConfig(cwd)` at line 1383, then
calls `_resolveAgentSlot(cwd, agentType)` (line 1405) which calls `loadConfig(cwd)`
*again* (line 1353). `resolveReasoningEffortInternal` does the same (line 1566 +
1585). Beyond the redundant disk read, `loadConfig` performs legacy-key
normalization with a `platformWriteSync` writeback when `configDirty` is true
(core.cjs:378-380) and a one-shot unknown-key stderr warning. Running it twice
per resolution means migration writeback and warning-dedup logic execute on a
config object that may already have been mutated/persisted by the first call —
correctness here relies entirely on the dedup `Set` and idempotent migration.
This is fragile coupling rather than a proven defect, but it is an avoidable
double-execution of side-effecting code on the hot path.
**Fix:** Thread the already-loaded `config` into a config-taking variant of the
slot resolver:
```js
function _resolveAgentSlotFromConfig(config, agentType) { /* same body, no loadConfig */ }
// resolveModelInternal:
const config = loadConfig(cwd);
const tier = _resolveAgentSlotFromConfig(config, agentType);
```
Keep `_resolveAgentSlot(cwd, agentType)` as a thin wrapper for existing callers/tests.

## Info

### IN-01: `resolveModelInternal` step-5 unmapped-agent fallback ignores `adaptive` profile

**File:** `get-shit-done/bin/lib/core.cjs:1431-1436`
**Issue:** When `agentModels` is undefined (agent not in `MODEL_PROFILES`), the
fallback maps `quality→opus`, `budget→haiku`, `inherit→inherit`, else `sonnet`.
A `model_profile: 'adaptive'` config hits the `else` branch and silently yields
`'sonnet'`. For mapped agents `adaptive` resolves via `agentModels.adaptive`, so
this only affects unknown agent names — a low-likelihood path — but the omission
is asymmetric with the mapped path.
**Fix:** Either document the unmapped-`adaptive`→`sonnet` behavior inline, or add
an explicit `adaptive` arm mirroring the mapped default tier.

### IN-02: `MODEL_ALIAS_MAP` silently produces `undefined` values for entries lacking `model`

**File:** `get-shit-done/bin/lib/model-catalog.cjs:71-73`
**Issue:** `Object.fromEntries(... [tier, entry?.model])` yields `tier → undefined`
when a `runtimeTierDefaults.claude` entry has no `model` field. Downstream
`resolveModelInternal:1448` (`MODEL_ALIAS_MAP[alias] || alias`) absorbs this
safely, but the table itself carries `undefined` values that WR-02's formatter
would crash on. A defensive filter keeps the table well-formed.
**Fix:** Filter empty entries: `.filter(([, entry]) => entry?.model)` before
`fromEntries`, matching the pattern already used for `RUNTIME_PROFILE_MAP`
(lines 80-83).

### IN-03: Three separate tier-validation surfaces with inconsistent warn behavior

**File:** `get-shit-done/bin/lib/core.cjs:1156-1206`
**Issue:** The override-tier warning gate is keyed to
`RUNTIME_OVERRIDE_TIERS = {opus, sonnet, haiku}` and excludes `inherit`. This is
correct for `model_profile_overrides`, but the project now has three separate
validation surfaces for tier-like values (override tiers here, `models.<slot>` in
`_resolveAgentSlot`, `;effort` suffixes in `parseModelEffort`) with inconsistent
warning behavior — see WR-01. Noting for maintainability; consolidation would
reduce the divergence-class risk this phase set out to eliminate.
**Fix:** Track as tech-debt; consider a single `validateTierValue(value, context)`
helper feeding all three sites.

### IN-04: Effort/config warning caches are process-global with no production reset

**File:** `get-shit-done/bin/lib/core.cjs:1225,1254-1255,1269-1271`
**Issue:** `_warnedEffortLabels` and `_warnedConfigKeys` are module-level Sets
that grow for the process lifetime and are only cleared by the `_reset*ForTests`
helpers. For the short-lived CLI process this is fine, but if `core.cjs` is ever
required by a long-running host (e.g. the SDK `session-runner`), distinct
malformed labels accumulate without bound. Low risk given current usage; flagged
for awareness.
**Fix:** No action required for CLI use. If embedded in a long-running host,
bound the Set size or key on a normalized form.

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
