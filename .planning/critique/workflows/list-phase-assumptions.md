# Critique: list-phase-assumptions.md

## Summary

`list-phase-assumptions.md` is a well-conceived workflow with a clear purpose and a logical five-step process. Its intent — surfacing Claude's implicit assumptions before planning so users can correct them early — is expressed cleanly in the `<purpose>` block, and the five assumption categories (technical approach, implementation order, scope, risks, dependencies) give the analysis step a useful skeleton. However, the workflow is written largely as informal prose and code-fence templates rather than following the guide's structural and framing conventions. The most significant gaps are: absent XML tag structure for prompt sections (Section 4), no explicit output format specification beyond an inline Markdown template (Section 7), negative-framing errors remaining in the instruction text (Section 5), no persona assignment despite the open-ended analysis task requiring a specific voice (Section 6), and missing conditional branching for its own branching logic (Section 5). These are fixable with targeted revisions that would substantially improve consistency and reliability of output.

---

## Strengths

- **Section 1 Action 1 (task components):** The `<purpose>` block clearly states what is being requested (surface assumptions), why it matters (enable early correction), and implicitly what a good response looks like (five structured assumption categories with confidence markers). All three task components are present.

- **Section 16 (multi-phase workflows):** The workflow uses named `<step>` tags with explicit `name` attributes, which follows the phase-pattern spirit even though it uses `step` rather than the guide's `phase` tags. Cognitive boundaries between steps are clear, and each step has a single responsibility.

- **Section 5 (conditional instructions):** The `validate_phase` step uses explicit conditional branching (`If argument missing`, `If phase not found`, `If phase found`) with early exits. This is exactly the pattern described in Section 5 under "Conditional instructions."

- **Section 21 (tone and style):** The success criteria section at the bottom is concise and checklist-style, giving the model a verifiable definition of done. This follows the guide's recommendation to give the model a clear quality bar.

- **Section 19 (modularity):** The workflow has a single responsibility — assumption elicitation — and does not attempt to combine planning or execution concerns. This aligns with Section 19's single-responsibility principle.

- **Section 1 Action 1 (quality bar via confidence levels):** Marking assumptions with `Fairly confident`, `Assuming`, and `Unclear` levels is a practical calibration mechanism that adds structure to inherently subjective outputs.

---

## Issues

### Issue 1 — Missing XML tag structure for prompt sections (Section 4, Action 2)

**Guide principle:** Section 4 Action 2 requires that when a prompt contains multiple distinct sections, each section be wrapped in a semantically named XML tag. The guide states this is "strictly better than markdown headers or `---` delimiters for Claude-class models."

**What's wrong:** The workflow body uses a hybrid of code fences, Markdown headers, and bold text to delimit sections and sub-instructions. The top-level `<purpose>` and `<process>` tags are present, and the `<step>` and `<success_criteria>` tags are used, but the internal sections of each step — specifically the output template inside `present_assumptions` and the inline bash command in `validate_phase` — are formatted with code fences and prose rather than semantically named XML tags. The bash validation command is particularly weak: it is rendered as a code block with no surrounding tag naming what it *is* (a validation command, a context-read instruction, etc.).

**Concrete fix:** Wrap the bash command in a `<validation_command>` tag. Wrap the output template in an `<output_format>` tag nested inside `<step name="present_assumptions">`. For example:

```xml
<step name="validate_phase" priority="first">
  <validation_command>
    Bash: cat .planning/ROADMAP.md | grep -i "Phase ${PHASE}"
  </validation_command>

  <output_format>
    On missing argument:
    Error: Phase number required.
    Usage: /gsd-list-phase-assumptions [phase-number]
    Example: /gsd-list-phase-assumptions 3
  </output_format>
</step>
```

---

### Issue 2 — Output format not fully specified upfront (Section 7 Action 1; Section 22 Pattern 3)

**Guide principle:** Section 7 Action 1 requires that structured output tasks split into a reasoning step and a formatting step, or specify the required output structure completely and upfront. Section 22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task."

**What's wrong:** The output template in `present_assumptions` is embedded inside the step that also does the analysis. The model is expected to simultaneously reason about assumptions and format the output into the prescribed template. This collapses the two-step pattern the guide requires. Furthermore, the template uses only loose Markdown with placeholder brackets (`[List assumptions about how to implement]`) rather than a fully specified `<output_format>` block with field semantics.

