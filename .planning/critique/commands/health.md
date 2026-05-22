# Critique: `commands/gsd/health.md`

**File under review:** `commands/gsd/health.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Date:** 2026-04-30

---

## Strengths

### Single-responsibility design (§19 Modularity and Composition)
The command is exactly one concern: invoke the health workflow. It does not bundle diagnostics logic inline. Per §19's modular principle ("each file handling one concern"), this is the right decomposition — the logic lives in `workflows/health.md` and this file is the entry point only.

### Frontmatter as agent configuration (§11 System vs. User Prompt Allocation)
The YAML frontmatter uses the correct fields — `name`, `description`, `argument-hint`, `allowed-tools` — consistent with §11's "YAML frontmatter as agent configuration" pattern. Tool permissions are declared explicitly, which satisfies §22 Pattern 9 (tool permissions scoped to minimum required patterns).

### Permitted tools are legible and scoped (§22 Pattern 9)
`Read`, `Bash`, `Write`, and `AskUserQuestion` are listed explicitly. This is narrower than a blanket grant and makes the permission boundary auditable at a glance, which is exactly what §22 Pattern 9 calls for.

---

## Weaknesses

### 1. Body sections are not XML-tagged (§4 Formatting and Structure — Action 2)
The prompt body uses three custom tags — `<objective>`, `<execution_context>`, `<process>` — but none of these appear in the guide's XML tag vocabulary (§4, XML tag vocabulary table). The guide reserves `<task>` for "primary instruction: what the model must do" and `<context>` for "background information; helpful but not critical." The current tags carry no standard semantic meaning to the model.

`<objective>` should be `<task>`. The content of `<execution_context>` is a reference to a workflow file — this is context, not a structural section. `<process>` duplicates and expands `<task>` content without adding new information, creating a split-instruction anti-pattern that §11 Action 3 explicitly prohibits ("State each instruction exactly once").

### 2. Task instruction is split and partially redundant (§11 Action 3; §1 Action 1)
`<objective>` and `<process>` together describe the same task: run the health workflow. The model receives the intent twice, with the second restatement adding only one operational detail (parse the `--repair` flag). Per §11 Action 3, redundant instructions "consume context and add noise without reinforcing compliance." Per §1 Action 1, the task specification should be a single coherent statement of what is requested, why, and what good looks like — not split across two tags.

Additionally, the quality bar (§1 Action 1 component c — "what a correct or high-quality response looks like") is absent entirely. There is no indication of what a successful health run should produce to the user.

### 3. No output format specification (§7 Output Format Handling; §22 Pattern 3)
The command produces diagnostic output to the user, but `<output_format>` is absent. §22 Pattern 3 states: "Output format specified completely and upfront... Format specification is part of the task definition, not an afterthought." §7 Action 1 further requires the output structure to be declared before the model begins the task.

There is no specification of: what sections the health report should contain, how issues should be presented, whether `--repair` mode changes the output format, or what "all clear" looks like versus "issues found." The workflow file is expected to carry this, but the command file — as the entry point — gives the model no output contract to anchor against.

---

## Specific Rewrites

### Rewrite 1: Consolidate `<objective>` and `<process>` into a single `<task>` block

**Current (two tags, redundant):**
```xml
<objective>
Validate `.planning/` directory integrity and report actionable issues. Checks for missing files, invalid configurations, inconsistent state, and orphaned plans.
</objective>

<process>
Execute the health workflow from @~/.claude/get-shit-done/workflows/health.md end-to-end.
Parse --repair flag from arguments and pass to workflow.
</process>
```

**Rewritten (single `<task>`, non-redundant):**
```xml
<task>
Execute the health workflow at @~/.claude/get-shit-done/workflows/health.md end-to-end.
Parse the --repair flag from arguments and pass it to the workflow.
</task>

<context>
The workflow validates `.planning/` directory integrity: missing files, invalid configurations, inconsistent state, and orphaned plans.
</context>
```

This separates the instruction (what to do) from background context (what the workflow covers), uses standard tag names, and eliminates the redundancy. The `<task>` instruction is now a single authoritative statement; the `<context>` block provides background without restating the instruction.

### Rewrite 2: Add a minimal `<output_format>` block

The command has no output contract. The workflow file may define one, but the entry point should anchor the expected output shape so the model has a target even before reading the workflow. Add:

```xml
<output_format>
Report findings as a structured list grouped by severity: ERROR (blocks operation), WARNING (degrades reliability), INFO (informational). For each finding include: the affected path, a one-sentence description of the issue, and — if --repair is active — the action taken.

End with one of:
- "Health check passed. No issues found." (no findings)
- "Health check complete. N issue(s) found. Run with --repair to fix." (findings, no repair)
- "Health check complete. N issue(s) repaired." (repair mode)
</output_format>
```

This satisfies §7 Action 1 (output format declared upfront), §22 Pattern 3 (format specified completely before the task begins), and implicitly handles the `--repair` conditional branch per §5's conditional instruction pattern.

---

## Overall Verdict

**Needs Work**

The command is structurally thin by design — the workflow file does the heavy lifting — but the entry point itself has two concrete problems that degrade reliability: (1) it uses non-standard XML tags that carry no semantic weight to the model, and (2) it provides no output format contract, leaving the model to infer what a complete health report looks like. The redundancy between `<objective>` and `<process>` is a minor but avoidable noise cost. None of these are fundamental design errors; they are fixable with the two rewrites above and would bring the file to fully adequate.
