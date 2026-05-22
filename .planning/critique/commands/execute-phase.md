# Critique: `commands/gsd/execute-phase.md`

**Date:** 2026-04-30
**Reviewed against:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Strengths

### 1. Clear task instruction leads the prompt (§8 Context Placement)

The `<objective>` block appears first and states the primary task — orchestrate wave-based parallel execution — before any flags, context, or process steps. This correctly exploits the model's high-attention window at the start of the prompt. The instruction-first rule from §8 Action 1 is followed.

### 2. Flag disambiguation is handled with positive-framed conditionals (§5 Instruction Framing)

The "Flag handling rule" block correctly tells the model what it must do ("a flag is active only when its literal token appears in `$ARGUMENTS`") rather than relying on the model to infer absence. This follows §5's conditional branching pattern and the `--wave / --gaps-only / --interactive` block in `<context>` reinforces it by repeating the positive assertion for each flag individually. Redundant in form, but defensively correct for a branching-critical instruction.

### 3. Contextual runtime compat note is separated into a named block (`<runtime_note>`) (§4 Formatting and Structure, §8 Context Placement)

The VS Code Copilot disambiguation ("use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`") is isolated in its own tag rather than embedded in prose. This matches §4 Action 2's principle that tags should name what a section *is*, giving the model richer signal than inline parenthetical asides.

### 4. Lean orchestrator / self-contained subagent decomposition (§17 Agent and Subagent Patterns, §13 Structural Architecture Patterns)

The "Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results" framing correctly expresses the §17 modular principle. The prompt does not try to encode full subagent logic inline; it delegates via workflow file reference and agent type names. Each subagent is intended to be self-contained at spawn time.

---

## Weaknesses

### 1. No persona — for a complex orchestration role, this is a meaningful omission (§6 Persona Assignment)

The command file has no `<persona>` block. §6 Action 1 states: "Task type is open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona." Orchestrating parallel agent waves, deciding when to wait vs. proceed, and handling checkpoint logic are judgment-heavy, multi-step behaviors. The guide's §22 Pattern 1 is explicit: "The specificity creates behavioral bias — the model leans into that role." Without a persona, the model defaults to generic assistant behavior for orchestration decisions. This is one of the few command files where a targeted persona would produce measurable difference.

### 2. Output format is entirely unspecified (§7 Output Format Handling, §22 Pattern 3)

There is no `<output_format>` tag anywhere in the file. The model receives no instruction about what to show the user as it executes: no format for the wave progress table, no template for the completion report, no guidance on what the orchestrator should surface vs. suppress. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task." §16 specifies that status tables (`| # | Unit | Status | PR |`) are the correct mechanism for parallel work tracking. This prompt delegates to the workflow file for execution steps but gives no output contract for the orchestration layer itself.

### 3. Negative/passive flag framing repeated instead of resolved (§5 Instruction Framing, §11 System vs. User Prompt Allocation)

The flag disambiguation rule is stated three times with overlapping coverage:

- In `<objective>`: the general rule ("A flag is active only when its literal token appears in `$ARGUMENTS`")
- In `<context>`: the same rule repeated verbatim for each individual flag
- Implied again in `<process>` by referencing the workflow end-to-end

§11 Action 3 states: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." The duplication here is not harmless — on a ~15% context budget orchestrator, every repeated instruction displaces capacity. Additionally, the `<context>` block mixes *documentation* of flags (their purpose descriptions) with *active behavioral rules* (the "active only if literal token" constraint). These two concerns should be in separate sections.

---

## Specific Rewrites

### Rewrite 1: Add a targeted persona (addresses Weakness 1)

Current state: no persona block.

Suggested addition — insert immediately after the frontmatter `---`, before `<objective>`:

```xml
<persona>
You are a phase execution orchestrator for a structured software delivery system.

Your role: coordinate parallel plan execution across waves — not execute plans yourself.
Decide wave grouping, spawn subagents with complete context, track completion state, and
route the user to the next workflow step when the phase is done.

Your judgment calls:
- When a subagent result is ambiguous, verify via filesystem state before proceeding
- When a checkpoint is required, pause and surface a clear decision to the user
- When the phase is complete, emit a structured summary before closing
</persona>
```

This follows §6 Action 2 (specific, role-constrained) and §22 Pattern 1 (role identity scoped to exact domain). The "judgment calls" list mirrors §6's "strengths listing" pattern, biasing the model toward the decisions that matter most in orchestration.

---

### Rewrite 2: Add an output format block (addresses Weakness 2)

Current state: no `<output_format>` tag.

Suggested addition — insert after `<process>`, before any closing tag:

```xml
<output_format>
During execution, render a wave status table after each wave completes:

| # | Plan | Status | Agent | Notes |
|---|------|--------|-------|-------|
| 1 | plan-title | done | gsd-executor | — |
| 2 | plan-title | running | gsd-executor | — |

Status values: `pending` / `running` / `done` / `failed` / `skipped`

On phase completion, emit a summary block:

```
Phase {N} complete.
Waves executed: {X}
Plans completed: {Y} / {total}
Next step: run /gsd-verify-work {N}
```

If any plan fails: list the failed plan name, the failure reason from SUMMARY.md, and
the recommended recovery action before stopping.
</output_format>
```

This follows §16's status table pattern, §22 Pattern 3's upfront format specification, and §7 Action 2's reasoning-before-answer ordering (wave table during → summary after).

---

### Rewrite 3: Consolidate flag rules to a single canonical location (addresses Weakness 3)

Current state: The flag disambiguation rule appears in both `<objective>` and `<context>` with near-identical wording.

Remove the redundant inline repetition from `<context>`. Replace the `<context>` flag block with a reference-only listing:

```xml
<context>
Phase: $ARGUMENTS

**Supported flags** (active only when the literal token appears in `$ARGUMENTS`):

| Flag | When active, behavior |
|------|-----------------------|
| `--wave N` | Execute only Wave N |
| `--gaps-only` | Execute only plans with `gap_closure: true` |
| `--interactive` | Sequential inline execution with user checkpoints |
| `--tdd` | Test-driven execution mode |

Flag resolution rule is defined in `<objective>`. Apply it uniformly.
</context>
```

The behavioral rule lives once in `<objective>`. The `<context>` block becomes a reference table only — conforming to §11 Action 3 ("each instruction in exactly one location") and §10 Action 1 (remove redundant instructions).

---

## Overall Verdict

**Adequate**

The command file accomplishes its coordination intent: the task is clear, the flag logic is unambiguous (if verbose), the agent-type references are correct, and the lean-orchestrator principle is respected. However, the absence of a persona and output format contract are genuine gaps — not stylistic concerns. For a command that orchestrates parallel AI agents, both of these directly affect the quality of judgment calls and user-facing output. The repeated flag rules add noise without adding safety. The file would move to Strong with the three rewrites above applied.
