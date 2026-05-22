# Critique: complete-milestone.md

## Summary

`complete-milestone.md` is a comprehensive, well-structured workflow that handles a genuinely complex multi-phase operation. Its process sequencing is sound, its use of named `<step>` blocks is a strong structural decision, and the inline bash examples make the instructions actionable. However, the prompt consistently uses markdown prose and free-form text where the guide mandates semantically named XML tags. It has no explicit persona, no output format specification for the agent's own responses, no audience declaration, and no constraint blocks with explicit permission pairs. Negative instructions appear in several places without conversion to positive equivalents. These are not cosmetic gaps — they are the guide's highest-leverage categories (Sections 1, 4, 5, 6, 7, and 14), and their absence measurably reduces instruction precision and consistency.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern well applied.** The workflow is organized into discrete named `<step>` blocks with `name` attributes, creating clear cognitive boundaries and matching the guide's `<phase id="N" name="...">` pattern.

- **Section 16 — required vs. optional steps distinguished.** The `<success_criteria>` checklist at the end explicitly enumerates completion conditions, functioning as the guide's `<required_steps universal="true">` equivalent.

- **Section 16 — scenario-based branching implemented.** The `<if mode="yolo">` and `<if mode="interactive">` conditional blocks handle branching scenarios explicitly rather than leaving the model to infer, matching Section 16's scenario pattern.

- **Section 13 — template variable injection used correctly.** Variables like `${PROJECT_CODE}`, `${PROJECT_TITLE}`, and `${ARGUMENTS}` follow the guide's `${VARIABLE_NAME}` syntax.

- **Section 8 (Context Placement) — task instruction leads.** The `<purpose>` block and `<required_reading>` appear at the top, placing the instruction and orientation cues where the model attends most strongly.

- **Section 15 (Decision Frameworks) — explicit branching for git operations.** The `handle_branches` step enumerates specific conditional paths (squash merge, merge with history, delete, keep) rather than leaving the decision implicit.

- **Section 20 (Safety) — security note on STATE.md injection.** The `pre_close_artifact_audit` step explicitly flags sanitization requirements and calls out injection risk, which aligns with Section 20's external boundary validation principle.

- **Section 22, Pattern 3 — output format specified per step.** Individual steps include concrete output templates (the stats block, the milestone summary block, the `offer_next` block), making expected output tangible.

---

## Issues

### Issue 1 — No task specification (Section 1, Actions 1–2)

**Principle:** Section 1 requires explicit declaration of (a) what output is requested, (b) why it matters, and (c) what a high-quality result looks like. It also requires an audience declaration.

**What's missing:** The `<purpose>` block describes what the workflow does at a high level but does not state: who executes this (the orchestrating Claude agent? a human?), what a correct run looks like end-to-end, or what the quality bar is for the agent's own responses during execution. There is no `<audience>` tag anywhere.

**Fix:**

```xml
<task>
Execute the complete-milestone workflow for the current GSD project. A correct run
produces: a MILESTONES.md entry, an archived ROADMAP.md and REQUIREMENTS.md, an updated
PROJECT.md, a RETROSPECTIVE.md entry, a git tag, and a final completion report to the user.
</task>

<audience>
The Claude Code agent executing this workflow on behalf of a software developer using the
GSD project management system. The agent has full tool access (Bash, Read, Write, Edit)
and operates in an interactive or yolo mode determined by config.json.
</audience>

<quality_bar>
Each step completes fully before the next begins. Every file modification is verified.
The user receives a clear completion summary. All checklist items in success_criteria are met.
</quality_bar>
```

---

### Issue 2 — No persona assigned (Section 6, Actions 1–2; Section 22, Pattern 1)

**Principle:** Section 6 requires a specific, role-constrained persona for tasks requiring a particular voice or decision-making style. Section 22, Pattern 1 states that role identity scoped to the exact domain biases behavior toward domain-appropriate outputs.

**What's missing:** There is no `<persona>` block. This workflow involves judgment calls (evolution review, retrospective writing, gap assessment, branch handling) that would benefit from a defined expert identity. Without one, the model defaults to generic assistant behavior.

**Fix:**

```xml
<persona>
You are a release engineer and project historian for a software team using the GSD
planning system. Your strengths:
- Executing multi-step release workflows precisely and in order
- Applying judgment to PROJECT.md evolution reviews and retrospectives
- Producing clear, structured completion reports
- Handling git operations safely, with explicit user confirmation before destructive steps
</persona>
```

