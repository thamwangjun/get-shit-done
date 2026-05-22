# Critique: undo.md

## Summary

The `undo.md` workflow is functionally thorough — it covers three distinct modes, dependency checking, a confirmation gate, dirty-tree guards, conflict cleanup, and a commit-message convention — making it one of the more complete workflows in the GSD suite. Its use of `<step>` XML tags, `<success_criteria>`, and `<process>` wrapping demonstrates sound structural instincts. However, it falls short on several guide-level requirements: there is no `<persona>`, no `<output_format>` specification, no explicit `<constraints>` block with paired permissions and restrictions, no priority ordering when criteria conflict, no few-shot examples to calibrate model behavior on ambiguous inputs, and the instruction framing includes several negative-form directives that the guide requires to be converted to positive equivalents. The workflow reads more like a detailed SOP document than a prompt engineered for reliable, consistent LLM execution.

---

## Strengths

- **Section 4 (XML tags):** The file wraps its content in semantically named XML tags (`<purpose>`, `<process>`, `<step>`, `<success_criteria>`), giving the model richer structural signal than plain markdown headers alone.
- **Section 14 (Constraint Enforcement — hard constraint):** The `HARD CONSTRAINT` on `git revert --no-commit` and the explicit prohibition of `git reset` is stated clearly and repeated in `<success_criteria>`, which is good constraint reinforcement.
- **Section 16 (Multi-Phase Workflows — required vs. type-specific steps):** The `dependency_check` step correctly distinguishes universal steps (dirty-tree guard, confirmation gate) from mode-specific behavior (phase vs. plan dependency logic). The `priority="first"` attribute on the banner step is a lightweight phase-ordering signal.
- **Section 16 (Scenario-based branching):** The three MODE branches (`last`, `phase`, `plan`) are explicitly named and their logic is fully spelled out rather than left to model inference — this matches the guide's scenario-based branching pattern.
- **Section 5 (Conditional instructions):** Conditional branching for TEXT_MODE is explicit (`if --text present OR text_mode is true`), following the guide's pattern for runtime conditionals.
- **Section 20 (Safety — reversibility):** The workflow is safety-conscious: it uses `git revert` (non-destructive), has a dirty-tree abort, a user confirmation gate, and explicit cleanup on failure. These decisions align with the reversibility framework in Section 15.
- **Section 1 (Task Specification — what the output is):** The `<purpose>` tag states clearly what the workflow does and its key constraint (preserve history), which satisfies part of Action 1's three-component requirement.

---

## Issues

### Issue 1 — No persona assigned for an interactive, procedural workflow
**Principle:** Section 6 Action 1 — classify the task before assigning a persona. Section 6 Action 2 — make personas specific.

**Problem:** The undo workflow is an interactive, multi-step procedural task requiring the model to act as a precise git operations coordinator. Without a persona, the model defaults to generic assistant behavior. This matters especially for the interactive `--last` mode, where the model must interpret ambiguous user selections and the tone/register of prompts matters.

**Fix:** Add a specific persona block at the top of `<process>`:

```xml
<persona>
You are a GSD workflow executor specializing in safe, history-preserving git operations.
Your priority is correctness and safety over speed — confirm before acting, and abort
cleanly on any ambiguity or conflict.
</persona>
```

---

### Issue 2 — Negative instructions not converted to positive equivalents
**Principle:** Section 5 Action 1 — convert negative instructions to positive equivalents before emitting any prompt.

**Problem:** The workflow contains several negative-form directives:
- "NEVER use git reset (except for conflict cleanup...)"
- "NEVER git reset"
- "git reset --hard is NEVER used anywhere in this workflow"

The guide's conversion table requires rewriting negatives as positive behavioral specifications. The exception clause for cleanup also creates a partial contradiction that violates the spirit of the rule.

**Fix:** Convert to positive form:

```
Use git revert --no-commit exclusively for all revert operations.
The only git reset invocations permitted are: git reset HEAD and git restore .
for cleanup after a failed revert — both are already staged in the cleanup block.
```

The `<success_criteria>` checklist item should also be rewritten: "git reset --hard is NEVER used" → "All revert operations use git revert; only git reset HEAD is permitted, strictly in the conflict-cleanup path."

---

### Issue 3 — No `<output_format>` block; output format is implicit and scattered
**Principle:** Section 7 (Output Format Handling) — output format specified completely and upfront (Production Pattern 3). Section 4 Action 2 — use XML tags to separate prompt sections.

**Problem:** The output the model must produce (banner, numbered commit list, AskUserQuestion calls, commit message, summary block) is described inline within each `<step>` rather than specified upfront in a dedicated `<output_format>` block. The commit-message format is buried in `execute_revert` and not surfaced as a canonical specification. The guide requires format specification to be part of the task definition, not an afterthought.

