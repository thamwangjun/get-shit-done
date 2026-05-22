# Critique: discuss-phase-power.md

## Summary

`discuss-phase-power.md` is a well-scoped, purposeful workflow that handles a genuinely complex multi-step interaction pattern (batch question generation, asynchronous HTML-based answering, and context finalization). Its procedural logic is solid and the step sequencing is coherent. However, it is written in a mix of ad-hoc XML step tags and prose that falls short of the guide's structural standards. Crucially, it lacks a task specification envelope, has no output format declarations, uses no semantic XML tagging for prompt sections, contains no persona, and its trigger/command handling is defined entirely in prose rather than as explicit scenarios. The file reads more like developer documentation than a prompt — which means the model executing it must infer a great deal about audience, quality bar, and priority ordering that should instead be stated explicitly.

---

## Strengths

- **Section 16 (Phase Pattern) — partially applied.** The workflow decomposes work into named `<step>` elements (`analyze`, `generate_json`, `generate_html`, `notify_user`, `wait_loop`, `finalize`), creating cognitive boundaries consistent with the guide's multi-phase workflow principle.
- **Section 14 (Constraint Enforcement) — JSON field rules.** The `generate_json` step enumerates explicit field-level rules (`stats.total`, `stats.answered`, etc.) with unambiguous definitions. This is a concrete constraint specification rather than a qualitative description.
- **Section 16 (Scenario-Based Branching) — wait_loop commands.** The `wait_loop` step lists each supported command explicitly with its behavior, which approximates scenario-based branching even though it does not use `<scenario>` tags.
- **Section 19 (Modularity) — single responsibility.** The file handles exactly one concern: power mode for discuss-phase. It does not bleed into adjacent workflows.
- **Section 4 (Formatting) — layout ASCII diagram.** The HTML layout sketch in `generate_html` uses an ASCII wireframe, which gives the model a concrete calibrating example rather than a qualitative description (consistent with Section 22 Pattern 2).
- **Success Criteria block.** The `<success_criteria>` section provides a verifiable exit condition for the workflow, which aligns with Section 1 Action 1 (quality bar).

---

## Issues

### Issue 1 — No task specification envelope (Section 1, Actions 1–3)

