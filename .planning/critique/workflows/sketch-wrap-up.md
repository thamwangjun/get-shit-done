# Critique: sketch-wrap-up.md

## Summary

`sketch-wrap-up.md` is a well-structured, operationally complete workflow that covers its end-to-end process clearly. Its step names, embedded templates, and success criteria give a competent implementer a reliable path to follow. However, it is written primarily in markdown prose and free-form lists rather than the semantic XML tag vocabulary the guide mandates. The prompt lacks an explicit `<task>`, `<audience>`, and `<quality_bar>` declaration; it supplies no persona; it uses no XML constraint blocks; and its output-format specifications inside step templates are implicit rather than machine-parseable. Several instructions are phrased in negative or passive form when positive equivalents are available. The workflow is a strong operational draft that needs a structural pass to meet guide standards.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** Each step is wrapped in a named `<step name="...">` tag, creating cognitive phase boundaries and preventing steps from bleeding together.
- **Section 13 (Template Variables) — Consistent placeholder syntax.** `[project-dir-name]`, `{N}`, and `{NNN}` placeholders are used consistently throughout file templates, making substitution points unambiguous.
- **Section 16 — Required vs. optional steps distinguished.** The `<success_criteria>` checklist at the end cleanly separates mandatory outputs from descriptive prose.
- **Section 22 Pattern 3 — Output format specified with concrete examples.** The SKILL.md and WRAP-UP-SUMMARY.md templates embed field-level examples inline, so the model knows exactly what each field should contain.
- **Section 5 (Conditional Instructions) — Conditional branching is explicit.** "If no unprocessed sketches exist… Exit" and "If 'Let me look at it'… If 'Partial'…" branches are stated in clear conditional form.
- **Section 19 (Modularity) — Single responsibility.** The workflow handles exactly one concern: packaging sketch findings into a persistent skill. It does not creep into adjacent concerns (planning, execution, review).
- **Section 16 — Status/progress reporting included.** The `report` step provides a structured completion banner with counts and paths, giving the user clear observable output.

---

## Issues

### Issue 1 — Missing `<task>`, `<audience>`, and `<quality_bar>` declaration
**Principle:** Section 1 Action 1 — Extract the three task components; Section 1 Action 2 — Identify and encode the audience.

**What's missing:** The workflow opens with a `<purpose>` tag that describes what the skill does, but there is no explicit statement of (a) what output is being requested of the model, (b) who will consume that output, or (c) what a correct execution looks like from the model's perspective. The `<purpose>` block is project documentation, not a prompt instruction.

**Concrete fix:** Add at the top of the file, before `<process>`:

```xml
<task>
You are curating sketch design experiments and packaging validated decisions into a
persistent project skill. Execute each step in <process> in order.
</task>

<audience>
A developer who ran /gsd-sketch to produce UI design variants and now wants to
consolidate winners into a reusable reference. They have reviewed the sketches but
need the model to drive the curation conversation and produce the skill artifacts.
</audience>

<quality_bar>
Execution is correct when: every unprocessed sketch has been presented for individual
curation, user decisions are faithfully recorded, reference files contain actionable
CSS and HTML patterns (not summaries), and the generated skill is immediately usable
by a future /gsd-ui-phase invocation without additional context.
</quality_bar>
```

---

### Issue 2 — No persona assigned
**Principle:** Section 6 Action 1 — Classify task type before assigning persona; Section 6 Action 2 — Make personas specific; Section 22 Pattern 1 — Role identity scoped to exact domain.

**What's missing:** The workflow drives an interactive curation conversation requiring a specific facilitation register — asking decision questions, summarizing findings, synthesizing patterns. No persona is present, so the model defaults to generic assistant behavior. For this task, a domain-scoped persona measurably narrows register and style.

**Concrete fix:**

```xml
<persona>
You are a design systems curator. Your job is to extract validated visual decisions
from raw sketch experiments and distill them into clean, implementation-ready reference
patterns. You facilitate decisions concisely, ask one question at a time, and write
reference files a frontend engineer can act on directly — not design commentary.
</persona>
```

---

### Issue 3 — Instruction framing uses prose lists instead of XML constraint blocks
**Principle:** Section 4 Action 2 — Use XML tags to separate prompt sections; Section 14 — Explicit permission pairs; Section 4 XML tag vocabulary.

**What's missing:** Behavioral rules across multiple steps (what to copy, what to exclude, what to skip) are written as indented markdown bullets rather than structured `<constraints>` blocks. This makes permitted and excluded actions ambiguous and machine-hard to audit.

**Concrete fix:** The `copy_sources` step's exclusion rule should be:

```xml
<constraints>
  <permitted>
    - Copy the winning variant's HTML file into sources/NNN-sketch-name/
    - Copy the winning theme.css into sources/themes/
  </permitted>
  <exclusions>
    - node_modules/
    - Build artifacts (dist/, .cache/, out/)
    - .DS_Store and OS metadata files
  </exclusions>
</constraints>
```

Apply the same pattern to the `gather` step's filtering rules (what counts as "processed") and the `write_skill` step's append-vs-create logic.

---

