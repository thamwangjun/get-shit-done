# Phase 52: Parser Foundation - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 5 (2 modified, 3 created)
**Analogs found:** 5 / 5 (all in-codebase, exact or near-exact)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `get-shit-done/bin/lib/core.cjs` (`parseModelEffort`, NEW) | utility (pure parser + warn side channel) | transform | `_warnUnknownProfileOverrides` + `_warnedConfigKeys` (`core.cjs:1153-1212`) | exact (same warn-once pattern, same module) |
| `get-shit-done/bin/lib/core.cjs` (`_resolveAgentSlot`, NEW) | utility (tier-resolution extraction) | transform | tier block inside `resolveModelInternal` (`core.cjs:1285-1307`) + duplicate in `resolveReasoningEffortInternal` (`core.cjs:1484-1500`) | exact (this IS the code being extracted) |
| `get-shit-done/bin/lib/core.cjs` (`resolveModelInternal` refactor) | utility (resolver) | transform | itself (`core.cjs:1267-1354`) | exact (pure extraction, contract preserved) |
| `sdk/src/model-catalog.ts` (`parseModelEffort` mirror, NEW) | utility (TS parser mirror) | transform | existing exported helpers `getAgentToModelMapForProfile` / `resolveRuntimeTierDefault` (`model-catalog.ts:51-70`) | exact (same export style, same module) |
| `tests/fixtures/parse-model-effort.json` (NEW) | test fixture | file-I/O | `sdk/shared/model-catalog.json` (read by both runners) + `tests/fixtures/*` precedent | exact (cross-runner fixture pattern proven) |
| `tests/parse-model-effort.test.cjs` (NEW) | test (node --test) | request-response | `tests/feat-3023-model-phase-types.test.cjs` | exact (same resolver-test conventions) |
| `sdk/src/parse-model-effort.test.ts` (NEW) | test (vitest) | request-response | `sdk/src/config.test.ts` | exact (vitest import + describe/it/expect style) |

## Pattern Assignments

### `parseModelEffort` in `core.cjs` (utility, transform)

**Analog:** `_warnUnknownProfileOverrides` + `_warnedConfigKeys` Set (`core.cjs:1153-1212`)

**Placement:** module-level function near `resolveTierEntry` (`core.cjs:~1236`), in the `// ─── Model alias resolution ───` section.

