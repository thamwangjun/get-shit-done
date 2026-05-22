# Critique: new-workspace.md

## Summary

`new-workspace.md` is a well-structured procedural workflow that covers the mechanical steps of workspace creation reliably. Its conditional branching logic is thorough, its error messages are concrete, and its success criteria provide a clear completion definition. However, it is written entirely in Markdown prose and code blocks — none of the guide's XML structural vocabulary is used. The workflow lacks a persona, an explicit output format specification, a quality bar, and any audience definition. Several instructions are framed negatively or implicitly rather than as positive specifications. The file reads more like an internal runbook than a production-grade prompt: it tells the agent what to do step-by-step, but gives it no model of what "good execution" looks like, no tie-breaking guidance for ambiguous situations, and no constraint pairs that make the permission boundary explicit.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Numbered phases with clear triggers.** Steps 1–9 are sequentially numbered and each has a distinct responsibility, approximating the phase pattern even without XML `<phase>` tags.

- **Section 5 (Instruction Framing) — Concrete conditional branching.** The workflow uses explicit `if`/`if not` logic at every decision point (e.g., `--repos` provided vs. not, `child_repo_count > 0` vs. 0, `is_git_repo` vs. not). This matches the guide's conditional instruction pattern precisely.

- **Section 14 (Constraint Enforcement) — Specific error messages with corrective actions.** Error blocks include the exact command the user should run to recover, e.g. `"Choose a different --name or --path"` and the `--repos` usage example. This is the guide's "pair every restriction with what IS permitted" principle in practice.

- **Section 16 (Multi-Phase Workflows) — Batch validation before creation.** Step 5 explicitly says "Report all validation errors at once, not one at a time." This prevents the anti-pattern of surfacing one error per run, which is consistent with the guide's quality-bar thinking.

- **Section 22 Pattern 9 (Tool permissions) — Scoped tool usage.** The `AskUserQuestion` calls include structured field names (`header`, `question`, `options`, `requireAnswer`, `multiSelect`), which constrains tool invocation to a well-defined schema.

- **Section 13 (Template variable injection) — Consistent variable naming.** Variables like `$WORKSPACE_NAME`, `$TARGET_PATH`, `$BRANCH_NAME`, `$STRATEGY` are used consistently in `${VARIABLE_NAME}` style throughout.

---

## Issues

### Issue 1: No XML structural tags for prompt sections
**Guide principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections. When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag."

**What's wrong:** The entire workflow uses Markdown headers (`##`) as delimiters. The guide explicitly states that XML tags are "strictly better than markdown headers" for Claude-class models because "the tag name carries semantic meaning." The `<purpose>`, `<required_reading>`, `<process>`, and `<success_criteria>` tags that already exist in the file are a start, but the internal sections (Setup, Parse Arguments, Select Repos, etc.) use Markdown `##` headers rather than `<phase>` tags.

**Concrete fix:** Wrap each major step in a `<phase>` tag with `id` and `name` attributes as specified in Section 16:
```xml
<phase id="1" name="Setup">
  ...
</phase>
<phase id="2" name="Parse Arguments">
  ...
</phase>
```

---

### Issue 2: No task specification — audience, intent, and quality bar are absent
**Guide principle:** Section 1 Actions 1–2 — "Extract the three task components: (a) what output is being requested, (b) why that output matters, (c) what a correct response looks like. Identify the audience."

**What's wrong:** The `<purpose>` tag states what the workflow does, but there is no `<audience>` tag (who is invoking this — a developer, a CI system, an orchestrating agent?), no `<quality_bar>` (what does successful workspace creation look like beyond the checklist items?), and no statement of why the output matters. The success criteria section approximates a quality bar but is structural (file exists, table written) rather than behavioral (workspace is usable, repos are accessible, branches are clean).

**Concrete fix:** Add at the top of the file, after `<purpose>`:
```xml
<audience>
A developer or orchestrating agent running GSD inside Claude Code. Assumes familiarity
with git worktrees and basic CLI usage. Does not assume knowledge of GSD internals.
</audience>
<quality_bar>
Workspace is ready for immediate use: all requested repos are accessible at their target
paths, branches are clean and checked out, WORKSPACE.md accurately reflects the created
state, and the user can cd into the workspace and run /gsd-new-project without error.
</quality_bar>
```

---

### Issue 3: No persona — agent identity is undefined
**Guide principle:** Section 6 Action 2 — "Make personas specific, not generic. A persona must constrain register, voice, or domain-specific style to be effective." Section 22 Pattern 1 — "State the agent's identity as a specific expert in the exact domain the task requires."

