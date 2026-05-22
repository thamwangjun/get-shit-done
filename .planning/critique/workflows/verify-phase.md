# Critique: verify-phase.md

## Summary

`verify-phase.md` is a technically thorough, well-structured verification workflow. Its step coverage is genuinely impressive: it goes well beyond happy-path structural checks, adding behavioral test execution, test quality auditing (circular detection, assertion-strength classification, disabled-test scanning), and deferred-gap filtering against the broader roadmap. The core principle ("task completion does not equal goal achievement") is stated clearly and is the right framing. However, the file has significant prompt-engineering weaknesses that reduce its reliability as an instruction document for a language model: it uses no XML tagging on its process steps, carries no explicit persona, provides no output format specification for the final agent response, mixes negative instructions with positive ones in anti-pattern tables, and lacks tie-breaking rules for several judgment calls that frequently arise during verification. These weaknesses mean the workflow depends heavily on the agent already knowing what to do in ambiguous situations rather than being fully directive.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied:** The workflow organises work into an ordered sequence of named steps (`load_context`, `establish_must_haves`, `verify_truths`, etc.), creating clear cognitive boundaries between phases.
- **Section 16 — Required vs. optional steps:** `<success_criteria>` at the bottom acts as a universal checklist, and several steps explicitly mark fallback paths (Option A / B / C), approximating the required/type-specific distinction.
- **Section 16 — Scenario-based branching:** The must-haves section provides explicit three-option branching (frontmatter, ROADMAP success criteria, derived from goal), each with a prescribed action sequence.
- **Section 17 (Agent and Subagent Patterns) — Adversarial mindset:** The `behavioral_verification` and `audit_test_quality` steps embody the adversarial verification pattern from Section 17: "The implementer already ran the happy path. Your value is finding what they didn't think to test."
- **Section 14 (Constraint Enforcement) — Precedents and edge-case rulings:** The deferred-item filtering step includes a conservative precedent ("Only defer a gap when there is clear, specific evidence in a later phase. When in doubt, keep it as a real gap"), which is exactly the precedent-style ruling the guide recommends.
- **Section 5 (Instruction Framing) — Explicit conditional branching:** The `determine_status` step uses a numbered decision tree with an explicit ordering rule ("IN ORDER, most restrictive first"), which matches the guide's conditional branching pattern.
- **Section 7 (Output Format Handling) — Partial output specification:** The `behavioral_verification` step includes a concrete markdown table template showing the expected report format, and the `scan_antipatterns` table provides column-level structure for categorised findings.
- **Section 15 (Decision Frameworks) — Criteria checklists:** The artifact status table (Exists / Substantive / Wired → Status) is a readable, directive four-row decision table that removes ambiguity from the most common judgment call in the workflow.
- **Section 21 (Tone and Style) — Imperative present tense:** Most step instructions use imperative present tense ("Extract from init JSON", "Parse JSON result", "Record status and evidence").

---

## Issues

### Issue 1 — No persona assigned for an adversarial task

**Guide principle:** Section 6 Action 2 and Section 17 (Adversarial testing agent) — adversarial verification tasks benefit strongly from an explicit persona using the reframe pattern ("Your job is NOT X — it's Y").

**What's missing:** The workflow has no `<persona>` block at all. The guide is explicit: for verification agents, the persona should frame the role adversarially, e.g., "Your job is not to confirm the implementation works — it's to try to break it." Without this, the model defaults to a confirmatory stance.

**Concrete fix:**

```xml
<persona>
You are a verification specialist. Your job is not to confirm the implementation works —
it is to find where it falls short of the phase goal.

"The code looks correct by inspection" is not verification. You must run commands and
produce evidence. After confirming the happy path, seek what the implementer did not
think to test: the missing wiring, the stub left in place, the test that asserts
existence but not correctness.
</persona>
```

Place this immediately after the `<purpose>` block.

---

### Issue 2 — No `<output_format>` block for the agent's final response

**Guide principle:** Section 7 (Output Format Handling) — output format must be specified completely and upfront (Section 22, Pattern 3). Section 17 specifies that machine-parsed agent output must use an exact format with a literal string requirement (the `VERDICT:` pattern).

