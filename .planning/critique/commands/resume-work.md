# Critique: `commands/gsd/resume-work.md`

Scope: The command file itself (the entry point) plus the workflow it delegates to
(`get-shit-done/workflows/resume-project.md`), evaluated as a single prompt surface
against Prompt Engineering Guide V09.

---

## Strengths

### 1. Modular, single-responsibility design (§19 Modularity and Composition; §22 Pattern 5)

The command file is deliberately thin. It owns the frontmatter configuration (tool
permissions, name, description) and delegates all logic to an external workflow file via
`@` inclusion. This is exactly the atomic, single-responsibility pattern the guide
recommends. The workflow file in turn decomposes work into named `<step>` tags with
scoped responsibilities (initialize, load_state, check_incomplete_work, present_status,
determine_next_action, offer_options, route_to_workflow, update_session). Each step is
independently readable and covers one concern.

### 2. Explicit multi-phase workflow with named steps (§16 Multi-Phase Workflows)

The workflow uses named `<step>` tags that match the guide's `<phase>` pattern in spirit.
Each step has a clear trigger and a defined output. The guide praises explicit phase
boundaries that let the model complete one stage before beginning the next; the step
structure achieves this.

### 3. Scenario-based branching with explicit conditions (§16 Scenario-based branching)

The `determine_next_action` step enumerates every known project state (interrupted agent,
HANDOFF.json, .continue-here file, incomplete plan, phase-in-progress, phase-ready-to-plan,
phase-ready-to-execute) with explicit routing for each. This directly implements the guide's
`<scenario condition="...">` pattern in prose form, preventing the model from inferring
branching logic.

### 4. XML section tags with semantic names (§4 Formatting and Structure)

Top-level tags (`<trigger>`, `<purpose>`, `<process>`, `<reconstruction>`,
`<quick_resume>`, `<success_criteria>`) are all semantically named and reflect what each
section _is_. This follows §4's recommendation that tag names carry semantic meaning rather
than being structural delimiters only.

### 5. Success criteria made explicit (§1 Task Specification — quality bar)

The `<success_criteria>` checklist at the end of the workflow maps directly to §1 Action 1's
requirement for an explicit quality bar: "what a correct or high-quality response looks like."
Each criterion is a binary checkable condition, which is better than a qualitative description.

---

## Weaknesses

### 1. The command file is nearly contentless — task and quality bar are missing from the entry point (§1 Task Specification; §8 Context Placement)

The `commands/gsd/resume-work.md` entry point contains:
- `<objective>`: a description of what is _routed to_, not what the command _does_
- `<execution_context>`: a file include directive
- `<process>`: a paragraph that re-describes the workflow it delegates to

None of these encodes: (a) what output is being produced, (b) why it matters, or (c) what a
correct response looks like. All three components from §1 Action 1 are missing from the
command file itself. The model reading this entry point gets routing instructions and nothing
else. If the workflow file fails to load, there is no fallback task specification.

**Specific problem:** `<process>` duplicates the `<objective>` almost verbatim. Both say
"follow the resume-project workflow" and list the same seven bullet points. This violates
§11 Action 3 ("State each instruction exactly once").

### 2. `<objective>` uses a generic, structurally weak tag — no `<task>` or `<audience>` (§4 XML tag vocabulary; §1 Action 2)

The guide defines a specific set of top-level tags: `<task>`, `<context>`, `<input>`,
`<output_format>`, `<constraints>`, `<audience>`. The command file uses `<objective>` — a
non-standard tag that is not in the guide's vocabulary. This reduces the semantic signal
available to the model. The `<task>` tag in the guide's vocabulary means "primary instruction:
what the model must do" — that is exactly what `<objective>` is trying to be. Using the
wrong tag name degrades prompt reliability.

`<audience>` is also absent. The guide requires §1 Action 2: identify and encode the
audience's domain knowledge and vocabulary. Who calls this command? A developer mid-session.
That assumption is implicit; the workflow never encodes it.

### 3. No `<output_format>` specification at the command level; the workflow's output format is inconsistent (§7 Output Format Handling; §22 Pattern 3)

The `present_status` step in the workflow defines a rich ASCII box format for the status
display. The `route_to_workflow` step defines a separate markdown block format for routing
output. There is no top-level `<output_format>` tag anchoring what the full response
structure should look like from start to finish.

This violates §22 Pattern 3: "Output format specified completely and upfront." The model
discovers the output format mid-execution, piecemeal, embedded inside individual steps. The
guide is explicit: "Format specification is part of the task definition, not an afterthought."

Additionally, the ASCII box format in `present_status` is an informal structure with no
explicit spec for how fields map to source data. Field labels like `[one-liner from PROJECT.md
"What This Is"]` embed data-source instructions as inline comments inside an example — this
works but is fragile compared to the guide's approach of embedding instructions directly in a
schema (§7 Embedding output schema).

### 4. Negative and ambiguous instruction framing throughout the workflow (§5 Instruction Framing)

The guide's §5 Action 1 requires converting all negative instructions to positive equivalents.
The workflow contains several negative frames:

- `"After successful resumption, delete HANDOFF.json"` — an irreversible destructive action
  stated as a side-note inside a conditional block, with no framing around its blast radius
  (§15 Reversibility framework). The guide would require this to be in a `<confirm_with_user>`
  block or at minimum a `<constraints>` section with explicit reversibility framing.

