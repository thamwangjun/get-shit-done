# Stack Research — Per-Agent Thinking Effort (v2.1.0-e)

**Domain:** Cross-runtime reasoning/effort control plumbing for the GSD agent-spawn layer
**Researched:** 2026-05-31
**Confidence:** HIGH (Claude + Codex param semantics verified against current vendor docs; Gemini analogous; OpenCode/Qwen/Copilot inferred from runtime architecture)

This is an **internal-API** research task, not a package-dependency task. No new npm packages are required. The "stack" here is the set of vendor reasoning-control parameters the feature must target, plus the existing GSD machinery that already resolves model + effort. The template's package tables are adapted to document **param semantics and accepted value sets** the planner needs to wire spawn calls.

---

## 1. Claude effort vs thinking vs taskBudget — the three distinct controls

These are **three orthogonal parameters**. The feature targets exactly one of them (`effort`). Do NOT conflate.

| Control | Where it lives | What it sets | Accepted values | Use in this feature |
|---------|----------------|--------------|-----------------|---------------------|
| **`effort`** | API: `output_config.effort`; Claude Code: `effortLevel` setting + skill/subagent frontmatter `effort:` | Soft ceiling + bias on how much Claude reasons AND how aggressively it uses tools (reads extra files, runs extra commands before acting) | `low`, `medium`, `high` (default), `xhigh`, `max` | **THIS is the target.** Canonical 5-level vocabulary. |
| **`thinking`** (ThinkingConfig) | API: `thinking={"type": "adaptive"}` (or legacy `enabled`/budget) | Whether extended/interleaved thinking is on, and the reasoning *mode* (adaptive vs fixed-budget). Enables thinking *between* tool calls. | `{"type":"adaptive"}`, `{"type":"enabled","budget_tokens":N}` | **Out of scope.** A separate axis (mode), not effort magnitude. Do not set. |
| **`taskBudget`** / `max_tokens` | API request | Hard cap on total output tokens (thinking + text). | integer token count | **Out of scope.** A hard limit, not a reasoning dial. Do not add. |

**Key distinctions for the planner:**
- `effort` is a *soft* guidance dial; `max_tokens`/taskBudget is a *hard* cap. They are complementary but independent — encoding effort does not require touching token budgets.
- `effort` and `thinking` are independent: effort sets *how much*, adaptive thinking sets *the mode*. The feature sets only `effort`.
- **Claude default is `high` on all surfaces** (API + Claude Code). A passed value overrides the default. → Omitting effort (bare `model` label) is therefore safely backward-compatible: the runtime applies its `high` default.

**Claude Code surface specifics (load-bearing for spawn templates):**
- `effortLevel` in settings accepts only `low`, `medium`, `high`, `xhigh`. **`max` and `ultracode` are session-only and rejected in the settings file.**
- **Subagent/skill frontmatter accepts `effort:`** to override effort when that subagent/skill runs. This is the documented mechanism for per-agent effort — aligns directly with GSD's per-agent model-catalog design.
- `ultracode` is NOT a sixth level — it pairs `xhigh` with auto multi-agent permission. Ignore for mapping.
- The `ultrathink` keyword is an in-context prompt nudge; it does NOT change the API effort value. Not a parameter; ignore.

**`max` caveat (confirm during planning):** `max` is a valid *API* effort value but is **session-only / rejected in the Claude Code `effortLevel` settings file**. Whether `max` is accepted in *subagent frontmatter* is not explicitly documented. The feature's canonical vocabulary includes `max`, but on the Claude Code install path `max` may need to be treated like `xhigh` (or passed only via the SDK `effort` param, not settings). Flag for the planner: verify `max` acceptance in subagent frontmatter before emitting it there.

## 2. `@anthropic-ai/claude-agent-sdk` `query()` — per-spawn effort surface

