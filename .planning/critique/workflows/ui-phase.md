# Critique: ui-phase.md

## Summary

`ui-phase.md` is a well-structured, operationally complete workflow that successfully orchestrates a multi-agent UI design contract pipeline. Its phase sequencing, prerequisite validation, revision loop, and success criteria checklist all demonstrate mature workflow design. The prompt is written in a directive register with clear conditional branching throughout. However, it falls short on several core prompt engineering principles from the guide: the agent prompts it constructs for subagents are structurally thin (missing audience, quality bar, and output format specifications), negative framing persists in user-facing messages, the subagent prompts lack XML tag structure for their instruction sections, and no persona is defined for the orchestrating skill itself despite the guide's guidance on role-domain specificity. These gaps are consequential because they affect the quality and consistency of what the spawned agents produce.

---

## Strengths

- **Section 16 — Multi-Phase Workflows:** The workflow is decomposed into 12 explicit numbered phases with named steps, matching the guide's phase pattern exactly. Each phase has a clear trigger and completion condition.
- **Section 16 — Scenario-based branching:** Conditions for "Update / View / Skip" (Step 4), "COMPLETE vs. BLOCKED" (Steps 6, 8), and the revision loop cap (Step 9) are all explicit — the model is never left to infer which branch to take.
- **Section 16 — Required vs. optional steps:** The `<success_criteria>` block at the end functions as a universal required-steps checklist, clearly distinguishing mandatory gates from optional inputs.
- **Section 5 — Conditional instructions:** Branching on `UI_ENABLED`, `planning_exists`, `has_context`, `has_research`, `TEXT_MODE`, and `SKETCH_FINDINGS_PATH` is explicit and uses concrete `if/else` logic rather than vague qualifiers.
- **Section 13 — Template variable injection:** Variables like `{phase_dir}`, `{padded_phase}`, `{phase_number}`, `{phase_name}`, and `${AGENT_SKILLS_UI}` follow the `${VARIABLE_NAME}` convention and are used consistently.
- **Section 19 — Modularity:** The workflow delegates to distinct, named subagent types (`gsd-ui-researcher`, `gsd-ui-checker`) with explicit type names, preserving single-responsibility boundaries.
- **Section 9 — Revision loop with cap:** The max-2-iteration revision loop with a user-choice escalation path mirrors the guide's principle of flagging non-convergent states rather than looping silently.
- **Section 17 — Agent task decomposition:** Subagent prompts include `<objective>`, `<files_to_read>`, `<output>`, and `<config>` tags, providing structured decomposition of context for each agent.

---

## Issues

### Issue 1: Subagent prompts are missing `<task>`, `<audience>`, and `<quality_bar>` (Section 1 Actions 1–2; Section 4 Action 2)

**Principle:** Section 1 requires every prompt to make explicit (a) what output is being requested, (b) why it matters, and (c) what a high-quality response looks like. Section 4 Action 2 requires semantically named XML tags for each prompt section.

**What's wrong:** The researcher and checker prompts use `<objective>` to describe what to do but omit `<audience>` (who will consume the UI-SPEC — the planner agent and developers, not end users), `<quality_bar>` (what makes a complete and acceptable UI-SPEC versus a thin one), and a proper `<task>` wrapper around the primary instruction. The `<objective>` block blends "what to do" with "why," without separating them into discrete signal-bearing tags.

**Concrete fix:**

```xml
<task>
Create a UI design contract for Phase {phase_number}: {phase_name}.
Produce a complete UI-SPEC.md covering all 6 dimensions: spacing, typography,
color, copywriting, component decisions, and interaction patterns.
</task>

<audience>
The output will be consumed by the GSD planner agent (gsd-plan-phase) and
implementation engineers. Assume familiarity with the tech stack but no
knowledge of prior design decisions made in earlier phases.
</audience>

<quality_bar>
A complete UI-SPEC.md must: specify concrete values for every dimension (no
placeholder text), be consistent with decisions in CONTEXT.md (if present),
and pass all 6 checker dimensions without revision. A spec that leaves any
dimension unresolved is incomplete.
</quality_bar>
```

---

### Issue 2: Negative framing in user-facing messages (Section 5 Action 1)

**Principle:** All negative instructions ("do not", "avoid") must be converted to positive equivalents before emission. The exception is the reframe pattern (Section 6), which is not in play here.

**What's wrong:** Step 3 contains:
- "Note: stack decisions (component library, styling approach) will be asked during UI research." — implicitly frames the situation as something missing, rather than stating what will happen positively.
- Step 9 revision instructions: "Do NOT re-ask the user questions that are already answered." — this is a direct negative instruction to the subagent.
- The checker prompt objective says "Check all 6 dimensions. Return APPROVED or BLOCKED." — imperative and correct, but the revision instruction block uses "Do NOT" framing.

