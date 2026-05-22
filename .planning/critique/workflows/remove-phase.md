# Critique: remove-phase.md

## Summary

`remove-phase.md` is a well-structured operational workflow that accomplishes its narrow task clearly: it handles argument parsing, validation, confirmation, delegation, commit, and completion in a logical step sequence. The XML `<step>` tagging, `<anti_patterns>`, and `<success_criteria>` sections show real structural intent. However, the workflow reads more like internal documentation than a precision-engineered prompt. It is missing several high-leverage elements from the guide: there is no explicit persona, no output format specification, no quality bar for the model's final response, no positive framing of its negative constraints, and no scenario-based branching for the several conditional paths the workflow handles. The task instruction placement and context ordering also diverge from what the guide mandates. The gaps are all fixable without a full rewrite.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern applied correctly.** The workflow is decomposed into explicit, named steps using `<step name="...">` tags, creating clear cognitive boundaries between parse, validate, confirm, execute, commit, and report.

- **Section 14 (Constraint Enforcement) — hard exclusion list via `<anti_patterns>`.** The `<anti_patterns>` block enumerates concrete prohibitions (no manual renumbering, no removal of completed phases without `--force`, no notes in STATE.md). This is a valid hard-exclusion pattern (Section 14, hard exclusion lists).

- **Section 1 Action 1 — output is clearly specified.** The `<purpose>` element makes explicit what the workflow produces: a removed phase, renumbered directories, updated files, and a git commit. The three task components (what, why, quality signal) are partially covered.

- **Section 5 (Instruction Framing) — conditional instructions present.** The `if no argument provided` and `if target <= current phase` branches use explicit conditional logic matching the guide's conditional instruction pattern.

- **Section 16 — success criteria as a completion checklist.** The `<success_criteria>` block with a four-item checklist mirrors the guide's recommended pattern for multi-phase workflow completion signals.

- **Section 22 Pattern 5 (single-responsibility modules).** The file covers one concern — phase removal — and does not bundle adjacent concerns (e.g., pausing work, reviewing the roadmap) into its body.

---

## Issues

### Issue 1 — No persona assigned for a stylistic/interactive task
**Principle:** Section 6 Action 1–2 — classify the task before assigning a persona; make personas specific, not generic.

**What's wrong:** The workflow presents a confirmation dialogue (`Proceed? (y/n)`) and a completion summary to the user. Both are stylistic, interactive outputs where tone and register matter. There is no `<persona>` tag anywhere in the file. Without one, the model defaults to generic assistant behavior, producing inconsistent tone in its user-facing output steps.

**Fix:** Add a `<persona>` block at the top of the file constraining the interaction style:

```xml
<persona>
You are a precise project operations assistant. Present removals as surgical, fact-first
summaries. Use imperative, terse language. Never editorialize.
</persona>
```

---

### Issue 2 — `<anti_patterns>` are all negative instructions; none are converted to positive equivalents
**Principle:** Section 5 Action 1 — convert negative instructions to positive equivalents before emitting the prompt.

**What's wrong:** Every item in `<anti_patterns>` is a negated instruction:
- "Don't remove completed phases..."
- "Don't remove current or past phases..."
- "Don't manually renumber..."
- "Don't add 'removed phase' notes..."
- "Don't modify completed phase directories..."

The guide mandates converting these to positive specifications of desired behavior, reserving negations only for the reframe pattern (Section 6).

**Fix:** Rename the block to `<constraints>` and rewrite each item as a positive instruction:

```xml
<constraints>
- Remove only phases validated as future and unstarted (target > current phase)
- Delegate all renumbering exclusively to `gsd-sdk query phase.remove`
- Use the git commit as the sole historical record of removal; keep STATE.md clean
- Treat completed phase directories (those with SUMMARY.md) as read-only unless --force is confirmed
</constraints>
```

---

### Issue 3 — No `<output_format>` specification for user-facing responses
**Principle:** Section 7 (Output Format Handling); Section 22 Pattern 3 — output format specified completely and upfront.

**What's wrong:** The workflow defines what the model must *do* but never specifies the format, length, or structure of the model's direct conversational output to the user. The inline code blocks (the error message, the confirmation prompt, the completion summary) are embedded inside step prose rather than defined in a dedicated `<output_format>` block. This means the model has no canonical format to anchor against when generating its responses.

**Fix:** Extract the three user-facing output templates into a `<output_format>` block before `<process>`:

```xml
<output_format>
Three response templates govern all user-facing output:

1. Error response — argument missing or validation failure:
   Start with "ERROR: [reason]" on its own line. Follow with "Usage:" and "Example:" lines.
   No additional prose.

2. Confirmation prompt — before deletion:
   Present as a plain block: phase number, name, list of changes, then "Proceed? (y/n)"
   No explanatory preamble.

3. Completion summary — after successful removal:
   Present as a plain block: phase removed, changes list, committed message, then
   "What's Next" suggestions. Three suggestions maximum.
</output_format>
```

---

