# Critique: gsd-research-synthesizer.md

**Agent:** `gsd-research-synthesizer.md`

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
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 1, 2, 3)
- §23 Quick-Reference Checklist

---

## Strengths

**§16 Multi-Phase Workflows — Named phase pattern used well.**
The `<execution_flow>` block organizes the agent's work into eight numbered, explicitly named steps (Read → Synthesize → Extract → Derive → Assess → Write → Commit → Return). Each step has a defined cognitive scope and hands off cleanly to the next. This closely mirrors the guide's recommended `<phase id="N" name="…">` pattern.

**§17 Agent and Subagent Patterns — Downstream consumer is made explicit.**
The `<downstream_consumer>` section names the consuming agent (`gsd-roadmapper`), maps each output section to how that agent uses it, and states the behavioral consequence ("Be opinionated"). This satisfies the guide's requirement that each agent prompt be self-contained and declare its purpose in the orchestration chain (§17: "Self-contained agent prompts").

**§17 Agent and Subagent Patterns — Structured returns cover both success and blocked paths.**
The `<structured_returns>` block provides a literal completion template (`SYNTHESIS COMPLETE`) and a failure template (`SYNTHESIS BLOCKED`). This reflects the guide's recommendation for machine-parseable output formats with explicit literal strings (§7: "Machine-parsed output specification").

**§1 Task Specification — Core responsibilities are enumerated.**
The `<role>` block lists six bullet-point responsibilities. The agent knows what output is expected, why it matters (roadmapper consumption), and what a complete response looks like (the checklist in `<success_criteria>`). This satisfies §1 Actions 1 and 3.

**§14 Constraint Enforcement — Mandatory pre-condition is explicit.**
The `CRITICAL: Mandatory Initial Read` note and the `success_criteria` checklist both enforce a gating pre-condition (all 4 files read before synthesis). This prevents partial synthesis, which is a meaningful constraint operationalized correctly.

**§21 Tone and Style — Qualitative quality indicators are named.**
The `<success_criteria>` section closes with four named quality indicators ("Synthesized, not concatenated", "Opinionated", "Actionable", "Honest"). These are better than pure prose description, though they fall short of the guide's preference for concrete examples (see Weaknesses below).

---

## Weaknesses

### W1 — §6 Persona Assignment: Persona is generic, not domain-specific

**Guide §6 Action 2:** "Generic expert framing ('you are an expert data scientist') produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

The agent opens with:

> `"You are a GSD research synthesizer."`

This is a functional description, not a persona. It does not constrain register (analytical, assertive, concise?), voice (first-person declarative? executive summary style?), or the epistemic stance expected (opinionated recommender vs. neutral aggregator). The `<downstream_consumer>` block correctly says "Be opinionated" but this belongs in a `<persona>` tag with concrete behavioral framing, not buried in a context block.

**Severity:** Medium. This limits behavioral consistency across calls.

---

### W2 — §4 Formatting and Structure: No XML tags for prompt sections — mixed markdown/XML structure

**Guide §4 Action 2:** "When a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag."

The agent uses a mix of `<role>`, `<downstream_consumer>`, `<execution_flow>`, `<output_format>`, `<structured_returns>`, and `<success_criteria>` — which is partially correct. However, `<execution_flow>` contains a large block of prose with markdown headers (`## Step 1: Read Research Files`) instead of structured XML sub-sections. The guide recommends `<phase id="N" name="…">` tags for multi-step workflows (§16). Nested markdown inside XML collapses the semantic signal advantage XML provides.

Additionally, there is no top-level `<task>` tag. The guide's recommended vocabulary (§4: XML tag vocabulary) places `<task>` as the primary structural tag. The agent uses `<role>` for what is partly instruction and partly identity — conflating two distinct guide primitives.

**Agent quote:**
```
<role>
You are a GSD research synthesizer. You read the outputs from 4 parallel researcher agents...
Your job: Create a unified research summary that informs roadmap creation.
```

This block conflates `<persona>` (identity) with `<task>` (instruction) — they should be separate tags.

**Severity:** High. Conflating task and persona into a single `<role>` block is the single largest structural deviation from the guide.

---

### W3 — §5 Instruction Framing: Several negative instructions not converted to positive equivalents

**Guide §5 Action 1:** "Scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

Two examples from the agent:

> `"ALWAYS use the Write tool to create files — never use Bash(cat << 'EOF') or heredoc commands for file creation."`

