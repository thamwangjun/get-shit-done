# Critique: analyze-dependencies.md

## Summary

`analyze-dependencies.md` is a competent procedural workflow with clear, numbered steps and a well-defined scope. It successfully describes what the agent must do and produces a concrete, useful output (a dependency table and ROADMAP.md diffs). However, it falls short on several structural and prompt-engineering dimensions. The workflow is written as plain prose with markdown headers rather than semantically structured XML; it lacks an explicit audience definition, quality bar, and persona; it uses no constraint enforcement vocabulary; it has no output format specification with an example; and it provides no handling of edge cases or branching scenarios. The instructions are largely positive and actionable, but without XML structural framing, a defined persona, or formal constraint enforcement, the prompt leaves too much to the model's priors and produces output that will vary in format across runs.

---

## Strengths

- **Section 1 Action 1 (task components):** The `<purpose>` tag is present and clearly states what the output is (dependency relationships) and how it will be used (to prevent merge conflicts during parallel execution by `/gsd-manager`). The "what" and "why" are explicit.
- **Section 5 (Instruction Framing):** Instructions throughout the process steps are predominantly positive and imperative in form ("Extract all phases", "Output a dependency suggestion table", "Ask the user"). There are no negative instructions that need converting.
- **Section 16 (Multi-Phase Workflows):** The workflow is broken into numbered sequential steps (1–6) that create natural cognitive boundaries. This aligns with the phase pattern principle.
- **Section 5 conditional instructions:** Step 6 includes explicit conditional branching for user responses (`yes / no / edit`), mapping each option to distinct behavior. This directly applies the conditional instruction pattern.
- **Section 19 (Modularity):** The workflow is a single-responsibility file — it does one thing (analyze dependencies). It does not try to bundle execution logic or unrelated concerns.
- **Section 15 (Decision Frameworks):** The heuristics table in Step 2 ("Database/schema phases → migration files", etc.) applies a lightweight classification framework to guide inference, reducing ambiguity for the model.

---

## Issues

### Issue 1 — No XML structural framing (Section 4 Action 2)

**Principle:** Section 4 Action 2 requires that prompt sections be wrapped in semantically named XML tags. Section 4 also notes this is "strictly better than markdown headers" for Claude-class models.

**What's wrong:** The workflow uses a `<purpose>` tag correctly but then drops XML entirely. The `<process>` tag wraps all six steps as an undifferentiated block. The steps themselves, the output format, constraints, and the confirmation interaction are all expressed as markdown prose inside `<process>`, not as named XML sections.

**Fix:** Restructure using the standard tag vocabulary from Section 4:

```xml
<task>
  Analyze ROADMAP.md phases for dependency relationships before execution...
</task>

<context>
  This workflow is triggered before /gsd-manager executes phases in parallel...
</context>

<output_format>
  [specification of the dependency table and diff format — see Issue 4]
</output_format>

<constraints>
  [error handling, what to preserve in ROADMAP.md — see Issue 5]
</constraints>
```

---

### Issue 2 — Audience and quality bar are absent (Section 1 Actions 1–2)

**Principle:** Section 1 Action 1 requires that the prompt make explicit what a correct/high-quality response looks like. Section 1 Action 2 requires encoding the audience with their domain knowledge and vocabulary level.

**What's wrong:** The workflow never states who consumes the output (a developer reviewing a roadmap, or the `/gsd-manager` orchestrator?), what vocabulary level to target, or what makes a good dependency analysis (e.g., how many dependencies is too many, should the model be conservative or aggressive in inferring dependencies, is a false-positive dependency worse than a missed one?).

**Fix:** Add an `<audience>` and `<quality_bar>` block:

```xml
<audience>
  The consuming developer is familiar with the GSD workflow and ROADMAP.md format.
  Output will be read by a developer deciding whether to apply suggested dependency changes.
</audience>

<quality_bar>
  A correct analysis: (1) catches all phases with genuine file-domain overlap, (2) cites a specific reason for each suggested dependency, (3) does not suggest spurious dependencies between clearly independent phases. When in doubt, err toward suggesting a dependency rather than omitting one — a missed dependency causes a merge conflict; an extra dependency only slows parallel execution.
</quality_bar>
```

