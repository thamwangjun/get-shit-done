# Critique: `commands/gsd/undo.md`

**File reviewed:** `commands/gsd/undo.md`
**Workflow reviewed:** `~/.claude/get-shit-done/workflows/undo.md` (the delegate target)
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Date:** 2026-04-30

---

## Strengths

### §4 Formatting and Structure — XML tags used for sectioning
The command file correctly separates concerns into semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`). This follows §4 Action 2's requirement that "each distinct section [be] wrapped in a semantically named XML tag." The tag choice is meaningful — `<execution_context>` clearly names what it contains rather than using a generic delimiter.

### §8 Context Placement — Task instruction leads; arguments close the prompt
`<objective>` appears first (high attention position) and `<context>$ARGUMENTS</context>` appears last. This correctly implements §8's rule: "place the task instruction at the very start" and "place the primary document or input at the very end." The pattern is sound.

### §11 System vs. User Prompt Allocation — Frontmatter encodes agent configuration
The YAML frontmatter encodes `name`, `description`, `argument-hint`, and `allowed-tools` in a machine-readable block, consistent with §11's YAML frontmatter pattern. The `allowed-tools` list (`Read`, `Bash`, `Glob`, `Grep`, `AskUserQuestion`) follows §22 Pattern 9's principle of scoping tool permissions to the minimum required — notably, `Write` and `Edit` are excluded, which is appropriate for a revert-only command.

### §16 Multi-Phase Workflows — Workflow file uses explicit named steps
The delegate file (`workflows/undo.md`) uses `<step name="...">` tags to organise `banner → parse_arguments → gather_commits → check_dependencies → confirm_revert → execute_revert → summary`. This is consistent with §16's phase pattern ("phases create cognitive boundaries; the model completes one phase fully before beginning the next"), transposed to steps.

### §14 Constraint Enforcement — Hard constraint stated for destructive operation
The workflow enforces `git revert --no-commit` with a capitalised HARD CONSTRAINT label and explicitly documents the limited scope of `git reset`. Pairing the restriction with what IS permitted ("reserve git reset exclusively for conflict cleanup") follows §14's explicit permission pair pattern.

---

## Weaknesses

### Issue 1 — §1 Task Specification: No quality bar or audience; delegate is opaque (Critical)

The command file contains no `<quality_bar>` and no `<audience>` tag. §1 Action 1 requires all three task components to be explicit: (a) what output is requested, (b) why it matters, and (c) what a correct/high-quality response looks like. §1 Action 2 requires audience to be encoded explicitly.

More critically, the `<process>` block reduces entirely to a single sentence:

> "Execute the undo workflow from `@~/.claude/get-shit-done/workflows/undo.md` end-to-end."

This is a delegation stub, not a prompt. The command file provides no standalone specification. If the referenced file is missing, unavailable, or only partially loaded, the model has no fallback information about what it should do. The file conflates two distinct concerns — the command entry point and the workflow spec — without acknowledging the dependency.

§19 (Modularity and Composition) requires each module to be "independently understandable." This module is not: it is entirely dependent on an external file it cannot be evaluated without.

### Issue 2 — §5 Instruction Framing: No conditional branching at the entry point; no tie-breaking (Moderate)

The `$ARGUMENTS` context contains the mode flags (`--last N`, `--phase NN`, `--plan NN-MM`), but the command file itself specifies no conditional logic for when arguments are missing or malformed. §5 ("Conditional instructions — when behavior depends on context, use explicit conditional branching") requires this to be expressed at the point of invocation, not buried three levels deep in a separate workflow file.

The `<objective>` describes three modes in bold prose, but provides no default-case rule. What should happen if `$ARGUMENTS` is empty? The command file is silent; the behavior is only defined in the delegate workflow. This creates an implicit dependency on context the command file does not expose.

### Issue 3 — §4 Formatting: `<objective>` and `<purpose>` duplication across files; non-standard tag naming (Minor-to-Moderate)

The command file uses `<objective>`, but the guide's §4 XML tag vocabulary specifies `<task>` as the canonical top-level instruction tag ("Primary instruction: what the model must do"). `<purpose>` appears in the workflow file doing the same job. Both are non-standard against the guide's vocabulary, which defines `<task>`, `<context>`, `<input>`, `<output_format>`, and `<constraints>` as the canonical set. `<objective>` and `<purpose>` are not in the guide's tag table, reducing interoperability with other modules and parsers that expect the standard vocabulary.

Additionally, the workflow file contains both `<task>` and `<purpose>` blocks that say nearly the same thing:

- `<task>`: "Safe git revert workflow — roll back GSD phase or plan commits with dependency checks and a confirmation gate."
- `<purpose>`: "Safe git revert workflow. Rolls back GSD phase or plan commits using the phase manifest with dependency checks and a confirmation gate. Uses git revert --no-commit to preserve history; git reset is out of scope."

§11 Action 3 states "each instruction appears in exactly one location." This duplication is a direct violation.

---

## Specific Rewrites

### Rewrite 1 — Add quality bar and fallback to the command entry point (fixes Issue 1)

Replace the current thin `<process>` block with a minimal inline specification that is independently understandable, and add a `<quality_bar>`:

```markdown
<task>
Safe git revert — roll back GSD phase or plan commits with dependency checks and a
single confirmation gate before execution.

