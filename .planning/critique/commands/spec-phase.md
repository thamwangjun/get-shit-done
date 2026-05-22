# Critique: commands/gsd/spec-phase.md

**Date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Strengths

### S1 — XML tag structure is used correctly (§4 Formatting and Structure)

The file uses semantically named XML tags throughout: `<objective>`, `<execution_context>`, `<runtime_note>`, `<context>`, `<process>`, and `<success_criteria>`. This satisfies §4 Action 2's directive to "wrap each in a semantically named XML tag" where "tags name what the section *is*, not just where it starts." This is strictly better than markdown headers for Claude-class models.

### S2 — Success criteria enumerate falsifiable, testable outputs (§1 Task Specification)

The `<success_criteria>` block lists six discrete behavioural outcomes, several of which are machine-checkable (e.g. "Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met", "SPEC.md committed atomically"). This directly satisfies §1 Action 1(c): "what a correct or high-quality response looks like." Numeric thresholds ("≤ 0.20") are preferable to qualitative terms per §14 Constraint Enforcement.

### S3 — Output artifact is named with its position in the wider workflow (§1 Task Specification, §7 Output Format Handling)

The `<objective>` block names the output artifact (`{phase_dir}/{padded_phase}-SPEC.md`), its downstream consumer (discuss-phase), and its purpose ("falsifiable requirements that lock what/why before discuss-phase handles how"). This satisfies §1 Action 1(a)/(b): stating what is produced and why it matters.

### S4 — Conditional flag behaviour is explicitly enumerated (§5 Instruction Framing)

The `<context>` block lists `--auto` and `--text` flags with precise behavioural descriptions. This matches §5's conditional branching pattern: each flag resolves to a distinct, unambiguous execution branch rather than leaving the model to infer.

### S5 — Mandatory read-before-act instruction prevents improvisation (§16 Multi-Phase Workflows)

The `<process>` block contains a bolded MANDATORY directive: "Read the workflow file BEFORE taking any action." This prevents the model from acting on the `<objective>` summary alone and enforces the phase pattern described in §16. The constraint is correctly placed as a hard guard on the execution order.

---

## Weaknesses

### W1 — The objective summary duplicates the workflow, violating single-source-of-truth (§11 System vs. User Prompt Allocation, §10 Prompt Length)

The `<objective>` block contains a 6-step numbered summary of the workflow, yet `<process>` immediately instructs the model to read the canonical workflow from `@~/.claude/get-shit-done/workflows/spec-phase.md` and not improvise from the summary. Two representations of the same procedure now exist in the prompt: the summary here, and the full workflow in the referenced file.

§11 Action 3 states: "State each instruction exactly once." Duplication consumes context without reinforcing compliance. Worse, if the canonical workflow evolves, the summary in `<objective>` will silently drift, giving the model a contradictory prior. The MANDATORY guard in `<process>` is exactly because this summary creates the risk it tries to prevent.

### W2 — No explicit audience or quality bar for SPEC.md content (§1 Task Specification)

§1 Action 1 requires three components: (a) what output is requested, (b) why it matters, and (c) what a correct or high-quality response looks like. The command names the output and its purpose but never specifies what a *good* SPEC.md looks like at the content level. The `<success_criteria>` block is process-oriented (gate passed, file committed) rather than content-oriented. A reviewer reading the prompt cannot determine what distinguishes a strong SPEC.md from a weak one — whether it should use specific language, avoid vague terms, require a particular structure, or include example acceptance criteria.

§1 Action 2 is also absent: the audience for the SPEC.md (discuss-phase, human reviewer, both?) is not encoded in the prompt, which affects what vocabulary and assumptions are appropriate in the output.

### W3 — No output format specification for SPEC.md (§7 Output Format Handling, §22 Pattern 3)

The command names the output file and path but provides no specification of the SPEC.md structure. §7 and §22 Pattern 3 both state: "Output format specified completely and upfront." §22 Pattern 3: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call."

The template is loaded via `@~/.claude/get-shit-done/templates/spec.md` in `<execution_context>`, but the command itself contains no description of the required sections, fields, or constraints. A reader of the command file alone cannot know what structure is expected. This also makes the command impossible to evaluate independently of the template file.

### W4 — Tool permissions are not scoped to minimum required patterns (§22 Pattern 9)

The `allowed-tools` list grants `Bash` with no prefix restriction. §22 Pattern 9 states: "Express allowed tools as the narrowest patterns that satisfy the task." The spec-phase workflow reads context files, runs a Socratic interview, scores ambiguity, and writes a single SPEC.md — none of which requires unrestricted shell access. Whole-tool `Bash` grants leave the permission boundary undefined and make intent unauditable at a glance.

---

## Specific Rewrites

### Rewrite 1 — Replace the objective summary with a single-sentence anchor (fixes W1)

The current `<objective>` block repeats what the workflow already defines. Replace the numbered summary with a one-sentence role statement that orients the model without duplicating the workflow. The MANDATORY guard in `<process>` remains sufficient to enforce the read-first behaviour.

**Current:**
```xml
<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>
```

**Rewrite:**
```xml
<objective>
Clarify phase requirements through Socratic questioning and produce a SPEC.md with falsifiable requirements before discuss-phase handles implementation decisions.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`
**Output:** `{phase_dir}/{padded_phase}-SPEC.md`
</objective>
```

This removes the duplicated step summary while preserving the workflow position and output name — the two facts not available in the canonical workflow file.

---

### Rewrite 2 — Add explicit audience and quality bar for SPEC.md (fixes W2)

Insert a `<quality_bar>` block immediately after `<context>` to supply the missing §1 Action 1(c) and Action 2 information. This makes the command self-sufficient for evaluating output quality without consulting the template.

**Add after `<context>`:**
```xml
<quality_bar>
A high-quality SPEC.md:
- States requirements as falsifiable acceptance criteria (pass/fail checkable, not vague intentions)
- Explicitly defines what is OUT of scope for the phase, not only what is in scope
- Uses concrete, measurable language — "supports N concurrent users" not "performs well"
- Is written for two audiences: the discuss-phase agent (which must derive implementation options from it) and a human reviewer (who must be able to sign off without reading chat history)
- Contains no implementation decisions — those belong in discuss-phase
</quality_bar>
```

---

### Rewrite 3 — Scope Bash tool permissions (fixes W4)

Replace the unrestricted `Bash` grant with the minimum patterns the spec workflow actually requires.

**Current:**
```yaml
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
```

**Rewrite:**
```yaml
allowed-tools:
  - Read
  - Write
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git status)
  - Bash(find *)
  - Glob
  - Grep
  - AskUserQuestion
```

The spec-phase workflow reads files, scouts the codebase, interviews the user, and commits one file. These patterns cover the commit step and the codebase scouting without granting unrestricted shell access.

---

## Overall Verdict

**Adequate**

The command's XML structure, numeric ambiguity gate, conditional flag handling, and read-before-act guard are solid. The core failure is an incomplete §1 task specification: no audience encoding, no content-level quality bar for the output, and no format description beyond the artifact path. The objective summary is a §11 violation that creates a guaranteed drift risk as the workflow evolves. These are fixable with targeted additions rather than a structural rewrite — the bones are sound.
