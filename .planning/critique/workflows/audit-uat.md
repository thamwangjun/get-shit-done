# Critique: audit-uat.md

## Summary

`audit-uat.md` is a competent multi-phase workflow with clear step names, a sensible categorization scheme, and well-structured output templates. Its core logic is easy to follow and its output tables give the consuming agent a concrete scaffold to fill. However, the prompt is written predominantly in markdown prose and list notation rather than the XML-tag vocabulary mandated by the guide. It lacks a persona, omits explicit constraints (no permission pairs, no exclusion lists, no confidence thresholds), provides no quality bar, and does not state its audience. The output format is partially specified but relies on implicit format understanding rather than a complete, upfront specification with an embedded example. Taken together, these gaps leave meaningful ambiguity that will produce inconsistent output across runs.

---

## Strengths

- **Section 16 — Named phases with `<step>` tags.** The four steps (initialize, categorize, present, test_plan) create explicit cognitive boundaries. The model completes one step fully before beginning the next, which is exactly what Section 16 ("Phases create cognitive boundaries") calls for.

- **Section 16 — Scenario-based early exit.** The `initialize` step includes a well-formed conditional exit branch ("If `summary.total_items` is 0 … Stop here."), matching the Section 5 conditional instruction pattern and Section 16 scenario-based branching intent.

- **Section 7 / Pattern 3 — Output templates are defined.** The `present` and `test_plan` steps supply markdown table and prose templates that give the model a concrete output structure to follow, partially satisfying Section 22 Pattern 3 (output format specified completely and upfront).

- **Section 14 — Implicit categorization rules are enumerated.** The two categorization buckets (Testable Now, Needs Prerequisites) list their sub-types explicitly (`pending`, `human_uat`, `skipped_unresolved`, `server_blocked`, etc.), which is preferable to leaving the model to infer groupings. This partially follows Section 14's hard exclusion list pattern applied to filtering.

- **Section 8 — Task instruction leads.** The `<purpose>` block appears at the top and states the task before the process steps, broadly consistent with Section 8 Action 1 (task instruction at the very start).

---

## Issues

### Issue 1 — No XML tag vocabulary for prompt sections (Section 4 Action 2)

**Principle:** Section 4 Action 2 requires every distinct prompt section (instruction, context, input, output cue) to be wrapped in a semantically named XML tag. The guide states this is "strictly better than markdown headers or `---` delimiters."

**What's wrong:** The workflow uses `<purpose>`, `<process>`, and `<step name="...">` tags for process structure, but the prompt has no `<task>`, `<output_format>`, `<constraints>`, `<audience>`, or `<quality_bar>` tags. The `<purpose>` block serves as a task description but is not named `<task>`, breaking the shared vocabulary defined in Section 4's XML tag table. The `present` and `test_plan` output templates live inside `<step>` tags alongside process instructions, mixing format specification with procedural steps.

**Concrete fix:** Restructure the prompt with canonical top-level tags:

```xml
<task>
Cross-phase audit of all UAT and verification files. Find every outstanding item
(pending, skipped, blocked, human_needed), verify against the codebase to detect
stale docs, and produce a prioritized human test plan.
</task>

<audience>
An orchestrating GSD agent with access to the filesystem and the gsd-sdk CLI.
The output is rendered to a human developer reviewing UAT status.
</audience>

<quality_bar>
The audit is complete when: every UAT item is categorized, staleness is verified
against the live codebase, and the human test plan groups active items by shared
prerequisites with no omissions.
</quality_bar>

<output_format>
[move the markdown table templates here, out of <step> tags]
</output_format>

<process>
[step tags remain here, referencing output_format]
</process>
```

---

### Issue 2 — No persona (Section 6 Action 1 and 2)

**Principle:** Section 6 Action 1 directs the agent to assign a specific, role-constrained persona when the task is open-ended or requires a specific voice. Section 6 Pattern (Role-domain mapping) and Section 22 Pattern 1 both require the identity to be scoped to the exact domain.

**What's wrong:** The workflow assigns no persona. A UAT audit involves an adversarial, skeptical judgment — determining whether items are truly stale vs. merely neglected, and distinguishing blocked items that could be unblocked from ones genuinely requiring external services. Without a persona, the model defaults to generic assistant behavior, which is less reliable for this kind of triage judgment.

**Concrete fix:** Add a specific persona at the top of the prompt:

```xml
<persona>
You are a QA audit specialist. Your job is not to assume tests are still valid —
it is to verify each one against the live codebase and call out stale, misleading,
or permanently blocked items that are cluttering the backlog.

Your strengths:
- Cross-referencing test files against live code to detect stale references
- Categorizing items by actionability, not just status
- Writing UAT test plans that group tests by shared prerequisites
</persona>
```

