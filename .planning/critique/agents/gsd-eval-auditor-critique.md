# Prompt Engineering Critique: gsd-eval-auditor

**Agent**: `gsd-eval-auditor.md`
**Critique Date**: 2026-04-30
**Guide Version**: PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

| # | Section | Applicable? |
|---|---------|-------------|
| 1 | Task Specification | Yes |
| 2 | Chain-of-Thought Decisions | Yes |
| 3 | Few-Shot Example Construction | Partial |
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

### S1 — Explicit multi-phase workflow structure (Guide §16)
The agent uses named `<step>` tags inside `<execution_flow>`, giving the model clear cognitive boundaries. Steps are sequenced logically: read artifacts → scan codebase → score dimensions → audit infrastructure → calculate scores → write output. This mirrors the guide's `<phase id="…" name="…">` pattern and prevents premature output.

### S2 — Numeric scoring formula and verdict thresholds (Guide §14, §22 Pattern 6)
The scoring formula is explicit and deterministic:
```
coverage_score  = covered_count / total_dimensions × 100
infra_score     = (tooling + dataset + cicd + guardrails + tracing) / 5 × 100
overall_score   = (coverage_score × 0.6) + (infra_score × 0.4)
```
Verdict thresholds use numeric ranges (0–39, 40–59, 60–79, 80–100) rather than qualitative terms, exactly as the guide requires. This satisfies Guide §14's "Confidence thresholds are numeric, not qualitative" rule and Pattern 6's confidence-floor instruction.

### S3 — Hard-enumerated scoring rubric (Guide §14)
The `score_dimensions` step provides a three-state rubric table (COVERED/PARTIAL/MISSING) with criteria for each state. This is a partial implementation of the guide's explicit permission-pair pattern: each status level carries its own definition, reducing model ambiguity.

### S4 — Concrete output template with populated examples (Guide §7, §22 Pattern 3)
The `write_eval_review` step includes a fully specified markdown output template with field names, column headers, and literal placeholder syntax. This satisfies Guide §22 Pattern 3: "Output format specified completely and upfront."

### S5 — Context budget management (Guide §10)
The agent includes an explicit context budget instruction: "Load project skills first (lightweight). Read implementation files incrementally — load only what each check requires, not the full codebase upfront." This aligns with Guide §10's requirement to remove redundant context and §8 Action 4's "trim all context to what is directly relevant."

### S6 — Tool constraint specified in frontmatter (Guide §17)
The frontmatter specifies `tools: Read, Write, Bash, Grep, Glob` — a concrete allowed-tool list. While less granular than Guide §22 Pattern 9's command-prefix scoping, it is present and machine-readable.

### S7 — Success criteria checklist (Guide §1)
The `<success_criteria>` block enumerates nine checkboxes that define a complete, high-quality execution. This partially satisfies Guide §1 Action 1's requirement to make explicit what a correct response looks like.

---

## Weaknesses

### W1 — Persona is generic and fails the role-domain mapping rule (Guide §6)

**Finding**: The `<role>` tag contains:
> "You are a GSD eval auditor. Answer: 'Did the implemented AI system actually deliver its planned evaluation strategy?'"

This is a broad label with a single rhetorical question. It does not constrain voice, decision-making register, or strengths — the three things the guide requires a persona to supply. Guide §6 Action 2 states: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The guide's role-domain mapping table explicitly contrasts "Tester" (ineffective) with "Verification specialist. Your job is to try to break it." (effective). The eval auditor is a verification role and should use the adversarial reframe pattern.

Guide §6 also recommends enumerating strengths explicitly (§6, Strengths listing subsection). None are listed here.

**Tag note**: The guide's standard top-level structural tag for role is `<persona>`, not `<role>`. Using a non-standard tag degrades composability with the shared XML vocabulary (Guide §4, XML tag vocabulary).

### W2 — No XML tags for top-level sections; mixed use of markdown and XML (Guide §4)

**Finding**: The agent mixes XML tags (`<role>`, `<required_reading>`, `<input>`, `<execution_flow>`, `<step>`, `<success_criteria>`) with bold markdown (`**Context budget:**`, `**Project skills:**`) and inline prose for structural separation. The guide is unambiguous: "Use XML tags to separate prompt sections… This is strictly better than markdown headers or `---` delimiters for Claude-class models: the tag name carries semantic meaning, the structure is unambiguous and machine-parseable" (Guide §4 Action 2).

The context budget and project skills instructions are structural constraints that belong in `<constraints>` or `<context>` tags, not loose bold-prefixed paragraphs.

