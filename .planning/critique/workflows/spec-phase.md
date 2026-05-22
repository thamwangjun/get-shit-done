# Critique: spec-phase.md

## Summary

`spec-phase.md` is a well-structured, operationally mature workflow with a clearly defined purpose, quantitative ambiguity gating, and a round-based Socratic interview loop. The internal logic is coherent and the process steps are concrete. However, the workflow is written in prose-heavy, ad-hoc markdown rather than the XML-tagged structural vocabulary prescribed by the guide, which reduces signal clarity for the LLM executing it. Several high-value guide patterns are absent or only partially applied: the workflow has no explicit `<persona>`, no `<output_format>` for the SPEC.md artifact, no explicit priority ordering when interview dimensions conflict, and the `<critical_rules>` and `<success_criteria>` blocks — while functional — use non-standard tags that fall outside the guide's vocabulary. Instruction framing occasionally uses negative constructions without positive equivalents. With targeted restructuring, this workflow would become significantly more parse-consistent and behaviorally predictable.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase structure:** Steps 1–8 are explicit named phases with clear sequencing. The gate-check pattern after each interview round mirrors the guide's `<phase>` cognitive boundary principle.
- **Section 16 (Multi-Phase Workflows) — Round-based interviews:** The `<interview_perspectives>` block with five named roles and per-round assignment directly applies the `<interview>` / `<round>` pattern from Section 16.
- **Section 16 (Multi-Phase Workflows) — Scenario-based branching:** The `--auto` / interactive fork and the SPEC.md-exists decision are implemented as explicit conditionals, consistent with Section 16's scenario-branching guidance.
- **Section 1 (Task Specification) — Constraint audit:** The ambiguity model with numeric dimension weights and explicit minimums is a strong application of Section 1 Action 3 — constraints are quantified and gated, not left qualitative.
- **Section 14 (Constraint Enforcement) — Acceptance criteria standard:** The explicit rejection of vague requirements ("The system should be fast") paired with concrete passing examples applies Section 14's precedent-style ruling approach and Section 22 Pattern 2's calibrating-example principle.
- **Section 19 (Modularity) — Scope boundaries:** The SPEC.md output requires explicit in-scope and out-of-scope lists, directly applying Section 19's `<scope>` / `<include>` / `<exclude>` pattern.
- **Section 5 (Instruction Framing) — Conditional branching:** The `--auto` vs. interactive path is implemented as an explicit conditional throughout, consistent with Section 5's conditional instruction pattern.
- **Section 21 (Tone and Style) — Numeric limits:** Round caps (max 6), question caps (2–3 per round), and ambiguity thresholds (≤ 0.20) use numeric constraints rather than qualitative descriptors, matching Section 21.

---

## Issues

### Issue 1: No XML structural tags — prompt sections not separated semantically

**Guide reference:** Section 4 Action 2; Section 4 XML tag vocabulary

**What's wrong:** The workflow uses ad-hoc prose, markdown headers, and custom XML-like tags (`<purpose>`, `<ambiguity_model>`, `<interview_perspectives>`, `<process>`, `<critical_rules>`, `<success_criteria>`) that are not part of the guide's defined vocabulary. The guide states that semantically named XML tags from a shared vocabulary are "strictly better than markdown headers or `---` delimiters for Claude-class models" and produce richer signal because the tag name carries semantic meaning. Custom tags carry no shared semantic weight.

**Concrete fix:** Replace the top-level structure with guide-standard tags:

```xml
<task>
  Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity
  scoring. Produce a SPEC.md with falsifiable requirements that discuss-phase treats as locked.
  This workflow handles "what" and "why" — discuss-phase handles "how".
</task>

<context>
  [ambiguity model, interview perspectives — moved here as background]
</context>

<constraints>
  [critical rules, gate conditions]
</constraints>

<output_format>
  [SPEC.md structure requirements]
</output_format>
```

---

### Issue 2: No `<persona>` assigned

**Guide reference:** Section 6 Action 1; Section 6 Action 2; Section 22 Pattern 1

**What's wrong:** The workflow assigns no persona to the executing agent. The guide prescribes that tasks requiring a specific voice, domain role, or decision-making style benefit from a specific, role-constrained persona. A spec-writing workflow requires the agent to alternate between five distinct perspectives (Researcher, Simplifier, Boundary Keeper, Failure Analyst, Seed Closer) — this is exactly the stylistic/domain-role case where a persona creates behavioral bias. Without it, the agent defaults to generic assistant behavior rather than leaning into the interviewer role.

