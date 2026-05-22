# Critique: `commands/gsd/stats.md`

> Scope: this critique covers the command entry point (`commands/gsd/stats.md`) and the
> workflow it delegates to (`~/.claude/get-shit-done/workflows/stats.md`), treating them
> as a single prompt system. Citations reference the Prompt Engineering Guide V09.

---

## Strengths

### 1. XML structural tags used throughout (§4 Formatting)
Both files use semantically named XML tags (`<objective>`, `<execution_context>`,
`<process>`, `<task>`, `<context>`, `<execution_steps>`, `<step>`, `<quality_bar>`).
This matches §4's instruction to "wrap each [section] in a semantically named XML tag"
and is strictly better than markdown headers for Claude-class models.

### 2. Output format is completely specified upfront (§7, §22 Pattern 3)
The `<step name="present_stats">` block supplies an exact template — including the
progress-bar rendering, table column names, and field ordering — before any data is
fetched. This satisfies §22 Pattern 3: "State the required output structure, field names,
ordering, and an example before the model begins its task."

### 3. Explicit fallback / error path (§5 Instruction Framing — conditional instructions)
Both files handle the missing-`.planning/`-directory case explicitly, and the workflow
adds "then stop" to prevent further output. This matches §5's pattern for conditional
branching: a specific condition, a specific action, a specific termination rule.

### 4. Quality bar is present and non-trivial (§1 Task Specification)
The `<quality_bar>` in the workflow names four concrete acceptance criteria, including
"progress bar reflects `percent` accurately" and "no further output is produced" on
fallback. This is a meaningful quality bar rather than a generic one.

### 5. Scope is clearly read-only (§14 Constraint Enforcement, §20 Safety)
The workflow states "No state is written" in `<context>`. This is a concise, accurate
scope boundary that reduces ambiguity about side-effects.

---

## Weaknesses

### 1. The command file is a thin pass-through with no value of its own (§19 Modularity, §11 System vs. User Prompt Allocation)

`commands/gsd/stats.md` contains three elements: an `<objective>` that restates the
description verbatim, an `<execution_context>` that just points to a file, and a
`<process>` that says "execute the workflow end-to-end." The command file adds zero
behavioral information beyond the frontmatter it already contains.

Per §19, each prompt component should "have a single responsibility" and be "independently
understandable." The command file is not independently understandable — it requires the
workflow to be read before the instructions make sense. The `<objective>` and `<process>`
tags duplicate information that is already encoded in the `description` frontmatter field
and the `@include` reference. This violates §11 Action 3: "State each instruction exactly
once."

**Risk:** the `<objective>` ("Display comprehensive project statistics…") and the workflow
`<task>` ("Gather project statistics from `.planning/` state…") use slightly different
phrasing for the same task. If they ever diverge, the model receives two conflicting
task definitions with no declared precedence.

### 2. Task specification is missing audience and quality bar at the entry point (§1 Task Specification)

§1 Action 1 requires three components to be explicit: what output is requested, why it
matters, and what a correct response looks like. The command file supplies only the first.
The quality bar lives entirely in the workflow file, which the model does not see until
it reads the `@include`. If the `@include` fails silently or is not resolved, the model
has no quality criteria at all.

§1 Action 2 requires the audience to be encoded. Neither file identifies the audience.
For a stats command this matters: the output format (emoji, ASCII bar, markdown table) is
only appropriate for a human terminal reader, not a downstream agent caller. An agent
invoking `/gsd-stats` as a subagent call would receive heavily decorated output that it
must then parse. The command gives no guidance on this distinction.

### 3. Output format template uses qualitative emoji decorations without conditional handling (§21 Tone and Style, §7 Output Format Handling)

The `present_stats` template hard-codes `📊`, `✅`, and `████░░` progress bars. Per §21,
size and format constraints should use precise rules, not assumed presentation context.
More critically, §7 Action 2 and §22 Pattern 3 both emphasize that format specification
must account for the consumer of the output. There is no conditional rendering (§13
template ternary syntax) to switch between human-facing decorated output and
machine-parseable plain output when the caller is an agent.

