# Critique: `commands/gsd/plan-milestone-gaps.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict: **Needs Work**

The command file is a thin dispatch stub — it delegates almost all logic to a workflow file. That architectural choice is defensible under §19 (Modularity and Composition), but it creates a practical problem: the stub itself is nearly content-free, and the workflow file it defers to has substantial prompt engineering deficiencies. Both layers are assessed here, since the guide applies equally to the stub and the workflow it orchestrates.

---

## Strengths

### 1. Separation of identity from logic (§19 Modularity, §11 System vs. User Prompt)

The frontmatter cleanly separates persistent agent configuration (name, description, allowed-tools) from runtime process instructions. The `allowed-tools` list follows §22 Pattern 9 (minimum required tool set): `Read`, `Write`, `Bash`, `Glob`, `Grep`, `AskUserQuestion` — all directly justified by the workflow's file operations. No whole-tool over-grants.

### 2. Concise stub structure (§10 Prompt Length)

The stub itself is 35 lines. It avoids padding. The `<objective>` block delivers a three-sentence summary that captures what, why, and scope — loosely satisfying §1 Action 1's requirement to make all three task components explicit. The inline comment "One command creates all fix phases — no manual `/gsd-add-phase` per gap" efficiently communicates user value.

### 3. Explicit error path in workflow (§5 Instruction Framing — Conditional Instructions)

Step 1 of the workflow defines a hard stop condition with a prescribed error message when no audit file exists. This is the correct pattern from §5: explicit conditional branching rather than leaving the model to infer what to do on missing input.

### 4. Phase pattern usage (§16 Multi-Phase Workflows)

The workflow's 10-step process creates cognitive boundaries: load → prioritize → group → confirm → write roadmap → update requirements → create directories → commit → offer next steps. This maps well to the phase pattern from §16, even though it does not use `<phase id="N" name="...">` XML tags.

---

## Weaknesses

### 1. Missing XML structure on the stub (§4 Formatting and Structure — Action 2)

**Severity: High**

The command stub uses raw prose sections (`<objective>`, `<execution_context>`, `<context>`, `<process>`) that look like XML but are not semantically integrated into the guide's vocabulary. Specifically:

- `<objective>` is not in the guide's tag vocabulary. The correct tag is `<task>` for "what the model must do."
- `<execution_context>` is not a guide-standard tag. The file reference `@~/.claude/...` is an opaque runtime directive with no semantic label from §4's XML tag vocabulary.
- `<context>` is used correctly by name but contains only a `Glob:` instruction — not background information. It is actually an input-locating directive, which belongs in `<input>` or inside `<task>`.

The guide states (§4 Action 2): "When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag." The stub's tags are named for structural slots but not mapped to the guide vocabulary, weakening the signal these sections send to the model.

**What the guide requires:** `<task>`, `<context>`, `<input>` at minimum; the execution_context directive belongs as a `<system_note>` or embedded in `<task>` as an operational prerequisite.

---

### 2. No output format specification anywhere (§7 Output Format Handling, §22 Pattern 3)

**Severity: High**

Neither the stub nor the workflow defines a `<output_format>` block. The workflow's Step 5 shows a sample "Gap Closure Plan" in a markdown code fence — but that is an inline illustration, not a binding format specification.

The guide (§7, §22 Pattern 3) requires: "State the required output structure, field names, ordering, and an example before the model begins its task." The workflow produces user-facing output at Steps 5 and 10 but gives the model no format constraints for:

- The confirmation prompt presented to the user (Step 5)
- The roadmap entries written to ROADMAP.md (Step 6)
- The next-steps block at Step 10

The Step 10 template uses emojis (`✓`, `▶`) and runtime variable interpolation (`${PROJECT_CODE}`, `${PROJECT_TITLE}`) without declaring these as required variables in the stub's frontmatter. If those variables are not injected, the output degrades silently.

---

### 3. Negative instruction in Step 1 error message, and no tie-breaking rule (§5 Instruction Framing — Actions 1 and Tie-Breaking)

**Severity: Medium**

Step 1 tells the model to "error" on missing audit file, but does not specify whether to ask the user if they want to run the audit now, stop entirely, or try an alternative path. This is an untreated ambiguity boundary — exactly where §5's tie-breaking rule applies.

Additionally, the workflow's Step 3 grouping rules use qualitative scope language: "Keep phases focused: 2-4 tasks each." The guide (§21) is explicit: "Numbered limits beat qualitative descriptors." But 2-4 tasks is already numeric, so the gap is in the absence of a tie-breaking rule when a gap could logically belong to two groups (e.g., a gap that spans both auth and dashboard subsystems). The guide (§5, Tie-Breaking) requires an explicit rule that resolves exactly this kind of ambiguity.

---

### 4. No persona assigned for a task that benefits from role framing (§6 Persona Assignment)

**Severity: Low-Medium**

The task involves analytical judgment: prioritizing gaps by severity, clustering related items, and deciding which "nice" gaps to surface to the user. Per §6, "open-ended tasks that require a specific voice" benefit from a scoped persona. §22 Pattern 1 makes this concrete: "A narrower identity produces more consistent, domain-appropriate outputs than a broad one."

