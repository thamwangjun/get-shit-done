# Critique: `commands/gsd/ai-integration-phase.md`

Critiqued against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict: **Needs Work**

This command file is a thin dispatch shell — its body is 5 lines of routing logic plus 3 file references. That design choice is defensible as a modularity pattern (§19), but it means the command itself provides almost no surface on which good prompt engineering can operate. What is present contains meaningful structural violations.

---

## Strengths

### 1. Modular dispatch pattern (§19 — Modularity and Composition)

The file correctly separates concerns: the command file is a thin router that delegates all substantive logic to workflow and reference files. This matches the guide's architectural recommendation that each prompt component have a single responsibility and compose via runtime references. The `@` include syntax is the equivalent of template variable injection (§13).

### 2. Tool permission scoping (§22 Pattern 9)

The `allowed-tools` list is explicit and reasonably scoped: named tools (`Read`, `Write`, `Glob`, `Grep`) plus pattern-scoped MCP access (`mcp__context7__*`). This matches the guide's preference for narrow permission grants that make the skill's intended behavior auditable. `Bash` and `Task` are broad, but their inclusion is defensible for an orchestration command.

### 3. YAML frontmatter for agent configuration (§11)

The file uses frontmatter to encode identity (`name`), description, argument hints, and tool permissions in one machine-readable location — consistent with the guide's recommended pattern for agent configuration.

---

## Weaknesses

### Weakness 1: No XML structural tags on prompt sections — markdown-style delimiters used instead (§4 Action 2)

The guide states that prompts with multiple distinct sections must wrap each in a semantically named XML tag, and that this is "strictly better than markdown headers or `---` delimiters for Claude-class models." The command file uses bare XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`), which is structurally correct, but the tag names are semantically wrong for the guide's vocabulary. Specifically:

- `<objective>` is not in the guide's top-level structural tag vocabulary. The guide specifies `<task>` for "what the model must do." The content inside `<objective>` is exactly what `<task>` is designed to hold (§4, XML tag vocabulary table).
- `<execution_context>` is not a defined tag. The guide defines `<context>` for background information and runtime sub-tags (`<log_path>`, `<git_status>`, etc.) for injected runtime data. Using a non-vocabulary tag breaks interoperability with composed modules (§19).
- `<process>` is undefined. The guide uses `<task>` for primary instructions and `<phase>` for multi-step workflows (§16). The `<process>` tag carries no shared semantic signal.

**Impact:** The non-standard tag vocabulary degrades the model's ability to weight sections correctly. The guide explicitly notes that tag names "carry semantic meaning" — using undefined names forfeits that advantage.

### Weakness 2: No task specification — intent, audience, and quality bar are absent (§1 — Task Specification)

The guide requires that every prompt make explicit: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. The command file specifies none of these directly. The `<objective>` tag describes the orchestration flow, not the quality bar for the output artifact (AI-SPEC.md). There is no `<audience>` or `<quality_bar>` tag.

This matters because the command delegates to a workflow file (`@~/.claude/get-shit-done/workflows/ai-integration-phase.md`) that the model must retrieve and execute — but without an explicit quality bar in scope at the dispatch layer, there is no anchor against which the final AI-SPEC.md can be evaluated. The guide explicitly warns: "ask for any missing component before proceeding" (§1 Action 1).

**Impact:** Unpredictable output quality. The model has no criteria against which to self-check the generated AI-SPEC.md.

### Weakness 3: Negative instruction present; no positive reframe (§5 — Instruction Framing)

The `<process>` block contains: "Preserve all workflow gates." This is a negation-adjacent constraint ("don't skip the gates") dressed as a positive but providing no specification of what a "workflow gate" is, what it looks like when preserved, or what the agent should do at each gate. The guide's conversion table (§5 Action 1) requires converting vague protective instructions into positive specifications of desired behavior. "Preserve all workflow gates" cannot be evaluated by the model — there is no grounding for what compliance looks like.

Additionally, the `$ARGUMENTS` reference in `<context>` is used correctly as a template variable, but the fallback behavior ("auto-detects next unplanned phase if omitted") is stated in prose rather than using the guide's explicit conditional branching syntax (§5, Conditional instructions; §13, Template variable injection with fallback syntax `${VAR||"default"}`).

---

## Specific Rewrites

### Rewrite 1: Fix tag vocabulary to match guide's XML schema (addresses Weakness 1)

**Current:**
```xml
<objective>
Create an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrates gsd-framework-selector → gsd-ai-researcher → gsd-domain-researcher → gsd-eval-planner.
Flow: Select Framework → Research Docs → Research Domain → Design Eval Strategy → Done
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ai-integration-phase.md
@~/.claude/get-shit-done/references/ai-frameworks.md
@~/.claude/get-shit-done/references/ai-evals.md
</execution_context>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute @~/.claude/get-shit-done/workflows/ai-integration-phase.md end-to-end.
Preserve all workflow gates.
</process>
```

**Rewrite:**
```xml
<task>
Generate an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrate the pipeline: framework selection → doc research → domain research → eval strategy design.
Produce a contract that is specific enough for an engineer to implement against without returning for clarification.
</task>