**Fix:** Add an `<output_format>` section immediately after the `<purpose>` block:

```xml
<output_format>
All user-facing output uses the GSD banner and box conventions from ui-brand.md.
Commit messages follow the pattern: revert(SCOPE): undo SCOPE — REASON
where SCOPE is TARGET_PHASE, TARGET_PLAN, or "N selected commits" for MODE=last.
AskUserQuestion is used for all interactive selections unless TEXT_MODE is active.
Each step displays its output before proceeding to the next step.
</output_format>
```

---

### Issue 4 — No `<constraints>` block with paired permissions and restrictions
**Principle:** Section 14 (Constraint Enforcement) — pair every restriction with what IS permitted, stated equally concretely. Section 14 — use `<permitted>` and `<reserved_for_human_review>` sub-tags.

**Problem:** The constraint that `git reset --hard` is forbidden and that `git revert --no-commit` is required is stated, but there is no structured `<constraints>` block that enumerates what the model may and may not do with git. The model also has no explicit statement of which bash commands it is permitted to run (e.g., `git log`, `git status`, `git revert`, `git commit`) vs. which are out of scope. Without a paired permission list, the restriction is ambiguous at the boundary.

**Fix:**

```xml
<constraints>
  <permitted>
    - git status --porcelain (dirty-tree guard only)
    - git log --oneline --no-merges (commit discovery)
    - git revert --no-commit ${HASH} (revert operations)
    - git revert --abort (cleanup after failed revert)
    - git reset HEAD (cleanup only, after failed revert)
    - git restore . (cleanup only, after failed revert)
    - git commit -m "revert(...): ..." (final commit only)
  </permitted>

  <reserved_for_human_review>
    - git reset --hard (prohibited — use git revert instead)
    - git push (out of scope — user pushes separately)
    - Any operation that rewrites published history
  </reserved_for_human_review>
</constraints>
```

---

### Issue 5 — No priority ordering when MODE and dependency-check criteria conflict
**Principle:** Section 5 (Instruction Framing) — when multiple considerations apply, list them with explicit priority. Section 5 — add tie-breaking rules.

**Problem:** The `dependency_check` step presents warnings and then offers Proceed | Abort, but there is no priority ordering that tells the model how to weight safety vs. user intent. If the user explicitly selects `--phase` mode and there are downstream dependencies, should the warning be emphatic (precision-biased: lean toward Abort) or permissive (recall-biased: lean toward Proceed)? The cost asymmetry here is clear — a revert with downstream dependencies is destructive — but the tie-breaking rule is missing.

**Fix:** Add a `<priority_order>` block within `dependency_check`:

```xml
<priority_order>
  1. Dirty-tree guard (highest — abort immediately, no interaction)
  2. Dependency warnings (high — display prominently, default to Abort)
  3. User confirmation (required — Approve or Abort, no silent proceed)
  4. Commit creation (lowest — only after all guards pass)
</priority_order>

<tie_breaking>
  When in doubt about downstream impact, present the warning and default the
  prompt option to Abort. Data safety is higher priority than convenience.
</tie_breaking>
```

---

### Issue 6 — No few-shot examples for the `--last` mode selection parsing
**Principle:** Section 3 (Few-Shot Example Construction) — select examples by similarity; use 2–5 examples; Section 22 Production Pattern 2 — every abstract instruction paired with a calibrating example.

**Problem:** The `--last` mode instructs the model to "parse the user's selection into COMMITS list" based on input like `1,3` or `'all'`. No examples are provided for how to interpret edge cases: what does `1-3` mean? What about `all` with only one commit? What about `1, 3` with a space? The instruction is abstract and relies on the model's priors for parsing.

**Fix:** Add a short example block within the `gather_commits` step:

```xml
<examples>
  <example>
    <input>User types: 1,3</input>
    <output>COMMITS = [commit at position 1, commit at position 3]</output>
  </example>
  <example>
    <input>User types: all</input>
    <output>COMMITS = all commits in the displayed list</output>
  </example>
  <example>
    <input>User types: 2</input>
    <output>COMMITS = [commit at position 2 only]</output>
  </example>
</examples>
```

---

### Issue 7 — No `<audience>` or `<quality_bar>` — task specification is incomplete
**Principle:** Section 1 Action 1 — extract all three task components (what, why, quality bar). Section 1 Action 2 — encode audience explicitly.

**Problem:** The `<purpose>` tag covers "what" and hints at "why" (preserve history), but does not state a quality bar or audience. The audience matters here: the workflow is invoked by a developer who may be under stress (reverting a bad deploy), so the model should be calibrated toward speed, clarity, and minimal friction. Without this encoding, the model may produce overly verbose interaction patterns.

**Fix:**

