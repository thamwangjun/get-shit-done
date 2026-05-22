# Prompt Engineering Critique: gsd-ui-researcher

- **Agent**: `gsd-ui-researcher.md`
- **Guide version evaluated against**: Prompt Engineering Guide V09

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
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §20 Safety and Trust Patterns
- §21 Tone and Style Rules
- §22 Production Patterns (esp. Patterns 1, 2, 3, 9)
- §23 Quick-Reference Checklist

---

## Strengths

### 1. Multi-Phase Workflow Structure (§16)
The `<execution_flow>` section organizes work into clearly numbered, sequentially gated steps (Step 1 through Step 7). Each step has a named responsibility and the steps form a logical dependency chain. This is a direct application of the phase pattern: cognitive boundaries are created, and the agent is expected to complete one phase before the next.

### 2. Constraint Enforcement with Explicit Permission Pairs (§14)
The shadcn registry vetting gate in `<design_contract_questions>` is a strong constraint enforcement example. It enumerates specific suspicious patterns to scan for (`fetch(`, `eval(`, `process.env`, etc.) and provides branching logic for Y/N developer responses, including hard blocking behavior if the user refuses the gate entirely. This mirrors the guide's enumerated exclusion list pattern rather than qualitative description.

### 3. Downstream Consumer Specification (§1 — quality bar)
The `<downstream_consumer>` section explicitly names who will consume the output and how each consumer uses it. This directly implements guide §1 Action 2 ("Identify the audience") and partially satisfies the `<quality_bar>` requirement. The note "Be prescriptive, not exploratory" with a concrete contrast ("Use 16px body at 1.5 line-height" vs. "Consider 14-16px") is a well-placed calibrating example (§22 Pattern 2).

### 4. Upstream Artifact Mapping Table (§8 — context placement)
The `<upstream_input>` section provides a two-column table mapping each upstream artifact section to how the agent must use it. This is a practical expression of context trimming (§8 Action 4): the agent is instructed to extract only what is relevant from each source and pre-populate the contract rather than re-asking.

### 5. Tool Priority Table (§22 Pattern 9 — minimum required tool scope)
The `<tool_strategy>` section ranks five tools in a priority table with use-case descriptions and trust levels. This is a clear, structured expression of tool scope intent, matching the guide's pattern of narrowing tool permissions to task-relevant use.

### 6. Success Criteria Checklist (§16 — required steps; §23 — checklist)
The `<success_criteria>` section provides a concrete checklist of completion conditions. Quality indicators distinguish specific from vague outputs with direct examples. This implements the guide's "required steps" pattern and calibrates the agent's quality bar explicitly.

### 7. Structured Return Templates (§17 — subagent response format; §7 — output format)
The `<structured_returns>` section provides distinct, fully specified templates for `UI-SPEC COMPLETE` and `UI-SPEC BLOCKED` states. The blocked path includes what was attempted, options, and what is awaited — a disciplined handling of failure branches that the guide advocates for in scenario-based branching (§16).

---

## Weaknesses

### 1. Persona Is Generic and Role-Mismatched (§6, Critical)

The `<role>` tag opens with:

> "You are a GSD UI researcher."

This is a generic title with no behavioral or stylistic constraint. The guide (§6 Action 2) states: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The remainder of the `<role>` block is a bullet-point list of responsibilities, not a persona — it belongs in a `<task>` tag, not a `<persona>` tag.

The guide's role-domain mapping table (§6) shows the pattern for this type of agent: instead of "GSD UI researcher," the identity should be something like "You are a design systems analyst. Your job is not to explore what could be built — it's to lock down what must be built, with enough precision that an executor can implement it without design ambiguity." The reframe pattern (§6) would add force here.

### 2. Tag Vocabulary Does Not Follow the Guide's Standard (§4, Significant)

The agent uses non-standard top-level tags throughout: `<role>`, `<documentation_lookup>`, `<project_context>`, `<upstream_input>`, `<downstream_consumer>`, `<tool_strategy>`, `<shadcn_gate>`, `<design_contract_questions>`, `<output_format>`, `<execution_flow>`, `<structured_returns>`, `<success_criteria>`.

The guide (§4) defines a standard XML tag vocabulary. The correct mapping for this agent would be:

| Current tag | Guide-prescribed tag |
|---|---|
| `<role>` | `<persona>` + `<task>` |
| `<downstream_consumer>` | `<audience>` |
| `<output_format>` (the section heading) | `<output_format>` (correct but content is partially misplaced) |
| `<execution_flow>` | Multi-phase `<phase id="N">` tags |
| `<success_criteria>` | `<quality_bar>` |
| `<upstream_input>` | `<context>` |

Using non-standard tags reduces interoperability with other agents in the system that parse or compose these prompts, and removes the semantic signal benefit the guide identifies (§4 Action 2: "Tags name what the section is, not just where it starts").

### 3. Instruction Framing Has Multiple Negative Directives (§5, Significant)

