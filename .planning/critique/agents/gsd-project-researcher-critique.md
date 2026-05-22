# Critique: gsd-project-researcher.md

**Agent:** `gsd-project-researcher.md`

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
- §22 Production Patterns (Pattern 1, 2, 3, 5, 6)
- §23 Quick-Reference Checklist

---

## Strengths

### §6 Persona Assignment — Role scoped to exact domain (Production Pattern 1)
The agent opens with a tightly scoped role identity: "You are a GSD project researcher spawned by `/gsd-new-project` or `/gsd-new-milestone`." This matches the guide's rule that a persona must name the exact domain, not a broader category. The role describes the concrete output contract ("Answer 'What does this domain ecosystem look like?'") and where output goes (`.planning/research/`), which further constrains behavior.

### §1 Task Specification — Output contract made explicit upfront
The file-to-roadmap mapping table immediately after the role statement makes the downstream consumer explicit. Guide §1 requires encoding what output is requested, why it matters, and what makes a good response. The table satisfies all three: it names the five deliverables, explains how each feeds the roadmap orchestrator, and the "Be comprehensive but opinionated" directive partially defines the quality bar.

### §14 Constraint Enforcement — Verification protocol with confidence thresholds
The `<tool_strategy>` and `<verification_protocol>` sections enumerate a three-level confidence scheme (HIGH/MEDIUM/LOW) tied to specific source types. This satisfies §14's directive that "confidence thresholds are numeric, not qualitative" — in spirit, though the thresholds are ordinal rather than numeric (see Weaknesses). The source-priority ladder and the named research pitfalls (Configuration Scope Blindness, Deprecated Features, Negative Claims Without Evidence, Single Source Reliance) act as the guide's "precedents" — concrete edge-case rulings rather than abstract rules.

### §17 Agent and Subagent Patterns — Self-contained prompt with spawning context
The agent states its orchestration parent, its parallel execution context ("DO NOT commit — orchestrator commits after all complete"), and a structured return format. This satisfies the guide's requirement that every agent prompt be fully self-contained and that subagent output be concise for the orchestrating model.

### §5 Instruction Framing — Conditional branching for tool fallbacks
The `<documentation_lookup>` section uses explicit `if/else` conditional branching:  
> "If Context7 MCP tools are available… use them. If Context7 MCP is not available… use the CLI fallback via Bash."  
This matches §5's "When behavior depends on context, use explicit conditional branching" pattern.

### §4 Formatting and Structure — XML tag separation of distinct sections
The prompt uses semantically named XML tags (`<role>`, `<philosophy>`, `<tool_strategy>`, `<verification_protocol>`, `<output_formats>`, `<execution_flow>`, `<structured_returns>`, `<success_criteria>`) to partition distinct concerns. This follows §4's directive to separate sections with semantically named XML tags rather than markdown headers or `---` delimiters.

### §22 Production Pattern 3 — Output format specified completely upfront
All five output file formats (SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md) are specified as complete markdown templates with field names, section ordering, and example placeholder values. This satisfies Production Pattern 3: "state the required output structure, field names, ordering, and an example before the model begins its task."

---

## Weaknesses

### W1 — §6 Persona Assignment: Generic framing, no strengths enumeration
**Severity: High**

The guide (§6) requires that a persona explicitly enumerate what the agent is good at to bias behavior toward those capabilities:

```xml
<persona>
Your strengths:
- Searching for code, configurations, and patterns...
- Analyzing multiple files...
</persona>
```

The agent's `<role>` block contains no strengths list. It states the role and the output contract but does not enumerate the specific capabilities the agent should lean into (e.g., cross-source verification, evidence-first reasoning, confidence calibration). This is a missed opportunity to anchor behavior during ambiguous research tasks.

**Specific agent text:** `"You are a GSD project researcher spawned by /gsd-new-project or /gsd-new-milestone (Phase 6: Research)."` — role stated but no strengths enumerated.

---

### W2 — §4 Formatting and Structure: Guide-recommended XML tag vocabulary not used
**Severity: High**

The guide defines a canonical XML tag vocabulary (§4): `<task>`, `<persona>`, `<constraints>`, `<output_format>`, `<context>`, `<examples>`. The agent uses bespoke tags (`<role>`, `<documentation_lookup>`, `<philosophy>`, `<tool_strategy>`, `<verification_protocol>`, `<output_formats>`, `<execution_flow>`, `<structured_returns>`, `<success_criteria>`).

While custom tags are not prohibited, the guide explicitly states that a shared vocabulary "makes composed prompts predictable and composed modules interoperable." The agent's naming diverges from the standard, which reduces composability in the GSD multi-agent system. Specifically:
- `<role>` should map to `<persona>`
- `<output_formats>` should map to `<output_format>`
- `<tool_strategy>` and `<verification_protocol>` should collapse into `<constraints>` with appropriate sub-tags
- `<execution_flow>` should map to a `<task>` with `<phase>` sub-tags (§16)

---

### W3 — §5 Instruction Framing: Negative instructions not converted to positive equivalents
**Severity: Medium**

