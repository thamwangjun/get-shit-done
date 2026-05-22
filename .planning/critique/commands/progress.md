# Critique: `commands/gsd/progress.md`

**Date:** 2026-04-30
**Critic:** Prompt Engineering Critic (claude-sonnet-4-6)
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09

---

## Scope note

`commands/gsd/progress.md` is a thin stub — it delegates execution to `~/.claude/get-shit-done/workflows/progress.md`. Both files were evaluated as a unit, since the stub is effectively a configuration header and the workflow is the actual prompt content. Weaknesses are attributed to whichever layer owns the problem.

---

## Strengths

### 1. XML structural tags used throughout (§4 Formatting)

The workflow file (`progress.md`) uses semantically named XML tags — `<purpose>`, `<process>`, `<step>`, `<required_reading>`, `<success_criteria>` — to partition the prompt. This matches §4 Action 2: "wrap each [section] in a semantically named XML tag." The tags carry meaning (not just visual separation), and the step `name` attributes further specify role (`init_context`, `load`, `analyze_roadmap`, etc.), which aligns with the intent of tag-based structure.

### 2. Multi-phase workflow with named, ordered steps (§16 Multi-Phase Workflows)

The six named steps (`init_context`, `load`, `analyze_roadmap`, `recent`, `position`, `report`, `route`, `edge_cases`, `forensic_audit`) form an explicit phase sequence. This matches §16: "organize into explicit named phases using XML tags." The routing table inside `<step name="route">` is a well-structured decision matrix that covers every relevant branching condition (Routes A through F), matching §15 Decision Frameworks.

### 3. Scenario-based branching with explicit conditions (§16, §15)

The routing logic uses a markdown table mapping conditions to meanings to actions, and each Route is a separately labeled block. This is exactly the pattern recommended by §16 ("Handle multiple scenarios explicitly rather than leaving the model to infer") and §15 ("ASCII decision trees... each branch has one clear recommendation"). Routes E and E.2 are distinguished at the condition level, not left ambiguous.

### 4. Success criteria stated at the end (§1 Task Specification)

The `<success_criteria>` checklist at the end of the workflow file maps to §1 Action 1's `<quality_bar>` concept. Each criterion is checkable, and the list covers both output quality ("Rich context provided") and behavioral constraints ("User confirms before any action"). This is a concrete quality bar rather than a vague descriptor.

### 5. Conditional argument handling stated explicitly (§5 Instruction Framing)

The `--forensic` flag handling is documented with an explicit conditional: "If `--forensic` is NOT present... skip this step entirely." This matches §5's conditional instruction pattern: "When behavior depends on context, use explicit conditional branching." The negative case (skip) is stated first, preventing the model from drifting into forensic behavior on standard runs.

### 6. Stub frontmatter encodes agent metadata cleanly (§11, §17)

The stub file uses YAML frontmatter with `allowed-tools`, `name`, `description`, and `argument-hint`. This matches §11's YAML frontmatter pattern and §17's "Subagent configuration in frontmatter" — identity, permissions, and trigger description are co-located in one machine-readable block.

---

## Weaknesses

### Weakness 1: No explicit task instruction at the top — `<objective>` is displaced (§8 Context Placement, §1 Task Specification)

**§8 Action 1:** "Place the task instruction at the very start of the prompt."

The workflow file opens with `<purpose>` (which reads like a description) followed immediately by `<required_reading>` and a long `<process>` block. There is no `<task>` tag at the start declaring *what the model must do*. The stub file does have `<objective>`, but it repeats the description rather than issuing a clear imperative instruction.

The guide's vocabulary table (§4) distinguishes `<task>` ("Primary instruction: what the model must do") from `<context>` ("Background information"). Using `<purpose>` and `<objective>` for the opening blurs this distinction and puts description where imperative instruction should be.

Additionally, there is no explicit `<audience>` or `<quality_bar>` tag anywhere in the stub or workflow, which means §1 Action 1's three task components (output requested, why it matters, what good looks like) are only partially present. The `<success_criteria>` at the end partially compensates, but the guide specifies these should be encoded *before* the model begins, not after.

