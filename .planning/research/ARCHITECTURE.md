# Architecture Patterns

**Domain:** Per-agent thinking-effort dimension for GSD (v2.1.0-e)
**Researched:** 2026-05-31
**Confidence:** HIGH (all integration points read directly from source)

## Recommended Architecture

The effort dimension extends the **existing Codex-only `reasoning_effort` machinery** rather than building parallel logic. The central design rule is **same-slot derivation**: model and effort must come from the SAME resolved profile/phase-type slot, because the slot itself now carries the effort inline as `model;effort` (e.g. `opus;high`). This structurally prevents the #3023-class divergence bug where `model` and `reasoning_effort` derived from different tier sources.

```
                       ┌─────────────────────────────────────────┐
   model-catalog.json  │ agents.<name>.golden|balanced|budget     │  "opus;high"
   (single source) ────│ adaptiveTierMap.heavy|standard|light     │  "opus;high"
                       │ runtimeTierDefaults.codex.<tier>         │  fallback effort
                       └────────────────────┬────────────────────┘
                                            │ loaded by
              ┌─────────────────────────────┴──────────────────────────┐
   model-catalog.cjs (CJS)                              model-catalog.ts (TS mirror)
   MODEL_PROFILES carries "opus;high"                   MODEL_PROFILES carries "opus;high"
              │                                                          │
   ┌──────────┴───────────┐                              ┌──────────────┴───────────┐
   │ NEW parseModelEffort │  splits "opus;high"          │ install.js readGsdRuntime │
   │  → {model, effort}   │  → {model:"opus",effort}     │ ProfileResolver (Codex TOML)│
   └──────────┬───────────┘                              └──────────────┬───────────┘
              │ used by                                                  │ emits
   resolveModelInternal ──► returns bare "opus" (strips effort)   reasoning_effort=
   resolveReasoningEffortInternal ──► returns effort from SAME slot   model_reasoning_effort
              │
   commands.cjs cmdResolveModel ─► init.cjs *_model + NEW *_effort fields
              │
   workflows/agents/commands spawn templates ─► Agent(model=, effort=?)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `model-catalog.json` | Single source of truth: effort inline in profile slots + `adaptiveTierMap`; `inherit` stays effort-free | catalog loaders (cjs + ts) |
| **NEW** `parseModelEffort(slot)` in `core.cjs` | Split `"model;effort"` → `{ model, effort }`; bare model → `{ model, effort: null }` | both resolvers |
| `resolveModelInternal` (`core.cjs`) | Returns the bare **model** (effort stripped) — back-compat string return preserved | `parseModelEffort` |
| `resolveReasoningEffortInternal` (`core.cjs`) | Returns the **effort** derived from the SAME slot the model came from; Claude-first (block lifted from runtime-only gate) | `parseModelEffort`, `_resolveRuntimeTier` |
| `cmdResolveModel` (`commands.cjs`) | Exposes `{ model, effort? }` to CLI consumers | both resolvers |
| `init.cjs` | Adds `*_effort` siblings to each `*_model` field in init JSON | `resolveModelInternal`, NEW effort resolver |
| `install.js` `readGsdRuntimeProfileResolver` + `generateCodexAgentToml` | Codex/OpenCode TOML emit; translate `effort`→`reasoning_effort`, `max`→`xhigh` | catalog, `gsdResolveTierEntry` |
| Spawn templates (`agents/`, `commands/`, `workflows/`) | Conditionally pass `effort` to `Agent()` | init JSON `*_effort` fields |

### Data Flow

1. Catalog slot `"opus;high"` is loaded into `MODEL_PROFILES[agent][profile]`.
2. `resolveModelInternal` computes the tier slot as today, then calls `parseModelEffort(slot)` and returns `.model` only — preserving its string contract.
3. `resolveReasoningEffortInternal` walks the **identical** precedence chain, calls `parseModelEffort` on the **same** resolved slot, and returns `.effort`. The Claude gate (`RUNTIMES_WITH_REASONING_EFFORT.has`) is lifted so effort flows for Claude too; Codex per-tier `runtimeTierDefaults.codex.reasoning_effort` becomes fallback only when the slot has no `;`.
4. `cmdResolveModel` / `init.cjs` surface `{model, effort}` to workflows.
5. Spawn templates emit `effort=` only when non-null.

## Patterns to Follow

### Pattern 1: Same-slot derivation (the #3023 guard)
**What:** Both resolvers compute `tier`/`slot` with **identical** precedence logic, then derive their respective field from the SAME `parseModelEffort(slot)` result.
**When:** Always — this is the core invariant.
**How:** Extract the shared tier-resolution into a helper (e.g. `_resolveAgentSlot(cwd, agentType)`) returning the raw slot string (with possible `;effort`). Both `resolveModelInternal` and `resolveReasoningEffortInternal` call it, then `parseModelEffort`. This removes the duplicated phase-type-tier lookup currently copy-pasted across both functions (core.cjs:1285-1307 vs 1468-1500) — the exact place the original divergence risk lives.

### Pattern 2: parser placement
**What:** `parseModelEffort(slot)` is a small pure helper in `core.cjs`, exported, also reimplemented in `model-catalog.ts`.
**Where:** `core.cjs` near `resolveTierEntry` (line ~1236). Delimiter is `;` (NOT `:`) — chosen so colons in provider IDs are never delimiters. Rules:
- `"opus;high"` → `{ model: "opus", effort: "high" }`
- `"opus"` (no `;`) → `{ model: "opus", effort: null }` (back-compat: omit)
- `"openrouter:anthropic/claude-opus"` (no `;`) → `{ model: "openrouter:anthropic/claude-opus", effort: null }` (provider colons untouched)
- `"inherit"` → `{ model: "inherit", effort: null }`
- Validate effort token against `low|medium|high|xhigh|max`; a non-token suffix after `;` (e.g. `"opus;hihg"`) is an unambiguous typo → strip to base model, return `effort: null`, and warn (matching `_warnedConfigKeys` pattern).

### Pattern 3: precedence chain — model and effort aligned
The effort precedence MUST mirror the existing model precedence (core.cjs:1270-1353) exactly, because effort rides inline on the same slots:

| Rank | Model source (existing) | Effort source (new) |
|------|------------------------|---------------------|
| 1 | `config.model_overrides[agent]` (full ID → returns as-is) | parse `;effort` off the override string; if none → omit |
| 2 | phase-type slot `config.models[phaseType]` (if valid tier) | same slot's `;effort` |
| 3 | profile slot `MODEL_PROFILES[agent][profile]` | same slot's `;effort` |
| 4 | `model_profile_overrides[runtime][tier]` (runtime resolution) | `resolveTierEntry` effort; profile-slot effort OVERRIDES Codex `runtimeTierDefaults.codex.reasoning_effort` (per-tier value is fallback only when slot has no `;`) |
| 5 | `adaptiveTierMap[routingTier]` (adaptive profile) | adaptiveTierMap slot `;effort` (heavy→`opus;high` etc.) |
| — | omit (bare model, `inherit`, or no match) | omit |

**Key alignment fix:** Today `resolveModelInternal` accepts `model_overrides` as opaque full IDs (returns immediately). For effort, `parseModelEffort` must run on the override string too, so a user writing `model_overrides.gsd-executor: "gpt-5.4;high"` gets both. This is the one place the override path gains effort awareness — guard it so a bare full ID (`"openai/gpt-5.4"`) still omits effort.

## Patterns to Avoid

### Avoid: Divergent tier lookups (the bug being fixed)
**What goes wrong:** Re-deriving tier independently in the effort resolver (current copy-paste at core.cjs:1484-1500 mirrors 1287-1307). Any future edit to one block without the other reintroduces #3023 model/effort divergence.
**Instead:** Use a single shared `_resolveAgentSlot` helper feeding both resolvers via `parseModelEffort`.

### Avoid: Translating effort inside the resolver
**What goes wrong:** Emitting `xhigh` from `max`, or renaming to `reasoning_effort`, inside `resolveReasoningEffortInternal` couples runtime-agnostic resolution to Codex naming and breaks Claude effort passing.
**Instead:** Keep the resolver returning canonical effort (`low|medium|high|xhigh|max`); apply translation (`effort`→`reasoning_effort`, `max`→`xhigh`) only at `install.js` Codex TOML emit (install.js:2748-2749) and at the SDK boundary.

### Avoid: install.js resolver drift
**What goes wrong:** `readGsdRuntimeProfileResolver` (install.js:1498-1511) does NOT replicate the phase-type slot (#3023) chain — it only does profile→tier. Adding effort there naively diverges from `core.cjs`.
**Instead:** Route effort through `gsdResolveTierEntry` + a shared `parseModelEffort` (export from a surface install.js already requires — it imports `resolveTierEntry`/`RUNTIME_PROFILE_MAP` at install.js:160-161). Reuse, never reimplement.

### Avoid: Breaking the fork test gates in spawn templates
**What goes wrong:** Adding `effort=` lines with decimal sub-steps, broken `<%~ include %>` tags, or negative-framing comments ("do not pass effort when...") trips `step-numbering-scan`, `cross-file-step-refs`, or the negative-framing scanner.
**Instead:** Mirror the existing `model=` conditional comment style (execute-phase.md:555-558) with positive framing: "Include `effort=` only when `executor_effort` is a non-empty value." Keep whole-integer step labels; place the `effort=` line adjacent to `model=` inside the same code fence (no new step).

## Install-Time Runtime Translation

`bin/install.js` already owns runtime translation for models. Effort needs translation in exactly these places:

| Location | Today | Add for effort |
|----------|-------|----------------|
| `generateCodexAgentToml` (install.js:2715-2755) | emits `model` + `model_reasoning_effort` from `entry.reasoning_effort` | when resolved slot carries `;effort`, that value (after `max`→`xhigh`) feeds `model_reasoning_effort`; profile-slot effort overrides the per-tier default |
| `readGsdRuntimeProfileResolver.resolve()` (install.js:1500-1510) | returns `gsdResolveTierEntry(...)` `{model, reasoning_effort?}` | parse `;effort` off the resolved `tier` slot before/around `gsdResolveTierEntry`; slot effort wins over tier-default `reasoning_effort` |
| Claude/OpenCode/Gemini agent emit | no effort today | Claude spawn path carries effort via init JSON → markdown templates (NOT TOML); other runtimes omit unless they accept an effort field |

**Translation rule:** Canonical `effort` (resolver output) → Codex `reasoning_effort` with `max`→`xhigh`. Claude keeps `effort` verbatim (Claude-first). Runtimes with no effort surface silently omit (mirror the `entry.reasoning_effort` truthy guard at install.js:2748).

## SDK + init JSON Contract Changes

### `sdk/src/model-catalog.ts`
- `MODEL_PROFILES` values become `"model;effort"` strings — **widen** `AgentCatalogEntry.golden|balanced|budget` from the literal `'opus'|'sonnet'|'haiku'` union to `string` (slots may now carry `;effort`).
- `adaptiveTierMap` value type widens from `'opus'|'sonnet'|'haiku'` to `string`.
- Add a `parseModelEffort` TS helper (mirror of the cjs one) and optionally `getAgentToEffortMapForProfile`.
- `RuntimeTierEntry.reasoning_effort?` stays as the Codex fallback.

### `commands.cjs` / init JSON contract
- `cmdResolveModel` already emits `reasoning_effort` (commands.cjs:250). **Add** a canonical `effort` field; keep `reasoning_effort` for Codex back-compat (or alias). Recommended shape: `{ model, profile, effort? }` where `effort` is canonical; Codex emit translates.
- `init.cjs`: every `*_model` field (init.cjs:197-198, 343-345, 530-532, 583-585, 640-643, 762-763, 1096, 1552-1553) gains a sibling `*_effort` field, e.g. `executor_effort: resolveReasoningEffortInternal(cwd,'gsd-executor')`. Workflows parse it alongside `executor_model`.
- `agent-skills` output path (init.cjs ~1834) should likewise carry effort if it carries model.

## Scalability / Consistency Considerations

| Concern | Approach |
|---------|----------|
| 33 agents × 3 profile slots + adaptiveTierMap | Effort is hand-assigned by user during execution handover — Claude builds plumbing + tests only; `inherit` stays effort-free |
| New runtimes added later | Only the install-emit boundary translates; resolver stays canonical, so a new runtime adds one emit branch |
| Back-compat (bare slots) | `parseModelEffort` of a delimiter-free slot → `effort:null` → every consumer omits — zero behavior change for existing catalogs |

## Suggested Build Order (dependency-respecting)

1. **Parser** — `parseModelEffort` in `core.cjs` (+ validation, warn on malformed) and TS mirror. Unit-testable in isolation. No consumers yet.
2. **Shared slot resolver** — extract `_resolveAgentSlot(cwd, agentType)` from the duplicated tier logic; refactor `resolveModelInternal` to use it + `parseModelEffort().model` (return unchanged). Regression: existing model tests stay green.
3. **Effort resolution** — rewrite `resolveReasoningEffortInternal` to use the shared slot + `parseModelEffort().effort`; lift Claude gate; profile-slot effort overrides Codex tier default. Regression: parse/precedence/omit/Codex-mapping.
4. **SDK + tools exposure** — `cmdResolveModel` `effort` field; `init.cjs` `*_effort` siblings; `model-catalog.ts` type widening + helper.
5. **[HANDOVER BOUNDARY] Catalog assignment** — user hand-assigns `;effort` to `model-catalog.json` slots + `adaptiveTierMap`. Claude does NOT pick effort values. Everything before this point is plumbing that no-ops on bare slots; everything after consumes real values.
6. **Spawn-template wiring** — add conditional `effort=` lines to spawn templates in `agents/`, `commands/`, `workflows/`, mirroring the `model=` conditional comment style; respect whole-integer steps + eta includes + positive framing.
7. **Install translation** — `generateCodexAgentToml` + `readGsdRuntimeProfileResolver`: slot effort → `reasoning_effort`, `max`→`xhigh`, slot overrides tier default.
8. **Tests** — parse, precedence alignment (model vs effort same slot), omit (bare/inherit), Codex mapping, install-emit, spawn-template gates (`step-numbering-scan`, `cross-file-step-refs`, negative-framing).

**Build-order rationale:** Parser (1) has no deps. Slot extraction (2) must precede effort resolution (3) so both share one tier path (the #3023 guard). Exposure (4) needs the resolvers. Catalog assignment (5) is the user-handover boundary — plumbing is inert until slots gain `;` effort suffixes, so steps 1-4 ship safely against a bare catalog. Spawn wiring (6) and install translation (7) consume resolved effort and can proceed in parallel after (4)/(5). Tests (8) gate throughout, but the dedicated gate-conformance suite lands last with the spawn edits.

## Exact Functions/Files to Touch

| File | Function | Change |
|------|----------|--------|
| `get-shit-done/bin/lib/core.cjs` | NEW `parseModelEffort`, NEW `_resolveAgentSlot`, `resolveModelInternal`, `resolveReasoningEffortInternal` | parser, shared slot, same-slot derivation, lift Claude gate |
| `get-shit-done/bin/lib/core.cjs` | exports block (~line 1880) | export `parseModelEffort` |
| `get-shit-done/bin/lib/commands.cjs` | `cmdResolveModel` (236-252) | add canonical `effort` field |
| `get-shit-done/bin/lib/init.cjs` | all `*_model` builders | add `*_effort` siblings |
| `get-shit-done/bin/lib/model-catalog.cjs` | `MODEL_PROFILES` (54-61) | tolerate `;effort` slots (keep raw for parser; no split here) |
| `sdk/src/model-catalog.ts` | interfaces + `MODEL_PROFILES` + NEW `parseModelEffort` | widen tier types to `string`, mirror parser |
| `bin/install.js` | `readGsdRuntimeProfileResolver.resolve` (1500-1510), `generateCodexAgentToml` (2715-2755) | effort→`reasoning_effort`, `max`→`xhigh`, slot overrides default |
| `agents/`, `commands/gsd/`, `get-shit-done/workflows/` spawn templates | `Agent()` blocks | conditional `effort=` adjacent to `model=` |

## Sources

- `sdk/shared/model-catalog.json` (catalog structure) — HIGH
- `get-shit-done/bin/lib/core.cjs:1236-1504` (resolvers, #3023/#3030 comments) — HIGH
- `get-shit-done/bin/lib/commands.cjs:236-252` (cmdResolveModel) — HIGH
- `get-shit-done/bin/lib/init.cjs:197-1553` (`*_model` builders) — HIGH
- `sdk/src/model-catalog.ts` (TS mirror) — HIGH
- `bin/install.js:1449-1512, 2715-2755` (Codex emit) — HIGH
- `get-shit-done/workflows/execute-phase.md:85-558` (spawn template, model conditional) — HIGH
- `.planning/PROJECT.md` (v2.1.0-e decisions, gate inventory) — HIGH