**Principle:** Section 1 requires explicit identification of (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like, encoded in `<task>`, `<audience>`, and `<quality_bar>` tags.

**What's missing:** The `<purpose>` block provides a one-line description but does not name the audience (which model role is executing this? what does it already know?), does not state the quality bar beyond the `<success_criteria>` section at the bottom, and does not audit constraints for conflicts. The `stats.remaining = total - answered` rule conflicts with no other constraint, but there is no documented audit confirming this.

**Fix:** Add a `<task>` block immediately after `<purpose>` that names the executing agent's role, states the output (a JSON file + HTML file + CONTEXT.md), and references the quality bar. Add an `<audience>` tag naming the orchestrating agent and its assumed context. Move `<success_criteria>` to a `<quality_bar>` tag immediately after `<task>` so it is co-located with the instruction rather than appended at the end.

```xml
<task>
Generate a batch question set for a GSD phase discussion. Produce:
1. A structured JSON state file containing all gray-area questions with options and tradeoffs.
2. A self-contained HTML companion UI for offline answering.
3. A CONTEXT.md decision document when the user finalizes.
</task>

<audience>
The executing agent is Claude Code running in a GSD workflow session. It has already
validated the phase, read ROADMAP.md, and holds the variables: phase_dir, padded_phase,
phase_number, phase_name, phase_slug.
</audience>

<quality_bar>
- All gray areas are surfaced as questions; none are silently resolved by the agent.
- JSON stats are always mathematically consistent (total = answered + remaining).
- HTML file opens and functions without a server or external dependencies.
- CONTEXT.md uses the canonical context template format.
- canonical_refs section is always present.
</quality_bar>
```

---

### Issue 2 — Steps use ad-hoc `<step name="">` tags instead of the guide's `<phase>` pattern (Section 16)

**Principle:** Section 16 specifies `<phase id="N" name="..." trigger="...">` as the canonical tag for named stages in multi-step workflows. The guide's XML vocabulary table (Section 4) defines `<phase>` with `id`, `name`, and `trigger` attributes precisely for this purpose.

**What's missing:** The workflow uses `<step name="...">` instead of `<phase id="..." name="..." trigger="...">`. The `trigger` attribute is never set, so the model cannot mechanically determine what initiates each phase. The `wait_loop` step in particular lacks a trigger condition that distinguishes it from the finalize step.

**Fix:** Rename `<step>` tags to `<phase>` and add `id` and `trigger` attributes:

```xml
<phase id="1" name="analyze" trigger="on_entry">
  ...
</phase>

<phase id="2" name="generate_json" trigger="after_analyze">
  ...
</phase>

<phase id="3" name="generate_html" trigger="after_generate_json">
  ...
</phase>

<phase id="4" name="notify_user" trigger="after_generate_html">
  ...
</phase>

<phase id="5" name="wait_loop" trigger="after_notify_user">
  ...
</phase>

<phase id="6" name="finalize" trigger="user_says_finalize">
  ...
</phase>
```

---

### Issue 3 — Wait-loop command handling uses prose, not `<scenarios>` (Section 16)

**Principle:** Section 16 (Scenario-Based Branching) specifies `<scenarios>` / `<scenario condition="...">` tags for explicit branching. Section 5 (Instruction Framing) requires explicit conditional branching using `if/then` or scenario tags rather than leaving inference to the model.

**What's missing:** The five command branches in `wait_loop` ("refresh", "finalize", "explain Q-N", "exit power mode", "any other message") are described in prose with `---` dividers. This is readable to humans but provides no machine-parseable structure and does not exploit the guide's scenario vocabulary.

**Fix:** Wrap command branches in `<scenarios>`:

```xml
<scenarios>
  <scenario condition="user_says_refresh">
    1. Read the JSON file.
    2. Recalculate stats.
    3. Write updated stats back to JSON.
    4. Re-generate HTML with updated state.
    5. Report updated counts to user.
  </scenario>

  <scenario condition="user_says_finalize">
    Proceed to phase id="6" (finalize).
  </scenario>

  <scenario condition="user_says_explain_Q_N">
    1. Find the question by ID in the JSON.
    2. Provide detailed explanation: why it matters, downstream impact, codebase context.
    3. Return to wait_loop.
  </scenario>

  <scenario condition="user_says_exit_power_mode">
    1. Read all answered questions from JSON.
    2. Load answers into accumulator as interactive answers.
    3. Continue with discuss_areas step from discuss-phase.md for unanswered questions.
    4. Generate CONTEXT.md.
  </scenario>

  <scenario condition="any_other_message">
    Respond helpfully. Append reminder: "(Power mode active — say 'refresh', 'finalize',
    'explain Q-N', or 'exit power mode')"
  </scenario>
</scenarios>
```

---

### Issue 4 — No output format specification for any of the three produced artifacts (Section 7, Section 22 Pattern 3)

**Principle:** Section 7 Action 1 requires output format to be specified completely and upfront. Section 22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task."

**What's missing:** The JSON structure is well-specified in `generate_json`. However:
- The HTML file's required output is described via a layout sketch and prose rules but no `<output_format>` tag demarcates it.
- The CONTEXT.md output in `finalize` references "the standard context template format" without naming or quoting that template. A model executing this step cold (or in a new session) has no canonical reference to the template.
- The `notify_user` message is shown as a fenced code block but is not wrapped in `<output_format>` tags, so its "print exactly this" status is ambiguous.

**Fix:**
1. Wrap the `notify_user` message in `<output_format>` tags with a note that it must be printed verbatim with variable substitution.
2. In `finalize`, add a `<canonical_refs>` pointer to the CONTEXT.md template (e.g., `discuss-phase.md` or a named template file) so the model has an unambiguous source.
3. Wrap the HTML specification in an `<output_format>` tag at the top of `generate_html`.

---

### Issue 5 — No persona (Section 6)

**Principle:** Section 6 Action 1 says to assign a persona for open-ended, stylistic, or voice-dependent tasks. Section 22 Pattern 1 says the identity constrains register, priorities, and decision-making style of every response.

**What's missing:** This workflow involves multiple judgment calls: which gray areas to surface, how to group them into sections, how to write option descriptions with tradeoffs. Without a persona, the model defaults to generic assistant behavior and may produce over-cautious, under-specific, or inconsistently toned questions.

**Fix:** Add a specific persona that constrains the agent's orientation toward the task:

```xml
<persona>
You are a phase discussion specialist for GSD workflows. Your job is to surface every
significant implementation decision a developer must make before planning begins — not
to resolve those decisions yourself.

Write question options as concrete, comparative tradeoffs (not abstract alternatives).
Group questions by domain of concern. Prefer specificity over comprehensiveness: five
well-framed questions beat ten vague ones.
</persona>
```

---

### Issue 6 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions ("do not", "avoid", "never") to be rewritten as positive specifications of desired behavior before the prompt is emitted.

**What's missing:** The `analyze` step contains: "Do NOT ask the user anything at this stage." The `generate_json` step context field is described as "not generic". These are negative framings.

**Fix:** Apply the conversion table from Section 5:

- "Do NOT ask the user anything at this stage. Capture everything internally, then proceed to generate." → "Capture all identified gray areas internally. Proceed directly to generate_json without sending any message to the user."
- "concrete codebase or prior-decision annotation (not generic)" → "concrete codebase or prior-decision annotation — cite a specific file, function, prior CONTEXT.md decision, or ROADMAP.md line"

---

### Issue 7 — No `<required_steps>` / `<type_specific_strategy>` distinction (Section 16)

**Principle:** Section 16 specifies distinguishing mandatory steps (universal) from type-specific steps using `<required_steps universal="true">` and `<type_specific_strategy>` tags.

**What's missing:** The `analyze` step mixes universal actions (load prior context, read phase goal) with phase-type-specific ones (scout codebase for reusable assets). The finalize step mixes universal formatting with phase-specific threshold logic (the 50% warning). There is no marking of which steps are invariant vs. conditional.

**Fix:** Separate universal from conditional steps in `analyze` and `finalize`:

```xml
<required_steps universal="true">
  1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files).
  2. Read the phase goal from ROADMAP.md.
  3. Identify all gray areas with 2–4 concrete options each.
  4. Group questions by topic into sections of 2–6 questions.
</required_steps>

<type_specific_strategy>
  If the phase involves UI or visual output: add a "Visual Style" section.
  If the phase involves data persistence: add a "Data Model" section.
  Scout the codebase for reusable assets relevant to the phase type.
</type_specific_strategy>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `discuss-phase-power.md`.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Purpose block exists; audience and quality bar are absent or displaced |
| All constraints are compatible — no conflicts | N/A | No documented constraint audit |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger present; task does not require one |
| CoT trigger phrasing used | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete and clear before formatting | FAIL | Formatting (step tags, layout sketch) precedes a complete task specification |
| Prompt sections separated by semantically named XML tags | FAIL | Uses `<step name="">` instead of `<phase id="" name="" trigger="">` |
| At least 3 format variants tested on target model | N/A | Not applicable to workflow files |
| **Instruction Framing** | | |
| All negative instructions converted to positive | FAIL | "Do NOT ask the user" and "not generic" remain as negations |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering for competing concerns (question quantity vs. quality, etc.) |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rule (e.g., what to do when a gray area is borderline — include or skip?) |
| **Persona** | | |
| Persona included only for open-ended/stylistic tasks | FAIL | Task is open-ended; no persona present |
| Persona is specific (constrains voice/register) | FAIL | No persona |
| Persona descriptor is gender-neutral | N/A | No persona |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | Workflow, not a single-call structured output task |
| Single-call JSON places reasoning before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | CONTEXT.md format references "standard context template" without quoting or linking it |
| **Context Placement** | | |
| Task instruction at start of prompt | FAIL | `<purpose>` and `<trigger>` precede any task envelope |
| Primary input at end of prompt | PASS | `<success_criteria>` closes the file; primary inputs (JSON, HTML) are referenced in finalize |
| Background context in the middle | PASS | Trigger context (caller-provided variables) is in the middle |
| All irrelevant context removed | PASS | No observable padding |
| Time-sensitive injected context labeled as snapshot | N/A | No runtime-injected context |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| Long prompts compressed | N/A | |
| RAG context is extracted relevant passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file, not a split system/user prompt |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions observed |
| Safety-critical constraints have external validation | N/A | |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | FAIL | `finalize` references "standard context template format" without defining it inline |
| All file paths in agent output are absolute | FAIL | Paths use `{phase_dir}/{padded_phase}-QUESTIONS.json` (template variables) — acceptable, but the notify_user block shows relative-looking paths without asserting they must be absolute |
| Parallel agents launched in single message block | N/A | No parallel agents spawned |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS | File has one responsibility |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL | Uses `{variable_name}` (curly without dollar sign) inconsistently with the guide's `${VARIABLE_NAME}` convention |
| Modules compose at runtime via variable substitution | PASS | Composition via variables is intended |
| **Constraint Enforcement** | | |
| Every restriction paired with an equally concrete permission | FAIL | No explicit `<permitted>` / `<constraints>` block |
| Hard exclusion lists enumerated | N/A | No filtering task |
| Known edge cases have precedent-style rulings | FAIL | Edge case of <50% answered has a warning but no ruling on whether to proceed or block |
| Confidence thresholds are numeric | N/A | |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or table | N/A | |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | FAIL | No reversibility framing (e.g., "Save answers" overwrites the JSON — irreversible; no confirm pattern) |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | FAIL | Uses `<step>` not `<phase id="" name="" trigger="">` |
| Required steps distinguished from type-specific | FAIL | Mixed without `<required_steps universal="true">` |
| Scenario-based branching handles multiple paths explicitly | FAIL | Wait-loop branches are prose, not `<scenario condition="">` tags |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory template in this file |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |
| **Modularity** | | |
| Each prompt component has a single responsibility | PASS | |
| Scope boundaries state both inclusions and exclusions | FAIL | `<success_criteria>` lists what must be true but no `<scope>` block states what is out of scope |
| **Safety and Trust** | | |
| Validation at system boundaries only | PASS | JSON read/write is the only external boundary; it is explicit |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped | N/A | |
| **Tone and Style** | | |
| Size constraints use numeric limits | PASS | "2–4 concrete options", "2–6 questions per section" are numeric |
| Instructions use imperative present tense | PASS | Steps are written imperatively ("Read", "Write", "Report") |
| Working notes in analysis tags, not user-facing output | N/A | |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved | FAIL | Not addressed |

---

## Recommendations

Prioritized by impact, from highest to lowest.

### 1. Add a `<task>` / `<audience>` / `<quality_bar>` envelope (Section 1, Actions 1–2)

This is the highest-leverage fix. Without it, the model must infer its role, the quality bar, and the audience from context. Move `<success_criteria>` into `<quality_bar>` and place the full envelope before the first `<step>`. Estimated impact: reduces ambiguity in the `analyze` and `finalize` steps, which currently require the most judgment.

### 2. Add a persona constraining question-generation behavior (Section 6, Actions 1–2; Section 22 Pattern 1)

The quality of generated questions depends entirely on how the model interprets "gray areas" and "concrete options." A specific persona that says "surface decisions, do not resolve them; prefer five sharp questions over ten vague ones" directly shapes the most consequential output in the workflow. Without it, question quality is model-prior-dependent and inconsistent across sessions.

### 3. Replace `<step>` tags with `<phase id="" name="" trigger="">` and `<scenario condition="">` for wait-loop branches (Section 16)

This is a structural conformance fix that also has functional value: explicit triggers on each phase prevent the model from prematurely advancing (e.g., jumping to finalize before the user says "finalize"). The scenario tags in the wait-loop make the command dispatch unambiguous and machine-readable.

### 4. Define the CONTEXT.md output format inline or by canonical reference (Section 7; Section 22 Pattern 3)

"Standard context template format" is a forward reference to an undefined artifact. If the executing agent loses session context, or if `discuss-phase.md` changes, this step silently degrades. Either inline the required CONTEXT.md sections (decisions, deferred_ideas, specifics, code_context, canonical_refs) as an `<output_format>` block, or add a `<canonical_refs>` pointer to the authoritative template file.

### 5. Convert negative instructions to positive and add a tie-breaking rule for gray-area inclusion (Section 5, Actions 1 and Tie-breaking)

Convert "Do NOT ask the user" and "not generic" to their positive equivalents (two-minute fix, zero risk). Then add one tie-breaking rule for the `analyze` step: when uncertain whether a decision qualifies as a gray area, include it — the user can skip unanswered questions, but cannot answer questions that were never surfaced. This is a recall-biased context (Section 5, Tie-breaking), and the explicit rule should say so.