**Impact:** The model receives a description of what the command does rather than an imperative of what it must do. The instruction is effectively buried inside the `<process>` block.

---

### Weakness 2: Negative instructions not converted to positive equivalents (§5 Instruction Framing)

**§5 Action 1:** "Convert negative instructions to positive equivalents."

The forensic audit section uses several negative-framed guard instructions:

- `<step name="forensic_audit">`: "If `--forensic` is NOT present in ARGUMENTS: skip this step entirely."
- Check 6 bash filter: `grep -v "^??" | grep -v "^.planning\/"` (these are bash, not prose, so acceptable)

The prose instruction "skip this step entirely" is a negative instruction that should be converted: instead of "if X is NOT present, skip", the positive framing would be "Run this step only when `--forensic` is present in ARGUMENTS." The guide's conversion table applies directly:

```
"skip this step if NOT present"  →  "Execute this step only when --forensic is in ARGUMENTS"
```

The same pattern appears in the edge cases step: "Handle edge cases" lists conditions in negative/exception framing without specifying the positive default behavior first.

---

### Weakness 3: Output format is not fully specified upfront — format is implicit in prose examples (§7 Output Format Handling, §22 Pattern 3)

**§7 Action 1 + §22 Pattern 3:** "State the required output structure, field names, ordering, and an example *before* the model begins its task."

The `report` step provides a markdown template for the status report inline inside the step description, but the template is embedded in the middle of the process, not declared upfront in a dedicated `<output_format>` tag. The guide requires the output format to be specified as a first-class section, not embedded in step prose.

Additionally, the routing output templates (Route A through F) each define their own ad-hoc output format with slightly different structure (some use emoji headings `## ✓`, `## ⚠`, `## 🎉`; some use `## ▶`; some include `<sub>` HTML tags). There is no canonical `<output_format>` block describing the expected response structure. This violates §22 Pattern 3: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call."

The forensic audit section similarly defines its per-check output format inline: "Emit: ✓ ... — if ... / ⚠ ... — with concrete evidence." These are format specifications buried in step prose, not in a dedicated output format section.

---

### Weakness 4: Stub creates indirection that splits task specification across two files (§11, §19 Modularity)

**§11 Action 3:** "State each instruction exactly once."
**§19:** "Each prompt component has a single responsibility."

The stub file declares `<objective>` and `<process>` with content that largely duplicates what the workflow file's `<purpose>` says. Both files contain a description of the command's purpose: the stub says "Check project progress, summarize recent work and what's ahead, then intelligently route to the next action" and the workflow file's `<purpose>` says essentially the same thing.

The `<required_reading>` instruction inside the workflow file — "Read all files referenced by the invoking prompt's execution_context before starting" — is a meta-instruction that loops back to the stub's `execution_context` field, creating a circular reference rather than self-contained instruction (violating §17: "Each agent prompt must be fully self-contained when spawned").

---

### Weakness 5: No `<constraints>` block scoping permitted actions or tool use (§14 Constraint Enforcement)

**§14:** "Pair every restriction with what IS permitted, stated equally concretely."

The stub's `allowed-tools` frontmatter lists five tools (`Read`, `Bash`, `Grep`, `Glob`, `SlashCommand`), but the workflow body has no corresponding `<constraints>` block explaining *why* those tools are allowed or what actions are off-limits during execution. There is no `<permitted>` / `<reserved_for_human_review>` pairing. A reader of the workflow cannot determine from the workflow alone what tool permissions apply — they must cross-reference the stub's frontmatter.

---

## Specific Rewrites

### Rewrite 1 — Add a `<task>` block at the top of the workflow file (fixes Weakness 1)

Replace the current `<purpose>` opening with a proper `<task>` + `<output_format>` pair placed at the start:

```xml
<task>
Generate a project progress report and route the user to their next action.

Read project state, recent work, and roadmap. Produce a structured status report
covering: progress bar, recent work, current position, key decisions, blockers,
pending todos, and what's next. Then determine and output exactly one routing
suggestion from Routes A through F based on verified artifact counts.
</task>

<output_format>
Structure your response in this order:

1. The status report block (markdown, following the template in the `report` step)
2. Any verification debt warning (only if outstanding_debt > 0)
3. Exactly one route block (Route A, B, C, D, E, E.2, or F) — no additional commentary

Each route block uses this structure:
  - A `## ▶ Next Up` or status heading
  - A bold plan/phase description line
  - A `/clear` then: primary command
  - An "Also available:" section for alternatives (where specified)

If --forensic is in ARGUMENTS, append the forensic audit after the route block.
</output_format>
```

This moves format specification before execution, matching §22 Pattern 3 and §8 Action 1.

---

### Rewrite 2 — Convert negative guard clauses to positive-framed conditionals (fixes Weakness 2)

Current (forensic step opening):
```
If `--forensic` is NOT present in ARGUMENTS: skip this step entirely. Default progress
behavior (standard report + routing) is unchanged.

If `--forensic` IS present: after the standard report and routing suggestion have been
displayed, append the following audit section.
```

Rewrite using positive-first framing (§5 Action 1):
```
Run this step only when `--forensic` appears in ARGUMENTS.

When active: append the forensic audit section after the standard report and route block.
Proceed directly to `<success_criteria>` on all other invocations.
```

The positive trigger ("Run only when...") replaces the double-negative structure without loss of meaning.

Current edge_cases step:
```
Handle edge cases:
- Phase complete but next phase not planned → offer /gsd-plan-phase [next]
- All work complete → offer milestone completion
- Blockers present → highlight before offering to continue
- Handoff file exists → mention it, offer /gsd-resume-work
```

Rewrite with explicit default behavior stated first:
```
After routing, apply these condition-specific additions:

- When blockers are present: display blockers section before the route block
- When a handoff file exists: prepend "Work was paused — /gsd-resume-work to continue" to the route block
- When phase is complete but next phase has no plan: include /gsd-plan-phase as the primary route recommendation (supersedes Route C)
- When all phases are complete: route to Route D regardless of current-phase check
```

---

### Rewrite 3 — Consolidate format templates and add a canonical `<output_format>` block (fixes Weakness 3)

The six route templates each specify their own output format inline. Extract the shared structure into a canonical section and reference it:

```xml
<output_format>

## Route block structure (all routes use this shell)

---

## {STATUS_EMOJI} {Status Heading}

**{phase-ref}: {Name}** — {one-line objective}
{optional sub-line: ✓ condition note}

`/clear` then:

`/{primary-command} {args}` — {one-line description}

---

**Also available:**
- `/{alt-command-1} {args}` — {description}
- `/{alt-command-2} {args}` — {description}

---

## Status emoji key

| Route | Emoji | Heading |
|-------|-------|---------|
| A | ▶ | Next Up |
| B | ▶ | Next Up |
| C | ✓ then ▶ | Phase {Z} Complete / Next Up |
| D | 🎉 | Milestone Complete |
| E | ⚠ | UAT Gaps Found |
| E.2 | (none) | Incomplete UAT Testing |
| F | ✓ then ▶ | Milestone v{X.Y} Complete |

</output_format>
```

This replaces the six ad-hoc templates with one canonical definition, making format consistent and machine-parseable (§7, §22 Pattern 3).

---

## Overall Verdict

**Adequate**

The command demonstrates solid structural thinking: multi-phase workflow, scenario-based routing, named XML steps, and a forensic audit as a clean opt-in extension. The routing decision table is a production-quality decision framework. The YAML frontmatter is correctly specified.

However, the command falls short of the guide's standards on the fundamentals: there is no `<task>` instruction at the top, no upfront `<output_format>`, negative guard clauses that should be positive, and output templates scattered across six ad-hoc route blocks instead of one canonical format. These are not minor style issues — §8 Action 1, §7, and §5 Action 1 are core practices, and the command violates all three. The issues are fixable without restructuring the workflow; the three rewrites above can be applied incrementally.