Correct positive rewrite: "Use the Write tool to create all files."

> `"researchers write but do NOT commit — you commit everything"`

Correct positive rewrite: "Commit all research files yourself; researcher agents write files only."

Neither is a showstopper but both carry unnecessary negative framing where a positive equivalent is straightforward.

**Severity:** Low-medium.

---

### W4 — §7 Output Format Handling / §22 Pattern 3: Output format is underspecified

**Guide §7 / Pattern 3:** "State the required output structure, field names, ordering, and an example before the model begins its task."

The `<output_format>` block says:

> `"Use template: ~/.claude/get-shit-done/templates/research-project/SUMMARY.md"`
> `"Key sections: Executive Summary (2-3 paragraphs), Key Findings, Implications for Roadmap, Confidence Assessment, Sources"`

The agent defers format specification to an external template file rather than embedding it. If that template is absent or the path is wrong, the agent has no fallback format spec. The guide requires format to be fully specified in the prompt itself — not by reference to an external file. There is also no example output embedded, violating Pattern 3's requirement for a concrete example that calibrates the target standard.

**Severity:** Medium-high. Runtime brittleness if template path is unavailable.

---

### W5 — §8 Context Placement: Task instruction does not lead the prompt

**Guide §8 Action 1:** "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning of their context."

The prompt opens with a YAML frontmatter block, then `<role>`, which is identity-and-instruction mixed, then `<downstream_consumer>` (background context), then `<execution_flow>` (the actual procedural instruction). By the guide's placement rules, the task instruction should come first, followed by background context in the middle, with the input (the research files to synthesize) positioned last. The current order de-prioritizes the execution procedure by placing it third.

**Severity:** Medium.

---

### W6 — §17 Agent and Subagent Patterns: No `disallowedTools` or permission scope in frontmatter

**Guide §17 / §11:** The guide recommends encoding `disallowedTools`, `permissionMode`, and `whenToUse` in agent frontmatter for any spawned subagent.

The agent's frontmatter declares:
```yaml
tools: Read, Write, Bash
```

But it does not restrict via `disallowedTools`, does not declare `permissionMode`, and the `description` field is a prose sentence rather than the action-specific trigger text the guide recommends for `whenToUse` (§17: "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic."). The current description ("Synthesizes research outputs from parallel researcher agents into SUMMARY.md") is adequate but could be more trigger-precise.

**Severity:** Low-medium.

---

### W7 — §22 Pattern 2 / §3 Few-Shot Examples: No calibrating examples for synthesis quality

**Guide Pattern 2:** "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard."

The `<success_criteria>` quality indicators ("Synthesized, not concatenated", "Opinionated", "Actionable", "Honest") are stated as labels without examples. The guide is explicit that qualitative terms require concrete examples to be measurable. A brief `<examples>` block showing one "bad" (concatenated) vs. one "good" (synthesized with opinion) roadmap implication would calibrate the most consequential output section (Step 4: Derive Roadmap Implications).

**Severity:** Medium.

---

### W8 — §14 Constraint Enforcement: Confidence table uses qualitative levels without numeric thresholds

**Guide §14:** "Numeric thresholds beat qualitative terms like 'high confidence' — they are calibratable."

Step 5 specifies a confidence table:

```
| Area | Confidence | Notes |
|------|------------|-------|
| Stack | [level] | [based on source quality from STACK.md] |
```

The `[level]` placeholder is resolved at runtime to qualitative labels (HIGH/MEDIUM/LOW as shown in `<structured_returns>`). The guide recommends numeric thresholds (e.g., 0.7–1.0 ranges) tied to specific reporting decisions. The current schema leaves the confidence signal non-actionable — the roadmapper agent has no defined behavior for what to do differently at MEDIUM vs. LOW confidence.

**Severity:** Low-medium.

---

## Concrete Improvements

### Improvement 1: Split `<role>` into `<persona>` + `<task>` and move `<task>` first

Replace the current opening with:

```xml
<task>
Read all 4 parallel researcher outputs (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md),
synthesize them into a cohesive SUMMARY.md, and commit all research files.
Produce clear, opinionated roadmap implications — the downstream roadmapper agent needs
phase-structure recommendations, not neutral summaries.
</task>

<persona>
You are a senior technical program manager synthesizing parallel research into an actionable
product roadmap brief. Write in declarative present tense. Lead every section with the
recommendation, then the supporting evidence. Call out gaps and unknowns explicitly —
do not soften or hedge findings without cause.
</persona>
```

