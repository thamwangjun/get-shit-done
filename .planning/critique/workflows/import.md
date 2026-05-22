# Critique: import.md

## Summary

`import.md` is a competently structured operational workflow with clear phase boundaries, good use of semantic XML step tags, and solid safety gating (the BLOCKER/WARNING/INFO conflict detection pattern is well-designed). However, it falls materially short of the guide's standards in several important areas: the task specification is implicit rather than declared, there is no persona, output format is incompletely specified (only the conflict report format is given; the completion summary format is left to "Show: …" prose), there are no few-shot examples to anchor the model's judgment on edge cases, and negative instructions appear in the Anti-Patterns section without being converted to positive equivalents. The multi-phase structure is present but does not use `<phase id="…" name="…" trigger="…">` tagging, and no tie-breaking rules exist for the many judgment calls the workflow requires. These gaps leave meaningful room for inconsistent model behavior across runs.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** The workflow is organized into discrete, named `<step>` elements with clear cognitive boundaries. The model completes one step before proceeding to the next, which mirrors the guide's phase pattern.
- **Section 14 (Constraint Enforcement) — BLOCKER/WARNING/INFO safety gate.** The three-tier conflict report is an effective hard-exclusion structure. Blocking import when any BLOCKER exists is the right safety design and matches the guide's principle of pairing restrictions with explicit permission (the INFO tier permits continuation without action).
- **Section 5 (Instruction Framing) — Conditional branching is explicit.** `--from` / `--prd` / neither-flag branching is clearly stated with discrete behaviors per branch, matching the guide's conditional instruction pattern.
- **Section 14 (Constraint Enforcement) — Anti-Patterns section as negative exclusion list.** The dedicated Anti-Patterns block enumerates exactly what not to do, giving the model a concrete exclusion list analogous to `<exclusions>` in the guide.
- **Section 20 (Safety and Trust Patterns) — Path traversal validation is present.** The `*..* ` bash guard explicitly validates untrusted input at the system boundary, consistent with the guide's trust-hierarchy rule.
- **Section 19 (Modularity and Composition) — Single responsibility.** The file handles exactly one concern: ingesting external plans. It does not bleed into plan execution or milestone management.

---

## Issues

### Issue 1 — No explicit task specification (Section 1, Actions 1–2)

