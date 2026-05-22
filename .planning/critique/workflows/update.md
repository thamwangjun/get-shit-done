# Critique: update.md

## Summary

`update.md` is a technically sophisticated, operationally complete workflow that reliably accomplishes its functional goal: detecting the installed GSD version, comparing it against the npm registry, showing a changelog preview, obtaining user confirmation, backing up custom files, running the installer, and clearing the update cache. The workflow is rich in implementation detail and handles many edge cases well (Windows path normalization, multi-runtime support, custom file backup, dev-version detection). However, from a prompt engineering perspective, the document has significant structural gaps: it lacks XML-tagged section boundaries, has no explicit task/quality-bar specification, embeds extensive raw bash scripts in-line that inflate prompt length without benefit, and contains no audience declaration, persona, constraint pairs, or output format specification for the model's own responses. The prose and shell logic are fused together in a way that relies on the model inferring its role and boundaries rather than having them explicitly declared. These are all addressable without changing the workflow's functional behaviour.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern well-applied.** The workflow is organized into six clearly named `<step>` elements with distinct trigger conditions and responsibilities. Each step completes before the next begins, creating the cognitive boundaries the guide requires.

- **Section 16 — Required vs. optional steps.** Each step includes concrete success conditions (the `<success_criteria>` block), and some steps have explicit fallback exits (version already current, npm unavailable, user cancels), correctly distinguishing terminal from continuing paths.

- **Section 5 (Instruction Framing) — Conditional branching is explicit.** The workflow uses explicit `if/elif/else` branches for every decision point (LOCAL vs. GLOBAL vs. UNKNOWN install, version comparison outcomes, CUSTOM_COUNT == 0 vs. > 0). This matches Section 5's pattern for conditional instructions and avoids leaving branching to model inference.

- **Section 16 — Scenario-based branching.** Multiple install-scope scenarios (LOCAL, GLOBAL, UNKNOWN) and runtime-detection scenarios (claude, opencode, gemini, kilo, codex) are enumerated explicitly rather than described qualitatively.

- **Section 14 (Constraint Enforcement) — Structure preservation.** The "clean install warning" block enumerates exactly what will be wiped and exactly what will be preserved, providing the concrete enumeration the guide demands instead of a qualitative summary.

- **Section 7 (Output Format Handling) — Machine-parsed output.** The confirmation UI and completion banner are specified to an exact format with literal strings, matching Section 7's requirement for explicit format specification when output must be consistently rendered.

- **Section 8 (Context Placement) — Runtime context injection.** The workflow injects live environment variables and shell output (`npm view`, `cat VERSION`) at prompt execution time rather than relying on stale assumptions, consistent with Section 8's runtime context injection guidance.

---

## Issues

### Issue 1 — No `<task>` tag or explicit task specification
**Principle:** Section 1 Action 1 (extract output, purpose, quality bar); Section 4 Action 2 (use XML tags to separate prompt sections).

