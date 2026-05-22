# Critique: extract_learnings.md

## Summary

`extract_learnings.md` is a well-scoped, procedurally clear workflow that successfully defines a single-responsibility extraction task. Its step sequencing is logical, its artifact handling distinguishes required from optional inputs correctly, and its output schema is well-specified. However, it falls short on several guide principles: it relies heavily on markdown prose and fenced-code blocks rather than semantic XML tags for section separation; it is missing a `<persona>` definition despite executing a non-trivial analytical task; it provides no few-shot examples to calibrate what a high-quality extracted learning looks like; and its `<critical_rules>` block mixes permission statements with behavioral constraints without the structured `<constraints>` / `<permitted>` / `<exclusions>` pairing the guide demands. These gaps are addressable without restructuring the core logic.

---

## Strengths

- **Section 1 Action 1 (task components explicit):** The `<objective>` tag states what is being produced, why it matters (institutional knowledge capture), and what a correct output looks like (4 categories, source attribution, YAML frontmatter). All three components are present.
- **Section 19 (modularity):** The workflow covers one concern exclusively — learning extraction — and references other modules only via template variables (`${PHASE_DIR}`, `${PADDED_PHASE}`, etc.). It does not duplicate logic from adjacent workflows.
- **Section 14 (constraint enforcement — hard rules present):** The `<critical_rules>` block enumerates clear behavioral rules including the idempotency requirement (overwrite, not append) and the no-fabrication rule. These are meaningful constraints.
- **Section 8 Action 1 (task instruction leads):** The `<purpose>`, `<required_reading>`, and `<objective>` tags appear before any process steps, correctly placing the instruction before the input-dependent content.
- **Section 16 (multi-phase workflow — phase pattern used):** The `<process>` block organizes execution into named `<step>` elements with explicit sequencing (`initialize` → `collect_artifacts` → `extract_learnings` → `capture_thought_integration` → `write_learnings` → `update_state` → `report`). This creates the cognitive boundaries the guide recommends.
- **Section 22 Pattern 3 (output format specified completely):** The `<write_learnings>` step provides the exact YAML frontmatter schema and the full markdown body template, including field names and example formatting, before the model executes.
- **Section 5 (conditional instructions):** The `capture_thought_integration` step handles tool availability with explicit conditional logic and a clear graceful-degradation path.

---

## Issues

### Issue 1 — No semantic XML tags separating prompt sections (Section 4 Action 2)

**Principle:** "When a prompt contains multiple distinct sections (instruction, context, input, output cue), wrap each in a semantically named XML tag."

**What's wrong:** The `<step name="extract_learnings">` body uses markdown H3 headers (`### 1. Decisions`) and prose paragraphs to describe the four extraction categories. The sub-structure — what to look for, what each entry must include — is embedded in untagged prose. This loses machine-parseable structure and blurs the boundary between instruction and content.

**Fix:** Wrap each extraction category in a semantically named XML element. For example:

```xml
<extraction_categories>
  <category name="decisions">
    Look for: explicit decisions in PLAN.md or SUMMARY.md, technology choices, trade-offs, design decisions in STATE.md.
    Each entry must include:
    - <what>: what was decided</what>
    - <rationale>: why it was decided</rationale>
    - <source>: originating artifact filename</source>
  </category>

  <category name="lessons">
    Look for: unexpected complexity in SUMMARY.md, issues in VERIFICATION.md, failed approaches, UAT feedback gaps.
    Each entry must include:
    - <what>: what was learned</what>
    - <context>: situational context</context>
    - <source>: originating artifact filename</source>
  </category>
  ...
</extraction_categories>
```

---

### Issue 2 — No persona defined for an analytical task (Section 6 Action 1 and Action 2)

**Principle:** "Task type is open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona."

**What's wrong:** Learning extraction is an analytical, judgment-heavy task — the model must distinguish a "decision" from a "lesson" from a "surprise," infer rationale from artifact prose, and avoid fabrication. These are exactly the tasks where a specific persona with a defined analytical voice improves consistency. There is no `<persona>` tag anywhere in the file.

**Fix:** Add a specific persona before the `<process>` block. Example:

```xml
<persona>
You are a technical retrospective analyst. Your job is to read engineering artifacts with precision — extracting only what is explicitly documented, never inferring beyond the evidence. You write in concise, factual prose: one idea per entry, attributed to its source.
</persona>
```

This constrains the register to match the no-fabrication rule and reduces hallucination risk.

---

### Issue 3 — No few-shot examples for extraction quality calibration (Section 3, Section 22 Pattern 2)

**Principle:** "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard. Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

**What's wrong:** The workflow tells the model what fields each extracted learning must contain (`What`, `Why`, `Source`) but provides no concrete example of what a well-extracted vs. poorly-extracted entry looks like. The model must infer the granularity, tone, and specificity standard on its own, which will produce inconsistent output quality across runs.

**Fix:** Add a `<examples>` block inside or after `<step name="extract_learnings">` with at least one good/bad pair for one category. Example:

```xml
<examples>
  <example>
    <input>SUMMARY.md excerpt: "We switched from REST to GraphQL because the mobile client needed flexible field selection."</input>
    <output category="decision">
      ### API Protocol Selection
      Switched from REST to GraphQL to support flexible field selection on the mobile client.

      **Rationale:** Mobile client required selective field queries; REST over-fetched on every endpoint.
      **Source:** 03-01-SUMMARY.md
    </output>
  </example>

  <example label="bad — too vague, no rationale">
    <output category="decision">
      ### Architecture Choice
      Used GraphQL.
      **Rationale:** It was better.
      **Source:** SUMMARY.md
    </output>
  </example>
</examples>
```

---

### Issue 4 — `<critical_rules>` mixes permissions and behavioral constraints without pairing (Section 14)

**Principle:** "Pair every restriction with what IS permitted, stated equally concretely."

**What's wrong:** The `<critical_rules>` block lists seven rules that are purely restrictive or procedural but does not explicitly pair restrictions with permitted equivalents. For example, "Do not fabricate learnings — only extract what is explicitly documented" has no matching positive statement of what level of inference or paraphrase is permitted. The model may interpret "explicitly documented" too narrowly (requiring verbatim quotes) or too broadly (allowing inference from implied context).

**Fix:** Restructure `<critical_rules>` using the `<constraints>` vocabulary:

```xml
<constraints>
  <permitted>
    - Paraphrase artifact prose to produce concise learning entries (preserve meaning, reduce length)
    - Infer rationale from surrounding context when the decision is explicitly stated but the "why" is implicit
    - Combine closely related points from the same artifact into a single entry
  </permitted>

  <exclusions>
    - Do not fabricate decisions, lessons, patterns, or surprises not present in the artifacts
    - Do not infer learnings from artifacts not listed in collect_artifacts step
    - Do not append to an existing LEARNINGS.md — overwrite it entirely
  </exclusions>
</constraints>
```

---

### Issue 5 — No explicit audience or quality bar (Section 1 Action 1, Action 2)

**Principle:** "Identify and make explicit: (a) what output is being requested, (b) why that output matters or how it will be used, and (c) what a correct or high-quality response looks like."

**What's wrong:** The `<objective>` tag describes what is being produced but does not explicitly state who will consume the LEARNINGS.md file or what standard separates a high-quality extraction from a low-quality one. The `<success_criteria>` block at the bottom only checks mechanical completeness (file written, fields populated) — not semantic quality.

**Fix:** Add an `<audience>` and `<quality_bar>` tag near the top, after `<objective>`:

```xml
<audience>
Engineers picking up future phases. They will scan LEARNINGS.md to avoid repeating past mistakes and to reuse successful patterns. They have context about the project domain but not about this specific phase.
</audience>

<quality_bar>
A high-quality extraction: (1) uses specific, named decisions rather than vague category descriptions; (2) provides enough rationale that a reader unfamiliar with the phase can understand the trade-off; (3) has source attribution pointing to the exact artifact, not just "SUMMARY.md" without a filename prefix.
</quality_bar>
```

---

### Issue 6 — Negative instructions not converted to positive equivalents (Section 5 Action 1)

**Principle:** "Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**What's wrong:** The `<critical_rules>` block and `<step name="collect_artifacts">` contain negated directives:
- "Do not fabricate learnings"
- "the workflow must not fail"
- "skip gracefully if not found"

