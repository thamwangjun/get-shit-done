# Critique: plant-seed.md

## Summary

`plant-seed.md` is a well-structured, purpose-driven workflow that clearly explains the value proposition of seeds over deferred items and organises the interaction flow into discrete named steps. The core logic is sound: parse an idea, gather context interactively, search the codebase for breadcrumbs, write a structured file, commit, and confirm. However, the prompt relies heavily on natural-language prose and raw markdown code blocks where semantically named XML tags would give the model richer signal (Section 4). The output template is embedded inside a step rather than declared upfront as a standalone `<output_format>` block (Section 7, Pattern 3). Instruction framing contains implicit negatives, missing priority ordering, and no tie-breaking rules. There is no explicit persona, no `<quality_bar>`, no constraint pair (what is permitted vs. reserved), and no frontmatter agent configuration. These are all solvable with targeted additions rather than a full rewrite.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** Each step is a named `<step>` element with a clear, single responsibility. The ordering (parse → create dir → gather context → breadcrumbs → generate ID → write → commit → confirm) maps naturally to the guide's phase pattern.

- **Section 1 Action 1 — Three task components partially present.** The `<purpose>` block states what the workflow does, why seeds are better than deferred items, and implicitly what a correct seed looks like (trigger, scope, breadcrumbs). This is more than most workflow files provide.

- **Section 13 — Template variable injection used consistently.** `$ARGUMENTS`, `$IDEA`, `$TRIGGER`, `$WHY`, `$SCOPE`, `$BREADCRUMBS`, `$KEYWORD`, `$PADDED`, and `$NEXT` are all referenced by name, making the data flow readable.

- **Section 5 — Conditional instruction for text mode.** The `TEXT_MODE` conditional in `gather_context` correctly anticipates runtime differences (non-Claude runtimes) and specifies an alternative interaction pattern — this is a good application of Section 5's conditional branching guidance.

- **Section 22 Pattern 5 (Modularity) — Single responsibility.** The file handles exactly one concern — seed creation — without straying into milestone planning, backlog triage, or other GSD concerns.

- **Success criteria block present.** The `<success_criteria>` block at the end gives a verifiable completion checklist, which supports the guide's emphasis on explicit quality bars (Section 1 Action 1c).

---

## Issues

### Issue 1 — Section 4 Action 2: Prompt sections not wrapped in semantically named XML tags

**Guide principle:** "When a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag."

**What's wrong:** The top-level structure uses `<purpose>` and `<process>` but the content inside steps is prose and raw markdown fenced blocks. There is no `<task>`, `<output_format>`, `<constraints>`, or `<quality_bar>` tag anywhere. The guide's XML tag vocabulary (Section 4, tag table) is almost entirely absent.

**Concrete fix:** Wrap the workflow in the standard top-level tag set:

```xml
<task>
Capture a forward-looking idea as a structured seed file with trigger conditions.
</task>

<quality_bar>
A valid seed file: has a complete frontmatter block, a populated "Why This Matters" section,
at least one specific trigger condition, a scope estimate, and at least one breadcrumb file path.
</quality_bar>

<output_format>
Write .planning/seeds/SEED-{PADDED}-{slug}.md using the template in the write_seed step.
The frontmatter must include: id, status, planted, planted_during, trigger_when, scope.
</output_format>
```

---

### Issue 2 — Section 1 Action 2: Audience not explicit

**Guide principle:** "Identify the audience. Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

**What's wrong:** The workflow has no `<audience>` declaration. The model must infer that the consumer is a developer using the GSD workflow system. This matters because the depth of explanation in questions and confirmations should be calibrated to that audience.

**Concrete fix:** Add after `<task>`:

```xml
<audience>
Software developers using the GSD planning workflow. Familiar with git, markdown, milestones,
and phases. Expect terse, action-oriented prompts — no hand-holding.
</audience>
```

---

### Issue 3 — Section 7 / Pattern 3: Output format not declared upfront; embedded inside a step

**Guide principle:** "State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought." (Pattern 3)

