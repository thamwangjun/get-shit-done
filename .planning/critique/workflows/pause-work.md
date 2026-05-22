# Critique: pause-work.md

## Summary

`pause-work.md` is a structurally sophisticated workflow that correctly uses XML tags to separate named steps, defines two concrete output artifacts, and models a non-trivial multi-branch detection algorithm. However, it has several meaningful gaps when measured against the guide: the `<purpose>` block omits audience and quality-bar specification (Section 1); the workflow has no explicit output format contract for either artifact (Section 7); the markdown template inside `<step name="write">` mixes structure sections with mismatched formats (Section 4); negative instruction equivalents are absent (Section 5); and the confirmation step uses emoji rather than imperative prose (Section 21). The workflow is broadly fit for purpose but would benefit from a tighter output spec, positive-framing of all instructions, and an explicit quality bar for what constitutes a complete handoff.

---

## Strengths

- **Section 4 Action 2 — XML tag structure applied correctly.** The entire workflow is organized into semantically named XML tags (`<purpose>`, `<required_reading>`, `<process>`, `<step name="...">`, `<success_criteria>`), exactly as the guide prescribes.
- **Section 16 — Multi-phase workflow pattern applied.** Each step in `<process>` is a named, sequenced stage (detect → gather → write_structured → write → commit → confirm), creating cognitive boundaries between phases.
- **Section 16 — Scenario-based branching for context detection.** The `detect` step enumerates five distinct scenarios (phase, spike, sketch, deliberation, research, default) with explicit condition-to-path mappings, matching the guide's scenario pattern (Section 16, scenario-based branching).
- **Section 13 — Template variable syntax used correctly.** Placeholders like `{phase_number}`, `{timestamp}`, and `{task_name}` in the JSON schema follow the guide's `${VARIABLE_NAME}` convention (Section 13, template variable injection).
- **Section 14 — Structure preservation rules present.** The `<step name="write">` template uses `<preserve>` semantics implicitly via italicized removal instructions, directing agents to remove sections that do not apply rather than leaving placeholders.
- **Section 22 Pattern 3 — Output format specified upfront per artifact.** Both artifacts (HANDOFF.json and .continue-here.md) have explicit templates embedded in the workflow before the agent begins writing.
- **Section 18 — Compaction summary structure followed.** The `.continue-here.md` template includes `<current_state>`, `<completed_work>`, `<remaining_work>`, `<decisions_made>`, `<next_action>` — closely mirroring the guide's compaction summary structure.

---

## Issues

### Issue 1 — No audience or quality bar defined (Section 1, Actions 1–2)

