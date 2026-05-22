# Critique: audit-milestone.md

## Summary

`audit-milestone.md` is a well-structured, operationally mature workflow with strong procedural depth — its 7-step process, 3-source cross-reference matrix, YAML output schema, and FAIL-gate logic demonstrate careful engineering. However, it falls short of several prompt engineering fundamentals: the `<purpose>` block omits an explicit audience and quality bar (Section 1), structural tags are inconsistently applied (plain markdown headers inside `<process>` instead of `<phase>` tags from Section 16), constraint enforcement lacks paired permissions (Section 14), negative instructions appear without positive reframes (Section 5), and the output block mixes machine-parsed YAML with free-form prose without isolation or a literal-string specification (Section 7). The workflow is production-capable but would benefit from tightening these gaps to reduce model interpretation variance and improve maintainability.

---

## Strengths

- **Section 16 — Multi-phase sequencing:** The 7-step process creates clear cognitive boundaries (initialize → scope → read → spawn → collect → coverage → aggregate → present), matching the phase-pattern intent even though formal `<phase>` tags are not used.
- **Section 15 — Decision frameworks and status matrices:** The 3-source cross-reference matrix (Step 5d) and orphan detection logic (Step 5e) are excellent explicit decision tables that eliminate model guessing at the critical PASS/FAIL boundary.
- **Section 14 — Confidence thresholds and precedents:** The FAIL gate ("any unsatisfied requirement MUST force `gaps_found`") and status determination matrix function as structured precedent-style rulings that resolve known edge cases with named outcomes.
- **Section 16 — Scenario-based branching:** The `<offer_next>` block correctly branches on three status values (passed / gaps_found / tech_debt) with distinct, actionable next steps per branch.
- **Section 7 — Machine-parsed output:** The YAML frontmatter schema in Step 6 embeds instructions in schema values (e.g., `gaps.requirements[].status: "unsatisfied | partial | orphaned"`), consistent with the guide's embedded-schema pattern.
- **Section 13 — Template variable injection:** `${AGENT_SKILLS_CHECKER}`, `${PROJECT_CODE}`, and `${PROJECT_TITLE}` follow the correct `${VARIABLE_NAME}` syntax.
- **Section 17 — Subagent configuration:** `subagent_type="gsd-integration-checker"` and `model="{integration_checker_model}"` are correct self-contained agent spawn patterns.

---

## Issues

### Issue 1 — Missing audience and quality bar in task specification

**Principle:** Section 1 Action 1 and Action 2 require explicit extraction of (a) what output is requested, (b) why it matters / how it will be used, and (c) what a correct response looks like. Section 1 Action 2 requires the audience to be encoded explicitly.

**What's missing:** The `<purpose>` block states the what ("verify milestone achieved its definition of done") but omits the audience (who runs this — an orchestrating agent, a human operator, a CI pipeline?) and the quality bar (what distinguishes a good audit from an acceptable one — e.g., "gaps report is actionable, not just descriptive"). Without the audience, the model cannot calibrate output vocabulary or depth. Without the quality bar, it cannot self-assess before finalizing.

**Fix:** Expand `<purpose>` to include audience and quality bar:

```xml
<purpose>
Verify milestone achieved its definition of done by aggregating phase verifications,
checking cross-phase integration, and assessing requirements coverage.

<audience>
The orchestrating agent or milestone owner reviewing release readiness. Assumes familiarity
with GSD phase structure and REQUIREMENTS.md traceability conventions.
</audience>

<quality_bar>
A high-quality audit produces: (1) a precise per-REQ-ID status using the 3-source matrix,
(2) a FAIL gate that blocks milestone completion on any unsatisfied requirement,
(3) an actionable next-step routed to the correct follow-on workflow.
</quality_bar>
</purpose>
```

---

### Issue 2 — Structural tags absent inside `<process>` — markdown headers used instead

**Principle:** Section 4 Action 2 requires wrapping each distinct section in semantically named XML tags. Section 16 requires multi-phase workflows to use `<phase id="N" name="...">` tags to create cognitive boundaries.

**What's missing:** The `<process>` block uses `## 0.`, `## 1.` … `## 7.` markdown headers inside an XML tag. This is a hybrid format that loses the machine-readability benefit of XML and doesn't exploit phase-level attributes (`id`, `name`, `trigger`). The guide explicitly notes XML tags give richer signal than delimiters alone.