**Concrete fix:** Extract the output template into a standalone `<output_format>` section (either at the top of the file or as a named child of the `present_assumptions` step), separate from the analysis instructions. Specify each field's purpose and expected content type explicitly:

```xml
<output_format>
  ## My Assumptions for Phase ${PHASE}: ${PHASE_NAME}

  ### Technical Approach
  Bulleted list. Each item: "I'd use X because Y." Confidence level prefix required.

  ### Implementation Order
  Numbered list. Sequence with rationale for each ordering decision.

  ### Scope Boundaries
  Three labeled sub-lists: In scope / Out of scope / Ambiguous.

  ### Risk Areas
  Bulleted list. Each item names the risk and explains why it's risky.

  ### Dependencies
  Three labeled sub-lists: From prior phases / External / Feeds into.

  ---
  Close with the literal prompt: "What do you think?"
  Then the three feedback prompts on separate lines.
</output_format>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Guide principle:** Section 5 Action 1 requires that all negative instructions ("do not", "avoid", "never" as primary directives) be rewritten as positive specifications of desired behavior before the prompt is emitted.

**What's wrong:** The `<purpose>` block contains: "No file output - purely conversational." This is a negative directive framed as a restriction. While brief, the guide requires converting this. Similarly, the instruction "Key difference from discuss-phase: This is ANALYSIS of what Claude thinks, not INTAKE of what user knows" uses negation (`not INTAKE`) rather than stating the positive behavior.

**Concrete fix:** Apply the conversion table from Section 5:
- "No file output" → "Respond conversationally only. All output is directed to the user in the chat interface."
- "not INTAKE of what user knows" → "This workflow surfaces Claude's own reasoning and assumptions. User knowledge is gathered by /gsd-discuss-phase."

---

### Issue 4 — No persona assigned for an open-ended analytical task (Section 6, Actions 1 and 2)

**Guide principle:** Section 6 Action 1 states that open-ended or stylistic tasks should receive a specific, role-constrained persona. Section 6 Action 2 specifies that the persona must constrain register, voice, or domain-specific style — not just state generic expertise.

**What's wrong:** The workflow is an open-ended analytical task: Claude is asked to reason about what it *thinks*, express uncertainty, surface hidden assumptions, and present them in a candid, self-reflective voice. This is precisely the type of task that benefits from persona assignment to constrain tone and epistemic posture. Without a persona, Claude may default to generic assistant hedging rather than the confident-but-honest introspective voice the workflow implicitly requires.

**Concrete fix:** Add a persona block at the top of the file:

```xml
<persona>
You are a planning analyst conducting a pre-work assumption audit.
Your job is to reason transparently about your own defaults, biases, and inferences —
not to present a polished plan, but to expose your working assumptions so the user can
correct them before work begins. Be direct about uncertainty. Use "I'd assume" and
"I'm not sure" freely. Favor candor over confidence.
</persona>
```

---

### Issue 5 — Branching in gather_feedback lacks explicit conditional structure (Section 5; Section 16)

**Guide principle:** Section 5 ("Conditional instructions") and Section 16 ("Scenario-based branching") both require that branching logic be expressed as explicit named conditions rather than left as implied prose branches.

**What's wrong:** The `gather_feedback` step uses an if/else branching structure (`If user provides corrections` / `If user confirms assumptions`), but these are presented as bold prose headers inside a step block rather than as named `<scenario>` tags or explicit conditional syntax. The condition predicates are also underspecified: "provides corrections" and "confirms assumptions" are not mutually exclusive — the user might confirm some assumptions and correct others simultaneously, a case the workflow does not handle.

**Concrete fix:** Refactor `gather_feedback` using `<scenarios>` tags and enumerate a third case:

```xml
<step name="gather_feedback">
  <scenarios>
    <scenario condition="user_confirms_all">
      Respond: "Assumptions validated." Proceed to offer_next.
    </scenario>
    <scenario condition="user_provides_corrections">
      List corrections explicitly. Summarize updated understanding.
      Proceed to offer_next.
    </scenario>
    <scenario condition="user_confirms_some_corrects_some">
      Acknowledge confirmed assumptions briefly.
      List corrections. Summarize how the updated picture differs.
      Proceed to offer_next.
    </scenario>
  </scenarios>
