# Critique: gsd-planner.md

**Agent:** `agents/gsd-planner.md`

**Date:** 2026-04-30

---

## Guide Sections Evaluated

The following guide sections are directly applicable to this agent:

- Section 1: Task Specification
- Section 4: Formatting and Structure
- Section 5: Instruction Framing
- Section 6: Persona Assignment
- Section 7: Output Format Handling
- Section 8: Context Placement
- Section 10: Prompt Length and Compression
- Section 11: System vs. User Prompt Allocation (YAML frontmatter)
- Section 13: Structural Architecture Patterns
- Section 14: Constraint Enforcement
- Section 15: Decision Frameworks
- Section 16: Multi-Phase Workflows
- Section 17: Agent and Subagent Patterns
- Section 19: Modularity and Composition
- Section 21: Tone and Style Rules
- Section 22: Production Patterns
- Section 23: Quick-Reference Checklist

---

## Strengths

### S1 — Rich XML structural tagging (Section 4.2, Section 16)

The agent uses semantically named XML tags throughout: `<role>`, `<context_fidelity>`, `<scope_reduction_prohibition>`, `<planner_authority_limits>`, `<philosophy>`, `<discovery_levels>`, `<task_breakdown>`, `<dependency_graph>`, `<scope_estimation>`, `<plan_format>`, `<goal_backward>`, `<checkpoints>`, `<tdd_integration>`, `<execution_flow>`, `<structured_returns>`, `<critical_rules>`, `<success_criteria>`. This is consistent with the guide's directive to "wrap each [section] in a semantically named XML tag" and is one of the strongest structural aspects of the file.

### S2 — Explicit execution flow with named steps (Section 16, Section 17)

The `<execution_flow>` section organizes all steps as `<step name="...">` elements with a defined sequence. This maps directly to the guide's phase pattern: "For complex multi-step tasks, organize into explicit named phases using XML tags." The step names (`load_project_state`, `mandatory_discovery`, `break_into_tasks`, etc.) are informative and boundary-forming.

### S3 — Constraint pairs: restriction + permission (Section 14)

The `<planner_authority_limits>` section provides both a prohibition ("The planner has no authority to judge a feature as too difficult") and an explicit enumeration of the three legitimate reasons to act otherwise. This mirrors the guide's "pair every restriction with what IS permitted" pattern.

### S4 — Scenario-based branching (Section 16)

The agent handles multiple invocation modes (standard, `--gaps`, revision, `--reviews`) with explicit conditional branching in `<execution_flow>`:
> "If `--gaps` flag or gap_closure context present: Read `get-shit-done/references/planner-gap-closure.md`"

This is consistent with the guide's `<scenarios>` pattern for explicit conditional handling rather than leaving the model to infer.

### S5 — Decision frameworks with concrete criteria (Section 15)

The discovery level protocol uses a structured tiered decision tree (Level 0-3) with explicit criteria. The scope estimation section provides a comparison table for context weight vs. task count. These align with the guide's ASCII decision tree and comparison table patterns.

### S6 — Goal-backward methodology (Section 16, Section 22 Pattern 1)

The `<goal_backward>` section defines a five-step process with outcome-shaped goals, observable truths from the user's perspective, required artifacts, and key links. The guide's principle that "role identity scoped to the exact domain" produces consistent outputs is embodied here through a structured methodology rather than vague heuristics.

### S7 — Specificity test for task descriptions (Section 22 Pattern 2)

> "Could a different Claude instance execute without asking clarifying questions? If not, add specificity."

This is a strong calibration heuristic consistent with the guide's principle that "qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable."

### S8 — Structured return formats (Section 7, Section 17)

The `<structured_returns>` section fully specifies the output format for each completion state (planning complete, gap closure, revision), including exact markdown table structures. This aligns with the guide's "Output format specified completely and upfront" (Production Pattern 3).

### S9 — YAML frontmatter with agent metadata (Section 11, Section 17)

The frontmatter encodes `name`, `description`, `tools`, and `color`. This is consistent with the guide's YAML frontmatter pattern for agent configuration.

---

## Weaknesses

### W1 — Persona is role-titled but fails the specificity test (Section 6.2, Section 22 Pattern 1)

The agent opens with:
> "You are a GSD planner. You create executable phase plans with task breakdown, dependency analysis, and goal-backward verification."

The guide states: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The current persona states what the agent does (task-shaped) but does not constrain how it reasons, what priorities it holds under pressure, or what its decision-making style is. Per the guide's role-domain mapping table, this maps to the "Ineffective" column — it is a role title without behavioral constraint.

The guide provides a concrete positive model: "You are a software architect and planning specialist for Claude Code. Your role is to explore the codebase and design implementation plans." The gsd-planner persona does not reach this level of behavioral specificity. No "strengths listing" (Section 6, Strengths Listing pattern) is present, which the guide identifies as a mechanism for biasing behavior toward specific capabilities.

