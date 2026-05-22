# Critique: `commands/gsd/check-todos.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overview

`check-todos.md` is a thin dispatch file. The real prompt lives in the workflow file it delegates to (`~/.claude/get-shit-done/workflows/check-todos.md`). This critique evaluates the command file itself and, where the command file's design choices have consequences for the workflow it delegates to, notes those as well.

---

## Strengths

### §1 Task Specification — explicit quality bar
The workflow file (which the command bootstraps) contains a well-formed `<task>`, `<audience>`, and `<quality_bar>` triple at its top. Each field addresses one of the three required components from §1 Action 1: what output is requested, who consumes it, and what makes a good response. The quality bar is checkable and concrete ("every pending todo is listed with title, area, and relative age"), not vague.

### §5 Instruction Framing — priority ordering present
The workflow's `<priority_order>` block correctly provides a ranked list of four criteria with explicit numbering, matching the §5 priority ordering pattern. This removes ambiguity when signals conflict (e.g., when a roadmap match exists but the init context is stale).

### §14 Constraint Enforcement — permission pairing
The workflow's `<constraints>` block uses `<permitted>` and `<reserved>` sub-tags, following the §14 explicit permission pair pattern. Restrictions are paired with what IS allowed, which is strictly better than a bare exclusion list.

### §16 Multi-Phase Workflows — named step sequence
The workflow structures its logic as a sequence of named `<step>` elements (`init_context`, `parse_filter`, `list_todos`, `handle_selection`, etc.). This creates cognitive phase boundaries and matches the §16 phase pattern — the agent completes each step before beginning the next.

### §5 Conditional instructions — explicit branching
Step `offer_actions` handles two distinct runtime branches (roadmap match vs. no match) with different action sets, and step `init_context` has an explicit zero-state branch that exits cleanly. This matches §5's conditional branching rule.

---

## Weaknesses

### Weakness 1 — §4 Formatting: command file uses no XML section tags; `<objective>` and `<process>` are non-standard

**Severity: High**

The command file (`commands/gsd/check-todos.md`) uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` tags. Of these, only `<context>` appears in the §4 XML tag vocabulary. `<objective>` is not a standard structural tag — the vocabulary defines `<task>` for "what the model must do." `<process>` is used where the vocabulary would specify `<task>` body content. `<execution_context>` has no equivalent.

The guide states: "Tags name what the section *is*, not just where it starts, giving the model richer signal than delimiters alone." Non-standard tags reduce interoperability and carry weaker semantic signal for Claude-class models.

The `<process>` block is also almost entirely redundant with `<objective>` — it restates the same eight items listed there. This violates §11 Action 3: "State each instruction exactly once."

### Weakness 2 — §22 Pattern 3 / §7 Output Format: no output format specified anywhere in the command file

**Severity: High**

The command file specifies no `<output_format>` block. The guide's §22 Pattern 3 requires: "State the required output structure, field names, ordering, and an example before the model begins its task." For a command whose visible output to the user is an interactive numbered list, this matters: there is no specification of how the command-level response looks before control passes to the workflow.

The workflow file itself does define display templates inline (e.g., the `list_todos` step shows example output), but those are embedded in step prose rather than a dedicated `<output_format>` block. §7 Action 1 calls for splitting the task and its format specification. Having output shape scattered across step bodies makes it invisible at a glance and harder to update consistently.

### Weakness 3 — §5 Instruction Framing: negative framing used in `<reserved>` without positive reframe

**Severity: Medium**

The workflow's `<constraints>` block uses `<reserved>` (a non-standard sub-tag; the vocabulary specifies `<reserved_for_human_review>`) and lists three prohibitions:

```
- Deleting todo files permanently
- Modifying todo content (problem, solution, files)
- Running git write operations other than the commit step above
```

Per §5 Action 1, every negative instruction must be rewritten as a positive specification of desired behavior. "Do not delete todo files permanently" should become "Preserve all todo files; the only file operation permitted is moving from `pending/` to `completed/`." The current form also uses `<reserved>` without the `_for_human_review` suffix, drifting from the §4 tag vocabulary and mislabeling what these constraints represent (they are not actions reserved for human review — they are simply forbidden).

### Weakness 4 (minor) — §17 Agent Patterns: no `allowed-tools` constraint scoping

**Severity: Low**

The command file grants `Read`, `Write`, `Bash`, and `AskUserQuestion` as broad whole-tool grants. §22 Pattern 9 specifies: "Express allowed tools as the narrowest patterns that satisfy the task." For a todo-browsing command, `Bash` with no prefix leaves the permission boundary undefined. The guide's example (`Bash(npm:*)`, `Bash(yarn:*)`) shows prefix-scoped grants. This command could scope Bash to `gsd-sdk`, `git rm`, and `node` calls only.

---

## Specific Rewrites

### Rewrite 1 — Command file: replace non-standard tags with vocabulary-compliant equivalents and eliminate duplication

**Current:**
```xml
<objective>
List all pending todos, allow selection, load full context for the selected todo, and route to appropriate action.

