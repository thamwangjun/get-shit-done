# Critique: discuss-phase-assumptions.md

## Summary

`discuss-phase-assumptions.md` is a well-structured, sophisticated workflow that correctly applies many advanced prompt engineering patterns: explicit named phases with XML `<step>` tags, conditional branching via `--auto` flag, a purpose-narrowing persona opening, downstream-awareness framing, and a concrete success criteria block. Where the workflow falls short is in its formatting layer — it relies on prose-heavy narrative steps and inconsistent delimiter styles rather than the semantic XML tag vocabulary prescribed in the guide, uses several negative framings that should be inverted, lacks an explicit `<output_format>` block, and does not specify a persona with enumerated strengths. The most impactful fixes are structural: wrap prompt sections in semantically named XML tags, convert negative instructions to positive equivalents, and add an explicit output format specification. These changes would bring the workflow into full alignment with the guide without altering its already-sound logic.

---

## Strengths

- **Section 16 — Multi-Phase Workflows (Phase Pattern):** Steps are organized as explicit named `<step>` elements with `name` and `priority` attributes, creating clean cognitive boundaries. The model is directed to complete each step fully before advancing.

- **Section 16 — Scenario-Based Branching:** The `check_existing` and `present_assumptions` steps enumerate discrete conditional branches with explicit outcomes for each path, rather than leaving the model to infer behavior.

- **Section 16 — Round-Based Interviews:** The correction flow (`correct_assumptions`) limits interaction to one focused question per selected correction, directly applying the "stop once you have enough" principle.

- **Section 19 — Modularity:** The workflow delegates deep codebase analysis to a dedicated `gsd-assumptions-analyzer` subagent, preserving separation of concerns and protecting the main context window's token budget.

- **Section 17 — Self-Contained Agent Prompts:** The `Task()` call in `deep_codebase_analysis` passes all required context inline — phase goal, prior decisions, codebase hints, calibration tier — without relying on context inheritance from the parent.

- **Section 14 — Constraint Enforcement (Scope Guardrail):** The `<scope_guardrail>` block pairs the restriction ("no scope creep") with a concrete positive action ("capture in Deferred Ideas") and provides a verbatim redirect phrase, matching the explicit-permission-pairs pattern.

- **Section 1 — Downstream Awareness:** The `<downstream_awareness>` block explicitly names downstream consumers (gsd-phase-researcher, gsd-planner) and states what each reads, giving the model a clear quality bar for what "captured clearly enough" means.

- **Section 18 — Memory and Continuity:** The `write_context` step maps every assumption type to a specific CONTEXT.md section, preventing the model from choosing its own structure.

- **Section 13 — Template Variable Injection:** The workflow uses `${VARIABLE_NAME}` syntax throughout and includes `${AGENT_SKILLS_ANALYZER}` as a runtime-injected capability block.

- **Section 21 — Active Voice for Commands:** Step instructions are predominantly written in imperative present tense ("Read project-level files", "Spawn a subagent", "Write file").

---

## Issues

### Issue 1 — Missing semantic XML tag wrapping for top-level prompt sections
**Principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections. When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag."

**What's wrong:** The workflow's top-level prompt sections — `<purpose>`, `<available_agent_types>`, `<downstream_awareness>`, `<philosophy>`, `<scope_guardrail>`, `<answer_validation>`, `<process>`, `<success_criteria>` — use a mixture of custom tags that do not align with the guide's canonical XML vocabulary (`<task>`, `<persona>`, `<context>`, `<constraints>`, `<output_format>`, `<quality_bar>`). A consuming model receiving this as a system prompt gets less semantic signal than it would from the standard vocabulary. `<purpose>` is doing the work of `<task>`. `<philosophy>` and `<downstream_awareness>` are background context that belongs in `<context>`. `<scope_guardrail>` and `<answer_validation>` are behavioral constraints that belong in `<constraints>`.

**Fix:** Remap top-level sections to the canonical vocabulary:
```xml
<task>
{What the model must do — extracted from <purpose>}
</task>

<context>
{<downstream_awareness> content}
{<philosophy> content}
</context>

<constraints>
{<scope_guardrail> content}
{<answer_validation> content}
</constraints>

<quality_bar>
{<success_criteria> content}
</quality_bar>
```
Retain `<process>` as a workflow-specific container since no canonical equivalent exists, but nest it inside `<task>` or after it.

---

### Issue 2 — No `<output_format>` block; output structure is implicit
**Principle:** Section 7 Action 1 / Section 22 Pattern 3 — "Output format specified completely and upfront. State the required output structure, field names, ordering, and an example before the model begins its task."

