# Critique: quick.md

## Summary

`quick.md` is a well-structured, production-grade orchestration workflow that handles a genuinely complex multi-phase task (argument parsing, branching, agent spawning, worktree management, state tracking). Its process flow is thorough and its branching logic is explicit. However, it is primarily an execution script rather than a prompt in the classic sense, and its prompt engineering weaknesses are concentrated in the sub-prompts it passes to child agents: those prompts are written in terse markdown prose without XML section tags, lack explicit output format specifications, omit quality bars and audience declarations, and use negative instruction framing in several constraints. The `purpose` block at the top — the only true instruction surface visible to the orchestrating model — is clear but undersells the quality bar and does not name an audience. The file would benefit most from converting sub-prompt prose into structured XML, adding concrete output format specs to every Task() call, and replacing negative constraints with positive equivalents.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern:** Steps are numbered, named, and gated on flag conditions. Conditional execution (`$DISCUSS_MODE`, `$RESEARCH_MODE`, `$VALIDATE_MODE`) maps cleanly to the explicit phase-trigger pattern. Each phase completes fully before the next begins.
- **Section 16 — Scenario-based branching:** The checklist-result branching table (passed / issues-found / max-iterations) mirrors the guide's `<scenarios>` pattern precisely, with explicit handling for each path.
- **Section 14 (Constraint Enforcement) — Structure preservation rules:** The worktree merge block explicitly names which files the orchestrator owns (STATE.md, ROADMAP.md) and protects them with backups — a real-world application of `<preserve>`/`<update>` thinking.
- **Section 5 (Instruction Framing) — Conditional instructions:** Flag-dependent banners, file lists, and constraint strings use explicit ternary conditionals (`${VALIDATE_MODE ? '...' : '...'}`), which is exactly the template ternary syntax the guide recommends.
- **Section 15 (Decision Frameworks) — Decision table:** The verification-status dispatch table (`passed` / `human_needed` / `gaps_found` → action) is a clean comparison table that makes the multi-option path tractable.
- **Section 19 (Modularity) — Scope boundaries:** The `<available_agent_types>` block explicitly names what agent types are in scope and excludes fallback types ("do not fall back to 'general-purpose'"), following the guide's include/exclude discipline.
- **Section 11 (System vs. User Prompt) — YAML-style frontmatter data in Task() calls:** Agent type, model, description, and isolation mode are passed as named fields — a functional equivalent of the guide's frontmatter configuration pattern.
- **Section 13 (Structural Architecture) — Template variable injection:** `${VARIABLE_NAME}` syntax is used consistently throughout for runtime value substitution, matching the guide's template variable convention.

---

## Issues

### Issue 1 — Sub-prompts lack XML section tags
**Principle:** Section 4 Action 2 — "Use XML tags to separate prompt sections."

**What's wrong:** Every `Task()` call embeds a multi-section prompt as an unstructured markdown string. The planner prompt (Step 5) mixes `<planning_context>`, `<constraints>`, and `<output>` tags inconsistently — some sections use XML, others use markdown bold headers (`**Mode:**`, `**Directory:**`). The executor prompt (Step 6) is almost entirely untagged prose. The checker prompt uses a mix of an XML `<verification_context>` block and bare markdown `<check_dimensions>` and `<expected_output>` headers that are not valid XML containers. The verifier prompt is a single-line sentence.

**Concrete fix:** Wrap each sub-prompt section in semantically named XML tags consistently. For the executor prompt:

```xml
<task>Execute quick task ${quick_id}.</task>

<context>
  <files_to_read>
    - ${QUICK_DIR}/${quick_id}-PLAN.md (Plan)
    - .planning/STATE.md (Project state)
    - ./CLAUDE.md (Project instructions, if exists)
  </files_to_read>
</context>

<constraints>
  <take_freely>Execute all tasks in the plan. Commit each task atomically (code changes only).</take_freely>
  <reserved_for_human_review>
    - Committing docs artifacts (SUMMARY.md, STATE.md, PLAN.md) — the orchestrator handles these in Step 8
    - Updating ROADMAP.md — quick tasks are separate from planned phases
  </reserved_for_human_review>
</constraints>

<output_format>Create summary at: ${QUICK_DIR}/${quick_id}-SUMMARY.md. Return a completion report.</output_format>
```

---

### Issue 2 — Constraints use negative framing
**Principle:** Section 5 Action 1 — "Convert negative instructions to positive equivalents."

