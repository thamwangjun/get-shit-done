# Phase 54: SDK & Tools JSON Exposure - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 8 (3 CLI lib, 3 SDK src, 2 test)
**Analogs found:** 8 / 8 (all in-file or sibling analogs — this is an additive-exposure phase, every target already has an established same-file pattern)

## File Classification

| Target File | Role | Data Flow | Closest Analog | Match Quality |
|-------------|------|-----------|----------------|---------------|
| `get-shit-done/bin/lib/init.cjs` | utility (init builders) | transform (config→JSON) | self — existing `*_model` lines (197-198 etc.) + `core.cjs` resolver | exact (in-file) |
| `get-shit-done/bin/lib/commands.cjs` `cmdResolveModel` | CLI handler | request-response | self — current `reasoning_effort` emit (commands.cjs:244,250) | exact (in-file) |
| `sdk/src/query/config-query.ts` `resolveModel` | SDK query handler | request-response | `core.cjs:1596-1635` `resolveReasoningEffortInternal` (port target) | role-match (cross-language port) |
| `sdk/src/query/` init handler (`handlers/init/composer.ts` + `complex.ts`) | SDK handler | transform | `composer.ts:43-47` `getModelAlias` + `:448-450` builder | exact (in-file) |
| `sdk/src/model-catalog.ts` | SDK config/utility | transform | `:64-70` `runtimesWithReasoningEffort` + `:82` `EFFORT_TOKENS` | exact (in-file) |
| `sdk/src/golden/read-only-golden-rows.ts` + `read-only-parity.integration.test.ts` | test (parity) | request-response | `read-only-golden-rows.ts:21` resolve-model row; `:45` init.list-workspaces row | exact (in-file) |
| `sdk/src/golden/init-golden-normalize.ts` | test helper | transform | `:7-15` `INIT_QUICK_VOLATILE_KEYS` / `omitInitQuickVolatile` | exact (in-file) |
| `tests/init.test.cjs` + `tests/commands.test.cjs` | test (unit) | request-response | `init.test.cjs:36-51`; `commands.test.cjs:1138-1187` | exact (in-file) |

## Pattern Assignments

### `get-shit-done/bin/lib/init.cjs` (utility, transform) — EXPOSE-01 / D-06

**Analog:** the existing `*_model` lines in every builder; resolver from `core.cjs`.

**Import pattern to extend** (line 8): `resolveModelInternal` is already imported from `./core.cjs`; **add `resolveReasoningEffortInternal` to the same destructure**.
```js
// CURRENT (init.cjs:8 — single destructured require from ./core.cjs):
const { loadConfig, resolveModelInternal, findPhaseInternal, /* ... */ } = require('./core.cjs');
// ADD resolveReasoningEffortInternal to this list (function is exported from core.cjs — verified).
```

**Sibling pattern** (analog: init.cjs:195-198, the execute-phase builder):
```js
// CURRENT (init.cjs:195-198):
const result = {
  // Models
  executor_model: resolveModelInternal(cwd, 'gsd-executor'),
  verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),
// AFTER (D-06 blanket coverage — same agent string as the adjacent *_model):
  executor_model:  resolveModelInternal(cwd, 'gsd-executor'),
  executor_effort: resolveReasoningEffortInternal(cwd, 'gsd-executor') ?? null,
  verifier_model:  resolveModelInternal(cwd, 'gsd-verifier'),
  verifier_effort: resolveReasoningEffortInternal(cwd, 'gsd-verifier') ?? null,
```

**Apply identically at all 21 sites** (RESEARCH.md inventory table is canonical — agent arg of each sibling = agent arg of the adjacent `resolveModelInternal`):
- 197-198, 343-345, 530-532, 583-585, 640-643, 762-763, 1096, 1552-1553.

