# Critique: discuss-phase.md

## Summary

`discuss-phase.md` is a sophisticated, production-grade multi-phase workflow with genuine strengths in scope control, phase decomposition, incremental state management, and conditional branching. It handles a large decision surface well — supporting advisor mode, text mode, batch mode, auto mode, checkpointing, and resume — without losing coherence. However, it falls short on several foundational prompt engineering principles from the guide: instruction framing relies heavily on negative prohibitions, the output contract for CONTEXT.md is only partially specified, no formal `<output_format>` block anchors what the workflow produces, XML structure is used inconsistently (narrative prose mixed with XML steps), there is no persona definition despite the workflow having a clear role identity, and priority ordering is implicit in many decision branches rather than explicitly ranked. These are fixable gaps; the underlying architecture is sound.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** Each step is named, has a clear trigger, and creates a cognitive boundary. Steps complete sequentially. The `<step name="...">` structure matches the guide's `<phase id="..." name="..." trigger="...">` pattern.

- **Section 16 (Scenario-based branching) — Explicit conditional branching throughout.** The workflow uses explicit `if/else` branching for every fork: `--auto` vs interactive, `--batch` vs single question, `spec_loaded` vs not, advisor mode vs standard. This directly implements the guide's scenario-based branching recommendation.

- **Section 19 (Modularity) — Scope boundaries stated with both inclusions and exclusions.** The `<scope_guardrail>` block explicitly names what is allowed ("clarifying ambiguity") and what is not ("new capability"), with a worked heuristic and a concrete response template for scope-creep deflection.

- **Section 5 (Conditional instructions) — Runtime conditionals are explicit.** Flag-based behavior (`--power`, `--all`, `--auto`, `--chain`, `--text`, `--batch`, `--analyze`) is each documented with distinct semantic rules. No conditional is left implicit.

- **Section 18 (Memory and Continuity) — Checkpoint and resume pattern.** Incremental checkpointing after each area with structured JSON and a resume path in `check_existing` directly implements the guide's anti-drift continuity principle (Section 18).

- **Section 13 (Template variable injection) — Template variables used consistently.** `${PHASE}`, `${GSD_WS}`, `${phase_dir}`, `${padded_phase}`, etc. are interpolated throughout using the guide's `${VARIABLE_NAME}` syntax.

- **Section 14 (Constraint enforcement) — Scope restriction paired with permitted behavior.** The `<scope_guardrail>` block pairs the prohibition ("not allowed: scope creep") with the permitted alternative ("allowed: clarifying ambiguity"), matching the guide's "every restriction paired with a concrete permission" pattern.

- **Section 22, Pattern 5 (Decomposed single-responsibility modules) — External reference pattern.** `<required_reading>` delegates domain-probe and anti-pattern content to separate files (`domain-probes.md`, `gate-prompts.md`, `universal-anti-patterns.md`) rather than inlining them, keeping the workflow file focused on orchestration.

- **Section 20 (Safety and Trust) — Auto-mode pass cap explicitly enforced.** The `MAX_PASSES` cap with a concrete mechanism to detect and stop self-feeding loops addresses a real failure mode and reflects the guide's principle of gating complex approaches with explicit criteria.

---

## Issues

### Issue 1 — No persona defined (Section 6, Actions 1 and 2)

**Principle:** Assign a persona when the task is open-ended or stylistic. The persona must constrain register and voice, not be generic.

**What is missing:** The workflow opens with a `<purpose>` block that describes the agent's role ("thinking partner, not an interviewer"), but this is prose context, not a structured `<persona>` block. The role is specific and meaningful — a "phase discussion facilitator" who prioritizes capturing implementer decisions over technical advice — but it is never encoded as a persona the model commits to. The `<philosophy>` block ("User = founder/visionary. Claude = builder.") is the right raw material; it is simply not in the right structural form.

**Concrete fix:**

```xml
<persona>
You are a phase discussion facilitator for a product development workflow.

Your role is to extract implementation decisions from the user, not to figure out implementation yourself.
Write in plain, direct language. Ask one concrete question at a time.
Lead with the decision to be made, not with context.

Your job is NOT to advise on technical approaches — it's to surface the decisions a user cares about
and capture them clearly enough that a downstream planning agent can act without asking again.
</persona>
```

Move the existing `<purpose>` and `<philosophy>` content into this block, then remove the redundant prose sections.

---

### Issue 2 — Negative instructions used as primary directives (Section 5, Action 1)

**Principle:** Scan for negated instructions ("do not", "avoid", "never") and rewrite each as a positive specification of the desired behavior. The one valid exception is the reframe pattern in Section 6.