### W3 — Negative instruction present without positive reframe (Guide §5 Action 1)

**Finding**: The agent contains:
> "Do NOT load full `AGENTS.md` files (100KB+ context cost)"

This is a negative instruction. Guide §5 Action 1 requires converting all negative instructions to positive equivalents: "Before emitting any prompt, scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

The positive reframe here would be: "Load only `SKILL.md` and the specific `rules/*.md` files relevant to the current check."

### W4 — No output format specification for machine-parsed verdict output (Guide §7)

**Finding**: The verdict output is embedded in the middle of the `write_eval_review` step as a markdown template comment. There is no dedicated `<output_format>` tag, no literal-string parsing spec, and no guidance that the verdict line is machine-parsed. Guide §7 specifies: "When output is machine-parsed, be explicit and restrictive" and requires exact format specification with literal string requirements. The scoring section uses plain prose verdicts without a fixed format block:
> "80-100: **PRODUCTION READY** — deploy with monitoring"

This would be ambiguous to a downstream parser. The guide requires: "Use the literal string `VERDICT: ` followed by exactly one of `PASS`, `FAIL`, or `PARTIAL`. Output it as plain text: no markdown bold, no punctuation, no wording variation."

### W5 — Task specification missing audience and quality bar (Guide §1)

**Finding**: The agent has no `<audience>` tag and no explicit `<quality_bar>`. Guide §1 Action 1 requires all three task components: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. The agent specifies (a) partially via the role sentence, but omits (b) — the downstream consumer (the `/gsd-eval-review` orchestrator, and ultimately the developer deciding whether to deploy) — and (c) explicitly, though the success criteria checklist partially compensates.

Guide §1 Action 2 states: "Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

### W6 — No tie-breaking rule for PARTIAL/MISSING boundary (Guide §5)

**Finding**: The scoring rubric defines COVERED, PARTIAL, and MISSING with criteria, but no tie-breaking instruction handles ambiguous cases at the COVERED/PARTIAL boundary. Guide §5 requires: "Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry." In an eval audit, the cost of over-crediting coverage (false COVERED) is higher than under-crediting (false PARTIAL), making this a precision-biased context. No tie-breaking instruction is present.

### W7 — `<required_reading>` duplicated and placed poorly (Guide §8, §11 Action 3)

**Finding**: The `<required_reading>` block appears at line 19–21 near the top, but is then repeated as an instruction inside `<input>`:
> "If prompt contains `<required_reading>`, read every listed file before doing anything else."

This is a duplicated instruction (Guide §11 Action 3: "State each instruction exactly once"). It also mixes meta-instruction content into an `<input>` tag — the guide specifies `<input>` for "the primary content the model must act on," and meta-instructions belong in `<system_note>` or `<constraints>` (Guide §8, meta-instruction injection subsection).

### W8 — Context placement violates task-first, input-last ordering (Guide §8)

**Finding**: The agent structure is:
1. `<role>` (task-like)
2. `<required_reading>` (constraint)
3. Bold context budget + project skills prose (context)
4. `<input>` (input variables)
5. `<execution_flow>` (multi-step instructions)
6. `<success_criteria>` (quality bar)

Guide §8 requires: task instruction at the start, primary document/input at the end, background context in the middle. Here the execution flow — the most critical section — comes after the inputs, which violates the instruction-leads principle. The `<success_criteria>` section is buried at the end where it receives lower model attention rather than near the top where it could prime expected behavior.

### W9 — No few-shot examples for scoring decisions (Guide §3, §22 Pattern 2)

**Finding**: The scoring rubric defines COVERED/PARTIAL/MISSING with criteria but provides zero calibrating examples. Guide §22 Pattern 2 states: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable." The same applies to COVERED vs. PARTIAL: the boundary is inherently ambiguous and calibrating examples would anchor the model's judgment. Guide §3 Action 1–4 describes the full few-shot construction process.

---

## Concrete Improvements

### Improvement 1: Rewrite `<role>` as a specific `<persona>` with adversarial reframe and strengths

Replace:
```xml
<role>
You are a GSD eval auditor. Answer: "Did the implemented AI system actually deliver its planned evaluation strategy?"
Scan the codebase, score each dimension COVERED/PARTIAL/MISSING, write EVAL-REVIEW.md.
</role>
```