Routes to the check-todos workflow which handles:
- Todo counting and listing with area filtering
- Interactive selection with full context loading
- Roadmap correlation checking
- Action routing (work now, add to phase, brainstorm, create phase)
- STATE.md updates and git commits
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/check-todos.md
</execution_context>

<context>
Arguments: $ARGUMENTS (optional area filter)

Todo state and roadmap correlation are loaded in-workflow using `init todos` and targeted reads.
</context>

<process>
**Follow the check-todos workflow** from `@~/.claude/get-shit-done/workflows/check-todos.md`.

The workflow handles all logic including:
1. Todo existence checking
2. Area filtering
3. Interactive listing and selection
4. Full context loading with file summaries
5. Roadmap correlation checking
6. Action offering and execution
7. STATE.md updates
8. Git commits
</process>
```

**Rewrite:**
```xml
<task>
List all pending todos, let the user select one, load its full context, and route to the appropriate action (work now, add to phase, brainstorm, create phase).

Follow the workflow at: @~/.claude/get-shit-done/workflows/check-todos.md
</task>

<context>
Arguments: $ARGUMENTS (optional area filter). Todo state and roadmap correlation are loaded in-workflow.
</context>
```

Rationale: eliminates the `<objective>`/`<process>` duplication (§11 Action 3), uses the vocabulary-defined `<task>` tag (§4), and trims the `<process>` restatement to a single pointer. The workflow file already contains the full step-by-step logic; the command file's job is to invoke it, not restate it.

---

### Rewrite 2 — Workflow file: add a top-level `<output_format>` block before `<process>`

**Current:** Output shape is described inline within step prose only.

**Rewrite:** Insert after `<quality_bar>`:
```xml
<output_format>
Display uses plain markdown. Three named output states:

**Empty state** (no todos):
```
No pending todos.

Todos are captured during work sessions with /gsd-add-todo.
```

**List state** (one or more todos):
```
Pending Todos — [N] items[, filtered by area: [area]]

1. [title] ([area], [relative age])
2. [title] ([area], [relative age])
...

Reply with a number to view details, or `q` to exit.
```

**Detail state** (todo selected):
```
## [title]

**Area:** [area]
**Created:** [date] ([relative age] ago)
**Files:** [list or "None"]

### Problem
[content]

### Solution
[content]
```

All relative ages use the format: `Nd ago` (days), `Nh ago` (hours), `Nm ago` (minutes).
</output_format>
```

Rationale: §22 Pattern 3 requires output structure specified completely and upfront. Embedding format inside step bodies means the model must infer the expected format mid-execution. Lifting it to a dedicated `<output_format>` block makes it authoritative and scannable.

---

### Rewrite 3 — Workflow file: convert `<reserved>` negative prohibitions to positive specifications with correct tag name

**Current:**
```xml
<reserved>
- Deleting todo files permanently
- Modifying todo content (problem, solution, files)
- Running git write operations other than the commit step above
</reserved>
```

**Rewrite:**
```xml
<reserved_for_human_review>
These actions require explicit human instruction before executing — they are outside this workflow's autonomous scope:
- File operations beyond moving todos from `pending/` to `completed/` (preserve all todo content as-is)
- Git write operations beyond the `gsd-sdk query commit` call in the `git_commit` step
</reserved_for_human_review>
```

Rationale: §5 Action 1 requires converting negative instructions to positive equivalents. "Do not delete" becomes "preserve all todo files; the only file operation permitted is moving pending → completed." §4 specifies `<reserved_for_human_review>` as the correct tag for this role, not `<reserved>`.

---

## Overall Verdict

**Adequate**

The workflow file is well-structured and functionally sound. The `<task>/<audience>/<quality_bar>` triple, named step sequence, priority order, constraint pairing, and conditional branching all follow the guide correctly. The weaknesses are structural rather than behavioral: the command file uses non-standard tags and duplicates its content; the output format is not consolidated; and two constraint items violate the positive-framing rule. None of these are runtime failures — the workflow will execute correctly — but they reduce legibility, interoperability with other GSD modules, and resistance to future drift. The fixes in Rewrites 1–3 are low-effort and high-return.
