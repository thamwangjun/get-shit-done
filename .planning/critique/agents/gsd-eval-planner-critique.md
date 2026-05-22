# Critique: gsd-eval-planner.md

**Agent**: `gsd-eval-planner.md`
**Critique date**: 2026-04-30
**Guide version evaluated against**: Prompt Engineering Guide V09

---

## Guide Sections Evaluated

The following guide sections are applicable to this agent:

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 1, 2, 3, 9)

---

## Strengths

**§16 Multi-Phase Workflows — Phase pattern used correctly.**
The `<execution_flow>` block with named `<step>` elements creates clear cognitive boundaries. Each step has an unambiguous identity (`name` attribute) and a bounded responsibility. This mirrors the guide's `<phase id="..." name="...">` pattern directly.

**§14 Constraint Enforcement — Tooling detection before defaulting.**
The `select_eval_tooling` step scans for existing tools before applying opinionated defaults. This is constraint-enforcement thinking applied to tooling selection — it avoids overriding real constraints without checking them first.

**§11 System vs. User Prompt Allocation — YAML frontmatter present.**
The agent uses frontmatter to encode `name`, `description`, `tools`, and `color`. This aligns with §11's pattern for encoding agent identity and permissions in a single, machine-readable location. The commented-out `hooks` block also shows awareness of the pattern.

**§17 Agent and Subagent Patterns — Self-contained prompt.**
Inputs are explicitly declared in the `<input>` block. The agent does not rely on inherited parent context — it enumerates what it needs (`system_type`, `framework`, `model_provider`, `phase_name`, `ai_spec_path`, etc.). This follows §17's "every agent receives its full operating instructions directly" rule.

**§22 Pattern 3 — Output format partially specified upfront.**
The `write_rubrics` step specifies a concrete output format inline:
```
> PASS: {specific acceptable behavior in domain language}
> FAIL: {specific unacceptable behavior in domain language}
> Measurement: Code / LLM Judge / Human
```
This calibrates output structure for that specific section.

**§1 Task Specification — Audience and purpose implicit but recoverable.**
The `<role>` block communicates what output is being produced ("Write Sections 5–7 of AI-SPEC.md") and its purpose ("How will we know this AI system is working correctly?"). The downstream consumer (the `gsd-ai-integration-phase` orchestrator) is named in the frontmatter description.

---

## Weaknesses

### W1 — Persona is generic and does not constrain register or voice (§6)

**Guide rule (§6 Action 2):** "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

**Guide rule (§6, Role-domain mapping):** Match the expert identity to the exact domain, not a broader category. Example: "Tester" → "Verification specialist. Your job is to try to break it."

**Quoted agent text:**
```
<role>
You are a GSD eval planner. Answer: "How will we know this AI system is working correctly?"
Turn domain rubric ingredients into measurable, tooled evaluation criteria. Write Sections 5–7 of AI-SPEC.md.
</role>
```

"GSD eval planner" is a project-internal label, not a domain-specific identity that constrains style, voice, or decision-making priors. The tag is also named `<role>` rather than the guide-standard `<persona>`. The guide's §22 Pattern 1 example uses "software architect and planning specialist for Claude Code" — specific enough to constrain behavior. This agent's persona does not. No voice or register constraints are stated, no strengths are enumerated (§6 Strengths listing), and no reframe pattern is used to displace a misleading prior.

---

### W2 — No `<output_format>` block; output structure is scattered and underspecified (§7, §22 Pattern 3)

**Guide rule (§7 Action 1):** "When structured output is required, split into two steps: first elicit free-form reasoning, then format."

**Guide rule (§22 Pattern 3):** "State the required output structure, field names, ordering, and an example before the model begins its task. A fully specified format produces consistent, parseable output."

**Guide rule (§7, Machine-parsed output):** "When output is machine-parsed, be explicit and restrictive."

The agent writes to `AI-SPEC.md` — a document consumed by a downstream orchestrator. The format for each section (5, 6, 7) is mentioned only in passing within the `write_sections_5_6_7` step:

```
- Section 5 (Evaluation Strategy): dimensions table with rubrics, tooling, dataset spec, CI/CD command
- Section 6 (Guardrails): online guardrails table, offline flywheel table
- Section 7 (Production Monitoring): tracing tool, key metrics, alert thresholds, sampling strategy
```

No example output is provided. No field names, table column headers, or section anchors are specified. The rubric format in `write_rubrics` is the only concrete format spec, and it covers only one sub-element. The guide requires a top-level `<output_format>` block with an example for machine-consumed artifacts.

---

### W3 — Multiple negative instructions not converted to positive equivalents (§5 Action 1)

**Guide rule (§5 Action 1):** "Scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**Quoted agent text (negatives found):**

