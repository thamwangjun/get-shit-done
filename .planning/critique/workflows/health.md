# Critique: health.md

## Summary

`health.md` is a competent, well-scoped workflow prompt that correctly uses XML tags for structural separation, provides an explicit process with named steps, enumerates error codes in a reference table, and keeps each step focused on a single concern. However, it falls short in several areas that the guide treats as load-bearing: the task specification is implicit rather than explicit (no audience, quality bar, or intent block), output format instructions mix qualitative descriptors with hard rules inconsistently, constraint framing has no permission-pairing (restrictions appear without equal-weight permitted actions), there are no few-shot examples despite the workflow producing user-facing formatted output, and the persona block is absent entirely. The workflow is functional and readable but not yet production-hardened against the guide's structural requirements.

---

## Strengths

- **Section 4 Action 2 — XML tag separation:** The prompt correctly uses `<purpose>`, `<required_reading>`, `<process>`, `<step>`, `<error_codes>`, `<repair_actions>`, and `<stale_task_cleanup>` to name distinct sections semantically rather than using markdown headers or plain delimiters.
- **Section 16 (Multi-Phase Workflows) — named steps:** Each `<step>` carries a `name` attribute (`parse_args`, `run_health_check`, `format_output`, `offer_repair`, `verify_repairs`), creating explicit cognitive boundaries and a clear execution sequence — consistent with the phase pattern.
- **Section 15 (Decision Frameworks) — comparison table:** The `<error_codes>` and `<repair_actions>` tables enumerate options across structured dimensions (code, severity, description, repairable; action, effect, risk). These are compact, scannable, and appropriately directive.
- **Section 5 (Instruction Framing) — conditional branching:** The `--repair` flag detection and the `if repairs were performed / if repairable issues exist` conditional blocks make branching explicit rather than leaving the model to infer it.
- **Section 10 (Prompt Length and Compression) — scope discipline:** The prompt stays tightly scoped to the health-check domain. It does not bloat with generic advice or redundant explanation; each section contributes to the task.
- **Section 19 (Modularity) — single responsibility:** The file handles one concern (health validation) and nothing else. The `<required_reading>` tag correctly delegates cross-file dependencies rather than inlining them.

---

## Issues

### Issue 1 — Missing explicit task specification (Section 1, Actions 1–2)

**Principle:** Section 1 requires the three task components to be explicit in the prompt: what output is requested, why it matters, and what a high-quality response looks like. It also requires the audience to be encoded explicitly.

**What's missing:** The `<purpose>` tag states what the tool does but not who uses its output, in what context, or what constitutes a correct vs. incorrect execution. There is no `<audience>` tag, no `<quality_bar>` tag, and no articulation of success criteria. A model running this workflow cannot know whether the output is consumed by a developer CLI, a CI pipeline, or an orchestrator — which affects tone, verbosity, and whether machine-parseable output is needed.

**Concrete fix:** Add a specification block immediately after `<purpose>`:

```xml
<task_specification>
  <audience>A developer running /gsd-health from the CLI. Familiar with GSD conventions; expects
  a terminal-formatted report they can act on immediately.</audience>
  <quality_bar>A correct execution: (1) runs the SDK query, (2) renders all error/warning/info
  sections that are non-empty, (3) offers repair when repairable issues exist, and (4) re-validates
  after repair. An incorrect execution omits non-empty sections or skips the re-validation step.
  </quality_bar>
</task_specification>
```

---

### Issue 2 — Output format uses qualitative length descriptors instead of numeric limits (Section 21, Tone and Style Rules)

**Principle:** Section 21 states that size constraints must use numeric limits, not qualitative descriptors. "Brief", "concise", and "clear" are subjective and produce inconsistent output across runs.

**What's missing:** The `format_output` step uses ASCII template blocks that imply a format but never specify maximum line length, maximum characters per error message, or maximum number of items rendered per section. The footer is similarly implicit — there is no constraint on how many auto-repair items to enumerate before truncating.