**What's wrong:** There is no `<persona>` tag anywhere in the file. The agent executing this workflow has no defined role, voice, or decision-making style. When ambiguous situations arise (e.g., the worktree fallback with timestamp), the agent has no persona to anchor its behavior or error-reporting tone.

**Concrete fix:**
```xml
<persona>
You are a workspace provisioning specialist for GSD. You create isolated development
environments precisely and report outcomes clearly. When errors occur, you enumerate all
failures before exiting — never stop at the first error. Your output is terse and
action-oriented: paths, branch names, and next commands, not prose explanation.
</persona>
```

---

### Issue 4: No output format specification — report format is implicit
**Guide principle:** Section 7 and Section 22 Pattern 3 — "State the required output structure, field names, ordering, and an example before the model begins its task."

**What's wrong:** Step 9 (Report and Next Steps) shows two example output blocks, which is good. However, these are embedded in Markdown as code blocks rather than wrapped in an `<output_format>` tag with explicit field names and constraints. There is no specification of tone, whether the agent should suppress intermediate steps from user-facing output, or what to emit if partial failure occurs beyond the two listed cases (all success, some fail).

**Concrete fix:** Wrap Step 9's outputs in an explicit output format block:
```xml
<output_format>
Report creation outcome using this format. Emit only the final report — suppress
intermediate step output unless a command fails.

On full success:
  Workspace created: {absolute_path}
  Repos: {count}  Strategy: {strategy}  Branch: {branch}
  Next: cd "{path}" && /gsd-new-project

On partial failure:
  Workspace created with {success}/{total} repos: {absolute_path}
  Succeeded: {names}
  Failed: {name} ({reason})
  Next: cd "{path}" && /gsd-new-project
</output_format>
```

---

### Issue 5: Negative-framed instructions not converted to positive equivalents
**Guide principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents. Before emitting any prompt, scan for negated instructions and rewrite each as a positive specification."

**What's wrong:** The file contains several implicit negative framings:
- Step 5: "must not exist or must be empty" — this is a prohibition, not a positive specification of what the valid state is.
- The `--auto` error block tells the agent what is missing without specifying the full valid invocation pattern upfront.
- The worktree fallback ("If that also fails, report the error and continue") is a residual behavior, not a positive rule.

**Concrete fix (examples):**
- "Target path must not exist" → "Target path must be absent or empty before creation begins."
- "If that also fails, report the error and continue" → "On second failure, record the repo name and error reason in the failure list, then continue with the next repo."

---

### Issue 6: Missing tie-breaking rule for strategy selection
**Guide principle:** Section 5 (Tie-breaking instructions) — "Add explicit tie-breaking when the model might be uncertain. Tie-breaking rules must match the domain's cost asymmetry."

**What's wrong:** When `--auto` is used, the default strategy is `worktree`. But there is no guidance for what to do when `worktree_available` is false in auto mode — the validation step (Step 5) would fail with an error, but the default-selection step (Step 4) does not anticipate this. The agent is left to infer the correct behavior (fall back to clone, or fail?).

**Concrete fix:** Add a tie-breaking rule in Step 4:
```
If --auto and worktree_available is false: default to clone strategy instead.
Log: "Defaulting to clone strategy: git worktree is unavailable."
```

---

### Issue 7: Constraint pairs are missing — permissions are restrictions only
**Guide principle:** Section 14 — "Pair every restriction with what IS permitted, stated equally concretely."

**What's wrong:** The validation error blocks tell the agent what is wrong but do not state what the agent is permitted to do instead in the same location. For example, the "not a git repo" error exits without telling the agent it is permitted to skip that repo and continue with the others if the user has specified multiple repos.

**Concrete fix:** Add a `<constraints>` block near Step 5:
```xml
<constraints>
  <permitted>
    - Create the target directory and all parent directories
    - Run git worktree add and git clone with the exact paths specified
    - Write WORKSPACE.md and initialize .planning/ at the target path
    - Continue creating remaining repos if one repo fails
  </permitted>
  <reserved_for_human_review>
    - Deleting or overwriting an existing non-empty target path
    - Modifying the source repos in any way
    - Creating branches with names not derived from the --branch argument
  </reserved_for_human_review>
</constraints>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

### Task Specification
- [ ] FAIL — Intent, audience, and quality bar are all explicit in the prompt. (Audience and quality bar are absent.)
- [ ] PASS — All constraints are compatible — no conflicts between scope, length, or depth.

### Chain of Thought
- [ ] N/A — CoT is included only for math, symbolic reasoning, or multi-step logic tasks. (Not a reasoning task; CoT not applicable.)
- [ ] N/A — CoT trigger used.
- [ ] N/A — Reasoning elicited before answer.
- [ ] N/A — CoT traces treated as heuristic aids.

### Few-Shot Examples
- [ ] N/A — Examples selected by semantic similarity. (No few-shot examples in this workflow type.)
- [ ] N/A — 2–5 examples total.
- [ ] N/A — Ordered simple → complex.
- [ ] N/A — Examples span diverse sub-types.
- [ ] N/A — Format consistent across all examples.
- [ ] N/A — Example order fixed across evaluation runs.

### Formatting
- [ ] PASS — Instruction is complete and clear before any formatting is applied.
- [ ] FAIL — Prompt sections are separated by semantically named XML tags. (Internal sections use Markdown `##` headers, not `<phase>` tags.)
- [ ] FAIL — At least 3 format variants will be tested on the target model. (No evidence of format testing.)