The guide (§5 Action 1) requires converting all negative instructions to positive equivalents. The agent contains several:

- `<role>`: "Ask ONLY what REQUIREMENTS.md and CONTEXT.md did not already answer" — the constraint is framed around what NOT to do.
- `<upstream_input>`: "If upstream artifacts answer a design contract question, do NOT re-ask it."
- `<design_contract_questions>`: "Ask ONLY what REQUIREMENTS.md, CONTEXT.md, and RESEARCH.md did not already answer."
- `<project_context>`: "Do NOT load full `AGENTS.md` files (100KB+ context cost)"
- `<output_format>`: "never use `Bash(cat << 'EOF')` or heredoc commands for file creation"

Each of these can and should be rewritten as positive behavior specifications. The guide's conversion table applies directly: "Do not re-ask answered questions" becomes "Pre-populate every question already answered by upstream artifacts."

### 4. Audience and Quality Bar Are Implicit, Not Declared (§1, Significant)

The guide (§1 Actions 1–2) requires explicit `<task>`, `<audience>`, and `<quality_bar>` blocks. This agent has:

- No `<task>` block — the task is distributed across `<role>`, `<execution_flow>`, and `<success_criteria>`.
- No `<audience>` block — the downstream consumers are documented in `<downstream_consumer>` but are not encoded in the `<audience>` tag the guide prescribes.
- No `<quality_bar>` block — quality indicators appear inside `<success_criteria>` rather than as a dedicated `<quality_bar>` that frames the entire output standard.

The guide is explicit: "Ask for any missing component before proceeding." These are not merely organizational preferences — they determine how the model prioritizes competing interpretations.

### 5. No Priority Order When Multiple Criteria Conflict (§5, Moderate)

The `<design_contract_questions>` section lists five design domains (spacing, typography, color, copywriting, registry) without specifying priority when they conflict — for instance, when an upstream decision in CONTEXT.md contradicts what `components.json` suggests, or when the user's answer during the session differs from RESEARCH.md. The guide (§5) requires an explicit `<priority_order>` block. No such ordering exists in this prompt.

### 6. Output Format Specification Is Split Across Three Locations (§11 Action 3, Moderate)

The output specification is scattered:

- `<output_format>` contains the file write instruction and a note about the Write tool.
- `<execution_flow>` Step 5 contains the template read and write path.
- `<structured_returns>` contains the return format.

The guide (§11 Action 3) requires each instruction to appear in exactly one location. The template path (`~/.claude/get-shit-done/templates/UI-SPEC.md`) appears in both `<output_format>` and `<execution_flow>` Step 5.

### 7. No Few-Shot Examples for the Core Output (§3; §22 Pattern 2, Moderate)

The agent produces a UI-SPEC.md, but no example of a well-formed UI-SPEC entry is shown. The guide (§22 Pattern 2) requires every abstract instruction to be paired with a calibrating example. The quality indicators in `<success_criteria>` give one contrast pair ("16px body at weight 400" vs. "use normal body text"), but this appears at the end of the prompt and covers only typography. No examples are given for color specification, copywriting format, or a complete registry entry. The guide warns that qualitative terms like "prescriptive" and "specific" are subjective without examples to calibrate them.

### 8. Frontmatter Tool Permissions Are Not Minimally Scoped (§22 Pattern 9, Minor)

The frontmatter declares:

```
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__*
```

`Bash` is granted without any prefix restriction. The guide (§22 Pattern 9) requires tool permissions to be the narrowest patterns that satisfy the task: "Whole-tool grants (e.g. `Bash` with no prefix) leave the permission boundary undefined." The `<tool_strategy>` section shows the agent only needs specific bash commands (`ls`, `grep`, `find`, `npx shadcn`). These should be scoped, e.g., `Bash(ls:*)`, `Bash(grep:*)`, `Bash(find:*)`, `Bash(npx shadcn:*)`.

### 9. Context Placement Ordering Is Violated (§8, Minor)

The guide (§8 Actions 1–3) requires: task instruction at the start, background/supplementary context in the middle, primary input at the end. This agent opens with `<role>` (a combination of persona and task), immediately followed by `<documentation_lookup>` (operational procedure), then `<project_context>` (background discovery), then `<upstream_input>` (the primary context the model acts on). The primary context — upstream artifacts — should be positioned last or near-last for maximum attention, not buried in the middle of the prompt. The `<execution_flow>` section (which specifies the precise steps) is also placed after several background sections, reducing its positional weight.

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with `<persona>` + `<task>` (addresses Weaknesses 1, 2, 4)