**Concrete fix:** Add a specific persona at the top:

```xml
<persona>
You are a requirements analyst and specification writer. Your job is not to design
implementation — it's to surface exactly what success looks like and make it falsifiable.

You conduct structured interviews, score ambiguity numerically, and do not write a spec
until the requirements are clear enough that a planner cannot make wrong silent assumptions.
</persona>
```

---

### Issue 3: `<output_format>` for SPEC.md is implicit and incomplete

**Guide reference:** Section 7 Action 1; Section 22 Pattern 3

**What's wrong:** The SPEC.md output format is described inline within Step 6 as prose rules and ✗/✓ examples. The guide prescribes that output format is part of the task definition, stated completely and upfront in a dedicated `<output_format>` block with a concrete example. The SPEC.md schema (requirement entry structure, boundary lists, acceptance criteria format) is load-bearing — inconsistent output structure here directly breaks downstream `discuss-phase` consumption.

**Concrete fix:** Extract a top-level `<output_format>` block:

```xml
<output_format>
SPEC.md must contain:

1. **Ambiguity Report** — final scores for all 4 dimensions; flag any below minimum with ⚠.
2. **Requirements** — each entry must have exactly:
   - Requirement statement (one specific, testable sentence)
   - Current state (what exists today)
   - Target state (what it becomes)
   - Acceptance criterion (pass/fail — no subjective criteria)
3. **Boundaries**
   - In scope: explicit list of what this phase produces
   - Out of scope: explicit list of what it does NOT do, with brief reasoning per item
4. **Acceptance Criteria** — pass/fail checkboxes only

Example requirement entry:
```
### REQ-1: CLI validation error handling
- **Current state:** CLI exits with code 0 on invalid input; no stderr output.
- **Target state:** CLI exits with code 1 and prints error message to stderr on invalid input.
- **Acceptance criterion:** [ ] `invalid-cmd 2>&1; echo $?` outputs error text and prints `1`.
```
</output_format>
```

---

### Issue 4: Negative instructions not converted to positive equivalents

**Guide reference:** Section 5 Action 1

**What's wrong:** The `<critical_rules>` block contains multiple negative-framed instructions that the guide requires to be rewritten as positive specifications:
- "Do NOT ask about HOW to implement — that is discuss-phase territory"
- "SPEC.md is NEVER written if the user selects 'Abandon'"
- "do not frontload all questions at once"

**Concrete fix:** Apply the Section 5 conversion table:

| Current (negative) | Replacement (positive) |
|---|---|
| "Do NOT ask about HOW to implement" | "Ask only about what and why — redirect any 'how' question to discuss-phase" |
| "SPEC.md is NEVER written if the user selects 'Abandon'" | "Write SPEC.md only when the user selects Write or the gate passes in --auto mode" |
| "do not frontload all questions at once" | "Ask exactly 2–3 questions per round; hold remaining questions for later rounds" |

---

### Issue 5: No explicit priority order when interview dimensions conflict

**Guide reference:** Section 5 (Priority Ordering); Section 14 Constraint Enforcement

**What's wrong:** The ambiguity model defines four dimensions with weights (35%/25%/20%/20%) and individual minimums, but nowhere specifies what the agent should do when it must choose which dimension to prioritize in a round — e.g., when Boundary Clarity is lowest but Goal Clarity is also below minimum. The Seed Closer perspective in rounds 5–6 says "focus on lowest-scoring dimensions" but gives no tie-breaking rule when two dimensions score equally low, nor does it specify which takes precedence in question selection.

**Concrete fix:** Add a `<priority_order>` block in the interview section:

```xml
<priority_order>
  When selecting which dimension to address in a round:
  1. Any dimension below its minimum threshold (failures block the gate)
  2. Among tied failing dimensions: address Goal Clarity first (highest weight, 35%)
  3. Then Boundary Clarity (25%), then Acceptance Criteria (20%), then Constraint Clarity (20%)
  4. Among dimensions all above minimum: address the lowest absolute score
</priority_order>
```

---

### Issue 6: No `<task>` / `<audience>` / `<quality_bar>` triad

**Guide reference:** Section 1 Action 1; Section 1 Action 2

