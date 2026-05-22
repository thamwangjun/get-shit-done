# Critique: `commands/gsd/review.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict: **Needs Work**

The file functions as a routing stub, not a prompt. It delegates all substance to an external workflow file (`@~/.claude/get-shit-done/workflows/review.md`), which makes it nearly impossible to evaluate as a standalone prompt — and that delegation pattern is itself the largest structural problem.

---

## Strengths

### 1. Frontmatter metadata is well-formed (§11 System vs. User Prompt Allocation)

The YAML frontmatter encodes `name`, `description`, `argument-hint`, and `allowed-tools` — consistent with §11's pattern for agent configuration in frontmatter. The `allowed-tools` list (`Read`, `Write`, `Bash`, `Glob`, `Grep`) is scoped rather than open-ended, which aligns with §22 Pattern 9 (tool permissions scoped to minimum required patterns). This is the most technically sound part of the file.

### 2. Flow summary in `<objective>` is usefully concise (§21 Tone and Style Rules)

The one-line flow description (`Detect CLIs → Build review prompt → Invoke each CLI → Collect responses → Write REVIEWS.md`) communicates the pipeline structure efficiently, consistent with §21's preference for direct, dense output. It serves as a readable orientation for the operator.

### 3. Conditional flag listing is explicit (§5 Instruction Framing)

The `<context>` block enumerates each flag (`--gemini`, `--claude`, etc.) with its meaning, which is a form of explicit conditional branching per §5. This is marginally better than a vague "pass flags to the workflow" instruction.

---

## Weaknesses

### 1. The entire task is offloaded — the prompt contains no actionable instructions (§1 Task Specification, §4 Formatting and Structure)

