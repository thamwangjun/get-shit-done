# Critique: node-repair.md

## Summary

`node-repair.md` is a well-scoped, operationally focused workflow that defines a clear four-strategy repair taxonomy (RETRY, DECOMPOSE, PRUNE, ESCALATE) with concrete decision logic and structured logging. Its strongest assets are the explicit decision sequencing inside `<step>` tags and the unambiguous output-line formats for each repair strategy. However, the prompt is written entirely in XML structural tags without leveraging the guide's semantic XML vocabulary for task, persona, constraints, or output format sections. There is no persona, no quality bar, no explicit audience declaration, no CoT trigger despite the multi-step diagnostic reasoning required, no few-shot examples, no negative-to-positive instruction conversion, and no output format block. Several constraint pairs are stated as restrictions without matching permissions. The workflow is production-capable but leaves meaningful prompt-engineering leverage on the table.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase/step pattern applied correctly.** The `<step>` tags with `name` attributes create named cognitive phases (diagnose, execute_retry, execute_decompose, execute_prune, execute_escalate) that mirror the guide's `<phase id="..." name="...">` pattern. Each step is self-contained and sequenced.

- **Section 14 (Constraint Enforcement) — hard constraint values are numeric, not qualitative.** `REPAIR_BUDGET` defaults to a concrete integer (2) rather than a vague descriptor like "a few attempts." The configurable override path (`config.json workflow.node_repair_budget`) is also specific and actionable.

- **Section 4 (Formatting and Structure) — XML delimiters used throughout.** The prompt uses XML tags consistently rather than markdown headers or `---` dividers, giving the model richer semantic signal per Section 4 Action 2.

- **Section 15 (Decision Frameworks) — implicit decision tree present in `<step name="diagnose">`.** The four numbered questions in the diagnose step form a usable triage tree. The conditions are distinct and cover the full outcome space without overlap.

- **Section 21 (Tone and Style) — imperative present tense used consistently.** Instructions throughout use active imperative framing ("Read the error," "Apply the specific adjustment," "Mark task as skipped") rather than passive or gerund forms.

- **Section 19 (Modularity) — single responsibility.** The workflow does exactly one thing: handle failed task verification. It does not bleed into execution, planning, or reporting concerns.

---

## Issues

### Issue 1: No task specification block (Section 1, Actions 1–2)

