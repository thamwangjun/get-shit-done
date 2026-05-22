# Prompt Engineering Critique: gsd-ai-researcher.md

**Agent**: `gsd-ai-researcher.md`
**Critique date**: 2026-04-30
**Guide version**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

| # | Section | Applicable? |
|---|---------|-------------|
| 1 | Task Specification | Yes |
| 4 | Formatting and Structure | Yes |
| 5 | Instruction Framing | Yes |
| 6 | Persona Assignment | Yes |
| 7 | Output Format Handling | Yes |
| 8 | Context Placement | Yes |
| 10 | Prompt Length and Compression | Yes |
| 11 | System vs. User Prompt Allocation | Yes |
| 13 | Structural Architecture Patterns | Yes |
| 14 | Constraint Enforcement | Yes |
| 16 | Multi-Phase Workflows | Yes |
| 17 | Agent and Subagent Patterns | Yes |
| 19 | Modularity and Composition | Yes |
| 21 | Tone and Style Rules | Yes |
| 22 | Production Patterns | Yes |

---

## Strengths

### S1 — Multi-phase workflow structure (Guide §16)
The agent uses `<step>` tags within `<execution_flow>` to separate four named phases (`fetch_docs`, `detect_integrations`, `write_sections_3_4`, `write_section_4b`). This creates the cognitive phase boundary the guide prescribes, preventing the model from conflating research with writing.

### S2 — Input contract is explicit (Guide §1, §17)
The `<input>` block enumerates every expected variable (`framework`, `system_type`, `model_provider`, `ai_spec_path`, `phase_context`, `context_path`) with typed enum values for `system_type` and `model_provider`. This satisfies Guide §1's requirement to make audience and task parameters explicit.

### S3 — Success criteria as a checklist (Guide §1 quality_bar, §22 Pattern 3)
The `<success_criteria>` block maps to the guide's `<quality_bar>` concept and Pattern 3 ("output format specified completely and upfront"). Each criterion is binary and verifiable, not qualitative.

### S4 — Documentation lookup fallback chain (Guide §17 self-contained agent prompts)
The `<documentation_lookup>` block provides a primary path (Context7 MCP) and an explicit CLI fallback with copy-paste Bash commands, satisfying §17's requirement that each agent prompt be fully self-contained and not depend on context inheritance.

### S5 — Frontmatter with tool constraints (Guide §11, §17, §22 Pattern 9)
The YAML frontmatter defines `tools:` narrowing the permission surface to `Read, Write, Bash, Grep, Glob, WebFetch, WebSearch, mcp__context7__*`. This aligns with Pattern 9 (tool permissions scoped to minimum required) and §11's YAML frontmatter as agent configuration.

### S6 — Quality standards block (Guide §22 Pattern 2)
The `<quality_standards>` section pairs abstract instructions with calibrating specifics: "Pitfalls specific — 'use async where supported' is useless" is exactly the good/bad labeled pair structure the guide prescribes in §3 and Pattern 2.

### S7 — Required reading instruction (Guide §8 context placement)
The `<required_reading>` tag and the explicit note "read every listed file before doing anything else" enforces correct context ordering — ground truth consumed before generation begins.

---

## Weaknesses

### W1 — Persona is generic and does not use the reframe pattern (Guide §6)

**Quote from agent:**
```
<role>
You are a GSD AI researcher. Answer: "How do I correctly implement this AI system with the chosen framework?"
```

The guide (§6 Action 2) is explicit: "Generic expert framing ('you are an expert data scientist') produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." "GSD AI researcher" is a generic title. There is no voice constraint, no register specification, and no strengths list.

The guide's role-domain mapping table (§6) shows the correct form for a research task: "File search specialist. You excel at thoroughly navigating and exploring codebases." The persona here could follow the same pattern. Furthermore, the `<role>` tag is not the canonical tag — the guide specifies `<persona>` (§4 XML tag vocabulary).

### W2 — No XML tag structure for most top-level sections (Guide §4 Action 2)

