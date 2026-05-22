# Critique: execute-phase.md

## Summary

`execute-phase.md` is a sophisticated, production-grade orchestration workflow that demonstrates strong multi-phase structure, explicit branching logic, and careful failure handling. Its procedural detail is genuinely impressive for a complex agentic task. However, the file departs significantly from the prompt engineering guide's foundational structural principles: instructions are delivered in plain prose and bash comments rather than semantically named XML sections, there is no task/audience/quality-bar specification, constraint blocks lack the paired permission/restriction pattern, and negative instructions appear throughout rather than being converted to positive equivalents. The file reads more like an engineering runbook than a prompt — which serves human readability well but underutilizes the structural patterns the guide shows produce more reliable model behavior.

---

## Strengths

- **Section 16 — Multi-phase workflow pattern applied correctly.** The workflow is organized into explicitly named `<step>` phases with `name` and `priority` attributes, matching the guide's `<phase id="..." name="..." trigger="...">` pattern closely. Each step has a clear cognitive boundary.

- **Section 16 — Scenario-based branching is explicit.** The `check_interactive_mode`, `handle_branching`, `cross_ai_delegation`, and `checkpoint_handling` steps enumerate conditions and their corresponding execution paths rather than leaving the model to infer behavior from context.

- **Section 14 — Structure preservation with explicit guards.** The worktree cleanup block specifies exactly which files the orchestrator "owns" (STATE.md, ROADMAP.md) and uses concrete backup/restore mechanics — analogous to the guide's `<preserve>` / `<update>` constraint pattern.

- **Section 15 — Decision trees used for tiered logic.** The `runtime_compatibility` block and the worktree/sequential branching throughout `execute_waves` present choices as explicit conditional branches, matching the guide's ASCII decision tree pattern.

- **Section 17 — Self-contained subagent prompts.** Executor prompts include `<objective>`, `<worktree_branch_check>`, `<parallel_execution>`, `<execution_context>`, `<files_to_read>`, `<success_criteria>` — a close match to the guide's `<goal>`, `<unit_task>`, `<conventions>`, `<e2e_recipe>`, `<worker_instructions>` decomposition pattern (Section 17, self-contained agent prompts).

- **Section 17 — Adversarial verification is addressed.** Step 6 of `execute_waves` requires spot-checking SUMMARY.md claims against the actual filesystem and git log before accepting completion — preventing false-positive self-reporting, consistent with Section 17's adversarial probe requirement.

- **Section 22, Pattern 3 — Output format for human-facing progress specified upfront.** The wave completion report, aggregate results table, and gap-found blocks all include concrete formatting examples with explicit field ordering, matching Pattern 3's "output format specified completely and upfront."

- **Section 13 — Template variable injection syntax used consistently.** `${CONTEXT_WINDOW}`, `${PHASE_NUMBER}`, `${AGENT_SKILLS}`, and similar variables follow the guide's `${VARIABLE_NAME}` convention. The conditional `${CONTEXT_WINDOW < 200000 ? '' : '...'}` syntax matches the guide's conditional rendering pattern.

- **Section 20 — Denial/failure handling treats signals as information.** The `classifyHandoffIfNeeded` false failure block and the `cross_ai_delegation` failure block both route to meaningful recovery paths rather than aborting, consistent with Section 20's denial-as-signal principle.

---

## Issues

### Issue 1 — No task specification block (Section 1, Actions 1–2)

