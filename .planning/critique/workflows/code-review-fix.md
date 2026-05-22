# Critique: code-review-fix.md

## Summary

`code-review-fix.md` is a structurally solid orchestration workflow with clear sequencing, good error handling, and well-reasoned design decisions documented inline. It handles multi-phase iteration, artifact management, config gating, and agent failure gracefully. However, it shows consistent gaps against the guide in three areas: (1) it relies on Markdown `<step>` tags and plain `<config>` blocks rather than the guide's semantic XML vocabulary (`<phase>`, `<constraints>`, `<output_format>`, etc.); (2) the agent spawn prompts are sparse — they pass config but carry no persona, no output format specification, no quality bar, and no constraint pairing; and (3) the workflow itself has no persona, no audience declaration, and no explicit task framing, which means the orchestrating model must infer its own role from the document structure alone. These gaps are fixable without restructuring the logic.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — required vs. optional steps distinguished**: The `auto_iteration_loop` step is explicitly gated on `AUTO_MODE=true` with a clear `skip this step entirely` directive. Required universal steps (phase validation, config gate, REVIEW.md existence check) are separated from the optional iteration loop.

- **Section 16 — scenario-based branching**: Exit conditions are enumerated concretely (`status: clean`, `status: skipped`, `status: unknown`) with distinct handling for each. This matches the guide's `<scenario condition="...">` intent even without the formal tags.

- **Section 14 (Constraint Enforcement) — precedent-style design rationale**: The inline `Note: This reuses the workflow.code_review config key...` comment in `check_config_gate` is exactly the kind of edge-case ruling the guide recommends via `<precedents>`. The `--auto` key design decisions block at the end of `auto_iteration_loop` similarly documents reasoning that would otherwise be rediscovered and potentially reversed.

- **Section 5 (Instruction Framing) — conditional branching is explicit**: `if [ "$AUTO_MODE" = "true" ]`, `if [ "$FIX_ALL" = "true" ]`, and status checks all use concrete conditional branches rather than leaving branching implicit, matching Section 5's "explicit conditional branching" pattern.

- **Section 16 — phase ordering is sequential and complete**: The seven steps flow logically with explicit dependencies (phase validation before config gate, config gate before file checks, fixer before commit, commit before present). Phase sequencing matches the guide's "complete one phase fully before beginning the next" directive.

- **Section 21 (Tone and Style) — active voice and imperative framing**: Step names use imperative present tense (`check_config_gate`, `spawn_fixer`, `commit_fix_report`, `present_results`). Instructions inside steps are directive ("Parse arguments", "Verify that REVIEW.md exists").

- **Section 20 (Safety and Trust) — blast radius awareness**: `--auto` is capped at 3 iterations, artifact overwrite semantics are explicitly documented, and the REVIEW-FIX.md commit is deferred to after all iterations to avoid one-commit-per-iteration noise. These reflect reversibility thinking from Section 15.

- **Section 23 (Checklist) — `<success_criteria>` block**: The workflow closes with a machine-checkable checklist of expected outcomes. This partially compensates for the missing quality bar and output format specification by giving downstream agents and reviewers a concrete done-definition.

---

## Issues

### Issue 1 — No persona on the orchestrating agent

**Guide principle**: Section 6 Action 1–2 — classify the task before assigning a persona; make personas specific, not generic. Section 22 Pattern 1 — role identity scoped to the exact domain produces behavioral bias.

**What's wrong**: The workflow opens with a `<purpose>` line and a `<required_reading>` tag, then jumps directly into steps. There is no `<persona>` block telling the model what role it plays. The orchestrating agent must infer from the step structure that it is a workflow coordinator — a generic inference that leaves tone, decision-making style, and priority ordering undefined.

**Concrete fix**:

```xml
<persona>
You are a code-fix orchestration specialist for the GSD workflow system.
Your role is to coordinate the code-review-fix pipeline: validate inputs,
gate on config, delegate fixing to subagents, and present results.

You do not apply fixes yourself — your job is sequencing, validation,
and clear communication when steps fail or partially succeed.
</persona>
```

