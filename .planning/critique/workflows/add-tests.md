# Critique: add-tests.md

## Summary

The `add-tests` workflow is a well-structured, multi-phase process with clear steps, good user-confirmation gates, and a solid no-skip rule for test execution. Its strengths lie in the procedural clarity of each step, the classification table, and the honest bug-flagging behavior. However, the workflow falls short of the guide's structural standards in several measurable ways: it uses `<step>` tags where the guide prescribes `<phase>` tags with explicit triggers, omits an explicit quality bar and audience declaration, leaves constraint language in negative framing in one place, lacks any persona definition, and specifies no output format for the final commit message beyond a single literal string. The issues are not blocking — the workflow is functionally complete — but several of the guide's high-leverage patterns (XML semantic vocabulary, explicit priority ordering, scenario branching) are not applied.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern partially applied.** The workflow correctly segments work into named, ordered steps with explicit entry and exit conditions. Each step has a single concern.
- **Section 14 (Constraint Enforcement) — Hard no-skip rule.** The "No-skip rule" in `execute_e2e_generation` is a concrete, unambiguous behavioral constraint. It matches the guide's instruction to enumerate restrictions precisely rather than qualitatively.
- **Section 5 (Instruction Framing) — Conditional branching.** The `TEXT_MODE` conditional in `present_classification` is an explicit, well-formed ternary that handles two runtime paths with no ambiguity, consistent with Section 5's conditional instruction pattern.
- **Section 1 (Task Specification) — Error handling.** Each step has explicit error paths with literal output text and exit conditions, which keeps the task specification unambiguous and testable.
- **Section 22, Pattern 3 (Output format upfront).** The final summary table in `summary_and_commit` is fully pre-specified with field names, column headers, and placeholders — the reader knows exactly what the output will look like before the step runs.
- **Section 13 (Structural Architecture) — Template variable injection.** The workflow correctly uses `${PHASE_ARG}`, `${phase_number}`, `${phase_name}`, and `${EXTRA_INSTRUCTIONS}` throughout. Variable names are consistent and semantically meaningful.
- **Section 19 (Modularity) — Single responsibility per step.** Each `<step>` covers exactly one concern: parse arguments, load context, analyze, classify, discover structure, plan, execute TDD, execute E2E, summarize.

---

## Issues

### Issue 1: Wrong structural tag for workflow phases
**Principle:** Section 16 (Multi-Phase Workflows) — the phase pattern.

**What's wrong:** The workflow uses `<step name="...">` tags throughout. The guide mandates `<phase id="..." name="..." trigger="...">` for multi-step workflows (Section 16). The `<step>` tag is not in the guide's XML vocabulary (Section 4). Using an unrecognized tag means the model cannot infer phase boundaries, trigger conditions, or sequencing semantics — it treats the content as prose with labels.

**Concrete fix:** Replace `<step name="X">` with `<phase id="N" name="X" trigger="after_previous_phase">`. For phases that require user approval before proceeding, add an explicit trigger attribute, e.g. `trigger="after_user_approval"`.

```xml
<phase id="1" name="parse_arguments">
  ...
</phase>

<phase id="3" name="analyze_implementation" trigger="after_context_loaded">
  ...
</phase>

<phase id="4" name="present_classification" trigger="after_analysis_complete">
  ...
</phase>
```

---

### Issue 2: No explicit intent, audience, or quality bar declared
**Principle:** Section 1, Action 1 and Action 2 (Task Specification).

**What's wrong:** The `<purpose>` block describes what the workflow does but does not encode (a) the explicit quality bar for a generated test (what makes a test good vs. bad), (b) the audience (the model invoking this workflow needs to know what a "good test" looks like to the developer), or (c) the downstream consumer of the output. The `<quality_bar>` tag is absent entirely.

**Concrete fix:** Add a `<quality_bar>` block immediately after `<purpose>`:

```xml
<quality_bar>
A high-quality test for this workflow:
- Covers at least one happy-path and one edge-case scenario per function
- Uses arrange/act/assert structure with inline comments
- Runs and produces a pass or fail result (no untested tests marked as passing)
- Matches the project's existing naming conventions exactly
- Is self-contained: no shared mutable state between test cases
</quality_bar>
```