---

### Issue 3 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 requires all negative instructions ("do not", "never", "don't") to be rewritten as positive specifications of desired behavior, with a single exception for the reframe pattern.

**What's missing / examples:**

- `pre_close_artifact_audit` step: "Never inject raw file content into STATE.md" — negative instruction.
- `archival_behavior` block: implied restrictions stated as "do NOT" scattered through prose.
- `pre_close_artifact_audit` step: "Never inject raw user-supplied content into STATE.md without sanitization" — second negative.

**Fix (Section 5 conversion table applied):**

```
"Never inject raw file content into STATE.md"
→ "Write only sanitized display values to STATE.md — pass all slugs and statuses
   through sanitizeForDisplay() before inclusion"

"Never inject raw user-supplied content into STATE.md without sanitization"
→ "Sanitize all user-supplied content via sanitizeForDisplay() before writing to STATE.md"
```

---

### Issue 4 — No XML tags on prompt sections; markdown headers used instead (Section 4, Action 2)

**Principle:** Section 4, Action 2 requires semantically named XML tags to separate all distinct prompt sections. The guide states this is "strictly better than markdown headers or `---` delimiters for Claude-class models."

**What's missing:** The top-level sections (`<purpose>`, `<required_reading>`, `<archival_behavior>`, `<process>`, `<milestone_naming>`, `<what_qualifies>`, `<success_criteria>`) use a mix of custom XML-like tags and prose. While some tags are present, `<required_reading>` is rendered as a markdown numbered list inside the tag rather than using the guide's `<context>` / `<input>` vocabulary. The vocabulary from Section 4's tag table (`<task>`, `<context>`, `<constraints>`, `<output_format>`) is not used.

**Fix:** Map existing sections to the standard tag vocabulary:

| Current | Should be |
|---|---|
| `<purpose>` | `<task>` |
| `<required_reading>` | `<context>` (with sub-tags) |
| `<archival_behavior>` prose | `<constraints>` |
| Final `offer_next` block | `<output_format>` for that step |

---

### Issue 5 — No output format specification for the agent's own responses (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** Section 7 requires structured output tasks to specify the required output format completely and upfront. Section 22, Pattern 3 states format specification is part of the task definition, not an afterthought.

**What's missing:** Each step shows what the agent should present to the user (e.g., the stats block, the readiness table), but there is no top-level `<output_format>` block defining: how verbose responses should be, whether working notes belong in `<analysis>` tags, or what the completion report structure is. The guide's Section 21 pattern ("Present only the final product") is also absent — the agent has no instruction to keep internal reasoning out of user-facing output.

**Fix:**

```xml
<output_format>
For each step, present only the final output to the user — keep internal reasoning and
intermediate bash output in <analysis> tags.

At workflow completion, emit the offer_next block exactly as specified in the
offer_next step. Do not add commentary beyond the template.

Step-level outputs follow the templates defined within each step. Do not summarize
or paraphrase template outputs.
</output_format>
```

---

### Issue 6 — Constraints not using explicit permission pairs (Section 14)

**Principle:** Section 14 requires every restriction to be paired with an equally concrete permission. It also requires `<permitted>` and `<reserved_for_human_review>` tags rather than prose restrictions.

**What's missing:** The `pre_close_artifact_audit` step restricts STATE.md injection but never states what IS permitted to write there. The git operations in `handle_branches` describe destructive operations (force-delete branches, `git rm`) without using the reversibility framework (`<take_freely>` / `<confirm_with_user>`).

**Fix:**

```xml
<constraints>
  <take_freely>
    Reading files, running read-only git commands, extracting stats, writing
    to .planning/ files, creating archive directories.
  </take_freely>

  <confirm_with_user>
    - git rm .planning/REQUIREMENTS.md
    - git tag creation and push
    - Branch merges and deletions
    - Any operation that modifies git history
  </confirm_with_user>

  <permitted>
    Write to STATE.md: sanitized slugs and statuses from audit-open --json output only.
    Sanitize via sanitizeForDisplay() before every write.
  </permitted>
</constraints>
```

---

### Issue 7 — No tie-breaking rule for ambiguous decisions (Section 5; Section 22, Pattern 4)

**Principle:** Section 5 requires explicit tie-breaking rules that match the domain's cost asymmetry. Section 22, Pattern 4 states that the tie-breaking rule is "the instruction that fires at the margin."