---

### Issue 2 — Subagent spawn prompts are config-only, not self-contained

**Guide principle**: Section 17 — "Each agent prompt must be fully self-contained when spawned." The guide's `<task>/<goal>/<unit_task>/<conventions>/<worker_instructions>` pattern ensures each spawned agent has its full operating context. Section 6 — persona assignment for the spawned agent. Section 7 Action 1 — output format specified before the model begins its task.

**What's wrong**: Both `Task()` calls pass a `<config>` block and a single-sentence instruction. The spawned `gsd-code-fixer` agent receives no persona, no output format specification, no quality bar for what a correct REVIEW-FIX.md looks like, and no constraint pairing. The `gsd-code-reviewer` spawn in `auto_iteration_loop` is even sparser — it passes only a `<config>` block and one instruction sentence. These agents depend on their own system prompts to supply what the spawn prompt omits, which means the spawn prompt cannot compensate if those system prompts are absent or mis-scoped.

**Concrete fix**: At minimum, each Task() spawn should declare intent, output format, and the critical constraint:

```
Task(subagent_type="gsd-code-fixer", prompt="
<task>
Read REVIEW.md at ${REVIEW_PATH}, apply fixes for all findings
in scope (${FIX_SCOPE}), and commit each fix atomically.
</task>

<output_format>
Write REVIEW-FIX.md to ${FIX_REPORT_PATH} with valid YAML frontmatter
containing: status (all_fixed | partial | none_fixed), findings_in_scope,
fixed, skipped, and iteration fields. Do NOT commit REVIEW-FIX.md.
</output_format>

<constraints>
Do not commit ${FIX_REPORT_PATH} — the orchestrator commits it once
after all iterations complete.
Return all file paths as absolute paths.
</constraints>

<config>
phase_dir: ${PHASE_DIR}
padded_phase: ${PADDED_PHASE}
review_path: ${REVIEW_PATH}
fix_scope: ${FIX_SCOPE}
fix_report_path: ${FIX_REPORT_PATH}
iteration: 1
</config>
")
```

---

### Issue 3 — No `<output_format>` for REVIEW-FIX.md defined in the orchestrator

**Guide principle**: Section 7 Action 1 and Section 22 Pattern 3 — output format specified completely and upfront. Section 14 — constraint enforcement requires naming the exact expected fields, not validating them implicitly.

**What's wrong**: The commit step validates that REVIEW-FIX.md has a `status:` field in frontmatter, but the full expected schema (all required frontmatter keys: `status`, `findings_in_scope`, `fixed`, `skipped`, `iteration`) is only implied by the `present_results` step where they are parsed. No single location declares the contract. This means the fixer agent must infer the schema from field names that appear only in the consuming step — a coupling that will break if either step is edited independently.

**Concrete fix**: Add an `<output_format>` block near the top of the workflow (after `<purpose>`) that declares the canonical REVIEW-FIX.md schema:

```xml
<output_format name="REVIEW-FIX.md">
Required YAML frontmatter:
---
status: all_fixed | partial | none_fixed
findings_in_scope: <integer>
fixed: <integer>
skipped: <integer>
iteration: <integer>
---
Body: markdown list of findings with fix status and commit reference per finding.
</output_format>
```

---

### Issue 4 — Negative instructions not converted to positive equivalents

**Guide principle**: Section 5 Action 1 — convert negative instructions to positive equivalents before emitting any prompt. Exception: the reframe pattern.

**What's wrong**: Several instructions are written as prohibitions rather than positive directives:
- `"Do NOT commit REVIEW-FIX.md (orchestrator handles that)."`
- `"Do NOT auto-run code-review."`
- `"Do not commit the output — the orchestrator handles that."`

