# Session Findings: GSD Agent and Model Profile System

## Overview

This document captures session research on GSD's 33 agents, their complexity groupings, routing tiers, the 5 model profiles, the override precedence chain, phase types, the thinking/effort system, and runtime-specific model overrides. It is intended as a standalone reference for later work on per-agent effort settings, customizing model profiles, or onboarding to the routing system. All content is sourced from an interactive session — no information has been added beyond what was discussed.

## 1. Full GSD Agent List

There are **33 agents** defined in the GSD framework.

### Planning & Research

- `gsd-planner`
- `gsd-roadmapper`
- `gsd-executor`
- `gsd-phase-researcher`
- `gsd-project-researcher`
- `gsd-research-synthesizer`
- `gsd-debugger`
- `gsd-codebase-mapper`
- `gsd-verifier`
- `gsd-plan-checker`
- `gsd-integration-checker`
- `gsd-nyquist-auditor`
- `gsd-pattern-mapper`
- `gsd-ui-researcher`
- `gsd-ui-checker`
- `gsd-ui-auditor`
- `gsd-doc-writer`
- `gsd-doc-verifier`
- `gsd-advisor-researcher`
- `gsd-ai-researcher`
- `gsd-assumptions-analyzer`
- `gsd-code-fixer`
- `gsd-code-reviewer`
- `gsd-debug-session-manager`
- `gsd-doc-classifier`
- `gsd-doc-synthesizer`
- `gsd-domain-researcher`
- `gsd-eval-auditor`
- `gsd-eval-planner`
- `gsd-framework-selector`
- `gsd-intel-updater`
- `gsd-security-auditor`
- `gsd-user-profiler`

## 2. Agent Complexity Groups

Determined by: breadth of reasoning, number of input sources synthesized, output artifact complexity, adversarial/judgment-heavy stance, and tool surface area.

### Higher Task Complexity (17 agents)

- `gsd-planner`
- `gsd-executor`
- `gsd-debugger`
- `gsd-debug-session-manager`
- `gsd-verifier`
- `gsd-nyquist-auditor`
- `gsd-phase-researcher`
- `gsd-project-researcher`
- `gsd-ai-researcher`
- `gsd-eval-planner`
- `gsd-eval-auditor`
- `gsd-roadmapper`
- `gsd-doc-synthesizer`
- `gsd-ui-researcher`
- `gsd-framework-selector`
- `gsd-code-fixer`
- `gsd-security-auditor`

### Lower Task Complexity (16 agents)

- `gsd-doc-classifier`
- `gsd-doc-verifier`
- `gsd-doc-writer`
- `gsd-research-synthesizer`
- `gsd-pattern-mapper`
- `gsd-advisor-researcher`
- `gsd-assumptions-analyzer`
- `gsd-intel-updater`
- `gsd-codebase-mapper`
- `gsd-plan-checker`
- `gsd-integration-checker`
- `gsd-code-reviewer`
- `gsd-ui-checker`
- `gsd-ui-auditor`
- `gsd-domain-researcher`
- `gsd-user-profiler`

## 3. Agent Routing Tiers

Source: `routingTier` field in `sdk/shared/model-catalog.json`. Determines which model the `adaptive` profile resolves to.

### Heavy tier (→ opus in adaptive profile, 9 agents)

- `gsd-planner`
- `gsd-roadmapper`
- `gsd-debugger`
- `gsd-debug-session-manager`
- `gsd-assumptions-analyzer`
- `gsd-eval-planner`
- `gsd-framework-selector`
- `gsd-security-auditor`
- `gsd-user-profiler`

### Standard tier (→ sonnet in adaptive profile, 13 agents)

- `gsd-executor`
- `gsd-phase-researcher`
- `gsd-project-researcher`
- `gsd-verifier`
- `gsd-ui-researcher`
- `gsd-doc-writer`
- `gsd-advisor-researcher`
- `gsd-ai-researcher`
- `gsd-code-fixer`
- `gsd-code-reviewer`
- `gsd-doc-synthesizer`
- `gsd-domain-researcher`
- `gsd-eval-auditor`

### Light tier (→ haiku in adaptive profile, 11 agents)

- `gsd-research-synthesizer`
- `gsd-codebase-mapper`
- `gsd-plan-checker`
- `gsd-integration-checker`
- `gsd-nyquist-auditor`
- `gsd-pattern-mapper`
- `gsd-ui-checker`
- `gsd-ui-auditor`
- `gsd-doc-verifier`
- `gsd-doc-classifier`
- `gsd-intel-updater`

## 4. Model Profiles

There are **5 profiles** available in GSD.

| Profile | Description |
| --- | --- |
| **quality** | All agents use the highest-capability model regardless of routing tier. |
| **balanced** (default) | Planning-class agents run on opus; execution and verification agents run on sonnet. This is the default profile. |
| **budget** | All agents use the cheapest viable model, trading capability for cost. |
| **adaptive** | Resolves per agent using `routingTier` from `model-catalog.json` — Heavy tier → opus, Standard tier → sonnet, Light tier → haiku. |
| **inherit** | Defers to the runtime's default model selection; GSD does not override the model string at spawn time. |

## 5. Model Override System

### Resolution precedence (highest → lowest)

1. **Per-agent override** — `model_overrides.<agent-name>` in `.planning/config.json` wins over everything else.
2. **Phase-type override** — `models.<phase-type>` in `.planning/config.json` overrides the profile for all agents in that phase type.
3. **Active profile** — `model_profile` in `.planning/config.json` selects the baseline mapping (`quality`, `balanced`, `budget`, `adaptive`, or `inherit`).

### Custom profiles

`VALID_PROFILES` is hardcoded in `model-catalog.json` as `["quality", "balanced", "budget", "adaptive", "inherit"]`. Adding a custom profile requires editing `model-catalog.json` in the source repo — editing the installed copy gets overwritten on `/gsd-update`.

### Current config state

- `model_profile: "balanced"`
- `model_overrides` has 17 high-complexity agents mapped to `opus` (committed in `bbca4ddf`)
- File path: `.planning/config.json`

## 6. Phase Types

There are **6 phase types**:

- `planning`
- `discuss`
- `research`
- `execution`
- `verification`
- `completion`

Each agent maps to one phase type, and `models.<phase-type>` in `config.json` overrides at phase-type granularity.

## 7. Thinking / Effort System

- **No per-agent effort setting in GSD for Claude runtime.**
- `features.thinking_partner: true` in config (default: `false`, opt-in) controls orchestration behavior — it pauses to offer tradeoff analysis at decision points in `discuss-phase` and `plan-phase`. It is NOT an API inference parameter.
- For Codex runtime: `reasoning_effort` IS baked into `model-catalog.json` per tier (`xhigh` for opus-tier, `medium` for sonnet/haiku-tier).
- Claude Code's `Agent()` tool exposes: `effort` parameter (`'low'`/`'medium'`/`'high'`/`'xhigh'`/`'max'` or integer), `thinking` (ThinkingConfig object), and `taskBudget` (`{total: number}`).
- GSD's current spawn template only uses: `subagent_type`, `model`, `isolation`, `prompt` — does NOT pass `effort`.

A per-agent effort system IS buildable — extend `model-catalog.json` agent entries with an `effort` field alongside `routingTier`, then wire through config resolution and workflow spawn calls.

## 8. model_profile_overrides

For non-Claude runtimes, `model_profile_overrides.<runtime>.<tier>` overrides which model string is used per tier. It supports either a string shorthand or a full entry object with `reasoning_effort`.

---

*Document generated: 2026-05-31*
*Source: interactive session on GSD agent and model profile system*