```xml
<audience>
A developer running this workflow to undo a GSD phase or plan commit. They are
under time pressure and trust the safety checks. They expect clear, minimal
interaction — terse confirmation prompts, not explanatory prose.
</audience>

<quality_bar>
A correct execution: presents only the commits matching the target, shows the
dependency warning if applicable, confirms once, reverts cleanly, and produces
a single well-formed revert commit. No extra explanation, no repeated prompts.
</quality_bar>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit in the prompt — **FAIL** (intent is present; audience and quality bar are absent)
- `[ ]` All constraints are compatible — **PASS** (no conflicting constraints identified)

### Chain-of-Thought
- `[ ]` CoT is included only for math, symbolic reasoning, or multi-step logic tasks — **N/A** (procedural workflow, CoT is not required)
- `[ ]` CoT trigger used — **N/A**
- `[ ]` Reasoning elicited before answer — **N/A**
- `[ ]` CoT traces treated as heuristic aids — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **FAIL** (no examples present)
- `[ ]` 2–5 examples total — **FAIL** (zero examples)
- `[ ]` Ordered simple → complex — **FAIL** (no examples)
- `[ ]` Examples span diverse sub-types — **FAIL** (no examples)
- `[ ]` Format consistent across examples — **N/A**
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[ ]` Instruction complete before formatting applied — **PASS** (logic is fully specified before any formatting decisions)
- `[ ]` Prompt sections separated by semantically named XML tags — **PASS** (`<step>`, `<process>`, `<success_criteria>` are all present)
- `[ ]` At least 3 format variants will be tested — **FAIL** (no evidence of format testing)

### Instruction Framing
- `[ ]` All negative instructions converted to positive equivalents — **FAIL** ("NEVER use git reset" appears three times)
- `[ ]` Priority order is explicit when multiple criteria apply — **FAIL** (no `<priority_order>` block)
- `[ ]` Tie-breaking rules match domain's cost asymmetry — **FAIL** (no `<tie_breaking>` block)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **FAIL** (no persona at all; one is warranted for an interactive procedural workflow)
- `[ ]` Persona is specific — **FAIL** (absent)
- `[ ]` Persona descriptor is gender-neutral — **N/A** (absent)

### Output Format
- `[ ]` Structured output tasks use two-step reasoning-then-format approach — **N/A** (not a structured output task)
- `[ ]` Single-call JSON places reasoning fields before answer fields — **N/A**
- `[ ]` Constrained decoding adopted only after free-form insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification — **PASS** (commit message format is specified with literal string pattern)

### Context Placement
- `[ ]` Task instruction at start of prompt — **PASS** (`<purpose>` leads; `<step name="banner" priority="first">` is correct)
- `[ ]` Primary document/input at end — **PASS** (`<success_criteria>` closes the document as a grounding reference)
- `[ ]` Background context in the middle — **PASS** (mode-specific logic is in the middle)
- `[ ]` Irrelevant context removed — **PASS** (content is tightly scoped to the task)
- `[ ]` Time-sensitive injected context labeled as snapshot — **N/A** (no injected runtime context)

### Self-Consistency
- `[ ]` Applied only to tasks with a single correct answer — **N/A**
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[ ]` Redundant instructions removed — **FAIL** (the `git reset --hard is NEVER used` constraint appears three times across the file)
- `[ ]` Long prompts compressed — **N/A** (not a long-context task)
- `[ ]` RAG context is extracted passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (this is a workflow file, not a system prompt)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[ ]` Each instruction appears in exactly one location — **FAIL** (git reset prohibition stated three times)
- `[ ]` Safety-critical constraints have external validation — **PASS** (`<success_criteria>` checklist acts as a post-run validation gate)

### Agent/Subagent
- `[ ]` Agent prompts fully self-contained — **PASS** (`<required_reading>` references are explicit)
- `[ ]` All file paths in agent output are absolute — **N/A** (paths in this workflow are relative planning paths, appropriate to context)
- `[ ]` Parallel agents launched in single message block — **N/A**
- `[ ]` Adversarial probes specified for verification agents — **N/A**

### Structural Architecture
- `[ ]` Large prompts decomposed into atomic, single-responsibility modules — **PASS** (each `<step>` is a named, bounded unit)
- `[ ]` Template variables use `${VARIABLE_NAME}` syntax — **PASS** (`$ARGUMENTS`, `${COUNT}`, `${TARGET_PHASE}`, etc. are consistently used)
- `[ ]` Modules compose at runtime via variable substitution — **PASS** (mode variables drive branching)

### Constraint Enforcement
- `[ ]` Every restriction paired with an equally concrete permission — **FAIL** (no `<constraints>` block with `<permitted>` and `<reserved_for_human_review>`)
- `[ ]` Hard exclusion lists enumerated, not qualitative — **PASS** (the commit-message format is exact; cleanup commands are enumerated)
- `[ ]` Known edge cases have precedent-style rulings — **FAIL** (no `<precedents>` block; edge cases like "no commits found" are handled inline but not as explicit precedents)
- `[ ]` Confidence thresholds numeric, not qualitative — **N/A**

