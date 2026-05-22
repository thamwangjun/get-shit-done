# Critique: add-todo.md

## Summary

`add-todo.md` is a competently structured workflow that covers the core capture flow (init → extract → area inference → duplicate check → create → commit → confirm) and uses XML `<step>` tags to separate phases. However, it falls short of the guide's standards in several structural and instructional areas. The task specification is implicit rather than explicit: no `<task>`, `<audience>`, or `<quality_bar>` wrapper orients the model. Instruction framing mixes positive and negative forms inconsistently, a critical output-format section is absent, and the TEXT_MODE guard appears mid-step with no clear conditional branching structure. The workflow treats steps as prose checklist items rather than composable prompt architecture. With targeted revisions it could become a reliable, model-agnostic instruction set; as written, it will produce inconsistent results across runtimes.

---

## Strengths

- **Section 4 Action 2 — XML structural tagging.** The workflow uses named XML tags (`<purpose>`, `<process>`, `<step name="...">`, `<success_criteria>`) rather than plain markdown headers. Tag names carry semantic meaning, which is strictly better than `---` delimiters per the guide.

- **Section 16 — Multi-phase workflow structure.** Each step is a discrete named phase with a clear single responsibility (init, extract, infer, check, create, update, commit, confirm). The cognitive boundary between steps is well-drawn.

- **Section 4 XML vocabulary — `<success_criteria>`.** The workflow closes with a checklist of verifiable conditions, which serves as an implicit quality bar and mirrors the `<quality_bar>` concept from Section 1.

- **Section 5 — Conditional instruction framing (partial).** The `check_duplicates` step provides explicit conditional branches ("If potential duplicate found: 1. Read…, 2. Compare…") rather than leaving the model to infer behavior.

- **Section 13 — Template variable injection.** The workflow uses runtime command substitution (`gsd-sdk query`, `gsd-sdk query generate-slug`) and references init-context variables consistently by name, following the template variable pattern.

- **Section 3 — Concrete examples in extraction step.** The `extract_content` step provides an inline example (`/gsd-add-todo Add auth token refresh → title = "Add auth token refresh"`) that calibrates the model's understanding of the target format (Section 22, Pattern 2).

---

## Issues

### Issue 1 — No explicit task specification wrapper (Section 1, Actions 1–2)

