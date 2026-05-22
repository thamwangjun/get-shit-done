# Critique: research-phase.md

## Summary

`research-phase.md` is a lean orchestration stub that correctly offloads the research work to a subagent and sequences the five steps sensibly. However, as a prompt it is severely underdeveloped: it contains no task specification components (intent, audience, quality bar), no output format definition, no persona, no constraint block, no few-shot examples for the researcher agent, and the inline Task() call it constructs omits most of the structural requirements the guide mandates for self-contained agent prompts. The file reads more like internal pseudocode than a production-ready prompt, and the guide's most high-leverage principles — XML sectioning, explicit output format, instruction framing in positive voice, tie-breaking rules, and constraint pairs — are entirely absent.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase sequencing.** The five numbered steps create a clear sequential structure: resolve profile, normalize phase, check existing research, gather context, spawn researcher, handle return. This mirrors the phase-based cognitive boundary principle.

- **Section 17 (Agent and Subagent Patterns) — Subagent type restriction.** Listing `<available_agent_types>` with the instruction "use exact names — do not fall back to 'general-purpose'" follows the guide's requirement that agent prompts constrain identity precisely (Section 17, Pattern 1).

- **Section 17 — Branching return handling.** Step 5 explicitly handles three distinct return codes (`RESEARCH COMPLETE`, `CHECKPOINT REACHED`, `RESEARCH INCONCLUSIVE`) rather than assuming a single happy path, which aligns with Section 16's scenario-based branching principle.

- **Section 16 — Round-trip context injection.** The use of `gsd-sdk query` shell calls to inject live phase context (context path, requirements path, state path) follows the spirit of Section 8's runtime context injection pattern.

- **Section 13 (Structural Architecture) — Template variable use.** Variables like `{phase}`, `{name}`, `{researcher_model}`, and `${AGENT_SKILLS_RESEARCHER}` use the `${VARIABLE_NAME}` interpolation syntax the guide prescribes.

---

## Issues

### Issue 1 — No task specification (Section 1, Actions 1–3)

**Principle:** Every prompt must make explicit: (a) what output is being requested, (b) why it matters, and (c) what a high-quality response looks like. The audience must be encoded. Constraints must be audited for conflicts.

**What's missing:** The workflow has no `<task>`, `<audience>`, or `<quality_bar>` tags anywhere — neither for the orchestrating agent nor for the researcher subagent being spawned. The Task() call's `prompt=` contains an `<objective>` tag but it specifies only a one-line goal with no success criteria, no description of who will consume the research output, and no quality bar.

**Concrete fix:** Add an explicit task specification block at the top of the workflow and embed a `<quality_bar>` in the Task() prompt:

```xml
<task>
Orchestrate a research session for a GSD phase. Read the phase's context and requirements,
spawn a researcher subagent, and return a structured RESEARCH.md file the plan-phase
workflow can act on directly.
</task>

<audience>
GSD orchestrating agent consuming this workflow. Output is used by /gsd-plan-phase and
the developer reviewing research before planning.
</audience>

<quality_bar>
Research is complete when RESEARCH.md contains: a recommended approach, at least two
alternative approaches with trade-offs, and a list of unknowns or risks. Research is
inconclusive when no viable approach is found after reading all context files.
</quality_bar>
```

---

### Issue 2 — Task() prompt is not self-contained (Section 17, "Self-contained agent prompts")

**Principle:** Each agent prompt must be fully self-contained when spawned. Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable.

**What's missing:** The Task() prompt passed to `gsd-phase-researcher` contains only an `<objective>`, a `<files_to_read>` list, a template variable `${AGENT_SKILLS_RESEARCHER}`, an `<additional_context>` stub with a one-line description, and an `<output>` path. There is no persona, no output format specification, no constraints block, and no definition of what constitutes complete or inconclusive research. The subagent must infer all of this.

**Concrete fix:** Expand the Task() prompt to include all required sections:

```xml
<persona>
You are a technical research specialist. Your role is to evaluate implementation approaches
for a software feature phase and produce a structured research document the planning agent
can act on without further clarification.
</persona>

<task>
Research implementation approaches for Phase {phase}: {name}.
Read all files listed below. Evaluate at least two approaches. Identify unknowns and risks.
</task>

<constraints>
  <permitted>
    Read any file in the repository. Run read-only shell commands (grep, find, git log).
    Write output only to the specified RESEARCH.md path.
  </permitted>
  <reserved_for_human_review>
    Creating, modifying, or deleting files other than the output RESEARCH.md.
  </reserved_for_human_review>
</constraints>

<output_format>
Write RESEARCH.md with these sections:
1. Recommended Approach — chosen approach with rationale
2. Alternatives — at least two alternatives with trade-offs
3. Unknowns and Risks — open questions that must be resolved before planning

End your response with exactly one of:
## RESEARCH COMPLETE
## CHECKPOINT REACHED
## RESEARCH INCONCLUSIVE
</output_format>
```

