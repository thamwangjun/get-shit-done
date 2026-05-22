# Critique: join-discord.md

## Summary

`join-discord.md` is the simplest possible workflow: display a static text block verbatim, add nothing else. For that narrow goal the file is structurally coherent — it uses XML tags, pairs a permission with a restriction, and states a success criterion. However, it is almost entirely invisible to the guide's scoring framework because it is a display-only stub with no audience definition, no task decomposition, no reasoning requirements, and no output format specification beyond "copy this text." The quality issues that do exist are small but consequential: the constraint block uses a non-standard tag name, the task specification omits the audience and quality bar, and the instruction framing relies on two negative constructions that the guide mandates be rewritten as positives. The workflow passes on structural hygiene but fails on specification completeness.

---

## Strengths

- **Section 14 — Explicit permission pairs.** The `<constraints>` block follows the guide's "pair every restriction with an equally concrete permission" pattern. `<permitted>` and `<reserved_for_human>` appear together and are specific.
- **Section 4 Action 2 — XML tag usage.** The prompt correctly uses semantically named XML tags (`<purpose>`, `<constraints>`, `<output>`, `<success_criteria>`) rather than markdown headers or plain delimiters.
- **Section 19 — Single responsibility.** The file has one and only one job: render a static invite block. It does not scope-creep into project state or next-step commentary, and it explicitly fences that out in `<reserved_for_human>`.
- **Section 8 Action 1 — Task instruction leads.** `<purpose>` appears at the top of the file, consistent with the guide's requirement that the instruction leads the prompt.
- **Section 22 Pattern 3 — Output specified upfront.** The required output block is written out in full inside `<output>` tags, so the model has an exact copy-target before it begins.

---

## Issues

### Issue 1 — Non-standard constraint tag name
**Guide reference:** Section 4 Action 2; Section 14 (XML tag vocabulary).

**What is wrong:** The closing constraint tag is `<reserved_for_human>` but the guide's canonical vocabulary specifies `<reserved_for_human_review>`. The deviation breaks interoperability with any tooling or composed prompt system that relies on the shared tag vocabulary.

**Concrete fix:** Rename the tag to match the canonical form:
```xml
<reserved_for_human_review>
  - Any deviation from the output block based on project state or conversation context
</reserved_for_human_review>
```

---

### Issue 2 — Task specification is incomplete: audience and quality bar are missing
**Guide reference:** Section 1 Action 1; Section 1 Action 2; Section 23 checklist item "Intent, audience, and quality bar are all explicit."

**What is wrong:** The `<purpose>` block states what the model must do but omits (b) why the output matters and (c) what a correct response looks like from the consumer's perspective. There is no `<audience>` tag identifying who triggers this workflow or in what context. There is no `<quality_bar>` tag defining the acceptance standard beyond the binary success checklist.

**Concrete fix:** Add an `<audience>` and `<quality_bar>` block after `<purpose>`:
```xml
<audience>
A GSD user running the /join-discord command from the CLI. They expect a single, clean
output block — no surrounding prose.
</audience>

<quality_bar>
The output block is rendered exactly as written. No surrounding text, preamble, or
project context appears before or after it.
</quality_bar>
```

---

### Issue 3 — Two negative instructions violate Section 5 Action 1
**Guide reference:** Section 5 Action 1 — "Convert negative instructions to positive equivalents."

**What is wrong:** The `<purpose>` block contains: "Add no project analysis, status summaries, next-step suggestions, or commentary of any kind beyond the block itself." This is a negative instruction. Similarly, `<reserved_for_human>` contains: "Any deviation from the output block based on project state or conversation context" — a restriction framed as a prohibition rather than a positive specification of scope.

**Concrete fix — purpose line:**
```
Display the GSD Discord invite. Output the content block below exactly as written.
Confine your response to the output block only.
```

**Concrete fix — reserved_for_human_review:**
```xml
<reserved_for_human_review>
  - Decisions about whether to include project-specific content, status, or next steps
</reserved_for_human_review>
```
This frames both as scope definitions rather than prohibitions.

---

### Issue 4 — Success criteria belong in `<quality_bar>`, not a separate tag
**Guide reference:** Section 4 (XML tag vocabulary); Section 1 Action 1.

**What is wrong:** The file introduces a `<success_criteria>` tag that does not appear in the guide's canonical vocabulary. The criteria it lists ("Invite link displayed to user", "No project-specific content added") are quality bar items that belong inside `<quality_bar>` per the guide's standard tag set. Using a non-standard tag adds structural noise and reduces interoperability.

**Concrete fix:** Remove `<success_criteria>` and fold its content into `<quality_bar>` as stated criteria:
```xml
<quality_bar>
- The invite link is visible and correctly formatted in the output
- The output block is rendered verbatim with no surrounding project commentary
</quality_bar>
```