The tie-breaking rule (err toward suggesting over omitting) is also missing — see Issue 3.

---

### Issue 3 — No tie-breaking rule at the uncertainty boundary (Section 5, Section 22 Pattern 4)

**Principle:** Section 5 requires explicit tie-breaking instructions when the model might be uncertain. Section 22 Pattern 4 states tie-breaking rules must match the domain's cost asymmetry.

**What's wrong:** Dependency detection is inherently uncertain — the model is inferring from phase descriptions, not reading actual code. The workflow provides no guidance on what to do when a dependency is ambiguous (e.g., two phases mention "auth" but it's unclear if they modify the same files). The cost asymmetry here is clear: a false-positive dependency (unnecessary sequential constraint) is far cheaper than a false-negative (merge conflict during parallel execution).

**Fix:** Add an explicit tie-breaking rule inside the `<constraints>` block:

```xml
<constraints>
  <tie_breaking>
    When it is unclear whether a dependency exists between two phases, suggest the dependency.
    A spurious sequential constraint delays execution by one phase; a missed dependency causes
    a merge conflict that blocks all parallel workers. Err toward over-reporting.
  </tie_breaking>
</constraints>
```

---

### Issue 4 — Output format is described but not specified with an example (Section 7, Section 22 Pattern 3)

**Principle:** Section 7 Action 1 requires output format to be specified completely. Section 22 Pattern 3 states: "Format specification is part of the task definition, not an afterthought" and requires an example.

**What's wrong:** Step 4 shows a template using a code block, but the format is loosely described (e.g., "Suggested dependencies:" followed by arrows). There is no example of a complete, filled-in output showing what a real phase entry with two detected dependencies looks like, and no example of the consolidated diff section in Step 5. Without a concrete example, the model will vary the formatting across runs.

**Fix:** Add a filled-in example immediately after the template in Step 4:

```xml
<output_format>
  Output a dependency analysis table using this format:

  Phase Dependency Analysis
  =========================

  Phase N: <name>
    Scope: <brief scope>
    Likely touches: <inferred file domains>

    Suggested dependencies:
    → Depends on: Phase M — reason: <overlap/semantic/data-flow explanation>

    Current "Depends on": <existing value or "(none)">

  <example>
  Phase 3: Add User Auth Endpoints
    Scope: Implement JWT login, registration, and session endpoints
    Likely touches: route files, middleware files, auth handler files

    Suggested dependencies:
    → Depends on: Phase 1 — reason: file overlap (database schema); auth endpoints write to
      the users table established in Phase 1's migration.
    → Depends on: Phase 2 — reason: semantic; Phase 2 defines the User model that Phase 3's
      route handlers depend on.

    Current "Depends on": "(none)"
  </example>
</output_format>
```

---

### Issue 5 — Constraint enforcement uses prose, not structured tags (Section 14)

**Principle:** Section 14 requires pairing every restriction with a concrete permission using `<permitted>` / `<reserved_for_human_review>` or equivalent sub-tags. Section 14 also notes precedent-style rulings for known edge cases.

**What's wrong:** The one constraint in Step 6 ("Preserve all other phase content unchanged", "Do not reorder phases") is buried in prose inside the process steps. There is no `<constraints>` block, no explicit permission pair (what the agent MAY freely modify vs. what it must not touch), and no precedent ruling for the edge case where a phase already has a `Depends on` entry that conflicts with the suggested one.

**Fix:** Add a top-level `<constraints>` block:

```xml
<constraints>
  <permitted>
    - Read ROADMAP.md and any referenced files
    - Add or update the `Depends on:` field in any phase entry
    - Present suggestions to the user before applying them
  </permitted>

  <reserved_for_human_review>
    - Any change to phase content other than the `Depends on:` field
    - Reordering phases
    - Removing or merging phases
  </reserved_for_human_review>

  <precedents>
    1. If a phase already has a `Depends on:` value, append suggested additions rather than
       replacing them — existing dependencies are intentional and must be preserved.
    2. If ROADMAP.md does not exist, error immediately: "No ROADMAP.md found — run
       /gsd-new-project first." Do not attempt to infer or create the file.
  </precedents>
</constraints>
```

---

### Issue 6 — No persona assigned despite clear role-specific behavior (Section 6 Action 1)

**Principle:** Section 6 Action 1 says to assign a persona for tasks that require a specific voice or domain-specific style. Section 22 Pattern 1 states the identity should be scoped to the exact domain.

**What's wrong:** The workflow asks the agent to reason about code architecture, file domains, and data flow — a specialized analytical task. No persona is assigned, leaving the model to default to generic assistant behavior. A dependency-analysis specialist persona would bias the model toward structured, cautious inference rather than general summarization.

**Fix:** Add a scoped persona:

```xml
<persona>
You are a software architecture analyst specializing in build-system dependency detection.
Your job is to identify which phases in a parallel execution plan have ordering constraints
that, if violated, would cause merge conflicts or broken builds.

Err toward flagging a dependency when uncertain — missed dependencies cause merge conflicts;
spurious dependencies only add a sequencing delay.
</persona>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide, applied to `analyze-dependencies.md` as a workflow prompt file:

| Checklist Item | Result |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL — audience and quality bar are absent |
| All constraints are compatible — no conflicts between scope, length, or depth | PASS |
| **Chain-of-Thought** | |
| CoT included only for math/symbolic/multi-step logic tasks | N/A — no CoT trigger present; task is procedural |
| Reasoning elicited before the answer | N/A |
| CoT traces treated as heuristic, not ground truth | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | FAIL — no examples provided |
| 2–5 examples total | FAIL — zero examples |
| Ordered simple → complex | FAIL — zero examples |
| Examples span diverse sub-types | FAIL — zero examples |
| Format is consistent across all examples | FAIL — zero examples |
| Example order fixed across evaluation runs | N/A |
| **Formatting** | |
| Instruction is complete and clear before formatting is applied | PASS |
| Prompt sections are separated by semantically named XML tags | FAIL — only `<purpose>` and `<process>` used; inner sections are markdown prose |
| At least 3 format variants will be tested on the target model | FAIL — no format variants documented |
| **Instruction Framing** | |
| All negative instructions converted to positive equivalents | PASS — instructions are predominantly positive |
| Priority order is explicit when multiple criteria apply | FAIL — no priority order specified for conflicting dependency signals |
| Tie-breaking rules match domain's cost asymmetry | FAIL — no tie-breaking rule present |
| **Persona** | |
| Persona included only for open-ended or stylistic tasks | N/A — no persona present; one is warranted here |
| Persona is specific (constrains voice/register), not generic | FAIL — no persona |
| Persona descriptor is gender-neutral | N/A |
| **Output Format** | |
| Structured output uses reasoning-then-format approach | N/A — output is textual, not JSON/structured |
| Machine-parsed output uses exact format spec with literal string requirements | N/A |
| **Context Placement** | |
| Task instruction is at the start of the prompt | PASS — `<purpose>` leads |
| Primary document or input is at the end of the prompt | N/A — input (ROADMAP.md) is fetched at runtime, not embedded |
| Background context is in the middle | N/A |
| All irrelevant context has been removed | PASS |
| Time-sensitive injected context is labeled as a snapshot | N/A |
| **Self-Consistency** | |
| Applied only to tasks with a single correct answer | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | PASS — no obvious redundancy |
| **System/User Split** | |
| Persistent instructions in system prompt | N/A — file is a workflow/skill file, not a system prompt |
| Each instruction appears in exactly one location | PASS |
| **Agent/Subagent** | |
| Agent prompts are fully self-contained | PASS — workflow is self-contained |
| All file paths in agent output are absolute | N/A — no file paths in output spec |
| Parallel agents launched in single message block | N/A |
| Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | |
| Large prompts decomposed into atomic, single-responsibility modules | PASS — single responsibility file |
| Template variables use ${VARIABLE_NAME} syntax | N/A — no dynamic injection used |
| **Constraint Enforcement** | |
| Every restriction paired with an equally concrete permission | FAIL — restrictions in prose; no `<permitted>` block |
| Hard exclusion lists are enumerated | FAIL — no exclusions block |
| Known edge cases have precedent-style rulings | FAIL — the "existing Depends on" edge case is unhandled |
| Confidence thresholds are numeric, not qualitative | FAIL — no confidence threshold; "likely" used qualitatively |
| **Decision Frameworks** | |
| Multi-option recommendations use decision tree or comparison table | PASS — heuristics table in Step 2 |
| Criteria checklists gate complex approaches | N/A |
| Action permissions framed around reversibility | FAIL — no reversibility framing; ROADMAP.md writes not flagged as needing confirmation until Step 6 prose |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | PASS — six numbered steps |
| Required steps distinguished from type-specific steps | FAIL — all steps treated uniformly; no `<required_steps>` tag |
| Scenario-based branching handles multiple paths explicitly | PARTIAL — Step 6 handles the yes/no/edit branch, but missing scenarios for empty ROADMAP, phases with no descriptions, or pre-existing conflicting dependencies |
| **Memory and Continuity** | |
| Memory templates use XML tags | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | |
| Each prompt component has single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL — inclusions implicit; exclusions (what the agent must not touch) stated only in Step 6 prose |
| **Safety and Trust** | |
| Validation at system boundaries only | PASS — ROADMAP.md existence check in Step 1 |
| Dual-use capabilities state permissions before restrictions | FAIL — the constraint in Step 6 states restrictions only |
| Authorization is narrow-scoped | PASS — confirms before applying |
| **Tone and Style** | |
| Size constraints use numeric limits | FAIL — no numeric limits on output length or dependency count |
| Instructions use imperative present tense | PASS — predominantly imperative |
| Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | |
| Prompt flagged as draft for automated optimization | FAIL — not flagged |
| Correct optimizer selected | N/A |
| Held-out test set reserved | N/A |

---

## Recommendations

Listed in priority order by impact on output quality and consistency:

### 1. Add XML structural framing throughout (Section 4 Action 2)

Replace the `<process>` markdown-prose structure with semantically named XML tags: `<task>`, `<context>`, `<output_format>`, and `<constraints>`. This is the highest-leverage change — it gives the model unambiguous section boundaries, enables the guide's tag vocabulary, and makes the prompt machine-parseable. All other fixes become easier to apply once the skeleton is in place.

### 2. Add a filled-in output example (Section 22 Pattern 3, Section 7)

The dependency table format is specified as a template but never demonstrated with real content. Add one complete filled-in example showing a phase with two detected dependencies, their reasons, and the consolidated diff entry. This single addition will reduce output format variance more than any other change of comparable size.

### 3. Add a tie-breaking rule and quality bar (Section 5, Section 1 Action 1)

The cost asymmetry in dependency detection is clear: missed dependencies cause merge conflicts; spurious dependencies only add sequencing delay. Encode this as an explicit tie-breaking rule and embed it in the quality bar. Without it, the model defaults to its own prior — which may be neither conservative nor consistent across runs.

### 4. Add structured constraint enforcement with a precedents block (Section 14)

Replace the Step 6 prose restrictions with a `<constraints>` block containing `<permitted>`, `<reserved_for_human_review>`, and `<precedents>`. The critical edge case — a phase that already has a `Depends on` value — needs a precedent ruling to prevent the agent from overwriting intentional existing dependencies.

### 5. Add a scoped persona (Section 6, Section 22 Pattern 1)

Add a `<persona>` block that defines the agent as an architecture dependency analyst with an explicit bias toward flagging over-omitting. This narrows the model's behavioral register and aligns its decision-making style with the domain's cost structure before any reasoning begins.