With:
```xml
<persona>
You are an evaluation coverage auditor. Your job is not to confirm the AI system works —
it's to find every gap between what was planned and what was actually implemented.

"The eval looks reasonable by inspection" is NOT verification. You must find evidence in code.

Your strengths:
- Identifying discrepancies between planned evaluation strategies and implemented code
- Recognizing partial implementations that appear complete on the surface
- Producing actionable remediation steps, not just gap lists
- Scoring conservatively: when evidence is ambiguous, PARTIAL is safer than COVERED
</persona>
```

### Improvement 2: Convert the negative instruction to positive form

Replace:
```
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
```

With:
```
4. Load only `SKILL.md` (~130 lines) and specific `rules/*.md` files required for the current check. Skip `AGENTS.md` — it is too large to load efficiently.
```

### Improvement 3: Add tie-breaking rule for the COVERED/PARTIAL boundary

Add inside `<step name="score_dimensions">`:
```xml
<tie_breaking>
When evidence is ambiguous between COVERED and PARTIAL, score PARTIAL.
A false COVERED finding allows a gap to reach production undetected.
A false PARTIAL finding costs one remediation task. Err toward PARTIAL.
</tie_breaking>
```

### Improvement 4: Add calibrating examples for the scoring rubric

Add inside `<step name="score_dimensions">` after the rubric table:
```xml
<examples>
  <example>
    <input>Planned: "Faithfulness score ≥ 0.85 via RAGAS". Found: RAGAS installed as dependency, faithfulness metric imported, but no test calling it with the reference dataset.</input>
    <output>PARTIAL — tooling present, metric imported, but automated execution against the reference dataset is absent.</output>
    <commentary>Installed ≠ executed. The rubric requires the evaluation to run, not just be set up.</commentary>
  </example>
  <example>
    <input>Planned: "Content moderation guardrail on all user inputs". Found: `content_filter()` function defined and called in the API request handler on every route that accepts user text.</input>
    <output>COVERED — guardrail implemented in the request path, not stubbed.</output>
    <commentary>The function is in the actual request path. Matches the rubric's "implemented in the request path (not stubbed)" criterion.</commentary>
  </example>
  <example>
    <input>Planned: "CI/CD integration — eval suite runs on every PR". Found: eval command documented in README; no GitHub Actions workflow file, no Makefile target.</input>
    <output>MISSING — documentation describes intent but no automation exists.</output>
    <commentary>Documentation of intent is not CI/CD integration. Execution evidence is required for COVERED or PARTIAL.</commentary>
  </example>
</examples>
```

### Improvement 5: Add `<output_format>` tag with explicit verdict format

Add a new top-level section after `<execution_flow>`:
```xml
<output_format>
Write the EVAL-REVIEW.md file using the Write tool (never Bash heredoc).

End the EVAL-REVIEW.md with a machine-parseable verdict line in exactly this format:

VERDICT: PRODUCTION READY
or
VERDICT: NEEDS WORK
or
VERDICT: SIGNIFICANT GAPS
or
VERDICT: NOT IMPLEMENTED

Use the literal string `VERDICT: ` followed by exactly one of the four values above.
Plain text only — no markdown bold, no punctuation after the value, no wording variation.
</output_format>
```

### Improvement 6: Restructure context placement to task-first, input-last

Reorder the top-level prompt sections as:
1. `<persona>` — adversarial role (leads, highest attention)
2. `<task>` — what to produce and success criteria (near top)
3. `<constraints>` — context budget, project skills loading rules, no-heredoc rule (middle)
4. `<output_format>` — verdict format and file writing spec (middle)
5. `<execution_flow>` — step-by-step procedure (middle)
6. `<input>` — the actual runtime inputs to act on (last, highest recency attention)

### Improvement 7: Consolidate duplicated required-reading instruction

Remove the duplicated instruction from `<input>`:
```
**If prompt contains `<required_reading>`, read every listed file before doing anything else.**
```

Consolidate into a single `<constraints>` entry:
```xml
<constraints>
Read every file listed in <required_reading> before taking any other action.
</constraints>
```

---

## Overall Score: 6/10

**Justification**: The agent demonstrates solid structural instincts — explicit multi-phase execution flow, numeric scoring thresholds, concrete output templates, and context budget awareness. These are non-trivial strengths. However, it accumulates several overlapping weaknesses: the persona is generic and misses the adversarial reframe that the verification pattern calls for; negative instructions are present; context placement inverts the guide's task-first/input-last ordering; the COVERED/PARTIAL boundary has no tie-breaking rule; there are no calibrating examples for the most judgment-heavy scoring step; and a duplicate instruction exists. None of these are catastrophic defects, but together they represent meaningful divergence from the guide across at least six distinct sections. With the seven concrete improvements above applied, the agent would score 8–9/10.
