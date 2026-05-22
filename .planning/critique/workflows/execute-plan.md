# Critique: execute-plan.md

## Summary

`execute-plan.md` is a dense, operationally mature orchestration workflow that covers a wide surface area: routing patterns, agent tracking, deviation handling, checkpoint protocols, TDD execution, and post-completion housekeeping. Its greatest strength is its comprehensiveness — most edge cases (parallel mode, worktree branch drift, auth gates, verification failure, pre-commit hooks) are explicitly handled. However, the prompt relies heavily on prose and ad hoc markdown rather than the guide's XML tag vocabulary, making sections harder for a model to parse unambiguously. Task routing logic is embedded in running prose and a single table, rather than structured as explicit named phases or scenarios. Several high-priority guide principles — positive instruction framing, explicit output format specification, and context placement order — are partially or fully violated. The workflow would benefit most from a structural reorganization into named `<phase>` and `<scenario>` blocks and a pass to convert negative and imperative-buried instructions into the guide's positive-framing pattern.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern:** The workflow is implicitly phased (init → identify → execute → verify → summarize → commit → offer_next). `<step name="...">` tags approximate the guide's `<phase>` pattern and provide cognitive boundaries between stages.
- **Section 16 — required vs. optional steps:** The `universal="true"` distinction is implicitly honored: load context and parse segments are always required; TDD, segment execution, and user setup are conditional. Required/optional separation is operationally correct even if not using the guide's `<required_steps>` / `<type_specific_strategy>` tags.
- **Section 15 (Decision Frameworks) — comparison table:** The checkpoint routing table (Pattern A/B/C by checkpoint count) is a strong application of Section 15's comparison-table pattern. It makes a multi-option decision tractable at a glance.
- **Section 14 (Constraint Enforcement) — precedents:** The `<authentication_gates>` and `<deviation_rules>` blocks function as precedent-style rulings (Section 14) — named exception categories with explicit handling protocols that override the general execution rule.
- **Section 17 (Agent and Subagent Patterns) — absolute paths and worktree isolation:** The worktree branch-check block (git reset --hard before work) and the `IS_WORKTREE` pattern for detecting parallel mode are well-engineered safety patterns consistent with Section 17's absolute-path and agent isolation guidance.
- **Section 17 — parallel agent spawning:** Tracking protocol (current-agent-id.txt, agent-history.json, interrupted-agent handling) addresses the continuity and resumption concerns Section 17 implies for parallel agents.
- **Section 20 (Safety and Trust) — reversibility framing:** The pre-commit hook section correctly handles retry budgets and the `--no-verify` parallel mode exception — a domain-appropriate reversibility decision (Section 15).
- **Section 5 (Instruction Framing) — conditional branching:** `<if mode="yolo">` / `<if mode="interactive">` blocks are clean conditional branches that match the guide's explicit conditional-branching pattern (Section 5).

---

## Issues

### Issue 1: Structural tags do not use the guide's XML vocabulary

**Principle:** Section 4 Action 2 — use semantically named XML tags to separate prompt sections (`<task>`, `<context>`, `<constraints>`, `<output_format>`, `<persona>`).

**What's wrong:** The workflow uses `<purpose>`, `<required_reading>`, `<available_agent_types>`, `<process>`, `<step>`, `<authentication_gates>`, `<deviation_rules>`, `<deviation_documentation>`, `<tdd_plan_execution>`, `<precommit_failure_handling>`, `<task_commit>`, `<success_criteria>` — none of which appear in the guide's XML tag vocabulary. While self-consistent internally, this diverges from the shared vocabulary that makes composed prompts interoperable (Section 4, XML tag vocabulary table). A model working across multiple workflow files in this system has no consistent tag semantics to rely on.

**Concrete fix:** Replace the top-level container tags:

```xml
<task>
  Execute a phase prompt (PLAN.md) and create the outcome summary (SUMMARY.md).
</task>

<constraints>
  <required_reading>...</required_reading>
  <permitted>...</permitted>
</constraints>

<context>
  <available_agent_types>...</available_agent_types>
</context>
```

Map `<process>` → `<task>` body (or a series of `<phase>` blocks). Map `<success_criteria>` → `<quality_bar>`. Map `<deviation_rules>` and `<authentication_gates>` → `<constraints>` sub-tags.

