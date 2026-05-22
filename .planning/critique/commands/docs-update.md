# Prompt Critique: `commands/gsd/docs-update.md`

Critique date: 2026-04-30
Guide version: PROMPT_ENGINEERING_GUIDE_V09

---

## Strengths

### §14 Constraint Enforcement — Flag precedence rule is explicit

The conflict between `--force` and `--verify-only` is resolved with a concrete ruling:

> "If `--force` and `--verify-only` both appear in `$ARGUMENTS`, `--force` takes precedence"

This is a textbook precedent-style edge-case ruling per §14 ("Precedents"). It converts an ambiguous conflict into a single, deterministic decision. The guide endorses exactly this pattern.

### §5 Instruction Framing — Conditional branching is explicit

The flag-detection logic uses explicit conditional phrasing ("active only if the literal token appears in `$ARGUMENTS`") rather than leaving inference to the model. This directly satisfies §5's conditional instruction rule and avoids the classic anti-pattern of documenting a flag and having the model treat documentation as activation.

### §11 System vs. User Prompt Allocation — Flag documentation is deduplicated

The flag descriptions appear in `<objective>` (brief definition) and `<context>` (behavioral rule). While this is arguably two locations (see Weakness below), each location serves a distinct role — definition vs. detection rule. The deduplication intent is visible even if not perfectly executed.

### §19 Modularity and Composition — Workflow delegation via `@` reference

The use of `@~/.claude/get-shit-done/workflows/docs-update.md` for the heavy execution logic is a correct modular pattern per §19. The command file holds only orchestration config; the workflow file holds execution detail. This respects the single-responsibility principle.

---

## Weaknesses

### Weakness 1: §1 Task Specification — Intent, audience, and quality bar are absent

The guide (§1 Action 1) requires three components to be explicit: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like.

`<objective>` states what (generate up to 9 docs) and a negative constraint (no hallucinated paths). It does not state:
- **Why** the docs are being generated — for whom, in what context (onboarding? public release? CI gate?)
- **What a high-quality doc looks like** — length, depth, link density, code example frequency

The guide's `<quality_bar>` tag exists precisely for this. Its absence means the subagent falls back to its own prior of what "good documentation" looks like, which varies significantly by model and session context.

**Severity:** High. The quality bar is the primary lever for calibrating subagent output. Without it, correctness cannot be reliably evaluated.

### Weakness 2: §11 Instruction Framing — Flag detection rules are duplicated across `<objective>` and `<context>`

The guide (§11 Action 3) states: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

The flag definitions and active/inactive detection rules appear in both `<objective>` (lines 19–25) and `<context>` (lines 34–43). The duplication is not serving two different purposes — both sections tell the model what each flag does and when it is active. This is textbook redundancy, which §11 forbids.

The full detection rule appears in `<context>`, which is the correct location per §8 (background context belongs in the middle). The `<objective>` block should contain only the task framing, not the flag detection logic.

**Severity:** Medium. Redundant instructions inflate prompt length and can introduce subtle inconsistency if one copy is updated and the other is not.

### Weakness 3: §4 Formatting and Structure — Prompt uses a non-standard structural tag (`<objective>`) outside the guide's vocabulary

The guide (§4, "XML tag vocabulary") defines `<task>` as the top-level tag for "primary instruction: what the model must do." The command uses `<objective>` instead.

This is not a fatal error, but it breaks tag vocabulary consistency across the prompt system. The guide explicitly states that a shared vocabulary "makes composed prompts predictable and composed modules interoperable." A prompt that uses `<objective>` instead of `<task>` is not interoperable with modules that use the standard vocabulary. If the orchestrating model or a sibling module searches for `<task>`, it will not find it.

The `<execution_context>` tag (line 27–29) is also non-standard. The guide's closest equivalent would be `<context>` with a `<log_path>` or similar child tag.

**Severity:** Low-to-medium. No direct functional failure, but it fragments the vocabulary standard across the command suite.

### Weakness 4: §7 Output Format Handling — No output format specified

