# Critique: `commands/gsd/add-todo.md`

Critique date: 2026-04-30
Guide version: PROMPT_ENGINEERING_GUIDE_V09

---

## Strengths

### XML structural tags used correctly (§4 Formatting and Structure)

The command uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) to separate distinct sections. This aligns with §4 Action 2, which mandates XML tags over markdown headers or `---` delimiters when a prompt contains multiple distinct sections. The tag names carry meaning about what each block *is*, not just where it starts.

### Frontmatter encodes agent configuration (§11 System vs. User Prompt Allocation)

The YAML frontmatter correctly places persistent properties — `name`, `description`, `argument-hint`, `allowed-tools` — in a machine-readable header block. This follows the §11 YAML frontmatter pattern and scopes tool permissions explicitly, keeping configuration out of the instruction body.

### Allowed-tools list is present (§22 Pattern 9)

`allowed-tools` is declared with four named tools (`Read`, `Write`, `Bash`, `AskUserQuestion`). This is directionally correct per §22 Pattern 9, which calls for tool permissions scoped to minimum required patterns.

---

## Weaknesses

### 1. Task intent, audience, and quality bar are absent (§1 Task Specification)

§1 Action 1 requires three components to be explicit: what output is requested, why it matters or how it will be used, and what a correct high-quality response looks like. The command states *what happens* (directory creation, deduplication, git commits) but never states the success criterion for a well-formed todo — what fields are required, what makes a slug acceptable, what a duplicate threshold is.

§1 Action 2 requires the audience to be encoded in the prompt. There is no `<audience>` tag or equivalent. The prompt does not specify whether the consumer of the created todo file is a human reading it later, a downstream agent parsing it, or both — which directly affects required fidelity of the frontmatter and content fields.

