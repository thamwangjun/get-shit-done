# Critique: autonomous.md

## Summary

`autonomous.md` is a well-structured, operationally mature workflow prompt that handles a genuinely complex multi-phase orchestration task. It succeeds in the areas that matter most for agentic reliability: phase sequencing, branching on verification outcomes, blocker handling, and clear exit conditions. The `<step>` / `<process>` XML framing, named phases, and `<success_criteria>` checklist reflect strong command of Section 16 (Multi-Phase Workflows) and Section 17 (Agent and Subagent Patterns). However, the prompt has meaningful gaps in four areas the guide treats as non-negotiable: task specification (audience and quality bar are absent), instruction framing (negative instructions persist throughout), constraint enforcement (permissions are implicit, not paired), and output format (no explicit format specification for agent-to-agent output). These gaps are fixable with targeted additions rather than a structural rewrite.

---

## Strengths

- **Section 16 — Phase pattern:** The `<process>` / `<step>` structure with named steps (`initialize`, `discover_phases`, `execute_phase`, `iterate`, `lifecycle`, `handle_blocker`) is textbook application of the phase pattern. Each step has a clear entry condition, body, and exit. Cognitive boundaries are enforced.

- **Section 16 — Scenario-based branching:** Post-execution routing on `passed`, `human_needed`, and `gaps_found` with explicit conditional branches maps directly to the `<scenarios>` pattern. Edge cases (empty `VERIFY_STATUS`, retry limits) are handled explicitly rather than left to model inference.

- **Section 14 — Constraint enforcement (gap closure limit):** The "limit: 1 attempt" rule on gap closure is a concrete, numeric guard against infinite loops — exactly the kind of hard constraint the guide recommends over qualitative descriptions.

- **Section 16 — Required vs. type-specific steps distinction:** The UI design contract block (step 3a.5) and UI review block (step 3d.5) are gated behind config toggles and frontend detection logic, cleanly distinguishing mandatory from type-specific steps.

- **Section 5 — Conditional instructions:** The `--from`, `--to`, `--only`, and `--interactive` flag handling uses explicit conditional branching with concrete actions for each case, not vague "if applicable" hedging.

- **Section 17 — Parallel agent spawning:** The `INTERACTIVE` mode correctly dispatches plan and execute as background agents in a single dispatch block per phase, matching the single-message-block parallelism requirement.

- **Section 13 — Template variable injection:** `$ARGUMENTS`, `${PHASE_NUM}`, `${milestone_version}`, and `${PHASE_NAME}` are used consistently throughout, with no hard-coded values where variables should appear.

- **Section 16 — Status tables:** The Phase Plan display table (`| # | Phase | Status |`) provides structured progress output parseable by both humans and calling systems.

---

## Issues

### Issue 1 — Task specification: audience and quality bar are absent (Section 1, Actions 1–2)

**Principle:** Every prompt must explicitly encode (a) what output is requested, (b) why it matters, and (c) what a correct/high-quality response looks like. Audience domain knowledge must be stated.

**What's missing:** The `<purpose>` block states the "what" in one sentence but omits the "why" (how the output will be consumed) and the "quality bar" (what distinguishes a well-executed run from a poor one). There is no `<audience>` tag and no statement of who invokes this workflow or what they expect as output. Without this, the model lacks an anchor for evaluating its own output quality at the margin.

**Concrete fix:** Add to the top of the file, before `<required_reading>`:

```xml
<audience>
A developer using the GSD CLI to execute a milestone autonomously. They are technical, familiar with the GSD workflow lifecycle, and expect the agent to proceed without hand-holding. They will only see banners, prompts, and the final completion summary — not internal steps.
</audience>

<quality_bar>
A high-quality run: completes all in-scope phases without unnecessary pauses, surfaces only genuine blockers to the user, produces a readable final summary, and exits cleanly. A poor run: stalls on solvable errors, prompts unnecessarily, loses phase state, or exits without a summary.
</quality_bar>
```

---

### Issue 2 — Negative instructions throughout (Section 5, Action 1)

**Principle:** Before emitting any prompt, scan for negated instructions and rewrite each as a positive specification of the desired behavior. Exception: the reframe pattern (Section 6).

**What's missing:** The workflow contains multiple negative-primary directives that are not the reframe pattern:

- "Do not iterate." (iterate step)
- "Do not iterate further." (iterate step)
- "do NOT re-invoke discuss for the same phase" (step 3a)
- "If no incomplete phases remain" logic that results in "nothing to do" without specifying what the agent should do positively

**Concrete fix — apply the conversion table mechanically:**

| Current (negative) | Replacement (positive) |
|---|---|
| "Do not iterate. Proceed directly to lifecycle step." | "Proceed directly to the lifecycle step." |
| "Do not iterate further. Display: [banner]" | "Display the --to banner and proceed to the lifecycle step." |
| "do NOT re-invoke discuss for the same phase" | "Invoke discuss exactly once per phase. The `has_context` flag is the authoritative guard — once true, discuss is complete for that phase." |

---

### Issue 3 — Constraint enforcement: permissions are implicit, not paired (Section 14; Section 23 checklist — constraint_enforcement)

**Principle:** Every restriction must be paired with an equally concrete permission. Hard exclusion lists must be enumerated, not described qualitatively.

**What's missing:** The workflow invokes shell commands, reads files, writes CONTEXT.md, commits via `gsd-sdk`, and spawns agents — but there is no `<constraints>` block enumerating what the workflow is and is not permitted to do. The file says nothing about what actions require user confirmation (beyond the hardcoded `AskUserQuestion` calls) or what is out of bounds. A reader (or a calling orchestrator) cannot determine the permission boundary from the prompt alone.

**Concrete fix:** Add a `<constraints>` block after the `<purpose>` block:

```xml
<constraints>
  <take_freely>
    - Reading ROADMAP.md, STATE.md, VERIFICATION.md, CONTEXT.md, and REVIEW.md
    - Running gsd-sdk query commands (read-only)
    - Writing CONTEXT.md when discuss is skipped (auto-generated, not user-facing)
    - Displaying banners and progress tables
    - Committing via gsd-sdk query commit (auto-commit of generated context only)
  </take_freely>

  <confirm_with_user>
    - Accepting or deferring gaps (user choice via AskUserQuestion)
    - Continuing after audit finds gaps or tech debt
    - File deletion during cleanup (gsd-cleanup handles its own confirmation)
    - Skipping or stopping autonomous mode at a blocker
  </confirm_with_user>

  <exclusions>
    - Autonomous mode never retries gap closure more than once per phase.
    - Autonomous mode never loops back to discuss after CONTEXT.md exists.
    - Autonomous mode never skips the lifecycle step when all phases complete (only --only and --to suppress it).
  </exclusions>
</constraints>
```

---

### Issue 4 — No output format specification for agent-to-agent output (Section 7, Action 1; Section 17; Section 23 checklist — output_format)

**Principle:** When output is machine-parsed, use exact format specification with literal string requirements. Subagent output should be terse (for the orchestrating model). Structured output tasks use a two-step reasoning-then-format approach.

**What's missing:** The workflow dispatches background agents and reads their outputs (VERIFICATION.md, REVIEW.md, AUDIT.md) by grepping for `^status:` fields. But the workflow itself has no `<output_format>` specifying what it produces as its own final output. When autonomous completes (or stops), what format does it emit? The final banners are defined inline as prose strings, but there is no specification of what the calling context should expect to parse. Additionally, the `$IS_SUBAGENT` conditional (Section 17) for switching between terse/verbose output is absent.

**Concrete fix:** Add an `<output_format>` block:

```xml
<output_format>
On successful completion, display the final completion banner (defined in step 5d) and exit. No additional text.

On stopped/blocked exit, display the STOPPED banner (defined in handle_blocker) including:
- Completed phases (list)
- Skipped phases (list)
- Remaining phases (list)
- Resume command

Do not emit internal step logs, intermediate reasoning, or raw gsd-sdk output to the user. Banner displays are the only user-facing output between steps.

${IS_SUBAGENT?"When complete, append a one-paragraph machine-readable summary: phases completed, phases skipped, final status (complete/stopped/partial).":""}
</output_format>
```

---

### Issue 5 — Priority ordering absent when multiple criteria conflict (Section 5 — Priority ordering; Section 23 checklist — instruction_framing)

**Principle:** When multiple considerations apply, list them with explicit priority. Add explicit tie-breaking when the model might be uncertain.

**What's missing:** Several points of potential ambiguity have no tie-breaking rule:

1. When both `--from N` and `--only N` are provided (the prompt sets `FROM_PHASE = ONLY_PHASE` but does not explain priority if they conflict with a different value).
2. When `UI_PHASE_CFG` and `HAS_UI` produce ambiguous results (both checks are in the same `if` block but the precedence between `UI_SPEC_FILE` existing and `UI_PHASE_CFG` being false is not stated as a priority ordering).
3. When `SKIP_DISCUSS` is `false` but `has_context` is `true` — the prompt says "skip discuss" and "proceed to 3b," but the priority between the two checks is implicit.

**Concrete fix — add an explicit `<priority_order>` block in the execute_phase step header:**

```xml
<priority_order>
  1. `has_context` = true → skip discuss unconditionally (highest priority, guards against re-invocation)
  2. `--only N` → single-phase mode takes precedence over `--from`/`--to` filters
  3. `SKIP_DISCUSS` = true → auto-generate CONTEXT.md (only reached if has_context is false)
  4. `INTERACTIVE` mode → inline discuss, background plan+execute (only reached if discuss is not skipped)
  5. Default (non-interactive) → inline discuss, inline plan, inline execute
</priority_order>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

### Task Specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | Intent is present; audience and quality bar are absent (Issue 1) |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints identified |

### Chain of Thought
| Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | This is an orchestration workflow, not a reasoning prompt |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples needed for this workflow |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|---|---|---|
| Instruction complete and clear before formatting | PASS | Steps are well-specified before structure is applied |
| Prompt sections separated by semantically named XML tags | PASS | `<process>`, `<step>`, `<success_criteria>` are all semantically named |
| At least 3 format variants tested on target model | N/A | Empirical testing not applicable to workflow files |

### Instruction Framing
| Item | Score | Notes |
|---|---|---|
| All negative instructions converted to positive equivalents | FAIL | Multiple "do not" / "Do not" / "do NOT" directives remain (Issue 2) |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` block; ordering is implicit (Issue 5) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for `--only` vs `--from` conflict or UI phase ambiguity (Issue 5) |

### Persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | PASS | No persona — appropriate for a procedural orchestration workflow |
| Persona specific (constrains voice/register) | N/A | |
| Persona descriptor gender-neutral | N/A | |

### Output Format
| Item | Score | Notes |
|---|---|---|
| Structured output uses two-step reasoning-then-format | N/A | |
| Single-call JSON places reasoning before answer fields | N/A | |
| Constrained decoding adopted only after free-form fails | N/A | |
| Machine-parsed output uses exact format specification | FAIL | No `<output_format>` block; final output format is implicit (Issue 4) |

### Context Placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | PASS | `<purpose>` leads the file |
| Primary document or input at end of prompt | PASS | `<success_criteria>` closes the file — provides grounding for completion |
| Background context in middle | PASS | Step details are in the middle |
| Irrelevant context removed | PASS | No obvious noise or redundant context |
| Time-sensitive injected context labeled as snapshot | N/A | No injected live context |

### Self-Consistency
| Item | Score | Notes |
|---|---|---|
| Self-consistency applied only to tasks with single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | PASS | The prompt is long but dense; no obvious redundancy |
| Long prompts compressed before sending | N/A | Compression tooling not applicable to workflow files |
| RAG context is extracted relevant passage only | N/A | |

### System vs. User Split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | PASS | This file is the system-level workflow instruction |
| Task-specific instructions in user prompt | PASS | User provides `$ARGUMENTS` (phase flags) at invocation time |
| Each instruction appears in exactly one location | PASS | No obvious duplication across steps |
| Safety-critical constraints have external validation | N/A | Safety is enforced by gsd-sdk command availability |

### Agent / Subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | PASS | Background agents receive phase number and skill name inline |
| All file paths in agent output are absolute | PASS | `${PHASE_DIR}` expands to absolute paths from gsd-sdk |
| Parallel agents launched in single message block | PASS | Interactive mode dispatches plan and execute in the same block |
| Adversarial probes specified for verification agents | N/A | Verification is handled by a downstream gsd-verify skill, not this prompt |

### Structural Architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Smart discuss is delegated to `autonomous-smart-discuss.md` |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | PASS | Variables used consistently; fallback via `2>/dev/null || echo` pattern |
| Modules compose at runtime via variable substitution | PASS | Skills are invoked via `Skill()` with variable interpolation |

