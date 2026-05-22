# Critique: debug.md

## Summary

`debug.md` is a well-structured orchestration workflow that demonstrates strong command of multi-phase design, scenario-based branching, constraint pairing, and priority ordering. The core architecture is sound: it gathers symptoms, spawns isolated subagents, handles checkpoint branches, and persists state across context resets. The principal weaknesses are (1) the agent prompt injected at `spawn_debugger` uses a non-standard mixed format (markdown headers inside XML, no XML tag vocabulary for symptom fields), (2) the `gather_symptoms` step issues questions one-at-a-time in sequence when it could batch them into a single interaction, (3) no output format is specified for what the orchestrator itself should produce at the end of a resolved session, and (4) several `<step>` elements contain inline negative instructions and qualitative size language that the guide requires be converted to positive or numeric equivalents. Overall the workflow scores well above average on structural concerns and below average on framing and output-format specification.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Scenario-based branching:** The `handle_return` step explicitly enumerates every terminal branch (`ROOT CAUSE FOUND`, `CHECKPOINT REACHED`, `INVESTIGATION INCONCLUSIVE`) and wires each to a concrete next action. This matches the guide's explicit scenario pattern (Section 16, scenario-based branching).
- **Section 1 (Task Specification) — Audience and quality bar:** Both `<audience>` and `<quality_bar>` tags are present and specific. Audience names the exact consumer (orchestrating agent) and its prior knowledge; quality bar states four concrete pass criteria.
- **Section 4 (Formatting and Structure) — XML tag vocabulary:** Top-level structural tags (`<task>`, `<context>`, `<audience>`, `<quality_bar>`, `<constraints>`, `<priority_order>`) are drawn from the guide's standard vocabulary (Section 4, XML tag vocabulary for prompt structure).
- **Section 14 (Constraint Enforcement) — Explicit permission pairs:** `<permitted>` and `<reserved_for_human_review>` are both populated with concrete, enumerated items. Every restriction is paired with an equally concrete permission statement.
- **Section 5 (Instruction Framing) — Priority ordering:** `<priority_order>` lists four ranked criteria. Explicit ranking removes ambiguity when the orchestrator faces competing signals (e.g., context economy vs. symptom completeness).
- **Section 17 (Agent and Subagent Patterns) — Self-contained agent prompts:** The `spawn_debugger` and `spawn_continuation` prompts are fully self-contained, carrying all context the subagent needs without relying on inherited context from the parent.
- **Section 16 — Required vs. optional steps:** The `gather_symptoms` step enumerates exactly five required fields before spawning, preventing premature agent launches on partial information.
- **Section 13 — Template variable injection:** Dynamic values (`{slug}`, `{debugger_model}`, `{user_response}`, `{checkpoint_type}`) use the `{variable}` injection pattern consistently throughout. (Note: guide style is `${VARIABLE_NAME}` — see Issues below.)

---

## Issues

### Issue 1 — Non-standard format inside `spawn_debugger` agent prompt

**Guide principle:** Section 4, Action 2 — use semantically named XML tags to separate prompt sections; Section 4, XML tag vocabulary — use the standard vocabulary consistently.

**What is wrong:** The agent prompt embedded in `spawn_debugger` mixes markdown bold headers (`**Summary:**`, `expected:`, `actual:`) inside `<symptoms>` rather than using XML child tags. The `<objective>` and `<debug_file>` tags are not in the standard vocabulary. The `<symptoms>` block uses prose-style `key: value` pairs instead of structured XML fields.

**Concrete fix:** Replace the embedded agent prompt with the standard vocabulary tags:

```xml
<task>
  <goal>Investigate and fix issue: {slug}</goal>
  <unit_task>
    Find the root cause of the reported issue and apply a fix if confirmed.
    Full investigation state is persisted to .planning/debug/{slug}.md.
  </unit_task>
</task>

<symptoms>
  <expected>{expected}</expected>
  <actual>{actual}</actual>
  <errors>{errors}</errors>
  <reproduction>{reproduction}</reproduction>
  <timeline>{timeline}</timeline>
</symptoms>

<mode>
  symptoms_prefilled: true
  goal: find_and_fix
</mode>
```

