# Critique: transition.md

## Summary

`transition.md` is a well-structured internal workflow that handles a genuinely complex multi-phase orchestration task — phase completion verification, state file updates, PROJECT.md evolution, and next-step routing. Its use of `<step>` tags, conditional mode-branching (`<if mode="yolo">` / `<if mode="interactive">`), and scenario routing (Routes A, B, B1) shows mature workflow design. However, the prompt relies heavily on markdown headers, code-fenced bash blocks, and prose rather than the guide's prescribed XML tag vocabulary. Key gaps include: no explicit `<task>`, `<persona>`, `<output_format>`, or `<constraints>` root tags; no `<quality_bar>` or audience specification; negative/ambiguous instructions that could be rewritten as positive equivalents; and no tie-breaking rules for the multiple decision points. The workflow is long (672 lines) with some redundancy, and could benefit from modularization. Overall it is functionally complete but structurally non-conformant with the guide in several high-impact areas.

---

## Strengths

- **Section 16 — Multi-Phase Workflow structure:** Steps are named and sequenced using `<step name="...">` tags with clear ordered progression (load → verify → cleanup → update → evolve → offer). This directly matches the guide's `<phase>` pattern and creates cognitive boundaries between stages.

- **Section 16 — Scenario-based branching:** Routes A, B, and B1 explicitly enumerate all completion paths (more phases remain / milestone complete with other active workstreams / milestone fully complete). This matches Section 16's `<scenarios>` / `<scenario condition="...">` pattern.

- **Section 5 — Conditional instructions:** The `<if mode="yolo">` / `<if mode="interactive">` branching throughout the workflow applies Section 5's conditional instruction pattern consistently. Each branch has its own concrete action.

- **Section 14 — Safety rail for destructive actions:** The `SAFETY RAIL: always_confirm_destructive applies here` note on skipping incomplete plans correctly enforces a confirmation gate on irreversible actions, matching the guide's reversibility framework (Section 15).

- **Section 8 — Context placement:** The `<required_reading>` block at the top correctly front-loads the instruction to read context files before acting, consistent with Section 8 Action 1 (task instruction leads).

- **Section 22, Pattern 3 — Output format specified with concrete examples:** The `offer_next_phase` step provides verbatim message templates for each route and mode combination, eliminating output ambiguity.

- **Section 19 — Explicit scope:** The `<internal_workflow>` block at the top clearly states what this file is NOT (not a user command) and what the valid user commands are, serving as a scope exclusion notice.

---

## Issues

### Issue 1 — Missing root structural XML tags (`<task>`, `<persona>`, `<output_format>`, `<constraints>`)

**Guide reference:** Section 4 Action 2; Section 1 Action 1; Section 7; Section 14

**What's missing:** The prompt has no `<task>` root tag declaring what the model must do, no `<persona>` defining the orchestrator role, no `<output_format>` specifying how the model should present results to the calling agent, and no `<constraints>` block pairing permissions with restrictions. The guide requires semantically named XML tags for every major section to give the model richer signal than delimiters alone.

**Concrete fix:** Wrap the top-level prompt content in guide-standard tags:

```xml
<task>
You are the GSD phase-transition orchestrator. Mark the current phase complete,
update all state files, evolve PROJECT.md with phase learnings, and route to the
next logical step. Execute all steps in order; stop and confirm before any
destructive action.
</task>

<persona>
You are a GSD workflow orchestrator. Your role is to ensure accurate state tracking
and smooth phase handoffs — not to do project work yourself.
</persona>

<constraints>
  <take_freely>
    Read state files, count plan/summary files, parse SDK output.
  </take_freely>
  <confirm_with_user>
    Marking a phase complete with incomplete plans (irreversible state change).
    Advancing to milestone completion.
  </confirm_with_user>
</constraints>

<output_format>
Present only the final transition message to the user. Keep internal state-file
edits silent. End every transition with the appropriate Route A/B/B1 block.
</output_format>
```

---

### Issue 2 — No `<quality_bar>` or audience specification

**Guide reference:** Section 1 Actions 1–2; Section 23 checklist item "Intent, audience, and quality bar are all explicit"

