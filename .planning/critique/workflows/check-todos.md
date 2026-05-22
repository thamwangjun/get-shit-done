# Critique: check-todos.md

## Summary

`check-todos.md` is a competently structured, process-oriented workflow that succeeds at its core mission: it provides a clear, step-by-step sequence for listing, selecting, and acting on todos. The use of named XML `<step>` tags, explicit bash examples, and a success-criteria checklist all reflect solid structural instincts. However, the workflow falls short of the guide's standards in several areas that matter for production reliability: it lacks an `<output_format>` specification, uses no XML tag vocabulary from Section 4 at the top structural level, omits `<constraints>` for the actions the agent may take autonomously, contains no persona assignment despite having a defined role, and the `<purpose>` statement addresses the mechanism rather than the outcome and audience. Several instructions are framed negatively or implicitly where a positive specification would be stronger.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Named `<step>` phases.** Each step is wrapped in a named XML tag (`<step name="init_context">`, `<step name="parse_filter">`, etc.), creating clear cognitive boundaries and matching the `<phase>` pattern the guide recommends for multi-step tasks.

- **Section 16 — Required vs. optional steps distinguished.** The `<success_criteria>` block at the end functions as a required-steps checklist, separating what must be true on completion from the procedural body.

- **Section 15 (Decision Frameworks) — Conditional branching is explicit.** The `check_roadmap` and `offer_actions` steps branch explicitly on conditions (`todo maps to a roadmap phase` vs. `no roadmap match`) rather than leaving the model to infer which path to take.

- **Section 13 (Structural Architecture) — Template variable injection.** The `gsd-sdk query init.todos` call and `$ARGUMENTS` reference demonstrate correct use of runtime variable injection rather than hard-coding.

- **Section 5 (Instruction Framing) — Conditional instructions use direct branching syntax.** The filter-check in `parse_filter` uses explicit `if/then` logic (`/gsd-check-todos` vs. `/gsd-check-todos api`), consistent with the guide's conditional-instruction pattern.

- **Section 20 (Safety and Trust) — Reversible vs. irreversible actions are distinguished implicitly.** Moving a todo file to `done/` triggers a git commit step, not an immediate deletion. The workflow does not silently destroy state.

- **Section 22, Pattern 3 — Output template for todo display.** The numbered list display format in `list_todos` and the detail block in `load_context` both specify the exact layout the model should produce, consistent with Pattern 3's "output format specified completely and upfront."

---

## Issues

### Issue 1 — No `<output_format>` specification for machine-adjacent output

**Guide principle:** Section 7, Action 1; Section 7 "Machine-parsed output specification"; Section 22, Pattern 3.

**What is missing:** The workflow produces structured text output in multiple steps (the numbered list in `list_todos`, the detail block in `load_context`, the confirmation message in `git_commit`). These are shown as fenced code block examples inside step descriptions, but there is no top-level `<output_format>` tag declaring the canonical shape of each output. The `AskUserQuestion` calls in `offer_actions` are specified adequately, but the plain-text lists, relative time formatting, and confirmation lines are left implicit.

**Concrete fix:** Add an `<output_format>` block after `<process>` (or at the top of the prompt) that canonicalizes the two primary display outputs:

```xml
<output_format>

**Todo list format:**
```
Pending Todos:

1. [title] ([area], [relative age])
2. ...

---

Reply with a number to view details, or:
- `/gsd-check-todos [area]` to filter by area
- `q` to exit
```

**Todo detail format:**
```
## [title]

**Area:** [area]
**Created:** [date] ([relative time] ago)
**Files:** [list or "None"]

### Problem
[problem]

### Solution
[solution]
```

**Commit confirmation format (exact literal):**
```
Committed: docs: start work on todo - [title]
```

</output_format>
```

---

### Issue 2 — `<purpose>` describes mechanism, not task components (intent, audience, quality bar)

**Guide principle:** Section 1, Actions 1 and 2; Section 4, Action 2.

