# Phase 53: Unified Effort Resolver - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 53 builds `resolveReasoningEffortInternal` into a **unified effort resolver** for the `claude` and `codex` runtimes. It lifts the Claude gate via an explicit static `{claude, codex}` allowlist, follows the **identical** precedence chain as the model resolver (reusing Phase 52's `_resolveAgentSlot` + `parseModelEffort`), and accepts `model;effort` in all three config override sites (`model_overrides.<agent>`, `models.<phase-type>`, `model_profile_overrides.<runtime>`).

**Back-compat invariant (load-bearing):** On a bare catalog/config (no `;effort` suffixes assigned — the state until the Phase 55 user handover), every slot resolves to `effort: null` → zero behavior change. This must hold after Phase 53's rewrite. This is plumbing only; live effort values are hand-assigned by the user in Phase 55.

Scope is the resolver + config-override acceptance + validation routing. SDK/JSON exposure is Phase 54; catalog widening + user handover is Phase 55.
</domain>

<decisions>
## Implementation Decisions

### Per-Agent Override + Effort Interaction (RESOLVE-02 / CONFIG-01)
- **D-01:** When `model_overrides.<agent>` carries an effort suffix (e.g. `"opus;high"`), run `parseModelEffort(override)` and emit the parsed `.effort` as the **highest-precedence** effort. A bare override (no `;`, e.g. `"openai/gpt-5.4"`) still omits effort. This removes the current early-`null` at `core.cjs:1545` (the old "any override ⇒ omit effort" behavior).
- **D-02 (reconciliation, LOCKED by RESOLVE-05):** The `{claude, codex}` allowlist remains the **outermost gate** regardless of the override. The override's parsed effort emits only *within* that gate. A non-`{claude,codex}` install (e.g. `opencode`) with `model_overrides.x = "model;high"` still omits effort — RESOLVE-05's hard no-op for the 8 null-tier runtimes is absolute and is never bypassed by an override suffix.

### Claude `max` Ceiling (RESOLVE-04 / plan-time verification)
- **D-03:** Plan-time verification is **resolved**: `max` is a valid Claude effort level (per user, with docs — supported on Claude Opus 4.8, Mythos Preview, Opus 4.7, Opus 4.6, Sonnet 4.6). Therefore **emit `max` verbatim on the Claude path — NO `max`→`xhigh` clamp for Claude.** The `max`→`xhigh` clamp (RESOLVE-04) applies to the **Codex emit boundary only**, and `xhigh` is still never emitted for the Codex haiku tier (`gpt-5.4-mini`).
- **D-04 (downstream note, not Phase 53 scope):** `max` requires a capable model. If a user later assigns `max` to a weaker Claude tier in the catalog, that mismatch is a **Phase 55 catalog-assignment** concern — the Phase 53 plumbing emits whatever effort the resolved slot carries without per-model capability checks.

### Config Validation Strictness (CONFIG-04)
- **D-05:** Malformed effort tokens (e.g. `opus;hihg`) in any of the three config sites use **warn + graceful degrade**: one-time warning (Set-tracked, mirroring `_warnedConfigKeys`), strip to base model, `effort: null` — config still resolves. Consistent with the existing tier-typo handling (`core.cjs:1199`) and Phase 52's warn-inside-parser (DECISION 2). **No separate hard-reject validation pass.** CONFIG-04 is satisfied by routing all three config sites' slot strings through `parseModelEffort` so the existing warn-and-degrade fires uniformly.

