# Critique: `commands/gsd/new-workspace.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### §4 Formatting — XML sectioning is present and semantically named

The command file uses `<context>`, `<objective>`, `<execution_context>`, and `<process>` tags. This aligns with the guide's direction to "wrap each [section] in a semantically named XML tag" (§4 Action 2). The tags carry semantic meaning beyond bare delimiters.

### §8 Context Placement — task instruction leads

The `<objective>` (what the command creates) and `<context>` (flags) appear before `<process>`, matching the guide's ordering rule: task instruction at the start, supporting context in the middle (§8 Actions 1–3).

### §16 Multi-Phase Workflows — numbered phases in the workflow file

The referenced workflow (`new-workspace.md`) organizes work into nine numbered phases with gates and conditional branches. This matches the guide's phase-pattern recommendation (§16) and its scenario-based branching pattern for handling `--auto`, `child_repo_count == 0`, and other conditions (§16 "Scenario-based branching").

### §14 Constraint Enforcement — validation errors reported collectively

Step 5 of the workflow explicitly states "Report all validation errors at once, not one at a time." This is consistent with the spirit of §14: enumerate constraints completely rather than leaving behavior implicit.

---

## Weaknesses

### Weakness 1 — §1 Task Specification: No audience, quality bar, or explicit success criteria in the command file itself

The guide requires three task components to be explicit in the prompt: what output is requested, why it matters, and what a correct response looks like (§1 Action 1). It also requires audience identification (§1 Action 2).

The command file (`new-workspace.md`) delegates all substantive content to the workflow file via `@` includes. The command file itself contains no `<audience>` tag, no `<quality_bar>`, and no success criteria. The `<success_criteria>` checklist exists only inside the workflow file — not in the invoking prompt the model first reads.

A model that encounters only the command file (e.g., if the include fails or is not loaded) has no quality bar to calibrate against.

### Weakness 2 — §5 Instruction Framing: Negative instructions and absent priority ordering

The workflow file contains multiple negative-framed instructions as primary directives:

- "must not exist or must be empty" (Step 5)
- "if strategy is `worktree` and `worktree_available` is false" (Step 5)

Per §5 Action 1, negative instructions must be converted to positive equivalents: "Do not X" → "Do Y instead." These are not conversions of inherently negative constraints (like §6's reframe pattern); they are primary behavioral rules written in negative form that the guide requires to be rewritten.

Additionally, there is no `<priority_order>` block anywhere in the command file or workflow. The workflow defines competing behaviors (e.g., `--auto` flag vs. interactive prompts; `--strategy` vs. default) without an explicit priority ordering when signals conflict (§5 "Priority ordering"). When `--auto` is absent and `--repos` is absent simultaneously, the model must infer the precedence of the interactive path from prose context rather than an explicit ranked list.

### Weakness 3 — §4 Formatting / §11 System vs. User Split: The command file is a thin dispatcher with no self-contained content

The entire behavioral specification lives in two `@` included files:

```
@~/.claude/get-shit-done/workflows/new-workspace.md
@~/.claude/get-shit-done/references/ui-brand.md
```

The command file's `<process>` block is two sentences: "Execute the workflow end-to-end. Preserve all workflow gates." This violates two principles simultaneously:

1. **§17 Agent and Subagent Patterns** — "Each agent prompt must be fully self-contained when spawned." The command file is not self-contained; it is inert without its includes.
2. **§11 Action 3** — "State each instruction exactly once." The command file restates the workflow's purpose in `<objective>` while the workflow's `<task>` and `<purpose>` tags repeat the same intent. The same behavioral content appears in three locations: the command frontmatter `description`, the `<objective>` block, and the workflow's `<task>` + `<purpose>` tags.

The guide's modular principle (§19) supports decomposed files, but each module must be "independently understandable" (§19). The command file as written is not — it is a redirect, not a module.

---

## Specific Rewrites

### Rewrite 1 — Add `<audience>` and `<quality_bar>` to the command file (fixes Weakness 1)

**Current `<objective>` block (abridged):**
```xml
<objective>
Create a physical workspace directory containing copies of specified git repos...
</objective>
```

**Suggested replacement:**
```xml
<objective>
Create a physical workspace directory containing copies of specified git repos (as worktrees
or clones) with an independent `.planning/` directory for isolated GSD sessions.
</objective>

<audience>
A developer running GSD in a terminal. They understand git worktrees and clones. They expect
terse, actionable output — not verbose explanations of what each step does.
</audience>

<quality_bar>
A correct execution: (1) creates all requested repos at the target path, (2) writes a valid
WORKSPACE.md with accurate repo/branch/strategy data, (3) initializes .planning/, and
(4) reports the exact workspace path and next-step command. Partial success (some repos
failed) is acceptable; silent failure is not.
</quality_bar>
```

### Rewrite 2 — Convert negative validation instructions to positive form (fixes Weakness 2, §5)

**Current (Step 5 of workflow):**
```bash
if [ -d "$TARGET_PATH" ] && [ "$(ls -A "$TARGET_PATH" 2>/dev/null)" ]; then
  echo "Error: Target path already exists and is not empty: $TARGET_PATH"
  exit 1
fi
```

The surrounding instruction reads "must not exist or must be empty" — a negative primary directive.

**Suggested rewrite of the surrounding instruction:**
```
Before creating anything, confirm each precondition holds. Proceed only when all pass;
report all failures together before exiting.

Preconditions:
1. TARGET_PATH is absent or empty — create freely into it.
2. Each repo path contains a `.git` directory — treat it as a git repo.
3. When strategy is `worktree`, git must be available (`worktree_available: true`) — proceed
   with worktree creation.
```

This reframes three negative gatekeeping rules into positive preconditions that define what the valid world looks like, keeping the bash error-handling code intact but removing negative framing from the prose instruction.

### Rewrite 3 — Add an explicit `<priority_order>` for flag conflict resolution (fixes Weakness 2, §5)

Insert immediately after argument parsing (Step 2 of workflow):

```xml
<priority_order>
  When flags conflict or are absent, resolve in this order:
  1. Explicit flag values (--name, --repos, --strategy, --branch, --path) — highest priority
  2. --auto defaults (worktree strategy, workspace/<name> branch, default base path)
  3. Interactive AskUserQuestion prompts — lowest priority, used only when flag is absent
     and --auto is not set

  If --auto is set, never ask interactive questions. Error immediately on any missing
  required flag rather than falling back to interactive mode.
</priority_order>
```

This makes the resolution order machine-readable and removes the model's need to infer precedence from prose.

---

## Overall Verdict

**Needs Work**

The command file's XML structure and phase organization are directionally correct. But the file is not self-contained (§17), contains no audience or quality bar (§1), and the workflow's validation instructions use negative primary directives where positive preconditions are required (§5). The priority resolution for flag conflicts is implicit across prose paragraphs rather than explicit (§5 "Priority ordering"). These are not cosmetic issues — they affect how reliably the model executes edge cases (missing flags, partial failures, `--auto` mode). The three rewrites above are targeted fixes; no structural overhaul is required.
