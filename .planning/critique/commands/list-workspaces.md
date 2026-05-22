# Critique: `commands/gsd/list-workspaces.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### Delegation pattern is coherent (§19 Modularity and Composition)

The command file's single job is to act as a thin dispatcher to the workflow file. This aligns with §19's "single responsibility" principle and "prompt files as first-class components." The command does not duplicate logic from the workflow; it names the file and moves on.

### XML tag use is present (§4 Formatting and Structure)

The command uses semantically named XML tags (`<objective>`, `<execution_context>`, `<process>`) rather than bare markdown headers. This satisfies §4's Action 2: "wrap each [section] in a semantically named XML tag."

### Frontmatter encodes agent configuration (§11 System vs. User Prompt Allocation)

The YAML frontmatter documents identity (`name`), a trigger description (`description`), and the `allowed-tools` permission list. This matches §11's YAML frontmatter pattern for encoding persistent agent properties in a single, machine-readable location.

---

## Weaknesses

### 1. `<objective>` and `<process>` say the same thing in different words (§11 Action 3, §10 Action 1)

The `<objective>` tag reads:

> Scan `~/gsd-workspaces/` for workspace directories containing `WORKSPACE.md` manifests. Display a summary table with name, path, repo count, strategy, and GSD project status.

The `<process>` tag reads:

> Execute the list-workspaces workflow from `@~/.claude/get-shit-done/workflows/list-workspaces.md` end-to-end.

These are not distinct concerns. The objective describes what the workflow does; the process says to run the workflow. A model reading both gets the same instruction twice with the appearance of two separate things. §11 Action 3 states: "State each instruction exactly once." §10 Action 1 states: "Remove redundant instructions... before sending."

The `<objective>` content is also superseded in detail by the workflow file itself (which already defines the full display table). Restating it here is noise that adds positional degradation cost (§10) with zero additional signal.

### 2. The `description` frontmatter field is a generic capability label, not a trigger signal (§6 Action 2, §22 Pattern 1)

The current value is:

```
description: List active GSD workspaces and their status
```

§6 Action 2 requires personas and descriptions to "constrain register, voice, or domain-specific style to be effective." §22 Pattern 1 specifies that identity should be "scoped to the exact domain." For an agent-facing `description` / `whenToUse` field used to route invocations, §17 notes: "Make it action-specific, not capability-generic."

The current description names the capability (what the command is) rather than the trigger condition (when to use it). An orchestrating model selecting among dozens of GSD commands gets no signal about when this command is the right choice.

### 3. No `<output_format>` specification; output contract is implicit and fragile (§7 Action 1, §22 Pattern 3)

The command delegates all output definition to the workflow file. The workflow file defines a markdown table structure inline in a prose code block — not as an `<output_format>` tag visible at the command level. From the command file's perspective, the output format is entirely invisible.

§7 Action 1 and §22 Pattern 3 both state that format specification is "part of the task definition, not an afterthought," and that "a fully specified format produces consistent, parseable output." The command file provides no format constraint. If the workflow file is ever changed or absent, the command has no fallback contract.

Additionally, §21 (Tone and Style Rules) states that size constraints should use numeric limits. The workflow defines a table but does not specify maximum row count, truncation behavior for large workspaces, or how to handle partial data (e.g., a corrupt `WORKSPACE.md`). These omissions apply equally to the command-level prompt.

---

## Specific Rewrites

### Rewrite 1: Eliminate `<objective>` duplication; keep only the dispatch instruction

**Current (two tags, same content):**

```xml
<objective>
Scan `~/gsd-workspaces/` for workspace directories containing `WORKSPACE.md` manifests. Display a summary table with name, path, repo count, strategy, and GSD project status.
</objective>

<process>
Execute the list-workspaces workflow from @~/.claude/get-shit-done/workflows/list-workspaces.md end-to-end.
</process>
```

**Rewrite (single instruction, no duplication):**

```xml
<task>
Execute the list-workspaces workflow end-to-end.
@~/.claude/get-shit-done/workflows/list-workspaces.md
</task>
```

The workflow file already contains the full procedure, column definitions, and branching logic. Restating any of it at the command layer is redundant. If the `<execution_context>` block already loads the workflow via the `@` reference, the `<process>` tag only needs to name the action, not describe the output.

### Rewrite 2: Replace the `description` with a trigger-condition signal

**Current:**

```yaml
description: List active GSD workspaces and their status
```

**Rewrite:**

```yaml
description: >
  Use when the user wants to see all GSD workspaces, check workspace status,
  find which workspace is active, or list repos under ~/gsd-workspaces/.
  Triggers on: "list workspaces", "show workspaces", "what workspaces do I have".
```

This follows §17's guidance that `whenToUse` should be "action-specific, not capability-generic," and §22 Pattern 1's requirement that identity be scoped to when and why, not just what.

### Rewrite 3: Add a minimal `<output_format>` anchor to the command file

Even though the full format lives in the workflow, the command file should state the top-level contract so it remains readable and auditable in isolation (§22 Pattern 3, §19's "independently understandable" module criterion).

```xml
<output_format>
Render a markdown table. One row per workspace.
Columns: Name | Repos | Strategy | GSD Project
If no workspaces exist, print the zero-state message from the workflow.
Do not add prose explanations above the table.
</output_format>
```

This does not duplicate workflow logic — it states the contract. The workflow provides the implementation. The command provides the verifiable expectation.

---

## Overall Verdict

**Needs Work**

The command is structurally minimal in the right direction — thin dispatch, correct tag use, frontmatter configuration — but the execution has two significant defects. First, the `<objective>` block is pure duplication that adds noise without adding signal, violating the guide's single-statement-per-instruction rule. Second, the `description` field fails its primary job as a routing signal, providing a capability label where a trigger condition is needed. The missing `<output_format>` anchor is a lesser but real gap: the command is not independently readable without loading the workflow file. All three issues have low-effort fixes that would bring this to Adequate.
