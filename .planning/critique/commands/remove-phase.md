# Critique: `commands/gsd/remove-phase.md`

Evaluated against: Prompt Engineering Guide V09

---

## Strengths

### XML tags used for top-level structure (§4 Formatting)

The command uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` tags to divide sections rather than markdown headers or bare delimiters. This aligns with §4 Action 2's requirement that sections be wrapped in semantically named XML tags. The tag names carry meaning (`<objective>` is clearly not `<context>`), and the structure is machine-parseable.

### Objective block covers purpose and output (§1 Task Specification)

The `<objective>` block explicitly states purpose ("Clean removal of work you've decided not to do") and output ("Phase deleted, all subsequent phases renumbered, git commit as historical record"). This partially satisfies §1 Action 1's requirement to make explicit what output is being requested and why it matters.

### Frontmatter encodes agent configuration (§11 System vs. User Prompt Allocation)

The YAML frontmatter captures `name`, `description`, `argument-hint`, and `allowed-tools` in a single, machine-readable location. This follows the §11 YAML frontmatter pattern for encoding identity, trigger conditions, and tool permissions in one place.

### Tool permissions are scoped (§22 Pattern 9)

`allowed-tools` lists exactly three tools: `Read`, `Write`, `Bash`. This is narrower than a blanket grant and makes the permission boundary auditable at a glance. The omission of `Agent`, `Edit`, `Glob`, etc. is intentional and correct for a delegating command.

---

## Weaknesses

### 1. The `<process>` block is a thin delegation stub with no fallback (§5 Instruction Framing; §16 Multi-Phase Workflows)

The entire `<process>` section reads:

```
Execute the remove-phase workflow from @~/.claude/get-shit-done/workflows/remove-phase.md end-to-end.
Preserve all validation gates (future phase check, work check), renumbering logic, and commit.
```

This is an instruction to execute a file, not an instruction that describes behavior. It provides zero guidance if the workflow file is missing, if the file reference fails to resolve, or if `gsd-sdk` is unavailable. §16 requires explicit named phases that create cognitive boundaries; §5 requires conditional instructions for context-dependent behavior ("If no PR number is provided, run X"). Neither is present here.

The workflow file carries all the substance — but the command file is the entry point the model reads first. If the delegation fails silently, the model has nothing to fall back on.

### 2. No output format specification (§7 Output Format Handling; §22 Pattern 3)

Neither the command file nor the workflow file specifies what a correct completion response looks like from the command's perspective. The workflow's `<step name="completion">` provides a template, but this is buried in the delegated file. §7 and §22 Pattern 3 require output format to be specified completely and upfront — the calling prompt should declare the expected structure before any task execution begins.

The absence means a model that partially resolves the delegation could produce a response in any format.

### 3. `$ARGUMENTS` is used without a defined fallback or conditional branch (§5 Instruction Framing; §13 Template Variable Injection)

The `<context>` block passes `Phase: $ARGUMENTS` with no handling for the empty case. The workflow file handles the missing-argument case in `<step name="parse_arguments">`, but the command file delegates to that file before establishing whether a valid argument exists. §13 specifies fallback syntax `${VAR||"(default value)"}` and conditional rendering for optional context. §5 requires explicit conditional branching: "If no argument provided, do X." Neither appears in the command file itself — this gate lives only in the workflow.

---

## Specific Rewrites

### Rewrite 1: Replace the delegation stub with a conditional process block (addresses Weakness 1)

Current:
```xml
<process>
Execute the remove-phase workflow from @~/.claude/get-shit-done/workflows/remove-phase.md end-to-end.
Preserve all validation gates (future phase check, work check), renumbering logic, and commit.
</process>
```

Suggested replacement:
```xml
<process>
@~/.claude/get-shit-done/workflows/remove-phase.md

If the workflow file cannot be loaded, execute these steps directly:
1. Validate: confirm $ARGUMENTS is provided and is a future phase number (> current phase in STATE.md).
2. Confirm removal with the user before taking any destructive action.
3. Run `gsd-sdk query phase.remove "${target}"` to delete the directory and renumber subsequent phases.
4. Commit with: `chore: remove phase {N} ({original-name})`
5. Report: phase deleted, N directories renumbered, ROADMAP.md and STATE.md updated.
</process>
```

This keeps the delegation pattern but ensures the command file itself contains enough instruction to operate if the delegation target is unavailable. The fallback satisfies §16's requirement for explicit phases and §5's requirement for conditional branching.

### Rewrite 2: Add an `<output_format>` block (addresses Weakness 2)

Add after `<process>`:
```xml
<output_format>
On success, report exactly:

Phase {N} ({name}) removed.
- Deleted: .planning/phases/{N}-{slug}/
- Renumbered: {X} directories, {Y} files
- Updated: ROADMAP.md, STATE.md
- Committed: chore: remove phase {N} ({name})

On validation failure, report the specific error (missing arg / current-or-past phase / uncommitted work) and stop. Do not proceed past a failed validation gate.
</output_format>
```

This satisfies §7 Action 1 and §22 Pattern 3: the format is specified completely and upfront, and the failure path is as explicit as the success path.

### Rewrite 3: Guard the `$ARGUMENTS` variable at the command level (addresses Weakness 3)

Current `<context>` block:
```xml
<context>
Phase: $ARGUMENTS

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>
```

Suggested replacement:
```xml
<context>
Phase: ${ARGUMENTS||""}

If ARGUMENTS is empty, stop immediately and output:
  ERROR: Phase number required
  Usage: /gsd-remove-phase <phase-number>
  Example: /gsd-remove-phase 17

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>
```

This moves the argument guard to the command file, where it fires before delegation begins. The workflow's parse step becomes a redundant safety net rather than the sole gate. §13 fallback syntax and §5 conditional instruction framing are both satisfied.

---

## Overall Verdict

**Needs Work**

The command file is structurally sound in its use of XML tags and frontmatter, but it is almost entirely a pointer to another file. As a standalone document it provides no fallback behavior, no output format specification, and no argument guard. All three of these gaps are direct violations of guide principles (§5, §7, §13, §16, §22 Patterns 3 and 9). A reader of this command file alone cannot determine what a correct execution looks like, what to do if delegation fails, or what happens when called with no argument. The command needs to be made self-sufficient — either by inlining enough of the workflow to operate independently, or by adding the missing output format, argument guard, and failure paths as first-class content in the command file itself.