---

### Issue 5 — No `<output_format>` tag to signal rendering intent
**Guide reference:** Section 7; Section 4 (XML tag vocabulary); Section 22 Pattern 3.

**What is wrong:** The guide's standard tag for controlling output structure is `<output_format>`. This workflow uses `<output>` to hold the verbatim content block, which conflates "the content to render" with "instructions for how to render it." A downstream model or composing system has no signal about rendering constraints (e.g., that this is plain markdown, that no wrapper prose should be added).

**Concrete fix:** Keep `<output>` for the verbatim block and add a minimal `<output_format>` tag:
```xml
<output_format>
Render the content inside <output> as-is. Use no wrapper prose, preamble, or closing
statement. The response is the output block, nothing more.
</output_format>
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items that genuinely do not apply to a static display-only workflow are marked N/A.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS |

### Chain of Thought
| Item | Score |
|------|-------|
| CoT included only for math/symbolic/multi-step logic tasks | N/A — no reasoning required |
| CoT trigger used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no examples needed |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction complete and clear before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | PASS — minor tag naming deviation (Issue 1) |
| At least 3 format variants tested on target model | N/A — static display stub |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions converted to positive equivalents | FAIL — two negative instructions present (Issue 3) |
| Priority order explicit when multiple criteria apply | N/A — single-path workflow |
| Tie-breaking rules match domain cost asymmetry | N/A |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | PASS — no persona present (appropriate) |
| Persona specific (constrains voice/register) | N/A |
| Persona descriptor is gender-neutral | N/A |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use two-step reasoning-then-format | N/A |
| Single-call JSON places reasoning before answer fields | N/A |
| Constrained decoding adopted only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL — no `<output_format>` tag; rendering intent is implicit (Issue 5) |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction at start of prompt | PASS |
| Primary document or input at end of prompt | PASS — `<output>` closes the file |
| Background context in the middle | N/A |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Self-consistency applied only to single-correct-answer tasks | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | N/A — prompt is minimal |
| RAG context is extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — workflow file, not a system/user split context |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | N/A |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS |
| All file paths in agent output are absolute | N/A — no file paths |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS — single responsibility maintained |
| Template variables use ${VARIABLE_NAME} syntax | N/A — no dynamic variables needed |
| Modules compose at runtime via variable substitution | N/A |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with an equally concrete permission | PASS |
| Hard exclusion lists enumerated, not described qualitatively | PASS |
| Known edge cases have precedent-style rulings | N/A |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or comparison table | N/A |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | N/A |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | N/A — single-step task |
| Required steps distinguished from type-specific steps | N/A |
| Scenario-based branching handles multiple paths | N/A |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | PASS — both `<permitted>` and `<reserved_for_human>` present |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS |
| Dual-use capabilities state permissions before restrictions | PASS |
| Authorization is narrow-scoped | PASS |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | N/A |
| Instructions use imperative present tense | PASS — "Output the content block below exactly as written" |
| Working notes in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | N/A — static display stub; optimization would yield no gain |
| Correct optimizer selected | N/A |
| Held-out test set reserved before optimization | N/A |

**Summary tally (applicable items only):** PASS: 16 | FAIL: 4 | N/A: 43

---

## Recommendations

Listed in priority order by impact on correctness and interoperability.

1. **Fix the non-standard tag name (Issue 1 — Section 14).** Rename `<reserved_for_human>` to `<reserved_for_human_review>`. This is a one-word change with zero behavior risk and directly restores canonical tag vocabulary compliance.

2. **Rewrite the two negative instructions as positive scope definitions (Issue 3 — Section 5 Action 1).** The `<purpose>` line "Add no project analysis..." and the `<reserved_for_human>` entry are both prohibition-framed. Converting them to positive scope statements ("Confine your response to the output block only") is low-effort and removes the most common prompting anti-pattern flagged by the guide.

3. **Add `<audience>` and `<quality_bar>` blocks (Issue 2 — Section 1 Actions 1 and 2).** Even a static workflow benefits from an explicit audience declaration. It takes three lines and makes the intent self-documenting for any future modifier of the file.

4. **Add a minimal `<output_format>` tag (Issue 5 — Section 7; Section 22 Pattern 3).** The current `<output>` tag carries double duty as both content and format signal. A short `<output_format>` block ("Render the content inside `<output>` as-is, no wrapper prose") separates the two concerns and makes the rendering constraint explicit rather than implicit.

5. **Consolidate `<success_criteria>` into `<quality_bar>` (Issue 4 — Section 4 XML tag vocabulary).** Remove the non-standard tag and relocate the two checklist items into a canonical `<quality_bar>` block. This reduces tag count by one and keeps the vocabulary within the shared standard.
