# Critique: review.md

## Summary

`review.md` is a well-scoped, operationally coherent workflow that correctly decomposes cross-AI peer review into five logical steps (detect, gather, build prompt, invoke, write results). It demonstrates strong structural discipline — XML-wrapped steps, success criteria, concrete bash snippets — and addresses a multi-phase problem the guide explicitly supports. However, the embedded review prompt (the `build_prompt` step) is the weakest element: it relies on generic markdown headers instead of the guide's XML tag vocabulary, uses qualitative output descriptors instead of numeric constraints, omits a persona, and provides no few-shot examples or tie-breaking rules. The outer workflow structure scores well against Section 16 (Multi-Phase Workflows) and Section 22 (Production Patterns); the inner review prompt scores poorly against Sections 1, 4, 5, 6, and 7.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The five `<step>` tags act as named phases with clear entry/exit conditions, matching the `<phase id="…" name="…">` pattern the guide prescribes. Each step is sequenced and the prior step's outputs feed the next.

- **Section 16 (Required vs. Optional Steps) — Conditional CLI detection is explicit.** The `detect_clis` step enumerates every supported CLI, handles the "no CLIs found" exit path, and uses environment-variable-based self-identification logic (`SELF_CLI`) to decide which CLI to skip. This is the kind of explicit scenario branching Section 16 endorses.

- **Section 16 (Scenario-based Branching) — Multiple runtime scenarios are handled.** The `SELF_CLI` detection block covers four named conditions (`none`, `claude`, `cursor`, `auto`) — consistent with the guide's recommendation to handle multiple paths explicitly rather than leaving the model to infer.

- **Section 22 Pattern 5 (Decomposed, Single-Responsibility Modules) — Steps have narrow scope.** Each `<step>` does one thing: detect, gather, build, invoke, or write. No step mixes concerns.

- **Section 14 (Constraint Enforcement) — Success criteria are enumerated.** The `<success_criteria>` block at the end lists five checkable conditions, which is more actionable than a qualitative "done when complete" description.

- **Section 22 Pattern 3 (Output Format Specified Upfront) — REVIEWS.md structure is fully specified.** The YAML frontmatter, section headers, and Consensus Summary sub-sections are laid out before invocation begins, ensuring consistent, parseable output.

- **Section 5 (Conditional Instructions) — Flag parsing is explicit.** `--gemini`, `--all`, no-flag fallback — three named branches, clearly stated.

---

## Issues

### Issue 1 — Missing persona on the embedded review prompt

**Guide principle:** Section 6 Action 1–2; Section 22 Pattern 1.

**What's wrong:** The `build_prompt` step opens with `"You are reviewing implementation plans for a software project phase."` — a generic framing. The guide classifies this as an open-ended, stylistic task (critical analysis with structured output) and requires a specific, role-constrained persona. Generic expert framing produces no measurable accuracy gain (Section 6 Action 2).

**Fix:** Replace the opening sentence with a specific persona that constrains register and adversarial posture:

```xml
<persona>
You are a senior software architect conducting an independent adversarial review.
Your job is not to validate that the plan is reasonable — it's to find what is missing,
wrong, or likely to fail. Write in direct, critical prose. Lead with risks.
</persona>
```

---

### Issue 2 — Embedded review prompt uses markdown headers instead of XML tags

**Guide principle:** Section 4 Action 2; Section 4 XML Tag Vocabulary.

**What's wrong:** The prompt in `build_prompt` uses `##` headers (`## Project Context`, `## Review Instructions`) to delimit sections. The guide states that XML tags are "strictly better than markdown headers" for Claude-class models because tag names carry semantic meaning and the structure is machine-parseable.

**Fix:** Wrap each section in semantically named XML tags:

```xml
<task>
Analyze the implementation plans below and produce structured feedback.
</task>

<context>
{first 80 lines of PROJECT.md}
</context>

<input>
## Phase {N}: {phase name}
{roadmap section, PLAN.md contents, CONTEXT.md, RESEARCH.md}
</input>

<output_format>
{review format specification}
</output_format>
```

This also fixes context placement (Section 8 Actions 1–2): the task instruction leads, the primary content (the plans) closes the prompt, and background sits in the middle.

---

### Issue 3 — Output format uses qualitative length descriptors

**Guide principle:** Section 21 (Tone and Style Rules — Size Constraints as Hard Rules); Section 7 (Output Format Handling).

