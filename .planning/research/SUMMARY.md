# Project Research Summary

**Project:** GSD — Prompt-Engineered Fork, Milestone v2.1.0-e Per-Agent Thinking Effort
**Domain:** Internal model-routing machinery extension — `model:effort` inline label syntax for GSD's agent-spawn layer
**Researched:** 2026-05-31
**Confidence:** HIGH

## Executive Summary

This milestone adds a unified, Claude-first thinking-effort dimension to GSD's existing model-resolution machinery. The core design is strictly additive: encode effort inline in `model-catalog.json` profile slots as `model:effort` strings (e.g. `opus:high`), extend the existing `resolveReasoningEffortInternal` to cover Claude (not just Codex), surface resolved effort in init/agent-skills JSON, and wire it into spawn templates conditionally. No new infrastructure, no new npm dependencies — only targeted extension of four existing functions and the data they consume.

The foundational convergence across all four research threads is the same-slot derivation invariant: both `resolveModelInternal` and `resolveReasoningEffortInternal` must derive their respective fields from the **identical resolved tier slot**, via a single shared helper (`_resolveAgentSlot`) and a single parser (`parseModelEffort`). This directly prevents the #3023 class of model/effort divergence bugs, which have already shipped and been fixed twice. The parser has one non-obvious rule: split on `lastIndexOf(':')`, and strip the suffix ONLY when it is an exact member of `{low,medium,high,xhigh,max}` — this preserves fully-qualified provider IDs that legitimately contain colons (e.g. `openrouter:anthropic/claude-opus`).