**What's wrong:** The seed file template is buried in `<step name="write_seed">`. A model generating the seed must scroll through four prior steps before encountering what the final artifact looks like. This violates both Pattern 3 (format upfront) and Section 8 Action 1 (task instruction at the very start).

**Concrete fix:** Extract the markdown template into a top-level `<output_format>` block immediately after `<task>`. The `write_seed` step can then reference it by name: "Write the seed file using the format defined in `<output_format>`."

---

### Issue 4 — Section 5 Action 1: Negative instructions not converted to positive equivalents

**Guide principle:** "Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**What's wrong:** The text mode instruction reads: "replace every `AskUserQuestion` call with a plain-text numbered list." This is expressed as a replacement rule (negative-by-implication: "do not use AskUserQuestion"). More importantly, the implicit instruction throughout is "do not skip steps" — but it is never stated. There is no explicit statement of what the model must always do.

**Concrete fix:** Convert to positive imperatives:

```
When TEXT_MODE is active: present each question as a numbered list and collect the user's
typed response. Store the response exactly as the corresponding variable.
```

Add a universal positive rule: "Complete every step in sequence. Store each variable before advancing to the next step."

---

### Issue 5 — Section 5 (Priority Ordering): No priority order when steps conflict or data is missing

**Guide principle:** "When multiple considerations apply, list them with explicit priority." The guide's `<priority_order>` tag is the prescribed mechanism.

**What's wrong:** If `$ARGUMENTS` contains both an idea summary and a `--text` flag, the parsing order is implied but not stated. If `$KEYWORD` is ambiguous (too broad), the grep may return 0 or 100 results — there is no rule governing what to do. If `STATE.md` or `ROADMAP.md` do not exist, the breadcrumb step has no fallback.

**Concrete fix:** Add:

```xml
<priority_order>
  1. Explicit $ARGUMENTS values take precedence over interactive prompts
  2. --text flag detection before any AskUserQuestion call
  3. Breadcrumb search: codebase files first, then STATE.md, then ROADMAP.md
  4. If none found, write "No breadcrumbs identified" rather than leaving the section empty
</priority_order>
```

---

### Issue 6 — Section 14 / Section 6: No persona; no constraint pair

**Guide principle (Section 6):** "Assign a persona for open-ended or stylistic tasks where voice matters." **Guide principle (Section 14):** "Pair every restriction with what IS permitted, stated equally concretely."

**What's wrong:** There is no `<persona>` to anchor the model's role during the interactive gathering steps. Without one, the model may adopt a verbose assistant register instead of the terse GSD style. There are also no `<constraints>` defining what the model is allowed or not allowed to do during execution (e.g., can it write files other than the seed? can it make git commits without confirmation?).

**Concrete fix (persona):**

```xml
<persona>
You are the GSD seed recorder. Your register is terse and action-oriented.
Ask only what the steps require. Do not elaborate or editorialize.
</persona>
```

**Concrete fix (constraints):**

```xml
<constraints>
  <take_freely>
    - Read any file in the repository (grep, find, cat, ls)
    - Write to .planning/seeds/ only
    - Generate the seed ID from the existing file count
  </take_freely>
  <confirm_with_user>
    - Running git commit (the commit_seed step requires user confirmation if git hooks are configured)
  </confirm_with_user>
</constraints>
```

---

### Issue 7 — Section 11 Action 3: Instruction duplication / redundancy

**Guide principle:** "State each instruction exactly once. Audit the full prompt before emitting it and consolidate every duplicated instruction to a single canonical location."

**What's wrong:** The trigger condition concept is stated three times: in `<purpose>` ("Define WHEN to surface"), in the `gather_context` step ("When should this idea surface?"), and in the `write_seed` template ("This seed should be presented during /gsd-new-milestone when..."). The `$TRIGGER` value is also written into both the frontmatter `trigger_when` field and the `## When to Surface` section body — with a separate "trigger condition 1 / trigger condition 2" elaboration that is never explained. This is duplication without disambiguation.

