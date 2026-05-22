# Critique: commands/gsd/discuss-phase.md

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Strengths

### S1 — XML tag structure is used correctly (§4 Formatting and Structure)
The file segments its content into semantically named XML tags: `<objective>`, `<execution_context>`, `<runtime_note>`, `<context>`, `<process>`, and `<success_criteria>`. This matches §4 Action 2's direction to "wrap each in a semantically named XML tag" and is strictly better than markdown headers for Claude-class models. Tag names name what each section *is*, not where it starts.

### S2 — Conditional routing is explicit (§5 Instruction Framing — Conditional Instructions)
The `<process>` block uses an explicit if/else branch on `DISCUSS_MODE`, matching the §5 pattern of "explicit conditional branching" when behavior depends on context. Each branch resolves to exactly one action. There is no ambiguity about which workflow runs.

### S3 — Success criteria enumerate concrete, testable outputs (§1 Task Specification)
The `<success_criteria>` block lists seven discrete behavioural outcomes (e.g. "no re-asking decided questions", "CONTEXT.md captures decisions, not vague vision"). This partially satisfies §1 Action 1(c): "what a correct or high-quality response looks like." The criteria are specific enough to be checked, which is better than a qualitative "good output" description.

### S4 — Output artifact is named (§7 Output Format Handling)
The command names its output (`{phase_num}-CONTEXT.md`) and states the destination audience ("downstream agents — researcher and planner"). This satisfies the §1 Action 1(a)/(b) requirement for stating what is produced and why it matters.

---

## Weaknesses

### W1 — The objective summary duplicates the workflow, violating single-source-of-truth (§11 System vs. User Prompt Allocation, §10 Prompt Length)

The `<objective>` block contains a 5-step numbered summary of the workflow, and then `<process>` says "The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process." This means the same procedure exists in two places: once as a summary here and once in full in the loaded workflow file. §11 Action 3 states "State each instruction exactly once." Duplication consumes context without reinforcing compliance, and a divergence between the summary and the actual workflow will silently mislead the model about what it should do.

The summary in `<objective>` also has no deduplication mechanism — if the workflow steps change, this summary is guaranteed to drift.

### W2 — No output format specification (§7 Output Format Handling, §22 Pattern 3)

The command states that the output is `{phase_num}-CONTEXT.md` but gives zero specification of what that file must contain: no required sections, no field names, no example fragment. §7 Action 1 and §22 Pattern 3 both require that "output structure, field names, ordering, and an example" be stated upfront. The current prompt delegates format entirely to the workflow file and the template referenced via `@~/.claude/get-shit-done/templates/context.md`. This creates a latent failure mode: if the template reference fails or the workflow is vague, the model will invent structure.

This is the highest-impact gap. The command's stated purpose — creating decisions "clear enough that downstream agents can act without asking the user again" — lives or dies on CONTEXT.md being consistently structured.

### W3 — Negative framing in success criterion, violation of §5 Action 1 (§5 Instruction Framing)

One success criterion reads: "Scope creep redirected to deferred ideas." This is a process constraint described from a failure-avoidance angle. §5 Action 1 requires converting negative/avoidance instructions to positive specifications. The criterion does not tell the model what to do — it tells it what to prevent. The guide's conversion table makes the pattern explicit: "Do not X" → "Do Y instead."

There is also "no re-asking decided questions" — another negated condition that should be reframed as "Applied prior context so that all decisions already made in earlier phases are treated as locked."

### W4 — Persona absent despite the task being open-ended and stylistic (§6 Persona Assignment)

The command coordinates an interactive, multi-round dialogue with the user — a task whose output quality depends heavily on register and facilitation style. §6 Action 1 specifies that open-ended tasks requiring a specific voice should get a persona. There is none. The absence means the model defaults to its generic assistant prior: polite, hedging, verbose. A persona like "You are a focused implementation-planning facilitator. Your job is to surface decisions, not gather requirements — ask exactly what downstream agents need, stop when you have it" would bias behavior toward the terse, decision-focused interaction this command needs.

---

## Specific Rewrites

### Rewrite 1 — Collapse `<objective>` into a single-sentence goal statement (fixes W1)

Current:
```xml
<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>
```

Suggested replacement:
```xml
<objective>
Extract the implementation decisions downstream agents need. Write them to {phase_num}-CONTEXT.md so the researcher and planner can act without asking the user again. All procedural steps are in the workflow file — follow them exactly.
</objective>
```

The how-it-works enumeration belongs exclusively in the workflow file. Removing it from here eliminates the dual-source-of-truth problem and cuts ~80 tokens of noise.

---

### Rewrite 2 — Add a minimal CONTEXT.md output format specification (fixes W2)

Insert a new `<output_format>` block after `<context>`:

```xml
<output_format>
Write {phase_num}-CONTEXT.md. The file must include these sections at minimum:

- **Locked decisions** — choices made in this discussion that downstream agents must treat as fixed. Each entry: decision + rationale in one sentence.
- **Open questions** — items explicitly deferred; include reason for deferral.
- **Codebase signals** — relevant assets or patterns found during scouting (file paths, patterns).

Do not write vague vision statements. Every entry must be specific enough that the researcher can act on it without asking a follow-up question.
</output_format>
```

This is a minimal format anchor. It does not replace the template; it ensures the model produces something parseable even if the template reference fails, and it sets the "decision-not-vision" quality bar explicitly.

---

### Rewrite 3 — Convert negated success criteria to positive equivalents (fixes W3)

Current success criteria (negated):
```
- Prior context loaded and applied (no re-asking decided questions)
- Scope creep redirected to deferred ideas
```

Suggested replacements:
```
- Prior context loaded; all decisions from earlier phases treated as locked and carried forward without re-discussion
- Scope additions captured in a deferred-ideas list; main discussion stays on the current phase
```

Apply the same conversion to any other negated form found in an updated version of the file.

---

## Overall Verdict

**Adequate.**

The command's structure is sound: XML tags are used correctly, conditional routing is explicit, and the output artifact is named. These satisfy the most critical formatting and framing requirements. However, the absence of any output format specification for CONTEXT.md is a significant gap given that the entire command exists to produce that file. The objective-summary duplication is a technical debt item that will cause silent divergence as the workflow evolves. The negated success criteria and missing persona are lower-severity but quick to fix. None of the weaknesses are fundamental design errors — all are correctable without rearchitecting the file.
