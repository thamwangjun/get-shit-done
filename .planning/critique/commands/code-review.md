# Critique: commands/gsd/code-review.md

**File under review:** `commands/gsd/code-review.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Date:** 2026-04-30

---

## Overall Verdict: Adequate

The command is structurally sound as a dispatch layer and avoids the most common anti-patterns. However, the `<objective>` block doubles as a combined instruction-and-documentation hybrid that violates several guide principles, the persona contract is entirely absent, and the output format specification lacks the concrete example the guide requires for any task that produces structured artifacts.

---

## Strengths

### 1. Thin dispatch layer is architecturally correct (§19 Modularity, §13 Structural Architecture Patterns)

The command's self-description — "This command is a thin dispatch layer. It parses arguments and delegates to the workflow" — correctly applies the single-responsibility principle from §19. The actual enforcement logic (phase validation, config gate, file scoping, agent spawning) is pushed into the workflow, not this file. This matches Pattern 5 (§22): each file covers one behavioral concern.

### 2. Conditional argument parsing is explicit (§5 Instruction Framing)

The `<context>` block documents explicit conditional branching for `--depth` and `--files` overrides, including precedence ordering (`--files override > SUMMARY.md > git diff fallback`). This matches §5's "Conditional instructions" principle: behavior depending on context uses explicit branching rather than leaving the model to infer.

### 3. Tool permissions are specified by name (§22 Pattern 9)

The frontmatter lists named tools (`Read`, `Bash`, `Glob`, `Grep`, `Write`, `Task`). This is better than no scoping, though the permissions could be narrowed further (see Weaknesses §3 below).

### 4. Context placement follows the guide (§8 Context Placement)

The file leads with `<objective>` (task instruction) and closes with `<process>` (action steps), broadly following the §8 rule that the task instruction leads and execution details follow. Context variables (`$ARGUMENTS`, flag parsing notes) are in the `<context>` block in the middle position.

---

## Weaknesses

### 1. `<objective>` conflates task instruction with documentation prose (§1 Task Specification, §4 Formatting, §8 Context Placement)

**Violation:** §1 Action 1 requires the prompt to make explicit: (a) what output is requested, (b) why it matters or how it is used, and (c) what a high-quality response looks like. The current `<objective>` block mixes the task instruction with human-readable argument documentation and output artifact description in running prose. Argument reference material (`--depth=quick|standard|deep`, timing estimates) belongs in a `<context>` or `<arguments>` block, not inside the primary task tag.

§4 Action 2 specifies that distinct sections should be wrapped in semantically named XML tags. By placing argument documentation inside `<objective>`, the file collapses two distinct concerns — what the agent must do vs. what arguments exist — into one tag, degrading the signal the model receives from the tag name.

§1 also requires a `<quality_bar>` (what makes a correct response). None is present. The command spawns an agent and produces a REVIEW.md artifact, but "what does a good output look like" is never stated for this dispatch layer (separate from the downstream reviewer agent).

### 2. No persona assignment for a task that benefits from one (§6 Persona Assignment)

**Violation:** The command spawns a code-reviewer agent, which is an open-ended orchestration task requiring judgment calls (which phase to validate, how to handle ambiguous `--depth` values, what to do when scoping falls back). §6 Action 1 specifies that tasks that are "open-ended" or "require a specific voice" should have a persona; §6 Action 2 requires the persona to be specific and role-constrained, not generic.

The command currently has no `<persona>` tag at all. The guide's role-domain mapping table (§6) suggests "Senior security engineer conducting a focused security review" is more effective than the generic "Code reviewer" — the same principle applies here: "Code review orchestration specialist" or similar is more directive than omitting the persona entirely.

Additionally, §6's Strengths listing pattern (enumerating what the agent is good at) is absent. For a dispatch agent, stating what it is responsible for vs. what it delegates would sharpen execution.

### 3. Output format has no concrete example (§7 Output Format Handling, §22 Pattern 3)

**Violation:** The command states the output is `{padded_phase}-REVIEW.md in phase directory + inline summary of findings`, but provides no example of what the inline summary looks like. §22 Pattern 3 is explicit: "State the required output structure, field names, ordering, and an example before the model begins its task." An implicit format "produces structure that varies per call."

The REVIEW.md artifact format is delegated to the workflow, but the inline summary — what the command itself is responsible for presenting back to the user after the agent returns — is entirely unspecified. A model receiving this prompt will produce an inline summary in whatever format it invents at runtime, which will be inconsistent across invocations.

### 4. Negative instruction present in `<objective>` (§5 Instruction Framing, Action 1)

**Violation (minor):** The `<context>` block contains: "workflow skips SUMMARY.md extraction and git diff fallback entirely." The word "skips" describes what the workflow does NOT do. §5 Action 1 requires converting negative instructions to positive equivalents. A positive reframe would be: "When `--files` is provided, the workflow uses only the explicit file list for scoping."

---

## Specific Rewrites

### Rewrite 1: Split `<objective>` into `<task>`, `<arguments>`, and `<quality_bar>`

**Problem:** `<objective>` mixes task definition with argument documentation (§1, §4).

**Current:**
```xml
<objective>
Review source files changed during a phase for bugs, security vulnerabilities, and code quality problems.