**Warn-once pattern to mirror** (`core.cjs:1153-1170`):
```js
const _warnedConfigKeys = new Set();
// ...
if (!_warnedConfigKeys.has(key)) {
  _warnedConfigKeys.add(key);
  try {
    process.stderr.write(
      `gsd: warning — config key "runtime" has unknown value "${runtime}". ...\n`
    );
  } catch { /* stderr might be closed in some test harnesses */ }
}
```
Copy exactly: a module-level `const _warnedEffortLabels = new Set();`, gate `if (!_warnedEffortLabels.has(label))`, add before writing, wrap `process.stderr.write` in `try { } catch { /* stderr might be closed in some test harnesses */ }`. Match the `gsd: warning — ` prefix style (Claude's discretion on exact text per RESEARCH lines 23, 144).

**Test-reset helper to mirror** (`core.cjs:1208-1212`):
```js
function _resetRuntimeWarningCacheForTests() {
  _warnedConfigKeys.clear();
}
```
Either clear `_warnedEffortLabels` from this existing helper, or add a parallel `_resetEffortWarningCacheForTests()` and export it (RESEARCH A3 says both acceptable). Tests need deterministic state to assert "warns once."

**Canonical algorithm** (RESEARCH lines 213-236 — `lastIndexOf(';')`, allowlist `{low,medium,high,xhigh,max}`, typo → base + null + warn, no `;` → `{label, null}`). Do NOT use greedy `split(';')` (anti-pattern, RESEARCH 154).

**Export:** add `parseModelEffort` to the `module.exports` block (`core.cjs:1875-1899`), next to `resolveModelInternal`, `resolveReasoningEffortInternal`, `resolveTierEntry`, `_resetRuntimeWarningCacheForTests`.

---

### `_resolveAgentSlot(cwd, agentType)` in `core.cjs` (utility, transform)

**Analog:** the tier-computation block in `resolveModelInternal` (`core.cjs:1285-1307`).

**Block to extract** (`core.cjs:1285-1307`):
```js
const profile = String(config.model_profile || 'balanced').toLowerCase();
const agentModels = MODEL_PROFILES[agentType];
const phaseType = AGENT_TO_PHASE_TYPE[agentType];
const phaseTypeTier = (phaseType && config.models && typeof config.models === 'object')
  ? config.models[phaseType]
  : undefined;
const VALID_TIERS = new Set(['opus', 'sonnet', 'haiku', 'inherit']);
const tier = (phaseTypeTier && VALID_TIERS.has(phaseTypeTier))
  ? phaseTypeTier
  : (profile === 'inherit'
    ? 'inherit'
    : (agentModels ? (agentModels[profile] || agentModels['balanced']) : null));
```

**Critical reconciliation subtlety** (RESEARCH 149-151): the duplicate block in `resolveReasoningEffortInternal` (`core.cjs:1484-1500`) differs — its `VALID_TIERS` is `{opus, sonnet, haiku}` (no `inherit`) and it short-circuits `null` on `phaseTypeTier === 'inherit'` (1492). `_resolveAgentSlot` must return the SAME tier `resolveModelInternal` computes today (the `{opus,sonnet,haiku,inherit}` set, with the `inherit` synthesis at 1305 intact). Phase 53 layers its `inherit`-opt-out on top — do NOT bake the effort-resolver's `inherit`→null behavior into the shared helper.

**Return value** (RESEARCH 272, Open Q1 / A1): return the raw tier/slot string BEFORE alias-map expansion (the value as read from `config.models[phaseType]` / `MODEL_PROFILES[agent][profile]`), so a `;effort` suffix survives for Phase 53 to read off it.

**Imports note** (RESEARCH Pitfall 3, `core.cjs:9`): `MODEL_PROFILES` and `AGENT_TO_PHASE_TYPE` are imported from `./model-profiles.cjs`, not local. The extracted helper uses the already-imported symbols.

---

### `resolveModelInternal` refactor in `core.cjs` (utility, resolver)

**Analog:** itself (`core.cjs:1267-1354`). Pure extraction — every branch must produce byte-identical output for bare configs (RESEARCH Pitfall 2).

**Per-agent override path** (`core.cjs:1272-1275`) becomes (RESEARCH 263-267):
```js
const override = config.model_overrides?.[agentType];
if (override) {
  return parseModelEffort(override).model;   // ".model" === verbatim for bare IDs (no ';')
}
```

**Tier-source path:** replace lines 1285-1307 with a call to `_resolveAgentSlot(cwd, agentType)` (or pass `config`/derived values — Claude's discretion on internal structure, RESEARCH 24). Leave steps 3-5 (`_resolveRuntimeTier` runtime resolution `1318-1323`, `resolve_model_ids: 'omit'` early return `1328-1330`, profile lookup + alias-map `1332-1353`) UNCHANGED. The cleanest extraction returns the computed `tier`; `parseModelEffort` runs on the override now and (P53) on the slot.

**Branches that must NOT drift** (RESEARCH 157, 192): `#2517` runtime resolution, `#3023`/`#3030` phase-type precedence + `inherit` synthesis (1303-1307, 1341), `resolve_model_ids: 'omit'` (1328), `MODEL_ALIAS_MAP` expansion (1350). Gate a golden snapshot (see test pattern) proving identity.

---

### `parseModelEffort` mirror in `sdk/src/model-catalog.ts` (utility, transform)

**Analog:** existing exported helpers in same file (`model-catalog.ts:51-70`), e.g. `getAgentToModelMapForProfile`, `resolveRuntimeTierDefault`, `runtimesWithReasoningEffort`.

**Export style to match** (`model-catalog.ts:60-62`):
```ts
export function resolveRuntimeTierDefault(runtime: string, alias: 'opus' | 'sonnet' | 'haiku'): RuntimeTierEntry | null {
  return catalog.runtimeTierDefaults[runtime]?.[alias] ?? null;
}
```
Add `export function parseModelEffort(label: string): { model: string; effort: string | null }` alongside these. Reimplement the CJS algorithm verbatim (RESEARCH 240-258). Use a module-level `const _warnedEffortLabels = new Set<string>();` and the SAME `process.stderr.write` warn (warnings are a side channel, not part of the returned `{model, effort}` shape — parity tests compare only the returned shape, RESEARCH 155).

**Note:** vitest runs TS source directly, so no `sdk/dist/` rebuild blocks Phase 52 tests (RESEARCH 179).

---

### `tests/fixtures/parse-model-effort.json` (test fixture, file-I/O)

**Analog:** `sdk/shared/model-catalog.json` — proven readable from BOTH `node --test` (`tests/bug-3288-model-catalog-install-path.test.cjs`) and vitest (`sdk/src/model-catalog.ts:27`). `tests/fixtures/` already exists (e.g. `config-schema.manifest.json`).

**Shape** (DECISION 4 / RESEARCH 44, 124): array of `{ input, expectedModel, expectedEffort }`.

**Required cases** (CONTEXT 48 / RESEARCH 18): bare model; `opus;high`; every valid effort token (`low`, `medium`, `high`, `xhigh`, `max`); provider-colon ID `openrouter:anthropic/claude-opus` → unchanged + `effort: null`; typo `opus;hihg` → `{opus, null}`.

**Location decision** (RESEARCH Pitfall 5 / A2 / Open Q2): try `tests/fixtures/parse-model-effort.json`, read from `sdk/src/parse-model-effort.test.ts` via `path.resolve(__dirname, '../../tests/fixtures/parse-model-effort.json')`. If vitest config excludes paths outside `sdk/`, fall back to `sdk/shared/` (proven). Planner must verify both runners load it.

---

### `tests/parse-model-effort.test.cjs` (test, node --test)

**Analog:** `tests/feat-3023-model-phase-types.test.cjs`

**Header + imports pattern** (`feat-3023:19-40`):
```js
'use strict';
process.env.GSD_TEST_MODE = '1';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { resolveModelInternal /*, parseModelEffort, _resolveAgentSlot, _reset... */ }
  = require('../get-shit-done/bin/lib/core.cjs');
const { AGENT_TO_PHASE_TYPE, MODEL_PROFILES }
  = require('../get-shit-done/bin/lib/model-profiles.cjs');
const { createTempDir } = require('./helpers.cjs');
```
Import `parseModelEffort` / `_resolveAgentSlot` / the warn-reset helper from `core.cjs`; import `MODEL_PROFILES` / `AGENT_TO_PHASE_TYPE` from `model-profiles.cjs` (Pitfall 3).

**Temp-project + config seeding** (`feat-3023:42-50`): reuse `createTempDir` from `helpers.cjs`; `writeConfig` writes `.planning/config.json`.

**Assertion style** (RESEARCH Pitfall 4): `assert.deepStrictEqual(parseModelEffort('opus;high'), { model: 'opus', effort: 'high' })` and `assert.strictEqual(result.effort, null)`. Do NOT use `indexOf` truthiness or `includes` substring checks.

**Golden snapshot** (PARSE-03, RESEARCH 194, 337): pre-change snapshot of `resolveModelInternal` output for every agent in `MODEL_PROFILES` across profiles `quality`/`balanced`/`budget`/`inherit` and representative configs (`resolve_model_ids: omit`, non-claude `runtime`, `models.<phaseType>` override); assert byte-identical after refactor.

**Warn-once test:** call the reset helper in `beforeEach`, then assert the typo path warns exactly once.

---

### `sdk/src/parse-model-effort.test.ts` (test, vitest)

**Analog:** `sdk/src/config.test.ts`

**Import + structure pattern** (`config.test.ts:1-7`):
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseModelEffort } from './model-catalog.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
```
Load the SAME shared fixture, iterate cases, assert with `expect(parseModelEffort(c.input)).toEqual({ model: c.expectedModel, effort: c.expectedEffort })`. This is the PARSE-04 parity check (RESEARCH 338).

## Shared Patterns

### One-time warn side channel
**Source:** `core.cjs:1153-1212` (`_warnedConfigKeys` Set + `_warnUnknownProfileOverrides` + `_resetRuntimeWarningCacheForTests`)
**Apply to:** `parseModelEffort` in BOTH `core.cjs` and `sdk/src/model-catalog.ts` (identical semantics; warning is a side channel, not in the returned shape).
```js
if (!_warnedEffortLabels.has(label)) {
  _warnedEffortLabels.add(label);
  try { process.stderr.write(`gsd: warning — ...\n`); }
  catch { /* stderr might be closed in some test harnesses */ }
}
```

### Module exports placement
**Source:** `core.cjs:1875-1899` exports block
**Apply to:** add `parseModelEffort` (and `_resolveAgentSlot` if test-exposed) next to `resolveModelInternal`, `resolveReasoningEffortInternal`, `resolveTierEntry`, `_resetRuntimeWarningCacheForTests`.

### Cross-runner JSON fixture
**Source:** `sdk/shared/model-catalog.json` read by `sdk/src/model-catalog.ts:27` (`new URL('../shared/...', import.meta.url)`) AND by `tests/bug-3288-model-catalog-install-path.test.cjs`.
**Apply to:** `tests/fixtures/parse-model-effort.json` — single source of parity cases (DECISION 4).

### Imported profile maps (not local)
**Source:** `core.cjs:9` — `const { MODEL_PROFILES, AGENT_TO_PHASE_TYPE, ... } = require('./model-profiles.cjs')`
**Apply to:** `_resolveAgentSlot` and all tests use the imported symbols; tests import them from `model-profiles.cjs`, resolvers/parser from `core.cjs`.

### Deep-equality assertions (avoid substring false-pass)
**Source:** `feat-3023` structural-assertion convention (RESEARCH Pitfall 4)
**Apply to:** all new parser tests — `assert.deepStrictEqual` / `expect(...).toEqual(...)` on `{model, effort}`; never `indexOf`/`includes`.

## No Analog Found

None. Every Phase 52 file has a direct in-codebase analog (the phase is a surgical refactor + mirror of existing patterns, not greenfield).

## Metadata

**Analog search scope:** `get-shit-done/bin/lib/core.cjs`, `get-shit-done/bin/lib/model-profiles.cjs`, `sdk/src/model-catalog.ts`, `sdk/src/config.test.ts`, `tests/feat-3023-model-phase-types.test.cjs`, `tests/fixtures/`, `sdk/shared/`
**Files scanned:** 7 source/test files + 2 fixture directories
**Pattern extraction date:** 2026-05-31