**What's wrong:** Multiple constraint blocks lead with "Do NOT" or "Skip":
- `"Do NOT commit docs artifacts"`
- `"Do NOT update ROADMAP.md"`
- `"Skip: cross-plan deps"` (checker prompt)
- `"Skip this step entirely if NOT $VALIDATE_MODE"` (repeated across steps)

These are primary directives, not exception clauses, so the guide's exception (the reframe pattern) does not apply.

**Concrete fix:** Apply the conversion table from Section 5:

| Current (negative) | Replacement (positive) |
|--------------------|------------------------|
| `Do NOT commit docs artifacts` | `Commit source code changes only. Docs artifacts (SUMMARY.md, STATE.md, PLAN.md) are staged and committed by the orchestrator in Step 8.` |
| `Do NOT update ROADMAP.md` | `Leave ROADMAP.md unchanged — quick tasks track progress in STATE.md only.` |
| `Skip: cross-plan deps` | `Check dimensions in scope: requirement coverage, task completeness, key links, scope sanity, must_haves derivation.` |

---

### Issue 3 — Output format is absent or underspecified for child agents
**Principle:** Section 7 (Output Format Handling) and Section 22 Pattern 3 — "Output format specified completely and upfront."

**What's wrong:**
- The verifier prompt (Step 6.5) is a single sentence with no output format spec. The orchestrator then parses `grep "^status:" ...VERIFICATION.md` — but the verifier is never told the `status:` field must exist, what its allowed values are, or what the full VERIFICATION.md structure looks like.
- The code review prompt (Step 6.25) says `"Depth: quick"` without defining what "quick" depth means in terms of sections, length, or fields.
- The research prompt (Step 4.75) says `"Use standard research format but keep it lean — skip sections that don't apply"` without defining what the standard format is or which sections exist.

**Concrete fix:** For the verifier, add a machine-parseable output format spec using the guide's literal-string pattern (Section 7):

```xml
<output_format>
Write VERIFICATION.md to ${QUICK_DIR}/${quick_id}-VERIFICATION.md.

The file MUST begin with a frontmatter status line in exactly this format — it is parsed by the orchestrator:

status: passed
or
status: human_needed
or
status: gaps_found

Use the literal string `status: ` followed by exactly one of `passed`, `human_needed`, or `gaps_found`.
No markdown bold, no punctuation, no wording variation.
</output_format>
```

---

### Issue 4 — No audience or quality bar declared (Section 1 Actions 1–2)
**Principle:** Section 1 Action 1 — "Extract the three task components: output, purpose, quality bar." Section 1 Action 2 — "Identify the audience."

**What's wrong:** The `<purpose>` block describes what the workflow does but does not specify: (a) who will invoke it (the orchestrating model or a human triggering `/gsd-quick`), (b) what a successful execution looks like from the invoker's perspective, or (c) what distinguishes a high-quality run from an adequate one. Without this, the model has no calibration standard when edge cases arise (e.g., whether a partial executor failure justifies aborting or continuing).

**Concrete fix:** Add an `<audience>` and `<quality_bar>` block immediately after `<purpose>`:

```xml
<audience>
The invoking Claude Code model acting as orchestrator. It reads this workflow to sequence
subagent spawning and branching decisions. Secondary audience: the developer who invoked
/gsd-quick and reads the completion banner.
</audience>

<quality_bar>
A high-quality execution: (1) all enabled phases run in order with no skipped required steps,
(2) all artifact files are verified to exist before continuing, (3) STATE.md is updated
atomically, (4) the completion banner reflects actual execution (not assumed success).
A run that silently skips artifact verification or continues past a missing PLAN.md is a
low-quality execution.
</quality_bar>
```

---

### Issue 5 — No explicit priority ordering when multiple flags conflict or partially overlap
**Principle:** Section 5 (Instruction Framing) — Priority ordering; Section 1 Action 3 — "Audit constraints for consistency."

**What's wrong:** The flag normalization logic (Step 1) handles the specific case where all three granular flags equal `--full`, but does not specify what happens to banner rendering or constraint strings when flags produce ambiguous combinations (e.g., `--full` explicitly passed alongside `--validate` redundantly, or future flags added without updating the banner cascade). The 7-branch banner if/else chain has no explicit priority ordering — it falls through silently if none of the conditions match, showing no banner at all.

