# Critique: `commands/gsd/next.md`

Evaluated against: Prompt Engineering Guide V09

---

## Strengths

### §11 System vs. User Prompt Allocation — Frontmatter as agent configuration
The file uses YAML frontmatter to encode persistent agent properties (`name`, `description`, `allowed-tools`). This matches the guide's pattern for separating persistent configuration from task instructions (§11, YAML frontmatter section). Tool permissions are also scoped narrowly (`Read`, `Bash`, `Grep`, `Glob`, `SlashCommand`) rather than granting open-ended access, which aligns with Pattern 9 (§22) — minimum required permissions.

### §19 Modularity and Composition — Deferred execution via `@` reference
Routing the actual logic to `@~/.claude/get-shit-done/workflows/next.md` keeps this command file as a thin routing shim and places behavioral detail in a dedicated module. This is directionally consistent with §19's principle of single-responsibility prompt components.

### §1 Task Specification — Clear statement of what and why
The `<objective>` block states what the command does ("detect current project state and invoke the next step"), why it exists ("designed for rapid multi-project workflows"), and the `--force` flag behavior. The purpose is not buried. This partially satisfies §1 Action 1 (output, purpose, quality bar), though the quality bar is absent (see Weaknesses).

---

## Weaknesses

### §4 Formatting and Structure — Inconsistent and semantically weak tag usage
The file uses three tags: `<objective>`, `<execution_context>`, and `<process>`. None of these map to the guide's standard XML vocabulary (§4, XML tag vocabulary table). `<objective>` is closest to `<task>` but is not it. `<execution_context>` is closest to `<context>`. `<process>` is an invented tag for what is effectively a one-line instruction that repeats `<execution_context>`. Using non-standard tags means the model receives weaker structural signal — the guide explicitly states that tag names carry semantic meaning and that a shared vocabulary makes composed modules interoperable (§4 Action 2). The `<process>` block also directly duplicates the reference already present in `<execution_context>`, violating §11 Action 3 ("state each instruction exactly once").

**Severity: high.** The vocabulary drift is a systematic problem across this file.

### §1 Task Specification — Quality bar is missing
§1 Action 1 requires making explicit "(c) what a correct or high-quality response looks like." The `<objective>` block covers output (route to next step) and purpose (reduce overhead), but never defines what a good execution looks like: e.g., what the structured report must contain, what "silently" means in output terms, what constitutes a valid "defer to backlog" action. Without this, the model is left to infer correctness from vague phrases like "structured report" and "routes silently."

**Severity: high.** The output quality bar is fully absent.

### §5 Instruction Framing — Negative framing not converted; no priority ordering
The description "No arguments needed" is a negation used as a positive instruction — it tells the model what not to expect rather than how to behave when arguments are absent. Per §5 Action 1, this should be converted: e.g., "Infer all context from STATE.md, ROADMAP.md, and phase directories — no input from the user is required." Additionally, the command describes three options when incomplete work is found (defer, stop, force), but provides no priority ordering or tie-breaking rule. §5 (Priority ordering and Tie-breaking) requires explicit ranking when multiple paths are available. Which option should be the default? What does the cost asymmetry favor — stopping to preserve completeness, or deferring to maintain throughput?

**Severity: medium.** The missing tie-break leaves ambiguous behavior at the most decision-sensitive branch.

---

## Specific Rewrites

### Rewrite 1 — Replace non-standard tags with guide-standard vocabulary and eliminate duplication

Current:
```
<objective>
...
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/next.md
</execution_context>

<process>
Execute the next workflow from @~/.claude/get-shit-done/workflows/next.md end-to-end.
</process>
```

Suggested:
```xml
<task>
Detect the current project state and invoke the next logical GSD workflow step.
Infer all context from STATE.md, ROADMAP.md, and phase directories — no input from the user is required.

Supports `--force` flag to bypass safety gates (checkpoint, error state, verification failures, and prior-phase completeness scan).

Before routing, scan all prior phases for incomplete work: plans that ran without summaries, verification failures without overrides, and phases where discussion happened but planning never ran.

Execute the full workflow defined in:
@~/.claude/get-shit-done/workflows/next.md
</task>
```

This removes the `<execution_context>` / `<process>` duplication, uses the standard `<task>` tag, and converts the negative framing ("No arguments needed") into a positive instruction.

---

### Rewrite 2 — Add an explicit quality bar and tie-breaking rule for the incomplete-work branch

Add after the task description:

```xml
<quality_bar>
A correct execution:
- Reads STATE.md, ROADMAP.md, and phase directories before taking any action
- When prior phases are clean: routes to the next step with no user interruption
- When incomplete work is found: emits a structured report with each gap listed as: phase, plan name, and gap type (no summary / unresolved failure / planned but not executed)
- After showing the report, presents exactly three numbered options to the user and waits for a selection before proceeding
</quality_bar>

<constraints>
  <priority_order>
    When the incomplete-work report is shown and the user has not selected an option:
    1. Wait for explicit user selection — do not default to any option
    2. If --force was passed, skip the report entirely and advance without recording
  </priority_order>

  <tie_breaking>
    When it is unclear whether an incomplete item is a real gap or expected (e.g. a skipped optional plan):
    include it in the report. Reporting a false positive is less costly than silently advancing past genuine incomplete work.
  </tie_breaking>
</constraints>
```

---

### Rewrite 3 — Convert "No arguments needed" and surface the routing logic inline

The current file completely outsources logic to `workflows/next.md` with no summary of what routing decisions look like. Per §17 (self-contained agent prompts), each prompt should be independently understandable. A reader of this file cannot determine what "next step" means without opening a second file. Add a brief routing summary:

```xml
<context>
Routing logic (full detail in @~/.claude/get-shit-done/workflows/next.md):
- If no active phase exists → route to gsd:discuss-phase
- If discussion is complete but no plan exists → route to gsd:plan-phase
- If a plan exists but execution has not started → route to gsd:execute-phase
- If execution is complete but verification has not run → route to gsd:verify-work
- If all phases are complete → prompt user to run gsd:complete-milestone
</context>
```

Even a placeholder summary satisfies the self-containment principle and allows readers (and the model at invocation time) to understand the routing logic without resolving the `@` reference.

---

## Overall Verdict

**Needs Work.**

The command is structurally minimal and correctly defers implementation to a workflow file, but it fails on three criteria that matter most: (1) non-standard XML tags produce weaker structural signal than the guide's vocabulary would, (2) the quality bar for a correct execution is entirely absent, and (3) the most decision-sensitive branch (incomplete work found) has no tie-breaking rule or priority ordering. The file reads more like an internal routing stub than a production-grade prompt. The rewrites above are targeted and do not require restructuring the deferred-workflow architecture.