The agent uses non-standard tags (`<role>`, `<documentation_lookup>`, `<required_reading>`, `<documentation_sources>`, `<execution_flow>`, `<quality_standards>`, `<success_criteria>`). The guide's tag vocabulary (§4) defines canonical top-level tags: `<task>`, `<persona>`, `<context>`, `<input>`, `<output_format>`, `<constraints>`, `<examples>`. Diverging from the canonical vocabulary reduces interoperability and means the model receives weaker structural signal.

Specifically:
- `<role>` should be `<persona>`
- `<quality_standards>` and `<success_criteria>` collapse the same concern; they should be unified under `<quality_bar>` inside `<task>`
- `<documentation_sources>` is context, not a task element; it belongs inside `<context>`

### W3 — Negative instruction in quality standards not converted (Guide §5 Action 1)

**Quote from agent:**
```
- No hallucinated API methods — note "verify in docs" if unsure
```

The guide (§5 Action 1) requires converting negative instructions to positive equivalents. The conversion table example is: `"Do not hallucinate" → "If uncertain, say 'I don't know' rather than guessing"`. The correct rewrite here would be: "For any API method not confirmed in the fetched docs, add an inline comment: `# verify in official docs`."

### W4 — Output format for the written artifact is underspecified (Guide §7, §22 Pattern 3)

The agent instructs the model to write Sections 3–4b of AI-SPEC.md but never specifies the exact output schema for those sections. There is no sample structure, no field ordering, no example section heading. Pattern 3 of the guide states: "State the required output structure, field names, ordering, and an example before the model begins its task."

The `<step name="write_sections_3_4">` block describes what to include in prose but provides no template, no example section with actual markdown, and no field-level specification. This leaves the structure of the written output as implicit, meaning it will vary across runs.

### W5 — No constraint enforcement block with permissions and exclusions (Guide §14)

The agent has no `<constraints>` block. There is no `<permitted>` / `<reserved_for_human_review>` pair. There is no exclusion list for what the researcher must NOT include in the spec (e.g., hallucinated methods, version-guessed syntax, unverified pitfalls). The guide (§14) is explicit: "Pair every restriction with what IS permitted, stated equally concretely."

The only constraint-adjacent content is the negative instruction flagged in W3. The lack of a constraints block means the model has no explicit permission boundary — it must infer scope entirely from the task description.

### W6 — Fetch scope rule is qualitative, not numeric (Guide §21 Tone and Style Rules)

**Quote from agent:**
```
Fetch 2-4 pages maximum — prioritize depth over breadth
```

The count limit "2-4 pages" is numeric (good), but "prioritize depth over breadth" is a qualitative tie-breaking instruction. The guide (§5, §21) requires numeric limits and explicit tie-breaking rules. The instruction should specify which page types take priority when the 4-page budget is exhausted (e.g., "if budget is reached, drop the integration page before the pitfalls page").

### W7 — Section 4b sub-task descriptions mix instruction and example poorly (Guide §22 Pattern 2)

The `<step name="write_section_4b">` block contains dense prose instructions for five sub-sections (4b.1–4b.5) but provides no concrete examples of what a completed sub-section looks like. Pattern 2 requires "every abstract instruction paired with a calibrating example." Instructions like "Write for this specific `framework` + `system_type`" and "how many retries, what to log, when to surface" are qualitative without an anchor example. The risk is inconsistent depth across sub-sections.

### W8 — No subagent response format instruction (Guide §17)

The guide (§17) prescribes a conditional response format for subagents:
```
${IS_SUBAGENT?"When you complete the task, respond with a concise report...":"When you complete the task simply respond with a detailed writeup."}
```
The agent is explicitly described as "Spawned by /gsd-ai-integration-phase orchestrator" — it is a subagent. Yet there is no output format instruction telling the agent how to report completion back to the orchestrator. The orchestrator receives unstructured output with no defined handoff format.

---

## Concrete Improvements

### I1 — Replace `<role>` with a specific `<persona>` using the strengths pattern

```xml
<persona>
You are a technical documentation researcher specializing in AI framework integration.
Your job is not to summarize what a framework does — it is to produce implementation-ready
guidance a developer can copy and use without further research.

Your strengths:
- Reading official docs, release notes, and GitHub issues to extract verified syntax
- Identifying version-specific pitfalls from real production reports, not docs marketing copy
- Translating framework abstractions into concrete, runnable entry point patterns
- Distinguishing what works from what the docs claim works
</persona>
```