**Fix:** Replace markdown headers within `<process>` with `<phase>` tags:

```xml
<process>
  <phase id="0" name="Initialize Milestone Context">
    ...
  </phase>

  <phase id="1" name="Determine Milestone Scope">
    ...
  </phase>

  <phase id="2" name="Read All Phase Verifications">
    ...
  </phase>

  <phase id="3" name="Spawn Integration Checker" trigger="after_phase_2">
    ...
  </phase>

  <phase id="4" name="Collect Results">
    ...
  </phase>

  <phase id="5" name="Check Requirements Coverage">
    ...
  </phase>

  <phase id="5.5" name="Nyquist Compliance Discovery">
    ...
  </phase>

  <phase id="6" name="Aggregate into MILESTONE-AUDIT.md">
    ...
  </phase>

  <phase id="7" name="Present Results">
    ...
  </phase>
</process>
```

---

### Issue 3 — Constraint enforcement lacks paired permissions

**Principle:** Section 14 requires every restriction to be paired with what IS permitted, stated equally concretely. Section 14 also recommends `<constraints>` with `<permitted>` and `<reserved_for_human_review>` sub-tags.

**What's missing:** The workflow imposes implicit constraints (the agent reads files, spawns subagents, writes to `.planning/`) but never declares permissions explicitly. There is no `<constraints>` block. A model with conservative defaults may stall or seek confirmation before writing the MILESTONE-AUDIT.md or spawning the integration checker.

**Fix:** Add an explicit `<constraints>` block after `<purpose>`:

```xml
<constraints>
  <permitted>
    - Read any file in the repository (VERIFICATION.md, SUMMARY.md, REQUIREMENTS.md, ROADMAP.md)
    - Run read-only shell commands: find, cat, gsd-sdk query
    - Write the v{version}-MILESTONE-AUDIT.md to .planning/
    - Spawn the gsd-integration-checker subagent
  </permitted>

  <reserved_for_human_review>
    - Modifying REQUIREMENTS.md checkbox state (flag for update; do not auto-edit)
    - Triggering /gsd-validate-phase or /gsd-plan-milestone-gaps (suggest only)
    - Completing or archiving the milestone
  </reserved_for_human_review>
</constraints>
```

---

### Issue 4 — Negative instructions not converted to positive equivalents

**Principle:** Section 5 Action 1 requires scanning for negated instructions and rewriting each as a positive specification. The conversion table in Section 5 shows the mechanical pattern.

**What's missing:** The workflow contains at least two negated directives:
- "Skip if `workflow.nyquist_validation` is explicitly `false`" (valid conditional, but the surrounding prose relies on implied negative reasoning)
- "never auto-calls `/gsd-validate-phase`" (Step 5.5, last line)

The phrase "never auto-calls" is a pure negative. Per the guide, this should be rewritten to specify what the agent does instead.

**Fix — apply conversion table mechanically:**

```
"never auto-calls /gsd-validate-phase"
→ "Report validation gaps and suggest the /gsd-validate-phase command; wait for user action."
```

---

### Issue 5 — Machine-parsed output block lacks literal-string isolation

**Principle:** Section 7 (Machine-parsed output specification) requires that when output is machine-parsed, the format be exact and restrictive, with literal string requirements clearly isolated. Section 22 Pattern 3 requires output format specified completely and upfront.

**What's missing:** Step 6 specifies a YAML frontmatter schema but does not isolate it from the surrounding prose or state which fields are machine-parsed vs. human-readable narrative. The `status` field (`passed | gaps_found | tech_debt`) is the machine-parsed key that drives routing in `<offer_next>`, but it is buried inside a multi-hundred-word code block without a literal-string requirement or isolation directive.

**Fix:** Add an `<output_format>` block before `<process>` that isolates the machine-critical field:

```xml
<output_format>
The MILESTONE-AUDIT.md MUST begin with a YAML frontmatter block. The `status` field is
machine-parsed by the calling workflow. Use exactly one of these literal strings — no
markdown formatting, no punctuation variation:

  status: passed
  status: gaps_found
  status: tech_debt

The remainder of the file is a human-readable markdown report. Structure it with the
tables specified in Step 6. Output format is complete and final — do not append
exploratory reasoning below the report.
</output_format>
```

---

### Issue 6 — No explicit priority order when multiple gap types conflict

**Principle:** Section 5 (Instruction Framing) and Section 22 Pattern 4 require explicit tie-breaking rules when signals conflict. The tie-breaking rule must match the domain's cost asymmetry.

