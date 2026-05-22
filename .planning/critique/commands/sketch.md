# Critique: `commands/gsd/sketch.md`

**Reviewed against:** Prompt Engineering Guide V09  
**Date:** 2026-04-30  
**Verdict:** Needs Work

---

## Context

`commands/gsd/sketch.md` is a command dispatcher: it holds frontmatter, an `<objective>`, an `<execution_context>` block that references six external files, a `<runtime_note>`, a `<context>` block injecting `$ARGUMENTS`, and a `<process>` tag. The command delegates all real workflow logic to `~/.claude/get-shit-done/workflows/sketch.md` and five reference files. The critique covers the command file as a standalone artifact — the referenced external files are not available for inspection and are excluded from this critique.

---

## Strengths

**Correct flag documentation in context (§5 Instruction Framing)**  
The `--quick` flag is documented with an explicit conditional description: "Skip mood/direction intake, jump straight to decomposition and building. Use when the design direction is already clear." This is a positive, action-oriented instruction — it says what the flag does, not merely what it skips. The conditional branching is exactly the pattern prescribed in §5: "If a PR number is provided, run `gh pr view <number>`." One caveat: the conditional is documented but not mechanically enforced within the command file itself (see Weakness 1).

**Non-generic use-case scope in `<objective>` (§1 Task Specification)**  
The `<objective>` names the concrete artifact produced (throwaway HTML mockups), the concrete output destination (`.planning/sketches/`), and the concrete quantity (2-3 variants). These are specific enough to constitute a partial quality bar per §1 Action 1. "2-3 variants for comparison" tells the model what a complete output looks like — better than a qualitative descriptor like "multiple options."

**Runtime note for platform-specific tool substitution (§5 Instruction Framing — Conditional Instructions)**  
The `<runtime_note>` handling the VS Code Copilot tool substitution (`vscode_askquestions` for `AskUserQuestion`) is a correct application of the conditional instruction pattern from §5. It addresses a known branch without requiring the model to guess. The use of bold for `**Copilot (VS Code):**` visually scopes the instruction to its context, which is practical even if it uses markdown rather than XML.

**Minimum-scope tool permissions in frontmatter (§22 Pattern 9)**  
The `allowed-tools` list is explicit: `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `AskUserQuestion`. These are reasonable grants for a UI-sketching workflow. The list is narrow enough to be auditable and does not include broad-scope tools like `Agent` or destructive shell patterns.

---

## Weaknesses

### 1. The command file is a hollow pointer — it adds no independent value (§19 Modularity and Composition, §11 System vs. User Prompt Allocation)

The entire operative content of the command file reduces to three signals: the `<objective>` (scope description), the six `@` includes (delegated logic), and the `<process>` ("Execute the sketch workflow … end-to-end"). The `<objective>` and `<process>` together say nothing the referenced workflow does not already specify internally. The `<process>` tag is particularly empty:

```xml
<process>
Execute the sketch workflow from @~/.claude/get-shit-done/workflows/sketch.md end-to-end.
Preserve all workflow gates (intake, decomposition, variant evaluation, MANIFEST updates, commit patterns).
</process>
```

"Execute … end-to-end" and "Preserve all workflow gates" are tautologies — they instruct the model to follow instructions. They add no constraint the workflow file doesn't already encode.

Per §19, each prompt component must be independently understandable. This command file is not — it is a pointer to six other files with a summary label glued on top. Per §11 Action 3, each instruction should appear in exactly one location. The scope description ("Explore design directions through throwaway HTML mockups before committing to implementation") is presumably duplicated in `workflows/sketch.md`.

### 2. No audience, no quality bar — the task specification is structurally incomplete (§1 Task Specification)

§1 Action 1 requires three components to be explicit: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. §1 Action 2 requires the audience to be identified and encoded.

The command file satisfies (a) partially (HTML mockups, 2-3 variants). It omits (b) — the downstream use of sketches is not stated. It omits (c) beyond the count heuristic. There is no `<audience>` tag and no `<quality_bar>` tag as defined in §4's XML tag vocabulary. The guide's template is:

```xml
<task>{what the model must do}</task>
<audience>{who will use the output and in what context}</audience>
<quality_bar>{what makes a good response — format, length, focus}</quality_bar>
```

None of these structural slots are present. The `<objective>` tag is not in the guide's tag vocabulary — it maps loosely to `<task>` but without the semantic precision. The `$ARGUMENTS` injection is the only user-facing input hook, and its format is unconstrained.

### 3. `$ARGUMENTS` is injected without validation, format constraints, or fallback (§1 Task Specification Action 3, §13 Modularity — Template Variables)

The `<context>` block injects the raw user arguments:

```xml
<context>
Design idea: $ARGUMENTS
</context>
```

§13 specifies fallback syntax: `${VAR||"(default value)"}` for optional context. A user invoking the command with no arguments will produce `Design idea: ` with an empty string, with no fallback behavior specified in the command file. The `--quick` flag is documented but the command file provides no parsing logic — it passes the raw string to the workflow and relies on the workflow to interpret it. This is silent delegation without contract.

§1 Action 3 requires constraints to be audited for consistency. "Design idea: $ARGUMENTS" combined with "2-3 variants" produces an implicit constraint: the user must supply enough design description to generate meaningfully differentiated variants. If `$ARGUMENTS` is a two-word phrase like "login form", the adequacy of that as a design brief is unspecified. There is no minimum-richness constraint or prompt to the user when input is underspecified.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` with `<task>` and add `<audience>` and `<quality_bar>` (Issue 2)

**Current:**

