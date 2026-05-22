# Critique: profile-user.md

## Summary

`profile-user.md` is a well-structured, operationally complete workflow that orchestrates a complex multi-phase user interaction with clear branching logic, readable step sequencing, and solid UX copy. The numbered phases create good cognitive boundaries, and the bash snippets give the executing agent concrete, unambiguous commands. However, the workflow is written in a hybrid markdown/XML style that partially applies the guide's structural conventions rather than committing to them fully. The most significant gaps are: the absence of a `<task>`, `<persona>`, or `<output_format>` preamble to orient the executing agent; inconsistent handling of negative instructions; no explicit priority ordering when multiple flags conflict; no `<constraints>` block pairing restrictions with permissions; and no `<audience>` or `<quality_bar>` specification at the top level. These omissions leave the agent to infer intent at the boundaries most likely to produce variance.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** Steps 1–10 map to named, sequenced phases. Each phase has a clear trigger condition and a discrete completion state. The model is unlikely to bleed across phase boundaries.

- **Section 16 — Scenario-based branching is explicit.** The `--questionnaire` / `--refresh` / default path splits are enumerated with clear `if/else` branching rather than left to the model's inference.

- **Section 5 — Conditional instructions are used for flag detection.** The `--text` / `TEXT_MODE` branching in Step 1 is an example of explicit conditional framing as recommended.

- **Section 13 — Template variable injection is present.** `$ARGUMENTS`, `$HOME`, `$ANALYSIS_PATH`, `$TEMP_DIR`, and `$ANSWERS_PATH` are used consistently for runtime variable substitution.

- **Section 8 — Context placement is sound within each step.** Each step leads with the action instruction, then provides bash snippets, then specifies the display output — matching the task-first, input-last pattern.

- **Section 14 — Error handling is specified for artifact generation (Step 9).** The retry/skip pattern for failed `gsd-sdk query` calls pairs a restriction (failure) with a concrete recovery path.

- **Section 21 — Size constraints on display output are partially numeric.** "Pick 3-4 dimensions" in the highlight reel section is a concrete count rather than a qualitative descriptor like "a few."

- **Section 16 — `<success_criteria>` functions as a required-steps checklist.** The bulleted checklist at the end maps to mandatory outcomes, echoing the `<required_steps universal="true">` pattern.

---

## Issues

### Issue 1 — No top-level `<task>` block defining what the executing agent must accomplish

**Guide reference:** Section 1 Action 1; Section 4 Action 2; Section 8 Action 1.

**What's missing:** The workflow opens with a `<purpose>` tag that describes the workflow at a product level, but there is no `<task>` instruction telling the executing agent what it must *do*. The agent must infer its role (orchestrator vs. executor), its authority scope, and its success definition from the prose body. Section 1 Action 1 requires explicit extraction of: (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. Section 8 Action 1 requires the task instruction to lead the prompt.

**Concrete fix:**

```xml
<task>
You are an orchestration agent. Execute the developer profiling workflow defined in
<process> below. Follow each numbered step in sequence. Branch on flag conditions
exactly as specified. Do not skip steps unless the branching logic explicitly permits it.
Emit user-facing display strings verbatim as shown. Complete when step 10 finishes
and temp files are cleaned up.
</task>
```

Place this block before `<required_reading>`.

---

### Issue 2 — No `<persona>` scoping the agent to orchestration-only behavior

**Guide reference:** Section 6 Action 1–2; Section 22 Pattern 1.

**What's missing:** The workflow spawns a `gsd-user-profiler` subagent to do profiling analysis, but the orchestrating agent's own role is undefined. Without a persona that constrains the orchestrator to sequencing, branching, and UX — not analysis — the agent may perform analysis inline rather than delegating, or produce extraneous output.

**Concrete fix:**

```xml
<persona>
You are a workflow orchestration specialist. Your role is sequencing steps, evaluating
branch conditions, calling tools, and surfacing user-facing output exactly as specified.
You do not perform analysis or generate profile content directly — that is delegated
to the gsd-user-profiler agent.
</persona>
```

The reframe pattern (Section 6) applies here: "Your job is not to analyze sessions — it's to orchestrate the pipeline that does."

---

### Issue 3 — No `<constraints>` block; permissions and restrictions are implicit

**Guide reference:** Section 14; Section 22 Pattern 9.

**What's missing:** The workflow implicitly restricts the agent (read-only file access, no modification of session files, temp-only writes) but never states these constraints in a `<constraints>` block with paired `<permitted>` and `<reserved_for_human_review>` sub-tags. The consent screen copy states "read-only, nothing modified" as UX text, but this does not instruct the agent's own behavior. Section 14 requires every restriction to be paired with an equally concrete permission statement.