**Concrete fix:** Add a `<priority_order>` block to the argument parsing step and an explicit fallback to the banner cascade:

```xml
<priority_order>
  1. $FULL_MODE (highest priority — overrides all granular flag combinations)
  2. $DISCUSS_MODE + $RESEARCH_MODE + $VALIDATE_MODE all true → normalize to $FULL_MODE
  3. Explicit two-flag combinations (DISCUSS+VALIDATE, DISCUSS+RESEARCH, RESEARCH+VALIDATE)
  4. Single-flag modes (DISCUSS, RESEARCH, VALIDATE)
  5. No flags → default quick mode (lowest priority)
</priority_order>
```

Add a final `else` clause to the banner cascade:

```
else: display default banner (no optional phases enabled)
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to an orchestration workflow file (as opposed to a single-call LLM prompt).

### Task Specification
- `[ ] Intent, audience, and quality bar are all explicit in the prompt` — **FAIL.** Intent is present in `<purpose>`. Audience and quality bar are absent.
- `[ ] All constraints are compatible — no conflicts between scope, length, or depth` — **PASS.** Flag combinations are explicitly normalized; no constraint conflicts identified.

### Chain of Thought
- `[ ] CoT is included only for math, symbolic reasoning, or multi-step logic tasks` — **N/A.** This is an orchestration script, not a reasoning prompt.
- `[ ] CoT trigger used` — **N/A.**
- `[ ] Reasoning is elicited before the answer, not after` — **N/A.**
- `[ ] CoT traces treated as heuristic aids` — **N/A.**

### Few-Shot Examples
- `[ ] Examples selected by semantic similarity` — **N/A.** No few-shot examples in this file.
- `[ ] 2–5 examples total` — **N/A.**
- `[ ] Ordered simple → complex` — **N/A.**
- `[ ] Examples span diverse sub-types` — **N/A.**
- `[ ] Format consistent across all examples` — **N/A.**
- `[ ] Example order fixed across evaluation runs` — **N/A.**

### Formatting
- `[ ] Instruction is complete and clear before formatting is applied` — **PASS.** The `<purpose>` block is written in clear prose before any structural formatting.
- `[ ] Prompt sections separated by semantically named XML tags` — **FAIL.** Top-level structure uses XML tags correctly (`<purpose>`, `<process>`, `<success_criteria>`), but sub-prompts inside `Task()` calls use inconsistent or absent XML tagging.
- `[ ] At least 3 format variants tested on target model` — **N/A.** (Operational workflow, not a benchmark prompt.)

### Instruction Framing
- `[ ] All negative instructions converted to positive equivalents` — **FAIL.** Multiple "Do NOT" and "Skip" primary directives remain.
- `[ ] Priority order explicit when multiple criteria apply` — **FAIL.** Banner cascade has no explicit priority ordering and no fallback.
- `[ ] Tie-breaking rules match domain's cost asymmetry` — **PASS.** The revision loop cap (max 2 iterations) and the force-proceed offer implement an implicit tie-breaking rule appropriate for the domain.

### Persona
- `[ ] Persona included only for open-ended or stylistic tasks` — **N/A.** No persona is assigned to this orchestration workflow, which is correct.
- `[ ] Persona is specific` — **N/A.**
- `[ ] Persona descriptor is gender-neutral` — **N/A.**

### Output Format
- `[ ] Structured output tasks use two-step reasoning-then-format approach` — **N/A.** (Orchestration workflow, not a reasoning task.)
- `[ ] Single-call JSON places reasoning fields before answer fields` — **N/A.**
- `[ ] Constrained decoding adopted only after free-form proven insufficient` — **N/A.**
- `[ ] Machine-parsed output uses exact format specification with literal string requirements` — **FAIL.** The verifier's `status:` field is machine-parsed by `grep`, but the verifier prompt does not specify the required literal format.

### Context Placement
- `[ ] Task instruction is at the start of the prompt` — **PASS.** `<purpose>` leads the file; `<process>` follows.
- `[ ] Primary document or input is at the end of the prompt` — **PASS.** `<success_criteria>` (the completion checklist) closes the file.
- `[ ] Background context is in the middle` — **PASS.** `<available_agent_types>` and `<required_reading>` occupy the middle.
- `[ ] All irrelevant context removed` — **PASS.** No obvious padding or boilerplate.
- `[ ] Time-sensitive injected context labeled as snapshot` — **N/A.** No snapshot context injected at this level.