**What's wrong:** The review instructions say `"One-paragraph assessment"` and `"bullet points"` without numeric bounds. The guide is explicit: `"'Brief' means different things; 'under 8 words' does not."` Qualitative descriptors produce variable output length that differs across models and calls.

**Fix:** Apply numeric limits to each section of the output format:

```xml
<output_format>
1. Summary — 3–5 sentences. No more than 80 words.
2. Strengths — 3–6 bullet points, each under 20 words.
3. Concerns — bullet points in this exact format:
   [HIGH|MEDIUM|LOW] {concern description, max 30 words}
4. Suggestions — 3–6 bullets, each one actionable and under 30 words.
5. Risk Assessment — exactly one of: LOW / MEDIUM / HIGH, followed by 2–3 sentences of justification.
</output_format>
```

---

### Issue 4 — No tie-breaking or priority ordering for the review

**Guide principle:** Section 5 (Priority Ordering and Tie-Breaking); Section 22 Pattern 4.

**What's wrong:** The review instructions list six focus areas (edge cases, dependencies, scope creep, security, performance, goal alignment) with no indication of which to prioritize when time or token budget is limited, and no tie-breaking rule for borderline concerns. Without a priority order, different models will weigh these dimensions differently, making consensus synthesis in `write_reviews` unreliable.

**Fix:** Add an explicit priority order and a precision-biased tie-breaking rule:

```xml
<priority_order>
1. Missing error handling or edge cases (highest — most likely to cause production failure)
2. Dependency ordering issues (plans that will block each other)
3. Whether the plans achieve the stated phase goals
4. Security considerations
5. Scope creep or over-engineering
6. Performance implications (lowest — optimize later)
</priority_order>

<tie_breaking>
When in doubt about whether to include a concern, omit it.
Report only concerns you are >75% confident represent a real risk to the plan.
Speculative concerns dilute the review signal.
</tie_breaking>
```

---

### Issue 5 — No few-shot examples for the review output format

**Guide principle:** Section 3 (Few-Shot Example Construction); Section 22 Pattern 2.

**What's wrong:** The `build_prompt` step specifies the review format in prose but provides no example of what a well-formed concern entry or summary looks like. The guide requires that every qualitative instruction be accompanied by at least one concrete example (Pattern 2). Without examples, each reviewer AI produces differently structured output, making the `write_reviews` Consensus Summary harder to synthesize reliably.

**Fix:** Add one calibrating example for the `Concerns` section — the highest-variance field:

```xml
<examples>
  <example>
    <input>Plan assumes DB migration runs before API deployment with no rollback path.</input>
    <output>[HIGH] No rollback strategy for failed DB migration — if migration fails mid-deploy,
    the API will be down with no automated recovery path.</output>
  </example>
  <example>
    <input>Plan uses a generic retry loop without specifying backoff strategy.</input>
    <output>[MEDIUM] Retry loop lacks exponential backoff — under load, retries will amplify
    the failure rather than recover from it.</output>
  </example>
</examples>
```

---

### Issue 6 — Task specification in `build_prompt` omits audience and quality bar

**Guide principle:** Section 1 Action 1–2; Section 1 XML template.

**What's wrong:** The `build_prompt` step states what to do (review the plan) but does not encode (a) who will consume the output or (b) what makes a high-quality review. The guide requires all three task components to be explicit. The downstream consumer here is the `write_reviews` step, which synthesizes a consensus — that context changes what a useful review entry looks like.

**Fix:** Add `<audience>` and `<quality_bar>` to the embedded prompt:

```xml
<audience>
Your review will be read by a planning agent that synthesizes feedback from 2–4 independent
AI reviewers. Write for machine parsing: use consistent severity labels and structured
sections. Do not assume context beyond what is provided.
</audience>

<quality_bar>
A high-quality review catches at least one non-obvious risk, proposes at least one concrete
actionable suggestion, and assigns severity labels (HIGH/MEDIUM/LOW) consistently with the
examples above.
</quality_bar>
```

---

### Issue 7 — CLI invocations are sequential with no stated rationale

**Guide principle:** Section 17 (Agent and Subagent Patterns — Parallel Agent Spawning).

**What's wrong:** The `invoke_reviewers` step explicitly serializes all CLI calls — `"in sequence (not parallel — avoid rate limits)"` — but provides no mechanism to tune this. The guide recommends parallel spawning for independent subagents. The stated rationale (rate limits) is valid, but there is no option to opt into parallelism when the operator knows rate limits are not a concern, and the wait time for 4–7 sequential CLI invocations is significant.

