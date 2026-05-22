# Critique: insert-phase.md

## Summary

`insert-phase.md` is a focused, well-scoped workflow with a clear purpose and a sensible step-by-step structure. It correctly delegates the computational work to an SDK call, enforces argument validation with explicit error messages, and defines crisp success criteria. However, the workflow falls short on several prompt-engineering fundamentals: it uses XML tags primarily as section labels rather than as semantically named semantic containers, it relies heavily on negative instructions in `<anti_patterns>` without converting them to positive equivalents, it provides no output format specification, and it lacks an audience declaration, a quality bar, and any persona. The process steps are prose-heavy and loosely constrained, with no tie-breaking rules, no scenario branching for the key edge cases, and no explicit priority ordering. The workflow is readable and functional, but would benefit from tightening against the guide's structural patterns.

---

## Strengths

- **Section 1 Action 3 (constraint consistency):** The workflow avoids conflicting constraints. The single task — insert a decimal phase — is narrow and well-bounded, with no scope/length conflicts.
- **Section 4 Action 2 (XML tags as section separators):** The top-level document uses XML tags (`<purpose>`, `<process>`, `<step>`, `<anti_patterns>`, `<success_criteria>`) to delineate sections, which is aligned with the guide's structural recommendation.
- **Section 16 (multi-phase workflow pattern):** Steps are named (`parse_arguments`, `init_context`, `insert_phase`, `update_project_state`, `completion`) and sequenced, giving the model cognitive phase boundaries.
- **Section 14 (constraint enforcement — hard exclusion list):** `<anti_patterns>` functions as an exclusion list and enumerates specific forbidden behaviors (e.g., "Don't renumber existing phases", "Don't create plans yet").
- **Section 5 (conditional instructions):** The workflow uses explicit conditional branching for missing arguments and missing roadmap, with defined exit behavior.
- **Section 10 (prompt length and compression):** The workflow is concise and avoids redundancy. SDK delegation removes boilerplate that would otherwise bloat the prompt.
- **Section 22 Pattern 3 (output format upfront):** The completion summary in `<step name="completion">` provides a templated output structure with clear fields, which partly satisfies the output format pattern.

---

## Issues

### Issue 1 — No task specification block (Section 1, Actions 1–2)

