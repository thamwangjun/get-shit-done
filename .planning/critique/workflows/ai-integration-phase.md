# Critique: ai-integration-phase.md

## Summary

`ai-integration-phase.md` is a well-structured orchestration workflow that coordinates four subagents through a clear numbered sequence. It correctly uses XML tags for major sections (`<purpose>`, `<process>`, `<success_criteria>`), expresses subagent prompts with semantic XML tags (`<objective>`, `<files_to_read>`, `<input>`), and ships a concrete validation gate in Step 10. However, the workflow falls short of the guide's standards in several important areas: it uses prose-only step labels instead of the guide's `<phase>` tag pattern; it lacks explicit persona assignment for the orchestrating agent; it mixes negative constraint framing (`If "Skip": exit`) without positive equivalents; it omits output format specification for the orchestrator's own completions; it does not define conditional branching with `<scenarios>` tags; and it contains no `<constraints>` block defining what the orchestrator may and may not do. These gaps leave behavioral edges underspecified and reduce the prompt's fitness as a production-grade multi-phase workflow.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase structure.** The workflow is organized into twelve explicitly numbered sequential steps with clear named purposes (Initialize, Parse, Validate, Spawn, Commit, Display), forming a de-facto phase progression even without formal `<phase>` tags.
- **Section 4 (Formatting and Structure) — XML semantic tagging.** Subagent spawn payloads correctly use semantically named XML tags (`<objective>`, `<files_to_read>`, `<input>`, `<phase_context>`) rather than bare prose or markdown headers.
- **Section 14 (Constraint Enforcement) — validation gate.** Step 10 enumerates seven specific, testable completeness conditions for the AI-SPEC.md output, which functions as a structured hard-exclusion / confidence threshold mechanism.
- **Section 8 (Context Placement) — instruction-first ordering.** Each subagent spawn block leads with `<objective>` (the instruction) and ends with `<input>` (the primary content), correctly respecting the guide's high-attention-at-start, primary-content-at-end rule.
- **Section 17 (Agent and Subagent Patterns) — self-contained agent prompts.** Each spawn call directs the subagent to read its own instruction file and supplies all required context inline (`<files_to_read>`, `<input>` with resolved variables), consistent with the self-contained agent prompt pattern.
- **Section 13 (Structural Architecture) — template variable injection.** Variables such as `{phase_number}`, `{phase_name}`, `{primary_framework}`, `{ai_spec_path}` are injected consistently using the `{VARIABLE_NAME}` pattern throughout all spawn payloads.
- **Section 11 (System vs. User Prompt Allocation) — text mode conditional.** Step 4 correctly defines a conditional fallback (`TEXT_MODE`) for non-Claude runtimes, using an if/else branching pattern consistent with the guide's conditional instruction pattern.

---

## Issues

### Issue 1 — Missing `<phase>` tags for named phases (Section 16, "The phase pattern")

**Principle:** Complex multi-step tasks must be organized into explicit named phases using `<phase id="N" name="..." trigger="...">` XML tags. Phases create cognitive boundaries and allow the model to complete one phase fully before beginning the next.

**What is missing:** The twelve numbered steps are implemented as prose headers inside a single `<process>` block. There are no `<phase>` tags, no `trigger` attributes linking steps (e.g., Step 6 should only run after Step 5 produces a parsed selector output), and no explicit gating between phases. The model must infer sequencing from prose.

**Concrete fix:**

```xml
<phase id="1" name="Initialize and Validate" trigger="on_invocation">
  <!-- Steps 1–3: SDK init, phase parse, prerequisite check -->
</phase>

<phase id="2" name="Framework Selection" trigger="after_phase_1_complete">
  <!-- Step 5: Spawn gsd-framework-selector, parse output -->
</phase>

<phase id="3" name="Research and Spec Writing" trigger="after_framework_selection">
  <!-- Steps 6–9: Initialize AI-SPEC, spawn researcher agents -->
</phase>

<phase id="4" name="Validation and Commit" trigger="after_research_complete">
  <!-- Steps 10–12: Validate, commit, display completion -->
</phase>
```

---

### Issue 2 — No orchestrator `<persona>` defined (Section 6, Action 2; Section 22, Pattern 1)

**Principle:** For open-ended, multi-step orchestration tasks, a specific persona constrains the register, priorities, and decision-making style of every response. Generic or absent persona framing defaults to generic assistant behavior.