**What is missing:** The `<purpose>` tag reads: "List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action." This describes the mechanical steps, not (a) what a high-quality outcome looks like, (b) who will consume the output, or (c) what the success criterion is. The guide requires all three to be explicit. The audience here is an interactive developer using Claude Code — but that is never stated. The quality bar (e.g., "the user leaves with either work in progress or a clear next step") is absent.

**Concrete fix:** Replace `<purpose>` with a `<task>` and `<audience>` pair:

```xml
<task>
Guide the user through reviewing pending todos: list them, load full context for the selected
item, check for roadmap alignment, and route to the appropriate next action so the user
ends the interaction with either work started or a clear plan.
</task>

<audience>
A developer working interactively in Claude Code who has accumulated todos during previous
sessions and wants to triage and act on them without losing context.
</audience>

<quality_bar>
Every todo interaction ends with a concrete outcome: work started, a phase created, or an
explicit "put it back" decision. The user never ends in an ambiguous state.
</quality_bar>
```

---

### Issue 3 — No `<constraints>` block; autonomous actions (git commit, file moves) are unconstrained

**Guide principle:** Section 14 (Constraint Enforcement); Section 15 (The reversibility framework — `<take_freely>` / `<confirm_with_user>`); Section 20 (Safety and Trust).

**What is missing:** The workflow autonomously moves files (`mv .planning/todos/pending/ .planning/todos/completed/`) and commits to git (`gsd-sdk query commit ...`) without specifying which actions the agent may take freely and which require user confirmation. The guide's reversibility framework requires explicit pairing of reversible actions (`<take_freely>`) with irreversible or externally visible ones (`<confirm_with_user>`). A git commit is visible in repo history and is not trivially undoable without a revert.

**Concrete fix:** Add a `<constraints>` block before `<process>`:

```xml
<constraints>
  <take_freely>
    - Read any file in .planning/
    - Display lists, details, and prompts to the user
    - Filter and parse todo content
  </take_freely>

  <confirm_with_user>
    - Moving a todo file from pending/ to completed/ (irreversible without manual move)
    - Committing to git (visible in repo history)
    - Creating or modifying any file outside .planning/todos/
  </confirm_with_user>
</constraints>
```

---

### Issue 4 — No persona assigned; role-specific behavioral bias is absent

**Guide principle:** Section 6, Actions 1 and 2; Section 22, Pattern 1.

