# Critique: `commands/gsd/plan-phase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### Frontmatter is well-structured (§11 System vs. User Prompt Allocation)

The YAML frontmatter encodes `name`, `description`, `argument-hint`, `agent`, and `allowed-tools` in one canonical location. This aligns with §11's agent configuration pattern — identity, trigger description, and tool permissions are co-located and machine-readable. The `allowed-tools` list is specific enough to be auditable.

### Flags are enumerated, not left to inference (§5 Instruction Framing — Conditional Instructions)

The `<context>` block lists all flags (`--research`, `--skip-research`, `--gaps`, etc.) with a one-line description of each. This directly satisfies §5's pattern for explicit conditional branching: each flag maps to a distinct execution path rather than leaving the model to infer branch conditions from prose.

### Runtime VS Code compatibility is addressed (§5 Conditional Instructions)

The `<runtime_note>` block handles the `AskUserQuestion` / `vscode_askquestions` equivalence explicitly. This is a concrete conditional instruction that prevents silent failure in a known deployment environment. It follows §5's ternary/conditional pattern in spirit.

### Tool permissions scoped to task (§22 Pattern 9)

`allowed-tools` enumerates specific tools rather than granting blanket access. `mcp__context7__*` uses the wildcard-prefix pattern from §22 Pattern 9, which narrows blast radius while allowing the full MCP namespace.

---

## Weaknesses

### 1. `<objective>` mixes task, audience, and role without separation (§1 Task Specification, §4 Formatting and Structure)

§1 Action 1 requires three explicit components: what output is requested, why it matters, and what a high-quality response looks like. §1 Action 2 requires the audience to be encoded explicitly. The `<objective>` block fuses orchestrator role, flow summary, and task statement into a single unstructured paragraph. There is no `<audience>` tag, no `<quality_bar>` tag, and no explicit statement of what a good PLAN.md looks like.

Additionally, §4 Action 2 specifies that prompt sections must be wrapped in semantically named XML tags. `<objective>` is not in the guide's standard vocabulary — the correct tags for this content are `<task>` (what the model must do) and `<persona>` (its role as orchestrator). Using a non-standard tag loses the semantic signal that Claude-class models exploit.

**Impact:** The model receives a combined instruction it must parse and decompose itself, which increases interpretation variance and risks the orchestrator role being underweighted relative to the planning task.

### 2. `<process>` is a pure delegation stub with no quality bar (§1 Task Specification Action 1, §22 Pattern 3)

The entire `<process>` block reads:

> Execute the plan-phase workflow from @~/.claude/get-shit-done/workflows/plan-phase.md end-to-end.
> Preserve all workflow gates (validation, research, planning, verification loop, routing).

This defers all substance to an external file. Per §1 Action 1, the quality bar — what a correct or high-quality response looks like — must be present in the prompt. Per §22 Pattern 3, output format must be specified completely and upfront. Neither is present here. If the referenced workflow file is unavailable or incompletely loaded, the model has no fallback description of what success looks like.

**Impact:** The prompt has no standalone coherence. It cannot be evaluated in isolation, and any failure in the workflow file reference produces a zero-information fallback.

### 3. Negative framing in `<runtime_note>` (§5 Instruction Framing Action 1)

The `<runtime_note>` contains:

> Do not skip questioning steps because `AskUserQuestion` appears unavailable

§5 Action 1 requires converting negative instructions to positive equivalents before emitting any prompt. The conversion table maps "Do not X" → "Do X instead." The note has a positive clause (`use vscode_askquestions instead`) but leads with a negative prohibition. Per the guide's mechanical rule, the negative should be eliminated.

**Impact:** Minor in isolation, but the guide treats this as a systematic scan — all negations must be converted. Leaving one sets a precedent for drift elsewhere.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` with `<task>` + `<persona>` + `<quality_bar>` (addresses Weakness 1)

**Current:**
```xml
<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>
```

**Suggested rewrite:**
```xml
<persona>
You are a planning orchestrator for the GSD workflow system. Your role is to coordinate
research, planning, and verification subagents — not to produce plans directly. You parse
arguments, validate phases, dispatch agents, and gate transitions between workflow stages.
</persona>

<task>
Produce a verified PLAN.md for the specified roadmap phase by executing the plan-phase
workflow end-to-end. A high-quality result is a PLAN.md that passes the gsd-plan-checker
verification gate and is ready for execution without further editing.

Default execution order: Research (if needed) → Plan → Verify → Done
</task>

<quality_bar>
PLAN.md passes gsd-plan-checker. All workflow gates (validation, research, planning,
verification loop, routing) are executed in order. No gate is skipped unless an explicit
flag authorizes the skip.
</quality_bar>
```

This separates role (persona), task, and success criteria into independently signal-bearing blocks using the guide's standard tag vocabulary.

---

### Rewrite 2: Add a minimal inline quality bar to `<process>` (addresses Weakness 2)

**Current:**
```xml
<process>
Execute the plan-phase workflow from @~/.claude/get-shit-done/workflows/plan-phase.md end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
```

**Suggested rewrite:**
```xml
<process>
Execute the plan-phase workflow from @~/.claude/get-shit-done/workflows/plan-phase.md end-to-end.
Preserve all workflow gates: validation, research, planning, verification loop, and routing.

If the workflow file cannot be loaded, apply this fallback sequence:
1. Validate phase exists in the roadmap.
2. Run research (unless --skip-research or --gaps is set).
3. Spawn gsd-planner to produce PLAN.md.
4. Run gsd-plan-checker to verify. Iterate up to 3 times on failure.
5. Report final status to the user.
</process>
```

The fallback sequence gives the model standalone coherence when the external file reference fails, satisfying §1's requirement for an explicit quality bar and §22 Pattern 3's requirement for an upfront output specification.

---

### Rewrite 3: Convert negative instruction in `<runtime_note>` (addresses Weakness 3)

**Current:**
```
Do not skip questioning steps because `AskUserQuestion` appears unavailable; use `vscode_askquestions` instead.
```

**Suggested rewrite:**
```
When a questioning step calls for `AskUserQuestion`, use `vscode_askquestions` — the VS Code
Copilot equivalent. All questioning steps are required regardless of which tool name appears
in the workflow instructions.
```

This states the desired behavior positively (use `vscode_askquestions`, all steps required) and removes the prohibition, satisfying §5 Action 1's mechanical conversion rule.

---

## Overall Verdict

**Adequate**

The file does the structural work correctly: frontmatter is well-formed, flags are enumerated, tool permissions are scoped, and the VS Code compatibility edge case is handled. These are non-trivial wins.

The core weakness is that the prompt delegates almost entirely to an external workflow file and provides no standalone quality bar, no standard-vocabulary task/persona decomposition, and one uncorrected negative instruction. It functions as a thin dispatch wrapper rather than a self-contained prompt. Per §17's self-contained agent prompt requirement and §1's quality bar requirement, a prompt that collapses to a no-op when its external reference fails does not meet the production standard. Fixing the three issues above — particularly the `<objective>` decomposition and the `<process>` fallback — would elevate this to Strong.