**Principle:** Every prompt must make explicit (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. Audience must be encoded with domain knowledge and vocabulary level.

**What is missing:** The `<purpose>` block states the what ("create structured handoff files") but does not define the audience (a fresh Claude agent with no session memory, or a human developer returning after days) nor the quality bar (what distinguishes a complete handoff from a partial one — e.g. "a resuming agent can reach the correct next action without asking any clarifying questions").

**Concrete fix:** Expand `<purpose>` to:
```xml
<purpose>
Create structured `.planning/HANDOFF.json` and `.continue-here.md` handoff files to
preserve complete work state across sessions.

<audience>
Primary consumer: a Claude agent resuming work in a new session with no prior context.
Secondary consumer: a human developer reviewing paused state.
Both audiences require enough specificity to act without asking clarifying questions.
</audience>

<quality_bar>
A complete handoff allows a fresh Claude agent to identify the correct next action,
understand all blocking constraints, and proceed without asking clarifying questions.
A handoff is incomplete if next_action is vague, blockers are undescribed, or
the detected context path is wrong.
</quality_bar>
</purpose>
```

---

### Issue 2 — Output format not contractually specified for either artifact (Section 7, Action 1; Section 22 Pattern 3)

**Principle:** Output format must be specified completely and upfront, including field names, ordering, and an example. Machine-parsed output requires exact format specification with literal string requirements.

**What is missing:** The JSON schema in `<step name="write_structured">` uses curly-brace placeholders that are ambiguous — they look like Python format strings, not the `${VARIABLE_NAME}` convention the guide specifies (Section 13). More critically, there is no `<output_format>` tag wrapping either artifact template, no explicit statement that the JSON must be valid (parseable) JSON, and no field-ordering rationale. The markdown template similarly lacks a formal `<output_format>` container.

**Concrete fix:** Wrap both templates in `<output_format>` tags and add a machine-parsing note:
```xml
<output_format>
HANDOFF.json must be valid, parseable JSON. Field order: version → timestamp → phase
identity → task position → status arrays → blockers → decisions → next_action.
Emit no comments inside the JSON block. The file is consumed by /gsd-resume-work
and parsed programmatically — any deviation from the schema causes silent failures.
</output_format>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Before emitting any prompt, scan for negated instructions and rewrite each as a positive specification of the desired behavior.

**What is missing:** The `<step name="write">` template contains several negative directives:
- "Do not proceed until all boxes are checked." (line 130)
- "Remove rows that do not apply." (line 141)
- "Do NOT begin execution until critique is complete" (line 190)

These are not reframe-pattern negatives (Section 6); they are plain negative constraints that the guide requires be converted.

**Concrete fix — conversion table:**

| Current (negative) | Replacement (positive) |
|--------------------|----------------------|
| "Do not proceed until all boxes are checked." | "Proceed only after confirming all constraint boxes are checked." |
| "Remove rows that do not apply." | "Keep only rows with confirmed, failure-validated content." |
| "Do NOT begin execution until critique is complete" | "Begin execution after critique is complete and design is revised." |

---

### Issue 4 — Priority ordering absent for the detect-step branching logic (Section 5, Instruction Framing — Priority Ordering)

**Principle:** When multiple considerations apply, list them with explicit priority using `<priority_order>`. Explicit ordering removes ambiguity when signals conflict.

**What is missing:** The `detect` step lists five context types (phase, spike, sketch, deliberation, research, default) and states "If phase is detected, proceed with phase handoff path. Otherwise use the first matching non-phase path above." However, it does not define what happens when multiple non-phase signals are simultaneously detected — e.g. a spike directory exists AND a deliberation file exists. The guide's priority ordering pattern handles exactly this.

**Concrete fix:** Add a `<priority_order>` block to the detect step:
```xml
<priority_order>
  1. Active phase (PLAN.md in phases/XX-name/) — highest priority
  2. Active spike (SPIKE.md / DESIGN.md in spikes/SPIKE-NNN/)
  3. Active sketch (README.md / index.html in sketches/)
  4. Active deliberation (any .md in deliberations/)
  5. Research notes (no other context found)
  6. Default (.planning/ root) — lowest priority; note ambiguity in current_state
</priority_order>
```

---

### Issue 5 — Confirmation step uses emoji and qualitative descriptors, not imperative prose (Section 21)

**Principle:** Instructions must use imperative present tense. Size constraints use numeric limits, not qualitative descriptors. Avoid emoji unless explicitly requested.

**What is missing:** The `<step name="confirm">` block opens with `✓` (emoji), uses a freeform prose block that varies in structure, and includes qualitative phrases like "committed as WIP" without specifying what a WIP commit message should look like beyond the example in `<step name="commit">`. The guide requires numeric limits and imperative framing.

**Concrete fix:**
```xml
<step name="confirm">
Output exactly the following block, substituting bracketed values:

Handoff created:
  - .planning/HANDOFF.json (machine-readable, consumed by /gsd-resume-work)
  - [handoff-path] (human-readable)

Context: [phase|spike|deliberation|research|default]
Location: [XX-name or SPIKE-NNN]
Task: [X] of [Y]
Status: [in_progress|blocked]
Blockers: [N] ([M] require human action)
Committed as WIP.

To resume: /gsd-resume-work
</step>
```

---

### Issue 6 — No tie-breaking rule for the gather step's "ask user" instruction (Section 5, Tie-Breaking Instructions)

**Principle:** Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry.

**What is missing:** The gather step says "Ask user for clarifications if needed via conversational questions." This is pure discretion — no cost asymmetry is specified. For a handoff workflow, the cost of under-capturing context (resuming agent blocked) is higher than the cost of over-asking (minor friction). A recall-biased tie-breaking rule is appropriate here but absent.

**Concrete fix:** Add after the gather step's list:
```xml
<tie_breaking>
When uncertain whether a piece of context belongs in the handoff, include it.
An over-specified handoff is preferable to one that leaves the resuming agent without
the information needed to proceed. Ask the user only for information that cannot be
inferred from files, git state, or the conversation.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scoring the workflow against Section 23 of the guide. Items marked N/A are not applicable to workflow prompt files of this type.

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit — **FAIL** (audience and quality bar absent from `<purpose>`)
- `[x]` All constraints are compatible — no conflicts between scope, length, or depth — **PASS**

### Chain-of-Thought
- `[ ]` CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **N/A** (workflow, not a generative prompt)
- `[ ]` CoT trigger used — **N/A**
- `[ ]` Reasoning is elicited before the answer — **N/A**
- `[ ]` CoT traces treated as heuristic aids — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **N/A** (no few-shot examples used)
- `[ ]` 2–5 examples total — **N/A**
- `[ ]` Ordered simple → complex — **N/A**
- `[ ]` Examples span diverse sub-types — **N/A**
- `[ ]` Format consistent across all examples — **N/A**
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[x]` Instruction is complete and clear before formatting is applied — **PASS**
- `[x]` Prompt sections separated by semantically named XML tags — **PASS**
- `[ ]` At least 3 format variants tested on target model — **FAIL** (no evidence of format variant testing; single template used)

### Instruction Framing
- `[ ]` All negative instructions converted to positive equivalents — **FAIL** (at least three unconverted negative instructions identified)
- `[ ]` Priority order explicit when multiple criteria apply — **FAIL** (detect step has no `<priority_order>` for simultaneous multi-context signals)
- `[ ]` Tie-breaking rules match domain cost asymmetry — **FAIL** (no tie-breaking rule for gather step)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **N/A** (no persona; correct for a process workflow)
- `[ ]` Persona is specific — **N/A**
- `[ ]` Persona descriptor is gender-neutral — **N/A**

### Output Format
- `[ ]` Structured output tasks use two-step reasoning-then-format approach — **N/A** (templates, not generative output)
- `[ ]` Single-call JSON places reasoning fields before answer fields — **N/A**
- `[ ]` Constrained decoding adopted only after free-form proven insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification — **FAIL** (HANDOFF.json schema lacks an `<output_format>` wrapper and machine-parsing note)

### Context Placement
- `[x]` Task instruction at start of prompt — **PASS** (`<purpose>` leads)
- `[x]` Primary document or input at end — **PASS** (`<success_criteria>` closes the workflow)
- `[x]` Background context in the middle — **PASS** (step details in middle)
- `[x]` All irrelevant context removed — **PASS** (no obvious padding)
- `[ ]` Time-sensitive injected context labeled as snapshot — **N/A**

### Self-Consistency
- `[ ]` Self-consistency applied only to tasks with a single correct answer — **N/A**
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[x]` Redundant instructions and repeated context removed — **PASS** (with one exception: "Critical Anti-Patterns" section appears twice in the `.continue-here.md` template — once as a table, once as a bullet list)
- `[ ]` Long prompts compressed before sending — **N/A**
- `[ ]` RAG context is extracted relevant passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (workflow file, not a system/user split)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[x]` Each instruction appears in exactly one location — **FAIL** (the "Critical Anti-Patterns" section is duplicated in the template)
- `[ ]` Safety-critical constraints have external validation — **N/A**

### Agent/Subagent
- `[x]` Agent prompts are fully self-contained — **PASS** (`<required_reading>` instruction included)
- `[ ]` All file paths in agent output are absolute — **FAIL** (the detect-step bash snippet uses relative paths `.planning/phases/...` without enforcing absolute path output)
- `[ ]` Parallel agents launched in single message block — **N/A**
- `[ ]` Adversarial probes specified for verification agents — **N/A**

### Structural Architecture
- `[x]` Large prompts decomposed into atomic, single-responsibility modules — **PASS** (each `<step>` has a single named responsibility)
- `[x]` Template variables use `${VARIABLE_NAME}` syntax — **FAIL** (JSON schema uses `{variable}` curly-brace notation inconsistent with guide's `${VARIABLE_NAME}`)
- `[ ]` Modules compose at runtime via variable substitution — **N/A**

### Constraint Enforcement
- `[ ]` Every restriction paired with equally concrete permission — **FAIL** (blocking constraint section tells the resuming agent what NOT to do without stating what it CAN do after acknowledgment)
- `[ ]` Hard exclusion lists enumerated, not described qualitatively — **N/A**
- `[ ]` Known edge cases have precedent-style rulings — **FAIL** (no precedents for known edge cases e.g. "what if PLAN.md exists but the phase is marked complete?")
- `[ ]` Confidence thresholds numeric, not qualitative — **N/A**

### Decision Frameworks
- `[ ]` Multi-option recommendations use explicit decision tree or comparison table — **PASS** (detect step uses an ASCII-style conditional list, though not a formal tree)
- `[ ]` Criteria checklists gate complex approaches — **N/A**
- `[ ]` Action permissions framed around reversibility — **N/A**

### Multi-Phase Workflows
- `[x]` Complex tasks organized into explicit named phases — **PASS**
- `[x]` Required steps distinguished from type-specific steps — **PASS** (universal gather steps vs. type-specific detect paths)
- `[x]` Scenario-based branching handles multiple paths explicitly — **PASS**

### Memory and Continuity
- `[x]` Memory templates use XML tags as section labels — **PASS** (`.continue-here.md` template uses `<current_state>`, `<completed_work>`, etc.)
- `[x]` Compaction summaries include discoveries and failed approaches — **PASS** (`<blockers>`, `<decisions_made>`, blocking constraints section)
- `[x]` Next steps tied to user's most recent explicit request — **PASS** (`<next_action>` section requires specific first action)

### Modularity
- `[x]` Each prompt component has a single responsibility — **PASS**
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (the `<purpose>` and `<success_criteria>` define what to include but do not state explicit exclusions for what the workflow does NOT cover)

### Safety and Trust
- `[ ]` Validation at system boundaries only — **N/A**
- `[ ]` Dual-use capabilities state permissions before restrictions — **N/A**
- `[x]` Authorization is narrow-scoped — **PASS** (the commit step uses a specific commit message pattern, not a general write permission)

### Tone and Style
- `[ ]` Size constraints use numeric limits, not qualitative descriptors — **FAIL** (confirmation block has no length constraint; freeform block with emoji)
- `[ ]` Instructions use imperative present tense — **FAIL** ("Do not proceed", "Remove rows that do not apply" are non-imperative or negative)
- `[x]` Working notes in analysis tags, not user-facing output — **PASS**

### Optimization
- `[ ]` Prompt flagged as draft for automated optimization — **FAIL** (no optimization metadata)
- `[ ]` Correct optimizer selected — **N/A** (not flagged)
- `[ ]` Held-out test set reserved — **N/A** (not flagged)

---

## Recommendations

Prioritized from highest to lowest impact:

### 1. Add audience and quality bar to `<purpose>` (Section 1, Actions 1–2)

This is the highest-leverage fix. The workflow currently has no quality bar, so an executing agent cannot self-evaluate whether a handoff is complete. Add an `<audience>` block and a `<quality_bar>` that defines completeness operationally: "a resuming agent reaches the correct next action without asking clarifying questions." This single addition anchors every downstream decision in the workflow.

### 2. Add `<output_format>` wrapper with machine-parsing contract around HANDOFF.json (Section 7, Action 1; Section 22 Pattern 3)

The JSON schema is embedded as a code block but never labelled as machine-parsed output with literal string requirements. Add an `<output_format>` tag specifying that the file must be valid parseable JSON, enumerate field order, and note which consumer parses it (`/gsd-resume-work`). This prevents schema drift and makes the contract between this workflow and its consumer explicit.

### 3. Convert all negative instructions to positive equivalents (Section 5, Action 1)

Three unconverted negatives exist in the `.continue-here.md` template. Apply the conversion table from Section 5 mechanically. This is a low-effort, high-compliance fix that aligns with one of the guide's most consistently emphasized rules.

### 4. Add `<priority_order>` to the detect step and a tie-breaking rule to the gather step (Section 5, Priority Ordering and Tie-Breaking Instructions)

The detect step is silent on simultaneous multi-context signals. The gather step is silent on when to ask the user vs. infer. Both omissions create unpredictable agent behavior in the edge cases that matter most (overlapping context signals, ambiguous session state). Adding five-line blocks for each resolves this structurally.

### 5. Remove the duplicate "Critical Anti-Patterns" section and fix variable notation (Section 11 Action 3; Section 13)

The `.continue-here.md` template contains "Critical Anti-Patterns" as both a markdown table (lines 133–141) and a bullet list under "## Critical Anti-Patterns (do NOT repeat these)" (lines 176–179). One instance must be removed — the guide requires each instruction appear in exactly one location. Simultaneously, the JSON schema's `{variable}` placeholders should be normalized to `${VARIABLE_NAME}` to match the guide's template variable convention.