**Principle:** The guide requires explicit extraction of (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. It also requires the audience to be encoded explicitly.

**What's missing:** The workflow opens with a `<purpose>` block that hints at intent, but never wraps the instruction in `<task>`, never states `<audience>` (which Claude runtime? Which user type?), and never declares a `<quality_bar>`. The model has no anchor for what "a good todo capture" looks like at a structural level before it begins.

**Concrete fix:** Add a top-level wrapper before `<required_reading>`:

```xml
<task>
Capture the user's idea, task, or issue as a structured todo file in .planning/todos/pending/.
</task>

<audience>
A developer mid-session who wants to offload a thought without losing flow. They expect a
one-line confirmation and a follow-up prompt — not a lengthy summary.
</audience>

<quality_bar>
Success: a valid .md file with frontmatter exists, area is consistent with existing todos,
no duplicate was silently created, and the git commit message matches the pattern
"docs: capture todo - [title]".
</quality_bar>
```

---

### Issue 2 — TEXT_MODE guard is buried mid-step with no conditional branching structure (Section 5, Conditional Instructions; Section 16, Scenario-based Branching)

**Principle:** When behavior depends on context, the guide requires explicit conditional branching — not inline prose embedded in an unrelated step. Section 16 prescribes `<scenarios>` tags for multi-path logic.

**What's missing:** The TEXT_MODE guard is inserted inside `check_duplicates` as a prose paragraph that breaks the step's narrative. It also conflates detection logic (when TEXT_MODE applies) with behavioral substitution (what to do instead of `AskUserQuestion`), making it hard to apply consistently across the other steps that also use `AskUserQuestion` (e.g., `confirm`).

**Concrete fix:** Hoist TEXT_MODE to a top-level `<scenarios>` block before `<process>`, then reference it by name in each step:

```xml
<scenarios>
  <scenario id="interactive" condition="TEXT_MODE is false (default)">
    Use AskUserQuestion for all user prompts.
  </scenario>
  <scenario id="text_mode" condition="--text flag present in $ARGUMENTS OR text_mode=true in init JSON">
    Replace every AskUserQuestion call with a plain-text numbered list.
    Ask the user to type their choice number.
    Required for non-Claude runtimes (OpenAI Codex, Gemini CLI).
  </scenario>
</scenarios>
```

Each step that calls `AskUserQuestion` then adds one line: "Apply text-mode substitution per `<scenario id="text_mode">`."

---

### Issue 3 — No `<output_format>` specification (Section 7, Action 1; Section 22, Pattern 3)

**Principle:** Output format must be specified completely and upfront, including field names, ordering, and an example. Format specification is part of the task definition, not an afterthought.

**What's missing:** The `create_file` step provides a markdown template for the todo file, but it is embedded inline inside the step prose rather than declared as a canonical `<output_format>` section. The `confirm` step's output block is specified as a raw markdown template with no explanation of which fields are required vs. optional, and no example of what a correctly filled confirmation looks like. There is no specification of what the git commit confirmation message must look like beyond a one-liner in `git_commit`.

**Concrete fix:** Add an `<output_format>` section after `<quality_bar>` that declares the two machine-visible outputs:

```xml
<output_format>
## Todo file (written to disk)
Required fields in frontmatter: created, title, area, files.
Required sections: ## Problem, ## Solution.
"files" may be an empty list; never omit the key.

## Confirmation message (shown to user)
Format exactly:
  Todo saved: [absolute path]

    [title]
    Area: [area]
    Files: [N] referenced

  ---

  Would you like to:

  1. Continue with current work
  2. Add another todo
  3. View all todos (/gsd-check-todos)

No markdown headers, no filler prose before the path line.
</output_format>
```

---

### Issue 4 — Negative instructions in `infer_area` and `extract_content` (Section 5, Action 1)

**Principle:** All negative instructions must be converted to positive equivalents before emitting a prompt.

**What's missing:** The `extract_content` step uses the phrase "or 'TBD' if just an idea" — this is a soft negative constraint implying the model should avoid a real answer when it cannot produce one. The `infer_area` step ends with "No files or unclear → `general`" which is fine, but does not state what "unclear" means concretely. The `check_duplicates` step's prose says "If overlapping" without defining the positive criterion for "not overlapping."

**Concrete fix:**

- `solution` field: Change "or 'TBD' if just an idea" to: "Write 'TBD' when the user has not stated an approach. Write a concrete approach otherwise."
- `infer_area`: Change "No files or unclear" to: "When no file paths are present, or when every path matches more than one area pattern, use `general`."
- `check_duplicates`: Add a positive threshold: "Two todos are duplicates when their titles share 3 or more significant words and their scope overlaps."

---

### Issue 5 — Area inference table has no priority order when multiple patterns match (Section 5, Priority Ordering; Section 14, Constraint Enforcement)

**Principle:** When multiple criteria apply, the guide requires an explicit priority order. Without it, the model must guess when a file path matches two area patterns simultaneously (e.g., `src/auth/tests/` matches both `auth` and `testing`).

**What's missing:** The `infer_area` lookup table gives one row per pattern with no instruction for conflicts. There is also no instruction for paths outside all listed patterns, though "No files or unclear → `general`" partially covers this.

**Concrete fix:** Add a `<priority_order>` block below the table:

```xml
<priority_order>
  When a path matches more than one area pattern:
  1. Use the most specific match (e.g., src/auth/tests/ → auth, not testing)
  2. If equally specific, prefer the first matching row in the table above
  3. If still ambiguous, use the existing area from the todos array (init context)
  4. If no existing area matches, use general
</priority_order>
```

---

### Issue 6 — Success criteria uses checkbox prose rather than verifiable conditions (Section 22, Pattern 3; Section 14, Confidence Thresholds)

**Principle:** Quality bars and success criteria should be specific enough to be verifiable. Qualitative phrasing like "enough context for future Claude" is not measurable.

**What's missing:** Two items in `<success_criteria>` are qualitative:
- "Problem section has enough context for future Claude" — no minimum is stated.
- "Area consistent with existing todos" — no verification method is given.

**Concrete fix:**

- Replace "Problem section has enough context for future Claude" with: "Problem section contains at minimum: what the problem is, why it matters, and any relevant file paths or error messages from the conversation."
- Replace "Area consistent with existing todos" with: "Area value matches an existing area from the `todos` array in init context, OR is `general` if no match exists."

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items not applicable to a workflow-type instruction file (e.g., self-consistency sampling, RAG compression) are marked N/A.

| Section | Checklist Item | Score |
|---------|---------------|-------|
| **Task Specification** | Intent, audience, and quality bar are all explicit | FAIL |
| | All constraints are compatible — no conflicts | PASS |
| **Chain of Thought** | CoT included only for reasoning tasks | N/A |
| | CoT trigger used correctly | N/A |
| | Reasoning before answer | N/A |
| | CoT traces flagged as heuristic | N/A |
| **Few-Shot Examples** | Examples selected by semantic similarity | N/A |
| | 2–5 examples total | N/A |
| | Simple → complex ordering | N/A |
| | Examples span diverse sub-types | N/A |
| | Format consistent across examples | N/A |
| | Example order fixed across evaluations | N/A |
| **Formatting** | Instruction complete before formatting applied | PASS |
| | Sections separated by semantically named XML tags | PASS |
| | At least 3 format variants tested | FAIL |
| **Instruction Framing** | Negative instructions converted to positive | FAIL |
| | Priority order explicit when multiple criteria apply | FAIL |
| | Tie-breaking rules match domain cost asymmetry | FAIL |
| **Persona** | Persona included only for open-ended/stylistic tasks | N/A |
| | Persona is specific | N/A |
| | Persona is gender-neutral | N/A |
| **Output Format** | Structured output uses two-step reasoning-then-format | N/A |
| | Single-call JSON places reasoning before answer | N/A |
| | Constrained decoding adopted only after free-form proven insufficient | N/A |
| | Machine-parsed output uses exact format specification | FAIL |
| **Context Placement** | Task instruction at start of prompt | FAIL |
| | Primary input at end of prompt | N/A |
| | Background context in middle | PASS |
| | Irrelevant context removed | PASS |
| | Time-sensitive context labeled as snapshot | N/A |
| **Self-Consistency** | Applied only to tasks with single correct answer | N/A |
| | Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | Redundant instructions removed | PASS |
| | Long prompts compressed | N/A |
| | RAG context is extracted passage only | N/A |
| **System/User Split** | Persistent instructions in system prompt | N/A |
| | Task-specific instructions in user prompt | N/A |
| | Each instruction in exactly one location | FAIL |
| | Safety-critical constraints have external validation | N/A |
| **Agent/Subagent** | Agent prompts fully self-contained | PASS |
| | All file paths in agent output are absolute | FAIL |
| | Parallel agents launched in single message block | N/A |
| | Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | Large prompts decomposed into atomic modules | PASS |
| | Template variables use ${VARIABLE_NAME} syntax | PASS |
| | Modules compose via variable substitution | PASS |
| **Constraint Enforcement** | Every restriction paired with concrete permission | FAIL |
| | Hard exclusion lists enumerated | N/A |
| | Edge cases have precedent-style rulings | FAIL |
| | Confidence thresholds are numeric | FAIL |
| **Decision Frameworks** | Multi-option recommendations use decision tree or table | PASS |
| | Criteria checklists gate complex approaches | N/A |
| | Action permissions framed around reversibility | N/A |
| **Multi-Phase Workflows** | Complex tasks organized into explicit named phases | PASS |
| | Required steps distinguished from type-specific steps | FAIL |
| | Scenario-based branching handles multiple paths explicitly | FAIL |
| **Memory and Continuity** | Memory templates use XML tags | N/A |
| | Compaction summaries include discoveries and failed approaches | N/A |
| | Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | Each component has single responsibility | PASS |
| | Scope boundaries state both inclusions and exclusions | FAIL |
| **Safety and Trust** | Validation at system boundaries only | PASS |
| | Dual-use capabilities state permissions before restrictions | N/A |
| | Authorization narrow-scoped; each action confirmed | PASS |
| **Tone and Style** | Size constraints use numeric limits | FAIL |
| | Instructions use imperative present tense | PASS |
| | Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | Prompt flagged as draft for automated optimization | FAIL |
| | Correct optimizer selected | FAIL |
| | Held-out test set reserved | FAIL |

**Summary:** 18 PASS / 17 FAIL / 22 N/A (of 57 total items)

---

## Recommendations

Prioritized by impact on runtime reliability and model consistency.

### 1. Add top-level task, audience, and quality_bar wrappers (Issue 1 — Section 1, Actions 1–2)

This is the highest-leverage fix. Without an explicit task frame, the model must infer intent from the `<purpose>` block, which is too brief to anchor behavior across edge cases (no arguments, ambiguous conversation history, unclear area). Adding `<task>`, `<audience>`, and `<quality_bar>` before `<required_reading>` costs three lines and fixes the single most common source of prompt failure: the model optimizing for the wrong target.

### 2. Hoist TEXT_MODE to a top-level `<scenarios>` block (Issue 2 — Section 5; Section 16)

The current inline placement inside `check_duplicates` creates a runtime hazard: the model may apply TEXT_MODE substitution only in that step and revert to `AskUserQuestion` in `confirm`. Moving it to a `<scenarios>` block before `<process>` makes it a universal, enforceable rule. Reference the scenario by ID in each step that uses `AskUserQuestion`. This also resolves the instruction-duplication problem (Section 11, Action 3).

### 3. Add an `<output_format>` section for both machine-visible outputs (Issue 3 — Section 7, Action 1; Section 22, Pattern 3)

The todo file template and the confirm message template are currently embedded in step prose. Extracting them to a dedicated `<output_format>` section makes the format specification findable at a glance, reduces the chance of the model improvising formatting in edge cases, and ensures the confirmation message is consistent across all invocations. Add field-level annotations (required vs. optional) to the todo frontmatter template.

### 4. Add a `<priority_order>` block to the area inference table (Issue 5 — Section 5, Priority Ordering)

Ambiguous path patterns (e.g., `src/auth/tests/`) will produce inconsistent area assignments across runs. A four-rule priority order (most specific match → first table row → existing area from init → general) eliminates the ambiguity and takes fewer than ten lines to add. This is a low-effort, high-consistency gain.

### 5. Convert qualitative success criteria to verifiable conditions and negative instructions to positive (Issues 4 and 6 — Section 5, Action 1; Section 22, Pattern 3)

"Enough context for future Claude" and "consistent with existing todos" are not testable. Replace them with minimum-content requirements and a lookup procedure. Simultaneously, rewrite the three soft negative/implicit constraints in `extract_content`, `infer_area`, and `check_duplicates` as positive specifications. These are quick line-level edits with compounding effect: every step that a model checks against `<success_criteria>` will produce a more deterministic result.
