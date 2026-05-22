# Prompt Engineering Critique: `commands/gsd/extract_learnings.md`

**File reviewed:** `commands/gsd/extract_learnings.md` + `~/.claude/get-shit-done/workflows/extract_learnings.md`
**Critique date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09

---

## Overview

The command file (`extract_learnings.md`) is a thin stub that delegates all logic to a workflow file. The workflow file (`extract_learnings.md`) contains the substantive prompt. This critique evaluates both together as a unit, since the command file is semantically incomplete without the workflow it loads.

---

## Strengths

### §4 Formatting — XML tags used throughout the workflow
The workflow uses semantically named XML tags consistently: `<purpose>`, `<objective>`, `<process>`, `<step>`, `<success_criteria>`, `<critical_rules>`. This matches §4's prescription to "wrap each [section] in a semantically named XML tag." Tag names carry meaning about the section's role, not just its position.

### §14 Constraint Enforcement — Critical rules are explicit and enumerated
The `<critical_rules>` block enumerates seven hard constraints with clear behavioral impact (e.g., "exit with clear error if missing", "must not fail", "do not fabricate learnings"). This mirrors §14's hard exclusion list pattern and the `<exclusions>` approach. The idempotency rule ("overwrite, not append") is particularly precise and avoids ambiguous behavior.

### §1 Task Specification — Output quality bar is concrete
The extraction categories (Decisions, Lessons, Patterns, Surprises) each specify exactly what sub-fields are required (What, Why/Context/Impact, Source). This gives a clear definition of a complete vs. incomplete extraction item, which satisfies §1 Action 1's requirement to make explicit "what a correct or high-quality response looks like."

### §16 Multi-Phase Workflows — Step sequencing is explicit
The workflow uses numbered `<step name="...">` elements with clear sequential dependencies: initialize → collect → extract → capture → write → update → report. This matches §16's phase pattern and creates cognitive boundaries between stages.

### §19 Modularity — Single responsibility
The command stub contains only routing logic; all behavioral detail lives in the workflow file. This follows §19's single-responsibility principle and §22 Pattern 5 (decomposed, single-responsibility modules).

---

## Weaknesses

### Issue 1: §1 Task Specification — Audience is never encoded (§1 Action 2)

The guide requires: "Identify the audience… Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

Neither file encodes the audience. It is unstated whether the output is consumed by: (a) the developer who ran the phase, (b) another AI agent ingesting LEARNINGS.md downstream, (c) a future team member reading it weeks later.

This matters because the extraction depth, vocabulary, and level of assumed context differ across these audiences. The workflow currently produces a fixed structure without calibrating to any of them.

**Severity:** Moderate — the output format is rigid enough to constrain this somewhat, but the *content quality* within each field is not anchored to a reader.

---

### Issue 2: §5 Instruction Framing — Multiple negative instructions not converted to positive equivalents (§5 Action 1)

The guide requires: "Scan for negated instructions… Rewrite each as a positive specification of the desired behavior."

The `<critical_rules>` block contains three negated instructions:

- "Do not fabricate learnings — only extract what is explicitly documented"
- "must not fail" (in the capture_thought degradation rule)
- "not append" (in the idempotency rule)

Per §5, these should be rewritten as positive specifications:

| Current (negative) | Should be (positive) |
|---|---|
| "Do not fabricate learnings" | "Extract only what is explicitly documented in artifacts; treat inference and speculation as out of scope" |
| "workflow must not fail" | "If capture_thought is unavailable, continue to file-only output and complete the workflow normally" |
| "overwrite (replace) the previous LEARNINGS.md, not append" | "Always write the LEARNINGS.md file in full replace mode" |

The negative form is more ambiguous — "do not fabricate" does not specify what to do when evidence is thin (skip the category? note it as empty? include a count of zero?). The positive rewrite closes that gap.

**Severity:** Moderate — negated instructions are a consistent pattern across the `<critical_rules>` block, not a single instance.

---

### Issue 3: §7 Output Format Handling / §22 Pattern 3 — Output format is underspecified for the extraction content (§7, §22 Pattern 3)

The guide requires: "State the required output structure, field names, ordering, and an example before the model begins its task."

The `<write_learnings>` step provides a Markdown skeleton with placeholder labels like `{Decision Title}`, `{What was decided}`, `{Why}`. No concrete example is given for any of the four categories. This violates §22 Pattern 3 ("output format specified completely and upfront, with an example") and §22 Pattern 2 ("every abstract instruction paired with a calibrating example").

Without a calibrating example, the model must infer:
- How long a "What was decided" entry should be (one sentence? a paragraph?)
- What "Rationale" means in this context vs. a full justification
- What counts as a well-formed "Source" attribution (filename only? filename + line?)
- What distinguishes a "Lesson" from a "Decision" in borderline cases

The `<step name="extract_learnings">` prose describes each category but gives no examples of a well-formed vs. poorly formed extraction item.

**Severity:** High — this is the core intellectual work of the workflow. Underspecified output format is the highest-leverage place for the model to diverge from intent, especially since the four categories have significant overlap in how they might manifest in real artifact text.

---

### Issue 4: §6 Persona Assignment — No persona assigned (§6 Action 1)

This workflow involves interpretation and classification of unstructured artifact text — a task with stylistic latitude that benefits from a persona. The guide says: "Task type is open-ended, stylistic, or requires a specific voice? YES → Assign a specific, role-constrained persona."

