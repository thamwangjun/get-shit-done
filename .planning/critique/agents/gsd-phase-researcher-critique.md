# Critique: gsd-phase-researcher.md

**Agent:** `agents/gsd-phase-researcher.md`
**Critique date:** 2026-04-30
**Guide version evaluated against:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

The following guide sections apply to this agent file:

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
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 1, 2, 3, 5, 7, 9)
- §23 Quick-Reference Checklist

---

## Strengths

### §16 Multi-Phase Workflows — Explicit numbered phases with clear triggers
The `<execution_flow>` section organizes work into eight numbered steps (Step 1 through Step 8). Each step is named and scoped. Conditional skip conditions are present (e.g., "Skip if: workflow.nyquist_validation is explicitly set to false"). This matches the guide's phase pattern recommendation directly.

### §14 Constraint Enforcement — Explicit permission pairs and precedent-style rulings
The `<upstream_input>` and `<downstream_consumer>` sections create an unusually clear specification of what is in scope vs. out of scope, with the table format making the boundaries machine-readable:
> "| **Decisions** | Locked choices — research THESE, not alternatives |"
> "| **Deferred Ideas** | Out of scope — ignore completely |"
This is consistent with §14's guidance on scope filters and hard exclusions.

### §5 Instruction Framing — Explicit conditional branching
Several sections encode runtime conditionals clearly. Steps 2.5 and 2.6 both begin with "**Trigger:** …" lines that state the exact condition under which that step applies. This matches the guide's conditional instruction pattern ("If X, do Y").

### §22 Pattern 7 — Domain-specific memory instructions with typed examples (partial)
The `<philosophy>` section and `<verification_protocol>` demonstrate domain-specific enumeration of failure modes — "Configuration Scope Blindness", "Deprecated Features", "Negative Claims Without Evidence", "Single Source Reliance" — each with Prevention sub-fields. These are concrete, typed categories consistent with the guide's directive to avoid generic instructions.

### §7 Output Format Handling — Output structure specified completely and upfront
The `<output_format>` section provides a full RESEARCH.md template with every section pre-specified, including column headers for all tables. The guide's Pattern 3 calls for this: "State the required output structure, field names, ordering, and an example before the model begins its task."

### §14 Constraint Enforcement — Confidence thresholds are numeric, not qualitative
The `<source_hierarchy>` and `<tool_strategy>` sections assign numeric-equivalent calibration levels (HIGH/MEDIUM/LOW) to each source type and define the upgrade path:
> "Do multiple sources agree? → YES: Increase one level"
This operationalizes confidence rather than leaving it vague.

### §17 Agent and Subagent Patterns — Frontmatter with tool permissions
The YAML frontmatter includes `tools:` with a scoped list. §22 Pattern 9 calls for "the narrowest patterns that satisfy the task" — the list here is reasonably narrow (Read, Write, Bash, Grep, Glob, WebSearch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__*).

### §16 Round-based interviews / Scenario-based branching
The structured return section defines two clearly differentiated output states (`## RESEARCH COMPLETE` and `## RESEARCH BLOCKED`), each with a fixed format. This is consistent with the guide's scenario-based branching pattern from §16.

---

## Weaknesses

### W1 — §6 Persona Assignment: Generic role description, no strengths enumeration
**Severity: High**

The `<role>` tag opens with:
> "You are a GSD phase researcher."

This is generic expert framing. The guide (§6 Action 2, §22 Pattern 1) explicitly states that generic framing ("you are an expert X") produces no measurable behavioral gain. The guide requires: (a) a specific, role-constrained persona that constrains register and voice, and (b) an explicit "Your strengths:" enumeration to bias behavior toward target capabilities.

The current text lists responsibilities (`**Core responsibilities:**`) but not strengths — these are different. Responsibilities tell the model what to do; strengths tell the model what it is good at and bias it toward those behaviors. The guide's example (§6, "Strengths listing") shows the distinction clearly.

**Quote from agent:**
> "You are a GSD phase researcher. You answer 'What do I need to know to PLAN this phase well?' and produce a single RESEARCH.md that the planner consumes."

This framing is task-oriented, not persona-constrained. It does not specify voice, register, or domain-specific style.

---

