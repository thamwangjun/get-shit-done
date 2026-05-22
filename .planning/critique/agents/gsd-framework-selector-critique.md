# Critique: gsd-framework-selector.md

- **Agent**: `gsd-framework-selector.md`
- **Date evaluated**: 2026-04-30
- **Guide version**: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

| # | Section | Applicability |
|---|---------|---------------|
| 1 | Task Specification | High — agent has a clear decision task |
| 3 | Few-Shot Example Construction | Medium — no examples present |
| 4 | Formatting and Structure | High — uses XML tags throughout |
| 5 | Instruction Framing | High — multiple instructions and a scoring rule |
| 6 | Persona Assignment | High — uses `<role>` as persona |
| 7 | Output Format Handling | High — dual output format specified |
| 8 | Context Placement | High — ordering of sections matters |
| 10 | Prompt Length and Compression | Medium — moderate length; some bloat |
| 11 | System vs. User Prompt Allocation | High — agent frontmatter and body both carry instructions |
| 13 | Structural Architecture Patterns | High — template variables and modularity |
| 14 | Constraint Enforcement | Medium — hard constraints referenced but not enforced inline |
| 15 | Decision Frameworks | High — scoring logic present |
| 17 | Agent and Subagent Patterns | High — spawned by orchestrators; returns structured output |
| 19 | Modularity and Composition | Medium — scope boundaries partially stated |
| 21 | Tone and Style Rules | Medium — output format exists but lacks numeric size constraints |
| 22 | Production Patterns (1, 2, 3, 9) | High — persona, examples, output format, tool permissions |

---

## Strengths

### S1 — Concrete structured output format (Guide §7, §22 Pattern 3)
The `<output_format>` section provides two distinct, fully specified blocks: a machine-readable `FRAMEWORK_RECOMMENDATION:` block for the orchestrator and a human-facing display block. This directly satisfies §22 Pattern 3 ("output format specified completely and upfront") and §7's requirement for explicit field names and ordering. The dual-block design correctly separates structured data (for parsing) from display text (for the user).

### S2 — Codebase pre-scan before interview (Guide §1 Action 1, §8)
The `<project_context>` section scans for existing technology signals before asking questions, and the comment "This prevents recommending a framework the team has already rejected" makes the *why* explicit. This is good practice per §1's requirement to extract task components before writing prompt text, and §8's principle of providing relevant context rather than leaving the model to infer it.

### S3 — Hard-constraint elimination step in scoring (Guide §14, §15)
The `<scoring>` section follows an explicit filtering sequence: eliminate hard-constraint failures first, then score, then weight. This mirrors §14's constraint enforcement pattern and §15's criteria-checklist pattern ("Choose a simpler tier for any 'no' answer").

### S4 — Structured interview with bounded question count (Guide §16)
The `≤6-question` ceiling and the single `AskUserQuestion` call requirement maps cleanly to §16's round-based interview pattern. The instruction to "skip what the codebase scan or upstream CONTEXT.md already answers" prevents redundant questions — consistent with §10's prompt-compression principle applied to conversational overhead.

### S5 — Success criteria checklist (Guide §23)
The `<success_criteria>` block at the end is a lightweight self-check mechanism. While not a full §23 checklist, it operationalizes the key completion conditions, which is better than omitting them entirely.

---

## Weaknesses

### W1 — Persona is vague and non-specific (Guide §6 Actions 1–2, §22 Pattern 1)

**Guide requirement (§6 Action 2):** "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective."

**Offending text:**
```
<role>
You are a GSD framework selector. Answer: "What AI/LLM framework is right for this project?"
Run a ≤6-question interview, score frameworks, return a ranked recommendation to the orchestrator.
</role>
```

The `<role>` block conflates identity with task instruction. "GSD framework selector" does not constrain register, voice, or domain-specific style — it describes a function, not a persona. The three imperative sentences that follow are task instructions, not persona definition. Per §22 Pattern 1, the identity should be a "specific expert in the exact domain," e.g., a senior AI solutions architect with experience evaluating framework trade-offs. Additionally, the guide's XML tag vocabulary (§4) uses `<persona>`, not `<role>` — tag names carry semantic meaning that the guide expects to be consistent.

---

### W2 — No few-shot examples for the scoring/recommendation step (Guide §3, §22 Pattern 2)