---

### Issue 2: Steps are not structured as explicit named phases

**Principle:** Section 16 — organize complex multi-step tasks into explicit named `<phase id="N" name="..." trigger="...">` blocks. "Phases create cognitive boundaries. The model completes one phase fully before beginning the next."

**What's wrong:** The workflow uses `<step name="...">` tags, which are not in the guide's vocabulary and carry no `id`, `trigger`, or `mode` attributes. There is no explicit signal to the model about when one phase ends and another may begin, or what triggers the transition. The routing decision (Pattern A/B/C) is resolved inside `<step name="parse_segments">` rather than encoded as separate phase entries or scenarios. A model reading this must infer phase boundaries from prose rather than from structure.

**Concrete fix:** Restructure the three execution patterns as explicit phases with triggers:

```xml
<phase id="1" name="Load Context" trigger="on_entry">
  <!-- init_context + identify_plan steps -->
</phase>

<phase id="2" name="Route Execution" trigger="after_phase_1">
  <scenarios>
    <scenario id="A" condition="task_count <= inline_threshold">...</scenario>
    <scenario id="B" condition="verify_only_checkpoints">...</scenario>
    <scenario id="C" condition="decision_checkpoints_or_inline">...</scenario>
  </scenarios>
</phase>

<phase id="3" name="Finalize" trigger="after_execution">
  <!-- create_summary + commit + offer_next steps -->
</phase>
```

---

### Issue 3: Routing logic uses a mixed table-and-prose pattern instead of a decision tree

**Principle:** Section 15 (Decision Frameworks) — "ASCII decision trees make 'it depends' situations tractable. Each branch has one clear recommendation."

**What's wrong:** The Pattern A/B/C routing is split across two locations: a prose paragraph ("Primary routing: task count threshold (#1979)") followed by a markdown table. The prose condition and the table condition must be mentally joined by the model. There is no single entry point that walks the model through the decision in order. The `#1979` reference is an opaque internal issue number that provides no semantic value to the model.

**Concrete fix:** Replace with a single ASCII decision tree:

```
Is INLINE_THRESHOLD > 0 AND TASK_COUNT <= INLINE_THRESHOLD?
  YES → Pattern C (inline, main context)
  NO  → Does the plan have checkpoints?
          NO checkpoints → Pattern A (autonomous subagent, full plan)
          Verify-only checkpoints → Pattern B (segmented subagents)
          Decision checkpoints → Pattern C (main context)
```

Remove the `#1979` reference — it is meaningless to the executing model.

---

### Issue 4: Negative and passive instructions not converted to positive equivalents

**Principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

**What's wrong:** The workflow contains multiple primary-directive negatives:
- "do NOT re-read the source files to discover types"
- "do NOT silently skip it"
- "Skip this step if running in parallel mode"
- "you CANNOT interact with user directly" (in checkpoint_return_for_orchestrator)
- "do not duplicate or paraphrase the full protocol here"
- "Skip for A/C"

**Concrete fix (representative conversions):**

```
# Before
"do NOT re-read the source files to discover types"
# After
"Use the pre-extracted type definitions in <interfaces> directly as ground truth."

# Before
"Skip this step if running in parallel mode"
# After
"Run this step only when IS_WORKTREE is false (sequential mode)."

# Before
"you CANNOT interact with user directly"
# After
"Return structured state to the orchestrator; the orchestrator handles user interaction."
```

---

### Issue 5: No output format specification for the workflow's own outputs

**Principle:** Section 7 Action 1 and Section 22 Pattern 3 — "Output format specified completely and upfront. State the required output structure, field names, ordering, and an example before the model begins its task."

**What's wrong:** The workflow instructs the model to create SUMMARY.md and report completion, but provides no `<output_format>` block specifying what the orchestrator receives at the end of execution. The only output specification is buried in `<step name="checkpoint_return_for_orchestrator">` (for the subagent-to-orchestrator handoff) and is prose-described, not exemplified. The final `offer_next` output format — which differs across routes A, B, and C — is table-driven but has no canonical example of what the user-facing completion message should look like.

