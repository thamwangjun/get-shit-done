# Critique: `commands/gsd/analyze-dependencies.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Files reviewed:**
- `commands/gsd/analyze-dependencies.md` (the command stub)
- `~/.claude/get-shit-done/workflows/analyze-dependencies.md` (the workflow body, referenced via `@` include)

The command file is a thin dispatch stub that delegates all logic to the workflow file via `@~/.claude/get-shit-done/workflows/analyze-dependencies.md`. This review covers both layers, since the stub is meaningless without the workflow.

---

## Strengths

### §4 Formatting — XML tag usage is structurally sound
The command file uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` as named XML tags. This satisfies §4 Action 2 ("Use XML tags to separate prompt sections"). The tags carry semantic meaning rather than acting as markdown delimiters. The workflow file also uses `<task>`, `<context>`, `<purpose>`, and `<process>`, continuing this convention.

### §16 Multi-Phase Workflows — Workflow steps are explicitly numbered
The workflow body organises work into six numbered steps (Load, Infer, Detect, Build, Summarize, Confirm). This reflects the guide's phase pattern (§16) — cognitive boundaries are clear, and the model can complete one step before the next. The step names are action-oriented and unambiguous.

### §5 Instruction Framing — Conditional branching in Step 6 is explicit
The "Confirm and Apply" step provides explicit `yes / no / edit` branch handling with distinct actions per branch. This matches §5's conditional instruction pattern ("If no PR number is provided... If a PR number is provided...") and avoids leaving the model to infer what "edit" means.

### §14 Constraint Enforcement — Preservation rules in Step 6
Step 6 includes a constraint to "Preserve all other phase content unchanged" and "Preserve the existing phase order." This is aligned with §14's structure preservation rules (`<preserve>` / `<update>` pairing). The instruction is specific about what must not change.

---

## Weaknesses

### Issue 1 — §1 Task Specification: audience and quality bar are absent

**Severity: High**

§1 Action 1 requires three components to be explicit: (a) what output is requested, (b) why it matters, and (c) what a correct or high-quality response looks like. §1 Action 2 requires audience encoding.

The command stub provides (a) and a partial (b) — it explains the purpose of the analysis but says nothing about (c). There is no quality bar anywhere in either file. What distinguishes a good dependency analysis from a superficial one? When should the model report a dependency versus omit it as speculative? The guide (§14, §22 Pattern 6) specifically calls for numeric confidence thresholds on filtering tasks:

> "Report only issues where you're >80% confident of actual exploitability."

The dependency analysis is exactly this kind of filtering task — it produces a ranked set of findings where false positives (wrongly reported dependencies) and false negatives (missed dependencies) both have real costs. Neither a threshold nor a quality bar is defined.

The audience is also unspecified. The output is consumed by a developer deciding whether to apply changes to `ROADMAP.md`. This context should shape the verbosity and confidence level of the suggestions.

### Issue 2 — §4 Formatting / §1 Task Specification: `<purpose>` and `<task>` are duplicated across files with inconsistent wording

**Severity: Medium**

The workflow file opens with three near-identical blocks:

```
<task>
Analyze ROADMAP.md phases for dependency relationships before execution. Detect file overlap and semantic dependencies between phases.
</task>

<context>
Suggests `Depends on` entries...
</context>