**What is missing:** The workflow contains multiple negative primary directives that the guide mandates converting to positive equivalents:

- `<scope_guardrail>`: "**Not allowed (scope creep):** - 'Should we also add comments?'"
- `<gray_area_identification>`: "**Claude handles these (don't ask)**"
- `<downstream_awareness>`: "**Not your job:** Figure out HOW to implement."
- `<scope_guardrail>`: "**CRITICAL: No scope creep.**"
- `discuss_areas` step: "Do NOT ask the standard 4 questions"
- `discuss_areas` step: "Do NOT re-read your own CONTEXT.md to find gaps"

The reframe pattern at the top (`<purpose>`: "You are a thinking partner, not an interviewer") is the one valid use of this form (Section 6). The rest should be converted.

**Concrete fixes (conversion table):**

| Current (negative) | Replacement (positive) |
|---|---|
| "Not allowed (scope creep): 'Should we also add comments?'" | "Scope is fixed by ROADMAP.md. Clarify HOW to implement what is scoped. New capabilities belong in a separate phase — note them as deferred ideas." |
| "Claude handles these (don't ask): Technical implementation details, Architecture patterns..." | "Ask about vision and implementation choices only. Codebase patterns, technical risks, and implementation approach are handled by the researcher and planner." |
| "Not your job: Figure out HOW to implement." | "Your job ends at capturing the decision. Research and planning resolve the implementation." |
| "Do NOT ask the standard 4 questions" | "Ask 1-2 targeted follow-up questions only when the pick has ambiguity that would affect downstream planning." |
| "Do NOT re-read your own CONTEXT.md to find gaps" | "After writing CONTEXT.md once, the discuss step is complete. Proceed directly to write_context and then auto_advance." |

---

### Issue 3 — Output format not specified for CONTEXT.md (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought.

**What is missing:** The CONTEXT.md template in `write_context` is embedded inline as prose with a markdown code block. There is no `<output_format>` tag wrapping it, and the template mixes hard constraints ("MANDATORY section") with advisory notes in a way that makes it unclear which fields are required vs optional. The guide (Section 7, Pattern 3) requires an `<output_format>` block with complete field specification and an example.

Additionally, the DISCUSSION-LOG.md output has its own template in `git_commit` rather than in `write_context`, creating split output specification across two steps.

**Concrete fix:** Extract the CONTEXT.md template from `write_context` into a top-level `<output_format>` block:

```xml
<output_format name="CONTEXT.md">
Required sections (in order):

1. `<domain>` — Phase boundary statement (required)
2. `<spec_lock>` — Requirements lock summary; include only if spec_loaded = true
3. `<decisions>` — Implementation decisions by category (required; minimum 1 category)
4. `<canonical_refs>` — Full relative paths to all referenced specs/ADRs (required; never omit)
5. `<code_context>` — Reusable assets, patterns, integration points (required)
6. `<specifics>` — User-specific references or "I want it like X" moments (required; write "None" if empty)
7. `<deferred>` — Out-of-scope ideas noted for future phases (required; write "None" if empty)

Each decision in `<decisions>` must be labeled D-NN (e.g., D-01, D-02) for downstream traceability.
Each entry in `<canonical_refs>` must include the full relative path and a one-line note on what it defines.
</output_format>
```

This removes ambiguity about which sections are optional and what "MANDATORY" means.

---

### Issue 4 — No priority ordering for competing signals (Section 5, priority ordering)

**Principle:** When multiple considerations apply, list them with explicit priority. Explicit ordering removes ambiguity when signals conflict.

**What is missing:** Several steps involve competing signals with no stated priority:

- `analyze_phase` gray area generation: prior decisions, spike findings, SPEC.md, codebase context, and ROADMAP.md goals all feed in. No priority order is stated for conflicts (e.g., what wins when a prior CONTEXT.md decision contradicts a SPEC.md requirement?).
- `check_existing` when both `--auto` and a checkpoint exist: the rule auto-selects "Update it" but the checkpoint check is a separate branch — the interaction is not ranked.
- Advisor mode calibration tier resolution lists three priority levels (config → USER-PROFILE.md → default), which is good, but the `vendor_philosophy` mapping contains an unranked catch-all ("pragmatic-fast OR any other value") that conflates multiple distinct inputs.

**Concrete fix for `analyze_phase`:**