### Issue 4 — No scenario-based branching for the --force path
**Principle:** Section 16 — scenario-based branching handles multiple paths explicitly rather than leaving the model to infer.

**What's wrong:** The `execute_removal` step mentions two execution paths (normal and `--force`) but buries the conditional inside a code comment rather than defining them as explicit scenarios. This means the model must infer when to offer `--force` and what confirmation to seek from the user — a decision point that should be explicit.

**Fix:** Replace the inline conditional with a `<scenarios>` block inside `execute_removal`:

```xml
<scenarios>
  <scenario id="1" condition="phase_has_no_executed_plans">
    Run: gsd-sdk query phase.remove "${target}"
    Proceed to commit step on success.
  </scenario>

  <scenario id="2" condition="phase_has_executed_plans_cli_errors">
    Inform the user: "Phase {target} has executed plans (SUMMARY.md files). Removing it
    will delete completed work. Proceed with --force? (y/n)"
    On confirmation: run gsd-sdk query phase.remove "${target}" --force
    On refusal: exit without changes.
  </scenario>
</scenarios>
```

---

### Issue 5 — Task instruction is not at the prompt start; context ordering violates the guide
**Principle:** Section 8 Actions 1–3 — task instruction at the very start; primary input at the end; background context in the middle.

**What's wrong:** The file opens with a `<purpose>` block followed immediately by `<required_reading>` and then `<process>`. The `<purpose>` is not a proper `<task>` element, and the `<required_reading>` instruction is placed before the process steps rather than being integrated as a contextual note. The `<anti_patterns>` and `<success_criteria>` blocks are at the bottom, which is fine structurally, but the overall ordering is: purpose → reading instruction → process → anti-patterns → success criteria, rather than the guide's canonical: task → context → input.

**Fix:** Restructure the top of the file:

```xml
<task>
Remove an unstarted future phase from the project roadmap, delete its directory, renumber
all subsequent phases to maintain a clean linear sequence, and commit the change.
</task>

<context>
Read all files referenced by the invoking prompt's execution_context before starting.
The git commit serves as the historical record of removal — no additional notes are needed
in STATE.md.
</context>

<input>
The phase number to remove is supplied as a command argument.
</input>

<process>
...
</process>
```

---

## Quick-Reference Checklist Score

