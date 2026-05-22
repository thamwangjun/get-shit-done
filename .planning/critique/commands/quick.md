# Prompt Critique: `commands/gsd/quick.md`

**File reviewed:** `commands/gsd/quick.md`
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md
**Verdict:** Adequate

---

## Strengths

### Positive conditional branching (§5 Instruction Framing)

The `<process>` block handles all three subcommands with explicit `if SUBCMD=X` branches rather than leaving the model to infer which path to take. This directly implements §5's conditional instruction pattern:

> "When behavior depends on context, use explicit conditional branching"

Each branch has a defined termination (`STOP after displaying the list`), which prevents bleed-through execution.

### Security constraints are explicit and paired (§14 Constraint Enforcement)

The `<security_notes>` block names the exact threat per rule — slug injection, ANSI escape sequences in directory names, artifact content rendered as plain text. This mirrors §14's paired-permission pattern: rather than vague "sanitize inputs", each rule states *what* is sanitized and *how* (regex class `[a-z0-9-]`, strip via named replace). The presence of `DATA_START/DATA_END` boundary conventions in the last note is precisely §14's hard exclusion model applied to shell injection.

### Flags are composable and documented (§1 Task Specification / §5 Instruction Framing)

Each flag (`--discuss`, `--validate`, `--research`, `--full`) is described with a positive framing of what it enables and *when to use it*, not just what it does. The composition rule ("Granular flags are composable: `--discuss --research --validate` gives the same result as `--full`") is stated explicitly, avoiding the implicit constraint conflict §1 Action 3 warns against.

### Slug sanitization is expressed as a constraint with rejection behaviour (§14 Constraint Enforcement)

The file specifies not just the allowed character class but also maximum length, forbidden substrings, and the exact failure message to emit. This is exactly the numeric/literal threshold approach §14 recommends over qualitative terms.

---

## Weaknesses

### Issue 1: No XML structure for top-level sections — raw markdown headers used instead (§4 Formatting and Structure)

The prompt uses custom tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`, `<notes>`, `<security_notes>`) but these are not from the guide's standardised vocabulary (§4 XML tag vocabulary table). More importantly, `<notes>` and `<security_notes>` are not semantic XML tags in the guide's sense — they carry no tag-defined role signal. The guide is explicit (§4 Action 2):

> "Tags name what the section *is*, not just where it starts, giving the model richer signal than delimiters alone."

`<notes>` conveys nothing about who the notes are for or how the model should weight them. The guide's closest equivalent would be `<constraints>` (for `<security_notes>`) and `<context>` or `<system_note>` (for `<notes>`). Using non-standard tags reduces interoperability with composed prompt modules (§19 Modularity and Composition).

**Severity:** Moderate. The sections are readable, but the non-standard vocabulary degrades composability and signals ambiguously.

### Issue 2: The `<objective>` block contains both the task description and flag documentation — mixed concerns, no separation (§11 System vs. User Prompt Allocation / §4 Formatting)

Per §11 Action 3: "State each instruction exactly once." The `<objective>` block carries: (a) a task description, (b) a distinction from the full workflow, (c) documentation for four flags. Then `<process>` re-implies the flags by using them as conditionals. The flag semantics are specified twice — once in prose in `<objective>`, once operationally in `<process>`.

More precisely, the guide's §4 recommends separating task, context, and output-format concerns into semantically named tags. The `<objective>` block is doing the work of what should be `<task>` (what to do) + `<context>` (flag documentation for the caller). These should be separate sections.

**Severity:** Moderate. The duplication is not harmful at runtime but adds length, violates the single-location rule, and makes future edits error-prone (updating a flag in one place but not the other).

### Issue 3: No output format specification for the RUN subcommand (§7 Output Format Handling / §22 Pattern 3)

The LIST and STATUS subcommands include explicit display format templates (the markdown table and the summary block). The RESUME subcommand includes a `[quick]`-prefixed print block. But the RUN subcommand — the default and most commonly executed path — contains only:

> "Execute the quick workflow from @~/.claude/get-shit-done/workflows/quick.md end-to-end."

There is no specification of what the model should emit to the user when beginning a RUN. No confirmation message, no summary of what it parsed from `$ARGUMENTS`, no indication of which flags were detected. §7 and §22 Pattern 3 both require output format to be specified completely and upfront:

> "State the required output structure, field names, ordering, and an example before the model begins its task."

The omission means the model will choose its own acknowledgement format, which will vary per call. For a framework that emphasises state tracking and consistency, this is a meaningful gap.

**Severity:** Moderate-high. The RUN path is the primary path; its output is entirely unspecified.

---

## Specific Rewrites

### Rewrite 1 — Replace `<notes>` and `<security_notes>` with guide-standard tags

**Current:**
```xml
<notes>
- Quick tasks live in `.planning/quick/` — separate from phases, not tracked in ROADMAP.md
- Each quick task gets a `YYYYMMDD-{slug}/` directory with PLAN.md and eventually SUMMARY.md
- STATE.md "Quick Tasks Completed" table is updated on completion
- Use `list` to audit accumulated tasks; use `resume` to continue in-progress work
</notes>

