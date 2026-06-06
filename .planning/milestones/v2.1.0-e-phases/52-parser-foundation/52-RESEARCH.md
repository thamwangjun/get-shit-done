# Phase 52: Parser Foundation - Research

**Researched:** 2026-05-31
**Domain:** GSD model-routing machinery — pure `parseModelEffort` parser + shared `_resolveAgentSlot` helper + `resolveModelInternal` refactor (CJS lib + TS SDK mirror)
**Confidence:** HIGH (all integration points read directly from source: `core.cjs`, `model-catalog.cjs`, `model-profiles.cjs`, `sdk/src/model-catalog.ts`, workflows, install.js)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DECISION 1 — Effort delimiter is `;`, NOT `:` (milestone-wide).** Suffix joined as `model;effort` (e.g. `opus;high`). Split on `lastIndexOf(';')` everywhere — `core.cjs`, `sdk/src/model-catalog.ts`, any install-time path. The combined `model;effort` string lives ONLY in catalog JSON / config and is parsed immediately into separate fields; it must never reach a raw shell where `;` is a command separator. **Planner must verify** no spawn/install code path passes a combined `model;effort` token through an unquoted shell context (see Spawn/Shell-Safety Audit below — finding: SAFE).

**DECISION 2 — `parseModelEffort` warns on malformed effort suffix (warn-inside-parser).** When `;` is present but the suffix is NOT an exact member of `{low, medium, high, xhigh, max}` (e.g. `opus;hihg`): strip to the base model (`opus`), return `effort: null` (graceful degradation), and emit a ONE-TIME typo warning (Set-tracked, mirroring `_warnedConfigKeys`). The warn side-effect lives inside `parseModelEffort` itself and must be identical between the cjs and ts implementations (warnings are a side channel, not part of the returned `{model, effort}` shape). A label with NO `;` never warns (bare models and provider-colon IDs are valid).

**DECISION 3 — Phase 52 refactors `resolveModelInternal` to consume `_resolveAgentSlot` now.** Extract the duplicated phase-type-tier lookup (currently copy-pasted at `core.cjs:1285-1307` vs `1468-1500`) into a single `_resolveAgentSlot(cwd, agentType)` returning the raw slot string, AND refactor `resolveModelInternal` to call it then `parseModelEffort(slot)`, returning `.model` only (preserving its existing string return contract). `resolveModelInternal`'s observable behavior must be unchanged for all existing (bare) configs — verified by a pre-change golden snapshot assertion in this phase's tests. The `model_overrides.<agent>` path must run `parseModelEffort` on the override string too, but a bare full ID (`openai/gpt-5.4`, no `;`) still omits effort.

**DECISION 4 — Cross-language parity via a shared JSON fixture table.** The `core.cjs` (`node --test`) parser test and the `sdk/src/model-catalog.ts` (vitest) parser test both load ONE shared JSON fixture file of `{ input, expectedModel, expectedEffort }` cases. Cases MUST include: bare model, `opus;high`, every valid effort token, a provider-colon ID (`openrouter:anthropic/claude-opus` → unchanged, `effort: null`), and the `opus;hihg` typo case.

### Claude's Discretion

- Fixture file location (must be readable by both `node --test` from `tests/` and vitest from `sdk/src/`).
- Exact warning message text (match the existing `gsd: warning — ...` prefix style).
- Internal structure of `_resolveAgentSlot` (so long as it returns the raw slot string and both resolvers can consume it).

### Deferred Ideas (OUT OF SCOPE)