</step>
```

---

### Issue 6 — No explicit audience definition (Section 1, Action 2)

**Guide principle:** Section 1 Action 2 requires that the audience be explicitly encoded in the prompt: their domain knowledge, vocabulary level, and relevant assumptions they bring.

**What's wrong:** The workflow never states who the user is — a developer using the GSD workflow system. This matters because the assumptions Claude surfaces should be calibrated to a technically literate user who understands phase-based project planning. Without this, Claude may over-explain obvious concepts or under-explain domain-specific ones.

**Concrete fix:** Add an `<audience>` block after the `<purpose>`:

```xml
<audience>
A developer using the GSD workflow system to plan a phase of work.
Assumes familiarity with the project's roadmap, phase structure, and the GSD command set.
Technical vocabulary is appropriate; no need to explain general software concepts.
</audience>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (a user-facing conversational workflow, not a single LLM inference prompt).

### Task Specification
- [PASS] Intent, audience, and quality bar are all explicit in the prompt — intent and quality bar are present; audience is implicit but inferable
- [PASS] All constraints are compatible — no conflicts between scope, length, or depth

### Chain of Thought
- [N/A] CoT is included only for math, symbolic reasoning, or multi-step logic tasks
- [N/A] CoT trigger used
- [N/A] Reasoning is elicited before the answer, not after
- [N/A] CoT traces are treated as heuristic aids

### Few-Shot Examples
- [FAIL] Examples selected by semantic similarity — no examples provided
- [FAIL] 2–5 examples total — zero examples; the output template uses placeholder brackets, not concrete examples
- [N/A] Ordered simple → complex
- [N/A] Examples span diverse sub-types
- [N/A] Format is consistent across all examples
- [N/A] Example order is fixed across evaluation runs

### Formatting
- [PASS] Instruction is complete and clear before formatting is applied
- [FAIL] Prompt sections are separated by semantically named XML tags — internal step structure uses Markdown headers and code fences, not XML tags
- [N/A] At least 3 format variants will be tested on the target model

### Instruction Framing
- [FAIL] All negative instructions have been converted to positive equivalents — "No file output" and "not INTAKE" remain
- [PASS] Priority order is explicit when multiple criteria apply — `validate_phase` carries `priority="first"`
- [N/A] Tie-breaking rules match the domain's cost asymmetry

### Persona
- [FAIL] Persona is included only for open-ended or stylistic tasks — open-ended task has no persona at all
- [N/A] Persona is specific (constrains voice/register), not generic
- [N/A] Persona descriptor is gender-neutral

### Output Format
- [FAIL] Structured output tasks use a two-step reasoning-then-format approach — analysis and output formatting are collapsed into one step
- [N/A] Single-call JSON places reasoning fields before answer fields
- [N/A] Constrained decoding is adopted only after free-form + post-processing has proven insufficient
- [N/A] Machine-parsed output uses exact format specification

### Context Placement
- [PASS] Task instruction is at the start of the prompt — `<purpose>` leads
- [N/A] Primary document or input is at the end of the prompt
- [N/A] Background context is in the middle
- [PASS] All irrelevant context has been removed
- [N/A] Time-sensitive injected context is labeled as a snapshot

### Self-Consistency
- [N/A] Self-consistency is applied only to tasks with a single correct answer
- [N/A] Inference budget permits 15–20 samples

### Prompt Length
- [PASS] Redundant instructions and repeated context have been removed
- [N/A] Long prompts have been compressed before sending
- [N/A] RAG context is the extracted relevant passage only

### System / User Split
- [N/A] Persistent instructions are in the system prompt
- [N/A] Task-specific instructions are in the user prompt
- [PASS] Each instruction appears in exactly one location
- [N/A] Safety-critical constraints have external validation

### Agent / Subagent
- [N/A] Agent prompts are fully self-contained
- [N/A] All file paths in agent output are absolute
- [N/A] Parallel agents are launched in a single message block
- [N/A] Adversarial probes are specified for verification agents

