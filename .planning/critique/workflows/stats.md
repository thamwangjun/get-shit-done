# Critique: stats.md

## Summary

`stats.md` is a short, well-intentioned workflow that accomplishes its core job — gathering and displaying project statistics — with reasonable clarity. It uses XML tags for top-level structure (`<purpose>`, `<process>`, `<step>`, `<success_criteria>`), provides a concrete output template, and keeps scope narrow. However, the prompt falls short on several guide fundamentals: the task specification omits an explicit audience and quality bar; there are no few-shot examples calibrating what "formatted clearly" means; the output format is described only with a single illustrative template rather than fully specified; there are no constraint or permission declarations; and the framing relies on passive or vague language in places where imperative present-tense instructions would be stronger. For a simple, low-stakes stats display workflow the gaps are tolerable, but the prompt would be materially more robust with a handful of targeted additions.

---

## Strengths

- **XML tagging applied (Section 4 Action 2).** Top-level sections are wrapped in semantically named XML tags (`<purpose>`, `<process>`, `<step name="...">`, `<success_criteria>`). The `name` attribute on `<step>` adds semantic meaning beyond mere delimiters.
- **Scope is narrow and consistent (Section 19 — Modularity).** The workflow has a single, clear responsibility: gather and display stats. It does not bleed into adjacent concerns such as editing plans or writing commits.
- **Concrete output template provided (Section 22 Pattern 3).** The markdown template in `<step name="present_stats">` shows field positions, emoji icons, table structure, and progress-bar format — giving the model a visual target rather than a vague description.
- **Fallback path specified (Section 5 — Conditional instructions).** "If no `.planning/` directory exists, inform the user to run `/gsd-new-project` first" is a well-placed conditional that handles the primary error case.
- **Success criteria included.** The `<success_criteria>` checklist gives a lightweight verification gate, consistent with the guide's pattern for phase completion tracking (Section 16).

---

## Issues

### Issue 1 — Missing audience and quality bar (Section 1 Actions 1–2)

**Principle:** Section 1 requires three task components: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a high-quality response looks like. It also requires an explicit audience.

**What's missing:** The `<purpose>` tag states what output is requested but says nothing about who consumes it, in what context, or what distinguishes a good stats display from a poor one. "Formatted clearly" in `<success_criteria>` is a qualitative descriptor — exactly what Section 21 warns against.

**Fix:** Add an `<audience>` tag and expand `<purpose>` or add a `<quality_bar>` tag:

```xml
<audience>
The developer who ran the command. They want a fast, scannable snapshot — not a
wall of text. They are already familiar with the project structure.
</audience>

<quality_bar>
A good response fits on one screen, uses the progress bar and table formats exactly
as templated, and surfaces all six data categories (progress, plans, phases,
requirements, git, timeline) without omissions.
</quality_bar>
```

---

### Issue 2 — No few-shot examples calibrating the output (Section 22 Pattern 2; Section 3)

**Principle:** Section 22 Pattern 2 states every abstract instruction should be paired with at least one calibrating example. The output template is close but stops short: it uses placeholder tokens (`X/Y`, `N`, `...`) rather than a rendered example that shows the model what acceptable output actually looks like.

**What's missing:** There is no filled-in example that demonstrates how the progress bar renders at, say, 60% completion, how the phase table handles a mix of completed and incomplete phases, or how to label a phase with zero plans.

**Fix:** Add a filled example inside the template or immediately after it:

```xml
<example>
# Project Statistics — v1.3 Auth Overhaul

## Progress
[██████░░░░] 3/5 phases (60%)

## Plans
7/10 plans complete (70%)

## Phases
| Phase | Name            | Plans | Completed | Status      |
|-------|-----------------|-------|-----------|-------------|
| 1     | DB Schema       | 3     | 3         | complete    |
| 2     | Auth Middleware  | 4     | 2         | in progress |
| 3     | UI Integration  | 3     | 2         | in progress |

## Requirements
✅ 8/12 requirements complete

## Git
- **Commits:** 47
- **Started:** 2026-01-15
- **Last activity:** 2026-04-29

## Timeline
- **Project age:** 104 days
</example>
```

---

### Issue 3 — Output format not fully specified; qualitative success criteria (Section 7; Section 21)