The tag used is `<role>` rather than the guide's canonical `<persona>` tag, which is a minor vocabulary deviation from Section 4's shared tag vocabulary table.

### W2 — Negative instructions not converted to positive equivalents (Section 5.1)

The agent contains numerous negative-framing instructions that the guide requires to be rewritten as positive specifications:

- `<scope_reduction_prohibition>`: "**PROHIBITED language/patterns in task actions:** 'v1', 'v2', 'simplified version'..."
- `<critical_rules>`: "**No re-reads:** Never re-read a range already in context."
- `<critical_rules>`: "**No heredoc writes:** Always use the Write or Edit tool, never `Bash(cat << 'EOF')`."
- `<planner_authority_limits>`: "The planner has no authority to judge a feature as too difficult, omit features..."
- `<scope_reduction_prohibition>`: "Do NOT silently omit features."

The guide's conversion table is explicit: "Do not X" should become "Do X instead." For example, "No re-reads" should become "Read each file once; extract all needed information in that pass." The prohibition approach creates a catalog of what not to do rather than anchoring the model on the correct behavior. The guide treats the single exception as the reframe pattern (`<persona>` with "Your job is NOT X — it's Y"), which has a specific purpose: displacing a default prior. Most of the negatives here are not displacing defaults; they are the primary specification.

### W3 — No few-shot examples calibrating plan quality (Section 3, Section 22 Pattern 2)

The `<task_breakdown>` section distinguishes good from bad with labeled pairs for `<files>`, `<action>`, `<verify>`, and `<done>` fields — which is a positive application of the Good/Bad labeled pair pattern. However, there are no complete few-shot examples of a finished PLAN.md at the quality target. The guide states: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." The plan format template shows structure but not a complete instantiation showing the quality bar for `<action>` specificity, `<verify>` command quality, and `<done>` measurability together in a realistic scenario. The guide's Pattern 2 requires calibrating examples, not just schema examples.

### W4 — Output format section in `<plan_format>` uses prose description where numeric constraints are available (Section 21, Section 7)

The guide states: "Numbered limits beat qualitative descriptors." The plan format instructions use qualitative directives:
- "Specific implementation instructions, including what to avoid and WHY" — what is specific?
- "Specific automated command that runs in < 60 seconds" — the 60-second limit is good, but the surrounding guidance ("Specific", "Exact") is qualitative.
- "Action section >1 paragraph" as a split signal — this is qualitative.

Compare with the guide's standard: "Format: 2-12 words, match the user's style. Or nothing." and "Keep it short and simple, ideally no more than 6 words." The planner's output format constraints use qualitative language where quantitative limits are possible (e.g., `<action>` max sentence count, `<files>` max count before requiring a split, `<done>` maximum clause count).

### W5 — Context placement: primary task instruction is not leading (Section 8.1, Section 8.2)

The guide requires: "Place the task instruction at the very start of the prompt." The agent's opening structure is:

1. YAML frontmatter (agent config — correct placement)
2. `<role>` — persona/identity block
3. `<documentation_lookup>` — how to use Context7
4. `<project_context>` — discovery instructions
5. `<context_fidelity>` — constraint enforcement
6. `<scope_reduction_prohibition>` — constraint enforcement

The primary task specification ("what output is being requested" and "why it matters") is distributed across these sections rather than leading. The guide's canonical structure is `<task>` first, supplementary `<context>` in the middle, and `<input>` last. The agent does not have a single `<task>` or `<goal>` block at the top that states its purpose in one high-attention position. The `<role>` block contains the closest approximation but is mixed with spawning context and reference file inclusion.

### W6 — Inline `@` file references create implicit dependencies not visible in the prompt (Section 13, Section 17.2)

The agent defers substantial behavioral logic to external references:
- `@~/.claude/get-shit-done/references/mandatory-initial-read.md`
- `@~/.claude/get-shit-done/references/planner-source-audit.md`
- `@~/.claude/get-shit-done/references/planner-antipatterns.md`
- `@~/.claude/get-shit-done/references/tdd.md`
- `@~/.claude/get-shit-done/references/thinking-models-planning.md`
- `@~/.claude/get-shit-done/references/planner-gap-closure.md`
- `@~/.claude/get-shit-done/references/planner-revision.md`
- `@~/.claude/get-shit-done/references/planner-reviews.md`

The guide's Section 17.2 requires: "Each agent prompt must be fully self-contained when spawned." At spawn time, if these references fail to resolve or are unavailable, the agent has no fallback specification for those behavioral areas. The guide's pattern for mode-specific logic is to include it under `<scenario condition="...">` blocks within the prompt, not to load external files at runtime. Some deferred loading (gap_closure, revision, reviews) is operationally reasonable for large mode-specific content, but the core planning logic references (`planner-antipatterns.md`, `thinking-models-planning.md`, `tdd.md`) are critical to baseline operation and should be either inlined or have graceful fallback specified.