---

### Issue 3: No persona defined for the agent executing this workflow
**Principle:** Section 6, Action 2 (Persona Assignment) — persona must constrain register, voice, or domain-specific style.

**What's wrong:** The workflow issues no persona. The guide's role-domain mapping table (Section 6) lists "Tester" as ineffective and "Verification specialist — your job is to try to break it" as effective. A test-generation workflow benefits from an adversarial testing identity that biases the agent toward coverage of edge cases, not just happy paths. Without a persona, the agent defaults to generic assistant behavior.

**Concrete fix:** Add a `<persona>` block before `<process>`:

```xml
<persona>
You are a test coverage specialist. Your job is not to confirm that the implementation
passes its own happy-path scenarios — it is to find the inputs and sequences the
implementer did not think to test.

Your strengths:
- Classifying code by testability (pure functions vs. UI behavior vs. glue code)
- Writing tests that would fail if the implementation were broken
- Identifying edge cases: boundary values, empty inputs, invalid states, concurrent calls
</persona>
```

---

### Issue 4: One negative instruction not converted to a positive equivalent
**Principle:** Section 5, Action 1 (Instruction Framing — convert negatives to positives).

**What's wrong:** In `execute_tdd_generation`, step 4 contains: "Do NOT fix the implementation — this is a test-generation command, not a fix command." The guide's conversion table requires rewriting negative imperatives as positive specifications of the desired behavior. Exception: the reframe pattern (Section 6), but this is not a reframe context — it is a constraint.

**Concrete fix:**

```
Before: "Do NOT fix the implementation — this is a test-generation command, not a fix command."
After: "Record the finding and continue generating remaining tests. Implementation fixes
       belong to a separate command (/gsd-audit-fix or /gsd-quick)."
```

---

### Issue 5: `<process>` tag is not in the guide's semantic vocabulary
**Principle:** Section 4, Action 2 (Formatting — use semantically named XML tags from the shared vocabulary).

**What's wrong:** The workflow wraps all steps in a `<process>` tag. This tag does not appear in the guide's XML vocabulary (Section 4). The closest semantic equivalent is `<task>` (primary instruction) or a sequence of `<phase>` elements directly at the root. Using an out-of-vocabulary tag reduces interoperability with other modules and removes the semantic signal the guide relies on.

**Concrete fix:** Replace `<process>` with `<task>` and let the phases live directly inside:

```xml
<task>
  <phase id="1" name="parse_arguments">...</phase>
  <phase id="2" name="init_context" trigger="after_parse">...</phase>
  ...
</task>
```

---

### Issue 6: No explicit priority ordering when classification criteria conflict
**Principle:** Section 5 (Instruction Framing — priority ordering) and Section 16 (required vs. optional steps).

**What's wrong:** The classification table in `analyze_implementation` lists three mutually exclusive categories (TDD, E2E, Skip) and their criteria, but provides no tie-breaking rule for files that satisfy criteria for more than one category (e.g., a form validator that also has UI rendering logic). The guide requires explicit priority ordering and tie-breaking matched to the domain's cost asymmetry (Section 5, Section 22 Pattern 4).

**Concrete fix:** Add a priority order and tie-breaking rule immediately after the classification table:

```xml
<priority_order>
  1. E2E — if the file contains any directly user-testable UI interaction, classify as E2E
  2. TDD — if the file contains pure logic with no UI dependency, classify as TDD
  3. Skip — only when neither TDD nor E2E criteria are satisfiable
</priority_order>

<tie_breaking>
  When a file satisfies both TDD and E2E criteria, classify as TDD and note the
  UI interactions as candidates for a separate E2E test file. Prefer unit test
  coverage — it is faster to run and cheaper to maintain.
</tie_breaking>
```

---

### Issue 7: Success criteria uses markdown checkboxes, not XML `<required_steps>`
**Principle:** Section 16 (Multi-Phase Workflows — required vs. optional steps).

**What's wrong:** The `<success_criteria>` block uses plain markdown `- [ ]` checkboxes. The guide provides `<required_steps universal="true">` and `<type_specific_strategy>` as the canonical pattern for distinguishing mandatory from conditional steps. The current format is not machine-parseable and does not distinguish universal requirements from type-specific ones (e.g., E2E blockers are relevant only when E2E tests exist).

