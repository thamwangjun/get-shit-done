# Critique: ship.md

## Summary

`ship.md` is a well-structured, operationally complete workflow that covers the full shipping loop — preflight validation, branch push, PR creation, optional code review, and state tracking. The multi-step `<step>` tag pattern gives it clear phase separation, and the inline bash code blocks make each action concrete and executable. However, the workflow falls short of the guide's standards in several systematic ways: it relies entirely on prose and markdown headers rather than the XML vocabulary prescribed by Section 4, provides no output format specification for the final report block, contains several negative instructions that should be converted to positive equivalents, and is missing a persona, audience declaration, and quality bar. The `generate_pr_body` and `optional_review` steps are the richest sections but suffer from implicit assumptions about output structure and no tie-breaking rules for edge cases. The prompt reads more like a runbook than a prompt — it is optimized for human comprehension rather than model instruction.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** The workflow correctly decomposes work into named `<step>` units (`initialize`, `preflight_checks`, `push_branch`, `generate_pr_body`, `create_pr`, `optional_review`, `track_shipping`, `report`). Each step is self-contained and sequentially ordered, matching the guide's recommendation for creating cognitive boundaries between phases.

- **Section 16 — Required vs. conditional steps are distinguished.** The `preflight_checks` step enumerates mandatory gates (verification, clean tree, branch, remote, `gh` CLI) and the `optional_review` step correctly marks code review as optional. This aligns with the guide's `<required_steps universal="true">` / `<type_specific_strategy>` separation.

- **Section 16 — Scenario-based branching is present.** The `optional_review` step handles multiple execution branches: external review command vs. manual flow, `--text` mode vs. `AskUserQuestion`, approved vs. revise verdicts. This maps to the guide's `<scenarios>` / `<scenario condition="...">` pattern.

- **Section 15 (Decision Frameworks) — Reversibility awareness.** The `preflight_checks` step gates on uncommitted changes and warns about being on the base branch before pushing — an implicit application of the guide's reversibility framework (Section 15), protecting against hard-to-reverse actions.

- **Section 14 (Constraint Enforcement) — Hard exclusion pairs are implied.** The `push_branch` step handles upstream failure explicitly with a fallback command, and the `optional_review` external command block handles timeout and JSON parse failure with explicit fallback paths. This reflects the guide's pattern of pairing restrictions with what IS permitted.

- **Section 22, Pattern 3 — Output format is partially specified.** The `generate_pr_body` step provides a markdown template with section names and example content, making the expected PR structure unambiguous. This partially satisfies Section 22 Pattern 3 (output format specified completely and upfront).

- **Section 21 (Tone and Style) — Instructions use imperative present tense.** Step headings and sub-step labels are consistently imperative: "Parse arguments," "Verify," "Push," "Auto-generate," "Create," "Update."

---

## Issues

### Issue 1 — No `<task>`, `<audience>`, or `<quality_bar>` declaration
**Principle:** Section 1 Action 1 and Action 2; Section 23 checklist item "Intent, audience, and quality bar are all explicit in the prompt."

**What's missing:** The workflow opens with `<purpose>` (which is not a canonical guide tag) and `<required_reading>`, then jumps directly into `<process>`. There is no explicit statement of what the agent's primary output is, who will consume the results (developer, CI system, orchestrating agent?), or what a correct execution looks like beyond the `<success_criteria>` block at the end.

**Concrete fix:** Add a preamble using canonical tags before `<process>`:

```xml
<task>
Ship a completed GSD phase by running preflight checks, pushing the branch, creating a
pull request with a richly generated body, optionally triggering code review, and
updating STATE.md with the shipping status.
</task>

<audience>
A developer using Claude Code who has just verified a GSD phase and wants to open a PR
without manually constructing the PR body or coordinating review.
</audience>

<quality_bar>
Execution is successful when: all preflight checks pass or have explicit user confirmation,
a PR is created with a complete body sourced from planning artifacts, STATE.md reflects the
shipping status, and the user has the PR URL and knows the next step.
</quality_bar>
```

---

### Issue 2 — Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1; Section 23 checklist item "All negative instructions have been converted to positive equivalents."