**Guide requirement (§22 Pattern 2):** "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

**Offending text:**
```
<scoring>
Apply decision matrix from `ai-frameworks.md`:
1. Eliminate frameworks failing any hard constraint
2. Score remaining 1-5 on each answered dimension
3. Weight by user's stated priority
4. Produce ranked top 3 — show only the recommendation, not the scoring table
</scoring>
```

The instruction "Score remaining 1-5 on each answered dimension" and "Weight by user's stated priority" are abstract without a worked example. There is no sample `rationale` output, no demonstration of what a 2–3 sentence rationale looks like in practice, and no example of how to apply weighting. Per §3 and §22 Pattern 2, at least one complete `FRAMEWORK_RECOMMENDATION:` example output should be embedded so the model calibrates the density, tone, and specificity of the `rationale` field.

---

### W3 — Output format contains no size constraints on prose fields (Guide §21)

**Guide requirement (§21):** "Numbered limits beat qualitative descriptors: 'Brief' means different things; 'under 8 words' does not."

**Offending text:**
```
rationale: {2-3 sentences — why this fits their specific answers}
alternative_reason: {1 sentence}
```

"2–3 sentences" is better than nothing, but the guide's standard is word- or character-count limits. The display block (`◆ Primary Pick: {framework} / {rationale}`) has no size constraint at all. Without numeric limits, rationale length will vary across calls in ways that break downstream formatting assumptions.

---

### W4 — Scoring logic is opaque and externalized without fallback (Guide §15, §14)

**Guide requirement (§15):** "For tiered recommendations, ASCII trees are readable and directive." and "Before recommending a complex approach, enumerate criteria that must all be true."

**Offending text:**
```
<scoring>
Apply decision matrix from `ai-frameworks.md`:
1. Eliminate frameworks failing any hard constraint
2. Score remaining 1-5 on each answered dimension
3. Weight by user's stated priority
</scoring>
```

The entire decision logic is delegated to an external file (`ai-frameworks.md`) that may not exist, may be stale, or may be inaccessible at runtime. The `<required_reading>` section instructs the model to read the file before proceeding, but there is no fallback if the file is absent, and the scoring rubric itself (which dimension maps to which score, how weighting works) is fully opaque. Per §15's decision-framework pattern, at least a skeleton of the criteria tree should be inlined. An externally-only decision matrix is a single-point-of-failure with no graceful degradation path.

---

### W5 — Negative instruction present in scoring output (Guide §5 Action 1)

**Guide requirement (§5 Action 1):** "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions."

**Offending text:**
```
4. Produce ranked top 3 — show only the recommendation, not the scoring table
```

"show only the recommendation, not the scoring table" is a negated instruction. The positive equivalent would be: "Present only the ranked recommendation text. Omit the scoring table from all output." The negative form ("not the scoring table") leaves the model to reason about what it is not allowed to show, rather than specifying exactly what to show.

---

### W6 — No explicit context-placement discipline (Guide §8)

**Guide requirement (§8 Actions 1–3):** "Place the task instruction at the very start of the prompt... Place background or supplementary context in the middle... Place the primary document or input at the very end."

The current ordering is:
1. `<role>` — task + identity (correct: leads)
2. `<required_reading>` — reference material
3. `<project_context>` — background scan (supplementary)
4. `<interview>` — primary active task
5. `<scoring>` — logic
6. `<output_format>` — output spec
7. `<success_criteria>` — checklist

Per §8, the `<output_format>` should be close to the top (it is part of task specification), and `<success_criteria>` as a trailing checklist risks getting low attention and being skipped. The guide explicitly states that "middle-position content receives the least attention" — `<required_reading>` and `<project_context>` are placed where they compete for positional attention with the `<interview>` block, which is the primary task trigger.

---

### W7 — Tool permissions are not scoped to minimum required patterns (Guide §22 Pattern 9)

**Guide requirement (§22 Pattern 9):** "Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access."

**Offending text (frontmatter):**
```
tools: Read, Bash, Grep, Glob, WebSearch, AskUserQuestion
```

`Bash` is an unrestricted grant. The only Bash command this agent needs is the `find` invocation in `<project_context>`. Per §22 Pattern 9, this should be scoped to `Bash(find:*)` at most. Granting full `Bash` access gives the agent a permission surface far wider than its task requires, with no defined blast-radius limit.