**What is missing:** The workflow acts as a task-routing and triage agent with a well-defined role — but no `<persona>` is declared. The guide specifies that open-ended workflows with a defined role benefit from a specific persona that constrains register and decision-making style. Without one, the agent defaults to generic assistant behavior. The check-todos workflow requires the agent to be directive (move things forward, don't dwell), efficient (no long explanations), and context-aware (link todos to roadmap phases). These traits should be encoded explicitly.

**Concrete fix:** Add a `<persona>` block at the top:

```xml
<persona>
You are a task triage specialist. Your job is to help developers clear their backlog efficiently.
Be directive: offer clear options, act on the chosen one immediately, and confirm completions
with a single line. Do not explain steps you are about to take — take them and report what
you did.
</persona>
```

---

### Issue 5 — `TEXT_MODE` branch in `offer_actions` is embedded mid-step rather than structured as a scenario

**Guide principle:** Section 16 (Multi-Phase Workflows — Scenario-based branching); Section 5 (Conditional instructions).

**What is missing:** The TEXT_MODE handling is injected inline inside the `offer_actions` step as a parenthetical block before the main logic. This buries an important runtime branch (affecting all user-interaction calls) in the middle of a step description. The guide recommends using `<scenarios>` to handle branching paths explicitly, with named conditions, so neither path is subordinate to the other.

**Concrete fix:** Extract TEXT_MODE as a top-level `<scenarios>` block at the start of `offer_actions`, or as a dedicated `<step name="detect_runtime">` before interaction steps:

```xml
<step name="detect_runtime">
Check for text mode:
- If `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`:
  Set TEXT_MODE=true. All user-interaction steps must use plain-text numbered lists instead of AskUserQuestion.
- Otherwise: TEXT_MODE=false. Use AskUserQuestion for all user-interaction steps.

This flag applies to: list_todos, handle_selection, offer_actions.
</step>
```

Then in `offer_actions` and `handle_selection`, reference TEXT_MODE directly without re-explaining it.

---

### Issue 6 — Negative instructions present in step prose

**Guide principle:** Section 5, Action 1 (convert negative instructions to positive equivalents).

**What is missing:** The `load_context` step's prose does not contain negatives, but the `offer_actions` step uses `"Put it back" — return to list`, which is fine. However, looking at the `check_roadmap` step: "Note any match for action options" is vague rather than specific. More critically, the `handle_selection` step says `If invalid: "Invalid selection. Reply with a number (1-[N]) or \`q\` to exit."` — the instruction to the model on how to handle this case uses negative-framing in the implicit sense of only specifying the error path without specifying what constitutes valid behavior clearly in positive terms.

**Concrete fix:** In `handle_selection`, reframe as:

```
Accept only a number between 1 and [N], or the letter `q`.
For any other input, respond: "Invalid selection. Reply with a number (1–[N]) or `q` to exit."
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are inapplicable to a workflow-type prompt file.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are explicit | FAIL | Purpose statement covers mechanics only; audience and quality bar absent |
| All constraints are compatible | PASS | No conflicting constraints detected |
| **Chain of Thought** | | |
| CoT included only for appropriate task types | N/A | No CoT trigger needed for this routing workflow |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples needed for this workflow type |
| 2–5 examples total | N/A | |
| Ordered simple to complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete before formatting applied | PASS | Step-by-step structure is clear |
| Prompt sections separated by semantically named XML tags | FAIL | Top-level structure uses `<purpose>`, `<required_reading>`, `<process>`, `<success_criteria>` — not the canonical tag vocabulary (`<task>`, `<context>`, `<constraints>`, `<output_format>`) from Section 4 |
| At least 3 format variants tested on target model | FAIL | No evidence of format variant testing |
| **Instruction Framing** | | |
| Negative instructions converted to positive equivalents | FAIL | `handle_selection` implicitly specifies only the error path; `check_roadmap` uses vague "note any match" |
| Priority order explicit when multiple criteria apply | N/A | Single linear flow; no competing criteria |
| Tie-breaking rules match domain cost asymmetry | N/A | Binary selection; no tie-breaking ambiguity |
| **Persona** | | |
| Persona included only for open-ended or stylistic tasks | FAIL | Persona absent; workflow has a clear role that would benefit from one |
| Persona is specific | FAIL | No persona present |
| Persona is gender-neutral | N/A | No persona present |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | No structured data output |
| Single-call JSON places reasoning before answer | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Commit confirmation line and display formats specified inline in steps, not in a dedicated `<output_format>` block |
| **Context Placement** | | |
| Task instruction at start of prompt | FAIL | `<purpose>` is at the start but is mechanism-focused; no canonical `<task>` leads the prompt |
| Primary input at end of prompt | PASS | `<success_criteria>` closes the file; primary content is accessed at runtime via SDK call |
| Background context in middle | PASS | Step details are in the middle |
| Irrelevant context removed | PASS | No obvious padding |
| Time-sensitive injected context labeled as snapshot | N/A | No snapshot context injected |
| **Self-Consistency** | | |
| Applied only to tasks with single correct answer | N/A | Interactive routing workflow |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions removed | PASS | No obvious redundancy |
| Long prompts compressed | PASS | Prompt is appropriately concise |
| RAG context is extracted passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file invoked as a skill |
| Task-specific instructions in user prompt | N/A | |
| Each instruction in exactly one location | PASS | No duplication detected |
| Safety-critical constraints have external validation | FAIL | Git commit and file move actions have no external validation; agent acts autonomously |
| **Agent/Subagent** | | |
| Agent prompts fully self-contained | PASS | `<required_reading>` and SDK call make context explicit |
| All file paths in agent output are absolute | FAIL | File paths in bash examples use relative paths (`".planning/todos/pending/[filename]"`) |
| Parallel agents launched in single message | N/A | No parallel spawning |
| Adversarial probes specified for verification agents | N/A | |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic modules | PASS | Workflow is reasonably scoped to one concern |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `$ARGUMENTS` used correctly |
| Modules compose at runtime via variable substitution | PASS | `gsd-sdk query` pattern used |
| **Constraint Enforcement** | | |
| Every restriction paired with concrete permission | FAIL | No `<constraints>` block; no explicit permission pairs |
| Hard exclusion lists enumerated | N/A | No filtering task |
| Known edge cases have precedent-style rulings | FAIL | Edge cases (empty todos, invalid selection, text mode) handled inline without precedent-style clarity |
| Confidence thresholds are numeric | N/A | No confidence-scored output |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or table | PASS | Branching in `offer_actions` and `check_roadmap` is explicit |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | FAIL | No `<take_freely>` / `<confirm_with_user>` pairing |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | PASS | Named `<step>` tags used throughout |
| Required steps distinguished from type-specific | PASS | `<success_criteria>` separates required outcomes |
| Scenario-based branching handles multiple paths | FAIL | TEXT_MODE branch embedded inline in a step rather than as a named `<scenario>` |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory writing in this workflow |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Workflow returns user to `list_todos` on "Put it back"; next steps are anchored to selection |
| **Modularity** | | |
| Each prompt component has single responsibility | PASS | Workflow is focused on todo triage only |
| Scope boundaries state inclusions and exclusions | FAIL | No `<scope>` block; what is out of scope is never stated |
| **Safety and Trust** | | |
| Validation at system boundaries only | PASS | External data (todo files) are read, not blindly executed |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL | File move and git commit taken without explicit per-action confirmation |
| **Tone and Style** | | |
| Size constraints use numeric limits | FAIL | "briefly summarize" in `load_context` is qualitative; no word/sentence count given |
| Instructions use imperative present tense | PASS | Steps predominantly use imperative present tense |
| Working notes in analysis tags, not user-facing output | PASS | No working notes surfaced to user |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | FAIL | Not specified |
| Held-out test set reserved before optimization | FAIL | Not specified |

---

## Recommendations

Prioritized by impact on reliability and guide compliance:

### 1. Add `<constraints>` with reversibility framing (Section 14; Section 15)

The highest-risk gap. The agent autonomously moves files and commits to git with no declared permission boundary. Add a `<constraints>` block with `<take_freely>` (display, read, filter) and `<confirm_with_user>` (file moves, git commits). This is the change with the largest safety impact and is a single addition of approximately 10 lines.

### 2. Replace `<purpose>` with `<task>`, `<audience>`, and `<quality_bar>` (Section 1, Actions 1–2)

The current purpose statement describes mechanism, not outcome. Replacing it with the three required task components (what, who, quality bar) gives the model a success criterion it can reason against, not just a procedure to follow. This also satisfies Section 4 Action 2 (use semantically named XML tags for top-level sections).

### 3. Add a `<persona>` block scoped to the triage-specialist role (Section 6, Actions 1–2; Section 22, Pattern 1)

The workflow's expected behavior — directive, efficient, confirmation-terse — is not encoded. A specific persona ("task triage specialist") biases the model toward that register. This is a 4–6 line addition with a measurable effect on response verbosity and decisiveness.

### 4. Add a top-level `<output_format>` block canonicalizing display templates (Section 7; Section 22, Pattern 3)

The list and detail display formats are currently embedded as code examples inside step descriptions. Extracting them into a single `<output_format>` block makes them authoritative, parseable, and model-visible at the start of the prompt rather than buried mid-document. Include the exact commit confirmation string as a literal.

### 5. Extract TEXT_MODE as a named `<step name="detect_runtime">` before interaction steps (Section 16 — Scenario-based branching; Section 5 — Conditional instructions)

The TEXT_MODE branch currently interrupts the `offer_actions` step description, making it easy to miss and hard to maintain. Extracting it as a dedicated detection step before any interactive step gives it the structural visibility it needs, and eliminates the risk of a future editor removing it while editing `offer_actions`.