Scoring against Section 23 of the guide, applied to `remove-phase.md` as a prompt artifact.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | No `<audience>` or `<quality_bar>` element; intent is implicit in `<purpose>` |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints detected |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step logic | N/A | Workflow is procedural, not reasoning-heavy; CoT not applicable |
| CoT trigger used correctly | N/A | Not applicable |
| Reasoning elicited before answer | N/A | Not applicable |
| CoT traces treated as heuristic | N/A | Not applicable |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples present |
| 2–5 examples total | N/A | No examples present |
| Ordered simple → complex | N/A | No examples present |
| Examples span diverse sub-types | N/A | No examples present |
| Format consistent across all examples | N/A | No examples present |
| Example order fixed across evaluation runs | N/A | No examples present |
| **Formatting** | | |
| Instruction complete and clear before formatting applied | PASS | Process steps are substantive before any formatting decisions |
| Prompt sections separated by semantically named XML tags | PASS | `<step>`, `<anti_patterns>`, `<success_criteria>`, `<process>` all present |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |
| **Instruction Framing** | | |
| All negative instructions converted to positive equivalents | FAIL | `<anti_patterns>` block is entirely negatively framed |
| Priority order explicit when multiple criteria apply | FAIL | No `<priority_order>` tag; step sequence implies order but doesn't state it |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rules present |
| **Persona** | | |
| Persona included only for open-ended or stylistic tasks | FAIL | Task has stylistic output (confirmation dialogs, summaries) — no persona defined |
| Persona is specific (constrains voice/register) | FAIL | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona present |
| **Output Format** | | |
| Structured output tasks use two-step reasoning-then-format | N/A | Output is templated, not reasoning-heavy |
| Single-call JSON places reasoning fields before answer fields | N/A | No JSON output |
| Constrained decoding adopted only after free-form proven insufficient | N/A | Not applicable |
| Machine-parsed output uses exact format specification | FAIL | Error and completion templates are embedded in step prose, not in a dedicated `<output_format>` block |
| **Context Placement** | | |
| Task instruction is at the start | FAIL | `<purpose>` is not a proper `<task>`; `<required_reading>` is placed before the process |
| Primary document/input is at the end | FAIL | No `<input>` tag; argument handling is buried inside a step |
| Background context is in the middle | FAIL | `<required_reading>` is second, not middle |
| All irrelevant context removed | PASS | No extraneous context present |
| Time-sensitive injected context labeled as snapshot | N/A | No injected runtime context in this file |
| **Self-Consistency** | | |
| Applied only to tasks with single correct answer | N/A | Not applicable |
| Inference budget permits 15–20 samples | N/A | Not applicable |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No obvious redundancy detected |
| Long prompts compressed before sending | N/A | Prompt is short |
| RAG context is extracted relevant passage only | N/A | No RAG context |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | File is a workflow document, not a system/user split prompt |
| Task-specific instructions in user prompt | N/A | Not applicable |
| Each instruction appears in exactly one location | PASS | No duplicated instructions found |
| Safety-critical constraints have external validation | FAIL | The `validate_future_phase` guard is prompt-only; no external validation noted |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | PASS | `<required_reading>` instructs context loading before starting |
| All file paths in agent output are absolute | FAIL | The completion summary shows relative paths (`.planning/phases/{target}-{slug}/`) |
| Parallel agents launched in single message block | N/A | No parallel agent spawning |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS | File handles one concern only |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL | Variables use `{target}`, `{N}`, `{M}` — not the guide's `${VARIABLE_NAME}` syntax |
| Modules compose at runtime via variable substitution | N/A | Composition mechanism is the SDK call, not template variables |
| **Constraint Enforcement** | | |
| Every restriction paired with equally concrete permission | FAIL | `<anti_patterns>` lists prohibitions only; no paired permissions stated |
| Hard exclusion lists are enumerated, not qualitative | PASS | The five anti-patterns are specific and enumerated |
| Known edge cases have precedent-style rulings | FAIL | The `--force` edge case is mentioned in a step but has no precedent-style ruling |
| Confidence thresholds are numeric | N/A | No confidence scoring needed for this task |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or comparison table | FAIL | The two `phase.remove` paths (normal vs. `--force`) are not expressed as a decision tree |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` provides a four-item gate |
| Action permissions framed around reversibility | FAIL | No reversibility framework applied; the guide's `<take_freely>` / `<confirm_with_user>` pattern is absent |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | PASS | Six named `<step>` elements with clear names |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` / `<type_specific_strategy>` distinction |
| Scenario-based branching handles multiple paths explicitly | FAIL | The `--force` path is implicit inside a step, not a `<scenario>` |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory template in this file |
| Compaction summaries include discoveries and failed approaches | N/A | Not applicable |
| Next steps tied to user's most recent explicit request | PASS | "What's Next" suggestions in completion summary are contextually appropriate |
| **Modularity** | | |
| Each prompt component has a single responsibility | PASS | File is tightly scoped to phase removal |
| Scope boundaries state both inclusions and exclusions | FAIL | `<anti_patterns>` covers exclusions; no corresponding `<include>` scope stated |
| **Safety and Trust** | | |
| Validation at system boundaries only; internal interfaces trusted | PASS | SDK call is trusted; only the argument and state check are validated |
| Dual-use capabilities state permissions before restrictions | FAIL | `<anti_patterns>` leads with restrictions; no permissions stated first |
| Authorization is narrow-scoped; each action confirmed before expanding scope | PASS | The `confirm_removal` step gates deletion behind explicit user confirmation |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | N/A | No size constraints applicable to this workflow |
| Instructions use imperative present tense | PASS | Steps use imperative phrasing throughout ("Parse", "Verify", "Present", "Stage") |
| Working notes in analysis tags, not user-facing output | N/A | No extended reasoning present |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | N/A | Not yet flagged for optimization |
| Held-out test set reserved before optimization | N/A | Not yet flagged for optimization |

---

## Recommendations

Listed in priority order by impact on correctness and consistency of model behavior.

**1. Convert `<anti_patterns>` to a positive `<constraints>` block (Section 5 Action 1)**
This is the highest-leverage fix. Every negated instruction in `<anti_patterns>` should be rewritten as a positive specification of desired behavior. The guide is explicit: scan for "do not / avoid / never" as primary directives and rewrite them before emitting any prompt. This single change affects five instructions and brings the framing into full compliance.

**2. Add `<output_format>` with explicit templates for all three user-facing outputs (Section 7; Section 22 Pattern 3)**
The three response types — error, confirmation prompt, and completion summary — are currently embedded as inline code blocks inside step prose. Extracting them into a dedicated `<output_format>` block before `<process>` gives the model a stable format anchor for every user-facing turn. This is the most concrete cause of output inconsistency across runs.

**3. Add `<scenarios>` for the --force execution path (Section 16 — scenario-based branching)**
The normal vs. `--force` execution branches are currently conflated inside `execute_removal`. Making each an explicit `<scenario condition="...">` eliminates the model's need to infer when to offer `--force`, what confirmation text to present, and what to do on refusal. This is a decision point with irreversible consequences (deleting executed plan directories) and must be fully specified.

**4. Fix context ordering: add proper `<task>`, `<context>`, and `<input>` tags at the document root (Section 8 Actions 1–3)**
The file opens with `<purpose>` rather than `<task>`, and `<required_reading>` is in the second position rather than the middle. Restructuring to `<task>` → `<context>` → `<input>` → `<process>` ensures the model's highest-attention positions are occupied by the task instruction and the argument input, as the guide mandates.

**5. Add a `<persona>` constraining tone for user-facing interactions (Section 6 Actions 1–2)**
The confirmation dialog and completion summary are direct user interactions. Without a persona, the model's default register varies. A short, specific persona — terse, fact-first, imperative — takes fewer than five lines and stabilizes the register across all three output types.
