# Critique: plan-phase.md

## Summary

`plan-phase.md` is an impressively comprehensive orchestration workflow that handles a genuinely complex multi-agent pipeline — research, planning, verification, revision loops, and auto-advance — across more than 1,200 lines. The workflow demonstrates real strength in branching-scenario handling, explicit guard rails, and progressive-disclosure UX. However, it falls measurably short of the guide's prompt engineering standards in almost every structural dimension: subagent prompts use prose and markdown headers rather than XML tags (Sections 4, 8), qualitative constraints outnumber numeric ones throughout (Sections 5, 21), inline prompt strings carry no persona or output-format declarations for the agents they spawn (Sections 6, 7), task intent and audience are never stated for the orchestrator itself (Section 1), and the workflow is a monolith rather than a composition of focused modules (Section 19). The result is a workflow that works operationally but would be difficult to audit, test, or optimize individually — and whose subagent prompts will produce more variable output quality than they could with tighter specification.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern applied consistently.** Every major processing stage is numbered and named (1. Initialize, 2. Parse, 3. Validate, 5. Research, 8. Plan, 10. Check, 12. Revision loop). Cognitive boundaries are clear, and the model is directed to complete one phase before beginning the next.

- **Section 16 — scenario-based branching.** Steps 9b and 9c handle phase-split recommendations and source-audit gaps as explicit named scenarios with distinct paths, exactly matching the guide's `<scenarios>/<scenario condition="...">` pattern. The branching is enumerated rather than left to inference.

- **Section 16 — required vs. optional steps clearly distinguished.** `--skip-research`, `--skip-verify`, `--skip-ui`, and `--gaps` flags explicitly gate optional steps. The workflow never silently skips without a clear conditional.

- **Section 5 — conditional instructions throughout.** Almost every step uses explicit `if/else` logic with clearly stated conditions (e.g., `If TEXT_MODE is true... Otherwise use AskUserQuestion`), matching the guide's pattern for conditional branching.

- **Section 14 — explicit permission pairs in some checks.** The `<success_criteria>` block and `<quality_gate>` inside the planner prompt enumerate checkable binary conditions rather than qualitative descriptions.

- **Section 16 — revision loop with stall detection.** The max-3-iteration loop with `stall_reentry_count`, `prev_issue_count`, and explicit break conditions is a strong production pattern that the guide endorses for multi-phase pipelines.

- **Section 15 — decision frameworks present.** AskUserQuestion options, phase-split recommendations, and coverage-gap resolution each offer enumerated choices with descriptions, matching the guide's comparison-table and criteria-checklist patterns.

- **Section 17 — agent type names enforced.** `<available_agent_types>` with the instruction "do not fall back to 'general-purpose'" directly implements the guide's principle that `whenToUse` must be action-specific, not capability-generic.

---

## Issues

### Issue 1 — Subagent prompts use markdown headers, not XML tags

**Guide principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections." Section 8 Action 1/2 — task instruction leads, input closes.

**What's wrong:** The researcher prompt (Step 5), planner prompt (Step 8), checker prompt (Step 10), and revision prompt (Step 12) all use markdown headers (`## Anti-Shallow Execution Rules`) and fenced code blocks to structure their content. Only some sections use XML tags (`<objective>`, `<files_to_read>`, `<planning_context>`, `<deep_work_rules>`, etc.) — but inconsistently. The `<verification_context>` block mixes XML-wrapped sections with bare markdown headings inside them. The guide is explicit: XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models."

**Concrete fix:** Standardize every subagent prompt to use the guide's tag vocabulary exclusively. The planner prompt's `<deep_work_rules>` section, for example, should become:

```xml
<task>
  <goal>{phase goal}</goal>
  <unit_task>Create PLAN.md files for Phase {N}: {name}</unit_task>
  <conventions>{CLAUDE.md and project skill rules}</conventions>
</task>
<output_format>
  Each PLAN.md requires: frontmatter, XML tasks with read_first and acceptance_criteria,
  verification criteria, must_haves. No vague actions — include exact values.
</output_format>
<quality_bar>
  Every task has grep-verifiable acceptance_criteria. No "align X with Y" without the target value.
</quality_bar>
```

---

### Issue 2 — No persona assigned to any spawned subagent

**Guide principle:** Section 6 Action 2 — "Make personas specific, not generic." Section 22 Pattern 1 — "Role identity scoped to the exact domain."

**What's wrong:** None of the three primary subagent prompts (researcher, planner, checker) include a `<persona>` block. The researcher gets `<objective>`, the planner gets `<planning_context>`, the checker gets `<verification_context>` — but no role identity. The guide is explicit that a specific, role-constrained persona "constrains the register, priorities, and decision-making style of every response" and that the `role-domain mapping` table demonstrates the difference between ineffective generic framing and effective specific framing.

**Concrete fix:** Add a `<persona>` block as the first element of each subagent prompt:

```xml
<!-- Researcher -->
<persona>
You are a technical research specialist. Your job is not to implement the feature —
it's to surface what the planner needs to know before touching code.
Your strengths: reading documentation, tracing dependency trees, identifying integration hazards, surfacing prior art in the codebase.
</persona>

<!-- Planner -->
<persona>
You are a software architect and planning specialist. Your job is to produce concrete,
executor-ready plans — not high-level outlines. Every task you write must be completable
without reading any file not listed in read_first.
</persona>

<!-- Checker -->
<persona>
You are a plan verification specialist. Your job is not to confirm plans look good —
it's to find gaps, ambiguities, and missing coverage before execution starts.
</persona>
```

---

### Issue 3 — Output format for subagents is underspecified

**Guide principle:** Section 7 Action 1 — "split into reasoning-then-format." Section 22 Pattern 3 — "Output format specified completely and upfront." Section 7 machine-parsed output — "exact format specification with literal string requirements."

**What's wrong:** The researcher prompt has no `<output_format>` block at all — it only says `Write to: {path}`. The planner and checker specify a `<quality_gate>` checklist but no structural format for PLAN.md sections beyond "frontmatter + XML tasks." The checker's `<expected_output>` block lists two sentinel strings (`## VERIFICATION PASSED`, `## ISSUES FOUND`) but gives no example of the structured YAML issues block the revision loop parses in step 12 (`Parse issue count from checker return: count BLOCKER + WARNING entries in the YAML issues block`). That YAML schema is referenced but never defined in the prompt the checker actually receives.

**Concrete fix:**

1. Add a complete `<output_format>` to the checker prompt, including the exact YAML schema:
```xml
<output_format>
Return either:

## VERIFICATION PASSED
All {N} requirements covered. Plans are executable.

or:

## ISSUES FOUND
```yaml
issues:
  - severity: BLOCKER
    plan: "01-PLAN.md"
    task: "Task title"
    description: "What is missing or wrong"
    fix: "Concrete corrective action"
  - severity: WARNING
    ...
```
Use only BLOCKER or WARNING. No other severity values.
</output_format>
```