1. `"Fall back to generic ai-evals.md dimensions only if Section 1b is sparse."` — implicit negative (don't use generic if specific is available)
2. `"never use Bash(cat << 'EOF') or heredoc commands for file creation"` — direct negative
3. `"not re-derive domain context"` — direct negative
4. `"Keep guardrails minimal — each adds latency."` — qualitative rather than positive constraint

The guide's conversion table maps these directly:
- "never use heredoc for file creation" → "Use the Write tool for all file creation"
- "not re-derive domain context" → "Use domain context from Section 1b as-is; treat it as authoritative input"
- "Keep guardrails minimal" → "Include only guardrails that fire on every request for catastrophic failure modes; defer quality signals to offline flywheel"

The `write_sections_5_6_7` step also includes `**ALWAYS use the Write tool**` — an all-caps emphasis that signals the instruction may be insufficient on its own, which is a symptom of framing it negatively first.

---

### W4 — `<success_criteria>` is a checklist at the end; context placement is inverted (§8)

**Guide rule (§8 Action 1):** "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning."

**Guide rule (§8 Action 2):** "Place the primary document or input at the very end. Content the model must act on should close the prompt."

The `<success_criteria>` block is placed after `<execution_flow>` — at the end of the prompt. But it is a constraint on output quality that the model should hold throughout execution, not just check at the end. It belongs near the top, after `<role>`, so it receives high-attention placement.

Conversely, `<input>` is placed in the upper-middle of the prompt. Since inputs are the primary content the model acts on, they should close the prompt (or at minimum appear later than the task instruction). The current ordering is: role → required_reading → input → execution_flow → success_criteria. The guide-recommended ordering is: task/persona → context/background → input (at end).

---

### W5 — No `<constraints>` block; permission pairs absent (§14)

**Guide rule (§14):** "Pair every restriction with what IS permitted, stated equally concretely. This eliminates ambiguity about what actions remain available."

**Guide rule (§22 Pattern 9):** "Express allowed tools as the narrowest patterns that satisfy the task."

The agent lists tools in frontmatter (`tools: Read, Write, Bash, Grep, Glob, AskUserQuestion`) but provides no `<constraints>` block in the body. There is no explicit statement of what the agent may NOT do (e.g., modify sections 1–4 of AI-SPEC.md, run tests, commit files). The only behavioral constraint is buried in `write_sections_5_6_7`: "never use heredoc commands." There is no `<permitted>` / `<reserved_for_human_review>` pairing. The tool list in frontmatter also grants full `Bash` access — a broad permission — without narrowing it to the grep command pattern already demonstrated in the prompt body.

---

### W6 — `<required_reading>` is a non-standard section not defined in guide vocabulary; doubles as meta-instruction (§4, §8)

**Guide rule (§4 Action 2):** "When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag from the guide's vocabulary."

**Guide rule (§8, Meta-instruction injection):** "Some instructions are out of band — not part of the conversation but injected as system context. Wrap them in `<system_note>` to keep them clearly separated."

The `<required_reading>` tag is not in the guide's XML tag vocabulary. Its content is a behavioral instruction ("read this before doing anything"), not a reference section. The guide's `<system_note>` tag is the appropriate wrapper for out-of-band instructions that should not appear in user-facing output. Additionally, the self-referential note at the bottom of `<input>` (`**If prompt contains <required_reading>, read every listed file before doing anything else.**`) duplicates the instruction already present in `<required_reading>` — a violation of §11 Action 3 ("State each instruction exactly once").

---

### W7 — No few-shot examples for rubric writing or section formatting (§3, §22 Pattern 2)

**Guide rule (§22 Pattern 2):** "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

**Guide rule (§3):** "Use 2–5 examples for most tasks."

The rubric format is specified as a template:
```
> PASS: {specific acceptable behavior in domain language}
> FAIL: {specific unacceptable behavior in domain language}
> Measurement: Code / LLM Judge / Human
```

But no example rubric is shown in filled-in form. The model must infer what "specific acceptable behavior in domain language" looks like from the template alone. A single filled example — e.g., for a RAG faithfulness dimension — would calibrate output quality far more precisely than the template. Similarly, the section format bullet list in `write_sections_5_6_7` would benefit from at least one example section with column headers shown.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with a specific `<persona>` that uses the reframe pattern

```xml
<persona>
You are an AI evaluation architect. Your job is not to describe what an eval system could do —
it's to specify exactly how to measure whether it fails.

Your strengths:
- Translating qualitative domain rubric ingredients into code-testable or LLM-judge-testable criteria
- Matching measurement approach (code / LLM judge / human) to failure mode severity
- Designing minimal guardrail sets that intercept catastrophic failures without adding unnecessary latency
</persona>
```

This applies §6 Action 2 (specific persona), §6 Reframe Pattern (displaces the "describe what could work" prior), and §6 Strengths Listing.

---

### Improvement 2 — Add a top-level `<output_format>` block with an example section

```xml
<output_format>
Write directly to AI-SPEC.md using the Write tool. Produce three sections in this exact structure:

## 5. Evaluation Strategy

| Dimension | Priority | Measurement | PASS Criterion | FAIL Criterion |
|-----------|----------|-------------|----------------|----------------|
| Context faithfulness | Critical | RAGAS | Score ≥ 0.85 on held-out set | Score < 0.85 or citation absent |

**Reference dataset**: {size} examples — {composition description}. Labeling: {approach}.
**CI command**: `promptfoo eval --config evals/ci.yaml`

## 6. Guardrails

| Guardrail | Type | Trigger | Action |
|-----------|------|---------|--------|
| PII leak detection | Online | Every response | Block + log |

**Offline flywheel**: Sample {N}% of production traffic daily for {metric}.

## 7. Production Monitoring

- **Tracing**: {tool} — install: `{pip/npm command}`
- **Key metrics**: {list}
- **Alert thresholds**: {list}
- **Sampling**: {strategy}
</output_format>
```

This applies §7, §22 Pattern 3. Concrete column headers eliminate the variance in table structure across runs.

---

### Improvement 3 — Convert all negative instructions to positive equivalents

Replace:

| Current (negative) | Replacement (positive) |
|--------------------|------------------------|
| `"never use Bash(cat << 'EOF') or heredoc commands for file creation"` | `"Use the Write tool for all file creation."` |
| `"not re-derive domain context"` | `"Accept Section 1b rubric ingredients as authoritative; build directly from them."` |
| `"Fall back to generic ai-evals.md dimensions only if Section 1b is sparse"` | `"Use Section 1b as your primary source. Use ai-evals.md generic dimensions only when Section 1b has fewer than 3 entries for the given system_type."` |

Remove the duplicate in `<input>` (`**If prompt contains <required_reading>...`). State the required-reading instruction once, in `<system_note>`.

---

### Improvement 4 — Move `<success_criteria>` to the top; move `<input>` to the bottom

Reorder the prompt body as follows:

1. `<persona>` (new — see Improvement 1)
2. `<success_criteria>` (moved up — high attention position)
3. `<system_note>` (replaces `<required_reading>` — out-of-band instruction)
4. `<execution_flow>` (middle — background process)
5. `<constraints>` (new — see Improvement 5)
6. `<output_format>` (new — see Improvement 2)
7. `<input>` (moved to end — primary content the model acts on)

This applies §8 Actions 1–3 directly.

---

### Improvement 5 — Add `<constraints>` block with explicit permission pairs

```xml
<constraints>
  <permitted>
    - Read AI-SPEC.md, CONTEXT.md, REQUIREMENTS.md, and ai-evals.md
    - Run: grep -r "langfuse|langsmith|arize|phoenix|braintrust|promptfoo|ragas" to detect existing tools
    - Write to the sections of AI-SPEC.md numbered 5, 6, and 7 only
    - Ask one clarifying question via AskUserQuestion if domain context is absent after reading all artifacts
  </permitted>
  <reserved_for_human_review>
    - Modifying Sections 1–4 of AI-SPEC.md
    - Creating new files other than updating AI-SPEC.md
    - Running commands other than the tooling-detection grep above
  </reserved_for_human_review>
</constraints>
```

Also narrow frontmatter tool permission from `Bash` to `Bash(grep:*)` to match §22 Pattern 9.

---

### Improvement 6 — Add one filled rubric example to `write_rubrics`

After the template, add:

```xml
<example>
  <input>system_type: RAG, domain rubric ingredient: "answers must cite the retrieved source passage"</input>
  <output>
    **Source Citation** | Critical | RAGAS + Code
    PASS: Every answer includes at least one citation `[Source N]` that maps to a retrieved chunk.
    FAIL: Answer makes a factual claim with no citation, or citation references a chunk not in the retrieved set.
    Measurement: Code (check citation presence) + RAGAS context_precision ≥ 0.80
  </output>
</example>
```

This applies §22 Pattern 2 and §3 Action 3.

---

## Overall Score: 5 / 10

**Justification:**

The agent has a sound structural skeleton: named execution steps, explicit input enumeration, opinionated tooling defaults, a concrete rubric template, and self-contained operation. These are real strengths that reflect several guide principles correctly.

However, five significant weaknesses hold it below average for a production agent:

1. The persona is generic and adds no behavioral constraint — the single highest-leverage improvement in any prompt.
2. The output format for the machine-consumed artifact (AI-SPEC.md sections 5–7) is not specified with the concreteness required by §7 and §22 Pattern 3. Variance in table structure and section headers across runs will be high.
3. Context placement is inverted: success criteria belong at the top (high attention), input belongs at the bottom.
4. Three negative instructions remain unrewritten.
5. No few-shot rubric example is provided despite the guide's clear requirement (§22 Pattern 2) that qualitative output instructions be accompanied by at least one calibrating example.

A score of 5 reflects "structurally present but behaviorally underspecified" — it would produce plausible output on easy inputs but degrade unpredictably on edge cases due to the missing format spec, persona constraints, and example calibration.
