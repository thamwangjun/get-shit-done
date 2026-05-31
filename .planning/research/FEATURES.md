# Feature Research

**Domain:** Per-agent thinking/reasoning-effort dimension for GSD (v2.1.0-e)
**Researched:** 2026-05-31
**Confidence:** HIGH (effort semantics verified against Anthropic + OpenAI official docs; GSD machinery verified against `core.cjs`)

## Effort-Level Behavior Primer (Question 1)

Effort is a **soft behavioral signal, not a hard cap.** On both major runtimes it steers how many internal "thinking" tokens the model allocates before answering. It does *not* hard-limit output (`max_tokens` still does that on Claude; the model may still think on a complex task even at low effort). This framing matters for GSD: raising an agent's effort biases toward deeper reasoning but does not guarantee it, and never overrides the hard token ceiling.

| GSD level | Claude adaptive-thinking mapping | Codex `reasoning_effort` mapping | What changes behaviorally | Realistic tradeoff for a GSD user |
|-----------|----------------------------------|----------------------------------|---------------------------|-----------------------------------|
| `low` | low effort — Claude may skip thinking on simple sub-tasks | `low` | Minimal reasoning tokens; fastest; near non-reasoning behavior on easy work | Cheapest + fastest. Risk: shallow plans, missed edge cases on hard agents (planner, debugger). Good for light agents (doc-classifier, plan-checker). |
| `medium` | medium — Anthropic's recommended Sonnet default | `medium` (Codex default) | Balanced point on the latency/quality curve | Best default. Both Anthropic and OpenAI recommend medium as the balance point. Most agents want this or no effort at all. |
| `high` | high — Claude almost always thinks (adaptive default) | `high` | Deep multi-step reasoning; notably more reasoning tokens | Higher latency + cost. Worth it for heavy agents (planner, roadmapper, security-auditor, framework-selector). Diminishing returns vs. medium on simple work. |
| `xhigh` | maps to high on Claude (no distinct xhigh tier exists) | `xhigh` | Hardest async/eval-grade reasoning | Codex-native. On Claude, `xhigh` collapses to high. Reserve for genuinely hardest planning/eval tasks. |
| `max` | high (Claude ceiling) | maps to `xhigh` (Codex ceiling) | Maximum the runtime supports | GSD's portable "give me the most this runtime offers" token. `max`→`xhigh` on Codex is already specified in the milestone. |

**Hard tradeoff numbers (verified):** Artificial Analysis measured up to a **23x** token-usage/cost difference between high and minimal on GPT-5, with most intelligence gain landing between minimal→medium and **less uplift between medium→high.** A request at xhigh can cost 3–5x a low request. Anthropic notes Claude bills for *full* thinking tokens even though only a summary is returned — so effort directly drives spend even when invisible.

