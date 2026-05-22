# Critique: code-review.md

## Summary

The `code-review.md` workflow is a well-engineered orchestration document with excellent defensive programming, a clear three-tier scoping mechanism, and solid failure handling throughout. As a procedural workflow file its primary job is to direct an LLM orchestrator, but it falls short of the guide's standards in several important areas: it lacks a formal persona, has no explicit XML-tagged output format for the orchestrating model, uses almost no positive-framing language, skips quality bar and audience declarations, and has no few-shot examples to calibrate the sub-agent prompt it constructs. The inline bash blocks are appropriately detailed but the top-level prompt framing is thin — the `<purpose>` and `<step>` tags carry semantic meaning but the surrounding instruction scaffolding does not follow the guide's patterns for task specification, constraint enforcement, or context placement.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern:** Steps are organized as explicit, named `<step>` elements with `name` attributes, creating clear cognitive boundaries. The sequence (initialize → check_config → resolve_depth → compute_file_scope → check_empty_scope → spawn_reviewer → commit_review → present_results) follows a logical, phase-like progression.

- **Section 14 (Constraint Enforcement) — Explicit precedence ordering:** The three-tier file scoping (`--files override > SUMMARY.md > git diff`) is stated with explicit priority, matching the guide's pattern of enumerating precedence rather than leaving it ambiguous.

- **Section 14 (Constraint Enforcement) — Hard exclusion lists:** The `compute_file_scope` step enumerates specific exclusion patterns (`.planning/`, `ROADMAP.md`, `STATE.md`, `*-SUMMARY.md`, etc.) rather than describing them qualitatively — exactly as the guide recommends.

- **Section 20 (Safety and Trust Patterns) — Validation at system boundaries:** Path traversal validation (`ABS_PATH != REPO_ROOT*`) and YAML frontmatter validation before committing are applied at external input boundaries. Internal logic is trusted without redundant checks.

- **Section 16 — Required vs. optional steps / fail-closed behavior:** The workflow distinguishes mandatory checks (phase validation before config gate) from optional flows (commit if `COMMIT_DOCS=true`), and explicitly fails closed on ambiguous states (no agent spawn on empty scope, no commit on malformed REVIEW.md).

- **Section 19 (Modularity) — Scope boundaries:** The `<success_criteria>` checklist at the bottom explicitly enumerates what the workflow must accomplish, functioning as an inclusion list. The exclusion patterns in `compute_file_scope` function as an exclusion list.

- **Section 22, Pattern 9 — Minimum required permissions:** The agent spawning block passes only the exact fields the sub-agent needs (`files_to_read`, `config`, `depth`, `review_path`, `diff_base`), avoiding over-permission of context.

---

## Issues

### Issue 1 — No persona defined for the orchestrating model

**Guide reference:** Section 6 Action 1 and Action 2; Section 22 Pattern 1.

**What is missing:** The workflow has no `<persona>` block. The orchestrator is left to default to generic assistant behavior. For a code-review orchestration workflow, the guide recommends a specific, domain-scoped role: the role constrains decision-making style (e.g., prioritizing completeness over speed, being skeptical of malformed outputs) rather than just tone.

**Concrete fix:**
```xml
<persona>
You are a code review orchestrator for a software development workflow.
Your job is to determine the correct file scope, spawn a focused reviewer,
and surface findings clearly — not to perform the review yourself.
Fail closed on ambiguous inputs: when scope cannot be determined reliably,
report the gap and exit rather than guessing.
</persona>
```

---

### Issue 2 — Task specification lacks intent, audience, and quality bar

**Guide reference:** Section 1 Actions 1, 2, and 3; Section 23 checklist item `<task_specification>`.

**What is missing:** The `<purpose>` tag gives a one-sentence description, but it does not encode: (a) what a high-quality orchestration run looks like (quality bar), (b) who consumes the output (audience — is it a developer reading a terminal, a CI pipeline parsing output, or another agent?), or (c) what success looks like beyond the checklist. Without these, the model's priors fill the gaps unpredictably.

