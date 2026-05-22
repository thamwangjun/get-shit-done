# Critique: `commands/gsd/pr-branch.md`

Critiqued against: Prompt Engineering Guide V09
Files reviewed:
- `commands/gsd/pr-branch.md` (the command stub)
- `~/.claude/get-shit-done/workflows/pr-branch.md` (the delegated workflow)

> The command stub is thin by design — it defers entirely to the workflow file. This critique therefore treats both files as the prompt artifact under review, because a stub that reads "execute this file end-to-end" is evaluated by the quality of what it points to.

---

## Strengths

### XML structure used throughout (§4 Formatting and Structure)

The workflow file wraps every major section in semantically named XML tags: `<task>`, `<context>`, `<constraints>`, `<priority_order>`, `<process>`, `<step>`, `<quality_bar>`, `<success_criteria>`, `<offer_next>`. This matches §4 Action 2 exactly — sections are named by what they *are*, not just where they start. The tag vocabulary is consistent with the guide's recommended top-level structural tags.

### Constraint block uses the permitted/reserved pair (§14 Constraint Enforcement)

`<constraints>` separates `<permitted>` from `<reserved>` with equal specificity. This satisfies the guide's rule: "pair every restriction with what IS permitted, stated equally concretely." The permitted list enumerates specific git commands; the reserved list enumerates specific actions the model must not take unilaterally (push, open PR, modify original branch). No ambiguity about what actions remain available.

### Explicit priority ordering with tie-breaking logic (§5 Instruction Framing)

`<priority_order>` lists three ranked criteria: Correctness > History fidelity > User clarity. This directly applies §5's directive to "list them with explicit priority." When the model faces a trade-off (e.g., whether to include a mixed commit), the ranking resolves it without model discretion.

### Precondition checks with explicit stop conditions (§16 Multi-Phase Workflows)

`detect_state` verifies the current branch is not `main`/`master`/`trunk` and that commits exist ahead of target before proceeding. Both failure conditions include explicit halt instructions. This follows the §16 pattern of distinguishing required steps and encoding scenario-based branching rather than leaving the model to infer what to do on error.

### Verification step with a named `<quality_bar>` (§1 Task Specification, §22 Pattern 3)

The `<verify>` step enumerates three concrete, boolean quality criteria — PLANNING_FILES equals 0, PR_COMMITS equals include count, TOTAL_FILES less than ORIGINAL_FILES. This is the "quality bar" construct from §1 Action 1, and it follows §22 Pattern 3: output format specified completely before the model begins.

### `<success_criteria>` as a machine-checkable checklist (§14 Constraint Enforcement)

The trailing checklist of seven boolean criteria gives the model a self-verification tool before completing the task. This reduces drift from the intended behavior across all branches of execution.

---

## Weaknesses

### 1. Command stub provides no task framing of its own — violates §8 Context Placement (Action 1) and §1 Task Specification

The command stub (`commands/gsd/pr-branch.md`) does three things: restates the task in one sentence (`<objective>`), names the workflow file to execute (`<execution_context>`), and repeats the instruction to execute it (`<process>`). The `<objective>` block is the only task framing a model reads before being told to open another file.

Per §8 Action 1, "the task instruction must always lead." The stub leads with the task, but the task is stated twice in two adjacent tags (`<objective>` says "Create a clean branch suitable for pull requests" and `<process>` says "Execute the pr-branch workflow... end-to-end"). This is duplication without added signal.

More critically, `<objective>` and `<process>` contain different information about the task:

- `<objective>` frames the *why* (reviewers see only code changes)
- `<process>` frames the *how* (execute this file)

Per §11 Action 3, "each instruction appears in exactly one location." The stub should either be a pure pointer (drop `<objective>`, keep only `<execution_context>` and `<process>`) or a self-contained entry point that does not rely on the workflow file for core task meaning.

**Impact**: Low in isolation, but creates ambiguity when the two files are read together — the model sees the task described twice with slightly different framing.

### 2. No `<audience>` tag — §1 Task Specification Action 2, §4 XML tag vocabulary

Neither file identifies the audience. §1 Action 2 requires encoding "who will consume the output and in what context — their domain knowledge, vocabulary level, and any relevant assumptions they bring." For this command, the audience is a developer familiar with git but potentially unfamiliar with GSD's `.planning/` directory conventions.

The absence matters in two concrete ways:

First, the classification logic (structural vs. transient planning files) assumes the reader understands what `.planning/phases/`, `.planning/milestones/`, etc. *mean* conceptually. Without audience framing, the model has no signal about how much explanation is appropriate when displaying progress or errors.

Second, the `<offer_next>` block at the end suggests `/gsd-ship` and `/gsd-progress` by bare slash command, assuming the user knows what those commands do. With an explicit audience tag, the model would know whether to expand these suggestions.

**Impact**: Medium. Missing audience framing degrades error messages and user-facing output — the model defaults to generic verbosity.

### 3. Negative instruction in `<constraints><reserved>` — §5 Instruction Framing Action 1

The `<reserved>` block lists what the model must *not* do. §5 Action 1 requires converting negative instructions to positive equivalents. The current form:

```
- Pushing the PR branch to remote (user runs this manually or via /gsd-ship)
- Opening the pull request
- Modifying commits on the original feature branch
```

All three are framed as prohibitions. The guide's conversion rule is mechanical: rewrite as the positive behavior to be taken instead. For example:

```
- Stop after creating the local PR branch; instruct the user to push using:
    git push origin {PR_BRANCH}
- Stop before opening any pull request; direct the user to /gsd-ship for that step
- Treat the original feature branch as read-only throughout
```