<purpose>
Analyze ROADMAP.md phases for dependency relationships before execution. Detect file overlap between phases, semantic API/data-flow dependencies...
</purpose>
```

`<task>` and `<purpose>` say the same thing in slightly different words. §11 Action 3 is unambiguous: "State each instruction exactly once." Repeated instructions "consume context and add noise without reinforcing compliance." The `<purpose>` block adds no new information; it restates `<task>` with minor elaboration that belongs inside `<context>`. This redundancy should be collapsed.

Additionally, the command stub's `<objective>` block repeats the same framing a third time (the three dependency signals: file overlap, semantic, data flow). The model sees these signals stated three times before reaching the actual process steps.

### Issue 3 — §6 Persona Assignment: no persona is assigned for a stylistic, judgment-heavy task

**Severity: Medium**

§6 Action 1 requires classifying the task before deciding whether to assign a persona. The dependency analysis task requires judgment calls — deciding which phase pairs have meaningful dependencies versus incidental ones, and how to phrase suggestions to a developer. This is not a pure factual recall task; it involves register, tone, and confidence calibration, which are precisely the dimensions a persona constrains.

§6's role-domain mapping table gives a relevant analogue: a security reviewer benefits from the identity "Senior security engineer conducting a focused security review" rather than "Code reviewer." An analogous persona here — e.g., "You are a software architect reviewing a parallel execution plan for sequencing conflicts" — would constrain the register toward specific, evidence-driven recommendations rather than generic "this might depend on that" hedging.

The absence of a persona is a deliberate choice only if the task is purely mechanical. This task is not.

### Issue 4 — §7 Output Format: output format is described narratively but no example is provided

**Severity: Medium**

Step 4 specifies a template for the dependency table using a fenced code block. This is better than nothing, but §22 Pattern 3 states: "Output format specified completely and upfront... A fully specified format produces consistent, parseable output." The example in the code block uses `<brief scope>`, `<inferred file domains>`, and `<overlap/semantic/data-flow explanation>` as placeholder labels rather than a filled-in concrete example. §22 Pattern 2 states: "Every abstract instruction paired with a calibrating example — qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

Without a filled-in example, the model must infer the expected level of detail for each field. The Step 5 "Suggested ROADMAP.md updates" block is better — it shows actual concrete text. Applying the same concreteness to Step 4's table would close the gap.

### Issue 5 — §5 Instruction Framing: Step 1 error handling uses a negative diagnostic framing

**Severity: Low**

Step 1 says: "If it does not exist, error: 'No ROADMAP.md found — run `/gsd-new-project` first.'" This is already a positive-form conditional, which is correct. However, there is no guidance on what to do with a ROADMAP.md that exists but contains no phases — an equally likely edge case. §5 Instruction Framing calls for explicit conditional branching; the missing-phases case is an unhandled branch.

---

## Specific Rewrites

### Rewrite 1 — Add a `<quality_bar>` and confidence threshold (fixes Issue 1)

Insert the following block in the workflow file, immediately after `<task>`, replacing or augmenting the current `<context>` block:

```xml
<quality_bar>
A high-quality dependency analysis:
- Reports only dependencies where the relationship is clearly traceable to shared files, an explicit API/data contract, or a stated consumption relationship in the phase scope.
- Omits dependencies based on loose thematic similarity alone (e.g., "both phases touch the frontend" is not sufficient without a concrete shared file or interface).
- States the dependency type (file-overlap / semantic / data-flow) and the specific evidence for each suggestion.
- When uncertain whether a dependency exists, states the uncertainty explicitly and recommends the developer verify — do not suppress ambiguous findings silently.

Confidence guidance:
- Report with full confidence: shared explicit file paths, or phase B's scope directly names phase A's output.
- Report with caveat: inferred file overlap based on domain heuristics (e.g., both are "API phases").
- Omit: thematic overlap only, no traceable shared artifact.
</quality_bar>
```

This gives the model a calibrated filter rather than leaving it to decide what "dependency" means at each judgment call.

---

### Rewrite 2 — Collapse the triplicated task statement (fixes Issue 2)

In the workflow file, remove `<purpose>` entirely. Merge its one unique clause ("prevent merge conflicts during parallel execution") into `<context>`, which already contains it. The result:

**Before (workflow file, lines 1–17):**
```xml
<task>
Analyze ROADMAP.md phases for dependency relationships before execution. Detect file overlap and semantic dependencies between phases.
</task>

<context>
Suggests `Depends on` entries to prevent merge conflicts during parallel execution by /gsd-manager. Run before /gsd-execute-phase when phases share files.
</context>

<purpose>
Analyze ROADMAP.md phases for dependency relationships before execution. Detect file overlap between phases, semantic API/data-flow dependencies, and suggest `Depends on` entries to prevent merge conflicts during parallel execution by `/gsd-manager`.
</purpose>
```

**After:**
```xml
<task>
Analyze ROADMAP.md phases for dependency relationships before execution. For each phase pair, detect file overlap, semantic API/data-flow dependencies, and suggest `Depends on` entries to prevent merge conflicts during parallel execution by `/gsd-manager`.
</task>

<context>
Run before `/gsd-execute-phase` or `/gsd-manager` when phases may share files. Requires an active milestone with ROADMAP.md.
</context>
```

This removes the third repetition entirely and consolidates the two surviving blocks into a single clear statement + context note, satisfying §11 Action 3.

---

### Rewrite 3 — Add a scoped persona (fixes Issue 3)

Insert before `<task>` in the workflow file:

```xml
<persona>
You are a software architect reviewing a parallel execution plan for ordering conflicts.
Your job is to find sequencing risks — phases that will break or produce merge conflicts
if run in the wrong order. Be specific: name the files or interfaces that create the
dependency. "These phases both touch the frontend" is not a finding. "Phase 3 creates
the auth middleware that Phase 5 imports in src/api/routes.ts" is a finding.
</persona>
```

This satisfies §6 Action 2 (specific persona constraining voice and decision-making standard) and uses the reframe pattern from §6 ("Your job is NOT X — it's Y") to push against the model's default tendency to report soft thematic overlaps as dependencies.

---

## Overall Verdict

**Adequate**

The command is structurally competent: it uses XML tags correctly, the workflow steps are explicit and well-numbered, conditional branching is handled, and preservation rules are present. These are non-trivial merits.

The main gap is a missing quality bar — the command does not tell the model what a good dependency finding looks like versus a speculative one, leaving confidence calibration entirely to the model's priors. For a task that produces suggestions the developer will apply to production configuration, this is a meaningful deficiency. The triplicated task statement is a secondary maintenance problem. Adding the three rewrites above would move this to **Strong**.