---

### Issue 2 — Template variable syntax inconsistency

**Guide principle:** Section 13, Template variable injection — variables use `${VARIABLE_NAME}` syntax.

**What is wrong:** The workflow uses `{variable}` curly-brace notation throughout (e.g., `{slug}`, `{debugger_model}`, `{user_response}`). The guide defines `${VARIABLE_NAME}` as the canonical injection syntax, with optional fallback `${VAR||"(default)"}`. Using a different syntax breaks interoperability with other modules in the composition system and may cause silent substitution failures depending on the runtime.

**Concrete fix:** Rename every injection site:

```
{slug}           → ${SLUG}
{debugger_model} → ${DEBUGGER_MODEL}
{user_response}  → ${USER_RESPONSE}
{checkpoint_type}→ ${CHECKPOINT_TYPE}
{expected}       → ${EXPECTED}
... etc.
```

For optional fields (e.g., a missing timeline), add a fallback: `${TIMELINE||"Not provided"}`.

---

### Issue 3 — No output format for the orchestrator's resolved-session response

**Guide principle:** Section 7, Action 1 — specify required output structure upfront; Section 22, Pattern 3 — output format specified completely and upfront.

**What is wrong:** The workflow specifies what spawned subagents must do but never defines what the orchestrator itself should output when a session reaches resolution (e.g., after the user selects "Manual fix — mark session resolved" or after a fix agent completes). The user-facing summary at resolution is implicit.

**Concrete fix:** Add an `<output_format>` block to the workflow:

```xml
<output_format>
When a debug session resolves, output a resolution summary in this structure:

**Debug session resolved:** {slug}
- Root cause: one sentence
- Fix applied: yes / no / deferred
- Evidence: bullet list of commands run and their results
- Session file: .planning/debug/{slug}.md

Keep the summary under 150 words. Do not repeat the full investigation log.
</output_format>
```

---

### Issue 4 — Gather-symptoms step asks questions sequentially instead of batching

**Guide principle:** Section 16 — round-based interviews; Section 10, Action 1 — minimize unnecessary turns.

**What is wrong:** `gather_symptoms` says "Ask the user via AskUserQuestion for each item in sequence. Collect all five before continuing." Asking five separate questions across five interaction turns is turn-expensive. The guide's `<interview>` / `<round>` pattern batches related questions into a single round.

**Concrete fix:** Replace the sequential ask with a single batched round:

```xml
<interview>
  <round id="1" name="Symptom collection">
    Ask all five questions in a single message:
    1. Expected behavior — What should happen?
    2. Actual behavior — What happens instead?
    3. Error messages — Any errors? (paste or type "none")
    4. Timeline — When did this start? Has it ever worked?
    5. Reproduction steps — How do you trigger it reliably?

    Accept partial answers; note any missing fields as "not provided" and continue.
  </round>
</interview>
```

---

### Issue 5 — Negative instruction phrasing

**Guide principle:** Section 5, Action 1 — convert negative instructions to positive equivalents.

**What is wrong:** The `spawn_continuation` instructions include the implicit negative framing "Full investigation state is in the debug file" which is fine, but the broader workflow uses several indirect negatives. More concretely, `<quality_bar>` states "Root cause is confirmed **before** any fix is applied" which is a temporal negative constraint. The `spawn_continuation` goal field defaults to `find_and_fix` even in the `INVESTIGATION INCONCLUSIVE / continue_investigation` branch, creating a misleading goal label.

**Concrete fix:** In `spawn_continuation`, make the goal field conditional and use positive framing:

```xml
<mode>
  goal: ${CONTINUATION_GOAL}
</mode>
```

