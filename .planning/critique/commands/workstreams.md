# Critique: `commands/gsd/workstreams.md`

**Guide version referenced:** Prompt Engineering Guide V09
**Verdict:** Needs Work

---

## Strengths

### Procedural step sequencing (§16 Multi-Phase Workflows)
The command is organized into three explicit numbered steps (Parse Subcommand, Execute Operation, Display Results). This reflects the phase-pattern principle from §16: named stages create cognitive boundaries so the model completes each fully before moving on. The step structure is a genuine asset.

### Conditional branching by subcommand (§5 Instruction Framing — Conditional Instructions)
The `###` headers for each subcommand (`list`, `create`, `status`, etc.) function as branching logic: one block of instructions per execution path. This aligns with §5's directive to "use explicit conditional branching when behavior depends on context." The concrete SDK call shown for each path removes ambiguity.

### Fallback default specified (§5 Instruction Framing)
"If no subcommand given, default to `list`" is a clean, unambiguous default rule. §5 endorses explicit conditional defaults over leaving them implicit.

---

## Weaknesses

### W1 — No XML structural tags; plain markdown used throughout (§4 Formatting and Structure)

The entire prompt body uses prose and markdown headings (`##`, `###`). §4 Action 2 is explicit: "When a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag." The guide states this is "strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable."

The command has clearly separable sections — a task description, per-operation instructions, and output handling — but none are wrapped in `<task>`, `<context>`, `<output_format>`, or equivalent tags. This is a structural miss against the most directive rule in §4.

### W2 — Output format for `Display Results` is underspecified (§7 Output Format Handling, §22 Pattern 3)

Step 3 says "Format the JSON output from gsd-sdk query into a human-readable display" and "Include the `${GSD_WS}` flag in any routing suggestions." This is the entire output specification. §7 and §22 Pattern 3 require output format to be "specified completely and upfront" — including structure, field names, ordering, and at least one example. The workstreams command deals with tabular data (name, status, phase, progress) but never defines what columns the table has, what a complete display looks like for each subcommand, or what "routing suggestions" look like in practice. A model will invent a format each call.

### W3 — No output format example for any subcommand, no calibrating examples anywhere (§22 Pattern 2, §3 Few-Shot Example Construction)

§22 Pattern 2: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." §3 Action 1–3 call for examples ordered by complexity, semantically similar to the test input. The command gives zero examples — no sample `list` table, no sample `create` success message, no sample `status` detail block. The instruction "Display the workstreams in a table format showing name, status, current phase, and progress" is qualitative without a calibrating instance. The guide is explicit that qualitative terms without examples are unmeasurable and produce variable output.

### W4 — Negative-adjacent framing in `switch` (§5 Instruction Framing Action 1)

"Also set `GSD_WORKSTREAM` for the current session when the runtime supports it" and "If the runtime exposes a session identifier, GSD also stores the active workstream session-locally so concurrent sessions do not overwrite each other" describe runtime-conditional behavior using hedged prose ("when the runtime supports it," "if the runtime exposes"). §5 calls for explicit conditional branching with a clear branch for the YES and NO case. Currently, the NO case — what to do when the runtime does not support it — is entirely omitted.

---

## Specific Rewrites

### Rewrite 1: Add XML structure (addresses W1)

Replace the flat markdown structure with semantically tagged sections. Minimum viable form:

```xml
<task>
Manage parallel workstreams for concurrent milestone work.
Parse the user's subcommand and execute the corresponding operation.
If no subcommand is given, default to `list`.
</task>

<context>
Subcommand reference:
- list   — List all workstreams with status
- create — Create a new workstream
- status — Detailed status for one workstream
- switch — Set active workstream
- progress — Progress summary across all workstreams
- complete  — Archive a completed workstream
- resume    — Resume work in a workstream
</context>

<output_format>
[See Rewrite 2 below]
</output_format>
```

This is not cosmetic. The tag name tells the model what each block _is_, not just where it appears. `<task>` signals the primary directive; `<context>` signals supplementary reference; `<output_format>` signals constraints on the response.

---

### Rewrite 2: Specify output format with concrete examples (addresses W2 and W3)

Replace the vague Step 3 with a fully specified `<output_format>` block that shows an example for the `list` subcommand (the default and most common path) and defines the table schema:

```xml
<output_format>
For `list` and `progress`: render a markdown table. Required columns:

| Workstream | Status | Current Phase | Progress |
|------------|--------|---------------|----------|
| feature-x  | active | 3 — Build API | 2/5 done |
| bugfix-y   | paused | 1 — Research  | 0/3 done |

- Status values: active, paused, complete, archived
- Progress: "N/M done" where N = completed plans, M = total plans in current phase
- If no workstreams exist, output: "No workstreams found. Run `/gsd-new-milestone --ws <name>` to create one."

For `create`: output a single confirmation line followed by next-step suggestions:
  Created workstream: <name> at .planning/workstreams/<name>/
  Next: /gsd-new-milestone --ws <name>

For `status`: output phase breakdown in a numbered list with plan-level detail.
For `complete`: confirm archival with: "Workstream <name> archived to milestones/."
</output_format>
```

This satisfies §22 Pattern 3 ("A fully specified format produces consistent, parseable output") and §7 Action 1 (reasoning before format).

---

### Rewrite 3: Make `switch` branching explicit (addresses W4)

Replace the hedged prose for `switch` with an explicit conditional block per §5:

```
### switch
Run: `gsd-sdk query workstream.set <name> --raw --cwd "$CWD"`

Set the active workstream for this session:
- If the runtime exposes a writable `GSD_WORKSTREAM` environment variable: set it to <name> so all subsequent GSD commands route to this workstream automatically.
- If the runtime does not support environment mutation: display a warning — "Session variable cannot be set. Pass `--ws <name>` explicitly to each command."

Confirm the switch with: "Active workstream set to: <name>"
```

This gives the model a defined action for both branches (YES and NO) rather than leaving the NO case implicit.

---

## Overall Verdict: Needs Work

The command is structurally coherent and its three-step sequencing follows good phase-pattern discipline (§16). The per-subcommand SDK calls are concrete and correct. However, it fails the three most impactful guide requirements:

1. No XML structural tagging (§4) — the guide treats this as non-negotiable for Claude-class models.
2. Underspecified and unexampled output format (§7, §22 Pattern 3) — the display will vary per invocation.
3. Zero calibrating examples anywhere (§22 Pattern 2, §3) — the model has no demonstrated standard to match against.

These are not stylistic preferences; they are the guide's highest-signal levers for output consistency. The fixes are mechanical and well-scoped — the command's underlying logic is sound and does not need to be redesigned.
