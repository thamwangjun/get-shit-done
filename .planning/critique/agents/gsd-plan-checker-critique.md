# Critique: gsd-plan-checker.md

- **Agent**: `gsd-plan-checker.md`
- **Critique date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

| # | Section | Applicable? |
|---|---------|-------------|
| 1 | Task Specification | Yes |
| 2 | Chain-of-Thought Decisions | Yes |
| 3 | Few-Shot Example Construction | Yes |
| 4 | Formatting and Structure | Yes |
| 5 | Instruction Framing | Yes |
| 6 | Persona Assignment | Yes |
| 7 | Output Format Handling | Yes |
| 8 | Context Placement | Yes |
| 10 | Prompt Length and Compression | Yes |
| 11 | System vs. User Prompt Allocation | Yes |
| 13 | Structural Architecture Patterns | Yes |
| 14 | Constraint Enforcement | Yes |
| 15 | Decision Frameworks | Yes |
| 16 | Multi-Phase Workflows | Yes |
| 17 | Agent and Subagent Patterns | Yes |
| 19 | Modularity and Composition | Yes |
| 21 | Tone and Style Rules | Yes |
| 22 | Production Patterns | Yes |
| 23 | Quick-Reference Checklist | Yes |

---

## Strengths

### S1 — XML structural tagging is used consistently (Guide §4.2, §4 tag vocabulary)
The agent uses semantically named XML tags throughout: `<role>`, `<required_reading>`, `<project_context>`, `<upstream_input>`, `<core_principle>`, `<verification_dimensions>`, `<verification_process>`, `<examples>`, `<issue_structure>`, `<structured_returns>`, `<anti_patterns>`, `<success_criteria>`. This is exactly the guide-recommended approach for separating prompt sections with meaningful, machine-parseable tags rather than markdown headers or `---` delimiters.

### S2 — Few-shot examples are present and use YAML-formatted concrete examples (Guide §3, §22 Pattern 2)
Each verification dimension includes a concrete `issue:` YAML block showing exactly what a well-formed issue looks like. This directly implements Guide §22 Pattern 2: "every abstract instruction paired with a calibrating example." The examples set a measurable bar for what constitutes a valid reported issue.

### S3 — Output format is fully specified upfront with two named variants (Guide §7, §22 Pattern 3)
The `<structured_returns>` section provides complete output templates for both `VERIFICATION PASSED` and `ISSUES FOUND` states, including table structures, section headings, and a YAML issues block. This satisfies Guide §22 Pattern 3: "output format specified completely and upfront."

### S4 — Anti-pattern constraints use positive/negative pairing (Guide §5.1, §14)
The `<anti_patterns>` block lists seven "DO NOT" constraints. While the guide generally prefers converting negatives to positives (§5 Action 1), in this context they function correctly as explicit exclusion rules that pair with the positive instructions in `<verification_dimensions>`. The guide permits negative clauses for explicit behavioral displacement (§6 reframe pattern).

### S5 — Success criteria checklist closes the loop (Guide §16, §23)
The `<success_criteria>` block provides a concrete checkbox list covering every verification dimension. This maps directly to the guide's checklist pattern and creates a verifiable termination condition for the agent.

### S6 — Scope reduction dimension uses adversarial probe mindset (Guide §17, §22 Pattern 8)
Dimension 7b (Scope Reduction Detection) explicitly enumerates deceptive language patterns to scan for (`"v1"`, `"simplified"`, `"static for now"`, etc.) and treats them as always-blocker severity. This mirrors Guide §22 Pattern 8's adversarial verification scope — finding what the implementer "didn't think to test."

### S7 — Persona uses the reframe pattern correctly (Guide §6)
The `<role>` block contains: "You are NOT the executor or verifier — you verify plans WILL work before execution burns context." This is exactly the guide's reframe pattern: "Your job is NOT X — it's Y," which is one of the guide's approved contexts for a negative clause.

### S8 — Comparison tables used for multi-criteria decisions (Guide §15)
Dimension 2 uses a `Required by task type` table mapping task types to required fields, and Dimension 5 uses a `Thresholds` table with Target/Warning/Blocker columns. These are concrete comparison tables as recommended in Guide §15.

---

## Weaknesses

### W1 — Persona is generic and lacks strengths enumeration (Guide §6.2, §6 Strengths listing)

**Quote from agent:**
> "You are a GSD plan checker. Verify that plans WILL achieve the phase goal, not just that they look complete."

The guide states (§6 Action 2): "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." And (§6 Strengths listing): "Explicitly enumerate what the agent is good at. This biases behavior toward those capabilities."

