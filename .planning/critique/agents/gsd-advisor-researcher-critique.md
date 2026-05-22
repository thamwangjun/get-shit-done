# Critique: gsd-advisor-researcher.md

**Agent:** `gsd-advisor-researcher.md`

**Date:** 2026-04-30

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 1, 2, 3, 5, 9)
- §23 Quick-Reference Checklist

---

## Strengths

### §7 / §22 Pattern 3 — Output format is fully specified upfront
The `<output_format>` block defines the exact 5-column table structure, provides a concrete template with placeholder tokens, defines each column's semantics, and adds prohibitions (no time estimates in Complexity, no single-winner ranking). This is a strong application of §7 Action 2 and §22 Pattern 3: "State the required output structure, field names, ordering, and an example before the model begins its task."

### §17 — Subagent context made explicit
The prompt explicitly states spawning context ("Spawned by `discuss-phase` via `Task()`"), caller relationship ("you return structured output for the main agent to synthesize"), and the reason the model should not address the user directly. This satisfies §17's requirement that each agent receive its full operating instructions directly and not rely on inherited context.

### §14 / `<anti_patterns>` block — Hard exclusions enumerated
The `<anti_patterns>` block enumerates specific prohibited behaviors as a list (7 items), covering column additions, time estimates, direct ranking, and scope creep. This is broadly aligned with §14's hard exclusion pattern, making the exclusions concrete rather than qualitative.

### §1 — Input contract made explicit
The `<input>` block lists every variable the agent will receive (`<gray_area>`, `<phase_context>`, `<project_context>`, `<calibration_tier>`), which satisfies §1 Action 1's requirement to make explicit what the task is and what constitutes high-quality output. The `<calibration_tiers>` block extends this by defining three distinct output shapes against those inputs.

### `<documentation_lookup>` — Operational fallback path provided
The fallback from MCP to CLI Bash is precise and actionable, including exact command syntax and the upstream bug reference. This reduces agent failure modes when the expected tool is unavailable — a practical form of robustness not explicitly covered by the guide but consistent with §17's self-contained agent principle.

---

## Weaknesses

### §4 — Markdown headers and `<role>` instead of standard XML tag vocabulary
The guide is explicit (§4 Action 2): "Use XML tags to separate prompt sections" and provides a canonical tag vocabulary (`<task>`, `<persona>`, `<constraints>`, `<output_format>`, `<context>`, `<examples>`). The agent uses `<role>` (not in the vocabulary), `<documentation_lookup>` (ad hoc), `<calibration_tiers>` (ad hoc), `<tool_strategy>` (ad hoc), and `<anti_patterns>` (ad hoc). None of these are canonical tags from §4's vocabulary table. Shared vocabulary "makes composed prompts predictable and composed modules interoperable" — non-standard tags forfeit that benefit.

**Specific divergences:**
- `<role>` should be `<persona>`
- `<documentation_lookup>` has no canonical tag; its content belongs inside `<context>` or a `<constraints>` sub-block
- `<tool_strategy>` is a constraint on tool use; the guide maps this to `<constraints>` with `<permitted>` / `<priority_order>` sub-tags
- `<anti_patterns>` is a constraint block; should be `<constraints><exclusions>` per §14

### §6 — Persona is generic and does not constrain register or voice
The `<role>` block reads: "You are a GSD advisor researcher. You research ONE gray area and produce ONE comparison table with rationale." This is a task description masquerading as a persona. Per §6 Action 2: "Generic expert framing... produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The agent has no voice constraints, no tone specification, and no explicit communication register. §6 also requires that the persona constrain *how* the agent communicates, not only *what* it does.

Additionally, the persona does not use the Strengths listing pattern from §6: "Explicitly enumerate what the agent is good at. This biases behavior toward those capabilities."

### §8 — Context placement order is not task-first / input-last
The guide (§8 Actions 1–3) requires: instruction leads → background context in the middle → primary input at the end. The agent's structure is:

1. `<role>` (task)
2. `<documentation_lookup>` (procedural rules)
3. `<input>` (describes input variables — but does not contain the actual injected values)
4. `<calibration_tiers>` (behavioral branching rules)
5. `<output_format>` (output spec)
6. `<rules>` (more constraints)
7. `<tool_strategy>` (tool priority)
8. `<anti_patterns>` (exclusions)