### W2 — §4 Formatting and Structure: Mixed XML tags and markdown headers throughout
**Severity: High**

The guide (§4 Action 2) states XML tags are "strictly better than markdown headers or `---` delimiters for Claude-class models." The agent mixes XML tags at the top level (`<role>`, `<documentation_lookup>`, `<execution_flow>`) with markdown headers inside those blocks (`## Step 1: ...`, `## Tool Priority`, `## Claude's Training as Hypothesis`). This is structurally inconsistent.

Inside `<execution_flow>`, the steps are numbered with markdown (`## Step 1`, `## Step 2.5`). Inside `<output_format>`, the RESEARCH.md template uses markdown headers. Inside `<tool_strategy>`, there are both markdown `##` headers and bold text as sub-headers. The guide's XML vocabulary (§4 "XML tag vocabulary") provides `<phase>`, `<round>`, `<scenario>` and other workflow tags that are not used here despite the agent being a multi-step workflow.

**Quote from agent:**
> `<execution_flow>`
> `## Step 1: Receive Scope and Load Context`
> `## Step 1.3: Load Graph Context`
> `## Step 2: Identify Research Domains`

These are phases in the guide's sense — they should use `<phase id="1" name="...">` tags, not markdown headers inside an XML block.

---

### W3 — §5 Instruction Framing: Negative instructions not converted to positive equivalents
**Severity: Medium**

The guide (§5 Action 1) requires scanning for negated instructions and converting them to positive specifications. Multiple negative instructions remain unconverted in the agent:

**Quotes from agent:**
> "Don't explore alternatives to locked decisions."
> "Never present assumed knowledge as verified fact"
> "Do not skip documentation lookups because MCP tools are unavailable"
> "**Avoid:** Padding findings, stating unverified claims as facts, hiding uncertainty behind confident language."
> "never use `Bash(cat << 'EOF')` or heredoc commands for file creation"

The guide's conversion table applies here:
- "Don't explore alternatives to locked decisions" → "Research only the locked decisions from CONTEXT.md"
- "Never present assumed knowledge as verified fact" → "Tag all claims from training data as [ASSUMED]"
- "Do not skip documentation lookups" → "Always attempt documentation lookup via CLI fallback when MCP is unavailable"
- "Avoid padding findings" → "Report findings with the confidence level they earned; stop when the research domain is covered"

The exception in §5 is the "reframe pattern" (§6 "The reframe pattern") — a negative clause is valid when it explicitly displaces a prior. "Your job is NOT X — it's Y" is valid. The flat "never" and "avoid" directives above do not follow that pattern.

---

### W4 — §8 Context Placement: Task instruction does not lead the prompt
**Severity: Medium**

The guide (§8 Action 1) states: "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning of their context. The instruction must always lead."

The agent's structure is:
1. YAML frontmatter (metadata)
2. `<role>` — closest to a task statement, but framed as identity, not instruction
3. `<documentation_lookup>` — procedural detail, not task definition
4. `<project_context>` — background context
5. `<upstream_input>` — more context
6. `<downstream_consumer>` — more context
7. `<philosophy>` — principles
8. `<tool_strategy>` — tool usage
9. `<source_hierarchy>` — more tool guidance
10. `<verification_protocol>` — quality checks
11. `<output_format>` — output spec
12. `<execution_flow>` — the actual step-by-step instructions

The core task (produce RESEARCH.md by following steps 1–8) is buried in the last section. The guide's recommended structure places `<task>` first, context in the middle, and primary input last. Here the task instruction (`<execution_flow>`) is at position 12 of 14 sections — the opposite of the guide's recommendation.

---

### W5 — §1 Task Specification: Quality bar and audience not explicit
**Severity: Medium**

The guide (§1 Action 1) requires three explicit components: (a) what output is requested, (b) why it matters, and (c) what a correct/high-quality response looks like. §1 also requires audience identification.

The agent encodes (a) and (b) implicitly via `<downstream_consumer>` and `<role>`, but the quality bar is distributed across `<success_criteria>`, `<philosophy>`, and `<verification_protocol>` rather than stated once as a calibrating standard. The guide's `<quality_bar>` tag is absent.

