# Critique: discovery-phase.md

## Summary

`discovery-phase.md` is a well-structured, domain-appropriate workflow that correctly uses XML tags for step organization, provides a clear tiered depth model, and includes meaningful success criteria per level. It reads as a competent operational document. However, it falls short of the guide's standards in several meaningful ways: the persona is absent where one would add focus, the output format is underspecified (no example of DISCOVERY.md structure inline), negative instructions appear where positive equivalents would be stronger, the confidence-gate's AskUserQuestion block is procedurally muddled with a text-mode injection that breaks the instruction's readability, and no quality bar or audience is encoded. The workflow also delegates heavily to an external template file (`~/.claude/get-shit-done/templates/discovery.md`) without being self-contained, creating a fragility that the guide's agent self-containment rules (Section 17) flag as a defect. The file is usable but not production-hardened.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The `<process>` block decomposes the workflow into named `<step>` elements with explicit `name` attributes, and each level has distinct routing logic. This mirrors the guide's phase pattern directly.

- **Section 16 — Scenario-based branching present.** The `depth=verify / depth=standard / depth=deep` routing in `<step name="determine_depth">` is a clean conditional branch. Each arm has a defined output and an escalation path (Level 1 → Level 2 on failure), which matches the guide's scenario branching pattern.

- **Section 4 (Formatting and Structure) — XML tags used for prompt sections.** The file uses `<purpose>`, `<depth_levels>`, `<source_hierarchy>`, `<process>`, `<step>`, `<success_criteria>`, and `<output>` tags consistently. This is exactly the semantic-tagging practice the guide prescribes in Section 4 Action 2.

- **Section 8 (Context Placement) — Task instruction leads.** The `<purpose>` block at the top correctly front-loads the intent of the workflow, placing it where the guide says attention is highest.

- **Section 19 (Modularity) — Inclusion/exclusion boundaries present.** `<source_hierarchy>` names what to use first (Context7), what to use next (official docs), and what to use last (WebSearch), establishing a priority hierarchy that doubles as a constraint filter.

- **Section 14 (Constraint Enforcement) — Source hierarchy acts as an implicit constraint.** Mandating Context7 before WebSearch and requiring cross-verification of WebSearch findings is a reasonable domain-specific guardrail, consistent with the guide's hard-constraint pattern.

- **Section 16 — Success criteria defined per level.** The `<success_criteria>` block lists distinct pass/fail conditions for each depth level, giving the model a concrete definition of "done" — a practice the guide endorses across multiple sections.

---

## Issues

### Issue 1: No persona defined

**Guide reference:** Section 6 (Persona Assignment), Action 1-2; Section 22 Pattern 1.

**What's missing/wrong:** The workflow has no `<persona>` block. The task requires structured research, cross-verification, source prioritization, and confident recommendation — all of which would benefit from a role-scoped identity. Without a persona, the model defaults to generic assistant behavior rather than leaning into the focused "technical researcher" or "discovery specialist" register this workflow calls for. The guide notes that a persona must "constrain register, voice, or domain-specific style to be effective" (Section 6 Action 2).

**Concrete fix:**

```xml
<persona>
You are a technical discovery specialist. Your job is not to build things — it's to find the
most current, authoritative information and turn it into a confident, actionable recommendation.

Your strengths:
- Resolving the best available library or approach for a given constraint set
- Cross-verifying claims across multiple source tiers before accepting them
- Producing a structured DISCOVERY.md that eliminates ambiguity for the planner
</persona>
```

---

### Issue 2: Output format for DISCOVERY.md is not specified inline — workflow is not self-contained

**Guide reference:** Section 17 (Agent and Subagent Patterns) — "Each agent prompt must be fully self-contained when spawned"; Section 22 Pattern 3 — "Output format specified completely and upfront."

**What's missing/wrong:** The workflow repeatedly defers to `~/.claude/get-shit-done/templates/discovery.md` for the output structure: "Use ~/.claude/get-shit-done/templates/discovery.md structure" appears in steps for Level 2, Level 3, and `create_discovery_scope`. The guide states explicitly that every agent prompt must include its full operating instructions — context inheritance from an external file is unavailable or unreliable. If the template file is absent, modified, or at a different path, this workflow silently breaks. The guide's self-containment rule (Section 17) and Pattern 3 (Section 22) both require output format to be specified upfront in the prompt itself.

**Concrete fix:** Inline the key DISCOVERY.md structure directly in the workflow, at minimum as a required-fields skeleton. For example, add an `<output_format>` block after `<source_hierarchy>`:

```xml
<output_format>
DISCOVERY.md must include these sections (in order):

1. **Objective** — one sentence stating what question this discovery answers
2. **Scope** — include/exclude list
3. **Findings** — per option or approach: source, summary, relevant code example
4. **Recommendation** — one clear choice with rationale
5. **Confidence** — HIGH / MEDIUM / LOW with reason
6. **Open Questions** — any unresolved issues that affect planning
7. **Assumptions** — what is taken as true but not verified

Source attribution is required on every finding. Mark any finding that came only from
WebSearch and was not cross-verified with authoritative docs as UNVERIFIED.
</output_format>
```

---

### Issue 3: Negative instructions present — should be converted to positive equivalents

**Guide reference:** Section 5 (Instruction Framing) Action 1 — "Convert negative instructions to positive equivalents."

**What's missing/wrong:** Several instructions use negative framing:

- `<source_hierarchy>`: "Claude's training data is 6-18 months stale. Always verify." — the implicit warning ("don't rely on training data") is a negative constraint.
- `<step name="offer_next">`: "NOTE: DISCOVERY.md is NOT committed separately." — this is a pure negative.
- Level 1 step 4: "No DISCOVERY.md needed." — negative.

The guide requires a mechanical conversion: every negative directive should be rewritten as what the model should do instead.

**Concrete fix:**

- "Claude's training data is 6-18 months stale. Always verify." → "Treat training knowledge as a prior only. Confirm every claim against a current authoritative source before using it."
- "DISCOVERY.md is NOT committed separately. It will be committed with phase completion." → "Commit DISCOVERY.md together with the phase completion commit."
- "No DISCOVERY.md needed." → "Return verbal confirmation to the caller. Skip file creation."

---

### Issue 4: Confidence gate step has a text-mode injection that breaks instruction readability

**Guide reference:** Section 10 (Prompt Length and Compression) Action 1 — "Remove redundant instructions, repeated context, and boilerplate"; Section 11 Action 3 — "State each instruction exactly once"; Section 4 Action 1 — "Draft the instruction before choosing a format."

**What's missing/wrong:** The `<step name="confidence_gate">` block contains an inline meta-instruction about TEXT_MODE detection injected in the middle of the confidence-gate logic:

> "Text mode (`workflow.text_mode: true` in config or `--text` flag): Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numbered list..."

This is a cross-cutting operational concern unrelated to confidence assessment. Injecting it inside the confidence gate creates two defects: (1) it pollutes the confidence-gate instruction with unrelated logic, making both harder to follow; (2) if other steps in other workflows use `AskUserQuestion`, this text-mode rule is not applied there — yet it is stated here as though it is complete. This is a scope violation and an instruction-locality violation.

**Concrete fix:** Extract the text-mode rule to a top-level `<system_note>` block in this file (or to a shared module included at runtime), and remove it from the confidence gate step entirely:

```xml
<system_note>
TEXT_MODE: If `--text` is present in $ARGUMENTS or `text_mode: true` is set in the init
config, replace all AskUserQuestion calls with a plain-text numbered list. Ask the user
to type their choice number. This is required for non-Claude runtimes.
</system_note>
```

---

### Issue 5: No quality bar or audience defined

**Guide reference:** Section 1 (Task Specification) Actions 1-2 — "Extract the three task components" (what, why, what makes a good response); "Identify the audience."

**What's missing/wrong:** The workflow never states who consumes the DISCOVERY.md output or what makes a good discovery sufficient to unlock planning. The `<purpose>` block says it "informs PLAN.md creation" and is "called from plan-phase.md," but neither the expected consumer (the planning agent or a human reviewer), their domain assumptions, nor the quality bar for a passing discovery are encoded. Without this, the model has no calibration standard — "medium confidence" and "ready to inform PLAN.md" are vague unless defined. The guide requires audience and quality bar to be explicit (Section 1 Action 2 and the `<quality_bar>` tag in Section 4's vocabulary table).

**Concrete fix:** Add at the top of the file:

```xml
<audience>
Primary consumer: the plan-phase.md workflow, which uses DISCOVERY.md to make implementation
decisions. Secondary consumer: the developer reviewing the plan. Assume technical familiarity
with the stack but no prior knowledge of the specific library or approach being researched.
</audience>

<quality_bar>
A passing DISCOVERY.md: (1) makes a single clear recommendation, (2) attributes every finding
to a source, (3) states confidence as HIGH or MEDIUM — LOW confidence requires a validation
gate before planning proceeds, (4) lists open questions that affect implementation choices,
(5) includes at least one code example for the recommended approach.
</quality_bar>
```