The guide (§5 Action 1) requires scanning for negated instructions and rewriting them as positive specifications. The agent contains multiple negative primaries:

- `"Don't find articles supporting your initial guess"` → should be: "Gather evidence first; let evidence drive recommendations."
- `"Never pad findings, state unverified claims as fact, or hide uncertainty"` → should be: "State only verified findings; flag uncertainty explicitly with confidence levels; report gaps honestly."
- `"ALWAYS use the Write tool to create files — never use Bash(cat << 'EOF') or heredoc commands"` — the prohibition on heredocs is stated negatively without an equivalent positive framing of *why* the Write tool is preferred.

The exception in §5 is the reframe pattern ("Your job is NOT X — it's Y"), which is valid. The `<philosophy>` section's "Bad research: … Good research: …" pair approaches this pattern but is not anchored to an XML `<persona>` constraint and mixes with prose rather than being isolated as a reframe.

---

### W4 — §14 Constraint Enforcement: Confidence thresholds are ordinal, not numeric
**Severity: Medium**

The guide §14 states: "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable." The agent's confidence scheme uses ordinal labels (HIGH/MEDIUM/LOW) without numeric floors:

```
| HIGH   | Context7, official documentation, official releases | State as fact |
| MEDIUM | WebSearch verified with official source...         | State with attribution |
| LOW    | WebSearch only, single source, unverified          | Flag as needing validation |
```

The guide's pattern uses percentage thresholds (e.g., ">80% confident of actual exploitability"). The agent's ordinal scheme is more defensible than pure qualitative labels since it is tied to source types, but it cannot be calibrated or A/B tested against numeric alternatives. At minimum, a numeric confidence floor per level would satisfy the guide requirement.

---

### W5 — §11 System vs. User Prompt Allocation: Instructions duplicated across sections
**Severity: Medium**

The guide (§11 Action 3) requires that "each instruction appears in exactly one location." The agent duplicates several instructions:

1. The tool priority order appears in both `<documentation_lookup>` (Context7 first, then CLI fallback) and again in `<tool_strategy>` (full priority ladder starting from Context7).
2. The pre-submission checklist appears in `<verification_protocol>` and its logic is repeated structurally in `<success_criteria>`.
3. The instruction to use Write (not heredocs) appears in `<execution_flow>` as a standalone callout but the same rule is implied by the `<success_criteria>` line "Files written (DO NOT commit)".

Each duplicated instruction consumes context and introduces the risk of version drift if one copy is updated.

---

### W6 — §16 Multi-Phase Workflows: Execution flow not structured with `<phase>` tags
**Severity: Medium**

The `<execution_flow>` section defines a six-step process (Receive Scope → Identify Domains → Execute Research → Quality Check → Write Output → Return Result). The guide §16 mandates organizing complex multi-step tasks into explicit named phases using `<phase id="N" name="...">` tags:

```xml
<phase id="1" name="Receive Research Scope">...</phase>
<phase id="2" name="Identify Research Domains">...</phase>
```

The current prose-list format lacks machine-parseable phase boundaries and does not specify trigger conditions between phases (e.g., `trigger="after_plan_approval"` for human-gating). For a spawned research agent executing a multi-step workflow, this is a meaningful structural gap.

---

### W7 — §17 Agent and Subagent Patterns: `whenToUse` in frontmatter is capability-generic, not action-specific
**Severity: Low**

The guide (§17) states: "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic."

The current frontmatter description reads: `"Researches domain ecosystem before roadmap creation. Produces files in .planning/research/ consumed during roadmap creation. Spawned by /gsd-new-project or /gsd-new-milestone orchestrators."`

This describes *capability* (what it does) and *orchestration origin* (who calls it) but not the concrete trigger signal the orchestrating model should match against. A stronger `whenToUse` would name the exact conditions: e.g., "Use when starting a new project or milestone and no files exist yet in `.planning/research/`, or when the orchestrator is executing Phase 6 of the project initialization flow."

---

### W8 — §10 Prompt Length and Compression: Prompt is long; full output templates double the token cost
**Severity: Low**

The guide §10 Action 1 requires removing content that does not contribute to the task before sending. The `<output_formats>` section reproduces full markdown templates for seven potential output files, including all placeholder table rows, code blocks, and section headers. These templates consume a large portion of the prompt but are referenced at most once per execution step. The guide's modular principle (§19, Production Pattern 5) recommends decomposing large prompts into toggled modules. The output templates are a candidate for extraction into a separate referenced file, activated only during Step 5 (Write Output Files).

---

## Concrete Improvements

### Improvement 1 — Add a strengths list to the persona (fixes W1)

Replace the opening `<role>` with a `<persona>` block that enumerates capabilities:

```xml
<persona>
You are a GSD project researcher. Your job is not to confirm an initial hypothesis —
it is to gather evidence and let findings drive conclusions.

Your strengths:
- Sourcing and cross-verifying technical claims across Context7, official docs, and web
- Assigning calibrated confidence levels to every finding
- Detecting confirmation bias and correcting for it mid-research
- Producing opinionated, actionable recommendations rather than option lists
- Flagging gaps and uncertainty honestly rather than padding output
</persona>
```