### W7 — Missing `whenToUse` in frontmatter (Section 11, Section 17.1)

The frontmatter contains `name`, `description`, `tools`, and `color` but does not include `whenToUse` or `criticalSystemReminder`. The guide's Section 17.1 specifies: "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic." Without `whenToUse`, the orchestrating model (`/gsd-plan-phase`) cannot use the frontmatter as a machine-readable trigger condition — it must rely on narrative description alone. The guide pattern explicitly encodes this as part of `agentMetadata`.

### W8 — No `<quality_bar>` or `<audience>` specification (Section 1.1, Section 1.2)

The guide requires extracting three components: what output is requested, why it matters, and what a correct/high-quality response looks like. The agent has `<success_criteria>` at the end (a checklist), but no upfront statement of what makes a high-quality plan as opposed to a merely valid one. The distinction matters: a checklist confirms structural completeness; a quality bar establishes the standard the agent is optimizing toward. The guide's `<quality_bar>` tag captures this: "Criteria for what makes a correct or high-quality response — format, length, focus." The audience (Claude executor agents who will read and run PLAN.md files) is identified implicitly in scattered phrases but never encoded as a first-class specification that constrains vocabulary level, assumed context, and format choices.

### W9 — Priority ordering is implicit, not declared (Section 5, Priority Ordering)

The agent has multiple competing considerations — user locked decisions, scope reduction prohibition, context budget, planner authority limits, goal-backward methodology — but no explicit `<priority_order>` block. The guide states: "When multiple considerations apply, list them with explicit priority... Explicit ordering removes ambiguity when signals conflict." For a planning agent that must simultaneously honor user decisions, avoid scope reduction, stay within context budget, and cover all requirements, the absence of an explicit priority ordering means the model must infer resolution rules when these signal. This is a reliability risk: a locked decision (CONTEXT.md D-XX) and a context budget constraint may genuinely conflict, and the current prompt does not specify which wins.

---

## Concrete Improvements

### I1 — Replace `<role>` with a behavioral `<persona>` block including strengths

Replace the current opening:

```xml
<role>
You are a GSD planner. You create executable phase plans with task breakdown,
dependency analysis, and goal-backward verification.
...
</role>
```

With a guide-conformant `<persona>` block:

```xml
<persona>
You are a planning specialist for a solo-developer AI workflow system.
Your job is not to describe what should be built — it is to produce
PLAN.md files that a Claude executor can run without asking a single
clarifying question.

Your strengths:
- Deriving precise, file-specific task descriptions from high-level goals
- Building dependency graphs that maximize parallelism
- Applying goal-backward methodology to identify what must be true, not just what to build
- Detecting when a feature needs to be split (context cost, missing information,
  dependency conflict) versus when it must be delivered in full
- Writing verification criteria that are runnable commands, not prose assertions
</persona>
```

This constrains voice, priorities, and decision-making style rather than just naming the role.

### I2 — Add an explicit `<priority_order>` block near the top

Insert after `<persona>`, before `<context_fidelity>`:

```xml
<priority_order>
When signals conflict, resolve in this order (highest first):
1. Locked user decisions from CONTEXT.md (D-XX) — non-negotiable
2. Source coverage completeness — every REQ/GOAL/RESEARCH/CONTEXT item must be COVERED
3. Scope reduction prohibition — no silent simplification
4. Context budget — split plans rather than omit features
5. Planner authority limits — only split for: context cost, missing info, dependency conflict
6. Discovery protocol — apply correct level; do not over- or under-research
</priority_order>
```

### I3 — Convert the five most critical negative instructions to positive form

Current negative form → positive rewrite:

| Current (negative) | Rewrite (positive) |
|---|---|
| "**No re-reads:** Never re-read a range already in context." | "Read each file once. Extract all types, exports, conventions, and function signatures in a single pass. Use Grep with a specific pattern if additional detail is needed after the initial read." |
| "**No heredoc writes:** Always use the Write or Edit tool, never `Bash(cat << 'EOF')`." | "Create all files using the Write or Edit tool." |
| "Do NOT silently omit features." | "Every source item must be explicitly COVERED in a plan, flagged for SPLIT, or marked EXCLUDED with a documented reason." |
| "PROHIBITED language/patterns in task actions: 'v1', 'v2', 'simplified version'..." | "Task actions must deliver the full specification in CONTEXT.md. When the full feature cannot fit in a single plan, return a PHASE SPLIT RECOMMENDED signal with the proposed sub-phase structure." |
| "The planner has no authority to judge a feature as too difficult." | "Plan every feature that lacks a context cost, missing information, or dependency conflict blocker. Assess only these three factors; feature complexity is not a planning input." |

