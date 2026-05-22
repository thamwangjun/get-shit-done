# Critique: `commands/gsd/review-backlog.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### Sequential process is explicit and numbered (§16 Multi-Phase Workflows)
The command defines a clear 7-step ordered process. This aligns with §16's phase pattern — each step is a distinct cognitive unit with a defined trigger (the prior step's completion). The model cannot conflate steps 3 and 4, for example, because they are visibly separated.

### Concrete shell examples anchor abstract steps (§22 Pattern 2)
Steps 1, 2, and 6 include literal bash snippets. This matches §22 Pattern 2's rule that "every abstract instruction [must be] paired with a calibrating example." The `ls -d .planning/phases/999*` snippet makes "list backlog items" unambiguous.

### Positive framing for user choices (§5 Instruction Framing)
The three options — Promote, Keep, Remove — are stated as affirmative actions, not as negations. This is consistent with §5 Action 1's requirement to convert negative instructions to positive equivalents.

---

## Weaknesses

### 1. No `<output_format>` specification — the summary block is informal (§7 Output Format Handling, §22 Pattern 3)

The step-7 summary block uses an emoji header (`## 📋 Backlog Review Complete`) and prose placeholders (`{list of promoted items with new phase numbers}`). This violates §22 Pattern 3: "output structure, field names, ordering, and an example [must be stated] before the model begins its task." There is no machine-parseable format, no field constraints, and no example of a complete output. The result: output structure will vary per invocation.

The guide's §7 also requires that for structured outputs, reasoning fields precede answer fields and that format is fully specified. None of this is done.

### 2. Missing `<task>` / XML structure — sections use ad-hoc tags, not the standard vocabulary (§4 Formatting and Structure)

The prompt uses `<objective>` and `<process>` — neither of which appears in the guide's §4 XML tag vocabulary. The canonical top-level tags are `<task>`, `<context>`, `<input>`, `<output_format>`, and `<constraints>`. Using non-standard tags weakens interoperability with other composed modules (§19 Modularity) and gives the model weaker semantic signal than the canonical vocabulary provides. Per §4 Action 2: "tags name what the section *is*" — `<objective>` names intent but does not match the guide's `<task>` role.

### 3. No constraint block — permitted and disallowed actions are implicit (§14 Constraint Enforcement, §22 Pattern 9)

The command grants `Write` and `Bash` tools but provides no `<constraints>` block specifying what is permitted vs. what requires confirmation. Per §14, "pair every restriction with what IS permitted, stated equally concretely." Steps 4 and 5 perform irreversible operations — renaming directories, deleting phase directories, rewriting ROADMAP.md — without any reversibility framing (§15 Reversibility Framework). The model is given no instruction about what to confirm with the user before taking destructive steps (delete directory, remove ROADMAP entry). §15's `<confirm_with_user>` pattern is entirely absent.

Additionally, §22 Pattern 9 requires tools to be scoped to the narrowest patterns that satisfy the task. `Bash` is granted without restriction; a pattern like `Bash(ls:*)`, `Bash(mv:*)`, `Bash(rm:*)` would scope the grant precisely.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` + `<process>` with canonical XML structure and add `<output_format>`

Current:
```xml
<objective>
Review all 999.x backlog items and optionally promote them into the active
milestone sequence or remove stale entries.
</objective>

<process>
...
</process>
```

Rewrite:
```xml
<task>
Review all 999.x backlog items. For each item, determine whether to promote it
into the active milestone, keep it in the backlog, or delete it. Execute the
user's decisions and commit the changes.
</task>

<output_format>
After completing all actions, output a summary in this exact structure:

## Backlog Review Complete

**Promoted** (N items):
- Phase {new_num}: {slug} — {one-line description}

**Kept** (N items):
- 999.{x}: {slug} — {reason kept, if stated}

**Removed** (N items):
- {slug} — deleted

If a section has zero items, write "None."
</output_format>
```

This satisfies §22 Pattern 3 (output format upfront with field names and an example) and replaces non-standard tags with the `<task>` / `<output_format>` vocabulary from §4.

---

### Rewrite 2: Add a `<constraints>` block with reversibility framing for destructive steps

Insert after `<task>`:

```xml
<constraints>
  <take_freely>
    - Read any file under .planning/
    - List directory contents
    - Run gsd-sdk query commands
  </take_freely>

  <confirm_with_user>
    - Deleting a phase directory (step 5) — confirm the slug and path before rm
    - Removing an entry from ROADMAP.md — confirm the exact line being removed
    - Committing changes — confirm the commit message and file list
  </confirm_with_user>
</constraints>
```

This satisfies §14 (explicit permission pairs), §15's reversibility framework (`<take_freely>` / `<confirm_with_user>`), and §20's safety pattern of confirming irreversible actions before taking them. The current prompt silently deletes directories without any confirmation gate.

---

### Rewrite 3: Replace the broken `gsd-sdk query phase.add` placeholder with a concrete fallback (§5 Conditional Instructions)

Current step 4:
```bash
NEW_NUM=$(gsd-sdk query phase.add "${DESCRIPTION}" --raw)
```

This is a command whose output is undefined in the prompt. If `gsd-sdk` is unavailable or returns an error, the model has no fallback. Per §5, conditional behavior must be explicit:

Rewrite step 4 with conditional branching:
```
Find the next sequential phase number in the active milestone:
- Run: ls -d .planning/phases/[0-9]* | sort -V | tail -1
- Increment the last phase number by 1, preserving the decimal convention
  (e.g. if last is 4.2, next is 4.3; if last is 4, next is 5)
- If the gsd-sdk command is available, prefer: gsd-sdk query phase.add "${DESCRIPTION}" --raw
- If it fails or returns empty, fall back to the manual increment above
```

This gives the model a concrete resolution path at the decision boundary rather than a single external command with no error handling.

---

## Overall Verdict

**Needs Work**

The command is functional as a human-readable checklist but falls short as a production prompt. The three critical gaps are: (1) no output format specification, causing structural drift per invocation; (2) non-standard XML tags that bypass the guide's semantic vocabulary; and (3) no constraint block, leaving destructive operations (directory deletion, ROADMAP mutation) without any reversibility gate or confirmation requirement. The sequential step structure and concrete bash examples are solid foundations — the prompt needs format discipline and constraint rigor layered on top.
