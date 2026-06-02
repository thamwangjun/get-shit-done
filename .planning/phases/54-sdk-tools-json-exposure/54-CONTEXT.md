# Phase 54: SDK & Tools JSON Exposure - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 54 makes the resolved effort from Phase 53's unified resolver **observable in JSON**. It adds:
1. A `*_effort` sibling for every resolved `*_model` field in the init JSON consumed by workflows (EXPOSE-01).
2. A canonical resolved `effort` field in `cmdResolveModel` / agent-skills output (EXPOSE-02).
3. Byte-identical model+effort JSON shapes between the SDK (`sdk/src/`) and CLI (`bin/lib/`), verified by a parity test (EXPOSE-03).

**Back-compat invariant (load-bearing, inherited from Phase 53):** On a bare catalog (no `;effort` suffixes assigned — the state until the Phase 55 user handover), every exposed effort value resolves to `null` → zero behavior change in resolved models. This is the exposure layer only; live effort values are hand-assigned by the user in Phase 55. The plumbing is inert until then.

**In scope:** JSON exposure (init siblings + canonical `effort` field), SDK effort-resolution port to match the CLI, and the SDK↔CLI parity test.
**Out of scope:** Catalog schema widening + user hand-assignment (Phase 55), spawn-template wiring / Codex install translation (Phase 56), the milestone-wide regression suite (Phase 58).

</domain>

<decisions>
## Implementation Decisions

### Null Representation (EXPOSE-01 / SC#4)
- **D-01 (LOCKED):** Effort fields are **always present with an explicit `null`** on a bare catalog — NOT omitted. Every `*_model` gets a visible `*_effort` sibling (value `null` until catalog assignment), and `cmdResolveModel` / agent-skills always emit a canonical `effort` field (value `null` when unresolved). This gives a uniform, self-documenting contract: a consumer never has to distinguish "absent" from "null."
- **D-02 (consequence — chosen with eyes open):** Explicit-null **adds new keys** to bare-catalog init/resolve JSON. This is *additive* (no existing field value changes) but **not byte-identical** to pre-change JSON. **Downstream note for Phase 58:** the "additive-only" golden assertion MUST compare existing-field *values* (which stay identical) and treat the new `null` effort siblings as an additive superset — NOT whole-JSON byte-equality against a pre-milestone snapshot. The snapshot strategy must account for the new keys.
- **D-03:** This changes `cmdResolveModel` (`commands.cjs:250`) from the current omit-when-falsy (`if (reasoningEffort) result.reasoning_effort = ...`) to always-emit (`result.effort = reasoningEffort ?? null`).

### Field Naming (EXPOSE-01 / EXPOSE-02)
- **D-04 (LOCKED):** The canonical field name is **`effort`**. In `cmdResolveModel` / agent-skills output the field is `effort`; in init context objects the siblings are `<role>_effort` (derivation rule: replace the `_model` suffix with `_effort`, e.g. `executor_model` → `executor_effort`).
- **D-05:** **Rename** the existing `reasoning_effort` field in `cmdResolveModel` output to `effort`. Safe: no GSD consumer reads `reasoning_effort` from resolve-model output (verified — `commands/`, `get-shit-done/workflows/`, `agents/` have zero references; the Codex install path in `bin/install.js` resolves its own `reasoning_effort` from the catalog `runtimeTierDefaults`, independent of `cmdResolveModel`). One canonical name across both surfaces; no dual emission / alias.

### Sibling Coverage (EXPOSE-01)
- **D-06 (LOCKED):** **Blanket coverage** — every `*_model` field in every init context builder (`init.cjs`: `executor_model`, `verifier_model`, `researcher_model`, `planner_model`, `checker_model`, `synthesizer_model`, `roadmapper_model`, `mapper_model`, across all builders) gets a `*_effort` sibling, derived from the **same agent** via `resolveReasoningEffortInternal`. Uniform contract coherent with D-01 (explicit null); no special-casing for Phase 56 spawn-templates to reason about.

### Parity Mechanism (EXPOSE-03)
- **D-07 (LOCKED):** **Port the minimal effort-resolution logic into the SDK** (`sdk/src/query/` — `resolveModel` in `config-query.ts` and the `init` handler) so the SDK emits identical `effort` / `*_effort` fields to the CLI. The SDK currently has only the `parseModelEffort` building block (`sdk/src/model-catalog.ts`); it needs the resolver shape ported to match `resolveReasoningEffortInternal`.
- **D-08:** **Reuse the existing read-only golden parity harness** (`sdk/src/golden/read-only-parity.integration.test.ts` + `init-golden-normalize.ts` + golden rows) — extend it to cover the new effort fields rather than building a parallel parity mechanism. Reuses Phase 52's cross-language fixture precedent. A dedicated effort-parity fixture is only a fallback if the golden harness cannot cover the `resolve-model` surface.