The command delegates all output behavior to the referenced workflow file with no specification of what the orchestrating agent should return when complete. The guide (§7, §22 Pattern 3) requires that the output format be specified completely and upfront.

Questions left unanswered:
- Does the command return a summary table of which docs were written vs. skipped?
- What does the `--verify-only` report look like (markdown, bullet list, VERDICT line)?
- Is there a machine-parseable completion signal?

If the workflow file specifies these, the command prompt provides no linkage. If it does not, there is no format specification anywhere.

**Severity:** Medium. Inconsistent output format degrades the usability of this command as a composable building block.

---

## Specific Rewrites

### Rewrite 1: Add `<quality_bar>` to fix the missing quality specification (Weakness 1)

**Current state:** No quality bar exists.

**Suggested addition** (insert after `<objective>`, before `<execution_context>`):

```xml
<quality_bar>
A high-quality documentation output:
- Contains only claims verifiable by reading the codebase (no inferred or invented paths, signatures, or behavior)
- Matches the depth of the existing codebase: API docs at function-level for public interfaces; architecture docs at component-level for internal structure
- Uses present-tense active voice throughout
- Each doc is independently readable without requiring the reader to cross-reference other docs
- Skipped docs are reported with an explicit reason (e.g., "no public API surface detected")
</quality_bar>
```

This directly satisfies §1 Action 1(c) and §22 Pattern 3, and gives the subagents a concrete standard to calibrate against rather than relying on their default priors.

### Rewrite 2: Eliminate flag duplication by removing it from `<objective>` (Weakness 2)

**Current state in `<objective>`** (lines 19–25):
```
Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `$ARGUMENTS`
- If a documented flag is absent from `$ARGUMENTS`, treat it as inactive
- `--force`: skip preservation prompts, regenerate all docs regardless of existing content or GSD markers
- `--verify-only`: check existing docs for accuracy against codebase, no generation (full verification requires Phase 4 verifier)
- If `--force` and `--verify-only` both appear in `$ARGUMENTS`, `--force` takes precedence
```

**Suggested replacement for `<objective>`:**
```xml
<task>
Generate and update up to 9 documentation files for the current project. Each doc type is written by a gsd-doc-writer subagent that explores the codebase directly — no hallucinated paths, phantom endpoints, or stale signatures.

Supported flags: `--force` (regenerate all, skip preservation prompts) and `--verify-only` (check accuracy, no writes). Flag behavior and detection rules are specified in `<context>`.
</task>
```

The full detection logic stays in `<context>` where it belongs (§8: background context in the middle). `<objective>` / `<task>` states what the command does; `<context>` states how flags modify it. One instruction, one location.

### Rewrite 3: Rename `<objective>` to `<task>` and `<execution_context>` to `<context>` (Weakness 3)

**Current:**
```xml
<objective>...</objective>
<execution_context>@~/.claude/get-shit-done/workflows/docs-update.md</execution_context>
<context>...</context>
<process>...</process>
```

**Suggested:**
```xml
<task>...</task>
<context>
  <workflow_ref>@~/.claude/get-shit-done/workflows/docs-update.md</workflow_ref>
  ... (flag detection rules)
</context>
```

The `<workflow_ref>` child tag is a natural extension of the `<context>` vocabulary (analogous to `<log_path>`). The `<process>` block can be merged into `<task>` as the execution instruction, or retained as a sub-element. Either choice eliminates the non-standard top-level tags.

---

## Overall Verdict

**Adequate**

The command handles its primary engineering challenge — flag detection disambiguation — correctly and explicitly. The modular delegation pattern is sound. However, it fails the §1 quality bar requirement entirely, duplicates its flag logic in violation of §11, and uses non-standard structural tags that fragment the vocabulary. None of these are fatal in isolation, but together they mean the command relies on the referenced workflow file to carry most of the quality and format specification work, leaving the command itself under-specified as a standalone prompt artifact. A targeted fix to the three issues above would move this to Strong.