**Fix:** Add a flag and conditional branching:

```
Parse --parallel from $ARGUMENTS.
If --parallel is set, invoke all CLIs in a single background batch.
Default: sequential invocation to respect rate limits.
```

This is a lower-priority fix but aligns with Section 5 (Conditional Instructions) and Section 17.

---

## Quick-Reference Checklist Score (Section 23)

### task_specification
- [ ] Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (audience and quality bar absent from the embedded review prompt; see Issues 1, 6)
- [ ] All constraints are compatible — **PASS** (no detected conflicts)

### chain_of_thought
- [ ] CoT included only for math/symbolic/multi-step logic tasks — **N/A** (no CoT trigger; appropriate for this task type)
- [ ] CoT trigger used — **N/A**
- [ ] Reasoning elicited before the answer — **N/A**
- [ ] CoT traces treated as heuristic — **N/A**

### few_shot_examples
- [ ] Examples selected by semantic similarity — **FAIL** (no examples provided at all; see Issue 5)
- [ ] 2–5 examples total — **FAIL** (zero examples)
- [ ] Ordered simple → complex — **FAIL** (no examples)
- [ ] Examples span diverse sub-types — **FAIL** (no examples)
- [ ] Format consistent across all examples — **FAIL** (no examples)
- [ ] Example order fixed across evaluation runs — **N/A**

### formatting
- [ ] Instruction complete and clear before formatting — **PASS**
- [ ] Prompt sections separated by semantically named XML tags — **FAIL** (embedded review prompt uses markdown headers; see Issue 2)
- [ ] At least 3 format variants tested — **FAIL** (no evidence of variant testing)

### instruction_framing
- [ ] Negative instructions converted to positive — **PASS** (no negative framing detected)
- [ ] Priority order explicit when multiple criteria apply — **FAIL** (six focus areas listed with no priority; see Issue 4)
- [ ] Tie-breaking rules match cost asymmetry — **FAIL** (no tie-breaking rule; see Issue 4)

### persona
- [ ] Persona included only for open-ended/stylistic tasks — **FAIL** (persona absent; task is open-ended and stylistic; see Issue 1)
- [ ] Persona is specific — **FAIL** (absent)
- [ ] Persona descriptor is gender-neutral — **N/A** (absent)

### output_format
- [ ] Structured output uses two-step reasoning-then-format — **FAIL** (single-step; though acceptable for this use case, no analysis tags used)
- [ ] Single-call JSON places reasoning before answer fields — **N/A** (markdown output, not JSON)
- [ ] Constrained decoding adopted only after prompting proven insufficient — **N/A**
- [ ] Machine-parsed output uses exact format specification — **FAIL** (concern format is prose-described, not shown as a literal example; see Issue 3)

### context_placement
- [ ] Task instruction at start of prompt — **PASS** (review instructions appear first in the embedded prompt)
- [ ] Primary document/input at end — **FAIL** (plans and context precede the review instructions in the `build_prompt` template, reversing the correct order)
- [ ] Background context in middle — **FAIL** (ordering is: context, then plans, then instructions — instructions should lead)
- [ ] Irrelevant context removed — **PASS** (only first 80 lines of PROJECT.md used)
- [ ] Time-sensitive injected context labeled as snapshot — **N/A**

### self_consistency
- [ ] Applied only to tasks with a single correct answer — **N/A**
- [ ] Inference budget permits 15–20 samples — **N/A**

### prompt_length
- [ ] Redundant instructions removed — **PASS**
- [ ] Long prompts compressed — **N/A** (no compression tooling in scope)
- [ ] RAG context is extracted passage only — **PASS** (first 80 lines only)

### system_user_split
- [ ] Persistent instructions in system prompt — **N/A** (CLI piping, not system/user split)
- [ ] Task-specific in user prompt — **N/A**
- [ ] Each instruction in exactly one location — **PASS**
- [ ] Safety-critical constraints externally validated — **N/A**

### agent_subagent
- [ ] Agent prompts fully self-contained — **PASS** (the piped prompt is self-contained)
- [ ] All file paths absolute — **PASS** (`/tmp/gsd-review-prompt-{phase}.md`)
- [ ] Parallel agents launched in single message block — **FAIL** (sequential invocation by default; see Issue 7)
- [ ] Adversarial probes specified for verification agents — **N/A** (review, not verification)

