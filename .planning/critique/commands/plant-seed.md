# Critique: `commands/gsd/plant-seed.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### §11 System vs. User Prompt Allocation — YAML frontmatter as agent configuration
The frontmatter block is correctly used to encode the agent's identity, trigger hint, and tool permissions in a single machine-readable location. `allowed-tools` is explicitly scoped (Read, Write, Edit, Bash, AskUserQuestion) rather than granting open-ended access. This matches the pattern in §11 ("YAML frontmatter as agent configuration") and §22 Pattern 9 ("Tool permissions scoped to minimum required patterns").

### §19 Modularity and Composition — Single-responsibility delegation
The command file does exactly one thing: route to a workflow file via `@~/.claude/get-shit-done/workflows/plant-seed.md`. The actual process lives in the workflow file; the command file is a thin dispatcher. This is consistent with §19's modular principle ("each file handling one concern") and §13's template variable injection approach.

### §4 Formatting and Structure — Semantic XML tags
`<objective>`, `<execution_context>`, and `<process>` are used as semantically named XML tags rather than markdown headers. This is the correct approach per §4 Action 2.

---

## Weaknesses

### Issue 1 — §1 Task Specification: Missing audience, quality bar, and intent decomposition

The `<objective>` block names *what* the command creates but omits the three task components required by §1 Action 1:

- **(a) What output is requested**: Named (a `.planning/seeds/SEED-NNN-slug.md` file), but not fully specified.
- **(b) Why that output matters or how it will be used**: The objective mentions "context rot" but does not state the consumer or what the consumer does with the seed (which is the `gsd-new-milestone` scanner).
- **(c) What a correct or high-quality response looks like**: Entirely absent. There is no `<quality_bar>` for what makes a good seed vs. a bad one.

§1 Action 2 requires the audience to be encoded explicitly. No `<audience>` tag appears anywhere. The invoking user is a developer with a GSD project context — this is inferable but not stated, which means the model cannot calibrate vocabulary, detail level, or tone.

### Issue 2 — §5 Instruction Framing: `<process>` tag is a thin redirect with no framing

The `<process>` block contains one sentence:

```
Execute the plant-seed workflow from @~/.claude/get-shit-done/workflows/plant-seed.md end-to-end.
```

This framing violates §5's expectation for conditional and priority-ordered instructions. There are no:
- Priority rules for what matters most (capture the WHY faithfully vs. speed vs. completeness).
- Tie-breaking rules — what should the model do if `$ARGUMENTS` is empty and the user gives a vague idea?
- Conditional branching — §5 shows the correct form: "If no PR number is provided … If a PR number is provided …". The command takes an `[idea summary]` argument but gives no instruction on what to do when it is omitted, other than delegating silently to the workflow.

Because all behavior is deferred to the workflow via a single sentence, the command file adds no framing value beyond a frontmatter wrapper. An orchestrating model reading only this command file has no decision criteria.

### Issue 3 — §4 Formatting / §7 Output Format Handling: No output format specification

The command file specifies no `<output_format>` tag. The user receives an undeclared confirmation message (defined only in the workflow's `<step name="confirm">` block, which is not visible here). Per §7 Action 1, structured output should be specified completely and upfront. Per §22 Pattern 3, "Output format specified completely and upfront" is a production requirement.

The confirmation message in the workflow uses an emoji (`✅`) which is a style choice not constrained or documented in the command file. If a downstream runtime does not support emoji, or if the project has a no-emoji style rule, the command produces output inconsistent with surrounding tooling.

---

## Specific Rewrites

### Rewrite 1 — Add `<task>` block with audience and quality bar (fixes Issue 1)

Replace the `<objective>` tag with a full `<task>` block, adding `<audience>` and `<quality_bar>`:

```xml
<task>
Capture a forward-looking idea as a structured seed file. The seed must preserve:
(1) the idea's full rationale (WHY), (2) a precise trigger condition (WHEN to surface),
and (3) codebase breadcrumbs (WHERE it connects to current work).

Seeds are consumed by /gsd-new-milestone, which scans .planning/seeds/ and presents
matches when a new milestone's scope matches the trigger condition.

Creates: .planning/seeds/SEED-NNN-{slug}.md
</task>

<audience>
A developer with an active GSD project who wants to park an idea without losing it.
They understand milestones, phases, and the .planning/ directory structure.
</audience>

<quality_bar>
A high-quality seed answers these three questions precisely:
1. WHY does this idea matter? (problem solved or opportunity created)
2. WHEN should it surface? (a specific milestone trigger, not "later" or "someday")
3. HOW big is it? (Small / Medium / Large with rationale)

A seed that cannot answer all three is incomplete — prompt the user for the missing pieces
before writing the file.
</quality_bar>
```

### Rewrite 2 — Add conditional framing and priority order to `<process>` (fixes Issue 2)

Replace the single-sentence `<process>` block with an instruction-framed delegation that adds priority rules and argument handling:

```xml
<process>
Execute the plant-seed workflow from
@~/.claude/get-shit-done/workflows/plant-seed.md end-to-end.

<priority_order>
1. Capture the WHY accurately — a seed without clear rationale is worthless at milestone time.
2. Obtain a specific trigger condition — "someday" is not a valid trigger.
3. Collect breadcrumbs from the live codebase — these prevent the seed from going stale.
4. Write and commit the file only after all three are collected.
</priority_order>

If $ARGUMENTS is empty or contains fewer than three words, ask the user for the idea
before proceeding. Do not generate a placeholder idea.

If the user provides a trigger that is too vague (e.g., "eventually", "later", "someday"),
ask a follow-up: "What specifically would need to be true for this to become relevant?"
</process>
```

### Rewrite 3 — Add `<output_format>` block (fixes Issue 3)

Add an explicit output format specification after `<process>`:

```xml
<output_format>
After writing the seed file, output a confirmation in this exact structure (plain text,
no emoji):

  Seed planted: {SEED-NNN}
  Idea: {one-sentence summary}
  Trigger: {trigger condition}
  Scope: {Small | Medium | Large}
  File: .planning/seeds/{filename}

  This seed will surface automatically during /gsd-new-milestone when the milestone
  scope matches the trigger condition.

Use plain text only. No markdown bold, no emoji, no preamble.
</output_format>
```

---

## Overall Verdict

**Needs Work**

The command file correctly uses frontmatter, scoped tool permissions, and semantic XML tags — these are the easy parts. Its substantive failure is that it reduces the command to a one-sentence redirect with no task specification, no audience encoding, no quality bar, and no output format. A model executing this command has no criteria for what a good seed looks like, no framing for the argument-empty case, and no stated priority when the user gives ambiguous input. All of this burden is silently pushed to the workflow file, which the command file treats as a black box. By the standards of §1, §5, and §7, the command file does not stand on its own.