```xml
<priority_order>
  1. SPEC.md locked requirements (highest — override everything; do not re-ask)
  2. Spike/sketch findings (validated empirically — accept as-is)
  3. Prior CONTEXT.md decisions (user preferences already set — carry forward, flag conflicts)
  4. Codebase context (informs options, does not determine them)
  5. ROADMAP.md phase goal (sets domain boundary only)
</priority_order>
```

---

### Issue 5 — Checklist items for the workflow's own agents lack explicit tool permission scoping (Section 22, Pattern 9)

**Principle:** Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access.

**What is missing:** The `advisor_research` step spawns parallel Task agents but does not specify `disallowedTools` or a permitted tool list for those agents. The agents are given a task prompt and a `subagent_type` but no constraint on what tools they may use. For a research-only subagent, the guide recommends specifying narrow tool grants (e.g., `Read`, `Grep`, `Glob`, and optionally `mcp__context7__*`) and explicitly excluding write tools (`Edit`, `Write`, `Bash(git:*)`, etc.).

**Concrete fix:** Add tool constraint to the advisor Task spawn:

```
Task(
  prompt="...",
  subagent_type="general-purpose",
  model="{ADVISOR_MODEL}",
  description="Research: {area_name}",
  allowed_tools=["Read", "Grep", "Glob", "mcp__context7__resolve_library_id", "mcp__context7__get_library_docs"],
  disallowed_tools=["Edit", "Write", "Bash", "NotebookEdit"]
)
```

This keeps advisor research agents read-only by construction, not just by instruction.

---

### Issue 6 — Tie-breaking rules absent for key uncertainty boundaries (Section 5, Tie-breaking instructions)

**Principle:** Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry.

**What is missing:** Several places where the model must choose between over-inclusion and under-inclusion have no tie-breaking rule:

- `gray_area_identification`: How many gray areas to surface is bounded ("1-2 per category") but there is no rule for what to do when an area is borderline — skip it or include it? The cost asymmetry here favors inclusion (a missed decision is harder to recover from than a redundant question).
- `canonical_refs` accumulation: When a user casually mentions a document name without confirming it is authoritative, should it be added to canonical refs? No tie-breaking is stated.
- `cross_reference_todos`: The `--auto` fold threshold is `score >= 0.4` (a stated numeric threshold, which is correct) but no tie-breaking is stated for the interactive case when a todo's relevance is unclear.

**Concrete fix for gray area identification:**

```xml
<tie_breaking>
  When uncertain whether a gray area is worth surfacing, include it.
  A question the user finds obvious takes 5 seconds to dismiss.
  A decision that was never discussed can require re-planning a completed phase.
</tie_breaking>
```

---

## Quick-Reference Checklist Score (Section 23)

### task_specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is in `<purpose>`. Audience ("the user is the visionary") is implicit. Quality bar for CONTEXT.md output is not stated as a quality bar — it is embedded in the write_context template. |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints identified. |

### chain_of_thought
| Item | Score | Notes |
|---|---|---|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A | No CoT trigger present. This workflow is procedural orchestration, not symbolic reasoning; CoT omission is correct. |
| CoT trigger used | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### few_shot_examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | PASS | Domain examples in `present_gray_areas` and `analyze_phase` use concrete, domain-matched illustrations (Post Feed, CLI, photo library). |
| 2-5 examples total | PASS | Each domain illustration contains 3-4 examples. |
| Ordered simple to complex | FAIL | The domain examples are not ordered by complexity; they appear in arbitrary domain order. |
| Examples span diverse sub-types | PASS | Three domain types are shown (visual feature, CLI tool, organization task). |
| Format is consistent across all examples | PASS | All gray area examples follow the same checkbox-label-description format. |
| Example order fixed across evaluation runs | N/A | Not applicable to a workflow file. |

### formatting
| Item | Score | Notes |
|---|---|---|
| Instruction is complete before formatting applied | PASS | Steps are written in complete prose before structure is applied. |
| Prompt sections separated by semantically named XML tags | FAIL | Mixed: top-level sections (`<purpose>`, `<downstream_awareness>`, `<process>`, `<step>`) use XML tags. But within steps, markdown headers and inline code blocks are used for sub-structure rather than XML tags. The CONTEXT.md template is naked markdown inside a prose step. |
| At least 3 format variants tested on target model | N/A | Production workflow, not a research prompt. |

### instruction_framing
| Item | Score | Notes |
|---|---|---|
| All negative instructions converted to positive equivalents | FAIL | Multiple negative primaries remain (see Issue 2). |
| Priority order explicit when multiple criteria apply | FAIL | No explicit priority ordering for competing information sources (see Issue 4). |
| Tie-breaking rules match domain's cost asymmetry | FAIL | Tie-breaking absent for gray area inclusion, canonical ref accumulation (see Issue 6). |

### persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | FAIL | This workflow has a clear stylistic role but no `<persona>` tag. |
| Persona is specific (constrains voice/register) | FAIL | Persona block does not exist; role is described only in prose `<purpose>` and `<philosophy>`. |
| Persona descriptor is gender-neutral | N/A | No persona block exists. |

### output_format
| Item | Score | Notes |
|---|---|---|
| Structured output uses two-step reasoning-then-format | N/A | Output is a file written by the workflow, not a structured response. |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | CONTEXT.md template lacks a formal `<output_format>` block; mandatory vs optional sections are inconsistently marked (see Issue 3). |

### context_placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | PASS | `<purpose>` and `<required_reading>` lead the file. |
| Primary document or input at end of prompt | PASS | `<success_criteria>` and `<power_user_mode>` close the file. |
| Background context in the middle | PASS | `<philosophy>`, `<scope_guardrail>`, `<gray_area_identification>`, `<answer_validation>` are mid-file. |
| All irrelevant context removed | PASS | No obvious padding or boilerplate present. |
| Time-sensitive injected context labeled as snapshot | N/A | No time-sensitive context is injected at prompt construction time. |

### self_consistency
| Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | Not applicable. |
| Inference budget permits 15-20 samples | N/A | Not applicable. |

### prompt_length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | FAIL | The scope-creep deflection response template appears twice (once in `<scope_guardrail>`, once in `discuss_areas` for both advisor and non-advisor mode). The "incremental checkpoint" instructions appear both inline and as a note in `check_existing`. |
| Long prompts compressed before sending | N/A | This is a workflow definition file, not a runtime prompt sent to a model. |
| RAG context is extracted relevant passage only | N/A | |

### system_user_split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | Workflow files act as the system prompt; split is at the workflow-vs-argument level. |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | FAIL | Scope-creep response template and checkpoint instructions are duplicated (see prompt_length above). |
| Safety-critical constraints have external validation | N/A | Safety constraints here (scope guardrail, pass cap) are enforced by procedural step gates, not external validators. |

### agent_subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | FAIL | The advisor Task prompt reads `@~/.claude/agents/gsd-advisor-researcher.md` via `@` reference rather than embedding content. If that file is unavailable, the subagent is under-specified. (This may be intentional by design; noted as a risk.) |
| All file paths in agent output are absolute | PASS | The workflow consistently uses `${phase_dir}/...` paths derived from init values. |
| Parallel agents launched in single message block | PASS | `advisor_research` step explicitly states: "All Task() calls spawn simultaneously — do NOT wait for one before starting the next." |
| Adversarial probes specified for verification agents | N/A | No verification agents in this workflow. |

### structural_architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic modules | PASS | `<required_reading>` offloads domain-probe and anti-pattern content to separate files. |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | Consistent throughout. |
| Modules compose at runtime via variable substitution | PASS | `${PHASE}`, `${GSD_WS}`, `${phase_dir}` etc. compose correctly. |

### constraint_enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with equally concrete permission | PASS | Scope guardrail pairs prohibition with permitted behavior. |
| Hard exclusion lists enumerated, not qualitative | PASS | `<scope_guardrail>` uses explicit "Not allowed" examples. |
| Known edge cases have precedent-style rulings | PASS | "Other" with empty text in `<answer_validation>` is a precedent-style edge case ruling. |
| Confidence thresholds are numeric, not qualitative | PASS | `--auto` fold threshold (`score >= 0.4`), pass cap (`MAX_PASSES`), and batch size clamp (2-5) are all numeric. |

### decision_frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or comparison table | PASS | `check_existing`, `check_blocking_antipatterns`, `present_gray_areas` all use explicit if/else decision trees. |
| Criteria checklists gate complex approaches | PASS | `check_blocking_antipatterns` gates progression on demonstrated understanding. `analyze_phase` gates gray area generation on prior decision check. |
| Action permissions framed around reversibility | FAIL | No reversibility framing is applied. The workflow does take irreversible actions (committing files, deleting checkpoint JSON) without a `<take_freely>` / `<confirm_with_user>` distinction. |

### multi_phase_workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | All steps are named via `<step name="...">`. |
| Required steps distinguished from type-specific steps | PASS | Several steps have `priority="first"` to distinguish them from optional/conditional steps. |
| Scenario-based branching handles multiple paths | PASS | `--auto`, `--chain`, `--all`, `--power`, `--text`, `--batch`, `--analyze` are each defined as named scenarios with explicit behavior. |