**Concrete fix for the revision block:**

```xml
<revision>
The UI checker found issues with the current UI-SPEC.md.

### Issues to Fix
{paste blocking issues from checker return}

Read the existing UI-SPEC.md. Fix only the listed issues and rewrite the file.
Treat all questions already answered in UI-SPEC.md as resolved — preserve those
answers exactly and build on them.
</revision>
```

---

### Issue 3: No persona defined for the orchestrating skill (Section 6 Actions 1–2; Section 22 Pattern 1)

**Principle:** Section 6 Action 1 requires classifying the task before assigning a persona. This workflow coordinates multi-agent UI research and verification — an open-ended orchestration task that benefits from a constrained identity. Section 22 Pattern 1 states that role identity should be scoped to the exact domain.

**What's wrong:** The workflow contains a `<purpose>` tag but no `<persona>` block. The orchestrating agent has no role identity, no stated voice or decision-making priorities, and no enumerated strengths. This means the model defaults to generic assistant behavior when making judgment calls (e.g., how to phrase blocking messages, how much to infer when phase arguments are ambiguous, how to escalate).

**Concrete fix:** Add before `<process>`:

```xml
<persona>
You are a UI workflow coordinator for the GSD planning system.

Your role is to orchestrate UI design contract creation — sequencing agents,
enforcing prerequisites, managing revision loops, and presenting clear status
to the developer at each gate.

Your strengths:
- Detecting missing prerequisites and surfacing them without blocking progress
- Routing subagent outputs to the correct next step
- Presenting structured, scannable status messages at each phase boundary
- Escalating gracefully when revision loops do not converge
</persona>
```

---

### Issue 4: Subagent prompts lack `<output_format>` specification (Section 7; Section 22 Pattern 3)

**Principle:** Section 7 Action 1 requires structured output tasks to specify output format completely and upfront. Section 22 Pattern 3 states format specification is part of the task definition. The guide's machine-parsed output pattern (Section 7) requires literal string requirements for parsed signals.

**What's wrong:** The checker prompt expects the agent to return either `## UI-SPEC VERIFIED` or `## ISSUES FOUND` as parsed signals, but neither the checker prompt nor this orchestrating workflow specifies these exact literal strings in an `<output_format>` block. The researcher prompt similarly expects `## UI-SPEC COMPLETE` or `## UI-SPEC BLOCKED` but these are only handled by the orchestrator — they are never specified to the subagent in the prompt shown here.

**Concrete fix:** Add to the checker prompt:

```xml
<output_format>
End your response with exactly one of these verdict lines — it is parsed by the
calling orchestrator:

## UI-SPEC VERIFIED
or
## ISSUES FOUND

Use the exact heading text above. Follow it with:
- For VERIFIED: one line per dimension showing PASS/FAIL status.
- For ISSUES FOUND: a numbered list of blocking issues, each prefixed with [BLOCKING] or [FLAG].
No markdown bold, no wording variation on the verdict heading.
</output_format>
```

---

### Issue 5: No priority ordering when multiple context files conflict (Section 5 — Priority ordering)

**Principle:** Section 5 requires explicit priority ordering when multiple signals apply. When multiple context sources are provided (CONTEXT.md, RESEARCH.md, SKETCH_FINDINGS_PATH), there is no stated precedence rule for the researcher agent if they conflict.

**What's wrong:** Step 5 lists up to five input files for the researcher but provides no `<priority_order>` instruction. If CONTEXT.md states one typography preference and SKETCH_FINDINGS_PATH implies another, the researcher has no instruction for which to treat as authoritative. The guide's language for this case is explicit: "Explicit ordering removes ambiguity when signals conflict."

**Concrete fix:** Add to the researcher prompt:

```xml
<priority_order>
1. SKETCH_FINDINGS_PATH (validated design decisions — treat as locked; do not re-ask)
2. CONTEXT.md (user decisions from /gsd-discuss-phase — treat as confirmed)
3. RESEARCH.md (stack decisions — use as technical constraints)
4. Roadmap and Requirements (scope and feature context)
5. ui-brand.md (house defaults — apply only where higher-priority sources are silent)
</priority_order>
```

---

### Issue 6: No `<constraints>` block scoping what the researcher agent may and may not do (Section 14; Section 22 Pattern 9)

**Principle:** Section 14 requires every restriction to be paired with an equally concrete permission. Section 22 Pattern 9 states tool permissions should be scoped to minimum required patterns.

**What's wrong:** The researcher prompt includes no `<constraints>` block. It is unclear whether the researcher is permitted to create files outside `{phase_dir}`, read files outside the listed paths, or ask the user additional questions beyond what is in CONTEXT.md. The sketch-findings note in Step 3 says "treated as locked — not re-asked" but this instruction only appears in the orchestrator's display output, not in the researcher prompt itself where it would actually constrain the agent.