**What's missing:** Several instructions in the workflow use "If not…" or "If no…" as primary directives rather than specifying the desired positive behavior.

Examples from the file:
- "If no VERIFICATION.md or status is `gaps_found`: warn and ask user to confirm."
- "If no remote: error — can't create PR."
- "If `gh` not found or not authenticated: provide setup instructions and exit."

The guide's conversion table (Section 5 Action 1) requires these be rewritten as positive specifications.

**Concrete fix:** Rewrite as positive conditional instructions:

```
Verify VERIFICATION.md exists and reports status: passed or status: human_needed with
human approval. When the file is absent or status is gaps_found, warn the user and
request explicit confirmation before proceeding.

Confirm an `origin` remote is configured. When no remote is detected, report the error
and exit — PR creation requires a configured remote.

Confirm `gh` is installed and authenticated before proceeding. When `gh` is unavailable,
output setup instructions and exit cleanly.
```

---

### Issue 3 — No persona assigned; persona would materially improve consistency
**Principle:** Section 6 Action 1 and Action 2; Section 22 Pattern 1.

**What's missing:** The workflow does not assign a persona. Given that the agent must synthesize planning artifacts into a coherent PR body (an open-ended, stylistic task requiring a specific voice), the guide's Section 6 rule triggers: a task that is "open-ended or stylistic" warrants a specific persona. The `generate_pr_body` step produces markdown prose under a "## Summary" section — without a persona, the register and level of technical detail are left entirely to the model's priors.

**Concrete fix:** Add a specific, role-constrained persona:

```xml
<persona>
You are a release engineer who closes the implementation loop. Your job is to produce
PR bodies that give reviewers full context from planning artifacts — not summaries from
memory. Write in present tense, active voice. Lead with what changed and why it matters.
</persona>
```

---

### Issue 4 — Output format for the final `<step name="report">` is not machine-parseable
**Principle:** Section 7 Action 1; Section 22 Pattern 3; Section 23 checklist "Structured output tasks use a two-step reasoning-then-format approach" and "Machine-parsed output uses exact format specification with literal string requirements."

**What's missing:** The `report` step emits a freeform ASCII block with emojis, variable interpolation, and no parsing contract. If the `ship` workflow is invoked by an orchestrating agent (plausible in GSD's multi-agent architecture), the caller cannot reliably extract `PR_NUMBER`, `URL`, `BRANCH`, or `VERIFICATION` status without a defined output format.

**Concrete fix:** Add an `<output_format>` declaration for the report step specifying which fields are machine-readable and their exact format:

```xml
<output_format>
End the report with a machine-readable summary block in exactly this format — it is parsed
by any orchestrating agent:

GSD_SHIP_RESULT: PR={pr_number} URL={pr_url} BRANCH={branch} BASE={base_branch} STATUS=SHIPPED

Use the literal key names above. No markdown formatting around this line.
The human-readable section above it may use any format.
</output_format>
```

---

### Issue 5 — No tie-breaking rules for edge cases in preflight gating and review verdict
**Principle:** Section 5 (Tie-breaking instructions); Section 22 Pattern 4; Section 23 checklist "Tie-breaking rules match the domain's cost asymmetry."

**What's missing:** Two ambiguous decision boundaries exist with no tie-breaking instruction:

1. **Preflight gate for `status: human_needed`:** The workflow accepts both `status: passed` and `status: human_needed` (with human approval) but does not define what constitutes "human approval" — a conversation message? A file flag? A git tag? The model must infer.

2. **External review verdict handling:** When `verdict` is `REVISE`, the workflow "reports issues" and "falls through to the manual review options" — but does not specify whether a `REVISE` verdict should block the PR creation or only warn. The cost asymmetry here is significant: shipping broken code is worse than a false block.

**Concrete fix:** Add explicit tie-breaking rules:

```xml
<tie_breaking>
When VERIFICATION status is human_needed: require explicit written confirmation from the
user in this conversation (a "yes" or "confirmed" message) before proceeding.
The absence of a denial is not confirmation.

When the external review verdict is REVISE: present all issues to the user and ask for
explicit confirmation before proceeding to create the PR. Do not create the PR silently
when issues are flagged — a blocked ship is cheaper than a reverted merge.
</tie_breaking>
```

