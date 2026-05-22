# Critique: pr-branch.md

## Summary

`pr-branch.md` is a well-structured, operationally clear workflow prompt. Its step-based XML organization, inline bash examples, and explicit file-classification logic give an executing agent a concrete and largely unambiguous path to follow. The workflow correctly encodes the core decision rules (what to include, what to exclude, what counts as mixed) and closes with a usable success checklist. However, the prompt was authored as a monolithic document rather than a composed set of modules, uses markdown headings inside XML where semantically named sub-tags would be stronger, omits any formal `<output_format>` specification, lacks a persona, provides no negative-instruction conversion, and does not satisfy several Section 23 checklist items that would improve reliability at the margin — particularly around constraint pairing, priority ordering, and tie-breaking rules for edge cases.

---

## Strengths

- **Section 16 (Multi-Phase Workflows):** The workflow is correctly decomposed into four named `<step>` phases (`detect_state`, `analyze_commits`, `create_pr_branch`, `verify`). Each step has a single responsibility and must be completed before the next begins, matching the phase-boundary pattern from Section 16.
- **Section 14 (Constraint Enforcement):** The commit classification taxonomy is explicit and enumerated — "Code commits", "Structural planning commits", "Transient planning commits", "Mixed commits". This avoids qualitative descriptions and gives the agent unambiguous decision criteria.
- **Section 8 (Context Placement):** The `<purpose>` block leads the prompt, establishing task intent at the highest-attention position. The `<success_criteria>` checklist closes the prompt, placing the quality bar at the end for recency-bias reinforcement.
- **Section 5 (Instruction Framing — Conditional Instructions):** The mixed-commit rule ("code + any planning files → INCLUDE") is an explicit conditional that removes a significant ambiguity. The fallback default (`TARGET=${1:-main}`) handles the no-argument case.
- **Section 1 Action 1 (Task Specification):** The `<purpose>` block encodes all three task components: what is being produced (a clean PR branch), why it matters (reviewers don't see transient artifacts), and what a correct result looks like (structural files preserved, transient files excluded).
- **Section 21 (Tone and Style):** Instructions use imperative present tense throughout ("Parse", "Check", "Display", "Classify", "Cherry-pick"). No passive constructions are used for commands.

---

## Issues

### Issue 1: No `<output_format>` tag — output specification is implicit and scattered
**Guide reference:** Section 7 Action 1; Section 22 Pattern 3; Section 23 checklist item `output_format`

**What's wrong:** The expected user-facing output is embedded piecemeal inside `<step>` blocks as inline code fences. There is no dedicated `<output_format>` section specifying the complete structure, field order, and literal strings of every display block. A reader cannot identify the full output contract without reading all four steps. When the model executes the steps, it has no single authoritative specification to validate against.

**Concrete fix:** Add an `<output_format>` tag after `</process>` (or before `<success_criteria>`) that consolidates and names every display block:

```xml
<output_format>
The workflow produces four display blocks, in order:

1. Header banner — rendered at step detect_state:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    GSD ► PR BRANCH
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Branch: {CURRENT_BRANCH}
   Target: {TARGET}
   Commits: {AHEAD} ahead

2. Commit analysis summary — rendered at step analyze_commits:
   Commits to include: {N} (code changes + structural planning)
   Commits to exclude: {N} (transient planning-only)
   Mixed commits: {N} (code + planning — included)
   Structural planning commits: {N} (STATE/ROADMAP/milestone updates — included)

3. Completion summary — rendered at step verify:
   PR branch created: {PR_BRANCH}
   Original: {AHEAD} commits, {ORIGINAL_FILES} files
   PR branch: {PR_COMMITS} commits, {TOTAL_FILES} files
   Planning files: {PLANNING_FILES} (should be 0)

4. Next steps block — rendered at step verify, always present.

All counts are integers. Output is plain text; no markdown bold or table formatting.
</output_format>
```

---

### Issue 2: No persona assigned — agentic voice and risk-stance are undefined
**Guide reference:** Section 6 Action 1–2; Section 22 Pattern 1; Section 23 checklist item `persona`

**What's wrong:** This workflow executes destructive-adjacent git operations (branch creation, cherry-pick, `git rm --cached`). Without a persona, the model defaults to generic assistant behavior and may over-explain, under-confirm, or adopt an insufficiently cautious stance on operations it cannot undo. Section 6 Action 1 specifies that a persona should be assigned when the task requires a specific voice or risk register.

**Concrete fix:** Add a focused persona block immediately after `<purpose>`:

```xml
<persona>
You are a git history specialist. Your job is to produce a clean, reviewer-facing branch
without losing any code change or structural planning state. Treat every cherry-pick as
irreversible: verify preconditions before executing, and halt with a clear error message
if any step produces unexpected output.
</persona>
```

This constrains the agent's risk register and makes the error-handling stance explicit.

---

### Issue 3: No tie-breaking rule for the mixed-commit edge case
**Guide reference:** Section 5 (Priority Ordering and Tie-breaking); Section 22 Pattern 4; Section 23 checklist item `instruction_framing`

**What's wrong:** The mixed-commit rule ("Touch code + any planning files → INCLUDE, transient planning changes come along; acceptable in mixed context") handles the common case but leaves two edge cases unresolved:

1. A commit touches only structural planning files AND transient planning files — is it structural or transient?
2. A commit that is 99% transient `.planning/` changes and contains one trivial non-planning file (e.g., `.gitignore`) — the rule as written forces inclusion, which may surprise the user.

There is no tie-breaking instruction for these boundary cases.

**Concrete fix:** Add an explicit tie-breaking block inside the `analyze_commits` step, after the classify section:

```xml
<tie_breaking>
When a commit touches both structural planning files and transient planning files
(no code files): classify as STRUCTURAL and INCLUDE. Structural intent takes precedence.

When a commit touches exactly one non-planning file alongside many transient planning files:
classify as MIXED and INCLUDE, but flag it in the analysis display with a note:
  ⚠ Mixed commit {HASH}: 1 code file + {N} transient planning files — included
This gives the user visibility to decide whether to rebase before pushing.
</tie_breaking>
```

---

### Issue 4: No constraint pairing — restrictions stated without equally concrete permissions
**Guide reference:** Section 14 (Explicit permission pairs); Section 23 checklist item `constraint_enforcement`

**What's wrong:** The file classification lists enumerate what is excluded (transient planning files) without equally concretely stating what the agent is permitted to do at the git level. The guide requires every restriction to be paired with a permission stated with equal specificity. The current format says "EXCLUDE" in prose but never explicitly authorizes the `git checkout -b`, `git cherry-pick`, `git rm --cached`, and `git commit` operations.

**Concrete fix:** Add a `<constraints>` block after the persona:

```xml
<constraints>
  <take_freely>
    - Read git log, diff, and rev-list output
    - Create a new local branch from target (git checkout -b)
    - Cherry-pick commits with --no-commit flag
    - Stage and unstage files in the working tree (git rm --cached)
    - Commit with -C to preserve original message and author
    - Return to the original branch (git checkout {CURRENT_BRANCH})
  </take_freely>

  <confirm_with_user>
    - Pushing the PR branch to any remote
    - Deleting or force-resetting any branch
    - Any operation outside the working repository
  </confirm_with_user>
</constraints>
```

---

### Issue 5: Verify step checks for zero planning files but structural planning files are intentionally preserved — the check is incorrect
**Guide reference:** Section 1 Action 3 (Constraint Consistency); Section 23 checklist item `task_specification`

**What's wrong:** The verify step displays `Planning files: {PLANNING_FILES} (should be 0)` and checks `grep "^\.planning/"`. However, the workflow explicitly preserves structural planning files (`STATE.md`, `ROADMAP.md`, `MILESTONES.md`, `PROJECT.md`, `REQUIREMENTS.md`, `milestones/**`) in the PR branch. The verification grep will count structural files as non-zero, causing a false alarm on any branch that legitimately carries structural planning changes. This is a constraint conflict: the inclusion rule and the verification rule are incompatible.

**Concrete fix:** Replace the verification grep with two separate counts and update the display:

```bash
TRANSIENT_FILES=$(git diff --name-only "$TARGET".."$PR_BRANCH" \
  | grep -E "^\.planning/(phases|quick|research|threads|todos|debug|seeds|codebase|ui-reviews)/" \
  | wc -l)
STRUCTURAL_FILES=$(git diff --name-only "$TARGET".."$PR_BRANCH" \
  | grep -E "^\.planning/(STATE|ROADMAP|MILESTONES|PROJECT|REQUIREMENTS)\.md|^\.planning/milestones/" \
  | wc -l)
```

Display:
```
PR branch: {PR_COMMITS} commits, {TOTAL_FILES} files
Transient planning files: {TRANSIENT_FILES} (should be 0)
Structural planning files: {STRUCTURAL_FILES} (preserved — expected)
```

---

### Issue 6: No XML tag vocabulary used inside steps — prose headings inside XML
**Guide reference:** Section 4 Action 2; Section 4 (XML tag vocabulary)

**What's wrong:** The internal structure of each `<step>` block relies on markdown bold (`**Structural planning files**`, `**Transient planning files**`, `**Code commits**`, etc.) and inline code fences rather than semantically named XML sub-tags. Section 4 Action 2 states that XML tags carry semantic meaning unavailable to markdown headers or delimiters. The classification categories in `analyze_commits` would benefit from explicit structural tags.

**Concrete fix:** Replace bold-prose classification lists with named sub-tags:

```xml
<step name="analyze_commits">
  <structural_files>
    Files always preserved: .planning/STATE.md, .planning/ROADMAP.md, ...
  </structural_files>
  <transient_files>
    Files always excluded: .planning/phases/**, .planning/quick/**, ...
  </transient_files>
  <classification>
    Code commits: ...
    Structural planning commits: ...
    Transient planning commits: ...
    Mixed commits: ...
  </classification>
</step>
```

This is a lower-priority fix — the current structure is readable — but aligns with the guide's structural vocabulary.

---

## Quick-Reference Checklist Score

Scored against Section 23. Items marked N/A where the section does not apply to a non-LLM-prompt workflow file (e.g., self-consistency sampling, RAG compression).

### task_specification
- PASS — Intent, audience (executing agent + reviewer), and quality bar are explicit in `<purpose>` and `<success_criteria>`
- FAIL — Constraint conflict: verify step checks for zero planning files but structural planning files are intentionally preserved (Issue 5)

### chain_of_thought
- N/A — Not a reasoning task; no CoT is needed or present

### few_shot_examples
- N/A — No examples section; the workflow is procedural, not classification-based

### formatting
- PASS — Instruction is complete before structure is applied
- FAIL — Prompt sections use markdown bold inside XML steps rather than semantically named sub-tags (Issue 6)
- N/A — Format variant testing (applies to single-model call prompts, not workflow files)

### instruction_framing
- PASS — Conditional instructions are explicit (mixed-commit rule, default target)
- FAIL — No priority ordering stated when multiple classification criteria might apply simultaneously
- FAIL — No tie-breaking rule for boundary edge cases (Issue 3)

### persona
- FAIL — No persona assigned for this agentic, destructive-adjacent workflow (Issue 2)
- N/A — Gender-neutral descriptor (no persona exists to evaluate)

### output_format
- FAIL — No dedicated `<output_format>` tag; output specification is scattered across steps (Issue 1)
- N/A — No structured/JSON output; constrained decoding not applicable
- N/A — Machine-parsed output format not applicable

### context_placement
- PASS — Task instruction (`<purpose>`) leads the prompt
- PASS — `<success_criteria>` closes the prompt (quality bar at high-attention end position)
- PASS — No irrelevant context present; the prompt is trimmed to essentials
- N/A — No time-sensitive injected context to label as snapshot

### self_consistency
- N/A — Not applicable; workflow is procedural, not a reasoning task

### prompt_length
- PASS — No redundant instructions; the prompt is appropriately lean
- N/A — Long-context compression and RAG not applicable

### system_user_split
- N/A — Workflow file format; system/user split handled by the harness, not the prompt author
- PASS — Each instruction appears in one location only; no duplication detected

### agent_subagent
- PASS — The workflow is designed to be self-contained; all required steps are explicit
- FAIL — No absolute path enforcement stated; bash examples use relative paths (`".planning/$dir/"`) without a constraint requiring absolute paths in agent output
- N/A — Parallel agent spawning not used; adversarial probes not applicable

### structural_architecture
- FAIL — Prompt is a monolithic document; not decomposed into atomic single-responsibility modules (Issue 6, lower priority)
- N/A — Template variable injection (`${VARIABLE_NAME}`) not used for runtime composition; this is a fixed workflow

### constraint_enforcement
- FAIL — No explicit permission pairing; restrictions listed without equally concrete permitted actions (Issue 4)
- PASS — Exclusion lists are enumerated concretely, not described qualitatively
- FAIL — No tie-breaking / edge-case precedents for boundary classification cases (Issue 3)
- N/A — Confidence thresholds not applicable (not a filtering/ranking task)

### decision_frameworks
- PASS — Classification rules function as an implicit decision tree
- N/A — Comparison tables and criteria checklists not applicable to this procedural task
- FAIL — Reversibility framework not applied; destructive-adjacent operations (`git rm --cached`, branch creation) are not framed around reversibility

### multi_phase_workflows
- PASS — Complex task organized into four explicit named phases
- PASS — `<success_criteria>` distinguishes the universal required outcomes
- PASS — No scenario-based branching needed; single execution path is correct here

### memory_and_continuity
- N/A — No memory template; this is a stateless workflow

### modularity
- FAIL — No explicit `<scope>` block with `<include>` and `<exclude>` sub-tags stating what the workflow covers and what it does not
- PASS — Each step has a single responsibility

### safety_and_trust
- FAIL — No `<constraints>` block with `<take_freely>` / `<confirm_with_user>` pairing (Issue 4)
- N/A — Dual-use capabilities and authorization scope not applicable

### tone_and_style
- PASS — Instructions use imperative present tense
- PASS — No working notes or intermediate reasoning in user-facing output
- PASS — Display counts are specific integers, not qualitative descriptors

### optimization
- N/A — Workflow files are not candidates for automated prompt optimization (DSPy/OPRO); they are procedural scripts

---

## Recommendations

Ordered by impact on correctness and agent reliability.

**1. Fix the verification bug (Issue 5) — highest priority**
The verify step will produce a false alarm on any branch that legitimately carries structural planning changes. This is a correctness defect. Replace the single `grep "^\.planning/"` count with two separate counts: one for transient files (should be 0) and one for structural files (expected, informational). This is a one-line bash change and a display update.

**2. Add a dedicated `<output_format>` block (Issue 1)**
Consolidate the four scattered display blocks into a single `<output_format>` section. Without this, the model must infer the output contract by reading all four steps — any step-level edit risks silently breaking output consistency. A single source of truth for the output structure is the highest-leverage structural fix.

**3. Add a persona with explicit risk register (Issue 2)**
Git operations that cannot be undone (branch creation from the wrong base, cherry-pick onto wrong parent) require the agent to adopt a verify-before-execute stance. A short persona block (`"halt with a clear error message if any step produces unexpected output"`) encodes this stance without adding length.

**4. Add tie-breaking rules for mixed and ambiguous commits (Issue 3)**
Two edge cases are unhandled: a commit touching both structural and transient planning files, and a commit that is predominantly transient but contains one non-planning file. Adding a `<tie_breaking>` block inside `analyze_commits` resolves both cases and prevents unpredictable behavior at the most common ambiguity boundary.

**5. Add a `<constraints>` block with explicit permission pairing (Issue 4)**
Enumerate the git operations that are permitted freely (`git checkout -b`, `git cherry-pick --no-commit`, `git rm --cached`, `git commit -C`) alongside the operations that require user confirmation (pushing to remote, deleting branches). This satisfies Section 14's pairing requirement and makes the blast-radius boundary explicit to both the agent and human reviewer.
