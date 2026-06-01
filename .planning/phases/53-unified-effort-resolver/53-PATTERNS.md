# Phase 53: Unified Effort Resolver - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 3 modified (core.cjs, model-catalog.cjs, config.cjs) + 1 parity-confirm (sdk/src/model-catalog.ts)
**Analogs found:** 3 / 3 (all in-file; this is a rewrite mirroring a sibling function)

## File Classification

| Modified File / Function | Role | Data Flow | Closest Analog | Match Quality |
|--------------------------|------|-----------|----------------|---------------|
| `core.cjs` :: `resolveReasoningEffortInternal` (rewrite, ~1533-1583) | resolver (lib) | transform (config → `{effort\|null}`) | `resolveModelInternal` (`core.cjs:1363-1433`) | exact (sibling resolver, steps 1-2 identical) |
| `model-catalog.cjs` :: `RUNTIMES_WITH_REASONING_EFFORT` (~87-91) | config/data | transform (catalog scan → static Set) | n/a — replacing a data-derived Set with a literal | no analog (see below) |
| `config.cjs` :: three override sites | config validation | request-response (validation routing) | `_warnUnknownProfileOverrides` warn pattern (`core.cjs:1156`) | role-match (CONFIG-04 satisfied by routing through `parseModelEffort`, not a new pass) |
| `sdk/src/model-catalog.ts` | TS mirror | transform | `core.cjs` resolver (parity confirm) | scope deferred — confirm vs Phase 54 |

**Note (D-08):** This is a *rewrite to converge*, not a greenfield build. The dominant analog is the already-converged `resolveModelInternal`, which Phase 52 refactored onto `_resolveAgentSlot`. The effort resolver must mirror its steps 1-2 verbatim, then diverge only at the Codex per-tier fallback + allowlist gate.

## Pattern Assignments

### `core.cjs` :: `resolveReasoningEffortInternal` (resolver, transform — FULL REWRITE)

**Analog:** `resolveModelInternal` (`core.cjs:1363-1433`). The effort resolver mirrors steps 1-2 exactly, then layers Codex per-tier fallback (step 3) + `{claude,codex}` allowlist gate.

**Step 1 — per-agent override pattern to MIRROR** (`resolveModelInternal`, lines 1366-1374):
```javascript
  // 1. Per-agent override — always respected; highest precedence.
  // D3: run through parseModelEffort so a bare full ID (no ';') returns verbatim
  // and a 'model;effort' override returns only .model ...
  const override = config.model_overrides?.[agentType];
  if (override) {
    return parseModelEffort(override).model;
  }
```
**Effort-side adaptation (D-01/D-02):** the effort resolver returns `parseModelEffort(override).effort` instead of `.model` — but ONLY inside the `{claude,codex}` allowlist gate. This **removes the current early-`null` at the OLD `core.cjs:1545`** (`if (config.model_overrides?.[agentType]) return null;`). A bare override (no `;`) yields `effort: null` naturally.

**Step 2 — shared slot derivation to CONSUME** (`resolveModelInternal`, line 1386):
```javascript
  const tier = _resolveAgentSlot(cwd, agentType);
```
The effort resolver MUST call this identical helper (`_resolveAgentSlot`, `core.cjs:1340`) — NOT re-derive the phase-type tier. This is the #3023 guard (D-08). It eliminates the duplicated phase-type lookup block currently at the OLD `core.cjs:1563-1577`:
```javascript
  // OLD block to DELETE — re-derives phaseType/phaseTypeTier/VALID_TIERS inline:
  const phaseType = AGENT_TO_PHASE_TYPE[agentType];
  const phaseTypeTier = (phaseType && config.models && typeof config.models === 'object')
    ? config.models[phaseType] : undefined;
  if (phaseTypeTier === 'inherit') return null;
  const VALID_TIERS = new Set(['opus', 'sonnet', 'haiku']);
  const tier = (phaseTypeTier && VALID_TIERS.has(phaseTypeTier)) ? phaseTypeTier : ...;
```
Replace the whole block with `const tier = _resolveAgentSlot(cwd, agentType);`. Note: `_resolveAgentSlot`'s `VALID_TIERS` set **includes `'inherit'`** (line 1351), so the resolver must apply its own `inherit`/null opt-out *after* the call (RESOLVE-06): `if (!tier || tier === 'inherit') return null;`.

