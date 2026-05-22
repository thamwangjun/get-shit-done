# Prompt Critique: `commands/gsd/inbox.md`

**File reviewed:** `commands/gsd/inbox.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Overall verdict:** Needs Work

---

## Strengths

### §4 Formatting and Structure — XML tag usage

The file uses semantically named XML tags (`<objective>`, `<context>`, `<process>`) to separate prompt sections. This is in the right direction per §4 Action 2, which requires wrapping distinct sections in semantically named tags that identify *what the section is*, not just mark a boundary. The tags are meaningful rather than generic delimiters.

### §1 Task Specification — Flow summary present

The `<objective>` block includes a one-line flow summary ("Detect repo → Fetch open issues + PRs → …") that gives a high-level picture of the pipeline. This partially satisfies §1 Action 1's requirement to make explicit what output is requested and how it will be used.

### §5 Instruction Framing — Conditional instruction structure for flags

The flag list in `<context>` implicitly defines conditional behavior per flag (e.g., `--issues` skips PRs, `--close-incomplete` closes non-compliant items). This aligns with §5's conditional instruction pattern — each flag is a named branch trigger, which is better than a flat prose description of behavior.

---

## Weaknesses

### §4 / §1 — Tag vocabulary diverges from the standard and critical sections are missing

**Issue:** The command uses `<objective>` and `<process>` as top-level tags. The guide's canonical vocabulary (§4, XML tag vocabulary table) defines `<task>` as the primary instruction tag. `<objective>` is not in the vocabulary. More critically, the following mandatory sections are entirely absent:

- `<output_format>` — No specification of what the report should look like: fields, ordering, or an example finding entry. §22 Pattern 3 is explicit: "output format specified completely and upfront." The command delegates format entirely to the referenced workflow file, making the command unreadable in isolation.
- `<constraints>` — No permitted/reserved action pairs. The command can label, comment on, and close issues. These are irreversible or externally visible actions (§15 reversibility framework; §14 explicit permission pairs). There is no `<confirm_with_user>` or `<take_freely>` distinction.
- `<audience>` — Not present. §1 Action 2 requires explicit audience encoding.
- `<quality_bar>` — Not present. §1 Action 1 requires the quality bar to be explicit.

### §11 / §19 — Modularity via `@` reference is opaque and breaks self-containment

**Issue:** Both `<execution_context>` and `<process>` defer entirely to `@~/.claude/get-shit-done/workflows/inbox.md`. This violates two principles simultaneously:

1. §17 ("Each agent prompt must be fully self-contained when spawned") — the command cannot be understood, executed, or critiqued without the referenced workflow file. The command file is effectively a stub.
2. §19 (modularity principle) — modules must be "independently understandable." A file whose entire behavioral specification lives in an external `@` reference is not independently understandable.

The `<process>` block ("Execute the inbox workflow from @~/.claude/get-shit-done/workflows/inbox.md end-to-end. Parse flags from arguments and pass to workflow.") adds no information beyond the reference itself.

### §5 / §14 — Negative framing and absent constraint pairs for destructive operations

**Issue:** The flag `--close-incomplete` is described in purely behavioral terms ("Close issues/PRs that fail template compliance") with no constraint pair telling the model *when to confirm* vs. *when to act freely*. Per §14's explicit permission pairs rule, every restriction must be paired with what IS permitted with equal concreteness. Per §15's reversibility framework, closing GitHub issues is an externally visible, hard-to-reverse action that requires a `<confirm_with_user>` block. Neither exists. The command gives the model blanket authorization to close issues when the flag is set, with no tie-breaking instruction for edge cases (e.g., a partially compliant submission).

There are also no negative instructions to flag per §5 Action 1, but the *absence* of priority ordering (§5 priority ordering) is a gap: when `--issues` and `--prs` are both absent, should the command default to all? When `--close-incomplete` and `--label` conflict on a borderline submission, what wins? Neither is specified.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` + `<process>` with guide-canonical `<task>` and add `<output_format>`