**What's missing:** The `return_to_orchestrator` step says "Return status, score, report path" and lists what to include conditionally — but it does not specify the format the orchestrating model will parse. There is no `<output_format>` block. The orchestrator in `execute-phase.md` presumably routes on the status string; any variation in how the agent phrases the status (`gaps found`, `gaps_found`, `GAPS_FOUND`) will break that routing.

**Concrete fix:** Add before `</process>`:

```xml
<output_format>
After completing all steps, end your response with a status block in exactly this format
— it is parsed by the calling orchestrator:

STATUS: passed
SCORE: {verified_truths}/{total_truths}
REPORT: {absolute_path_to_VERIFICATION.md}

or

STATUS: gaps_found
SCORE: {verified_truths}/{total_truths}
REPORT: {absolute_path_to_VERIFICATION.md}
GAPS: {comma-separated gap cluster names}

or

STATUS: human_needed
SCORE: {verified_truths}/{total_truths}
REPORT: {absolute_path_to_VERIFICATION.md}
HUMAN_ITEMS: {comma-separated item names requiring human review}

Use the literal string `STATUS: ` followed by exactly one of `passed`, `gaps_found`,
or `human_needed`. No markdown bold, no punctuation variation, no wording changes.
</output_format>
```

---

### Issue 3 — Process steps use prose XML tags, not the guide's semantic `<phase>` tag vocabulary

**Guide principle:** Section 4 Action 2 — use semantically named XML tags to separate prompt sections. Section 16 — multi-phase workflows use `<phase id="N" name="..." trigger="...">` tags specifically, not ad-hoc `<step name="...">` tags.

**What's missing:** Steps are wrapped in `<step name="...">` tags, which are not part of the guide's tag vocabulary (Section 4 XML tag vocabulary table). The correct structural tag for workflow phases is `<phase id="N" name="..." trigger="...">`. The custom `<step>` tag works, but it reduces interoperability with composed prompt systems that rely on the shared vocabulary.

**Concrete fix:** Rename step tags to phase tags throughout:

```xml
<!-- Before -->
<step name="load_context" priority="first">

<!-- After -->
<phase id="1" name="load_context" trigger="on_invocation">
```

This aligns with Section 16's phase pattern and the tag vocabulary in Section 4.

---

### Issue 4 — Negative instructions in the anti-pattern scan table

**Guide principle:** Section 5 Action 1 — convert negative instructions to positive equivalents. Negative instructions ("do not", "avoid") as primary directives degrade reliability; scan for them and rewrite as positive specifications.

**What's missing:** The `scan_antipatterns` step names patterns by what to search for (TODO, placeholder, empty return) but the severity column uses "Blocker" language without stating what a positive outcome looks like. More critically, the `audit_test_quality` step Rule statements are phrased negatively: "A disabled test linked to a requirement = requirement NOT tested." The guide's conversion table shows how to rewrite these.

**Concrete fix:** Rewrite Rule statements as positive specifications:

```
Before: "A disabled test linked to a requirement = requirement NOT tested."
After:  "Each requirement must be covered by at least one active, non-skipped test.
         Classify any requirement covered only by disabled tests as BLOCKER."

Before: "A test comparing system output against values generated by the same system is circular."
After:  "Expected values must come from an external oracle, the legacy system, or
         manual capture. Classify self-generated expected values as CIRCULAR (BLOCKER)."
```

---

### Issue 5 — No tie-breaking rule for the deferred-item judgment call

**Guide principle:** Section 5 (Instruction Framing) — add explicit tie-breaking rules that match the domain's cost asymmetry. Section 22 Pattern 4 — the tie-breaking rule fires at the margin; getting it wrong in the wrong direction degrades quality in exactly the cases that matter most.

**What's missing:** The `filter_deferred_items` step correctly includes a "be conservative" instruction, but it does not codify the cost asymmetry as a tie-breaking rule. The cost of falsely deferring a real gap (the orchestrator skips a fix) is higher than the cost of not deferring a gap that does belong to a later phase (the orchestrator creates a redundant fix plan). This asymmetry should be stated explicitly as a `<tie_breaking>` element.

**Concrete fix:**

```xml
<tie_breaking>
When unsure whether a gap is covered by a later phase:
- Keep it as a real gap (false defer is more costly than a redundant fix).
- Defer only when the later phase's goal text or success criteria specifically name
  the missing concern, not when there is merely topical overlap.
</tie_breaking>
```

