# Critique: new-milestone.md

## Summary

`new-milestone.md` is a well-structured, operationally complete workflow that covers the full milestone initialization lifecycle: context loading, goal gathering, seed scanning, version confirmation, requirements definition, research orchestration, roadmapping, and commit sequencing. Its procedural coverage is strong and the step-by-step breakdown gives the model a clear execution path. However, the workflow consistently uses plain prose headers and markdown bullet lists where semantically named XML tags would give the model stronger structural signal (Section 4). Several inline subagent prompts embed qualitative rather than numeric constraints (Section 21), do not declare explicit permission boundaries (Section 14), and omit `<output_format>` specifications that would make machine-parsed returns unambiguous (Section 7). The `<purpose>` and `<success_criteria>` blocks are a genuine strength, but the workflow's heavy reliance on markdown `##` headings instead of XML phases means phase boundaries are implicit rather than enforced (Section 16). These are largely structural and framing gaps rather than logic errors — the underlying process is sound.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Implicit phase structure exists.** The eleven numbered steps map naturally to a multi-phase model. Each step has a clear entry point, actions, and exit condition. The underlying cognitive decomposition is correct even if the XML `<phase>` tag encoding is absent.

- **Section 13 (Structural Architecture) — Template variable injection used correctly.** `${AGENT_SKILLS_RESEARCHER}`, `${AGENT_SKILLS_SYNTHESIZER}`, `${AGENT_SKILLS_ROADMAPPER}`, `${GSD_WS}`, `${PROJECT_CODE}`, and `${PROJECT_TITLE}` are all injected via the canonical `${VARIABLE_NAME}` pattern. The workflow does not copy-paste agent skill content inline.

- **Section 5 (Instruction Framing) — Conditional branching is explicit.** The `--reset-phase-numbers` flag, `research_enabled` config check, TEXT_MODE ternary, and "If MILESTONE-CONTEXT.md exists / If no context file" branches are all spelled out as explicit conditionals rather than left to model inference.

- **Section 1 (Task Specification) — Success criteria are defined.** The `<success_criteria>` block provides a testable checklist that closes the quality-bar gap (Section 1 Action 1c). Each criterion is binary and actionable.

- **Section 17 (Agent and Subagent Patterns) — Parallel agent spawning is present and correct.** Step 8 explicitly instructs spawning 4 researchers in parallel, and the synthesizer is a separate subsequent spawn. The single-message-block requirement for parallelism (Section 17) is implied by the structure, though not stated in so many words.

- **Section 14 (Constraint Enforcement) — Hard exclusion semantics are approximated.** The "Out of Scope" section in requirements output and the "unselected differentiators → out of scope" tracking rule act as an informal exclusion list, keeping scope bounded.

- **Section 9 (Requirements Quality) — Atomic, testable requirement format is specified.** The "Good requirements are…" sub-section provides a quality bar with four named criteria and a concrete good/bad example pair.

---

## Issues

### Issue 1: Workflow steps use markdown headers instead of XML `<phase>` tags

**Principle:** Section 16 Action (the phase pattern) — "For complex multi-step tasks, organize into explicit named phases using XML tags."

**What is wrong:** Every step (`## 1. Load Context`, `## 2. Gather Milestone Goals`, etc.) is delimited by a markdown `##` heading. These headings provide visual separation but carry no machine-parseable structural meaning. The model cannot reliably detect phase boundaries, trigger conditions, or completion gates from `##` headers alone. Section 16 explicitly specifies `<phase id="N" name="..." trigger="...">` as the encoding that creates enforceable cognitive boundaries.

**Concrete fix:** Replace each numbered section heading with a tagged phase block. Example:

```xml
<phase id="1" name="Load Context" trigger="on_invocation">
  Parse $ARGUMENTS. Read PROJECT.md, MILESTONES.md, STATE.md.
  Check for MILESTONE-CONTEXT.md.
</phase>

<phase id="2" name="Gather Milestone Goals" trigger="after_phase_1">
  ...
</phase>
```