A planning specialist persona — e.g., "You are a milestone planning specialist. Your job is to translate audit gaps into the minimum set of executable phases that close them." — would bias the model toward tightly scoped phases and away from scope creep. Currently, the model defaults to generic assistant behavior for the prioritization step.

---

### 5. Task specification is incomplete on the stub (§1 Task Specification — Action 1)

**Severity: Medium**

The guide requires three components: (a) what output is requested, (b) why it matters, (c) what a correct/high-quality response looks like. The stub delivers (a) and (b) but not (c). There is no quality bar: no statement of what a good phase grouping looks like, what makes a phase "too broad" or "too narrow," or how to evaluate whether the gap closure plan is complete. The `<quality_bar>` tag from §1 Action 1 is entirely absent.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` with guide-standard `<task>` and add `<quality_bar>`

**Issue addressed:** §1 (missing quality bar), §4 (non-standard tag)

**Current:**
```xml
<objective>
Create all phases necessary to close gaps identified by `/gsd-audit-milestone`.

Reads MILESTONE-AUDIT.md, groups gaps into logical phases, creates phase entries in ROADMAP.md, and offers to plan each phase.

One command creates all fix phases — no manual `/gsd-add-phase` per gap.
</objective>
```

**Rewrite:**
```xml
<task>
Read the most recent MILESTONE-AUDIT.md, group its gaps into the minimum set of logical
phases needed to close them, add those phases to ROADMAP.md, and offer to plan each phase.

One command closes all audit gaps — no manual `/gsd-add-phase` per gap.
</task>

<quality_bar>
A correct output: (1) accounts for every gap in the audit — none dropped silently;
(2) produces phases narrow enough to execute in a single session (2–4 tasks each);
(3) preserves all existing ROADMAP.md phases unchanged;
(4) presents the plan to the user before writing any files.

A poor output: phases that bundle unrelated subsystems, phases with more than 5 tasks,
or roadmap writes that happen before user confirmation.
</quality_bar>
```

---

### Rewrite 2: Add `<output_format>` to the workflow's user-facing confirmation block (Step 5)

**Issue addressed:** §7 (missing output format), §22 Pattern 3

**Current:** Step 5 shows an informal markdown illustration inside a code fence with no binding status.

**Rewrite — add as a named block before Step 5 in the workflow:**
```xml
<output_format>
The confirmation plan presented to the user in Step 5 must follow this structure exactly:

## Gap Closure Plan

**Milestone:** {version}
**Gaps to close:** {N} requirements, {M} integration, {K} flows

### Proposed Phases

**Phase {number}: {Name}**
Closes: {list of REQ-IDs or gap descriptions, one per line, prefixed with `-`}
Tasks: {integer count}

{Repeat for each phase}

---

{If nice-to-have gaps exist:}
### Deferred (nice-to-have)
{list of deferred gap descriptions}

---

Create these {X} phases? Reply: **yes** / **adjust {phase name}** / **defer all optional**

Do not write to ROADMAP.md or create phase directories until the user replies "yes" or
an equivalent affirmative.
</output_format>
```

This converts the illustrative example into a binding format constraint and makes the confirmation gate explicit.

---

### Rewrite 3: Add tie-breaking rule for gap grouping and error path branching

**Issue addressed:** §5 (tie-breaking), §5 (conditional instructions)

**Current (Step 1 error):**
```
If no audit file exists or has no gaps, error:
No audit gaps found. Run `/gsd-audit-milestone` first.
```

**Rewrite — Step 1 error path:**
```xml
<scenario condition="no_audit_file_or_no_gaps">
  Inform the user:
  "No gaps found. Either no MILESTONE-AUDIT.md exists, or the last audit reported zero gaps."

  Then ask: "Run `/gsd-audit-milestone` now to generate one? (yes / no)"
  Wait for reply before proceeding.
</scenario>
```

**Add to Step 3 — gap grouping, after grouping rules:**
```xml
<tie_breaking>
When a gap could logically belong to two or more phase groups, assign it to the group
where fixing it is a prerequisite for the other group's work. If no dependency exists,
assign to the group with the highest-priority REQ-ID it satisfies.

When in doubt, create a smaller phase and leave the secondary gap separate — under-grouping
(more phases, each tighter) is preferable to over-grouping (fewer phases, each sprawling).
</tie_breaking>
```

---

## Checklist Against §23

| Checklist Item | Status |
|---|---|
| Intent, audience, and quality bar explicit | Intent: yes. Audience: implied (developer). Quality bar: **missing** |
| All constraints compatible | No explicit constraints to conflict |
| CoT appropriate | Not applicable (workflow, not reasoning task) |
| Prompt sections in semantically named XML tags | Partial — non-standard tag names used |
| Negative instructions converted to positive | Step 1 error path uses no negative framing; acceptable |
| Priority order explicit | Workflow Step 2 table covers must/should/nice — adequate |
| Tie-breaking rules present | **Missing** |
| Persona specific and scoped | **Missing** |
| Output format specified upfront | **Missing** |
| Machine-parsed output uses exact format | Step 6 (ROADMAP.md writes) not formally specified |
| Each instruction appears in exactly one location | Stub defers to workflow cleanly — no duplication |
| Tool permissions minimum-scoped | Yes |
| Conditional branching explicit | Step 1 has one branch; Step 2 has none for the "nice" confirmation path |