**Concrete fix:** Add to the researcher prompt:

```xml
<constraints>
  <permitted>
    - Read any file listed in <files_to_read>
    - Write to exactly: {phase_dir}/{padded_phase}-UI-SPEC.md
    - Ask the user clarifying questions via AskUserQuestion for dimensions not covered by context files
  </permitted>

  <reserved_for_human_review>
    - Writing to any path outside {phase_dir}
    - Modifying CONTEXT.md, RESEARCH.md, or SKETCH_FINDINGS_PATH
  </reserved_for_human_review>

  <precedents>
    1. Design decisions present in SKETCH_FINDINGS_PATH are locked — treat as
       already confirmed by the user; present them as resolved, do not re-ask.
    2. Dimensions fully specified in CONTEXT.md are resolved — do not re-ask.
  </precedents>
</constraints>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `ui-phase.md` as an orchestrating workflow prompt.

### Task Specification
| Item | Score | Note |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` states intent but audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No constraint conflicts detected |

### Chain-of-Thought
| Item | Score | Note |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger in this workflow type |
| CoT trigger phrasing correct | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces flagged as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Note |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Note |
|---|---|---|
| Instruction complete before formatting applied | PASS | Steps are fully specified before subagent prompts are built |
| Prompt sections separated by semantically named XML tags | FAIL | Subagent prompts use `<objective>`, `<files_to_read>`, `<output>`, `<config>` but are missing `<task>`, `<audience>`, `<quality_bar>`, `<output_format>`, and `<constraints>` |
| At least 3 format variants tested | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Note |
|---|---|---|
| Negative instructions converted to positive | FAIL | "Do NOT re-ask" in revision block; implicit negative framing in prerequisite warnings |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` for conflicting context files |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rule specified |

### Persona
| Item | Score | Note |
|---|---|---|
| Persona included only for open-ended/stylistic tasks | FAIL | No persona defined despite this being an open-ended orchestration task that qualifies |
| Persona is specific (constrains voice/register) | FAIL | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona to evaluate |

### Output Format
| Item | Score | Note |
|---|---|---|
| Structured output tasks use reasoning-then-format | N/A | Subagent outputs are prose/markdown, not JSON |
| Single-call JSON places reasoning before answer | N/A | |
| Constrained decoding only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | `## UI-SPEC VERIFIED` / `## ISSUES FOUND` signals are relied upon but never specified in subagent prompts |

### Context Placement
| Item | Score | Note |
|---|---|---|
| Task instruction at start of prompt | PASS | `<purpose>` and `<required_reading>` lead the file |
| Primary document/input at end of prompt | PASS | `<success_criteria>` closes the workflow appropriately |
| Background context in the middle | PASS | `<process>` occupies the middle with `<success_criteria>` at end |
| All irrelevant context removed | PASS | No evident bloat |
| Time-sensitive context labeled as snapshot | N/A | No snapshot injection |

### Self-Consistency
| Item | Score | Note |
|---|---|---|
| Self-consistency applied only to single-correct-answer tasks | N/A | Not applicable to this workflow type |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Note |
|---|---|---|
| Redundant instructions and repeated context removed | PASS | No notable redundancy detected |
| Long prompts compressed before sending | N/A | Not a retrieval-heavy prompt |
| RAG context is extracted passage only | N/A | |

### System/User Split
| Item | Score | Note |
|---|---|---|
| Persistent instructions in system prompt | N/A | This is a workflow file, not a system/user split context |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplication of instructions found |
| Safety-critical constraints have external validation | FAIL | No external validation of subagent output format correctness |

### Agent/Subagent
| Item | Score | Note |
|---|---|---|
| Agent prompts are fully self-contained | FAIL | Subagent prompts rely on context (e.g., locked sketch decisions) that is described in the orchestrator's display output, not in the prompt delivered to the agent |
| All file paths in agent output are absolute | PASS | `gsd-sdk query` resolves paths; variables are absolute |
| Parallel agents launched in single message block | N/A | Agents are sequential (researcher then checker) |
| Adversarial probes specified for verification agents | FAIL | gsd-ui-checker is a verification agent; no adversarial probe dimensions specified |

### Structural Architecture
| Item | Score | Note |
|---|---|---|
| Large prompts decomposed into atomic modules | PASS | Delegates to separate subagent files (`gsd-ui-researcher.md`, `gsd-ui-checker.md`) |
| Template variables use `${VARIABLE_NAME}` with fallback | PASS | Consistent variable syntax throughout |
| Modules compose at runtime via substitution | PASS | `${AGENT_SKILLS_UI}` and model resolution follow this pattern |