**Concrete fix:** Replace or augment `<purpose>` with a fully specified task block:
```xml
<task>
Orchestrate a code review for a completed GSD phase. Determine which source files
changed, spawn the gsd-code-reviewer agent with the correct scope and depth, and
present a structured inline summary to the developer in the terminal.
</task>

<audience>
A software developer using Claude Code in a terminal. They want to know which files
were reviewed, the count of findings by severity, and what to do next. They are not
reading raw agent output — surface only the structured summary.
</audience>

<quality_bar>
A correct run: validates the phase exists, resolves file scope without ambiguity,
spawns exactly one reviewer agent, commits REVIEW.md only when it has valid frontmatter,
and presents a summary with finding counts and a next-step suggestion.
</quality_bar>
```

---

### Issue 3 — Sub-agent prompt has no few-shot examples and no output format specification for the caller

**Guide reference:** Section 3 Actions 1–5; Section 7 Action 1; Section 22 Patterns 2 and 3.

**What is missing:** The prompt constructed and passed to `gsd-code-reviewer` contains only a `<files_to_read>` block, a `<config>` YAML block, and a one-line imperative. There are no examples showing what a well-formed REVIEW.md looks like (Section 3), no illustration of target depth ("standard" means nothing to the model without calibration), and no `<output_format>` specifying the exact YAML frontmatter the commit step later validates against. The orchestrator then validates for a `status:` field — a requirement nowhere stated in the agent's prompt.

**Concrete fix:** Add an `<output_format>` block and at least one calibrating example to the sub-agent prompt:
```xml
<output_format>
Write findings to ${REVIEW_PATH} as a markdown file with YAML frontmatter.
The frontmatter must include exactly these fields — they are parsed by the orchestrator:

---
status: clean | issues_found
files_reviewed: <integer>
findings:
  critical: <integer>
  warning: <integer>
  info: <integer>
  total: <integer>
---

Each finding uses a header of the form `### CR-001` (critical) or `### WR-001` (warning).
Do NOT commit the file — the orchestrator commits it.
</output_format>

<examples>
  <example>
    <input>depth: quick, 2 files, no issues found</input>
    <output>
---
status: clean
files_reviewed: 2
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
---
    </output>
  </example>
</examples>
```

---

### Issue 4 — Negative instructions not converted to positive equivalents

**Guide reference:** Section 5 Action 1.

**What is missing:** The workflow contains multiple negatively framed directives as primary instructions:
- "Do NOT spawn agent or create REVIEW.md" (check_empty_scope step)
- "Do NOT proceed to commit_review step" (agent failure handling)
- "Do NOT commit the output — the orchestrator handles that" (sub-agent prompt)

While the reframe pattern (Section 6) allows a negative clause when displacing a prior, these are not reframes — they are primary directives that should be expressed positively.

**Concrete fix:**
```
# Before
Do NOT spawn agent or create REVIEW.md.

# After
Exit workflow cleanly. Agent spawn and REVIEW.md creation require a non-empty file scope.
```
```
# Before
Do NOT commit the output — the orchestrator handles that.

# After
Write findings to ${REVIEW_PATH} only. The orchestrator handles committing.
```

---

### Issue 5 — No explicit tie-breaking rule for depth selection uncertainty

**Guide reference:** Section 5 (Tie-breaking instructions); Section 22 Pattern 4.

**What is missing:** The `resolve_depth` step defaults to `standard` when neither a `--depth` flag nor a config value is present, but there is no tie-breaking rule for the boundary case: what should happen when `REVIEW_DEPTH` is set to an unrecognized value that is close to a valid one (e.g., `"thorough"` instead of `"deep"`)? The current handling silently resets to `standard`. For a code-review context where under-review is the more expensive error, the tie-breaking rule should be stated explicitly and should prefer the deeper option rather than always falling back to `standard`.

**Concrete fix:** Add a tie-breaking instruction to the `resolve_depth` step:
```xml
<tie_breaking>
When depth cannot be determined (invalid value, missing config, missing flag),
default to "standard" not "quick". A slightly slower review that catches more
issues is preferable to a fast review that misses them.
</tie_breaking>
```
And update the validation branch to log the substitution explicitly so the developer knows what depth was used.

---

### Issue 6 — Context placement does not follow task-first, input-last ordering

**Guide reference:** Section 8 Actions 1, 2, and 3.

**What is missing:** The sub-agent prompt constructed in `spawn_reviewer` places `<files_to_read>` first and `<config>` second, then appends a one-line instruction last. Per the guide, the task instruction must lead (highest attention) and the primary content to act on (the file list) should close the prompt. The current ordering puts the files — the primary input — at the start, where recency bias works against it.

**Concrete fix:** Reorder the sub-agent prompt:
```xml
<!-- Task leads — highest attention position -->
Review the listed source files at ${REVIEW_DEPTH} depth. Write findings to ${REVIEW_PATH}.
Do NOT commit the output — the orchestrator handles that.

