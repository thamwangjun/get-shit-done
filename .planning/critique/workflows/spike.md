# Critique: spike.md

## Summary

`spike.md` is a well-structured, domain-appropriate workflow with clear step sequencing, useful checkpoints, and a focused purpose. Its XML step tagging, concrete examples, success-criteria checklist, and orderly branching logic demonstrate solid prompt engineering instincts. However, the workflow underuses several high-leverage patterns from the guide: it relies on markdown prose rather than semantically named XML sections for its top-level structure, omits an explicit persona (which is warranted here for an agentic workflow), provides no quality bar or audience declaration, uses some negative instruction framing, and leaves several constraint boundaries implicit. The core logic is sound; the gaps are all in structural and framing polish that would make the prompt more consistent and robust at scale.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Named phase steps with XML tags.** Each process step is wrapped in `<step name="...">`, creating cognitive phase boundaries and giving the model clear structural landmarks to advance through.
- **Section 16 — Checkpoint boxes for branching.** The `╔══ CHECKPOINT ══╗` boxes create explicit human-in-the-loop gates at invalidation points and before execution, matching the scenario-based branching pattern precisely.
- **Section 16 — Required vs. optional steps distinguished.** `QUICK_MODE` branching cleanly separates fast-path from full-path, matching the guide's pattern for distinguishing mandatory from type-specific steps.
- **Section 13 — Template variable syntax.** `$ARGUMENTS` and `QUICK_MODE` follow the `${VARIABLE_NAME}` convention and are used correctly throughout.
- **Section 4 — XML tags used for structure.** Steps use `<step name="...">` and top-level sections use `<purpose>`, `<process>`, `<required_reading>`, and `<success_criteria>` — semantically meaningful tag names that match the guide's XML vocabulary.
- **Section 3 — Concrete examples for spike quality bar.** The "Good spikes / Bad spikes" list with rationale mirrors the guide's good/bad labeled pair pattern (Section 3, production example patterns) and teaches the model to generalize the rule.
- **Section 14 — Explicit success criteria checklist.** The `<success_criteria>` block is an applied constraint enforcement pattern, providing a verifiable exit condition for the workflow.
- **Section 5 — Conditional instructions.** `if QUICK_MODE is true: Skip` branching is direct and unambiguous, matching the guide's "explicit conditional branching" pattern.

---

## Issues

### Issue 1 — No persona assigned despite an agentic, open-ended workflow
**Guide reference:** Section 6, Action 1–2; Section 22 Pattern 1.

The guide states: "Task type is open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona." A spike workflow is exactly this: open-ended, exploratory, and requiring a specific investigative mindset. Without a persona, the model defaults to generic assistant behavior rather than the methodical feasibility-investigator stance the workflow depends on. Generic personas ("expert engineer") produce no measurable gain; a specific, role-constrained one does.

**Fix:** Add a `<persona>` block near the top:
```xml
<persona>
You are a focused feasibility investigator. Your job is not to build features — it's to
answer one question per spike with the minimum code needed to produce observable evidence.
You strip everything that doesn't directly serve the question. You hardcode credentials,
use JSON files instead of databases, and skip auth unless auth is the question.
</persona>
```

---

### Issue 2 — No explicit audience or quality bar (task specification incomplete)
**Guide reference:** Section 1, Action 1–2; Section 23 checklist item "Intent, audience, and quality bar are all explicit."

The guide requires three explicit task components: (a) what output is requested, (b) why it matters, and (c) what a high-quality response looks like. The `<purpose>` block addresses (a) and (b) adequately, but (c) — the quality bar — is implicit and scattered across the spike list in the decompose step. Audience is never stated, which matters because this workflow is invoked by a developer who may have varying familiarity with spike methodology.

