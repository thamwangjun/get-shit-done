# Critique: `commands/gsd/remove-workspace.md`

**Verdict: Adequate — with structural issues that erode reliability**

---

## Strengths

### 1. Reversibility framing on safety checks (§15, §14)

The command correctly gates the destructive path behind an uncommitted-changes check and a typed-name confirmation. This maps to the guide's reversibility framework (§15): irreversible actions go in `<confirm_with_user>`, and the typed-name requirement is a concrete implementation of that principle. The explicit `Exit. Do NOT proceed.` directive is unambiguous.

### 2. Clear argument declaration in frontmatter (§11 — YAML frontmatter as agent configuration)

The `argument-hint`, `allowed-tools`, `name`, and `description` frontmatter fields follow the guide's pattern for agent configuration (§11). Tool scope is narrow and auditable: only `Bash`, `Read`, and `AskUserQuestion` are listed, matching §22 Pattern 9 (tool permissions scoped to minimum required patterns).

### 3. Conditional branching is made explicit (§5 — Conditional instructions)

The workflow file handles the "no workspace name provided" branch explicitly, including a re-run of init. The `TEXT_MODE` branch for non-Claude runtimes is also called out. This aligns with §5's directive to use explicit conditional branching rather than leaving the model to infer.

---

## Weaknesses

### 1. Prompt body defers the entire task to a referenced file — violating self-containment (§17)

**Severity: High**

The command file contains:

```
<process>
Execute the remove-workspace workflow from @~/.claude/get-shit-done/workflows/remove-workspace.md end-to-end.
</process>
```

§17 (Agent and Subagent Patterns) states: "Each agent prompt must be fully self-contained when spawned." The command file is the spawned prompt — yet it delegates 100% of its behavioral instructions to an external file that the model must fetch and interpret. If the referenced file is unavailable, moved, or misread, the command has no fallback instructions and produces undefined behavior.

Additionally, `<objective>` and `<process>` in the command file both describe the task, but `<process>` adds nothing — it is a single sentence that just points elsewhere. This creates a two-layer indirection (`command → workflow → behavior`) that introduces a coordination seam where none is needed. §13 (Modular Principle) favors modules with a single responsibility that are independently understandable — a module that is only a pointer is not independently understandable.

### 2. `<purpose>` and `<task>` in the workflow file duplicate each other — violating the single-location rule (§11)

**Severity: Medium**

The workflow file opens with:

```xml
<task>
Remove a GSD workspace, cleaning up git worktrees and deleting the workspace directory.
</task>

<context>
Verifies workspace exists, checks for uncommitted work, removes worktrees safely, and deletes the workspace directory. Spawned by /gsd-remove-workspace.
</context>

<purpose>
Remove a GSD workspace, cleaning up git worktrees and deleting the workspace directory.
</purpose>
```

`<task>` and `<purpose>` are word-for-word identical. §11 Action 3 states: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." The `<purpose>` tag adds no information and should be deleted. The `<context>` block additionally restates most of the same sentence a third time ("Spawned by /gsd-remove-workspace" is the only novel element).

### 3. Negative instruction ("Do NOT proceed") and missing positive behavioral contract for the abort path (§5)

**Severity: Medium**

Section 2 (Safety Checks) uses "Exit. Do NOT proceed." as the primary directive on the dirty-repo branch. §5 Action 1 requires converting negative instructions to positive equivalents. The correct form states what the model should do, not just what to stop doing:

> "Report the dirty-repo block message and terminate. Take no further action."

More importantly, there is no defined output format for the abort: the error template is plain prose with no structured tag wrapping. If a calling agent or orchestrator is parsing for a VERDICT or status token, it will fail silently. The guide's §7 Machine-parsed output specification requires exact format specification for any output that may be consumed programmatically.

### 4. No `<output_format>` specification for the final report (§7, §22 Pattern 3)

**Severity: Medium**

Step 6 (Report) emits a success message as an untagged code block:

```
Workspace "$WORKSPACE_NAME" removed.

  Path: $WORKSPACE_PATH (deleted)
  Repos: $REPO_COUNT worktrees cleaned up
```