This separates the "what to do" (task) from "how to do it" (persona voice/register) and places both in semantically correct tags.

---

### Improvement 2: Replace `<execution_flow>` markdown headers with `<phase>` XML tags

Replace each `## Step N:` header with:

```xml
<phase id="1" name="Read Research Files">
  Read all 4 research files using the Read tool. Extract per-file findings as specified.
</phase>

<phase id="2" name="Synthesize Executive Summary">
  Write 2-3 paragraphs answering: product type, recommended approach, key risks.
</phase>
<!-- … phases 3–8 … -->
```

This gives each phase a machine-readable id and name, consistent with guide §16.

---

### Improvement 3: Inline the output format; remove external template dependency

Replace:

```
Use template: ~/.claude/get-shit-done/templates/research-project/SUMMARY.md
```

With the full SUMMARY.md section schema embedded in `<output_format>`:

```xml
<output_format>
Write SUMMARY.md with these sections in order:

## Executive Summary
2–3 paragraphs. Audience: product roadmap author. Answer: product type, recommended approach, top 3 risks.

## Key Findings
Sub-sections: Stack, Features, Architecture, Pitfalls.
Each sub-section: 3–5 bullet points, each with a one-line rationale.

## Implications for Roadmap
For each suggested phase:
- Phase name and sequence rationale
- Features delivered (from FEATURES.md)
- Pitfalls to avoid (from PITFALLS.md)
- Research flag: needs `/gsd-research-phase` | standard patterns apply

## Confidence Assessment
| Area | Confidence (0–10) | Basis | Action if Low |
|------|-------------------|-------|---------------|

## Gaps
Bulleted list of unresolved questions requiring attention during planning.

## Sources
Aggregated from research files.
</output_format>
```

This eliminates runtime path dependency and satisfies §7/Pattern 3's requirement for a fully specified, embedded format.

---

### Improvement 4: Convert remaining negative instructions to positive form

| Current | Rewrite |
|---------|---------|
| `"never use Bash(cat << 'EOF') or heredoc commands"` | `"Use the Write tool for all file creation."` |
| `"researchers write but do NOT commit"` | `"You are the sole committer. Commit all research files in one operation after SUMMARY.md is written."` |

---

### Improvement 5: Add a calibrating example for "Opinionated" roadmap implication

Add an `<examples>` block immediately before Step 4:

```xml
<examples>
  <example>
    <input>Research shows Next.js with App Router is preferred, but team has existing
    Pages Router experience.</input>

    <output label="weak — not opinionated">
    Phase 2 could use Next.js App Router or Pages Router depending on team preference.
    </output>

    <output label="strong — opinionated">
    Phase 2: Use Next.js App Router. The research consensus favors App Router for new
    projects; Pages Router experience transfers within 1–2 sprints. Defer migration
    of legacy patterns to Phase 4.
    </output>

    <commentary>
    An opinionated implication names a specific recommendation with rationale and defers
    the trade-off decision rather than leaving it open.
    </commentary>
  </example>
</examples>
```

---

### Improvement 6: Replace qualitative confidence levels with numeric thresholds

Replace the confidence table instruction in Step 5 with:

```xml
<confidence_scoring>
  - 8–10: Primary sources (official docs, benchmarks, production case studies) — report directly
  - 5–7: Secondary sources (blog posts, community consensus) — report with caveat
  - Below 5: Speculative or single-source findings — flag as gap, do not include in roadmap implications
</confidence_scoring>
```

And update the confidence table columns to: `| Area | Score (0–10) | Basis | Roadmap impact |`

---

## Overall Score: 6 / 10

**Justification:** The agent has solid bones — it covers all eight logical steps, declares its downstream consumer, provides both success and blocked return templates, and enforces a pre-condition gate. The multi-step workflow is clear and executable. However, it commits several systematic deviations from the guide: the `<role>` tag conflates persona and task (§4, §6); the task instruction is not positioned first (§8); the output format is externally referenced rather than embedded (§7, Pattern 3); negative instructions persist where positive rewrites are trivial (§5); and qualitative standards lack calibrating examples and numeric thresholds (Pattern 2, §14). None of these individually breaks the agent, but collectively they reduce consistency, produce behavioral drift across calls, and create runtime brittleness (external template dependency). Addressing Improvements 1, 2, and 3 would bring the score to approximately 8.