**Concrete fix:**

```xml
<required_steps universal="true">
  1. Phase artifacts loaded (SUMMARY.md required; CONTEXT.md and VERIFICATION.md optional)
  2. All changed files classified into TDD/E2E/Skip — verified by reading each file
  3. Classification presented to user and approved before any test is generated
  4. Project test structure discovered before test plan is created
  5. Test plan presented to user and approved before any test is written
  6. All generated tests executed — no test marked passing without a run
  7. Bugs flagged (not fixed); coverage gaps documented
  8. Test files committed with the prescribed commit message format
</required_steps>

<type_specific_strategy>
  If E2E tests are generated: blockers must be reported; never mark as complete without a run.
  If no TDD files: skip execute_tdd_generation phase entirely.
  If no E2E files: skip execute_e2e_generation phase entirely.
</type_specific_strategy>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score | Notes |
|---|---|---|
| **task_specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` states intent; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |
| **chain_of_thought** | | |
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger used; task is procedural not symbolic |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **few_shot_examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **formatting** | | |
| Instruction complete and clear before formatting | PASS | Each step's instruction is clear |
| Prompt sections separated by semantically named XML tags | FAIL | `<process>` and `<step>` are not in the guide's vocabulary |
| At least 3 format variants will be tested | FAIL | No format variants mentioned |
| **instruction_framing** | | |
| All negative instructions converted to positive | FAIL | "Do NOT fix the implementation" in execute_tdd_generation |
| Priority order explicit when multiple criteria apply | FAIL | No tie-breaking between TDD/E2E classification criteria |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rule present |
| **persona** | | |
| Persona included only for open-ended/stylistic tasks | FAIL | This is a stylistic/open-ended task; persona is absent |
| Persona is specific (constrains voice/register) | FAIL | No persona to evaluate |
| Persona descriptor is gender-neutral | N/A | No persona present |
| **output_format** | | |
| Structured output uses two-step reasoning-then-format | PASS | Classification and plan are presented before generation begins |
| Single-call JSON places reasoning fields before answer | N/A | No JSON output |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | N/A | No machine-parsed output |
| **context_placement** | | |
| Task instruction at start of prompt | PASS | `<purpose>` and `<required_reading>` lead the file |
| Primary document or input at end of prompt | PASS | `<success_criteria>` closes the file |
| Background context in the middle | PASS | Process steps are in the middle |
| All irrelevant context removed | PASS | No extraneous content detected |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot context injected |
| **self_consistency** | | |
| Self-consistency applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | |
| **prompt_length** | | |
| Redundant instructions and repeated context removed | PASS | No obvious duplication |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted relevant passage only | N/A | |
| **system_user_split** | | |
| Persistent instructions in system prompt | N/A | This is a workflow file, not a system/user split context |
| Task-specific instructions in user prompt | N/A | |
| Each instruction in exactly one location | PASS | No duplicate instructions detected |
| Safety-critical constraints have external validation | N/A | |
| **agent_subagent** | | |
| Agent prompts fully self-contained | PASS | Workflow reads its own artifacts; does not rely on inherited context |
| All file paths in agent output are absolute | FAIL | No explicit instruction to return absolute paths in test file output |
| Parallel agents launched in single message block | N/A | No parallel agent spawning in this workflow |
| Adversarial probes specified for verification agents | FAIL | No adversarial probe dimension listed for test generation |
| **structural_architecture** | | |
| Large prompts decomposed into atomic single-responsibility modules | PASS | Each step handles one concern |
| Template variables use ${VARIABLE_NAME} syntax | PASS | Consistent use throughout |
| Modules compose at runtime via variable substitution | PASS | `$PHASE_ARG`, `$EXTRA_INSTRUCTIONS` used correctly |
| **constraint_enforcement** | | |
| Every restriction paired with equally concrete permission | FAIL | "Do NOT fix" has no matching positive permission statement |
| Hard exclusion lists enumerated, not qualitative | PASS | Skip criteria are enumerated concretely |
| Known edge cases have precedent-style rulings | FAIL | No precedents for edge cases (ambiguous file, file with mixed concerns) |
| Confidence thresholds numeric, not qualitative | N/A | No confidence scoring in this workflow |
| **decision_frameworks** | | |
| Multi-option recommendations use explicit decision tree or table | PASS | Classification table is explicit |
| Criteria checklists gate complex approaches | PASS | Classification criteria are enumerated per category |
| Action permissions framed around reversibility | FAIL | No reversibility framing for the git commit step |
| **multi_phase_workflows** | | |
| Complex tasks organized into explicit named phases | FAIL | Uses `<step>` not `<phase id="..." trigger="...">` |
| Required steps distinguished from type-specific steps | FAIL | Success criteria mixes universal and conditional items |
| Scenario-based branching handles multiple paths explicitly | PASS | TEXT_MODE branch, user approval branches, and error exits are all explicit |
| **memory_and_continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory template in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Next steps block in summary_and_commit is conditional on results |
| **modularity** | | |
| Each prompt component has single responsibility | PASS | |
| Scope boundaries state both inclusions and exclusions | PASS | Skip criteria serve as explicit exclusion list |
| **safety_and_trust** | | |
| Validation at system boundaries only | PASS | Phase verification (directory existence, SUMMARY.md) at entry |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | User approval gates at classification and plan stages |
| **tone_and_style** | | |
| Size constraints use numeric limits, not qualitative | PASS | Tables and structured outputs use counts, not adjectives |
| Instructions use imperative present tense | PASS | "Read each file", "Create test file", "Run the test" |
| Working notes in analysis tags, not user-facing output | N/A | No scratchpad reasoning in this workflow |
| **optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization | FAIL | Not addressed |