**What is missing:** The workflow assigns no persona to the orchestrating agent itself. The subagents (`gsd-framework-selector`, `gsd-ai-researcher`, etc.) load their own personas from their files, but the orchestrator operates without a role identity, voice constraint, or behavioral scope.

**Concrete fix:**

```xml
<persona>
You are an AI design contract orchestrator. Your role is to coordinate specialist subagents
into a complete, validated AI-SPEC.md — not to perform research or framework selection
yourself. Surface only coordination decisions and completion status to the user; delegate
all domain work to subagents.
</persona>
```

This constrains the orchestrator from drifting into researcher behavior and keeps output focused on coordination status.

---

### Issue 3 — No `<constraints>` block for orchestrator permissions (Section 14; Section 22, Pattern 9)

**Principle:** Every restriction must be paired with an equally concrete permission. Hard action boundaries prevent orchestrators from taking unintended actions (editing files, making direct API calls) that belong to subagents.

**What is missing:** The workflow has no `<constraints>` block specifying what the orchestrating agent may and may not do. In particular, it is unclear whether the orchestrator may directly edit AI-SPEC.md (Step 6 says "Fill in header fields" without delegating this), or whether it may run git commands itself (Step 11 shows `git add/commit` inline). Without explicit permissions, the orchestrator may take actions that should belong to subagents or require confirmation.

**Concrete fix:**

```xml
<constraints>
  <take_freely>
    - Read any file in the project directory
    - Display progress banners to the user
    - Spawn subagents via the Agent tool
    - Parse subagent output to extract structured fields
  </take_freely>

  <confirm_with_user>
    - Writing or modifying files directly (delegate to subagents or confirm first)
    - Running git write operations (add, commit, push)
  </confirm_with_user>

  <reserved_for_human_review>
    - Overriding a failed validation gate and continuing anyway
  </reserved_for_human_review>
</constraints>
```

---

### Issue 4 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Negative instructions ("do not", "avoid", "exit") must be rewritten as positive specifications of desired behavior before emitting any prompt. The guide provides a mechanical conversion table for this.

**What is missing:** The workflow uses several negative or exit-only constructs as primary directives without positive counterparts:

- "If 'Skip': exit." — no specification of what to surface to the user before exiting.
- "Exit workflow." (Step 1, if feature disabled) — no positive description of the expected termination output.
- "If selector fails or returns empty: Exit with error" — the error message string is specified, but the positive expected behavior (what the orchestrator should produce as its final output) is not.

**Concrete fix (illustrative):**

```
# Before
If "Skip": exit.

# After
If the user chooses "Skip": confirm to the user that the existing AI-SPEC.md will be used
unchanged, then surface the next step (/gsd-plan-phase {N}) and end the workflow.
```

Apply the same pattern to every `exit` branch: specify what the orchestrator must output before stopping.

---

### Issue 5 — No `<scenarios>` tags for the existing-spec branching (Section 16, "Scenario-based branching")

**Principle:** When multiple execution paths exist based on a runtime condition, they must be expressed with explicit `<scenarios>` and `<scenario condition="...">` tags rather than nested if/else prose. This removes ambiguity about which branch applies and ensures the model handles all paths.

**What is missing:** Step 4 defines three conditional branches (Update / View / Skip) and Step 5's failure path (selector fails) using inline `if` prose. These are multi-path execution branches with distinct conditions — exactly the pattern `<scenarios>` was designed for.

**Concrete fix:**

```xml
<scenarios>
  <scenario id="1" condition="ai_spec_exists AND user_chooses_update">
    Continue to Step 5 with existing AI-SPEC.md as baseline.
  </scenario>

  <scenario id="2" condition="ai_spec_exists AND user_chooses_view">
    Display AI-SPEC.md contents in full, then surface next step and end workflow.
  </scenario>

  <scenario id="3" condition="ai_spec_exists AND user_chooses_skip">
    Confirm AI-SPEC.md will be used unchanged, surface /gsd-plan-phase {N}, end workflow.
  </scenario>

  <scenario id="4" condition="no_ai_spec_exists">
    Proceed directly to Step 5.
  </scenario>
</scenarios>
```

---

### Issue 6 — No `<output_format>` specification for orchestrator completion output (Section 7; Section 22, Pattern 3)

