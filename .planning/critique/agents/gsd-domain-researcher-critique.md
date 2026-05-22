# Critique: gsd-domain-researcher.md

**Agent**: `agents/gsd-domain-researcher.md`

**Date**: 2026-04-30

---

## Guide Sections Evaluated

| # | Section | Applicable? |
|---|---------|-------------|
| 1 | Task Specification | Yes |
| 2 | Chain-of-Thought Decisions | Partial |
| 3 | Few-Shot Example Construction | Yes |
| 4 | Formatting and Structure | Yes |
| 5 | Instruction Framing | Yes |
| 6 | Persona Assignment | Yes |
| 7 | Output Format Handling | Yes |
| 8 | Context Placement | Yes |
| 10 | Prompt Length and Compression | Yes |
| 11 | System vs. User Prompt Allocation | Yes |
| 13 | Structural Architecture Patterns | Partial |
| 14 | Constraint Enforcement | Yes |
| 17 | Agent and Subagent Patterns | Yes |
| 19 | Modularity and Composition | Partial |
| 21 | Tone and Style Rules | Yes |
| 22 | Production Patterns | Yes |

---

## Strengths

### S1 — Well-scoped persona with domain-specific focus (Guide §6, §22 Pattern 1)

The `<role>` block is tight and domain-scoped: "You are a GSD domain researcher. Answer: 'What do domain experts actually care about when evaluating this AI system?'" This follows §6's role-domain mapping table — not a generic "researcher" but a specialist constrained to domain expert evaluation criteria. The persona correctly omits generic expert framing ("20 years of experience").

### S2 — Concrete rubric format with calibrating examples (Guide §22 Pattern 2, §3)

The `<step name="synthesize_rubric_ingredients">` block provides a Good/Bad/Stakes/Source template with a worked example (Citation precision). This satisfies §22 Pattern 2 ("Every abstract instruction paired with a calibrating example") and gives the model measurable criteria rather than vague qualitative descriptors like "accurate" or "thorough".

### S3 — Explicit execution flow with named steps (Guide §16)

The `<execution_flow>` block with five named `<step>` elements creates clear phase boundaries. Each step has a single responsibility and a defined completion state, aligned with §16's guidance on named phases as cognitive boundaries.

### S4 — Output section template with concrete field scaffolding (Guide §7, §22 Pattern 3)

`<step name="write_section_1b">` specifies the exact markdown structure for Section 1b — all field names, a table format for expert roles, a placeholder for research sources. This satisfies §22 Pattern 3 ("Output format specified completely and upfront").

### S5 — Quality standards stated positively (Guide §5 Action 1)

`<quality_standards>` is written almost entirely in positive imperative form: "Rubric ingredients in practitioner language", "Good/Bad specific enough that two domain experts would agree". This follows §5's instruction to convert negative constraints to positive equivalents.

### S6 — Documentation fallback chain for MCP tools (Guide §17)

The `<documentation_lookup>` block provides an ordered fallback (MCP → CLI) and explicitly instructs the agent not to skip lookups. This demonstrates the self-contained agent principle from §17 ("Each agent receives its full operating instructions directly").

### S7 — Success checklist as verifiable exit criteria (Guide §1 Action 1)

`<success_criteria>` enumerates seven checkboxes that map directly to task outputs. This partially satisfies §1's `<quality_bar>` requirement.

---

## Weaknesses

### W1 — Role block uses a non-standard tag; persona is thin (Guide §4 Action 2, §6)

**Problem**: The agent uses `<role>` instead of the guide-standard `<persona>` tag. §4 specifies a shared XML vocabulary; deviating from it breaks composability and reduces the semantic signal the model receives. The guide's tag vocabulary table (§4) lists `<persona>` as the top-level structural tag for "role, voice, strengths, and identity".

Beyond naming, the role content is only two sentences and contains no strengths enumeration. §6 ("Strengths listing") explicitly requires enumerating what the agent is good at to bias behavior toward those capabilities:

> "Explicitly enumerate what the agent is good at. This biases behavior toward those capabilities."

**Agent text**: `"You are a GSD domain researcher. Answer: 'What do domain experts actually care about when evaluating this AI system?' Research the business domain — not the technical framework. Write Section 1b of AI-SPEC.md."`

The last sentence ("Write Section 1b") is a task directive, not a persona descriptor, and belongs in `<task>` instead.

---

### W2 — No `<task>` or `<audience>` block; intent, audience, and quality bar are not co-located (Guide §1, §4 Action 2)