---

### Issue 6 — `generate_pr_body` uses qualitative prose instruction without calibrating examples
**Principle:** Section 22 Pattern 2 ("Every abstract instruction paired with a calibrating example"); Section 3 (Few-Shot Example Construction).

**What's missing:** The `generate_pr_body` step specifies the PR body structure as a template with placeholder text (`{One paragraph synthesized from SUMMARY.md files — what was built}`) but provides no example of what a good vs. poor synthesis looks like. Qualitative terms like "one paragraph synthesized" are subjective without an anchor.

**Concrete fix:** Add a minimal few-shot example inline in the `generate_pr_body` step:

```xml
<examples>
  <example>
    <input>SUMMARY.md one_liner: "Add JWT validation middleware to all API routes"</input>
    <output>Adds JWT validation middleware that intercepts every API request before it
reaches a route handler. Tokens are validated against the public key in AUTH_PUBLIC_KEY.
Expired and malformed tokens return 401 with a structured error body.</output>
    <commentary>Active voice, present tense, states what changed and what it does at
runtime — not implementation details.</commentary>
  </example>
</examples>
```

---

### Issue 7 — Prompt sections use `<step name="...">` instead of canonical XML tag vocabulary
**Principle:** Section 4 Action 2; Section 4 XML tag vocabulary table; Section 23 checklist "Prompt sections are separated by semantically named XML tags."

**What's missing:** The workflow uses `<step name="initialize">`, `<step name="preflight_checks">`, etc. as a generic container with a `name` attribute. The guide's canonical vocabulary (Section 4) prescribes `<phase id="N" name="..." trigger="...">` for named workflow stages. The guide also provides `<required_steps>`, `<type_specific_strategy>`, and `<scenarios>` for the exact structural patterns this workflow uses. The non-canonical tags reduce interoperability with other GSD modules that may parse or compose prompts.

**Concrete fix:** Migrate from `<step name="...">` to guide-canonical `<phase id="..." name="..." trigger="...">` for the main steps, and wrap the preflight conditions in `<scenarios>`:

```xml
<phase id="1" name="Initialize" trigger="on_invoke">
  ...
</phase>

<phase id="2" name="Preflight Checks" trigger="after_initialize">
  <scenarios>
    <scenario condition="no_verification_file">Warn and ask for confirmation.</scenario>
    <scenario condition="status_gaps_found">Warn and ask for confirmation.</scenario>
    <scenario condition="status_passed">Proceed.</scenario>
  </scenarios>
</phase>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to this workflow type (e.g., self-consistency applies only to classification/math tasks).

### Task Specification
| Item | Score | Notes |
|------|-------|-------|
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` is present but `<audience>` and `<quality_bar>` are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |

### Chain of Thought
| Item | Score | Notes |
|------|-------|-------|
| CoT included only for math/symbolic/multi-step logic | N/A | Not a reasoning-heavy task |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before the answer | N/A | |
| CoT traces flagged as heuristic | N/A | |

### Few-Shot Examples
| Item | Score | Notes |
|------|-------|-------|
| Examples selected by semantic similarity | FAIL | No examples provided for the `generate_pr_body` synthesis task |
| 2–5 examples total | FAIL | Zero examples |
| Ordered simple → complex | N/A | No examples |
| Examples span diverse sub-types | N/A | No examples |
| Format consistent across examples | N/A | No examples |
| Example order fixed across evaluation runs | N/A | No examples |

### Formatting
| Item | Score | Notes |
|------|-------|-------|
| Instruction complete and clear before formatting | PASS | Steps are complete before bash blocks are shown |
| Prompt sections separated by semantically named XML tags | FAIL | Uses `<step name="...">` not canonical `<phase>`, `<scenarios>`, `<required_steps>` |
| At least 3 format variants tested | FAIL | No evidence of format variant testing |

