# Critique: `commands/gsd/add-tests.md`

> Reviewed against: Prompt Engineering Guide V09
> Scope: The command file (`commands/gsd/add-tests.md`) plus its delegated workflow (`~/.claude/get-shit-done/workflows/add-tests.md`), treated as one logical unit since the command is a thin wrapper that gains meaning only through the workflow.

---

## Strengths

### §4 Formatting and Structure — XML tag discipline is strong throughout the workflow

The workflow uses semantically named XML tags consistently: `<task>`, `<context>`, `<process>`, `<constraints>`, `<quality_bar>`. This matches the guide's tag vocabulary exactly (§4, XML tag vocabulary table). Each tag names what the section *is*, not where it starts. The `<classification_rules>` block is particularly well-structured — it uses a table with three categories, named sub-tags for TDD/E2E/Skip criteria, and an explicit tie-breaking rule. This directly implements §5's tie-breaking instruction pattern and §14's constraint enforcement model.

### §5 Instruction Framing — Explicit tie-breaking rule present

The tie-breaking rule in `analyze_implementation` — "When a file contains both TDD-eligible logic and E2E-eligible UI code, classify as TDD and note the E2E coverage gap" — is a textbook application of §5's tie-breaking guidance. It names the uncertainty condition, states a decision, and specifies what to do with the residual (note the gap). This removes ambiguity at the boundary without over-constraining the general case.

### §16 Multi-Phase Workflows — Phase pattern fully implemented

The workflow decomposes into seven named steps with explicit sequencing, gate conditions, and exit paths. This matches the `<phase>` architecture described in §16. Each step has a single responsibility. The approval gates (`present_classification`, `generate_test_plan`) create explicit cognitive boundaries before irreversible actions, which aligns with the reversibility framework in §15.

### §14 Constraint Enforcement — The `no-skip` constraint is precisely stated

The `<constraints><rule id="no-skip">` block in `execute_e2e_generation` is well-formed: it names the rule, states the behavior positively ("must be executed"), handles the failure case ("report the blocker; mark the test incomplete"), and pairs restriction with a permitted alternative. This is the permit-first-then-restrict framing from §20.

### §22 Production Pattern 3 — Output format specified with a concrete example

The classification presentation, test plan presentation, and summary table all specify exact output format upfront with literal field names. The summary table (`| Category | Generated | Passing | Failing | Blocked |`) is machine-readable and consistent. This matches Production Pattern 3 (§22).

---

## Weaknesses

### Issue 1 — §1 Task Specification: Audience is absent; quality bar is in the wrong file

The guide requires three components explicit in the prompt: what, why/how used, and what a high-quality response looks like (§1, Action 1). The command file states the *what* in `<objective>` adequately. The `<quality_bar>` checklist exists — but it lives at the bottom of the workflow, separated from the task description by 350 lines of process instructions. The guide's recommended XML structure places `<quality_bar>` adjacent to `<task>` and `<audience>` at the top of the prompt (§1, Action 2 template).

Critically, the **audience** is never defined. The workflow is invoked by a developer who has just completed a phase. Their vocabulary level, test framework familiarity, and domain knowledge are never encoded. This matters because the classification rules and plan presentation assume a baseline (e.g., that the user knows what "RED-GREEN-REFACTOR" means) that is never stated.

### Issue 2 — §6 Persona Assignment: No persona assigned despite stylistic and judgment-heavy output

The workflow produces both classification judgments and a structured test plan that requires domain expertise to evaluate. Per §6 Action 1, persona is warranted when a task is "open-ended, stylistic, or requires a specific voice." Test classification is inherently judgment-based — the TDD/E2E/Skip boundary is fuzzy. Yet no persona is assigned. Compare the guide's adversarial testing agent example (§17, §22 Pattern 8): it assigns a "verification specialist" persona explicitly to bias behavior toward adversarial probing. Without a persona, the classifier defaults to generic assistant behavior and has no stated identity to anchor its classification decisions.

The workflow could benefit from something like:

```xml
<persona>
You are a test engineering specialist. Your job is not to write tests that pass —
it is to find behavior the implementation did not exercise. Classify conservatively:
when in doubt, include the file rather than skip it.
</persona>
```

### Issue 3 — §5 Instruction Framing + §4 Formatting: The command file delegates without context; the `<context>` block in the workflow is informational prose, not structured constraint injection

The command file's `<context>` block contains only two template references (`@.planning/STATE.md`, `@.planning/ROADMAP.md`) and the phase argument. The workflow's `<context>` block contains a single paragraph explaining why the workflow exists — historical background about "hand-crafted ad-hoc prompts." This is §8's middle-position context, but it consumes tokens on information the model does not need to act on. Per §8 Action 4: "remove boilerplate, tangential sections, and loosely related content."

More structurally, the guide specifies that context should inject live runtime data using `<git_status>`, `<current_branch>`, and similar sub-tags (§8, Runtime context injection). The command file provides no runtime context — the phase directory, project test runner, and existing test structure are all discovered by the workflow at runtime via bash commands. This is correct behavior, but the context section does not orient the model to what it will find. It could at least inject the project name or the path template for phase directories.