**What's missing:** The workflow defines three status values but provides no tie-breaking rule for when a milestone has both unsatisfied requirements (→ `gaps_found`) and no critical integration gaps (→ `tech_debt`). The status determination matrix only addresses per-requirement status, not the milestone-level rollup when mixed signals are present. A model in an ambiguous state may resolve this differently across runs.

**Fix:** Add a `<priority_order>` block inside `<process>` at the milestone-status rollup point (Step 6):

```xml
<priority_order>
  When determining milestone-level status, apply this precedence:
  1. Any unsatisfied or orphaned requirement → status: gaps_found (FAIL gate, no exceptions)
  2. Any critical integration gap (broken E2E flow) → status: gaps_found
  3. No critical gaps, but accumulated tech debt items → status: tech_debt
  4. All requirements satisfied, no gaps, no debt → status: passed

  Assign the highest-priority matching status. Never average or blend statuses.
</priority_order>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items are N/A where the workflow type genuinely does not apply (e.g., few-shot examples, self-consistency, RAG compression).

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL | Intent present; audience and quality bar absent (Issue 1) |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS | No conflicting constraints identified |

### Chain of Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A | No CoT trigger used; the workflow is procedural, not reasoning-elicitation |
| CoT trigger used: "Take a deep breath..." | N/A | Not applicable |
| Reasoning is elicited before the answer, not after | N/A | Not applicable |
| CoT traces treated as heuristic aids | N/A | Not applicable |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format is consistent across all examples | N/A | |
| Example order is fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction is complete and clear before formatting applied | PASS | Purpose block leads; process follows |
| Prompt sections separated by semantically named XML tags | PARTIAL | Top-level tags present (`<purpose>`, `<process>`, `<offer_next>`, `<success_criteria>`); inner sections use markdown headers instead of `<phase>` tags (Issue 2) |
| At least 3 format variants tested on target model | N/A | Workflow file, not a single-call prompt |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| All negative instructions converted to positive equivalents | FAIL | "never auto-calls /gsd-validate-phase" not converted (Issue 4) |
| Priority order is explicit when multiple criteria apply | FAIL | No priority order for milestone-level status rollup (Issue 6) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for mixed-status scenarios (Issue 6) |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | PASS | No persona assigned; audit task is procedural — correct omission |
| Persona is specific (constrains voice/register), not generic | N/A | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona present |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use a two-step reasoning-then-format approach | N/A | Output is a file write, not a single-call response |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form + post-processing insufficient | N/A | |
| Machine-parsed output uses exact format specification with literal string requirements | FAIL | `status` field is machine-parsed but lacks literal-string isolation (Issue 5) |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction is at the start of the prompt | PASS | `<purpose>` leads |
| Primary document or input is at the end of the prompt | PASS | `<success_criteria>` closes the file |
| Background context is in the middle | PASS | `<available_agent_types>` and `<process>` are in the middle |
| All irrelevant context has been removed | PASS | No obvious filler |
| Time-sensitive injected context is labeled as a snapshot | N/A | No snapshot injection in this file |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with a single correct answer | N/A | Not applicable to this workflow type |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| Long prompts compressed before sending | N/A | Not a single-call prompt |
| RAG context is extracted relevant passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow file; not a system/user split context |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicate instructions observed |
| Safety-critical constraints have external validation | N/A | External validation is handled by the GSD SDK layer |

### Agent / Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PARTIAL | Integration checker prompt is constructed inline but relies on interpolated variables that may not all resolve cleanly without the SDK context |
| All file paths in agent output are absolute | N/A | Paths are constructed by SDK at runtime |
| Parallel agents launched in a single message block | PASS | Single `Task(...)` call; only one subagent spawned |
| Adversarial probes specified for verification agents | N/A | Integration checker is not an adversarial verifier |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Workflow is one file handling one concern (milestone audit) |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PARTIAL | `${AGENT_SKILLS_CHECKER}`, `${PROJECT_CODE}`, `${PROJECT_TITLE}` correct; no fallback syntax for optional variables |
| Modules compose at runtime via variable substitution, not copy-paste | PASS | `${AGENT_SKILLS_CHECKER}` is substituted at runtime |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction is paired with an equally concrete permission | FAIL | No `<constraints>` block; permissions are entirely implicit (Issue 3) |
| Hard exclusion lists are enumerated, not described qualitatively | N/A | No filtering task requiring exclusion lists |
| Known edge cases have precedent-style rulings | PASS | FAIL gate and orphan detection serve this role |
| Confidence thresholds are numeric, not qualitative | N/A | Binary pass/fail outcomes; no confidence scoring required |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use an explicit decision tree or comparison table | PASS | Status determination matrix and offer_next branching are well-structured |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` is a gating checklist |
| Action permissions framed around reversibility | FAIL | No reversibility framing; no `<take_freely>` / `<confirm_with_user>` distinction |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | FAIL | Steps numbered in markdown, not wrapped in `<phase>` XML tags (Issue 2) |
| Required steps distinguished from type-specific steps | PARTIAL | FAIL gates are distinguished but there is no `<required_steps universal="true">` tag |
| Scenario-based branching handles multiple paths explicitly | PASS | `<offer_next>` branches on all three status values |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | N/A | No memory template in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | `<offer_next>` routes next steps based on audit outcome, not generic suggestions |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | PASS | Workflow handles audit only; does not bleed into gap-fixing |
| Scope boundaries state both inclusions and exclusions | PARTIAL | `<available_agent_types>` narrows subagent scope but there is no explicit `<scope><include>/<exclude>` block |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | Reads phase files without redundant validation; validates at the FAIL gate boundary |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capability |
| Authorization narrow-scoped; each action confirmed before expanding scope | FAIL | No explicit authorization scoping; file write and subagent spawn are assumed authorized (Issue 3) |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | PASS | Score fields (`N/M`) and explicit table structures are quantitative |
| Instructions use imperative present tense | PASS | "Read all files", "Extract from init JSON", "Spawn Integration Checker" — consistently imperative |
| Working notes are in analysis tags, not user-facing output | N/A | Not a response-generation prompt |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as a draft for automated optimization | FAIL | No optimization flag or draft marker |
| Correct optimizer selected (MIPROv2 for pipelines, OPRO for single prompts) | N/A | Not yet at optimization stage |
| Held-out test set reserved before optimization begins | N/A | |

