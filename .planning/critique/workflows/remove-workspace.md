# Critique: remove-workspace.md

## Summary

`remove-workspace.md` is a functional, procedurally clear workflow that delivers its core job — safe workspace removal with dirty-repo guards and confirmation gating. The structure is coherent and the safety steps are well-motivated. However, the workflow systematically under-specifies several dimensions the guide treats as load-bearing: it has no `<task>`, `<audience>`, or `<quality_bar>` declaration; uses markdown prose headers instead of semantically named XML tags for its primary sections; leaves the output format implicit; and omits tie-breaking and error-path branching for the cases that actually matter most (e.g., what happens when `rm -rf` fails, or when only some worktrees cannot be removed). Against the guide's checklist, roughly half the applicable items fail. The workflow functions as an internal runbook today but would benefit from being rebuilt around the guide's structural principles to be reliably executable by any instruction-tuned model without human disambiguation.

---

## Strengths

- **Section 20 (Safety and Trust) — reversibility framing applied.** Dirty-repo detection in Step 2 halts execution before any destructive action, matching the `<take_freely>` / `<confirm_with_user>` split from Section 15's reversibility framework. Uncommitted-change detection is the exact guard the guide would mandate for an irreversible action.

- **Section 14 (Constraint Enforcement) — hard stop correctly placed.** The "Exit. Do NOT proceed." directive after the dirty-repo check is an unambiguous, positive instruction. It avoids hedged language and is consistent with Section 5 Action 1's call for positive equivalents over negated ones. ("Do NOT proceed" is appropriate here as a terminal safety gate, not a primary directive.)

- **Section 16 (Multi-Phase Workflows) — sequential phases with distinct responsibilities.** The six-step linear flow (Setup → Safety → Confirm → Clean Up → Delete → Report) is consistent with the phase pattern: each step has a single concern and a clear completion condition before the next begins.

- **Section 5 (Instruction Framing) — conditional branching made explicit.** The `--text` flag / `text_mode` fallback for non-Claude runtimes is handled with explicit conditional logic, matching the guide's conditional instruction template. This is a strong real-world accommodation.

- **Section 13 (Structural Architecture) — template variable injection used correctly.** `$WORKSPACE_NAME`, `$WORKSPACE_PATH`, `$REPO_COUNT`, and `$REPO_NAME` are referenced consistently via variable substitution rather than hardcoded values, making the workflow parameterizable.

---

## Issues

### Issue 1 — No task specification header (Section 1, Actions 1–2)