These are primary directives, not reframe-pattern uses. The guide's conversion table applies: rewrite as positive specifications of the intended behavior.

**Concrete fix** (conversion table applied):

| Current (negative) | Replacement (positive) |
|---|---|
| `Do NOT commit REVIEW-FIX.md` | `Leave REVIEW-FIX.md uncommitted — the orchestrator commits it once after all iterations.` |
| `Do NOT auto-run code-review` | `Require explicit user action to run code-review — error and exit if REVIEW.md is missing.` |
| `Do not commit the output` | `Write findings to ${REVIEW_PATH} only; the orchestrator handles the commit.` |

---

### Issue 5 — No audience or quality bar declared

**Guide principle**: Section 1 Action 1–2 — extract three task components (what, why, quality bar) and identify the audience. Section 4 — `<audience>` and `<quality_bar>` are named top-level structural tags.

**What's wrong**: The `<purpose>` line states *what* the workflow does but omits *why* (the downstream value) and *what a high-quality execution looks like*. There is no `<audience>` tag. For a workflow file that orchestrates subagents, the "audience" is both the model executing the orchestration and the developer reading the file. The quality bar — what distinguishes a correct run from an incorrect one beyond the `<success_criteria>` checklist — is absent.

**Concrete fix**:

```xml
<audience>
The model executing this workflow is an orchestration agent coordinating
code-fix subagents for a GSD phase. The developer reading this file is
debugging or extending the workflow. Instructions must be unambiguous
enough that the model can recover gracefully from partial failures.
</audience>

<quality_bar>
A correct run: validates inputs, applies all in-scope fixes atomically,
produces exactly one REVIEW-FIX.md commit, and presents a formatted
inline summary with a clear next-step recommendation.
A run is incorrect if: it commits REVIEW-FIX.md mid-iteration, silently
swallows agent failures without surfacing them, or presents results
without a next-step suggestion.
</quality_bar>
```

---

### Issue 6 — No priority order when fix scope and status signals conflict

**Guide principle**: Section 5 — priority ordering should be explicit when multiple criteria apply. Section 5 — tie-breaking rules must match the domain's cost asymmetry.

**What's wrong**: The workflow defines `FIX_SCOPE` (critical_warning vs. all) and checks `REVIEW_STATUS` (clean, skipped, unknown), but there is no explicit priority ordering for what happens when these conflict — e.g., `FIX_SCOPE=all` but `REVIEW_STATUS=unknown`. The `unknown` case proceeds with a warning, but whether scope overrides status or vice versa is implicit.

**Concrete fix**: Add a `<priority_order>` block after `check_review_status`:

```xml
<priority_order>
  1. Phase validation result — always surfaced first, regardless of other state
  2. Config gate (workflow.code_review) — second gate; skip silently if disabled
  3. REVIEW.md existence — hard error if missing; no auto-remediation
  4. REVIEW.md status — determines whether to proceed (clean/skipped = exit)
  5. FIX_SCOPE — applied only after all gates pass
</priority_order>

<tie_breaking>
When REVIEW_STATUS is "unknown", proceed with fix attempt.
Over-fixing is less costly than silently skipping — a warning is surfaced.
</tie_breaking>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as it applies to an orchestration workflow file.

### Task Specification
| Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | Intent present in `<purpose>`; audience and quality bar absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints identified |

### Chain-of-Thought
| Item | Score | Notes |
|---|---|---|
| CoT included only for math/symbolic/multi-step logic | N/A | Not a reasoning prompt; no CoT needed |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|---|---|---|
| Examples selected by semantic similarity | N/A | No few-shot examples in this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |

### Formatting
| Item | Score | Notes |
|---|---|---|
| Instruction complete before formatting applied | PASS | Steps are fully specified; structure follows content |
| Prompt sections separated by semantically named XML tags | FAIL | Uses `<step name="...">` (custom attribute) and `<config>` rather than guide vocabulary (`<phase>`, `<constraints>`, `<output_format>`) |
| At least 3 format variants tested | N/A | Workflow file, not a single-model prompt |

### Instruction Framing
| Item | Score | Notes |
|---|---|---|
| Negative instructions converted to positive equivalents | FAIL | Multiple "Do NOT" directives remain (Issue 4) |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` block despite multiple competing gates (Issue 6) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | `unknown` status handling is implicit; no declared tie-breaking rule |