**What's wrong:** The guide requires every prompt to make explicit: (a) what output is being requested, (b) why it matters or how it will be used, and (c) what a correct response looks like. The `<purpose>` block partially covers (a) and (b) but (c) — the quality bar — is absent at the prompt level. The guide also requires the audience to be encoded explicitly. The workflow does not identify that the agent consuming this workflow is the spec-writing agent, not the end-user, and does not encode the audience's domain knowledge (it assumes familiarity with gsd tooling without stating it).

**Concrete fix:** Add after `<task>`:

```xml
<audience>
The agent executing this workflow is a spec-writing specialist operating within the GSD
planning system. It has access to the codebase, the ROADMAP.md, and prior phase artifacts.
The user is a developer who owns the feature decision — they are the authority on scope and
acceptance, not the agent.
</audience>

<quality_bar>
A high-quality execution: scouts the codebase before asking any question, surfaces only
grounded questions, produces a SPEC.md where every requirement is independently testable
by a verifier who has not read the interview transcript.
</quality_bar>
```

---

### Issue 7: Instruction duplication — gate logic repeated across multiple steps

**Guide reference:** Section 11 Action 3

**What's wrong:** The gate check (ambiguity ≤ 0.20 AND all minimums met) is stated in three separate locations: the `<ambiguity_model>` block, Step 3, and Step 4. The guide requires each instruction to appear in exactly one canonical location. Repetition adds noise and risks inconsistency if one instance is updated without the others.

**Concrete fix:** Define the gate once in `<constraints>` or a dedicated `<gate>` sub-block referenced by name in Steps 3 and 4:

```xml
<constraints>
  <gate id="spec-ready">
    Ambiguity score ≤ 0.20 AND all dimension scores meet their minimums.
    This gate must pass before SPEC.md is written.
  </gate>
</constraints>
```

Then Steps 3 and 4 reference: "Apply the spec-ready gate (see constraints)."

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `spec-phase.md` as a workflow prompt.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Intent present; audience and quality bar absent |
| All constraints are compatible — no conflicts | PASS | Dimension weights and minimums are internally consistent |
| **Chain-of-Thought** | | |
| CoT included only for applicable task types | N/A | Workflow does not configure CoT triggers |
| CoT trigger phrasing used | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples needed |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed | N/A | |
| **Formatting** | | |
| Instruction complete before formatting applied | PASS | Process steps are complete before structure |
| Prompt sections separated by semantically named XML tags | FAIL | Custom/non-vocabulary tags used throughout |
| At least 3 format variants tested | N/A | Workflow, not a prompt for evaluation |
| **Instruction Framing** | | |
| All negative instructions converted to positive | FAIL | Multiple negative constructions in critical_rules |
| Priority order explicit when multiple criteria apply | FAIL | No tie-breaking for equal-scoring dimensions |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule defined |
| **Persona** | | |
| Persona included only for applicable tasks | FAIL | No persona present; one is warranted |
| Persona is specific (constrains voice/register) | FAIL | No persona |
| Persona descriptor is gender-neutral | N/A | No persona to assess |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | |
| Single-call JSON places reasoning fields first | N/A | |
| Constrained decoding only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | SPEC.md schema embedded in prose, not a dedicated output_format block |
| **Context Placement** | | |
| Task instruction at start of prompt | PASS | `<purpose>` leads |
| Primary input at end of prompt | PASS | `<success_criteria>` closes; `<process>` is the core |
| Background context in middle | PASS | `<ambiguity_model>` and `<interview_perspectives>` precede `<process>` |
| Irrelevant context removed | PASS | No obvious padding |
| Time-sensitive injected context labeled as snapshot | N/A | |
| **Self-Consistency** | | |
| Applied only to tasks with single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions removed | FAIL | Gate logic repeated in 3 locations |
| Long prompts compressed | N/A | Not excessively long |
| RAG context is extracted passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file; split not applicable |
| Task-specific in user prompt | N/A | |
| Each instruction in exactly one location | FAIL | Gate check duplicated across sections |
| Safety-critical constraints have external validation | N/A | |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | PASS | All context sourced via init tool call |
| All file paths in agent output are absolute | PASS | `{phase_dir}/{padded_phase}-SPEC.md` is constructed as absolute |
| Parallel agents launched in single message block | N/A | No parallel spawning |
| Adversarial probes specified for verification agents | N/A | |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic modules | FAIL | Monolithic single file; no modular composition |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | Used throughout process steps |
| Modules compose at runtime via variable substitution | FAIL | No module composition; all logic inline |
| **Constraint Enforcement** | | |
| Every restriction paired with concrete permission | FAIL | Restrictions in critical_rules lack paired permissions |
| Hard exclusion lists enumerated, not qualitative | PASS | Boundaries are enumerated in SPEC.md output |
| Known edge cases have precedent-style rulings | PASS | Max-rounds and Abandon paths handled explicitly |
| Confidence thresholds are numeric | PASS | Numeric minimums per dimension |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or table | PASS | AskUserQuestion options are explicit decision branches |
| Criteria checklists gate complex approaches | PASS | Gate check before SPEC.md write |
| Action permissions framed around reversibility | N/A | No destructive actions |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | PASS | Steps 1–8 named and sequenced |
| Required steps distinguished from type-specific | PASS | `--auto` vs. interactive path explicit |
| Scenario-based branching handles multiple paths | PASS | SPEC-exists, gate-passed, max-rounds all branched |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory template |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |
| **Modularity** | | |
| Each component has single responsibility | PASS | Workflow is scoped to spec-writing only |
| Scope boundaries state inclusions and exclusions | PASS | "What and why" vs. "how" boundary is explicit |
| **Safety and Trust** | | |
| Validation at system boundaries only | PASS | Codebase reads are read-only; commit is the only write |
| Dual-use capabilities permit before restrict | N/A | |
| Authorization narrow-scoped | N/A | |
| **Tone and Style** | | |
| Size constraints use numeric limits | PASS | Max 6 rounds, 2–3 questions, ≤ 0.20 gate |
| Instructions use imperative present tense | PASS | Most steps use imperative form |
| Working notes in analysis tags | N/A | No internal reasoning output specified |
| **Optimization** | | |
| Prompt flagged as draft for optimization | FAIL | No optimization flag |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

