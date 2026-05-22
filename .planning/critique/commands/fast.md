# Critique: `commands/gsd/fast.md`

**Reviewed against:** Prompt Engineering Guide V09  
**Date:** 2026-04-30  
**Verdict:** Adequate

---

## Context

`commands/gsd/fast.md` is a thin dispatcher: it holds frontmatter, a brief `<objective>`, and a single `<execution_context>` reference that delegates all real logic to `~/.claude/get-shit-done/workflows/fast.md`. The critique covers both files together because the command file is only meaningful read alongside the workflow it invokes.

---

## Strengths

**Well-scoped persona-free design (§6 Persona Assignment)**  
The command deliberately omits a persona. Per §6 Action 1, personas are appropriate only for open-ended or stylistic tasks. A deterministic routing command is neither — omitting the persona is correct and signals discipline.

**Explicit permission pairing in the workflow (§14 Constraint Enforcement)**  
`workflows/fast.md` uses `<permitted>` and `<reserved_for_human_review>` as paired constraint sub-tags matching exactly the vocabulary prescribed in §14. Each restriction has a concrete positive counterpart; the pairing is not asymmetric.

**Priority order and tie-breaking are explicit (§5 Instruction Framing)**  
`<priority_order>` and `<tie_breaking>` are present in `scope_check` and use the correct tag vocabulary from §5. The tie-breaking rule correctly encodes cost asymmetry: a mistaken redirect is cheap; a mistaken inline execution is expensive. This matches §22 Pattern 4 ("Explicit tie-breaking rules matched to the domain's cost asymmetry").

**Structured step decomposition with named phases (§16 Multi-Phase Workflows)**  
Each `<step name="...">` is a named, single-responsibility unit. The model completes one step fully before advancing to the next. This is the phase pattern from §16 applied at micro-scale, which is appropriate.

**Output format is completely specified (§22 Pattern 3)**  
The `done` step specifies the exact output format with field names and no ambiguity. This prevents format drift across calls.

**Conditional instruction for empty arguments (§5 Instruction Framing)**  
`parse_task` handles the empty-arguments branch with an explicit conditional — no inference required from the model.

---

## Weaknesses

### 1. The command file (`commands/gsd/fast.md`) is structurally hollow — it adds no value over a direct workflow call (§13 Modularity and Composition, §19 Modularity)

The command file contains:

```xml
<objective>...</objective>
<execution_context>@~/.claude/get-shit-done/workflows/fast.md</execution_context>
<process>Execute the fast workflow from @~/.claude/... end-to-end.</process>
```

The `<objective>` block duplicates content already present in `workflows/fast.md` `<task>`. The `<process>` tag says nothing more than "run the other file." This is not composition — it is indirection with no added signal. §19 states each prompt component must have a single responsibility and be independently understandable. The command file is not independently understandable without reading the workflow, and it adds no behavior of its own. It is not a module; it is a pointer.

Per §11 Action 3, each instruction should appear in exactly one location. The same scope boundary (trivial tasks, not a replacement for /gsd-quick) is stated in both files.

### 2. `git add -A` in the commit step violates minimum-scope principles (§22 Pattern 9, §20 Safety and Trust Patterns)

The commit step prescribes:

```bash
git add -A
git commit -m "<type>: <concise description>"
```

`git add -A` stages all untracked and modified files across the entire working tree. For a command scoped to "up to 3 file edits", this is overreach. It can silently commit files the user did not intend to include — secrets, debug output, unrelated work-in-progress.

§22 Pattern 9 ("Tool permissions scoped to minimum required patterns") and §20 ("Validation is at system boundaries only") both point toward narrow-scoped actions. The commit step's blast radius is not bounded by the constraint that only 3 files were edited; `git add -A` captures everything.

### 3. No audience specification — `$ARGUMENTS` parsing is underspecified (§1 Task Specification)

§1 Action 1 requires three components to be explicit: what output is requested, why it matters, and what a high-quality response looks like. §1 Action 2 requires explicit audience encoding.

`parse_task` asks for "one sentence" when `$ARGUMENTS` is empty, but does not validate or constrain what that sentence may contain. There is no audience tag, no quality bar tag, and no constraint on what constitutes a valid task description versus a description that should trigger the scope gate. The scope gate (`scope_check`) runs after `parse_task`, but nothing in `parse_task` primes the model about what information is needed to evaluate triviality. A user who inputs "refactor the auth module" will get past `parse_task` before being redirected — the gate could be moved earlier or the parse prompt could front-load scope cues.