**Problem**: §1 requires three components in every prompt: (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. §1 further requires encoding the audience explicitly:

> "Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

The agent has no `<task>` tag wrapping the primary instruction and no `<audience>` tag. The downstream consumer (the eval-planner) is mentioned only in the frontmatter `description` field — invisible to the model at runtime. Without explicit audience encoding, the model cannot calibrate vocabulary level, depth, or framing for the eval-planner who will consume its output.

---

### W3 — `<input>` block placed before `<execution_flow>` but after `<required_reading>`, violating context placement rules (Guide §8)

**Problem**: §8 states:
- Task instruction at the very start (highest attention)
- Background context in the middle
- Primary input at the very end (highest attention — recency)

The actual order in the file is:

1. `<role>` (task)
2. `<documentation_lookup>` (operational instructions)
3. `<required_reading>` (constraint)
4. `<input>` (the primary content the model acts on)
5. `<execution_flow>` (the bulk of instructions)
6. `<quality_standards>` (constraints)
7. `<success_criteria>` (quality bar)

The `<input>` block (the variables the agent must act on) appears mid-prompt rather than at the end. The `<execution_flow>` — a major instructional block — follows `<input>`, which means the model receives the input before it has processed the full instruction set. This violates the task-first / input-last ordering that §8 mandates.

---

### W4 — Negative instructions survive in `<quality_standards>` (Guide §5 Action 1)

**Problem**: §5 Action 1 requires scanning for negated instructions and converting them to positive equivalents. Three remain:

- `"Do not fabricate criteria — only surface research or well-established practitioner knowledge"`
- `"do not list every possible regulation"`
- `"not AI/ML jargon"` (embedded in "practitioner language, not AI/ML jargon")

The guide's conversion table shows the required pattern:
- `"Do not fabricate criteria"` → `"Surface only research-backed or well-established practitioner knowledge; flag uncertain claims as needing expert validation"`
- `"do not list every possible regulation"` → `"Include only regulations directly relevant to this deployment context"`
- `"not AI/ML jargon"` → `"Use domain practitioner vocabulary throughout"`

---

### W5 — No `<constraints>` block with permission pairing; tool scope is ungated (Guide §14, §17, §22 Pattern 9)

**Problem**: The frontmatter grants a broad tool set: `Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*`. §14 requires pairing every restriction with an equally concrete permission, and §22 Pattern 9 calls for narrowest-possible tool patterns:

> "Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access."

The agent has no `<constraints>` block in the body, no `<permitted>` / `<reserved_for_human_review>` sub-tags, and no restriction on what `Bash` commands are permissible. `Bash` is unrestricted — the agent could execute any shell command. Given that this agent's function is research-and-write (read inputs + run searches + write one section), `Bash` access should be scoped or justified, and the constraints made explicit.

---

### W6 — Output format for the agent's own response is unspecified (Guide §7, §17, §21)

**Problem**: The agent specifies the output format for the *section it writes* (Section 1b of AI-SPEC.md) but says nothing about the format of its own terminal response to the orchestrator that spawned it. §17 states:

> "Subagent output is terse (for the orchestrating model). Standalone output is detailed (for the human)."

The guide provides the template conditional:
```
${IS_SUBAGENT?"When you complete the task, respond with a concise report covering what was
done and any key findings...":"When you complete the task simply respond with a detailed writeup."}
```

The agent is spawned by `/gsd-ai-integration-phase orchestrator` (per frontmatter description), yet has no instruction on how to format its completion response. The orchestrator receives whatever the model decides to emit — which varies across calls.

---

### W7 — `<required_reading>` instruction is duplicated inside `<input>` (Guide §11 Action 3)

**Problem**: §11 Action 3 states: "State each instruction exactly once." The `<required_reading>` tag already directs the agent to read `ai-evals.md`. Then `<input>` repeats: `"**If prompt contains `<required_reading>`, read every listed file before doing anything else.**"` This is the same instruction restated in a different location — a direct violation of the no-duplication rule.

---

### W8 — No tie-breaking rule for domain ambiguity (Guide §5, §22 Pattern 4)

**Problem**: §5 requires explicit tie-breaking rules, and §22 Pattern 4 states the tie-breaking rule "fires at the margin." The agent handles the ambiguous-domain case with:

> "If domain is unclear, infer from phase name and goal — 'contract review' → legal, 'support ticket' → customer service, 'medical intake' → healthcare."

This provides examples but no explicit rule for what to do when inference still fails — there is no "when in doubt, do X" instruction. The fallback `<quality_standards>` entry ("If domain genuinely unclear, write a minimal section noting what to clarify") is the intended tie-breaker but is buried in a standards block rather than encoded as an explicit conditional instruction at the point of ambiguity in `<step name="extract_domain_signal">`.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with `<persona>` and add strengths enumeration

```xml
<persona>
You are a GSD domain researcher — a specialist in surfacing what practitioners in a given
industry actually care about when evaluating an AI system.

Your job is NOT to evaluate the technical implementation — it is to surface the practitioner
lens: evaluation criteria, failure modes, and regulatory context that a domain expert would
apply before a rubric designer formalizes them into metrics.

Your strengths:
- Identifying the correct industry vertical from sparse phase artifacts
- Mapping practitioner evaluation criteria to specific, testable rubric dimensions
- Distinguishing domain-specific failure modes from generic LLM failure patterns
- Surfacing directly relevant regulations without listing every adjacent one
- Writing in practitioner vocabulary, not AI/ML jargon
</persona>
```

### Improvement 2 — Add `<task>` and `<audience>` blocks

```xml
<task>
Research the business domain of the AI system described in the phase artifacts.
Write Section 1b (Domain Context) of AI-SPEC.md: practitioner evaluation criteria,
known production failure modes, directly relevant regulatory constraints, and
the domain expert roles needed for evaluation.

The output will be consumed by the eval-planner agent, which will turn your rubric
ingredients into measurable scoring dimensions. Write for a technical audience that
understands LLMs but is not a domain expert in the field you are researching.
</task>

<audience>
The eval-planner agent: a technical AI agent that knows LLM evaluation methodology
but has no domain expertise. It needs practitioner criteria in plain language with
enough specificity to design rubrics without further research.
</audience>
```

### Improvement 3 — Move `<input>` to the end of the prompt (after all instructions)

Reorder the file so `<input>` is the last block before any closing tags. All instructional blocks (`<persona>`, `<task>`, `<audience>`, `<documentation_lookup>`, `<required_reading>`, `<execution_flow>`, `<quality_standards>`, `<success_criteria>`) should precede `<input>`. This places the primary content the model acts on at recency position per §8.

### Improvement 4 — Convert remaining negative instructions in `<quality_standards>`

Replace:

```
- Do not fabricate criteria — only surface research or well-established practitioner knowledge
- only what is directly relevant — do not list every possible regulation
- Rubric ingredients in practitioner language, not AI/ML jargon
```

With:

```
- Surface only research-backed or well-established practitioner knowledge;
  flag any uncertain claim as "requires domain expert validation"
- Include only regulations with a direct compliance obligation for this deployment context
- Write rubric ingredients in practitioner vocabulary throughout; translate any AI/ML term
  into the language the domain professional would use
```

### Improvement 5 — Add a `<constraints>` block with permission scoping and completion response format

```xml
<constraints>
  <permitted>
    - Read any file at the paths provided in the input
    - Run WebSearch and WebFetch for domain research
    - Use mcp__context7__* or the ctx7 CLI for documentation lookups
    - Write to AI-SPEC.md at ai_spec_path using the Write tool only
    - Run read-only Bash commands (grep, find, cat) if needed to inspect project files
  </permitted>

  <reserved_for_human_review>
    - Writing to any file other than AI-SPEC.md
    - Running Bash commands that modify files or execute non-read operations
  </reserved_for_human_review>
</constraints>

<output_format>
When you complete the task, respond with a concise report (3-5 sentences) covering:
- the domain vertical identified
- how many rubric ingredients were written
- any regulatory constraints found
- whether domain was inferred or explicit in the artifacts
The caller will relay this to the orchestrator; omit reasoning and intermediate steps.
</output_format>
```

### Improvement 6 — Remove duplicated reading instruction; add explicit tie-breaking for domain ambiguity

Remove the `<required_reading>` enforcement note from `<input>`. It already appears in the dedicated `<required_reading>` block.

Add to `<step name="extract_domain_signal">`:

```xml
<step name="extract_domain_signal">
Read AI-SPEC.md, CONTEXT.md, REQUIREMENTS.md. Extract: industry vertical, user population,
stakes level, output type.

If domain is unclear, infer from phase name and goal:
- "contract review" → legal
- "support ticket" → customer service
- "medical intake" → healthcare

<tie_breaking>
When domain inference is still ambiguous after reading all artifacts and applying the
examples above, write Section 1b with the most plausible inference explicitly labeled
as an assumption, and add a note: "Domain assumed as {vertical} — confirm with product
owner before rubric calibration."
Do not block on ambiguity; write the minimal section and flag the assumption.
</tie_breaking>
</step>
```

---

## Overall Score: 6 / 10

**Justification**: The agent demonstrates genuine prompt engineering competence in several areas — the calibrating example in the rubric template, the named-step execution flow, the positive quality standards, and the MCP fallback chain are all well-executed. The output format for the section the agent writes is thorough and concrete.

The score is held back by structural issues that compound: the wrong persona tag (breaking vocabulary conventions), no explicit `<task>` or `<audience>` encoding (the two highest-priority components per §1), `<input>` in the wrong position (violating §8's context placement rule that most directly affects model attention), duplicated instructions (§11 violation), and complete absence of a `<constraints>` block despite the agent having broad tool access including unrestricted `Bash`. These are not cosmetic issues — the context placement violation and missing audience encoding directly affect output quality and consistency across runs.