### I2 — Add a `<constraints>` block with permitted/exclusion pairs

```xml
<constraints>
  <permitted>
    - Read any file listed in `<required_reading>`
    - Fetch up to 4 documentation pages per framework via Context7 or WebFetch
    - Write to `ai_spec_path` using the Write tool only
    - Run read-only Bash commands for the ctx7 CLI fallback
  </permitted>

  <reserved_for_human_review>
    - Modifying any file other than `ai_spec_path`
    - Adding framework recommendations not present in `<input>`
  </reserved_for_human_review>

  <exclusions>
    Automatically exclude from written output:
    1. API methods not confirmed in fetched docs — add inline comment `# verify in official docs` instead
    2. Version numbers not confirmed in fetched docs — write `{version}` as a placeholder
    3. Generic AI best practices not specific to `framework` + `system_type`
    4. Introductory or marketing content from the framework homepage
  </exclusions>
</constraints>
```

### I3 — Convert the negative instruction in `<quality_standards>`

Replace:
```
- No hallucinated API methods — note "verify in docs" if unsure
```
With:
```
- For any API method not confirmed in the fetched docs, add an inline comment: `# verify in official docs — not confirmed in fetched version`
```

### I4 — Add a concrete output template for Sections 3–4 inside `<step name="write_sections_3_4">`

```xml
<step name="write_sections_3_4">
Write to AI-SPEC.md at `ai_spec_path` using the Write tool. Sections must follow this structure exactly:

## 3. Framework Quick Reference

### Installation
```bash
{installation command for latest stable version}
```

### Key Imports
```python
{actual import statements matching the fetched version}
```

### Entry Point Pattern ({system_type})
```python
{minimal runnable example — copy-paste ready, inline comments required}
```

### Core Abstractions
| Abstraction | Role in `{system_type}` |
|-------------|------------------------|
| {name} | {1-sentence role} |

### Pitfalls
1. **{Pitfall name}** — {why it fails, not just that it fails}

### Folder Structure
```
{recommended project layout for this system_type}
```

### Sources
- {URL 1}
- {URL 2}

## 4. Implementation Guidance
...
</step>
```

### I5 — Add a subagent completion report instruction

Add at the end of the prompt, after `<success_criteria>`:

```xml
<output_format>
When all steps are complete, respond with a concise report covering:
- Which documentation pages were fetched (URLs)
- Framework version confirmed
- Any methods or patterns marked "verify in docs" and why
- Sections written and word count estimate

The orchestrating agent reads this report directly — keep it under 150 words.
</output_format>
```

### I6 — Add explicit tie-breaking for the 4-page fetch budget

Replace:
```
Fetch 2-4 pages maximum — prioritize depth over breadth: quickstart, the `system_type`-specific pattern page, best practices/pitfalls.
```
With:
```
Fetch at most 4 pages. Priority order when budget is exhausted:
1. system_type-specific pattern page (highest — write nothing without this)
2. Best practices / pitfalls page
3. Quickstart (installation and imports only)
4. Integration-specific page (vector DB, embeddings, tracing)

Drop page 4 first if the budget is exceeded, then page 3.
```

---

## Overall Score: 5 / 10

**Justification**: The agent demonstrates solid structural thinking — the execution flow phases are well-separated, the input contract is explicit, the documentation fallback chain is self-contained, and the tool permissions are appropriately narrowed. These are non-trivial qualities that many production prompts lack.

However, the agent fails on several high-impact guide requirements that directly affect output consistency: the persona is generic and will not constrain register or catch hallucination-prone behavior; the output format for the written artifact is entirely implicit, guaranteeing variance across runs; there is no constraints block, leaving the model without explicit permission boundaries or exclusion filters; and the subagent response format is missing entirely, leaving the orchestrator with unstructured output. These are not cosmetic gaps — they are the difference between a prompt that produces consistent, parseable output and one that produces plausible-looking but unreliable output. With the five concrete improvements above applied, the score would move to approximately 7–8.
