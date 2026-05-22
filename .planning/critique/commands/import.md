# Prompt Critique: `commands/gsd/import.md`

**File under review:** `/home/thamw/development/happier/get-shit-done/commands/gsd/import.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Date:** 2026-04-30
**Verdict:** Needs Work

---

## Strengths

### 1. XML tag structure is present (§4 Formatting and Structure)

The file uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) to separate prompt sections. This is directionally correct per §4 Action 2, which requires XML tags rather than markdown headers or `---` delimiters for Claude-class models.

### 2. Frontmatter encodes agent configuration (§11 System vs. User Prompt Allocation)

The YAML frontmatter specifies `name`, `description`, `argument-hint`, and `allowed-tools`. This aligns with §11's YAML frontmatter pattern for encapsulating persistent agent properties in a machine-readable location.

### 3. Tool permissions scoped to named tools (§22 Pattern 9)

`allowed-tools` lists specific tools (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `AskUserQuestion`, `Task`) rather than granting open-ended access. This is consistent with Pattern 9's principle of minimum required permissions.

---

## Weaknesses

### 1. The `<process>` block is a content-free placeholder (§1 Task Specification, §5 Instruction Framing)

**The most critical flaw.** The only instruction in `<process>` is:

```
Execute the import workflow end-to-end.
```

This violates §1 Action 1 entirely: it specifies no output, no quality bar, and no success criteria. It is a delegation stub, not a prompt. Per §5 Action 1, instructions must be stated as positive specifications of desired behavior — but there is no behavior specified at all. The model is expected to infer everything from the externally `@`-referenced workflow file, making this command file effectively a launcher script with no self-contained semantic content.

§17 (Self-contained agent prompts) is directly relevant: "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable." While the `@` includes are a framework mechanism, they mean this file cannot be read, evaluated, or understood without resolving external paths that may not be available at critique time.

### 2. No output format specification (§7 Output Format Handling, §22 Pattern 3)

There is no `<output_format>` block anywhere in the file. The guide's §7 and Pattern 3 both require that output structure, fields, and constraints be stated upfront. For an import command that produces a GSD PLAN.md and runs a validator, the caller needs to know: what does a successful import look like in the response? What does a conflict report look like? What is reported on dry-run? None of this is specified.

### 3. The `<objective>` tag uses non-standard vocabulary and mixes description with constraint (§4 Formatting, §1 Task Specification)

The guide's XML tag vocabulary (§4) defines `<task>` as the canonical tag for "primary instruction: what the model must do." The tag `<objective>` is not in the vocabulary table. More importantly, the `<objective>` block conflates three distinct things:
- A task description (import external plan files)
- A mode flag specification (`--from`)
- A roadmap note ("Future: `--prd` mode is planned for a follow-up PR")

Per §1 Action 3, constraints must be audited for consistency and the quality bar made explicit. The roadmap note is not a constraint, not an instruction, and not context — it is noise that consumes tokens with no behavioral value (§10 Action 1: remove content that does not contribute to the task).

### 4. No conflict-detection behavior is specified in the prompt body (§14 Constraint Enforcement)

The `description` frontmatter says "conflict detection against project decisions" is a core function, but the body of the prompt contains zero instructions about how conflicts should be detected, reported, classified, or resolved. §14 (Explicit permission pairs, Precedents) requires that behavioral rules be stated in the prompt. There are no tie-breaking rules (§5) for what happens when a conflict is found — should the import abort? Warn and continue? Ask the user? The model must guess.

---

## Specific Rewrites

### Rewrite 1: Replace the vacuous `<process>` block with inline behavioral specification

**Current:**
```xml
<process>
Execute the import workflow end-to-end.
</process>
```

**Suggested replacement** (inline, so the file is readable without resolving external references):
```xml
<task>
Import an external plan file into the GSD planning system.

Steps:
1. Read the file at the path provided in `--from`.
2. Read PROJECT.md to extract all recorded decisions and constraints.
3. Detect conflicts: flag any section of the imported plan that contradicts a PROJECT.md decision.
4. If conflicts exist: report each conflict as `CONFLICT: <decision> ↔ <imported claim>` and ask the user to resolve before writing.
5. If no conflicts: write the imported plan as a GSD PLAN.md in the appropriate phase directory.
6. Run gsd-plan-checker on the written file and report its output.
</task>
```

This satisfies §1 Action 1 (what, why, quality bar), §5 Action 1 (positive framing), and §14 (conflict behavior specified, not assumed).

### Rewrite 2: Add a minimal `<output_format>` block

Per §7 and Pattern 3, the response structure must be stated before the model begins. The current file has none.

**Add after `<task>`:**
```xml
<output_format>
Report the import result in three sections:

**Conflicts** (if any): List as `CONFLICT: <PROJECT.md decision> ↔ <plan claim>`. One conflict per line. If none, write "No conflicts detected."

**Written file**: Absolute path to the PLAN.md written, or "Not written — conflicts require resolution."

**Validator output**: Paste the gsd-plan-checker result verbatim.
</output_format>
```

This satisfies §7 Action 1, §22 Pattern 3 (output format specified upfront), and §21 (numeric/structural constraints over qualitative ones).

### Rewrite 3: Remove the roadmap note and replace `<objective>` with `<task>` + `<context>`

**Current:**
```xml
<objective>
Import external plan files into the GSD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as GSD PLAN.md, validate via gsd-plan-checker.

Future: `--prd` mode for PRD extraction is planned for a follow-up PR.
</objective>
```

**Suggested:**
```xml
<task>
Import an external plan file into the GSD planning system with conflict detection against PROJECT.md decisions.
</task>

<context>
Argument `--from <filepath>`: path to the external plan file to import.
Supported mode: `--from` only. PRD extraction (`--prd`) is not yet implemented — if the user passes `--prd`, inform them it is not available and stop.
</context>
```

This: uses the canonical `<task>` tag (§4), moves the mode note into `<context>` where it belongs (§8), converts the roadmap item into a runtime instruction the model can actually act on (§5 Action 1), and removes the token-wasting future-plans note (§10 Action 1).

---

## Overall Verdict: Needs Work

The file functions as a launcher that defers all real instruction content to external `@`-included files. As a standalone prompt evaluated against the guide, it fails at the most fundamental level: §1 Task Specification. The `<process>` block contains a single sentence that specifies no output, no behavior, no quality bar, and no error handling. The conflict-detection capability advertised in the frontmatter description is entirely absent from the prompt body. There is no `<output_format>` block. The `<objective>` tag is non-standard and mixes task, constraint, and roadmap noise.

The structural skeleton (XML tags, YAML frontmatter, scoped tool list) is sound — these are the right patterns. The problem is that the prompt body is nearly empty. The three rewrites above would bring it to an adequate baseline by making the command self-contained, specifying conflict-handling behavior, and declaring output structure.