Extracting learnings from engineering artifacts is an interpretive task: the model decides what rises to the level of a "decision" vs. a background assumption, what counts as a "surprise" vs. an expected difficulty, what a "pattern" is vs. a one-off implementation choice. These are judgment calls. A persona like "You are a staff engineer documenting institutional knowledge for the team" would constrain the register and rigor of those judgments.

**Severity:** Low-to-moderate — the four-category schema and field requirements constrain behavior significantly, partially compensating for the absent persona.

---

### Issue 5: §8 Context Placement — Task instruction does not lead the workflow prompt (§8 Action 1)

The guide requires: "Place the task instruction at the very start of the prompt. Models attend most strongly to the beginning of their context."

The workflow file opens with `<purpose>` (a description of the workflow's raison d'être), then `<required_reading>` (a meta-instruction), then `<objective>` (the actual task). The task instruction — what the model must do — is in third position, after two blocks that are background or procedural framing.

Per §8, the `<objective>` block should lead. The `<purpose>` block is supplementary context and belongs in the middle.

**Severity:** Low — models attend to position but the current ordering is close to correct; `<objective>` is early enough that degradation is likely small. However, it is a clear violation of the stated rule.

---

## Specific Rewrites

### Rewrite 1 (Issue 3 — Output Format): Add a calibrating example to `<write_learnings>`

Add the following example block immediately after the Markdown skeleton in `<step name="write_learnings">`:

```xml
<example>
## Decisions

### Use glob pattern matching for artifact discovery
We chose glob matching (`*-PLAN.md`) over exact filenames to handle multi-plan phases
where a phase has more than one plan file.

**Rationale:** Exact filename matching would silently miss secondary plan files
(e.g., `03-02-PLAN.md`), causing incomplete extraction with no error. Glob matching
is more robust without adding complexity.
**Source:** 03-01-PLAN.md

---

## Lessons

### STATE.md decisions section is often stale
STATE.md decisions frequently reflect earlier milestone intent, not the phase-specific
decisions that were actually made. Prefer SUMMARY.md for decisions over STATE.md.

**Context:** Encountered during Phase 3 extraction — STATE.md listed a decision that
was superseded in SUMMARY.md without updating STATE.md.
**Source:** 03-01-SUMMARY.md

---

## Patterns

### Two-file artifact structure (PLAN + SUMMARY) as extraction anchor
Always treat the PLAN/SUMMARY pair as the primary extraction source. Optional artifacts
(VERIFICATION, UAT) add signal but do not replace PLAN/SUMMARY as the ground truth.

**When to use:** Any phase extraction where optional artifacts are absent or sparse.
**Source:** 03-01-SUMMARY.md

---

## Surprises

### VERIFICATION.md contained more decision rationale than PLAN.md
The verifier documented why certain choices were made while proving correctness — richer
decision context than the original plan.

**Impact:** Decisions section was significantly enriched by reading VERIFICATION.md;
skipping it would have produced a thinner output. Elevated to de facto required artifact.
**Source:** 03-01-VERIFICATION.md
</example>
```

This grounds the model on length, specificity, and what distinguishes the four categories in practice.

---

### Rewrite 2 (Issue 2 — Negative Instructions): Rewrite `<critical_rules>` to positive equivalents

Replace the three negated rules:

**Current:**
```
- Do not fabricate learnings — only extract what is explicitly documented in artifacts
- If capture_thought is unavailable, the workflow must not fail — graceful degradation to file-only output
- Running extract-learnings twice on the same phase must overwrite (replace) the previous LEARNINGS.md, not append
```

**Rewrite:**
```
- Extract only what is explicitly documented in artifacts. When evidence for a category
  is thin or absent, write the section header and note "(No items found in artifacts)"
  rather than inferring or speculating.
- If capture_thought is unavailable, continue to file-only output and complete the
  workflow normally. The LEARNINGS.md file is the primary output; capture_thought is
  supplementary.
- Always write LEARNINGS.md in full-replace mode. The file's final state must equal
  the current extraction run's output only.
```

The positive rewrites additionally resolve the ambiguity left by the original: what to write when a category has no items (currently undefined), and what "graceful degradation" means operationally.

---

### Rewrite 3 (Issue 1 — Audience): Add `<audience>` block to the workflow

Add between `<objective>` and `<process>`:

```xml
<audience>
The primary reader of LEARNINGS.md is a developer (or AI agent) beginning a future phase
in the same project. They have context on the codebase but not on the specific implementation
decisions of this phase. Write at the level of a team retrospective document: specific enough
to act on, brief enough to scan in under two minutes.

Secondary reader: an AI orchestrator ingesting LEARNINGS.md as structured context for
planning the next phase. Each item should be self-contained — do not assume the reader
will cross-reference the source artifact.
</audience>
```

---

## Overall Verdict

**Adequate**

The workflow is structurally sound and shows genuine prompt engineering discipline: XML tags throughout, explicit step sequencing, source attribution requirements, idempotency handled, graceful degradation specified. The `<critical_rules>` block in particular is well-constructed.

The primary deficiencies are: (1) no calibrating example for the core output, which is a high-risk omission given the interpretive nature of the extraction task; (2) negative instruction framing throughout `<critical_rules>`, which leaves behavioral ambiguity at the margins; (3) no audience specification, which leaves content calibration undefined.

These are fixable with targeted additions — the structural bones are good. Upgrading from Adequate to Strong requires primarily the output example (Rewrite 1) and the audience block (Rewrite 3).