### memory_and_continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | PASS | CONTEXT.md template uses `<domain>`, `<decisions>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>`. |
| Compaction summaries include discoveries and failed approaches | FAIL | CONTEXT.md has no `<discoveries>` section. Failed approaches, rejected options, and "why we didn't choose X" are not captured — only the winning decision is recorded. |
| Next steps tied to user's most recent explicit request | PASS | `confirm_creation` step lists exact next commands. `auto_advance` step has explicit chain return messages. |

### modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Each `<step>` has a declared single responsibility. |
| Scope boundaries state both inclusions and exclusions | PASS | `<scope_guardrail>` states both. `<gray_area_identification>` states what Claude handles (don't ask) vs what to surface. |

### safety_and_trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only; internal interfaces trusted | PASS | Input validation (`phase_found`, empty answer retry, `--auto` flag parsing) is at the boundary. Internal step outputs are trusted. |
| Dual-use capabilities state permissions before restrictions | PASS | `<scope_guardrail>` leads with "Allowed" before "Not allowed". |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL | The `--auto` and `--chain` flags implicitly authorize a broad chain of actions (discuss → plan → execute) without per-step confirmation. The workflow documents this behavior but does not gate it. |

### tone_and_style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits | PASS | Header max 12 chars, batch size clamped 2-5, AskUserQuestion option counts specified. |
| Instructions use imperative present tense | PASS | Step instructions use imperative present tense throughout ("Parse JSON for:", "Write file.", "Confirm:", "Read the phase description..."). |
| Working notes in analysis tags, not user-facing output | FAIL | Internal analysis artifacts (prior_decisions, codebase_context) are described as stored "internally" but there is no instruction to wrap them in `<analysis>` tags. The distinction between internal reasoning and output is informal. |

### optimization
| Item | Score | Notes |
|---|---|---|
| Prompt is flagged as a draft for automated optimization | N/A | Workflow orchestration files are not candidates for automated prompt optimizers. |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

### 1. Add a `<persona>` block (Priority: High)

The workflow has a strong, specific role identity — "phase discussion facilitator and thinking partner, not a technical advisor" — but it is never encoded as a formal persona. The `<purpose>` and `<philosophy>` blocks contain all the right material. Restructure them into a `<persona>` block at the top of the file (Section 6, Action 2). Include the reframe pattern: "Your job is NOT to figure out implementation — it's to capture the decisions that will guide the agents who do." This anchors every subsequent behavior.

### 2. Convert all negative primary directives to positive equivalents (Priority: High)

The five negative directives identified in Issue 2 each have straightforward positive rewrites. Apply the conversion table from Section 5, Action 1. This is a mechanical pass that takes 15-30 minutes and eliminates a consistent source of behavioral drift. Pay particular attention to the auto-mode pass cap — the current "Do NOT re-read your own CONTEXT.md" instruction should become "After writing CONTEXT.md once, the discuss step is complete — proceed to write_context and auto_advance."

### 3. Wrap the CONTEXT.md template in a formal `<output_format>` block with explicit required/optional field labels (Priority: High)

The current template in `write_context` is good but lacks structural clarity on which sections are required vs optional, and there is no quality bar. Extract it to a top-level `<output_format>` block (Section 22, Pattern 3). Mark each section as `(required)`, `(required if spec_loaded)`, or `(include or write "None")`. This removes the current ambiguity of "MANDATORY" buried in a comment inside the template.

### 4. Add explicit priority ordering for competing information sources in `analyze_phase` (Priority: Medium)

When SPEC.md, prior CONTEXT.md decisions, spike findings, codebase context, and ROADMAP.md all inform gray area generation, the model needs an explicit ranked hierarchy (Section 5, priority ordering). The fix in Issue 4 provides a ready-to-use `<priority_order>` block. Without this, the model resolves conflicts against its own priors rather than the intended hierarchy.

### 5. Eliminate duplicated instructions and add a `<discoveries>` section to CONTEXT.md (Priority: Medium)

Two instructions are duplicated: the scope-creep deflection template (appears in `<scope_guardrail>` and twice in `discuss_areas`) and the checkpoint resume instructions (in `discuss_areas` and `check_existing`). Consolidate each to a single canonical location (Section 11, Action 3). Separately, add a `<discoveries>` subsection to the CONTEXT.md template to capture rejected options and "why not X" reasoning — this is the most common gap in handoff documents and directly addresses the guide's compaction summary requirements (Section 18).
