# Critique: fast.md

## Summary

`fast.md` is a lean, well-scoped workflow that successfully achieves its core design goal: a low-overhead path for trivial inline edits. Its use of XML tags for structural separation, a clear scope-check gate, and concrete success criteria all reflect good prompt engineering hygiene. However, the workflow has several gaps relative to the guide: it relies on negative instructions where positive equivalents would be stronger, omits a persona entirely (appropriate for this task type, but the absence is not acknowledged), lacks explicit output format specification for the report step, and uses qualitative scope criteria ("≤ 1 minute") alongside quantitative ones in a way that creates ambiguity. The commit step also uses `git add -A` unconditionally, which couples the workflow to an assumption about working-tree state that can break silently. None of these issues undermine the workflow's utility in common cases, but they introduce edge-case brittleness and deviate from guide principles in ways that matter at scale.

---

## Strengths

- **Section 4 Action 2 (XML tags for section separation):** The workflow correctly uses semantically named XML tags — `<purpose>`, `<process>`, `<step>`, `<guardrails>`, `<success_criteria>` — to separate concerns. Each tag name describes what its section *is*, not just where it starts.

- **Section 14 (Constraint enforcement — explicit permission pairs):** The `<guardrails>` section is paired with the `<success_criteria>` section, which together define what the agent must not do and what "done" looks like. This is close to the guide's pattern of pairing restrictions with what is permitted.

- **Section 1 Action 1 (Task components are present):** The `<purpose>` block identifies what output is produced, why it exists (no subagent overhead), and what a correct result looks like (examples given). The task components are explicit and correctly placed at the top of the file.

- **Section 8 Action 1 (Task instruction at the start):** The `<purpose>` block leads the prompt, correctly exploiting high-attention placement at the top of context.

- **Section 16 (Multi-phase workflow structure):** The `<process>` block decomposes the task into named, sequential steps (`parse_task`, `scope_check`, `execute_inline`, `commit`, `log_to_state`, `done`), each with a clear exit condition. This follows the phase pattern from Section 16.

- **Section 5 (Conditional instructions):** The `scope_check` step uses explicit conditional branching: "if the task seems non-trivial... say [X] and stop." The redirect message is concrete rather than vague.

- **Section 21 (Size constraints with numeric limits):** The trivial-task criteria use numeric values where possible (≤ 3 file edits, ≤ 1 minute, ≤ 1 minute wall time), following the guide's preference for numeric over qualitative descriptors.

---

## Issues

### Issue 1: Negative instructions in `<guardrails>`

**Guide reference:** Section 5 Action 1 — Convert negative instructions to positive equivalents.

**What's wrong:** Every guardrail is written as a prohibition: "NEVER spawn a Task/subagent", "NEVER create PLAN.md", "NEVER run research". The guide requires converting these to positive statements specifying the desired behavior. Negative-only instructions leave the model to infer what to do instead, which introduces drift.

**Concrete fix:**

Replace:
```
- NEVER spawn a Task/subagent — this runs inline
- NEVER create PLAN.md or SUMMARY.md files
- NEVER run research or plan-checking
```
With:
```
- Execute all work inline in the current context only
- Apply changes directly; create no planning artifacts (PLAN.md, SUMMARY.md)
- Rely on existing knowledge; if research is needed, redirect to /gsd-quick
```
The reframe pattern from Section 6 ("Your job is NOT X — it's Y") is also acceptable here since the workflow is displacing a strong default (subagent spawning), but the current phrasing omits the "it's Y" half.

---

### Issue 2: Qualitative scope criterion mixed with quantitative ones

**Guide reference:** Section 21 (Size constraints use numeric limits, not qualitative descriptors); Section 1 Action 3 (Audit constraints for consistency).

**What's wrong:** The `scope_check` criteria list "≤ 1 minute of work" alongside numeric file-edit and dependency counts. "1 minute" is a qualitative estimate disguised as a number — it depends on the agent's pace and task complexity, and cannot be consistently measured by the model. This also creates a potential constraint conflict: a task touching ≤ 3 files might take 5 minutes, yet the file-edit criterion would allow proceeding while the time criterion would not.

**Concrete fix:**

Replace the time criterion with a structural proxy that is measurable without runtime context:
```
A task is trivial if:
- ≤ 3 file edits
- No new dependencies or architecture changes
- No research or exploration of unfamiliar code is required
- The change is a targeted replacement of known content (value, import, label, config key)
```
Drop "≤ 1 minute of work" — the other three criteria already bound the scope implicitly.

