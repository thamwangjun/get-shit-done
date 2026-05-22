# Critique: `commands/gsd/update.md`

**File reviewed:** `/home/thamw/development/happier/get-shit-done/commands/gsd/update.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Date:** 2026-04-30

---

## Overview

`update.md` is a thin routing layer — 38 lines total — that describes the update
command's purpose and then delegates all execution logic to an external workflow
file via `@~/.claude/get-shit-done/workflows/update.md`. The full command
therefore spans two files; the critique covers both the entry point being
evaluated and the behavior it produces, since the entry point is only
meaningful in conjunction with the workflow it invokes.

---

## Strengths

### 1. Constraint pairing is well-executed (§14 Constraint Enforcement)

The workflow file (reached via `execution_context`) uses a proper
`<permitted>` / `<reserved_for_human_review>` pair:

```xml
<permitted>
  - Read VERSION files, query GitHub API, run npx installer, clear cache files
  - Ask the user one confirmation question before executing the install
  - Back up locally modified GSD files automatically before overwriting
</permitted>
<reserved_for_human_review>
  - Installing without explicit user confirmation
  - Modifying non-GSD files (custom commands, custom agents, CLAUDE.md, custom hooks)
</reserved_for_human_review>
```

This satisfies §14's rule that every restriction must be paired with an
equally concrete statement of what IS permitted. The two lists are symmetric in
specificity, which is the correct pattern.

### 2. Explicit priority ordering (§5 Instruction Framing — Priority Ordering)

The workflow carries a `<priority_order>` block that ranks the four runtime
detection rules by importance. This directly matches the §5 pattern for
resolving conflicts between signals, and correctly places the most critical
concern (which runtime invoked the command) first.

### 3. Conditional branching is enumerated, not left to inference (§16 Multi-Phase Workflows — Scenario-Based Branching)

Each step in `<execution_steps>` uses explicit `if/else` blocks with named
conditions (`IS_LOCAL`, `INSTALL_SCOPE == UNKNOWN`, version match, version
mismatch). The model does not need to infer branching from context. This aligns
with §16's requirement to handle scenarios explicitly rather than implicitly.

### 4. Quality bar checklist is present (§1 Task Specification — Quality Bar)

The workflow closes with a `<quality_bar>` checklist. This partially satisfies
§1 Action 1's requirement to make explicit "what a correct or high-quality
response looks like." The checklist items map to measurable behavioral outcomes,
not vague qualifiers.

---

## Weaknesses

### Issue 1 — The command file itself contains almost no task specification (§1 Task Specification)

§1 Action 1 requires that the prompt explicitly state: (a) what output is
requested, (b) why it matters, and (c) what a correct response looks like.
The `commands/gsd/update.md` entry point contains none of these for the
model — it contains them only for a human reader skimming the file.

The `<objective>` block is written as prose documentation of what the workflow
does, not as a directive the model can act on. The `<process>` block repeats
the same list and then says "Follow the update workflow" — which defers
everything to the external file.

Because the entry-point file is what the model receives as its initial
instruction, and it contains no actionable task specification, the model must
immediately pivot to reading an external file before it knows what to do. This
is an unnecessary indirection that adds one read-tool call per invocation.

§1 Action 3 also requires a constraint compatibility audit. The entry point
carries no constraints of its own — constraint specification lives entirely
in the workflow. If the workflow file is unavailable or misread, the model has
no fallback behavior encoded at the entry point.

### Issue 2 — Negative framing in `<objective>` violates §5 Instruction Framing

The `<objective>` section describes what the workflow "handles" using a passive
bullet list:

```
Routes to the update workflow which handles:
- Version detection (local vs global installation)
- npm version checking
- Changelog fetching and display
- User confirmation with clean install warning
- Update execution and cache clearing
- Restart reminder
```

§5 Action 1 requires converting to positive, imperative framing. "Routes to
the update workflow which handles" is neither a directive nor active voice — it
describes what happens to the model's action rather than specifying the action.
The same list appears (redundantly) in `<process>`, violating §11 Action 3's
rule that each instruction must appear in exactly one location.

§21 (Tone and Style) reinforces this: instructions must use imperative present
tense. "Check for GSD updates, install if available, and display what changed"
(the `description` frontmatter field) is closer to the correct form, but it
does not appear in the prompt body where the model reads it.

### Issue 3 — No output format specification at the entry point (§7 Output Format Handling, §22 Pattern 3)

The command specifies no output format. The workflow file specifies exact
display strings (the `╔═══╗` box, the section headers, the changelog list
format) inline within the relevant steps — but the entry point carries nothing.

§22 Pattern 3 requires output format to be "specified completely and upfront"
as part of the task definition, not buried inside execution steps. The display
format for the update confirmation, the changelog, and the completion message
are all defined in `show_changes_and_confirm` and `display_result`, well past
the point where the model has committed to an execution path.

A more robust design would declare the output format once in a dedicated
`<output_format>` block near the top of the workflow, making the expected
output structure visible before the model begins executing steps. As written,
the format is scattered across three different steps.

---

## Specific Rewrites

### Rewrite 1 — Replace `<objective>` + `<process>` with a single actionable `<task>` block

**Current (lines 9–37 of `commands/gsd/update.md`):**

```xml
<objective>
Check for GSD updates, install if available, and display what changed.