```xml
<persona>
You are a design systems analyst. Your job is not to explore what could be built —
it's to lock down what must be built, with enough precision that an executor can
implement without design ambiguity.

Your output is consumed by three parties who trust your contract completely:
the planner uses your tokens in task descriptions, the executor references your
contract as visual source of truth, and the auditor compares implementation against it.
Write as if a missing pixel spec causes a production bug.
</persona>

<task>
Produce a UI-SPEC.md design contract for the specified phase.

Pre-populate every design decision already answered by upstream artifacts
(CONTEXT.md, RESEARCH.md, REQUIREMENTS.md, components.json).
Ask the developer only what upstream artifacts left unanswered.
</task>

<audience>
The UI-SPEC.md is consumed by: gsd-ui-checker (validation), gsd-planner (task
descriptions), gsd-executor (implementation reference), gsd-ui-auditor (retroactive
audit). All consumers treat this document as the authoritative visual contract.
</audience>

<quality_bar>
Each field must be a complete, implementable specification. Acceptable: "body: 16px,
weight 400, line-height 1.5". Unacceptable: "use normal body text" or "consider 14-16px".
Every unanswered question must be either pre-populated from upstream or explicitly asked
in a single batched interaction — never left blank or deferred.
</quality_bar>
```

### Improvement 2: Add explicit `<priority_order>` for conflicting signals (addresses Weakness 5)

```xml
<priority_order>
When upstream artifacts and user input conflict, resolve in this order:
1. User input during this session (highest — explicit, current intent)
2. CONTEXT.md Decisions section (locked choices from /gsd-discuss-phase)
3. components.json / npx shadcn info output (ground truth for installed system)
4. RESEARCH.md Standard Stack (research findings, may predate installation)
5. REQUIREMENTS.md (requirements, not design decisions — infer, do not treat as contract)
6. Sensible defaults (lowest — use only when all above are silent)
</priority_order>
```

### Improvement 3: Convert negative instructions to positive equivalents (addresses Weakness 3)

Replace the scattered negative directives with positive specifications:

| Current (negative) | Replacement (positive) |
|---|---|
| "Ask ONLY what...did not already answer" | "Pre-populate every question already answered by upstream artifacts before asking the developer anything." |
| "do NOT re-ask it" | "Mark each pre-populated field with its source (e.g., `[from CONTEXT.md]`) and ask the developer to confirm or override." |
| "Do NOT load full `AGENTS.md` files" | "Load only `SKILL.md` (the ~130-line index) and specific `rules/*.md` files relevant to UI research." |
| "never use `Bash(cat << 'EOF')`" | "Use the Write tool for all file creation — it provides change tracking and permission auditing." |

### Improvement 4: Add a calibrating example for the contract output (addresses Weakness 7)

Add a short example within `<quality_bar>` or `<output_format>` showing one complete, well-formed UI-SPEC section:

```xml
<output_format>
...
<example>
  <!-- Typography section — target specificity level -->
  ## Typography
  | Role       | Size | Weight | Line Height | Source        |
  |------------|------|--------|-------------|---------------|
  | Body       | 16px | 400    | 1.5         | [default]     |
  | Label      | 14px | 500    | 1.4         | [CONTEXT.md]  |
  | Heading H2 | 24px | 600    | 1.2         | [components.json] |
  | Display    | 32px | 700    | 1.1         | [user session]|
</example>
```

### Improvement 5: Scope `Bash` tool permission in frontmatter (addresses Weakness 8)

Replace:
```
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__*
```

With:
```
tools: Read, Write, Bash(ls:*), Bash(grep:*), Bash(find:*), Bash(npx shadcn:*), Bash(gsd-sdk:*), Grep, Glob, WebSearch, WebFetch, mcp__context7__*, mcp__firecrawl__*, mcp__exa__*
```

### Improvement 6: Restructure section order to match context placement rules (addresses Weakness 9)

Recommended ordering per §8:

1. `<persona>` — who the agent is
2. `<task>` — what it must do (high attention: leads the prompt)
3. `<audience>` + `<quality_bar>` — output standards
4. `<constraints>` / `<priority_order>` — behavioral rules
5. `<execution_flow>` — steps (placed high so they receive attention)
6. `<documentation_lookup>` + `<tool_strategy>` — background operational procedures (middle)
7. `<upstream_input>` — the context the agent acts on (near the end for recency bias)
8. `<design_contract_questions>` — the primary input to process (end, highest attention)

---

## Overall Score: 6 / 10

**Justification:** The agent demonstrates solid domain-specific knowledge: the shadcn gate logic is well-constructed, the registry vetting procedure is thorough with appropriate blocking behavior, the downstream consumer table is clear, and the structured return templates handle both success and failure paths. These reflect mature prompt engineering judgment.

However, the agent has consistent structural debt against the guide. The persona is a generic title rather than a behavioral constraint. The tag vocabulary deviates from the guide's standard across all major sections. Multiple instructions are framed negatively rather than positively. The primary output quality bar is implicit and scattered rather than declared upfront in a `<quality_bar>` block. Tool permissions are under-scoped for `Bash`. Context placement ordering buries high-priority operational content (the execution flow) after several pages of background material.

The weaknesses are largely mechanical — the agent's domain logic is sound — and most can be fixed by applying the guide's vocabulary and framing rules without changing the underlying behavior. That distinction keeps the score at 6 rather than lower: the design decisions are correct, but the prompt engineering form does not match the guide's standard.