### Structural Architecture
- [PASS] Large prompts are decomposed into atomic, single-responsibility modules
- [PASS] Template variables use ${VARIABLE_NAME} syntax — `${PHASE}` and `${PHASE_NAME}` are used correctly
- [PASS] Modules compose at runtime via variable substitution, not copy-paste

### Constraint Enforcement
- [N/A] Every restriction is paired with an equally concrete permission
- [N/A] Hard exclusion lists are enumerated, not described qualitatively
- [N/A] Known edge cases have precedent-style rulings
- [N/A] Confidence thresholds are numeric, not qualitative — the workflow uses qualitative confidence labels ("Fairly confident", "Assuming", "Unclear") which are appropriate for this task type but could be made more precise

### Decision Frameworks
- [N/A] Multi-option recommendations use an explicit decision tree or comparison table
- [N/A] Criteria checklists gate complex approaches
- [N/A] Action permissions are framed around reversibility

### Multi-Phase Workflows
- [PASS] Complex tasks are organized into explicit named phases — named `<step>` tags used throughout
- [PASS] Required steps are distinguished from type-specific steps — `priority="first"` on validate_phase
- [FAIL] Scenario-based branching handles multiple paths explicitly — `gather_feedback` uses prose conditionals, not `<scenario>` tags; the mixed-feedback case is unhandled

### Memory and Continuity
- [N/A] Memory templates use XML tags as section labels
- [N/A] Compaction summaries include discoveries and failed approaches
- [N/A] Next steps are tied to the user's most recent explicit request

### Modularity
- [PASS] Each prompt component has a single responsibility
- [FAIL] Scope boundaries state both inclusions and exclusions — scope of the workflow itself (what it does vs. what discuss-phase does) is described only in prose in the purpose block, not in explicit `<scope><include><exclude>` tags

### Safety and Trust
- [N/A] Validation is at system boundaries only
- [N/A] Dual-use capabilities state permissions before restrictions
- [N/A] Authorization is narrow-scoped

### Tone and Style
- [PASS] Size constraints use numeric limits, not qualitative descriptors — N/A in this context; no length constraints are needed
- [PASS] Instructions use imperative present tense — the step instructions are directive
- [N/A] Working notes are in analysis tags, not user-facing output

### Optimization
- [N/A] Prompt is flagged as a draft for automated optimization
- [N/A] Correct optimizer selected
- [N/A] Held-out test set reserved before optimization begins

---

## Recommendations

Prioritized by impact on output reliability and guide compliance:

**1. Add a `<persona>` block (Section 6, Actions 1–2; Section 22 Pattern 1)**
This is the highest-leverage fix. The workflow asks Claude to self-reflect and express calibrated uncertainty — a register that does not emerge reliably without explicit framing. A persona that defines the epistemic posture ("expose assumptions candidly, prefer 'I'd assume' over confident assertion") will produce more consistent and useful outputs than the current persona-free prompt. Add before the `<process>` block.

**2. Separate the analysis step from the output format step (Section 7 Action 1; Section 22 Pattern 3)**
Split `analyze_phase` and `present_assumptions` so that the reasoning about assumptions happens in one step and the formatting of that reasoning happens in a separate, fully specified `<output_format>` block. This prevents the model from collapsing analysis and presentation, which degrades both. Extract the output template into a dedicated `<output_format>` section with field-level descriptions.

**3. Convert all negative instructions to positive equivalents (Section 5, Action 1)**
Audit the `<purpose>` block and rewrite "No file output" and "not INTAKE" as positive behavioral specifications. This is a mechanical fix but prevents the model from fixating on what not to do rather than what to do.

**4. Refactor `gather_feedback` with explicit `<scenario>` tags covering the mixed-feedback case (Section 16; Section 5)**
The current prose conditionals leave the mixed-confirmation case unhandled. Rewriting as named `<scenario>` tags with three explicit branches (all confirmed, all corrected, partial) closes the gap and brings the workflow in line with the guide's scenario-based branching pattern.

**5. Add at least one concrete example to the output template (Section 22 Pattern 2; Section 3)**
The `present_assumptions` output template uses placeholder brackets (`[List assumptions about how to implement]`) with no example of what a filled-in entry looks like. Adding one worked example per assumption category — showing the target specificity, confidence label format, and sentence style — gives the model a calibrating reference point and materially reduces output variance.