The `<output_format>` block — which is effectively part of the core task instruction — is buried in position 5 of 8 blocks. The `<rules>` and `<tool_strategy>` blocks follow the output format, fragmenting what should be a coherent task instruction at the top. The actual input (`<gray_area>`, `<phase_context>`, etc.) is described but not placed in the "end of prompt" position that §8 recommends for recency bias.

### §5 — Multiple negative instructions not converted to positive equivalents
The guide (§5 Action 1) requires converting "do not", "avoid", "never" instructions to positive equivalents. The agent contains at least 8 unresolved negatives:

- `<rules>` line 4: "NEVER time estimates"
- `<rules>` line 5: "Not single-winner ranking"
- `<anti_patterns>`: "Do NOT research beyond...", "Do NOT present output directly...", "Do NOT add columns...", "Do NOT use time estimates...", "Do NOT rank options...", "Do NOT invent filler options...", "Do NOT produce extended analysis..."

Per §5: "Rewrite each [negative instruction] as a positive specification of the desired behavior." For example: "Do NOT add columns beyond the 5-column format" → "Include exactly five columns: Option, Pros, Cons, Complexity, Recommendation." The ratio of negative to positive constraint framing in the `<anti_patterns>` block is 7:0.

### §11 / §22 Pattern 9 — No frontmatter `agentMetadata` block; tool permissions use whole-tool grants
The guide (§11) specifies that YAML frontmatter should encode `agentType`, `model`, `permissionMode`, `disallowedTools`, `whenToUse`, and `criticalSystemReminder`. The agent's frontmatter contains only `name`, `description`, `tools`, and `color`. Missing fields include:
- `agentMetadata.agentType`
- `agentMetadata.whenToUse` (the trigger description for the orchestrating model)
- `agentMetadata.criticalSystemReminder`

The `tools:` line lists `Read, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*` — these are whole-tool grants. §22 Pattern 9 requires the narrowest patterns that satisfy the task: "Narrow permissions make the skill's intended behavior explicit, limit blast radius if the agent goes off-path, and make permission grants auditable at a glance." `Bash` with no prefix restriction grants arbitrary shell access, which exceeds what the research task requires.

### §22 Pattern 2 — No calibrating examples for qualitative instructions
The output format specifies content norms like "comma-separated within cell", "conditional rec", and "paragraph grounding recommendation in project context" — but provides zero examples. Per §22 Pattern 2: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable." There is a table template, but no worked example showing what a good row looks like end-to-end (e.g., a real option with real pros/cons/complexity/recommendation text filled in).

### §1 Action 2 — Audience is not encoded
The guide requires: "Identify the audience... Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring." The agent's consumer is the `discuss-phase` main agent (not a human), and the synthesized output will eventually reach a developer. Neither audience is acknowledged. Since the output is machine-to-machine (subagent → orchestrator), the vocabulary and formatting standards needed for reliable parsing by the parent agent should be stated explicitly.

---

## Concrete Improvements

### 1. Adopt canonical XML tag vocabulary (fixes §4 weakness)

Replace non-standard tags with the guide's vocabulary:

```xml
<persona>
You are a focused research specialist for GSD advisor decisions.
Your strengths:
- Rapidly identifying the genuinely viable options for a technical gray area
- Grounding recommendations in project-specific context rather than generic best practices
- Producing structured, parseable comparison tables that require no reformatting
Output is consumed by a parent agent, not the user — write for machine synthesis.
</persona>

<constraints>
  <permitted>
    - Read any file in the repository (Read, Glob, Grep, Bash read-only commands)
    - Query Context7 for library documentation
    - Fetch official documentation pages via WebFetch
    - Search the web via WebSearch for community patterns and ecosystem signals
  </permitted>
  <exclusions>
    1. Research beyond the single assigned gray area
    2. Columns beyond the five defined: Option, Pros, Cons, Complexity, Recommendation
    3. Time estimates in the Complexity column — use impact surface and risk only
    4. Single-winner rankings — use conditional recommendations ("Rec if X")
    5. Filler options invented to pad the table — only genuinely viable approaches
    6. Analysis paragraphs beyond the single rationale paragraph
  </exclusions>
  <priority_order>
    1. Context7 (library APIs, features, configuration, versions) — HIGH trust
    2. WebFetch (official docs not in Context7, changelogs) — HIGH-MEDIUM trust
    3. WebSearch (ecosystem patterns, community signals) — requires verification
  </priority_order>
</constraints>
```