### Persona
| Item | Score | Notes |
|---|---|---|
| Persona included only for open-ended or stylistic tasks | FAIL | Workflow orchestration benefits from a specific persona; none present (Issue 1) |
| Persona is specific (constrains voice/register), not generic | FAIL | No persona to evaluate |
| Persona descriptor is gender-neutral | N/A | No persona present |

### Output Format
| Item | Score | Notes |
|---|---|---|
| Structured output tasks use two-step reasoning-then-format | N/A | Orchestration workflow, not a single-call structured output task |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | REVIEW-FIX.md schema is implied by parsing code in `present_results`, not declared upfront (Issue 3) |

### Context Placement
| Item | Score | Notes |
|---|---|---|
| Task instruction at start of prompt | PASS | `<purpose>` leads the file |
| Primary document or input at end of prompt | PASS | `<success_criteria>` closes the workflow; input is processed at runtime |
| Background context in middle | PASS | Design rationale comments are mid-step |
| All irrelevant context removed | PASS | No apparent filler or boilerplate |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot context injected |

### Self-Consistency
| Item | Score | Notes |
|---|---|---|
| Applied only to tasks with a single correct answer | N/A | Not applicable to orchestration workflows |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|---|---|---|
| Redundant instructions and repeated context removed | PASS | No obvious duplication; design rationale is non-redundant |
| Long prompts compressed before sending | N/A | |
| RAG context is extracted passage only | N/A | |

### System / User Split
| Item | Score | Notes |
|---|---|---|
| Persistent instructions in system prompt | N/A | Workflow file is invoked as a skill, not split into system/user |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplicated instructions observed |
| Safety-critical constraints have external validation | FAIL | REVIEW-FIX.md validation checks only for `status:` field; full schema is not externally validated |

### Agent / Subagent
| Item | Score | Notes |
|---|---|---|
| Agent prompts are fully self-contained | FAIL | Spawn prompts pass config but lack persona, output format, and quality bar (Issue 2) |
| All file paths in agent output are absolute | PASS | `${PHASE_DIR}`, `${REVIEW_PATH}`, `${FIX_REPORT_PATH}` are all absolute-path variables |
| Parallel agents launched in a single message block | N/A | Agents are sequential by design |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |

### Structural Architecture
| Item | Score | Notes |
|---|---|---|
| Large prompts decomposed into atomic single-responsibility modules | PASS | Each step is a single-responsibility unit |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | Consistent throughout |
| Modules compose at runtime via variable substitution | PASS | Config-driven via `gsd-sdk query` |