**Concrete fix:**

```xml
<constraints>
  <permitted>
    - Read session JSONL files and reference documents
    - Write temp files to /tmp only; clean them up on completion
    - Run gsd-sdk query subcommands as specified
    - Use AskUserQuestion and Task tools
  </permitted>

  <reserved_for_human_review>
    - Modifying existing session files or JSONL data
    - Writing to any path outside /tmp and $HOME/.claude/get-shit-done/
    - Spawning agents not named in this workflow
  </reserved_for_human_review>
</constraints>
```

---

### Issue 4 — Multiple flag combinations produce undefined behavior; no priority ordering

**Guide reference:** Section 1 Action 3; Section 5 (Priority ordering).

**What's missing:** The workflow handles `--questionnaire`, `--refresh`, and `--text` flags individually but never specifies behavior when they conflict or combine. For example: what happens when both `--questionnaire` and `--refresh` are passed simultaneously? The `--refresh` path backs up the existing profile and then continues to step 2, which skips the consent gate for `--questionnaire` — but the interaction between the two flags is not resolved. Section 1 Action 3 requires a constraint compatibility audit; Section 5 requires explicit priority ordering when multiple criteria apply.

**Concrete fix:** Add a flag priority block immediately after the flag parsing step in Step 1:

```xml
<priority_order>
  1. --questionnaire takes precedence over --refresh for path selection
     (questionnaire path skips session analysis regardless of --refresh)
  2. --refresh applies to profile backup and diff display on any path
  3. --text applies globally to all AskUserQuestion calls on any path
</priority_order>
```

Also add to Step 1's constraint check:

```xml
<constraint_check>
  Flag A: --questionnaire (skip session analysis)
  Flag B: --refresh (backup and rebuild profile)
  Status: COMPATIBLE — --refresh applies to backup/diff; --questionnaire applies to analysis path
  Resolution: --questionnaire + --refresh = questionnaire path with backup and diff display
</constraint_check>
```

---

### Issue 5 — Negative instructions are used without conversion to positive equivalents

**Guide reference:** Section 5 Action 1.

**What's missing:** Several instructions are framed negatively. Examples:
- "Nothing is sent to external services" (consent screen UX — acceptable, but the agent instruction counterpart is missing its positive form)
- "skip split resolution since questionnaire handles ambiguity internally" — this is a negative scope exclusion without a positive statement of what the agent *does* instead
- "Do not skip steps unless the branching logic explicitly permits it" — implied but not written; the workflow relies on the agent inferring "follow steps in order"

Section 5 Action 1 requires scanning for negative primary directives and converting them.

**Concrete fix:**

| Current (negative or implicit) | Replacement (positive) |
|---|---|
| "skip split resolution since questionnaire handles ambiguity internally" | "Proceed directly to step 5 from step 4b. Questionnaire answers are pre-resolved." |
| (implicit) steps must be followed in order | "Execute steps 1–10 in sequence. Advance to the next step only when the current step's completion condition is met." |

---

### Issue 6 — No `<audience>` or `<quality_bar>` top-level specification

**Guide reference:** Section 1 Action 1–2; Section 4 XML tag vocabulary.

**What's missing:** The guide requires explicit identification of the audience (who will consume the output) and a quality bar (what makes a high-quality response). The workflow's audience — a developer using Claude Code who may or may not have prior sessions — is known but never encoded in the prompt. The quality bar for the orchestration (correct branching, verbatim UX strings, no leakage of internal tool calls into user-visible output) is implied by the step instructions but never stated at the top level.

**Concrete fix:**

```xml
<audience>
A developer using Claude Code for the first time running /gsd-profile-user. They may
have no prior GSD sessions. They expect clear, friendly UX output and no raw JSON or
internal tool call traces in their display.
</audience>

<quality_bar>
All 12 success criteria in <success_criteria> are satisfied. User-facing display strings
match the verbatim templates in each step. No internal analysis JSON, temp paths, or
tool error messages appear in user-visible output unless the error handling path in
step 9 is triggered.
</quality_bar>
```

---

### Issue 7 — `gsd-user-profiler` agent prompt is underspecified; missing `<commentary>` on intent

**Guide reference:** Section 3 (few-shot example construction, specifically `<commentary>`); Section 17 (self-contained agent prompts).