**What's missing:** The workflow never states what a correct or high-quality execution looks like beyond the `<success_criteria>` checklist at the bottom. It also never identifies the audience — the calling agent (`execute-phase` / the orchestrator) vs. the human user — which matters because outputs differ for each (Section 17 subagent vs. standalone response).

**Concrete fix:** Add near the top:

```xml
<audience>
The calling agent (execute-phase orchestrator or inline orchestrator). This workflow
runs as an internal step; output is relayed to the user by the caller.
</audience>

<quality_bar>
Transition is high quality when: all state files reflect the new phase position,
PROJECT.md learnings are captured, the user message matches the correct Route and mode,
and no state mutation happens before confirmation in interactive mode.
</quality_bar>
```

---

### Issue 3 — Negative and ambiguous instructions not converted to positive equivalents

**Guide reference:** Section 5 Action 1

**What's missing:** Several instructions use negated or ambiguous directives. The guide mandates converting all negatives to positive specifications.

Examples found in the workflow:

| Current (negative/ambiguous) | Should be (positive) |
|---|---|
| `Do NOT suggest /gsd-complete-milestone or /gsd-new-milestone.` | `Suggest only /gsd-workstreams complete and /gsd-workstreams progress.` |
| `Do NOT auto-invoke any further slash commands.` | `Stop after presenting the Route B1 block. Await explicit user input.` |
| `Users should never be told to run /gsd-transition.` | `When users ask about phase progression, refer them to /gsd-discuss-phase, /gsd-plan-phase, or /gsd-execute-phase only.` |

**Concrete fix:** Apply the Section 5 conversion table mechanically to each negative directive listed above.

---

### Issue 4 — No tie-breaking rules for key decision points

**Guide reference:** Section 5 (Tie-breaking instructions); Section 22 Pattern 4

**What's missing:** The workflow has multiple binary decision points where tie-breaking behavior is unspecified: (a) When the PLAN/SUMMARY count difference is exactly 1 — is a single missing summary incomplete? (b) When `gsd-sdk query phase.complete` returns ambiguous output — proceed or halt? (c) When blockers in STATE.md are ambiguous about whether they were addressed in the completed phase.

**Concrete fix:** Add a tie-breaking block under the verify_completion step:

```xml
<tie_breaking>
When uncertain whether a phase is complete (e.g., one SUMMARY.md is missing but
plans were small): treat as incomplete. Prompt the user. Under-confirmation is
preferable to silently skipping work.

When gsd-sdk output is malformed or empty: halt and surface the raw output to
the user rather than proceeding on a guess.
</tie_breaking>
```

---

### Issue 5 — Missing `<output_format>` spec for the transition message itself

**Guide reference:** Section 7; Section 22 Pattern 3

**What's missing:** While Route A and Route B templates provide example message formats, there is no unified `<output_format>` instruction that governs: whether to use markdown headers, what emoji usage policy is (currently inconsistent — `⚡`, `🎉`, `✓` appear in some templates but not others), and what length target applies.

**Concrete fix:** Add an explicit output format block:

```xml
<output_format>
Route messages use this structure:
1. Completion line: "## ✓ Phase [X]: [Name] Complete"
2. Separator: "---"
3. Next-up block: "## ▶ Next Up"
4. Primary command (code block)
5. Separator and secondary options

Emoji: use ✓ for completion, ▶ for next, ⚡ for auto-advance, ⚠️ for warnings.
Omit emoji in state file writes (STATE.md, ROADMAP.md).
Length: route messages target 10–20 lines. Internal steps produce no user-visible output.
</output_format>
```

---

### Issue 6 — `evolve_project` step is a multi-concern monolith

**Guide reference:** Section 19 (Modularity); Section 22 Pattern 5

**What's missing:** The `evolve_project` step is 80+ lines covering five distinct concerns: requirements validation, requirements invalidation, requirements emergence, decision logging, and "What This Is" freshness. Each is a separable responsibility. Bundling them makes the step hard to scan, test, or replace independently.

**Concrete fix:** Either split into sub-steps with names (`<step name="evolve_requirements">`, `<step name="evolve_decisions">`, `<step name="evolve_description">`) or extract the step into a dedicated `evolve-project.md` module invoked from transition via template variable substitution. The five checklist items at the end of the step already define the natural module boundary.

---

### Issue 7 — Prompt length / redundancy

