# Critique: manager.md

## Summary

`manager.md` is a well-structured, operationally mature workflow that handles a genuinely complex multi-phase orchestration task. Its step-by-step breakdown, concrete display examples, and explicit branching logic for error recovery make it stronger than most workflow prompts. However, it falls short of the guide's standards in several key areas: it uses markdown prose structure instead of the guide's semantic XML tag vocabulary, omits explicit persona definition, relies on qualitative descriptions where the guide mandates numeric specifications, mixes instruction types that should be separated into distinct sections, and contains no formal output format declaration for machine-parsed signals. These are not cosmetic gaps — they represent the patterns the guide identifies as producing the highest accuracy deltas.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern well applied.** The workflow correctly decomposes work into named, sequentially ordered steps (`initialize`, `dashboard`, `handle_action`, `background_completion`, `exit`), each with a clear trigger condition. This matches the guide's `<phase id="N" name="...">` cognitive-boundary principle.

- **Section 16 — Scenario-based branching is explicit.** Error handling in the `background_completion` step distinguishes two scenario types (permission errors vs. other errors) with separate option sets for each. This directly mirrors the guide's `<scenarios>/<scenario condition="...">` pattern.

- **Section 5 (Instruction Framing) — Conditional instructions are used correctly.** The `TEXT_MODE` branching (`--text` flag or config value) and the `all_complete` / `NOT all_complete` branches are explicit, matching the guide's conditional instruction template.

- **Section 15 (Decision Frameworks) — Compound option logic is decision-tree style.** The building of compound options (steps 1–4 under "Building options") reads as an implicit decision tree with clear priority ordering (background first, then inline).

- **Section 17 (Agent and Subagent Patterns) — Background agent prompts are self-contained.** The `Plan Phase N` and `Execute Phase N` task prompts include working directory, phase number, phase name, goal, and flags inline. This follows the guide's self-contained agent prompt requirement.

- **Section 20 (Safety and Trust) — Denial handling is explicit.** The background agent prompts explicitly instruct agents not to silently work around permission or file-access errors — this aligns with the guide's denial-handling pattern.

- **Section 14 (Constraint Enforcement) — Permission / blocker resolution logic is paired with options.** Each error class is paired with concrete recovery options, including an explicit "View details" path that reads `STATE.md`. This partially satisfies the guide's permit-pair requirement.

- **Success criteria checklist is present.** The `<success_criteria>` block at the end provides a testable definition of correct behavior, partially satisfying Section 1 Action 1's quality-bar requirement.

---

## Issues

### Issue 1: No persona defined for the orchestrating agent

**Principle:** Section 6 Action 2 — Personas must be specific and constrain register, voice, and domain-specific style to be effective.

**What's missing:** The workflow has no `<persona>` block. The orchestrating agent has no declared identity, which means it defaults to generic assistant behavior. For a workflow this complex — managing background agents, parsing JSON, building dashboards — a scoped persona would anchor behavior and reduce register drift.

**Concrete fix:**
```xml
<persona>
You are a milestone orchestration specialist for the GSD planning system.
Your job is not to perform development work — it is to coordinate, dispatch, and track progress across phases.
Dispatch background agents immediately. Present terse, structured dashboards. Ask questions only via AskUserQuestion.
</persona>
```

---

### Issue 2: Step structure uses markdown headers instead of semantic XML tags

**Principle:** Section 4 Action 2 — Prompt sections must be separated by semantically named XML tags. Section 16 — Complex multi-step tasks must use `<phase id="N" name="..." trigger="...">` tags.

**What's missing:** The steps are wrapped in `<step name="...">` tags, which is a reasonable approximation, but the inner structure uses markdown `##` headers, not XML section tags. The `<process>` container is unnamed and has no trigger chain. The guide specifies attributes: `id`, `name`, `trigger` — none of `trigger` is present on any step.

**Concrete fix:** Rename `<step>` to `<phase>` with attributes, and replace `##` headers inside phases with tagged subsections:
```xml
<phase id="1" name="Initialize" trigger="on_invoke">
  ...
</phase>

<phase id="2" name="Dashboard" trigger="after_initialize, after_any_action">
  ...
</phase>
```

---

### Issue 3: Output format for the dashboard is implicit — no `<output_format>` declaration

**Principle:** Section 7 / Section 22 Pattern 3 — Output format must be specified completely and upfront, including field names, ordering, and an example.

**What's missing:** The dashboard display format is shown by example (the ASCII table) but never formally specified in an `<output_format>` block. The status mapping table (disk_status → D P E Status) is buried in the body of the `dashboard` step as prose, not declared as a canonical output specification. The success criteria reference "correct status indicators (D/P/E/V columns)" but the column specification lives elsewhere, meaning the format and success criteria are decoupled.

