# Critique: `commands/gsd/spike.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Verdict:** Adequate

---

## Overview

`spike.md` is a thin command-layer prompt. Its job is to relay `$ARGUMENTS` and two
`@`-included files into the actual spike workflow. This layered architecture is intentional —
the guide endorses it (§19 Modularity and Composition, §13 Template Variable Injection).
The critique below evaluates the command layer on its own merits, not the downstream
workflow files it invokes.

---

## Strengths

### §19 Modularity — Single-responsibility delegation

The file does exactly one thing: relay invocation context to the workflow. It does not
duplicate the workflow's steps. This matches the modular principle from §19:
_"Each prompt component has a single responsibility and is independently understandable."_

### §13 Template Variable Injection — `$ARGUMENTS` usage

The idea is surfaced via `$ARGUMENTS` with a clear label ("Idea:") inside a `<context>`
block. This is correct variable injection syntax and keeps the runtime input cleanly
separated from the static command structure.

### §5 Instruction Framing — `--quick` conditional

The `--quick` flag is documented with a clear, positive description of what it does and
when to use it. This is conditional instruction framing aligned with §5:
_"When behavior depends on context, use explicit conditional branching."_

### §11 YAML Frontmatter — Agent configuration in one place

`name`, `description`, `argument-hint`, and `allowed-tools` are all in frontmatter.
This matches §11's YAML frontmatter pattern for encoding identity, permissions, and
trigger conditions in a single machine-readable location.

---

## Weaknesses

### 1. §4 Formatting — Structurally inconsistent tag vocabulary (Critical)

The file mixes its own invented tags (`<objective>`, `<execution_context>`,
`<runtime_note>`, `<process>`) with the guide's standard vocabulary. None of these
appear in §4's XML tag vocabulary table. The guide is explicit:
_"Use semantically named tags consistently across prompts. A shared vocabulary makes
composed prompts predictable and composed modules interoperable."_

The correct mapping would be:

| Current tag | Guide-standard replacement |
|---|---|
| `<objective>` | `<task>` |
| `<execution_context>` | part of `<context>` or `<system_note>` |
| `<runtime_note>` | `<system_note>` |
| `<process>` | `<task>` (as the primary instruction) or a named `<phase>` |
| `<context>` | `<context>` (this one is correct) |

Using non-standard tags means any tooling that parses or lints prompts against the
vocabulary cannot validate this file. It also forces a reader to mentally remap tags
rather than reading fluently.

### 2. §1 Task Specification — No quality bar defined (Significant)

§1 Action 1 requires three explicit components: what is requested, why it matters, and
what a correct/high-quality response looks like. §1's template is:

```xml
<task>...</task>
<audience>...</audience>
<quality_bar>...</quality_bar>
```

The command omits `<audience>` and `<quality_bar>` entirely. There is no statement of
who the spike output is for (the developer who invoked it? a future agent reading the
MANIFEST?), and no quality bar describing what makes a spike response successful.
The `<objective>` block partially covers "what is requested" but says nothing about the
audience or what done looks like from the command layer's perspective.

This matters because the workflow file (`workflows/spike.md`) defines its own process,
but the command layer is the entry point — it sets the frame for the entire invocation.
A missing quality bar at the top means the model has no explicit standard to anchor
to before it even opens the workflow file.

### 3. §8 Context Placement — Task instruction is not leading (Moderate)

§8 Action 1 states: _"Place the task instruction at the very start of the prompt."_
Models attend most strongly to the beginning.

In `spike.md`, the order is:
1. `<objective>` — describes the purpose (closest to a task instruction)
2. `<execution_context>` — `@`-file references
3. `<runtime_note>` — Copilot compatibility caveat
4. `<context>` — the actual user input (`$ARGUMENTS`)
5. `<process>` — the actual execution instruction

The true instruction to the model — _"execute the spike workflow end-to-end"_ — appears
last in `<process>`. The `<runtime_note>` Copilot caveat is structural noise that
interrupts the flow between the objective and the input. Per §8, primary execution
instructions should lead; supplementary context (like tool-compatibility caveats) should
be in the middle, not between the objective and the input.