**Concrete fix:** Add explicit numeric constraints to the `<step name="format_output">` block:

```xml
<output_format>
Each error or warning entry: 1 line for the code + message, 1 line for the Fix. Maximum 80 characters per line.
Section headers: render only if the section is non-empty.
Footer: render only if repairable_count > 0.
</output_format>
```

---

### Issue 3 — No permission-pairing on constraint blocks (Section 14, Constraint Enforcement)

**Principle:** Section 14 requires every restriction to be paired with an equally concrete permitted alternative. The `<repair_actions>` block lists what repair does NOT fix ("Not repairable — too risky") but never states what the workflow IS permitted to do autonomously without user confirmation.

**What's missing:** There is no `<permitted>` / `<reserved_for_human_review>` pairing. The reversibility framework (Section 15) is relevant here — `resetConfig` loses custom settings and should be flagged as requiring confirmation, but the prompt does not distinguish it from the zero-risk `addNyquistKey` action at the behavioral level, only in a risk column in a reference table.

**Concrete fix:** Add a constraints block before `<repair_actions>`:

```xml
<constraints>
  <take_freely>
    - createConfig (no existing file — zero-risk creation)
    - addNyquistKey (additive only — does not overwrite any existing value)
    - regenerateState (only when STATE.md is missing — no overwrite risk)
  </take_freely>

  <confirm_with_user>
    - resetConfig (deletes and recreates config.json — loses custom settings)
  </confirm_with_user>
</constraints>
```

---

### Issue 4 — No few-shot examples for the formatted output (Section 3, Few-Shot Example Construction; Section 22, Pattern 2)

**Principle:** Section 3 Action 5 and Section 22 Pattern 2 state that every abstract qualitative instruction must be paired with at least one concrete example that demonstrates the target standard. The output format templates (the ASCII blocks in `format_output`) illustrate structure but do not show a complete rendered example across all states.

**What's missing:** There is no example showing a `DEGRADED` status with one error, one warning, and one repairable issue all present simultaneously. Without a complete example, the model cannot calibrate whether to render sections in the correct order, how to handle mixed states, or whether to separate sections with blank lines or horizontal rules.

**Concrete fix:** Add a `<examples>` block after `<step name="format_output">`:

```xml
<examples>
  <example>
    <input>status=degraded, errors=[E002], warnings=[W005], repairable_count=1</input>
    <output>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: DEGRADED
Errors: 1 | Warnings: 1 | Info: 0

## Errors

- [E002] PROJECT.md not found
  Fix: Run /gsd-new-project to create

## Warnings

- [W005] Phase directory "1-setup" doesn't follow NN-name format
  Fix: Rename to match pattern (e.g., 01-setup)

---
1 issue can be auto-repaired. Run: /gsd-health --repair
    </output>
    <commentary>Errors section precedes warnings. Footer appears only because repairable_count > 0.
    Info section is omitted because it is empty.</commentary>
  </example>
</examples>
```

---

### Issue 5 — No persona assigned despite stylistic output requirements (Section 6, Persona Assignment)

**Principle:** Section 6 Action 1 states that a persona should be assigned when the task is open-ended, stylistic, or requires a specific voice. The health workflow produces user-facing terminal output with a specific diagnostic register — it must be terse, technical, and actionable, not conversational.

**What's missing:** No `<persona>` tag appears. Without it, the model defaults to its general assistant register, which tends toward longer explanations, hedged language, and more conversational tone than a CLI diagnostic tool requires.

**Concrete fix:** Add a persona block after `<task_specification>`:

```xml
<persona>
You are a CLI diagnostic tool reporting on project health. Write in terse, technical
present tense. Lead with status. Enumerate findings; do not explain them unless a Fix
line is explicitly called for. Omit any conversational framing.
</persona>
```

---