---

## Recommendations

Prioritized by impact on model reliability and interpretive variance:

### 1. Add `<output_format>` with literal-string isolation for the machine-parsed `status` field (Issue 5 — Section 7)

The `status` field drives downstream workflow routing (`<offer_next>`). Any variation in how the model emits this value (e.g., `"gaps found"`, `"GAPS_FOUND"`, `gaps_found: true`) silently breaks routing. Add an `<output_format>` block before `<process>` that specifies the exact literal strings and forbids formatting variation. This is the highest-leverage fix because it prevents silent failures in the happy path.

### 2. Add a `<constraints>` block with explicit `<permitted>` and `<reserved_for_human_review>` (Issue 3 — Section 14)

The workflow writes files, spawns agents, and operates in a project directory without stating what it is authorized to do. Adding paired permissions removes the risk of a conservative model stalling on file writes or seeking unnecessary confirmation for the subagent spawn. This also makes the audit scope auditable by a human reviewer in one place.

### 3. Add explicit audience, quality bar, and priority-order tie-breaking (Issues 1 and 6 — Section 1 Action 1-2, Section 5)

Expand `<purpose>` with `<audience>` and `<quality_bar>`, and add a `<priority_order>` block at the status rollup step. These two additions together close the most common source of inconsistency in audit workflows: the model not knowing who the output is for or how to resolve a mixed-status milestone (e.g., all requirements satisfied but one integration gap).

### 4. Replace markdown headers inside `<process>` with `<phase>` XML tags (Issue 2 — Section 4 Action 2, Section 16)

Switching the seven numbered steps to `<phase id="N" name="...">` tags adds machine-readability, enables `trigger` attributes for conditional phase activation, and aligns with the guide's explicit XML vocabulary. This is a structural improvement that pays dividends if the workflow is ever parsed, composed, or conditionally rendered by an orchestrator.

### 5. Convert "never auto-calls" to a positive instruction and add reversibility framing (Issue 4 — Section 5 Action 1, Section 15)

Rewrite the single negative directive as a positive action and add `<take_freely>` / `<confirm_with_user>` groupings for the file write vs. follow-on workflow actions. This is the lowest-effort fix (one line rewritten) but keeps the workflow consistent with the guide's constraint framing pattern and prevents a model trained on negative-instruction avoidance from misinterpreting the intent.