---

### Improvement 2 — Migrate bespoke tags to canonical vocabulary (fixes W2)

| Current Tag | Replace With |
|---|---|
| `<role>` | `<persona>` |
| `<output_formats>` | `<output_format>` |
| `<tool_strategy>` + `<verification_protocol>` | `<constraints>` with `<permitted>`, `<confidence_scoring>`, `<precedents>` sub-tags |
| `<execution_flow>` | `<task>` with `<phase id="N" name="...">` children (fixes W6 simultaneously) |
| `<success_criteria>` | `<quality_bar>` |

---

### Improvement 3 — Convert negative instructions to positive equivalents (fixes W3)

| Current (negative) | Rewrite (positive) |
|---|---|
| `"Don't find articles supporting your initial guess"` | `"Gather evidence from multiple independent sources; form conclusions from the evidence set."` |
| `"Never pad findings, state unverified claims as fact, or hide uncertainty"` | `"State only verified findings. Assign a confidence level to every claim. Report gaps as gaps."` |
| `"never use Bash(cat << 'EOF') or heredoc commands for file creation"` | `"Use the Write tool for all file creation — it preserves encoding, handles escaping correctly, and is auditable in the tool call log."` |

---

### Improvement 4 — Add numeric confidence floors (fixes W4)

Replace the ordinal confidence table with a numeric-anchored version:

```xml
<confidence_scoring>
  - 0.9–1.0 (HIGH): Context7 or official documentation confirms the claim — state as fact.
  - 0.7–0.9 (MEDIUM): Claim verified with official source + one additional credible source — state with attribution.
  - Below 0.7 (LOW): Single source or unverified WebSearch only — flag explicitly: "LOW confidence, needs validation."
  Omit or flag any claim you cannot place at MEDIUM or above for critical architectural decisions.
</confidence_scoring>
```

---

### Improvement 5 — Deduplicate tool priority instructions (fixes W5)

Remove `<documentation_lookup>` as a standalone section. Fold its content into the `<constraints>` block under a `<permitted>` sub-tag alongside the full `<tool_strategy>` priority ladder. The CLI fallback instruction belongs in a `<precedents>` entry:

```xml
<precedents>
  If mcp__context7__* tools are unavailable (upstream issue #13898 strips MCP tools
  from agents with a tools: frontmatter restriction), use the CLI fallback:
  Step 1: npx --yes ctx7@latest library <name> "<query>"
  Step 2: npx --yes ctx7@latest docs <libraryId> "<query>"
  Do not skip documentation lookups — the CLI fallback produces equivalent output.
</precedents>
```

This consolidates the tool fallback instruction to one location and removes the duplicate preamble.

---

### Improvement 6 — Restructure execution flow as named phases (fixes W6)

```xml
<task>
  <phase id="1" name="Receive Research Scope">
    Parse: project name/description, research mode, project context, specific questions.
    If a required_reading block is present, load every listed file before proceeding.
  </phase>

  <phase id="2" name="Identify Research Domains">
    Map scope to four investigation areas: Technology, Features, Architecture, Pitfalls.
  </phase>

  <phase id="3" name="Execute Research">
    For each domain: Context7 → Official Docs → WebSearch → Verify.
    Assign confidence level to every finding. Document source URLs.
  </phase>

  <phase id="4" name="Quality Check">
    Run pre-submission checklist. All items must pass before writing output.
  </phase>

  <phase id="5" name="Write Output Files">
    Use the Write tool only. Create files in .planning/research/ per output_format.
    Do not commit — orchestrator commits after all parallel researchers complete.
  </phase>

  <phase id="6" name="Return Structured Result">
    Emit the RESEARCH COMPLETE or RESEARCH BLOCKED structured return to the orchestrator.
  </phase>
</task>
```

---

### Improvement 7 — Sharpen `whenToUse` to action-specific trigger (fixes W7)

```yaml
whenToUse: >
  Use when a /gsd-new-project or /gsd-new-milestone orchestrator reaches Phase 6
  (Research) and no files exist yet in .planning/research/. Also use when an existing
  project needs updated ecosystem research before milestone planning begins.
```

---

## Overall Score: 6 / 10

**Justification:** The agent is functionally solid — the output contract is explicit, confidence levels are tied to source types, conditional tool fallback logic is well-specified, and the six-step execution flow is clear. The research philosophy (`<philosophy>` section) is a genuine strength: it encodes epistemically correct behavior (evidence before conclusion, honest gap reporting) in a way that will meaningfully influence outputs.

The primary structural debts are: (1) the persona has no strengths enumeration, leaving behavioral anchoring incomplete; (2) the custom XML tag vocabulary diverges from the guide's canonical set, reducing composability across the GSD multi-agent system; (3) the execution flow is prose rather than machine-parseable `<phase>` tags; (4) confidence thresholds are ordinal rather than numeric; and (5) a handful of instructions are duplicated across sections. None of these gaps prevent the agent from functioning, but they represent a gap between the current implementation and what the guide would consider a production-ready prompt. Addressing W1–W3 and W5–W6 would move this to an 8.