### Instruction Framing
- [ ] FAIL — All negative instructions have been converted to positive equivalents. (Several prohibitions not reframed.)
- [ ] PASS — Priority order is explicit when multiple criteria apply. (The `--auto` flag priority is explicit throughout.)
- [ ] FAIL — Tie-breaking rules match the domain's cost asymmetry. (No tie-breaking rule for worktree-unavailable + auto mode.)

### Persona
- [ ] FAIL — Persona is included only for open-ended or stylistic tasks. (No persona at all; one is warranted for consistent error-reporting style.)
- [ ] FAIL — Persona is specific (constrains voice/register), not generic. (Absent.)
- [ ] N/A — Persona descriptor is gender-neutral. (Absent, so no violation, but also no compliance.)

### Output Format
- [ ] N/A — Structured output tasks use a two-step reasoning-then-format approach. (Not a structured output task in the JSON/XML sense.)
- [ ] N/A — Single-call JSON places reasoning fields before answer fields.
- [ ] N/A — Constrained decoding is adopted only after free-form + post-processing has proven insufficient.
- [ ] FAIL — Machine-parsed output uses exact format specification with literal string requirements. (Step 9 output blocks are examples, not a formal `<output_format>` specification.)

### Context Placement
- [ ] PASS — Task instruction is at the start of the prompt. (`<purpose>` leads the file.)
- [ ] PASS — Primary document or input is at the end of the prompt. (`<success_criteria>` closes the file.)
- [ ] PASS — Background context is in the middle.
- [ ] PASS — All irrelevant context has been removed.
- [ ] N/A — Time-sensitive injected context is labeled as a snapshot. (Runtime context is injected via `gsd-sdk query`, not directly in the prompt.)

### Self-Consistency
- [ ] N/A — Self-consistency is applied only to tasks with a single correct answer.
- [ ] N/A — Inference budget permits 15–20 samples.

### Prompt Length
- [ ] PASS — Redundant instructions and repeated context have been removed.
- [ ] N/A — Long prompts have been compressed before sending.
- [ ] N/A — RAG context is the extracted relevant passage only.

### System/User Split
- [ ] PASS — Persistent instructions are in the system prompt. (Workflow is the system-level document.)
- [ ] N/A — Task-specific instructions are in the user prompt.
- [ ] PASS — Each instruction appears in exactly one location.
- [ ] N/A — Safety-critical constraints have external validation independent of the prompt.

### Agent/Subagent
- [ ] PASS — Agent prompts are fully self-contained. (All context is either parsed from $ARGUMENTS or queried via init command.)
- [ ] PASS — All file paths in agent output are absolute. (TARGET_PATH is always derived from absolute base paths.)
- [ ] N/A — Parallel agents are launched in a single message block.
- [ ] N/A — Adversarial probes are specified for verification agents.

### Structural Architecture
- [ ] FAIL — Large prompts are decomposed into atomic, single-responsibility modules. (The workflow is monolithic; strategy logic, validation, and creation are all in one file.)
- [ ] PASS — Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate.
- [ ] N/A — Modules compose at runtime via variable substitution, not copy-paste.

### Constraint Enforcement
- [ ] FAIL — Every restriction is paired with an equally concrete permission. (No `<constraints>` block with `<permitted>` / `<reserved_for_human_review>` pairs.)
- [ ] PASS — Hard exclusion lists are enumerated, not described qualitatively. (Error conditions are enumerated concretely.)
- [ ] N/A — Known edge cases have precedent-style rulings. (The timestamp fallback is a de-facto precedent but not labeled as such.)
- [ ] N/A — Confidence thresholds are numeric, not qualitative. (Not a filtering task.)