**Fix:** Add `<audience>` and `<quality_bar>` blocks after `<purpose>`:
```xml
<audience>
A developer exploring an unproven idea in an existing codebase. May be unfamiliar with
spike methodology. Needs clear, directive guidance — not options to consider.
</audience>

<quality_bar>
Each spike is complete when: (1) it answers exactly one Given/When/Then question,
(2) it has been run and produced observable output, (3) the README verdict field is
VALIDATED, INVALIDATED, or PARTIAL with evidence recorded.
</quality_bar>
```

---

### Issue 3 — Negative instruction framing in the "avoid" list
**Guide reference:** Section 5, Action 1.

The `detect_stack` step contains a list of things to "Avoid unless the spike specifically requires it" — a negated instruction block. The guide requires converting negative instructions to positive equivalents before emitting any prompt, with a mechanical conversion table provided.

**Fix:** Convert negated instructions to a positive scoping statement:
```
Default to the simplest technology that reaches a runnable result:
- Use the project's existing language/framework when one exists.
- For greenfield, choose whatever gets to a runnable result fastest (Python, Node, Bash, single HTML file).
- Hardcode credentials, tokens, and config values directly in the code.
- Use in-memory structures or JSON files in place of databases.
- Run scripts directly — no build step, bundler, or container needed.
```

---

### Issue 4 — Output format for the consolidated report is implicit and not specified upfront
**Guide reference:** Section 7, Action 1; Section 22 Pattern 3.

The guide states: "State the required output structure, field names, ordering, and an example before the model begins its task." The consolidated report format (verdicts table, Key Discoveries, Feasibility Assessment, Signal for the Build) appears only at the end of the workflow in the `report` step. A model executing the workflow builds internal state throughout spike execution without knowing what the final output format will require. This risks under-capturing evidence needed for the report sections.

**Fix:** Add an `<output_format>` block near the top of the file, before `<process>`, specifying the report skeleton. This primes the model to collect the right evidence from the start:
```xml
<output_format>
Final report format (produced in the "report" step):

| # | Name | Verdict |
|---|------|---------|

## Key Discoveries
{unexpected findings, gotchas, surprises only — not a restatement of verdicts}

## Feasibility Assessment
{one paragraph: is the core idea viable and at what confidence?}

## Signal for the Build
{concrete technology choices, patterns to use, anti-patterns to avoid}
</output_format>
```

---

### Issue 5 — Constraint boundaries are implicit; no explicit permission/restriction pairing
**Guide reference:** Section 14, "Explicit permission pairs"; Section 23 checklist item "Every restriction is paired with an equally concrete permission."

The workflow specifies what code spikes should avoid (build tools, Docker, env files) but does not explicitly state what the model IS permitted to do. The guide requires pairing every restriction with an equally concrete permission statement. This matters especially in agentic contexts where the model must make tool-use decisions: without a `<constraints>` block, the model must infer what is in-scope.

**Fix:** Add a `<constraints>` block:
```xml
<constraints>
  <take_freely>
    - Read any file in the project directory
    - Create files under `.planning/spikes/`
    - Run short-lived scripts and benchmarks (Bash)
    - Install packages with `npm install` or `pip install` for the spike only
  </take_freely>

  <confirm_with_user>
    - Modifying existing project source files
    - Installing global packages or tooling
    - Running anything that writes to a database or external API with side effects
  </confirm_with_user>
</constraints>
```

---

### Issue 6 — No tie-breaking rule for ambiguous spike decomposition
**Guide reference:** Section 5, "Tie-breaking instructions"; Section 22 Pattern 4.

The decompose step instructs the model to "break the idea into 2-5 independent questions" and "order by risk," but provides no tie-breaking rule for when questions are of equal risk or when the count is ambiguous. The guide requires an explicit tie-breaking rule that matches the domain's cost asymmetry.