**What's missing:** Step 4a provides a template for the agent prompt passed to `gsd-user-profiler`, but it is thin. The template lacks: (a) a `<task>` wrapper, (b) an `<output_format>` specifying the `<analysis>` JSON structure, (c) `<constraints>` on what the profiler agent may and may not do, and (d) a `<commentary>` or rationale explaining why this is the expected output shape. Section 17 requires agent prompts to be fully self-contained. The current template assumes the profiler agent's reference doc contains all necessary instructions — a dependency that makes the orchestrator's prompt incomplete in isolation.

**Concrete fix:** Expand the agent prompt template in Step 4a:

```xml
<task>
  <goal>Analyze the developer's behavioral patterns from sampled Claude Code session messages.</goal>
  <unit_task>Read the profiling reference document, then analyze the sampled JSONL messages
  and return a complete analysis JSON block in the <analysis> format specified in the
  reference document. Score all 8 dimensions.</unit_task>
  <worker_instructions>
    Reference: @$HOME/.claude/get-shit-done/references/user-profiling.md
    Session data: @{temp_dir}/profile-sample.jsonl

    Analyze the messages and return ONLY the <analysis> JSON block.
    Do not include preamble, explanation, or commentary outside the <analysis> tags.
  </worker_instructions>
</task>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

### Task Specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` exists but no `<task>`, `<audience>`, or `<quality_bar>` |
| All constraints are compatible — no conflicts | FAIL | Flag combination `--questionnaire + --refresh` is unresolved |

### Chain-of-Thought
| Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT triggers present; task is orchestration, not reasoning |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|---|---|---|
| Instruction complete before formatting applied | PASS | Each step is fully specified before bash/display blocks appear |
| Prompt sections separated by semantically named XML tags | FAIL | `<purpose>`, `<required_reading>`, `<process>`, `<success_criteria>` are present, but `<task>`, `<persona>`, `<constraints>`, `<audience>`, `<output_format>` are absent |
| At least 3 format variants tested on target model | N/A | Not a prompt engineering evaluation context |

### Instruction Framing
| Item | Score | Notes |
|---|---|---|
| Negative instructions converted to positive equivalents | FAIL | "skip split resolution", implicit step-ordering instructions not positively stated |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering for flag combinations |
| Tie-breaking rules match domain cost asymmetry | FAIL | No tie-breaking specified; user interaction context favors recall-bias (err toward asking the user) |

### Persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended/stylistic tasks | FAIL | No persona defined; orchestration workflows benefit from a scoped persona |
| Persona is specific (constrains voice/register) | FAIL | Absent |
| Persona descriptor is gender-neutral | N/A | Absent |

### Output Format
| Item | Score | Notes |
|---|---|---|
| Structured output uses two-step reasoning-then-format | PASS | Agent analysis step separates sampling from display |
| Single-call JSON places reasoning fields before answer fields | N/A | JSON format is delegated to the profiler agent |
| Constrained decoding adopted only after free-form insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | `<analysis>` JSON extraction in Step 4a lacks an exact format spec in the orchestrator's prompt |

### Context Placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | FAIL | `<purpose>` leads, but it is descriptive, not instructional |
| Primary document/input at end of prompt | PASS | `<success_criteria>` closes the file as a terminal reference |
| Background context in middle | PASS | `<required_reading>` and step body are mid-document |
| All irrelevant context removed | PASS | No obvious bloat |
| Time-sensitive injected context labeled as snapshot | N/A | No injected runtime context in this file |

### Self-Consistency
| Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions removed | PASS | No obvious repetition |
| Long prompts compressed | N/A | Length is appropriate for a 10-step workflow |
| RAG context is extracted passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | Workflow file is loaded as a skill; split is handled by the runtime |
| Task-specific instructions in user prompt | N/A | |
| Each instruction in exactly one location | PASS | No duplicate instructions observed |
| Safety-critical constraints have external validation | FAIL | No external validation for the "read-only, nothing modified" claim |

### Agent/Subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts fully self-contained | FAIL | Profiler agent prompt template in Step 4a depends on the reference doc for output format; template is incomplete |
| All file paths in agent output are absolute | PASS | `$HOME`-prefixed paths are used consistently |
| Parallel agents launched in single message block | PASS | Step 9 explicitly serializes artifact generation with justification ("file I/O is fast") |
| Adversarial probes specified for verification agents | N/A | No verification agent in this workflow |

