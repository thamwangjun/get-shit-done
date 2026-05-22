# Critique: do.md

## Summary

`do.md` is a capable dispatcher workflow that correctly separates concerns (validate, check project, route, display, dispatch) and uses a clear routing table as its central decision mechanism. However, it falls meaningfully short of the guide's structural standards: instructions are delivered in a mix of ad-hoc prose, markdown headers, and XML tags without a consistent schema, the `<purpose>` block does not encode audience or quality bar, routing ambiguity handling is underspecified, negative-framing is absent but so is positive-framing for key decisions, the output format for the routing display is implicitly specified rather than formally constrained, and the workflow ships no few-shot examples to anchor routing calibration. These gaps make the prompt vulnerable to routing drift and inconsistent ambiguity resolution across model versions.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase pattern applied correctly.** The workflow is decomposed into five named `<step>` elements (`validate`, `check_project`, `route`, `display`, `dispatch`), creating clear cognitive boundaries and a sequential execution contract.

- **Section 14 (Constraint Enforcement) — hard routing table present.** The routing table enumerates 18 distinct intent categories with explicit "first matching rule" semantics, which removes ambiguity for the majority of inputs.

- **Section 16 — scenario-based branching for ambiguity.** The "Ambiguity handling" block and the "Requires `.planning/` directory" note function as scenario branches, handling two distinct execution paths explicitly rather than leaving the model to infer.

- **Section 5 (Instruction Framing) — conditional instructions used.** The `TEXT_MODE` detection block (`--text` flag or `text_mode` from init JSON) uses explicit conditional branching syntax, consistent with guide Section 5's conditional instruction pattern.

- **Section 4 (Formatting and Structure) — XML tags used for step boundaries.** The `<step name="...">` structure uses semantically named tags that identify what each section *is*, not just where it starts.

- **Section 19 (Modularity) — dispatcher-only responsibility.** The workflow's stated single responsibility ("it never does the work itself") is enforced by the `success_criteria` checklist at the end.

---

## Issues

### Issue 1: Missing audience and quality bar (Section 1, Actions 1–2)