### Instruction Framing
| Item | Score | Notes |
|------|-------|-------|
| Negative instructions converted to positive equivalents | FAIL | Multiple "If no…/If not…" primary directives remain |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` when preflight checks conflict or partially fail |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking for `human_needed` gate or `REVISE` verdict |

### Persona
| Item | Score | Notes |
|------|-------|-------|
| Persona included only for open-ended/stylistic tasks | FAIL | Persona is absent; PR body synthesis is stylistic and warrants one |
| Persona is specific (constrains voice/register) | N/A | No persona to evaluate |
| Persona descriptor is gender-neutral | N/A | No persona to evaluate |

### Output Format
| Item | Score | Notes |
|------|-------|-------|
| Structured output uses two-step reasoning-then-format | N/A | Workflow is procedural, not single-call structured output |
| Single-call JSON places reasoning before answer fields | PASS | External review JSON schema has `verdict` after `summary` fields (implicit) |
| Constrained decoding adopted only after free-form insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | `report` step output has no machine-readable contract |

### Context Placement
| Item | Score | Notes |
|------|-------|-------|
| Task instruction at start of prompt | FAIL | `<purpose>` is present but not a canonical `<task>`; `<required_reading>` immediately follows, not a task |
| Primary document/input at end of prompt | PASS | `<success_criteria>` closes the prompt — appropriate terminal anchor |
| Background context in the middle | PASS | State-loading and config-extraction are in middle steps |
| All irrelevant context removed | PASS | No obvious padding or boilerplate |
| Time-sensitive injected context labeled as snapshot | FAIL | `git status` and `git diff` outputs are injected inline without snapshot labeling |

### Self-Consistency
| Item | Score | Notes |
|------|-------|-------|
| Applied only to tasks with a single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | |

### Prompt Length
| Item | Score | Notes |
|------|-------|-------|
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| Long prompts compressed before sending | N/A | Not a RAG-style prompt |
| RAG context is extracted relevant passage only | N/A | |

### System/User Split
| Item | Score | Notes |
|------|-------|-------|
| Persistent instructions in system prompt | N/A | Workflow file is the system prompt for this skill |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No instruction duplication detected |
| Safety-critical constraints have external validation | FAIL | Preflight checks are self-reported by the model; no external validation |

### Agent / Subagent
| Item | Score | Notes |
|------|-------|-------|
| Agent prompts are fully self-contained | PASS | `<required_reading>` instructs reading of execution context — adequate |
| All file paths in agent output are absolute | PASS | Bash blocks use absolute paths via `${PHASE_DIR}` variable |
| Parallel agents launched in single message block | N/A | No parallel agents spawned |
| Adversarial probes specified for verification agents | N/A | Verification is a precondition, not performed here |

### Structural Architecture
| Item | Score | Notes |
|------|-------|-------|
| Large prompts decomposed into atomic, single-responsibility modules | PASS | Each `<step>` covers one concern |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | Consistent use of `${PHASE_DIR}`, `${BASE_BRANCH}`, `${PR_NUMBER}`, etc. |
| Modules compose at runtime via variable substitution | PASS | `gsd-sdk query` calls and variable injection are the composition mechanism |

### Constraint Enforcement
| Item | Score | Notes |
|------|-------|-------|
| Every restriction paired with equally concrete permission | PASS | Error paths include fallback instructions |
| Hard exclusion lists enumerated, not qualitative | N/A | No filtering task |
| Known edge cases have precedent-style rulings | FAIL | `human_needed` and `REVISE` verdict edge cases have no precedent ruling |
| Confidence thresholds are numeric, not qualitative | FAIL | External review confidence field (0–100) is accepted but no threshold for action is specified |

### Decision Frameworks
| Item | Score | Notes |
|------|-------|-------|
| Multi-option recommendations use explicit decision tree or table | PASS | `AskUserQuestion` provides labeled options |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` block is a post-hoc checklist |
| Action permissions framed around reversibility | PASS | Preflight guards irreversible push/PR actions |