Spawns the gsd-code-reviewer agent to analyze code at the specified depth level. Produces REVIEW.md artifact in the phase directory with severity-classified findings.

Arguments:
- Phase number (required) — which phase's changes to review (e.g., "2" or "02")
- `--depth=quick|standard|deep` (optional) — review depth level, overrides workflow.code_review_depth config
  ...
- `--files file1,file2,...` (optional) — explicit comma-separated file list, skips SUMMARY/git scoping (highest precedence for scoping)

Output: {padded_phase}-REVIEW.md in phase directory + inline summary of findings
</objective>
```

**Rewrite:**
```xml
<task>
Parse the phase number and optional flags from $ARGUMENTS, then execute the code-review workflow end-to-end. Present an inline summary of findings to the user when the agent returns.
</task>

<arguments>
- Phase number (required) — which phase's changes to review (e.g., "2" or "02")
- `--depth=quick|standard|deep` (optional) — review depth level, overrides workflow.code_review_depth config
  - quick: pattern-matching only (~2 min)
  - standard: per-file analysis with language-specific checks (~5–15 min, default)
  - deep: cross-file analysis including import graphs and call chains (~15–30 min)
- `--files=file1,file2,...` (optional) — explicit comma-separated file list; when provided, use only these files for scoping (highest precedence)
</arguments>

<quality_bar>
A correct execution: validates the phase, resolves file scope, spawns the gsd-code-reviewer agent, and presents the user with an inline summary listing finding counts by severity and the path to the REVIEW.md artifact.
</quality_bar>
```

This separates the three §1 components into their own tags with clear semantic labels, and converts the negative "skips SUMMARY/git scoping" phrase into the positive "use only these files for scoping."

---

### Rewrite 2: Add a scoped persona with strengths listing

**Problem:** No persona for an orchestration task that requires judgment calls (§6).

**Add after frontmatter, before `<task>`:**
```xml
<persona>
You are a code review orchestration specialist. Your job is not to review code directly —
it is to validate arguments, resolve file scope, and dispatch the gsd-code-reviewer agent
with the correct inputs.

Your responsibilities:
- Validating that the phase number is well-formed before proceeding
- Resolving which files to include based on explicit override, SUMMARY.md, or git diff fallback in that order
- Passing the resolved scope and depth to the workflow
- Presenting findings inline when the agent returns
</persona>
```

This applies §6 Action 2 (specific, role-constrained persona), the reframe pattern ("Your job is not to review code directly — it is to dispatch"), and the Strengths listing pattern (enumerated responsibilities).

---

### Rewrite 3: Specify the inline summary output format with an example

**Problem:** The inline summary output format is entirely unspecified (§7 Output Format Handling, §22 Pattern 3).

**Add a `<output_format>` block before `<process>`:**
```xml
<output_format>
After the agent returns, present an inline summary to the user in this format:

---
**Code Review Complete — Phase {N}**

Depth: {quick|standard|deep}
Files reviewed: {count}
Artifact: {absolute path to REVIEW.md}

Findings:
- CRITICAL: {count}
- HIGH: {count}
- MEDIUM: {count}
- LOW: {count}

{One sentence on the most important finding, or "No findings above LOW severity." if none.}
---

If the agent was skipped (config gate disabled or empty file scope), state the reason in one sentence instead of the findings table.
</output_format>
```

This applies §22 Pattern 3 (output format specified completely with an example), §7 Action 2 (reasoning fields before answer fields — findings listed before conclusion), and §5's conditional instructions (two explicit branches: findings present vs. agent skipped).

---

## Checklist Summary

| Guide Section | Status |
|---|---|
| §1 Task Specification — intent, audience, quality bar explicit | Partial — intent present, quality bar absent |
| §4 Formatting — semantically named XML tags per distinct section | Partial — `<objective>` conflates task + argument docs |
| §5 Instruction Framing — negative instructions converted | Partial — one negative phrase in `<context>` |
| §5 Conditional instructions explicit | Pass |
| §6 Persona — included for open-ended/orchestration task | Fail — absent |
| §7 Output Format — concrete example for structured output | Fail — inline summary unspecified |
| §8 Context Placement — task leads, input closes | Pass |
| §19 Modularity — single responsibility | Pass |
| §22 Pattern 3 — output format with example | Fail |
| §22 Pattern 9 — tool permissions scoped to minimum patterns | Partial — named but not prefix-scoped |