**Concrete fix:** Add an `<output_format>` block near the top:

```xml
<output_format>
Final execution report (surface to user after offer_next):

1. Completion banner: "Phase [X] Plan [Y]: [Name] — COMPLETE"
2. Duration and task count
3. If USER_SETUP_CREATED: "WARNING: User setup required — see [path]"
4. Next step suggestion (one of routes A/B/C)
5. "/clear first for fresh context"

Subagent-to-orchestrator structured return (when hitting checkpoint):
1. Completed Tasks table: | Task # | Hash | Files |
2. Current Task: what is blocking
3. Checkpoint Details: user-facing content verbatim
4. Awaiting: exact input needed from user
</output_format>
```

---

### Issue 6: Context placement order is not followed

**Principle:** Section 8 — task instruction at the start, primary input at the end, background context in the middle.

**What's wrong:** The workflow opens with `<purpose>` (task instruction) — correct. But `<required_reading>` (a constraint/context item) immediately follows before `<available_agent_types>` (another context item), and then `<process>` (the primary operational body). The `<success_criteria>` block is placed at the very end, which is correct for a quality bar. However, the operational body (`<process>`) and the constraint blocks (`<deviation_rules>`, `<authentication_gates>`) are interleaved inside `<process>` rather than separated at the top level. This means background constraints and primary execution instructions compete for the same attention zone.

**Concrete fix:** Restructure the top-level order:

```
1. <task>       — what to do (high attention, start)
2. <constraints> — deviation rules, auth gates, commit protocol (middle)
3. <context>    — available agents, config references (middle)
4. <process>    — execution phases (primary body, high attention, end)
5. <quality_bar> — success criteria (end)
```

---

### Issue 7: No persona assigned despite the task being complex and domain-specific

**Principle:** Section 6 Action 2 — "Make personas specific, not generic. A persona must constrain register, voice, or domain-specific style to be effective." Section 22 Pattern 1 — "State the agent's identity as a specific expert in the exact domain the task requires."

**What's wrong:** The workflow has no `<persona>` block. The executing model has no explicit identity constraint and defaults to generic assistant behavior. For an orchestration agent that must make prioritized routing decisions, handle deviation escalation, and know when to stop vs. auto-fix, a domain-specific persona would anchor decision-making style.

**Concrete fix:**

```xml
<persona>
You are a disciplined software build orchestrator. Your role is to execute structured plans
with precision, route work to subagents at the right granularity, and escalate only when
a decision exceeds your authorization scope.

Your strengths:
- Reading plan files and executing tasks in declared order
- Routing execution patterns based on task count and checkpoint type
- Detecting deviations and applying the correct rule (auto-fix vs. STOP)
- Producing accurate, substantive SUMMARY.md files that capture what was actually built
</persona>
```

---

### Issue 8: `<success_criteria>` uses qualitative descriptors without measurable thresholds

**Principle:** Section 21 — "Size constraints use numeric limits, not qualitative descriptors." Section 14 — "Confidence thresholds are numeric, not qualitative."

**What's wrong:** The `<success_criteria>` block lists conditions like "All verifications pass" and "SUMMARY.md created with substantive content" without specifying what "passes" or "substantive" means in measurable terms. The one quantitative rule (STATE.md under 150 lines) appears in a step body, not in the success criteria.

**Concrete fix:**