### Self-Consistency
- `[ ] Self-consistency applied only to tasks with single correct answer` — **N/A.**
- `[ ] Inference budget permits 15–20 samples` — **N/A.**

### Prompt Length
- `[ ] Redundant instructions and repeated context removed` — **FAIL.** "Skip this step entirely if NOT $X_MODE" appears six times verbatim. This can be stated once as a general rule for all conditional steps.
- `[ ] Long prompts compressed before sending` — **N/A.** (Runtime orchestration decision.)
- `[ ] RAG context is extracted relevant passage only` — **N/A.**

### System/User Split
- `[ ] Persistent instructions in system prompt` — **N/A.** (Workflow file; the split is handled by the harness.)
- `[ ] Task-specific instructions in user prompt` — **N/A.**
- `[ ] Each instruction appears in exactly one location` — **FAIL.** The skip-if-not-mode pattern is repeated six times.
- `[ ] Safety-critical constraints have external validation` — **PASS.** Worktree merge uses explicit git commands as external validators (pre-merge deletion guard, backup/restore of STATE.md and ROADMAP.md).

### Agent/Subagent
- `[ ] Agent prompts are fully self-contained` — **PARTIAL.** Planner and researcher prompts include `${AGENT_SKILLS_*}` variable injection and `<files_to_read>` sections, which is correct. The executor and verifier prompts are significantly thinner and rely implicitly on subagent system prompts for context they should receive explicitly.
- `[ ] All file paths in agent output are absolute` — **FAIL.** Sub-prompts pass relative paths (`${QUICK_DIR}/...`) without instructing agents to return absolute paths in their output.
- `[ ] Parallel agents launched in a single message block` — **PASS.** The note at the bottom of Step 6 and the parallel-wave reference both address this.
- `[ ] Adversarial probes specified for verification agents` — **FAIL.** The verifier prompt (Step 6.5) is a single sentence with no adversarial probe dimensions.

### Structural Architecture
- `[ ] Large prompts decomposed into atomic, single-responsibility modules` — **PASS.** The workflow delegates to typed subagents (gsd-planner, gsd-executor, gsd-verifier), each with a single responsibility.
- `[ ] Template variables use ${VARIABLE_NAME} syntax with fallback where appropriate` — **PARTIAL.** `${VARIABLE_NAME}` is used consistently; fallback syntax (`${VAR||"default"}`) is absent where optional context is injected (e.g., research file path when `$RESEARCH_MODE` is false).
- `[ ] Modules compose at runtime via variable substitution, not copy-paste` — **PASS.** `${AGENT_SKILLS_*}` variables inject subagent skill content at runtime.

### Constraint Enforcement
- `[ ] Every restriction paired with an equally concrete permission` — **FAIL.** "Do NOT commit docs artifacts" has no paired statement of what the executor IS permitted to commit.
- `[ ] Hard exclusion lists enumerated, not described qualitatively` — **PASS.** The worktree deletion guard enumerates what's blocked (`.planning/` file deletions).
- `[ ] Known edge cases have precedent-style rulings` — **PASS.** The `classifyHandoffIfNeeded` bug workaround is a precedent-style ruling for a known runtime edge case.
- `[ ] Confidence thresholds are numeric, not qualitative` — **N/A.** No confidence scoring in this workflow.

### Decision Frameworks
- `[ ] Multi-option recommendations use explicit decision tree or comparison table` — **PASS.** The verification-status dispatch table is a clean comparison table.
- `[ ] Criteria checklists gate complex approaches` — **PASS.** `<success_criteria>` at the end functions as a completion checklist.
- `[ ] Action permissions framed around reversibility` — **PARTIAL.** The worktree guard and backup/restore pattern implicitly address reversibility, but the constraint blocks do not explicitly use `<take_freely>` / `<confirm_with_user>` framing.

### Multi-Phase Workflows
- `[ ] Complex tasks organized into explicit named phases` — **PASS.** Eight explicitly numbered and named steps.
- `[ ] Required steps distinguished from type-specific steps` — **PASS.** Conditional steps are clearly gate on flag booleans; Steps 1–4 and 7–8 are universal.
- `[ ] Scenario-based branching handles multiple paths explicitly` — **PASS.** Checker return handling, verification status, and worktree/non-worktree paths are all explicitly branched.