Add `trigger` attributes where handoff conditions exist (e.g., `trigger="after_plan_approval"` for the roadmap commit phase).

---

### Issue 2: Subagent prompt templates lack `<output_format>` with machine-parseable return contracts

**Principle:** Section 7 Action 1 (output format handling) and Section 22 Pattern 3 — "Output format specified completely and upfront." Also Section 7 (Machine-parsed output specification): "When output is machine-parsed, be explicit and restrictive."

**What is wrong:** The researcher and roadmapper `Task(prompt=...)` blocks instruct agents to write files and return a summary, but the return format is specified only in prose ("Return ROADMAP CREATED with summary"). The roadmapper's return is parsed by the orchestrator (`## ROADMAP BLOCKED` vs `## ROADMAP CREATED`) — this is a machine-parsed verdict — but the exact string format is not locked down with a literal-string requirement. There is no `<output_format>` block in any of the four researcher agent prompts.

**Concrete fix:** Add an `<output_format>` block to each agent prompt. For the roadmapper, enforce the verdict string explicitly:

```xml
<output_format>
End your response with a status line in exactly this format — it is parsed by the caller:

## ROADMAP CREATED
or
## ROADMAP BLOCKED: [one-sentence reason]

Use the literal string above. No markdown bold, no variation. Write all files before returning.
</output_format>
```

For researcher agents, specify: file path, required sections, and a one-line completion signal.

---

### Issue 3: Inline subagent prompts use qualitative quality gates instead of numeric thresholds

**Principle:** Section 14 (Constraint Enforcement — Confidence thresholds) — "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." Also Section 22 Pattern 6.

**What is wrong:** The `<quality_gate>` fields in the researcher prompts use qualitative language: "Versions current (verify with Context7)", "Categories clear, complexity noted", "Integration points identified". These are not verifiable thresholds — they are subjective assessments the agent can satisfy with any output that contains the named elements, regardless of depth or coverage.

**Concrete fix:** Replace qualitative gates with binary or numeric criteria. Example for the Stack researcher:

```xml
<quality_gate>
PASS criteria (all must be true):
1. Every library entry includes a pinned version number verified against Context7
2. At least 1 "why" rationale per library addition (not just what)
3. At least 1 explicit "DO NOT add" entry per new capability area
4. Integration points with the existing stack identified for >80% of new additions
</quality_gate>
```

---

### Issue 4: No `<constraints>` block with explicit permission pairs for any subagent

**Principle:** Section 14 (Constraint Enforcement — Explicit permission pairs) — "Pair every restriction with what IS permitted, stated equally concretely." Also Section 17 and Section 20 (Safety and Trust Patterns).

**What is wrong:** None of the four `Task(prompt=...)` blocks for the researcher or roadmapper agents include a `<constraints>` block. There is no statement of what tools each agent may or may not use, whether it may write files beyond its designated output path, or whether git operations are permitted. The roadmapper is trusted to "write files immediately" with no explicit tool permission boundary, which leaves blast-radius undefined.

**Concrete fix:** Add a `<constraints>` block to each agent prompt:

```xml
<constraints>
  <permitted>
    - Read any file under .planning/
    - Write only to the path specified in <output>
    - Run read-only shell commands (ls, cat, git log, git diff)
  </permitted>
  <reserved_for_human_review>
    - Creating files outside .planning/
    - Running git commit or git push
    - Modifying PROJECT.md or STATE.md directly
  </reserved_for_human_review>
</constraints>
```

---

### Issue 5: `<purpose>` block is not encoded as a `<task>` tag; task instruction does not lead the prompt

**Principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections." Section 8 Action 1 — "Place the task instruction at the very start of the prompt."

**What is wrong:** The workflow opens with a `<purpose>` tag — a non-standard tag not in the guide's XML tag vocabulary (Section 4). The guide specifies `<task>` as the canonical top-level structural tag for the primary instruction. The `<required_reading>` block then intervenes between the purpose and the process, placing supplementary instructions before the primary task. The actual execution steps are buried inside `<process>`, which is also a non-standard tag.