Routes to the update workflow which handles:
- Version detection (local vs global installation)
- npm version checking
- Changelog fetching and display
- User confirmation with clean install warning
- Update execution and cache clearing
- Restart reminder
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/update.md
</execution_context>

<process>
**Follow the update workflow** from `@~/.claude/get-shit-done/workflows/update.md`.

The workflow handles all logic including:
1. Installed version detection (local/global)
2. Latest version checking via npm
3. Version comparison
4. Changelog fetching and extraction
5. Clean install warning display
6. User confirmation
7. Update execution
8. Cache clearing
</process>
```

**Rewrite:**

```xml
<task>
Check for GSD updates and install if a newer version is available.

Execute the workflow at `@~/.claude/get-shit-done/workflows/update.md`.
Follow each step in order; do not skip user confirmation.
</task>

<execution_context>
@~/.claude/get-shit-done/workflows/update.md
</execution_context>
```

Rationale: eliminates the duplicate step enumeration (§11 Action 3), converts
to imperative framing (§5 Action 1, §21), and makes the delegation explicit
rather than documentary.

### Rewrite 2 — Add a top-level `<output_format>` block to the workflow file

Insert this block immediately after the `<constraints>` block in
`workflows/update.md`, before `<execution_steps>`:

```xml
<output_format>
Display sections in this order and no other:

1. Version header (installed SHA → latest SHA, or "already current" notice)
2. Changelog list (one bullet per commit message, first line only)
3. Clean install warning (directories affected, what is preserved)
4. Confirmation prompt (AskUserQuestion — two options only: proceed or cancel)
5. Progress output from npx (pass-through, do not suppress)
6. Completion box with restart instruction

Each section is separated by a blank line. Do not add commentary between
sections. Do not summarize the changelog — show every commit message as
received from the API.
</output_format>
```

Rationale: satisfies §7 Action 1 and §22 Pattern 3 by declaring format before
execution begins. The format is currently implicit and reconstructed by reading
all six steps; making it explicit prevents the model from reordering or
collapsing sections on low-context calls.

### Rewrite 3 — Convert the `<quality_bar>` from passive checkboxes to a positive completion contract

**Current (end of `workflows/update.md`):**

```
<quality_bar>
- [ ] Installed version read correctly
- [ ] Latest version checked via GitHub API
- [ ] Update skipped if already current
- [ ] Commit log fetched and displayed before update
- [ ] Clean install warning shown
- [ ] User confirmation obtained
- [ ] Update executed successfully
- [ ] Restart reminder shown
</quality_bar>
```

**Rewrite:**

```xml
<quality_bar>
This run succeeds when ALL of the following are true:
- Installed version is read from the VERSION file, not inferred
- Latest version is fetched live from the GitHub API (not cached)
- If SHAs match: output "already on latest" and stop — no install runs
- Commit messages are displayed before any install command executes
- The clean install warning lists which directories will be wiped
- User types explicit confirmation before npx runs
- npx exits 0 and the completion box appears with both SHAs
- Restart instruction appears in every successful completion, not conditionally
</quality_bar>
```

Rationale: §5 Action 1 applies to the quality bar too — checkboxes phrased as
"X done correctly" are passive and ambiguous about what "correctly" means.
Rewriting each item as a positive, testable condition gives the model a
verifiable definition of success (§1 Action 1c, §22 Pattern 3).

---

## Overall Verdict

**Needs Work**

The command entry point (`commands/gsd/update.md`) is effectively a readme
masquerading as a prompt. It contains no actionable task specification, no
output format, and no constraints — all of which are delegated to the workflow
file. The workflow file itself is stronger: it uses correct constraint pairing,
priority ordering, and step-level conditional branching. But it violates §22
Pattern 3 by scattering output format across multiple steps, and the entry
point violates §5 and §11 by duplicating the step enumeration in two blocks
with passive framing.

The two highest-leverage fixes are: (1) collapse the entry point to a single
`<task>` directive, removing the duplicate `<objective>`/`<process>` structure;
and (2) add an explicit `<output_format>` block at the top of the workflow file.
Neither requires restructuring the execution logic — the step content is
already solid.