- The `<quick_resume>` block says "Load state silently" — "silently" is a negative-adjacent
  qualifier meaning "without doing the normal status presentation." The guide would require a
  positive reframe: "Load state and proceed directly to primary action without presenting
  status options."

### 5. No tool permission scoping on the workflow; broad permissions in the command frontmatter (§22 Pattern 9; §17 Agent and Subagent Patterns)

The command's frontmatter grants: `Read`, `Bash`, `Write`, `AskUserQuestion`, `SlashCommand`.
`Write` is a destructive, irreversible permission. The guide's §22 Pattern 9 requires
expressing allowed tools as "the narrowest patterns that satisfy the task." The resume command
reads state, presents status, and routes — it does not need to write arbitrary files. The
only write operation is updating STATE.md's `## Session Continuity` section. This should be
scoped, not a blanket `Write` permission.

`Bash` is completely unscoped — no prefix patterns, no command restrictions. This leaves the
permission boundary undefined and makes the grant non-auditable.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` + duplicated `<process>` with `<task>` + `<output_format>` (addresses Weaknesses 1, 2, 3)

**Current (in `commands/gsd/resume-work.md`):**

```xml
<objective>
Restore complete project context and resume work seamlessly from previous session.

Routes to the resume-project workflow which handles:

- STATE.md loading (or reconstruction if missing)
- Checkpoint detection (.continue-here files)
- Incomplete work detection (PLAN without SUMMARY)
- Status presentation
- Context-aware next action routing
  </objective>

<execution_context>
@~/.claude/get-shit-done/workflows/resume-project.md
</execution_context>

<process>
**Follow the resume-project workflow** from `@~/.claude/get-shit-done/workflows/resume-project.md`.

The workflow handles all resumption logic including:
[...seven bullets duplicating objective...]
</process>
```

**Rewrite:**

```xml
<task>
Restore complete project context from previous session state and present the developer
with an accurate status summary and contextual next action. Execute the resume-project
workflow below.
</task>

<audience>
A developer returning to an in-progress GSD-managed project after a break. They know
the codebase and GSD conventions but need an immediate accurate picture of where they
left off.
</audience>

<output_format>
Produce two outputs in sequence:
1. A project status block (ASCII box format — see present_status step)
2. A contextual action menu with the primary action pre-selected based on project state

Do not summarize what you are about to do. Lead with the status block.
</output_format>

@~/.claude/get-shit-done/workflows/resume-project.md
```

This eliminates the duplication, uses the correct guide-vocabulary tag (`<task>`), adds the
missing `<audience>` and `<output_format>`, and reduces the command file to the minimum
necessary surface.

---

### Rewrite 2: Scope tool permissions to minimum required (addresses Weakness 5)

**Current frontmatter:**

```yaml
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
  - SlashCommand
```

**Rewrite:**

```yaml
allowed-tools:
  - Read
  - Bash(cat:*)
  - Bash(ls:*)
  - Bash(git status)
  - Bash(gsd-sdk:*)
  - Write(.planning/STATE.md)
  - AskUserQuestion
  - SlashCommand
```

Rationale per §22 Pattern 9: `Bash` without a prefix grants undefined scope. The workflow
only runs `cat`, `ls`, `gsd-sdk query`, and reads git state. The only write is to STATE.md.
Scoping these to explicit patterns makes the permission grant auditable and narrows blast
radius.

---

### Rewrite 3: Convert the `<quick_resume>` negative frame and add explicit output spec (addresses Weakness 4 and Weakness 3)

**Current:**

```xml
<quick_resume>
If user says "continue" or "go":
- Load state silently
- Determine primary action
- Execute immediately without presenting options

"Continuing from [state]... [action]"
</quick_resume>
```

**Rewrite:**

```xml
<quick_resume>
Trigger: user input matches "continue", "go", or equivalent short resume phrase.

Behavior:
1. Load STATE.md and determine the primary action (same logic as determine_next_action step)
2. Output exactly one line: "Continuing from [last state summary] → [primary action]"
3. Execute the primary action immediately

Output format: single line summary, then action output. Omit the status box and option menu.
</quick_resume>
```

This converts "silently" (negative, ambiguous) to a positive specification of what to emit.
It adds explicit output format for this branch, which was completely absent. It also anchors
the trigger to concrete input patterns per §5 Conditional instructions.

---

## Overall Verdict

**Adequate**

The resume-work command and its backing workflow demonstrate sound structural instincts:
scenario-based branching is thorough, the step decomposition follows a logical sequence,
the success criteria are explicit, and the modular delegation pattern is correct. These are
non-trivial to get right.

However, the command file as an entry point is nearly a stub — it contains no `<task>`,
no `<audience>`, no `<output_format>`, and duplicates its own content across `<objective>`
and `<process>`. The entry point is the model's first read; having it be content-free
degrades reliability when the workflow include fails or is partially loaded. The broad,
unscoped `Write` and `Bash` permissions are a material safety gap per §22 Pattern 9.

The workflow file is stronger than the command file, but it too lacks a top-level output
format specification — the format is scattered across three different steps. Consolidating
it into a single `<output_format>` block at the workflow head would be the highest-leverage
single improvement to the workflow layer.

Priority order for fixes:
1. Add `<task>`, `<audience>`, `<output_format>` to the command entry point; remove duplication
2. Scope `Bash` and `Write` permissions to minimum required patterns
3. Reframe `<quick_resume>` as a positive specification with explicit output format