- Effort RESOLUTION (`resolveReasoningEffortInternal` rewrite, Claude gate lift) — Phase 53.
- Config-override acceptance (`models.<phase-type>`, `model_profile_overrides.<runtime>`) — Phase 53.
- SDK/init JSON `*_effort` exposure — Phase 54.
- Catalog widening / effort assignment — Phase 55.
- Spawn wiring — Phase 56. Install translation (`max`→`xhigh`) — Phase 57.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PARSE-01 | `parseModelEffort(slot)` splits on `lastIndexOf(';')`, strips suffix only if exact member of `{low,medium,high,xhigh,max}`; typo suffix → base model + `effort:null` + one-time warn; no `;` → whole string is model, `effort:null` | Canonical algorithm in Code Examples; warn-once pattern verified at `core.cjs:1154-1206` |
| PARSE-02 | Returns `{model, effort:null}` for bare strings (backward-compatible omit) | `lastIndexOf(';')===-1` early-return branch |
| PARSE-03 | Shared `_resolveAgentSlot(cwd, agentType)` returns single raw slot string so model and effort derive from the same tier entry (kills #3023 class) | Duplicated lookup mapped at `core.cjs:1285-1307` (model) vs `1484-1500` (effort) |
| PARSE-04 | `parseModelEffort` exported from JS lib AND mirrored in `sdk/src/model-catalog.ts` with identical semantics, parity-tested | `core.cjs` exports block at line 1861; TS module structure at `sdk/src/model-catalog.ts:1-70` |
</phase_requirements>

## Summary

Phase 52 is a small, surgical, regression-sensitive refactor inside `get-shit-done/bin/lib/core.cjs` with a mirror in `sdk/src/model-catalog.ts`. It adds two pure-ish helpers — `parseModelEffort(label)` (pure except a one-time stderr warn side channel) and `_resolveAgentSlot(cwd, agentType)` (extracted from copy-pasted tier-resolution logic) — and rewires `resolveModelInternal` to consume both while preserving its exact string return contract. No new dependencies, no new files except a shared test fixture.

The core correctness rule (DECISION 1): split on `lastIndexOf(';')`, strip the suffix only when it is an exact member of `{low,medium,high,xhigh,max}`. The semicolon delimiter makes the colon-in-provider-ID pitfall structurally impossible — colons are never delimiters, so `openrouter:anthropic/claude-opus` passes through untouched, and a non-token suffix after `;` is unambiguously a typo (DECISION 2: warn once, strip to base, omit effort). The shared `_resolveAgentSlot` extraction (DECISION 3) eliminates the #3023 model/effort divergence class at its origin site by giving both the model resolver and the (Phase 53) effort resolver a single tier-resolution path.

The dominant risk is regression, not greenfield complexity. `resolveModelInternal` carries years of accreted edge-case handling (#2517 runtime resolution, #3023/#3030 phase-type-tier precedence, `resolve_model_ids: omit`, inherit semantics). The refactor must preserve every one of those branches exactly. The Phase 52 deliverable is inert against today's bare catalog: every slot has no `;`, so `parseModelEffort` returns `effort:null` and `resolveModelInternal` returns the identical model string it returns today.

**Primary recommendation:** Add `parseModelEffort` as a pure module-level function near `resolveTierEntry` (`core.cjs:~1236`); add `_resolveAgentSlot` extracting the tier-resolution lines from `resolveModelInternal` (the `profile`/`agentModels`/`phaseType`/`tier` block at 1285-1307); refactor `resolveModelInternal` to call `_resolveAgentSlot` then `parseModelEffort(...).model`; export both; mirror `parseModelEffort` verbatim in `sdk/src/model-catalog.ts`; drive both test suites from one shared JSON fixture. Gate the whole thing behind a pre-change golden snapshot proving model resolution is byte-identical for bare configs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Parse `model;effort` label into `{model, effort}` | CLI Tools (`core.cjs`) | SDK (`model-catalog.ts` mirror) | Pure string operation; both runtimes resolve models, so both need an identical parser (PARSE-04 parity) |
| Resolve which raw slot string an agent maps to (`_resolveAgentSlot`) | CLI Tools (`core.cjs`) | — | Reads `config` + `MODEL_PROFILES` + phase-type map; only the CJS lib owns the full precedence chain today |
| Return resolved model string (`resolveModelInternal`) | CLI Tools (`core.cjs`) | — | Existing contract; refactor preserves it |
| One-time malformed-suffix warning | CLI Tools / SDK (inside parser) | — | DECISION 2: warn lives inside `parseModelEffort`, identical in both languages |
| Cross-language parity verification | Test layer (`tests/*.cjs` + `sdk/src/*.test.ts`) | — | Shared JSON fixture is the single source of parity cases |

## Standard Stack

No new dependencies. This phase extends existing functions and the data they consume.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `--test` | built-in (Node >=20) | `tests/*.test.cjs` runner for `core.cjs` parser | Project convention; no external test framework |
| vitest | ^3.1.1 (SDK) | `sdk/src/*.test.ts` runner for the TS mirror | Existing SDK test runner |
| Node.js `fs`/`path` | built-in | Load the shared JSON fixture from both runners | Already used by every test |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared JSON fixture | Duplicated inline case arrays in each test | Rejected by DECISION 4 — the two lists silently drift, which is the exact failure PARSE-04 parity prevents |
| `parseModelEffort` in `core.cjs` | `parseModelEffort` in `model-catalog.cjs` (where `MODEL_PROFILES` source lives) | CONTEXT/ARCHITECTURE specify `core.cjs` near `resolveTierEntry`; the resolvers that consume it live in `core.cjs`. Follow CONTEXT. |

**Installation:** None.

## Package Legitimacy Audit

Not applicable — Phase 52 installs no external packages. All code uses Node.js built-ins and the already-present vitest dev dependency.

## Architecture Patterns

### System Architecture Diagram

```
  config.json / model-catalog.json  ──── slot strings (may carry ";effort") ──────┐
  (the ONLY place a combined token lives)                                         │
                                                                                  ▼
  resolveModelInternal(cwd, agentType)                              _resolveAgentSlot(cwd, agentType)
        │                                                                  │  (NEW — extracted tier-resolution
        │  1. model_overrides[agent]? ── parseModelEffort(override) ──┐    │   precedence chain; returns RAW slot)
        │                                                             │    │
        ├── 2. else slot = _resolveAgentSlot(...) ───────────────────┼────┘
        │                                                             ▼
        │                                              parseModelEffort(label)  ── split lastIndexOf(';')
        │                                                             │            ├─ no ';'       → {label, null}
        │                                                             │            ├─ valid token  → {base, token}
        │                                                             │            └─ typo token   → {base, null} + warnOnce
        │                                                             ▼
        └──────────────────────── returns .model only ───────────────┘   (effort discarded in P52; consumed in P53)
                                          │
                                          ▼
         cmdResolveModel → `query resolve-model X | jq -r '.model'` → shell var → Agent(model="...")
         (the ';effort' is ALREADY stripped before serialization — never reaches the shell)

  sdk/src/model-catalog.ts : parseModelEffort (identical semantics) ── verified against the SAME JSON fixture
```

File-to-change mapping appears in the table below the diagram.

### Recommended Project Structure (files touched)
```
get-shit-done/bin/lib/core.cjs   # NEW parseModelEffort (~near 1236), NEW _resolveAgentSlot,
                                 #   refactor resolveModelInternal (1267-1354), export both (1861 block)
sdk/src/model-catalog.ts         # NEW parseModelEffort mirror (export)
tests/<shared>/                  # NEW shared JSON fixture {input, expectedModel, expectedEffort}
tests/parse-model-effort.test.cjs    # NEW node --test suite (loads fixture)
sdk/src/parse-model-effort.test.ts   # NEW vitest suite (loads SAME fixture)
```

### Pattern 1: One-time warn side channel (mirror `_warnedConfigKeys`)
**What:** A module-level `Set` tracks already-warned labels; `process.stderr.write` inside a `try/catch` (stderr may be closed in test harnesses).
**When:** DECISION 2 — `;` present, suffix not a valid token.
**Example (verified pattern from `core.cjs:1154-1206`):**
```js
// Source: get-shit-done/bin/lib/core.cjs:1154 (_warnedConfigKeys) and :1162-1170 (warn body)
const _warnedConfigKeys = new Set();
// ...
if (!_warnedConfigKeys.has(key)) {
  _warnedConfigKeys.add(key);
  try {
    process.stderr.write(`gsd: warning — ...\n`);
  } catch { /* stderr might be closed in some test harnesses */ }
}
```
**Note:** A `_resetRuntimeWarningCacheForTests()` helper (`core.cjs:1210`) clears `_warnedConfigKeys` so tests can re-exercise the warn path. The effort parser SHOULD expose an equivalent reset (or reuse the existing one if it shares the Set) — tests that assert "warns once" need a deterministic starting state. [VERIFIED: codebase grep]

### Pattern 2: Parser placement and exports
**What:** `parseModelEffort` is a small module-level function near `resolveTierEntry` (`core.cjs:1236`), added to the `module.exports` block at `core.cjs:1861`. Export it next to `resolveModelInternal`, `resolveReasoningEffortInternal`, `resolveTierEntry`. [VERIFIED: codebase grep — exports block confirmed at 1861-1900]

### Pattern 3: `_resolveAgentSlot` extraction (the #3023 guard)
**What:** Lift the tier-resolution block out of `resolveModelInternal` (the `profile` / `agentModels` / `phaseType` / `phaseTypeTier` / `VALID_TIERS` / `tier` computation at `core.cjs:1285-1307`) into `_resolveAgentSlot(cwd, agentType)` returning the raw slot string. `resolveModelInternal` then calls it; Phase 53's effort resolver will call the SAME helper instead of re-deriving (today's duplicate at `core.cjs:1484-1500`).
**Critical subtlety:** The two existing blocks are NOT identical — `resolveModelInternal`'s `VALID_TIERS` is `{opus, sonnet, haiku, inherit}` (1294), while `resolveReasoningEffortInternal`'s is `{opus, sonnet, haiku}` (1493) and it short-circuits `null` on `phaseTypeTier === 'inherit'` (1492). The extracted helper must reconcile these so Phase 52's `resolveModelInternal` behavior is byte-identical. The safest approach: `_resolveAgentSlot` returns the same tier `resolveModelInternal` computes today (including the `inherit` synthesis at 1305), and Phase 53 layers its `inherit`-opt-out on top. [VERIFIED: codebase grep — both blocks read directly]

### Anti-Patterns to Avoid
- **`label.split(';')` (greedy first-delimiter):** Use `lastIndexOf(';')`. Greedy split mis-handles a hypothetical multi-`;` label. The canonical algorithm uses `lastIndexOf`.
- **Returning effort as part of the warn:** Warnings are a side channel; the returned shape is always `{model, effort}`. Parity tests compare only the returned shape (DECISION 2).
- **Mutating / reconstructing the `model_overrides` string:** Run `parseModelEffort` as a read; return `.model`. A bare full ID with no `;` must come back verbatim (Pitfall 4).
- **Changing any `resolveModelInternal` branch behavior:** The refactor is pure extraction. Every `#2517`/`#3023`/`#3030`/`resolve_model_ids`/`inherit` branch must produce identical output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| One-time warning dedup | A fresh ad-hoc flag scheme | The `_warnedConfigKeys` Set pattern (`core.cjs:1154`) | DECISION 2 explicitly says mirror it; tests already expect a resettable cache |
| Tier-resolution precedence | A second copy of the 1285-1307 block | `_resolveAgentSlot` shared helper | That copy-paste IS the #3023 bug class (PARSE-03) |
| Cross-language case lists | Two hand-maintained arrays | One shared JSON fixture (DECISION 4) | Prevents silent drift — the exact PARSE-04 failure mode |

**Key insight:** The whole phase exists to REMOVE a hand-rolled duplication (the divergent tier lookups), not add one.

## Runtime State Inventory

Phase 52 is a pure code/test refactor — no stored data, live-service config, OS-registered state, secrets, or build artifacts carry the parser logic.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — parser reads config/catalog already in git | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None — `GSD_TEST_MODE` env used by tests is pre-existing | None |
| Build artifacts | SDK is compiled (`tsc` → `sdk/dist/`); the TS mirror edit needs `npm run build` in SDK for any consumer of `dist/`, but Phase 52 only adds an exported function consumed by tests via source/vitest | None blocking — vitest runs TS source directly |

**Nothing found in categories 1-4:** Verified — the parser is a runtime-agnostic string function; no external system caches a `model;effort` token (see Spawn/Shell-Safety Audit).

## Common Pitfalls

### Pitfall 1: Colon-in-provider-ID shredding — RESOLVED by `;` delimiter
**What goes wrong:** A `split(':')` parser corrupts `openrouter:anthropic/claude-opus`, `vertex:gemini-3-pro`, `bedrock:us.anthropic...`.
**Why it happens:** The same `model_overrides`/`models` fields accept BOTH bare aliases AND fully-qualified provider IDs.
**How to avoid:** DECISION 1 — `lastIndexOf(';')`. A `;` never appears in a real model ID, so colons are never delimiters. Provider-colon IDs (no `;`) return `{wholeString, null}`.
**Warning signs:** Any `split(':')` / `lastIndexOf(':')` on a model string; a full ID appearing truncated in `resolve-model` JSON.

### Pitfall 2: `resolveModelInternal` behavior drift during extraction
**What goes wrong:** The refactor accidentally changes a tier branch (e.g. drops the `profile==='inherit'` → `'inherit'` synthesis at 1305, or the `resolve_model_ids: 'omit'` early return at 1328).
**Why it happens:** The function has 5 numbered precedence steps and several #-bug-fix branches interleaved; extraction is easy to get subtly wrong.
**How to avoid:** Build a pre-change golden snapshot of `resolveModelInternal` output for every agent in `MODEL_PROFILES` across profiles `quality`/`balanced`/`budget`/`inherit` AND representative configs (`resolve_model_ids: omit`, non-claude `runtime`, `models.<phaseType>` override). Assert byte-identical after the refactor. This is TEST-01 territory but a behavior-preservation assertion belongs in THIS phase (DECISION 3).
**Warning signs:** Any existing model-resolution test changing its expected value; `feat-3023-model-phase-types.test.cjs` going red.

### Pitfall 3: `MODEL_PROFILES`/`AGENT_TO_PHASE_TYPE` come from `model-profiles.cjs`, not `core.cjs`
**What goes wrong:** Assuming the profile map is local to `core.cjs`. It is imported: `core.cjs:9` `const { MODEL_PROFILES, AGENT_TO_PHASE_TYPE, ... } = require('./model-profiles.cjs')`.
**How to avoid:** `_resolveAgentSlot` uses the already-imported `MODEL_PROFILES`/`AGENT_TO_PHASE_TYPE`. Tests import these from `model-profiles.cjs` (see `feat-3023` test, line ~35) and `resolveModelInternal`/`parseModelEffort` from `core.cjs`. [VERIFIED: codebase grep]

### Pitfall 4: `indexOf`-as-boolean / substring false-pass in tests
**What goes wrong:** `assert(out.indexOf('opus;high'))` passes at any index except 0 and fails at 0; `includes('medium')` collides with Codex catalog defaults.
**How to avoid:** Assert deep-equality on the returned `{model, effort}` (`assert.deepStrictEqual` / `assert.strictEqual(result.effort, 'high')` and `=== null` for omit). Confirm each new test fails RED before implementation.
**Warning signs:** `indexOf` truthiness or `includes` substring checks in the new fixture-driven tests.

### Pitfall 5: Shared fixture path must resolve from BOTH runners
**What goes wrong:** A fixture under `tests/` is reachable by `node --test` via `path.join(__dirname, ...)` but the vitest suite in `sdk/src/` needs a relative climb (`../../tests/...`) or a path the SDK build doesn't exclude.
**How to avoid:** Place the fixture at a path both can read with a stable relative reference. Existing precedent: `sdk/src/model-catalog.ts` already reads `../shared/model-catalog.json` and tests read `sdk/shared/model-catalog.json`. A `tests/fixtures/parse-model-effort.json` read from `sdk/src/*.test.ts` as `path.resolve(__dirname, '../../tests/fixtures/...')` works; OR colocate under a neutral shared dir. Planner picks; verify both runners load it. [VERIFIED: codebase grep — `sdk/shared/` read by both `tests/bug-3288...` and `sdk/src/model-catalog.ts`]

## Code Examples

### Canonical `parseModelEffort` (CJS — `core.cjs`)
```js
// Source: .planning/research/PITFALLS.md:23-35 (canonical algorithm) + core.cjs:1154 warn pattern
const EFFORT_TOKENS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const _warnedEffortLabels = new Set(); // mirror _warnedConfigKeys

function parseModelEffort(label) {
  if (typeof label !== 'string') return { model: label, effort: null };
  const idx = label.lastIndexOf(';');
  if (idx === -1) return { model: label, effort: null };      // bare model / provider-colon ID
  const base = label.slice(0, idx);
  const suffix = label.slice(idx + 1);
  if (EFFORT_TOKENS.has(suffix)) return { model: base, effort: suffix };
  // ';' present but suffix is not a token → unambiguous typo (DECISION 2)
  if (!_warnedEffortLabels.has(label)) {
    _warnedEffortLabels.add(label);
    try {
      process.stderr.write(
        `gsd: warning — unknown effort "${suffix}" in "${label}". ` +
        `Allowed: ${[...EFFORT_TOKENS].join(', ')}. Effort omitted.\n`
      );
    } catch { /* stderr may be closed in test harnesses */ }
  }
  return { model: base, effort: null };                        // strip to base, omit effort
}
```

### TS mirror (`sdk/src/model-catalog.ts`) — identical semantics
```ts
// Source: mirror of the CJS function; export alongside existing helpers (model-catalog.ts:51-70)
const EFFORT_TOKENS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const _warnedEffortLabels = new Set<string>();

export function parseModelEffort(label: string): { model: string; effort: string | null } {
  if (typeof label !== 'string') return { model: label, effort: null };
  const idx = label.lastIndexOf(';');
  if (idx === -1) return { model: label, effort: null };
  const base = label.slice(0, idx);
  const suffix = label.slice(idx + 1);
  if (EFFORT_TOKENS.has(suffix)) return { model: base, effort: suffix };
  if (!_warnedEffortLabels.has(label)) {
    _warnedEffortLabels.add(label);
    // eslint-disable-next-line no-console
    process.stderr.write(`gsd: warning — unknown effort "${suffix}" in "${label}". Effort omitted.\n`);
  }
  return { model: base, effort: null };
}
```

### `resolveModelInternal` refactor shape (DECISION 3)
```js
// Per-agent override path now also parses (but bare full IDs still omit effort)
const override = config.model_overrides?.[agentType];
if (override) {
  return parseModelEffort(override).model;   // ".model" === verbatim for bare IDs (no ';')
}
// ...steps 2-5 use the slot from _resolveAgentSlot:
const slot = _resolveAgentSlot(cwd, agentType);  // raw tier slot string
// (existing runtime / omit / profile / alias-map logic operates on parseModelEffort(slot).model)
```
**Caution:** the existing function interleaves `model_profile_overrides` runtime resolution (`_resolveRuntimeTier`, step 3, 1318-1323) and `resolve_model_ids` handling AFTER tier computation. The cleanest extraction returns the computed `tier` from `_resolveAgentSlot` and leaves steps 3-5 in `resolveModelInternal` unchanged — `parseModelEffort` only needs to run on the override string and (later, in P53) on the resolved slot. Planner should decide whether `_resolveAgentSlot` returns the bare tier alias or the full resolved slot; CONTEXT says "raw slot string" — return the tier/slot BEFORE alias-map expansion so Phase 53 can read `;effort` off it.

## Spawn / Shell-Safety Audit (DECISION 1 verification ask)

**Finding: SAFE — no spawn/install path passes a combined `model;effort` token through an unquoted shell.** [VERIFIED: codebase grep]

Evidence:
- Workflows resolve models via `MODEL=$($GSD_SDK query resolve-model <agent> | jq -r '.model')` (e.g. `ai-integration-phase.md:44-47`, `secure-phase.md:38`, `ui-phase.md:51`). `cmdResolveModel` returns the ALREADY-PARSED `.model` (the `;effort` is stripped by `parseModelEffort` inside the resolver before serialization). The shell variable therefore only ever holds the bare model string.
- `Agent(model="{executor_model}")` in `execute-phase.md:555-558` and `:1397` interpolates the resolved (parsed) model, never the raw catalog slot.
- The combined `model;effort` token lives only in `model-catalog.json` / `config.json` (read as JSON, never echoed to a shell).
- `bin/install.js` references `resolveModelInternal` returning the model string only (`install.js:9875`); the Codex `model_reasoning_effort` emit (Phase 57 work) writes to TOML, not a shell command line.

**Planner note:** This invariant holds ONLY because `resolveModelInternal` returns `.model` (DECISION 3). If any future code serializes the raw slot to a shell, the `;` becomes a command separator. Add a regression assertion that `cmdResolveModel` / `resolve-model` JSON `.model` never contains a `;`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Colon delimiter `model:effort` + allowlist heuristic to avoid shredding IDs | Semicolon `model;effort`, split on `lastIndexOf(';')` | 2026-05-31 (DECISION 1) | Colons never delimiters; typo detection becomes unambiguous |
| Two copy-pasted tier-resolution blocks (`core.cjs:1285-1307` & `1484-1500`) | Single `_resolveAgentSlot` helper | Phase 52 (this) | Structurally removes the #3023 divergence class |

**Deprecated/outdated:** Any `model:effort` reference in older research drafts or `SUMMARY.md:12,71,95` (which still say `lastIndexOf(':')`) is SUPERSEDED by DECISION 1 — use `;`. CONTEXT.md and ROADMAP.md are authoritative.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `_resolveAgentSlot` should return the tier/slot BEFORE alias-map expansion (so Phase 53 can read `;effort`) | Code Examples / Pattern 3 | If wrong, Phase 53 re-derives the slot, partially re-opening the #3023 duplication. Planner should confirm with the Phase 53 design intent. |
| A2 | The shared fixture can live at `tests/fixtures/parse-model-effort.json` and be read from `sdk/src/*.test.ts` via a relative climb | Pitfall 5 | If the SDK vitest config excludes paths outside `sdk/`, fixture must move under `sdk/shared/` or a symlink. Verify by running both suites. |
| A3 | Reusing/extending the existing `_warnedConfigKeys` reset semantics is acceptable for the effort warn cache | Pattern 1 | Low — a separate `_warnedEffortLabels` Set + its own reset is equally valid. |

## Open Questions (RESOLVED)

1. **Does `_resolveAgentSlot` return the bare tier alias or the fully-resolved (post-runtime-override, post-alias-map) slot?**
   - What we know: CONTEXT says "the single raw slot string"; Phase 53 needs the `;effort` suffix intact.
   - What's unclear: Whether "raw slot" means the profile/phase-type tier value (`opus`, `opus;high`) or the runtime-resolved entry model.
   - Recommendation: Return the tier/slot value as read from `models[phaseType]` / `MODEL_PROFILES[agent][profile]` (pre-alias-map), since that is where a `;effort` suffix would live. Confirm against the Phase 53 effort-resolver plan.
   - **RESOLVED:** Plan 02 Task 2 returns the slot value BEFORE alias-map expansion (pre-alias-map tier/slot string), matching recommendation A1 so Phase 53 reads `;effort` directly off it.

2. **Fixture location reachable by both runners.**
   - Recommendation: Try `tests/fixtures/parse-model-effort.json`; if vitest can't resolve it, fall back to `sdk/shared/` (proven readable by both today).
   - **RESOLVED:** Plan 03 Task 1 places the fixture at `tests/fixtures/parse-model-effort.json`; Plan 03 Task 2 makes both-runner reachability an empirical acceptance criterion, with the `sdk/shared/` fallback as the documented contingency if vitest cannot resolve the relative climb.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `node --test` runner | ✓ | >=20 (CI: 22/24) | — |
| vitest | SDK parser parity test | ✓ | ^3.1.1 (SDK devDep) | — |

No missing dependencies. No external services.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` (CJS) for `core.cjs`; vitest ^3.1.1 for `sdk/src` |
| Config file | `vitest.config.ts` (root), `sdk/vitest.config.ts` (SDK); no config for node --test |
| Quick run command | `node --test tests/parse-model-effort.test.cjs` |
| Full suite command | `npm test` (root) + SDK vitest run |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARSE-01 | `opus;high`→`{opus,high}`; `opus;hihg`→`{opus,null}`+warn; provider-colon ID unchanged | unit | `node --test tests/parse-model-effort.test.cjs` | ❌ Wave 0 |
| PARSE-02 | bare string → `{string, null}` | unit | same | ❌ Wave 0 |
| PARSE-03 | `_resolveAgentSlot` returns one slot; `resolveModelInternal` golden snapshot byte-identical | unit/regression | `node --test tests/parse-model-effort.test.cjs` + existing `feat-3023` suite | ❌ Wave 0 (new) / ✅ (regression suite exists) |
| PARSE-04 | CJS and TS parsers return identical `{model,effort}` for every shared-fixture case | parity | `node --test ...` + `vitest run sdk/src/parse-model-effort.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test tests/parse-model-effort.test.cjs`
- **Per wave merge:** `npm test` + SDK vitest
- **Phase gate:** Full suite green (including unchanged `feat-3023-model-phase-types.test.cjs`, `model-profiles.test.cjs`) before `/gsd-verify-work`; ≥70% line coverage on `bin/lib/*.cjs` maintained.

### Wave 0 Gaps
- [ ] `tests/fixtures/parse-model-effort.json` — shared parity fixture (DECISION 4 cases)
- [ ] `tests/parse-model-effort.test.cjs` — CJS parser + `_resolveAgentSlot` + golden-snapshot regression (PARSE-01/02/03)
- [ ] `sdk/src/parse-model-effort.test.ts` — vitest parity suite loading the SAME fixture (PARSE-04)
- [ ] Confirm `_resetRuntimeWarningCacheForTests` (or a new effort-cache reset) is exported for warn-once testing

*(Framework already installed — no install step.)*

## Security Domain

`security_enforcement` is not disabled in research scope, but Phase 52 has no auth/session/crypto/network surface. The only adjacent control:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `parseModelEffort` validates the effort suffix against the `{low,medium,high,xhigh,max}` allowlist; non-token suffixes are rejected (stripped + warn), never passed through |
| V2/V3/V4/V6 | no | No authn/session/access-control/crypto in scope |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Shell injection via `;` in a model token reaching an unquoted shell | Tampering / Elevation | DECISION 1 + Spawn/Shell-Safety Audit: the `;` is parsed out before serialization; `resolve-model` returns `.model` only. Add a regression asserting `.model` contains no `;`. |
| Arbitrary effort token reaching a runtime | Tampering | Allowlist validation in the parser (V5) |

## Sources

### Primary (HIGH confidence)
- `get-shit-done/bin/lib/core.cjs` — `resolveModelInternal` (1267-1354), `resolveReasoningEffortInternal` (1454-1504), `resolveTierEntry` (1236), `_warnedConfigKeys` warn pattern (1154-1211), exports block (1861-1900), imports (9-10)
- `get-shit-done/bin/lib/model-profiles.cjs` — source of `MODEL_PROFILES`, `AGENT_TO_PHASE_TYPE`
- `sdk/src/model-catalog.ts` (1-70) — TS mirror structure, existing exported helpers, `../shared/model-catalog.json` read pattern
- `tests/feat-3023-model-phase-types.test.cjs` — existing resolver test conventions (import sources, structural assertions)
- `get-shit-done/workflows/*.md` (`ai-integration-phase`, `secure-phase`, `ui-phase`, `execute-phase`) — `resolve-model | jq -r '.model'` shell usage (Shell-Safety Audit)
- `.planning/REQUIREMENTS.md` (PARSE-01..04), `.planning/ROADMAP.md` (Phase 52, 311-320), `.planning/phases/52-parser-foundation/52-CONTEXT.md` (DECISIONS 1-4)
- `.planning/research/{PITFALLS,ARCHITECTURE,SUMMARY}.md`

### Secondary (MEDIUM confidence)
- `bin/install.js:9875` — `resolveModelInternal` returns model string (Codex emit is Phase 57)

## Metadata

**Confidence breakdown:**
- Parser algorithm: HIGH — canonical code in PITFALLS.md + CONTEXT decisions; all branches enumerated
- `_resolveAgentSlot` extraction: HIGH — both duplicated blocks read directly; the non-identical `VALID_TIERS`/`inherit` subtlety surfaced
- Shell-safety (DECISION 1): HIGH — verified `resolve-model | jq .model` returns parsed model; `;` never reaches shell
- Fixture location: MEDIUM — both-runner reachability needs a one-time empirical check (A2)

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable internal refactor; source line numbers may drift with intervening commits)