---

### Issue 3: `git add -A` in the commit step is unsafe and undocumented

**Guide reference:** Section 14 (Constraint enforcement — explicit permission pairs; precedents for edge cases); Section 20 (Safety and trust patterns — authorization is narrow-scoped).

**What's wrong:** The commit step unconditionally runs `git add -A`, which stages all untracked and modified files in the working tree — including files outside the scope of the task. The guide requires that authorization be narrow-scoped (Section 20) and that restrictions be paired with concrete alternatives (Section 14). Using `git add -A` can silently commit unrelated work-in-progress, secrets introduced into the tree, or files the user has not reviewed.

**Concrete fix:**

Replace:
```bash
git add -A
git commit -m "fix: {concise description of what changed}"
```
With:
```bash
git add {files changed by this task}
git commit -m "fix: {concise description of what changed}"
```
And add a note in the step:
```
Stage only the files modified in the execute_inline step. Do not use git add -A or
git add . — those commands stage files beyond this task's scope.
```

---

### Issue 4: The `done` report output format is not formally specified

**Guide reference:** Section 7 (Output format handling) — output format must be specified completely and upfront; Section 22 Pattern 3 — output format specified with a concrete example before the task begins.

**What's wrong:** The `done` step provides a template:
```
✅ Done: {what was changed}
   Commit: {short hash}
   Files: {list of changed files}
```
But this template appears at the *end* of the workflow (in the step where it is used), not in an `<output_format>` tag at the top of the file where the model sees it at high attention. Additionally, the template uses emoji and free-form fields without specifying field width, ordering constraints, or what constitutes "what was changed" (one sentence? a list?). There is no example of a correctly completed report.

**Concrete fix:**

Add an `<output_format>` block near the top of the file (after `<purpose>`, before `<process>`):
```xml
<output_format>
After completing the task, emit a completion report in this exact format:

Done: {one sentence describing the change}
Commit: {7-character short hash}
Files: {space-separated list of changed file paths}

Example:
Done: Updated API base URL in config.ts from staging to production
Commit: a3f9c12
Files: src/config.ts
</output_format>
```
Remove the template from the `done` step body and replace it with a reference: "Emit the completion report as specified in `<output_format>`."

---

### Issue 5: No explicit quality bar for the scope-check decision

**Guide reference:** Section 1 Action 1 — quality bar must be explicit; Section 15 (Decision frameworks — criteria checklists gate complex approaches).

**What's wrong:** The `scope_check` step tells the agent to assess whether the task is trivial, but provides no explicit quality bar for *how confident* the agent must be before proceeding inline. An ambiguous task description could pass the structural criteria (≤ 3 files, no new dependencies) while actually requiring significant exploration of unfamiliar code. The guide (Section 15) recommends criteria checklists with "all must be true" semantics before committing to a path.

**Concrete fix:**

Add an explicit confidence gate to the scope check:
```xml
<criteria>
Proceed inline only if ALL of the following are true:
- The files to edit are already known (no exploration required)
- The change is a replacement of a specific value, not a logic change
- The effect of the change is predictable without running the code
- ≤ 3 files need editing

If any criterion is false, redirect to /gsd-quick.
</criteria>
```

---

## Quick-Reference Checklist Score

Scoring against Section 23 of the guide. Items marked N/A are those whose applicability is definitionally absent for this workflow type (e.g., few-shot examples, self-consistency, RAG context).

### Task Specification
| Checklist Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | Intent and implied audience are present; quality bar for scope decision is absent (Issue 5) |
| All constraints are compatible — no conflicts between scope, length, or depth | FAIL | "≤ 1 minute of work" conflicts with "≤ 3 file edits" in edge cases (Issue 2) |

### Chain of Thought
| Checklist Item | Score | Notes |
|---|---|---|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | PASS | No CoT trigger is present; this is correct for a dispatch/routing workflow |
| Reasoning is elicited before the answer, not after | N/A | No CoT in use |

### Few-Shot Examples
| Checklist Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples |
| 2–5 examples total | N/A | — |
| Ordered simple → complex | N/A | — |
| Format consistent across all examples | N/A | — |