### Resolver Refactor Shape (RESOLVE-01..03)
- **D-06:** **Full rewrite** of `resolveReasoningEffortInternal` to a single precedence chain:
  1. per-agent override → `parseModelEffort(override).effort` (D-01/D-02)
  2. phase-type / profile slot → `_resolveAgentSlot(cwd, agentType)` then `parseModelEffort(slot).effort` (Phase 52 same-slot invariant — #3023 fix)
  3. Codex per-tier `runtimeTierDefaults.codex.<tier>.reasoning_effort` → **fallback only** when the resolved slot carries no effort suffix (RESOLVE-03: profile-slot effort overrides the per-tier value)
  4. omit (`inherit` profile, bare adaptive entries, resolved `inherit`/unknown tier → `null`) (RESOLVE-06)
- **D-07:** Swap the **data-derived** `RUNTIMES_WITH_REASONING_EFFORT` (currently computed by scanning `runtimeTierDefaults` for any tier carrying `reasoning_effort` — `model-catalog.cjs:87-91`) for an **explicit static `{claude, codex}` allowlist** (RESOLVE-01). The data-derived set is exactly the anti-pattern RESOLVE-01 forbids.
- **D-08:** Eliminate the duplicated phase-type tier lookup at `core.cjs:~1563-1577` (the block Phase 52 removed from the model resolver) by consuming the shared `_resolveAgentSlot`. A **behavior-preserving golden snapshot** test guards bare configs across both resolvers (model + effort stay aligned on the same slot).

### Claude's Discretion
- Exact internal structure of the rewritten function, helper extraction, and Codex `max`→`xhigh` clamp placement (at the Codex emit boundary) — planner/executor's call, provided the precedence chain (D-06), allowlist gate (D-02/D-07), and back-compat invariant hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — RESOLVE-01..06, CONFIG-01..04 (locked requirements for this phase)
- `.planning/ROADMAP.md` §"Phase 53: Unified Effort Resolver" (lines ~333-347) — goal, depends-on (Phase 52), success criteria, plan-time verification note

### Prior phase decisions (carry forward — DO NOT re-litigate)
- `.planning/phases/52-parser-foundation/52-CONTEXT.md` — DECISION 1 (`;` delimiter, not `:`), DECISION 2 (warn-inside-parser), DECISION 3 (`_resolveAgentSlot` extraction + `resolveModelInternal` consumes it), DECISION 4 (cross-language parity fixture)
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (same-slot derivation), the precedence-chain table
- `.planning/research/PITFALLS.md` — Pitfall 3 (#3023 model/effort divergence)
- `.planning/research/SUMMARY.md` — milestone overview

### Source to modify
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal` (~1533-1583, full rewrite); `_resolveAgentSlot` (~1340), `parseModelEffort` (~1242), `resolveModelInternal` (~1363) as the model-side reference; `_resolveRuntimeTier` (~1318) for Codex per-tier fallback
- `get-shit-done/bin/lib/model-catalog.cjs` — `RUNTIMES_WITH_REASONING_EFFORT` (~87-91, replace data-derived Set with static `{claude, codex}`)
- `get-shit-done/bin/lib/config.cjs` — config-site validation routing for the three override sites (CONFIG-01..04)
- `sdk/src/model-catalog.ts` — TS mirror; keep parity if effort resolution surfaces there (confirm scope vs Phase 54)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_resolveAgentSlot(cwd, agentType)` (`core.cjs:1340`) — Phase 52's shared slot helper; returns the raw tier/slot string. The effort resolver MUST consume this (same-slot invariant) rather than re-deriving the phase-type tier.
- `parseModelEffort(label)` (`core.cjs:1242`) — splits on `lastIndexOf(';')`, returns `{model, effort}`, warns once on malformed suffix. Use for both the override path and the slot path.
- `_resolveRuntimeTier(config, tier)` (`core.cjs:1318`) — returns `{model, reasoning_effort?}`; supplies the Codex per-tier `reasoning_effort` fallback (RESOLVE-03).
- `_warnedConfigKeys` Set (`core.cjs:1154`) — one-time-warning pattern to mirror for CONFIG-04.

### Established Patterns
- Model resolver precedence (`resolveModelInternal`, `core.cjs:1363-1433`): per-agent override → `_resolveAgentSlot` → runtime resolution → profile lookup. The effort resolver mirrors steps 1-2 exactly, then layers the Codex per-tier fallback and the `{claude,codex}` allowlist gate.
- `max`→`xhigh` translation happens **only at the Codex emit boundary**, never in the parser (Phase 52 code_context); Claude emits `max` verbatim (D-03).

### Integration Points
- `RUNTIMES_WITH_REASONING_EFFORT` is imported into `core.cjs:10` and exported `core.cjs:1964` — changing it from data-derived to static touches `model-catalog.cjs` and any test asserting its membership.
- Current early-`null` on per-agent override (`core.cjs:1545`) is removed by D-01 — check callers/tests asserting "override ⇒ no effort."

</code_context>

<specifics>
## Specific Ideas

- User-supplied authoritative fact: `max` is a documented, valid Claude effort level (Opus 4.8 / Mythos Preview / Opus 4.7 / Opus 4.6 / Sonnet 4.6). This closes the ROADMAP plan-time-verification item — no Claude-side clamp needed.

</specifics>

<deferred>
## Deferred Ideas

- Per-model `max` capability validation (warn when `max` assigned to a Claude tier whose model doesn't support it) — belongs to Phase 55 catalog assignment, not Phase 53 plumbing (D-04).
- SDK/JSON exposure of resolved effort — Phase 54 (EXPOSE-01..03).
- Catalog schema widening + user hand-assignment of effort values — Phase 55 (CATALOG-01..03).

None of the above are scope creep — they are already downstream phases.

</deferred>

---

*Phase: 53-unified-effort-resolver*
*Context gathered: 2026-06-01*
