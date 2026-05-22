# Critique: settings.md

## Summary

The `settings.md` workflow is a functional, well-structured interactive configuration tool that successfully orchestrates a multi-step settings dialog with 14 distinct toggles, config persistence, and a confirmation display. Its internal organization is logical and its steps are sequential and complete. However, it relies exclusively on markdown prose and XML step tags rather than the guide's semantically rich XML vocabulary (`<task>`, `<persona>`, `<constraints>`, `<output_format>`), contains several negative-framed instructions, omits explicit priority ordering when settings conflict, and provides no example output for the confirmation table. The workflow is operationally sound but would benefit substantially from guide-aligned structural patterns that improve model reliability, constraint clarity, and format predictability at scale.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied.** The workflow correctly decomposes execution into explicit named steps (`ensure_and_load_config`, `read_current`, `present_settings`, `update_config`, `save_as_defaults`, `confirm`), creating clear cognitive phase boundaries. Each step is discrete and sequentially dependent, matching the phase pattern's intent.

- **Section 13 (Structural Architecture) — Template variable injection used correctly.** The `$GSD_CONFIG_PATH` variable is resolved once in the first step and reused throughout, explicitly avoiding hardcoded paths. This matches the guide's template variable and single-source-of-truth principles.

- **Section 14 (Constraint Enforcement) — Explicit merge semantics.** The `update_config` step uses `...existing_config` spread syntax in the JSON schema, making the merge-not-overwrite contract explicit. This is a form of structure preservation (Section 14, preserve/update pattern).

- **Section 19 (Modularity) — Single responsibility.** The file handles exactly one concern: interactive GSD settings configuration. It does not bleed into planning, execution, or other workflow concerns.

- **Section 21 (Tone and Style) — Confirmation summary is present and uses a table.** The `confirm` step renders a structured markdown table covering all 14 settings, giving the user a complete, scannable summary of applied changes. This aligns with Section 15's comparison table pattern for multi-option summaries.

- **Section 5 (Instruction Framing) — Conditional logic is explicit.** The text-mode fallback (`Set TEXT_MODE=true if --text is present OR text_mode from init JSON is true`) applies explicit conditional branching (Section 5, conditional instructions) rather than leaving runtime inference to the model.

---

## Issues

### Issue 1 — Missing semantic XML structure at the prompt level (Section 4, Actions 1–2)

**Principle:** Section 4 Action 2 requires that prompt sections be wrapped in semantically named XML tags (`<task>`, `<persona>`, `<constraints>`, `<output_format>`). Section 4 Action 1 requires the instruction to be complete before structure is applied.

**What's wrong:** The workflow wraps its entire body in a single `<process>` container of `<step>` tags. There is no `<task>` block declaring what the model must do, no `<constraints>` block governing config write behavior, and no `<output_format>` block specifying the expected confirmation output. The `<purpose>` tag at the top is semantically close to `<task>` but is not the guide's canonical vocabulary, and it does not carry the full task specification (audience, quality bar).

**Concrete fix:**

```xml
<task>
Configure GSD workflow agents and model profile for the current project by presenting
an interactive multi-question dialog, merging responses into config.json, and confirming
applied settings to the user.
</task>

<constraints>
- Write only to $GSD_CONFIG_PATH (resolved in ensure_and_load_config). Never hardcode .planning/config.json.
- Merge new settings over existing config; do not overwrite fields not presented in the dialog.
- When text_mode is active, replace all AskUserQuestion calls with numbered plain-text lists.
</constraints>

<output_format>
After updating config, display the confirmation table exactly as specified in the confirm step.
Present settings in the order listed. Use the On/Off labels; do not substitute other words.
</output_format>
```

---

### Issue 2 — Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions ("do not", "never") to be rewritten as positive specifications of desired behavior before emitting the prompt.

**What's wrong:** The workflow contains multiple negative-framed directives:

- "Never hardcode `.planning/config.json`" (step `update_config`)
- "do not overwrite fields not presented in the dialog" (implicit in the `...existing_config` pattern but not stated positively)

**Concrete fix:** Apply the Section 5 conversion table mechanically:

```
"Never hardcode .planning/config.json"
→ "Write config exclusively to $GSD_CONFIG_PATH resolved in ensure_and_load_config"

"Do not overwrite fields not presented in the dialog"
→ "Merge only the fields presented in the dialog; carry all other existing fields forward unchanged"
```

---

### Issue 3 — No quality bar or audience specified (Section 1, Actions 1–2)

**Principle:** Section 1 Action 1 requires explicit specification of (a) what output is being requested, (b) why it matters, and (c) what a correct or high-quality response looks like. Section 1 Action 2 requires the audience to be encoded in the prompt.