Additionally, the command file has **negative instructions** that violate §5 Action 1. The `<process>` block says:

> "Preserve all workflow gates (classification approval, test plan approval, RED-GREEN verification, gap reporting)."

"Preserve" as a negative-adjacent framing ("do not skip these gates") should be rewritten positively: "Execute all workflow gates in sequence: classification approval → test plan approval → RED-GREEN verification → gap reporting."

---

## Specific Rewrites

### Rewrite 1 — Add persona and audience to the workflow `<task>` block

**Current (workflow, lines 1–3):**

```xml
<task>
Generate unit and E2E tests for a completed phase. Classify each changed file into TDD (unit), E2E (browser), or Skip. Present a test plan for user approval, then generate and run tests following RED-GREEN conventions.
</task>
```

**Suggested rewrite:**

```xml
<persona>
You are a test engineering specialist. Your job is not to write tests that compile —
it is to find behavior the implementation does not already exercise. Classify files
conservatively: when a file's purpose is ambiguous, include it rather than skip it,
and document the reason.
</persona>

<task>
Generate unit and E2E tests for a completed phase. Classify each changed file into
TDD (unit), E2E (browser), or Skip with a stated reason. Present classification and
test plan to the developer for approval before generating any test code. Execute every
generated test and report results, passing or failing.
</task>

<audience>
The invoking developer has completed a phase and wants automated test coverage with
minimal manual effort. They are familiar with the project's test runner but may not
know the TDD/E2E boundary for every file. Expect them to adjust classification;
make adjustment easy.
</audience>

<quality_bar>
A complete run: classifies every changed file, gains user approval at two gates,
generates tests with arrange/act/assert structure, executes every test, records
failing tests as potential bugs without fixing them, and commits passing tests.
</quality_bar>
```

This moves `<quality_bar>` to the top (adjacent to `<task>`), adds a `<persona>` with the reframe pattern from §6, and encodes the audience per §1.

---

### Rewrite 2 — Replace the informational `<context>` block in the workflow with structured runtime context

**Current (workflow, lines 5–11):**

```xml
<context>
Users previously hand-crafted ad-hoc prompts for test generation after each phase. This workflow standardizes the process: proper classification, user approval gates, test execution, and gap reporting. It operates on a completed phase — the implementation already exists.
</context>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>
```

**Suggested rewrite:**

```xml
<context>
  <phase_arg>${ARGUMENTS}</phase_arg>
  <workflow_scope>
    This workflow operates on a completed phase. The implementation already exists.
    Tests are generated from phase artifacts (SUMMARY.md, CONTEXT.md, VERIFICATION.md).
    Test fixing is out of scope — report bugs found, do not fix them.
  </workflow_scope>
</context>
```

The historical rationale ("users previously hand-crafted...") is irrelevant to task execution and wastes context per §8 Action 4 and §10 Action 1. The structural constraint ("implementation already exists; fixes are out of scope") is the only operationally relevant fact — move it here, not buried in step 6. The `<required_reading>` instruction is a meta-instruction better expressed as the first bullet in the `<process>` block or removed if the execution_context reference handles it implicitly.

---

### Rewrite 3 — Reframe the command file's `<process>` instruction from negative to positive

**Current (command file, lines 38–41):**

```
<process>
Execute the add-tests workflow from @~/.claude/get-shit-done/workflows/add-tests.md end-to-end.
Preserve all workflow gates (classification approval, test plan approval, RED-GREEN verification, gap reporting).
</process>
```

**Suggested rewrite:**

```xml
<process>
Execute the add-tests workflow from @~/.claude/get-shit-done/workflows/add-tests.md end-to-end.
Complete all four workflow gates in sequence:
1. Classification approval (user confirms TDD/E2E/Skip breakdown)
2. Test plan approval (user confirms test cases before generation)
3. RED-GREEN execution (every test run and result recorded)
4. Gap report (coverage gaps and bugs documented before commit)
</process>
```

This converts the "Preserve" negative framing into an explicit positive enumeration (§5 Action 1). The numbered list makes the gate sequence scannable and prevents the model from treating any gate as optional — a common failure mode when instructions are stated as preservation rules rather than execution directives.

---

## Overall Verdict

**Adequate.**

The workflow is structurally sound. It implements multi-phase workflow patterns (§16), tie-breaking (§5), constraint enforcement (§14), and output format specification (§22 Pattern 3) correctly. The quality bar checklist and explicit approval gates are the strongest elements — they ensure the workflow cannot silently skip critical steps.

The gaps are concentrated in setup: no persona biases the classification judgment, no audience anchors the register, and the context block wastes tokens on historical rationale. These are §1 and §6 omissions — they do not break the workflow, but they leave classification accuracy and output consistency to the model's priors rather than anchoring them with stated identity and audience expectations. The negative instruction in the command file's `<process>` block (Rewrite 3) is a minor issue but a fast fix.

Priority order for fixes: Rewrite 1 (persona + audience + quality_bar relocation) > Rewrite 3 (positive framing in command) > Rewrite 2 (context trimming).