**Slot-effort derivation (D-06 step 2 — the same-slot invariant):** after getting the slot, run `parseModelEffort(slot).effort`. The slot string carries the `;effort` suffix (e.g. `"opus;high"`); the resolved `entry.model` and the slot-effort both come from the SAME slot — this is Pattern 1 in ARCHITECTURE.md.

**Step 3 — Codex per-tier fallback** (consume `_resolveRuntimeTier`, `core.cjs:1318`, exactly as the old resolver's last line did at `1581-1582`):
```javascript
  const entry = _resolveRuntimeTier(config, tier);
  return entry?.reasoning_effort || null;
```
**Adaptation (RESOLVE-03 / D-06 step 3):** this `entry.reasoning_effort` is now a **fallback only** — used when the resolved slot carried NO `;effort`. Slot effort wins; per-tier `reasoning_effort` fills the gap. `_resolveRuntimeTier` returns `{model, reasoning_effort?}` (see field-merge `resolveTierEntry`, lines 1295-1312).

**Allowlist gate to PRESERVE as outermost** (old lines 1535-1542, keep semantics, swap the Set source per D-07):
```javascript
  if (!config.runtime) return null;
  if (!RUNTIMES_WITH_REASONING_EFFORT.has(config.runtime)) return null;
```
Per D-02 this gate is absolute — a non-`{claude,codex}` install with an effort override still returns `null`. The gate runs BEFORE the override `.effort` emit.

**Codex `max`→`xhigh` clamp (D-03):** NOT in this resolver. The resolver returns canonical effort verbatim (`low|medium|high|xhigh|max`). The `max`→`xhigh` clamp is the Codex *emit boundary*'s job (Phase 54/57, `install.js`). Claude emits `max` verbatim. (See ARCHITECTURE.md "Avoid: Translating effort inside the resolver".)

---

### `model-catalog.cjs` :: `RUNTIMES_WITH_REASONING_EFFORT` (config/data — REPLACE)

**No code analog — it is a literal replacement.** Current data-derived form (lines 87-91):
```javascript
const RUNTIMES_WITH_REASONING_EFFORT = new Set(
  Object.entries(catalog.runtimeTierDefaults)
    .filter(([, tiers]) => Object.values(tiers).some((entry) => entry && entry.reasoning_effort))
    .map(([runtime]) => runtime)
);
```
**Replace with the static allowlist (D-07 / RESOLVE-01):**
```javascript
const RUNTIMES_WITH_REASONING_EFFORT = new Set(['claude', 'codex']);
```
**Why:** the data-derived scan is the exact anti-pattern RESOLVE-01 forbids — the instant a Claude tier slot gains a `;effort` suffix, the scan would auto-admit `claude` (intended) but also auto-admit any future Gemini/OpenCode slot that gains effort (Pitfall 2 leak). A static literal is the capability allowlist.

**Integration touch-points (do not miss):**
- Imported at `core.cjs:10`; re-exported at `core.cjs:1964`; exported from `model-catalog.cjs:132`. The membership shape stays a `Set<string>` so call sites (`.has(config.runtime)`) are unchanged.
- Existing membership-asserting tests live in `tests/issue-2517-runtime-aware-profiles.test.cjs` and `tests/feat-3023-model-phase-types.test.cjs` — any test asserting the *old* data-derived membership (codex-only) must be updated to `{claude, codex}`.

---

### `config.cjs` :: three override sites (config validation — ROUTING, NOT a new pass)

**Analog:** the one-time-warn pattern in `_warnUnknownProfileOverrides` / `_warnedConfigKeys` (`core.cjs:1154-1206`), AND the parser's own warn (`parseModelEffort`, `core.cjs:1242-1265`).

**D-05 decision:** CONFIG-04 is satisfied by **routing all three config sites' slot strings through `parseModelEffort`** so the existing warn-and-degrade fires uniformly. There is **NO separate hard-reject validation pass.** `config.cjs` currently has no `model_overrides`/`reasoning_effort` handling (confirmed by grep — zero matches), so the work is ensuring each of the three sites reaches `parseModelEffort`:

| Override site | Resolver path that must call `parseModelEffort` |
|---------------|--------------------------------------------------|
| `model_overrides.<agent>` | step 1 of `resolveReasoningEffortInternal` (D-01) |
| `models.<phase-type>` | via `_resolveAgentSlot` → slot string → `parseModelEffort` (D-08) |
| `model_profile_overrides.<runtime>` | via `_resolveRuntimeTier`/`resolveTierEntry` resolved entry |

**One-time-warn pattern already in place** (no new warn machinery needed — `parseModelEffort` owns it, `core.cjs:1253-1263`):
```javascript
  if (!_warnedEffortLabels.has(label)) {
    _warnedEffortLabels.add(label);
    try { process.stderr.write(`gsd: warning — unknown effort suffix ...`); } catch { }
  }
  return { model: base, effort: null }; // strip to base, degrade gracefully
```
This mirrors `_warnedConfigKeys` (the CONFIG-04 reference pattern). Malformed tokens (`opus;hihg`) degrade to `effort: null` with the base model preserved — config still resolves.

---

## Shared Patterns

### Same-slot derivation (the #3023 guard — applies to the resolver rewrite)
**Source:** `_resolveAgentSlot` (`core.cjs:1340-1361`), consumed by `resolveModelInternal:1386`.
**Apply to:** `resolveReasoningEffortInternal` — call the identical helper; never re-derive phase-type tier.
```javascript
function _resolveAgentSlot(cwd, agentType) {
  const config = loadConfig(cwd);
  const profile = String(config.model_profile || 'balanced').toLowerCase();
  const agentModels = MODEL_PROFILES[agentType];
  const phaseType = AGENT_TO_PHASE_TYPE[agentType];
  const phaseTypeTier = (phaseType && config.models && typeof config.models === 'object')
    ? config.models[phaseType] : undefined;
  const VALID_TIERS = new Set(['opus', 'sonnet', 'haiku', 'inherit']); // includes 'inherit'
  return (phaseTypeTier && VALID_TIERS.has(phaseTypeTier))
    ? phaseTypeTier
    : (profile === 'inherit' ? 'inherit'
      : (agentModels ? (agentModels[profile] || agentModels['balanced']) : null));
}
```

### Parse-on-both-paths (the back-compat + CONFIG-04 channel)
**Source:** `parseModelEffort` (`core.cjs:1242-1265`).
**Apply to:** both the override path (step 1, take `.effort`) and the slot path (step 2, take `.effort`). A bare model (no `;`) → `effort: null` → zero behavior change (the load-bearing back-compat invariant).

### Codex per-tier fallback merge
**Source:** `_resolveRuntimeTier` → `resolveTierEntry` field-merge (`core.cjs:1295-1324`).
**Apply to:** step 3 — `entry?.reasoning_effort || null`, used ONLY when the slot carried no `;effort`.

### One-time warn cache
**Source:** `_warnedConfigKeys` (`core.cjs:1154`) and `_warnedEffortLabels` (`core.cjs:1225`).
**Apply to:** already owned by `parseModelEffort`; the rewrite needs no new warn cache (CONFIG-04 / D-05).

## No Analog Found

| Target | Role | Reason |
|--------|------|--------|
| `RUNTIMES_WITH_REASONING_EFFORT` static Set | config/data | Literal replacement of a derived expression — no behavioral analog to copy; the value `{claude, codex}` is the design decision (D-07). |

## Behavior-Preservation Guard (D-08)

A **golden snapshot** test must guard bare configs across BOTH resolvers: for all ~33 agents under `quality`/`balanced`/`budget`/`inherit`, assert (a) `resolveModelInternal` model is unchanged from pre-change, and (b) `resolveReasoningEffortInternal` and the model read from the SAME resolved slot. The `#3023` fixture `{ model_profile: 'inherit', models: { execution: 'opus' } }` must yield opus model AND opus-tier effort. Assert with `strictEqual` on parsed `{model, effort}` — never `indexOf`/substring (Pitfall 6: `medium`/`high` collide with Codex defaults).

## Metadata

**Analog search scope:** `get-shit-done/bin/lib/{core.cjs,model-catalog.cjs,config.cjs}`, `tests/`, `sdk/src/`
**Files scanned:** core.cjs (resolvers + parser + warn helpers), model-catalog.cjs (Set derivation + exports), config.cjs (grep-confirmed no effort handling)
**Pattern extraction date:** 2026-06-01
```