**Current:**
```xml
<objective>
One-command triage of the project's GitHub inbox. Fetches all open issues and PRs,
reviews each against the corresponding template requirements (feature, enhancement,
bug, chore, fix PR, enhancement PR, feature PR), reports completeness and compliance,
and optionally applies labels or closes non-compliant submissions.

**Flow:** Detect repo → Fetch open issues + PRs → Classify each by type → Review against template → Report findings → Optionally act (label, comment, close)
</objective>

<process>
Execute the inbox workflow from @~/.claude/get-shit-done/workflows/inbox.md end-to-end.
Parse flags from arguments and pass to workflow.
</process>
```

**Suggested rewrite:**
```xml
<task>
Triage all open GitHub issues and PRs in the detected (or specified) repository.

1. Detect repository from current git remote, or use --repo if provided.
2. Fetch all open issues and PRs (filtered by --issues / --prs flags if present).
3. Classify each item by type: feature, enhancement, bug, chore, fix PR, enhancement PR, feature PR.
4. Review each item against its corresponding template requirements.
5. Produce a compliance report (see <output_format>).
6. If --label: apply recommended labels.
7. If --close-incomplete: close non-compliant items with an explanatory comment.
</task>

<output_format>
Produce a markdown table with one row per issue/PR:

| # | Type | Title | Status | Missing fields | Action taken |
|---|------|-------|--------|----------------|--------------|

After the table, list each non-compliant item with:
- Item number and title
- Template fields that are absent or incomplete
- Recommended action (label, comment, close)

Default to all issues and PRs when neither --issues nor --prs is provided.
</output_format>
```

This satisfies §4 (canonical tag vocabulary), §22 Pattern 3 (output format upfront with example structure), and §1 Action 1 (explicit output + quality bar).

---

### Rewrite 2: Add `<constraints>` with reversibility framing for destructive flags

**Current:** No constraints block exists.

**Suggested addition:**
```xml
<constraints>
  <take_freely>
    - Reading issues and PRs (gh issue list, gh pr list, gh issue view, gh pr view)
    - Applying labels (--label flag)
    - Posting review comments that do not close the item
  </take_freely>

  <confirm_with_user>
    - Closing any issue or PR (--close-incomplete): confirm before closing each item
      unless the user has explicitly pre-authorized bulk closure in this session.
    - Closing a partially compliant item (has some required fields but not all):
      report it and ask the user whether to close or leave open.
  </confirm_with_user>
</constraints>
```

This satisfies §14 (explicit permission pairs), §15 (reversibility framework), and §5 (tie-breaking: partially compliant items resolved by asking the user rather than guessing).

---

### Rewrite 3: Inline the minimum behavioral spec so the command is self-contained

**Current:** The command delegates all behavior to `@~/.claude/get-shit-done/workflows/inbox.md` with no summary of what that file specifies.

**Suggested rewrite of `<execution_context>`:**
```xml
<execution_context>
Load the full workflow definition from @~/.claude/get-shit-done/workflows/inbox.md.
That file specifies: template field requirements per issue/PR type, label taxonomy,
comment templates for non-compliant closures, and gh CLI command patterns.

If the workflow file is not found, stop and inform the user:
"Inbox workflow not found at ~/.claude/get-shit-done/workflows/inbox.md. Run /gsd-update to restore it."
</execution_context>
```

This adds a fallback for the missing-file scenario (§5 conditional instructions), names what the referenced file provides (making the command independently understandable per §19), and removes the hollow "Execute end-to-end" instruction that adds no information.

---

## Overall Verdict

**Needs Work.**

The command is a thin dispatch layer that delegates its entire behavioral specification to an external file. As written, it cannot be understood, critiqued, or executed without that file — violating self-containment (§17), independent understandability (§19), and the requirement to specify output format upfront (§22 Pattern 3). The use of XML tags and the flow summary are positive signals, but the absence of `<output_format>`, `<constraints>`, `<audience>`, and `<quality_bar>` leaves critical guide requirements entirely unaddressed (§1, §4, §14, §15). The destructive flag `--close-incomplete` has no reversibility guard, which is the highest-priority fix.
