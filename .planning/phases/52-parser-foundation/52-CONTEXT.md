# Phase 52: Parser Foundation — Context

**Phase:** 52
**Created:** 2026-05-31
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
Phase 52 delivers the foundational parsing layer for inline thinking-effort labels: a pure, exported `parseModelEffort` parser and a shared `_resolveAgentSlot(cwd, agentType)` helper, so the model resolver and the (Phase 53) effort resolver always derive from the **identical** resolved tier slot. This structurally eliminates the #3023 model/effort divergence class. Scope is the parser + slot helper + the model resolver's refactor to consume them; the effort resolver itself is Phase 53.
</domain>

<decisions>

### DECISION 1 — Effort delimiter is `;`, NOT `:` (milestone-wide, supersedes prior research/roadmap)

The effort suffix is joined to the model with a **semicolon**: `model;effort` (e.g. `opus;high`), not a colon.

**Why:** Provider IDs legitimately contain colons (`openrouter:anthropic/claude-opus`, `bedrock:us.anthropic...`, `vertex:gemini-3-pro`). A colon delimiter forced an allowlist-suffix heuristic to avoid shredding those IDs (the original Pitfall 1). A semicolon is never present in a real model ID, so colons are *never* delimiters and the ambiguity disappears entirely. As a bonus, this makes the malformed-suffix case unambiguous (see DECISION 2).

**How to apply:** Split on `lastIndexOf(';')` everywhere — `core.cjs`, `sdk/src/model-catalog.ts`, and any install-time path. The combined `model;effort` string lives **only** in catalog JSON / config and is parsed immediately into separate fields; it must never reach a raw shell where `;` is a command separator. **Planner to verify** no spawn/install code path passes a combined `model;effort` token through an unquoted shell context.

**Impact:** This decision was propagated on 2026-05-31 to `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` (PARSE-01 + delimiter note), and `.planning/research/{PITFALLS,ARCHITECTURE,SUMMARY,FEATURES,STACK}.md`. All `model:effort` references in those artifacts now read `model;effort`.

### DECISION 2 — `parseModelEffort` warns on a malformed effort suffix (warn-inside-parser)

When a `;` is present but the suffix is NOT an exact member of `{low, medium, high, xhigh, max}` (e.g. `opus;hihg`):
- strip to the **base model** (the part before the last `;`) → `opus`
- return `effort: null` (graceful degradation — the model still resolves)
- emit a **one-time** typo warning (Set-tracked, matching the existing `_warnedConfigKeys` pattern)

**Why:** Because a `;` never appears in a legitimate model ID, a non-token suffix after `;` is unambiguously a user typo — there is no provider-ID false-positive to worry about (unlike the colon case). Surfacing it early at parse time catches typos before they silently become "effort omitted." The user explicitly chose warn-inside-parser over a silent pure function.

**How to apply:** The warning lives inside `parseModelEffort` itself. Keep the warn side-effect identical between the cjs and ts implementations (so parity tests of the `{model, effort}` return value still match — warnings are a side channel, not part of the returned shape). A label with **no `;`** never warns (bare models and provider-colon IDs are valid).

### DECISION 3 — Phase 52 refactors `resolveModelInternal` to consume `_resolveAgentSlot` now

Phase 52 does NOT just add standalone helpers. It extracts the duplicated phase-type-tier lookup (currently copy-pasted at `core.cjs:1285-1307` vs `1468-1500`) into a single `_resolveAgentSlot(cwd, agentType)` returning the raw slot string, AND refactors `resolveModelInternal` to call it then `parseModelEffort(slot)`, returning `.model` only (preserving its existing string return contract).

**Why:** Proves the same-slot path end-to-end within this phase and removes the #3023 copy-paste immediately rather than leaving it one phase longer. Matches ROADMAP Phase 52 success criterion #3. Phase 53 then adds `resolveReasoningEffortInternal` on the same helper.

**How to apply:** `resolveModelInternal`'s observable behavior must be unchanged for all existing (bare) configs — verified by a pre-change golden snapshot (TEST-01 territory, but a behavior-preservation assertion belongs in this phase's tests). The `model_overrides.<agent>` path must run `parseModelEffort` on the override string too, but a bare full ID (`openai/gpt-5.4`, no `;`) still omits effort.

### DECISION 4 — Cross-language parity via a shared JSON fixture table

The `core.cjs` (`node --test`) parser test and the `sdk/src/model-catalog.ts` (vitest) parser test both load **one** shared JSON fixture file of `{ input, expectedModel, expectedEffort }` cases. Adding an edge case updates both languages at once.

**Why:** Single source of truth for parity cases; prevents the two case-lists from silently drifting — the exact failure PARSE-04 parity is meant to prevent.

**How to apply:** Planner to choose a fixture location readable by both runners (a `.json` under a shared/test fixtures path). Cases must include: bare model, `opus;high`, every valid effort token, a provider-colon ID (`openrouter:anthropic/claude-opus` → unchanged, `effort: null`), and the `opus;hihg` typo case.

</decisions>

<canonical_refs>
Downstream researcher/planner MUST read these (full relative paths):

- `.planning/REQUIREMENTS.md` — PARSE-01..04 (locked requirements; includes the delimiter decision note)
- `.planning/ROADMAP.md` — Phase 52 goal + success criteria (lines ~311-320)
- `.planning/research/PITFALLS.md` — Pitfall 1 (delimiter, now RESOLVED), Pitfall 3 (#3023 divergence)
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (same-slot derivation), Pattern 2 (parser placement), the precedence-chain table
- `.planning/research/SUMMARY.md` — milestone overview + Phase 52 deliverable note
- Source to modify: `get-shit-done/bin/lib/core.cjs` (parser + `_resolveAgentSlot` near `resolveTierEntry` ~line 1236; `resolveModelInternal` ~1270-1353)
- Source to mirror: `sdk/src/model-catalog.ts`
</canonical_refs>

<code_context>
- **Parser placement:** `core.cjs` near `resolveTierEntry` (~line 1236), exported from the module's `module.exports` block.
- **Duplicated tier lookup to extract:** `core.cjs:1285-1307` (model resolver) and `core.cjs:1468-1500` (effort resolver, Phase 53) — `_resolveAgentSlot` replaces both.
- **Effort allowlist:** `{low, medium, high, xhigh, max}` (canonical resolver values; `max`→`xhigh` translation happens only at the Codex emit boundary in later phases, never in the parser).
- **Warn pattern to mirror:** existing `_warnedConfigKeys` Set-based one-time warning in `core.cjs`.
- **TS mirror:** `sdk/src/model-catalog.ts` already exists and carries `MODEL_PROFILES`; the parser is reimplemented there with identical semantics.
- **Back-compat invariant:** bare catalog/config → every slot `effort: null` → zero behavior change. This must hold after Phase 52's `resolveModelInternal` refactor.
</code_context>

<deferred>
- None raised this discussion. (Effort *resolution*, config-override acceptance, SDK/JSON exposure, catalog widening, spawn wiring, and install translation are already scoped as Phases 53-58 — not deferred, just downstream.)
</deferred>