### Memory and Continuity
- `[ ] Memory templates use XML tags as section labels` — **PASS.** The CONTEXT.md template uses `<domain>`, `<decisions>`, `<specifics>`, `<canonical_refs>` tags.
- `[ ] Compaction summaries include discoveries and failed approaches` — **PARTIAL.** SUMMARY.md is delegated to the executor without a template; there is no guarantee it includes failed approaches.
- `[ ] Next steps tied to user's most recent explicit request` — **N/A.** (Completion output references the task description, which is the user's request.)

### Modularity
- `[ ] Each prompt component has single responsibility` — **PASS.** Each subagent type handles one concern.
- `[ ] Scope boundaries state both inclusions and exclusions` — **PARTIAL.** `<available_agent_types>` states inclusions and one exclusion. The `<constraints>` blocks in sub-prompts state exclusions only (see Issue 2).

### Safety and Trust
- `[ ] Validation at system boundaries only; internal interfaces trusted` — **PASS.** External validation (git commands, file existence checks) is used at boundaries. Internal agent returns are trusted.
- `[ ] Dual-use capabilities state permissions before restrictions` — **FAIL.** Executor constraint block leads with restrictions ("Do NOT commit…", "Do NOT update…") before stating what is permitted.
- `[ ] Authorization is narrow-scoped; each action confirmed before expanding scope` — **PASS.** The force-proceed offer after max iterations requires explicit user confirmation before expanding execution scope.

### Tone and Style
- `[ ] Size constraints use numeric limits, not qualitative descriptors` — **PARTIAL.** `"Target ~30% context usage"` and `"Target ~40% context usage"` are numeric, which is good. `"1-2 pages of actionable findings"` in the research prompt uses a qualitative size descriptor.
- `[ ] Instructions use imperative present tense` — **PASS.** Step headings ("Parse arguments", "Initialize", "Create task directory") use imperative present tense throughout.
- `[ ] Working notes in analysis tags, not user-facing output` — **N/A.** Orchestration workflow; no reasoning output to hide.

### Optimization
- `[ ] Prompt flagged as draft for automated optimization` — **FAIL.** No optimization flag or note.
- `[ ] Correct optimizer selected` — **FAIL.** Not addressed.
- `[ ] Held-out test set reserved` — **FAIL.** Not addressed.

---

## Recommendations

Prioritized by impact on agent reliability and output consistency:

**1. Add XML section tags to all sub-prompts (Section 4 Action 2 + Section 22 Pattern 3)**
The biggest reliability gain available. Executor, verifier, and code review prompts are near-formless. Wrap each in `<task>`, `<context>`, `<constraints>`, and `<output_format>` tags. The planner and checker prompts are already partially tagged — complete them. Estimated effort: medium. Expected impact: high (reduces model guesswork about which text is the instruction vs. context vs. format spec).

**2. Add machine-parseable output format spec to the verifier prompt (Section 7 + Section 22 Pattern 3)**
The orchestrator hard-codes `grep "^status:" ...VERIFICATION.md` but the verifier prompt never specifies this field. This is a silent failure mode — if the verifier omits the field, the grep returns empty and `$VERIFICATION_STATUS` is blank. Add a literal-string output format spec as shown in Issue 3. Estimated effort: low. Expected impact: high (prevents silent status misreads).

**3. Convert negative constraints to positive equivalents (Section 5 Action 1)**
Replace all "Do NOT" and "Skip" primary directives in sub-prompts with positive specifications. Pair every restriction with a concrete statement of what IS permitted. See Issue 2 conversion table. Estimated effort: low. Expected impact: medium (cleaner model compliance, especially for the executor which has the most negative framing).

**4. Add audience and quality bar to the `<purpose>` block (Section 1 Actions 1–2)**
Two short blocks (`<audience>` and `<quality_bar>`) give the orchestrating model a calibration standard for edge-case decisions. Without them, the model falls back to priors when a step is ambiguous. Estimated effort: very low. Expected impact: medium (most valuable during edge cases, not happy path).

**5. Deduplicate the "skip if not $X_MODE" pattern and add absolute path instruction to agent prompts (Section 11 Action 3 + Section 17)**
The six identical skip-gate lines are a readability and maintenance cost. Extract as a single preamble rule: "Each step marked as mode-gated runs only when its flag is active; otherwise skip and continue." Additionally, add `"Return all file paths as absolute paths."` to executor and verifier prompts to prevent relative-path breakage across tool calls. Estimated effort: low. Expected impact: medium (maintenance quality + agent reliability).