**Counterintuitive finding (drives an anti-feature):** higher effort is *not* monotonically better. OpenAI warns that on tasks with weak stopping criteria or open-ended tool access, high effort causes **overthinking, tangential tool-calling, and quality regressions.** Several agentic workflows behave *better* at low/medium. GSD should not default agents to high, and should treat effort as a per-agent tuned value, not a global "more is better" dial.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Backward-compat: bare model = no effort = param omitted | Every existing config/catalog slot is a bare model id; effort must be purely additive. A bare `opus` must spawn identically to today. | LOW | Parser returns `effort: null` for bare tokens; spawn templates emit `effort` only when non-null. Mirrors existing `resolveReasoningEffortInternal` returning `null`. |
| `model;effort` label parse + validation | Core syntax of the milestone. Malformed tokens (`opus:huge`) must be rejected, not silently passed to a runtime. | MEDIUM | Split on `:`; validate effort ∈ {low,medium,high,xhigh,max}; reject otherwise. Validation is an explicit milestone requirement. |
| Per-agent default effort in catalog slots | Heavy agents (planner) want high by default; light agents (plan-checker) want none. The catalog already encodes per-agent tiers — effort rides alongside. | MEDIUM | Encode inline in `model-catalog.json` profile slots + `adaptiveTierMap`. `inherit` stays effort-free (user-assigned via handover). |
| Config-override precedence | Users already override models via `model_overrides.<agent>` and `models.<phase-type>`. Effort must flow through the **same** precedence chain, not a parallel one. | MEDIUM | Accept `model;effort` in all override sites. Per-agent override wins (matches `resolveModelForTier` step 1 and `resolveReasoningEffortInternal` early-return on override). |
| Omit-when-absent at spawn time | Passing an effort param to a runtime that resolved no effort would change behavior for untouched agents. Absence must be transparent. | LOW | Spawn templates conditionally include `effort`. Same discipline as `resolveReasoningEffortInternal` (returns `null` → caller omits). |
| Codex mapping preserved (`max`→`xhigh`) | Codex already has a working `reasoning_effort` path; the unified effort must map onto it without regressing the existing per-tier defaults. | MEDIUM | Profile-slot effort becomes single source of truth and **overrides** Codex per-tier `reasoning_effort`. `max`→`xhigh`. Lift the Claude block in `resolveReasoningEffortInternal`. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Claude-first effort exposure | Anthropic now makes adaptive thinking *mandatory* on Opus 4.7+ and recommends medium as Sonnet's default. GSD exposing effort for Claude (today Codex-only) aligns with platform direction and unlocks tuned reasoning depth per agent on the primary runtime. | MEDIUM | The headline differentiator. Removes the "never returns a value for Claude" guard in `resolveReasoningEffortInternal`; profile-slot effort becomes runtime-agnostic. |
| Per-phase-type effort | `models.<phase-type>` already lets users tune by phase; effort-per-phase lets them say "all planning agents think hard, all verification agents stay fast" in one line. | MEDIUM | `resolveReasoningEffortInternal` already does phase-type tier lookup (#3023). Extend it to read effort from the phase-type override token. Reuse existing `AGENT_TO_PHASE_TYPE` map. |
| Per-runtime effort override | `model_profile_overrides.<runtime>` lets a user say "on Codex go xhigh, on Claude go medium" — same task, different runtime economics. | MEDIUM | Accept `model;effort` in `model_profile_overrides.<runtime>`. Natural extension of existing per-runtime tier override. |
| Resolved effort surfaced in init/agent-skills JSON | Orchestrators and the SDK can display/log the resolved effort, making the otherwise-invisible reasoning spend observable. | LOW-MEDIUM | Add `effort` to init + agent-skills JSON (`core.cjs`, `commands.cjs`, `gsd-tools.cjs`, `sdk/src/model-catalog.ts`). Pure plumbing. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Forcing effort on runtimes that don't support it** | "Just always pass effort everywhere for consistency." | Most catalog runtimes (kilo, cline, cursor, windsurf, augment, trae, codebuddy, antigravity — all `null` tiers) and Claude pre-4.6 have no effort knob. Passing it leaks an unknown param or errors. `resolveReasoningEffortInternal` already gates on `RUNTIMES_WITH_REASONING_EFFORT` for exactly this reason. | Keep a strict runtime allowlist. Effort resolves to `null` (omitted) for unsupported runtimes. Add runtimes to the allowlist explicitly, never via override bypass. |
| **`custom_profiles` block** | "Let me define my own named effort presets beyond the 5 levels." | Explicitly OUT of scope this milestone (PROJECT.md line 24). Adds a config-schema surface, validation, and precedence interactions that aren't needed to ship inline effort. | The 5 fixed levels + per-agent/phase/runtime overrides already give full control. Defer named presets to a future milestone if demand emerges. |
| **Coupling effort to `taskBudget` / token budgets** | "Higher effort should auto-raise the token budget." | Conflates two orthogonal controls. Anthropic is explicit: effort is a *soft signal*, `max_tokens` is the *hard cap* — they "work together" but are tuned independently. Auto-coupling removes the user's ability to cap cost while raising reasoning depth, and re-introduces the deprecated budget-token model the platforms are moving away from. | Keep effort and any budget independent. Document that `max_tokens` remains the hard ceiling; effort only shapes internal allocation. |
| **Defaulting all agents to `high`** | "Maxing reasoning makes everything smarter." | False. Verified: medium→high yields *less* uplift than minimal→medium, costs up to 23x more, and high effort causes overthinking / tangential tool-calling / quality regressions on open-ended agentic tasks. | Hand-assign per-agent effort during handover (heavy agents high, light agents none/low, default medium). Effort is a tuned per-agent value, not a global dial. |
| **Effort escalation inside `dynamic_routing`** | "If a tier escalates on retry, bump effort too." | `dynamic_routing` escalates the *tier* (haiku→sonnet→opus) on failure; the escalated tier already carries its own slot effort. Adding a *separate* effort-escalation axis multiplies the state space (tier × effort attempts), complicates `resolveModelForTier`, and is not in milestone scope. The escalated tier's own effort is the right behavior. | Let effort ride the resolved tier. When `resolveModelForTier` escalates to a higher tier, that tier's catalog slot supplies its effort automatically — no separate escalation counter. (See dependency note below.) |

## Feature Dependencies

```
model;effort label parser + validation
    └──required by──> per-agent catalog default effort
    └──required by──> config-override precedence (model_overrides / models.<phase> / model_profile_overrides.<runtime>)
                           └──required by──> per-phase-type effort (differentiator)
                           └──required by──> per-runtime effort override (differentiator)

unified resolveReasoningEffortInternal (lift Claude guard)
    └──required by──> Claude-first effort exposure (differentiator)
    └──required by──> resolved effort in init/agent-skills JSON

omit-when-absent at spawn time ──enhances──> backward-compat (bare model)

dynamic_routing tier escalation ──interacts-with──> effort
    (effort rides the resolved tier; NO separate effort-escalation axis)
```

### Dependency Notes

- **Parser is the foundation:** every catalog default, every config override, and all validation depend on a single `model;effort` tokenizer. Build/verify it first.
- **Unified resolver gates the headline feature:** Claude-first exposure is literally "remove the `never returns for Claude` guard and make profile-slot effort runtime-agnostic" in `resolveReasoningEffortInternal`. Do this before phase/runtime override work so all override paths share one resolver.
- **dynamic_routing interplay (Question 3 — addressed):** GSD's existing `dynamic_routing` escalates *tiers* on failure via `resolveModelForTier` (default tier → `nextTier` up to `max_escalations`). Effort should **ride the resolved tier**, not get its own escalation counter. When the resolver picks a higher tier on retry, that tier's catalog slot already carries the appropriate (higher) effort. A separate effort-escalation axis is an anti-feature: it doubles the state space and isn't in scope. Clean integration point: after `resolveModelForTier` returns the (possibly escalated) tier, look up that tier's slot effort. Config note: `dynamic_routing` is disabled by default for backward-compat — so for the default user, effort is a purely static per-agent/phase value with zero escalation interaction.
- **Override precedence must mirror models, not invent a new chain:** per-agent override wins (matches `resolveModelForTier` step 1 and `resolveReasoningEffortInternal`'s override early-return); then phase-type; then profile-slot default. Reusing the existing chain keeps one mental model and avoids `model`/`effort` deriving from different sources (the bug `#3023`/`#3030` already fixed for Codex).

## MVP Definition

### Launch With (v1 — this milestone)

- [ ] `model;effort` parser + malformed-token validation — foundation for everything
- [ ] Backward-compat: bare model → `effort: null` → omitted at spawn — protects every existing config
- [ ] Per-agent catalog default effort (catalog slots + `adaptiveTierMap`; `inherit` stays effort-free) — user hand-assigns values via handover
- [ ] Unified `resolveReasoningEffortInternal` (lift Claude guard; profile-slot effort overrides Codex per-tier; `max`→`xhigh`) — the core resolution change
- [ ] Config-override acceptance in `model_overrides.<agent>`, `models.<phase-type>`, `model_profile_overrides.<runtime>` — same precedence as model resolution
- [ ] Resolved `effort` surfaced in init/agent-skills JSON (`core.cjs`, `commands.cjs`, `gsd-tools.cjs`, `sdk/src/model-catalog.ts`)
- [ ] Spawn templates across `agents/`, `commands/`, `get-shit-done/workflows/` pass `effort` conditionally (omit when absent)
- [ ] Regression coverage: parse / precedence / omit-when-absent / Codex `max`→`xhigh` mapping / unsupported-runtime gate

### Add After Validation (v1.x)

- [ ] Statusline / SDK display of resolved effort (observability polish, once core lands)
- [ ] Per-phase-type and per-runtime effort tuning guidance docs (the override sites ship in v1; curated guidance follows)

### Future Consideration (v2+)

- [ ] `custom_profiles` named-effort presets — explicitly deferred; ship only if the 5 fixed levels prove insufficient
- [ ] Effort-aware `dynamic_routing` (separate effort-escalation axis) — only if tier-riding effort proves inadequate in practice

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `model;effort` parser + validation | HIGH | LOW | P1 |
| Backward-compat / omit-when-absent | HIGH | LOW | P1 |
| Per-agent catalog default effort | HIGH | MEDIUM | P1 |
| Unified resolver (Claude-first + Codex `max`→`xhigh`) | HIGH | MEDIUM | P1 |
| Config-override precedence (3 sites) | HIGH | MEDIUM | P1 |
| Resolved effort in init/agent-skills JSON | MEDIUM | LOW | P1 |
| Spawn-template effort pass-through | HIGH | MEDIUM | P1 |
| Per-phase-type effort | MEDIUM | MEDIUM | P2 |
| Per-runtime effort override | MEDIUM | MEDIUM | P2 |
| Effort display in statusline/SDK | LOW | LOW | P3 |
| `custom_profiles` | LOW | HIGH | P3 (out of scope) |
| Effort-escalation in dynamic_routing | LOW | HIGH | P3 (anti-feature) |

**Priority key:** P1 = must have for this milestone · P2 = should have, add when possible · P3 = nice to have / deferred.

## Competitor / Platform Feature Analysis

| Feature | Anthropic (Claude) | OpenAI (GPT-5 / Codex) | GSD's Approach |
|---------|--------------------|-----------------------|----------------|
| Effort semantics | Adaptive thinking; effort = soft signal; mandatory on Opus 4.7+; medium recommended for Sonnet | `reasoning_effort`: none/low/medium/high/xhigh; medium default; soft signal | 5 levels {low,medium,high,xhigh,max}; `max`→`xhigh` on Codex; `xhigh`→high on Claude |
| Default | high (adaptive default; almost always thinks) | medium | Per-agent hand-assigned; bare model = no effort (omitted) |
| Hard cap interaction | `max_tokens` hard cap independent of effort | reasoning tokens billed; effort independent of output cap | Keep effort decoupled from any budget (anti-feature to couple) |
| "More is better"? | No — reserve thinking for genuinely complex tasks | No — high effort causes overthinking on open-ended tasks | Per-agent tuning; default medium/none, not high |
| Runtime support gating | N/A (single vendor) | N/A | Strict `RUNTIMES_WITH_REASONING_EFFORT` allowlist; null tiers omit effort |

## Sources

- [Adaptive thinking — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — effort as soft signal, medium default for Sonnet, mandatory on Opus 4.7+, interleaved thinking automatic in adaptive mode (HIGH)
- [Building with extended thinking — Claude Docs](https://docs.claude.com/en/docs/build-with-claude/extended-thinking) — budget deprecation, full-thinking-token billing, latency tradeoff (HIGH)
- [Reasoning models — OpenAI API](https://developers.openai.com/api/docs/guides/reasoning) — none/low/medium/high/xhigh levels, per-level guidance (HIGH)
- [GPT-5 Benchmarks and Analysis — Artificial Analysis](https://artificialanalysis.ai/articles/gpt-5-benchmarks-and-analysis) — 23x token/cost spread high vs minimal, diminishing medium→high uplift (HIGH)
- [GPT-5 prompting guide — OpenAI Cookbook](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide) — overthinking/regression warning, lower effort improves agentic behavior (HIGH)
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal`, `resolveModelForTier`, `dynamic_routing`, `RUNTIMES_WITH_REASONING_EFFORT` gate (HIGH — direct read)
- `sdk/shared/model-catalog.json` — profile slots, `adaptiveTierMap`, Codex per-tier `reasoning_effort`, null-tier runtimes (HIGH — direct read)
- `.planning/PROJECT.md` lines 11–24 — milestone scope, `custom_profiles` out of scope (HIGH — direct read)

---
*Feature research for: per-agent thinking-effort dimension (GSD v2.1.0-e)*
*Researched: 2026-05-31*