Per §4 Action 2 and the `<quality_bar>` tag vocabulary, the quality bar for the parsed task is implicit ("one sentence") rather than explicit.

---

## Specific Rewrites

### Rewrite 1: Eliminate the hollow command file — merge or redirect (Issue 1)

**Current command file structure:**

```xml
<objective>
Execute a trivial task directly in the current context without spawning subagents
or generating PLAN.md files. For tasks too small to justify planning overhead:
typo fixes, config changes, small refactors, forgotten commits, simple additions.

This is NOT a replacement for /gsd-quick — use /gsd-quick for anything that
needs research, multi-step planning, or verification. /gsd-fast is for tasks
you could describe in one sentence and execute in under 2 minutes.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/fast.md
</execution_context>

<process>
Execute the fast workflow from @~/.claude/get-shit-done/workflows/fast.md end-to-end.
</process>
```

**Proposed replacement (command file becomes the canonical source, workflow include is removed):**

```xml
<task>
Execute a trivial, single-context task inline without spawning subagents, creating plan
files, or running research. Complete the work, commit it atomically, and log it.

Appropriate tasks: fix a typo, update a config value, add a missing import, rename a
variable, commit uncommitted work, add a .gitignore entry, bump a version number.

Use /gsd-quick for anything requiring multi-step planning or research.
</task>
```

Then inline the full process from `workflows/fast.md` directly into the command file, and remove the workflow file. Alternatively, keep the workflow file as the single source of truth and reduce the command file to frontmatter only — no `<objective>`, no `<process>`, no duplicate scope description.

**Rationale:** §11 Action 3 — each instruction in exactly one location. §19 — each module has a single responsibility. The current split creates two sources of truth with no clear ownership boundary.

---

### Rewrite 2: Replace `git add -A` with explicit file-scoped staging (Issue 2)

**Current:**

```bash
git add -A
git commit -m "<type>: <concise description of what changed>"
```

**Proposed:**

```bash
# Stage only the files changed during execute_inline.
# List each file explicitly — do not use git add -A or git add .
git add <file1> [<file2> [<file3>]]
git commit -m "<type>: <concise description of what changed>"
```

Add to `<permitted>`:

```xml
<permitted>
  ...
  - Run `git add <explicit file list>` (maximum 3 files) and `git commit`
  ...
</permitted>
```

And add to `<reserved_for_human_review>`:

```xml
<reserved_for_human_review>
  ...
  - Running `git add -A`, `git add .`, or any staging command that captures files beyond
    those modified during execute_inline
  ...
</reserved_for_human_review>
```

**Rationale:** §22 Pattern 9 (minimum-scope permissions), §20 (blast radius). The constraint "edit up to 3 files" is already tracked — the commit step should enforce the same boundary. `git add -A` breaks that boundary silently.

---

### Rewrite 3: Front-load scope cues into the `parse_task` prompt (Issue 3)

**Current `parse_task` empty-args prompt:**

```
What's the quick fix? (one sentence)
```

**Proposed:**

```
What's the quick fix? One sentence. The task must require 3 or fewer file edits
and no research. If it's larger, use /gsd-quick.

Examples of valid tasks:
- "Fix the typo in README line 42"
- "Add missing semicolon in config.ts"
- "Bump version to 1.4.2 in package.json"
```

**Rationale:** §1 Action 1 (quality bar explicit), §22 Pattern 2 (abstract instructions paired with calibrating examples), §22 Pattern 3 (output format specified upfront). Front-loading the scope criteria reduces the chance a user provides a non-trivial description that passes `parse_task` before being caught by `scope_check`. The examples calibrate "one sentence" concretely.

---

## Overall Verdict: **Adequate**

The workflow (`fast.md`) is well-engineered for its scope. The constraint pairing, priority ordering, tie-breaking, and output format specification are all competent applications of guide principles. The command file (`commands/gsd/fast.md`) is a structural weak point — it adds indirection without adding value and duplicates scope descriptions that already exist in the workflow.

The `git add -A` issue is the most practically dangerous flaw: it silently expands the blast radius of a command designed to be safe and narrow. It should be fixed regardless of other changes.

The task parsing issue is low severity but easy to fix and improves the user-facing experience for the empty-arguments path.

Priority order for fixes: (1) `git add -A` → explicit file staging, (2) eliminate the duplicate scope description between command and workflow, (3) improve the `parse_task` prompt with calibrating examples.