<!-- Config in middle — supplementary context -->
<config>
depth: ${REVIEW_DEPTH}
phase_dir: ${PHASE_DIR}
review_path: ${REVIEW_PATH}
${DIFF_BASE:+diff_base: ${DIFF_BASE}}
</config>

<!-- Files close the prompt — recency bias serves the primary input -->
<files_to_read>
${FILES_TO_READ}
</files_to_read>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items not applicable to a workflow orchestration file are marked N/A.

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit | FAIL — only a one-sentence `<purpose>` exists; audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS — depth/scope/commit constraints are internally consistent |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT included only for math/symbolic/multi-step logic tasks | N/A — not applicable to an orchestration workflow |
| CoT trigger phrase used | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces flagged as heuristic | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | FAIL — no examples present |
| 2–5 examples total | FAIL — zero examples |
| Ordered simple → complex | FAIL — zero examples |
| Examples span diverse sub-types | FAIL — zero examples |
| Format consistent across examples | FAIL — zero examples |
| Example order fixed across evaluation runs | FAIL — zero examples |

### Formatting
| Item | Score |
|------|-------|
| Instruction complete and clear before formatting applied | FAIL — the one-line sub-agent instruction is appended after the context blocks |
| Prompt sections separated by semantically named XML tags | PASS — `<step name="...">` tags are used consistently; `<files_to_read>` and `<config>` appear in the agent prompt |
| At least 3 format variants tested on target model | FAIL — no evidence of format variant testing |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions converted to positive equivalents | FAIL — multiple "Do NOT" primary directives present |
| Priority order explicit when multiple criteria apply | PASS — three-tier scoping explicitly enumerates priority |
| Tie-breaking rules match domain's cost asymmetry | FAIL — fallback to "standard" is not argued from cost asymmetry |

### Persona
| Item | Score |
|------|-------|
| Persona included only for open-ended or stylistic tasks | FAIL — no persona defined; task is open-ended enough to benefit from one |
| Persona is specific (constrains voice/register) | FAIL — no persona present |
| Persona descriptor is gender-neutral | N/A — no persona present |

### Output Format
| Item | Score |
|------|-------|
| Structured output uses two-step reasoning-then-format | FAIL — sub-agent prompt has no `<output_format>` block |
| Single-call JSON places reasoning before answer fields | N/A |
| Constrained decoding adopted only after free-form insufficient | N/A |
| Machine-parsed output uses exact format spec with literal strings | FAIL — REVIEW.md frontmatter is validated by the orchestrator but never specified to the agent |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction at start of prompt | FAIL — sub-agent prompt puts `<files_to_read>` first, instruction last |
| Primary document or input at end of prompt | FAIL — files are placed first, not last |
| Background context in middle | FAIL — `<config>` is second; instruction is last; ordering is inverted |
| All irrelevant context removed | PASS — no boilerplate or tangential content present |
| Time-sensitive injected context labeled as snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context removed | PASS — no redundant instructions; each concern stated once |
| Long prompts compressed before sending | N/A — prompt is not long |
| RAG context is extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions in system prompt | N/A — single-file workflow, not a system/user split context |
| Task-specific instructions in user prompt | N/A |
| Each instruction in exactly one location | PASS — no duplication found |
| Safety-critical constraints have external validation | PASS — REVIEW.md frontmatter validated independently before commit |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts fully self-contained | PARTIAL — files and depth are passed but output format is not |
| All file paths in agent output are absolute | PASS — `REVIEW_PATH` is an absolute path derived from `PHASE_DIR` |
| Parallel agents launched in single message block | N/A — single agent spawn |
| Adversarial probes specified for verification agents | N/A — this is a code review, not a verification agent |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts decomposed into atomic modules | PASS — the workflow delegates to a separate `gsd-code-reviewer` agent |
| Template variables use `${VARIABLE_NAME}` syntax | PASS — consistent use throughout |
| Modules compose at runtime via variable substitution | PASS |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction paired with equally concrete permission | FAIL — restrictions (do not commit, do not spawn on empty scope) lack paired permission statements |
| Hard exclusion lists enumerated, not qualitative | PASS — file exclusions are enumerated as exact patterns |
| Known edge cases have precedent-style rulings | PARTIAL — macOS `realpath` fallback is noted; no precedent-style XML rulings |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use decision tree or table | PASS — three-tier scoping uses explicit precedence; depth validation uses a case statement |
| Criteria checklists gate complex approaches | PASS — `<success_criteria>` checklist gates the workflow |
| Action permissions framed around reversibility | PARTIAL — commit is gated on COMMIT_DOCS flag but reversibility framing is not explicit |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks organized into explicit named phases | PASS — `<step name="...">` pattern used consistently |
| Required steps distinguished from type-specific steps | PASS — platform notes and config-gated steps are distinguished from universal steps |
| Scenario-based branching handles multiple paths explicitly | PASS — empty scope, malformed REVIEW.md, and agent failure are each handled as explicit branches |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | PASS — `present_results` step provides explicit next-step commands |