**Concrete fix:** Add an `<output_format>` block early in the file (after `<purpose>`) that formally declares the dashboard table schema, status symbol mapping, and progress bar format. Move the status mapping table there. Reference it from the dashboard step.

---

### Issue 4: Auto-refresh interval described qualitatively; no numeric tie-breaking

**Principle:** Section 21 (Tone and Style) — Size constraints use numeric limits, not qualitative descriptors. Section 5 (Instruction Framing) — Tie-breaking rules must match the domain's cost asymmetry.

**What's missing:** "60-second auto-refresh cycle" is present and numeric — that's good. But the configurable default is stated as "set to 0 to disable" without specifying what 0 means for behavior. More critically, there is no tie-breaking rule for when `recommended_actions` is ambiguous — e.g., if the SDK returns recommended actions but the model is uncertain whether to wait for a running background agent or to proceed. The cost asymmetry here is asymmetric: acting on a stale recommendation while a background agent is writing to the same phase is more costly than waiting.

**Concrete fix:**
```xml
<tie_breaking>
When recommended_actions is present but any phase is_active, prefer "Refresh dashboard" over
dispatching new actions. Dispatching to an active phase risks state conflicts and is harder
to recover from than a delayed start.
</tie_breaking>
```

---

### Issue 5: Task intent and audience are not declared; quality bar is implicit

**Principle:** Section 1 Action 1 — Three components must be explicit: (a) what output is being requested, (b) why it matters or how it will be used, (c) what a correct or high-quality response looks like. Section 1 Action 2 — Audience must be identified.

**What's missing:** The `<purpose>` block describes what the workflow does, but it does not identify the audience (a developer managing a milestone), does not state why the output matters (so the developer can coordinate parallel work from one terminal without juggling multiple windows), and does not state the quality bar (a dashboard that is always accurate to disk state, with options that match actual recommended actions). The `<success_criteria>` partially covers the quality bar but is at the bottom of the file, not up front.

**Concrete fix:** Replace `<purpose>` with a structured task specification:
```xml
<task>Orchestrate a GSD milestone from a single terminal: show phase status, dispatch discuss/plan/execute actions, and track background agent progress.</task>
<audience>A developer actively working a milestone who wants to coordinate parallel phase work without leaving the terminal.</audience>
<quality_bar>Dashboard always reflects current disk state. Recommended actions are never stale. Background agents are dispatched in a single message block. No action is taken without user confirmation.</quality_bar>
```

---

### Issue 6: Background agent prompts use negative instructions

**Principle:** Section 5 Action 1 — Convert negative instructions to positive equivalents before emitting any prompt.

**What's missing:** The background agent prompts contain several negative instructions:
- "Do NOT use AskUserQuestion"
- "Do NOT silently work around permission or file access errors"
- "Do NOT use --no-verify on git commits"

These should be converted to positive specifications.

**Concrete fix:**
```
# Before (negative)
"Do NOT use AskUserQuestion — make autonomous decisions based on project context."

# After (positive)
"Make autonomous decisions based on project context. Write blockers to STATE.md and stop when you cannot proceed."

# Before (negative)
"Do NOT use --no-verify on git commits."

# After (positive)
"Let pre-commit hooks run normally on all git commits."
```

---

### Issue 7: No `<constraints>` block with explicit permission pairs

**Principle:** Section 14 — Every restriction must be paired with an equally concrete permission. `<permitted>` and `<reserved_for_human_review>` tags should be used.

**What's missing:** The workflow constrains background agent behavior (no AskUserQuestion, no bypassing hooks) but never states what the orchestrating agent IS permitted to do. There is no `<constraints>` block at the top level.

**Concrete fix:**
```xml
<constraints>
  <permitted>
    - Read disk state via gsd-sdk query
    - Spawn background Task agents for plan and execute actions
    - Invoke Skill() for discuss, verify-work, complete-milestone, and update-config
    - Present AskUserQuestion prompts to the user
    - Read STATE.md for blocker details
  </permitted>
  <reserved_for_human_review>
    - Modifying settings.local.json (offer via update-config Skill, confirm first)
    - Re-spawning a failed background agent without user selection
  </reserved_for_human_review>
</constraints>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `manager.md` as a workflow prompt:

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (purpose block present but audience and quality bar are implicit)
- `[x]` All constraints are compatible — no conflicts between scope, length, or depth — **PASS**

### Chain of Thought
- `[ ]` CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **N/A** (no CoT trigger present; appropriate for this orchestration task)
- `[ ]` CoT trigger used — **N/A**
- `[ ]` Reasoning is elicited before the answer — **N/A**
- `[ ]` CoT traces treated as heuristic aids — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **N/A** (no few-shot examples; task does not require them)
- `[ ]` 2–5 examples total — **N/A**
- `[ ]` Ordered simple → complex — **N/A**
- `[ ]` Examples span diverse sub-types — **N/A**
- `[ ]` Format consistent across all examples — **N/A**
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[x]` Instruction is complete and clear before formatting is applied — **PASS** (logic is fully described before display examples)
- `[ ]` Prompt sections are separated by semantically named XML tags — **FAIL** (`<step>` used instead of `<phase>` with full attribute set; inner sections use markdown headers)
- `[ ]` At least 3 format variants will be tested on the target model — **FAIL** (no evidence of format variant testing)