**Concrete fix:** Restructure the top-level document using canonical tags from Section 4:

```xml
<task>
Start a new milestone cycle for an existing project. Load project context, gather milestone
goals, update PROJECT.md and STATE.md, optionally run parallel research, define scoped
requirements with REQ-IDs, spawn the roadmapper to create a phased execution plan, and
commit all artifacts.
</task>

<context>
Read all files referenced by the invoking prompt's execution_context before starting.
</context>
```

Place `<available_agent_types>` inside `<context>` as supplementary information. Keep `<process>` if desired for internal organization, but wrap it under `<task>` or replace section headers with `<phase>` tags per Issue 1.

---

### Issue 6: No `<audience>` or `<quality_bar>` specified for requirements-gathering output

**Principle:** Section 1 Action 2 — "Identify the audience. Encode the audience explicitly in the prompt." Section 1 Action 1c — "What a correct or high-quality response looks like."

**What is wrong:** The workflow specifies requirement quality criteria for the REQUIREMENTS.md artifact but does not encode the audience for the milestone initialization process itself. The workflow is consumed by Claude Code agents, not by humans directly — but this is never stated. A model running this workflow has no explicit signal about whether its conversational outputs should be terse (for a subagent caller) or detailed (for a human developer). The `<success_criteria>` block partially fills the quality-bar role but only for artifact completion, not for conversational interaction quality.

**Concrete fix:** Add an `<audience>` block near the top:

```xml
<audience>
The developer initiating a new milestone cycle. They have project context but want to move
efficiently. Conversational outputs should be direct and scannable. Status banners (━━━ GSD ►)
are appropriate. Avoid verbose explanations — the developer can read ROADMAP.md for detail.
</audience>

<quality_bar>
The workflow is complete when: all listed artifacts exist, all commits are made, and the
developer knows exactly which command to run next. Incomplete artifact sets or missing next-step
guidance are failures regardless of process compliance.
</quality_bar>
```

---

### Issue 7: Negative instruction present — "Do not fall back to 'general-purpose'"

**Principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**What is wrong:** The `<available_agent_types>` block contains: "use exact names — do not fall back to 'general-purpose'". This is a negated primary directive, which the guide requires be rewritten as a positive constraint.

**Concrete fix:**

```
Valid GSD subagent types — use only these exact names:
- gsd-project-researcher
- gsd-research-synthesizer
- gsd-roadmapper
```

The positive framing ("use only these exact names") is equally directive without the negation.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `new-milestone.md` as a whole workflow document.