**Fix:** Apply the conversion table from Section 5:
- "Do not fabricate learnings" → "Extract only what is explicitly documented in the collected artifacts. If a category has no evidence, leave it empty with a note: `No items found in available artifacts.`"
- "the workflow must not fail" → "If `capture_thought` is unavailable, complete the workflow and write LEARNINGS.md as the sole output."
- "skip gracefully if not found" → "If the artifact is absent, record its name in `missing_artifacts` and continue with remaining artifacts."

---

## Quick-Reference Checklist Score

Scored against Section 23. Items marked N/A are not applicable to this workflow type (it is not a single API call, does not involve self-consistency, and is not a RAG pipeline).

| Category | Checklist Item | Score |
|---|---|---|
| **Task Specification** | Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar absent |
| | All constraints are compatible — no conflicts | PASS |
| **Chain-of-Thought** | CoT included only for math/symbolic/multi-step logic tasks | N/A — no CoT trigger warranted |
| | CoT trigger used correctly | N/A |
| | Reasoning elicited before answer | N/A |
| | CoT traces treated as heuristic | N/A |
| **Few-Shot Examples** | Examples selected by semantic similarity | FAIL — no examples provided |
| | 2–5 examples total | FAIL — zero examples |
| | Ordered simple → complex | FAIL — zero examples |
| | Examples span diverse sub-types | FAIL — zero examples |
| | Format consistent across examples | FAIL — zero examples |
| | Example order fixed across evaluation runs | FAIL — zero examples |
| **Formatting** | Instruction complete before formatting applied | PASS |
| | Prompt sections separated by semantically named XML tags | FAIL — extraction categories use markdown H3 headers, not XML |
| | At least 3 format variants will be tested | FAIL — no variant testing noted |
| **Instruction Framing** | All negative instructions converted to positive | FAIL — multiple negations in critical_rules |
| | Priority order explicit when multiple criteria apply | PASS — required vs. optional artifacts distinguished |
| | Tie-breaking rules match domain cost asymmetry | N/A — no filtering/ranking task |
| **Persona** | Persona included only for appropriate tasks | FAIL — analytical task has no persona |
| | Persona is specific (constrains voice/register) | FAIL — no persona defined |
| | Persona descriptor is gender-neutral | N/A — no persona |
| **Output Format** | Structured output uses two-step reasoning-then-format | PASS — extraction step precedes write step |
| | Single-call JSON places reasoning before answer fields | N/A |
| | Constrained decoding adopted only after alternatives proven insufficient | N/A |
| | Machine-parsed output uses exact format specification | PASS — YAML frontmatter schema is fully specified |
| **Context Placement** | Task instruction at start of prompt | PASS |
| | Primary document/input at end of prompt | PASS — input artifacts loaded in step 2, analysis in step 3 |
| | Background context in middle | PASS |
| | Irrelevant context removed | PASS |
| | Time-sensitive injected context labeled as snapshot | N/A |
| **Self-Consistency** | Applied only to tasks with single correct answer | N/A |
| | Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | Redundant instructions and repeated context removed | PASS |
| | Long prompts compressed before sending | N/A |
| | RAG context is extracted passage only | N/A |
| **System/User Split** | Persistent instructions in system prompt | N/A — workflow file |
| | Task-specific instructions in user prompt | N/A |
| | Each instruction appears in exactly one location | PASS |
| | Safety-critical constraints have external validation | N/A |
| **Agent/Subagent** | Agent prompts fully self-contained | PASS — all variables resolved via SDK init |
| | All file paths in agent output are absolute | PASS — paths constructed from `${PHASE_DIR}` |
| | Parallel agents launched in single message block | N/A |
| | Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | Large prompts decomposed into atomic modules | PASS — single responsibility maintained |
| | Template variables use `${VARIABLE_NAME}` syntax | PASS |
| | Modules compose at runtime via variable substitution | PASS |
| **Constraint Enforcement** | Every restriction paired with concrete permission | FAIL — critical_rules lists restrictions only |
| | Hard exclusion lists enumerated, not described qualitatively | PARTIAL — "do not fabricate" is qualitative, not an enumerated list |
| | Known edge cases have precedent-style rulings | FAIL — no precedents block |
| | Confidence thresholds are numeric, not qualitative | N/A |
| **Decision Frameworks** | Multi-option recommendations use decision tree or table | N/A |
| | Criteria checklists gate complex approaches | PASS — success_criteria checklist present |
| | Action permissions framed around reversibility | PASS — overwrite rule is explicit |
| **Multi-Phase Workflows** | Complex tasks organized into explicit named phases | PASS — named `<step>` elements used |
| | Required steps distinguished from type-specific steps | PASS — required vs. optional artifacts distinguished |
| | Scenario-based branching handles multiple paths | PARTIAL — capture_thought branch handled, but no scenario tag used |
| **Memory and Continuity** | Memory templates use XML tags as section labels | N/A |
| | Compaction summaries include discoveries and failed approaches | N/A |
| | Next steps tied to user's most recent explicit request | PASS — report step includes next steps |
| **Modularity** | Each prompt component has single responsibility | PASS |
| | Scope boundaries state both inclusions and exclusions | FAIL — scope includes what to extract but does not explicitly exclude what not to extract |
| **Safety and Trust** | Validation at system boundaries only | PASS |
| | Dual-use capabilities state permissions before restrictions | FAIL — restrictions stated before permissions |
| | Authorization narrow-scoped | N/A |
| **Tone and Style** | Size constraints use numeric limits | PARTIAL — report format uses numeric counts but extraction entries have no length guidance |
| | Instructions use imperative present tense | PASS |
| | Working notes in analysis tags, not user-facing output | PASS — no internal reasoning surfaces to user |
| **Optimization** | Prompt flagged as draft for automated optimization | FAIL — not flagged |
| | Correct optimizer selected | FAIL — not selected |
| | Held-out test set reserved | FAIL — not mentioned |