**What's wrong:** The `<purpose>` tag describes the what but not the quality bar or the audience. It does not state who will consume the output (the developer configuring GSD for a project), what vocabulary level they bring, or what distinguishes a correct run from an incorrect one (e.g., "config.json updated with all 14 fields, user offered global defaults save, confirmation table displayed").

**Concrete fix:**

```xml
<audience>
Developers configuring GSD for a new or existing project. Familiar with software tooling;
may be unfamiliar with GSD internals. Expect clear, labeled option descriptions.
</audience>

<quality_bar>
A correct run: resolves config path without error, presents all 14 questions with current
values pre-selected, writes a valid merged config.json, offers global defaults save, and
displays the full confirmation table. A run missing any of these five steps is incomplete.
</quality_bar>
```

---

### Issue 4 — No explicit priority ordering when settings have dependencies (Section 5, priority ordering; Section 16, required vs. type-specific steps)

**Principle:** Section 5 (priority ordering) requires explicit ranking when multiple considerations apply. Section 16 (required vs. optional steps) requires distinguishing mandatory from type-specific steps.

**What's wrong:** The workflow mentions one setting dependency in a comment: "Nyquist validation depends on research output. If research is disabled, plan-phase automatically skips Nyquist steps." This dependency is buried in a JavaScript comment inside the `AskUserQuestion` call, invisible to the model at execution time. There may be additional order-of-operations constraints (e.g., UI Gate depends on UI Phase being enabled; text_mode affects how all other questions are presented) that are not surfaced as explicit priority rules.

**Concrete fix:** Add an explicit dependency and priority block before the `present_settings` step:

```xml
<priority_order>
  1. Resolve text_mode first (controls how all subsequent questions are presented)
  2. Resolve model_profile (applies to all subsequent agent spawn decisions)
  3. Resolve research before nyquist_validation — if research is Off, nyquist is automatically Off
     and should be skipped or greyed out in the dialog
  4. Resolve ui_phase before ui_safety_gate — if ui_phase is Off, ui_safety_gate is automatically Off
  5. Present remaining settings in any order
</priority_order>
```

---

### Issue 5 — No output format example for the confirmation table (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** Section 22 Pattern 3 requires output format to be specified completely and upfront, including a concrete example. Section 7 Action 1 recommends separating reasoning from formatting. The guide is explicit: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call."

**What's wrong:** The confirmation table in the `confirm` step uses placeholder strings (`{quality/balanced/budget/inherit}`, `{On/Off}`) but does not provide a filled-in example showing exactly what a completed table looks like. Without a calibrating example, the model may vary the table format — column widths, label casing, presence of the quick-commands section — across runs.

**Concrete fix:** Add a filled-in example directly after the template:

```xml
<output_format>
<example>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SETTINGS UPDATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Setting              | Value     |
|----------------------|-----------|
| Model Profile        | Balanced  |
| Plan Researcher      | On        |
| Plan Checker         | On        |
| Execution Verifier   | On        |
| Auto-Advance         | Off       |
| Nyquist Validation   | On        |
| UI Phase             | On        |
| UI Safety Gate       | On        |
| AI Integration Phase | On        |
| Git Branching        | None      |
| Skip Discuss         | Off       |
| Context Warnings     | On        |
| Saved as Defaults    | No        |
</example>
</output_format>
```

---

### Issue 6 — `<required_reading>` instruction is vague and unactionable (Section 1, Action 1; Section 10, Action 1)

**Principle:** Section 1 Action 1 requires instructions to be specific. Section 10 Action 1 requires removing content that does not contribute to the task.

**What's wrong:** The `<required_reading>` block says "Read all files referenced by the invoking prompt's execution_context before starting" with no list of specific files, no conditional logic for when files do or do not exist, and no indication of what information to extract. It places an unbounded read obligation on the model that is resolved only by context the model may not have.

**Concrete fix:** Either enumerate the specific files (if they are always the same), make it conditional on runtime variables, or remove it if it is never actionable:

```xml
<required_reading>
If $INIT includes a reference to a config file path, read that file before
proceeding. Otherwise, resolve $GSD_CONFIG_PATH using gsd-sdk query config-path
and read the result. No other pre-reading is required.
</required_reading>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `settings.md`.

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (purpose/intent present; audience and quality bar absent)
- `[ ]` All constraints are compatible — **PASS** (no conflicting constraints identified)

### Chain-of-Thought
- `[ ]` CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **N/A** (not a reasoning task; correctly omitted)
- `[ ]` CoT trigger used — **N/A**
- `[ ]` Reasoning elicited before answer — **N/A**
- `[ ]` CoT traces flagged as heuristic — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **N/A** (no few-shot examples in this workflow type)
- `[ ]` 2–5 examples total — **N/A**
- `[ ]` Ordered simple → complex — **N/A**
- `[ ]` Examples span diverse sub-types — **N/A**
- `[ ]` Format consistent across examples — **N/A**
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[ ]` Instruction is complete and clear before formatting applied — **FAIL** (instruction is dispersed across `<purpose>` and `<process>` steps; no unified task statement)
- `[ ]` Prompt sections separated by semantically named XML tags — **FAIL** (`<step>` tags used but guide's canonical vocabulary `<task>`, `<constraints>`, `<output_format>` absent)
- `[ ]` At least 3 format variants tested on target model — **N/A** (workflow file, not a candidate prompt for format variant testing)

### Instruction Framing
- `[ ]` All negative instructions converted to positive equivalents — **FAIL** ("Never hardcode .planning/config.json" not rewritten positively)
- `[ ]` Priority order explicit when multiple criteria apply — **FAIL** (setting dependencies not surfaced as priority rules)
- `[ ]` Tie-breaking rules match domain's cost asymmetry — **N/A** (no ambiguous classification task requiring tie-breaking)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **PASS** (no persona assigned; appropriate for a procedural configuration workflow)
- `[ ]` Persona is specific — **N/A**
- `[ ]` Persona descriptor gender-neutral — **N/A**

### Output Format
- `[ ]` Structured output tasks use two-step reasoning-then-format approach — **N/A** (output is a fixed confirmation table, not model-reasoned structure)
- `[ ]` Single-call JSON places reasoning fields before answer fields — **N/A**
- `[ ]` Constrained decoding adopted only after free-form proven insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification with literal string requirements — **FAIL** (confirmation table uses placeholder labels, no concrete filled-in example to anchor format)

### Context Placement
- `[ ]` Task instruction at start of prompt — **FAIL** (`<purpose>` is present at top but is not a full task instruction; the actual procedural body starts immediately without a canonical `<task>` block)
- `[ ]` Primary document or input at end of prompt — **N/A** (no dynamic input document)
- `[ ]` Background context in middle — **PASS** (config schema and JSON structures appear in middle steps)
- `[ ]` All irrelevant context removed — **PASS** (no extraneous content identified)
- `[ ]` Time-sensitive injected context labeled as snapshot — **N/A** (no snapshot context injected)

### Self-Consistency
- `[ ]` Applied only to tasks with single correct answer — **N/A** (not applicable to a configuration workflow)
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[ ]` Redundant instructions removed — **PASS** (no obvious duplication)
- `[ ]` Long prompts compressed — **N/A** (prompt is moderate length)
- `[ ]` RAG context is extracted passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (workflow file, not a system/user split prompt)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[ ]` Each instruction in exactly one location — **PASS** (no duplication found)
- `[ ]` Safety-critical constraints have external validation — **FAIL** (the constraint "write only to $GSD_CONFIG_PATH" has no external validation; a model error could write to the wrong path)

### Agent/Subagent
- `[ ]` Agent prompts are fully self-contained — **PASS** (the workflow carries sufficient context to execute independently)
- `[ ]` All file paths in agent output are absolute — **PASS** (`$GSD_CONFIG_PATH` resolves to an absolute path; `~/.gsd/defaults.json` uses home-relative expansion, acceptable for shell context)
- `[ ]` Parallel agents launched in single message block — **N/A** (no parallel agent spawning in this workflow)
- `[ ]` Adversarial probes specified for verification agents — **N/A** (not a verification agent)

### Structural Architecture
- `[ ]` Large prompts decomposed into atomic single-responsibility modules — **PASS** (settings.md handles one concern)
- `[ ]` Template variables use `${VARIABLE_NAME}` syntax with fallback — **PASS** (`$GSD_CONFIG_PATH` used consistently; fallback defaults documented in `read_current`)
- `[ ]` Modules compose at runtime via variable substitution — **PASS**

### Constraint Enforcement
- `[ ]` Every restriction paired with equally concrete permission — **FAIL** (restriction "never hardcode path" not paired with an equally explicit permission statement)
- `[ ]` Hard exclusion lists enumerated, not described qualitatively — **N/A** (no exclusion filtering task)
- `[ ]` Known edge cases have precedent-style rulings — **FAIL** (the Nyquist-depends-on-research dependency is a known edge case buried in a code comment, not a precedent ruling)
- `[ ]` Confidence thresholds numeric, not qualitative — **N/A**

### Decision Frameworks
- `[ ]` Multi-option recommendations use explicit decision tree or comparison table — **PASS** (14 settings presented as structured option dialogs)
- `[ ]` Criteria checklists gate complex approaches — **N/A**
- `[ ]` Action permissions framed around reversibility — **FAIL** (no reversibility framing; config writes are destructive merges with no undo path mentioned)

### Multi-Phase Workflows
- `[ ]` Complex tasks organized into explicit named phases — **PASS** (five named steps cover the full workflow)
- `[ ]` Required steps distinguished from type-specific steps — **FAIL** (all steps presented as equally required; no distinction between universal steps and steps conditional on user choices, e.g., `save_as_defaults` is conditional on the user's answer)
- `[ ]` Scenario-based branching handles multiple paths explicitly — **FAIL** (text_mode fallback is mentioned but not structured as a `<scenario>`; the global-defaults "No" path has no explicit handling)

### Memory and Continuity
- `[ ]` Memory templates use XML tags as section labels — **N/A** (not a memory-producing workflow)
- `[ ]` Compaction summaries include discoveries and failed approaches — **N/A**
- `[ ]` Next steps tied to user's most recent explicit request — **N/A**

### Modularity
- `[ ]` Each prompt component has single responsibility — **PASS**
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` block; what this workflow does NOT configure is not stated — e.g., it does not set brave_search, commit_docs, or parallelization even though these appear in the defaults JSON schema)

### Safety and Trust
- `[ ]` Validation at system boundaries only — **PASS** (user input is the boundary; config merge logic is internal)
- `[ ]` Dual-use capabilities state permissions before restrictions — **N/A**
- `[ ]` Authorization narrow-scoped; each action confirmed before expanding — **PASS** (save-as-defaults requires explicit user confirmation before writing to `~/.gsd/`)

### Tone and Style
- `[ ]` Size constraints use numeric limits, not qualitative descriptors — **PASS** (the workflow does not impose size constraints on responses; confirmation table is fully enumerated)
- `[ ]` Instructions use imperative present tense — **PASS** (step names and imperatives like "Merge new settings", "Display:", "Ask whether to save" are imperative)
- `[ ]` Working notes in analysis tags, not user-facing output — **N/A**

### Optimization
- `[ ]` Prompt flagged as draft for automated optimization — **FAIL** (no optimization flag or note)
- `[ ]` Correct optimizer selected — **N/A**
- `[ ]` Held-out test set reserved — **N/A**

---

## Recommendations

Listed in priority order by impact on model reliability and correctness.

### 1. Add canonical `<task>`, `<constraints>`, and `<output_format>` blocks (Issue 1)

This is the highest-leverage fix. Adding the guide's standard top-level structural tags gives the model unambiguous entry points for what to do, what the boundaries are, and what the output must look like. Without them, the model must infer task scope and constraints from prose, which degrades consistency. Apply Section 4 Action 2 and Section 22 Pattern 3. Estimated impact: high — directly affects instruction reliability on every run.

### 2. Surface setting dependencies as explicit priority rules before the dialog (Issue 4)

The Nyquist-on-research dependency and the text_mode-affects-all-questions condition are currently invisible to the model at runtime (one is a comment, one is a separate conditional). Move them into a `<priority_order>` block preceding `present_settings`. This prevents the model from presenting Nyquist as an independent toggle when research is disabled. Apply Section 5 (priority ordering) and Section 16 (required vs. type-specific steps). Estimated impact: high — prevents a class of logically inconsistent configuration outputs.

### 3. Add a filled-in confirmation table example and specify output format constraints (Issue 5)

The confirmation table is the user-facing output. Without a concrete filled example, label casing, column alignment, and section ordering can vary. Add an example table with realistic values and specify that labels must match exactly the words shown (e.g., "Balanced" not "balanced", "On" not "Yes"/"Enabled"). Apply Section 22 Pattern 3 and Section 7's machine-parsed output specification. Estimated impact: medium-high — directly affects output consistency.

### 4. Convert all negative instructions to positive equivalents (Issue 2)

Replace "Never hardcode .planning/config.json" and any other negative directives with their positive counterparts. This is a mechanical transformation (Section 5 Action 1 conversion table) and is low effort relative to its reliability benefit. Estimated impact: medium — reduces instruction ambiguity at constraint boundaries.

### 5. Add explicit scope exclusions and a quality bar (Issues 3 and 6)

Add a `<quality_bar>` specifying the five observable criteria for a correct run, and add a `<scope><exclude>` block listing settings this workflow does not configure (brave_search, commit_docs, parallelization, granularity, mode). This prevents scope drift and gives the model a completion criterion it can self-check against. Apply Section 1 Actions 1–2 and Section 19 (explicit scope boundaries). Estimated impact: medium — reduces incomplete runs and unintended scope expansion.