2. Add a similar `<output_format>` to the researcher prompt specifying the required sections of RESEARCH.md (the `## Validation Architecture` section header is detected by grep in step 5.5 but never specified in the researcher's instructions).

---

### Issue 4 — Qualitative constraints throughout; no numeric limits

**Guide principle:** Section 21 — "Size constraints use numeric limits, not qualitative descriptors." Section 14 — "Confidence thresholds are numeric, not qualitative."

**What's wrong:** The planner prompt's `<deep_work_rules>` uses phrases like "The cost of verbose plans is far less than the cost of re-doing shallow execution" — a rationale, not a constraint. The `<quality_gate>` uses binary checkboxes but no numeric targets. The checker prompt gives no reporting threshold. The research prompt gives no length or depth guidance. Compare with the guide's pattern: "Format: 2-12 words" / "under 8 words" / "confidence 0.7–0.8: report with caveat."

**Concrete fix:** Add numeric constraints to each subagent prompt:

```xml
<!-- Planner output_format addition -->
<output_format>
- Plans per phase: 1–8 (split phase if more are needed)
- Tasks per plan: 3–12
- acceptance_criteria per task: minimum 2, each checkable with grep or a single shell command
- action field: include exact values; maximum 1 reference to "see CONTEXT.md" per plan
</output_format>

<!-- Checker constraints addition -->
<constraints>
  <reporting_threshold>
    Report only issues where you are >80% confident they would cause execution failure or
    incorrect output. Omit style preferences and speculative concerns.
  </reporting_threshold>
</constraints>
```

---

### Issue 5 — Orchestrator itself lacks task specification (Section 1)

**Guide principle:** Section 1 Action 1 — "Extract: (a) what output is being requested, (b) why that output matters, (c) what a correct or high-quality response looks like." Section 1 Action 2 — "Identify the audience."

**What's wrong:** The workflow opens with a `<purpose>` tag that describes what the workflow does operationally, but it never states: who the orchestrating agent is serving (a developer invoking `/gsd-plan-phase`), what success looks like from the user's perspective (executable PLAN.md files that a `gsd-execute-phase` agent can run without clarification), or what a bad outcome looks like (vague plans that produce shallow execution, or plans that fail the checker repeatedly). The guide requires these three components to be explicit before any instruction is written.

**Concrete fix:** Replace or augment the `<purpose>` block:

```xml
<task>
Orchestrate the plan-phase workflow for Phase {N}: from context loading through research,
planning, and verification, to a set of executor-ready PLAN.md files.
</task>
<audience>
A developer running /gsd-plan-phase from Claude Code. They want plans they can hand off
to /gsd-execute-phase without further clarification.
</audience>
<quality_bar>
Success: all PLAN.md files pass gsd-plan-checker with VERIFICATION PASSED.
Failure: plans contain vague actions, missing acceptance_criteria, or uncovered requirements.
</quality_bar>
```

---

### Issue 6 — No priority ordering when multiple constraints conflict

**Guide principle:** Section 5 — "When multiple considerations apply, list them with explicit priority." Section 5 tie-breaking — "Add explicit tie-breaking when the model might be uncertain."

**What's wrong:** Several decision points in the workflow have implicit priority without stating it. For example: in step 5, `--skip-research` and `--gaps` both skip research, but if both are present, precedence is unstated. In step 6, when existing plans exist and `--reviews` is also set, the workflow says "Skip prompt — go straight to replanning" but that conflicts with the general `has_plans + no --reviews` branch without stating which takes priority in ambiguous invocations. In step 12's stall detection, `issue_count >= prev_issue_count` fires even when the plan has technically improved (same count, different issues); the tie-breaking rule is silent on this.

**Concrete fix:**

```xml
<priority_order>
  1. --skip-verify overrides plan_checker_enabled (explicit flag beats config)
  2. --gaps and --reviews are mutually exclusive — error if both present (already handled in 2.5)
  3. --skip-research overrides --research when both present — log warning, skip research
  4. Stall detection: if issue_count equals prev_issue_count but issue content has changed,
     treat as progress (reset stall counter) only once per iteration
</priority_order>
```

---

### Issue 7 — Workflow is a monolith; no modularity

**Guide principle:** Section 19 — "Each prompt component has a single responsibility." Section 13 — "Well-designed prompt systems decompose large instructions into small, focused atomic units." Section 22 Pattern 5.

**What's wrong:** All 1,200+ lines live in a single file. The researcher prompt text, the planner prompt text, the checker prompt text, the deep_work_rules, the quality_gate, the offer_next template, and the windows_troubleshooting block are all embedded inline. The guide recommends decomposing into separately toggleable modules: `deep-work-rules.md`, `planner-output-format.md`, `checker-output-format.md`, etc., referenced via template variable substitution (`${AGENT_SKILLS_PLANNER}` already does this for skill injection — the same pattern should apply to prompt bodies).

**Concrete fix:** Extract the three subagent prompt bodies into separate referenced files and inject them via variables:

```
${RESEARCHER_PROMPT}   → references/plan-phase-researcher-prompt.md
${PLANNER_PROMPT}      → references/plan-phase-planner-prompt.md
${CHECKER_PROMPT}      → references/plan-phase-checker-prompt.md
```

This allows each prompt to be reviewed, tested, and updated independently without touching the orchestration logic.

---

## Quick-Reference Checklist Score (Section 23)

### task_specification
- FAIL — Intent is described operationally in `<purpose>` but audience and quality_bar are not explicit
- FAIL — Constraint compatibility is not audited (Section 1 Action 3); the `--gaps`/`--reviews` conflict is caught but no general constraint audit exists

### chain_of_thought
- N/A — No CoT trigger needed; the task is orchestration, not symbolic reasoning
- N/A — Reasoning elicited before answer
- N/A — CoT traces as heuristic aids

### few_shot_examples
- N/A — No examples needed for orchestration logic
- N/A — Ordering, diversity, format consistency
- N/A — Fixed example order

### formatting
- FAIL — Subagent prompts mix XML tags with markdown headers; not consistently semantically-named XML throughout
- FAIL — At least 3 format variants not generated or noted as a TODO

### instruction_framing
- PASS — Negative instructions are largely absent; most instructions are positive
- FAIL — Priority order is not explicit when multiple flags/conditions apply
- FAIL — Tie-breaking rules are absent for flag conflicts and stall-detection edge cases

### persona
- FAIL — No persona for any spawned subagent
- N/A — Gender-neutral (no persona present to evaluate)

### output_format
- FAIL — Researcher has no output_format
- FAIL — Checker's YAML issues schema referenced but not defined in its prompt
- FAIL — Planner's PLAN.md structure not fully specified with an example
- N/A — Constrained decoding not applicable

### context_placement
- PASS — Task instruction leads each subagent prompt block
- PASS — `<files_to_read>` positions input context correctly
- PASS — Background context (AGENT_SKILLS_*, TDD config) placed in middle
- PASS — Windows troubleshooting is isolated in its own block
- N/A — No time-sensitive snapshot injection in this workflow

### self_consistency
- N/A — Not applicable to orchestration

### prompt_length
- FAIL — At 1,200+ lines, redundant explanatory prose exists (e.g., `<deep_work_rules>` has both rules and rationale paragraphs that could be compressed)
- N/A — RAG not applicable

### system_user_split
- PASS — Persistent agent skills injected via `${AGENT_SKILLS_*}` variables (modular)
- FAIL — Each instruction does not appear in exactly one location; some constraints are restated across the planner prompt and the revision prompt
- N/A — Safety-critical constraints with external validation

### agent_subagent
- PASS — Each spawned agent receives a self-contained prompt block
- PASS — File paths use absolute-path variables from init JSON
- N/A — Parallel agent spawning not used in this workflow (sequential by design)
- N/A — Adversarial probes (not a verification agent)

### structural_architecture
- FAIL — Not decomposed into atomic modules; all prompt bodies are inline
- PASS — Template variables use `${VARIABLE_NAME}` syntax throughout
- FAIL — Subagent prompt bodies are copy-pasted, not composed via variable substitution

### constraint_enforcement
- FAIL — Restrictions (e.g., "do not replan from scratch unless issues are fundamental") lack paired explicit permissions
- FAIL — Exclusion lists not enumerated (checker has no scope filter)
- PASS — Known edge cases have explicit rulings (e.g., `--reviews + --gaps` conflict in step 2.5)
- FAIL — Confidence thresholds are absent from checker and planner constraints

### decision_frameworks
- PASS — Multi-option recommendations use AskUserQuestion with enumerated options
- PASS — Criteria checklists present (`<quality_gate>`, `<success_criteria>`)
- FAIL — Reversibility framing absent; no `<take_freely>` / `<confirm_with_user>` structure

### multi_phase_workflows
- PASS — Complex task organized into explicit numbered phases
- PASS — Required steps (all phases) distinguished from optional (`--skip-*` flags)
- PASS — Scenario-based branching handles multiple paths explicitly (steps 9b, 9c)

### memory_and_continuity
- PASS — STATE.md update in step 13b records planning completion
- N/A — Compaction summaries (not this workflow's responsibility)
- N/A — Next steps tied to user request (handled in offer_next)

### modularity
- FAIL — Workflow file does not have single responsibility; orchestration + subagent prompt bodies + troubleshooting + UX templates all coexist
- PASS — `<success_criteria>` states both inclusions and exclusions implicitly via the checklist

### safety_and_trust
- PASS — External validation happens at system boundaries (gsd-sdk query calls)
- N/A — Dual-use capabilities not applicable
- PASS — Authorization scope is narrow by default (each action requires a flag or explicit user choice)

### tone_and_style
- FAIL — Size constraints are qualitative ("specific and actionable", "concrete values") rather than numeric
- PASS — Instructions use imperative present tense throughout
- PASS — Working notes / implementation details do not appear in user-facing output blocks

### optimization
- FAIL — Workflow is not flagged as a draft for automated optimization
- N/A — Optimizer selection
- N/A — Held-out test set

---

## Recommendations

Prioritized by impact on output quality and maintainability:

### 1. Add personas to all three subagent prompts (HIGH IMPACT — Section 6 Action 2, Section 22 Pattern 1)

The researcher, planner, and checker each have a distinct adversarial stance that is never named. Without a `<persona>`, each agent defaults to generic assistant behavior. The checker in particular should use the reframe pattern (Section 6): "Your job is not to confirm plans look good — it's to find what the executor will fail on." Add a `<persona>` block as the first element of each prompt. This is a small change with large behavioral impact.

### 2. Define the checker's YAML issues schema in its prompt (HIGH IMPACT — Section 7, Section 22 Pattern 3)

Step 12 parses `BLOCKER` and `WARNING` entries from a YAML block, but the checker's prompt never specifies this schema. This is a machine-parsed output with no exact format specification — exactly the failure mode Section 7 warns against. Add a complete `<output_format>` block with a literal schema example and sentinel string requirements to the checker prompt. Without this, the revision loop parsing is brittle.

### 3. Add numeric constraints to planner and checker prompts (MEDIUM IMPACT — Section 21, Section 14)

Replace qualitative guidance ("tasks are specific and actionable") with numeric targets: tasks per plan (3–12), acceptance criteria per task (minimum 2), confidence threshold for checker reporting (>80%). This makes the quality_gate checkable by the agents themselves and reduces variance in plan quality across different model configurations.

### 4. Add explicit priority ordering for flag interactions (MEDIUM IMPACT — Section 5)

Document a `<priority_order>` block at the top of `<process>` that states which flags win when multiple apply, and what the tie-breaking behavior is in the stall-detection loop. This prevents silent mismatches when users combine flags that were not explicitly designed to coexist.

### 5. Extract subagent prompt bodies into separate referenced modules (LOWER IMPACT, HIGH MAINTAINABILITY — Section 19, Section 22 Pattern 5)

The planner prompt body alone is ~100 lines. Embedding it inline in the orchestration workflow couples the prompt engineering of the planner to the orchestration logic of plan-phase. Extracting to `references/plan-phase-planner-prompt.md` and injecting via a template variable makes each independently editable, reviewable, and testable — and allows the same prompt to be reused by other workflows that need to invoke the planner directly.