| Question | Finding | Confidence |
|----------|---------|------------|
| Does the Agent/Task tool accept an `effort` param per subagent spawn? | **Partially / emerging.** Per-subagent `effort` via the Task tool is an area of active development (open feature request anthropics/claude-code#25669 to add `effort` + optional thinking config to Task-tool subagent spawns, aligned to `AgentDefinition`). The **documented, available** per-agent mechanism today is **subagent/skill markdown frontmatter `effort:`** — which GSD already uses for its install-time agent files. | MEDIUM |
| Where does effort live in the raw API? | `output_config.effort` (sibling to `thinking`). Not a top-level `query()` field. | HIGH |
| Recommendation | Drive per-agent effort through the **frontmatter `effort:` field** (the supported, stable path) rather than a programmatic Task-tool argument that may not yet exist in the installed SDK version. GSD spawns agents from markdown, so frontmatter is the natural carrier. | — |

**Implication:** The GSD plumbing should resolve an `effort` string and surface it (a) in init/agent-skills JSON for orchestrators, and (b) into agent-file frontmatter / spawn templates — matching how `model` is already threaded. It should NOT assume a `query({ effort })` programmatic field exists; treat the frontmatter path as authoritative.

## 3. Codex `reasoning_effort` vocabulary and ceiling — confirms `max`→`xhigh`

| Property | Finding | Confidence |
|----------|---------|------------|
| Config key | `model_reasoning_effort` (config.toml / `-c model_reasoning_effort=…` / `/effort` TUI) | HIGH |
| Accepted values | `minimal`, `low`, `medium` (default), `high`, `xhigh` | HIGH |
| **Ceiling** | **`xhigh` IS the top level. `max` does NOT exist in Codex.** | HIGH |
| Aliases | `extra_high` / `extra-high` normalize to `xhigh` | MEDIUM |
| Model caveat | `gpt-5.4-mini` (the catalog's codex **haiku** tier) does **not** support `xhigh` — supports only `minimal`/`low`/`medium`/`high`. The catalog already sets haiku→`medium`, so this is safe. **Do not map any effort to `xhigh` on the haiku/`gpt-5.4-mini` tier.** | HIGH |

**Mapping confirmed:** Claude `max` → Codex `xhigh` is correct and required (Codex has no `max`). Note the asymmetry below.

### Claude→Codex effort mapping table (canonical Claude vocabulary is source of truth)

| Claude (canonical) | Codex | Notes |
|--------------------|-------|-------|
| `low` | `low` | direct |
| `medium` | `medium` | direct (Codex default) |
| `high` | `high` | direct |
| `xhigh` | `xhigh` | direct (Codex ceiling) |
| `max` | `xhigh` | **collapse** — Codex has no `max`; ceiling clamp |
| *(omitted)* | *(omit; tier default applies)* | bare model label stays effort-free |

Codex also exposes `minimal` (below `low`); the Claude vocabulary has no equivalent, so `minimal` is never produced by this mapping. Per PROJECT.md, **profile-slot effort overrides the catalog's per-tier `reasoning_effort`** when present; when the label is bare, the existing per-tier Codex `reasoning_effort` continues to apply (backward-compatible).

## 4. Per-runtime applicability — which runtimes get an effort mapping

| Runtime | Has analogous control? | Param / vocabulary | GSD action |
|---------|------------------------|--------------------|------------|
| **claude** | Yes (native) | `effort`: low/medium/high/xhigh/max (frontmatter accepts low–xhigh; `max` API-only) | **Canonical.** Emit `effort:` in frontmatter / spawn. |
| **codex** | Yes | `model_reasoning_effort`: minimal/low/medium/high/xhigh | **Map** per table above; `max`→`xhigh`. Already in `runtimeTierDefaults.codex`. |
| **gemini** | Yes (different model) | `thinkingLevel` (ThinkingConfig): LOW/MEDIUM/HIGH (Pro); Flash adds minimal/medium. OpenAI-compat layer maps `reasoning_effort`→`thinkingLevel`. | **Defer / omit for now.** Vocabulary differs (3-level, model-dependent; gemini-3-pro rejects MEDIUM on some paths). Not in current allowlist. Mapping is *possible* but is a distinct value set — flag as optional future extension, not v2.1.0-e scope. |
| **opencode** | Indirect (proxies Anthropic models) | Routes `anthropic/claude-*`; effort would flow via the underlying Anthropic API `effort`, but OpenCode's config surface for it is not GSD-modeled. | **Omit.** Not in `RUNTIMES_WITH_REASONING_EFFORT`; no GSD-owned emit path today. |
| **qwen** | Model-dependent / not GSD-modeled | No GSD-tracked effort field; catalog entries carry `model` only. | **Omit.** |
| **copilot** | No GSD-owned effort surface | Catalog entries `model` only. | **Omit.** |
| **hermes / kilo / cline / cursor / windsurf / augment / trae / codebuddy / antigravity** | No (catalog tiers null or model-only) | — | **Omit.** |

**The allowlist gate (`RUNTIMES_WITH_REASONING_EFFORT`) is the single switch.** It currently admits only runtimes whose install path actually consumes `reasoning_effort` — today that is **codex** (the only runtime with `reasoning_effort` entries in `runtimeTierDefaults`, detected dynamically by `runtimesWithReasoningEffort()` in `sdk/src/model-catalog.ts:64`). For v2.1.0-e, per PROJECT.md, the Claude block in `resolveReasoningEffortInternal` is **lifted** so Claude effort resolves natively; the allowlist stops gating Claude out. Gemini stays omitted unless explicitly added.

---

## Existing machinery to extend (NOT rebuild)

| Asset | Role | v2.1.0-e change |
|-------|------|-----------------|
| `sdk/shared/model-catalog.json` | `runtimeTierDefaults.codex.*.reasoning_effort` (xhigh/medium) already present | Add inline effort to profile slots / `adaptiveTierMap`; profile-slot effort becomes source of truth |
| `sdk/src/model-catalog.ts` | TS mirror; `reasoning_effort?` field + `runtimesWithReasoningEffort()` (line 64) | Extend to surface resolved per-agent effort |
| `get-shit-done/bin/lib/core.cjs:1454` `resolveReasoningEffortInternal` | Resolves effort; gated to non-Claude via `RUNTIMES_WITH_REASONING_EFFORT` (core.cjs:1463) | **Lift Claude gating**; profile-slot effort overrides Codex per-tier; `max`→`xhigh` on Codex emit |
| `get-shit-done/bin/lib/commands.cjs:243-250` | Already exposes `model` + `reasoning_effort` in init/agent-skills JSON | Surface resolved `effort` (unified) |
| `core.cjs:1267` `resolveModelInternal` | Model resolution; effort must mirror its tier lookup (per #3023 comment) | Parser splits `model;effort`; keep tier-lookup parity |

## What NOT to use / NOT to add

| Avoid | Why | Instead |
|-------|-----|---------|
| `taskBudget` / `max_tokens` to express effort | Hard token cap, orthogonal to reasoning dial; would conflate magnitude with truncation | Use `effort` only |
| `thinking` / ThinkingConfig (`adaptive`) | Separate axis (mode, not magnitude); enabling it changes behavior beyond effort | Leave untouched; set only `effort` |
| `ultracode` / `ultrathink` as effort levels | Not API effort levels (permission mode / prompt keyword respectively) | Stick to low/medium/high/xhigh/max |
| Codex `max` | Does not exist in Codex (ceiling is `xhigh`) | Map Claude `max`→`xhigh` |
| `xhigh` on codex haiku tier (`gpt-5.4-mini`) | Model rejects `xhigh` | Keep haiku→`medium` (already set) |
| A new parallel effort resolver | Duplicates `resolveReasoningEffortInternal` | Lift/extend the existing function |
| Programmatic `query({ effort })` assumption | Per-subagent Task-tool effort param is an open feature request, not stable SDK surface | Carry effort via subagent **frontmatter `effort:`** |
| Gemini effort mapping in this milestone | 3-level model-dependent vocabulary differs; out of allowlist | Omit; flag as optional future extension |

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Claude effort vocabulary (5 levels, default high) | HIGH | platform.claude.com effort + adaptive-thinking docs, code.claude.com model-config |
| effort vs thinking vs taskBudget distinction | HIGH | Same vendor docs (separate `output_config.effort`, `thinking`, `max_tokens`) |
| Claude Code `effortLevel` rejects `max`/`ultracode`; frontmatter `effort:` exists | HIGH (settings) / MEDIUM (`max` in frontmatter unverified) | code.claude.com model-config |
| Per-subagent programmatic effort = emerging | MEDIUM | anthropics/claude-code#25669 (open) |
| Codex ceiling = `xhigh`, no `max`; default medium; gpt-5.4-mini no xhigh | HIGH | developers.openai.com Codex config-sample + reasoning guide; openai/codex issues |
| Gemini `thinkingLevel` LOW/MEDIUM/HIGH | HIGH | ai.google.dev gemini-3 / thinking docs |
| OpenCode/Qwen/Copilot omit | MEDIUM | Inferred from catalog (model-only entries, no `reasoning_effort`) + allowlist design |

## Sources

- [Effort — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Adaptive thinking — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Model configuration — Claude Code Docs](https://code.claude.com/docs/en/model-config)
- [Feature: effort/thinking configuration for Task tool subagents (anthropics/claude-code#25669)](https://github.com/anthropics/claude-code/issues/25669)
- [Sample Configuration — Codex | OpenAI Developers](https://developers.openai.com/codex/config-sample)
- [Reasoning models | OpenAI API](https://developers.openai.com/api/docs/guides/reasoning)
- [Models And Reasoning — Codex SDK](https://hexdocs.pm/codex_sdk/07-models-and-reasoning.html)
- [Codex automation reasoning effort issue (openai/codex#13536)](https://github.com/openai/codex/issues/13536)
- [Gemini 3 Developer Guide — generateContent API](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Gemini thinking — generateContent API](https://ai.google.dev/gemini-api/docs/thinking)