**Principle:** Section 1 requires that the prompt declare (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. It also requires explicit audience encoding.

**What is missing:** The workflow opens with a one-line description ("External plan ingestion with conflict detection and agent delegation.") that names the mechanism but not the goal, success criteria, or audience. There is no `<task>`, `<audience>`, or `<quality_bar>` declaration.

**Concrete fix:** Add a preamble block before the first `<step>`:

```xml
<task>
Ingest an external plan file into the GSD planning system. Detect conflicts against
existing project context, convert the plan to GSD PLAN.md format, validate it, and
commit it to the repository.
</task>

<audience>
The executing model is an LLM agent operating inside Claude Code. It has access to
bash tools, file read/write, and the AskUserQuestion tool. It has no prior context
about the imported file — all context must be loaded during execution.
</audience>

<quality_bar>
A successful import ends with: (1) a validated PLAN.md written to the correct phase
directory, (2) ROADMAP.md updated, (3) a commit made. A blocked import ends with: a
clear conflict report displayed and no files written.
</quality_bar>
```

---

### Issue 2 — No persona (Section 6, Actions 1–2; Section 22, Pattern 1)

**Principle:** Section 6 requires a specific, role-constrained persona for tasks that involve open-ended judgment. Section 22 Pattern 1 states that role identity scoped to the exact domain creates behavioral bias toward domain-appropriate outputs.

**What is missing:** The import workflow requires significant judgment: inferring phase targets from freeform documents, detecting semantic conflicts, and deciding severity of partial overlaps. None of this judgment is anchored by a declared identity. The model defaults to generic assistant behavior.

**Concrete fix:**

```xml
<persona>
You are a GSD planning integration specialist. Your role is to ingest external plans
into the GSD system safely — converting format, detecting conflicts, and preserving
the integrity of the existing roadmap.

Your primary obligation is to the safety gate: when blockers exist, no files are written.
When warnings exist, the user decides. When the path is clear, you convert and commit
with precision.
</persona>
```

---

### Issue 3 — Negative instructions in Anti-Patterns not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires converting negative instructions ("Do not", "avoid", "never") to positive specifications before emitting a prompt. The conversion table is explicit.

**What is missing:** The Anti-Patterns section is entirely written as a list of "Do NOT" directives. While useful as a safeguard list, the guide requires positive framing as the primary instruction form, with the exception being the reframe pattern (Section 6), which does not apply here.

**Concrete fix:** Convert each prohibition to a positive constraint co-located with the step it governs (or consolidate in a `<constraints>` block):

```xml
<constraints>
  <permitted>
    - Use plain-text [BLOCKER]/[WARNING]/[INFO] labels in conflict reports
    - Use {NN}-{MM}-PLAN.md naming for all written plan files
    - Use gsd-plan-checker and gsd-planner as the canonical tool names
  </permitted>

  <exclusions>
    - Markdown tables (|---|) in conflict detection output
    - PLAN-01.md or plan-01.md filename formats
    - pbr:plan-checker, pbr:planner, pbr-tools, PLAN-BUILD-RUN references
    - Writing .planning/.active-skill files
    - Writing any PLAN.md when blockers exist
    - Accepting --from file paths without path traversal validation
  </exclusions>
</constraints>
```

---

### Issue 4 — No few-shot examples for judgment-heavy steps (Section 3; Section 22, Pattern 2)

**Principle:** Section 3 and Pattern 2 require that qualitative instructions be grounded by concrete examples. The guide's rule is: "Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

**What is missing:** The `plan_read_input` step asks the model to infer "Phase target", "Plan objectives", "Tasks listed", "Files modified", and "Dependencies" from a freeform document. The `plan_conflict_detection` step requires the model to determine whether a partial overlap is a WARNING vs. INFO. Neither step provides an example. The model's judgment is unanchored.

**Concrete fix:** Add at least one worked example per judgment-heavy step using `<examples>/<example>` structure (Section 4 XML vocabulary):

```xml
<examples>
  <example>
    <input>
    Freeform markdown section:
    "## Phase 3 – Auth Refactor
    Move JWT validation from middleware to dedicated service layer."
    </input>
    <output>
    phase_target: "03"
    objectives: ["Extract JWT validation to a dedicated auth service"]
    files_modified: ["src/middleware/auth.ts", "src/services/auth.ts"]
    dependencies: []
    </output>
    <commentary>
    Phase target is inferred from the heading number. Files are inferred from
    domain knowledge about middleware extraction — flag as [INFO] since they
    are not explicitly listed.
    </commentary>
  </example>
</examples>
```

---

### Issue 5 — Output format for the completion summary is underspecified (Section 7; Section 22, Pattern 3)

**Principle:** Section 7 Action 1 and Pattern 3 require that output format be specified completely and upfront. An implicit format produces structure that varies per call.

**What is missing:** The `plan_finalize` step ends with:

```
Show: plan filename written, phase directory, validation result, next steps.
```

This is a prose enumeration, not a format specification. The model will render this differently on each invocation — sometimes as a table, sometimes as prose, sometimes as a bulleted list. The guide calls for a concrete template with field names and an example.

**Concrete fix:**

```xml
<output_format>
Display the completion summary in exactly this structure:

Plan file:        .planning/phases/{NN}-{slug}/{NN}-{MM}-PLAN.md
Phase directory:  .planning/phases/{NN}-{slug}/
Validation:       PASSED | FAILED (see errors above)
Commit:           {commit hash or "skipped"}

Next steps:
- Run /gsd-execute-phase {NN} to execute this plan
- Run /gsd-plan-phase to add additional plans to this phase
</output_format>
```

---

### Issue 6 — No tie-breaking rules for ambiguous conflict severity (Section 5; Section 22, Pattern 4)

**Principle:** Section 5 and Pattern 4 require explicit tie-breaking rules matched to the domain's cost asymmetry. The guide's question is: "Is over-inclusion or under-inclusion the more expensive error?"

**What is missing:** The conflict detection step has cases at the margin — for example, a plan that "partially overlaps" existing requirements could be a WARNING or an INFO depending on the degree of overlap. The workflow gives no tie-breaking rule. The model will apply its own prior, which varies across runs.

**Concrete fix:** Add a tie-breaking block at the end of `plan_conflict_detection`:

```xml
<tie_breaking>
When uncertain between WARNING and INFO: classify as WARNING.
Blocking an import that turns out to be safe is cheaper than allowing an import that
introduces a conflict — the user can approve a warning and proceed; they cannot un-write
a conflicting plan without manual intervention.

When uncertain between BLOCKER and WARNING: classify as BLOCKER only when the
contradiction is direct and unambiguous. Indirect or speculative contradictions are
WARNING severity.
</tie_breaking>
```

---

### Issue 7 — Phase tags use `<step>` instead of the guide's `<phase>` vocabulary (Section 16; Section 4 XML Tag Vocabulary)

**Principle:** Section 16 defines `<phase id="…" name="…" trigger="…">` as the canonical XML vocabulary for multi-step workflows. Section 4 provides a standard XML tag vocabulary for structural consistency and interoperability across prompts.

**What is missing:** The workflow uses `<step name="…">` tags, which are not in the guide's tag vocabulary. This is not wrong per se, but it means the workflow is not using the guide's shared vocabulary, reducing interoperability and predictability.

**Concrete fix:** Replace `<step name="X">` with `<phase id="N" name="X">` and add `trigger` attributes where phase transitions depend on conditions:

```xml
<phase id="1" name="parse_arguments">
...
</phase>

<phase id="2" name="plan_load_context" trigger="after_argument_validation">
...
</phase>

<phase id="3" name="plan_conflict_detection" trigger="after_context_loaded">
...
</phase>
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items marked N/A where the checklist item is not applicable to a workflow prompt (e.g., self-consistency, RAG).

### Task Specification
- `[ ]` FAIL — Intent, audience, and quality bar are not explicit in the prompt
- `[x]` PASS — All constraints are compatible (no conflicts detected between scope, length, or depth)

### Chain of Thought
- `[x]` N/A — CoT is not applicable to a deterministic procedural workflow
- `[x]` N/A — CoT trigger not required
- `[x]` N/A — Reasoning/answer ordering not applicable
- `[x]` N/A — CoT traces not applicable

### Few-Shot Examples
- `[ ]` FAIL — Examples not selected or present for judgment-heavy steps
- `[ ]` FAIL — No examples provided at all (0 examples, not 2–5)
- `[ ]` FAIL — No ordering (no examples to order)
- `[ ]` FAIL — No diversity across sub-types demonstrated
- `[ ]` FAIL — Format consistency not established (no examples)
- `[x]` N/A — Example order fixedness not applicable (no examples)

### Formatting
- `[x]` PASS — Instructions are complete and clear before formatting is applied
- `[x]` PASS — Prompt sections are separated by semantically named XML tags (`<step>`)
- `[ ]` FAIL — No evidence that 3 format variants were tested on the target model

### Instruction Framing
- `[ ]` FAIL — Negative instructions in Anti-Patterns section not converted to positive equivalents
- `[ ]` FAIL — Priority order is not explicit when multiple criteria apply (e.g., WARNING vs. INFO judgment)
- `[ ]` FAIL — No tie-breaking rules present for the domain's cost asymmetry

### Persona
- `[ ]` FAIL — No persona is present despite the workflow requiring significant open-ended judgment
- `[x]` N/A — (No persona to evaluate for specificity)
- `[x]` N/A — (No persona to evaluate for gender neutrality)

### Output Format
- `[x]` N/A — Structured output via two-step not applicable (no JSON output required)
- `[x]` N/A — Single-call JSON field ordering not applicable
- `[x]` N/A — Constrained decoding not applicable
- `[ ]` FAIL — Completion summary output uses underspecified prose description, not exact format specification

### Context Placement
- `[x]` PASS — Task instruction leads the workflow (banner + parse_arguments first)
- `[x]` PASS — Primary input (FILEPATH) is acted on last (after context loading)
- `[x]` PASS — Background context (ROADMAP.md, PROJECT.md) is loaded in the middle
- `[x]` PASS — No irrelevant context tokens detected
- `[x]` N/A — No time-sensitive injected context

### Self-Consistency
- `[x]` N/A — Not applicable (deterministic procedural workflow)
- `[x]` N/A — Not applicable

### Prompt Length
- `[x]` PASS — No redundant instructions or repeated context detected
- `[x]` N/A — Long-context compression not applicable
- `[x]` N/A — RAG not applicable

### System/User Split
- `[x]` N/A — Workflow file does not operate in a system/user prompt split context
- `[x]` N/A
- `[x]` PASS — Each instruction appears to appear in one location (no duplication detected)
- `[ ]` FAIL — Safety-critical constraint (the BLOCKER safety gate) has no external validation; it relies entirely on the model's instruction-following

### Agent / Subagent
- `[x]` PASS — The gsd-plan-checker delegation is explicit and self-contained
- `[x]` N/A — Absolute path enforcement not stated in output instructions (the workflow writes paths but does not instruct the model on this rule)
- `[x]` N/A — Parallel agents not used
- `[x]` N/A — Adversarial probes not applicable

### Structural Architecture
- `[x]` PASS — Single-responsibility module; the file handles import only
- `[ ]` FAIL — No template variables (${VARIABLE_NAME} syntax) used; hardcoded paths and tool names appear inline
- `[x]` N/A — Module composition not demonstrated (single file)

### Constraint Enforcement
- `[ ]` FAIL — Anti-Patterns restrictions are not paired with equally concrete permissions
- `[x]` PASS — BLOCKER/WARNING/INFO is an enumerated exclusion list (not qualitative)
- `[x]` N/A — Precedent-style rulings not applicable (no known edge-case disputes enumerated)
- `[x]` N/A — Confidence thresholds not applicable

### Decision Frameworks
- `[x]` PASS — Mode branching (--from / --prd / neither) uses explicit conditional branching
- `[x]` N/A — Criteria checklists not applicable
- `[ ]` FAIL — Action permissions (writing PLAN.md, committing) are not framed around reversibility using `<take_freely>` / `<confirm_with_user>`

### Multi-Phase Workflows
- `[x]` PASS — Complex task is organized into explicit named phases
- `[x]` N/A — Required vs. type-specific step distinction not applicable
- `[x]` PASS — Scenario-based branching (BLOCKER path vs. WARNING-only path) is explicit

### Memory and Continuity
- `[x]` N/A — Memory templates not applicable to a workflow prompt
- `[x]` N/A — Compaction summaries not applicable
- `[x]` N/A — Next steps not applicable

### Modularity
- `[x]` PASS — Single responsibility confirmed
- `[ ]` FAIL — Scope boundaries do not state explicit exclusions within the prompt body (Anti-Patterns is close but not a `<scope><exclude>` block)

### Safety and Trust
- `[x]` PASS — Path traversal validation is at the system boundary (user-provided FILEPATH)
- `[x]` N/A — Dual-use capabilities not applicable
- `[ ]` FAIL — The commit action in plan_finalize is irreversible (git commit) but is not gated by `<confirm_with_user>`

### Tone and Style
- `[ ]` FAIL — Completion summary uses qualitative description ("Show: plan filename written…") rather than numeric/structural specification
- `[x]` PASS — Instructions use imperative present tense throughout
- `[x]` N/A — No working notes in user-facing output

### Optimization
- `[ ]` FAIL — Prompt is not flagged as a draft for automated optimization
- `[x]` N/A — Optimizer selection not applicable at this stage
- `[x]` N/A — Held-out test set not applicable at this stage

---

## Recommendations

The following improvements are prioritized by expected impact on output consistency and safety.

### 1 (Highest Priority) — Add task specification, audience, and quality bar (Section 1, Actions 1–2)

Without a declared intent, audience, and quality bar, the model has no reference for what "done" looks like. This is the single highest-leverage addition. Add `<task>`, `<audience>`, and `<quality_bar>` blocks before the first `<step>` as shown in Issue 1. Expected impact: reduces variation in how the model interprets ambiguous cases throughout the workflow.

### 2 — Add a persona scoped to the planning integration domain (Section 6, Actions 1–2; Pattern 1)

The workflow requires repeated judgment calls — inferring phase targets, classifying conflict severity, deciding what to surface in the completion summary. A domain-specific persona (planning integration specialist, safety-gate guardian) anchors all of these calls. Add the persona block shown in Issue 2 immediately after the quality bar. Expected impact: reduces hallucinated phase inferences and inconsistent conflict classification.

### 3 — Add tie-breaking rules for conflict severity (Section 5; Pattern 4)

The gap between WARNING and INFO is the most likely source of inconsistent model behavior across runs. A precision-biased tie-breaking rule (classify as WARNING when uncertain) matches the cost asymmetry of this domain. Add the `<tie_breaking>` block shown in Issue 6 at the end of the `plan_conflict_detection` step. Expected impact: eliminates the most common underdetermined judgment call in the workflow.

### 4 — Convert Anti-Patterns to a paired `<constraints>` block with positive permissions (Section 5, Action 1; Section 14)

The Anti-Patterns section is effective as an exclusion list but violates Section 5 Action 1 (negative instructions must be converted to positive equivalents) and Section 14 (every restriction paired with an equally concrete permission). Restructure as shown in Issue 3. Expected impact: reduces ambiguity about what the model IS allowed to do when PBR patterns are excluded.

### 5 — Specify the completion summary output format concretely (Section 7; Pattern 3)

The current "Show: …" prose description will produce structurally different output across runs. Replace with the exact template shown in Issue 5. This is a low-effort, high-consistency gain. Expected impact: deterministic completion output that downstream tooling or humans can parse reliably.