---

### Issue 3 — Staleness verification logic is vague; no confidence threshold (Section 14 and Section 22 Pattern 6)

**Principle:** Section 14 requires confidence thresholds to be numeric, not qualitative. Section 22 Pattern 6 states that filtering tasks must specify both a numeric confidence floor and hard exclusion categories to control signal-to-noise at the instruction level.

**What's wrong:** The `categorize` step instructs the model to mark items as `stale`, `needs_update`, or `active` based on whether "the underlying feature still exists" or has been "significantly rewritten." Both criteria are qualitative and subjective. "Significantly rewritten" has no operationalized definition. There is no confidence threshold governing when the model should mark something stale vs. leave it as `needs_update`, nor any enumeration of what counts as a definitive staleness signal.

**Concrete fix:** Replace qualitative staleness criteria with operationalized rules and a numeric threshold:

```xml
<constraints>
  <confidence_scoring>
    Mark as `stale` only when ALL of the following are true (confidence ≥ 0.9):
    - The referenced component name, function, or route no longer appears anywhere
      in the codebase via grep.
    - No renamed equivalent can be found in the same file or module.

    Mark as `needs_update` when:
    - The reference exists but the file has changed by more than 30% of its lines
      since the test was written (use git blame heuristic), OR
    - The referenced function signature has changed in a way that invalidates the test steps.

    Mark as `active` in all other cases.
  </confidence_scoring>

  <exclusions>
    Do not mark an item stale solely because:
    1. The file has been moved or renamed (search for the symbol, not the path).
    2. The test description is vague — vagueness is a `needs_update` signal, not staleness.
  </exclusions>
</constraints>
```

---

### Issue 4 — No constraint block; no permission pairs (Section 14 and Section 20)

**Principle:** Section 14 requires every restriction to be paired with an equally concrete permission. Section 20 (Safety and Trust Patterns) requires validation at system boundaries. Section 22 Pattern 9 requires tool permissions scoped to the minimum required.

**What's wrong:** The workflow calls `gsd-sdk query audit-uat --raw` and instructs the model to use Grep/Read for codebase verification, but there is no `<constraints>` block stating what the agent may and may not do. There is no `<permitted>` / `<reserved_for_human_review>` pair. This is especially important here because the workflow ends with recommended actions including `/gsd-verify-work {phase}`, which triggers write-side operations. The model has no explicit guidance on whether it should trigger those actions itself or leave them for the human.

**Concrete fix:**

```xml
<constraints>
  <permitted>
    - Run `gsd-sdk query audit-uat --raw` to fetch audit data
    - Use Grep and Read to verify codebase references (read-only)
    - Render the audit report and human UAT test plan as output
  </permitted>

  <reserved_for_human_review>
    - Running `/gsd-verify-work` or any write operation on phase files
    - Marking items as resolved in source files
    - Any git operations
  </reserved_for_human_review>
</constraints>
```

---

### Issue 5 — Output format is incomplete and mixed into process steps (Section 7 and Section 22 Pattern 3)

**Principle:** Section 22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought." Section 7 Action 1 calls for free-form reasoning first, then structured formatting as a distinct step.

**What's wrong:** The output templates in the `present` and `test_plan` steps are embedded mid-process alongside procedural instructions. The `Recommended Actions` section uses placeholder strings (`{phase}`) but provides no filled-in example to calibrate what a good entry looks like. The `test_plan` step has a template but no example of a completed group. There is also no specification of what to output if there are zero items in a given category (should the section be omitted, or shown empty with a note?).

**Concrete fix:** Extract all format specifications into a single `<output_format>` block before `<process>`, include one complete filled-in example per table/section, and add edge-case output rules:

```xml
<output_format>
Produce two sections in sequence: the Audit Report, then the Human UAT Test Plan.

**Audit Report format:**

## UAT Audit Report
**{N} outstanding items across {N} files in {N} phases**

### Testable Now ({N})
| # | Phase | Test | Description | Status |
|---|-------|------|-------------|--------|
| 1 | phase-3 | login_flow_smoke | User can log in with valid credentials | active |

### Needs Prerequisites ({N})
| # | Phase | Test | Blocked By | Description |
|---|-------|------|------------|-------------|

### Stale — can be closed ({N})
| # | Phase | Test | Why Stale |
|---|-------|------|-----------|

If a category has zero items, omit its section entirely.

---

**Human UAT Test Plan format:**

## Human UAT Test Plan

### Group 1: {Shared feature or screen}
Prerequisites: {e.g., "App running locally on port 3000"}

1. **{Test name}** (Phase {N})
   - Navigate to: {screen or URL}
   - Do: {specific action}
   - Expected: {observable outcome}

Omit this section entirely if there are no active Testable Now items.
</output_format>
```