### Multi-Phase Workflows
| Item | Score | Notes |
|------|-------|-------|
| Complex tasks organized into explicit named phases | PASS | Eight named `<step>` blocks |
| Required steps distinguished from type-specific steps | PASS | Preflight steps are mandatory; review step is optional |
| Scenario-based branching handles multiple paths explicitly | PASS | `optional_review` step has explicit scenario branches |

### Memory and Continuity
| Item | Score | Notes |
|------|-------|-------|
| Memory templates use XML tags as section labels | N/A | No memory template in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | `<offer_next>` is contextually appropriate |

### Modularity
| Item | Score | Notes |
|------|-------|-------|
| Each prompt component has single responsibility | PASS | Steps are well-separated |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>` block with explicit `<include>` / `<exclude>` lists |

### Safety and Trust
| Item | Score | Notes |
|------|-------|-------|
| Validation at system boundaries only; internal interfaces trusted | PASS | External command output is validated; internal state (`gsd-sdk`) is trusted |
| Dual-use capabilities state permissions before restrictions | N/A | No dual-use capability |
| Authorization narrow-scoped; each action confirmed before expanding | PASS | `preflight_checks` gates each irreversible action |

### Tone and Style
| Item | Score | Notes |
|------|-------|-------|
| Size constraints use numeric limits, not qualitative descriptors | FAIL | `generate_pr_body` uses "one paragraph" instead of a word/sentence count |
| Instructions use imperative present tense | PASS | Consistent throughout |
| Working notes in analysis tags, not user-facing output | FAIL | No `<analysis>` separation between internal reasoning and user-facing report |

### Optimization
| Item | Score | Notes |
|------|-------|-------|
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved before optimization | FAIL | Not addressed |

---

## Recommendations

### 1 (High Priority) — Add `<task>`, `<audience>`, and `<quality_bar>` before `<process>`
**Addresses:** Issue 1; Section 1 Actions 1–2; Section 23 task_specification checklist.

The guide treats these three as mandatory preamble. Their absence means the model must infer intent, audience, and success standard from the step structure alone — which is ambiguous when the workflow is invoked as a subagent. Add all three before `<process>` using the canonical XML tags. Keep each short (2–4 sentences). This is a low-effort, high-impact fix.

### 2 (High Priority) — Convert all negative conditional instructions to positive equivalents
**Addresses:** Issue 2; Section 5 Action 1; Section 23 instruction_framing checklist.

Audit every `If no…`, `If not…`, and `If [thing] not found…` instruction in `preflight_checks` and `optional_review`. Rewrite each as a positive statement of what the model should confirm or verify, with the failure path as a secondary clause. This is a mechanical rewrite — the guide's conversion table in Section 5 provides the template.

### 3 (High Priority) — Add tie-breaking rules for `human_needed` gate and `REVISE` verdict
**Addresses:** Issue 5; Section 5 (Tie-breaking instructions); Section 22 Pattern 4.

These two decision boundaries are the highest-consequence ambiguities in the workflow — both concern whether to proceed with an irreversible action (creating a public PR). The cost asymmetry is precision-biased: it is cheaper to block a ship than to revert a merge. Add explicit `<tie_breaking>` instructions that require positive user confirmation in both cases, and specify that silence or ambiguity is not confirmation.

### 4 (Medium Priority) — Add a persona and at least one calibrating example for `generate_pr_body`
**Addresses:** Issues 3 and 6; Section 6; Section 22 Patterns 1 and 2.

The PR body synthesis step is the highest-variability output in the workflow — the quality and style of the generated body will differ significantly across invocations without a persona and a calibrating example. Add a specific release-engineer persona and a single `<example>` with `<input>`, `<output>`, and `<commentary>` showing what a good vs. vague one-liner synthesis looks like.

### 5 (Medium Priority) — Add a machine-readable contract to the `report` step output
**Addresses:** Issue 4; Section 7; Section 22 Pattern 3.

The final report step is likely consumed by orchestrating agents in GSD's multi-agent architecture. Define a single structured output line (e.g., `GSD_SHIP_RESULT: PR=123 URL=https://... STATUS=SHIPPED`) with literal key names and placement instructions. This costs two lines of specification and eliminates fragile string parsing by callers.
