# Critique: `commands/gsd/autonomous.md`

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09
**Verdict:** Needs Work

---

## Overview

`autonomous.md` is an intentionally thin command file — a routing stub that delegates all real behaviour to `~/.claude/get-shit-done/workflows/autonomous.md` via `@`-include and a `<process>` redirect. The critique therefore covers what is expressed in the command file itself. Where a deficiency stems from what the file _omits by design_ and could legitimately live in the workflow, that is noted. Where it creates genuine ambiguity or violates a guide principle regardless of intent, it is flagged.

---

## Strengths

### 1. Argument-hint is present in frontmatter (§11 — System vs. User Prompt Allocation)

The frontmatter carries `argument-hint: "[--from N] [--to N] [--only N] [--interactive]"`. Per §11, persistent, caller-facing metadata belongs at the configuration layer. Surfacing the four flags here is exactly right — a downstream orchestrator or help command can read them without parsing the body.

### 2. Scope is clearly stated upfront (§8 — Context Placement)

`<objective>` leads the prompt body. The "Creates/Updates" and "After:" callouts give an unambiguous contract: what files are touched and what the terminal state is. This matches §8 Action 1 ("place the task instruction at the very start") and §1 Action 1's requirement to make the output and its purpose explicit.

### 3. Execution context is injected via `@`-includes (§8 — Context Placement, §13 — Structural Architecture Patterns)

Using `@~/.claude/…` references instead of copy-pasting workflow content is consistent with §13's modular principle: the command file has one responsibility (routing), and the workflow has another (execution logic). Each is a separately togglable unit.

### 4. `allowed-tools` list is present and explicit (§17 — Agent and Subagent Patterns, §22 Pattern 9)

Enumerating `Read`, `Write`, `Bash`, `Glob`, `Grep`, `AskUserQuestion`, `Task`, `Agent` is better than a blanket grant. Pattern 9 calls for narrowest-sufficient permission sets.

---

## Weaknesses

### Weakness 1 — No XML tag structure; prompt body uses informal mixed-format markup (§4 — Formatting and Structure)

The command file mixes three structural idioms in its body: custom XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`), bold markdown (`**Creates/Updates:**`, `**After:**`), and bullet lists. None of these tags appear in §4's standard vocabulary (`<task>`, `<constraints>`, `<output_format>`, `<context>`, `<input>`).

The guide is explicit (§4 Action 2): "wrap each [section] in a semantically named XML tag" from the shared vocabulary, because "the tag name carries semantic meaning." The tag `<objective>` is not in the vocabulary — `<task>` is. `<execution_context>` is not in the vocabulary — `<context>` is (with `<log_path>` / `<log_summary>` sub-tags for runtime paths). Using non-standard tags breaks interoperability with composed modules and gives the model weaker structural signal.

**Severity: Medium.** The intent is clear, but structural inconsistency accumulates across a large command library.

### Weakness 2 — Negative instruction present in `<process>` without a positive complement (§5 — Instruction Framing)

The `<process>` block contains:

> Preserve all workflow gates (phase discovery, per-phase execution, blocker handling, progress display).

This is a positive framing — good. But the `<context>` block about `--interactive` ends with:

> Keeps the main context lean while preserving user input on decisions.

This is a rationale clause, not an instruction. The actual instruction for interactive mode — what the model must _do_ differently — is in the workflow, not here. §5 Action 1 requires each instruction to be a positive specification of behaviour. A reader of this file alone cannot know what "run discuss inline" means; it relies entirely on the `@`-included workflow.

More concretely, the `<process>` block contains only one sentence:

> Execute the autonomous workflow from @~/.claude/get-shit-done/workflows/autonomous.md end-to-end.

This is not an instruction — it is a delegation notice. Per §1 Action 1, the prompt must make explicit "(a) what output is being requested, (b) why that output matters, and (c) what a correct or high-quality response looks like." None of (a)–(c) are present in `<process>`. The command file passes all three to the workflow and provides zero fallback if the workflow include fails to load.

**Severity: High.** If the `@`-include is unavailable (file missing, permission error, tool not supporting `@` syntax), the command provides an empty execution contract.

### Weakness 3 — No `<output_format>` specification; terminal success state is implied, not defined (§7 — Output Format Handling, §22 Pattern 3)

The `<objective>` describes what files are created or updated but does not define what the _agent's response_ should look like when it finishes. Per §7 and Pattern 3, output format must be "specified completely and upfront." Per §17, subagent output format depends on context (`IS_SUBAGENT` conditional). Neither case is handled here.

The closest the file comes is "Milestone is complete and cleaned up" — a terminal state description, not an output format. There is no `<output_format>` tag, no length/structure specification, and no machine-parseable completion signal. Compare the guide's Pattern 8 example, which requires at least one specific probe result in every report and specifies the structure explicitly.

**Severity: Medium.** Inconsistent completion reporting across runs makes progress auditing brittle.

### Weakness 4 — `allowed-tools` grants `Bash` with no command prefix scoping (§22 Pattern 9)

Pattern 9 states: "Express allowed tools as the narrowest patterns that satisfy the task." The current grant is `Bash` with no prefix (e.g., `Bash(git:*)`, `Bash(gsd-sdk:*)`). This leaves the permission boundary undefined and makes the grant non-auditable. Given that this command can execute an entire milestone autonomously — touching files, running builds, committing — an unbounded `Bash` grant is high blast radius per §15's reversibility framework.

**Severity: Low-Medium.** Functional, but inconsistent with the minimum-permission principle and harder to audit.

### Weakness 5 — No priority ordering or tie-breaking for flag conflicts (§5 — Instruction Framing)

The four flags (`--from`, `--to`, `--only`, `--interactive`) can be combined in logically conflicting ways (e.g., `--only 3 --from 5`). The command file acknowledges the flags but states no precedence rule. §5 requires explicit `<priority_order>` when multiple criteria apply. The conflict resolution is buried in the workflow's bash logic rather than stated declaratively in the command interface.

**Severity: Low.** Edge case, but a violation of the guide's explicit-ordering principle.

---

## Specific Rewrites

### Rewrite 1 — Replace `<objective>` + `<process>` with standard `<task>` + inline fallback contract

**Current (abbreviated):**

```xml
<objective>
Execute all remaining milestone phases autonomously...
</objective>