| Category | Checklist Item | Score |
|---|---|---|
| **Task Specification** | Intent, audience, and quality bar are all explicit | FAIL — audience and quality_bar absent (see Issue 6) |
| | All constraints are compatible — no conflicts between scope, length, or depth | PASS |
| **Chain of Thought** | CoT included only for math/symbolic/multi-step logic tasks | N/A — no CoT trigger used; workflow is procedural |
| | CoT trigger used correctly | N/A |
| | Reasoning elicited before answer | N/A |
| | CoT traces treated as heuristic | N/A |
| **Few-Shot Examples** | Examples selected by semantic similarity | N/A — no few-shot examples in this workflow |
| | 2–5 examples total | N/A |
| | Ordered simple → complex | N/A |
| | Examples span diverse sub-types | N/A |
| | Format consistent across examples | N/A |
| | Example order fixed across evaluation runs | N/A |
| **Formatting** | Instruction complete and clear before formatting applied | PASS |
| | Prompt sections separated by semantically named XML tags | FAIL — `##` markdown headings used for main sections; non-standard tags (`<purpose>`, `<process>`) used (see Issue 5) |
| | At least 3 format variants will be tested on target model | N/A — operational workflow, not a prompt under optimization |
| **Instruction Framing** | All negative instructions converted to positive equivalents | FAIL — "do not fall back to 'general-purpose'" (see Issue 7) |
| | Priority order explicit when multiple criteria apply | PASS — `--reset-phase-numbers` priority and research_enabled logic are ordered |
| | Tie-breaking rules match domain's cost asymmetry | N/A — no tie-breaking ambiguity identified |
| **Persona** | Persona included only for open-ended or stylistic tasks | N/A — no persona assigned at workflow level |
| | Persona specific (constrains voice/register) | N/A |
| | Persona descriptor gender-neutral | N/A |
| **Output Format** | Structured output uses two-step reasoning-then-format approach | N/A |
| | Single-call JSON places reasoning fields before answer fields | N/A |
| | Constrained decoding adopted only after free-form proven insufficient | N/A |
| | Machine-parsed output uses exact format specification | FAIL — roadmapper return strings not locked to literal format (see Issue 2) |
| **Context Placement** | Task instruction at start of prompt | FAIL — `<purpose>` is not `<task>`; `<required_reading>` interrupts before process (see Issue 5) |
| | Primary document or input at end of prompt | PASS — `<success_criteria>` closes the document |
| | Background context in the middle | PASS — `<available_agent_types>` and `<required_reading>` are mid-document |
| | All irrelevant context removed | PASS — no obvious padding |
| | Time-sensitive injected context labeled as snapshot | N/A — no injected runtime context in this workflow |
| **Self-Consistency** | Self-consistency applied only to tasks with a single correct answer | N/A |
| | Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | Redundant instructions removed | PASS — no obvious duplication |
| | Long prompts compressed before sending | N/A |
| | RAG context is extracted relevant passage only | N/A |
| **System/User Split** | Persistent instructions in system prompt | N/A — file is a workflow, not a system prompt |
| | Task-specific instructions in user prompt | N/A |
| | Each instruction appears in exactly one location | PASS |
| | Safety-critical constraints have external validation | N/A |
| **Agent/Subagent** | Agent prompts are fully self-contained | PARTIAL — researcher/roadmapper prompts inject `${AGENT_SKILLS_*}` variables (correct) but lack `<constraints>` blocks (see Issue 4) |
| | All file paths in agent output are absolute | FAIL — output paths in researcher prompts use relative paths (`.planning/research/{FILE}`) |
| | Parallel agents launched in a single message block | PASS — Step 8 instructs 4 researchers to be spawned in parallel |
| | Adversarial probes specified for verification agents | N/A — no verification agent in this workflow |
| **Structural Architecture** | Large prompts decomposed into atomic, single-responsibility modules | PASS — workflow delegates to specialized subagents per concern |
| | Template variables use `${VARIABLE_NAME}` syntax with fallback where appropriate | PASS — syntax is correct throughout; fallbacks not required for mandatory vars |
| | Modules compose at runtime via variable substitution, not copy-paste | PASS |
| **Constraint Enforcement** | Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block in any subagent prompt (see Issue 4) |
| | Hard exclusion lists enumerated, not described qualitatively | PASS — "Out of Scope" tracking in requirements step is explicit |
| | Known edge cases have precedent-style rulings | PASS — `--reset-phase-numbers` edge case is fully handled |
| | Confidence thresholds are numeric, not qualitative | FAIL — quality gates in researcher prompts are qualitative (see Issue 3) |
| **Decision Frameworks** | Multi-option recommendations use explicit decision tree or comparison table | PASS — research decision uses AskUserQuestion with explicit branches; dimension table for researchers |
| | Criteria checklists gate complex approaches | PASS — requirements quality criteria block |
| | Action permissions framed around reversibility | N/A — workflow does not classify actions by reversibility |
| **Multi-Phase Workflows** | Complex tasks organized into explicit named phases | FAIL — markdown `##` headings used instead of `<phase>` tags (see Issue 1) |
| | Required steps distinguished from type-specific steps | PARTIAL — research is flagged as optional, but within-step required vs. optional substeps are not tagged |
| | Scenario-based branching handles multiple paths explicitly | PASS — MILESTONE-CONTEXT.md present/absent, research yes/no, roadmap approve/adjust/review are all explicit branches |
| **Memory and Continuity** | Memory templates use XML tags as section labels | N/A — no memory template in this workflow |
| | Compaction summaries include discoveries and failed approaches | N/A |
| | Next steps tied to user's most recent explicit request | PASS — Step 11 "Done" banner gives precise next command |
| **Modularity** | Each prompt component has single responsibility | PASS — researcher/synthesizer/roadmapper are separate agents |
| | Scope boundaries state both inclusions and exclusions | PARTIAL — requirements step has both; workflow-level scope has only inclusions |
| **Safety and Trust** | Validation at system boundaries only; internal interfaces trusted | N/A |
| | Dual-use capabilities state permissions before restrictions | N/A |
| | Authorization narrow-scoped; each action confirmed before expanding scope | PASS — roadmap approval gate before commit |
| **Tone and Style** | Size constraints use numeric limits, not qualitative descriptors | FAIL — researcher quality gates are qualitative (see Issue 3) |
| | Instructions use imperative present tense | PASS — "Read", "Parse", "Spawn", "Write", "Commit" throughout |
| | Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | Prompt flagged as draft for automated optimization | N/A — operational workflow, not a candidate for automated optimization |
| | Correct optimizer selected | N/A |
| | Held-out test set reserved before optimization | N/A |