```xml
<objective>
Explore design directions through throwaway HTML mockups before committing to implementation.
Each sketch produces 2-3 variants for comparison. Sketches live in `.planning/sketches/` and
integrate with GSD commit patterns, state tracking, and handoff workflows.

Does not require `/gsd-new-project` — auto-creates `.planning/sketches/` if needed.
</objective>
```

**Proposed:**

```xml
<task>
Explore design directions through throwaway, self-contained HTML mockups before committing
to implementation. Produce 2-3 visually distinct variants for the given design idea. Save
all sketches to `.planning/sketches/`. Auto-create that directory if it does not exist.
</task>

<audience>
The developer who invoked this command. They are exploring a design direction they have not
yet committed to. They need variants concrete enough to evaluate against each other — not
wireframe placeholders, but styled HTML they can open in a browser.
</audience>

<quality_bar>
A complete sketch run produces: (a) 2-3 HTML files that are visually distinct in layout
or approach, not just color-swapped, (b) a brief comparison note identifying the tradeoff
each variant represents, and (c) a MANIFEST entry and commit following GSD patterns.
A sketch that produces visually identical variants or skips the comparison note is incomplete.
</quality_bar>
```

**Rationale:** §1 Action 1 (three task components explicit), §1 Action 2 (audience encoded), §4 tag vocabulary (`<task>`, `<audience>`, `<quality_bar>` are prescribed tags; `<objective>` is not). The quality bar makes "complete output" measurable rather than implicit.

---

### Rewrite 2: Add a constrained `$ARGUMENTS` intake with fallback and `--quick` conditional (Issues 2 and 3)

**Current:**

```xml
<context>
Design idea: $ARGUMENTS

**Available flags:**
- `--quick` — Skip mood/direction intake, jump straight to decomposition and building. Use when the design direction is already clear.
</context>
```

**Proposed:**

```xml
<context>
Design idea: ${ARGUMENTS||"(no design idea provided — ask the user: What design direction do you want to sketch? Be specific: include the component, the interaction, and any constraints.)"}

If `$ARGUMENTS` contains `--quick`, strip the flag before treating the remainder as the design idea, then skip the mood/direction intake round and proceed directly to decomposition and building.

If `$ARGUMENTS` is empty or fewer than 5 words after flag stripping, ask the user for a more specific design brief before proceeding. Example of an adequate brief: "A dashboard card showing weekly activity with a sparkline and a quick-action button." Example of an inadequate brief: "login form".
</context>
```

**Rationale:** §13 (`${VAR||"default"}` fallback syntax for optional context), §5 Conditional Instructions (explicit if/then branching for the `--quick` flag), §22 Pattern 2 (abstract instructions paired with calibrating examples — here, adequate vs. inadequate design briefs). The fallback prevents the silent empty-string case. The examples calibrate what "specific enough" means for a design brief.

---

### Rewrite 3: Give the command file a self-contained role or reduce it to pure frontmatter (Issue 1)

The current split creates a command file that reads as a summary of the workflow file without adding any distinct behavioral contract. Two paths are acceptable per §11 and §19:

**Option A — Command file as pure frontmatter dispatcher (preferred for thin commands):**

Remove `<objective>`, `<runtime_note>`, and `<process>` from the command file. Keep only frontmatter and the `<context>` block. The workflow file becomes the single source of truth for all instructions. The command file's only job is to inject `$ARGUMENTS` into the workflow's context.

```markdown
---
name: gsd:sketch
description: Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration
argument-hint: "<design idea to explore> [--quick]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
---
@~/.claude/get-shit-done/workflows/sketch.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/references/sketch-theme-system.md
@~/.claude/get-shit-done/references/sketch-interactivity.md
@~/.claude/get-shit-done/references/sketch-tooling.md
@~/.claude/get-shit-done/references/sketch-variant-patterns.md

<context>
Design idea: ${ARGUMENTS||"(ask the user for a design brief before proceeding)"}
</context>
```

**Option B — Command file owns the full task specification (per Rewrites 1 and 2):**

Inline `<task>`, `<audience>`, `<quality_bar>`, and the constrained `<context>` directly in the command file. The workflow file then handles only the step-by-step execution, not the specification. This is the correct decomposition if the two files are meant to be independently useful: command file = what and for whom; workflow file = how.

**Rationale:** §11 Action 3 (each instruction in exactly one location), §19 (single responsibility per module). Both options resolve the dual-source-of-truth problem. Option A is simpler; Option B is more robust if the workflow is reused by other commands.

---

## Overall Verdict: **Needs Work**

The command file demonstrates correct instincts in a few areas — the flag documentation, platform-conditional tool substitution, and narrow permission grants are all competent. However, the core structural problems make it unreliable as a standalone artifact:

1. The task specification is incomplete — no audience, no quality bar, no constraint on what constitutes valid input.
2. The `$ARGUMENTS` injection is unconstrained — the empty-string case is unhandled and the `--quick` flag is documented but not mechanically parsed in the command file.
3. The file's own content adds no independent behavioral signal — it is a labeled pointer to six other files.

These are not cosmetic issues. They mean a model reading only the command file cannot determine: who the user is, what a complete run looks like, or what to do with an empty or underspecified design brief. All three issues are fixable with targeted rewrites that do not require restructuring the workflow file.

Priority order for fixes: (1) add `<audience>` and `<quality_bar>` to make the specification complete, (2) constrain `$ARGUMENTS` intake with fallback and calibrating examples, (3) resolve the dual-source-of-truth by choosing either pure-frontmatter or full-specification ownership for the command file.
