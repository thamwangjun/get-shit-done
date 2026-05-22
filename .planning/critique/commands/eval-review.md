# Prompt Engineering Critique: `commands/gsd/eval-review.md`

**File under review:** `/home/thamw/development/happier/get-shit-done/commands/gsd/eval-review.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Date:** 2026-04-30

---

## Strengths

### 1. Clear task specification with three components present (§1 Task Specification)

The command names its output (`EVAL-REVIEW.md`), its purpose (`retroactive evaluation coverage audit`), and its quality bar (`scores each eval dimension as COVERED/PARTIAL/MISSING`). The frontmatter `description` field encodes all three components in one sentence — this is compact and correct per §1 Action 1.

### 2. Structured XML tag usage for top-level sections (§4 Formatting)

The command uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` — semantically named tags that map cleanly onto the guide's recommended tag vocabulary (`<task>`, `<context>`, `<input>`). This is strictly better than markdown headers for Claude-class models per §4 Action 2.

### 3. Argument fallback handling (§5 Conditional Instructions)

The `$ARGUMENTS` variable with a documented fallback ("optional, defaults to last completed phase") follows the conditional instruction pattern in §5. The workflow file (referenced via `@`) expands this into explicit branching (State A / B / C), which is the correct pattern per §16 Scenario-Based Branching.

### 4. Delegation via `@`-reference rather than copy-paste (§19 Modularity)

The command body is minimal: it delegates to `@~/.claude/get-shit-done/workflows/eval-review.md` rather than embedding the full workflow inline. This respects §19's single-responsibility principle and allows the workflow to be updated without touching the command file. Template variables compose at runtime exactly as §13 prescribes.

### 5. Agent type declared explicitly (§17 Agent and Subagent Patterns)

`<available_agent_types>` in the referenced workflow names the `gsd-eval-auditor` subagent. The workflow also passes structured `<input>` fields to the spawned Task — matching the self-contained agent prompt pattern in §17.

---

## Weaknesses

### Weakness 1 — No output format specification in the command file (§7 Output Format Handling, §22 Pattern 3)

The command file contains no `<output_format>` tag and no description of what the user will see when the command completes. The workflow file defines a summary banner, but that detail is invisible in the command file itself.

Per §22 Pattern 3: "Output format specified completely and upfront." Per §7 Action 1: free-form reasoning should precede formatting, and the required structure must be stated before the model begins. A developer reading only `eval-review.md` cannot know what the command emits — they must read both `eval-review.md` and the full workflow file. This violates §11 Action 1 (each instruction in exactly one location) by splitting the definition of what this command does across two files with no cross-reference visible at the command level.

**Impact:** Orchestrating agents that use this command cannot infer the output shape from the command file alone.

### Weakness 2 — `<process>` block contains a single bare imperative with no quality bar (§1 Action 1, §5 Instruction Framing)

```xml
<process>
Execute @~/.claude/get-shit-done/workflows/eval-review.md end-to-end.
Preserve all workflow gates.
</process>
```

"Preserve all workflow gates" is a negative-style constraint disguised as a positive one but with no definition of what a "workflow gate" is at this level. Per §5 Action 1, instructions must be positive specifications of desired behavior. "Preserve all workflow gates" does not tell the model what to do — it tells the model not to skip something, without naming what that something is. A reader cannot verify compliance.

Per §1 Action 1 (quality bar): there is no success criterion visible in the command file. The `<success_criteria>` checklist lives in the workflow file and is not surfaced here at all.

**Impact:** A model executing this command with a shallow read of the command file has no behaviorally grounding instruction beyond "run a file" — the framing provides no guard against partial execution or gate-skipping.

### Weakness 3 — Audience is unspecified (§1 Action 2, §4 XML Tag Vocabulary)

The command has no `<audience>` tag and no encoding of who will consume the output or in what context. Per §1 Action 2, the audience — their domain knowledge, vocabulary, and assumptions — must be explicit. The description line ("Retroactively audit an executed AI phase's evaluation coverage") is written for a developer who already understands the GSD workflow vocabulary (AI-SPEC.md, eval dimensions, COVERED/PARTIAL/MISSING). This is fine for experienced users but means the command provides no grounding for a model that must decide how to calibrate output verbosity or jargon level.

