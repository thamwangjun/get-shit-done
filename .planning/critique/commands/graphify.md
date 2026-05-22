# Critique: `commands/gsd/graphify.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Verdict:** Adequate

---

## Strengths

### §4 Formatting and Structure — Sections are visually separated with coherent headings

The command uses markdown headers (`## Step 0`, `### Step 2a`, etc.) to create clear cognitive boundaries between phases. The dispatch table in Step 2 maps arguments to actions in one glance. Anti-Patterns at the end cleanly enumerate what not to do. These are positive structural choices, even if they do not use XML tags (see Weaknesses).

### §16 Multi-Phase Workflows — Explicit named phases with gate conditions

The command follows the spirit of §16's phase pattern: each step has a defined entry condition, a body of work, and a termination rule (`**STOP**` after each inline mode). The preflight check before spawning the agent (Step 3) matches the required-steps-before-type-specific pattern from §16.

### §14 Constraint Enforcement — Anti-Patterns section pairs restrictions with context

The four Anti-Patterns at the end are direct prohibitions, but each one is specific enough to be actionable ("DO NOT use `gsd-tools config get-value` for the config gate — it exits on missing keys"). This is closer to §14's precedent-style rulings than generic "don't do X" filler.

### §17 Agent and Subagent Patterns — Agent task is scoped and self-contained

The Task spawned in Step 3 includes the project root, the tools path, and a numbered 5-step build sequence. The agent receives enough context to operate without relying on inherited state. This matches §17's "self-contained agent prompts" requirement.

---

## Weaknesses

### Issue 1: §4 Formatting — Markdown headers instead of XML tags for prompt sections

The guide is explicit (§4, Action 2): "When a prompt contains multiple distinct sections… wrap each in a semantically named XML tag." The `graphify.md` command uses `## Step N` markdown headers throughout. This applies to the outer command structure and critically to the spawned Task prompt itself, which is written as inline prose with no `<task>`, `<context>`, `<constraints>`, or `<output_format>` wrapping.

Markdown headers are explicitly contrasted with XML tags in §4: "This is strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable."

The spawned agent prompt in Step 3 is the highest-stakes text in this command — it is what the model actually executes. It has no structured wrapping at all.

### Issue 2: §5 Instruction Framing — Negative instructions not converted to positive equivalents

The Anti-Patterns section and scattered `DO NOT` directives throughout violate §5, Action 1: "Before emitting any prompt, scan for negated instructions… Rewrite each as a positive specification of the desired behavior."

Offending instances:
- `DO NOT spawn an agent for query/status/diff operations`
- `DO NOT modify graph files directly`
- `DO NOT skip the config gate check`
- `DO NOT use gsd-tools config get-value for the config gate`
- `**DO NOT READ THIS FILE**` (opening banner)
- `Do not spawn an agent.` (Steps 2a, 2b, 2c)

The guide's conversion table (§5) gives the exact pattern to follow. These should be positive behavioral specs, not prohibitions.

### Issue 3: §1 Task Specification / §22 Pattern 3 — No output format specified for the spawned agent

The spawned Task in Step 3 defines a process (steps 1–5) but does not specify a structured output format. The only output guidance is two terminal-state strings:
- `## GRAPHIFY BUILD COMPLETE with the summary counts`
- `## GRAPHIFY BUILD FAILED with details`

There is no schema for "summary counts" — the agent must infer what counts to include, in what order, and how to format them. §22 Pattern 3 requires output format to be "specified completely and upfront," including field names, ordering, and an example. §7 (Action 1) further recommends eliciting reasoning then formatting, which is not addressed for this agent at all.

The query display logic (Step 2a) has the same gap: "display matched nodes grouped by type, with edge relationships and confidence tiers" — but no example output is provided to calibrate the format.

---

## Specific Rewrites

### Rewrite 1: Wrap the spawned Task prompt in XML tags (fixes Issue 1)

Replace the inline prose Task prompt in Step 3 with a structured XML prompt. Current form (abbreviated):

```
prompt="You are the graphify-builder agent. Your job is to build or rebuild the project knowledge graph using the graphify CLI.

Project root: ${CWD}
...

## Instructions
1. Invoke graphify: ...
2. Validate output: ...
"
```

Rewrite:

```xml
prompt="<persona>
You are the graphify-builder agent, a build specialist responsible for constructing and
validating the project knowledge graph.
</persona>

<context>
Project root: ${CWD}
gsd-tools path: $HOME/.claude/get-shit-done/bin/gsd-tools.cjs
Timeout: up to 5 minutes (or as configured via graphify.build_timeout)
</context>

<task>
Build or rebuild the project knowledge graph by executing these steps in order:

1. Run graphify from the project root: `graphify . --update`
2. Validate that graphify-out/graph.json exists and parses as valid JSON with nodes[] and edges[].
3. Copy artifacts: graph.json, graph.html, GRAPH_REPORT.md → .planning/graphs/
4. Write diff snapshot: `node \"$HOME/.claude/get-shit-done/bin/gsd-tools.cjs\" graphify build snapshot`
5. Run status check: `node \"$HOME/.claude/get-shit-done/bin/gsd-tools.cjs\" graphify status`
</task>

<constraints>
Write to .planning/graphs/ only via the copy commands above. Write graph files through the
build process only; direct modification of .planning/graphs/ contents is out of scope.
If graphify exits non-zero or graph.json is unparseable, preserve prior graph files and report failure.
</constraints>

<output_format>
On success, output exactly:

## GRAPHIFY BUILD COMPLETE
- Nodes: <count>
- Edges: <count>
- Hyperedges: <count>
- Build time: <timestamp from status output>

On failure at any step, output exactly:

## GRAPHIFY BUILD FAILED
- Step: <step number that failed>
- Error: <stderr or parse error>
</output_format>"
```

This satisfies §4 (XML sections), §6 (specific persona), §14 (constraints stated positively), and §22 Pattern 3 (output format with field names).

---

### Rewrite 2: Convert Anti-Patterns to positive constraints (fixes Issue 2)

Remove the Anti-Patterns section. Replace with a `<constraints>` block placed before Step 2 (per §8, which places constraints in middle position, not trailing):

Current:

```markdown
## Anti-Patterns

1. DO NOT spawn an agent for query/status/diff operations -- these are inline CLI calls
2. DO NOT modify graph files directly -- the build agent handles writes
3. DO NOT skip the config gate check
4. DO NOT use gsd-tools config get-value for the config gate -- it exits on missing keys
```

Rewrite:

```xml
<constraints>
- Run query, status, and diff operations as inline CLI calls within the conversation turn.
- Delegate all graph file writes to the build agent spawned in Step 3.
- Complete the config gate check in Step 1 before all other steps.
- Read .planning/config.json directly with the Read tool for the config gate;
  gsd-sdk config get-value exits non-zero on missing keys and will abort the command.
</constraints>
```

Also convert the six scattered `DO NOT` / `Do not` phrases in Steps 2a–2c and Step 3 to positive equivalents using the same pattern.

---

### Rewrite 3: Add a concrete output example for query results (fixes Issue 3 for Step 2a)

Step 2a currently says:

> "display matched nodes grouped by type, with edge relationships and confidence tiers (EXTRACTED/INFERRED/AMBIGUOUS)"

Add an `<output_format>` block with a concrete example immediately after the prose:

```xml
<output_format>
Display query results in this format:

**Graph matches for '<term>'**

**<node-type>** (e.g. Component, Phase, File)
- `<node-id>`: <node label>
  - <confidence-tier>: <edge type> → <related node label>

Example:
**Graph matches for 'graphify'**

**Phase** (2 nodes)
- `phase-3`: Knowledge Graph Build
  - EXTRACTED: depends_on → GSD Tools CLI
  - INFERRED: produces → .planning/graphs/graph.json

**File** (1 node)
- `file-42`: commands/gsd/graphify.md
  - EXTRACTED: implements → Knowledge Graph Build
</output_format>
```

This satisfies §22 Pattern 3 (output format with an example) and §1 Action 1c (quality bar made explicit).

---

## Overall Verdict

**Adequate.**

The command's logic is sound: the config gate, argument dispatch, inline vs. agent branching, and the five-step build sequence are all correct and clearly ordered. The structural architecture (§16) and agent self-containment (§17) are well-handled relative to many production prompts.

The gaps are real but fixable. The two highest-severity issues are (1) the spawned agent prompt lacks XML structure and an output schema — making its output format implicit and variable — and (2) the pervasive `DO NOT` framing violates a basic §5 rule that can be mechanically corrected. Neither flaw corrupts the command's logic; both degrade consistency and parseability of agent output at runtime.

Priority order for fixes: Issue 3 (output format for agent) → Issue 1 (XML wrapping of agent prompt) → Issue 2 (negative-to-positive instruction conversion).
