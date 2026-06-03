# CATALOG-02 Handover: Per-Agent Effort Assignment

## What This Is

CATALOG-02 is a **user-owned hand-assignment**. Claude has:

- **Plan 01** — Widened the catalog type so profile slots and `adaptiveTierMap` entries can hold `model;effort` strings, and fixed both model resolvers to strip the `;effort` suffix before alias lookup (so `"sonnet;medium"` resolves to the model `"sonnet"`, not a broken string).
- **Plan 02** — Built a completeness-check script that reads your filled catalog and asserts all capable agents resolve a non-null effort through the Phase 53 resolver. Haiku agents are exempt — haiku does not support extended thinking.

Claude has **not pre-filled any effort values**. The assignment is yours to make because effort tuning involves tradeoffs only you can weigh for this project. This document gives you everything to do it.

---

## Advisory Heuristic (D-05)

The table below shows a heuristic recommendation derived from each agent's `routingTier`. **Read this guidance before you start:**

- **The heuristic is advisory, not enforced.** The system does not validate that you followed it.
- **Higher effort is not monotonically better.** Extended thinking has documented regression cases — some tasks (e.g. simple code generation, mechanical transforms) produce worse output under high effort as the model over-deliberates. Start with the heuristic and adjust based on observation.
- **The `inherit` profile stays effort-free by design.** Do not assign effort values to the `inherit` profile row — `inherit` signals that an agent should use whatever the calling context provides.
- **Haiku agents are exempt.** `gsd-codebase-mapper` and `gsd-doc-classifier` have `haiku` as their `balanced` slot. Haiku does not support extended thinking, so `null` effort is correct for them — the completeness check skips these agents automatically. Leave their slot values as bare `"haiku"` (or assign whatever model you prefer without an effort suffix).

---

## 33-Agent Assignment Table

| Agent | routingTier | golden (current) | balanced (current) | budget (current) | Heuristic |
|-------|-------------|------------------|--------------------|------------------|-----------|
| gsd-planner | heavy | opus | opus | sonnet | **high** |
| gsd-roadmapper | heavy | opus | sonnet | sonnet | **high** |
| gsd-debugger | heavy | opus | sonnet | sonnet | **high** |
| gsd-assumptions-analyzer | heavy | opus | sonnet | sonnet | **high** |
| gsd-debug-session-manager | heavy | opus | sonnet | sonnet | **high** |
| gsd-eval-planner | heavy | opus | opus | sonnet | **high** |
| gsd-framework-selector | heavy | opus | sonnet | sonnet | **high** |
| gsd-security-auditor | heavy | opus | sonnet | sonnet | **high** |
| gsd-user-profiler | heavy | opus | sonnet | sonnet | **high** |
| gsd-executor | standard | opus | sonnet | sonnet | medium |
| gsd-phase-researcher | standard | opus | sonnet | haiku | medium |
| gsd-project-researcher | standard | opus | sonnet | haiku | medium |
| gsd-verifier | standard | sonnet | sonnet | haiku | medium |
| gsd-ui-researcher | standard | opus | sonnet | haiku | medium |
| gsd-doc-writer | standard | opus | sonnet | haiku | medium |
| gsd-advisor-researcher | standard | opus | sonnet | haiku | medium |
| gsd-ai-researcher | standard | opus | sonnet | haiku | medium |
| gsd-code-fixer | standard | opus | sonnet | sonnet | medium |
| gsd-code-reviewer | standard | opus | sonnet | sonnet | medium |
| gsd-doc-synthesizer | standard | opus | sonnet | haiku | medium |
| gsd-domain-researcher | standard | opus | sonnet | haiku | medium |
| gsd-eval-auditor | standard | opus | sonnet | haiku | medium |
| gsd-research-synthesizer | light | sonnet | sonnet | haiku | none/low |
| gsd-codebase-mapper | light | sonnet | haiku | haiku | **exempt** (haiku) |
| gsd-plan-checker | light | sonnet | sonnet | haiku | none/low |
| gsd-integration-checker | light | sonnet | sonnet | haiku | none/low |
| gsd-nyquist-auditor | light | sonnet | sonnet | haiku | none/low |
| gsd-pattern-mapper | light | sonnet | sonnet | haiku | none/low |
| gsd-ui-checker | light | sonnet | sonnet | haiku | none/low |
| gsd-ui-auditor | light | sonnet | sonnet | haiku | none/low |
| gsd-doc-verifier | light | sonnet | sonnet | haiku | none/low |
| gsd-doc-classifier | light | sonnet | haiku | haiku | **exempt** (haiku) |
| gsd-intel-updater | light | opus | sonnet | haiku | none/low |

**Counts:** 9 heavy (→ high) + 13 standard (→ medium) + 9 light (→ none/low) + 2 light/exempt (haiku, no effort) = 33 agents

---

## How to Assign Values

Edit `sdk/shared/model-catalog.json`. For each agent, find its entry under `"agents"` and append `;<effort>` to the chosen profile slot value(s).

**Syntax:** use a semicolon (`;`) delimiter — not a colon. The TS type was widened in Plan 01 so no TypeScript edit is required.

**Example — gsd-planner before:**
```json
"gsd-planner": {
  "golden": "opus",
  "balanced": "opus",
  "budget": "sonnet"
}
```

**Example — gsd-planner after (applying heuristic: high):**
```json
"gsd-planner": {
  "golden": "opus;high",
  "balanced": "opus;high",
  "budget": "sonnet;medium"
}
```

**Valid effort tokens:** `high`, `medium`, `low` (and any value accepted by `parseModelEffort` — see `sdk/src/model-catalog.ts`). Do not assign effort to `haiku` slots — haiku does not support extended thinking and `none` is not a recognized effort token.

**Tip:** The completeness check uses the `balanced` profile to determine whether an agent has effort assigned. Assign effort to the `balanced` slot at minimum. For the `golden` and `budget` slots: effort is optional for the check, but for consistency you may want to assign values there too.

---

## Post-Assignment Verification

After editing `sdk/shared/model-catalog.json`, run from the project root:

```bash
node .planning/phases/55-catalog-schema-user-handover/check-completeness.js
```

A successful run prints:
```
Note: 2 agent(s) use haiku (no extended thinking) — exempt from effort requirement:
  - gsd-codebase-mapper
  - gsd-doc-classifier
PASS: all 31 capable agents have assigned effort values.
```

If any agents are still missing, the script lists them by name. Fix those entries and re-run.

You can also confirm end-to-end resolution works for a specific agent:
```bash
node get-shit-done/bin/gsd-tools.cjs query resolve-model gsd-planner
```
The `model` field should be the bare alias (e.g. `opus`, no `;`) and `effort` should be non-null (e.g. `"high"`).

---

## Resume Signal

Once `check-completeness.js` prints `PASS: all 31 capable agents have assigned effort values.`, type **"approved"** in the conversation to resume the workflow. Task 3 will run the check automatically and record the result.
