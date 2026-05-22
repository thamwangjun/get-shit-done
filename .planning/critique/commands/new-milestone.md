# Critique: `commands/gsd/new-milestone.md`

Critiqued against: PROMPT_ENGINEERING_GUIDE_V09.md

---

## Strengths

**XML tag structure (§4 Formatting and Structure)**
The command uses semantically named XML tags — `<objective>`, `<execution_context>`, `<context>`, `<process>` — which aligns with §4's requirement to "wrap each [section] in a semantically named XML tag." This is strictly better than markdown headers alone.

**Context placement order (§8 Context Placement)**
The file leads with `<objective>` (the task instruction) and closes with `<process>` (the execution directive). This respects §8's action to place the instruction at the start. The `<context>` block with runtime variable injection (`$ARGUMENTS`) sits in the middle, consistent with §8's "background context in the middle" rule.

**Conditional handling of optional argument (§5 Instruction Framing)**
`$ARGUMENTS (optional - will prompt if not provided)` is a correctly formed conditional. It matches §5's conditional instruction pattern and eliminates silent failure when the argument is absent.

**`argument-hint` in frontmatter (§11 System vs. User Prompt Allocation)**
The frontmatter captures the command's identity, allowed tools, and call signature in one machine-readable location, consistent with §11's YAML frontmatter pattern for agent configuration.

---

## Weaknesses

### 1. No output format specification — the model has no quality bar (§7, §1, §22 Pattern 3)

The command describes *what* will be created (a list of files) but never specifies *how* those outputs should look. There is no `<output_format>` block, no field-level structure for the deliverables, and no example of what a high-quality milestone setup looks like.

§1 Action 1 requires three task components to be explicit: what output is requested, why it matters, and **what a correct or high-quality response looks like**. The third component is entirely absent.

§22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task."

The command delegates all format decisions to the referenced workflow file (`new-milestone.md`), which means the quality bar is hidden inside an external file rather than stated where the model reads it. A reviewer or a future prompt engineer reading only this command file cannot assess what success looks like.

### 2. `<process>` is a negative-framed delegation, not a positive instruction (§5 Instruction Framing)

The `<process>` block reads:

> Execute the new-milestone workflow from @~/.claude/get-shit-done/workflows/new-milestone.md end-to-end.
> Preserve all workflow gates (validation, questioning, research, requirements, roadmap approval, commits).

"Preserve all workflow gates" is not a positive instruction — it is an implicit "do not skip workflow gates." §5 Action 1 requires converting negative instructions to positive equivalents. More critically, "execute end-to-end" with no named steps is a blank-cheque delegation. The instruction gives no decision criteria for when a gate is passed, when to halt for user input, or what constitutes a successful phase transition.

### 3. No persona (§6 Persona Assignment) and no audience specification (§1 Action 2)

The guide requires that the audience be encoded explicitly: "their domain knowledge, vocabulary level, and any relevant assumptions they bring" (§1 Action 2). The command assumes the executing agent knows the user is a developer with an existing project, but this is never stated. If the model defaults to generic assistant behavior rather than a domain-aware planning specialist, output quality degrades unpredictably.

§6 Action 1 establishes that a persona is warranted for "open-ended, stylistic, or [tasks requiring] a specific voice." Milestone planning — which involves eliciting requirements, making scope decisions, and guiding a questioning process — benefits from a constrained identity (e.g., a planning specialist who drives toward concrete deliverables). None is provided.

### 4. `<objective>` contains markdown formatting inside an XML block (§4 Formatting and Structure)

The `<objective>` block mixes markdown bold (`**Creates/Updates:**`) and a bullet list inside an XML-tagged section. §4 Action 2 calls for using XML tag names to carry semantic meaning. The "Creates/Updates" section would be more precisely expressed as a nested `<output_format>` or `<deliverables>` tag, making machine parsing reliable and the structure unambiguous. As written, the bold/bullets are cosmetic — they can't be reliably parsed or toggled.

---

## Specific Rewrites

### Rewrite 1: Replace `<process>` with a positive, step-enumerated execution block

**Current:**
```xml
<process>
Execute the new-milestone workflow from @~/.claude/get-shit-done/workflows/new-milestone.md end-to-end.
Preserve all workflow gates (validation, questioning, research, requirements, roadmap approval, commits).
</process>
```

**Rewrite:**
```xml
<process>
Run the new-milestone workflow from @~/.claude/get-shit-done/workflows/new-milestone.md.
Complete each gate in order before advancing to the next:

1. Questioning — gather milestone goals via the questioning protocol; confirm with user before proceeding
2. Research (conditional) — run only when the milestone introduces a feature domain not present in the existing codebase
3. Requirements — produce REQUIREMENTS.md scoped to this milestone; present for approval before continuing
4. Roadmap — produce ROADMAP.md continuing from the last phase number; present for approval before committing
5. Commit — write all updated files and commit with a message scoped to the milestone name

At each gate: if user input is required and not received, halt and use AskUserQuestion. Do not advance past an unapproved gate.
</process>
```

This converts "preserve all workflow gates" into a positive, ordered list of named steps with explicit halt conditions — satisfying §5 Action 1 and §16's phase pattern.

---

### Rewrite 2: Add `<output_format>` and `<quality_bar>` blocks

**Insert after `<context>`:**
```xml
<output_format>
Produce these files in order. Each must be written before the next phase begins.

1. `.planning/PROJECT.md` — append a new milestone section with: name, goals (3–7 bullet points), and success criteria. Preserve all prior milestone history unchanged.
2. `.planning/REQUIREMENTS.md` — requirements scoped to this milestone only. Sections: Functional Requirements, Non-Functional Requirements, Out of Scope.
3. `.planning/ROADMAP.md` — phase list continuing from the last used phase number. Each phase entry: number, name, description (1–2 sentences), estimated complexity (S/M/L).
4. `.planning/STATE.md` — reset to blank template for the new milestone.
</output_format>

<quality_bar>
A high-quality milestone setup: goals are specific enough to scope a ROADMAP phase, requirements are testable (each has a pass/fail condition), and the phase list is sequenced with no circular dependencies. Reject outputs that list goals as abstract themes (e.g., "improve UX") without concrete deliverables.
</quality_bar>
```

This satisfies §1 Action 1 (quality bar explicit), §7 (output format specified upfront), and §22 Pattern 3.

---

### Rewrite 3: Add `<persona>` and `<audience>` blocks

**Insert at the top, before `<objective>`:**
```xml
<persona>
You are a milestone planning specialist for software projects. Your role is to drive
ambiguous "what's next" input into a concrete, scoped milestone plan — goals, requirements,
and a sequenced phase roadmap — ready for execution. You ask clarifying questions until
deliverables are specific and testable. You do not proceed past a gate until the user
has approved the output.
</persona>

<audience>
A software developer with an existing project. They understand their codebase and domain.
Assume technical vocabulary is appropriate. They may have only a rough idea of what the
next milestone should accomplish — your job is to sharpen that.
</audience>
```

This satisfies §6 Action 2 (specific persona constraining voice and decision-making style) and §1 Action 2 (audience with domain knowledge and vocabulary level encoded).

---

## Overall Verdict

**Needs Work**

The command's structure is sound: it uses XML tags correctly, places context in the right positions, and handles the optional argument cleanly. However, it delegates almost all behavioral specificity to an external workflow file, which means the prompt as a standalone artifact carries almost no quality bar, no output format, no persona, and no step-level execution guidance. A model executing this command has correct intent but no calibration. The three rewrites above are the minimum required to make the command self-sufficient against the guide's checklist.