**What is missing/wrong:** The workflow opens with a `<purpose>` tag (a non-standard tag not in the guide's vocabulary) that reads like a single-sentence changelog, then immediately dives into `<required_reading>` and `<process>`. There is no `<task>` block declaring: (a) what the model is being asked to do, (b) why it matters or how output will be used, and (c) what a correct execution looks like. The model must infer all three from the shape of the prose. The `<purpose>` tag does not appear in the guide's XML tag vocabulary (Section 4) and carries less semantic signal than `<task>`.

**Concrete fix:** Replace the `<purpose>` block with a proper `<task>` block using the guide's vocabulary:

```xml
<task>
Execute the GSD self-update workflow. You will: detect the installed version, compare it
against the latest npm release, show the changelog diff, obtain user confirmation, back up
custom files, run the installer, clear the update cache, and report the result.

A correct execution leaves the user on the latest version with no data loss and a clear
confirmation of what changed.
</task>
```

---

### Issue 2 — No audience or quality bar declaration
**Principle:** Section 1 Action 2 (identify and encode the audience); Section 1 Action 1 (quality bar must be explicit).

**What is missing/wrong:** There is no `<audience>` tag and no `<quality_bar>` tag anywhere in the file. The workflow does not state who will see the output (a developer using Claude Code, Gemini CLI, etc.), what their domain knowledge is, or what the minimum quality bar for a successful run looks like beyond the `<success_criteria>` checklist at the bottom — which is a completion checklist, not a quality standard.

**Concrete fix:** Add immediately after `<task>`:

```xml
<audience>
A software developer running Claude Code (or a compatible runtime) who has GSD installed
and wants to update it. They understand npm, version numbers, and CLI tooling. They do not
need explanations of what npm is or what a global install means.
</audience>

<quality_bar>
Success means: the user receives accurate version information, a readable changelog diff,
a clear warning about what will be wiped, and a factual completion message. The workflow
exits cleanly on every branch (already-current, offline, user-cancel, update-complete)
with no hanging state.
</quality_bar>
```

---

### Issue 3 — Inline bash scripts inflate prompt length without compression
**Principle:** Section 10 Action 1 (flag prompts that exceed necessary length; remove content that does not contribute to the task); Section 10 Action 2 (apply compression for long-context tasks).

**What is missing/wrong:** The workflow embeds roughly 250 lines of bash verbatim — the `expand_home` function is defined twice (once in `get_installed_version`, once in `run_update`), the runtime-detection loop is repeated in multiple steps, and a full inline Node.js heredoc appears in `backup_custom_files`. These are implementation artifacts, not prompt instructions. Embedding them verbatim bloats the prompt and increases positional degradation risk (Section 10). The guide states: "Every token that is not directly relevant to the task increases positional degradation and degrades performance."

**Concrete fix:** Extract repeated shell utilities into a shared reference or a `<conventions>` block, and replace the verbatim heredoc in `backup_custom_files` with a one-line description:

```xml
<!-- In backup_custom_files step -->
Run: node "$GSD_TOOLS" detect-custom-files --config-dir "$RUNTIME_DIR"
Parse the JSON result. If custom_count > 0, copy each file in custom_files[] to
$RUNTIME_DIR/gsd-user-files-backup/ preserving relative paths, then inform the user.
```

The Node.js heredoc already runs a well-defined task (`path.relative`-based copy); the model does not need the source to execute it — it only needs to call the tool.

---

### Issue 4 — No `<constraints>` block with permission pairs
**Principle:** Section 14 (Constraint Enforcement — explicit permission pairs); Section 20 (Safety and Trust Patterns — reversibility framing).

**What is missing/wrong:** The workflow asks the model to execute `npx -y get-shit-done-cc@latest` (a network call that installs software) and `rm -f` (destructive file deletion) without any `<constraints>` block declaring what is permitted, what requires confirmation, and what is off-limits. The guide requires every restriction to be paired with an equally concrete permission, and irreversible actions to be listed under `<confirm_with_user>` (Section 15). The `run_update` step does ask for user confirmation, but via prose logic — not a declared constraint structure the model can reference when reasoning about edge cases.

**Concrete fix:**

```xml
<constraints>
  <take_freely>
    - Read VERSION files and environment variables
    - Run read-only commands: npm view, cat, ls, node (read-only scripts)
    - Display changelog and version information to the user
  </take_freely>

  <confirm_with_user>
    - Running the npx installer (network + filesystem write)
    - Deleting gsd-update-check.json cache files (rm -f)
    - Backing up files to gsd-user-files-backup/
  </confirm_with_user>
</constraints>
```

---

### Issue 5 — Negative framing in user-facing messages
**Principle:** Section 5 Action 1 (convert negative instructions to positive equivalents).

**What is missing/wrong:** Several user-facing output strings use negative framing where positive alternatives exist:
- "Running /gsd-update would install the npm release (A.B.C) and downgrade your dev version — **do NOT use it** to resolve this warning."
- "If install fails, show error and exit."
- The step guard "**Do not use** bash path-stripping..." is a process instruction written as a prohibition without a paired positive directive.

While Section 5 allows one negative clause for the reframe pattern (Section 6), the `do NOT use` instruction in `backup_custom_files` is a process rule, not a persona reframe, and should be converted.

**Concrete fix:**
- "do NOT use it" → "Use the local installer from your dev branch (`node bin/install.js --global --claude`) to resolve this warning instead."
- "Do not use bash path-stripping..." → "Use `gsd-tools detect-custom-files` instead: it resolves paths reliably with Node.js `path.relative()` and handles the manifest key format correctly."

---

### Issue 6 — `<success_criteria>` checklist is a completion checklist, not a quality bar
**Principle:** Section 1 Action 1 (quality bar must be explicit); Section 22 Pattern 3 (output format specified completely and upfront).

**What is missing/wrong:** The `<success_criteria>` block at the end of the workflow reads like a QA checklist rather than a quality bar embedded upfront. It is also positioned at the end of the prompt (low attention region per Section 8 Action 2), where context the model needs to act on should close the prompt — but the primary content being acted on (the install commands) is in the middle. The quality bar belongs at the top, as part of the task specification.

**Concrete fix:** Move the success criteria inline with the `<task>` block as a `<quality_bar>`, and retain only a brief exit-condition summary at the end if needed for parseable machine output.

---

### Issue 7 — No persona declaration for this stylistic workflow
**Principle:** Section 6 Action 1 (classify task before assigning persona); Section 6 Action 2 (make personas specific).

**What is missing/wrong:** The update workflow requires the model to play the role of a system orchestrator that manages terminal output, shell execution, user confirmation dialogs, and formatted banners. This is a stylistic and register-constrained role — the model's default "helpful assistant" register is inappropriate for a CLI tool that must emit terse, structured, banner-formatted output. Yet there is no `<persona>` block.

**Concrete fix:**

```xml
<persona>
You are a CLI update orchestrator. Produce terse, structured terminal output — banners,
version lines, and confirmation prompts exactly as specified. Do not add explanatory prose
between steps. Emit only what the user will read in a terminal.
</persona>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `update.md`.

### Task Specification
- `[ ]` Intent, audience, and quality bar are all explicit — **FAIL** (purpose tag present but not a proper task block; no audience or quality bar)
- `[ ]` All constraints are compatible — **PASS** (no conflicting constraints detected)

### Chain of Thought
- `[ ]` CoT included only for math/symbolic/multi-step logic — **N/A** (workflow does not include CoT)
- `[ ]` CoT trigger used correctly — **N/A**
- `[ ]` Reasoning elicited before answer — **N/A**
- `[ ]` CoT traces treated as heuristic — **N/A**

### Few-Shot Examples
- `[ ]` Examples selected by semantic similarity — **N/A** (no few-shot examples present; the workflow does not require them)
- `[ ]` 2–5 examples total — **N/A**
- `[ ]` Ordered simple → complex — **N/A**
- `[ ]` Examples span diverse sub-types — **N/A**
- `[ ]` Format consistent across examples — **N/A**
- `[ ]` Example order fixed across evaluation runs — **N/A**

### Formatting
- `[ ]` Instruction complete and clear before formatting applied — **FAIL** (the `<purpose>` tag is not a complete instruction; formatting begins before the task is fully specified)
- `[ ]` Prompt sections separated by semantically named XML tags — **FAIL** (uses `<step name="...">` which is close, but `<purpose>` and `<required_reading>` are non-standard; no `<task>`, `<audience>`, `<constraints>`, or `<output_format>` tags)
- `[ ]` At least 3 format variants tested on target model — **FAIL** (no evidence of format variant testing)

### Instruction Framing
- `[ ]` Negative instructions converted to positive — **FAIL** (multiple "do NOT use" and "If install fails" without positive reframes)
- `[ ]` Priority order explicit when multiple criteria apply — **PASS** (runtime priority ordering is explicit in the detection logic)
- `[ ]` Tie-breaking rules match domain's cost asymmetry — **PASS** (user confirmation gates the irreversible action; dev-version detection exits cleanly rather than downgrading)

### Persona
- `[ ]` Persona included only for open-ended or stylistic tasks — **FAIL** (this is a stylistic/register-constrained task and no persona is declared)
- `[ ]` Persona is specific — **FAIL** (absent)
- `[ ]` Persona descriptor is gender-neutral — **N/A** (absent)

### Output Format
- `[ ]` Structured output uses two-step reasoning-then-format — **N/A** (not applicable; output is terminal display strings, not structured data)
- `[ ]` Single-call JSON places reasoning before answer fields — **N/A**
- `[ ]` Constrained decoding adopted only after free-form proven insufficient — **N/A**
- `[ ]` Machine-parsed output uses exact format specification — **PASS** (banner format and confirmation options are exactly specified)

### Context Placement
- `[ ]` Task instruction at start of prompt — **FAIL** (`<purpose>` is at the start but is not a proper task instruction; the real executable instructions are buried in `<process>`)
- `[ ]` Primary document or input at end of prompt — **PASS** (`<success_criteria>` closes the prompt)
- `[ ]` Background context in the middle — **PASS** (the bash scripts function as background context and occupy the middle)
- `[ ]` Irrelevant context removed — **FAIL** (duplicate `expand_home` function, repeated runtime-detection boilerplate, inline Node.js heredoc)
- `[ ]` Time-sensitive injected context labeled as snapshot — **N/A** (no snapshot context injected)

### Self-Consistency
- `[ ]` Self-consistency applied only to tasks with a single correct answer — **N/A**
- `[ ]` Inference budget permits 15–20 samples — **N/A**

### Prompt Length
- `[ ]` Redundant instructions and repeated context removed — **FAIL** (`expand_home` defined twice; runtime array construction logic repeated across steps)
- `[ ]` Long prompts compressed before sending — **FAIL** (no compression applied; bash scripts are fully verbatim)
- `[ ]` RAG context is extracted relevant passage only — **N/A**

### System/User Split
- `[ ]` Persistent instructions in system prompt — **N/A** (workflow file is not split into system vs. user prompt)
- `[ ]` Task-specific instructions in user prompt — **N/A**
- `[ ]` Each instruction appears in exactly one location — **FAIL** (`expand_home` appears in two steps verbatim)
- `[ ]` Safety-critical constraints have external validation — **FAIL** (no external validation declared for the destructive `npx` and `rm -f` calls)

### Agent/Subagent
- `[ ]` Agent prompts are fully self-contained — **PASS** (the workflow is self-contained; all required commands and logic are present)
- `[ ]` All file paths in agent output are absolute — **PASS** (the workflow consistently uses `$HOME/...` and resolved absolute paths)
- `[ ]` Parallel agents launched in single message block — **N/A** (no parallel agents)
- `[ ]` Adversarial probes specified for verification agents — **N/A** (not a verification agent)

### Structural Architecture
- `[ ]` Large prompts decomposed into atomic single-responsibility modules — **FAIL** (the file is a monolith; runtime detection, version comparison, backup, install, and cache-clearing are all in one file)
- `[ ]` Template variables use `${VARIABLE_NAME}` syntax with fallback — **PASS** (bash variables are consistently declared and used; `$ARGUMENTS` is used for flag detection)
- `[ ]` Modules compose at runtime via variable substitution — **N/A** (not a composed prompt system)

### Constraint Enforcement
- `[ ]` Every restriction paired with equally concrete permission — **FAIL** (no `<constraints>` block; restrictions are embedded in prose)
- `[ ]` Hard exclusion lists enumerated — **N/A** (no filtering task)
- `[ ]` Known edge cases have precedent-style rulings — **PASS** (Windows path normalization, dev version detection, and `LOCAL_DIR == GLOBAL_DIR` edge case are all explicitly handled)
- `[ ]` Confidence thresholds are numeric — **N/A**

### Decision Frameworks
- `[ ]` Multi-option recommendations use explicit decision tree or comparison table — **PASS** (version comparison branches are explicit; install-scope branches are explicit)
- `[ ]` Criteria checklists gate complex approaches — **PASS** (`IS_LOCAL` is gated by explicit criteria)
- `[ ]` Action permissions framed around reversibility — **FAIL** (no reversibility framing; `rm -f` and `npx install` are not categorized by blast radius)

### Multi-Phase Workflows
- `[ ]` Complex tasks organized into explicit named phases — **PASS** (`<step name="...">` elements serve this role)
- `[ ]` Required steps distinguished from type-specific steps — **PASS** (universal steps like version detection run always; type-specific install commands branch by scope)
- `[ ]` Scenario-based branching handles multiple paths explicitly — **PASS** (LOCAL/GLOBAL/UNKNOWN and all version-comparison outcomes are explicitly branched)

### Memory and Continuity
- `[ ]` Memory templates use XML tags as section labels — **N/A**
- `[ ]` Compaction summaries include discoveries and failed approaches — **N/A**
- `[ ]` Next steps tied to user's most recent explicit request — **N/A**

### Modularity
- `[ ]` Each prompt component has single responsibility — **FAIL** (the `get_installed_version` step combines runtime detection, path normalization, Windows compatibility, and version reading — four concerns in one step)
- `[ ]` Scope boundaries state both inclusions and exclusions — **FAIL** (no `<scope>` block; what the workflow does and does not handle is not declared)

### Safety and Trust
- `[ ]` Validation at system boundaries only; internal interfaces trusted — **PASS** (npm output and VERSION file content are validated with regex before use; internal variables are trusted)
- `[ ]` Dual-use capabilities state permissions before restrictions — **N/A** (no dual-use capabilities)
- `[ ]` Authorization narrow-scoped; each action confirmed before expanding scope — **FAIL** (the destructive install step is confirmed once, but the cache-clearing `rm -f` loop is not separately confirmed)

### Tone and Style
- `[ ]` Size constraints use numeric limits — **N/A** (no size-constrained output fields)
- `[ ]` Instructions use imperative present tense — **PASS** (steps use imperative present tense throughout: "Detect", "Check", "Compare", "Run")
- `[ ]` Working notes in analysis tags — **N/A** (no reasoning traces present)

### Optimization
- `[ ]` Prompt flagged as draft for automated optimization — **FAIL** (no optimization flag)
- `[ ]` Correct optimizer selected — **FAIL** (not assessed; no optimization path declared)
- `[ ]` Held-out test set reserved — **FAIL** (not applicable in current form; no evaluation setup)

---

## Recommendations

Listed in priority order from highest to lowest impact on prompt reliability.

### 1. Add `<task>`, `<audience>`, `<quality_bar>`, and `<constraints>` blocks (Issues 1, 2, 4)
These four missing structural elements are the root cause of most checklist failures. Without them, the model has no explicit role, no declared audience, no quality target, and no permission boundary. Add all four at the top of the file before `<process>`. This directly fixes Section 1 Actions 1–2, Section 4 Action 2, and Section 14. Estimated impact: resolves 6 FAIL items on the checklist.

### 2. Add a `<persona>` block scoped to CLI output orchestration (Issue 7)
The workflow requires terse, banner-formatted terminal output — the opposite of the model's default verbose assistant register. A one-paragraph persona block constraining voice and register to CLI-tool behavior will reduce format drift across the user-facing output strings. Fixes Section 6 Action 2. Estimated impact: reduces inconsistency in completion message and confirmation prompt formatting.

### 3. Deduplicate `expand_home` and extract shared shell utilities (Issue 3)
The `expand_home` function is defined identically in two steps. Either define it once in a `<conventions>` block referenced by both steps, or replace the second definition with a comment: "Using `expand_home` defined in `get_installed_version`." The inline Node.js heredoc in `backup_custom_files` should be replaced with a prose description of what it does and why. This fixes Section 10 Action 1 and the Section 11 Action 3 duplicate-instruction rule. Estimated impact: reduces prompt token count by roughly 15–20%.

### 4. Convert remaining negative instructions to positive equivalents (Issue 5)
Audit the four "do NOT use" and "If install fails" clauses and rewrite each as a positive directive with the correct alternative stated explicitly. This is a low-effort, high-clarity change. Fixes Section 5 Action 1. Estimated impact: reduces model misinterpretation of guard clauses.

### 5. Add reversibility framing to `run_update` and cache-clearing steps (Issue 4, partial)
Add a `<confirm_with_user>` sub-block inside `<constraints>` listing the `npx` installer call and the `rm -f` cache-clearing loop as actions requiring confirmation or at minimum acknowledgement. This fixes Section 15 (reversibility framework) and Section 20 (authorization scope). Estimated impact: prevents the model from silently executing destructive file operations in edge cases where the user confirmation step is bypassed or misread.