**Concrete fix:** Keep the single canonical explanation in `<purpose>`. In `gather_context`, refer to it by variable only. In `write_seed`, use `$TRIGGER` directly in both locations without the unexplained bullet list placeholders, or explain that the model should decompose `$TRIGGER` into discrete conditions.

---

### Issue 8 — Section 17 / Section 11: No frontmatter agent configuration

**Guide principle (Section 11):** "For agent prompt files, encapsulate all persistent properties in frontmatter." **Guide principle (Section 17):** "Define all agent properties in the frontmatter: agentType, model, disallowedTools, whenToUse, criticalSystemReminder."

**What's wrong:** The workflow has no YAML frontmatter at all. There is no `name`, `description`, `whenToUse`, `disallowedTools`, or model specification. As a result, the orchestrating model has no machine-readable trigger condition for when to invoke this workflow, and tool permissions are unconstrained.

**Concrete fix:** Add frontmatter:

```yaml
<!--
name: 'Workflow: Plant Seed'
description: Capture a forward-looking idea with trigger conditions as a dormant seed file.
agentMetadata:
  agentType: 'PlantSeed'
  whenToUse: >
    Use when the user has an idea they want to save for a future milestone. Triggered by
    phrases like "save this for later", "plant a seed", "future idea", or /gsd-plant-seed.
  disallowedTools:
    - Agent
-->
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL — audience and quality_bar tags absent |
| All constraints are compatible — no conflicts | PASS — no detected conflicts |
| **Chain of Thought** | |
| CoT included only for math/symbolic/multi-step logic | N/A — no CoT trigger used; task is procedural |
| CoT trigger phrase used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | FAIL — no examples provided |
| 2–5 examples total | FAIL — zero examples |
| Ordered simple → complex | FAIL — no examples |
| Examples span diverse sub-types | FAIL — no examples |
| Format consistent across examples | FAIL — no examples |
| Example order fixed across evaluation runs | N/A |
| **Formatting** | |
| Instruction complete and clear before formatting | PASS — purpose and steps are clear |
| Prompt sections separated by semantically named XML tags | FAIL — only `<purpose>`, `<process>`, `<step>` used; `<task>`, `<output_format>`, `<constraints>`, `<audience>`, `<quality_bar>` absent |
| At least 3 format variants tested | FAIL — no evidence of format testing |
| **Instruction Framing** | |
| Negative instructions converted to positive equivalents | FAIL — text mode instruction uses replacement framing |
| Priority order explicit when multiple criteria apply | FAIL — no `<priority_order>` block |
| Tie-breaking rules match domain cost asymmetry | FAIL — no tie-breaking specified |
| **Persona** | |
| Persona included only for open-ended/stylistic tasks | N/A — persona would be appropriate here but is absent |
| Persona is specific (constrains voice/register) | FAIL — no persona |
| Persona descriptor is gender-neutral | N/A |
| **Output Format** | |
| Structured output uses two-step reasoning-then-format | N/A — no structured JSON/XML output |
| Single-call JSON places reasoning before answer fields | N/A |
| Constrained decoding adopted only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL — seed template is embedded in a step, not declared upfront |
| **Context Placement** | |
| Task instruction at start of prompt | FAIL — `<purpose>` is informational, not a direct task instruction |
| Primary document/input at end of prompt | N/A — no document input |
| Background context in middle | PASS — breadcrumb gathering is mid-process |
| All irrelevant context removed | PASS — no observable bloat |
| Time-sensitive injected context labeled as snapshot | N/A |
| **Self-Consistency** | |
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | FAIL — trigger concept stated three times |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |
| **System/User Split** | |
| Persistent instructions in system prompt | FAIL — no frontmatter separates persistent from task-specific |
| Task-specific instructions in user prompt | FAIL — no split defined |
| Each instruction in exactly one location | FAIL — trigger definition duplicated |
| Safety-critical constraints have external validation | N/A |
| **Agent / Subagent** | |
| Agent prompts fully self-contained | PASS — workflow is self-contained |
| All file paths in agent output are absolute | FAIL — `.planning/seeds/` is relative |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | |
| Large prompts decomposed into atomic single-responsibility modules | PASS — single-concern file |
| Template variables use ${VARIABLE_NAME} syntax with fallback | FAIL — variables use `$VAR` not `${VAR}`, and no fallbacks defined |
| Modules compose at runtime via variable substitution | PASS — composition pattern is used |
| **Constraint Enforcement** | |
| Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block |
| Hard exclusion lists enumerated | FAIL — no exclusions defined |
| Known edge cases have precedent-style rulings | FAIL — missing file fallback not addressed |
| Confidence thresholds numeric | N/A |
| **Decision Frameworks** | |
| Multi-option recommendations use decision tree or comparison table | N/A |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | FAIL — commit step has no reversibility framing |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | PASS — `<step name="...">` elements used throughout |
| Required steps distinguished from type-specific | FAIL — all steps treated as required; text-mode branch is inline rather than branched |
| Scenario-based branching handles multiple paths explicitly | FAIL — text mode is inline comment, not a `<scenario>` block |
| **Memory and Continuity** | |
| Memory templates use XML tags as section labels | N/A — not a memory workflow |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | |
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — no `<scope>` block with explicit exclusions |
| **Safety and Trust** | |
| Validation at system boundaries only | PASS — no over-validation observed |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL — commit step runs without explicit user confirmation gate |
| **Tone and Style** | |
| Size constraints use numeric limits, not qualitative descriptors | FAIL — no output size constraints specified |
| Instructions use imperative present tense | PASS — steps use imperative form ("Parse", "Ask", "Search", "Write") |
| Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | |
| Prompt flagged as draft for automated optimization | FAIL — no optimization flag |
| Correct optimizer selected | FAIL — not specified |
| Held-out test set reserved | FAIL — not specified |

---

## Recommendations

Ordered by impact on model behavior and output consistency.

### 1. Add top-level `<task>`, `<output_format>`, `<audience>`, and `<quality_bar>` tags (Section 4 Action 2, Section 1 Actions 1–2, Pattern 3)

This is the highest-impact change. Extract the seed file template from `write_seed` into a standalone `<output_format>` block at the top of the prompt. Add `<task>` to state the directive clearly. Add `<audience>` and `<quality_bar>`. This restructuring alone resolves Issues 1, 2, and 3 and shifts the prompt from informational to instructional.

### 2. Add YAML frontmatter with `whenToUse`, `disallowedTools`, and agent identity (Section 11 / Section 17)

Without frontmatter, the orchestrator has no machine-readable trigger for this workflow and tool permissions are undefined. Add the frontmatter block described in Issue 8. This is a low-effort, high-value addition that brings the file in line with every other agent/workflow prompt in the guide.

### 3. Add `<constraints>` block with `<take_freely>` and `<confirm_with_user>` (Section 14, Section 15 reversibility framework)

The `commit_seed` step runs a git commit without any confirmation gate or reversibility framing. Specifying what the model can do freely vs. what requires user confirmation makes the blast radius of this workflow explicit and auditable. See the concrete fix in Issue 6.

### 4. Add `<priority_order>` and missing-data fallbacks (Section 5 priority ordering)

The breadcrumb step has no rule for zero results, and the argument parsing step has no stated order when `$ARGUMENTS` contains multiple tokens. Adding a `<priority_order>` block (Issue 5) and explicit fallback prose ("If no breadcrumbs are found, write 'No breadcrumbs identified.'") prevents silent gaps in the output seed file.

### 5. Convert the text-mode branch into a `<scenario>` block and add at least one few-shot example (Section 16 scenario branching, Section 3)

The text-mode logic is currently an inline comment inside `gather_context`. Extract it into a `<scenarios>` block with two explicit conditions: `scenario condition="text_mode_active"` and `scenario condition="ask_user_question_available"`. Additionally, add one minimal few-shot example showing a completed seed file — even a single example dramatically reduces variance in the model's output structure (Section 3 Action 2 shows 1 example yields "large gain").