### Constraint Enforcement
| Item | Score | Notes |
|---|---|---|
| Every restriction paired with an equally concrete permission | FAIL | "Do NOT commit REVIEW-FIX.md" is not paired with a positive statement of who does commit it and when, in the spawn prompt itself (the orchestrator-level note exists but the agent doesn't see it) |
| Hard exclusion lists enumerated, not qualitative | PASS | `FIX_SCOPE` values (`critical_warning`, `all`) are concrete |
| Known edge cases have precedent-style rulings | PASS | Design decisions block at end of `auto_iteration_loop` serves this role |
| Confidence thresholds are numeric, not qualitative | N/A | No confidence scoring in this workflow |

### Decision Frameworks
| Item | Score | Notes |
|---|---|---|
| Multi-option recommendations use decision tree or comparison table | PASS | Status-based branching uses concrete conditionals |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist present |
| Action permissions framed around reversibility | PASS | Commit deferral and artifact backup reflect reversibility thinking |

### Multi-Phase Workflows
| Item | Score | Notes |
|---|---|---|
| Complex tasks organized into explicit named phases | PASS | Seven named `<step>` blocks |
| Required steps distinguished from type-specific steps | PASS | `auto_iteration_loop` explicitly flagged as conditional |
| Scenario-based branching handles multiple paths explicitly | PASS | Status conditions (clean, skipped, unknown) each have explicit branches |

### Memory and Continuity
| Item | Score | Notes |
|---|---|---|
| Memory templates use XML tags as section labels | N/A | No memory template in this file |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | `present_results` step closes with conditional next-step suggestions tied to fix outcome |

### Modularity
| Item | Score | Notes |
|---|---|---|
| Each prompt component has a single responsibility | PASS | Steps are well-scoped |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>/<include>/<exclude>` block; what this workflow does NOT do is not stated |

### Safety and Trust
| Item | Score | Notes |
|---|---|---|
| Validation at system boundaries only; internal interfaces trusted | PASS | Input sanitization on `PADDED_PHASE`; internal paths are trusted |
| Dual-use capabilities state permissions before restrictions | FAIL | Restrictions ("Do NOT commit...") appear without a prior positive permission statement in the spawn context |
| Authorization narrow-scoped; each action confirmed before expanding scope | PASS | Config gate and phase validation before any agent is spawned |

### Tone and Style
| Item | Score | Notes |
|---|---|---|
| Size constraints use numeric limits, not qualitative descriptors | PASS | `MAX_ITERATIONS=3` is a concrete numeric limit |
| Instructions use imperative present tense | PASS | Step-level instructions are directive |
| Working notes in analysis tags, not user-facing output | FAIL | Inline design rationale comments are embedded in step bodies rather than separated into `<analysis>` or comment blocks |

### Optimization
| Item | Score | Notes |
|---|---|---|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag; workflow files are not typically flagged, but the spawn prompts are candidates |
| Correct optimizer selected | N/A | |
| Held-out test set reserved | N/A | |

---

## Recommendations

### 1. Add persona and quality bar to the workflow header (Priority: High)

The orchestrating model has no role identity, no quality bar, and no audience declaration. These three elements cost fewer than 15 lines and produce measurable behavioral consistency. Add `<persona>`, `<audience>`, and `<quality_bar>` blocks immediately after `<purpose>`. See Issue 1 and Issue 5, and Section 1 Action 1–2 / Section 6 Action 2.

### 2. Expand subagent spawn prompts to be self-contained (Priority: High)

Both `Task()` calls are config-only. Add `<task>`, `<output_format>`, and `<constraints>` to each spawn prompt so the spawned agent has its full operating context without depending on its system prompt for structure. At minimum, declare the REVIEW-FIX.md schema and the commit constraint in the fixer spawn. See Issue 2, Section 17.

### 3. Declare REVIEW-FIX.md schema as a single canonical `<output_format>` block (Priority: Medium)

The schema is currently implied by the validation code in `commit_fix_report` and the parsing code in `present_results`. Moving it to a named `<output_format>` block near the top of the file makes it the single source of truth for both the orchestrator and any spawned agent. See Issue 3, Section 22 Pattern 3.

### 4. Convert all "Do NOT" directives to positive equivalents (Priority: Medium)

Three primary directives use prohibition framing. Apply the Section 5 Action 1 conversion table: replace "Do NOT commit REVIEW-FIX.md" with "Leave REVIEW-FIX.md uncommitted — the orchestrator commits it once after all iterations." This is a mechanical rewrite with no logic change. See Issue 4.

### 5. Add `<priority_order>` and `<tie_breaking>` blocks for the gate sequence (Priority: Low)

The workflow has five sequential gates (phase validation, config gate, file existence, review status, fix scope). Declaring their priority order and the tie-breaking rule for the `unknown` status case removes implicit behavior that a future editor could accidentally reverse. See Issue 6, Section 5.