**Summary score:** 16 PASS / 13 FAIL / 21 N/A out of 50 applicable items.

---

## Recommendations

Prioritized by impact-to-effort ratio.

### 1. Replace `<step>` with `<phase id="..." trigger="...">` (High impact, low effort)
The guide's phase pattern (Section 16) is a drop-in replacement for the current `<step>` pattern. It adds `id` and `trigger` attributes that encode sequencing semantics the model can act on. This single change upgrades structural architecture, checklist compliance, and interoperability with other GSD workflow modules simultaneously. Rename all eight `<step name="X">` blocks to `<phase id="N" name="X" trigger="...">` and wrap them in `<task>` instead of `<process>`.

### 2. Add `<persona>` with adversarial testing identity (High impact, moderate effort)
The absence of a persona leaves the agent in generic assistant mode. A test-coverage specialist identity (Section 6, Section 17 adversarial pattern) biases every classification and test-writing decision toward edge-case coverage rather than happy-path confirmation. Add the persona before `<process>` using the reframe pattern: "Your job is not to confirm the implementation works — it is to find what the implementer did not think to test." This is especially important because the workflow's goal is exactly adversarial: finding bugs through tests.

### 3. Add `<quality_bar>` and explicit tie-breaking for classification (Medium impact, low effort)
Two missing items that each require fewer than 10 lines: (a) a `<quality_bar>` block stating what makes a generated test high-quality (Section 1, Action 1), and (b) a `<priority_order>` + `<tie_breaking>` block after the classification table (Section 5). The tie-breaking is particularly important because files with both logic and UI rendering are common and the current workflow leaves the model to infer the resolution.

### 4. Convert the one negative instruction to a positive equivalent (Low impact, very low effort)
In `execute_tdd_generation` step 4, replace "Do NOT fix the implementation" with a positive redirect: "Record the finding and continue. Implementation fixes belong to `/gsd-audit-fix` or `/gsd-quick`." This is a mechanical one-line change (Section 5, Action 1) that eliminates the only guide violation in the constraint framing.

### 5. Rewrite `<success_criteria>` using `<required_steps>` and `<type_specific_strategy>` (Low impact, moderate effort)
The current markdown checklist does not distinguish universal requirements from E2E-specific or TDD-specific steps. Converting it to the guide's structured format (Section 16) makes the success criteria machine-readable and explicitly conditional, preventing the model from attempting E2E execution steps when no E2E files were classified. This is a structural improvement that pays off when the workflow is composed with other GSD modules.
