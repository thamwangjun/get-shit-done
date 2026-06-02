# Phase 55: Catalog Schema + User Handover - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 55 widens the catalog schema in two files so that profile slots can hold `model;effort` strings:
1. `sdk/shared/model-catalog.json` — `AgentCatalogEntry` profile slots (`golden`/`balanced`/`budget`) and `adaptiveTierMap` values widen to accept inline `model;effort` labels (CATALOG-01)
2. `sdk/src/model-catalog.ts` — TypeScript mirror widens to match (CATALOG-03)

Then: **USER-HANDOVER** — the user hand-assigns per-agent effort values across all 33 agents' slots (CATALOG-02). Claude builds plumbing only; Claude does NOT pre-fill effort values.

After handover: a completeness-check plan step confirms all 33 agents have a non-empty `effort` field via the Phase 53 resolver (CATALOG-02 success criterion 4).

**Back-compat invariant (inherited from Phase 53/54):** On a bare catalog (no `;effort` suffixes), every resolved effort is `null` — zero behavior change. The plumbing is inert until the user assigns values.

**In scope:** Schema/type widening (CATALOG-01, CATALOG-03), handover instruction step, post-handover completeness check.
**Out of scope:** Pre-filling effort values (user-owned), spawn-template wiring (Phase 56), install translation (Phase 57), full regression suite (Phase 58).

</domain>

<decisions>
## Implementation Decisions

### Profile slot type widening (CATALOG-01 / CATALOG-03)
- **D-01 (LOCKED):** `AgentCatalogEntry.golden`, `.balanced`, `.budget` widen from `'opus' | 'sonnet' | 'haiku'` to **`string`**. Plain widening — `parseModelEffort` is the authoritative runtime validator; the downstream `MODEL_PROFILES` type is already `Record<string, Record<string, string>>`. No template literal union required.
- **D-02 (LOCKED):** `adaptiveTierMap` value type widens from `'opus' | 'sonnet' | 'haiku'` to **`string`** in parallel (CATALOG-01 explicitly includes adaptiveTierMap entries). Precedence note for planner/executor: the adaptive slot resolves at step 3 of the precedence chain alongside per-agent profile slots — tier-level effort is same-precedence, not a fallback. This must be documented in a comment in the catalog or type file so Phase 58 regression writers know.
- **D-03:** JSON side (`model-catalog.json`) requires no structural change — profile slot values are already strings in JSON. The schema widening is purely a TypeScript type change. A comment in the JSON file (or adjacent to the `AgentCatalogEntry` interface in the TS) should note that slots accept `model;effort` form.

### Handover verification (CATALOG-02 / success criterion 4)
- **D-04 (LOCKED):** Post-handover verification uses a **completeness check**: a node one-liner (or inline script in the plan step) reads the filled `sdk/shared/model-catalog.json` and asserts that, for every agent entry, `resolveReasoningEffortInternal` returns a non-null effort. This is a plan step Claude writes, executed by the user after CATALOG-02 assignment. It confirms all 33 agents have a non-empty `effort` field — auditable, uses the existing Phase 53 resolver, no new test file. Full semantic correctness (e.g., `heavy` agents with `high` effort) is Phase 58 scope.
- **D-05:** The handover plan step must include the guidance heuristic from ROADMAP.md for the user: `heavy routingTier → high, standard → medium, light → none/low`; higher is not monotonically better; `inherit` stays effort-free; the heuristic is advisory, not enforced.

### Claude's Discretion
- Exact placement of the `model;effort` comment in `model-catalog.json` vs `model-catalog.ts` (either location is fine; wherever is most discoverable to a user editing the JSON)
- Whether to use a node one-liner or a short inline script for the completeness check (whichever is less surprising to a user running it manually)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — CATALOG-01, CATALOG-02, CATALOG-03 requirements; also EXPOSE-01/02/03 for Phase 54 context (inert until CATALOG-02 completes)
- `.planning/ROADMAP.md` §"Phase 55: Catalog Schema + User Handover" — goal, USER-HANDOVER boundary note, 4 success criteria, guidance heuristic for CATALOG-02

### Prior phase decisions (carry forward — DO NOT re-litigate)
- `.planning/phases/52-parser-foundation/52-CONTEXT.md` — DECISION 1 (`;` as delimiter, not `:`), DECISION 2 (lastIndexOf split), DECISION 3 (EFFORT_TOKENS set)
- `.planning/phases/53-unified-effort-resolver/53-CONTEXT.md` — resolver decisions: precedence chain, `{claude,codex}` allowlist gate, `max` verbatim on Claude / clamp at Codex emit boundary, back-compat invariant
- `.planning/phases/54-sdk-tools-json-exposure/54-CONTEXT.md` — D-01 (explicit-null contract), D-04 (`effort` field name), D-06 (blanket `*_effort` sibling coverage), D-07 (SDK resolver port)

### Source files to modify
- `sdk/shared/model-catalog.json` — profile slot values and `adaptiveTierMap` values remain strings in JSON; add a comment noting `model;effort` syntax is accepted; do NOT pre-fill effort values (CATALOG-02 is user-owned)
- `sdk/src/model-catalog.ts` — `AgentCatalogEntry` interface: widen `golden`, `balanced`, `budget` from `'opus' | 'sonnet' | 'haiku'` to `string`; widen `adaptiveTierMap` value type in `ModelCatalog` interface from `'opus' | 'sonnet' | 'haiku'` to `string`; add inline note about precedence (D-02)

### Resolver (read-only reference, no changes needed)
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal` (Phase 53 built; no changes in Phase 55)
- `sdk/src/query/config-query.ts` — SDK resolver port (Phase 54 built); adaptive path at line ~307 already calls `parseModelEffort` on the tier alias value — widening the catalog type is sufficient

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseModelEffort(label)` (`sdk/src/model-catalog.ts`) — already handles `model;effort` strings via `lastIndexOf(';')`; validates effort tokens against `EFFORT_TOKENS`; returns `{ model, effort: null }` for bare labels. No changes needed.
- `resolveReasoningEffortInternal(cwd, agentType)` (`get-shit-done/bin/lib/core.cjs`) — already reads profile slots and returns the parsed effort. No changes needed.
- `resolve-model` CLI (`gsd-tools.cjs query resolve-model <agent>`) — already emits canonical `effort` field (Phase 54). Use this in the completeness check step.

### Established Patterns
- Profile slot values in `model-catalog.json` are already plain strings in JSON format — `"golden": "opus"`. Widening to accept `"golden": "opus;medium"` requires no JSON structural change, only a TS type change and a comment.
- `AgentCatalogEntry` is the single source of truth for per-agent tier assignments. The 33 agents are listed under `agents` key in `sdk/shared/model-catalog.json`.

### Integration Points
- Phase 53 resolver reads `agents[agentType][profileSlot]` from the catalog — will transparently parse `"opus;medium"` once typed as `string`
- Phase 54 init JSON exposure will emit `effort: null` for bare slots (back-compat) and the assigned effort after handover — no Phase 54 changes needed

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the decisions captured above. Standard TypeScript `string` widening approach applies.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 55-Catalog Schema + User Handover*
*Context gathered: 2026-06-02*