Three modes:
- `--last N`: Show last N GSD commits for interactive selection
- `--phase NN`: Revert all commits for a phase using the phase manifest
- `--plan NN-MM`: Revert all commits for a specific plan

The full step-by-step workflow is in @~/.claude/get-shit-done/workflows/undo.md.
Execute it end-to-end, following each step in order.
</task>

<quality_bar>
A correct run:
1. Parses arguments and identifies the revert target
2. Warns on downstream dependency conflicts before asking for confirmation
3. Obtains explicit user approval before any git revert is executed
4. Uses `git revert --no-commit` for all reversals; never uses `git reset --hard`
5. Creates a single consolidating revert commit with the user's stated reason
6. Displays a completion summary with the revert commit hash
</quality_bar>

<context>
$ARGUMENTS
</context>
```

This change makes the command independently legible. A reader (or model) can understand what success looks like without reading the workflow file.

### Rewrite 2 — Add argument-absent conditional at the entry point (fixes Issue 2)

Add explicit conditional framing immediately after the `<task>` block:

```markdown
<constraints>
If `$ARGUMENTS` is empty or does not match `--last N`, `--phase NN`, or `--plan NN-MM`,
display usage and exit before loading the workflow:

  Usage: /gsd-undo --last N | --phase NN | --plan NN-MM

Do not proceed to workflow execution if the arguments are invalid.
</constraints>
```

This follows §5's conditional instruction pattern: "when behavior depends on context, use explicit conditional branching." It also reduces unnecessary workflow-file loading on bad invocations.

### Rewrite 3 — Normalise tag naming and eliminate the `<purpose>` duplicate (fixes Issue 3)

In the command file, rename `<objective>` → `<task>` to use the guide's canonical vocabulary (§4, XML tag vocabulary table). In the workflow file, delete the `<purpose>` block entirely — its content is already captured by `<task>` and, after Rewrite 1, by the command file's `<quality_bar>`. The `<required_reading>` block in the workflow file also duplicates references already declared in the command file's `<execution_context>`. One of the two should be the single source; the workflow's `<required_reading>` should be removed since the command file is the entry point that controls loading.

---

## Overall Verdict

**Needs Work**

The command file is structurally sound at a surface level — XML tags, correct context placement, appropriate tool scoping — but it functions as a nearly empty delegation stub. Its `<process>` block contains a single sentence. The file is not independently understandable (violating §19), provides no quality bar (violating §1), and expresses no conditional branching for the most common failure mode — missing arguments (violating §5). The non-standard `<objective>` tag and the `<purpose>`/`<task>` duplication in the workflow are secondary but real problems per §4 and §11. All three issues have clear, low-effort fixes.