### Structural Architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic modules | PASS | References `gsd-user-profiler.md` and `user-profiling.md` as separate modules |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `$ARGUMENTS`, `$HOME`, `$ANALYSIS_PATH` etc. used consistently |
| Modules compose at runtime via variable substitution | PASS | `@$HOME/...` reference substitution used for agent spawning |

### Constraint Enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with a concrete permission | FAIL | Restrictions implied by UX copy, not paired in a `<constraints>` block |
| Hard exclusion lists enumerated, not qualitative | N/A | No filtering task requiring exclusion lists |
| Known edge cases have precedent-style rulings | FAIL | Flag combination edge cases have no precedent rulings |
| Confidence thresholds are numeric, not qualitative | FAIL | "Limited session data (N messages). Results may have lower confidence." uses qualitative language; the threshold `< 50 messages` is numeric but the consequence ("lower confidence") is not |

### Decision Frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or table | PASS | Branching logic is explicit at each decision point |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` serves this role |
| Action permissions framed around reversibility | FAIL | Backup step (`cp`) before refresh is reversibility-aware, but the reversibility framework is not applied to other actions (e.g., artifact writes) |

### Multi-Phase Workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | 10 numbered steps with distinct names |
| Required steps distinguished from type-specific steps | PASS | Universal steps (scan, consent) vs. path-specific steps (4a/4b) are clearly separated |
| Scenario-based branching handles multiple paths explicitly | PASS | `--questionnaire`, `--refresh`, and default paths are all enumerated |

### Memory and Continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | This workflow does not write memory files |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to most recent explicit user request | N/A | |

### Modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Workflow orchestration is separated from profiling analysis and artifact generation |
| Scope boundaries state both inclusions and exclusions | FAIL | `<purpose>` states inclusions ("what this workflow wires") but does not state explicit exclusions (e.g., "this workflow does not generate profile content directly") |

### Safety and Trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only | FAIL | No explicit boundary validation specified for parsed JSON from `gsd-sdk query` output |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use content |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | AskUserQuestion gates consent, refresh, and artifact selection before taking action |

### Tone and Style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits | PASS | "3-4 dimensions" in highlight reel; "8 questions" in questionnaire path |
| Instructions use imperative present tense | PASS | "Display:", "Parse:", "Run:", "Write:" consistently used |
| Working notes in analysis tags, not user-facing output | FAIL | No `<analysis>` tags used; all orchestration reasoning is inline prose |

### Optimization
| Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Ordered by impact on model reliability.

### 1. Add a `<task>`, `<persona>`, `<audience>`, and `<quality_bar>` preamble (highest impact)

The executing agent currently has no top-level orientation. Without a `<task>` instruction, the agent must infer its role from the process body. Without a `<persona>`, it may perform analysis directly instead of delegating. These four blocks cost fewer than 100 tokens and eliminate the largest source of behavioral variance. See Issues 1, 2, and 6. Place them before `<required_reading>`.

### 2. Add a `<constraints>` block with paired `<permitted>` and `<reserved_for_human_review>` sub-tags (high impact)

The workflow touches the user's file system, spawns agents, and writes to `$HOME`. The executing agent's permission scope is entirely implicit. A `<constraints>` block makes the read-only session data guarantee enforceable at the prompt level and pairs it with an explicit list of what the agent may do. See Issue 3 and Section 14.

### 3. Resolve flag combination priority ordering (high impact for edge-case correctness)

The `--questionnaire + --refresh` combination, and potentially `--text + --questionnaire`, produce undefined behavior. Add a `<priority_order>` block and a `<constraint_check>` in Step 1 immediately after flag parsing. This is a one-time, low-effort fix that prevents silent misbehavior on edge invocations. See Issue 4, Section 1 Action 3, and Section 5.

### 4. Expand the `gsd-user-profiler` agent prompt template to be fully self-contained (medium impact)

The template in Step 4a delegates output format definition to the reference document. If the reference document's format spec ever changes, or if the reference is not successfully loaded, the profiler agent produces unstructured output that the orchestrator cannot parse. Add an explicit `<output_format>` block inside the agent prompt template that specifies the `<analysis>` JSON schema inline. See Issue 7 and Section 17.

### 5. Convert negative/implicit instructions to positive equivalents and add a positive step-sequencing rule (medium impact)

Several instructions are framed as skips or negations. Rewrite each as a positive action statement. Add one explicit rule at the top of `<process>`: "Execute steps 1–10 in sequence. Advance to the next step only when the current step's completion condition is met." This removes ambiguity for an agent that might otherwise attempt parallel execution or step skipping. See Issue 5 and Section 5 Action 1.