**Principle:** Section 1 requires explicit encoding of (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. It also requires the audience to be stated.

**What's wrong:** The `<purpose>` block states *what* the workflow does ("route to the most appropriate GSD command") but does not state who invokes it, what their domain knowledge is, or what a correct routing decision looks like. There is no `<audience>` or `<quality_bar>` tag anywhere in the file.

**Concrete fix:**

```xml
<audience>
Claude Code agents operating inside a GSD project. The invoking context may be a user
typing freeform text or another agent passing structured arguments. Assume familiarity
with CLI workflows but no knowledge of GSD's internal command taxonomy.
</audience>

<quality_bar>
A correct dispatch: matches the single best-fit command, passes $ARGUMENTS unchanged,
and adds no interpretation. An incorrect dispatch: routes to a plausible-but-wrong
command, silently discards arguments, or does work directly instead of delegating.
</quality_bar>
```

---

### Issue 2: No few-shot routing examples (Section 3, Actions 1–5; Section 22 Pattern 2)

**Principle:** Section 3 requires 2–5 examples selected by semantic similarity, ordered simple-to-complex. Section 22 Pattern 2 requires every abstract instruction to be paired with a calibrating example.

**What's wrong:** The routing table lists 18 intent categories with natural-language descriptions only. There are no concrete examples of user input text mapped to a routing decision. Without examples, the model must infer the boundary between categories (e.g., "a specific, actionable, small task" versus "a complex task: refactoring, migration") from category labels alone. This is the highest-variance decision in the workflow.

**Concrete fix:** Add a `<examples>` block after the routing table with 3–5 annotated pairs covering the hardest disambiguation cases:

```xml
<examples>
  <example>
    <input>fix the broken login — it returns 500 on wrong password</input>
    <output>/gsd-debug</output>
    <commentary>Concrete failure symptom → debug, not quick. "Fix" alone is insufficient signal; the 500 error confirms it needs investigation.</commentary>
  </example>
  <example>
    <input>add a logout button to the nav bar</input>
    <output>/gsd-quick</output>
    <commentary>Single, scoped, actionable UI change with no multi-file architecture concern → quick.</commentary>
  </example>
  <example>
    <input>migrate the auth system from sessions to JWTs</input>
    <output>/gsd-add-phase</output>
    <commentary>Multi-file, cross-cutting change with design decisions → phase, not quick.</commentary>
  </example>
</examples>
```

Order: simple (logout button) → ambiguous (auth migration, which could look like quick) → complex.

---

### Issue 3: Routing display format is implicit and qualitatively specified (Section 7; Section 21)

**Principle:** Section 7 Action 1 requires output format to be specified completely and upfront. Section 21 states that size constraints must use numeric limits, not qualitative descriptors.

**What's wrong:** The routing display block:

```
**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```

specifies "one-line explanation" qualitatively. The `{first 80 chars}` truncation rule is a numeric limit (good), but there is no `<output_format>` tag wrapping the display block, and no constraint on what constitutes a valid reason string (length, tense, content).

**Concrete fix:** Wrap in a formal output format tag and add a numeric size constraint on the reason:

```xml
<output_format>
Emit the routing decision in this exact format — no additional prose before or after:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command, e.g. /gsd-debug}
**Reason:** {10 words or fewer, imperative present tense, e.g. "Failure symptom requires systematic investigation."}
</output_format>
```

---

### Issue 4: Success criteria checklist uses markdown checkboxes, not XML structure (Section 4, Action 2; Section 23)

**Principle:** Section 4 Action 2 requires prompt sections to be separated by semantically named XML tags. The guide's own checklist (Section 23) uses `<checklist>` with semantic sub-tags.

**What's wrong:** The `<success_criteria>` block uses a raw markdown checkbox list inside a single XML tag. This is structurally inconsistent with the rest of the prompt's tag vocabulary and does not separate individual criteria as discrete, named elements.

**Concrete fix:** Replace the flat checkbox list with named criteria sub-tags or a properly formed `<checklist>` block:

```xml
<success_criteria>
  <criterion id="1">Input validated — $ARGUMENTS is not empty before routing</criterion>
  <criterion id="2">Intent matched to exactly one GSD command</criterion>
  <criterion id="3">Ambiguity resolved via user question when two or more routes match</criterion>
  <criterion id="4">Project existence checked for routes that require .planning/</criterion>
  <criterion id="5">Routing decision displayed in the required format before dispatch</criterion>
  <criterion id="6">Command invoked with $ARGUMENTS passed unchanged</criterion>
  <criterion id="7">No work done directly — dispatcher role only</criterion>
</success_criteria>
```

---

### Issue 5: Priority order for routing conflict resolution is absent (Section 5, Instruction Framing)

**Principle:** Section 5 requires explicit priority ordering when multiple criteria apply, and tie-breaking rules matched to the domain's cost asymmetry.

**What's wrong:** The routing table says "apply the first matching rule" but does not state what happens when two rules match with equal specificity, nor does it define the cost asymmetry (is over-routing to a complex command safer than under-routing to `/gsd-quick`?). The ambiguity handling block addresses the UX (ask the user) but not the model's internal resolution logic when it must choose before asking.

**Concrete fix:** Add a `<priority_order>` block after the routing table and a `<tie_breaking>` rule:

```xml
<priority_order>
  1. Explicit command mentions (e.g. "run gsd-debug") — override all pattern matching
  2. Failure/error signals ("broken", "crash", "500", "exception") → /gsd-debug
  3. Scope signals ("all remaining", "full migration", "refactor X system") → /gsd-add-phase
  4. Size signals ("small", "quick", "just add", "typo") → /gsd-quick
  5. Default: when scope is unclear, route to the more structured command
</priority_order>

<tie_breaking>
  When in doubt, route to the more structured command (/gsd-add-phase over /gsd-quick,
  /gsd-debug over /gsd-quick). Over-routing costs one planning step; under-routing risks
  unplanned changes to production code.
</tie_breaking>
```

---

### Issue 6: `<required_reading>` is vague and forward-referencing (Section 10, Prompt Length; Section 8, Context Placement)

**Principle:** Section 8 Action 4 requires trimming all context to what is directly relevant. Section 10 Action 1 flags prompts that exceed necessary length.

**What's wrong:** The `<required_reading>` block says "Read all files referenced by the invoking prompt's execution_context before starting" — but `execution_context` is undefined within this file. The instruction is self-referential and requires the reader to know what the invoking prompt provides. This either adds dead weight (if no files are referenced) or creates silent failure (if the model skips reading because it cannot identify the context).

**Concrete fix:** Either remove the `<required_reading>` block if it is always empty in practice, or replace it with a concrete template variable:

```xml
<required_reading>
${EXECUTION_CONTEXT_FILES||""}
</required_reading>
```

And document the variable in frontmatter so the orchestrating system knows to populate it.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A where the section's concern genuinely does not apply to a dispatcher workflow.

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (audience and quality bar absent; see Issue 1)
- `[x]` All constraints are compatible — no conflicts between scope, length, or depth — **PASS**

### Chain of Thought
- `[ ]` CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **N/A** (no CoT present; task is pattern-matching, so omitting CoT is correct)
- `[ ]` Reasoning elicited before answer — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **FAIL** (no examples present; see Issue 2)
- `[ ]` 2–5 examples total — **FAIL**
- `[ ]` Ordered simple → complex — **FAIL**
- `[ ]` Examples span diverse sub-types — **FAIL**
- `[ ]` Format consistent across examples — **N/A** (no examples)
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[x]` Instruction complete and clear before formatting applied — **PASS**
- `[x]` Prompt sections separated by semantically named XML tags — **PASS** (step tags with name attributes)
- `[ ]` At least 3 format variants tested on target model — **FAIL** (no evidence of format testing)

### Instruction Framing
- `[x]` Negative instructions converted to positive equivalents — **PASS** (no problematic negatives present)
- `[ ]` Priority order explicit when multiple criteria apply — **FAIL** (see Issue 5)
- `[ ]` Tie-breaking rules match domain's cost asymmetry — **FAIL** (see Issue 5)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **N/A** (no persona; appropriate for a dispatcher)
- `[ ]` Persona specific — **N/A**
- `[ ]` Persona gender-neutral — **N/A**

### Output Format
- `[ ]` Structured output tasks use two-step reasoning-then-format — **N/A**
- `[ ]` Single-call JSON places reasoning before answer — **N/A**
- `[ ]` Constrained decoding adopted only after free-form proven insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification — **FAIL** (routing display format is partially implicit; see Issue 3)

### Context Placement
- `[x]` Task instruction at start of prompt — **PASS** (`<purpose>` leads)
- `[ ]` Primary document or input at end — **N/A** (input is $ARGUMENTS, injected at runtime)
- `[x]` Background context in middle — **PASS** (`<required_reading>` and `<step name="check_project">` are middle-positioned)
- `[x]` Irrelevant context removed — **PASS** (prompt is lean)
- `[ ]` Time-sensitive injected context labeled as snapshot — **N/A**

### Self-Consistency
- `[ ]` Applied only to tasks with a single correct answer — **N/A**
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[x]` Redundant instructions and repeated context removed — **PASS**
- `[ ]` Long prompts compressed before sending — **N/A**
- `[ ]` RAG context is extracted relevant passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (workflow file, not system/user split)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[x]` Each instruction appears in exactly one location — **PASS**
- `[ ]` Safety-critical constraints have external validation — **N/A**

### Agent/Subagent
- `[x]` Agent prompts fully self-contained — **PASS** (dispatched command receives $ARGUMENTS directly)
- `[ ]` All file paths in agent output are absolute — **N/A**
- `[ ]` Parallel agents launched in a single message block — **N/A**
- `[ ]` Adversarial probes specified for verification agents — **N/A**

### Structural Architecture
- `[x]` Large prompts decomposed into atomic, single-responsibility modules — **PASS**
- `[x]` Template variables use ${VARIABLE_NAME} syntax — **PASS** ($ARGUMENTS)
- `[x]` Modules compose at runtime via variable substitution — **PASS**

### Constraint Enforcement
- `[ ]` Every restriction paired with an equally concrete permission — **FAIL** ("no work done directly" has no paired statement of what the dispatcher *may* do)
- `[x]` Hard exclusion lists enumerated, not described qualitatively — **PASS** (routing table enumerates categories)
- `[ ]` Known edge cases have precedent-style rulings — **FAIL** (no precedent blocks)
- `[ ]` Confidence thresholds are numeric, not qualitative — **N/A**

### Decision Frameworks
- `[x]` Multi-option recommendations use explicit decision tree or comparison table — **PASS** (routing table)
- `[ ]` Criteria checklists gate complex approaches — **FAIL** (no gating criteria before routing)
- `[x]` Action permissions framed around reversibility — **N/A** (dispatcher takes no irreversible actions)

### Multi-Phase Workflows
- `[x]` Complex tasks organized into explicit named phases — **PASS** (five named steps)
- `[ ]` Required steps distinguished from type-specific steps — **FAIL** (all steps presented as uniform; no `<required_steps universal="true">` distinction)
- `[x]` Scenario-based branching handles multiple paths explicitly — **PASS** (ambiguity handling and .planning/ check)

### Memory and Continuity
- `[ ]` Memory templates use XML tags as section labels — **N/A**
- `[ ]` Compaction summaries include discoveries and failed approaches — **N/A**
- `[ ]` Next steps tied to user's most recent explicit request — **N/A**

### Modularity
- `[x]` Each prompt component has single responsibility — **PASS**
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (scope includes routing logic; exclusions never stated)

### Safety and Trust
- `[ ]` Validation at system boundaries only; internal interfaces trusted — **PASS** (validation at input step only)
- `[ ]` Dual-use capabilities state permissions before restrictions — **N/A**
- `[ ]` Authorization narrow-scoped; each action confirmed before expanding — **PASS** (dispatcher confirms route before invoking)

### Tone and Style
- `[ ]` Size constraints use numeric limits, not qualitative descriptors — **FAIL** ("one-line explanation" in routing display; see Issue 3)
- `[x]` Instructions use imperative present tense — **PASS**
- `[ ]` Working notes in analysis tags, not user-facing output — **N/A**

### Optimization
- `[ ]` Prompt flagged as draft for automated optimization — **FAIL** (no optimization flag or frontmatter)
- `[ ]` Correct optimizer selected — **FAIL** (not addressed)
- `[ ]` Held-out test set reserved before optimization — **FAIL** (not addressed)

---

## Recommendations

Listed in priority order by impact on routing quality.

### 1. Add few-shot routing examples (HIGH IMPACT)

The routing table has 18 entries. Without examples, the model must resolve boundary cases (quick vs. add-phase, debug vs. quick) from category labels alone. Add 3–5 annotated `<example>` blocks covering the highest-ambiguity pairs, ordered simple-to-complex, with `<commentary>` explaining the decision rationale. This is the single highest-leverage improvement. (Section 3 Actions 1–5; Section 22 Pattern 2)

### 2. Add audience, quality bar, and tie-breaking rules (HIGH IMPACT)

The prompt lacks explicit encoding of who invokes it, what a correct routing looks like, and how to break ties when two routes match equally well. Add `<audience>`, `<quality_bar>`, `<priority_order>`, and `<tie_breaking>` blocks. The tie-breaking rule should encode the cost asymmetry: over-routing to a structured command is cheaper than under-routing to `/gsd-quick`. (Section 1 Actions 1–2; Section 5 Instruction Framing)

### 3. Formalize the routing display output format (MEDIUM IMPACT)

Wrap the routing display block in an `<output_format>` tag, replace "one-line explanation" with a numeric word limit (10 words or fewer), and specify the required tense (imperative present). This prevents the display from expanding into multi-sentence rationales that consume the user's attention before dispatch. (Section 7; Section 21)

### 4. State dispatcher scope explicitly — inclusions and exclusions (MEDIUM IMPACT)

The `<success_criteria>` block says "no work done directly" but never states what the dispatcher *is* permitted to do (ask a question, display a routing decision, invoke one command). Add a `<constraints>` block with paired `<permitted>` and `<exclusions>` tags. This is the constraint enforcement pattern from Section 14 and directly addresses the missing permission-restriction pairing. (Section 14; Section 23 constraint_enforcement checklist)

### 5. Add frontmatter with agentMetadata (LOW IMPACT, HIGH TIDINESS)

The file has no frontmatter block defining the workflow's identity, variable dependencies, or optimization status. Adding a frontmatter block with `variables: [ARGUMENTS]`, `whenToUse`, and a note flagging the prompt as a draft for optimization brings it into conformance with Section 11's YAML frontmatter pattern and Section 12's optimization handoff requirement. This also makes the `<required_reading>` variable dependency ($EXECUTION_CONTEXT_FILES) explicit and machine-readable. (Section 11; Section 12)