### structural_architecture
- [ ] Large prompts decomposed into atomic modules — **PASS** (five single-responsibility steps)
- [ ] Template variables use `${VARIABLE_NAME}` syntax — **PASS** (consistent `{phase}`, `{N}` substitution, though mixed curly styles noted)
- [ ] Modules compose at runtime via variable substitution — **PASS**

### constraint_enforcement
- [ ] Every restriction paired with concrete permission — **PASS** (permitted CLIs listed explicitly)
- [ ] Hard exclusion lists enumerated — **N/A**
- [ ] Known edge cases have precedent-style rulings — **PASS** (CLI failure handling; CodeRabbit timeout note)
- [ ] Confidence thresholds numeric — **FAIL** (no confidence thresholds; see Issue 4)

### decision_frameworks
- [ ] Multi-option recommendations use decision tree or table — **PASS** (`SELF_CLI` detection is an implicit decision tree)
- [ ] Criteria checklists gate complex approaches — **PASS** (`success_criteria` block)
- [ ] Action permissions framed around reversibility — **N/A**

### multi_phase_workflows
- [ ] Complex tasks organized into explicit named phases — **PASS**
- [ ] Required steps distinguished from type-specific — **PASS** (detect and gather are always required; CLI invocation varies by availability)
- [ ] Scenario-based branching handles multiple paths — **PASS**

### memory_and_continuity
- [ ] Memory templates use XML tags as section labels — **N/A**
- [ ] Compaction summaries include discoveries and failed approaches — **N/A**
- [ ] Next steps tied to user's most recent explicit request — **N/A**

### modularity
- [ ] Each prompt component has single responsibility — **PASS**
- [ ] Scope boundaries state inclusions and exclusions — **PASS** (success criteria + CLI flag filtering)

### safety_and_trust
- [ ] Validation at system boundaries only — **PASS**
- [ ] Dual-use capabilities state permissions before restrictions — **N/A**
- [ ] Authorization narrow-scoped — **N/A**

### tone_and_style
- [ ] Size constraints use numeric limits — **FAIL** (see Issue 3)
- [ ] Instructions use imperative present tense — **PASS** (step instructions are imperative)
- [ ] Working notes in analysis tags, not user-facing output — **N/A**

### optimization
- [ ] Prompt flagged as draft for automated optimization — **FAIL** (no flag)
- [ ] Correct optimizer selected — **N/A** (not addressed)
- [ ] Held-out test set reserved — **N/A**

---

## Recommendations

Prioritized by expected improvement-per-effort:

**1. Fix context ordering and add XML tags to the embedded review prompt (Issues 2 + Section 8 Actions 1–2).**
The embedded prompt in `build_prompt` places background context before the task instruction — the reverse of the guide's recommended order. Restructuring to `<task>` → `<context>` → `<input>` and replacing markdown headers with XML tags is a low-effort, high-signal change that directly affects output consistency across all reviewer models.

**2. Add a specific persona and an adversarial reframe to the embedded prompt (Issue 1 — Section 6 Action 2; Section 6 Reframe Pattern).**
The current framing ("You are reviewing implementation plans") is the generic form the guide explicitly flags as ineffective. A specific adversarial persona (`"Your job is not to validate the plan — it's to find what will fail"`) biases every reviewer toward critical analysis, which is the intended behavior of this workflow.

**3. Apply numeric output format constraints and add two calibrating examples (Issues 3 + 5 — Section 21; Section 22 Pattern 2).**
Qualitative descriptors (`"one paragraph"`, `"bullet points"`) produce variable-length output that makes the Consensus Summary synthesis in `write_reviews` inconsistent. Adding word-count limits and two `<example>` entries for the `Concerns` field will standardize output across Gemini, Claude, Codex, and other CLI models.

**4. Add `<audience>`, `<quality_bar>`, and `<priority_order>` to the embedded prompt (Issues 4 + 6 — Section 1 Actions 1–2; Section 5 Priority Ordering).**
The review prompt is missing two of the three mandatory task components from Section 1 (audience and quality bar). Adding these, together with an explicit priority ranking of the six focus areas, will reduce variance between reviewers and make the Consensus Summary more reliable.

**5. Flag the embedded review prompt as a candidate for automated optimization (Section 12 Action 1).**
The prompt is manually constructed and will be sent to multiple model families (Gemini, Claude, Codex, Qwen). Per Section 12, every manually constructed prompt is a draft. Adding a comment tagging it for DSPy MIPROv2 optimization (multi-model pipeline) will signal to future maintainers that format validation across models is a tracked concern, not an assumption.
