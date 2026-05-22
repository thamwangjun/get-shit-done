# Critique: `commands/gsd/sketch-wrap-up.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Verdict:** Adequate

---

## Overview

The command file (`sketch-wrap-up.md`) is a thin dispatch stub: it sets the frontmatter, declares an objective, points at the real workflow via `@~/.claude/get-shit-done/workflows/sketch-wrap-up.md`, and adds a Copilot runtime note. The substantive prompt logic lives in the referenced workflow file. This critique covers both layers, because the command file controls framing, tool permissions, and context injection — the parts a caller model sees first.

---

## Strengths

### 1. Frontmatter tool permissions follow §22 Pattern 9 (minimum required patterns)

The `allowed-tools` list is explicit and narrow:

```yaml
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
```

This matches the guide's Pattern 9 principle: permissions are enumerated, not granted wholesale. The absence of `Agent`, `TodoWrite`, or other high-blast-radius tools is a conscious, correct constraint for a curation-then-write workflow.

### 2. `<objective>` states what, where, and why — partially satisfying §1 Action 1

The objective block names all three components the guide requires: the output (a persistent skill), the downstream use case (auto-loaded during UI builds), and the write locations (`.planning/sketches/` and `./.claude/skills/`). This is stronger than most stub commands, which omit the "why it matters" clause.

### 3. Conditional runtime handling for Copilot satisfies §5 conditional instruction pattern

The `<runtime_note>` block:

```
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`.
```

This is a correct conditional instruction (§5 "Conditional instructions"). It handles a known environment fork without cluttering the main workflow path.

### 4. Workflow file: step names create cognitive phase boundaries (§16 phase pattern)

The workflow uses `<step name="...">` throughout (`gather`, `curate`, `group`, `synthesize`, `write_skill`, etc.). While not using the guide's `<phase id="..." name="..." trigger="...">` syntax exactly, the named steps function as the cognitive boundaries §16 prescribes and ensure the model completes each stage before the next.

### 5. Workflow file: output format is specified completely per §22 Pattern 3

Each output artifact (`SKILL.md`, reference files, `WRAP-UP-SUMMARY.md`) is specified with a literal markdown template showing field names and example values. This matches §7 and Pattern 3: "state the required output structure, field names, ordering, and an example before the model begins its task."

---

## Weaknesses

### Weakness 1: The command file has no `<task>` instruction — violates §4 Action 2 and §8 Action 1

**Guide reference:** §4 Action 2 ("Use XML tags to separate prompt sections"), §8 Action 1 ("Place the task instruction at the very start of the prompt").

The command file opens with `<objective>`, not `<task>`. The guide is explicit: the primary instruction belongs in a `<task>` tag at the top of the prompt. `<objective>` is not in the guide's tag vocabulary (see §4 XML tag vocabulary table). This means the tag carries no semantic signal for Claude-class models — the model cannot distinguish "this is the task instruction" from "this is context."

Additionally, `<execution_context>` is a non-standard tag (the guide's vocabulary has `<context>` with runtime sub-tags like `<git_status>`, `<log_path>` — not `<execution_context>`). The file reference injection via `@` notation is framework-specific and not explained or guarded.

**Impact:** The model receives the primary instruction inside an ambiguous, non-standard tag at a non-leading position. The workflow delegation ("Execute the sketch-wrap-up workflow... end-to-end") is buried mid-file rather than leading the prompt.

---

### Weakness 2: No audience or quality bar — violates §1 Actions 1–2

**Guide reference:** §1 Action 1 ("Extract the three task components"), §1 Action 2 ("Identify the audience"), §23 checklist item "Intent, audience, and quality bar are all explicit in the prompt."

The command encodes *what* to do and *where* to write, but neither who invokes this command (a developer wrapping up a sketch session) nor what a high-quality output looks like (what makes a reference file good vs. poor, what makes a curation decision well-reasoned). Without a `<quality_bar>`, the model has no criterion for distinguishing a thorough reference file from a thin one. Without an `<audience>` tag, the model cannot calibrate its curation questions or output vocabulary to the developer's context.

**Impact:** Output quality is left entirely to the workflow file's structural scaffolding. When judgment calls arise (e.g., partial inclusion, grouping decisions), the model has no stated bar to calibrate against.

---

### Weakness 3: Workflow file uses several negative instructions — violates §5 Action 1

**Guide reference:** §5 Action 1 ("Convert negative instructions to positive equivalents").

The workflow file contains:

- `Exclude node_modules, build artifacts, .DS_Store` (in `copy_sources` step)
- `What to Avoid` section header in the reference file template
- `Excluded Sketches` table in `write_summary`

The guide requires scanning for negated instructions and rewriting them as positive specifications. "Exclude node_modules" should be rewritten as "Copy only: winning variant HTML, theme.css, and assets directly referenced by the HTML." "What to Avoid" should be "Rejected Directions: design paths tried and discarded, with reasons." These are not just stylistic — the guide states this is a mechanical conversion that must be applied before emission.

The `copy_sources` step is the most egregious: it specifies what not to copy rather than what to copy, which is both a §5 violation and a potential source of ambiguity (what counts as a "build artifact" in a sketch context is not obvious).

---

## Specific Rewrites

### Rewrite 1: Restructure the command file to open with `<task>` (fixes Weakness 1)

**Current:**
```xml
<objective>
Curate sketch design findings and package them into a persistent project skill that Claude
auto-loads when building the real UI. Also writes a summary to `.planning/sketches/` for
project history. Output skill goes to `./.claude/skills/sketch-findings-[project]/` (project-local).
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/sketch-wrap-up.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