**Summary score:** 17 PASS, 9 FAIL, 5 PARTIAL, 24 N/A (out of 55 applicable items)

---

## Recommendations

Prioritized from highest to lowest impact.

### 1. Replace markdown `##` step headers with `<phase>` tags (Issue 1 — Section 16)

This is the highest-leverage structural change. The guide's phase pattern gives the model enforceable cognitive boundaries, trigger conditions, and completion semantics. Converting the eleven `##` headings to `<phase id="N" name="..." trigger="...">` tags costs minimal effort and immediately improves execution reliability for complex, multi-turn workflows. Start with the three highest-risk phase transitions: Load Context → Gather Goals, Define Requirements → Create Roadmap, and Roadmap Approval → Commit.

### 2. Add `<output_format>` with literal-string verdict contracts to all subagent prompts (Issue 2 — Section 7)

The roadmapper's `## ROADMAP CREATED` / `## ROADMAP BLOCKED` return strings are already being machine-parsed by the orchestrator. Without an explicit format lock, any model variation in whitespace, capitalization, or markdown decoration will silently break the parse. Locking these to literal strings (as shown in the fix above) eliminates an entire class of silent failures. Extend this to researcher agents with a one-line completion signal per agent.

### 3. Add `<constraints>` blocks with explicit permission pairs to all subagent prompts (Issue 4 — Section 14)

Researcher and roadmapper agents currently have undefined blast radius. A researcher that writes to a path outside `.planning/research/` or a roadmapper that modifies STATE.md directly (rather than through the expected flow) will produce silent inconsistencies. Adding a `<permitted>` / `<reserved_for_human_review>` pair to each agent prompt takes four short additions and makes permission scope auditable at a glance.

### 4. Replace qualitative quality gates with binary/numeric criteria in researcher prompts (Issue 3 — Section 14 and Section 22 Pattern 6)

The four `<quality_gate>` fields currently describe desirable properties ("categories clear", "complexity noted") rather than verifiable conditions. Rewriting each as a numbered list of binary PASS criteria (as shown in the fix above) makes agent self-assessment calibratable and makes the orchestrator's decision to accept or re-spawn deterministic.

### 5. Add `<audience>` and `<quality_bar>` to the top-level document, and convert `<purpose>` to `<task>` (Issues 5 and 6 — Sections 1, 4, 8)

These three changes together close the task-specification gap. Converting `<purpose>` to `<task>` aligns with the guide's canonical tag vocabulary and ensures the task instruction leads the prompt (Section 8 Action 1). Adding `<audience>` and `<quality_bar>` completes the three task components required by Section 1 Action 1. All three changes are additive and non-breaking.
