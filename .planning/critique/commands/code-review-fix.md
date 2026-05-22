# Critique: `commands/gsd/code-review-fix.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### XML tag structure for prompt sections (§4 Formatting and Structure)

The command uses semantically named XML tags — `<objective>`, `<execution_context>`, `<context>`, `<process>` — rather than markdown headers or plain prose. This aligns with §4 Action 2's requirement to "wrap each [section] in a semantically named XML tag." The tag names carry semantic meaning and are machine-parseable.

### Argument parsing documented inline (§1 Task Specification)

The `<context>` block explicitly lists what each optional flag does and what the default behavior is when the flag is absent (`--all`: Critical + Warning only; `--auto`: single fix pass only). This satisfies §1 Action 3's constraint-consistency requirement — the scope of the task is bounded, and defaults are stated rather than implied.

### Thin dispatch principle (§19 Modularity and Composition)

The command is deliberately a "thin dispatch layer" that delegates to an external workflow file. This matches §19's single-responsibility principle and §13's modular architecture pattern. The command does not duplicate logic — it routes. This makes the workflow independently testable and the command independently readable.

---

## Weaknesses

### No persona defined despite a code-fix task requiring adversarial judgment (§6 Persona Assignment, §22 Pattern 1)

The command spawns a `gsd-code-fixer` agent but provides no persona framing for what that agent should embody. §6 Action 2 specifies that a persona must "constrain register, voice, or domain-specific style." §22 Pattern 1 shows that domain-specific identity produces more consistent, focused outputs. A code-fix agent is not a generic assistant — it is exercising judgment about what to change and what to leave alone. Without a persona, the spawned agent defaults to generic assistant behavior. Compare the guide's adversarial verification persona (§17): "Your job is not to confirm the implementation works — it's to try to break it." An analogous scoped identity is missing here.

### Output format is underspecified (§7 Output Format Handling, §22 Pattern 3)

The `<objective>` block names the output artifact (`REVIEW-FIX.md`) and location (`{padded_phase}-REVIEW-FIX.md in phase directory`) but says nothing about the structure of that file or the "inline summary of fixes applied." §7 Action 1 requires that structured output tasks specify the format before the model begins. §22 Pattern 3 states: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call." The current command leaves both the REVIEW-FIX.md schema and the inline summary structure entirely to the workflow and the fixer agent to invent independently. If the workflow file specifies these, that is appropriate delegation — but this command provides no `<output_format>` tag or schema at its own layer.

### Negative-only instruction framing in the process block (§5 Instruction Framing, Action 1)

The `<process>` block is written as a list of gates ("Phase validation (before config gate)", "REVIEW.md existence check (error if missing)") rather than as positive behavioral specifications. §5 Action 1 requires converting negative instructions to positive equivalents. The gate list reads as a checklist of failure conditions. Positively stated, the instructions would describe what the workflow *does* rather than what it *checks for before failing*. This is a framing issue, not a logic error, but it produces prompt content that is harder for a model to act on confidently.

---

## Specific Rewrites

### Issue 1: Missing output format specification

**Current `<objective>` tail:**
```
Output: {padded_phase}-REVIEW-FIX.md in phase directory + inline summary of fixes applied
```

**Suggested replacement — add an `<output_format>` block:**

```xml
<output_format>
Produce two outputs:

1. `{padded_phase}-REVIEW-FIX.md` written to the phase directory. Structure:
   - ## Summary — one sentence: N issues fixed, M skipped, final verdict
   - ## Fixes Applied — one entry per fix:
     - **[Severity] Title** — file:line — what was changed and why
   - ## Skipped — issues not fixed and the reason (e.g., out of scope, requires human review)
   - ## Next Steps — any remaining Critical or Warning items after this pass

2. Inline summary (printed to conversation) — 3–5 lines max. Restate counts only; do not
   repeat per-fix detail. End with the path to REVIEW-FIX.md.
</output_format>
```

This satisfies §7 Action 1 and §22 Pattern 3. It eliminates format variance across runs and makes the output parseable by downstream commands.

---

### Issue 2: No persona for the spawned fixer agent

**Current `<process>` block references:**
```
- Agent spawning (gsd-code-fixer)
```

**Suggested addition — insert a `<persona>` block before `<process>`:**

```xml
<persona>
You are a code-fix specialist. Your job is not to improve the code generally — it is to
apply the minimum targeted change that resolves each reported issue in REVIEW.md.

Fix exactly what is reported. Do not refactor adjacent code, rename variables, or improve
style beyond what the finding requires. Each fix must be atomic and independently reversible.
</persona>
```

This satisfies §6 Action 2 (specific persona constraining behavior) and §6's reframe pattern ("Your job is NOT X — it's Y"), which §6 notes is the one context where a negative clause is valid as a displacement of a prior. It prevents the fixer agent from scope-creeping into general cleanup, which is a real failure mode for code-modification agents.

---

### Issue 3: Process gates should be framed as positive behavioral steps

**Current:**
```
The workflow (not this command) enforces these gates:
- Phase validation (before config gate)
- REVIEW.md existence check (error if missing)
- REVIEW.md status check (skip if clean/skipped)
```

**Suggested rewrite:**

```xml
<process>
This command is a thin dispatch layer. Parse $ARGUMENTS for the phase number and optional
flags, then execute the code-review-fix workflow from @~/.claude/get-shit-done/workflows/code-review-fix.md end-to-end.

The workflow handles these steps in order:
1. Validate the phase number resolves to an existing phase directory.
2. Check the workflow.code_review config gate; stop and report if disabled.
3. Locate REVIEW.md in the phase directory; stop with a clear error message if absent.
4. Read REVIEW.md status; if status is "clean" or "skipped", report that and exit cleanly.
5. Spawn the gsd-code-fixer agent with the resolved config and REVIEW.md content.
6. If --auto is set, re-run code-review after fixes and iterate; cap at 3 total iterations.
7. Write REVIEW-FIX.md and print the inline summary.
</process>
```

This satisfies §5 Action 1 by framing steps as positive actions rather than gate-failure conditions. "Validate the phase number resolves" is a positive action; "Phase validation (before config gate)" is a structural note that tells the model nothing about what to do.

---

## Overall Verdict

**Adequate.**

The command demonstrates sound structural instincts: XML section tags, modular dispatch, and explicit flag defaults are all aligned with guide principles. However, it operates at too high an abstraction level to be a complete prompt. The output format is named but not specified, the spawned agent receives no persona, and the process block describes the workflow topology rather than instructing behavior. These are addressable gaps — none require structural redesign — but until the output schema and fixer persona are specified (either here or provably inherited from the workflow), the command leaves significant variance to the model's priors at the most consequential points: what to change, what to produce, and in what form.