**Fix:** Add a tie-breaking clause to the decompose step:
```
When two questions carry equal risk, prefer the one that is cheaper to run first —
a failed 5-minute spike is always preferable to a failed 2-hour one.
When the count is ambiguous (exactly at 2 or 5), err toward fewer spikes:
one well-scoped question answered decisively beats three loosely scoped ones answered partially.
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A where the checklist dimension does not apply to a workflow orchestration prompt of this type.

| Category | Checklist Item | Score |
|---|---|---|
| **Task Specification** | Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar absent |
| | All constraints are compatible — no conflicts between scope, length, or depth | PASS |
| **Chain of Thought** | CoT included only for math/symbolic/multi-step logic tasks | N/A — workflow does not invoke CoT triggers |
| | CoT trigger used correctly | N/A |
| | Reasoning elicited before answer | N/A |
| | CoT traces flagged as heuristic | N/A |
| **Few-Shot Examples** | Examples selected by semantic similarity | PASS — spike good/bad examples are domain-appropriate |
| | 2–5 examples total | PASS |
| | Ordered simple → complex | PASS — good examples are positive, bad examples teach anti-patterns |
| | Examples span diverse sub-types | PASS — good/bad examples cover multiple failure modes |
| | Format is consistent across examples | PASS |
| | Example order fixed across evaluation runs | N/A |
| **Formatting** | Instruction complete before formatting applied | PASS |
| | Prompt sections separated by semantically named XML tags | PASS — uses `<step>`, `<purpose>`, `<success_criteria>` |
| | At least 3 format variants tested on target model | FAIL — no evidence of format testing |
| **Instruction Framing** | All negative instructions converted to positive equivalents | FAIL — "Avoid unless" block in detect_stack |
| | Priority order explicit when multiple criteria apply | PASS — "Order by risk" is stated |
| | Tie-breaking rules match domain's cost asymmetry | FAIL — no tie-breaking rule for equal-risk spikes |
| **Persona** | Persona included only for open-ended/stylistic tasks | FAIL — persona absent; task is open-ended and warrants one |
| | Persona is specific (constrains voice/register) | FAIL — no persona to evaluate |
| | Persona descriptor is gender-neutral | N/A — no persona |
| **Output Format** | Structured output uses two-step reasoning-then-format approach | N/A |
| | Single-call JSON places reasoning before answer fields | N/A |
| | Constrained decoding adopted only after free-form proven insufficient | N/A |
| | Machine-parsed output uses exact format specification | PASS — commit message format is exact and literal |
| **Context Placement** | Task instruction at start of prompt | PASS — `<purpose>` leads |
| | Primary input at end of prompt | PASS — `<success_criteria>` closes |
| | Background context in the middle | PASS |
| | Irrelevant context removed | PASS — no bloat observed |
| | Time-sensitive context labeled as snapshot | N/A |
| **Self-Consistency** | Applied only to tasks with single correct answer | N/A |
| | Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | Redundant instructions removed | PASS |
| | Long prompts compressed | N/A — prompt is appropriately sized |
| | RAG context is extracted passage only | N/A |
| **System/User Split** | Persistent instructions in system prompt | N/A — workflow file, not a system/user split prompt |
| | Task-specific instructions in user prompt | N/A |
| | Each instruction appears in exactly one location | PASS |
| | Safety-critical constraints have external validation | FAIL — no external validation of spike isolation |
| **Agent/Subagent** | Agent prompts are fully self-contained | PASS — workflow is self-contained |
| | All file paths in agent output are absolute | FAIL — uses relative paths throughout (`.planning/spikes/`) |
| | Parallel agents launched in single message block | N/A — spikes are sequential by design |
| | Adversarial probes specified for verification agents | N/A — this is a spike, not a verification workflow |
| **Structural Architecture** | Large prompts decomposed into atomic modules | PASS — step separation is clean |
| | Template variables use `${VARIABLE_NAME}` syntax | PASS — `$ARGUMENTS` follows convention |
| | Modules compose via variable substitution, not copy-paste | PASS |
| **Constraint Enforcement** | Every restriction paired with equally concrete permission | FAIL — restrictions listed without paired permissions |
| | Hard exclusion lists enumerated, not described qualitatively | PASS — avoid list is specific |
| | Known edge cases have precedent-style rulings | FAIL — no precedents for edge cases |
| | Confidence thresholds are numeric, not qualitative | N/A |
| **Decision Frameworks** | Multi-option recommendations use explicit decision tree | PASS — QUICK_MODE branching is explicit |
| | Criteria checklists gate complex approaches | PASS — success_criteria block serves this role |
| | Action permissions framed around reversibility | FAIL — no reversibility framing |
| **Multi-Phase Workflows** | Complex tasks organized into explicit named phases | PASS — `<step name="...">` throughout |
| | Required steps distinguished from type-specific steps | PASS — QUICK_MODE skips are explicit |
| | Scenario-based branching handles multiple paths | PASS — three branching paths are explicit |
| **Memory and Continuity** | Memory templates use XML tags as section labels | N/A |
| | Compaction summaries include discoveries and failed approaches | N/A |
| | Next steps tied to user's most recent explicit request | PASS — next-step routing at end is contextual |
| **Modularity** | Each prompt component has a single responsibility | PASS |
| | Scope boundaries state both inclusions and exclusions | PASS — includes good/bad spike examples |
| **Safety and Trust** | Validation at system boundaries only | N/A |
| | Dual-use capabilities state permissions before restrictions | FAIL — restrictions stated without paired permissions |
| | Authorization narrow-scoped; each action confirmed before expanding | PARTIAL — checkpoints exist but scope is not formally defined |
| **Tone and Style** | Size constraints use numeric limits, not qualitative descriptors | PASS — "2-5" spikes, "NNN" format are numeric |
| | Instructions use imperative present tense | PASS — "Build each spike sequentially", "Create the directory" |
| | Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | Prompt flagged as draft for automated optimization | FAIL — not flagged |
| | Correct optimizer selected | FAIL — not addressed |
| | Held-out test set reserved before optimization | FAIL — not addressed |

---

## Recommendations

Listed in descending priority — highest ROI first.

**1. Add a persona (Section 6, Action 1–2; Section 22 Pattern 1)**
This is the single highest-leverage missing element. The spike workflow requires an adversarial, minimalist investigator mindset — not generic assistant behavior. A tightly scoped persona biases every subsequent decision the model makes (technology selection, code scope, result interpretation) toward the workflow's intent. Without it, the model must infer its operating stance from the step instructions alone, which is less reliable. Draft provided in Issue 1.

**2. Specify the output format upfront and add audience + quality bar (Section 7 Action 1; Section 22 Pattern 3; Section 1 Action 1–2)**
The consolidated report format buried in the `report` step should be declared at the top of the file as an `<output_format>` block. Simultaneously, add `<audience>` and `<quality_bar>` tags after `<purpose>`. These three additions complete the task specification (what, why, and what good looks like) and prime the model to collect the right evidence from spike execution rather than reconstructing it at the end. Drafts provided in Issues 1 and 4.

**3. Add a `<constraints>` block with paired permissions and reversibility framing (Section 14; Section 15 reversibility framework)**
The workflow tells the model what to avoid but never formally states what it may do freely vs. what requires confirmation. Adding a `<constraints>` block with `<take_freely>` and `<confirm_with_user>` sub-tags resolves this ambiguity and gives the model a clear action-scope boundary for tool-use decisions during spike execution. Draft provided in Issue 5.

**4. Convert the "Avoid" list in `detect_stack` to positive framing (Section 5, Action 1)**
The negated list in `detect_stack` is a minor but mechanical fix with clear positive equivalents. Rewrite as "Default to X; use Y in place of Z" — the conversion table in Section 5 makes this straightforward. Draft provided in Issue 3.

**5. Add a tie-breaking rule for equal-risk spike ordering (Section 5 "Tie-breaking instructions"; Section 22 Pattern 4)**
The decompose step instructs "order by risk" but is silent when risks are equal. A single tie-breaking clause (prefer cheaper-to-run first; prefer fewer-but-better-scoped spikes at count boundaries) closes this gap and anchors behavior at exactly the ambiguous margin where the model's priors are most likely to diverge from intent. Draft provided in Issue 6.