**Principle:** Section 7 Action 1 states structured output tasks should specify the required structure upfront and completely. Section 21 states size constraints must use numeric limits, not qualitative descriptors.

**What's missing:** "Results formatted clearly" is the only quality gate on the output shape. The template shows *a* format but does not specify: (a) what to do when a field is unavailable (e.g., `git_first_commit_date` is null), (b) the exact character width of the progress bar, (c) whether emoji are mandatory, and (d) a character or line count ceiling.

**Fix:** Add an `<output_format>` block with explicit rules:

```xml
<output_format>
Render the stats block exactly as templated. Additional rules:
- Progress bar: always 10 characters wide. Use █ for filled,░ for empty.
- If a field is unavailable (null or missing), display "—" in its place.
- Emoji icons (📊, ✅) are required as shown.
- The entire output must fit within 50 lines. If the phases table exceeds 20 rows,
  truncate to the first 20 and append: "(N more phases — run /gsd-list-phases to view all)"
- Do not add explanatory prose before or after the stats block.
</output_format>
```

---

### Issue 4 — Negative framing in `<required_reading>` (Section 5 Action 1)

**Principle:** Section 5 Action 1 requires converting negative or passive instructions to positive, imperative equivalents.

**What's missing:** The `<required_reading>` block reads: "Read all files referenced by the invoking prompt's execution_context before starting." This is passive and vague — "all files referenced" is unbounded, and "before starting" is an implicit gate rather than an explicit one.

**Fix:** Rewrite as an imperative with a concrete scope:

```xml
<required_reading>
Before gathering stats, read every file listed in the invoking prompt's
`execution_context`. Confirm all files are loaded before executing the bash block in
`<step name="gather_stats">`.
</required_reading>
```

---

### Issue 5 — No constraint or permission declaration (Section 14; Section 20)

**Principle:** Section 14 states every restriction should be paired with a concrete permission. Section 20 requires validation at system boundaries. For a workflow that executes bash commands (`gsd-sdk query`, `cat`), the absence of any `<constraints>` block leaves the permission boundary implicit.

**What's missing:** The workflow runs a shell command and reads a file but declares no allowed or disallowed actions. An agent running this prompt has no explicit signal about whether it may, for example, write files, run git commands, or escalate to subagents.

**Fix:** Add a minimal `<constraints>` block:

```xml
<constraints>
  <permitted>
    - Run the gsd-sdk query command as shown
    - Read files with cat
    - Display output to the user
  </permitted>
  <reserved_for_human_review>
    - Writing or modifying any file
    - Running git commands
    - Spawning subagents
  </reserved_for_human_review>
</constraints>
```

---

### Issue 6 — No explicit task instruction at prompt start (Section 8 Action 1)

**Principle:** Section 8 Action 1 states the task instruction must lead the prompt. Models attend most strongly to the beginning.

**What's missing:** The prompt opens with `<purpose>`, which describes intent, but not `<task>`, which instructs. The first directive the model sees is buried inside `<step name="gather_stats">`.

**Fix:** Prepend a `<task>` block before `<purpose>`:

```xml
<task>
Gather project statistics from the GSD SDK and display them to the user in the
standard stats format. Do not modify any files. Do not spawn subagents.
</task>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A where the checklist item is structurally inapplicable to a simple display workflow.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar absent |
| All constraints are compatible — no conflicts | PASS — no conflicts present |

### Chain of Thought
| Item | Score |
|------|-------|
| CoT included only for math/symbolic/multi-step logic | N/A — no CoT present; task does not require it |
| CoT trigger phrase used | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no examples provided |
| 2–5 examples total | FAIL — zero examples; a filled-in output example would directly improve quality |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction complete and clear before formatting | FAIL — no leading `<task>` tag; instruction is embedded in `<step>` |
| Prompt sections separated by semantically named XML tags | PASS — `<purpose>`, `<process>`, `<step>`, `<success_criteria>` all used |
| At least 3 format variants tested on target model | FAIL — no evidence of variant testing |

### Instruction Framing
| Item | Score |
|------|-------|
| Negative instructions converted to positive equivalents | FAIL — `<required_reading>` is passive rather than imperative |
| Priority order explicit when multiple criteria apply | N/A — single display path |
| Tie-breaking rules match domain cost asymmetry | N/A — no filtering or ranking task |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended/stylistic tasks | PASS — no persona; appropriate for a stats display task |
| Persona is specific | N/A |
| Persona descriptor is gender-neutral | N/A |

### Output Format
| Item | Score |
|------|-------|
| Structured output uses two-step reasoning-then-format | N/A — display only, no reasoning required |
| Single-call JSON places reasoning before answer fields | N/A |
| Constrained decoding adopted only after free-form + post-processing insufficient | N/A |
| Machine-parsed output uses exact format spec with literal strings | FAIL — template uses placeholder tokens; no literal string spec for the progress bar width or null handling |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction at start of prompt | FAIL — `<purpose>` leads, not `<task>` |
| Primary document or input at end | N/A — input is fetched at runtime, not passed in |
| Background context in middle | PASS — contextual notes (`<required_reading>`) precede steps |
| Irrelevant context removed | PASS — prompt is lean |
| Time-sensitive injected context labeled as snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Applied only to tasks with single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | PASS — prompt is short |
| RAG context is extracted passage only | N/A |

### System / User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — workflow file; not a system/user split prompt |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | N/A |

### Agent / Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS — prompt stands alone |
| All file paths in agent output are absolute | N/A — no file paths in output |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic single-responsibility modules | PASS — single responsibility: display stats |
| Template variables use `${VARIABLE_NAME}` syntax | N/A — no template variables needed |
| Modules compose at runtime via variable substitution | N/A |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with equally concrete permission | FAIL — no `<constraints>` block |
| Hard exclusion lists enumerated, not qualitative | FAIL — no exclusions declared |
| Known edge cases have precedent-style rulings | FAIL — no handling for missing/null fields beyond "if no .planning/ directory" |
| Confidence thresholds numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or table | N/A |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | FAIL — no reversibility framing; bash command runs without an explicit confirmation or reversibility note |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | PASS — two named `<step>` blocks |
| Required steps distinguished from type-specific | N/A |
| Scenario-based branching handles multiple paths | FAIL — only one conditional handled (missing `.planning/` dir); null/missing individual fields unhandled |

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
| Scope boundaries state both inclusions and exclusions | FAIL — `<purpose>` states what the workflow does but not what it explicitly excludes |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only | N/A |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped; confirm before expanding | FAIL — no authorization scope stated |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — "formatted clearly" is qualitative |
| Instructions use imperative present tense | FAIL — `<required_reading>` is passive |
| Working notes in analysis tags, not user-facing output | PASS — no extraneous notes surfaced to user |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | FAIL — not flagged |
| Correct optimizer selected | FAIL — not selected |
| Held-out test set reserved | FAIL — not mentioned |

---

## Recommendations

Prioritized from highest-leverage to lowest:

**1. Add `<task>`, `<audience>`, and `<quality_bar>` tags (Sections 1 and 8 Action 1)**
The prompt has no leading task instruction and no audience or quality bar. This is the highest-priority gap. A `<task>` tag at the top gives the model its primary directive at peak attention; `<audience>` and `<quality_bar>` complete the three task components required by Section 1. Combined, these three additions will reduce response variance the most per word added.

**2. Add a filled-in output example (Section 22 Pattern 2; Section 3)**
The template uses placeholder tokens. Replace or supplement it with a single fully rendered example showing the progress bar at a representative fill level, a mixed-status phases table, and a null field rendered as "—". This calibrates the model against an observable standard rather than a qualitative instruction.

**3. Specify the output format completely with numeric constraints (Sections 7 and 21)**
Add an `<output_format>` block that specifies progress bar width in characters, null-field rendering, whether emoji are mandatory, and a line-count ceiling. "Formatted clearly" must become "fits within 50 lines; progress bar is always 10 characters wide."

**4. Add a `<constraints>` block declaring permitted and reserved actions (Section 14)**
The prompt executes a bash command and reads a file but declares no permission boundaries. A minimal `<constraints>` block with `<permitted>` (sdk query, cat, display) and `<reserved_for_human_review>` (writes, git, subagents) closes the permission gap with approximately five lines of text.

**5. Expand the conditional branching to cover null/missing fields (Section 16 — Scenario-based branching)**
Only one error path is handled (missing `.planning/` directory). Add a second scenario covering the case where `stats.json` is present but individual fields are null or absent, specifying exactly how each field should render in that case. This prevents silent omissions in the output.