```xml
<quality_bar>
- All <acceptance_criteria> in every task return PASS on explicit command execution
- SUMMARY.md one-liner is >= 8 words and names the specific technology/pattern used (not "feature implemented")
- STATE.md file length <= 150 lines after update
- git log contains >= 1 commit matching the docs({phase}-{plan}) pattern
- ROADMAP.md plan row shows "Complete" with today's date
</quality_bar>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `execute-plan.md` as a prompt artifact.

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | Intent (`<purpose>`) is present; audience is implicit (the executor model); quality bar (`<success_criteria>`) is present but qualitative |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS | No detected constraint conflicts |

### Chain of Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger present; task is procedural execution, not reasoning-heavy — omission is correct |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before the answer | N/A | |
| CoT traces treated as heuristic aids | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | N/A | No few-shot examples; task is procedural workflow |
| 2-5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across all examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete and clear before formatting applied | PASS | `<purpose>` precedes all structure |
| Prompt sections separated by semantically named XML tags | FAIL | Tags used (`<step>`, `<process>`, `<deviation_rules>`) are not from the guide's vocabulary (Section 4) |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | Multiple primary-directive negatives present (Issue 4 above) |
| Priority order explicit when multiple criteria apply | PASS | Deviation rule priority ("Rule 4 > Rules 1-3 > unsure → Rule 4") is explicitly stated |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule; the deviation escalation path (max 3 retries → escalate) implies one but it is not stated as a tie-breaking rule |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended or stylistic tasks | N/A | No persona present; task is procedural |
| Persona is specific (constrains voice/register), not generic | FAIL | No persona at all; a domain-specific orchestrator persona would improve decision-making consistency (Issue 7) |
| Persona descriptor is gender-neutral | N/A | |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output tasks use two-step reasoning-then-format | N/A | Not applicable; outputs are file artifacts and user messages, not structured JSON |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Subagent checkpoint return format is described in prose, not as an exact format with literal field requirements (Issue 5) |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | PASS | `<purpose>` is first |
| Primary document or input at end of prompt | FAIL | `<success_criteria>` is last (correct), but the primary execution body (`<process>`) is interrupted by constraint blocks interleaved throughout |
| Background context in the middle | FAIL | Constraint blocks (`<authentication_gates>`, `<deviation_rules>`) are embedded inside `<process>` rather than placed before it as background (Issue 6) |
| All irrelevant context removed | PASS | No obvious padding or tangential content |
| Time-sensitive injected context labeled as snapshot | N/A | No time-sensitive injected context |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Self-consistency applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15-20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | FAIL | `IS_WORKTREE` detection logic is copy-pasted verbatim in three separate steps (`update_current_position`, `update_roadmap`, `git_commit_metadata`) instead of defined once |
| Long prompts compressed before sending | N/A | Not applicable to a workflow definition file |
| RAG context is extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow files are not split into system/user; they are loaded as-is |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | FAIL | `IS_WORKTREE` detection duplicated in three steps; commit semantics deferred to `gsd-executor.md` but the deferral instruction itself is repeated in prose |
| Safety-critical constraints have external validation independent of prompt | PASS | Acceptance criteria verification loop and verification failure gate implement external validation |

### Agent/Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PASS | Pattern A spawn prompt includes all required context inline |
| All file paths in agent output are absolute | PASS | Paths use `.planning/phases/XX-name/` patterns; step instructions consistently use full relative-from-root paths |
| Parallel agents launched in single message block | PASS | "Launch them all in a single message block" is stated in Pattern A |
| Adversarial probes specified for verification agents | N/A | This workflow is an executor, not a verifier; verification is delegated to node-repair and acceptance criteria |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | FAIL | Deviation rules, TDD execution, pre-commit handling, and checkpoint protocols are embedded inline rather than referenced as separate modules |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS | `${PHASE}`, `${PLAN}`, `${PLAN_PATH}` patterns used consistently |
| Modules compose at runtime via variable substitution | PASS | `@~/.claude/get-shit-done/references/git-integration.md` and similar `@` imports demonstrate modular composition |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with equally concrete permission | FAIL | `<authentication_gates>` lists what triggers a stop but does not pair with explicit permissions for what the agent may do autonomously while waiting |
| Hard exclusion lists enumerated, not described qualitatively | PASS | Deviation rules (1-3 auto, Rule 4 STOP) are enumerated by number |
| Known edge cases have precedent-style rulings | PASS | `classifyHandoffIfNeeded` bug ruling is a model precedent-style carve-out |
| Confidence thresholds numeric, not qualitative | FAIL | "substantive content" in success criteria; no numeric thresholds for quality gates |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use decision tree or comparison table | FAIL | The Pattern A/B/C routing uses a prose paragraph + table but not a unified decision tree (Issue 3) |
| Criteria checklists gate complex approaches | PASS | Pattern A worktree check (`workflow.use_worktrees`) and inline threshold check gate the routing decision |
| Action permissions framed around reversibility | PASS | Pre-commit `--no-verify` is framed around parallel blast radius; deviation rules distinguish auto-fix (low blast) from STOP (high blast) |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | FAIL | `<step>` tags approximate phases but lack `id`, `trigger`, and structural separation (Issue 2) |
| Required steps distinguished from type-specific steps | PASS | Implicit in routing: init/parse/finalize are always required; segment_execution/tdd_execution are type-specific |
| Scenario-based branching handles multiple paths explicitly | FAIL | Routing scenarios are embedded in prose and a table rather than using `<scenarios>`/`<scenario condition="...">` blocks (Issue 2) |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | N/A | Memory management is delegated to gsd-sdk state mutations, not defined in this file |
| Compaction summaries include discoveries and failed approaches | PASS | Deviation documentation format includes "Fix", "Verification", and "Impact" — functionally equivalent |
| Next steps tied to user's most recent explicit request | PASS | `offer_next` routes are tied to the current phase/plan state, not drift to unrelated work |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has single responsibility | FAIL | `<step name="execute">` handles task execution, checkpoint routing, deviation detection, and TDD branching — four responsibilities |
| Scope boundaries state both inclusions and exclusions | FAIL | No explicit `<scope>` with `<include>`/`<exclude>` blocks; scope is implied by what is and is not described |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | External calls (gsd-sdk, git) are verified; internal step results are trusted |
| Dual-use capabilities state permissions before restrictions | PASS | Deviation rules state what to auto-fix before what requires STOP |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | Rule 4 (architectural changes) explicitly requires STOP and user approval before proceeding |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "substantive content" (SUMMARY), "briefly" (not present but implied in some prose) — qualitative; only STATE.md's 150-line limit is numeric |
| Instructions use imperative present tense | PASS | Dominant style is imperative ("Read", "Extract", "Find", "Spawn") |
| Working notes in analysis tags, not user-facing output | PASS | No working notes leaked to user-facing output; internal bash blocks are clearly marked as implementation |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or candidate marker |
| Correct optimizer selected | FAIL | No optimizer selected or documented |
| Held-out test set reserved | FAIL | No test set referenced |

---

## Recommendations

Prioritized by impact on model execution quality:

### 1. Extract and deduplicate the `IS_WORKTREE` pattern (High impact, low effort)

The `IS_WORKTREE` bash block is copy-pasted identically in three steps (`update_current_position`, `update_roadmap`, `git_commit_metadata`). This violates Section 11 Action 3 ("State each instruction exactly once"). Extract it to a shared step executed once after `record_completion_time`, set the variable, and reference `$IS_WORKTREE` in subsequent steps. This also reduces prompt length (Section 10 Action 1).

### 2. Replace Pattern A/B/C prose+table routing with a single ASCII decision tree (High impact, medium effort)

Section 15's decision tree pattern directly applies to the routing logic. Consolidate the "Primary routing" paragraph and the checkpoint table into one tree (see Issue 3 fix). Wrap the three patterns in `<scenarios>` / `<scenario condition="...">` blocks (Section 16). This removes the requirement for the model to mentally join two separate representations of the same decision.

### 3. Convert all primary-directive negatives to positive equivalents (Medium impact, low effort)

A scan of the file finds at least six primary-directive negatives (Issue 4). Each takes one line to convert. This is a mechanical pass with no structural changes required. Positive framing is strictly better for instruction-tuned models per Section 5 Action 1.

### 4. Add a `<persona>` block scoped to the orchestrator role (Medium impact, low effort)

A 6-8 line persona block (see Issue 7 fix) anchors the executing model's decision-making style for deviation escalation, routing, and quality assessment. Generic assistant defaults are suboptimal for an orchestration agent making consequential, sequential decisions. Directly implements Section 6 Action 2 and Section 22 Pattern 1.

### 5. Add an `<output_format>` block with a concrete example of the completion report (Medium impact, medium effort)

The workflow produces user-facing output (completion banner, next-step suggestion) and orchestrator-facing output (checkpoint structured return), but neither is formally specified. Adding an `<output_format>` block with a concrete example (Section 22 Pattern 3) removes ambiguity about what the user and orchestrator should receive and makes the output parseable and auditable. Replace the qualitative "substantive content" criterion with numeric specificity in `<quality_bar>` (Issue 8).
