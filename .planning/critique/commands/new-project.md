# Critique: `commands/gsd/new-project.md`

**Reviewed against:** Prompt Engineering Guide V09
**Date:** 2026-04-30
**Overall Verdict:** Needs Work

---

## Strengths

### 1. Frontmatter as agent configuration (§11, §17)

The YAML frontmatter correctly encodes identity (`name`, `description`), argument hints, and tool permissions (`allowed-tools`). This matches the guide's pattern for self-contained agent configuration (§11 — YAML frontmatter as agent configuration; §17 — subagent configuration in frontmatter). The tool list is explicit and minimal, which aligns with §22 Pattern 9 (tool permissions scoped to minimum required patterns).

### 2. Sections use named XML tags (§4)

The command uses named XML tags (`<context>`, `<objective>`, `<execution_context>`, `<process>`, `<runtime_note>`) rather than raw markdown headers or `---` delimiters. This is structurally compliant with §4 Action 2, which requires semantically named XML tags to separate prompt sections.

### 3. Concrete output artifacts enumerated (§1, §7)

The `<objective>` block lists the exact files the command creates. This partially satisfies §1 Action 1 (c) — what a correct response looks like — and §22 Pattern 3 (output format specified completely and upfront). The artifact list gives the model a concrete completion target.

---

## Weaknesses

### 1. Task instruction is buried; context leads instead (§8 Action 1)

The very first content block after frontmatter is `<runtime_note>` (a Copilot compatibility shim), followed by `<context>` (flag documentation). The actual task — `<objective>` — appears third. The guide is unambiguous: **the task instruction must appear at the very start of the prompt** (§8 Action 1). Middle-position content receives the least model attention. Placing the Copilot compatibility note and flag glossary before the task instruction structurally degrades the prompt's primary directive.

The `<process>` block — which contains the actual execution instruction — appears last, after `<execution_context>`, compounding the inversion. By §8 Action 2, the primary content the model must act on should close the prompt; a two-word delegation (`Execute the new-project workflow…`) is not that content.

### 2. The core task is a delegation stub, not a specification (§1, §4 Action 1, §22 Pattern 3)

The entire behavioral specification is outsourced via `@` file references in `<execution_context>`. The `<process>` block contains only 2 sentences:

> Execute the new-project workflow from `@~/.claude/get-shit-done/workflows/new-project.md` end-to-end.  
> Preserve all workflow gates (validation, approvals, commits, routing).

This violates §1 Action 1 at the command level: there is no inline specification of (a) what output is requested beyond file names, (b) why it matters, or (c) what a correct response looks like. There is no `<quality_bar>` tag. There is no `<audience>` tag. The guide requires these to be explicit in the prompt itself (§4 Action 1: "Write a clear, complete instruction in plain prose first"). A command file that is purely a pointer to another file provides no standalone legibility — it cannot be reviewed, tested, or composed in isolation.

The `--auto` flag is documented in `<context>` but there is no conditional branch instruction in the command itself specifying what changes when `--auto` is set. The reader is told the flag exists but not what it controls at the command level. §5 requires explicit conditional branching when behavior depends on context.

### 3. No output format specification and no quality bar (§7, §22 Pattern 3)

There is no `<output_format>` tag. The command creates 6 named files but provides no specification of the format, required fields, depth, or success criteria for any of them beyond their filenames. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task." §1 Action 1 requires a quality bar. Neither is present.

The `<objective>` lists what files are created; it does not specify what makes any of those files correct or complete. For a command that bootstraps an entire project, this omission is high-impact: the model has no in-prompt signal to distinguish a high-quality `PROJECT.md` from a minimal one, or a complete `ROADMAP.md` from a skeleton.

### 4. Negative instruction not converted (§5 Action 1)

The `<runtime_note>` block says: "They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API." This is a parenthetical clarification, not a negative instruction per se — but the `<process>` block uses `"Preserve all workflow gates"` as a constraint without stating what those gates are or what violating them looks like. §5 Action 1 requires positive specification of desired behavior; "Preserve X" without defining X is a negatively-framed constraint with no actionable positive equivalent.

---

## Specific Rewrites

### Rewrite 1 — Fix context placement: move `<objective>` to lead (§8)

**Current order:**
1. `<runtime_note>` (Copilot compatibility)
2. `<context>` (flag documentation)
3. `<objective>` (task + artifact list)
4. `<execution_context>` (@ references)
5. `<process>` (2-sentence delegation)

**Recommended order:**
1. `<objective>` — the primary task directive, leading
2. `<context>` — flags and runtime conditions, middle
3. `<execution_context>` — reference files, middle
4. `<process>` — execution instruction, closing
5. `<runtime_note>` — platform shim, last (or remove to a `<system_note>` tag)

The `<runtime_note>` should be wrapped in a `<system_note>` tag per §8 (meta-instruction injection) and moved to the end so it does not displace the task instruction from the high-attention lead position.

---

### Rewrite 2 — Add `<output_format>` and `<quality_bar>` with inline specifications (§1, §7, §22 Pattern 3)

The current `<objective>` block lists file names. It should be extended with a `<quality_bar>` and `<output_format>` that define what good output looks like for each artifact. Example:

```xml
<quality_bar>
A correct run of this command produces all six planning artifacts with the following
minimum completeness:

- PROJECT.md: contains project name, one-paragraph summary, primary user, and 3–5
  success criteria stated as measurable outcomes
- REQUIREMENTS.md: requirements are grouped by must-have vs. nice-to-have; each
  requirement is a single testable statement
- ROADMAP.md: phases are numbered sequentially; each phase has a name, one-sentence
  goal, and a list of deliverables
- STATE.md: records the project name, creation date, and current phase (Phase 0)
- config.json: valid JSON; all workflow toggle keys present

A run is incomplete if any artifact is missing or contains only placeholder text.
</quality_bar>
```

This converts implicit quality judgment into an explicit, checkable specification.

---

### Rewrite 3 — Make `--auto` a conditional branch with explicit behavioral difference (§5)

The `--auto` flag is documented but not wired to behavior at the command level. The `<context>` block should become an explicit conditional:

```xml
<context>
<flags>
  --auto: Automatic mode. Skip interactive approval gates after the initial config
  questions. Proceed directly through research → requirements → roadmap without
  pausing for user confirmation at intermediate steps. Requires an idea document
  supplied via @ reference in the invocation.
</flags>

<conditional>
If --auto is NOT set: pause after each major phase (research, requirements, roadmap)
and confirm with the user before proceeding to the next.

If --auto IS set: run all phases sequentially without pausing. Surface a final
summary only after all artifacts are written.
</conditional>
</context>
```

This satisfies §5's requirement for explicit conditional branching and removes the ambiguity about what "without further interaction" means in practice.

---

## Overall Verdict: Needs Work

The command is structurally well-formed — it uses XML tags, scoped tool permissions, and explicit artifact enumeration — but it is primarily a dispatch stub rather than a prompt. The critical mass of behavioral specification lives in externally referenced workflow files. As a result, the command file itself fails the guide's requirements for standalone legibility (§1), context placement (§8), output format specification (§7, §22 Pattern 3), and conditional framing (§5). These are not cosmetic issues: a reviewer, optimizer, or second AI cannot evaluate or improve this command without loading five external files. Addressing the three rewrites above would bring it to Adequate.