### Decision Frameworks
- `[ ]` Multi-option recommendations use decision tree or comparison table — **PASS** (three modes are laid out as clear branches)
- `[ ]` Criteria checklists gate complex approaches — **PASS** (`<success_criteria>` functions as a completion gate)
- `[ ]` Action permissions framed around reversibility — **PARTIAL** (reversibility is the core design principle and `git revert` is enforced, but the `<take_freely>` / `<confirm_with_user>` tag vocabulary is not used)

### Multi-Phase Workflows
- `[ ]` Complex tasks organized into explicit named phases — **PASS** (six named `<step>` blocks)
- `[ ]` Required steps distinguished from type-specific steps — **PASS** (dirty-tree guard and confirmation gate are universal; dependency checks are mode-specific)
- `[ ]` Scenario-based branching handles multiple paths explicitly — **PASS** (MODE=last, MODE=phase, MODE=plan are fully enumerated)

### Memory and Continuity
- `[ ]` Memory templates use XML tags as section labels — **N/A**
- `[ ]` Compaction summaries include discoveries and failed approaches — **N/A**
- `[ ]` Next steps tied to user's most recent explicit request — **PASS** (the `summary` step surfaces `gsd-progress` and relevant re-entry commands)

### Modularity
- `[ ]` Each prompt component has a single responsibility — **PASS** (each `<step>` is focused)
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` block; what this workflow does NOT do is never stated explicitly)

### Safety and Trust
- `[ ]` Validation at system boundaries only — **PASS** (the dirty-tree guard is the boundary check; internal logic is trusted)
- `[ ]` Dual-use capabilities state permissions before restrictions — **FAIL** (the restriction on `git reset` appears before any statement of what IS permitted)
- `[ ]` Authorization narrow-scoped; each action confirmed before expanding scope — **PASS** (single confirmation gate before any revert; reason required)

### Tone and Style
- `[ ]` Size constraints use numeric limits, not qualitative descriptors — **PASS** (where limits are specified they are exact, e.g., `head -50`, `default 10`)
- `[ ]` Instructions use imperative present tense — **PASS** (most steps use imperative: "Run", "Display", "Sort", "Parse")
- `[ ]` Working notes in analysis tags, not user-facing output — **N/A**

### Optimization
- `[ ]` Prompt flagged as draft for automated optimization — **FAIL** (no optimization flag)
- `[ ]` Correct optimizer selected — **FAIL** (not addressed)
- `[ ]` Held-out test set reserved before optimization — **FAIL** (not addressed)

---

## Recommendations

Prioritized from highest to lowest impact on LLM execution reliability:

**1. Add a `<constraints>` block with paired permissions and restrictions (Issue 4)**
This is the highest-impact gap. The model currently has no structured declaration of what git commands it may run vs. what is prohibited. Section 14's `<permitted>` / `<reserved_for_human_review>` pattern eliminates the ambiguity that causes models to drift into unsafe behavior. Consolidating the three scattered "NEVER git reset" statements into a single `<constraints>` block also fixes the redundancy flagged under Section 11 Action 3.

**2. Convert all negative instructions to positive equivalents and deduplicate (Issues 2 and prompt-length)**
The "NEVER use git reset" constraint appears three times and in negative form. Per Section 5 Action 1, rewrite once as "Use git revert --no-commit exclusively" with a narrowly scoped exception. This improves both instruction clarity and prompt compactness (Section 10 Action 1).

**3. Add `<persona>`, `<audience>`, and `<quality_bar>` (Issues 1 and 7)**
A specific persona (safety-focused git operations executor) calibrates register and decision-making style. The `<audience>` and `<quality_bar>` tags complete the three-component task specification required by Section 1 Actions 1 and 2, and prevent the model from generating verbose interaction patterns when brevity is what the user needs.

**4. Add a `<priority_order>` and `<tie_breaking>` block for the dependency-check gate (Issue 5)**
The cost asymmetry of reverting with downstream dependencies is clear: under-inclusion (Abort) is cheaper than over-inclusion (Proceed into a broken state). Section 5's tie-breaking pattern should be applied here, defaulting the ambiguous case to Abort. This is a safety-critical path and leaving it to the model's priors is a reliability risk.

**5. Add 2–3 inline examples for `--last` mode selection parsing (Issue 6)**
Per Section 22 Production Pattern 2, every abstract instruction needs at least one calibrating example. The selection-parsing step (`1,3`, `all`, `2`) is the most likely point of model misinterpretation because the input format is freeform. Two to three `<example>` entries (simple → complex) remove this ambiguity at near-zero cost to prompt length.
