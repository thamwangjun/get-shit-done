# Critique: `commands/gsd/cleanup.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overview

`commands/gsd/cleanup.md` is a thin dispatch layer — it names the command, declares its allowed tools, and delegates all substantive logic to `~/.claude/get-shit-done/workflows/cleanup.md`. The critique covers both files jointly, because the command file's only job is to frame and hand off to the workflow. Both must be evaluated together to give a fair verdict.

---

## Strengths

### 1. Constraint block is well-structured (§14 Constraint Enforcement)

The workflow's `<constraints>` block correctly uses `<permitted>` and `<reserved_for_human_review>` sub-tags from the guide's canonical vocabulary (§4 XML tag vocabulary). Permitted actions are enumerated concretely ("Run read-only shell commands: ls, cat"), not described qualitatively. Reserved actions call out the specific hazard ("Moving phases without prior dry-run confirmation", "Archiving phases that belong to an incomplete milestone"). This is exactly the "pair every restriction with what IS permitted" pattern from §14.

### 2. Reversibility framework is applied correctly (§15 Decision Frameworks)

The dry-run → confirmation → execute sequence directly implements the `<confirm_with_user>` pattern. The workflow never moves directories without an affirmative user response, matching the guide's reversibility framework: "Destructive operations... require confirmation." The `<reserved_for_human_review>` list makes the blast radius explicit.

### 3. Step-level required reading is explicit (§8 Context Placement)

The `<required_reading>` block names the exact files to read, in the order they provide signal, before any action. This front-loads the context the model needs and prevents it from attempting the identification step without the necessary inputs — consistent with §8's instruction to place task instruction first and trim context to what is directly relevant.

### 4. Quality bar and success criteria are present (§1 Task Specification)

The workflow closes with a `<quality_bar>` block and a `<success_criteria>` checklist. These satisfy §1 Action 1(c): "what a correct or high-quality response looks like." The checklist items are verifiable and non-overlapping, which is better than a prose description of success.

### 5. Text-mode escape hatch is documented (§16 Multi-Phase Workflows / conditional instructions)

The `--text` flag and `text_mode` fallback in the `show_dry_run` step implements the conditional branching pattern from §5 ("When behavior depends on context, use explicit conditional branching"). The substitution is clearly scoped: replace `AskUserQuestion` with a numbered list when `TEXT_MODE=true`. This is a runtime conditional handled directly in the prompt.

---

## Weaknesses

### 1. Command file provides no task framing — it is purely a pointer (§1 Task Specification, §8 Context Placement)

The command file (`commands/gsd/cleanup.md`) contains three elements: an `<objective>`, an `<execution_context>` that names the workflow file, and a `<process>` that repeats the `<execution_context>` instruction in prose. The `<process>` block adds nothing the `<execution_context>` tag does not already say:

```
<process>
Follow the cleanup workflow at @~/.claude/get-shit-done/workflows/cleanup.md.
Identify completed milestones, show a dry-run summary, and archive on confirmation.
</process>
```

This violates §11 Action 3 ("State each instruction exactly once") and §10 Action 1 ("Remove redundant instructions... before sending"). More critically, §1 requires the prompt to make explicit: (a) what output is requested, (b) why it matters, and (c) what a good response looks like. The command file states none of these — it offloads them entirely to the workflow. When a user invokes `/gsd:cleanup`, the first thing the model sees is a pointer, not a task. If the workflow file is unavailable or the `@` include fails silently, the model has no fallback instruction to act on.

**Impact:** The command file is brittle. Its entire behavior depends on the include resolving. A self-contained task statement in the command file would provide a fallback and make the intent scannable without chasing the reference.

### 2. No audience specification, and the `<objective>` mixes audience-relevant context with task instruction (§1 Task Specification Action 2, §4 Formatting)

The `<objective>` reads:

```
Archive phase directories from completed milestones into `.planning/milestones/v{X.Y}-phases/`.

Use when `.planning/phases/` has accumulated directories from past milestones.
```

The second sentence ("Use when...") is a trigger condition for the invoking agent or human — it belongs in frontmatter's `whenToUse` or a `<system_note>`, not in `<objective>`. The guide's §11 YAML frontmatter pattern shows `whenToUse` as the correct slot for this. Mixing it into the `<objective>` tag blurs what is a trigger condition (meta-instruction) and what is a task instruction.

No `<audience>` is specified anywhere. The guide (§1 Action 2) requires the audience to be encoded explicitly: who consumes the output, their domain knowledge, and what assumptions they bring. For a maintenance command like this, the audience is the developer running it mid-session — the output tone and verbosity should be calibrated accordingly. The workflow's final report format is reasonable but the command file makes no statement about who reads it or at what level of detail.

### 3. Negative instructions are not converted to positive equivalents (§5 Instruction Framing Action 1)

The workflow's `<reserved_for_human_review>` block uses negative framing throughout:

```
- Deleting any directory or file
- Moving phases without prior dry-run confirmation
- Archiving phases that belong to an incomplete milestone
```

While `<reserved_for_human_review>` is a constraint sub-tag (§4), the guide's §5 Action 1 is unconditional: "scan for negated instructions... Rewrite each as a positive specification of the desired behavior." Each of these can be restated positively:

- "Deleting any directory or file" → "Only create directories (mkdir) and move existing ones (mv)"
- "Moving phases without prior dry-run confirmation" → "Move phase directories only after the user has confirmed the dry-run summary"
- "Archiving phases that belong to an incomplete milestone" → "Archive only phases whose parent milestone is marked complete in MILESTONES.md"

Positive framing tells the model what to do, not what to avoid. The negative list is a prohibition catalog; the positive rewrite is an operating specification. The distinction matters because the model must infer compliant behavior from a prohibition list, whereas a positive spec states it directly.

---

## Specific Rewrites

### Rewrite 1: Replace the command file's redundant `<process>` block; add task framing

**Current:**
```markdown
<objective>
Archive phase directories from completed milestones into `.planning/milestones/v{X.Y}-phases/`.

Use when `.planning/phases/` has accumulated directories from past milestones.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/cleanup.md
</execution_context>

<process>
Follow the cleanup workflow at @~/.claude/get-shit-done/workflows/cleanup.md.
Identify completed milestones, show a dry-run summary, and archive on confirmation.
</process>
```

**Suggested rewrite:**
```markdown
<task>
Archive accumulated phase directories from completed milestones. Read
`.planning/MILESTONES.md` to identify completed milestones, determine which
phase directories in `.planning/phases/` belong to each, present a dry-run
summary for confirmation, then move them into `.planning/milestones/v{X.Y}-phases/`.
</task>

<audience>
The developer running this command to keep `.planning/phases/` focused on the
current milestone. They are familiar with the GSD directory layout but want to
confirm what will move before anything is touched.
</audience>

<execution_context>
@~/.claude/get-shit-done/workflows/cleanup.md
</execution_context>
```

This eliminates the `<process>` duplication (§11 Action 3), promotes `whenToUse` to frontmatter, adds the missing `<audience>` (§1 Action 2), and keeps the `<task>` as a scannable fallback if the include fails.

---

### Rewrite 2: Convert negative `<reserved_for_human_review>` items to positive operating rules

**Current:**
```xml
<reserved_for_human_review>
- Deleting any directory or file
- Moving phases without prior dry-run confirmation
- Archiving phases that belong to an incomplete milestone
</reserved_for_human_review>
```

**Suggested rewrite:**
```xml
<permitted>
  - Read `.planning/` files using the Read tool
  - Run read-only shell commands: ls, cat
  - Create archive directories with mkdir
  - Move phase directories with mv, only after user confirms the dry-run summary
  - Archive only phases whose parent milestone is marked complete in MILESTONES.md
  - Run gsd-tools.cjs commit after user confirmation
</permitted>

<reserved_for_human_review>
  - Any delete operation on directories or files
  - Moving phase directories before the user confirms the dry-run summary
  - Any archiving of phases whose parent milestone is not yet complete
</reserved_for_human_review>
```

The positive rules in `<permitted>` now state the operating spec directly. The `<reserved_for_human_review>` items are retained as a safety backstop — acceptable here because they are paired with the `<permitted>` block, following §14's "pair every restriction with what IS permitted" pattern — but each item now names the specific condition that triggers the gate (§5 Action 1).

---

### Rewrite 3: Move the trigger condition from `<objective>` to frontmatter `whenToUse`

**Current (in `<objective>`):**
```
Use when `.planning/phases/` has accumulated directories from past milestones.
```

**Suggested rewrite (in frontmatter):**
```yaml
---
name: gsd:cleanup
description: Archive accumulated phase directories from completed milestones
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
agentMetadata:
  whenToUse: >
    Use when `.planning/phases/` has accumulated directories from past milestones
    and `.planning/phases/` feels cluttered with directories that no longer belong
    to the current milestone.
---
```

This follows the guide's §11 YAML frontmatter pattern and §17 subagent configuration: `whenToUse` is the canonical slot for trigger conditions shown to the orchestrating model. Embedding it in `<objective>` conflates "when to run this" (meta-instruction for the caller) with "what to do" (instruction for the executor).

---

## Overall Verdict

**Adequate**

The workflow file (`workflows/cleanup.md`) is well-constructed: the constraint block, reversibility framework, step-level required reading, and quality bar are all executed correctly against guide principles. The command file (`commands/gsd/cleanup.md`), however, is thin to the point of brittleness — it is a pointer with a redundant prose restatement of the pointer, and it drops §1's audience and task-framing requirements on the floor. The top three issues (redundant `<process>`, missing audience, negative framing) are all fixable with targeted edits. Nothing in the core logic or step sequencing is wrong; the gaps are in framing and structure.