The second form specifies *what to do* at each decision point, rather than what to avoid. The distinction matters because the model encodes "do X" more reliably than "don't do Y."

**Impact**: Low-to-medium. For a well-scoped git workflow, prohibitions are usually sufficient in practice, but they violate the guide's framing rule and introduce marginal inconsistency risk.

### 4. Mixed-commit policy is unresolved — §5 Instruction Framing (tie-breaking), §1 Action 3 (constraint conflict)

The `analyze_commits` step classifies mixed commits (code + any planning files) as INCLUDE, with the note: "transient planning changes come along; acceptable in mixed context." The `create_pr_branch` step then strips the transient directories from mixed commits via `git rm -r --cached`.

The result is that transient planning changes in mixed commits are silently dropped. The user sees the code portion of the commit but not that planning content was stripped. The `<priority_order>` does not address this case — it ranks Correctness > History fidelity, but does not define what "history fidelity" means when a commit is partially preserved.

Per §5, tie-breaking rules must "match the domain's cost asymmetry." The asymmetry here is: *is it worse to include a dirty commit (transient planning files survive into PR) or to silently alter a commit's content (code preserved, planning stripped without notice)?* The workflow silently chooses the latter but does not name the choice or justify it.

The verification step checks that PLANNING_FILES equals 0 but does not check whether the commit count matches the original classification. A user whose mixed commit had important planning context stripped would not see a warning.

**Impact**: Medium. The logic is correct by construction but the trade-off is unnamed, making it hard to audit or modify later.

### 5. No few-shot examples calibrating the output display (§3 Few-Shot Example Construction, §22 Pattern 2)

The workflow specifies two ASCII display blocks (the status banner and the completion banner) with placeholder variables. There are no examples of what a completed run looks like — no sample commit analysis output, no sample `PLANNING_FILES=0` success message.

§22 Pattern 2 states: "accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." The display format for commit classification (`Commits to include: {N}...`) is specified by template, but there is no calibrating example showing a real run, which means the model has no reference for how verbose or terse the intermediate output should be.

**Impact**: Low for the git operations, higher for user-facing output fidelity.

---

## Specific Rewrites

### Rewrite 1: Fix the `<reserved>` block — negative to positive (addresses Weakness 3)

**Current:**
```xml
<reserved>
- Pushing the PR branch to remote (user runs this manually or via /gsd-ship)
- Opening the pull request
- Modifying commits on the original feature branch
</reserved>
```

**Rewritten:**
```xml
<reserved>
Stop after local branch creation. At each decision point:
- After creating the PR branch: output the push command and stop. Do not run `git push`.
- After creating the PR branch: output the `gh pr create` command and stop. Do not open a PR.
- Throughout all steps: treat the original feature branch as read-only.
  If a cherry-pick would require modifying the original branch, abort and report the conflict.
</reserved>
```

This converts each prohibition into a stop-condition plus a positive action (output the command, abort and report). The model has unambiguous behavior at each decision point rather than a list of things to avoid.

---

### Rewrite 2: Name and make explicit the mixed-commit policy (addresses Weakness 4)

In `<analyze_commits>`, add a `<tie_breaking>` sub-element after the classification block:

```xml
<tie_breaking>
Mixed commits (code + transient planning files) are included but transient planning content
is stripped during cherry-pick. This preserves the code change while removing reviewer noise.

After stripping, the commit message is preserved verbatim. The user is not notified of the
strip unless a transient file fails to remove cleanly.

Cost asymmetry: including a dirty commit (transient planning files visible to reviewers)
is a worse outcome than silently stripping planning content that reviewers do not need.
Include-and-strip is always preferred over exclude-for-cleanliness.
</tie_breaking>
```

Then update the `<verify>` step's quality bar to include a strip-audit check:

```xml
<quality_bar>
A correct result satisfies all of:
- Transient PLANNING_FILES equals 0
- PR_COMMITS equals the include count from the analysis step
- TOTAL_FILES is less than ORIGINAL_FILES (transient planning files removed)
- For each mixed commit: at least one non-.planning/ file is present in the final diff
  (confirms the code portion survived the strip)
</quality_bar>
```

---

### Rewrite 3: Add `<audience>` to the command stub (addresses Weakness 2)

In `commands/gsd/pr-branch.md`, add between `<objective>` and `<execution_context>`:

```xml
<audience>
A developer on a GSD-managed project who is familiar with git but may not know which
.planning/ subdirectories are transient vs. structural. Error messages and progress output
should name specific files and directories affected, not just report counts. When suggesting
next steps, use full commands, not just slash-command names.
</audience>
```

This propagates to the workflow model, biasing output messages toward specificity (file names, full commands) rather than generic counts.

---

## Overall Verdict

**Adequate**

The workflow file is structurally solid: XML tags are semantically correct, the constraint block is well-paired, priority ordering is explicit, and the verification step has a named quality bar. These are the guide's highest-leverage patterns and the workflow applies them correctly.

The command stub is an unnecessary layer of indirection that introduces duplication without adding framing value (§8, §11). The `<reserved>` block uses negative framing throughout (§5). The mixed-commit policy is correct by implementation but unnamed as a policy decision, making it opaque to future editors (§5 tie-breaking). The missing `<audience>` tag degrades output quality in error and progress messages (§1).

None of these are blocking defects for a well-scoped git workflow. The primary opportunity is the command stub: either collapse it into the workflow file (single file, clean separation) or give it real entry-point value by adding audience context and removing the duplicate task description.