### 4. §5 Instruction Framing — Negative instruction not converted (Minor)

The `<process>` block contains:
> _"Preserve all workflow gates (decomposition, risk ordering, verification, MANIFEST
> updates, commit patterns)."_

"Preserve" is implicitly negative — it tells the model what not to skip. §5 Action 1
requires converting these to positive equivalents. A positive reframe:
> _"Execute all workflow gates in sequence: decomposition, risk ordering, verification,
> MANIFEST updates, and commit patterns."_

This is minor because the instruction is clear, but the guide's rule is mechanical:
scan for any "preserve / avoid / do not" framing and rewrite it positively.

---

## Specific Rewrites

### Rewrite 1 — Fix tag vocabulary and leading instruction order (addresses weaknesses 1 and 3)

**Current:**
```xml
<objective>
Rapid feasibility validation through focused, throwaway experiments. Each spike answers one
specific question with observable evidence. Spikes live in `.planning/spikes/` and integrate
with GSD commit patterns, state tracking, and handoff workflows.

Does not require `/gsd-new-project` — auto-creates `.planning/spikes/` if needed.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/spike.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`.
</runtime_note>

<context>
Idea: $ARGUMENTS

**Available flags:**
- `--quick` — Skip decomposition/alignment, jump straight to building. Use when you already know what to spike.
</context>

<process>
Execute the spike workflow from @~/.claude/get-shit-done/workflows/spike.md end-to-end.
Preserve all workflow gates (decomposition, risk ordering, verification, MANIFEST updates, commit patterns).
</process>
```

**Rewritten:**
```xml
<task>
Execute the spike workflow end-to-end from @~/.claude/get-shit-done/workflows/spike.md.
Run all workflow gates in sequence: decomposition, risk ordering, verification, MANIFEST
updates, and commit patterns.

Rapid feasibility validation through focused, throwaway experiments. Each spike answers one
specific question with observable evidence. Spikes live in `.planning/spikes/` and
auto-create that directory if it does not exist.
</task>

<context>
Idea: $ARGUMENTS

Available flags:
- `--quick` — Skip decomposition and alignment; treat the idea as a single spike question
  and jump directly to building. Use when you already know what to spike.
</context>

<system_note>
Tool compatibility: If running in Copilot (VS Code), use `vscode_askquestions` wherever
the workflow calls `AskUserQuestion`.

Referenced context files:
@~/.claude/get-shit-done/workflows/spike.md
@~/.claude/get-shit-done/references/ui-brand.md
</system_note>
```

Changes: single `<task>` leads with the execution instruction; `<context>` holds
runtime input; `<system_note>` groups the compatibility caveat and `@`-file references
out of the primary flow; tag vocabulary is now guide-standard throughout.

---

### Rewrite 2 — Add audience and quality bar (addresses weakness 2)

Insert after the `<task>` block:

```xml
<audience>
The developer who invoked the spike. They want to know whether a specific technical
question is feasible before investing in a full plan. They are comfortable reading
code and terminal output; prose summaries alone are insufficient.
</audience>

<quality_bar>
A successful spike produces:
1. At least one runnable experiment with observable output (a script, a diff, or terminal output)
2. A one-sentence answer to the spike question: feasible / not feasible / conditional
3. A MANIFEST entry in `.planning/spikes/` that future phases or the wrap-up workflow can read
</quality_bar>
```

This anchors the model to the real success criteria at invocation time, before it reads
the detailed workflow steps.

---

## Overall Verdict: Adequate

The command file is structurally sound as a thin delegation layer and its modularity is
correct. The two substantive problems — non-standard tag vocabulary and the missing
task-specification triple (intent / audience / quality bar) — are real gaps against the
guide but do not break functionality. The context-placement inversion (task instruction
appearing last) is a reliability risk: if the model gives disproportionate attention to
the end of the prompt, it lands on the instruction; if it front-loads the objective, it
gets a description rather than a directive. The rewrites above resolve all three issues
without changing the command's architecture or the workflow delegation pattern.