---

### Issue 6: No tie-breaking rule for ambiguous source conflicts

**Guide reference:** Section 5 (Instruction Framing) — Tie-breaking instructions; Section 22 Pattern 4.

**What's missing/wrong:** The `<source_hierarchy>` block establishes a source priority order (Context7 > official docs > WebSearch) but provides no tie-breaking rule for the case where sources disagree. For example: Context7 shows one API pattern, official docs show another. The guide requires explicit tie-breaking that matches the domain's cost asymmetry (Section 5). In a discovery context, the cost of an incorrect implementation choice is high — so precision is preferred over recall.

**Concrete fix:** Add a tie-breaking rule inside `<source_hierarchy>`:

```xml
<tie_breaking>
When sources disagree, prefer the most recently dated authoritative source. If recency
is unclear, prefer official docs over Context7, and Context7 over WebSearch.
Flag the disagreement explicitly in DISCOVERY.md under Open Questions.
When in doubt, report both findings as alternatives rather than choosing silently.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items are assessed for the `discovery-phase.md` workflow as a prompt artifact.

### Task Specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is present; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints identified |

### Chain-of-Thought
| Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic tasks | N/A | No CoT trigger present; the task does not require symbolic reasoning |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic aids | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples present |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|---|---|---|
| Instruction complete and clear before formatting applied | PASS | `<purpose>` establishes intent before any step structure |
| Prompt sections separated by semantically named XML tags | PASS | `<purpose>`, `<depth_levels>`, `<source_hierarchy>`, `<process>`, `<step>`, `<success_criteria>` all present |
| At least 3 format variants will be tested | FAIL | No evidence of format variant testing or evaluation plan |

### Instruction Framing
| Item | Score | Notes |
|---|---|---|
| All negative instructions converted to positive equivalents | FAIL | Multiple negative instructions present (see Issue 3) |
| Priority order explicit when multiple criteria apply | PASS | Source hierarchy (Context7 > official docs > WebSearch) is an explicit priority order |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for source conflicts (see Issue 6) |

### Persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | FAIL | This is a stylistic/judgment-heavy task; no persona is defined (see Issue 1) |
| Persona is specific (constrains voice/register) | FAIL | Absent |
| Persona descriptor is gender-neutral | N/A | Absent |

### Output Format
| Item | Score | Notes |
|---|---|---|
| Structured output tasks use reasoning-then-format approach | PASS | Workflow implicitly sequences research → findings → recommendation |
| Single-call JSON places reasoning fields before answer fields | N/A | Output is markdown, not JSON |
| Constrained decoding adopted only after free-form insufficient | N/A | Not applicable |
| Machine-parsed output uses exact format specification | FAIL | DISCOVERY.md structure is delegated to an external template; not specified inline (see Issue 2) |

### Context Placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | PASS | `<purpose>` leads |
| Primary document or input at end of prompt | N/A | This is a process workflow, no primary input document |
| Background context in the middle | PASS | `<source_hierarchy>` sits between purpose and process |
| All irrelevant context removed | PASS | No obvious bloat |
| Time-sensitive injected context labeled as snapshot | N/A | No runtime context injected |

### Self-Consistency
| Item | Score | Notes |
|---|---|---|
| Self-consistency applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | FAIL | The template reference appears three times across Level 2, Level 3, and `create_discovery_scope` steps |
| Long prompts compressed before sending | N/A | Not applicable |
| RAG context is extracted relevant passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | File is a workflow, not split into system/user |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | FAIL | Text-mode instruction injected mid-step; template reference repeated three times |
| Safety-critical constraints have external validation | N/A | |

### Agent / Subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | FAIL | Depends on external template file (see Issue 2) |
| All file paths in agent output are absolute | PASS | Output paths use `.planning/phases/XX-name/DISCOVERY.md` pattern |
| Parallel agents launched in a single message block | N/A | No parallel agents in this workflow |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |

### Structural Architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic single-responsibility modules | PASS | Workflow is focused on discovery only; appropriately scoped |
| Template variables use ${VARIABLE_NAME} syntax | FAIL | No template variables used; depth parameter is described in prose, not as a variable |
| Modules compose at runtime via variable substitution | FAIL | Runtime composition not implemented; external template referenced by path, not injected |

### Constraint Enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with equally concrete permission | PASS | Source hierarchy implicitly pairs "not training data" with "use Context7 instead" |
| Hard exclusion lists enumerated, not described qualitatively | N/A | No hard exclusion lists required here |
| Known edge cases have precedent-style rulings | FAIL | No handling of source disagreements or ambiguous depth routing |
| Confidence thresholds are numeric, not qualitative | FAIL | Confidence levels are HIGH/MEDIUM/LOW (qualitative); no numeric definition provided |

### Decision Frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | Depth-level table in `<depth_levels>` is a readable comparison format |
| Criteria checklists gate complex approaches | PASS | Confidence gate and open-questions gate serve this role |
| Action permissions framed around reversibility | N/A | Not applicable |

### Multi-Phase Workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | `<step>` elements with `name` attributes used throughout |
| Required steps distinguished from type-specific steps | PASS | Depth levels separate universal steps from level-specific ones |
| Scenario-based branching handles multiple paths explicitly | PASS | Depth routing and escalation path (Level 1 → Level 2) present |

### Memory and Continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | No memory templates in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | `<step name="offer_next">` surfaces concrete next options |

### Modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Workflow is scoped to discovery only |
| Scope boundaries state both inclusions and exclusions | FAIL | `<source_hierarchy>` states inclusions; exclusions (what NOT to use) are not enumerated |

### Safety and Trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only | N/A | Not applicable |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped; each action confirmed before expanding scope | PASS | Confidence gate and open-questions gate require explicit confirmation before proceeding |

### Tone and Style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | Time estimates ("2-5 min", "15-30 min", "1+ hour") are useful, but confidence levels (HIGH/MEDIUM/LOW) are qualitative with no numeric anchor |
| Instructions use imperative present tense | PASS | Step instructions are imperative throughout ("Resolve library in Context7", "Fetch relevant docs") |
| Working notes in analysis tags, not user-facing output | N/A | No analysis tags in workflow; not required here |

### Optimization
| Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No such flag or note |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization | FAIL | Not addressed |

---

## Recommendations

Prioritized from highest to lowest impact on workflow reliability and guide compliance.

### 1. Make the workflow self-contained by inlining DISCOVERY.md structure (Issue 2)

**Priority: Critical.** The repeated delegation to `~/.claude/get-shit-done/templates/discovery.md` is a single point of failure. Per Section 17, agent prompts must be fully self-contained. Add an `<output_format>` block that specifies the required sections, field names, and at minimum one inline example of a well-formed finding. This single change satisfies Section 17, Section 22 Pattern 3, and eliminates the redundant template references (which also violates Section 11 Action 3). The template file can still exist as a reference, but the critical structure must be present in the workflow itself.

### 2. Add a persona with explicit strengths (Issue 1)

**Priority: High.** The discovery task is open-ended and judgment-heavy — exactly the condition under which Section 6 Action 1 says a persona adds measurable value. A focused "technical discovery specialist" persona with an enumerated strengths list (per Section 6's strengths-listing pattern and Section 22 Pattern 1) would anchor the model's register and decision-making style across all three depth levels. This is a low-effort, high-return change.

### 3. Convert all negative instructions to positive equivalents (Issue 3)

**Priority: High.** The guide mandates mechanical conversion of every negative directive (Section 5 Action 1). There are at least four instances. This is a low-effort change that improves instruction signal quality and eliminates a systematic guide violation.

### 4. Define the quality bar and audience explicitly (Issue 5)

**Priority: Medium.** Without a `<quality_bar>` block, the success criteria in `<success_criteria>` are the only calibration signal — and they describe process completion, not output quality. Per Section 1 Action 1, a good response definition must be explicit. Adding `<audience>` and `<quality_bar>` blocks at the top of the file satisfies Section 1 and gives the model a concrete standard to measure its DISCOVERY.md against.

### 5. Add tie-breaking rules for source conflicts and define confidence levels numerically (Issues 4 and 6)

**Priority: Medium.** The confidence gate uses qualitative labels (HIGH/MEDIUM/LOW) with no numeric anchoring, violating Section 14's numeric-threshold requirement and Section 22 Pattern 6. Adding a `<confidence_scoring>` block (e.g., HIGH = >80% certainty the recommendation is correct given available sources, MEDIUM = 60–80%, LOW = <60%) makes the gate actionable. Simultaneously, extracting the text-mode injection from the confidence gate (Issue 4) and adding a tie-breaking rule for source disagreements (Issue 6) removes the two remaining readability and correctness defects from the same section of the workflow.