### Decision Frameworks
- [ ] PASS — Multi-option recommendations use an explicit decision tree or comparison table. (Worktree vs. clone options are presented via AskUserQuestion with labeled options.)
- [ ] N/A — Criteria checklists gate complex approaches.
- [ ] FAIL — Action permissions are framed around reversibility. (No reversibility classification for actions taken — e.g., git worktree add creates a branch, which is reversible; this is not distinguished from more permanent actions.)

### Multi-Phase Workflows
- [ ] FAIL — Complex tasks are organized into explicit named phases. (Steps are numbered but not wrapped in `<phase>` tags.)
- [ ] PASS — Required steps are distinguished from type-specific steps. (Universal steps like mkdir and WORKSPACE.md writing are clearly separated from per-strategy steps.)
- [ ] PASS — Scenario-based branching handles multiple paths explicitly. (worktree vs. clone, --auto vs. interactive, child_repo_count > 0 vs. 0 all handled.)

### Memory and Continuity
- [ ] N/A — Memory templates use XML tags as section labels.
- [ ] N/A — Compaction summaries include discoveries and failed approaches.
- [ ] N/A — Next steps are tied to the user's most recent explicit request.

### Modularity
- [ ] FAIL — Each prompt component has a single responsibility. (Strategy selection, validation, and creation are bundled in one document.)
- [ ] FAIL — Scope boundaries state both inclusions and exclusions. (No `<scope>` block defining what the workflow explicitly does NOT handle, e.g., post-creation project configuration.)

### Safety and Trust
- [ ] PASS — Validation is at system boundaries only; internal interfaces are trusted. (Validation targets user-provided paths and args; internal SDK responses are trusted.)
- [ ] N/A — Dual-use capabilities state permissions before restrictions.
- [ ] PASS — Authorization is narrow-scoped; each action confirmed before expanding scope. (AskUserQuestion gates strategy and GSD initialization choices.)

### Tone and Style
- [ ] N/A — Size constraints use numeric limits, not qualitative descriptors. (No size constraints apply to this workflow type.)
- [ ] PASS — Instructions use imperative present tense. ("Parse", "Extract", "Validate", "Write", "Report" are all imperative.)
- [ ] N/A — Working notes are in analysis tags, not user-facing output.

### Optimization
- [ ] FAIL — Prompt is flagged as a draft for automated optimization.
- [ ] N/A — Correct optimizer selected.
- [ ] N/A — Held-out test set reserved before optimization begins.

---

## Recommendations

**Priority 1 — Add XML `<phase>` tags to all major steps (Section 4 Action 2, Section 16)**

This is the highest-leverage single change. Replace the nine `## N. Step Name` Markdown headers with `<phase id="N" name="Step Name">` XML tags. This converts the document from a Markdown runbook into a structured prompt the model can parse unambiguously. The existing content requires no rewriting — only wrapping. Estimated effort: 15 minutes.

**Priority 2 — Add `<persona>`, `<audience>`, and `<quality_bar>` blocks (Section 1 Actions 1–2, Section 6 Action 2)**

The workflow currently has no model of who is running it, what success feels like beyond a checklist, or what voice to use when reporting. A specific persona (workspace provisioning specialist) anchors error-reporting tone and decision style. `<audience>` and `<quality_bar>` close the gap in Section 1 compliance. These three additions take under 20 lines and have high signal value for consistent behavior across runs.

**Priority 3 — Add a `<constraints>` block with explicit `<permitted>` / `<reserved_for_human_review>` pairs (Section 14)**

The workflow tells the agent what it cannot do (overwrite existing paths, create on non-git dirs) but does not explicitly state what it is permitted to do. Adding a `<constraints>` block with paired permission lists removes the ambiguity about whether the agent should continue after a partial failure, and clarifies that source repos are read-only. This directly addresses Issue 7 and partially addresses Issue 6.

**Priority 4 — Add an `<output_format>` block wrapping Step 9 report templates (Section 7, Section 22 Pattern 3)**

The two report templates in Step 9 are good examples but are embedded in Markdown code blocks without a formal output format tag or field-level constraints. Wrapping them in `<output_format>` and adding a third case (complete failure — zero repos succeeded) closes the coverage gap and makes the format machine-parseable if a calling orchestrator needs to detect workspace path from the output.

**Priority 5 — Add tie-breaking rule for `--auto` + `worktree_available: false` (Section 5 Tie-breaking)**

The current document leaves behavior undefined when auto mode is requested but worktrees are unavailable. The cost asymmetry here is clear: silently falling back to clone is preferable to a hard exit that abandons workspace creation entirely. A one-line tie-breaking rule in Step 4 resolves this edge case explicitly: `"If --auto and worktree_available is false: default to clone and log the substitution."`