<context>
  <workflow>@~/.claude/get-shit-done/workflows/ai-integration-phase.md</workflow>
  <references>
    @~/.claude/get-shit-done/references/ai-frameworks.md
    @~/.claude/get-shit-done/references/ai-evals.md
  </references>
</context>

<input>
Phase: ${ARGUMENTS||"auto-detect: identify the next unplanned phase before proceeding"}
</input>

<constraints>
Execute the workflow file end-to-end in sequence. Complete each gate before advancing to the next phase.
</constraints>
```

**What changed:** `<objective>` → `<task>` (vocabulary-correct, §4 tag table); `<execution_context>` → `<context>` with semantic sub-tags (§4, §8); `<process>` → `<constraints>` with positive framing (§5 Action 1); `$ARGUMENTS` → `${ARGUMENTS||"..."}` with explicit fallback (§13); quality bar added to `<task>`.

---

### Rewrite 2: Add explicit quality bar for the output artifact (addresses Weakness 2)

Insert a `<quality_bar>` tag after `<task>`. The guide specifies this as a required component of task specification (§1 Action 1, §4 tag vocabulary):

```xml
<quality_bar>
A correct AI-SPEC.md:
- Names the selected AI framework with the rationale tied to the phase's specific requirements
- Includes implementation guidance sourced from official documentation (not from model priors)
- Specifies an evaluation strategy with at least one measurable metric and a pass threshold
- Is self-contained: an engineer reading it needs no other document to begin implementation
</quality_bar>
```

This anchors the model's self-evaluation at the end of the pipeline and gives the orchestrator a concrete checklist to verify the output against before declaring the command complete.

---

### Rewrite 3: Replace the vague "Preserve all workflow gates" with positive conditional branching (addresses Weakness 3)

**Current:**
```
Preserve all workflow gates.
```

**Rewrite:**
```xml
<constraints>
Execute each pipeline stage in sequence:
1. Framework selection — complete before starting doc research
2. Doc research — retrieve from official sources via WebFetch/mcp__context7; complete before domain research
3. Domain research — complete before eval strategy design
4. Eval strategy design — must include at least one measurable pass/fail metric

If a stage produces insufficient output to proceed (e.g., framework search returns no results),
ask the user for clarification before advancing to the next stage.
</constraints>
```

This converts the abstract "preserve gates" injunction into a numbered sequence with a concrete gate condition (what "sufficient" means to proceed) and an explicit fallback action — consistent with §5 conditional instructions and §16 required vs. optional steps.

---

## Summary Table

| Issue | Guide Section | Severity |
|---|---|---|
| Non-vocabulary XML tag names (`<objective>`, `<execution_context>`, `<process>`) | §4 Action 2, XML tag vocabulary | High |
| Missing quality bar and audience for AI-SPEC.md output | §1 Action 1–2, §23 checklist | High |
| Vague constraint "Preserve all workflow gates" with no positive specification | §5 Action 1 | Medium |
| `$ARGUMENTS` fallback described in prose instead of `${VAR\|\|"default"}` syntax | §13 Template variable injection | Low |
| No `<output_format>` tag specifying the structure of AI-SPEC.md | §7 Action 1, §22 Pattern 3 | Medium |