### I4 — Add a complete PLAN.md calibration example to `<task_breakdown>`

The Good/Bad field pairs are useful but incomplete. Add one full realistic example showing all four fields at quality-bar standard. Place it at the end of the `<task_breakdown>` section:

```xml
<examples>
  <example>
    <commentary>Complete task at quality-bar standard for a medium-complexity feature.</commentary>
    <output>
    <task type="auto" tdd="true">
      <name>Task 2: Implement JWT session creation endpoint</name>
      <files>src/app/api/auth/login/route.ts, src/app/api/auth/login/route.test.ts</files>
      <behavior>
        - Test 1: Valid email + password -> 200, httpOnly cookie set, JWT payload contains userId
        - Test 2: Valid email + wrong password -> 401, no cookie set
        - Test 3: Non-existent email -> 401, response time indistinguishable from wrong-password case
        - Test 4: Missing body fields -> 400 with validation error
      </behavior>
      <action>
        Create POST handler. Accept {email, password}. Validate body with zod
        (email: string().email(), password: string().min(1)). Query User table by email.
        Compare password with bcrypt.compare. On match: sign JWT with jose (not
        jsonwebtoken — CommonJS/Edge runtime incompatibility) using USER_JWT_SECRET env var,
        15-min expiry, set as httpOnly Secure SameSite=Strict cookie named `session`.
        Return 200 {}. On mismatch or missing user: return 401 {}. Add 50ms artificial
        delay on both failure paths (timing oracle prevention, per T-auth-01 mitigation).
      </action>
      <verify>
        <automated>npm test -- --filter=auth/login</automated>
      </verify>
      <done>All four test cases pass. curl -X POST /api/auth/login with valid credentials
      returns Set-Cookie header with httpOnly flag. curl with invalid credentials returns
      401 with no Set-Cookie header.</done>
    </task>
    </output>
  </example>
</examples>
```

### I5 — Add `whenToUse` and `criticalSystemReminder` to frontmatter

Replace the current frontmatter:

```yaml
---
name: gsd-planner
description: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /gsd-plan-phase orchestrator.
tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
color: green
---
```

With a guide-conformant frontmatter:

```yaml
---
name: gsd-planner
description: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /gsd-plan-phase orchestrator.
tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
color: green
agentMetadata:
  agentType: planner
  whenToUse: >
    Use when a phase needs PLAN.md files created or revised. Handles standard planning,
    gap closure (--gaps), checker-driven revision (revision_context), and cross-AI review
    replanning (--reviews). Input: ROADMAP.md phase + optional CONTEXT.md, RESEARCH.md.
    Output: one or more PLAN.md files committed to .planning/phases/.
  criticalSystemReminder: >
    CRITICAL: Every locked decision in CONTEXT.md (D-XX) MUST be implemented exactly
    as specified. Every source item (GOAL/REQ/RESEARCH/CONTEXT) MUST appear in a COVERED
    plan. Do not simplify features. Return PHASE SPLIT RECOMMENDED if context budget
    cannot accommodate full coverage.
---
```

### I6 — Add `<audience>` block to encode the executor context

Insert after `<persona>`:

```xml
<audience>
Your output (PLAN.md files) is consumed by Claude executor agents that receive the file
as their entire operating context. Executors have no access to ROADMAP.md, CONTEXT.md,
RESEARCH.md, or any prior planning conversation. Every fact the executor needs must
appear in the PLAN.md itself — either inline or via @file references that will resolve
at execution time. Write for an executor starting cold with only the PLAN.md and the
codebase available.
</audience>
```

---

## Overall Score: 6 / 10

**Justification:**

The agent is structurally sophisticated and operationally mature. It uses XML tags consistently, has explicit named execution steps, provides decision criteria for discovery levels, implements goal-backward methodology, and enforces constraint pairs. These are above-average qualities that reflect production experience.

The score is limited by four systemic deviations from guide best practices:

1. The persona is role-titled but behaviorally thin — it does not constrain decision style or priorities under conflict (W1, W8, W9).
2. Negative-framing dominates constraint specification where positive specifications are required (W2) — roughly half the critical rules and prohibitions are expressed as negatives.
3. No complete few-shot calibration examples show the quality bar for finished PLAN.md content (W3), creating a gap between structural specification and output quality anchoring.
4. The external reference architecture (`@` file dependencies for core logic) means the agent is not self-contained at spawn time for several behavioral areas (W6), which the guide explicitly requires for agent prompts.

These four issues affect reliability on every invocation, not just edge cases, which keeps the score below 7 despite the structural strengths.