**Principle:** Section 1 requires the prompt to make explicit (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. Section 1 Action 2 requires encoding the audience.

**What's missing:** The `<purpose>` block states the intent informally but does not encode the audience (the execute-plan workflow / orchestrating agent), the quality bar (what a correct repair decision looks like), or the "why" (what downstream failure looks like if repair is skipped or done wrong).

**Concrete fix:** Replace or augment `<purpose>` with:

```xml
<task>
Analyze the failed task, select exactly one repair strategy, execute it, and log the outcome.
</task>

<audience>
The orchestrating execute-plan agent. Output is machine-consumed: strategy tokens (RETRY, DECOMPOSE, PRUNE, ESCALATE) must appear in the exact formats defined below so the caller can parse and route without further interpretation.
</audience>

<quality_bar>
A correct repair decision (1) selects the lowest-cost strategy whose preconditions are met, (2) executes fully before logging, and (3) produces a log line that matches the exact format in the logging table.
</quality_bar>
```

---

### Issue 2: No persona (Section 6, Action 2; Section 22, Pattern 1)

**Principle:** Section 6 Action 2 and Pattern 1 require personas to be specific and domain-scoped when they are included. For agentic tasks with a distinct mindset requirement, the reframe pattern (Section 6) is the right tool.

**What's missing:** The workflow invokes complex diagnostic reasoning — the agent must resist premature repair, correctly classify failure types, and know when to escalate rather than attempt another fix. No persona anchors this mindset.

**Concrete fix:**

```xml
<persona>
You are a repair specialist. Your job is not to fix the task at any cost — it is to choose the cheapest intervention that has a reasonable chance of success, and escalate without hesitation when that threshold is not met.
</persona>
```

This uses the reframe pattern (Section 6) to displace the default "try harder" prior.

---

### Issue 3: No CoT trigger for multi-step diagnostic reasoning (Section 2)

**Principle:** Section 2 specifies that tasks requiring multi-step logic must include a CoT trigger placed before the answer. The diagnose step requires the agent to evaluate four branching conditions in sequence before committing to a strategy.

**What's missing:** No CoT trigger ("Take a deep breath and work on this problem step-by-step.") and no `<reasoning>` / `<answer>` structure to separate diagnosis from the strategy output token. Without it, the model may collapse directly to an answer without surfacing the classification logic.

**Concrete fix:** Add at the top of `<step name="diagnose">`:

```xml
<step name="diagnose">
Take a deep breath and work on this problem step-by-step.

<reasoning>
Evaluate each condition in order:
1. Is this a transient/environmental issue? → RETRY
2. Is the task verifiably too broad? → DECOMPOSE
3. Is a prerequisite genuinely missing and unfixable in scope? → PRUNE
4. Has RETRY already been attempted? Check REPAIR_BUDGET. If 0 → ESCALATE
</reasoning>
<answer>
[Emit exactly one strategy token here after reasoning is complete]
</answer>
</step>
```

---

### Issue 4: No few-shot examples for strategy selection (Section 3; Section 22, Pattern 2)

**Principle:** Section 3 Action 1 specifies selecting examples by semantic similarity; Pattern 2 requires every qualitative instruction to be paired with a calibrating example. The four strategy conditions are described qualitatively and will be interpreted inconsistently without examples.

**What's missing:** No examples of failure inputs mapped to the correct strategy. "Command error, missing dependency, wrong path" are listed as RETRY triggers but are not shown as concrete cases.

**Concrete fix:** Add an `<examples>` block after `<repair_directive>` with one example per strategy, ordered simple to complex per Section 3 Action 3:

```xml
<examples>
  <example>
    <input>ERROR: `npm test` exited with code 1 — "Cannot find module './utils/helpers'"</input>
    <output>RETRY: Run `npm install` first to restore missing dependency before re-executing</output>
    <commentary>Transient environment issue — module missing from node_modules, not from source.</commentary>
  </example>
  <example>
    <input>ERROR: Done-criteria "auth works, token is stored, and logout clears session" — only token storage verified.</input>
    <output>DECOMPOSE: Verify token storage | Verify auth endpoint returns 200 | Verify logout clears session</output>
    <commentary>Done-criteria spans three independent concerns — each needs its own verification.</commentary>
  </example>
  <example>
    <input>ERROR: Task requires Stripe API key. REPAIR_BUDGET: 0. Key not present in env and not configurable here.</input>
    <output>PRUNE: Stripe API key is a required external dependency not available in this environment — task cannot proceed without it.</output>
    <commentary>Prerequisite is external and unfixable in scope; PRUNE is cheaper than burning budget on RETRY.</commentary>
  </example>
</examples>
```

---

### Issue 5: Constraint pairs are one-sided — restrictions without matching permissions (Section 14)

**Principle:** Section 14 requires every restriction to be paired with an equally concrete statement of what IS permitted. "Never modify PLAN.md on disk" names what is forbidden but not what disk operations are allowed.

**What's missing:** The `<constraints>` block lists four prohibitions/conditions with no `<permitted>` counterpart.

**Concrete fix:** Restructure using the guide's `<permitted>` / `<reserved_for_human_review>` sub-tags:

```xml
<constraints>
  <permitted>
    - Read PLAN.md, SUMMARY.md, and any file referenced in the task context
    - Execute shell commands required to retry or verify the task
    - Write to SUMMARY.md under "## Deviations from Plan" to record repair actions
    - Modify in-memory task state (decomposed sub-tasks) without writing to disk
  </permitted>

  <reserved_for_human_review>
    - Modifying PLAN.md on disk (decomposed sub-tasks are in-memory only)
    - Architectural decisions that change scope or dependencies
    - Any action when REPAIR_BUDGET is 0 — escalate to user instead
  </reserved_for_human_review>
</constraints>
```

---

### Issue 6: No output format specification (Section 7; Section 22, Pattern 3)

**Principle:** Section 7 and Pattern 3 require the output format to be stated completely and upfront, especially for machine-parsed output. The strategy tokens (RETRY:, DECOMPOSE:, PRUNE:, ESCALATE:) are machine-parsed by the calling agent.

**What's missing:** The output format is implied by examples in `<repair_directive>` but never declared in a dedicated `<output_format>` block with explicit parsing requirements. There is no statement that these are machine-parsed strings requiring exact formatting.

**Concrete fix:**

```xml
<output_format>
The strategy selection line is parsed by the calling agent. Emit it in exactly one of these formats:

RETRY: [specific adjustment to make before retrying]
DECOMPOSE: [sub-task 1] | [sub-task 2] | [sub-task 3 max]
PRUNE: [one-sentence justification]
ESCALATE: [what was tried] | [what decision is needed]

Rules:
- Begin the line with the strategy keyword in ALL CAPS followed by a colon and a single space.
- No markdown formatting, no bold, no line breaks within the strategy line.
- Emit exactly one strategy line per repair invocation.
- Log lines in SUMMARY.md must match the formats in the logging table exactly.
</output_format>
```

---

### Issue 7: Negative instructions not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative primary directives ("never", "do not") to be rewritten as positive specifications of desired behavior.

**What's missing:** The `<constraints>` block contains two negative primary directives: "Never modify PLAN.md on disk" and the implicit "do not escalate prematurely" embedded in the ESCALATE definition.

**Concrete fix** (applies the conversion table from Section 5):

| Current (negative) | Replacement (positive) |
|---|---|
| "Never modify PLAN.md on disk" | "Keep all decomposed sub-tasks in memory; write only to SUMMARY.md" |
| "DECOMPOSE sub-tasks must be more specific than the original, not synonymous rewrites" | "Each DECOMPOSE sub-task must introduce a narrower, independently verifiable scope reduction" |

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are explicit | FAIL | `<purpose>` is present but audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | RETRY/DECOMPOSE/PRUNE/ESCALATE are mutually exclusive and non-conflicting |
| CoT included only for appropriate task types | FAIL | Multi-step diagnostic logic requires CoT; none present |
| CoT trigger used verbatim | FAIL | No CoT trigger |
| Reasoning elicited before answer | FAIL | No `<reasoning>` / `<answer>` separation |
| CoT traces treated as heuristic, verified downstream | N/A | No CoT present |
| Examples selected by semantic similarity | FAIL | No examples present |
| 2–5 examples total | FAIL | No examples present |
| Examples ordered simple → complex | FAIL | No examples present |
| Examples span diverse sub-types | FAIL | No examples present |
| Format consistent across examples | N/A | No examples present |
| Example order fixed across evaluation runs | N/A | No examples present |
| Instruction complete before formatting applied | PASS | Instructions are clear before XML structure is applied |
| Prompt sections separated by semantically named XML tags | PASS | `<repair_directive>`, `<process>`, `<step>`, `<logging>`, `<constraints>` all used |
| At least 3 format variants tested | N/A | Evaluation infrastructure not documented |
| Negative instructions converted to positive equivalents | FAIL | "Never modify PLAN.md" and other negatives not converted |
| Priority order explicit when multiple criteria apply | PASS | Diagnose step uses ordered numbered questions (1 → 2 → 3 → 4) |
| Tie-breaking rules match domain cost asymmetry | PASS | ESCALATE fires when REPAIR_BUDGET = 0; clear threshold |
| Persona included only for appropriate tasks | FAIL | No persona; an adversarial-mindset persona would improve strategy selection |
| Persona is specific, not generic | N/A | No persona |
| Persona is gender-neutral | N/A | No persona |
| Structured output uses two-step reasoning-then-format | FAIL | Strategy tokens are machine-parsed but no format block declared |
| Machine-parsed output uses exact format specification | FAIL | Strategy token formats are implied, not formally specified |
| Task instruction at start of prompt | PASS | `<purpose>` leads the file |
| Primary input at end of prompt | PASS | `<constraints>` closes the file; runtime inputs (`FAILED_TASK`, `ERROR`, etc.) are injected at call time |
| Background context in the middle | PASS | `<process>` and `<logging>` sit between purpose and constraints |
| All irrelevant context removed | PASS | Prompt is lean with no filler |
| Time-sensitive injected context labeled as snapshot | N/A | No injected context in the static file |
| Self-consistency applied only to single-answer tasks | N/A | Not applicable to this workflow |
| Redundant instructions removed | PASS | No duplication detected |
| Each instruction appears in exactly one location | PASS | No repeated instructions |
| Safety-critical constraints have external validation | N/A | Validation handled by the calling execute-plan workflow |
| Agent prompts are fully self-contained | FAIL | Inputs (`FAILED_TASK`, `ERROR`, `PLAN_CONTEXT`, `REPAIR_BUDGET`) are listed but their injection mechanism is not specified — caller must know the contract |
| All file paths in agent output are absolute | N/A | No file paths emitted by this workflow |
| Parallel agents launched in single message block | N/A | No parallel agents |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |
| Large prompts decomposed into atomic modules | PASS | The workflow is a single-responsibility module |
| Template variables use `${VARIABLE_NAME}` syntax | FAIL | Input variables (`FAILED_TASK`, `ERROR`, etc.) are named in `<inputs>` but not referenced using `${VAR}` syntax in the body |
| Every restriction paired with equally concrete permission | FAIL | Constraint block contains restrictions without `<permitted>` counterpart |
| Hard exclusion lists enumerated, not described qualitatively | PASS | Exclusion conditions are enumerated as numbered or bulleted discrete cases |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` block; the "skip to verification_failure_gate" path for `node_repair: false` is an edge case ruling not surfaced as a precedent |
| Confidence thresholds are numeric, not qualitative | PASS | REPAIR_BUDGET is an integer; threshold is `0` |
| Multi-option recommendations use decision tree or table | PASS | Diagnose step is an effective linear decision tree |
| Criteria checklists gate complex approaches | PASS | Four criteria gate ESCALATE |
| Action permissions framed around reversibility | FAIL | Reversibility framework not applied; disk-write prohibition is stated as a rule, not framed as irreversibility |
| Complex tasks organized into explicit named phases | PASS | `<step name="...">` tags used for all five steps |
| Required steps distinguished from type-specific steps | PASS | `<step name="diagnose">` is universal; `execute_*` steps are type-specific |
| Scenario-based branching handles multiple paths explicitly | PASS | Each strategy has its own `execute_*` step |
| Memory templates use XML tags as section labels | N/A | Not a memory workflow |
| Compaction summaries include discoveries and failed approaches | N/A | Not a compaction workflow |
| Next steps tied to user's most recent explicit request | N/A | Not applicable |
| Each prompt component has single responsibility | PASS | Single-responsibility: repair only |
| Scope boundaries state inclusions and exclusions | FAIL | No `<scope>` block; what the workflow explicitly does not handle (e.g., plan-level replanning, multi-task rollback) is not stated |
| Validation at system boundaries; internal interfaces trusted | PASS | Validation deferred to calling agent; repair logic trusts inputs |
| Dual-use capabilities state permissions before restrictions | N/A | Not a dual-use capability |
| Authorization is narrow-scoped | PASS | Budget and scope limits are explicit |
| Size constraints use numeric limits | PASS | `REPAIR_BUDGET: 2`, `max 3 sub-tasks` are numeric |
| Instructions use imperative present tense | PASS | Consistent throughout |
| Working notes in analysis tags, not user-facing output | N/A | No reasoning scratchpad required in the static file |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | N/A | No optimization configured |
| Held-out test set reserved | N/A | No optimization configured |

**Summary score: 19 PASS / 16 FAIL / 16 N/A**

---

## Recommendations

Ordered by expected impact on reliability and correctness.

### 1. Add a CoT trigger and reasoning/answer separation in the diagnose step (Section 2; highest impact)

The diagnose step is the entire decision point of the workflow. Without a CoT trigger and explicit `<reasoning>` / `<answer>` structure, the model collapses to a strategy token without working through the four conditions in order. A missed classification here cascades — a PRUNE that should have been a RETRY wastes a task; a RETRY that should have been ESCALATE burns budget. Add `"Take a deep breath and work on this problem step-by-step."` and wrap the diagnosis in `<reasoning>` / `<answer>` tags as described in Issue 3.

### 2. Add an `<output_format>` block with exact machine-parsing requirements (Section 7, Action; Section 22, Pattern 3)

The four strategy tokens are the primary output consumed by the orchestrator. Their format is implied by bullet examples in `<repair_directive>` but never formally specified. A mismatch (extra whitespace, lowercase keyword, markdown bold) silently breaks the caller's parser. Create a dedicated `<output_format>` block with the exact string requirements as described in Issue 6.

### 3. Add three to four few-shot examples covering each repair strategy (Section 3; Section 22, Pattern 2)

The strategy selection conditions ("transient/environmental issue," "too coarse," "prerequisite missing") are qualitative and will be applied inconsistently without grounding examples. Add one concrete input-output-commentary triple per strategy (RETRY, DECOMPOSE, PRUNE), ordered simple to complex, as described in Issue 4. The ESCALATE case can be omitted from examples since it is triggered by budget state, not classification.

### 4. Restructure `<constraints>` with explicit `<permitted>` / `<reserved_for_human_review>` pairs (Section 14)

The current constraints block reads as a list of prohibitions. Adding a `<permitted>` counterpart (what disk operations and tool calls are allowed) removes ambiguity about what the repair agent is authorized to do autonomously. This also enables the reversibility framing from Section 15: "modify in-memory task state" is reversible and freely permitted; "modify PLAN.md on disk" is irreversible and reserved. See Issue 5 for the concrete rewrite.

### 5. Declare a domain-scoped persona using the reframe pattern (Section 6, Actions 1–2; Section 22, Pattern 1)

The repair agent needs to resist the default "try harder" bias — the most common wrong move is attempting another RETRY when PRUNE or ESCALATE is correct. A reframe persona ("Your job is not to fix the task at any cost — it is to choose the cheapest intervention") anchors this directly and displaces the prior. This is a one-sentence addition with measurable effect on strategy conservatism. See Issue 2 for the exact text.