---

### Issue 6 — Negative instructions not converted to positive equivalents (Section 5 Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions ("do not", "avoid", "never") to be rewritten as positive specifications before emitting the prompt. The conversion table in Section 5 gives the canonical pattern.

**What's wrong:** The workflow has no explicit negative instructions, but the staleness check contains implicit negative framing: "If the test references a component/function that no longer exists → mark as `stale`." This is written as a negative condition (absence of the reference) rather than as a positive signal. More importantly, the "Stop here" instruction in the `initialize` step is imperative but the surrounding text uses a negative conditional structure that could be more precisely framed.

**What this affects in practice:** This is a minor issue relative to Issues 1–5, but applying Section 5 Action 1 rigorously would reframe the staleness detection as: "Mark as `stale` when a grep search of the entire codebase returns zero matches for the referenced symbol" — a positive, executable instruction rather than a negative conditional.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are those where the checklist item genuinely does not apply to this workflow type (e.g., self-consistency for a deterministic pipeline, RAG compression for a CLI-driven audit).

| Checklist Item | Score | Notes |
|---|---|---|
| Intent, audience, and quality bar are all explicit | FAIL | No `<audience>` or `<quality_bar>` tag; intent is in `<purpose>` but not a canonical `<task>` block |
| All constraints are compatible — no conflicts | PASS | No constraint conflicts detected |
| CoT included only for math/symbolic/multi-step logic | N/A | No CoT trigger needed; task is procedural |
| CoT trigger phrasing correct | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| Examples selected by semantic similarity | N/A | No few-shot examples present |
| 2–5 examples total | N/A | |
| Examples ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| Instruction complete and clear before formatting applied | FAIL | Output format templates are embedded inside process steps, not defined upfront |
| Prompt sections separated by semantically named XML tags | FAIL | Uses `<step name="...">` but lacks `<task>`, `<output_format>`, `<constraints>`, `<audience>`, `<quality_bar>` |
| At least 3 format variants will be tested | FAIL | No mention of format variant testing |
| Negative instructions converted to positive equivalents | FAIL | Staleness detection uses negative conditional framing |
| Priority order explicit when multiple criteria apply | FAIL | Categorization has no explicit priority ordering between sub-types |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule for ambiguous staleness cases |
| Persona included only for open-ended/stylistic tasks | FAIL | This task warrants a persona; none is present |
| Persona is specific (constrains voice/register) | FAIL | No persona |
| Persona descriptor is gender-neutral | N/A | No persona |
| Structured output uses two-step reasoning-then-format | FAIL | No explicit reasoning step before table generation |
| Single-call JSON places reasoning before answer fields | N/A | Output is markdown, not JSON |
| Constrained decoding only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | PASS | Tables have headers; output is human-readable, not machine-parsed |
| Task instruction at start of prompt | PASS | `<purpose>` leads the file |
| Primary document/input at end of prompt | N/A | No document input; CLI output is injected at runtime |
| Background context in middle | N/A | |
| All irrelevant context removed | PASS | Prompt is lean; no padding |
| Time-sensitive injected context labeled as snapshot | FAIL | `AUDIT=$(gsd-sdk query audit-uat --raw)` injects live data with no snapshot label |
| Self-consistency applied only to tasks with single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| Redundant instructions removed | PASS | No duplication detected |
| Long prompts compressed before sending | N/A | Prompt is short |
| RAG context is extracted relevant passage only | N/A | |
| Persistent instructions in system prompt | N/A | Workflow file; system/user split is handled by the harness |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No duplication |
| Safety-critical constraints have external validation | FAIL | No constraints block; no external validation specified |
| Agent prompts are fully self-contained | PASS | Workflow includes all needed instructions inline |
| All file paths in agent output are absolute | N/A | Output is rendered text tables, not file paths |
| Parallel agents launched in single message block | N/A | No parallel agents spawned |
| Adversarial probes specified for verification agents | N/A | Not a verification agent |
| Large prompts decomposed into atomic modules | PASS | Prompt is short and focused |
| Template variables use `${VARIABLE_NAME}` syntax | N/A | Uses bash variable syntax appropriately for CLI call |
| Modules compose at runtime via variable substitution | N/A | |
| Every restriction paired with equally concrete permission | FAIL | No `<constraints>` block at all |
| Hard exclusion lists enumerated, not qualitative | FAIL | Staleness criteria are qualitative |
| Known edge cases have precedent-style rulings | FAIL | No `<precedents>` block |
| Confidence thresholds are numeric | FAIL | Staleness detection has no numeric threshold |
| Multi-option recommendations use decision tree or table | N/A | No multi-option recommendation needed |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | FAIL | Recommended actions include write-side operations with no reversibility framing |
| Complex tasks organized into explicit named phases | PASS | Four named `<step>` tags provide phase structure |
| Required steps distinguished from type-specific steps | FAIL | No `<required_steps universal="true">` / `<type_specific_strategy>` distinction |
| Scenario-based branching handles multiple paths | PASS | Early-exit branch on zero items is explicit |
| Memory templates use XML tags as section labels | N/A | Not a memory template |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |
| Each prompt component has single responsibility | FAIL | `<step name="present">` mixes output format with process instructions |
| Scope boundaries state both inclusions and exclusions | FAIL | No `<scope>` block; staleness detection has inclusions but no exclusions |
| Validation at system boundaries only | FAIL | No constraint block specifying trust model |
| Dual-use capabilities state permissions before restrictions | N/A | Not a dual-use capability |
| Authorization narrow-scoped; each action confirmed before expanding | FAIL | Recommended actions (gsd-verify-work) not clearly flagged as human-only |
| Size constraints use numeric limits | FAIL | No numeric size constraints on any output section |
| Instructions use imperative present tense | PASS | Most instructions use imperative present tense |
| Working notes in analysis tags, not user-facing output | N/A | |
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |
| Correct optimizer selected | FAIL | Not addressed |
| Held-out test set reserved | N/A | Evaluation methodology not applicable |