### Instruction Framing
- `[ ]` All negative instructions converted to positive equivalents — **FAIL** (three negative instructions in background agent prompts)
- `[ ]` Priority order is explicit when multiple criteria apply — **FAIL** (recommend_actions priority "execute > plan > discuss" is stated in success criteria but not in an explicit `<priority_order>` tag in the instructions)
- `[ ]` Tie-breaking rules match domain's cost asymmetry — **FAIL** (no tie-breaking rule for ambiguous recommended_actions state)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **FAIL** (no persona defined at all; for a complex orchestration workflow, a role-constrained persona is warranted per Section 6)
- `[ ]` Persona is specific — **FAIL** (absent)
- `[ ]` Persona descriptor is gender-neutral — **N/A** (absent)

### Output Format
- `[ ]` Structured output tasks use two-step reasoning-then-format approach — **N/A** (not applicable)
- `[ ]` Single-call JSON places reasoning fields before answer fields — **N/A**
- `[ ]` Constrained decoding adopted only after free-form proven insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification — **FAIL** (the dashboard table format is demonstrated by example only, not formally specified in an `<output_format>` block)

### Context Placement
- `[x]` Task instruction is at the start of the prompt — **PASS** (`<purpose>` and `<required_reading>` lead the file)
- `[ ]` Primary document or input is at the end of the prompt — **PASS** (`<success_criteria>` closes the file, serving as the evaluable output reference)
- `[ ]` Background context is in the middle — **PASS** (process steps are in the middle)
- `[x]` All irrelevant context has been removed — **PASS** (no visible padding or boilerplate)
- `[ ]` Time-sensitive injected context is labeled as a snapshot — **FAIL** (the `gsd-sdk query init.manager` call injects live state; no snapshot label or staleness warning)

### Self-Consistency
- `[ ]` Self-consistency applied only to tasks with a single correct answer — **N/A**
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[x]` Redundant instructions and repeated context removed — **PASS** (no obvious duplication)
- `[ ]` Long prompts compressed before sending — **N/A**
- `[ ]` RAG context is extracted relevant passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (workflow file, not split-prompt context)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[x]` Each instruction appears in exactly one location — **PASS**
- `[ ]` Safety-critical constraints have external validation — **FAIL** (the "do not bypass hooks" constraint is instruction-only, with no external enforcement noted)

### Agent/Subagent
- `[x]` Agent prompts are fully self-contained — **PASS** (background Task prompts include cwd, phase, goal, flags)
- `[ ]` All file paths in agent output are absolute — **N/A** (no file path output specified)
- `[x]` Parallel agents are launched in a single message block — **PASS** (compound action dispatches all background agents first in one block before inline)
- `[ ]` Adversarial probes specified for verification agents — **N/A** (manager does not do verification)

### Structural Architecture
- `[ ]` Large prompts decomposed into atomic, single-responsibility modules — **FAIL** (entire workflow is one file; no evidence of modular composition via template variables)
- `[ ]` Template variables use `${VARIABLE_NAME}` syntax with fallback — **FAIL** (variables like `{N}`, `{phase_name}`, `{cwd}` use brace syntax without `$` or fallback handling)
- `[ ]` Modules compose at runtime via variable substitution — **FAIL** (no template variable injection pattern visible)

### Constraint Enforcement
- `[ ]` Every restriction paired with equally concrete permission — **FAIL** (no `<constraints>` block with `<permitted>` / `<reserved_for_human_review>` tags)
- `[ ]` Hard exclusion lists enumerated, not described qualitatively — **N/A**
- `[ ]` Known edge cases have precedent-style rulings — **FAIL** (TEXT_MODE edge case is handled, but no precedent-style `<precedents>` block)
- `[ ]` Confidence thresholds are numeric, not qualitative — **N/A**