### Modularity
| Item | Score |
|------|-------|
| Each component has single responsibility | PASS — orchestration, review, and commit are separated across steps and agents |
| Scope boundaries state both inclusions and exclusions | PARTIAL — inclusions are in `<success_criteria>`; exclusions are in the file filtering block but not in a unified `<scope>` tag |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation at system boundaries only; internals trusted | PASS |
| Dual-use capabilities state permissions before restrictions | FAIL — restrictions stated without paired permissions |
| Authorization narrow-scoped; confirm before expanding | PASS — commit is explicitly gated on `COMMIT_DOCS` flag |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits | PASS — `>50 files` threshold is a concrete numeric limit |
| Instructions use imperative present tense | PARTIAL — most step descriptions use imperative, but some use passive ("is set", "is provided") |
| Working notes in analysis tags, not user-facing output | N/A |

### Optimization
| Item | Score |
|------|-------|
| Prompt flagged as draft for automated optimization | FAIL — no optimization flag or candidate annotation |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved before optimization | FAIL — not addressed |

---

## Recommendations

Prioritized from highest to lowest impact:

**1. Add output format specification to the sub-agent prompt (Issue 3)**
This is the highest-risk gap. The orchestrator validates REVIEW.md for a `status:` field that is never told to the agent. If the agent produces a different schema, the commit step silently skips or warns. Add a `<output_format>` block with the exact frontmatter schema and at least one minimal example. This directly closes the schema contract gap and satisfies Section 7 Action 1, Section 22 Patterns 2 and 3, and the Section 23 output_format checklist items. Estimated to prevent silent agent output mismatch failures.

**2. Invert sub-agent prompt ordering to task-first, input-last (Issue 6)**
The current ordering places `<files_to_read>` first and the one-line instruction last. Per Section 8, the task instruction must lead and the primary content must close the prompt. This is a low-effort, high-leverage change that improves the agent's attention distribution without changing any logic.

**3. Define a persona for the orchestrating model (Issue 1)**
Without a persona, the orchestrator defaults to generic assistant behavior. A concise role declaration (orchestrator, fail-closed, not the reviewer) aligns the model's priors with the workflow's intent and reduces the chance of the orchestrator attempting to review code itself. Satisfies Section 6 Action 2 and Section 22 Pattern 1.

**4. Convert negative primary directives to positive equivalents (Issue 4)**
Phrases like "Do NOT spawn agent" and "Do NOT commit" are primary directives, not reframe clauses. Rewrite them as positive specifications of the intended behavior per Section 5 Action 1. This is a low-effort mechanical change with measurable reliability benefit — positively framed instructions produce more consistent compliance in instruction-tuned models.

**5. Add audience and quality bar to the top-level task specification (Issue 2)**
The `<purpose>` tag is a partial task specification. Adding explicit `<audience>` and `<quality_bar>` blocks anchors the orchestrator's output to the developer's terminal context and defines what a correct run looks like. Satisfies Section 1 Actions 1 and 2 and the Section 23 task_specification checklist. This is a documentation-level change that costs little to implement and prevents the orchestrator from over-explaining or under-reporting results.