The audience — `gsd-planner` — is named in `<downstream_consumer>` but not encoded in the guide's sense: its domain knowledge, vocabulary level, and assumptions are not described. The guide (§1 Action 2) asks: "Ask or infer who will consume the output. Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

---

### W6 — §10 Prompt Length and Compression: Prompt is significantly over-length
**Severity: Medium**

The guide (§10 Action 1) states: "Remove redundant instructions, repeated context, and boilerplate that does not contribute to the task before sending. Length degrades performance independently of content quality."

The agent contains multiple redundancies:

1. The confidence level system (HIGH/MEDIUM/LOW) is defined in at least four separate locations: `<role>` (claim provenance), `<tool_strategy>` (verification protocol), `<source_hierarchy>`, and `<output_format>` (Metadata section). One canonical definition with references would suffice.

2. The CONTEXT.md constraint table appears in three places: `<upstream_input>`, `<project_context>`, and `<execution_flow>` Step 1.

3. The instruction "Use Write tool, never heredoc" (Step 6) is stated in the step, but the pre-submission checklist in `<verification_protocol>` and `<success_criteria>` do not reference it — meaning the file creation rule is isolated rather than reinforced via the checklist.

4. `<verification_protocol>`'s "Pre-Submission Checklist" substantially overlaps with `<success_criteria>`'s checklist. These could be one list.

The guide (§22 Pattern 5) additionally calls for decomposing large prompts into atomic, single-responsibility modules. This agent is a monolith of ~840 lines covering persona, tool routing, output format, execution steps, quality checks, and return structures in a single file.

---

### W7 — §11 System vs. User Prompt Allocation: Each instruction not in exactly one location
**Severity: Low-Medium**

The guide (§11 Action 3) states: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

The CONTEXT.md constraint instructions appear in:
- `<upstream_input>` (table form)
- `<project_context>` Step instruction ("If CONTEXT.md exists, it constrains your research scope")
- `<execution_flow>` Step 1 ("If CONTEXT.md exists, it constrains research" — full table repeated)

The source hierarchy priority order appears in:
- `<tool_strategy>` (Tool Priority table + Context7 flow bullets)
- `<source_hierarchy>` (separate section with another table)

---

### W8 — §17 Agent and Subagent Patterns: Missing `agentMetadata` in frontmatter
**Severity: Low**

The guide (§11, §17) specifies that agent frontmatter should encode `agentMetadata` with `agentType`, `model`, `permissionMode`, `whenToUse`, and `criticalSystemReminder`. The agent's frontmatter is:

```yaml
name: gsd-phase-researcher
description: ...
tools: ...
color: cyan
```

Missing fields:
- `agentMetadata.agentType`
- `agentMetadata.model` (which model tier is appropriate?)
- `agentMetadata.permissionMode`
- `agentMetadata.whenToUse` (currently in `description` as a sentence; the guide specifies `whenToUse` as a structured field)
- `agentMetadata.criticalSystemReminder`

The `description` field partially serves `whenToUse` but is not machine-readable in the same way.

---

## Concrete Improvements

### Improvement 1 — Rewrite `<role>` as a specific, strength-enumerated persona

Replace:
```xml
<role>
You are a GSD phase researcher. You answer "What do I need to know to PLAN this phase well?" ...
```

With:
```xml
<persona>
You are a technical research specialist for software implementation planning.
Your job is not to build features — it's to produce the most accurate, source-verified
research possible so a planner can make confident decisions without guessing.

Your strengths:
- Finding the current best-practice stack for a technology domain from authoritative sources
- Distinguishing verified facts from training-data assumptions and tagging them accordingly
- Surfacing non-obvious pitfalls that cause rewrites — not just confirming what should work
- Mapping capability ownership to the correct architectural tier before implementation begins
- Producing prescriptive, planner-ready findings rather than open-ended explorations
</persona>
```

The `<role>` content (core responsibilities, claim provenance) moves into a `<task>` tag or remains inline, since responsibilities are instructions, not persona attributes.

---

### Improvement 2 — Move `<execution_flow>` to the top; demote context to middle

Restructure section order to match §8's context placement rule:

```
1. <persona>                    ← high attention (leads)
2. <task>                       ← high attention (instruction)
3. <output_format>              ← high attention (format)
4. <upstream_input>             ← middle (context)
5. <downstream_consumer>        ← middle (context)
6. <project_context>            ← middle (context)
7. <source_hierarchy>           ← middle (reference)
8. <documentation_lookup>       ← middle (procedure)
9. <tool_strategy>              ← middle (procedure)
10. <philosophy>                ← middle (principles)
11. <verification_protocol>     ← middle (quality)
12. <success_criteria>          ← middle (checklist)
13. <execution_flow>            ← closes prompt (primary input / action spec)
14. <structured_returns>        ← closes prompt (output templates)
```

---

### Improvement 3 — Convert negative instructions to positive equivalents

Apply the conversion table from §5 Action 1 to the five instances identified in W3:

| Current (negative) | Replacement (positive) |
|--------------------|------------------------|
| "Don't explore alternatives to locked decisions." | "Research only the approach specified in CONTEXT.md ## Decisions." |
| "Never present assumed knowledge as verified fact" | "Tag all claims derived from training data as [ASSUMED] before writing them." |
| "Do not skip documentation lookups because MCP tools are unavailable" | "Always attempt the CLI fallback (`npx ctx7@latest`) when MCP tools are absent." |
| "**Avoid:** Padding findings…" | "Report each finding once, at the confidence level it earned. Stop when the domain is covered." |
| "never use `Bash(cat << 'EOF')`…for file creation" | "Use the Write tool for all file creation." |

---

### Improvement 4 — Consolidate duplicate sections; reduce length by ~30%

Merge the three CONTEXT.md constraint explanations into one canonical block in `<upstream_input>` and reference it by name in `<execution_flow>` Step 1 ("Apply the upstream input rules from `<upstream_input>` above").

Merge `<verification_protocol>` Pre-Submission Checklist and `<success_criteria>` into one master checklist. Remove the redundant confidence level definitions in `<role>` and `<output_format>` Metadata; keep the single authoritative definition in `<source_hierarchy>`.

---

### Improvement 5 — Replace markdown headers inside `<execution_flow>` with `<phase>` tags

Per §16's phase pattern:

Replace:
```markdown
## Step 1: Receive Scope and Load Context
## Step 1.3: Load Graph Context
## Step 1.5: Architectural Responsibility Mapping
## Step 2: Identify Research Domains
```

With:
```xml
<phase id="1" name="Receive Scope and Load Context">
  ...
  <phase id="1.3" name="Load Graph Context">...</phase>
  <phase id="1.5" name="Architectural Responsibility Mapping">...</phase>
</phase>

<phase id="2" name="Identify Research Domains">
  ...
</phase>
```

This makes phase boundaries machine-readable and consistent with the rest of the GSD agent corpus.

---

### Improvement 6 — Add `agentMetadata` to frontmatter

```yaml
agentMetadata:
  agentType: 'PhaseResearcher'
  model: 'sonnet'
  permissionMode: 'dontAsk'
  whenToUse: >
    Research agent for a GSD implementation phase. Use when you need to investigate
    the technical domain of a phase and produce RESEARCH.md consumed by gsd-planner.
    Spawned automatically by gsd-plan-phase or triggered standalone via gsd-research-phase.
  criticalSystemReminder: 'CRITICAL: Write RESEARCH.md using the Write tool only. Never use heredoc or Bash for file creation.'
```

---

## Overall Score: 7 / 10

**Justification:**

The agent is substantively strong. Its output format specification is thorough (§22 Pattern 3), its confidence hierarchy is operationalized rather than qualitative, its scope-boundary encoding is precise (§14), its multi-step workflow is clearly sequenced with conditional branching (§16), and its tool-permission scoping in frontmatter is appropriately narrow (§22 Pattern 9). The downstream consumer contract (`<downstream_consumer>`) is an unusually clear handoff specification that few production prompts provide.

The score is held at 7 rather than 8 or 9 by three structural deficiencies that have measurable quality impact: (1) the task instruction is buried at position 12 of 14 sections, inverting the guide's attention-weighted placement rule (§8); (2) the persona is generic with no strengths enumeration, forfeiting the behavioral bias gain the guide identifies in §6; and (3) approximately 30% of the prompt is redundant content repeating the same rules across multiple sections, which the guide identifies as a performance cost independent of content quality (§10). These are correctable without restructuring the core logic.
