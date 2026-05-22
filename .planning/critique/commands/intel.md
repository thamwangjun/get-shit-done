# Critique: `commands/gsd/intel.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09

---

## Strengths

### S1 — Concrete conditional branching (§5 Instruction Framing)

The argument dispatch table (Step 2) is an exemplary application of the guide's conditional instruction pattern. Each mode maps to a single, unambiguous action with no ambiguity about which branch fires. The `STOP` sentinels after each inline subcommand are explicit and leave no room for the model to "helpfully" continue into spawn territory.

### S2 — Anti-patterns block as a negative-to-positive complement (§14 Constraint Enforcement)

The `Anti-Patterns` section at the foot of the file pairs restrictions with reasoning (e.g., "it exits on missing keys"), which is more useful than a bare prohibition. The four rules are specific and non-overlapping. This satisfies the guide's "pair every restriction with what IS permitted" principle — the permitted path is already stated earlier in the same step, so the anti-pattern functions as a precise exclusion, not a dangling negative.

### S3 — Guard clause before the main logic (§5 Instruction Framing — conditional instructions)

Step 1 (Config Gate) runs before any operation and exits early with a user-actionable message. This is the correct structural decision: fail fast, display the enabling command, and stop. The decision tree is simple and the sentinel (`**STOP**`) is unambiguous.

---

## Weaknesses

### W1 — No `<task>` / XML structure; pure markdown prose (§4 Formatting and Structure)

The entire file is markdown with `##` headers. The guide mandates XML tags to separate sections because "the tag name carries semantic meaning, the structure is unambiguous and machine-parseable, and there is no collision with output formatting" (§4, Action 2). Markdown `##` headers have lower signal-to-noise for the model and may collide with output formatting.

The command currently has distinct functional regions — config gate, argument parsing, inline subcommands, agent spawn, post-refresh summary, anti-patterns — that map directly to guide vocabulary: `<task>`, `<constraints>`, `<scenarios>`, `<output_format>`. None of them use this vocabulary.

**Impact:** Medium. The command works, but misses structural clarity gains and is inconsistent with guide-recommended format for multi-phase workflows.

### W2 — Subagent prompt is an unstructured prose blob (§17 Agent and Subagent Patterns; §4 Formatting)

The `Task(prompt=...)` call in Step 3 delivers the agent's instructions as a flat prose string with a numbered list. The guide requires self-contained agent prompts to use `<task>`, `<goal>`, `<unit_task>`, `<constraints>`, and `<output_format>` sub-tags (§17, "Self-contained agent prompts"). The current prompt buries the success signal (`## INTEL UPDATE COMPLETE`) and failure signal (`## INTEL UPDATE FAILED`) inline with no output format specification. There is no explicit constraint on what tools the agent may use, what directories it may write to, or how to handle partial failures.

The guide also mandates that tool permissions be scoped to minimum required patterns (§22, Pattern 9). The spawned agent receives no `allowed-tools` or `disallowedTools` directive at all.

**Impact:** High. An unstructured subagent prompt is the most consequential weakness here — it leaves the agent's scope, permissions, and output format underspecified, which produces unpredictable behavior especially during failure paths.

### W3 — Output format for inline subcommands is qualitative, not specified (§7 Output Format Handling; §21 Tone and Style)

Step 2b (Status) instructs the model to display "each intel file with: File name / Last `updated_at` timestamp / STALE or FRESH status." Step 2c (Diff) says "display: Added entries / Removed entries / Changed entries." These are qualitative descriptions of output. The guide requires that output format be "specified completely and upfront" (§22, Pattern 3) with an example. Without a concrete example, the rendered output will vary across invocations.

The guide's size-constraint principle also applies: "numbered limits beat qualitative descriptors" (§21). The current instructions say nothing about output length, ordering, truncation for large diffs, or how many entries to show before summarising.

**Impact:** Medium. The user experience is inconsistent; the rendered status or diff table will look different each time the command runs.

---

## Specific Rewrites

### Rewrite 1 — Subagent prompt: add structure and output format (addresses W2)

Replace the current prose blob in Step 3 with a structured prompt:

```
Task(
  description="Refresh codebase intelligence files",
  prompt="""
<task>
  <goal>Analyze this codebase and write updated intelligence files to .planning/intel/.</goal>
  <unit_task>
    Write or update the following JSON intel files:
    - stack.json
    - api-map.json
    - dependency-graph.json
    - file-roles.json
    - arch-decisions.json

    Each file must contain a _meta object with an updated_at ISO timestamp.
  </unit_task>
  <constraints>
    - Write only to .planning/intel/. Do not modify any source files.
    - Use `gsd-sdk query intel.extract-exports <file>` to analyze source files.
    - Use `gsd-sdk query intel.patch-meta <file>` to update timestamps after writing.
    - Use `gsd-sdk query intel.validate` to validate output before completing.
    - Prefer gsd-sdk on PATH. Fallback: node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs
  </constraints>
  <output_format>
    End your response with exactly one of these two sentinel lines as plain text:

    ## INTEL UPDATE COMPLETE
    or
    ## INTEL UPDATE FAILED: <one-line reason>

    Do not omit the sentinel. Do not add markdown formatting around it.
  </output_format>
</task>

Project root: ${CWD}
"""
)
```

This separates goal, unit task, constraints, and output format — matching §17 and §22 Pattern 3 — and makes the failure path's output machine-readable.

### Rewrite 2 — Status output format: add a concrete example (addresses W3)

Replace the current Step 2b display instruction:

**Before:**
```
Parse the JSON output and display each intel file with:
- File name
- Last `updated_at` timestamp
- STALE or FRESH status (stale if older than 24 hours or missing)
```

**After:**
```
Parse the JSON output and render a status table in exactly this format:

| File               | Updated At           | Status |
|--------------------|----------------------|--------|
| stack.json         | 2026-04-29 14:32 UTC | FRESH  |
| api-map.json       | 2026-04-27 09:11 UTC | STALE  |
| dependency-graph.json | —                 | MISSING|

Rules:
- FRESH: updated_at is within the last 24 hours
- STALE: updated_at exists but is older than 24 hours
- MISSING: file does not exist or updated_at is absent
- Sort rows: MISSING first, then STALE, then FRESH
- Truncate file name to 30 characters if longer
```

This satisfies §22 Pattern 3 (output format with example) and §21 (numeric limits over qualitative descriptors).

### Rewrite 3 — Wrap top-level sections in XML tags (addresses W1)

The step sequence maps cleanly onto guide XML vocabulary. The outer structure should be:

```xml
<task>
  <!-- Step 0: Banner -->
  <!-- Step 1: Config gate -->
</task>

<scenarios>
  <scenario condition="mode == query">...</scenario>
  <scenario condition="mode == status">...</scenario>
  <scenario condition="mode == diff">...</scenario>
  <scenario condition="mode == refresh">...</scenario>
  <scenario condition="no argument or unrecognized">...</scenario>
</scenarios>

<constraints>
  <!-- Anti-patterns, rewritten as permitted/excluded pairs -->
  <permitted>
    - Run gsd-sdk query subcommands inline for query/status/diff
    - Read .planning/config.json directly
    - Spawn a Task agent for refresh only
  </permitted>
  <excluded>
    - Spawning an agent for query, status, or diff operations
    - Modifying intel files directly outside an agent
    - Using gsd-tools config get-value for the config gate
  </excluded>
</constraints>
```

This restructure does not require changing any logic — only wrapping the existing structure in semantically named tags.

---

## Overall Verdict

**Adequate**

The command's core logic is sound: the config gate, argument dispatch, inline vs. spawn branching, and early-exit sentinels are all correctly structured. The conditional logic is specific enough that the model is unlikely to misfire on the control flow. However, the subagent prompt in Step 3 is the most significant gap — it violates the self-contained agent prompt requirement (§17) and leaves scope, permissions, and output format unspecified in a way that will cause variability in production. The output format gaps for status/diff are a lesser but still visible issue. Neither gap requires architectural change; both are fixed by applying existing guide patterns (XML tags, structured subagent prompts, concrete output examples) to content that is already logically correct.