### Formatting
| Checklist Item | Score | Notes |
|---|---|---|
| Instruction is complete and clear before formatting is applied | PASS | `<purpose>` block is written in clear prose before structure is added |
| Prompt sections are separated by semantically named XML tags | PASS | `<purpose>`, `<process>`, `<step>`, `<guardrails>`, `<success_criteria>` are all semantically meaningful |
| At least 3 format variants will be tested on the target model | FAIL | No format variant testing is indicated |

### Instruction Framing
| Checklist Item | Score | Notes |
|---|---|---|
| All negative instructions converted to positive equivalents | FAIL | `<guardrails>` is entirely negative (Issue 1) |
| Priority order is explicit when multiple criteria apply | N/A | Single-path dispatch; no priority ordering required |
| Tie-breaking rules match the domain's cost asymmetry | FAIL | No tie-breaking rule for ambiguous scope-check cases (Issue 5) |

### Persona
| Checklist Item | Score | Notes |
|---|---|---|
| Persona is included only for open-ended or stylistic tasks | PASS | No persona; correct for a structured mechanical workflow |
| Persona is specific, not generic | N/A | No persona |
| Persona descriptor is gender-neutral | N/A | No persona |

### Output Format
| Checklist Item | Score | Notes |
|---|---|---|
| Structured output tasks use two-step reasoning-then-format approach | N/A | Output is a simple completion report, not structured data |
| Machine-parsed output uses exact format specification | FAIL | Completion report template is buried in the `done` step, not in a top-level `<output_format>` block with a concrete example (Issue 4) |

### Context Placement
| Checklist Item | Score | Notes |
|---|---|---|
| Task instruction is at the start of the prompt | PASS | `<purpose>` correctly leads |
| Primary input is at the end | PASS | `$ARGUMENTS` is consumed in the first step, not pre-pended as a leading block |
| Background context is in the middle | N/A | No supplementary background context |
| All irrelevant context has been removed | PASS | Workflow is tightly scoped |
| Time-sensitive injected context is labeled as a snapshot | N/A | No runtime context injection |

### Self-Consistency
| Checklist Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | — |

### Prompt Length
| Checklist Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | PASS | The workflow is terse; no repetition observed |
| Long prompts compressed before sending | N/A | Prompt is short |
| RAG context is extracted relevant passage only | N/A | No RAG |

### System/User Split
| Checklist Item | Score | Notes |
|---|---|---|
| Persistent instructions are in the system prompt | N/A | This is a workflow file loaded as a skill, not a system/user prompt pair |
| Each instruction appears in exactly one location | PASS | No duplication found |
| Safety-critical constraints have external validation | FAIL | `git add -A` is safety-relevant (Issue 3) but has no external validation or guard |

### Agent/Subagent
| Checklist Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | PASS | The workflow is designed for inline execution; no subagents |
| All file paths in agent output are absolute | FAIL | The `done` report and `log_to_state` step reference files without specifying absolute path requirement |
| Parallel agents are launched in a single message block | N/A | No parallel agents |
| Adversarial probes specified for verification agents | N/A | Not a verification workflow |

### Structural Architecture
| Checklist Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Workflow is one focused file for one workflow type |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS | `$ARGUMENTS` and `$TASK` are consistently named; `$TASK` uses conventional shell syntax (minor: no fallback for empty `$ARGUMENTS` beyond asking) |
| Modules compose via variable substitution, not copy-paste | PASS | No copy-pasted blocks |

### Constraint Enforcement
| Checklist Item | Score | Notes |
|---|---|---|
| Every restriction paired with an equally concrete permission | FAIL | `<guardrails>` has no matching "permitted" list (Issue 1) |
| Hard exclusion lists are enumerated, not described qualitatively | PASS | Exclusions (no PLAN.md, no subagents, no research) are enumerated |
| Known edge cases have precedent-style rulings | FAIL | No precedent for the ambiguous case where scope criteria conflict |
| Confidence thresholds are numeric, not qualitative | FAIL | "≤ 1 minute of work" is a qualitative time estimate (Issue 2) |

### Decision Frameworks
| Checklist Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use explicit decision tree or comparison table | PASS | `scope_check` uses a clear binary branch: trivial → proceed, non-trivial → redirect |
| Criteria checklists gate complex approaches | FAIL | Criteria are present but lack "all must be true" semantics and a confidence gate (Issue 5) |
| Action permissions framed around reversibility | FAIL | `git commit` is treated as reversible but `git add -A` can stage irreversible-scope changes (Issue 3) |