### Issue 4 — Negative instruction in `synthesize` step's "What to Avoid" section label
**Principle:** Section 5 Action 1 — Convert negative instructions to positive equivalents.

**What's missing:** The synthesize step includes a `## What to Avoid` section header in the generated reference file template. While "what to avoid" is a useful design concept, the instruction directing the model to populate it is framed as a negative category rather than a positive one.

**Concrete fix:** Rename the template section to `## Rejected Directions` and change the instruction text from:

> `[Design directions that were tried and rejected. Why they didn't work.]`

to:

> `[Design directions evaluated and set aside. For each: the approach tried, the specific problem it caused, and what the accepted alternative addresses instead.]`

This is a positive specification of what to write, not a label for things to avoid.

---

### Issue 5 — Output format for the curate-step checkpoint is not machine-parseable and lacks a tie-breaking rule
**Principle:** Section 7 — Output Format Handling (machine-parsed output specification); Section 5 — Tie-breaking instructions matched to domain's cost asymmetry; Section 22 Pattern 3 — Output format specified completely and upfront.

**What's missing:** The `curate` step presents a checkbox-style decision (`Include / Exclude / Partial / Let me look at it`) but does not specify how the model should record the user's response, what happens if the user's input is ambiguous, or whether the default should favor inclusion or exclusion. Given the context (design decisions feed into future implementation), the cost asymmetry favors inclusion — over-capturing is cheaper than discarding a valid design decision.

**Concrete fix:** Add after the decision prompt:

```xml
<output_format>
Record the user's curation decision as one of exactly four tokens:
  INCLUDE | EXCLUDE | PARTIAL | REVIEW

If the user's response is ambiguous (e.g., "maybe", "probably yes", "I'm not sure"),
treat it as REVIEW and return the sketch for another pass.
</output_format>

<tie_breaking>
When the user is on the fence between INCLUDE and EXCLUDE, default to INCLUDE.
Missing a useful design decision is more costly than carrying forward an extra one.
</tie_breaking>
```

---

### Issue 6 — No priority ordering for the synthesize step when decisions conflict
**Principle:** Section 5 — Priority ordering; Section 14 — Constraint enforcement when inputs conflict.

**What's missing:** The `synthesize` step instructs the model to write "what was chosen, why it won over alternatives, the key visual properties." When two included sketches in the same design area made contradictory decisions (e.g., two different border-radius values), there is no rule for which wins.

**Concrete fix:** Add a priority block to the synthesize step:

```xml
<priority_order>
When two included sketches in the same design area contain conflicting decisions:
  1. The sketch marked WINNER by the user during curation takes precedence
  2. The sketch with the higher number (later in the series) takes precedence
  3. If still tied, surface the conflict as a note in the reference file under
     ## Open Questions rather than silently picking one
</priority_order>
```

---

### Issue 7 — `<required_reading>` is vague and not actionable
**Principle:** Section 1 Action 1 — Make task components explicit; Section 10 Action 4 — Trim context to what is directly relevant.

**What's missing:** The `<required_reading>` block says "Read all files referenced by the invoking prompt's execution_context before starting." This is circular — it refers to a context that may or may not exist and does not specify which files are always required vs. conditionally required.

**Concrete fix:** Replace with:

```xml
<required_reading>
Before starting, read in this order:
1. `.planning/sketches/MANIFEST.md` — required; contains design direction and reference points
2. All `.planning/sketches/*/README.md` files — required; parsed for frontmatter
3. `./.claude/skills/sketch-findings-*/SKILL.md` — required only if it exists (append mode detection)

If MANIFEST.md does not exist, inform the user and exit:
"No sketch manifest found. Run /gsd-sketch first."
</required_reading>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `sketch-wrap-up.md` as a prompt artifact.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` documents the skill; no `<task>`, `<audience>`, or `<quality_bar>` for the model |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |

### Chain-of-Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math/symbolic/multi-step logic tasks | N/A | No CoT trigger present; task does not require one |
| CoT trigger used correctly | N/A | Not applicable |
| Reasoning elicited before answer | N/A | Not applicable |
| CoT traces treated as heuristic | N/A | Not applicable |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples; task is procedural |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete and clear before formatting | PASS | Steps are fully specified before template examples |
| Prompt sections separated by semantically named XML tags | FAIL | Steps use `<step name="...">` but constraint/permission blocks, task, audience, quality_bar all missing |
| At least 3 format variants will be tested | N/A | Evaluation regime not in scope of this workflow file |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | "What to Avoid" section label; "Exclude node_modules, build artifacts, .DS_Store" (exclusion list without paired permissions) |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering for conflicting design decisions across sketches |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for Include/Exclude decisions at the margin |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | FAIL | Task is stylistic/facilitative; no persona assigned at all |
| Persona is specific (constrains voice/register) | FAIL | No persona |
| Persona descriptor is gender-neutral | N/A | No persona |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output uses two-step reasoning-then-format | PASS | Curation steps elicit decisions before writing artifacts |
| Single-call JSON places reasoning fields before answer fields | N/A | No JSON output |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Include/Exclude/Partial/Review responses have no exact token specification or parsing contract |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | FAIL | `<purpose>` is at the start but is documentation, not an instruction; `<required_reading>` comes second |
| Primary document/input at end of prompt | PASS | `<success_criteria>` and process close the file |
| Background context in middle | PASS | Step-level content is sandwiched between purpose and criteria |
| All irrelevant context removed | PASS | No apparent filler |
| Time-sensitive injected context labeled as snapshot | N/A | No runtime context injection |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | Not applicable |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| Long prompts compressed before sending | N/A | Not a RAG context |
| RAG context is extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Single-file workflow; no system/user split |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions found |
| Safety-critical constraints have external validation | N/A | No safety-critical constraints |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PASS | Workflow is self-contained; references only predictable paths |
| All file paths in agent output are absolute | FAIL | Paths like `.planning/sketches/` and `./.claude/skills/` are relative |
| Parallel agents launched in a single message block | N/A | No parallel agents |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic modules | PASS | Workflow is a single-concern document |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL | Uses `[project-dir-name]` bracket syntax and `{N}` brace syntax inconsistently; not `${VAR}` syntax |
| Modules compose at runtime via variable substitution | FAIL | No runtime variable injection; placeholders are static text |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with an equally concrete permission | FAIL | `copy_sources` lists exclusions without pairing permitted inclusions |
| Hard exclusion lists are enumerated, not described qualitatively | PASS | node_modules, build artifacts, .DS_Store are enumerated |
| Known edge cases have precedent-style rulings | FAIL | Conflicting decisions across sketches not handled; append-mode edge case described but not as a structured precedent |
| Confidence thresholds are numeric, not qualitative | N/A | No filtering by confidence |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | Include/Exclude/Partial/Review branches are explicit |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist present |
| Action permissions framed around reversibility | FAIL | Commit step (irreversible git commit) has no confirmation gate |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | All steps use `<step name="...">` |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` vs. type-specific separation; `required_reading` is a partial substitute |
| Scenario-based branching handles multiple paths explicitly | PASS | Append mode, no-sketches-found, and partial-include branches all handled |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | PASS | SKILL.md template uses XML tags (`<context>`, `<design_direction>`, `<findings_index>`, `<metadata>`) |
| Compaction summaries include discoveries and failed approaches | FAIL | WRAP-UP-SUMMARY.md template includes excluded sketches but no field for why decisions were made or what was rejected and why |
| Next steps tied to user's most recent explicit request | PASS | Report step's "Next Up" section directly routes to `/gsd-plan-phase` |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has a single responsibility | PASS | |
| Scope boundaries state both inclusions and exclusions | FAIL | No explicit `<scope><include>` / `<scope><exclude>` block defining what this workflow covers and does not cover |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only | PASS | No over-validation of internal steps |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capabilities |
| Authorization narrow-scoped; each action confirmed before expanding scope | FAIL | The `update_claude_md` step modifies a project-wide file without a confirmation gate |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | No output size constraints specified anywhere in the workflow |
| Instructions use imperative present tense | PASS | "Read", "Glob", "Copy", "Write", "Commit" — consistently imperative |
| Working notes in analysis tags, not user-facing output | N/A | No internal reasoning steps that need hiding |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag |
| Correct optimizer selected | N/A | Not flagged |
| Held-out test set reserved | N/A | Not flagged |

---

## Recommendations

Prioritized by impact on execution reliability:

1. **Add `<task>`, `<audience>`, and `<quality_bar>` at the top of the file (Issue 1 — Section 1 Actions 1–2).** This is the highest-leverage fix. Without an explicit task declaration, the model treats the workflow as documentation to describe rather than instructions to execute. Takes under 10 lines to add and immediately anchors model behavior.

2. **Add a persona with domain-specific register constraints (Issue 2 — Section 6 Actions 1–2, Section 22 Pattern 1).** The curation conversation requires a facilitation style the model will not adopt by default. A specific persona ("design systems curator") scopes the register to concise, decision-focused facilitation rather than broad assistant behavior.

3. **Add a `<tie_breaking>` rule and machine-parseable output format to the `curate` step (Issue 5 — Section 5 Tie-breaking, Section 7 Machine-parsed output).** The Include/Exclude/Partial/Review decision is the core interaction loop. Leaving it unspecified creates variance in how the model records decisions and how it handles ambiguous user input — exactly the margin where quality degrades.

4. **Add a `<priority_order>` block for conflicting design decisions in the `synthesize` step (Issue 6 — Section 5 Priority ordering, Section 14 Constraint enforcement).** Two included sketches contradicting each other in the same design area is a predictable edge case. Without a priority rule, the model will silently pick one or produce inconsistent reference files across runs.

5. **Convert `<constraints>` in `copy_sources`, `gather`, and `update_claude_md` to paired `<permitted>` / `<exclusions>` blocks, and add a confirmation gate before `update_claude_md` modifies CLAUDE.md (Issues 3 and safety/trust — Section 14 Explicit permission pairs, Section 15 Reversibility framework).** Modifying a project-wide configuration file without a user confirmation is an irreversible, externally visible action. It needs a `<confirm_with_user>` gate matching Section 15's reversibility framework.