The guide's §13 explicitly provides this pattern:

```
${IS_SUBAGENT?"When you complete the task, respond with a concise report...":
"When you complete the task simply respond with a detailed writeup."}
```

The stats command has no equivalent, making it unsuitable for agent-to-agent calls
without modification.

---

## Specific Rewrites

### Rewrite 1 — Eliminate the command file's redundant body (Issue 1)

The entire body of `commands/gsd/stats.md` (everything after the frontmatter) should be
deleted or reduced to a single `@include` reference. The `<objective>` and `<process>`
blocks add noise without information. The frontmatter `description` already carries the
intent; the `@include` already supplies the instructions.

**Current:**
```md
<objective>
Display comprehensive project statistics including phase progress, plan execution metrics,
requirements completion, git history stats, and project timeline.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/stats.md
</execution_context>

<process>
Execute the stats workflow from @~/.claude/get-shit-done/workflows/stats.md end-to-end.
</process>
```

**Rewrite:**
```md
@~/.claude/get-shit-done/workflows/stats.md
```

If a body is needed for extensibility, keep only a single `<constraints>` block for
command-level overrides. Do not repeat the objective or the process; they live in the
workflow.

---

### Rewrite 2 — Add audience declaration and conditional output format (Issues 2 and 3)

Add to the workflow's `<task>` block:

```xml
<task>
Gather project statistics from `.planning/` state and display them to the user in a
structured summary.

<audience>
A developer reading output in a terminal (human) or an orchestrating agent reading
the output programmatically. Use ${IS_SUBAGENT} to select the appropriate format.
</audience>
</task>
```

Then replace the hard-coded template in `present_stats` with a conditional:

```xml
<step name="present_stats">
${IS_SUBAGENT?
"Output a plain-text summary: milestone, phase counts (X/Y, Z%), plan counts (X/Y, Z%),
requirements (X/Y), git commits, and last activity date. One field per line, no emoji,
no markdown tables.":
"Render the statistics using this exact format:

# 📊 Project Statistics — {milestone_version} {milestone_name}

## Progress
[████████░░] X/Y phases (Z%)
...
"}
</step>
```

This satisfies §1 Action 2 (audience explicit), §7 Action 2 (format matched to
consumer), and §13 (conditional rendering via template variables).

---

### Rewrite 3 — Consolidate the duplicate task definition (Issue 1, §11 Action 3)

The `<task>` in the workflow and the `<objective>` in the command file describe the same
thing in different words. Consolidate into one canonical statement in the workflow and
remove the `<objective>` from the command file entirely (covered by Rewrite 1 above).
Within the workflow, ensure the `<task>` and `<quality_bar>` are co-located rather than
separated by the execution steps, so the model can hold both simultaneously when planning
its output. Current layout buries the quality bar after the output template, which the
model has already committed to by the time it reads it.

**Suggested workflow order:**
1. `<task>` (with `<audience>`)
2. `<quality_bar>` (move here, immediately after task)
3. `<context>`
4. `<execution_steps>`

This matches §8 Action 1 (task at start, highest attention) and §1 Action 1 (quality
bar co-located with task definition).

---

## Overall Verdict

**Adequate**

The workflow (`stats.md`) is well-structured: it uses XML tags correctly, specifies the
output format concretely, handles the error path, and provides a meaningful quality bar.
These are non-trivial things that many command files miss.

The command entry point (`commands/gsd/stats.md`) is mostly noise — it exists as a
delegation layer but adds no behavioral value and introduces a mild duplication risk.
The more significant gap is the absence of audience specification and conditional output
format handling, which makes the command unsuitable for agent-to-agent use cases without
modification.

Neither weakness is severe for an exclusively human-facing tool, but both become
correctness issues the moment another agent starts calling `/gsd-stats` programmatically.
Priority fix order: Rewrite 1 (eliminate duplication, low effort, immediate gain),
then Rewrite 2 (conditional format, medium effort, required for agent composability).