**What's wrong:** The workflow specifies the CONTEXT.md output format only inside `write_context`, buried midway through the process. There is no top-level `<output_format>` block declaring what the workflow produces — a CONTEXT.md file at a specific path in a specific 6-section structure — before steps begin. The `confirm_creation` display format is also described only in prose, not as a literal template. A model encountering this workflow must read all the way to step 6 before knowing what it is producing.

**Fix:** Add an `<output_format>` block immediately after `<task>`:
```xml
<output_format>
This workflow produces two files per phase:

1. `${phase_dir}/${padded_phase}-CONTEXT.md` — the primary output
   Sections (in order): <domain>, <decisions>, <canonical_refs>, <code_context>, <specifics>, <deferred>

2. `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md` — audit trail
   Not used as agent input. Records assumptions presented, corrections made, research performed.

Both files are committed via gsd-sdk query commit.
</output_format>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**What's wrong:** Several instructions are framed as negatives when they could be rewritten as positive behaviors:

| Location | Negative form | Should be |
|---|---|---|
| `<philosophy>` | "not an interviewer" | "You are a thinking partner who analyzes before asking" |
| `<philosophy>` | "not to answer questions you could figure out" | "Ask only about what codebase analysis cannot determine" |
| `<scope_guardrail>` | "CRITICAL: No scope creep." | "Keep all discussion within the phase boundary defined in ROADMAP.md." |
| `<success_criteria>` | "no re-asking decided questions" | "Prior context is loaded and respected throughout." |

The reframe pattern ("Your job is NOT X — it's Y") is valid per Section 6 Persona Assignment, but `<philosophy>` uses it without the persona framing, which weakens its effect. The scope_guardrail heading "CRITICAL: No scope creep" is a pure negative with no positive specification alongside it.

**Fix:** Apply the conversion table mechanically:
```
"not an interviewer" → "You are a codebase-first analyst. Analyze before asking."
"CRITICAL: No scope creep." → "Scope is fixed to the phase boundary in ROADMAP.md. Keep all discussion within it."
"no re-asking decided questions" → "All prior decisions are loaded and applied. Treat them as locked."
```

---

### Issue 4 — No explicit persona with enumerated strengths
**Principle:** Section 6 Action 2 + Strengths Listing pattern — "Make personas specific, not generic. Explicitly enumerate what the agent is good at."

**What's wrong:** The `<purpose>` block opens with a task description ("Extract implementation decisions…") but never assigns a specific role identity. The workflow uses the phrase "You are a thinking partner, not an interviewer" — this is role framing without a persona block. There are no enumerated strengths, which the guide identifies as biasing the model toward the desired capabilities.

**Fix:** Add a `<persona>` block:
```xml
<persona>
You are a codebase-first implementation analyst.

Your strengths:
- Reading and interpreting existing source code to form confident opinions
- Surfacing implementation assumptions with evidence (file paths, patterns found)
- Distinguishing locked prior decisions from genuinely open questions
- Minimizing user interactions by resolving ambiguity through analysis, not questioning
</persona>
```

---

### Issue 5 — Subagent output format in `deep_codebase_analysis` uses markdown headers, not XML tags
**Principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections" / Section 7 — output format specification.

**What's wrong:** The `Task()` prompt passed to the `gsd-assumptions-analyzer` subagent specifies its output using markdown `##` headers and a prose template:
```
## Assumptions
### [Area Name]
- **Assumption:** ...
```
This format is not machine-parseable in a structured way and relies on the model inferring section boundaries from markdown heading levels. The guide explicitly states XML tags are "strictly better than markdown headers" for Claude-class models.

**Fix:** Specify the subagent output in XML:
```xml
<output_format>
Return your findings in this exact structure:

<assumptions>
  <area name="[Area Name]">
    <item>
      <statement>[Decision statement]</statement>
      <evidence>[File paths cited]</evidence>
      <consequence>[Concrete consequence if wrong]</consequence>
      <confidence>Confident | Likely | Unclear</confidence>
    </item>
  </area>
</assumptions>

<needs_research>
  <topic>[Topic where codebase is insufficient]</topic>
</needs_research>
</output_format>
```
This makes `assumptions[]` and `needs_research[]` trivially parseable from the subagent's response.

---

### Issue 6 — `present_assumptions` display format uses prose template without fixed structure
**Principle:** Section 22 Pattern 3 — "Output format specified completely and upfront" / Section 21 — "Size constraints use numeric limits, not qualitative descriptors."