There is no `<output_format>` block specifying whether this is user-facing prose, a structured log, or a machine-parseable signal. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task." The success and abort outputs are defined inline in the process steps rather than upfront in a dedicated format block. §8 Context Placement reinforces this: the format contract should be stated before the task content, not buried at step 6.

### 5. `<required_reading>` is a latent ambiguity trap (§17, §13)

**Severity: Low–Medium**

The workflow file contains:

```xml
<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>
```

This instruction assumes the model knows which files were listed in the calling prompt's `<execution_context>`. In a self-contained agent invocation, that context may not be available. The files (`remove-workspace.md` itself, `ui-brand.md`) should either be listed explicitly or inlined. Saying "read files from the invoking context" introduces a dependency on context that §17 explicitly prohibits for spawned agents.

---

## Specific Rewrites

### Rewrite 1: Eliminate the pointer-only `<process>` block; inline critical content

**Problem:** §17 self-containment; the command file is a pointer with no standalone value.

**Current (command file):**
```xml
<process>
Execute the remove-workspace workflow from @~/.claude/get-shit-done/workflows/remove-workspace.md end-to-end.
</process>
```

**Suggested replacement:** The command file should either (a) inline the workflow steps directly, or (b) if the file-reference pattern is a framework convention, remove `<objective>` and `<process>` entirely from the command stub and make the `<execution_context>` do all the work — but then the workflow file must be fully self-contained without `<required_reading>` pointing back to the calling context. At minimum, replace the single-sentence `<process>` with a `<constraints>` block that formalizes what the model is and is not permitted to do, since the workflow handles the steps:

```xml
<constraints>
  <take_freely>
    - Read workspace metadata and git worktree status
    - Run git worktree remove for workspace repos
    - Delete the workspace directory after confirmation
  </take_freely>

  <confirm_with_user>
    - Any file deletion: confirm workspace name match before proceeding
  </confirm_with_user>
</constraints>
```

### Rewrite 2: Add a top-level `<output_format>` block to the workflow file

**Problem:** §7, §22 Pattern 3 — format is not declared before the task; it is buried at step 6.

**Suggested addition** (insert after `<context>`, before `<required_reading>`):

```xml
<output_format>
On success, emit:

  Workspace "<workspace_name>" removed.
  Path: <absolute_path> (deleted)
  Repos: <N> worktrees cleaned up

On abort (dirty repos), emit the dirty-repo block from §2 and stop.
On cancellation (name mismatch), emit: "Removal cancelled." and stop.

Do not emit any additional explanation after the terminal status line.
</output_format>
```

This separates output specification from process steps and makes both success and abort paths explicit upfront.

### Rewrite 3: Replace the duplicate `<task>`/`<purpose>` tags and convert the negative directive

**Problem:** §11 duplicate instructions; §5 negative instruction framing.

**Current (workflow file):**
```xml
<task>
Remove a GSD workspace, cleaning up git worktrees and deleting the workspace directory.
</task>

<context>...</context>

<purpose>
Remove a GSD workspace, cleaning up git worktrees and deleting the workspace directory.
</purpose>
```

And in step 2:
```
Exit. Do NOT proceed.
```

**Suggested replacement:** Delete `<purpose>` entirely. Revise the context block to hold only what is not in `<task>`. In step 2, replace the negative directive:

```xml
<task>
Remove a GSD workspace: verify no uncommitted changes, confirm with the user, remove git
worktrees, and delete the workspace directory.
</task>

<context>
Spawned by /gsd-remove-workspace. Reads workspace metadata via gsd-sdk before any
destructive action.
</context>
```

Step 2 negative → positive:
```
Report the dirty-repo message above. Terminate immediately. Take no further action.
```

---

## Overall Verdict: **Adequate**

The command captures the right safety semantics (dirty-repo gate, typed-name confirmation, worktree-first cleanup order) and the frontmatter is well-structured. However, it has three structural problems that compound each other: the command file is not self-contained (§17), the workflow file duplicates its own task statement (§11), and neither file defines output format upfront before the process steps (§7). None of these are logic errors — the workflow would likely execute correctly in practice — but they violate guide principles that exist to prevent silent failures in orchestrated and multi-agent contexts, which is exactly the context this command operates in. Fix the three rewrites above and this moves to **Strong**.