The `<role>` tag contains a task description and context, not a persona. There is no voice or register constraint, no strengths list, and no specific identity beyond the job title. The guide's role-domain mapping table (§6) would suggest something like: "You are a pre-execution plan auditor specializing in goal-backward verification of software delivery plans."

### W2 — No explicit `<task>` / `<audience>` / `<quality_bar>` triad (Guide §1 Actions 1–2)

The guide requires three explicit task components: (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. It also requires the audience to be encoded explicitly.

The agent encodes *what* implicitly across `<role>` and `<core_principle>`, but never states *why* the output matters (e.g., "so that flawed plans do not consume execution context") or encodes an `<audience>` tag (the orchestrating `gsd-plan-phase` agent and the human developer who reads the report). The `<quality_bar>` is distributed across `<success_criteria>` but never stated as a unified standard.

### W3 — Context placement violates task-first / input-last ordering (Guide §8.1, §8.2)

**Quote from agent structure:**
```
<role>           ← task description (correct position)
<required_reading> ← meta-instruction
<project_context>  ← discovery instructions
<upstream_input>   ← primary input schema
<core_principle>   ← framing
<verification_dimensions> ← bulk content (middle)
<verification_process>    ← process steps (middle)
<examples>         ← examples (middle)
<issue_structure>  ← output format
<structured_returns> ← output templates
<anti_patterns>    ← constraints
<success_criteria> ← completion checklist (final position)
```

Guide §8 Action 2 states: "Place the primary document or input at the very end of the prompt." The primary input the agent acts on — the actual `PLAN.md` files — is referenced only via bash commands inside `<verification_process>`, not placed at the prompt close. Meanwhile, the output format (`<structured_returns>`) and constraints (`<anti_patterns>`) appear after the process steps rather than being declared early. The guide §8 Action 1 requires task instruction to lead; the `<role>` does lead, but the critical `<output_format>` spec is buried in the lower third of the prompt.

### W4 — Negative instructions not converted to positive equivalents (Guide §5 Action 1)

**Quotes from agent:**
> "DO NOT check code existence — that's gsd-verifier's job."
> "DO NOT run the application. Static plan analysis only."
> "DO NOT accept vague tasks."
> "DO NOT skip dependency analysis."
> "DO NOT ignore scope."
> "DO NOT verify implementation details."
> "DO NOT trust task names alone."

The guide states (§5 Action 1): "Scan for negated instructions. Rewrite each as a positive specification of the desired behavior." Seven of the seven `<anti_patterns>` entries are pure negations. Positive equivalents would be more directive and less ambiguous. For example:

- "DO NOT check code existence" → "Analyze plan text only; code existence checks are gsd-verifier's scope"
- "DO NOT run the application" → "Perform static analysis on PLAN.md files; all evidence comes from plan content alone"

### W5 — No `<output_format>` tag for machine-parsed VERDICT output (Guide §7, §22 Pattern 3)

The agent produces two machine-parsed outputs (`VERIFICATION PASSED` and `ISSUES FOUND`) that are consumed by the `gsd-plan-phase` orchestrator. Guide §7 Machine-parsed output specification states:

> "When output is machine-parsed, be explicit and restrictive... Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `FAIL`, or `PARTIAL`. Output it as plain text: no markdown bold, no punctuation, no wording variation."

The `<structured_returns>` block uses prose markdown headers (`## VERIFICATION PASSED`, `## ISSUES FOUND`) rather than a parseable literal string. The orchestrator parsing these strings is fragile — any variation in markdown rendering or heading level will break parsing. There is no `<output_format>` wrapper specifying the literal string contract.

### W6 — YAML issue examples inside `<verification_dimensions>` violate few-shot ordering (Guide §3.3)

The guide states (§3 Action 3): "Place the simplest, most clear-cut case first. Place the example most similar to the test input last." All 12 dimension blocks provide exactly one example each, and all examples are of roughly equal complexity. There is no progression from simple to complex. More importantly, the guide recommends 2–5 examples for most tasks (§3 Action 2) — providing one example per dimension means the agent has no contrastive calibration (e.g., a PASS example alongside a FAIL example for the same dimension). Without a passing example, the agent can only calibrate on what failure looks like, not on the boundary between pass and fail.

### W7 — `<required_reading>` file references are absolute paths, not template variables (Guide §13, §11 YAML frontmatter)

**Quotes from agent:**
> `@~/.claude/get-shit-done/references/gates.md`
> `@~/.claude/get-shit-done/references/thinking-models-planning.md`
> `@~/.claude/get-shit-done/references/few-shot-examples/plan-checker.md`

Guide §13 states that template variables should be used for runtime injection: `${VARIABLE_NAME}`. Guide §11 YAML frontmatter shows that agent dependencies should be declared as `variables` in frontmatter. Hardcoding absolute home-relative paths (`~/.claude/...`) inside prompt body text creates fragility: the paths break for any user whose GSD install is in a different location, and the dependencies are invisible in the frontmatter metadata where tooling would normally inspect them.

### W8 — Prompt is excessively long with no compression strategy (Guide §10.1)

The agent is approximately 960 lines. Guide §10 Action 1 states: "Remove redundant instructions, repeated context, and boilerplate that does not contribute to the task before sending. Length degrades performance independently of content quality."

Several sections repeat content:
- The difference between `gsd-verifier` and `gsd-plan-checker` is stated twice (once in `<role>`, once in `<core_principle>`).
- The YAML issue format is fully specified in `<issue_structure>` but also repeated inline in each of the 12 dimension blocks.
- The severity definitions appear in both `<issue_structure>` and `<verification_process>` Step 10.

Guide §19 (Modularity) recommends decomposing large instructions into focused atomic modules. The 12 verification dimensions could each be a separately loaded reference file (as the few-shot examples already are), reducing the core prompt to a lightweight orchestration layer.

### W9 — No tie-breaking rule for the pass/fail boundary (Guide §5, §22 Pattern 4)

The agent defines three severity levels (blocker, warning, info) and states that `issues_found` fires on "one or more blockers or warnings." But it never specifies tie-breaking behavior at the uncertainty boundary: what happens when a finding could be classified as either a warning or a blocker? What is the cost asymmetry — is it better to over-report blockers (forcing unnecessary revision loops) or under-report them (allowing flawed plans to execute)?

Guide §5 states: "Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry." Guide §22 Pattern 4: "The tie-breaking rule is the instruction that fires at the margin."

The domain's cost asymmetry is clear: false negatives (missed blockers that reach execution) are more expensive than false positives (revision loops). This should be stated explicitly.

### W10 — Frontmatter is minimal; `agentMetadata` fields are absent (Guide §11, §17)

**Current frontmatter:**
```yaml
name: gsd-plan-checker
description: Verifies plans will achieve phase goal before execution. Goal-backward analysis of plan quality. Spawned by /gsd-plan-phase orchestrator.
tools: Read, Bash, Glob, Grep
color: green
```

Guide §11 YAML frontmatter and §17 Subagent configuration require: `agentType`, `model`, `permissionMode`, `disallowedTools`, `whenToUse` (action-specific trigger description for the orchestrating model), and `criticalSystemReminder`. The current frontmatter is missing:
- `disallowedTools` — no tool restrictions declared; agent should declare `Edit`, `Write`, `Agent`, `NotebookEdit` as disallowed since it is read-only
- `whenToUse` — description exists but is not written as an action-specific trigger for an orchestrator
- `criticalSystemReminder` — no safety reminder for the spawning context
- `model` — no model specification

---

## Concrete Improvements

### Improvement 1: Replace generic role with specific persona + strengths list

Replace the opening `<role>` content with a proper `<persona>` tag:

```xml
<persona>
You are a pre-execution plan auditor for the GSD workflow system. Your sole job is
goal-backward verification: start from what a phase must deliver, then determine
whether the plans in front of you will actually achieve it.

Your job is NOT to verify that code works — it is to verify that plans describe
work that will work. gsd-verifier handles post-execution; you handle pre-execution.

Your strengths:
- Detecting requirement gaps: requirements that have no covering tasks
- Identifying scope reduction: plans that reference decisions but deliver shadows of them
- Finding broken dependency graphs: cycles, forward references, orphaned plans
- Spotting missing wiring: artifacts created in isolation without connection tasks
- Catching context budget overruns before they degrade execution quality
</persona>
```

### Improvement 2: Add explicit task/audience/quality_bar triad

Add immediately after `<persona>`:

```xml
<task>
Verify that the plans in the specified phase will achieve the phase goal before
execution begins. Return either VERIFICATION PASSED or ISSUES FOUND with a
structured YAML issues list.
</task>

<audience>
The gsd-plan-phase orchestrator (machine consumer of VERIFICATION PASSED / ISSUES
FOUND output) and the developer who reads the issues report to revise plans.
</audience>

<quality_bar>
A high-quality verification: (1) checks all 12 dimensions, (2) reports every
blocker before any warning, (3) provides a specific fix_hint for each issue,
(4) never reports issues outside the plan files' scope, (5) returns a parseable
VERDICT line the orchestrator can extract without ambiguity.
</quality_bar>
```

### Improvement 3: Add a parseable VERDICT line to output format

In `<structured_returns>`, append a required final line to both return formats:

```xml
<output_format>
End every response with a verdict line in exactly this format — it is parsed by
the gsd-plan-phase orchestrator:

VERDICT: PASS
or
VERDICT: FAIL

Use the literal string `VERDICT: ` followed by exactly one of `PASS` or `FAIL`.
Plain text only: no markdown bold, no punctuation after the value, no variation.
</output_format>
```

### Improvement 4: Convert `<anti_patterns>` to positive instructions

Replace the seven DO NOT entries with positive specifications:

```xml
<constraints>
  <scope>
    Analyze plan text only. Code existence checks are gsd-verifier's domain.
    All evidence must come from PLAN.md file content — no application execution.
  </scope>

  <required_specificity>
    Flag any task whose action is a noun phrase rather than a concrete action:
    "implement auth" is insufficient; "create POST /api/auth/login in route.ts
    with bcrypt comparison and JWT signing" is sufficient.
  </required_specificity>

  <dependency_coverage>
    Build and validate the full dependency graph for every plan in the phase.
    A dependency error that surfaces at execution time is a verification miss.
  </dependency_coverage>

  <scope_enforcement>
    Report scope overruns. A plan with 5+ tasks must be flagged as a blocker
    regardless of task quality.
  </scope_enforcement>

  <task_field_depth>
    Read the action, verify, and done fields of each task — not just its name.
    A well-named task with an empty action is an incomplete task.
  </task_field_depth>
</constraints>
```

### Improvement 5: Add a tie-breaking rule with explicit cost asymmetry

Add to `<issue_structure>` after the severity definitions:

```xml
<tie_breaking>
  When a finding could be either a warning or a blocker, classify it as a BLOCKER.
  A false positive (unnecessary revision loop) costs one planning cycle.
  A false negative (missed blocker reaching execution) costs the full execution
  context budget plus a forensics pass. Over-report at the margin.
</tie_breaking>
```

### Improvement 6: Add PASS/FAIL examples to dimension blocks (contrastive calibration)

For each dimension, add a PASS example alongside the existing FAIL example. Abbreviated template:

```yaml
# PASS example for Dimension 1
pass_example:
  dimension: requirement_coverage
  requirement: "AUTH-02 (logout)"
  covering_plan: "16-01"
  covering_task: 3
  task_action: "Create DELETE /api/auth/session with cookie clearing"
  status: COVERED

# FAIL example (already present)
issue:
  dimension: requirement_coverage
  severity: blocker
  description: "AUTH-02 (logout) has no covering task"
  ...
```

This establishes the boundary, not just the failure side.

### Improvement 7: Declare disallowed tools and criticalSystemReminder in frontmatter

Replace the current frontmatter:

```yaml
---
name: gsd-plan-checker
description: >
  Pre-execution plan auditor. Verifies plans will achieve the phase goal through
  goal-backward analysis. Spawned by gsd-plan-phase after planning completes.
tools: Read, Bash, Glob, Grep
color: green
agentMetadata:
  agentType: PlanChecker
  permissionMode: dontAsk
  disallowedTools:
    - Agent
    - Edit
    - Write
    - NotebookEdit
    - ExitPlanMode
  whenToUse: >
    Use when you need to verify that phase plans will achieve the phase goal before
    executing them. Accepts phase number or phase directory. Returns VERIFICATION
    PASSED or ISSUES FOUND with structured YAML issues list.
  criticalSystemReminder: >
    CRITICAL: This is a READ-ONLY analysis task. Do not edit, create, or delete
    any files. Analyze plan files only; do not execute application code.
---
```

### Improvement 8: Replace hardcoded paths with template variables

In frontmatter `variables` and in the prompt body:

```yaml
variables:
  - GSD_REFERENCES_PATH
  - PHASE_ARG
```

In prompt body, replace:
```
@~/.claude/get-shit-done/references/gates.md
```
with:
```
@${GSD_REFERENCES_PATH}/gates.md
```

---

## Overall Score: 6 / 10

**Justification:**

The agent is functionally sophisticated — it covers 12 distinct verification dimensions, uses structured XML tags throughout, provides concrete YAML examples for every dimension, and correctly applies the adversarial mindset for scope reduction detection. The output format templates are among the most complete in the GSD agent suite.

However, it falls short on guide fundamentals that have direct quality impact:

- The persona is a task description, not a behavioral constraint (W1) — this is a first-principles failure in §6.
- Seven anti-pattern instructions are negations that the guide explicitly requires to be converted (W4).
- There is no machine-parseable VERDICT line (W5), which is a reliability failure for the orchestrator integration.
- Context placement puts output format in the lower third where it receives the least model attention (W3).
- The prompt is ~960 lines with significant redundancy (W8), violating the compression requirement of §10.
- Frontmatter is missing the `disallowedTools` and `criticalSystemReminder` fields that the guide requires for subagent safety (W10).

The dimension coverage and example quality hold this at a 6. Addressing W1, W4, W5, and W10 would move this to an 8.