The guide's `<audience>` tag (§4 XML Tag Vocabulary, top-level structural tags) exists precisely to encode this. Its absence means the spawned workflow has no explicit audience signal to carry into the auditor prompt.

**Impact:** The `gsd-eval-auditor` subagent has no audience specification passed to it. Per §17 (self-contained agent prompts), every agent must receive its full operating instructions directly.

---

## Specific Rewrites

### Rewrite 1 — Add `<output_format>` to the command file

**Current:**
```xml
<process>
Execute @~/.claude/get-shit-done/workflows/eval-review.md end-to-end.
Preserve all workflow gates.
</process>
```

**Suggested:**
```xml
<output_format>
On completion, display a summary block in this exact format:

  Score: {overall_score}/100
  Verdict: {PRODUCTION READY | NEEDS WORK | SIGNIFICANT GAPS | NOT IMPLEMENTED}
  Critical Gaps: {count}
  Output: {path to EVAL-REVIEW.md}

Follow with a single next-step recommendation based on the verdict.
No prose preamble before the summary block.
</output_format>

<process>
Execute @~/.claude/get-shit-done/workflows/eval-review.md end-to-end.
All workflow decision gates (state detection, existing-file check, auditor spawn, commit) must execute before the summary block is emitted.
</process>
```

**Why this fixes the issue:** The output format is now visible in the command file itself (§22 Pattern 3). The gate-preservation instruction is rewritten as a positive, sequenced specification ("must execute before") rather than a bare negative ("preserve all workflow gates") per §5 Action 1.

---

### Rewrite 2 — Add `<audience>` and pass it into the workflow context

**Current:**
```xml
<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>
```

**Suggested:**
```xml
<audience>
A software developer running GSD (Get Shit Done) workflow tooling. They understand AI-SPEC.md, eval dimensions, and the COVERED/PARTIAL/MISSING scoring convention. They expect a scored report and a concrete remediation list — not an explanation of what evals are.
</audience>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>
```

**Why this fixes the issue:** Per §1 Action 2 and §4, the audience tag encodes vocabulary and expectation level. When the workflow spawns `gsd-eval-auditor`, this context can be threaded into the subagent prompt to calibrate output register — satisfying §17's requirement that agents receive their full operating context directly. Without this, the auditor defaults to explaining concepts the audience already knows, wasting tokens and reducing output density.

---

### Rewrite 3 — Replace the bare `<objective>` with a `<task>` block that includes quality bar

**Current:**
```xml
<objective>
Conduct a retroactive evaluation coverage audit of a completed AI phase.
Checks whether the evaluation strategy from AI-SPEC.md was implemented.
Produces EVAL-REVIEW.md with score, verdict, gaps, and remediation plan.
</objective>
```

**Suggested:**
```xml
<task>
Conduct a retroactive evaluation coverage audit of a completed AI phase.

What: Score each eval dimension in AI-SPEC.md as COVERED, PARTIAL, or MISSING.
Why: Surface gaps before the phase ships to production.
Quality bar: The output is actionable — every MISSING or PARTIAL finding has a specific remediation step, not a generic recommendation.
</task>
```

**Why this fixes the issue:** Per §1 Action 1, the three task components (what, why, quality bar) must be explicit. The current `<objective>` states what and produces-what, but omits why and quality bar. The proposed rewrite makes all three explicit. Renaming `<objective>` to `<task>` also aligns with the guide's standard tag vocabulary (§4 XML Tag Vocabulary), where `<task>` is the canonical tag for "what the model must do."

---

## Overall Verdict

**Adequate**

The command correctly delegates to a modular workflow, uses XML tags, handles argument fallback, and names its subagent type. These are the structural fundamentals, and they are correct.

What the command file lacks is self-sufficiency as a reading artifact: audience is absent, output format is invisible, and the single process instruction ("preserve all workflow gates") is too opaque to ground execution without reading the workflow file. A developer or orchestrating agent reading only `eval-review.md` cannot determine what this command emits or how to verify it succeeded.

The fixes above are localized — none require changes to the workflow file itself. Applied, they would bring the command to **Strong**.