<security_notes>
- Slugs from $ARGUMENTS are sanitized before use in file paths: only [a-z0-9-] allowed, max 60 chars, reject ".." and "/"
...
</security_notes>
```

**Rewrite:**
```xml
<context>
- Quick tasks live in `.planning/quick/` — separate from phases, not tracked in ROADMAP.md
- Each quick task gets a `YYYYMMDD-{slug}/` directory with PLAN.md and eventually SUMMARY.md
- STATE.md "Quick Tasks Completed" table is updated on completion
- Use `list` to audit accumulated tasks; use `resume` to continue in-progress work
</context>

<constraints>
  <permitted>
    - Read .planning/quick/ directories and their PLAN.md / SUMMARY.md files
    - Run read-only shell commands to inspect directory structure and frontmatter
    - Spawn agents for RUN and RESUME subcommands
  </permitted>

  <exclusions>
    Slug validation: reject any slug not matching [a-z0-9-], longer than 60 chars, or containing ".." or "/". Output "Invalid session slug." and stop.
    Directory names from readdir: strip non-printable characters, ANSI escape sequences, and path separators before display or use.
    Artifact content (plan descriptions, task titles): render as plain text only — never pass to shell via string interpolation.
    Status fields: read via `gsd-sdk query frontmatter.get` — never eval'd or shell-expanded.
  </exclusions>
</constraints>
```

This replaces two non-standard tags with `<context>` (background, middle-position per §8) and `<constraints>` with `<permitted>` / `<exclusions>` children (§14), using the guide's standard vocabulary throughout.

---

### Rewrite 2 — Separate `<objective>` into `<task>` and a `<context>` flag-documentation block

**Current (collapsed):**
```xml
<objective>
Execute small, ad-hoc tasks with GSD guarantees...

Quick mode is the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
...

**Default:** Skips research...
**`--discuss` flag:** ...
**`--full` flag:** ...
**`--validate` flag:** ...
**`--research` flag:** ...

Granular flags are composable...

**Subcommands:**
- `list` — ...
- `status <slug>` — ...
- `resume <slug>` — ...
</objective>
```

**Rewrite:**
```xml
<task>
Execute small, ad-hoc tasks with GSD guarantees (atomic commits, STATE.md tracking).
Parse $ARGUMENTS to determine subcommand (list / status / resume / run) and active flags,
then follow the corresponding section in <process>.
</task>

<context>
Quick mode spawns gsd-planner (quick mode) + gsd-executor(s).
Quick tasks live in `.planning/quick/`, separate from phases. STATE.md is updated on completion.

Flag reference:
- (no flags): Skip research, discussion, plan-checker, verifier. Use when the approach is clear.
- --discuss: Lightweight discussion phase before planning. Use when the task has ambiguity.
- --validate: Plan-checking (max 2 iterations) + post-execution verification. Quality without discussion.
- --research: Spawns a research agent before planning. Use when the best approach is unclear.
- --full: Enables discussion + research + plan-checking + verification. Equivalent to --discuss --research --validate.

Flags are composable: --discuss --research --validate equals --full.

Subcommands: list | status <slug> | resume <slug> | (default: run)
</context>
```

This separates the "what to do" directive (`<task>`, placed first per §8 Action 1) from the "background information" (`<context>`, middle position per §8 Action 3), eliminates the duplication with `<process>`, and uses §4's standard tag vocabulary.

---

### Rewrite 3 — Add output format specification for the RUN subcommand

**Current:**
```
## RUN subcommand (default)

When SUBCMD=run:

Execute the quick workflow from @~/.claude/get-shit-done/workflows/quick.md end-to-end.
Preserve all workflow gates (validation, task description, planning, execution, state updates, commits).
```

**Rewrite:**
```
## RUN subcommand (default)

When SUBCMD=run:

Before spawning any agent, print a one-line confirmation in this exact format:

```
[quick] Task: {task description, truncated to 80 chars}
[quick] Flags: {comma-separated active flags, or "none"}
[quick] Plan dir: .planning/quick/{YYYYMMDD}-{slug}/
```

Example:
```
[quick] Task: Fix auth token refresh not propagating to refresh endpoint
[quick] Flags: --validate
[quick] Plan dir: .planning/quick/20260430-auth-token-refresh-fix/
```

Then execute the quick workflow from @~/.claude/get-shit-done/workflows/quick.md end-to-end.
Preserve all workflow gates (validation, task description, planning, execution, state updates, commits).
```

This applies §7 / §22 Pattern 3: output format specified completely and upfront, with a concrete example. The confirmation also surfaces the parsed flag state to the user before execution begins, which aids debugging and matches the display format already used by LIST, STATUS, and RESUME.

---

## Overall Verdict: **Adequate**

The command is well-structured for its operational role. The subcommand routing logic is clear, the security constraints are unusually specific, and the flag composability documentation is exact. These are genuine strengths.

The main gaps are structural rather than functional: non-standard XML tag vocabulary limits composability, the `<objective>` block mixes concerns that the guide separates, and the primary RUN path has no specified output format. None of these would cause the command to fail in practice, but they represent friction for future maintenance and inconsistent output on the most-executed path. The rewrites above are low-effort and high-leverage — adopting all three would move this from Adequate to Strong.