### Issue 6 — Negative instruction present without positive reframe (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions to be converted to positive equivalents before emission. The exception is the reframe pattern (Section 6), which does not apply here.

**What's missing:** The `<repair_actions>` block contains: "Not repairable (too risky): PROJECT.md, ROADMAP.md content / Phase directory renaming / Orphaned plan cleanup." These are stated as negatives without specifying what the model should do instead when it encounters these cases.

**Concrete fix:** Replace with a positive directive:

```
When a non-repairable issue is detected: display its error code and Fix instruction
as-is. Do not attempt to resolve it. Prompt the user to follow the Fix instruction manually.
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (e.g., self-consistency, RAG, optimization handoff).

### Task Specification
| Checklist Item | Score |
|---|---|
| Intent, audience, and quality bar are all explicit in the prompt | FAIL |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |

### Chain of Thought
| Checklist Item | Score |
|---|---|
| CoT is included only for math, symbolic reasoning, or multi-step logic tasks | N/A |
| CoT trigger used: "Take a deep breath and work on this problem step-by-step." | N/A |
| Reasoning is elicited before the answer, not after | N/A |
| CoT traces are treated as heuristic aids, verified against ground truth downstream | N/A |

### Few-Shot Examples
| Checklist Item | Score |
|---|---|
| Examples selected by semantic similarity | FAIL |
| 2–5 examples total | FAIL |
| Ordered simple → complex, with the most representative example last | FAIL |
| Examples span diverse sub-types of the task | FAIL |
| Format is consistent across all examples | FAIL |
| Example order is fixed across all evaluation runs | FAIL |

*(All FAIL — no examples are present in the workflow.)*

### Formatting
| Checklist Item | Score |
|---|---|
| Instruction is complete and clear before any formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | PASS |
| At least 3 format variants will be tested on the target model | FAIL |

### Instruction Framing
| Checklist Item | Score |
|---|---|
| All negative instructions have been converted to positive equivalents | FAIL |
| Priority order is explicit when multiple criteria apply | PASS |
| Tie-breaking rules match the domain's cost asymmetry | N/A |

### Persona
| Checklist Item | Score |
|---|---|
| Persona is included only for open-ended or stylistic tasks | FAIL |
| Persona is specific (constrains voice/register), not generic | FAIL |
| Persona descriptor is gender-neutral | N/A |

*(Both FAIL — no persona is present; one is warranted for a stylistic output task.)*

### Output Format
| Checklist Item | Score |
|---|---|
| Structured output tasks use a two-step reasoning-then-format approach | N/A |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding is adopted only after free-form + post-processing has proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string requirements | PASS |

### Context Placement
| Checklist Item | Score |
|---|---|
| Task instruction is at the start of the prompt | PASS |
| Primary document or input is at the end of the prompt | N/A |
| Background context is in the middle | PASS |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |

### Self-Consistency
| Checklist Item | Score |
|---|---|
| Self-consistency is applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |

### Prompt Length
| Checklist Item | Score |
|---|---|
| Redundant instructions and repeated context have been removed | PASS |
| Long prompts have been compressed before sending | N/A |
| RAG context is the extracted relevant passage only | N/A |

### System / User Split
| Checklist Item | Score |
|---|---|
| Persistent instructions are in the system prompt | N/A |
| Task-specific instructions are in the user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation independent of the prompt | N/A |

### Agent / Subagent
| Checklist Item | Score |
|---|---|
| Agent prompts are fully self-contained | PASS |
| All file paths in agent output are absolute | N/A |
| Parallel agents are launched in a single message block | N/A |
| Adversarial probes are specified for verification agents | N/A |

### Structural Architecture
| Checklist Item | Score |
|---|---|
| Large prompts are decomposed into atomic, single-responsibility modules | PASS |
| Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate | PASS |
| Modules compose at runtime via variable substitution, not copy-paste | PASS |

### Constraint Enforcement
| Checklist Item | Score |
|---|---|
| Every restriction is paired with an equally concrete permission | FAIL |
| Hard exclusion lists are enumerated, not described qualitatively | PASS |
| Known edge cases have precedent-style rulings | FAIL |
| Confidence thresholds are numeric, not qualitative | N/A |

### Decision Frameworks
| Checklist Item | Score |
|---|---|
| Multi-option recommendations use an explicit decision tree or comparison table | PASS |
| Criteria checklists gate complex approaches | N/A |
| Action permissions are framed around reversibility | FAIL |

### Multi-Phase Workflows
| Checklist Item | Score |
|---|---|
| Complex tasks are organized into explicit named phases | PASS |
| Required steps are distinguished from type-specific steps | PASS |
| Scenario-based branching handles multiple paths explicitly | PASS |

### Memory and Continuity
| Checklist Item | Score |
|---|---|
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps are tied to the user's most recent explicit request | N/A |

### Modularity
| Checklist Item | Score |
|---|---|
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL |

### Safety and Trust
| Checklist Item | Score |
|---|---|
| Validation is at system boundaries only; internal interfaces are trusted | PASS |
| Dual-use capabilities state permissions before restrictions | FAIL |
| Authorization is narrow-scoped; each action confirmed before expanding scope | FAIL |

### Tone and Style
| Checklist Item | Score |
|---|---|
| Size constraints use numeric limits, not qualitative descriptors | FAIL |
| Instructions use imperative present tense | PASS |
| Working notes are in analysis tags, not user-facing output | N/A |

### Optimization
| Checklist Item | Score |
|---|---|
| Prompt is flagged as a draft for automated optimization | FAIL |
| Correct optimizer selected (MIPROv2 for pipelines, OPRO for single prompts) | FAIL |
| Held-out test set reserved before optimization begins | FAIL |

*(Optimization items are architectural reminders for the prompt author, not runtime failures — treat as low priority.)*

---

## Recommendations

Prioritized by impact on behavioral consistency and guide compliance.

### 1. Add explicit task specification — `<audience>` and `<quality_bar>` (Section 1 Actions 1–2)

This is the highest-leverage fix. Without an explicit audience and quality bar, the model cannot calibrate tone, verbosity, or completeness. A two-block addition immediately after `<purpose>` resolves this and unlocks downstream improvements (the persona can reference the audience; the output format can reference the quality bar). Estimated effort: 5 minutes.

### 2. Add a complete few-shot example for mixed-state output (Section 3; Section 22 Pattern 2)

The ASCII output templates in `format_output` show structure but do not demonstrate a complete execution with errors, warnings, and a footer simultaneously present. One well-constructed example with a `<commentary>` block eliminates the most common output consistency failure — wrong section ordering or missing footer. Estimated effort: 10 minutes.

### 3. Add a `<persona>` block scoped to CLI diagnostic register (Section 6 Actions 1–2)

The workflow produces stylistic terminal output. A persona block constraining the model to terse, technical, present-tense writing directly reduces verbosity and hedging in the rendered report. The fix is a four-line block. Estimated effort: 3 minutes.

### 4. Add permission-pairing with reversibility framing to `<repair_actions>` (Section 14; Section 15 Reversibility Framework)

`resetConfig` and `createConfig` carry different risk levels but are presented identically in the repair table. Adding `<take_freely>` / `<confirm_with_user>` blocks before the repair action table makes the reversibility distinction behavioral rather than advisory. This prevents the model from silently running `resetConfig` without user confirmation. Estimated effort: 8 minutes.

### 5. Convert negative instructions to positive equivalents (Section 5 Action 1)

The "Not repairable (too risky)" block in `<repair_actions>` is the only negative framing in an otherwise positively framed prompt. Replace it with a positive directive specifying what the model does when it encounters a non-repairable issue (display the Fix line; prompt the user to act manually). Estimated effort: 2 minutes.