### Decision Frameworks
- `[x]` Multi-option recommendations use an explicit decision tree or comparison table — **PASS** (compound option building logic is step-by-step with explicit branching)
- `[ ]` Criteria checklists gate complex approaches — **FAIL** (no criteria checklist before dispatching background agents)
- `[x]` Action permissions framed around reversibility — **PASS** (permission errors prompt "add permission" vs. "run inline" vs. "skip" — implicitly reversibility-ordered)

### Multi-Phase Workflows
- `[x]` Complex tasks organized into explicit named phases — **PASS** (`<step name="...">` approximates this)
- `[x]` Required steps distinguished from type-specific steps — **PASS** (dashboard refresh is always required; discuss/plan/execute are type-specific)
- `[x]` Scenario-based branching handles multiple paths explicitly — **PASS** (permission vs. other error scenarios are explicitly branched)

### Memory and Continuity
- `[ ]` Memory templates use XML tags as section labels — **N/A** (not a memory workflow)
- `[ ]` Compaction summaries include discoveries and failed approaches — **N/A**
- `[ ]` Next steps tied to user's most recent explicit request — **N/A**

### Modularity
- `[ ]` Each prompt component has a single responsibility — **FAIL** (dashboard step handles display, option building, auto-refresh, and text-mode branching — four responsibilities)
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` block defining what this workflow includes and excludes)

### Safety and Trust
- `[ ]` Validation at system boundaries only — **PASS** (SDK query is the only external boundary; error is caught and surfaced)
- `[x]` Dual-use capabilities state permissions before restrictions — **N/A**
- `[ ]` Authorization is narrow-scoped — **PASS** (background agents are given narrow flags; manager does not self-authorize phase changes)

### Tone and Style
- `[x]` Size constraints use numeric limits — **PASS** (60-second interval is numeric; 20-char display_name truncation is numeric)
- `[x]` Instructions use imperative present tense — **PASS** (most instructions are imperative: "Parse JSON for...", "Build dashboard from JSON", "Display startup banner")
- `[ ]` Working notes in analysis tags, not user-facing output — **N/A**

### Optimization
- `[ ]` Prompt flagged as a draft for automated optimization — **FAIL** (no optimization flag or note)
- `[ ]` Correct optimizer selected — **FAIL** (not addressed)
- `[ ]` Held-out test set reserved before optimization — **FAIL** (not addressed)

---

## Recommendations

Ranked by expected impact on model behavior consistency:

### 1. Add a `<persona>` block scoped to orchestration (High Impact)

The absence of a persona is the single largest gap. A role-constrained identity ("milestone orchestration specialist, not a developer") will reduce register drift, prevent the model from offering unrequested implementation advice, and anchor the terse, structured output style the dashboard requires. Apply Section 6 Action 2 and the reframe pattern: "Your job is not to perform development work — it is to coordinate and track." Estimated effort: 5 minutes.

### 2. Convert negative instructions in background agent prompts to positive equivalents (High Impact)

Three negative instructions in the Plan Phase N and Execute Phase N prompts violate Section 5 Action 1. Each has a direct positive rewrite (see Issue 6). This directly affects the quality of instructions passed to background agents, which inherit these prompts verbatim. Estimated effort: 10 minutes.

### 3. Declare a formal `<output_format>` block for the dashboard (Medium Impact)

The dashboard table format is shown by example but never formally specified. Separating the canonical format specification from the procedural instructions (Section 7, Section 22 Pattern 3) would make the status symbol mapping authoritative and testable. Move the "Status mapping" table into `<output_format>`, and reference it from the dashboard step. Estimated effort: 15 minutes.

### 4. Add a top-level `<constraints>` block with `<permitted>` and `<reserved_for_human_review>` (Medium Impact)

The workflow implicitly constrains the orchestrating agent (confirm before modifying settings, do not bypass hooks) but never states what is permitted. Section 14 requires every restriction to be paired with an equally concrete permission. Adding this block also satisfies the Section 23 checklist item and makes the permission boundary auditable. Estimated effort: 15 minutes.

### 5. Replace `{VARIABLE}` brace syntax with `${VARIABLE_NAME}` and add fallback where appropriate (Low-Medium Impact)

The background agent prompts use `{N}`, `{phase_name}`, `{cwd}`, `{goal}`, and `{manager_flags.X}` with plain braces. The guide's Section 13 specifies `${VARIABLE_NAME}` with fallback syntax `${VAR||"(default value)"}` for optional context. This is particularly important for `{manager_flags.plan}` and `{manager_flags.execute}`, which are empty strings by default — they should use `${manager_flags.plan||""}` to make the fallback intent explicit and prevent interpolation failures in runtimes that treat empty variables differently. Estimated effort: 10 minutes.