**Summary score:** 20 PASS, 15 FAIL, 5 PARTIAL, 15 N/A (out of 55 applicable items: 20 PASS / 35 non-PASS)

---

## Recommendations

Prioritized from highest impact to lowest:

### 1. Add few-shot examples for extraction categories (Section 3, Section 22 Pattern 2)

This is the highest-leverage missing element. Without examples, every run calibrates "decision," "lesson," "pattern," and "surprise" from scratch against the model's priors. A single good/bad pair per category — four pairs total — would anchor the specificity level, the length standard, and the rationale depth the workflow intends. Add an `<examples>` block inside the `<extract_learnings>` step before the category definitions.

### 2. Add a specific `<persona>` for the analytical extraction role (Section 6 Action 2, Section 22 Pattern 1)

The extraction task requires analytical precision and a no-fabrication discipline. A persona that constrains register to "technical retrospective analyst" — with explicit strengths enumeration (precise attribution, evidence-only extraction) — reduces hallucination risk and produces more consistent tone across the four output categories. This is a one-paragraph addition before `<process>`.

### 3. Convert negative instructions in `<critical_rules>` to positive equivalents (Section 5 Action 1)

Three rules are currently stated as negations ("do not fabricate," "must not fail," "skip gracefully"). Each has a straightforward positive rewrite that specifies the desired behavior rather than the prohibited one. Positive framing gives the model a concrete action to execute instead of a constraint to interpret. The fix is mechanical and takes under 10 minutes to apply.

### 4. Add `<audience>` and `<quality_bar>` tags to complete the task specification (Section 1 Action 1 and Action 2)

The workflow describes what to produce but not who reads it or what separates a useful extraction from a superficial one. Adding these two tags near the top (after `<objective>`) completes the three-component task specification the guide requires and gives future prompt optimizers a measurable quality target.

### 5. Restructure `<critical_rules>` into `<constraints>` with `<permitted>` / `<exclusions>` pairing (Section 14)

The current block is a flat list of restrictions. Restructuring it with `<permitted>` (paraphrase is allowed, inference from explicit context is allowed) alongside `<exclusions>` (fabrication is not, appending is not) resolves the ambiguity around what level of interpretation is acceptable. This directly addresses the most common failure mode for extraction workflows: the model either invents detail to fill entries or refuses to paraphrase and produces verbatim quotes instead of structured learnings.
