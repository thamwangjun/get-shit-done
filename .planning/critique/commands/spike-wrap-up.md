# Critique: `commands/gsd/spike-wrap-up.md`

**Verdict: Needs Work**

---

## Strengths

### 1. Correct structural tag use (§4 Formatting and Structure)
The command uses semantically named XML tags (`<objective>`, `<execution_context>`, `<runtime_note>`, `<process>`) rather than raw markdown headers or `---` delimiters. This aligns with §4 Action 2: "wrap each in a semantically named XML tag." The tags name what the section *is*, not just where it starts.

### 2. Separation of concerns via workflow delegation (§19 Modularity and Composition)
Delegating the actual logic to `@~/.claude/get-shit-done/workflows/spike-wrap-up.md` rather than inlining it demonstrates the single-responsibility principle from §19. The command file acts as a thin dispatcher; the workflow file owns the behavior. Each has one concern.

### 3. Runtime note for environment variation (§5 Instruction Framing — conditional instructions)
The `<runtime_note>` that overrides `AskUserQuestion` with `vscode_askquestions` for Copilot follows the conditional branching pattern from §5: explicit "if [condition], use [alternative]" rather than leaving tool selection ambiguous.

---

## Weaknesses

### 1. Missing audience, quality bar, and task components (§1 Task Specification — all three actions)

§1 Action 1 requires three components be explicit: (a) what output is requested, (b) why it matters / how it will be used, and (c) what a correct or high-quality response looks like. §1 Action 2 requires the audience be named. The command has none of these.

`<objective>` states *what* at a high level but omits the quality bar entirely. There is no `<audience>` tag, no `<quality_bar>` tag, and no statement of what a high-quality skill output looks like versus a low-quality one. As a result the model must infer standards from the workflow file — but the command is the entry point and should be self-orienting.

**Impact:** The model has no calibration target at invocation. Any quality deviation must be caught by the workflow, which may not surface the mismatch clearly.

### 2. Tool permissions are broader than the task requires (§22 Pattern 9 — minimum required permissions)

The `allowed-tools` list includes `Write`, `Edit`, `Bash`, `Grep`, `Glob`, and `Read`. For a command whose entire job is to delegate execution to a workflow file, `Bash` with no prefix restriction is an unconstrained grant. §22 Pattern 9 states: "Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access."

The command itself does no bashing — all shell interaction lives inside the workflow. The broad grant means blast radius is undefined from the command layer.

**Impact:** Permission scope is not auditable at the command level. The workflow should own the permission profile, or the command should restrict to `Bash(gsd-sdk:*)` and the read-only tools needed to load the workflow.

### 3. No output format specification (§7 Output Format Handling; §22 Pattern 3)

The command gives no `<output_format>` tag and makes no statement about what the model should produce when the workflow completes. §7 Action 1 requires free-form reasoning followed by a structured output step. §22 Pattern 3 states: "Output format specified completely and upfront." The workflow file does include a `<report>` step with a terminal banner, but the command — the entry point the model reads first — is silent on expected output.

Worse, the `<process>` section contains only one sentence: "Execute the spike-wrap-up workflow from `@…` end-to-end. Preserve all curation gates." This is a naked delegation with no output contract. There is no description of what a completed execution looks like to the caller.

**Impact:** If the workflow file is unavailable or partially loaded, the model has no fallback format to anchor against.

---

## Specific Rewrites

### Rewrite 1 — Add `<audience>` and `<quality_bar>` to satisfy §1

**Current:**
```xml
<objective>
Curate spike experiment findings and package them into a persistent project skill that Claude
auto-loads in future build conversations. Also writes a summary to `.planning/spikes/` for
project history. Output skill goes to `./.claude/skills/spike-findings-[project]/` (project-local).
</objective>
```

**Rewrite:**
```xml
<objective>
Curate spike experiment findings and package them into a persistent project skill that Claude
auto-loads in future build conversations. Also writes a summary to `.planning/spikes/` for
project history. Output skill goes to `./.claude/skills/spike-findings-[project]/` (project-local).
</objective>

<audience>
The developer who ran the spike and now wants implementation-ready knowledge distilled from it.
They are familiar with the project domain. They expect a skill that is immediately usable in
a build conversation — not raw notes.
</audience>

<quality_bar>
A high-quality wrap-up: (1) presents each spike for explicit include/exclude curation rather
than auto-including everything, (2) groups findings into feature-area reference files with
code snippets, landmines, and constraints — not just verdicts, (3) leaves CLAUDE.md with a
working auto-load routing line. A low-quality wrap-up silently skips curation gates or
produces a skill file with no code snippets.
</quality_bar>
```

---

### Rewrite 2 — Narrow `allowed-tools` to minimum required scope (§22 Pattern 9)

**Current:**
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

**Rewrite:**
```yaml
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(gsd-sdk:*)
  - AskUserQuestion
```

Rationale: The command's job is to load the workflow file and delegate. `Write` and `Edit` are needed by the workflow, not the command dispatcher. If the command must own the full permission set (because the workflow inherits it), add a comment making that explicit:

```yaml
allowed-tools:
  - Read         # load workflow and spike files
  - Glob         # discover .planning/spikes/*/README.md
  - Grep         # parse frontmatter
  - Write        # write SKILL.md, reference files, WRAP-UP-SUMMARY.md
  - Edit         # update existing SKILL.md in append mode
  - Bash(gsd-sdk:*)      # commit_docs config query and commit step
  - AskUserQuestion      # curation gates
  # Bash(git:*) omitted — commits go through gsd-sdk
```

This makes each grant auditable and removes the undefined blast radius of bare `Bash`.

---

### Rewrite 3 — Add `<output_format>` with terminal contract (§7, §22 Pattern 3)

**Current:**
```xml
<process>
Execute the spike-wrap-up workflow from @~/.claude/get-shit-done/workflows/spike-wrap-up.md end-to-end.
Preserve all curation gates (per-spike review, grouping approval, CLAUDE.md routing line).
</process>
```

**Rewrite:**
```xml
<process>
Execute the spike-wrap-up workflow from @~/.claude/get-shit-done/workflows/spike-wrap-up.md end-to-end.
Preserve all curation gates (per-spike review, grouping approval, CLAUDE.md routing line).
</process>

<output_format>
When the workflow completes, emit the terminal report block defined in the workflow's
`<step name="report">` section. The final output must include:
- Count of spikes curated (included / excluded)
- Skill output path (`./.claude/skills/spike-findings-[project]/`)
- Summary path (`.planning/spikes/WRAP-UP-SUMMARY.md`)
- Confirmation that the CLAUDE.md routing line was added or already existed

Do not omit these fields on partial or early-exit runs — if the workflow exits without
producing the skill, report which step stopped and why.
</output_format>
```

---

## Overall Verdict: Needs Work

The command is structurally sound as a thin dispatcher and shows correct tag use and a solid modularity decision. However, it fails on three guide requirements that matter at invocation time — before the workflow is ever loaded: no audience or quality bar (§1), unconstrained tool permissions (§22 Pattern 9), and no output format contract (§7, §22 Pattern 3). These are not cosmetic gaps. Missing the quality bar means the model cannot self-correct against a standard. Unconstrained `Bash` means permission intent is unauditable. No output format means a workflow failure produces undefined output. All three are fixable with the rewrites above.