---

### Issue 3 — Negative instruction not converted to positive (Section 5, Action 1)

**Principle:** Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior.

**What's missing:** The `<available_agent_types>` block contains: "do not fall back to 'general-purpose'". This is a negative instruction that the guide requires be converted to a positive equivalent.

**Concrete fix:**

```xml
<!-- Current (negative) -->
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):

<!-- Fixed (positive) -->
Valid GSD subagent types. Use exactly one of the names listed below.
Select the type whose description best matches the task:
```

---

### Issue 4 — No output format specified for the orchestrating agent (Section 7, Action 1; Pattern 3)

**Principle:** Output format must be specified completely and upfront. State the required output structure, field names, ordering, and an example before the model begins its task.

**What's missing:** Step 5 lists three return codes the orchestrating agent should handle, but there is no `<output_format>` block defining what the orchestrator should present to the user in each case. The instruction "Display summary, offer: Plan/Dig deeper/Review/Done" is qualitative — there is no format, no field names, no length constraint, and no example.

**Concrete fix:** Add an `<output_format>` section to the workflow:

```xml
<output_format>
On RESEARCH COMPLETE:
Present a summary in this format:
  Research complete for Phase {phase}: {name}
  Recommended approach: {one sentence}
  Output: {RESEARCH.md path}
  Next: [Plan this phase] [Dig deeper] [Review research] [Done]

On CHECKPOINT REACHED:
Present the checkpoint question verbatim. Await user response before spawning continuation.

On RESEARCH INCONCLUSIVE:
List the approaches attempted (bullet list). Offer:
  [Add context and retry] [Try a different approach] [Skip and plan manually]
</output_format>
```

---

### Issue 5 — No priority ordering or tie-breaking when existing research is found (Section 5, Priority ordering and Tie-breaking)

**Principle:** When multiple considerations apply, list them with explicit priority. Add tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry.

**What's missing:** Step 2 says "If exists: Offer update/view/skip options." There is no definition of what to do if the user provides no response, no priority between staleness and user preference, and no rule for what constitutes "outdated" research that warrants a forced update.

**Concrete fix:**

```xml
<priority_order>
  1. If RESEARCH.md exists and phase requirements have changed since it was written — prompt update
  2. If RESEARCH.md exists and is current — default to view; offer update only if user requests
  3. If no RESEARCH.md exists — proceed directly to Step 3
</priority_order>

<tie_breaking>
  When the user does not respond to the update/view/skip prompt within one turn,
  default to view (read-only). Erring toward showing existing work is preferable
  to discarding it without explicit instruction.
</tie_breaking>
```

---

### Issue 6 — No XML section tags separating prompt sections (Section 4, Action 2)

**Principle:** When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag. Tags name what the section IS, giving the model richer signal than markdown headers or step numbers alone.

**What's missing:** The workflow's process steps are formatted as markdown `## Step N:` headers. The guide is explicit that XML tags are "strictly better than markdown headers" for Claude-class models because the tag name carries semantic meaning. None of the five steps use XML tags.

**Concrete fix:** Replace markdown step headers with the guide's prescribed tags:

```xml
<phase id="1" name="Resolve Model Profile">
  ...
</phase>

<phase id="2" name="Normalize and Validate Phase">
  ...
</phase>

<phase id="3" name="Check Existing Research">
  ...
</phase>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL |
| All constraints are compatible — no conflicts | N/A (no constraints defined) |
| **Chain of Thought** | |
| CoT included only for math/symbolic/multi-step logic tasks | N/A (no CoT used; not required here) |
| CoT trigger used correctly | N/A |
| Reasoning elicited before the answer | N/A |
| CoT traces flagged as heuristic | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | N/A (no examples) |
| 2–5 examples total | N/A |
| Ordered simple to complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |
| **Formatting** | |
| Instruction complete and clear before formatting applied | FAIL |
| Prompt sections separated by semantically named XML tags | FAIL |
| At least 3 format variants will be tested | FAIL |
| **Instruction Framing** | |
| All negative instructions converted to positive equivalents | FAIL |
| Priority order explicit when multiple criteria apply | FAIL |
| Tie-breaking rules match domain's cost asymmetry | FAIL |
| **Persona** | |
| Persona included only for open-ended or stylistic tasks | N/A (no persona; one is needed for the spawned subagent) |
| Persona is specific, not generic | FAIL (no persona at all for subagent) |
| Persona descriptor is gender-neutral | N/A |
| **Output Format** | |
| Structured output tasks use two-step reasoning-then-format | FAIL |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL (return codes defined but no literal string spec in subagent prompt) |
| **Context Placement** | |
| Task instruction is at the start of the prompt | PASS (Task() prompt leads with `<objective>`) |
| Primary document or input is at the end of the prompt | PASS (`<output>` closes the Task() prompt) |
| Background context is in the middle | PASS (files_to_read and additional_context are in the middle) |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | FAIL (no snapshot labels on injected `gsd-sdk query` output) |
| **Self-Consistency** | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |
| **System/User Split** | |
| Persistent instructions are in system prompt | N/A (workflow file, not a system prompt) |
| Task-specific instructions are in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | FAIL (no constraints block; no validation) |
| **Agent/Subagent** | |
| Agent prompts are fully self-contained | FAIL |
| All file paths in agent output are absolute | N/A (output path uses relative `.planning/...`) — FAIL |
| Parallel agents launched in single message block | N/A (single agent) |
| Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | |
| Large prompts decomposed into atomic modules | PASS (uses @-referenced external files) |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS (variables used; no fallback syntax present) |
| Modules compose at runtime via variable substitution | PASS |
| **Constraint Enforcement** | |
| Every restriction paired with an equally concrete permission | FAIL (no constraints block) |
| Hard exclusion lists are enumerated | FAIL |
| Known edge cases have precedent-style rulings | FAIL |
| Confidence thresholds are numeric, not qualitative | N/A |
| **Decision Frameworks** | |
| Multi-option recommendations use explicit decision tree or table | FAIL (Step 5 return handling is prose, not a decision tree) |
| Criteria checklists gate complex approaches | FAIL |
| Action permissions framed around reversibility | FAIL |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | PASS (5 steps are sequential) |
| Required steps distinguished from type-specific steps | FAIL (no `<required_steps universal="true">` distinction) |
| Scenario-based branching handles multiple paths explicitly | PASS (Step 5 handles 3 return codes) |
| **Memory and Continuity** | N/A |
| **Modularity** | |
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL (no `<scope>` block) |
| **Safety and Trust** | |
| Validation at system boundaries only; internal interfaces trusted | N/A |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL (no authorization framing) |
| **Tone and Style** | |
| Size constraints use numeric limits, not qualitative descriptors | FAIL (return handling uses qualitative "summary") |
| Instructions use imperative present tense | PASS (steps use imperative present tense) |
| Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | |
| Prompt flagged as a draft for automated optimization | FAIL |
| Correct optimizer selected | FAIL |
| Held-out test set reserved before optimization begins | FAIL |

---

## Recommendations

**Priority 1 — Make the subagent prompt self-contained (Section 17; Section 1)**
The Task() call spawning `gsd-phase-researcher` is the core of this workflow. It currently passes a 7-line prompt to an agent that has no persona, no constraints, no output format specification, and no quality bar. Expand the subagent prompt to include all required sections: `<persona>`, `<task>`, `<constraints>` (with `<permitted>` and `<reserved_for_human_review>`), and a fully specified `<output_format>` including the exact return code strings. This is the highest-leverage change because everything downstream — plan quality, return code handling, developer experience — depends on the researcher producing well-structured output.

**Priority 2 — Add a task specification to the workflow itself (Section 1, Actions 1–3)**
Add `<task>`, `<audience>`, and `<quality_bar>` blocks at the top of the file. The orchestrating agent running this workflow currently has no explicit statement of what success looks like. Encoding the quality bar (what constitutes complete vs. inconclusive research) prevents the orchestrator from accepting a malformed researcher output.

**Priority 3 — Replace markdown step headers with XML phase tags (Section 4, Action 2; Section 16)**
Replace `## Step N:` headers with `<phase id="N" name="...">` tags throughout the `<process>` block. This gives the model richer structural signal and aligns the workflow with the guide's prescribed vocabulary for multi-phase workflows.

**Priority 4 — Convert the negative instruction and add priority/tie-breaking for Step 2 (Section 5, Actions 1 and Priority ordering)**
Rewrite "do not fall back to 'general-purpose'" as a positive rule ("use exactly one of the names listed below"). Add a `<priority_order>` and `<tie_breaking>` block to Step 2's existing-research check so the model has a deterministic rule for staleness and default behavior when the user does not respond.

**Priority 5 — Specify the orchestrator's output format with numeric size constraints (Section 7, Pattern 3; Section 21)**
Add an `<output_format>` block defining what the orchestrator presents to the developer in each of the three return-code scenarios. Replace qualitative language ("Display summary") with concrete field names and a character or sentence limit. This makes the user-facing output consistent across runs.