**Principle:** Output format must be specified completely and upfront. The structure, fields, ordering, and an example must be defined before the model begins. An implicit format produces structure that varies per call.

**What is missing:** Step 12 provides a display template for the completion banner, but it is written as a prose code block rather than an `<output_format>` block, and it only specifies the success-path completion. No output format is defined for error terminations (Step 5 selector failure, Step 10 validation failure) or for the intermediate progress banners, leaving their structure to the model's discretion.

**Concrete fix:** Wrap the completion template in `<output_format>` tags and add a parallel error-path format:

```xml
<output_format>
On successful completion, emit:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AI-SPEC COMPLETE — PHASE {N}: {name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
◆ Framework: {primary_framework}
◆ System Type: {system_type}
◆ Domain: {domain_vertical}
◆ Eval Dimensions: {eval_concerns}
◆ Output: {ai_spec_path}

Next step: /gsd-plan-phase {N}

On validation failure (Step 10), emit for each failing section:
  MISSING: {section_name} — {what is expected}
Then ask: "Re-run the specific step, or continue anyway?"

On framework selector failure (Step 5), emit:
  ERROR: Framework selection failed.
  Fix: /gsd-ai-integration-phase {N} or answer framework question in /gsd-discuss-phase {N}.
</output_format>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL — audience of the orchestrator is implicit; quality bar is only defined via the success_criteria block, not inline in the prompt |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |
| **Chain of Thought** | |
| CoT included only for math, symbolic reasoning, or multi-step logic | N/A — workflow is procedural, CoT is not applicable |
| CoT trigger used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic aids | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | N/A — no examples present |
| 2–5 examples total | N/A |
| Examples ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |
| **Formatting** | |
| Instruction complete and clear before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | PASS — top-level sections use XML; inner steps do not use `<phase>` tags |
| At least 3 format variants will be tested on target model | FAIL — no format testing mentioned |
| **Instruction Framing** | |
| All negative instructions converted to positive equivalents | FAIL — multiple exit/skip branches are negative-only |
| Priority order explicit when multiple criteria apply | FAIL — no `<priority_order>` block; validation criteria in Step 10 have no explicit priority |
| Tie-breaking rules match domain's cost asymmetry | FAIL — no tie-breaking rules defined |
| **Persona** | |
| Persona included only for open-ended or stylistic tasks | FAIL — orchestration is open-ended and no persona is defined |
| Persona is specific (constrains voice/register), not generic | FAIL — no persona present |
| Persona descriptor is gender-neutral | N/A — no persona present |
| **Output Format** | |
| Structured output tasks use two-step reasoning-then-format | N/A — no structured JSON/XML output required from orchestrator |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL — Step 5 parses selector output but specifies no exact format contract for that parse |
| **Context Placement** | |
| Task instruction at start of prompt | PASS — `<purpose>` leads the file |
| Primary document or input at end | PASS — `<success_criteria>` closes the file |
| Background context in middle | PASS — `<required_reading>` and `<process>` are in the middle |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A — no snapshot context injected at the orchestrator level |
| **Self-Consistency** | |
| Self-consistency applied only to tasks with single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |
| **System/User Split** | |
| Persistent instructions in system prompt | N/A — this is a workflow file, not a system/user prompt split context |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | FAIL — validation gate in Step 10 is self-assessed; no external validation |
| **Agent/Subagent** | |
| Agent prompts are fully self-contained | PASS — each spawn block supplies objective, files, and input |
| All file paths in agent output are absolute | FAIL — spawn payloads use relative-style references (`{context_path}`, `{ai_spec_path}`) without enforcing absolute path requirement in a `<constraints>` block |
| Parallel agents are launched in a single message block | FAIL — Steps 7, 8, and 9 spawn three research agents sequentially; no justification for not parallelizing Steps 7 and 8 |
| Adversarial probes specified for verification agents | N/A — Step 10 is a validation gate, not a verification agent with adversarial probes |
| **Structural Architecture** | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS — each subagent is a separate file |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL — variables use `{variable_name}` (no `$` prefix, no fallback syntax) |
| Modules compose at runtime via variable substitution, not copy-paste | PASS |
| **Constraint Enforcement** | |
| Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block present |
| Hard exclusion lists enumerated, not described qualitatively | FAIL — no exclusion list |
| Known edge cases have precedent-style rulings | FAIL — no `<precedents>` block |
| Confidence thresholds are numeric, not qualitative | FAIL — Step 10 validation checks are boolean, with no numeric confidence threshold for "continue anyway" decision |
| **Decision Frameworks** | |
| Multi-option recommendations use decision tree or comparison table | FAIL — the Update/View/Skip branch (Step 4) and the selector-failure branch (Step 5) are expressed as prose conditionals |
| Criteria checklists gate complex approaches | PARTIAL — Step 10 provides a checklist, but it gates completion, not the choice of approach |
| Action permissions framed around reversibility | FAIL — git commit in Step 11 is irreversible; no reversibility framing present |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | FAIL — numbered prose steps, no `<phase>` tags |
| Required steps distinguished from type-specific steps | FAIL — Steps 7–9 (researcher agents) and Step 11 (commit) are not distinguished as universal vs. conditional |
| Scenario-based branching handles multiple paths explicitly | FAIL — branching expressed as inline prose conditionals, no `<scenarios>` tags |
| **Memory and Continuity** | |
| Memory templates use XML tags as section labels | N/A — no memory template in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | PASS — Step 12 surfaces a single, specific next step |
| **Modularity** | |
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — `<purpose>` states inclusions but no explicit exclusion of what this workflow does NOT handle |
| **Safety and Trust** | |
| Validation at system boundaries only; internal interfaces trusted | PASS — validation occurs on subagent outputs, not internally |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL — git commit in Step 11 runs unconditionally when `commit_docs` is true, without a confirmation step |
| **Tone and Style** | |
| Size constraints use numeric limits, not qualitative descriptors | N/A — no size constraints defined for orchestrator output |
| Instructions use imperative present tense | PASS — "Spawn", "Parse", "Display", "Copy", "Read" are all imperative present tense |
| Working notes in analysis tags, not user-facing output | N/A — no analysis-heavy output |
| **Optimization** | |
| Prompt flagged as draft for automated optimization | FAIL — no optimization flag |
| Correct optimizer selected | FAIL — not specified |
| Held-out test set reserved before optimization | FAIL — not specified |

---

## Recommendations

Prioritized from highest to lowest impact:

**1. Add `<phase>` tags with explicit trigger conditions (Section 16, "The phase pattern")**

The current prose-step structure is the single largest structural gap. Wrapping Steps 1–3, 5, 6–9, and 10–12 into named `<phase>` blocks with `trigger` attributes makes sequencing unambiguous and prevents the orchestrator from running later steps before earlier ones have succeeded. This is especially important for the selector-failure branch: without a phase boundary, the model may proceed to Step 6 despite a failed Step 5.

**2. Add an orchestrator `<persona>` and `<constraints>` block (Sections 6 and 14)**

Without a persona and constraint block, the orchestrator has no role identity and no defined action boundary. At minimum, define: what role the orchestrator plays (coordinator, not researcher), what it may do freely (spawn agents, display banners), and what requires confirmation (git write operations, direct file edits). This closes the largest behavioral underspecification in the workflow.

**3. Convert all exit/skip branches to positive output specifications (Section 5, Action 1)**

Every `exit` branch currently specifies termination without specifying what the orchestrator must output before stopping. Apply the guide's conversion table mechanically: for each `if X: exit`, replace with `if X: [output this confirmation to the user], then end the workflow`. This ensures user-facing output is consistent across all code paths.

**4. Replace prose conditionals with `<scenarios>` tags for Step 4 and Step 5 branches (Section 16, "Scenario-based branching")**

The Update/View/Skip branch and the selector-failure branch are multi-path execution branches with distinct conditions. Wrapping them in `<scenario condition="...">` tags makes the branching logic explicit, machine-readable, and easier to test. This also forces the author to specify the full output for each branch, which closes the gap identified in Recommendation 3.

**5. Add an `<output_format>` block covering success, validation-failure, and error termination paths (Section 7; Section 22, Pattern 3)**

The completion banner in Step 12 is a good start, but it only covers the happy path. Define explicit output formats for the validation-failure path (Step 10) and selector-failure path (Step 5) in a top-level `<output_format>` block. This ensures the orchestrator produces consistent, parseable output regardless of which termination path is taken, and enables downstream tooling (e.g., a calling agent or test harness) to reliably detect success vs. failure.