The `<quality_bar>` tag (defined in §4's XML vocabulary table) is entirely missing. Without it, the model has no calibrating target for what a correctly captured todo looks like.

### 2. The `<process>` block duplicates the `<objective>` block without adding new information (§11 Action 3; §10 Action 1)

§11 Action 3 states: "State each instruction exactly once." The `<objective>` block lists eight workflow steps (directory structure, content extraction, area inference, duplicate detection, etc.). The `<process>` block then lists those same eight steps again, verbatim, under the header "The workflow handles all logic including:". This is direct repetition. §10 Action 1 flags prompts that exceed necessary length and requires removing redundant instructions. One of the two blocks must be eliminated; the list belongs in `<objective>` (the primary instruction) and the `<process>` block should contain only what is not already covered — in this case, nothing unique remains.

### 3. Allowed-tools grants are not scoped to minimum patterns; `Bash` is whole-tool (§22 Pattern 9)

§22 Pattern 9 requires tool permissions expressed as the narrowest patterns that satisfy the task, with command prefixes rather than whole-tool grants. `Bash` with no prefix leaves the permission boundary undefined — any shell command is permitted. For a command whose only shell interaction is reads (`git status`, directory checks) and a single commit write, the grant should be constrained. The guide's own example uses `Bash(npm:*)`, `Bash(yarn:*)` as the model for narrowing. Granting bare `Bash` also contradicts the §14 constraint enforcement principle that every restriction should be paired with an equally concrete permission — there is no restriction on what `Bash` may execute here.

### 4. No output format specification (§7 Output Format Handling; §22 Pattern 3)

The command produces a file on disk (the todo), updates `STATE.md`, and makes a git commit. None of these outputs have a format specification in this file. §7 and §22 Pattern 3 both require the output structure to be stated completely and upfront. The deferral to the workflow file (`@~/.claude/get-shit-done/workflows/add-todo.md`) may carry that specification, but the command file itself gives the invoking model no format signal before the workflow loads. If the workflow file is unavailable or stale, the model has no fallback specification.

### 5. Negative-instruction framing absent, but conditional branching is also absent (§5 Instruction Framing)

There are no tie-breaking rules or conditional instructions. The `$ARGUMENTS` variable can be empty (the `argument-hint` shows it as optional), yet there is no explicit conditional branch: "If `$ARGUMENTS` is empty, extract from conversation; if `$ARGUMENTS` is provided, prefer it." §5's conditional instruction pattern (`If no PR number is provided... If a PR number is provided...`) is directly applicable here and would eliminate ambiguity about which content source takes priority.

---

## Specific Rewrites

### Rewrite 1 — Collapse the duplicated list and add quality bar

**Issue:** §11 Action 3 (one instruction, one location) and §10 Action 1 (remove redundancy).

**Before (`<objective>` + `<process>` as currently written):**

```xml
<objective>
Capture an idea, task, or issue that surfaces during a GSD session as a structured todo for later work.

Routes to the add-todo workflow which handles:
- Directory structure creation
- Content extraction from arguments or conversation
- Area inference from file paths
- Duplicate detection and resolution
- Todo file creation with frontmatter
- STATE.md updates
- Git commits
</objective>

<process>
**Follow the add-todo workflow** from `@~/.claude/get-shit-done/workflows/add-todo.md`.

The workflow handles all logic including:
1. Directory ensuring
2. Existing area checking
3. Content extraction (arguments or conversation)
4. Area inference
5. Duplicate checking
6. File creation with slug generation
7. STATE.md updates
8. Git commits
</process>
```

**After:**

```xml
<objective>
Capture an idea, task, or issue surfacing during a GSD session as a structured todo file for later work.

A correctly captured todo:
- Has a slug derived from the title (kebab-case, under 60 chars)
- Has required frontmatter fields: title, area, created_at, status
- Is de-duplicated: if a todo with the same title exists, report the existing path and stop
- Triggers a git commit with message: "chore(todos): add <slug>"
</objective>

<process>
Follow the add-todo workflow: @~/.claude/get-shit-done/workflows/add-todo.md
</process>
```

This removes the duplicate enumeration, adds a `<quality_bar>`-equivalent inline in `<objective>`, and reduces `<process>` to the single non-redundant instruction it actually carries.

---

### Rewrite 2 — Add conditional branching for `$ARGUMENTS`

**Issue:** §5 Instruction Framing — conditional behavior depending on whether arguments are provided is currently implicit.

**Before (`<context>` block):**

```xml
<context>
Arguments: $ARGUMENTS (optional todo description)

State is resolved in-workflow via `init todos` and targeted reads.
</context>
```

**After:**

```xml
<context>
<input_source>
If $ARGUMENTS is non-empty, use it as the todo description. Treat it as the primary source.
If $ARGUMENTS is empty, extract the todo description from the most recent user message in the conversation. Ask for clarification if the intent is ambiguous.
</input_source>

State is resolved in-workflow via `init todos` and targeted reads.
</context>
```

This encodes the §5 conditional pattern explicitly and eliminates the model's need to infer priority between two content sources.

---

### Rewrite 3 — Scope the `Bash` tool grant

**Issue:** §22 Pattern 9 — bare `Bash` is a whole-tool grant with undefined permission boundary.

**Before:**

```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
```

**After:**

```yaml
allowed-tools:
  - Read
  - Write
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git status:*)
  - Bash(ls:*)
  - Bash(mkdir:*)
  - AskUserQuestion
```

This limits shell execution to the specific operations the workflow actually requires: directory creation, git staging, commit, and status check. Any command outside this set is blocked by default, making the permission grant auditable and its blast radius explicit.

---

## Overall Verdict

**Needs Work**

The command file has the correct structural skeleton (XML tags, YAML frontmatter, tool list) but is missing three foundational elements the guide treats as non-negotiable: a quality bar for correct output (§1), deduplication of its own instruction content (§11, §10), and scoped tool permissions (§22 Pattern 9). The conditional input-source ambiguity (§5) is an additional gap that will produce inconsistent behavior when `$ARGUMENTS` is empty. None of these are cosmetic — each directly affects output reliability. The fixes are mechanical and confined to this file; the workflow file itself is out of scope for this critique.