**Guide principle:** Section 1 requires explicit extraction of (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. It also requires the audience to be encoded explicitly.

**What's missing:** The file opens with a `<purpose>` tag and a `<core_principle>` tag that describe the workflow at a high level, but neither specifies the audience (which model or agent class will read this?), the quality bar (what does a successful execute-phase run look like?), or the success criteria at the prompt level. The model reading this file has no `<quality_bar>` against which to self-evaluate.

**Concrete fix:**

```xml
<task>
Orchestrate parallel execution of all plans in a phase using wave-based agent spawning.
</task>

<audience>
An LLM orchestrator agent (Claude Sonnet/Opus class) coordinating multiple executor subagents.
Assumes familiarity with git worktrees, bash scripting, and the GSD project structure.
</audience>

<quality_bar>
Execution is successful when: all incomplete plans have SUMMARY.md files committed,
post-merge test gate passes, and VERIFICATION.md confirms phase goal achievement.
</quality_bar>
```

---

### Issue 2 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Guide principle:** Section 5 Action 1 requires scanning for negated instructions ("do not", "avoid", "never") and rewriting each as a positive specification of desired behavior. The exception is the reframe pattern (Section 6), which is not the context here.

**What's missing:** The file contains at least eight negative instructions used as primary directives:
- "Do NOT update STATE.md or ROADMAP.md"
- "Do NOT skip or defer this commit"
- "Never shell-interpolate the prompt"
- "Never block indefinitely waiting for a signal"
- "Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete"
- "do NOT send all Task calls in a single message"
- "Do not proceed to auto-advance or transition"
- "Do not invent or hallucinate command names"

**Concrete fix (applying the Section 5 conversion table):**

| Current (negative) | Replacement (positive) |
|---|---|
| "Do NOT update STATE.md or ROADMAP.md" | "Write STATE.md and ROADMAP.md from the orchestrator only, after all worktree agents in the wave complete." |
| "Never block indefinitely waiting for a signal" | "Always verify completion via filesystem and git spot-checks; proceed when SUMMARY.md exists and commits are found." |
| "do NOT send all Task calls in a single message" | "Dispatch one Task() call per message, each with run_in_background: true, to ensure sequential worktree creation." |
| "Do not invent or hallucinate command names" | "Suggest only the commands listed above, using exact syntax." |

---

### Issue 3 — Constraint blocks lack explicit permission pairing (Section 14, explicit permission pairs)

**Guide principle:** Section 14 states "Pair every restriction with what IS permitted, stated equally concretely." The guide's canonical form uses `<permitted>` and `<reserved_for_human_review>` sub-tags within a `<constraints>` block.

**What's missing:** Constraints are scattered throughout steps as inline prose (e.g., "Do not modify STATE.md or ROADMAP.md," "Use --no-verify on all git commits," "Always use isolation='worktree'"). There is no consolidated `<constraints>` block that pairs what is forbidden with what is permitted, and no `<permitted>` / `<reserved_for_human_review>` structure.

**Concrete fix:**

```xml
<constraints>
  <permitted>
    - Spawn executor subagents with isolation="worktree" and run_in_background: true
    - Read any file in the project directory
    - Commit to orchestrator-owned files: STATE.md, ROADMAP.md, REQUIREMENTS.md (after wave completion only)
    - Use --no-verify on git commits inside worktrees (hooks run once post-wave)
  </permitted>

  <reserved_for_human_review>
    - Resolving merge conflicts from worktree branches
    - Overriding the schema drift gate (GSD_SKIP_SCHEMA_CHECK)
    - Continuing past post-merge test failures
  </reserved_for_human_review>

  <confirm_with_user>
    - Checkpoint plans with autonomous: false
    - Cross-AI delegation failures (retry, skip, or abort)
  </confirm_with_user>
</constraints>
```

---

### Issue 4 — No output format specification for the orchestrator's own outputs (Section 7, Action 1; Section 22, Pattern 3)

**Guide principle:** Section 7 Action 1 and Section 22 Pattern 3 require the output format to be specified completely and upfront. For a workflow prompt, this means specifying what the orchestrator itself produces — not just what subagents produce.

**What's missing:** The orchestrator produces wave completion reports, aggregate phase summaries, gap-found presentations, human-verification prompts, and next-step routing blocks. Each of these is defined inline within its respective step with example templates, which is good. However, there is no consolidated `<output_format>` block declaring the set of output types the orchestrator produces, their structure, and which tokens are machine-parsed versus human-readable. The `aggregate_results` and `offer_next` steps contain partial format specs but they are not consolidated or tagged.

**Concrete fix:** Add a top-level `<output_format>` block after `<core_principle>`:

```xml
<output_format>
The orchestrator produces the following output types during execution:

1. Wave announcement (before spawning): markdown block with plan ID, objective summary (2-3 sentences), agent count.
2. Wave completion report: markdown block with plan ID, what was built (from SUMMARY.md), deviations if any.
3. Checkpoint presentation: structured block with plan ID, progress table, checkpoint type, awaited action.
4. Phase completion summary: markdown table of waves/plans/status plus issues section.
5. Next-step routing: exact command strings — use only commands from the registered list.

Machine-parsed tokens (used by downstream steps):
- SUMMARY.md `## Self-Check: FAILED` marker — exact string match
- VERIFICATION.md `status:` frontmatter field — values: passed | human_needed | gaps_found
- git log grep pattern: `{phase_number}-{plan_padded}`
</output_format>
```

---

### Issue 5 — Priority ordering absent for competing signals (Section 5, priority ordering)

**Guide principle:** Section 5 states "When multiple considerations apply, list them with explicit priority." The guide's `<priority_order>` tag is used when signals or criteria conflict.

**What's missing:** Several steps involve competing priorities with no explicit ordering:
- In `execute_waves` step 5.7, tracking updates are conditional on `TEST_EXIT=0`, but there is no explicit priority ordering when `TEST_EXIT=124` (timeout) — the prose says "treat as non-blocking" and "inconclusive," but the two statuses (non-blocking vs. inconclusive) produce different behaviors without a clear rule for which takes precedence.
- In `checkpoint_handling`, auto-mode vs. standard flow vs. `human-action` type are described sequentially but the priority ordering if multiple conditions are true simultaneously is implicit.
- In `offer_next`, the conditions `--auto`, `AUTO_CHAIN`, and `AUTO_CFG` are listed with "OR" but no tie-breaking rule explains what happens if they conflict (e.g., `AUTO_CFG=false` but `--auto` flag present).

**Concrete fix (example for `offer_next`):**

```xml
<priority_order>
  1. --no-transition flag present → return completion status, stop (highest precedence)
  2. gaps_found from verify_phase_goal → present gap-closure path, stop
  3. --auto flag in $ARGUMENTS → auto-advance regardless of config values
  4. AUTO_CHAIN config true → auto-advance (set by previous auto-chain invocation)
  5. AUTO_CFG config true → auto-advance (user's persistent preference)
  6. None of the above → present manual next-step options and wait
</priority_order>
```

---

### Issue 6 — Persona absent despite open-ended orchestration role (Section 6, Action 1–2)

**Guide principle:** Section 6 Action 1 says to assign a persona when the task is open-ended or requires a specific voice. Section 22 Pattern 1 states: "State the agent's identity as a specific expert in the exact domain the task requires."

**What's missing:** The orchestrator makes consequential judgment calls — when to treat a failed agent as a false failure, when to block on test failures vs. continue, how to narrate wave completions. These are open-ended decisions where behavioral bias from a specific persona would improve consistency. There is no `<persona>` block.

**Concrete fix:**

```xml
<persona>
You are a release engineering orchestrator. Your role is to coordinate parallel plan execution, detect cross-plan conflicts, and produce a clear audit trail of what was built and why.

Your strengths:
- Detecting false-positive completion signals through spot-checks
- Surfacing cross-plan integration failures before the next wave begins
- Producing concise, human-readable wave summaries from dense SUMMARY.md content
- Routing to the correct recovery path when agents fail or tests break
</persona>
```

---

### Issue 7 — CoT not elicited for multi-step dependency reasoning (Section 2)

**Guide principle:** Section 2 requires a CoT trigger for multi-step logic tasks: "Take a deep breath and work on this problem step-by-step." The `discover_and_group_plans` step and the intra-wave `files_modified` overlap check both require symbolic multi-step reasoning over dependency graphs.

**What's missing:** The overlap detection algorithm is described as pseudocode, which helps, but no CoT trigger is attached to the steps where the model must reason through plan dependencies, wave ordering, and conflict resolution. The model is expected to perform this reasoning silently.

**Concrete fix:** Add a CoT trigger to the `discover_and_group_plans` step preamble and the overlap check:

```xml
<step name="discover_and_group_plans">
Take a deep breath and work through plan grouping step-by-step:
1. Load the plan index.
2. For each plan, record its wave assignment and files_modified list.
3. For each wave, check every pair of plans for shared files.
4. Record your grouping decisions before spawning any agents.

<analysis>
[Model works through wave grouping and conflict detection here before reporting]
</analysis>
...
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `execute-phase.md` as a prompt artifact.

### Task Specification
- [ ] Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (purpose and core_principle present but no `<audience>` or `<quality_bar>`)
- [ ] All constraints are compatible — no conflicts between scope, length, or depth — **PASS** (no detected conflicts)

### Chain of Thought
- [ ] CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **FAIL** (CoT absent for dependency graph reasoning in discover_and_group_plans and overlap check)
- [ ] CoT trigger used: "Take a deep breath and work on this problem step-by-step." — **FAIL** (trigger phrase never appears)
- [ ] Reasoning is elicited before the answer, not after — **N/A** (no CoT present)
- [ ] CoT traces are treated as heuristic aids, verified against ground truth downstream — **N/A**

### Few-Shot Examples
- [ ] Examples selected by semantic similarity — **N/A** (no few-shot examples in this workflow)
- [ ] 2–5 examples total — **N/A**
- [ ] Ordered simple → complex — **N/A**
- [ ] Examples span diverse sub-types — **N/A**
- [ ] Format is consistent across all examples — **N/A**
- [ ] Example order is fixed across all evaluation runs — **N/A**

### Formatting
- [ ] Instruction is complete and clear before any formatting is applied — **PASS** (purpose and core_principle precede step detail)
- [ ] Prompt sections are separated by semantically named XML tags — **PARTIAL** (steps use `<step name="...">` correctly; constraint rules and output specs buried in prose within steps)
- [ ] At least 3 format variants will be tested on the target model — **FAIL** (no evidence of format testing)

### Instruction Framing
- [ ] All negative instructions have been converted to positive equivalents — **FAIL** (8+ negative instructions used as primary directives)
- [ ] Priority order is explicit when multiple criteria apply — **FAIL** (offer_next and checkpoint_handling have implicit priority ordering)
- [ ] Tie-breaking rules match the domain's cost asymmetry — **FAIL** (no explicit tie-breaking; timeout case in step 5.7 is ambiguous)

### Persona
- [ ] Persona is included only for open-ended or stylistic tasks — **FAIL** (no persona present despite open-ended orchestration decisions)
- [ ] Persona is specific (constrains voice/register), not generic — **FAIL** (no persona to evaluate)
- [ ] Persona descriptor is gender-neutral — **N/A**

### Output Format
- [ ] Structured output tasks use a two-step reasoning-then-format approach — **N/A** (not a structured-output task)
- [ ] Single-call JSON places reasoning fields before answer fields — **N/A**
- [ ] Constrained decoding adopted only after free-form + post-processing proven insufficient — **N/A**
- [ ] Machine-parsed output uses exact format specification with literal string requirements — **PARTIAL** (VERIFICATION.md status values and SUMMARY.md Self-Check marker specified by example in prose but not in a dedicated `<output_format>` block)

### Context Placement
- [ ] Task instruction is at the start of the prompt — **PASS** (`<purpose>` and `<core_principle>` lead)
- [ ] Primary document or input is at the end of the prompt — **PASS** (`<resumption>` and `<failure_handling>` close the file; `<process>` steps are the body)
- [ ] Background context is in the middle — **PASS** (`<runtime_compatibility>`, `<required_reading>`, `<available_agent_types>` appear before `<process>`)
- [ ] All irrelevant context has been removed — **PASS** (no obvious filler)
- [ ] Time-sensitive injected context is labeled as a snapshot — **N/A** (no runtime snapshot injection at this level)

### Self-Consistency
- [ ] Self-consistency applied only to tasks with a single correct answer — **N/A**
- [ ] Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- [ ] Redundant instructions and repeated context removed — **PARTIAL** (the test runner detection block appears verbatim twice: in `execute_waves` step 5.6 and `regression_gate`; the git worktree cleanup logic is very long and may benefit from extraction)
- [ ] Long prompts compressed before sending — **N/A** (this is a workflow file, not a runtime prompt)
- [ ] RAG context is extracted relevant passage only — **N/A**

### System/User Split
- [ ] Persistent instructions are in the system prompt — **N/A** (workflow files are not system/user split)
- [ ] Task-specific instructions are in the user prompt — **N/A**
- [ ] Each instruction appears in exactly one location — **PARTIAL** (the test runner detection bash block is duplicated between step 5.6 and `regression_gate`)
- [ ] Safety-critical constraints have external validation independent of the prompt — **PASS** (spot-checks via filesystem and git log validate agent completion claims)

### Agent/Subagent
- [ ] Agent prompts are fully self-contained — **PASS** (executor prompt includes all context via @-references and explicit `<files_to_read>`)
- [ ] All file paths in agent output are absolute — **PARTIAL** (enforced within subagent prompts; not explicitly stated as a constraint in the orchestrator's own output)
- [ ] Parallel agents are launched in a single message block — **FAIL** (the file explicitly reverses this guidance: "dispatch each Task() call one at a time" due to git worktree lock contention — this is a deliberate and justified deviation from the guide, but is a FAIL against the checklist as written)
- [ ] Adversarial probes specified for verification agents — **PASS** (spot-check step 6 requires filesystem and git log verification before accepting completion)

### Structural Architecture
- [ ] Large prompts decomposed into atomic, single-responsibility modules — **PARTIAL** (execute-phase.md references execute-plan.md, checkpoints.md, tdd.md, etc., but the orchestration logic itself is monolithic at ~1,500 lines)
- [ ] Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate — **PASS** (consistently used)
- [ ] Modules compose at runtime via variable substitution, not copy-paste — **PASS** (@-reference pattern used for shared content)

### Constraint Enforcement
- [ ] Every restriction is paired with an equally concrete permission — **FAIL** (restrictions scattered in prose; no `<permitted>` / `<reserved_for_human_review>` pairing)
- [ ] Hard exclusion lists are enumerated, not described qualitatively — **PASS** (available_agent_types, worktree skip conditions, and similar exclusions are enumerated)
- [ ] Known edge cases have precedent-style rulings — **PASS** (`classifyHandoffIfNeeded` false failure, submodule detection, Copilot sequential mode are all explicitly ruled)
- [ ] Confidence thresholds are numeric, not qualitative — **N/A** (not a filtering task)

### Decision Frameworks
- [ ] Multi-option recommendations use an explicit decision tree or comparison table — **PARTIAL** (runtime_compatibility uses a pseudo-decision tree in prose; some option blocks use numbered lists; no formal ASCII decision tree)
- [ ] Criteria checklists gate complex approaches — **PASS** (`<success_criteria>` in executor prompts; wave safety check before spawning)
- [ ] Action permissions framed around reversibility — **PARTIAL** (worktree isolation, --no-verify, and merge patterns are framed around recoverability; not explicitly using `<take_freely>` / `<confirm_with_user>` tags)

### Multi-Phase Workflows
- [ ] Complex tasks organized into explicit named phases — **PASS** (`<step name="...">` throughout)
- [ ] Required steps distinguished from type-specific steps — **PASS** (`priority="first"` on mandatory steps; optional steps marked Skip if config false)
- [ ] Scenario-based branching handles multiple paths explicitly — **PASS** (runtime_compatibility, cross_ai_delegation, checkpoint_handling all enumerate scenarios)

### Memory and Continuity
- [ ] Memory templates use XML tags as section labels — **N/A** (not a memory-writing workflow)
- [ ] Compaction summaries include discoveries and failed approaches — **N/A**
- [ ] Next steps tied to user's most recent explicit request — **PASS** (offer_next step explicitly checks CONTEXT.md existence and routes accordingly)

### Modularity
- [ ] Each prompt component has a single responsibility — **PARTIAL** (steps are focused, but execute-phase.md bundles orchestration, verification, code review, TDD review, schema drift, regression testing, and artifact lifecycle into one file)
- [ ] Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` block; the file has no explicit statement of what it does not handle)

### Safety and Trust
- [ ] Validation at system boundaries only; internal interfaces trusted — **PASS** (spot-checks validate external agent outputs; internal config reads are trusted)
- [ ] Dual-use capabilities state permissions before restrictions — **PASS** (cross_ai_delegation states activation logic before failure/abort paths)
- [ ] Authorization narrow-scoped; each action confirmed before expanding scope — **PASS** (checkpoint handling, schema drift gate, and test failure paths all confirm before expanding)

### Tone and Style
- [ ] Size constraints use numeric limits, not qualitative descriptors — **PASS** (timeout: 300 seconds, context window thresholds: 200000, 500000 are numeric)
- [ ] Instructions use imperative present tense — **PARTIAL** (most steps use imperative present tense; some use "should" and "may" which softens directives unnecessarily)
- [ ] Working notes in analysis tags, not user-facing output — **FAIL** (no `<analysis>` tags used; reasoning about dependency graphs and wave grouping happens inline)

### Optimization
- [ ] Prompt flagged as a draft for automated optimization — **FAIL** (no flag or note)
- [ ] Correct optimizer selected — **FAIL** (not addressed; this multi-step pipeline would be a DSPy MIPROv2 candidate)
- [ ] Held-out test set reserved before optimization begins — **FAIL** (not addressed)

---

## Recommendations

Prioritized from highest to lowest impact on model reliability.

### 1. Convert negative instructions to positive equivalents (Section 5, Action 1)

This is the highest-leverage change because negative instructions leave the model's default behavior undefined — they say what not to do but not what to do instead. With 8+ negated primary directives, the model may comply literally while finding technically non-violating workarounds. Apply the Section 5 conversion table mechanically to every "Do NOT", "Never", and "do not" that serves as a primary directive. Expected effort: 20–30 minutes. Expected gain: more predictable behavior in edge cases.

### 2. Add a consolidated `<constraints>` block with explicit permission pairing (Section 14)

Scattered inline constraints are harder for the model to reason against than a single canonical block. Consolidate all permissions and restrictions into a `<constraints>` block with `<permitted>`, `<reserved_for_human_review>`, and `<confirm_with_user>` sub-tags. This also makes the constraint set auditable at a glance — a reader can check all restrictions in one place. Expected effort: 30–45 minutes. Expected gain: fewer constraint violations in parallel execution edge cases.

### 3. Add task specification, audience, and quality bar (Section 1, Actions 1–2)

The workflow has no explicit audience or quality bar. Adding a `<task>`, `<audience>`, and `<quality_bar>` block at the top costs minimal space and gives the model a self-evaluation reference throughout execution. Without a quality bar, the model has no criterion for deciding when a wave completion report is "good enough" versus when it needs to surface more detail. Expected effort: 10 minutes.

### 4. Add explicit priority ordering for competing trigger conditions (Section 5, priority ordering)

The `offer_next`, `checkpoint_handling`, and `execute_waves` step 5.7 all have conditions that could overlap or conflict. A `<priority_order>` block for each removes ambiguity and prevents the model from choosing arbitrarily when signals are mixed. This is particularly important for the `--auto` / `AUTO_CHAIN` / `AUTO_CFG` trio in `offer_next`, where the wrong choice silently skips user interaction. Expected effort: 15 minutes.

### 5. Add a CoT trigger for dependency graph reasoning (Section 2)

The `discover_and_group_plans` step and the intra-wave `files_modified` overlap check both require the model to reason through a dependency graph — a multi-step symbolic reasoning task that reliably benefits from CoT. Adding "Take a deep breath and work on this problem step-by-step" plus an `<analysis>` scratchpad block to these two steps costs nothing and reduces mis-groupings. Expected effort: 5 minutes.