**Summary: 16 PASS, 10 FAIL, 22 N/A**

---

## Recommendations

Prioritized by impact on behavioral predictability and guide conformance.

### 1. Add `<persona>`, `<audience>`, and `<quality_bar>` blocks (HIGH)

**Guide:** Section 1 Actions 1–2; Section 6 Actions 1–2; Section 22 Pattern 1

The absence of a persona means the agent has no role identity to constrain its register during the interview. The absence of an audience and quality bar means the agent has no standard against which to calibrate "done." These three additions are the highest-leverage single change because they shape every interaction in the workflow. See Issue 2 and Issue 6 for concrete text.

### 2. Replace custom XML tags with guide-standard vocabulary (HIGH)

**Guide:** Section 4 Action 2; Section 4 XML tag vocabulary table

Replace `<purpose>`, `<critical_rules>`, `<success_criteria>`, `<interview_perspectives>`, `<ambiguity_model>`, and `<process>` with the guide's shared vocabulary (`<task>`, `<constraints>`, `<context>`, `<output_format>`, `<interview>`, `<round>`). This is a structural refactor but the semantically named vocabulary is the foundation on which all other guide patterns rely. A shared vocabulary also makes this workflow interoperable with other GSD modules that consume or reference it.

### 3. Add `<output_format>` block with SPEC.md schema and concrete example (HIGH)

**Guide:** Section 7 Action 1; Section 22 Pattern 3

The SPEC.md output schema is buried in Step 6 prose. Extract it to a top-level `<output_format>` block with a complete example requirement entry. Because `discuss-phase` parses SPEC.md downstream, schema consistency is load-bearing — inconsistency here causes downstream failures. See Issue 3 for the concrete fix.

### 4. Convert negative instructions to positive equivalents (MEDIUM)

**Guide:** Section 5 Action 1

Three instructions in `<critical_rules>` use the negative construction the guide explicitly prohibits as a primary framing. Rewrite them as positive specifications (see Issue 4 conversion table). This is low effort and removes a known compliance gap.

### 5. Deduplicate gate logic and add priority order for tied dimensions (MEDIUM)

**Guide:** Section 11 Action 3; Section 5 (Priority Ordering)

Define the gate check once in a canonical location (`<constraints>`) and reference it by name from Steps 3 and 4. Separately, add a `<priority_order>` block in the interview section so the agent has a deterministic rule when two dimensions score equally low. See Issues 5 and 7 for concrete fixes.