### 2. Convert all negative instructions to positive equivalents (fixes §5 weakness)

Replace the `<anti_patterns>` block entirely — fold its content into `<constraints><exclusions>` (see above) using positive framing where possible:

| Current (negative) | Positive rewrite |
|---|---|
| "Do NOT add columns beyond the 5-column format" | "Include exactly five columns: Option, Pros, Cons, Complexity, Recommendation" |
| "Do NOT use time estimates in the Complexity column" | "Express Complexity as impact surface and risk only (e.g., '3 files, new dep — Risk: memory, scroll state')" |
| "Do NOT rank options or declare a single winner" | "Express each recommendation conditionally: 'Rec if X', 'Rec if Y'" |
| "Do NOT produce extended analysis paragraphs" | "Limit written analysis to one rationale paragraph following the table" |

### 3. Add a worked example to calibrate output quality (fixes §22 Pattern 2 weakness)

Inside `<output_format>`, add a concrete filled-in example after the template:

```xml
<output_format>
Return EXACTLY this structure:

## {area_name}

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| {option} | {pros} | {cons} | {surface + risk} | {conditional rec} |

**Rationale:** {paragraph grounding recommendation in project context}

<example>
## State management approach

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| Zustand | Minimal API, no boilerplate, tree-shakeable | No devtools by default, less familiar to Redux users | 2 files, new dep — Risk: store coupling if not namespaced | Rec if team prefers minimal setup and app state is simple |
| Redux Toolkit | Mature, excellent devtools, large ecosystem | Boilerplate even with RTK, heavier bundle | 5 files, new dep — Risk: over-engineering for small state | Rec if complex async flows or time-travel debugging required |

**Rationale:** Given the project is a single-page tool with limited async state, Zustand's minimal footprint aligns better with the keep-it-simple constraint in the phase context. Redux Toolkit would be justified only if the roadmap adds multi-step async workflows requiring replay.
</example>
</output_format>
```

### 4. Add `agentMetadata` to frontmatter and scope Bash permissions (fixes §11 / Pattern 9 weakness)

```yaml
---
name: gsd-advisor-researcher
description: Researches a single gray area decision and returns a structured comparison table with rationale. Spawned by discuss-phase advisor mode.
tools: Read, Bash(npx:*), Bash(git log:*), Bash(cat:*), Bash(find:*), Grep, Glob, WebSearch, WebFetch, mcp__context7__*
color: cyan
agentMetadata:
  agentType: subagent
  whenToUse: >
    Use to research a single gray-area technical decision and produce a structured
    5-column comparison table. Always spawned by discuss-phase; never invoked directly.
  criticalSystemReminder: >
    CRITICAL: Return structured markdown output only. Do not address the user directly.
    Do not expand research beyond the single assigned gray area.
---
```

### 5. Reorder blocks for task-first / input-last structure (fixes §8 weakness)

Recommended block order:

1. `<persona>` — who the agent is and communication register
2. `<task>` — what it must produce (core instruction, including output format)
3. `<constraints>` — exclusions, tool priority, permission pairs
4. `<calibration_tiers>` — behavioral branching (middle position: helpful but not critical)
5. `<context>` — documentation lookup fallback (background, middle position)
6. `<input>` — the actual injected runtime variables (end position for recency bias)

---

## Overall Score: 5 / 10

**Justification:** The agent does several things well — it is explicit about its subagent role, defines a fully specified output format, and provides a workable calibration tier system. However, it diverges from guide best practices in ways that are systematic rather than incidental: non-canonical tag vocabulary across every section, a persona that does not constrain register or enumerate strengths, 8+ unresolved negative instructions, no calibrating examples, a context placement order that buries the output format mid-prompt, incomplete frontmatter `agentMetadata`, and over-broad Bash tool permissions. The weaknesses are concentrated in the most foundational guide sections (§4, §5, §6, §8) and would each require targeted rewrites. With those fixes applied, the agent's strong output format and subagent self-containment would bring the score to the 7–8 range.