`<process>` reads: _"Execute the review workflow from @~/.claude/get-shit-done/workflows/review.md end-to-end."_ This makes the command file a pure redirect. Per §1 Action 1, a prompt must make explicit: (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. None of these three are present. The `<objective>` block names the output (`REVIEWS.md`) but does not define the quality bar for what good reviewer feedback looks like.

Per §4 Action 2, prompt sections should be wrapped in semantically named XML tags that carry real content. Here, `<process>` carries a single pointer to an external file. If that file changes or is unavailable, this prompt collapses to nothing.

**This is the primary structural defect.** The command file should either be self-contained or explicitly documented as a thin orchestration shim with the real instructions co-located.

### 2. No output format specification (§7 Output Format Handling, §22 Pattern 3)

The file references `REVIEWS.md` as the output artifact but never specifies its structure. Per §7 and §22 Pattern 3, output format must be stated completely and upfront — including field names, ordering, and a calibrating example. A reviewer invoking this command cannot know whether `REVIEWS.md` should contain structured sections per reviewer, a diff-style comparison, severity ratings, or free prose.

There is no `<output_format>` tag. There is no example output. This means output consistency depends entirely on whatever `review.md` contains — making the command file unreviewable and untestable in isolation.

### 3. No persona assigned for the reviewing agent role (§6 Persona Assignment, §22 Pattern 1)

The command asks an agent to play the role of a cross-AI peer reviewer synthesizing feedback from multiple external CLIs. This is an open-ended, interpretive, stylistic task — exactly the category §6 Action 1 identifies as requiring a specific, role-constrained persona. None is present.

Per §22 Pattern 1, role identity should be scoped to the exact domain. "Synthesizing multi-model review feedback into actionable planning input" is a specific enough role to warrant a persona. Without one, the model defaults to generic assistant behavior rather than critic-mode behavior.

### 4. `<execution_context>` and `<process>` are redundant (§11 Action 3)

Both `<execution_context>` and `<process>` point to the same external workflow file (`@~/.claude/get-shit-done/workflows/review.md`). Per §11 Action 3, each instruction should appear exactly once. Duplicating the reference adds noise and risks divergence if the path changes. One of these tags is redundant and should be removed.

### 5. No quality bar for the review artifact (§1 Action 1, §14 Constraint Enforcement)

The prompt does not define what makes a `REVIEWS.md` entry good. Per §1 Action 1, the quality bar must be explicit: what makes a correct or high-quality response? Per §14, filtering tasks should specify both what to include and numeric confidence thresholds. A review command is a filtering task — it is deciding what feedback is worth surfacing to the planning phase. Neither inclusion criteria nor confidence thresholds are present.

---

## Specific Rewrites

### Rewrite 1 — Add a persona that constrains the reviewer's posture (fixes Weakness 3)

Replace the missing persona with a reframe-pattern persona (§6) that makes the adversarial intent explicit:

```xml
<persona>
You are a cross-model review synthesizer. Your job is not to validate that a phase plan
is reasonable — it is to surface the strongest objections each reviewer raised and judge
whether those objections have been addressed in the plan.

Treat each external AI response as a peer reviewer's raw comments. Your value is in
discarding noise and surfacing the 2–3 highest-signal critiques per reviewer.
</persona>
```

This satisfies §6 Action 2 (specific, not generic), applies the reframe pattern (§6), and constrains tone toward signal extraction rather than summary.

---

### Rewrite 2 — Specify output format with a calibrating example (fixes Weakness 2)

Add an `<output_format>` block before `<process>`:

```xml
<output_format>
Write REVIEWS.md with the following structure for each reviewer:

## Reviewer: {CLI name}
**Verdict:** APPROVE | REQUEST_CHANGES | COMMENT_ONLY
**Top issues (ranked):**
1. {Issue title} — {1-sentence description} — Severity: HIGH | MEDIUM | LOW
2. ...
**Actionable suggestions:**
- {Concrete change to the plan, not generic advice}

---

Example entry:
## Reviewer: Gemini
**Verdict:** REQUEST_CHANGES
**Top issues (ranked):**
1. Missing rollback plan — Phase 3 has no defined failure path if the DB migration fails — Severity: HIGH
2. Vague success criteria — "system works" is not testable — Severity: MEDIUM
**Actionable suggestions:**
- Add a rollback step to Phase 3 that restores the prior schema from backup
- Replace "system works" with a specific latency and error-rate threshold
</output_format>
```

This satisfies §7, §22 Pattern 3, and §1 Action 1(c) by making the quality bar concrete and machine-parseable.

---

### Rewrite 3 — Eliminate redundant delegation tags and inline the minimum task spec (fixes Weaknesses 1 and 4)

Replace the two-pointer structure with a single delegation tag plus an inline task spec:

```xml
<task>
Run the cross-AI review workflow defined at @~/.claude/get-shit-done/workflows/review.md.

Before invoking any external CLI, confirm:
- The phase plan file exists for the requested phase number
- At least one CLI flag is set (or --all is passed)

After collecting all CLI responses, synthesize results into REVIEWS.md as specified
in <output_format>. A valid REVIEWS.md must contain at least one actionable suggestion
per reviewer — responses containing only praise or generic commentary do not satisfy
the quality bar.
</task>
```

Remove `<execution_context>` entirely (it duplicates the pointer now in `<task>`). This satisfies §11 Action 3 (no duplication), §1 Action 1 (quality bar is explicit), and §14 (filtering criteria are stated).

---

## Checklist Against §23

| Check | Status |
|---|---|
| Intent, audience, and quality bar explicit | Fail — quality bar absent |
| All constraints compatible | N/A — no constraints present |
| Prompt sections in semantically named XML tags | Partial — tags present but content-empty |
| Negative instructions converted to positive | N/A |
| Persona included for open-ended task | Fail |
| Persona is specific, not generic | Fail — no persona |
| Output format specified upfront with example | Fail |
| Each instruction appears once | Fail — duplicate file pointers |
| Task instruction is self-contained | Fail — full offload to external file |
| Tool permissions scoped to minimum required | Pass |