### Multi-Phase Workflows
| Checklist Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | Steps are named and sequenced |
| Required steps distinguished from type-specific steps | N/A | Single workflow path; no type-specific branching |
| Scenario-based branching handles multiple paths explicitly | PASS | Two explicit scenarios: trivial (proceed) and non-trivial (redirect) |

### Memory and Continuity
| Checklist Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | No memory template |
| Compaction summaries include discoveries and failed approaches | N/A | — |
| Next steps tied to the user's most recent explicit request | PASS | The `done` step explicitly instructs "no next-step suggestions" |

### Modularity
| Checklist Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Each `<step>` has one named purpose |
| Scope boundaries state both inclusions and exclusions | FAIL | `<guardrails>` states exclusions only; no corresponding inclusions block (Issue 1) |

### Safety and Trust
| Checklist Item | Score | Notes |
|---|---|---|
| Validation is at system boundaries only | PASS | `scope_check` is the boundary gate |
| Dual-use capabilities state permissions before restrictions | FAIL | `<guardrails>` states restrictions only, with no leading permitted-actions list |
| Authorization is narrow-scoped; each action confirmed before expanding scope | FAIL | `git add -A` expands commit scope beyond the task's stated files (Issue 3) |

### Tone and Style
| Checklist Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "≤ 1 minute of work" is a qualitative time estimate (Issue 2) |
| Instructions use imperative present tense | PASS | Steps use present tense imperatives throughout |
| Working notes are in analysis tags, not user-facing output | PASS | No working notes are surfaced; the done report is correctly minimal |

### Optimization
| Checklist Item | Score | Notes |
|---|---|---|
| Prompt is flagged as a draft for automated optimization | FAIL | No optimization flag present |
| Correct optimizer selected | N/A | Not yet flagged |
| Held-out test set reserved before optimization begins | N/A | — |

---

## Recommendations

Listed in priority order by impact and ease of implementation.

### 1. Convert `<guardrails>` to a paired permission/restriction block (HIGH IMPACT)

This addresses Issue 1 and simultaneously resolves the Section 23 failures for instruction framing, constraint enforcement, safety framing, and modularity scope boundaries. Replace all "NEVER" clauses with positive specifications and add a `<permitted>` counterpart. One change fixes five checklist failures.

**Applicable guide sections:** Section 5 Action 1, Section 14, Section 20.

---

### 2. Replace `git add -A` with scoped staging (HIGH IMPACT, SAFETY)

The unconditional `git add -A` is the highest-risk element in the workflow. It can silently commit files outside the task scope, including secrets, WIP files, or unrelated changes. This is a correctness and safety issue, not just a style issue.

Change the commit step to stage only the files touched in `execute_inline`, and document this as a constraint: "Stage only the files modified in this task."

**Applicable guide sections:** Section 14, Section 20.

---

### 3. Add a top-level `<output_format>` block with a concrete example (MEDIUM IMPACT)

The completion report template is buried at the end of the workflow where attention is lower. Moving it to a top-level `<output_format>` tag and adding one concrete example (following Section 22 Pattern 3) will make the format specification high-attention and self-documenting. Also remove the emoji from the template — the guide does not support emoji in output format definitions, and emoji can break parsers that consume the done report.

**Applicable guide sections:** Section 7, Section 8 Actions 1–2, Section 22 Pattern 3.

---

### 4. Replace the "≤ 1 minute" criterion with structural proxies (MEDIUM IMPACT)

Time-based criteria are not consistently measurable by a model executing a task. Replace with structural tests that do not depend on execution pace: "the files to edit are already known", "the change is a targeted value replacement", "the effect is predictable without running code". This also resolves the latent constraint conflict between the time criterion and the file-count criterion.

**Applicable guide sections:** Section 1 Action 3, Section 21.

---

### 5. Add an explicit confidence gate and tie-breaking rule to `scope_check` (LOW-MEDIUM IMPACT)

Currently the scope check is binary (trivial / non-trivial) with no guidance on ambiguous cases. Adding a "when in doubt, redirect to /gsd-quick" tie-breaking instruction — with the rationale that the cost of a missed non-trivial task exceeds the cost of a redundant redirect — anchors model behavior at the decision margin. This is low effort and closes two Section 23 failures.

**Applicable guide sections:** Section 1 Action 1, Section 5 (tie-breaking instructions), Section 15.