### Constraint Enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with an equally concrete permission | FAIL | No `<constraints>` block; permissions are implicit (Issue 3) |
| Hard exclusion lists enumerated, not described qualitatively | FAIL | The "limit: 1 attempt" guard is present inline but not formalized in a constraints block (Issue 3) |
| Known edge cases have precedent-style rulings | PASS | "Phase numbers exceed total" and "already complete" edge cases are handled explicitly |
| Confidence thresholds are numeric, not qualitative | N/A | No filtering/confidence task |

### Decision Frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or comparison table | PASS | Banners and AskUserQuestion options are explicit and enumerated |
| Criteria checklists gate complex approaches | PASS | Config gates (`CODE_REVIEW_ENABLED`, `UI_PHASE_CFG`, `UI_REVIEW_CFG`) check before invoking optional steps |
| Action permissions framed around reversibility | FAIL | No `<take_freely>` / `<confirm_with_user>` reversibility framing (Issue 3) |

### Multi-Phase Workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | Six named steps with clear entry/exit |
| Required steps distinguished from type-specific steps | PASS | UI phase and UI review are explicitly gated as optional |
| Scenario-based branching handles multiple paths explicitly | PASS | All three verification outcomes (passed, human_needed, gaps_found) handled explicitly |

### Memory and Continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | This workflow does not manage memory files directly |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Resume commands in STOPPED banner include exact flags from the current invocation |

### Modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has single responsibility | PASS | Each `<step>` is narrowly scoped to one phase of the orchestration |
| Scope boundaries state both inclusions and exclusions | FAIL | No explicit scope block; what is out of scope for this workflow is not stated |

### Safety and Trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only; internal interfaces trusted | PASS | gsd-sdk outputs are trusted; only user-facing decisions trigger confirmation |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | AskUserQuestion is used before gap closure, audit acceptance, and cleanup |

### Tone and Style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits, not qualitative descriptors | PASS | Progress bar is "8 characters wide"; retry limit is "1 attempt" |
| Instructions use imperative present tense | PASS | "Parse", "Display", "Run", "Proceed" — consistent imperative throughout |
| Working notes in analysis tags, not user-facing output | PASS | Internal state (bash variable assignments) is clearly separated from banner output |

### Optimization
| Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note (acceptable for workflow files; low priority) |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

Prioritized by impact on prompt reliability:

**1. Add `<audience>` and `<quality_bar>` blocks (Section 1, Actions 1–2) — HIGH IMPACT**

The absence of audience and quality bar leaves the model without calibration anchors. At the margin — when the model must decide whether a gap is "genuine enough" to surface or whether a banner is "complete enough" — it defaults to its own priors rather than the specified standard. Add both blocks immediately after `<purpose>`. See Issue 1 for the exact fix.

**2. Add a `<constraints>` block with `<take_freely>` and `<confirm_with_user>` (Section 14; Section 15) — HIGH IMPACT**

The workflow performs a wide range of actions — file reads, writes, commits, agent spawns — with no explicit permission framing. This matters especially for orchestrators that ingest this prompt: they cannot determine the blast radius without reading every step. Formalizing the reversibility boundary also makes it machine-auditable. See Issue 3 for the exact fix.

**3. Convert all negative-primary instructions to positive equivalents (Section 5, Action 1) — MEDIUM IMPACT**

There are six negative-primary directives. Each is an instruction the guide marks as degraded form. The conversion is mechanical (see Issue 2 table). This reduces instruction ambiguity and aligns with the guide's documented accuracy improvement from positive framing.

**4. Add a `<priority_order>` block to the `execute_phase` step (Section 5 — Priority ordering) — MEDIUM IMPACT**

The ordering between `has_context`, `SKIP_DISCUSS`, and `INTERACTIVE` is implied by step ordering but never stated as a priority ranking. When execution goes wrong (e.g., `has_context` is stale), the model has no explicit rule to fall back on. Adding an explicit `<priority_order>` block (see Issue 5) costs three lines and eliminates an entire class of ambiguous behavior.

**5. Add an `<output_format>` block specifying what the workflow emits on completion and on stop (Section 7; Section 17) — MEDIUM IMPACT**

The calling context (whether a human or an orchestrating agent) cannot currently determine from the prompt what format to expect at the end of a run. Adding `<output_format>` with the `${IS_SUBAGENT}` conditional makes the workflow composable as a subagent and documents its contract. See Issue 4 for the exact fix.