**Principle:** Section 1 requires explicit extraction of (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. Section 1 Action 2 requires an explicit audience declaration.

**What's missing:** The `<purpose>` block states *what* the workflow does but omits *why* it matters (preserving phase sequence without renumbering), who the audience is (a developer running GSD mid-milestone), and what a high-quality insertion looks like. Without a `<quality_bar>`, the model has no calibration target.

**Fix:** Add a `<task>` / `<audience>` / `<quality_bar>` block directly after `<purpose>`:

```xml
<audience>
A developer running the GSD workflow who has discovered urgent unplanned work mid-milestone
and needs to insert it without disrupting the existing phase sequence or roadmap numbering.
</audience>

<quality_bar>
A successful insertion: creates exactly one new decimal phase directory, adds exactly one
entry to ROADMAP.md with the (INSERTED) marker, updates STATE.md, and presents a clear
completion summary with the next command to run. No existing phases are modified.
</quality_bar>
```

---

### Issue 2 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires scanning for negated instructions ("do not", "don't", "never") and rewriting each as a positive specification of desired behavior before emitting the prompt.

**What's missing:** The entire `<anti_patterns>` block is written as negative instructions:
- "Don't use this for planned work at end of milestone"
- "Don't insert before Phase 1"
- "Don't renumber existing phases"
- "Don't modify the target phase content"
- "Don't create plans yet"
- "Don't commit changes"

**Fix:** Convert each to a positive equivalent and move them into a `<constraints>` block:

```xml
<constraints>
  <permitted>
    - Use this command only for urgent, unplanned work discovered mid-milestone
    - Insert only after an existing integer phase (minimum: after Phase 1)
    - Preserve all existing phase numbers and contents exactly as-is
    - Create only the new decimal phase directory and its ROADMAP.md entry
    - Leave plan creation to /gsd-plan-phase
    - Leave commit decisions to the user
  </permitted>
</constraints>
```

---

### Issue 3 — No output format specification (Section 7; Section 22, Pattern 3)

**Principle:** Section 7 and Pattern 3 require that the required output structure, field names, ordering, and an example be stated before the model begins its task.

**What's missing:** The `<step name="completion">` block provides a template, but it is embedded inside the process steps rather than declared upfront in a dedicated `<output_format>` tag. There is no statement of what fields are required, their order, or an annotated example that distinguishes required from optional content. The template uses placeholder tokens (e.g., `{decimal_phase}`) without specifying the format of those values.

**Fix:** Add a top-level `<output_format>` section immediately before `<process>`:

```xml
<output_format>
Present the completion summary in this exact structure:

Phase {N.M} inserted after Phase {N}:
- Description: {user-provided description, verbatim}
- Directory: .planning/phases/{N.M}-{slug}/
- Status: Not planned yet
- Marker: (INSERTED) — indicates urgent work

Roadmap updated: .planning/ROADMAP.md
Project state updated: .planning/STATE.md

Then a "## Next Up" section with the exact next command to run.

{N.M} is a decimal string (e.g., "72.1"). {slug} is a kebab-case string derived
from the description (e.g., "fix-critical-auth-bug").
</output_format>
```

---

### Issue 4 — No scenario-based branching for key edge cases (Section 16)

**Principle:** Section 16 states that multiple execution paths should be handled with explicit `<scenarios>` blocks rather than leaving the model to infer branching behavior.

**What's missing:** There are two implicit but unspecified branching cases:
1. The target phase already has one or more existing decimal sub-phases (e.g., 72.1 already exists — should the new phase be 72.2?).
2. The target phase number does not exist in ROADMAP.md.

The workflow delegates these entirely to the SDK call (`gsd-sdk query phase.insert`) with no explicit handling or user communication defined for each branch.

**Fix:** Add a `<scenarios>` block inside `<step name="insert_phase">`:

```xml
<scenarios>
  <scenario condition="target_phase_has_no_existing_decimals">
    New phase number is {after_phase}.1. Proceed normally.
  </scenario>

  <scenario condition="target_phase_has_existing_decimals">
    New phase number is {after_phase}.{max_existing_decimal + 1}.
    Inform the user: "Phase {after_phase} already has {count} inserted phase(s).
    Inserting as Phase {new_decimal}."
  </scenario>

  <scenario condition="target_phase_not_found_in_roadmap">
    Print:
    ERROR: Phase {after_phase} not found in .planning/ROADMAP.md
    Run /gsd-progress to see current phases.
    Exit without making any changes.
  </scenario>
</scenarios>
```

---

### Issue 5 — No priority order or tie-breaking rules (Section 5; Section 22, Pattern 4)

**Principle:** Section 5 requires explicit priority ordering when multiple criteria apply. Pattern 4 requires a tie-breaking rule that reflects the domain's cost asymmetry.

**What's missing:** The workflow gives no guidance on what to do when the SDK call returns partial or ambiguous data (e.g., `phase_number` is returned but `directory` is not). There is also no guidance on the error-vs-proceed asymmetry: should the workflow proceed optimistically or halt conservatively when STATE.md is missing?

**Fix:** Add a `<priority_order>` and `<tie_breaking>` block inside `<constraints>`:

```xml
<priority_order>
  1. Data integrity — never write partial state; all-or-nothing
  2. User communication — surface errors immediately with recovery instructions
  3. Completeness — all four success criteria must pass before presenting the summary
</priority_order>

<tie_breaking>
  When any SDK call returns an error or incomplete data, halt and report the error
  rather than proceeding. Partial state (directory created but ROADMAP.md not updated)
  is worse than no state change at all.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Audience and quality bar absent |
| All constraints are compatible | PASS | No conflicting constraints identified |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger present; task is procedural |
| CoT trigger phrasing used correctly | N/A | |
| Reasoning before answer | N/A | |
| CoT traces treated as heuristic only | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete before formatting applied | PASS | Purpose and process are clear |
| Prompt sections separated by semantically named XML tags | PASS | `<purpose>`, `<process>`, `<step>`, etc. used |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |
| **Instruction Framing** | | |
| All negative instructions converted to positive | FAIL | `<anti_patterns>` block is entirely negative |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering present |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rules present |
| **Persona** | | |
| Persona included only for open-ended/stylistic tasks | N/A | No persona; acceptable for a procedural workflow |
| Persona is specific (constrains voice/register) | N/A | |
| Persona descriptor is gender-neutral | N/A | |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format approach | N/A | Output is not structured JSON/XML |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format spec | FAIL | Completion template embedded in process step, not declared upfront |
| **Context Placement** | | |
| Task instruction at start of prompt | PASS | `<purpose>` leads the document |
| Primary document/input at end | PASS | `<success_criteria>` closes the document |
| Background context in middle | PASS | `<process>` steps occupy the middle |
| All irrelevant context removed | PASS | No padding or boilerplate |
| Time-sensitive injected context labeled as snapshot | N/A | No injected runtime context |
| **Self-Consistency** | | |
| Applied only to tasks with single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No duplication observed |
| Long prompts compressed before sending | N/A | Prompt is short |
| RAG context is extracted relevant passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file format |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplication |
| Safety-critical constraints have external validation | N/A | |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | PASS | `<required_reading>` instructs context loading |
| All file paths in agent output are absolute | FAIL | Completion summary uses relative paths (`.planning/ROADMAP.md`) |
| Parallel agents launched in single message block | N/A | No parallel agents |
| Adversarial probes specified for verification agents | N/A | |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic modules | PASS | Workflow is appropriately scoped |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL | Template uses `{variable}` not `${VARIABLE_NAME}` |
| Modules compose at runtime via variable substitution | PASS | SDK delegation handles runtime data |
| **Constraint Enforcement** | | |
| Every restriction paired with an equally concrete permission | FAIL | `<anti_patterns>` has restrictions but no paired permissions |
| Hard exclusion lists enumerated, not described qualitatively | PASS | Anti-patterns are enumerated specifically |
| Known edge cases have precedent-style rulings | FAIL | No precedents for decimal collision or missing target phase |
| Confidence thresholds are numeric, not qualitative | N/A | |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or comparison table | FAIL | No branching logic for edge cases |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | FAIL | No reversibility framing (e.g., STATE.md write is not reversible) |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | PASS | Steps are named with `name=` attribute |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` distinction |
| Scenario-based branching handles multiple paths explicitly | FAIL | No `<scenarios>` block for edge cases |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | "Next Up" section anchors directly to the inserted phase |
| **Modularity** | | |
| Each prompt component has single responsibility | PASS | Workflow handles only phase insertion |
| Scope boundaries state both inclusions and exclusions | FAIL | `<anti_patterns>` states exclusions; no explicit inclusions paired |
| **Safety and Trust** | | |
| Validation at system boundaries only; internal interfaces trusted | PASS | SDK call trusted; user input validated at top |
| Dual-use capabilities state permissions before restrictions | FAIL | `<anti_patterns>` states restrictions only, no paired permissions |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | "Don't commit changes (user decides)" upholds narrow scope |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | N/A | No size constraints on output |
| Instructions use imperative present tense | PASS | Steps use imperative present tense throughout |
| Working notes in analysis tags, not user-facing output | N/A | |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization | FAIL | Not addressed |

---

## Recommendations

Listed in priority order by impact on correctness and reliability.

### 1. Convert `<anti_patterns>` to a `<constraints>` block with positive permission pairs (Section 5, Action 1; Section 14)

This is the highest-impact fix. The current `<anti_patterns>` block gives only prohibitions without stating what IS permitted, which leaves the model in an ambiguous state at the boundary. Rewrite as a `<constraints>` block pairing each restriction with its positive counterpart (see Issue 2 fix above). This directly removes the guide's most mechanically enforceable violation.

### 2. Add `<audience>` and `<quality_bar>` immediately after `<purpose>` (Section 1, Actions 1–2)

The model has no calibration target for what "done well" looks like. Adding an explicit audience and quality bar anchors the model's behavior, especially when the SDK returns partial or ambiguous data. This is a small addition (4–6 lines) with meaningful impact on output consistency.

### 3. Add a `<scenarios>` block for the two unhandled edge cases (Section 16)

The decimal collision case (Phase 72.1 already exists) and the missing target phase case are both likely in production use and currently handled entirely by SDK internals with no user-facing communication defined. Adding explicit scenario branches (see Issue 4 fix above) prevents silent failures and undefined behavior.

### 4. Move the completion template to a top-level `<output_format>` block and use `${VARIABLE_NAME}` syntax (Section 7; Section 22, Pattern 3; Section 13)

The completion template is currently buried in the last process step. Elevating it to a dedicated `<output_format>` block makes the expected output contract visible before the process begins, which is how the guide recommends specifying output. Simultaneously, replacing `{variable}` with `${VARIABLE_NAME}` aligns with the system's standard template variable syntax (Section 13).

### 5. Add `<tie_breaking>` and `<priority_order>` for error/proceed decisions (Section 5; Section 22, Pattern 4)

The workflow is silent on what to do when any step partially fails. Given that STATE.md and ROADMAP.md writes are not atomic, a failure between them leaves the project in inconsistent state. A conservative tie-breaking rule ("halt and report; never write partial state") is the correct cost-asymmetry match for this domain and can be stated in two lines (see Issue 5 fix above).