### Constraint Enforcement
| Item | Score | Note |
|---|---|---|
| Every restriction paired with concrete permission | FAIL | No `<constraints>` block in subagent prompts |
| Hard exclusion lists enumerated, not qualitative | FAIL | No exclusion list for what the researcher/checker should not include |
| Known edge cases have precedent-style rulings | FAIL | Sketch-findings locking is stated in display output only, not as a `<precedents>` block in the subagent prompt |
| Confidence thresholds are numeric | FAIL | Checker dimensions use PASS/FAIL/FLAG labels but no numeric confidence floor |

### Decision Frameworks
| Item | Score | Note |
|---|---|---|
| Multi-option recommendations use decision tree or table | PASS | AskUserQuestion options are enumerated with explicit branches |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist gates workflow completion |
| Action permissions framed around reversibility | FAIL | No reversibility framing for file writes or commits |

### Multi-Phase Workflows
| Item | Score | Note |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | 12 numbered, named steps |
| Required steps distinguished from type-specific | PASS | `<success_criteria>` captures universal requirements |
| Scenario-based branching handles multiple paths explicitly | PASS | All branch conditions are explicit |

### Memory and Continuity
| Item | Score | Note |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | No memory template in this file |
| Compaction summaries include discoveries and failures | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Step 10 "Next Up" block ties to phase-specific next action |

### Modularity
| Item | Score | Note |
|---|---|---|
| Each prompt component has single responsibility | PASS | Orchestrator, researcher, and checker are distinct |
| Scope boundaries state both inclusions and exclusions | FAIL | `<purpose>` states what the workflow does but does not enumerate what it explicitly excludes |

### Safety and Trust
| Item | Score | Note |
|---|---|---|
| Validation at system boundaries only | PASS | Input validation (phase number, config flags) is at the boundary |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capability |
| Authorization narrow-scoped; confirmed before expanding | PASS | Force-approve path in Step 9 requires explicit user choice |

### Tone and Style
| Item | Score | Note |
|---|---|---|
| Size constraints use numeric limits | FAIL | "Remaining issues" and status messages have no word/line count limits |
| Instructions use imperative present tense | PASS | Steps are written in imperative present tense throughout |
| Working notes in analysis tags, not user-facing output | N/A | Not applicable to this workflow type |

### Optimization
| Item | Score | Note |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved | FAIL | Not addressed |

---

## Recommendations

Listed in priority order by impact on output quality.

### 1. Add `<task>`, `<audience>`, and `<quality_bar>` to both subagent prompts (Section 1 Actions 1–2)

The researcher and checker prompts are the most consequential outputs of this workflow — they determine what the spawned agents produce. Without an explicit quality bar and audience definition, agents will calibrate to their own priors about what constitutes a complete UI-SPEC. Add these three tags to both prompts. This is the highest-leverage fix.

### 2. Specify `<output_format>` with exact literal strings for parsed signals (Section 7; Section 22 Pattern 3)

The orchestrator parses `## UI-SPEC VERIFIED`, `## ISSUES FOUND`, `## UI-SPEC COMPLETE`, and `## UI-SPEC BLOCKED` as control signals. None of these are specified to the subagents in a machine-parsed output format block. A single variation in heading text (e.g., `## UI SPEC VERIFIED` vs. `## UI-SPEC VERIFIED`) will silently break routing. Add an `<output_format>` block to each subagent prompt with exact literal string requirements, mirroring the guide's verdict-line pattern.

### 3. Add `<constraints>` blocks to subagent prompts with explicit permission pairs and precedents (Section 14; Section 22 Pattern 9)

The sketch-findings locking rule ("pre-validated decisions should be treated as locked") currently lives only in the orchestrator's display output, not in the researcher's prompt. The agent that needs to honor this constraint never receives it in its operating instructions. Move all behavioral constraints — permitted file paths, write permissions, and locked-decision precedents — into `<constraints>` blocks in the subagent prompts themselves.

### 4. Add `<priority_order>` for conflicting context sources (Section 5 — Priority ordering)

Five input files can contain overlapping or conflicting design decisions. Without a stated precedence order, the researcher resolves conflicts arbitrarily. Add a `<priority_order>` block to the researcher prompt ranking SKETCH_FINDINGS_PATH > CONTEXT.md > RESEARCH.md > Roadmap > ui-brand.md defaults.

### 5. Add a `<persona>` block to the orchestrating skill (Section 6 Actions 1–2; Section 22 Pattern 1)

The workflow makes judgment calls — how to frame blockers, when to escalate, how to handle ambiguous phase arguments — but has no stated identity or decision-making priorities. A specific persona constrained to UI workflow coordination will bias the model toward consistent, domain-appropriate behavior at these decision points and reduce the variability of user-facing messages across invocations.