...

<process>
Execute the sketch-wrap-up workflow from @~/.claude/get-shit-done/workflows/sketch-wrap-up.md end-to-end.
Preserve all curation gates (per-sketch review, grouping approval, CLAUDE.md routing line).
</process>
```

**Rewrite:**
```xml
<task>
Execute the sketch wrap-up workflow end-to-end. Curate all unprocessed sketch design
findings, group them by design area, and package them into a persistent project skill
at `./.claude/skills/sketch-findings-[project]/` that Claude auto-loads during UI
implementation. Write a project history summary to `.planning/sketches/WRAP-UP-SUMMARY.md`.
Preserve all curation gates: per-sketch review, grouping approval, and CLAUDE.md routing line.
</task>

<context>
  @~/.claude/get-shit-done/workflows/sketch-wrap-up.md
  @~/.claude/get-shit-done/references/ui-brand.md
</context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`.
</runtime_note>
```

This puts the primary directive in the correct tag (`<task>`) at the leading position (§8 Action 1), replaces `<execution_context>` with the standard `<context>` tag (§4 XML vocabulary), and removes the redundant `<objective>` block since its content is now in `<task>`.

---

### Rewrite 2: Add `<audience>` and `<quality_bar>` to the command file (fixes Weakness 2)

Insert after `<task>`, before `<context>`:

```xml
<audience>
A developer who has run one or more `/gsd-sketch` sessions and is ready to lock in design
decisions before building the real UI. They understand the sketch artifacts and can evaluate
design trade-offs. They expect curation to be interactive, not automatic.
</audience>

<quality_bar>
A high-quality wrap-up produces reference files that a developer can read cold — without
access to the original sketches — and make correct implementation decisions. Each reference
file must include: the exact visual properties chosen (hex values, px values, named tokens),
the rationale for rejecting alternatives, and working CSS/HTML snippets. A reference that
says "use blue" without a hex value fails this bar.
</quality_bar>
```

This satisfies §1 Action 1 (all three task components explicit), §1 Action 2 (audience encoded), and the §23 checklist item "Intent, audience, and quality bar are all explicit."

---

### Rewrite 3: Convert the `copy_sources` exclusion list to a positive include list (fixes Weakness 3)

**Current (workflow file, `copy_sources` step):**
```
1. Copy the winning variant's HTML file (or the full index.html with all variants) into `sources/NNN-sketch-name/`
2. Copy the winning theme.css into `sources/themes/`
3. Exclude node_modules, build artifacts, .DS_Store
```

**Rewrite:**
```
For each included sketch, copy exactly these files into `sources/NNN-sketch-name/`:
1. The winning variant's HTML file (or full index.html when no single winner was selected)
2. Any CSS files directly linked by that HTML
3. Any image or font assets directly referenced by that HTML

Copy the winning theme.css into `sources/themes/`.

Stop at direct references: assets required only transitively by build tooling stay behind.
```

This converts the exclusion logic to a positive include-by-reference rule (§5 Action 1), which is unambiguous regardless of how the sketch directory is structured. "Build artifacts" and "node_modules" are subsumed by "direct references only" without needing to enumerate them.

---

## Overall Verdict

**Adequate.**

The command file is a functional dispatch stub and the referenced workflow is genuinely well-structured for a multi-step interactive curation task. The workflow's step-named phases, complete output templates, and interactive curation gates are solid. However, the command file violates three foundational guide requirements — standard tag vocabulary (§4), leading task placement (§8), and audience/quality-bar specification (§1) — that are straightforward to fix. The negative instruction violations in the workflow (§5) are a lower-priority cleanup. None of the issues cause the command to fail outright; they degrade precision and model calibration at the margin, which in a curation-heavy interactive workflow is where quality actually lives.

Priority order for fixes: Rewrite 1 (structural, zero-cost) → Rewrite 2 (adds missing §1 components) → Rewrite 3 (§5 mechanical conversion in workflow file).