**Same-slot invariant (Pitfall 2 / #3023):** the sibling's second arg MUST equal the adjacent `*_model`'s second arg. Derive mechanically; never invent an agent slot.

---

### `get-shit-done/bin/lib/commands.cjs` `cmdResolveModel` (CLI handler, request-response) — EXPOSE-02 / D-03/D-04/D-05

**Analog:** self — the function already resolves effort (line 244) and conditionally emits it (line 250). One line flips.
```js
// CURRENT (commands.cjs:243-251):
const model = resolveModelInternal(cwd, agentType);
const reasoningEffort = resolveReasoningEffortInternal(cwd, agentType);
const agentModels = MODEL_PROFILES[agentType];
const result = agentModels
  ? { model, profile }
  : { model, profile, unknown_agent: true };
if (reasoningEffort) result.reasoning_effort = reasoningEffort;   // <-- omit-when-falsy
output(result, raw, model);
// AFTER (D-03 always-emit + D-04/D-05 rename to `effort`):
result.effort = reasoningEffort ?? null;                          // always present, canonical name
```
`resolveReasoningEffortInternal` is already in scope (line 244 call) — no new import. Do NOT keep `reasoning_effort` alongside `effort` (D-05: one canonical name, no alias).

---

### `sdk/src/query/config-query.ts` `resolveModel` (SDK query handler, request-response) — EXPOSE-03 / D-07

**Port target (CLI canonical):** `core.cjs:1596-1635` `resolveReasoningEffortInternal` — the precedence chain to mirror:
1. allowlist gate (`!config.runtime || !RUNTIMES_WITH_REASONING_EFFORT.has(runtime)` → `null`)
2. per-agent override → `parseModelEffort(override).effort`
3. shared slot effort → `parseModelEffort(tier).effort`
4. Codex per-tier fallback → `_resolveRuntimeTier(config, bareTier).reasoning_effort`

**Current SDK shape** (config-query.ts:280-287) only emits effort from the Codex `runtimeTier` branch and uses the OLD field name:
```ts
// CURRENT (config-query.ts:281-287):
if (runtimeTier?.model) {
  const result: Record<string, unknown> = { model: runtimeTier.model, profile };
  if (runtimeTier.reasoning_effort) {
    result.reasoning_effort = runtimeTier.reasoning_effort;   // OLD name, conditional
  }
  return { data: result };
}
```
**Port requirements:**
- Mirror all 4 precedence steps (not just the runtimeTier branch) so a bare catalog and every override path resolve identically to the CLI.
- Emit `effort` always-present (`?? null`), matching D-03/D-04 — rename away from `reasoning_effort`.
- The allowlist gate at line 208-210 currently calls the data-derived set (Pitfall 1) — see model-catalog.ts below; reconcile to the static `{claude, codex}` set so parity holds after Phase 55 assigns efforts.
- Building blocks already present: `parseModelEffort` (model-catalog.ts:89), `resolveRuntimeTier` (config-query.ts:195), `resolveRuntimeTierDefault` (model-catalog.ts:60).

---

### `sdk/src/query/` init handler — `handlers/init/composer.ts` + `complex.ts` (SDK handler, transform) — EXPOSE-03 / D-07

**Analog:** `composer.ts:43-47` `getModelAlias` helper + the builder object at `composer.ts:448-450`.
```ts
// CURRENT helper (composer.ts:43-47):
async function getModelAlias(agentType: string, projectDir: string): Promise<string> {
  const result = await resolveModel([agentType], projectDir);
  const data = result.data as Record<string, unknown>;
  return (data.model as string) || 'sonnet';
}
// CURRENT builder (composer.ts:448-450):
const result: Record<string, unknown> = {
  executor_model: executorModel,
  verifier_model: verifierModel,
```
**Pattern:** add a parallel `getEffort(agentType, projectDir)` helper that reads `data.effort` from the ported `resolveModel` result, and add a `*_effort` field next to every `*_model` in both files. Sites (RESEARCH SDK Mirror Inventory): composer.ts 449-450, 556-558, 648-650, 713-716, 788-789, 1115; complex.ts 317-319, 492-493. Same-slot invariant applies (same agentType as adjacent `*_model`). Once `resolveModel` emits `effort`, `getEffort` is a one-line read mirroring `getModelAlias`.

---

### `sdk/src/model-catalog.ts` (SDK config/utility, transform) — D-07 allowlist reconciliation

**Analog / anti-pattern to fix:** `:64-70` `runtimesWithReasoningEffort()` is data-derived (scans `runtimeTierDefaults`) — the exact pattern Phase 53 replaced in the CLI with the static `{claude, codex}` allowlist.
```ts
// CURRENT (model-catalog.ts:64-70) — data-derived, diverges from CLI static set:
export function runtimesWithReasoningEffort(): Set<string> {
  return new Set(
    Object.entries(catalog.runtimeTierDefaults)
      .filter(([, tiers]) => Object.values(tiers).some((entry) => entry && entry.reasoning_effort))
      .map(([runtime]) => runtime)
  );
}
```
**Reconcile to a static `{claude, codex}` set** matching the CLI's `RUNTIMES_WITH_REASONING_EFFORT` (core.cjs export). `parseModelEffort` (line 89) and `EFFORT_TOKENS` (line 82) are already CLI-mirrored — reuse them in the resolver port, do not re-implement (RESEARCH "Don't Hand-Roll"). Verify the config-query.ts:208-210 delete-guard still behaves once the set is static.

---

### Golden parity harness (test, request-response) — EXPOSE-03 / D-08

**resolve-model row — already wired (no new test code for EXPOSE-02 parity):**
```ts
// read-only-golden-rows.ts:21:
{ canonical: 'resolve-model', sdkArgs: ['gsd-planner'], cjs: 'resolve-model', cjsArgs: ['gsd-planner'] },
// read-only-parity.integration.test.ts:26 — the equality gate for every row:
expect(sdkResult.data).toEqual(gsdOutput);
```
Once both CLI and SDK emit `effort: null`, this `toEqual` enforces resolve-model parity automatically. If only one side emits, the row goes red (useful tripwire).

**NEW init-builder row (EXPOSE-01 parity — currently uncovered):** the only init row is `init.list-workspaces` (line 45), which emits no `*_model`. Add a row for an init builder that emits `*_model`/`*_effort` (e.g. `init execute-phase`-family with deterministic args), following the existing row shape. Init builders carry volatile fields — strip them via the normalize helper below.

**Normalize helper analog** (`init-golden-normalize.ts:7-15`):
```ts
export const INIT_QUICK_VOLATILE_KEYS = ['quick_id', 'timestamp', 'branch_name', 'task_dir'] as const;
export function omitInitQuickVolatile(data: Record<string, unknown>): Record<string, unknown> {
  const o = { ...data };
  for (const k of INIT_QUICK_VOLATILE_KEYS) delete o[k];
  return o;
}
```
Mirror this pattern (a `*_VOLATILE_KEYS` const + an `omit*` strip) for the new init-builder row's volatile keys before `toEqual`. D-08 fallback: a dedicated effort-parity fixture only if no init builder is deterministically invocable in-process.

---

### `tests/commands.test.cjs` — EXPOSE-02 / D-03/D-05 unit assertions

**Analog:** `commands.test.cjs:1138-1187` — three existing tests assert the OLD `reasoning_effort` field and the omit-when-falsy contract. These directly contradict D-03/D-05 and **must be updated**, not just added to:
```js
// commands.test.cjs:1150 — assert NEW canonical name + verbatim value:
assert.strictEqual(output.effort, 'xhigh');                    // was: output.reasoning_effort
// commands.test.cjs:1170,1186 — these assert ABSENCE of the field:
assert.ok(!Object.prototype.hasOwnProperty.call(output, 'reasoning_effort'));
// AFTER D-01 (always-emit): flip to assert explicit null under the new name:
assert.strictEqual(output.effort, null);
```
**New assertion pattern** (follow the existing block at :1082-1090 for JSON shape):
```js
const output = JSON.parse(result.output);
assert.ok('effort' in output, 'effort key always present (D-01)');
assert.strictEqual(output.effort, null);   // bare-catalog inertness (SC#4)
```

### `tests/init.test.cjs` — EXPOSE-01 / SC#4 unit assertions

**Analog:** `init.test.cjs:36-51` — the `executor_model` override test (config write → `runGsdTools('init execute-phase 1 --raw', ...)` → `JSON.parse` → assert field). Mirror this to assert the sibling:
```js
const output = JSON.parse(result.output);
assert.ok('executor_effort' in output, 'every *_model has a *_effort sibling (EXPOSE-01)');
assert.strictEqual(output.executor_effort, null, 'bare catalog → null (SC#4 inertness)');
```
For blanket-coverage proof, assert 1:1 pairing: for every key ending `_model`, the matching `_effort` key exists. The `'researcher_model' in output` assertions at init.test.cjs:1352-1354 are the established "field present" idiom to extend per builder.

---

## Shared Patterns

### Effort resolution (canonical resolver — reuse, do not re-implement)
**Source:** `get-shit-done/bin/lib/core.cjs:1596-1635` `resolveReasoningEffortInternal`
**Apply to:** every `init.cjs` sibling and `cmdResolveModel`. Call with the SAME agent as the adjacent `*_model`. Returns `null` on a bare catalog (verified) — the `?? null` coalesce guards only an `undefined` leak while satisfying D-01's explicit-null contract.

### Static allowlist (parity source of truth)
**Source:** `core.cjs` `RUNTIMES_WITH_REASONING_EFFORT` (static `{claude, codex}` — Phase 53 RESOLVE-01)
**Apply to:** SDK `model-catalog.ts` `runtimesWithReasoningEffort` (currently data-derived — reconcile) and the config-query.ts:208 delete-guard. Divergence here breaks parity silently after Phase 55 (Pitfall 1).

### Slot parsing (already mirrored cross-language)
**Source:** `parseModelEffort` — `core.cjs` (CLI) / `model-catalog.ts:89` (SDK), with `EFFORT_TOKENS` (model-catalog.ts:82) asserted identical to core.cjs by the parity suite.
**Apply to:** the SDK resolver port — extract effort via `parseModelEffort`, never a new parser (PARSE-04 already ported it).

### Always-emit `?? null` (D-01 explicit-null contract)
**Apply to:** `cmdResolveModel` `effort`, every `*_effort` sibling, and the SDK mirrors. Never reintroduce `if (effort)` / conditional emit on the canonical fields (anti-pattern).

### Golden `toEqual` equality gate
**Source:** `read-only-parity.integration.test.ts:26`
**Apply to:** all parity rows — strict `toEqual` of SDK `data` vs CLI stdout JSON, after stripping volatile keys.

## No Analog Found

None. Every target has an exact in-file or sibling analog. The single cross-language port (`config-query.ts` resolver ← `core.cjs` resolver) has a clear source-of-truth analog and building blocks (`parseModelEffort`, `resolveRuntimeTier`) already in place.

## Out of Scope (do not touch — confirms boundaries)

| Path | Reason |
|------|--------|
| `init.cjs:1836-1850` `cmdAgentSkills` text block | EXPOSE-02 targets the `cmdResolveModel` JSON surface ONLY; the agent-skills block is raw text with no model field to pair with (RESEARCH Pitfall 3 / Open Q1) |
| `bin/install.js:2743-2749` Codex emit | resolves its own `reasoning_effort` from catalog `runtimeTierDefaults`, independent of `cmdResolveModel` — Phase 56/57 |

## Metadata

**Analog search scope:** `get-shit-done/bin/lib/`, `sdk/src/query/`, `sdk/src/handlers/init/`, `sdk/src/golden/`, `tests/`
**Files scanned:** 9 (init.cjs, commands.cjs, core.cjs, config-query.ts, model-catalog.ts, composer.ts, read-only-golden-rows.ts, init-golden-normalize.ts, read-only-parity.integration.test.ts) + 2 test files
**Pattern extraction date:** 2026-06-02