<process>
Execute the autonomous workflow from @~/.claude/get-shit-done/workflows/autonomous.md end-to-end.
Preserve all workflow gates...
</process>
```

**Rewrite:**

```xml
<task>
Drive all remaining milestone phases autonomously using the workflow at
@~/.claude/get-shit-done/workflows/autonomous.md.

For each incomplete phase, in numeric order: run discuss → plan → execute using Skill()
flat invocations. Pause only for explicit user decisions: grey-area acceptance, blockers,
or validation gates. After all phases complete, run milestone audit → complete → cleanup.

If the workflow file cannot be loaded, report the path that failed and halt — do not
infer or improvise execution logic.
</task>

<output_format>
After all phases are complete, respond with:
- A one-line status: "Milestone {version} complete — {N} phases executed."
- A markdown table: phase number | phase name | status (complete / skipped / blocked)
- Any blockers encountered and how they were resolved or escalated.

If halted early, report the last completed phase and the reason for halting.
</output_format>
```

**Why:** This applies §4 (standard vocabulary tags), §7/Pattern 3 (explicit output format), §1 Action 1 (all three task components present), and adds a failure-mode contract that eliminates the empty-execution-contract risk identified in Weakness 2.

---

### Rewrite 2 — Replace prose `<context>` flag documentation with `<constraints>` + `<priority_order>`

**Current:**

```xml
<context>
Optional flags:
- `--from N` — start from phase N...
- `--to N` — stop after phase N...
- `--only N` — execute only phase N...
- `--interactive` — run discuss inline...

Project context, phase list, and state are resolved inside the workflow...
</context>
```

**Rewrite:**

```xml
<constraints>
Flag behaviour (apply in order; later flags override earlier where they conflict):

<priority_order>
  1. `--only N` — execute exactly phase N; ignore `--from` and `--to` if also present.
  2. `--from N` — skip all phases with number < N.
  3. `--to N` — halt after phase N completes; do not advance further.
  4. `--interactive` — run discuss inline (not auto-answered); dispatch plan and execute
     as background agents.
  5. No flags — execute all incomplete phases from the first incomplete phase onward.
</priority_order>

If conflicting flags produce an empty phase set, report the conflict explicitly and halt
rather than executing zero phases silently.
</constraints>
```

**Why:** This applies §5's `<priority_order>` requirement, converts implicit conflict resolution from bash logic to a declarative instruction the model can reason about, and adds a failure signal for the zero-phase-set edge case (Weakness 5).

---

### Rewrite 3 — Scope `Bash` in `allowed-tools` to minimum required prefixes

**Current:**

```yaml
allowed-tools:
  - Bash
```

**Rewrite:**

```yaml
allowed-tools:
  - Bash(gsd-sdk:*)
  - Bash(git status)
  - Bash(git log:*)
  - Bash(git diff:*)
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Task
  - Agent
```

If the workflow requires broader bash access (e.g., build commands), add explicit prefixes per tool rather than granting unbounded `Bash`. Each prefix documents the intended use and makes permission grants auditable at a glance per Pattern 9.

---

## Overall Verdict

**Needs Work.**

The command is a competent routing stub: scope is stated, flags are documented, and the modular delegation to a workflow file is architecturally sound. However, it fails three meaningful guide requirements. The most serious is Weakness 2: the `<process>` block is a one-sentence delegation notice with no fallback contract — if the `@`-include fails, the command provides nothing. The second is Weakness 3: there is no `<output_format>` definition, leaving completion reporting undefined. Third, the tag vocabulary is non-standard throughout, which undermines interoperability with the rest of the command library.

These are fixable in under 30 lines of edits (Rewrites 1–3 above). The underlying design — thin command, fat workflow, `@`-include composition — is consistent with §13 and §19 and should be preserved.