**Guide principle:** Every prompt must make explicit (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. The audience must be encoded explicitly.

**What's missing:** The `<purpose>` tag names the workflow in one sentence, but it does not specify the audience (an automated agent? a human operator? both?), the success criterion, or the quality bar. There is no `<task>`, `<audience>`, or `<quality_bar>` wrapper.

**Concrete fix:**
```xml
<task>
Remove a named GSD workspace: clean up its git worktrees, then delete the workspace directory. Exit without deleting if any repo contains uncommitted changes.
</task>

<audience>
An instruction-tuned agent (Claude, Codex, or Gemini CLI) executing a user-initiated removal command. The agent has shell access, access to the gsd-sdk query tool, and access to AskUserQuestion or text-mode fallback.
</audience>

<quality_bar>
A correct execution leaves no orphaned worktrees, confirms removal with the user by name-match, and produces a concise final report. Any failure to clean a worktree is warned but does not abort the deletion.
</quality_bar>
```

---

### Issue 2 — Markdown headers instead of XML structural tags (Section 4, Actions 1–2)

**Guide principle:** When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag. Tags carry semantic meaning; markdown headers do not. The guide calls XML strictly better than `---` delimiters or `##` headers for Claude-class models.

**What's missing:** Steps 1–6 are separated with `## 1. Setup`, `## 2. Safety Checks`, etc. These are markdown prose headers, not the XML `<phase>` or section tags the guide mandates.

**Concrete fix:** Replace each `##` step heading with a `<phase>` tag using `id` and `name` attributes, as shown in Section 16:
```xml
<phase id="1" name="Setup">
  Extract workspace name from $ARGUMENTS …
</phase>

<phase id="2" name="Safety Checks">
  If has_dirty_repos is true …
</phase>
```
This makes phase boundaries machine-parseable and consistent with the guide's vocabulary.

---

### Issue 3 — Output format is implicit and inconsistent (Section 7, Action 1; Section 22, Pattern 3)

**Guide principle:** Output format must be specified completely and upfront. The report structure, field names, and ordering should be declared before the model begins execution.

**What's missing:** Step 6 shows one example report block, but it is embedded in the process description rather than declared in a dedicated `<output_format>` section at the top. There is no specification of what the report should contain when worktree removal partially fails (only warnings are mentioned, not how they appear in the final report).

**Concrete fix:** Add an `<output_format>` section after `<task>`:
```xml
<output_format>
On success, end with a report in this exact format:

Workspace "$WORKSPACE_NAME" removed.

  Path: $WORKSPACE_PATH (deleted)
  Repos: $REPO_COUNT worktrees cleaned up
  Warnings: [list any worktree removal failures, or omit if none]

On cancellation, respond with exactly: "Removal cancelled."
On dirty-repo abort, respond with the dirty-repo message and exit. No further output.
</output_format>
```

---

### Issue 4 — No error-path branching for `rm -rf` failure (Section 16 Scenario-based branching; Section 14 Constraint Enforcement)

**Guide principle:** Handle multiple scenarios explicitly rather than leaving the model to infer. Constraint enforcement should cover the cases that actually matter most, not just the happy path.

**What's missing:** Step 5 issues `rm -rf "$WORKSPACE_PATH"` with no failure handling. If the deletion fails (permission denied, path not found, directory already gone), the workflow is silent. Similarly, Step 4 warns on worktree failure and continues — but there is no branching for the case where all worktrees fail (suggesting the workspace path may be corrupted or already removed).

**Concrete fix:** Add explicit scenario coverage using the guide's `<scenarios>` pattern:
```xml
<scenarios>
  <scenario condition="rm_succeeds">
    Proceed to Step 6: Report.
  </scenario>
  <scenario condition="rm_fails">
    Report the error verbatim. Do not emit the success report.
    Output: "Error: Could not delete $WORKSPACE_PATH — [error message]. Manual cleanup required."
  </scenario>
  <scenario condition="all_worktrees_failed_to_remove">
    Warn the user before proceeding to rm -rf:
    "Warning: No worktrees were removed successfully. The workspace directory will still be deleted."
  </scenario>
</scenarios>
```

---

### Issue 5 — No explicit priority order or tie-breaking rule (Section 5, Instruction Framing)

**Guide principle:** When multiple criteria apply and signals could conflict, list them with explicit priority. Add tie-breaking when the model might be uncertain.

**What's missing:** The confirm-by-name-match rule (Step 3) has no tie-breaking specification. If the user types `WORKSPACE_NAME ` (trailing space), `workspace_name` (wrong case), or a partial match, the workflow is silent on whether to accept or reject. This is the uncertainty boundary that matters for a destructive operation.

**Concrete fix:** Add a tie-breaking rule under Step 3:
```xml
<tie_breaking>
Match is case-sensitive and exact. Trim leading/trailing whitespace before comparing.
Any mismatch — including case differences — is treated as a non-match. Exit with "Removal cancelled."
When in doubt, REJECT. Over-rejection is preferable to accidental deletion.
</tie_breaking>
```

---

### Issue 6 — Persona absent for a destructive-action context (Section 6, Action 1; Section 22, Pattern 1)

**Guide principle:** For open-ended or stylistically variable tasks, assign a persona that constrains register and decision-making style. For destructive workflows, the "reframe pattern" (Section 6) is directly applicable: "Your job is NOT to complete the removal quickly — it's to confirm safety at every step before deleting anything."

**What's missing:** No persona is assigned. The workflow is entirely instruction-only, giving the executing agent no behavioral bias toward caution. A model with no persona framing may skip or soften safety checks when context suggests urgency.

**Concrete fix:**
```xml
<persona>
You are a workspace cleanup specialist. Your job is not to complete the removal as fast as possible — it is to confirm safety at every step before destroying any data. Deletion is irreversible. Treat every confirmation step as mandatory, not advisory.
</persona>
```

---

## Quick-Reference Checklist Score

Scored against Section 23. Items not applicable to this workflow type are marked N/A.

### Task Specification
- [ ] Intent, audience, and quality bar are all explicit — **FAIL** (only a one-line `<purpose>`; no `<audience>` or `<quality_bar>`)
- [ ] All constraints are compatible — **PASS** (no conflicting constraints identified)

### Chain of Thought
- [ ] CoT included only for reasoning tasks — **N/A** (procedural workflow, not a reasoning task)
- [ ] CoT trigger used — **N/A**
- [ ] Reasoning elicited before answer — **N/A**
- [ ] CoT traces treated as heuristic — **N/A**

### Few-Shot Examples
- [ ] Examples selected by similarity — **N/A** (no examples in workflow)
- [ ] 2–5 examples total — **N/A**
- [ ] Ordered simple → complex — **N/A**
- [ ] Examples span diverse sub-types — **N/A**
- [ ] Format consistent across examples — **N/A**
- [ ] Example order fixed across evaluation runs — **N/A**

### Formatting
- [ ] Instruction complete before formatting applied — **PASS** (instructions are substantively complete)
- [ ] Prompt sections separated by semantically named XML tags — **FAIL** (markdown `##` headers used instead of `<phase>` tags)
- [ ] At least 3 format variants will be tested — **FAIL** (no format variants; single structure with no evaluation plan)

### Instruction Framing
- [ ] Negative instructions converted to positive equivalents — **PASS** (most instructions are positive; "Do NOT proceed" is acceptable as a safety gate)
- [ ] Priority order explicit when multiple criteria apply — **FAIL** (no priority order declared for confirmation matching or error handling)
- [ ] Tie-breaking rules match domain's cost asymmetry — **FAIL** (no tie-breaking rule for name-match confirmation on a destructive action)

### Persona
- [ ] Persona included only for open-ended or stylistic tasks — **FAIL** (persona is absent; a destructive-action context warrants a safety-biased persona using the reframe pattern)
- [ ] Persona is specific — **FAIL** (absent)
- [ ] Persona descriptor is gender-neutral — **N/A** (absent)

### Output Format
- [ ] Structured output uses two-step reasoning-then-format — **N/A** (no structured output required)
- [ ] Single-call JSON places reasoning before answer fields — **N/A**
- [ ] Constrained decoding adopted only after free-form proven insufficient — **N/A**
- [ ] Machine-parsed output uses exact format specification — **FAIL** (the Step 6 report block is not declared in a dedicated `<output_format>` section; failure-path output format is unspecified)

### Context Placement
- [ ] Task instruction at start of prompt — **FAIL** (`<purpose>` is a summary, not a task instruction; `<required_reading>` follows, which is not the primary task)
- [ ] Primary document or input at end — **N/A** (no primary document input)
- [ ] Background context in middle — **PASS** (init block is in Setup, not at the top)
- [ ] Irrelevant context removed — **PASS** (no obvious bloat)
- [ ] Time-sensitive injected context labeled as snapshot — **N/A**

### Self-Consistency
- [ ] Applied only to tasks with single correct answer — **N/A**
- [ ] Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- [ ] Redundant instructions and repeated context removed — **PASS** (no obvious duplication)
- [ ] Long prompts compressed — **N/A** (prompt is short)
- [ ] RAG context is extracted relevant passage only — **N/A**

### System / User Split
- [ ] Persistent instructions in system prompt — **N/A** (workflow file; not a system/user split context)
- [ ] Task-specific instructions in user prompt — **N/A**
- [ ] Each instruction in exactly one location — **PASS**
- [ ] Safety-critical constraints have external validation — **FAIL** (no external validation on the name-match confirmation; relies entirely on prompt-level instruction)

### Agent / Subagent
- [ ] Agent prompts are fully self-contained — **PASS** (the workflow is self-contained given the SDK query result)
- [ ] All file paths in agent output are absolute — **PASS** (`$WORKSPACE_PATH` is used as an absolute path throughout)
- [ ] Parallel agents launched in a single message block — **N/A**
- [ ] Adversarial probes specified for verification agents — **N/A**

### Structural Architecture
- [ ] Large prompts decomposed into atomic, single-responsibility modules — **PASS** (each step has a single responsibility)
- [ ] Template variables use `${VARIABLE_NAME}` syntax — **FAIL** (uses `$VARIABLE_NAME` without braces; guide specifies `${VARIABLE_NAME}` syntax)
- [ ] Modules compose at runtime via variable substitution — **PASS**

### Constraint Enforcement
- [ ] Every restriction paired with an equally concrete permission — **FAIL** (dirty-repo exit is stated but no corresponding "what IS permitted" pair is given)
- [ ] Hard exclusion lists enumerated — **N/A**
- [ ] Known edge cases have precedent-style rulings — **FAIL** (no precedents for partial worktree failure, `rm -rf` failure, or case-variant name matching)
- [ ] Confidence thresholds are numeric — **N/A**

### Decision Frameworks
- [ ] Multi-option recommendations use decision tree or comparison table — **N/A**
- [ ] Criteria checklists gate complex approaches — **FAIL** (no criteria checklist before the irreversible deletion step)
- [ ] Action permissions framed around reversibility — **PASS** (dirty-repo check and confirm step gate the irreversible action)

### Multi-Phase Workflows
- [ ] Complex tasks organized into explicit named phases — **FAIL** (markdown headers used, not `<phase id="" name="">` tags)
- [ ] Required steps distinguished from type-specific steps — **FAIL** (Step 4 is strategy-conditional but not marked with `<type_specific_strategy>`)
- [ ] Scenario-based branching handles multiple paths explicitly — **FAIL** (only happy-path and dirty-repo abort are handled; `rm -rf` failure and all-worktrees-failed are unhandled)

### Memory and Continuity
- [ ] Memory templates use XML tags as section labels — **N/A**
- [ ] Compaction summaries include discoveries and failed approaches — **N/A**
- [ ] Next steps tied to user's most recent explicit request — **N/A**

### Modularity
- [ ] Each prompt component has a single responsibility — **PASS**
- [ ] Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` with explicit `<exclude>` list; the workflow does not state what it will not do, e.g., it will not remove the source repo itself)

### Safety and Trust
- [ ] Validation at system boundaries only — **PASS** (init query result is parsed and used; internal logic is trusted)
- [ ] Dual-use capabilities state permissions before restrictions — **N/A**
- [ ] Authorization is narrow-scoped; each action confirmed before expanding scope — **PASS** (name-match confirmation gates deletion)

### Tone and Style
- [ ] Size constraints use numeric limits — **N/A** (no output length requirement)
- [ ] Instructions use imperative present tense — **PASS** (most instructions are imperative: "Extract", "Parse", "Exit", "Warn")
- [ ] Working notes are in `<analysis>` tags — **N/A**

### Optimization
- [ ] Prompt flagged as draft for automated optimization — **FAIL** (not flagged)
- [ ] Correct optimizer selected — **FAIL** (not addressed)
- [ ] Held-out test set reserved — **FAIL** (not addressed)

---

## Recommendations

Prioritized by impact on execution reliability.

**1. Add `<task>`, `<audience>`, and `<quality_bar>` declarations (Section 1, Actions 1–2; highest priority)**
The workflow has no explicit task specification. Without `<audience>`, the executing agent cannot calibrate its behavior for non-Claude runtimes, and without `<quality_bar>`, it has no criterion for what "done correctly" means. Add these three tags at the top before `<process>`. This single change addresses the most fundamental structural gap.

**2. Replace markdown `##` step headers with `<phase id="" name="">` tags (Section 4, Action 2; Section 16)**
All six steps should become `<phase>` elements. This is a mechanical substitution that converts the workflow from prose-structured to XML-structured, making it machine-parseable and consistent with the guide's vocabulary. Simultaneously, mark Step 4 (worktree cleanup) with a `strategy="worktree"` attribute or wrap its body in `<type_specific_strategy>` to distinguish it from the universal steps.

**3. Declare an `<output_format>` section covering all exit paths (Section 7, Action 1; Section 22, Pattern 3)**
Move the Step 6 report block into a top-level `<output_format>` section and add the cancellation and error-path report formats alongside it. The model should know what all three terminal outputs look like before it begins executing, not discover them mid-process. Include the partial-failure warning format for worktree removal.

**4. Add scenario-based branching for `rm -rf` failure and all-worktrees-failed (Section 16, Scenario-based branching)**
The current workflow is silent on two likely failure modes. Add `<scenarios>` with three branches: success, `rm` failure, and all-worktrees-failed. This is the change most likely to prevent silent data-loss or ambiguous output in production.

**5. Add a safety-biased persona using the reframe pattern (Section 6, Action 2; Section 22, Pattern 1)**
A persona of "Your job is not to complete the removal quickly — it is to confirm safety at every step before deleting anything" gives the executing model a behavioral anchor for this irreversible workflow. Add a `<persona>` block immediately after `<task>`. Also add a `<tie_breaking>` rule under Step 3 specifying case-sensitive, exact-match, whitespace-trimmed comparison with a reject-on-doubt bias (Section 5, tie-breaking).