**Summary score: 11 PASS / 20 FAIL / 26 N/A**

---

## Recommendations

Listed in priority order — highest impact first.

### 1. Add `<task>`, `<audience>`, `<quality_bar>`, and `<output_format>` tags (Issues 1 and 5 — Sections 4, 7, 22 Pattern 3)

This is the highest-leverage fix. Moving the output templates out of the `<step>` process blocks and into a dedicated `<output_format>` tag — with one filled-in example per table — will make the model's output consistent across runs. Adding `<audience>` and `<quality_bar>` closes the task specification gap (Section 1 Action 1) and gives the model an explicit standard to evaluate its own completeness against. Do this before any other change.

### 2. Add a `<persona>` block scoped to the audit domain (Issue 2 — Section 6, Section 22 Pattern 1)

The audit requires adversarial judgment: deciding that something previously considered valid is now stale or misleading. A QA audit specialist persona with an explicit adversarial framing (Section 6 reframe pattern: "Your job is not to assume tests are still valid — it is to verify each one") will produce more reliable triage decisions than the generic default behavior. This is a small addition with measurable behavioral impact.

### 3. Add a `<constraints>` block with permission pairs, numeric confidence threshold, and exclusion list (Issues 3 and 4 — Section 14, Section 22 Pattern 6)

Replace the qualitative staleness criteria ("significantly rewritten") with operationalized, numeric rules. Add a `<permitted>` / `<reserved_for_human_review>` pair to make the boundary between agent actions and human actions unambiguous — particularly for the recommended `gsd-verify-work` actions at the end of the report. This prevents the agent from inadvertently triggering write operations when the human intends to review first.

### 4. Add an explicit priority order and tie-breaking rule for the categorization step (Issue 3 — Section 5, Section 22 Pattern 4)

When an item could plausibly be `active` or `needs_update`, or when it is unclear whether a blocking reason is "genuine" (requires external server) vs. "addressable" (the server could be started locally), the model needs a tie-breaking instruction that matches the cost asymmetry. For a UAT audit, under-reporting actionable items is the more expensive error — a recall-biased tie-breaking rule ("When uncertain, classify as `needs_update` rather than `stale`; surface it for human review") is the correct default.

### 5. Add a snapshot label to the CLI-injected audit data (Issue 5 — Section 8 snapshot warnings)

The line `AUDIT=$(gsd-sdk query audit-uat --raw)` injects live CLI output into the model's context. Per Section 8's snapshot warning pattern, this data should be labeled with `snapshot="true"` so the model treats it as point-in-time and does not assume it reflects the current state if the session runs long. A one-line addition to the `initialize` step suffices:

```xml
<context snapshot="true">
The following audit data was fetched at prompt construction time and will not refresh
during this session.
{AUDIT output}
</context>
```