**Guide reference:** Section 10 Action 1; Section 11 Action 3

**What's missing:** The `partial_completion` block (lines 635–657) duplicates content already covered in `verify_completion` (lines 53–147). Both blocks present the same three options (continue / skip / review) using nearly identical wording. The `<implicit_tracking>` note restates behavior already implied by the step ordering. Section 11 Action 3 says each instruction must appear in exactly one location.

**Concrete fix:** Remove the `partial_completion` block entirely and add a single forward-reference in `verify_completion`: "If the user chooses to mark complete with incomplete plans, note partial count in ROADMAP and transition message." Remove `<implicit_tracking>` — it adds no actionable instruction.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, treating `transition.md` as a workflow prompt.

### Task Specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | No `<audience>` or `<quality_bar>`; `<purpose>` is present but thin |
| All constraints are compatible — no conflicts | PASS | No detected constraint conflicts |

### Chain-of-Thought
| Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT triggers used; workflow is procedural, not reasoning-eliciting |
| CoT trigger phrasing correct | N/A | |
| Reasoning before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples; workflow uses templates instead |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across eval runs | N/A | |

### Formatting
| Item | Score | Notes |
|---|---|---|
| Instruction complete before formatting applied | PASS | Steps are complete before structure is applied |
| Prompt sections separated by semantically named XML tags | FAIL | Steps use `<step name="">` correctly but root sections (`<task>`, `<persona>`, `<output_format>`, `<constraints>`) are absent |
| At least 3 format variants tested | N/A | Workflow file, not a single-call prompt |

### Instruction Framing
| Item | Score | Notes |
|---|---|---|
| Negative instructions converted to positive equivalents | FAIL | At least 3 negated directives remain (see Issue 3) |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` block; step ordering implies sequence but competing signals (e.g., mode vs. safety rail) are not explicitly ranked |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking rules present (see Issue 4) |

### Persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | N/A | Workflow-type prompt; persona is optional but would help constrain behavior |
| Persona is specific (constrains voice/register) | FAIL | No persona defined |
| Persona descriptor is gender-neutral | N/A | No persona |

### Output Format
| Item | Score | Notes |
|---|---|---|
| Structured output uses two-step reasoning-then-format | N/A | Not a structured-output task |
| Single-call JSON places reasoning before answer | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format spec | PASS | Route message templates are verbatim; SDK calls use bash pattern |

### Context Placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | FAIL | `<internal_workflow>` meta-note leads; the actual task purpose (`<purpose>`) is buried after `<required_reading>` |
| Primary document/input at end of prompt | N/A | No dynamic input document |
| Background context in middle | PASS | `<required_reading>` in middle is appropriate |
| Irrelevant context removed | PASS | No obvious padding |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot context injected |

### Self-Consistency
| Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions removed | FAIL | `partial_completion` block duplicates `verify_completion` content (see Issue 7) |
| Long prompts compressed | FAIL | 672 lines; `evolve_project` step is a monolith that could be extracted |
| RAG context is extracted passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | File-based workflow, not a system/user split context |
| Task-specific in user prompt | N/A | |
| Each instruction appears in exactly one location | FAIL | Partial-completion options appear in two places |
| Safety-critical constraints have external validation | PASS | Safety rail on destructive skip is explicitly enforced |

### Agent / Subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | PASS | `<required_reading>` block ensures agent loads context before acting |
| All file paths in agent output are absolute | FAIL | Bash code blocks use relative paths (`.planning/STATE.md`, `.planning/phases/XX-current/`) throughout |
| Parallel agents launched in single message block | N/A | No parallel agent spawning in this workflow |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |

### Structural Architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic modules | FAIL | `evolve_project` step is 80+ lines covering 5 separate concerns |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `${GSD_WS}`, `${PROJECT_CODE}`, `${PROJECT_TITLE}`, `${IS_SUBAGENT}` patterns used correctly |
| Modules compose at runtime via variable substitution | PASS | Slash command invocations use `${GSD_WS}` correctly |

### Constraint Enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with an equally concrete permission | FAIL | Route B1 "do NOT" directives have no paired "DO" equivalents |
| Hard exclusion lists are enumerated, not qualitative | PASS | Route B1 explicitly lists what not to suggest |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` block; known edge cases (partial completion, SDK failure) handled in prose |
| Confidence thresholds are numeric, not qualitative | N/A | No confidence-scored filtering task |

