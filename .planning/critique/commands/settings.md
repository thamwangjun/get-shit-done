# Critique: `commands/gsd/settings.md`

**File under review:** `commands/gsd/settings.md`
**Workflow delegated to:** `~/.claude/get-shit-done/workflows/settings.md`
**Date:** 2026-04-30
**Overall verdict:** Adequate

---

## Strengths

### 1. Single-responsibility entry point (§19 Modularity and Composition)

The command file correctly separates concerns: it is a thin routing stub that delegates all logic to an external workflow file via `@~/.claude/get-shit-done/workflows/settings.md`. This matches §19's modular principle — "each file handling one concern." The command file's only job is to declare the tool allowlist, describe the objective, and point at the implementation. The workflow file handles all state and interaction logic independently.

### 2. Tool permissions scoped to task requirements (§22 Pattern 9)

The `allowed-tools` frontmatter correctly limits the agent to `Read`, `Write`, `Bash`, and `AskUserQuestion` — the minimum set needed to read config, present options, and write results. This is directly in line with §22 Pattern 9: "express allowed tools as the narrowest patterns that satisfy the task."

### 3. YAML frontmatter as agent configuration (§11 System vs. User Prompt Allocation)

The file correctly encodes identity (`name`), description (`description`), and permissions (`allowed-tools`) in machine-readable frontmatter. §11 recommends exactly this pattern for agent prompt files: "encapsulate all persistent properties in frontmatter."

### 4. Objective block names the routed sub-tasks explicitly

The `<objective>` block explicitly enumerates what the workflow handles (config existence, reading, interactive prompt, merging, writing, confirmation). This helps the model understand the scope before reading the workflow file, reducing ambiguity about what the entry point is responsible for.

---

## Weaknesses

### 1. `<objective>` and `<process>` are redundant — violates §11 Action 3 (each instruction exactly once)

The command file contains two blocks that describe the same thing in different words:

- `<objective>` describes what the workflow handles ("Config existence ensuring", "Current settings reading and parsing", "Interactive 5-question prompt", etc.)
- `<process>` says "Follow the settings workflow" and then re-lists the same six steps verbatim as a numbered list.

§11 Action 3 is explicit: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." The numbered list in `<process>` duplicates the bullet list in `<objective>` — one of these blocks should be removed entirely.

**Impact:** Moderate. The model may give the process list precedence over the workflow file, or waste attention resolving which list is authoritative.

### 2. `<objective>` claims "5-question prompt" but the workflow has 14 questions — a stale fact that creates a constraint conflict (§1 Action 3)

The `<objective>` block states "Interactive 5-question prompt (model, research, plan_check, verifier, branching)". The actual workflow presents 14 settings questions (model profile, research, plan check, verifier, auto-advance, nyquist, UI phase, UI gate, AI phase, branching, context warnings, research Qs, skip discuss, worktrees). The command file's description is not just outdated — it actively misleads any model that reads the command file without fully loading the workflow file.

§1 Action 3 requires auditing constraints for consistency. "5 questions" and "14 questions" cannot both be true. §1 Action 3 flags this as a conflict that "degrades unpredictably."

**Impact:** High in contexts where the workflow file fails to load or is partially read. The model may stop prompting after 5 questions or treat the remainder as optional.

### 3. No output format or success criteria specified in the command file — violates §7 Output Format Handling and §22 Pattern 3

The command file specifies no expected output format. A reader of `commands/gsd/settings.md` alone cannot determine what a successful run looks like. §22 Pattern 3 requires: "State the required output structure, field names, ordering, and an example before the model begins its task." §7 requires output format to be specified upfront.

The success criteria and confirmation display format live exclusively in the workflow file. This creates a hard coupling: the command file is not independently understandable (violating §19's modularity rule) and cannot be used to validate whether the command completed correctly without reading the workflow.

**Impact:** Moderate. Any orchestrator or diagnostic agent reading only the command file cannot determine what success looks like.

---

## Specific Rewrites

### Rewrite 1: Eliminate the redundant `<process>` block and fix the stale count in `<objective>`

**Current:**
```markdown
<objective>
Interactive configuration of GSD workflow agents and model profile via multi-question prompt.

Routes to the settings workflow which handles:
- Config existence ensuring
- Current settings reading and parsing
- Interactive 5-question prompt (model, research, plan_check, verifier, branching)
- Config merging and writing
- Confirmation display with quick command references
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/settings.md
</execution_context>

<process>
**Follow the settings workflow** from `@~/.claude/get-shit-done/workflows/settings.md`.

The workflow handles all logic including:
1. Config file creation with defaults if missing
2. Current config reading
3. Interactive settings presentation with pre-selection
4. Answer parsing and config merging
5. File writing
6. Confirmation display
</process>
```

**Rewrite:**
```markdown
<objective>
Interactive configuration of GSD workflow agents and model profile via 14-question prompt.

Follow the settings workflow at `@~/.claude/get-shit-done/workflows/settings.md` — it handles
all logic: config creation, current-value loading, interactive presentation, merging, writing,
and confirmation display.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/settings.md
</execution_context>
```

This removes the duplicate numbered list, eliminates the stale "5-question" claim, and satisfies §11 Action 3 (one canonical location per instruction) and §10 Action 1 (remove redundant instructions).

---

### Rewrite 2: Add a minimal `<output_format>` block to make the command self-describing (§7, §22 Pattern 3)

Insert after `<execution_context>`:

```markdown
<output_format>
On completion, display the settings confirmation table from the workflow. Do not summarize
or abbreviate — render the full table and quick command references exactly as specified in
the workflow's `confirm` step.
</output_format>
```

This gives any orchestrating model or diagnostic agent a verifiable signal for what success looks like without having to read the full workflow file.

---

### Rewrite 3: Convert the implicit negative "routes to workflow" framing to a positive directive (§5 Action 1)

The current `<process>` block uses weak delegation framing: "Follow the settings workflow... The workflow handles all logic including..." This is an indirect, passive instruction. §5 Action 1 requires positive, active framing.

**Current (from `<process>`):**
```
**Follow the settings workflow** from `@~/.claude/get-shit-done/workflows/settings.md`.
```

**Rewrite (integrated into revised `<objective>`):**
```
Execute the settings workflow at `@~/.claude/get-shit-done/workflows/settings.md`.
```

The imperative "Execute" is more directive than "Follow" and eliminates the passive wrapper sentence. This aligns with §21's active voice rule: "use imperative present tense for all instructions."

---

## Overall Verdict: Adequate

The command file fulfills its structural role as a routing stub and correctly uses frontmatter, tool scoping, and workflow delegation. The modular design is sound. However, two issues reduce reliability in a production system:

1. The stale "5-question" claim creates a real constraint conflict (§1 Action 3) that could cause early termination in degraded-load contexts.
2. The `<objective>` / `<process>` duplication violates §11 Action 3 and adds token cost with no instruction benefit.

Neither issue is architecturally broken, but both are straightforward to fix. The command rates **Adequate** — functional but not clean.