**What's wrong:** The `present_assumptions` step shows a display format template but does not specify: maximum number of areas, maximum length of each assumption statement, or how confidence badges should be rendered (the template shows `{Confidence badge}` as a placeholder with no definition). The model must invent the badge rendering.

**Fix:** Define the badge vocabulary and numeric limits:
```
Confidence badges: ✓ Confident | ~ Likely | ? Unclear
Maximum areas: 5
Maximum assumption statement length: 1 sentence (under 20 words)
Evidence citation: file path only, no prose description
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (e.g., self-consistency, RAG compression, constrained decoding).

### Task Specification
| Item | Score |
|---|---|
| Intent, audience, and quality bar are all explicit | FAIL — quality bar is present (`<success_criteria>`), intent is present (`<purpose>`), but audience is never stated explicitly |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain-of-Thought
| Item | Score |
|---|---|
| CoT included only for math/symbolic/multi-step logic tasks | N/A — this is an orchestration workflow, not a reasoning task |
| CoT trigger used if applicable | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|---|---|
| Examples selected by semantic similarity | N/A — no few-shot examples present |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|---|---|
| Instruction complete and clear before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | FAIL — custom tag names used; do not map to guide's canonical vocabulary |
| At least 3 format variants will be tested | FAIL — no evidence of format variant testing |

### Instruction Framing
| Item | Score |
|---|---|
| All negative instructions converted to positive equivalents | FAIL — "not an interviewer", "No scope creep", "no re-asking" are negatives |
| Priority order explicit when multiple criteria apply | PASS — `deep_codebase_analysis` calibration tier has explicit priority ordering |
| Tie-breaking rules match domain's cost asymmetry | PASS — `--auto` flag resolves unclear assumptions with "recommended defaults", biased toward action |

### Persona
| Item | Score |
|---|---|
| Persona included only for open-ended or stylistic tasks | PASS — this is an open-ended analysis task; a persona is appropriate |
| Persona is specific, constrains voice/register | FAIL — no formal `<persona>` block; partial role framing only ("thinking partner, not an interviewer") |
| Persona descriptor is gender-neutral | PASS — no gendered language |

### Output Format
| Item | Score |
|---|---|
| Structured output tasks use two-step reasoning-then-format | PASS — subagent produces structured output, main workflow then maps it to CONTEXT.md sections |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL — subagent output uses markdown headers, not a parseable exact format |

### Context Placement
| Item | Score |
|---|---|
| Task instruction at start of prompt | PASS — `<purpose>` leads |
| Primary document or input at end of prompt | PASS — `<process>` and `<success_criteria>` close the prompt |
| Background context in the middle | PASS — `<downstream_awareness>`, `<philosophy>` are in middle position |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A — no runtime-injected snapshots at top level |

### Self-Consistency
| Item | Score |
|---|---|
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|---|---|
| Redundant instructions removed | PASS — no obvious repetition |
| Long prompts compressed | N/A |
| RAG context is extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|---|---|
| Persistent instructions in system prompt | PASS — workflow is a system-level prompt file |
| Task-specific instructions in user prompt | PASS — phase number passed as argument |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | N/A — no safety-critical constraints in this workflow |

### Agent/Subagent
| Item | Score |
|---|---|
| Agent prompts are fully self-contained | PASS — `Task()` in `deep_codebase_analysis` passes all required context inline |
| All file paths in agent output are absolute | PASS — `${phase_dir}/${padded_phase}-CONTEXT.md` resolved at runtime |
| Parallel agents launched in single message block | N/A — agents are spawned sequentially by design |
| Adversarial probes specified for verification agents | N/A — this is an analysis workflow, not verification |

### Structural Architecture
| Item | Score |
|---|---|
| Large prompts decomposed into atomic single-responsibility modules | PASS — codebase analysis delegated to dedicated subagent |
| Template variables use `${VARIABLE_NAME}` with fallback where appropriate | PASS — consistent use throughout; fallbacks present in some bash commands |
| Modules compose at runtime via variable substitution | PASS |

### Constraint Enforcement
| Item | Score |
|---|---|
| Every restriction paired with equally concrete permission | PASS — scope_guardrail pairs restriction with "capture in Deferred Ideas" |
| Hard exclusion lists enumerated, not described qualitatively | PASS — scope_guardrail provides a verbatim redirect phrase |
| Known edge cases have precedent-style rulings | FAIL — no edge-case precedent rulings (e.g., what happens if prior CONTEXT.md is corrupted, or subagent returns empty assumptions) |
| Confidence thresholds are numeric, not qualitative | FAIL — `--auto` uses "score >= 0.4" for todos but assumption confidence uses qualitative labels ("Confident / Likely / Unclear") with no numeric backing |

### Decision Frameworks
| Item | Score |
|---|---|
| Multi-option recommendations use explicit decision tree or comparison table | PASS — conditional branches are enumerated explicitly |
| Criteria checklists gate complex approaches | PASS — calibration tier resolution uses explicit priority ordering |
| Action permissions framed around reversibility | N/A |

### Multi-Phase Workflows
| Item | Score |
|---|---|
| Complex tasks organized into explicit named phases | PASS — `<step name="...">` elements throughout |
| Required steps distinguished from type-specific steps | PASS — `--auto` path vs. interactive path clearly separated |
| Scenario-based branching handles multiple paths explicitly | PASS |

### Memory and Continuity
| Item | Score |
|---|---|
| Memory templates use XML tags as section labels | PASS — CONTEXT.md template uses `<domain>`, `<decisions>`, `<canonical_refs>`, etc. |
| Compaction summaries include discoveries and failed approaches | PASS — DISCUSSION-LOG.md captures corrections and auto-resolved items |
| Next steps tied to user's most recent explicit request | PASS — `confirm_creation` step presents `/gsd-plan-phase` as the direct next action |

### Modularity
| Item | Score |
|---|---|
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — `<scope_guardrail>` states what to exclude (scope creep) but does not enumerate what is explicitly in scope |

### Safety and Trust
| Item | Score |
|---|---|
| Validation at system boundaries only; internal interfaces trusted | PASS — answer_validation handles empty AskUserQuestion responses at the boundary |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; each action confirmed before expanding | PASS — auto-advance requires explicit `--auto` flag or config opt-in |

### Tone and Style
| Item | Score |
|---|---|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — `present_assumptions` format uses `{Confidence badge}` without defining what a badge is; no numeric length limits on assumption statements |
| Instructions use imperative present tense | PASS |
| Working notes in analysis tags, not user-facing output | PASS — DISCUSSION-LOG.md is explicitly marked "audit trail only" |

### Optimization
| Item | Score |
|---|---|
| Prompt flagged as draft for automated optimization | FAIL — no optimization flag or note |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved | FAIL — not addressed |

---

## Recommendations

Prioritized by impact on model behavior and alignment with the guide.

### 1. Remap top-level sections to canonical XML tag vocabulary (Sections 4.2 and 4 Tag Vocabulary)

Replace `<purpose>`, `<philosophy>`, `<downstream_awareness>`, `<scope_guardrail>`, `<answer_validation>`, and `<success_criteria>` with `<task>`, `<context>`, `<constraints>`, and `<quality_bar>`. This is the highest-impact change because it gives the model the semantic signal it is trained to respond to, rather than custom tags it must infer the role of. Estimated effort: 30 minutes of restructuring, no logic changes required.

### 2. Add a top-level `<output_format>` block naming both output files and their section structure (Section 7, Section 22 Pattern 3)

Place an `<output_format>` block immediately after `<task>`. It should name both output files, list the 6 CONTEXT.md sections in order, and note that DISCUSSION-LOG.md is audit-only. This eliminates the need for the model to read to step 6 before knowing what it is producing. Estimated effort: 10 minutes.

### 3. Add a `<persona>` block with enumerated strengths (Section 6 Actions 1–2, Strengths Listing)

Replace the implicit "thinking partner, not an interviewer" framing with a formal `<persona>` block that names the role and enumerates 3–4 specific strengths. The strengths list directly biases model behavior toward codebase-first analysis and minimal questioning. Estimated effort: 10 minutes.

### 4. Convert all negative instructions to positive equivalents (Section 5 Action 1)

Apply the conversion table to: "not an interviewer", "No scope creep", "not to answer questions you could figure out", and "no re-asking decided questions". This is a mechanical transformation with no logic changes. The scope_guardrail heading is the highest-priority target because it is a section header — the model's first read of that section is a negative command with no positive counterpart. Estimated effort: 15 minutes.

### 5. Replace the subagent output template with XML tags and define confidence badge vocabulary (Sections 4.2, 7, 21)

Change the `## Assumptions` markdown template in the `Task()` call to an XML `<output_format>` block using `<assumptions>`, `<area>`, and `<item>` tags. Separately, define the confidence badge rendering (e.g., `✓ Confident | ~ Likely | ? Unclear`) and add a maximum word count for assumption statements in `present_assumptions`. These changes make the workflow's most critical data handoff (subagent → main agent) reliably parseable. Estimated effort: 20 minutes.
