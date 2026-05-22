# Critique: `commands/gsd/pause-work.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### XML tag structure (§4 Formatting and Structure)

The command uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) rather than markdown headers or bare prose. This is correct per §4 Action 2, which specifies that prompt sections must be wrapped in semantically named XML tags. The tags name what each section *is*, not just where it starts.

### Single-responsibility design (§19 Modularity and Composition, §22 Pattern 5)

The command file is intentionally thin — it delegates all logic to the workflow file via `@~/.claude/get-shit-done/workflows/pause-work.md`. This is the decomposed, single-responsibility architecture described in §19 and Pattern 5. The command file handles routing and framing; the workflow handles execution. Neither bleeds into the other's concern.

### Task instruction leads the prompt (§8 Context Placement)

The `<objective>` block appears first, before `<execution_context>` and `<context>`. This follows §8 Action 1: the task instruction must lead the prompt, because models attend most strongly to the beginning.

---

## Weaknesses

### 1. The `<objective>` block mixes task definition with implementation listing (§1 Task Specification, §4 Formatting)

`<objective>` opens with the output being requested ("Create `.continue-here.md` handoff file"), then immediately lists five internal workflow steps ("Current phase detection from recent files", "Complete state gathering…", etc.). Per §1 Action 1, a task specification must separate three components: (a) what output is requested, (b) why it matters / how it will be used, and (c) what a correct or high-quality response looks like.

The "Routes to the pause-work workflow which handles:" list is neither (b) nor (c) — it is implementation scaffolding that belongs inside the workflow, not in the command-level objective. It pollutes the task definition with internal mechanics, creating ambiguity about what the agent is responsible for versus what the workflow handles.

The `<quality_bar>` component is entirely absent. There is no specification of what a correct handoff file looks like from the command's perspective — no mention of completeness, specificity, or the machine-readable JSON output. Per §1 Action 1, this is a missing required component.

### 2. The `<process>` block repeats what `<objective>` already states (§11 System vs. User Prompt Allocation, Action 3)

`<process>` contains:

```
**Follow the pause-work workflow** from `@~/.claude/get-shit-done/workflows/pause-work.md`.

The workflow handles all logic including:
1. Phase directory detection
2. State gathering with user clarifications
3. Handoff file writing with timestamp
4. Git commit
5. Confirmation with resume instructions
```

This is a near-verbatim restatement of the five bullet points already enumerated in `<objective>`. §11 Action 3 is explicit: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." The numbered list in `<process>` provides no additional information beyond what the bullets in `<objective>` already say.

### 3. Negative-framing absence and missing conditional branching (§5 Instruction Framing)

The command never states what the agent should do if the workflow file cannot be read or if `execution_context` fails to resolve. §5 specifies that conditional instructions must use explicit branching syntax:

```
If no PR number is provided in the args, run `gh pr list` to show open PRs.
If a PR number is provided, run `gh pr view <number>` to get PR details.
```

There is no analogous fallback for the case where `@~/.claude/get-shit-done/workflows/pause-work.md` is absent or unresolvable. The command silently assumes resolution will succeed. This creates an undefined failure mode — the agent has no instruction for the failure path.

Additionally, the `<context>` tag contains a single explanatory sentence ("State and phase progress are gathered in-workflow with targeted reads.") that reads as a comment for a human reader, not an instruction for the model. It contributes nothing actionable and should either be removed or converted into a concrete conditional instruction.

---

## Specific Rewrites

### Rewrite 1: Collapse `<objective>` and `<process>` into a single, non-redundant task block

**Current (two separate blocks that repeat the same five points):**

```xml
<objective>
Create `.continue-here.md` handoff file to preserve complete work state across sessions.

Routes to the pause-work workflow which handles:
- Current phase detection from recent files
- Complete state gathering (position, completed work, remaining work, decisions, blockers)
- Handoff file creation with all context sections
- Git commit as WIP
- Resume instructions
</objective>
...
<process>
**Follow the pause-work workflow** from `@~/.claude/get-shit-done/workflows/pause-work.md`.

The workflow handles all logic including:
1. Phase directory detection
2. State gathering with user clarifications
3. Handoff file writing with timestamp
4. Git commit
5. Confirmation with resume instructions
</process>
```

**Rewrite (single task block, no duplication, adds quality bar and failure conditional):**

```xml
<task>
Execute the pause-work workflow at `@~/.claude/get-shit-done/workflows/pause-work.md`.

If the workflow file cannot be read, stop and tell the user: "pause-work workflow not found
at ~/.claude/get-shit-done/workflows/pause-work.md — cannot proceed."

Success criteria:
- `.planning/HANDOFF.json` written with machine-readable task state
- `.continue-here.md` written at the correct context-specific path
- Both files committed as a WIP commit
- User sees the location of the handoff file and the `/gsd-resume-work` resume instruction
</task>
```

This eliminates the duplication flagged in §11 Action 3, adds the quality bar missing from §1 Action 1, and adds the failure conditional required by §5.

---

### Rewrite 2: Remove or convert the vacuous `<context>` block

**Current:**

```xml
<context>
State and phase progress are gathered in-workflow with targeted reads.
</context>
```

**Option A — Remove it entirely.** The sentence describes an implementation detail that is already encoded in the workflow. It adds no information the model needs to act on and occupies a prime structural slot for no benefit. Per §8 Action 4: "Trim all context to what is directly relevant."

**Option B — Replace with actionable runtime context.** If context injection is warranted, follow §8's runtime context injection pattern:

```xml
<context>
  <current_branch>!`git branch --show-current`</current_branch>
  <recent_commits>!`git log --oneline -5`</recent_commits>
</context>
```

This gives the workflow real signal rather than a prose comment.

---

### Rewrite 3: Rename `<objective>` to `<task>` for guide-standard vocabulary

The guide's XML tag vocabulary (§4, XML tag vocabulary table) specifies `<task>` as the top-level tag for the primary instruction. `<objective>` is not in the defined vocabulary. While this is a minor issue, using non-standard tag names reduces interoperability with composed prompts and makes the vocabulary inconsistent with other command files that may use `<task>`. The fix is a one-word rename: `<objective>` → `<task>`.

---

## Overall Verdict

**Adequate.**

The structural skeleton is sound: the command is appropriately thin, delegates correctly to a workflow, and uses XML tags. These are the right patterns per §19 and §4. However, the command has a material redundancy problem (the five workflow steps stated twice in two different blocks), a missing quality bar (§1), and a vacuous context block (§8) that together make the file noisier than it needs to be. The failure path for an unresolvable `execution_context` is undefined (§5). None of these are bugs that would prevent the command from working in the happy path, but they degrade robustness and precision — the command does not meet the checklist standards of §23 (`[ ] Intent, audience, and quality bar are all explicit`, `[ ] Each instruction appears in exactly one location`, `[ ] All irrelevant context has been removed`).