Place this inside the `filter_deferred_items` step, after the "Be conservative" instruction.

---

### Issue 6 — No `<audience>` or `<quality_bar>` declaration

**Guide principle:** Section 1 Action 1 and Action 2 — extract and encode the three task components (output requested, why it matters, what a correct response looks like) and identify the audience explicitly.

**What's missing:** The workflow defines neither audience (the orchestrating execute-phase agent that spawned this subagent) nor quality bar (what distinguishes a high-quality verification report from a low-quality one — e.g., every gap has a fix plan, every failed truth has cited evidence, human items include exact test steps). The guide requires these to be stated explicitly so the model can self-calibrate.

**Concrete fix:** Add after `<purpose>`:

```xml
<audience>
The consuming agent is execute-phase.md, which routes on the STATUS output and
delegates fix plans or human-review items back to the user. The report must be
machine-parseable for status routing and human-readable for manual review.
</audience>

<quality_bar>
A high-quality verification report:
- Cites evidence (file path, line number, or command output) for every FAILED status
- Generates at least one fix plan cluster per gap
- Lists human verification items with explicit test steps, not just descriptions
- Produces a VERIFICATION.md that a developer can act on without re-reading the plan
</quality_bar>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, as applied to `verify-phase.md` as a prompt document directing a subagent.

| Checklist Item | Status |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar absent (Issue 6) |
| All constraints are compatible — no conflicts | PASS |
| **Chain of Thought** | |
| CoT included only for math/symbolic/multi-step logic tasks | N/A — workflow does not instruct CoT use directly |
| CoT trigger phrasing used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic only | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | N/A — no few-shot examples in this workflow type |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across evaluation runs | N/A |
| **Formatting** | |
| Instruction complete and clear before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | FAIL — `<step>` is not in the guide's tag vocabulary; `<phase>` is (Issue 3) |
| At least 3 format variants will be tested on target model | FAIL — no format variants documented |
| **Instruction Framing** | |
| All negative instructions converted to positive equivalents | FAIL — Rule statements in audit_test_quality use negative framing (Issue 4) |
| Priority order explicit when multiple criteria apply | PASS — determine_status uses explicit ordered decision tree |
| Tie-breaking rules match domain's cost asymmetry | FAIL — conservative note exists but no formal tie-breaking rule (Issue 5) |
| **Persona** | |
| Persona included for open-ended or stylistic tasks | FAIL — no persona for an adversarial verification task (Issue 1) |
| Persona is specific, not generic | FAIL — no persona present |
| Persona descriptor is gender-neutral | N/A — no persona present |
| **Output Format** | |
| Structured output tasks use two-step reasoning-then-format approach | PASS — behavioral_verification separates run-commands from report step |
| Single-call JSON places reasoning before answer fields | PASS — JSON result parsing always precedes status determination |
| Constrained decoding adopted only after free-form proven insufficient | N/A |
| Machine-parsed output uses exact format specification with literal string | FAIL — return_to_orchestrator has no literal format spec (Issue 2) |
| **Context Placement** | |
| Task instruction at start of prompt | PASS — `<purpose>` and `<core_principle>` lead |
| Primary document or input at end of prompt | PASS — `<success_criteria>` closes the document |
| Background context in middle | PASS — `<required_reading>` and `<process>` in middle |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A |
| **Self-Consistency** | |
| Self-consistency applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | PASS — no obvious redundancy |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |
| **System / User Split** | |
| Persistent instructions in system prompt | PASS — workflow is a skill/system prompt |
| Task-specific instructions in user prompt | N/A — this is a workflow, not a user prompt |
| Each instruction in exactly one location | PASS |
| Safety-critical constraints have external validation | N/A |
| **Agent / Subagent** | |
| Agent prompts are fully self-contained | FAIL — references external templates via `@` file includes with no fallback if unavailable |
| All file paths in agent output are absolute | PASS — REPORT_PATH uses `$PHASE_DIR` variable which resolves to absolute |
| Parallel agents launched in a single message block | N/A |
| Adversarial probes specified for verification agents | PASS — audit_test_quality step specifies adversarial probe dimensions (circular detection, disabled tests, assertion strength) |
| **Structural Architecture** | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS — workflow references external templates and references for single-responsibility |
| Template variables use `${VARIABLE_NAME}` syntax with fallback | FAIL — `${PHASE_ARG}`, `${PHASE_NUM}` used without fallback defaults |
| Modules compose at runtime via variable substitution | PASS |
| **Constraint Enforcement** | |
| Every restriction paired with equally concrete permission | PASS — deferred-item filtering states both what qualifies and what does not |
| Hard exclusion lists enumerated, not described qualitatively | PASS — scan_antipatterns and test quality audit use specific grep patterns |
| Known edge cases have precedent-style rulings | PASS — deferred items step includes a precedent |
| Confidence thresholds are numeric, not qualitative | FAIL — no numeric confidence threshold for the overall status decision |
| **Decision Frameworks** | |
| Multi-option recommendations use explicit decision tree or comparison table | PASS — determine_status uses a numbered decision tree |
| Criteria checklists gate complex approaches | PASS — artifact status table is a criteria-based decision table |
| Action permissions framed around reversibility | N/A — read-only verification task |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | PASS — named steps cover the full workflow |
| Required steps distinguished from type-specific steps | PASS — fallback options A/B/C in establish_must_haves distinguish required from type-specific |
| Scenario-based branching handles multiple paths explicitly | PASS — three explicit scenarios in establish_must_haves |
| **Memory and Continuity** | |
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | |
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — no explicit `<scope>` block stating what is out of scope for this workflow |
| **Safety and Trust** | |
| Validation at system boundaries only; internal interfaces trusted | PASS — verifier trusts PLAN frontmatter data directly |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization narrow-scoped | N/A |
| **Tone and Style** | |
| Size constraints use numeric limits, not qualitative descriptors | PASS — table format templates specify exact columns |
| Instructions use imperative present tense | PASS — predominantly imperative |
| Working notes in analysis tags, not user-facing output | FAIL — no `<analysis>` tags used for intermediate reasoning; the workflow may produce verbose internal commentary in user-facing output |
| **Optimization** | |
| Prompt flagged as draft for automated optimization | FAIL — not flagged |
| Correct optimizer selected | FAIL — not selected |
| Held-out test set reserved before optimization | FAIL — not addressed |

---

## Recommendations

Prioritized by impact on agent reliability and orchestrator correctness:

**1. Add a machine-parseable `<output_format>` block with literal STATUS string (Issue 2 — Section 7, Section 22 Pattern 3)**
This is the highest-impact fix. Without a literal format spec, the orchestrator in `execute-phase.md` must guess how this agent will phrase its result. Define `STATUS: passed | gaps_found | human_needed` as a literal required output with no wording variation permitted. This single change eliminates an entire class of orchestration failures.

**2. Add an adversarial `<persona>` block (Issue 1 — Section 6 Action 2, Section 17)**
The workflow is an adversarial verification agent. The guide's own adversarial testing agent pattern (Section 17) is purpose-built for this. Without a persona, the model defaults to confirmatory behavior — finding reasons the goal was met rather than reasons it was not. Add the reframe pattern: "Your job is not to confirm the implementation works — it is to find where it falls short."

**3. Add `<audience>` and `<quality_bar>` declarations (Issue 6 — Section 1 Actions 1-2)**
These are required by Section 23's first checklist item. The audience (execute-phase orchestrator + developer reviewer) shapes how detailed the report body should be. The quality bar (evidence-cited failures, actionable fix plans, explicit test steps for human items) gives the agent a self-calibration target that currently does not exist.

**4. Add a formal `<tie_breaking>` rule for the deferred-item judgment (Issue 5 — Section 5, Section 22 Pattern 4)**
The "be conservative" prose note is correct in intent but is not a tie-breaking rule — it is advice. The guide requires a rule that explicitly encodes the cost asymmetry: falsely deferring a real gap is more expensive than creating a redundant fix plan. Encoding this as a `<tie_breaking>` element eliminates the model's need to reason about cost at runtime.

**5. Convert negative Rule statements in `audit_test_quality` to positive specifications (Issue 4 — Section 5 Action 1)**
The two Rule statements that define BLOCKER conditions use "A ... is NOT..." framing. Rewrite each as a positive specification of what must be true for the condition to pass. This is a mechanical rewrite (the conversion table in Section 5 covers exactly these cases) and removes a class of instruction that the guide flags as degrading reliability.