### Decision Frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or table | PASS | Route A/B/B1 is an implicit decision tree; workstream collision check is a clear binary fork |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist is present |
| Action permissions framed around reversibility | PASS | Safety rail on incomplete-plan skip correctly uses reversibility framing |

### Multi-Phase Workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | `<step name="...">` tags with ordered names throughout |
| Required steps distinguished from type-specific steps | FAIL | All steps appear mandatory; no `<required_steps universal="true">` vs. `<type_specific_strategy>` split |
| Scenario-based branching handles multiple paths explicitly | PASS | Routes A, B, B1 with explicit conditions |

### Memory and Continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | PASS | STATE.md format shown uses markdown headers matching expected structure |
| Compaction summaries include discoveries and failed approaches | N/A | Not a compaction prompt |
| Next steps tied to user's most recent explicit request | PASS | Route A/B/B1 next-step blocks are context-specific |

### Modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has single responsibility | FAIL | `evolve_project` covers 5 concerns; `partial_completion` duplicates `verify_completion` |
| Scope boundaries state both inclusions and exclusions | PASS | `<internal_workflow>` states what this is NOT; valid commands listed |

### Safety and Trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only | PASS | SDK calls handle state mutation; internal reads are trusted |
| Dual-use capabilities state permissions before restrictions | FAIL | Route B1 restrictions stated without paired permissions |
| Authorization is narrow-scoped; confirm before expanding | PASS | Destructive-action confirmation gates are present |

### Tone and Style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits | FAIL | No numeric length targets for output messages |
| Instructions use imperative present tense | PASS | Step instructions use imperative form throughout |
| Working notes in analysis tags, not user-facing output | FAIL | No `<analysis>` tag pattern used; model reasoning and user-facing output are not distinguished |

### Optimization
| Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Prioritized from highest to lowest impact:

### 1. Add root XML structural tags (`<task>`, `<persona>`, `<output_format>`, `<constraints>`)
**Impact: High.** The guide's most foundational requirement (Section 4 Action 2) is entirely absent. Adding these four tags reorients the model's parsing of the entire document and enables constraint pairing (Issue 1). This is a one-time structural change that unblocks most other checklist items. Implement as shown in Issue 1's fix.

### 2. Convert negative directives to positive equivalents and add tie-breaking rules
**Impact: High.** Three "do NOT" instructions in Route B1 (Section 5 Action 1 violation) and the absence of tie-breaking rules at three decision points (Section 22 Pattern 4 violation) together create the highest likelihood of model misbehavior at edge cases. Mechanically apply the Section 5 conversion table (Issue 3) and insert a `<tie_breaking>` block in `verify_completion` (Issue 4). Estimated effort: 15 minutes.

### 3. Add `<audience>` and `<quality_bar>` near the top
**Impact: Medium-High.** The workflow currently has no explicit audience (calling agent vs. human) or quality bar (Section 1 Actions 1–2). This matters because the subagent vs. standalone response distinction (Section 17) is entirely absent. The `${IS_SUBAGENT}` conditional pattern from the guide should govern transition message verbosity. Add the two tags as shown in Issue 2.

### 4. Extract `evolve_project` into its own module and remove `partial_completion` duplication
**Impact: Medium.** The `evolve_project` step (80+ lines, 5 concerns) violates Section 19 modularity. The `partial_completion` block duplicates `verify_completion` in violation of Section 11 Action 3. Splitting `evolve_project` into three sub-steps and removing the duplicate reduces prompt length, makes each concern independently testable, and eliminates a clear Section 10/11 violation. See Issues 6 and 7.

### 5. Replace relative paths in bash code blocks with absolute path enforcement
**Impact: Medium.** Section 17 explicitly requires absolute paths in agent output because `cwd` resets between bash calls. All bash snippets in the workflow use relative paths (`.planning/STATE.md`, `.planning/phases/XX-current/`). Add a `<constraints>` sub-rule: "All bash commands must construct absolute paths using `$(git rev-parse --show-toplevel)` or `$REPO_ROOT` — never assume cwd." This prevents silent failures when the workflow is invoked from a non-root working directory.