The key risk is regression, not greenfield complexity. The system has a documented bug history (#2517, #2609, #3023, #3030, #3031), strict fork test gates (negative-framing 99/99, step-numbering 632/632, cross-file-refs 219/219, agent-frontmatter 155/155), and an explicit omit-when-absent contract that must hold for every runtime except the `{claude, codex}` allowlist. The build order is strongly dependency-sequenced: parser → shared slot resolver → unified effort resolver → SDK/tools JSON exposure → [USER HANDOVER: hand-assign catalog effort values] → spawn-template wiring → install-time translation → regression tests. Effort values in the catalog are user-assigned during handover; Claude builds plumbing only.

## Key Findings

### Recommended Stack

No new dependencies are required. The "stack" is the set of vendor reasoning-control parameters and the GSD functions that already consume them. Claude's `effort` (5 levels: `low`/`medium`/`high`/`xhigh`/`max`, delivered via subagent frontmatter `effort:` field) and Codex's `model_reasoning_effort` (5 levels: `minimal`/`low`/`medium`/`high`/`xhigh`, delivered via TOML) are the two surfaces in scope. All other runtimes (Gemini, OpenCode, Qwen, Copilot, and 8 null-tier runtimes) are explicitly excluded from effort emission for this milestone.

**Core surfaces:**
- **Claude subagent frontmatter `effort:`** — per-agent effort delivery; the stable, documented path; `max` and `ultracode` are session-only and rejected in settings files; `max` in frontmatter is unverified (flag for plan-time validation)
- **Codex `model_reasoning_effort`** — existing per-tier TOML field; `max`→`xhigh` at Codex emit boundary; `gpt-5.4-mini` (haiku tier) rejects `xhigh`, caps at `high`; catalog already sets haiku→`medium`
- **`get-shit-done/bin/lib/core.cjs`** — `resolveModelInternal` + `resolveReasoningEffortInternal` + NEW `parseModelEffort` + NEW `_resolveAgentSlot`; the entire resolution contract lives here
- **`sdk/shared/model-catalog.json` + `sdk/src/model-catalog.ts`** — single source of truth; profile slots widen from `'opus'|'sonnet'|'haiku'` literals to `string` to carry `model:effort`

**What NOT to use:**
- `thinking` / ThinkingConfig (`adaptive`) — separate axis (mode, not magnitude); do not touch
- `taskBudget` / `max_tokens` — hard cap, orthogonal to effort; do not couple
- `ultracode` / `ultrathink` — not API effort levels (permission mode / prompt keyword); ignore
- Codex `max` — does not exist; ceiling is `xhigh`; always map `max`→`xhigh` at Codex emit

### Expected Features

**Must have (table stakes):**
- `model:effort` parser with `lastIndexOf` rule + `{low,medium,high,xhigh,max}` allowlist validation — foundation for everything; bare model returns `effort: null`
- Backward-compat: bare model label → `effort: null` → omit at spawn — all 17+ existing `model_overrides` carry bare aliases; zero behavior change required
- Unified `resolveReasoningEffortInternal` with Claude gate lifted — the headline feature; profile-slot effort becomes single source of truth; overrides Codex per-tier `reasoning_effort`
- `model:effort` accepted in all three config override sites: `model_overrides.<agent>`, `models.<phase-type>`, `model_profile_overrides.<runtime>`
- Resolved `effort` surfaced in init/agent-skills JSON (`core.cjs`, `commands.cjs`, `gsd-tools.cjs`, `sdk/src/model-catalog.ts`)
- Spawn templates pass `effort` conditionally to `Agent()` (omit when absent; positive-framing only)
- `max`→`xhigh` mapping at Codex TOML emit boundary

**Should have (competitive differentiators):**
- Per-phase-type effort: `models.<phase-type>` override carries effort inline — "all planning agents think hard, all verification agents stay fast"
- Per-runtime effort override: `model_profile_overrides.<runtime>` accepts `model:effort` — different runtime economics in one line
- Resolved effort visible in statusline / SDK display (observability polish)

**Defer (v2+):**
- `custom_profiles` named-effort presets — explicitly out of scope this milestone (PROJECT.md line 24); 5 fixed levels plus per-agent/phase/runtime overrides are sufficient
- Effort escalation inside `dynamic_routing` — effort rides the resolved tier automatically; a separate effort-escalation axis is an anti-feature that doubles state space

**Anti-features to reject explicitly:**
- Defaulting all agents to `high` — verified counterproductive; high effort causes overthinking/tangential tool-calling/quality regressions on open-ended agentic tasks; up to 23x cost vs minimal with diminishing medium→high uplift
- Coupling effort to `taskBudget`/`max_tokens` — orthogonal controls; coupling removes user's ability to cap cost while raising reasoning depth
- Effort emission on unsupported runtimes — strict `{claude, codex}` allowlist; all others return `null`

**User guidance for hand-assignment (handover boundary):**
- Heavy agents (planner, roadmapper, security-auditor): `high`
- Light agents (plan-checker, doc-classifier): `none` or `low`
- Default: `medium` (Anthropic's and OpenAI's recommended balance point)
- `max` is GSD's portable "give me the most this runtime offers" token — use sparingly for genuinely hardest planning/eval tasks only

### Architecture Approach

The architecture is extension, not addition. Both resolvers (`resolveModelInternal` and `resolveReasoningEffortInternal`) currently duplicate the tier-resolution precedence chain (core.cjs:1285–1307 vs 1468–1500) — that duplication is the #3023 divergence risk. The fix is to extract a shared `_resolveAgentSlot(cwd, agentType)` helper that returns the raw slot string (which may carry `:effort`), and have both resolvers call it then call `parseModelEffort(slot)` to derive their respective field. `resolveModelInternal` returns `.model` only (preserving its string contract). `resolveReasoningEffortInternal` returns `.effort` — after lifting the Claude gate and adding the Codex `max`→`xhigh` translation at the emit boundary, not inside the resolver.

**Major components and their changes:**

1. **`parseModelEffort(slot)` in `core.cjs`** — NEW pure helper; `lastIndexOf(':')` split + `{low,medium,high,xhigh,max}` allowlist validation; bare string → `{model, effort: null}`; invalid suffix → `{model: wholeslot, effort: null}` + warn
2. **`_resolveAgentSlot(cwd, agentType)` in `core.cjs`** — NEW shared tier-resolution helper; eliminates the copy-pasted precedence chain that is the #3023 origin site
3. **`resolveReasoningEffortInternal` in `core.cjs`** — LIFT Claude gate; read effort from `_resolveAgentSlot` result via `parseModelEffort`; profile-slot effort overrides Codex per-tier `reasoning_effort`
4. **`model-catalog.json` profile slots + `adaptiveTierMap`** — widen to `string`; user hand-assigns effort during handover; `inherit` stays effort-free
5. **`init.cjs` `*_effort` siblings** — every `*_model` field gains a `*_effort` sibling from the same resolver call
6. **`install.js` Codex emit** — translate canonical `effort` → `model_reasoning_effort`; `max`→`xhigh`; slot effort overrides per-tier default; omit guard preserved

**Key pattern: omit-when-absent.** Every emission site (spawn templates, Codex TOML, Claude frontmatter) uses a conditional guard. Resolved `null` means the parameter is omitted entirely — preserving exact backward-compatibility for every existing config.

**Translation boundary:** Canonical effort vocabulary (`low/medium/high/xhigh/max`) lives in the resolver output. Runtime translation (`effort`→`reasoning_effort`, `max`→`xhigh`) happens ONLY at install.js Codex TOML emit. The resolver never emits runtime-specific names.

**Precedence chain (effort mirrors model exactly):**

| Rank | Source | Effort derivation |
|------|--------|------------------|
| 1 | `config.model_overrides[agent]` | parse `:effort` off override string; none → omit |
| 2 | `config.models[phaseType]` slot | same slot's `:effort` |
| 3 | `MODEL_PROFILES[agent][profile]` slot | same slot's `:effort` |
| 4 | `model_profile_overrides[runtime][tier]` | `resolveTierEntry` effort; slot overrides Codex per-tier |
| 5 | `adaptiveTierMap[routingTier]` | adaptiveTierMap slot `:effort` |
| — | omit (bare model, `inherit`, no match) | omit |

### Critical Pitfalls

1. **Naive `split(':')` corrupts provider-qualified model IDs** — `openrouter:anthropic/claude-opus` would parse as `model=openrouter`, `effort=anthropic/claude-opus`. Use `lastIndexOf(':')` and strip suffix ONLY when it is an exact member of `{low,medium,high,xhigh,max}`. Test with `openrouter:anthropic/claude-opus` (expect: effort null), `anthropic/claude-opus-4-7:high` (expect: effort high), `vertex:gemini-3-pro` (expect: effort null). This test must land before any caller uses the parser.

2. **Model/effort divergence re-opened (the #3023 class)** — if model and effort are resolved through different code paths, a `models.<phase-type>` override changes the model tier but not the effort tier (or vice versa). Prevention: extract `_resolveAgentSlot` as a shared helper so both resolvers walk the identical precedence chain. Add a parity test: `{model_profile:'inherit', models:{execution:'opus'}}` must yield opus model AND opus effort from the same slot.

3. **Effort leaked to unsupported runtimes** — lifting the Claude gate without maintaining an explicit `{claude, codex}` allowlist would propagate effort to Gemini, OpenCode, and 8 null-tier runtimes that cannot accept it. The dynamic `RUNTIMES_WITH_REASONING_EFFORT` derivation becomes unsafe once Claude tier entries carry effort. Keep an explicit static allowlist; Gemini and OpenCode stay excluded.

4. **Backward-compat regressions on existing Codex effort and bare configs** — the catalog sets Codex `opus→xhigh`, `sonnet/haiku→medium` as per-tier defaults. Profile-slot effort overrides these ONLY when present; when the slot has no effort, Codex falls back to its catalog per-tier value (no behavior change for untouched configs). Build a pre-change all-agent golden snapshot for models; assert additive-only after.

5. **Fork gate failures in spawn-template edits** — editing `agents/`, `commands/`, `workflows/` for `effort=` wiring risks: negative-framing scanner (99/99), step-numbering scanner (632/632), cross-file-refs (219/219), agent-frontmatter (155/155), eta-syntax. Mitigations: phrase conditionals affirmatively ("Pass `effort=` only when resolved effort is present"), append effort adjacent to existing `model=` lines rather than inserting new numbered steps, use only `<%~ include() %>` eta syntax, keep frontmatter untouched.

6. **`indexOf`-as-boolean false-passes in tests** — effort tokens (`medium`, `high`) are short strings that already appear in the catalog as Codex defaults. Substring assertions false-pass trivially. Use strict equality on parsed structures (`assert.strictEqual(result.effort, 'high')`); confirm each new test fails RED before implementation lands.

## Implications for Roadmap

Based on research, the build order is strongly dependency-sequenced. Each phase is a prerequisite for the next; no phase can safely be reordered.

### Phase 1: Parser Foundation
**Rationale:** `parseModelEffort` has no dependencies and is the foundation for every subsequent phase. It must be correct and tested before any caller uses it — the colon-in-ID pitfall is a data-loss class bug that corrupts every model override if shipped broken.
**Delivers:** `parseModelEffort(slot)` in `core.cjs` + TS mirror in `model-catalog.ts`; exported; unit-tested including provider-prefixed colon IDs; `_resolveAgentSlot` helper extracted from duplicated precedence chain
**Addresses:** Table-stakes parse + validation; backward-compat bare model
**Avoids:** Pitfall 1 (naive split), Pitfall 6 (false-pass tests)

### Phase 2: Unified Effort Resolver
**Rationale:** With the shared slot helper and parser in place, lifting the Claude gate in `resolveReasoningEffortInternal` and wiring profile-slot effort as the single source of truth is the core resolution change. All override paths (per-agent, per-phase-type, per-runtime) share one resolver, preventing model/effort divergence.
**Delivers:** Rewritten `resolveReasoningEffortInternal` using `_resolveAgentSlot` + `parseModelEffort`; Claude gate lifted; profile-slot effort overrides Codex per-tier; `max`→`xhigh` at Codex emit boundary; all three config override sites accept `model:effort`
**Addresses:** Claude-first effort exposure (headline differentiator); unified resolution; per-phase-type and per-runtime effort overrides
**Avoids:** Pitfall 2 (#3023 divergence), Pitfall 3 (effort leak), Pitfall 4 (backward-compat Codex effort regression)

### Phase 3: SDK and Tools JSON Exposure
**Rationale:** Once resolution is correct, surfacing `effort` in init/agent-skills JSON makes it observable by orchestrators and consumable by spawn templates. This phase is plumbing that no-ops on a bare catalog — safe to ship before catalog effort values are assigned.
**Delivers:** `cmdResolveModel` gains canonical `effort` field; `init.cjs` `*_model` fields gain `*_effort` siblings; `sdk/src/model-catalog.ts` type widening + `parseModelEffort` TS helper; `gsd-tools.cjs` CLI surfaces effort
**Addresses:** Resolved effort in init/agent-skills JSON (P1 must-have); SDK observability
**Avoids:** Pitfall 4 (Codex per-tier preserved; no behavior change on bare catalog)

### Phase 4: [USER HANDOVER] Catalog Effort Assignment
**Rationale:** This is the explicit handover boundary. All plumbing before this point is inert against a bare catalog (every slot returns `effort: null`; every spawn omits effort; every runtime behaves identically to today). The user assigns `:effort` suffixes to `model-catalog.json` profile slots and `adaptiveTierMap` entries according to the heuristic: heavy agents → `high`; light agents → `none`/`low`; default → `medium`. `inherit` stays effort-free.
**Delivers:** Populated `model-catalog.json` with per-agent effort values; `adaptiveTierMap` entries carry effort (e.g. `"opus:high"` for heavy tier)
**Addresses:** Per-agent catalog default effort (P1 must-have)
**Avoids:** Anti-feature of defaulting all agents to `high`; anti-feature of treating effort as a global dial

### Phase 5: Spawn-Template Wiring
**Rationale:** With resolved effort surfaced in init JSON and catalog values assigned, spawn templates across `agents/`, `commands/`, `workflows/` can conditionally pass `effort` to `Agent()`. This phase touches the most files and carries the highest fork gate risk — run scanners throughout.
**Delivers:** Conditional `effort=<value>` lines in all `Agent()` spawn blocks (adjacent to `model=`, omitted when absent); positive-framing throughout; whole-integer step labels preserved
**Addresses:** Spawn-template effort pass-through (P1 must-have)
**Avoids:** Pitfall 5 (fork gate failures: negative-framing 99/99, step-numbering 632/632, cross-file-refs 219/219, frontmatter 155/155, eta-syntax)

### Phase 6: Install-Time Translation
**Rationale:** Codex TOML emit requires translating canonical effort to `model_reasoning_effort` with `max`→`xhigh`. This is the only place runtime-specific naming appears — keeps the resolver and spawn templates runtime-agnostic.
**Delivers:** `generateCodexAgentToml` emits `model_reasoning_effort` from slot effort (with `max`→`xhigh`, omit guard preserved); `readGsdRuntimeProfileResolver.resolve()` reads slot effort via `gsdResolveTierEntry` + `parseModelEffort`; slot effort overrides per-tier default
**Addresses:** Codex mapping preserved (`max`→`xhigh`); install-time translation
**Avoids:** Pitfall 3 (effort leak via install path), Pitfall 4 (Codex `max`→`xhigh` mapping)

### Phase 7: Regression Coverage
**Rationale:** Each prior phase has incremental tests; this phase adds the comprehensive regression suite — pre-change golden snapshot for all 33 agents, all profile variants, and all integration scenarios — to lock in the additive-only guarantee.
**Delivers:** Pre-change all-agent model golden snapshot (assert additive-only); parse regression fixtures (colon-in-ID, malformed suffix, bare model, `inherit`); precedence alignment tests (model and effort from same tier for every override site); Codex `max`→`xhigh` emit test; omit-contract tests per non-effort runtime; `indexOf`-as-boolean audit in new test files
**Addresses:** Regression coverage P1 requirement
**Avoids:** Pitfall 6 (false-pass tests); Pitfall 4 (golden snapshot catches any non-additive model change)

### Phase Ordering Rationale

- Parser (1) has zero dependencies and is the critical correctness foundation; every downstream phase calls it
- Shared slot extraction is bundled with the parser (Phase 1) because it refactors the exact code the effort resolver (Phase 2) must reuse — doing it first means Phase 2 has nothing to copy-paste
- Resolver (2) must precede JSON exposure (3) so the exposed values come from the correct unified path
- JSON exposure (3) must precede spawn-template wiring (5) so templates have an init JSON field to read
- Handover (4) is deliberately placed before spawn wiring (5): templates that reference `executor_effort` in init JSON will render empty (omitted) until catalog values are assigned; assigning them before spawn-template wiring means the first real integration test exercises live values
- Install translation (6) is independent of spawn wiring (5) but requires the resolver (2); can proceed in parallel with Phase 5 after Phase 3
- Regression coverage (7) spans all phases but the comprehensive cross-phase suite lands last

### Research Flags

Phases with verified patterns (skip additional research):
- **Phase 1 (Parser):** Algorithm fully specified in PITFALLS.md with canonical code; unit-testable in isolation
- **Phase 2 (Resolver):** All integration points read directly from source; #3023/#3030 fix pattern documented in code comments
- **Phase 3 (SDK/JSON):** `init.cjs` `*_model` builder locations listed explicitly (lines 197-198, 343-345, 530-532, 583-585, 640-643, 762-763, 1096, 1552-1553) in ARCHITECTURE.md
- **Phase 6 (Install):** Exact install.js line ranges documented (1449-1512, 2715-2755); emit pattern identical to existing `entry.reasoning_effort` guard
- **Phase 7 (Tests):** Test strategy fully specified in PITFALLS.md; no unknown territory

Phases needing verification at plan time:
- **Phase 2 (Resolver) — open item:** Whether Claude Code subagent frontmatter accepts `max` as an `effort:` value is unverified (the settings file rejects it; frontmatter behavior is undocumented). Verify before emitting `max` in frontmatter; fallback is to treat `max` as `xhigh` on the Claude spawn path as well.
- **Phase 5 (Spawn templates) — scope sizing:** The number of `Agent()` spawn blocks across `agents/`, `commands/`, `workflows/` that need conditional `effort=` wiring is not enumerated. Grep for `subagent_type` + `model=` patterns at plan time to scope the edit list before committing to a phase duration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (vendor params, accepted vocabularies) | HIGH | Claude effort docs + Codex config-sample verified; `max`→`xhigh` mapping confirmed; Codex haiku ceiling confirmed |
| Features (effort behavioral semantics, anti-features) | HIGH | Anthropic adaptive-thinking docs + OpenAI reasoning guide + Artificial Analysis 23x measurement; all verified against official sources |
| Architecture (exact functions, line ranges, data flow) | HIGH | All integration points read directly from source files; #3023/#3030 fix pattern verified in code comments |
| Pitfalls (regression risks, gate numbers) | HIGH | Grounded in actual source code + documented bug history; gate numbers (99/99, 632/632, 219/219, 155/155) verified against PROJECT.md |

**Overall confidence:** HIGH

### Gaps to Address

- **`max` in Claude Code subagent frontmatter:** Whether the `effort: max` value is accepted in agent `.md` frontmatter (distinct from the settings file where it is rejected) is unverified. Verify at Phase 2 plan time; if rejected, add `max`→`xhigh` clamp on the Claude spawn path as well as the Codex path.
- **Spawn-template edit scope:** The exact count of `Agent()` blocks needing `effort=` wiring is not pre-enumerated. Grep `agents/*.md`, `commands/gsd/*.md`, `get-shit-done/workflows/*.md` for `subagent_type` + `model=` at Phase 5 plan time to scope the work.
- **Per-subagent programmatic effort (Task tool `effort` argument):** GitHub issue anthropics/claude-code#25669 is open; the programmatic path is not yet stable. The frontmatter path is the authoritative mechanism for this milestone. If the Task-tool argument ships before this milestone lands, it is an optional enhancement, not a requirement.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/bin/lib/core.cjs` lines 1236–1504 — `resolveModelInternal`, `resolveReasoningEffortInternal`, `resolveTierEntry`, `RUNTIMES_WITH_REASONING_EFFORT`
- `get-shit-done/bin/lib/commands.cjs` lines 236–252 — `cmdResolveModel` shape
- `get-shit-done/bin/lib/init.cjs` lines 197–1553 — all `*_model` builder locations
- `sdk/shared/model-catalog.json` — profile slots, `adaptiveTierMap`, Codex per-tier defaults, null-tier runtimes
- `sdk/src/model-catalog.ts` — TS mirror, `runtimesWithReasoningEffort()` line 64
- `bin/install.js` lines 1449–1512, 2715–2755 — Codex TOML emit, `readGsdRuntimeProfileResolver`
- `.planning/PROJECT.md` — milestone v2.1.0-e scope, fork gate numbers, out-of-scope items
- [Effort — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Adaptive thinking — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Model configuration — Claude Code Docs](https://code.claude.com/docs/en/model-config)
- [Reasoning models — OpenAI API](https://developers.openai.com/api/docs/guides/reasoning)
- [Sample Configuration — Codex | OpenAI Developers](https://developers.openai.com/codex/config-sample)

### Secondary (MEDIUM confidence)

- [Feature: effort/thinking configuration for Task tool subagents (anthropics/claude-code#25669)](https://github.com/anthropics/claude-code/issues/25669) — per-subagent programmatic effort is emerging, not stable
- [GPT-5 Benchmarks and Analysis — Artificial Analysis](https://artificialanalysis.ai/articles/gpt-5-benchmarks-and-analysis) — 23x token/cost spread high vs minimal
- [GPT-5 prompting guide — OpenAI Cookbook](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide) — overthinking/regression warning at high effort
- [Codex automation reasoning effort issue (openai/codex#13536)](https://github.com/openai/codex/issues/13536)

### Tertiary (LOW confidence)

- OpenCode, Qwen, Copilot effort omission — inferred from catalog (model-only entries, no `reasoning_effort`) + allowlist design; not verified against vendor docs

---
*Research completed: 2026-05-31*
*Ready for roadmap: yes*
