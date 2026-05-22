# Critique: add-phase.md

## Summary

`add-phase.md` is a compact, functional workflow prompt that successfully delegates the core logic to a CLI SDK call and keeps the human-readable steps tightly scoped. Its XML phase/step structure gives the model clear cognitive boundaries, and the error-first branching on missing arguments and missing roadmap shows good defensive design. However, the prompt falls short on several guide fundamentals: it omits explicit audience and quality-bar declarations (Section 1), has no persona (which is appropriate for this task type, but the task framing itself is entirely negative/imperative without positive-equivalent rewrites), uses plain `<step>` XML rather than the guide's recommended `<phase>` tags for multi-step workflows (Section 16), specifies no output-format constraints beyond prose prose copy-paste blocks (Section 7), and contains no tie-breaking rule for edge cases such as duplicate phase descriptions or naming collisions (Section 5). The success-criteria checklist at the bottom is a genuine strength, but it doubles as the only quality bar — the prompt never states upfront what "success" looks like for the model. Overall the prompt is workmanlike and would function correctly most of the time, but it is not optimized and would benefit from a round of structured refinement.

## Strengths

- **Defensive error handling (Section 5 — Conditional Instructions).** The prompt explicitly handles both the no-argument and no-roadmap paths with concrete error messages and `Exit.` directives, removing ambiguity about what the model should do at each failure point.
- **Delegating computation to the CLI SDK (Section 19 — Modularity).** Offloading number calculation, slug generation, and directory creation to `gsd-sdk query phase.add` respects the single-responsibility principle; the prompt's job is orchestration, not arithmetic.
- **Concrete completion template (Section 7 — Output Format).** The fenced code block at the end of `<step name="completion">` gives a precise, copy-pasteable output structure, partially satisfying Pattern 3 (output format specified upfront).
- **Structured XML steps (Section 16 — Multi-Phase Workflows).** Using named `<step>` tags creates cognitive phase boundaries and is semantically richer than prose or numbered markdown lists.
- **Success criteria as a closure check (Section 23).** The `<success_criteria>` checklist gives the model a final self-audit gate before concluding, which maps well to the guide's recommendation for criteria checklists (Section 15).

## Issues

---

**Issue 1 — No explicit task intent, audience, or quality bar (Section 1, Actions 1–2)**

What is missing: The prompt lacks `<task>`, `<audience>`, and `<quality_bar>` declarations. There is a `<purpose>` block, but it describes the tool, not what the model must do, who will consume the output, or what "correct" looks like. The guide requires all three components to be explicit before any prompt text is written.

Concrete fix: Add to the top of the file, before `<required_reading>`:

```xml
<task>
Add a new integer phase to the end of the current milestone roadmap, create its
directory, and update STATE.md — then present a structured completion summary.
</task>

<audience>
A developer using Claude Code who wants to extend the project roadmap with minimal
friction. They are familiar with GSD conventions and expect a short, actionable
completion report.
</audience>

<quality_bar>
Success is defined by all five success_criteria checks passing and a completion
summary presented in the exact format specified in the completion step.
</quality_bar>
```

---

**Issue 2 — No persona declared for an orchestration-style task (Section 6, Action 1 and Pattern 1)**

What is missing: The guide states that when a task has open-ended or stylistic aspects — including determining *how* to present the completion summary and how to format error messages — a role-scoped persona improves consistency of voice and register. The workflow produces user-facing text (error messages, completion summaries), making persona relevant.

Concrete fix: Add a specific persona that constrains the register of all user-facing output:

```xml
<persona>
You are a GSD workflow coordinator. Your job is to confirm operations succeed, surface
errors immediately with corrective instructions, and present compact completion summaries.
Write in imperative present tense. Omit preamble.
</persona>
```

---

**Issue 3 — Steps use `<step>` tags instead of `<phase>` tags; no trigger or mode attributes (Section 16 — Multi-Phase Workflows)**

What is missing: The guide's canonical multi-phase workflow pattern uses `<phase id="N" name="…" trigger="…">` (Section 16). The prompt uses `<step name="…">` with no `id` or `trigger` attributes. While functional, this diverges from the shared vocabulary in Section 4's XML tag table, which lists `<phase>` as the standard workflow stage container. Inconsistency across workflow files makes composed prompts harder to parse programmatically.

Concrete fix: Rename `<step>` to `<phase>` and add numeric IDs:

```xml
<phase id="1" name="parse_arguments">
...
</phase>

<phase id="2" name="init_context" trigger="after_parse_arguments">
...
</phase>
```

---

**Issue 4 — Output format is specified at the end, not upfront; no numeric size constraints (Section 7, Action 1; Section 22, Pattern 3; Section 21)**

What is missing: Pattern 3 explicitly requires the output structure to be stated before the model begins its task. The completion template appears only inside the last step, meaning the model discovers the format constraint at the end. Additionally, the format uses qualitative prose ("present completion summary") rather than numeric size constraints (Section 21 — "Brief means different things; under 8 words does not").

Concrete fix: Add an `<output_format>` block immediately after `<quality_bar>`:

```xml
<output_format>
All error messages: 1–2 lines. Begin with `ERROR:`, then usage example.
Completion summary: use the exact template in the completion phase — no additions,
no omissions.
User-facing output uses imperative present tense. No preamble, no filler.
</output_format>
```

---

**Issue 5 — No tie-breaking rule for edge cases; no constraint conflict audit (Section 1, Action 3; Section 5 — Tie-Breaking)**

What is missing: The prompt does not address what happens if the description collides with an existing phase name, if `gsd-sdk query phase.add` returns an ambiguous result, or if STATE.md lacks the expected section structure. These are foreseeable edge cases. The guide requires a tie-breaking rule that matches the domain's cost asymmetry (Section 5) and an explicit constraint audit (Section 1, Action 3).

Concrete fix: Add a `<constraints>` block with a tie-breaking rule and edge-case handling:

```xml
<constraints>
  <tie_breaking>
    If the phase description matches an existing phase name, proceed — duplicate
    descriptions are permitted. The SDK assigns a unique number; the name is
    informational only.
  </tie_breaking>

  <take_freely>
    Reading ROADMAP.md and STATE.md; running gsd-sdk query commands.
  </take_freely>

  <confirm_with_user>
    Any file write that cannot be confirmed as additive-only (e.g., if ROADMAP.md
    parse fails and a full rewrite would be required).
  </confirm_with_user>
</constraints>
```

---

**Issue 6 — Negative / imperative instructions not converted to positive equivalents (Section 5, Action 1)**

What is missing: The `Exit.` directive after each error block is an implicit negative instruction. More importantly, the `<required_reading>` block says nothing about what to do after reading — it is a directive without a positive completion criterion. The guide requires every negative or implicit instruction to be rewritten as a positive specification.

Concrete fix: Rewrite `Exit.` as a positive closure instruction:

```
Respond with only the error block above and stop. Do not proceed to subsequent steps.
```

And rewrite `<required_reading>` as:

```xml
<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
Confirm each file loaded before advancing to the first phase.
</required_reading>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items not architecturally applicable to this workflow type are marked N/A.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit | FAIL — `<purpose>` is present but `<audience>` and `<quality_bar>` are absent |
| All constraints are compatible — no conflicts | PASS — no conflicting constraints identified |

### Chain of Thought
| Item | Score |
|------|-------|
| CoT included only for math/symbolic/multi-step logic | N/A — no CoT is present, appropriate for this orchestration task |
| CoT trigger phrase used | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces flagged as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no few-shot examples; CLI delegation removes the need |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction complete and clear before formatting applied | FAIL — `<purpose>` describes the tool, not the model's task; formatting precedes clear instruction |
| Prompt sections separated by semantically named XML tags | PASS — `<purpose>`, `<required_reading>`, `<process>`, `<step>` tags are present |
| At least 3 format variants tested on target model | FAIL — no evidence of format testing |

### Instruction Framing
| Item | Score |
|------|-------|
| Negative instructions converted to positive equivalents | FAIL — `Exit.` is a bare negative stop; `<required_reading>` has no positive completion criterion |
| Priority order explicit when multiple criteria apply | N/A — no competing criteria in this workflow |
| Tie-breaking rules match domain cost asymmetry | FAIL — no tie-breaking rule present |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | FAIL — user-facing output generation warrants a persona; none is present |
| Persona is specific (constrains voice/register) | FAIL — no persona |
| Persona descriptor is gender-neutral | N/A — no persona |

### Output Format
| Item | Score |
|------|-------|
| Structured output uses two-step reasoning-then-format | N/A — output is not structured JSON/XML |
| Single-call JSON places reasoning before answer fields | N/A |
| Constrained decoding adopted only after free-form insufficient | N/A |
| Machine-parsed output uses exact literal string specification | PASS — completion template is an exact fenced block |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction at start of prompt | FAIL — `<purpose>` is at the start but is not a task instruction; task is embedded in `<process>` |
| Primary input at end of prompt | PASS — user description argument is parsed first but acted on last via SDK |
| Background context in the middle | PASS — `<required_reading>` and `<init_context>` are appropriately positioned |
| Irrelevant context removed | PASS — the file is lean |
| Time-sensitive injected context labeled as snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions removed | PASS — no obvious redundancy |
| Long prompts compressed | N/A — prompt is short |
| RAG context is extracted passage only | N/A |

### System / User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — workflow file is invoked as a skill, not split into system/user |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | N/A |

### Agent / Subagent
| Item | Score |
|------|-------|
| Agent prompts fully self-contained | PASS — the workflow references only `gsd-sdk` and standard planning paths |
| All file paths in agent output are absolute | FAIL — completion output uses relative paths (`.planning/phases/{phase-num}-{slug}/`) |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic modules | PASS — SDK delegation achieves single-responsibility |
| Template variables use `${VARIABLE_NAME}` syntax | PASS — `${PROJECT_CODE}` and `${PROJECT_TITLE}` used in completion template |
| Modules compose via variable substitution, not copy-paste | PASS |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block present |
| Hard exclusion lists enumerated | N/A |
| Known edge cases have precedent-style rulings | FAIL — no edge-case handling for naming collisions or SDK errors |
| Confidence thresholds are numeric | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or table | N/A |
| Criteria checklists gate complex approaches | PASS — `<success_criteria>` serves this role at close |
| Action permissions framed around reversibility | FAIL — no reversibility framing for file writes |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | PARTIAL — named `<step>` tags used, but not canonical `<phase id="…">` |
| Required steps distinguished from type-specific steps | FAIL — all steps are listed uniformly; no `<required_steps universal="true">` |
| Scenario-based branching handles multiple paths explicitly | PARTIAL — error exits are handled, but no `<scenarios>` container for the branching |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | PASS — completion block explicitly surfaces the next command |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — no `<scope>` block; exclusions not stated |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only | PASS — SDK handles computation; prompt handles orchestration |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL — no confirmation gate for file writes |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits | FAIL — no numeric size constraints on error messages or completion output |
| Instructions use imperative present tense | PASS — most instructions are imperative |
| Working notes in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | FAIL |
| Correct optimizer selected | FAIL |
| Held-out test set reserved | FAIL |

---

## Recommendations

Ranked by impact on prompt reliability:

**1. Add `<task>`, `<audience>`, and `<quality_bar>` at the top (Section 1, Actions 1–2)**
This is the highest-leverage fix. Without an explicit task declaration, the model must infer its job from `<purpose>` and the step content. Adding the three required components eliminates that inferential gap and anchors every subsequent step to a declared success criterion.

**2. Add an `<output_format>` block with numeric size constraints before `<process>` (Section 7, Action 1; Section 22, Pattern 3; Section 21)**
The completion template is buried in the final step. Moving a canonical `<output_format>` block to the top — including numeric word/line limits for error messages — ensures the model holds the output shape in mind throughout execution, not only at the end.

**3. Add a `<constraints>` block with reversibility framing and a tie-breaking rule (Section 14; Section 5 — Tie-Breaking; Section 15 — Reversibility Framework)**
The prompt writes files and mutates ROADMAP.md without any confirmation gate or edge-case ruling. A `<constraints>` block using `<take_freely>` / `<confirm_with_user>` paired with a tie-breaking rule for naming collisions closes the two largest behavioral uncertainty gaps.

**4. Rename `<step>` to `<phase id="N" name="…">` and introduce a `<scenarios>` container for error branches (Section 16 — Multi-Phase Workflows)**
Aligning to the canonical tag vocabulary makes this workflow interoperable with other GSD workflow files and parseable by any tooling that understands the guide's XML schema. The error-exit branches are currently inline; extracting them into `<scenarios>` with explicit `condition` attributes makes the branching structure unambiguous.

**5. Change all relative file paths in the completion output to absolute paths (Section 17 — Absolute Paths)**
The completion template outputs `.planning/phases/{phase-num}-{slug}/` as a relative path. The guide is explicit: agent threads have their cwd reset between bash calls, so relative paths break silently. The fix is a one-line change: prepend the project root via template variable (e.g., `${PROJECT_ROOT}/.planning/phases/{phase-num}-{slug}/`).