Where `CONTINUATION_GOAL` resolves to `continue_investigation`, `apply_fix`, or `finalize_and_archive` depending on the branch. And in `<quality_bar>`, rewrite:

```
"Root cause is confirmed before any fix is applied"
→ "Confirm root cause fully; apply fix only after confirmation is complete"
```

---

### Issue 6 — No CoT trigger for the hypothesis-forming step

**Guide principle:** Section 2 — add CoT trigger for multi-step reasoning tasks.

**What is wrong:** The `spawn_debugger` prompt asks the subagent to apply scientific method (hypothesis formation, evidence gathering, elimination). This is a multi-step reasoning task. No CoT trigger is included in the injected prompt.

**Concrete fix:** Add the standard CoT trigger to the subagent task block:

```xml
<task>
  Take a deep breath and work through this problem step-by-step.
  ...
</task>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `debug.md`.

### Task Specification
- [PASS] Intent, audience, and quality bar are all explicit in the prompt
- [PASS] All constraints are compatible — no conflicts between scope, length, or depth

### Chain-of-Thought
- [FAIL] CoT trigger missing from the spawned subagent prompt (multi-step reasoning task with no "Take a deep breath and work on this problem step-by-step." trigger)
- [N/A] Reasoning elicited before the answer (delegated to subagent prompt, not specified here)
- [N/A] CoT traces treated as heuristic aids

### Few-Shot Examples
- [N/A] Examples selected by semantic similarity (no few-shot examples; not required for this task type)
- [N/A] 2–5 examples total
- [N/A] Ordered simple → complex
- [N/A] Examples span diverse sub-types
- [N/A] Format consistent across examples
- [N/A] Example order fixed across evaluation runs

### Formatting
- [PASS] Instruction is complete and clear before formatting is applied
- [PASS] Prompt sections separated by semantically named XML tags
- [FAIL] No evidence that 3 format variants were tested on the target model

### Instruction Framing
- [FAIL] Negative instructions not fully converted to positive equivalents (temporal negative in `<quality_bar>`; misleading `find_and_fix` goal in `continue_investigation` branch)
- [PASS] Priority order is explicit (`<priority_order>` with four ranked items)
- [N/A] Tie-breaking rules (no ambiguous signal boundary identified in this workflow type)

### Persona
- [N/A] Persona included only for open-ended/stylistic tasks (orchestration workflow; no persona required)
- [N/A] Persona specific
- [N/A] Persona gender-neutral

### Output Format
- [FAIL] No output format specified for the orchestrator's resolution response
- [N/A] Single-call JSON reasoning-first
- [N/A] Constrained decoding
- [N/A] Machine-parsed output with exact format specification

### Context Placement
- [PASS] Task instruction at the start of the prompt
- [PASS] Background context in the middle (`<context>` block)
- [N/A] Primary document/input at end (no document input in this workflow)
- [PASS] Irrelevant context removed — context block is lean and directly relevant
- [N/A] Time-sensitive injected context labeled as snapshot

### Self-Consistency
- [N/A] Self-consistency applied only to single-correct-answer tasks (not applicable)
- [N/A] Inference budget permits 15–20 samples

### Prompt Length
- [PASS] No redundant instructions or repeated context
- [N/A] Long prompts compressed
- [N/A] RAG context extracted only

### System/User Split
- [PASS] Persistent instructions in system prompt scope; task-specific in process steps
- [PASS] Each instruction appears in one location
- [N/A] Safety-critical constraints with external validation

### Agent/Subagent
- [PASS] Agent prompts are fully self-contained
- [PASS] File paths in agent output are absolute (`.planning/debug/{slug}.md`)
- [N/A] Parallel agents launched in single message block (sequential by design)
- [N/A] Adversarial probes specified (delegated to gsd-debugger, not this orchestrator)

### Structural Architecture
- [PASS] Large prompt decomposed — orchestrator delegates to gsd-debugger subagent
- [FAIL] Template variables use `{variable}` not `${VARIABLE_NAME}` syntax
- [PASS] Modules compose at runtime via variable substitution

### Constraint Enforcement
- [PASS] Every restriction paired with concrete permission (`<permitted>` + `<reserved_for_human_review>`)
- [PASS] Hard exclusions enumerated (two concrete reserved actions)
- [N/A] Known edge cases with precedent-style rulings
- [N/A] Confidence thresholds (not applicable to this workflow type)

### Decision Frameworks
- [PASS] Multi-option recommendations use explicit branching (three-option menus at each terminal state)
- [N/A] Criteria checklists gate complex approaches
- [N/A] Action permissions framed around reversibility (handled in constraints)

### Multi-Phase Workflows
- [PASS] Complex task organized into explicit named phases (`<step name="...">`)
- [PASS] Required steps distinguished from type-specific steps
- [PASS] Scenario-based branching handles multiple paths explicitly

### Memory and Continuity
- [PASS] Session state persisted to `.planning/debug/{slug}.md`
- [N/A] Compaction summaries with discoveries and failed approaches (delegated to subagent)
- [PASS] Next steps tied to user's most recent response (continuation prompt carries checkpoint response)

### Modularity
- [PASS] Orchestrator has single responsibility (lifecycle management, not investigation)
- [PASS] Scope boundaries are implicit through `<permitted>` / `<reserved_for_human_review>` pairing

### Safety and Trust
- [PASS] Fix delegation requires user confirmation before applying
- [PASS] Permissions stated before restrictions in constraints block
- [PASS] Authorization narrow-scoped — each action confirmed before proceeding

### Tone and Style
- [FAIL] No numeric size constraints on orchestrator outputs (e.g., confirmation message length, resolution summary length)
- [PASS] Steps use imperative present tense throughout
- [N/A] Working notes in analysis tags

### Optimization
- [FAIL] Prompt not flagged as a draft for automated optimization
- [N/A] Optimizer selection
- [N/A] Held-out test set

---

## Recommendations

Listed in priority order.

**1. Fix the spawned agent prompt format and template variable syntax (Issues 1 and 2 — Sections 4 and 13)**
The embedded prompt in `spawn_debugger` is the most-executed code path in this workflow. Fixing it to use the standard XML tag vocabulary and `${VARIABLE_NAME}` injection syntax has the highest leverage: it improves subagent behavior on every invocation and ensures interoperability with other GSD modules that depend on consistent variable resolution.

**2. Add an `<output_format>` block for the orchestrator's resolution response (Issue 3 — Section 7, Pattern 3)**
Without a defined output format, the resolution summary varies unpredictably across sessions. Adding a 150-word-capped structure with fixed fields (root cause, fix applied, evidence, session file path) makes resolution summaries parseable downstream and auditable by users.

**3. Add the CoT trigger to the injected subagent prompt (Issue 6 — Section 2)**
The gsd-debugger is asked to perform systematic multi-step hypothesis reasoning — exactly the task type the guide identifies as requiring a CoT trigger. Adding "Take a deep breath and work on this problem step-by-step." to the `<task>` block in `spawn_debugger` costs zero tokens of runtime overhead and has documented accuracy benefits on multi-step reasoning benchmarks.

**4. Batch the symptom-gathering round into a single interaction (Issue 4 — Section 16)**
Five sequential AskUserQuestion calls create five round-trips. One batched `<interview><round>` collects the same information in a single turn. This reduces orchestration latency and matches the guide's explicit round-based interview pattern for structured information gathering.

**5. Convert negative instruction framing and fix the misleading `find_and_fix` goal label (Issue 5 — Section 5, Action 1)**
The `spawn_continuation` goal defaults to `find_and_fix` even in the `continue_investigation` branch, which can bias the subagent toward premature fix attempts. Making the goal conditional and rewriting the `<quality_bar>` temporal constraint as a positive instruction removes the ambiguity at low cost.