### Claude's Discretion
- Exact internal structure of the SDK effort-resolver port, helper extraction, and where the `?? null` defaulting lives — planner/executor's call, provided: explicit-null contract (D-01/D-03), `effort` naming + rename (D-04/D-05), blanket sibling coverage (D-06), and SDK↔CLI byte-identical shapes (D-07/D-08) all hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — EXPOSE-01, EXPOSE-02, EXPOSE-03 (locked requirements for this phase)
- `.planning/ROADMAP.md` §"Phase 54: SDK & Tools JSON Exposure" — goal, depends-on (Phase 53), the 4 success criteria

### Prior phase decisions (carry forward — DO NOT re-litigate)
- `.planning/phases/53-unified-effort-resolver/53-CONTEXT.md` — the unified resolver this phase exposes; D-01..D-08 there (precedence chain, `{claude,codex}` allowlist gate, `max` verbatim on Claude / clamp at Codex emit boundary, warn-and-degrade, back-compat invariant)
- `.planning/phases/52-parser-foundation/52-CONTEXT.md` — DECISION 1 (`;` delimiter), DECISION 4 (cross-language parity fixture precedent reused by D-08)
- `.planning/research/ARCHITECTURE.md` — precedence-chain table, same-slot derivation
- `.planning/research/PITFALLS.md` — Pitfall 3 (#3023 model/effort divergence — siblings must derive from the same agent slot)

### Source to modify
- `get-shit-done/bin/lib/init.cjs` — add `*_effort` siblings next to every `*_model` (~lines 197-198, 343-345, 530-532, 583-585, 640-643, 762-763, 1096, 1552-1553), each via `resolveReasoningEffortInternal(cwd, <same agent>)`, value defaulted to `null` (D-01/D-06)
- `get-shit-done/bin/lib/commands.cjs` — `cmdResolveModel` (~236-251): rename `reasoning_effort` → `effort`, always emit (`?? null`) (D-03/D-04/D-05)
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal` (Phase 53) is the resolver consumed; no behavior change, only new call sites
- `sdk/src/query/config-query.ts` — SDK `resolveModel`: port effort resolution + emit `effort` (D-07)
- `sdk/src/query/` init handler — emit `*_effort` siblings to match CLI init (D-07)
- `sdk/src/model-catalog.ts` — has `parseModelEffort` / `runtimesWithReasoningEffort` building blocks; extend as needed for the resolver port
- `sdk/src/golden/read-only-parity.integration.test.ts`, `sdk/src/golden/init-golden-normalize.ts`, golden rows — extend to cover effort fields (D-08)
- Agent-skills output path (`init.cjs` agent_skills builder / the resolve-model surface) — include canonical `effort` (EXPOSE-02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolveReasoningEffortInternal(cwd, agentType)` (`core.cjs`, Phase 53) — the unified resolver. Every new init sibling and the `effort` field call this with the SAME agent as the adjacent `*_model` (same-slot invariant, avoids #3023 divergence).
- `resolveModelInternal(cwd, agentType)` (`core.cjs`) — the existing model resolver each `*_model` already uses; the `*_effort` sibling pairs with it 1:1.
- `parseModelEffort` + `runtimesWithReasoningEffort` (`sdk/src/model-catalog.ts`) — SDK building blocks for the D-07 resolver port.

### Established Patterns
- `cmdResolveModel` (`commands.cjs:236-252`) already resolves effort and conditionally emits `reasoning_effort` — D-03 flips it to always-emit `effort`.
- Read-only golden parity harness (`sdk/src/golden/`) already compares SDK↔CLI query-handler output (incl. init) — the EXPOSE-03 vehicle (D-08).
- `bin/install.js` Codex emit (`~2743-2749`) consumes catalog `reasoning_effort` independently — confirms the `cmdResolveModel` rename is safe and the install path is out of scope here (Phase 56).

### Integration Points
- Every init context builder in `init.cjs` (workflow-specific result objects) is an exposure point — blanket coverage (D-06) touches all of them.
- SDK `resolveModel` (`sdk/src/query/config-query.ts`) and init handler must mirror the CLI shape exactly for the parity test to pass (D-07).

</code_context>

<specifics>
## Specific Ideas

- User chose **explicit null over omit** deliberately (against the byte-identical-snapshot recommendation), prioritizing a uniform self-documenting contract where every `*_model` has a visible `*_effort` sibling. The trade-off (Phase 58 snapshot must assert additive-superset, not byte-equality) was surfaced and accepted — see D-02.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Adjacent concerns are already downstream phases: catalog widening + user hand-assignment (Phase 55), spawn-template wiring + Codex install translation (Phase 56), milestone-wide regression suite (Phase 58).

</deferred>

---

*Phase: 54-sdk-tools-json-exposure*
*Context gathered: 2026-06-02*