**What's missing:** The `evolve_project_full_review` step involves judgment calls (does the "What This Is" description need updating? does a requirement qualify as Validated?). The `write_retrospective` step involves deciding what to include. Neither step has a tie-breaking rule. Given that this is a milestone archive operation — conservative and durable — the cost asymmetry favors over-inclusion.

**Fix:**

```xml
<tie_breaking>
When uncertain whether to update PROJECT.md text or leave it unchanged, prefer updating
if the shipped product differs meaningfully from the current description. Over-updating
is preferable to leaving stale descriptions.

When uncertain whether a requirement qualifies as Validated, include it — marking it
Validated when complete is cheaper to reverse than missing a shipped requirement.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide:

### Task Specification
| Item | Score |
|------|-------|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL — no audience, no quality bar |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain-of-Thought
| Item | Score |
|------|-------|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A — no CoT trigger present; workflow is procedural |
| CoT trigger used: "Take a deep breath and work on this problem step-by-step." | N/A |
| Reasoning is elicited before the answer, not after | N/A |
| CoT traces are treated as heuristic aids, verified against ground truth downstream | N/A |

### Few-Shot Examples
| Item | Score |
|------|-------|
| Examples selected by semantic similarity | N/A — no few-shot examples |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format is consistent across all examples | N/A |
| Example order is fixed across all evaluation runs | N/A |

### Formatting
| Item | Score |
|------|-------|
| Instruction is complete and clear before any formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | FAIL — partial; top-level tags are non-standard; inner content uses markdown |
| At least 3 format variants will be tested on the target model | FAIL — no evidence of format testing |

### Instruction Framing
| Item | Score |
|------|-------|
| All negative instructions have been converted to positive equivalents | FAIL — multiple "Never inject" / "do NOT" present |
| Priority order is explicit when multiple criteria apply | FAIL — no `<priority_order>` tag; implicit in step order only |
| Tie-breaking rules match the domain's cost asymmetry | FAIL — no tie-breaking rules |

### Persona
| Item | Score |
|------|-------|
| Persona is included only for open-ended or stylistic tasks | FAIL — no persona present at all |
| Persona is specific (constrains voice/register), not generic | FAIL — absent |
| Persona descriptor is gender-neutral | N/A — absent |

### Output Format
| Item | Score |
|------|-------|
| Structured output tasks use a two-step reasoning-then-format approach | N/A — not applicable to procedural workflow |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding is adopted only after free-form + post-processing has proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | PASS — offer_next and stats blocks are templated |

### Context Placement
| Item | Score |
|------|-------|
| Task instruction is at the start of the prompt | PASS — `<purpose>` leads |
| Primary document or input is at the end of the prompt | N/A — no variable input document |
| Background context is in the middle | PASS — `<archival_behavior>` precedes `<process>` |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |

### Self-Consistency
| Item | Score |
|------|-------|
| Self-consistency is applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Item | Score |
|------|-------|
| Redundant instructions and repeated context have been removed | PASS — minimal repetition |
| Long prompts have been compressed before sending | N/A — static workflow file |
| RAG context is the extracted relevant passage only | N/A |

### System/User Split
| Item | Score |
|------|-------|
| Persistent instructions are in the system prompt | N/A — workflow file invoked as skill |
| Task-specific instructions are in the user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation independent of the prompt | FAIL — sanitization instruction relies solely on the prompt; no external validation layer |

### Agent/Subagent
| Item | Score |
|------|-------|
| Agent prompts are fully self-contained | PASS — workflow is self-contained |
| All file paths in agent output are absolute | PASS — bash examples use absolute paths |
| Parallel agents are launched in a single message block | N/A |
| Adversarial probes are specified for verification agents | N/A |

### Structural Architecture
| Item | Score |
|------|-------|
| Large prompts are decomposed into atomic, single-responsibility modules | FAIL — workflow is monolithic; all concerns in one file |
| Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate | PASS |
| Modules compose at runtime via variable substitution, not copy-paste | PARTIAL — variables used, but no fallback syntax on any variable |

### Constraint Enforcement
| Item | Score |
|------|-------|
| Every restriction is paired with an equally concrete permission | FAIL — restrictions stated without matching permissions |
| Hard exclusion lists are enumerated, not described qualitatively | PASS — artifact audit exclusions are enumerated |
| Known edge cases have precedent-style rulings | FAIL — no `<precedents>` block |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Item | Score |
|------|-------|
| Multi-option recommendations use an explicit decision tree or comparison table | PASS — branch handling options are explicit |
| Criteria checklists gate complex approaches | PASS — `success_criteria` checklist present |
| Action permissions are framed around reversibility | FAIL — no reversibility framework; destructive ops not distinguished |

### Multi-Phase Workflows
| Item | Score |
|------|-------|
| Complex tasks are organized into explicit named phases | PASS — `<step name="...">` used throughout |
| Required steps are distinguished from type-specific steps | PARTIAL — `success_criteria` implicitly distinguishes, but no `<required_steps universal>` tag |
| Scenario-based branching handles multiple paths explicitly | PASS — `<if mode>` and `AskUserQuestion` options enumerate paths |

### Memory and Continuity
| Item | Score |
|------|-------|
| Memory templates use XML tags as section labels | N/A — workflow does not define memory templates |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps are tied to the user's most recent explicit request | PASS — `offer_next` step ties completion to next action |

### Modularity
| Item | Score |
|------|-------|
| Each prompt component has a single responsibility | FAIL — the single file handles verification, archival, PROJECT.md review, git tagging, branch management, retrospective writing — at least six distinct concerns |
| Scope boundaries state both inclusions and exclusions | FAIL — `<what_qualifies>` states inclusions but exclusions are vague ("internal dev iterations") |

### Safety and Trust
| Item | Score |
|------|-------|
| Validation is at system boundaries only; internal interfaces are trusted | PASS — sanitization scoped to STATE.md writes from audit output |
| Dual-use capabilities state permissions before restrictions | FAIL — restrictions appear before permissions throughout |
| Authorization is narrow-scoped; each action confirmed before expanding scope | PARTIAL — AskUserQuestion used for some actions; git rm confirmation implicit only |

### Tone and Style
| Item | Score |
|------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL — "short 1-2 words" for milestone names, but agent response verbosity is unspecified |
| Instructions use imperative present tense | PASS — "Extract", "Present", "Calculate", "Verify" throughout |
| Working notes are in analysis tags, not user-facing output | FAIL — no instruction to use `<analysis>` tags for internal reasoning |

### Optimization
| Item | Score |
|------|-------|
| Prompt is flagged as a draft for automated optimization | FAIL |
| Correct optimizer selected | FAIL — not addressed |
| Held-out test set reserved before optimization begins | FAIL — not addressed |

---

## Recommendations

### 1. Add `<task>`, `<audience>`, and `<quality_bar>` blocks at the top (Section 1, Actions 1–2; HIGH IMPACT)

The guide's most foundational requirement is explicit intent, audience, and quality bar. Adding these three blocks takes under 15 lines and eliminates ambiguity about who is executing the workflow, what success means, and how verbose responses should be. This is the single highest-leverage fix.

### 2. Add a `<persona>` block with strengths listing (Section 6, Action 2; Section 22, Pattern 1; HIGH IMPACT)

This workflow requires judgment in three steps: `evolve_project_full_review`, `write_retrospective`, and `verify_readiness`. Without a persona, the model applies generic defaults. A release-engineer identity with an enumerated strengths list (per Section 6's strengths-listing pattern) directly biases these judgment calls toward domain-appropriate behavior.

### 3. Add a `<constraints>` block using `<take_freely>` / `<confirm_with_user>` / `<permitted>` pairs (Section 14; Section 15 reversibility framework; HIGH IMPACT)

The workflow executes several destructive or hard-to-reverse git operations (`git rm`, `git tag`, branch deletion, force-push option). These are currently described in prose without the reversibility framework. Wrapping them in the guide's constraint tags makes the blast radius explicit and ensures the model requests confirmation before irreversible actions.

### 4. Convert all negative instructions to positive equivalents (Section 5, Action 1; MEDIUM IMPACT)

There are at least two "Never inject" instructions in `pre_close_artifact_audit`. The Section 5 conversion table is mechanical — apply it to every negated instruction in the file. This removes hedged framing and replaces it with concrete behavioral specifications.

### 5. Add a top-level `<output_format>` block specifying analysis-tag discipline and response verbosity (Section 7; Section 21; MEDIUM IMPACT)

The agent currently has no instruction governing its own response verbosity or whether internal reasoning belongs in `<analysis>` tags. Adding a short `<output_format>` block (5–8 lines) following Section 21's output efficiency pattern would prevent verbose intermediate output from leaking into user-facing responses during the workflow's longer-running steps.