---

## Concrete Improvements

### Fix W1 — Replace `<role>` with a specific `<persona>` and separate task instruction

```xml
<persona>
You are a senior AI solutions architect specializing in evaluating LLM frameworks for production systems.
Your strengths:
- Mapping technical requirements to framework trade-offs across LangChain, LlamaIndex, LangGraph, Claude API, and OpenAI SDK
- Identifying hard constraints that disqualify frameworks early
- Producing ranked, rationale-driven recommendations a developer team can act on immediately
</persona>

<task>
Determine the right AI/LLM framework for this project.
Run a structured interview (≤ 6 questions), apply the decision matrix, and return a ranked recommendation to the orchestrator.
</task>
```

---

### Fix W2 — Add a worked example to `<scoring>` and `<output_format>`

Embed at minimum one complete `FRAMEWORK_RECOMMENDATION:` example inside `<output_format>`:

```xml
<output_format>
...
<example>
FRAMEWORK_RECOMMENDATION:
  primary: LangGraph 0.2
  rationale: The team is building a multi-agent orchestration system in Python with a production reliability requirement. LangGraph's checkpointing and explicit state graph model directly addresses fault tolerance; its Python-first API matches the team's stack without introducing a new language dependency.
  alternative: Claude API with tool use
  alternative_reason: Simpler surface area if the orchestration needs prove less complex than anticipated.
  system_type: Multi-Agent
  model_provider: Model-agnostic
  eval_concerns: agent_trajectory_correctness, state_recovery, latency_per_step
  hard_constraints: No vendor lock-in, Must support local/self-hosted models
  existing_ecosystem: langchain==0.1.14
</example>
```

---

### Fix W3 — Add word-count constraints to prose fields

Replace:
```
rationale: {2-3 sentences — why this fits their specific answers}
```

With:
```
rationale: {2-3 sentences, maximum 60 words — why this fits their specific answers}
alternative_reason: {1 sentence, maximum 25 words}
```

Apply the same to the display block:
```
◆ Primary Pick: {framework}
  {rationale — 2-3 sentences, 40-60 words}
```

---

### Fix W4 — Inline a fallback scoring skeleton

Add a `<scoring_fallback>` block for when `ai-frameworks.md` is unavailable:

```xml
<scoring>
Read `~/.claude/get-shit-done/references/ai-frameworks.md` for the full decision matrix.
If the file is unavailable, apply this fallback criteria skeleton:

1. Eliminate any framework failing a hard constraint (§ Constraints answer)
2. Score each remaining framework 1–5 on:
   - Language fit (Python / TypeScript / both)
   - System-type match (RAG / Multi-Agent / Conversational / etc.)
   - Stage readiness (prototype vs. production)
   - Provider alignment (locked vs. model-agnostic)
3. Apply 1.5× weight to the user's stated Priority answer
4. Present only the top-ranked primary recommendation and one alternative
</scoring>
```

---

### Fix W5 — Convert negative instruction

Replace:
```
4. Produce ranked top 3 — show only the recommendation, not the scoring table
```

With:
```
4. Present the top-ranked primary recommendation and one alternative. Include rationale text only — omit all intermediate scores, weights, and ranking tables.
```

---

### Fix W7 — Scope Bash permission

Change frontmatter from:
```
tools: Read, Bash, Grep, Glob, WebSearch, AskUserQuestion
```

To:
```
tools: Read, Bash(find:*), Grep, Glob, WebSearch, AskUserQuestion
```

---

## Overall Score: 6 / 10

**Justification:** The agent has a sound structural skeleton — dual output format, codebase pre-scan, bounded interview, hard-constraint filtering, and a success checklist. These reflect genuine prompt engineering discipline. However, it fails on four issues that have measurable production impact: the persona is generic and mistagged (§6), the critical scoring step has no calibrating example and no fallback (§3, §15), tool permissions are over-granted (§22 Pattern 9), and a negative instruction slips through (§5). The output format lacks numeric size constraints on prose fields (§21). None of these are fundamental design failures — they are fixable without restructuring the agent — but together they represent enough deviation from the guide's actionable rules to pull the score below a passing threshold. With the W1, W2, W4, and W7 fixes applied, the score would rise to 8.
