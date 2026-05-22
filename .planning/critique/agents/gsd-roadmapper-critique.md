# Critique: gsd-roadmapper.md

- **Agent**: `gsd-roadmapper.md`
- **Date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

| Section | Relevance |
|---------|-----------|
| §1 Task Specification | High — agent has a well-defined, multi-part task |
| §4 Formatting and Structure | High — agent uses a mix of XML tags and markdown |
| §5 Instruction Framing | High — many instructions throughout the body |
| §6 Persona Assignment | High — `<role>` block is the persona |
| §7 Output Format Handling | High — multiple output formats are specified |
| §8 Context Placement | Medium — instruction ordering and context loading |
| §10 Prompt Length and Compression | Medium — agent is long; redundancy risk |
| §11 System vs. User Prompt Allocation | Medium — frontmatter config vs. body instruction split |
| §13 Structural Architecture Patterns | High — monolithic file vs. modular decomposition |
| §14 Constraint Enforcement | Medium — constraint pairs and exclusions |
| §16 Multi-Phase Workflows | High — the agent is itself a multi-phase workflow |
| §17 Agent and Subagent Patterns | High — spawned by an orchestrator |
| §19 Modularity and Composition | Medium — single file covering many concerns |
| §21 Tone and Style Rules | Medium — instruction framing and wording |
| §22 Production Patterns | High — several production patterns apply directly |

---

## Strengths

### 1. Downstream consumer documentation (§1, §22 Pattern 3)
The `<downstream_consumer>` block explicitly documents who consumes the output and how each artifact field is used. This satisfies §1 Action 2 (identify the audience) and aligns with §22 Pattern 3 (output format specified completely and upfront). The table mapping output fields to how `gsd-plan-phase` uses them is a strong calibration signal.

### 2. Goal-backward phase methodology is well-specified (§16, §1)
The `<goal_backward_phases>` block articulates a clear 4-step process with worked examples. The gap-resolution example is concrete and instructive. This implements a form of §16 multi-phase workflow guidance by decomposing the task into named, ordered steps with verification gates ("Do not proceed until coverage = 100%").

### 3. Anti-patterns section provides negative-to-positive contrast (§5)
The `<anti_patterns>` block pairs "Bad" and "Good" versions side-by-side. This mirrors the good/bad labeled pair pattern from §3, giving the model concrete calibration instead of only prohibitions.

### 4. Structured return formats are complete (§7, §22 Pattern 3)
The `<structured_returns>` block defines three distinct return states (`ROADMAP CREATED`, `ROADMAP REVISED`, `ROADMAP BLOCKED`) with fully specified field layouts including templates with placeholder variables. This is consistent with §22 Pattern 3 and §7 machine-parsed output specification.

### 5. Coverage validation is explicit and binary (§14)
The "Do not proceed until coverage = 100%" rule and the explicit coverage map format are strong constraint enforcement aligned with §14. The orphaned-requirements handling block provides a concrete resolution path rather than leaving behavior undefined.

### 6. Execution flow is sequenced and named (§16)
The `<execution_flow>` block organizes work into 9 explicitly numbered and named steps. This is good multi-phase workflow practice per §16 — named phases create cognitive boundaries.

---

## Weaknesses

### W1. `<role>` tag instead of `<persona>` — non-standard vocabulary (§4, §6)
The agent opens with `<role>` rather than the guide-specified `<persona>` tag. Per §4, the guide mandates a shared XML tag vocabulary for interoperability: `<persona>` is the canonical top-level tag for agent identity. Using `<role>` breaks vocabulary consistency across the prompt system.

> Agent text: `<role>You are a GSD roadmapper...`

Fix: rename `<role>` to `<persona>`.

### W2. Persona is generic and task-description rather than domain-constrained (§6 Action 2)
The persona section reads: "You are a GSD roadmapper. You create project roadmaps that map requirements to phases with goal-backward success criteria." This describes the task, not a specific expert identity with constrained register or voice. Per §6 Action 2, a persona must constrain register, voice, or domain-specific style to be effective. The current framing is closer to a task description than a persona.

> Agent text: `You are a GSD roadmapper. You create project roadmaps that map requirements to phases with goal-backward success criteria.`

No strengths are listed. Per §6, explicitly listing strengths biases behavior toward those capabilities.

### W3. Heavy use of negative instructions without positive reframes (§5 Action 1)
Multiple instructions in `<anti_patterns>` and `<philosophy>` are written as prohibitions without being converted to positive equivalents:

> `NEVER include phases for: Team coordination, stakeholder management, Sprint ceremonies...`
> `Don't impose arbitrary structure`
> `Don't use horizontal layers`
> `Don't skip coverage validation`
> `Don't write vague success criteria`
> `Don't add project management artifacts`
> `Don't duplicate requirements across phases`

Per §5 Action 1, every negated instruction should be rewritten as a positive specification. The exception is the reframe pattern, which requires a paired "your job is not X — it's Y" structure. Most of these are bare prohibitions, not reframes.

### W4. No explicit `<output_format>` tag; output format is buried in a middle section (§4, §7, §8)
The output format specifications live inside `<output_formats>` (non-standard tag name) and `<structured_returns>` sections, interspersed between process-heavy blocks. Per §8, the primary task is at the start, context in the middle, and the primary input the model must act on at the end. Per §4, sections must be separated by semantically named XML tags. `<output_formats>` is not in the standard vocabulary; `<output_format>` is. More critically, output format instruction is scattered — some appears in `<downstream_consumer>`, some in `<output_formats>`, some in `<structured_returns>`. Per §11 Action 3, each instruction should appear in exactly one location.

### W5. No `<constraints>` block with paired permissions (§14)
The agent has no dedicated `<constraints>` block. Tool permissions and behavioral boundaries are scattered across `<role>` (tool restrictions on reading), `<execution_flow>` ("ALWAYS use the Write tool"), and frontmatter (`tools: Read, Write, Bash, Glob, Grep`). Per §14, every restriction should be paired with an equally concrete permission in a unified `<constraints>` block using `<permitted>` and `<reserved_for_human_review>` sub-tags. The current structure makes the permission model hard to audit.

### W6. No CoT trigger despite multi-step reasoning requirement (§2)
The agent performs complex reasoning: categorizing requirements, deriving dependencies, applying granularity calibration, gap-resolving coverage. Per §2, multi-step logic tasks warrant a CoT trigger. No explicit reasoning prompt exists anywhere in the file. The guide's prescribed trigger — "Take a deep breath and work on this problem step-by-step." — or a structured `<reasoning>` before `<answer>` pattern would improve output quality on the dependency analysis and gap resolution steps.

### W7. Priority order is absent when multiple phase-identification signals conflict (§5)
The `<phase_identification>` section describes grouping by category, identifying dependencies, creating delivery boundaries, and applying granularity — but when research suggestions conflict with natural requirement groupings, or when granularity guidance conflicts with coherent delivery boundaries, there is no `<priority_order>` block to resolve the conflict. Per §5, explicit ordering removes ambiguity when signals conflict.

> Related agent text: `Research informs phase identification but requirements drive coverage.` (Step 3 in execution flow)

This is partially addressed for the research vs. requirements conflict, but no priority order exists for the other dimensions (e.g. granularity setting vs. natural delivery boundaries vs. dependency order).

### W8. Monolithic structure — all concerns in one file (§13, §19)
The file is ~690 lines covering persona, philosophy, methodology, output formats, execution flow, constraint documentation, anti-patterns, and success criteria. Per §19 and §13, well-designed prompt systems decompose into small, focused atomic units. The `<philosophy>`, `<goal_backward_phases>`, `<phase_identification>`, `<coverage_validation>`, `<output_formats>`, `<execution_flow>`, `<structured_returns>`, `<anti_patterns>`, and `<success_criteria>` blocks are all independently decomposable. A monolithic design cannot be selectively toggled; changes to one section risk coupling with others.

### W9. `<success_criteria>` block at bottom conflicts with §8 context placement (§8)
The self-completion checklist (`<success_criteria>`) is placed at the very end of the file. Per §8, primary content the model must act on should close the prompt — but this checklist is better understood as an `<output_format>` specification (what "done" looks like) which belongs closer to the task definition. The primary input — the orchestrator-provided context — is not a real template variable; the agent relies on the runtime message, making context placement partially moot, but within the static portion of the prompt the ordering is sub-optimal.

### W10. No few-shot examples for core judgment tasks (§3, §22 Pattern 2)
The phase identification and granularity calibration steps require subjective judgment — what constitutes a "coherent delivery boundary," what a "natural" phase grouping looks like. The guide (§3, §22 Pattern 2) requires that every abstract qualitative instruction be paired with concrete examples. The file includes some inline examples (the Auth phase gap example, the Foundation/Features/Enhancement pattern), but these are documentation-style, not structured `<example>` blocks with `<input>`, `<output>`, and `<commentary>` sub-tags. There are no examples demonstrating how to handle conflicting grouping signals or granularity edge cases.

---

## Concrete Improvements

### Improvement 1: Replace `<role>` with `<persona>` and add strengths listing

```xml
<persona>
You are a requirements-to-roadmap specialist for solo developer projects built with Claude Code.
Your job is not to impose project management structure — it is to derive the minimum coherent
phase structure that delivers 100% of v1 requirements with observable success criteria.

Your strengths:
- Deriving phase boundaries from requirement dependencies rather than templates
- Applying goal-backward thinking to produce user-observable success criteria
- Validating complete requirement coverage and surfacing gaps explicitly
- Calibrating phase granularity to project complexity
</persona>
```

### Improvement 2: Convert negative instructions to positive equivalents in `<philosophy>`

Replace this block:

```
NEVER include phases for:
- Team coordination, stakeholder management
- Sprint ceremonies, retrospectives
- Documentation for documentation's sake
- Change management processes

If it sounds like corporate PM theater, delete it.
```

With:

```xml
<constraints>
  <permitted>
    Phases, goals, requirements, success criteria, dependency ordering, and
    granularity calibration only.
  </permitted>
  <exclusions>
    Phases whose primary content is: team coordination, stakeholder management,
    sprint ceremonies, retrospectives, documentation-for-documentation's-sake,
    change management, time estimates, Gantt charts, resource allocation, or risk matrices.
    If a phase exists only to organize people rather than deliver a user capability — exclude it.
  </exclusions>
</constraints>
```

### Improvement 3: Add `<priority_order>` for conflicting phase identification signals

Insert after the granularity calibration table in `<phase_identification>`:

```xml
<priority_order>
  When phase identification signals conflict, apply this order:
  1. Dependency constraints (a phase that blocks others must come first)
  2. Requirement category natural groupings (AUTH, CONTENT, etc.)
  3. Research phase suggestions (use as input, not mandate)
  4. Granularity calibration (compress or expand only after natural structure is set)
  5. Named phase pattern templates (Foundation/Features/Enhancement) as last resort
</priority_order>

<tie_breaking>
  When a requirement fits equally well in two phases, assign it to the earlier phase
  that could deliver it — earlier delivery is preferable to deferral.
</tie_breaking>
```

### Improvement 4: Add CoT trigger for the dependency analysis step

At the start of `<execution_flow>` Step 4:

```
## Step 4: Identify Phases

Take a deep breath and work on this problem step-by-step.

Apply phase identification methodology:
...
```

Alternatively, add an `<analysis>` tag instruction:

```
Before identifying phases, wrap your dependency analysis in <analysis> tags:
enumerate each requirement category, its dependencies, and which group it
belongs to before committing to phase boundaries.
```

### Improvement 5: Consolidate output format instruction into one `<output_format>` tag

Remove the scattered output specifications from `<downstream_consumer>`, `<output_formats>`, and `<structured_returns>`. Replace with a unified:

```xml
<output_format>
  <!-- ROADMAP.md structure -->
  <!-- STATE.md structure -->
  <!-- Draft presentation format -->
  <!-- Structured return states: ROADMAP CREATED | ROADMAP REVISED | ROADMAP BLOCKED -->
</output_format>
```

This satisfies §11 Action 3 (each instruction in exactly one location) and §7 (output format specified completely and upfront).

### Improvement 6: Add a `<constraints>` block for tool permissions

```xml
<constraints>
  <permitted>
    - Read any file in the project directory
    - Write .planning/ROADMAP.md, .planning/STATE.md, .planning/REQUIREMENTS.md
    - Run read-only Bash commands (ls, cat, grep, find)
    - Use Glob and Grep to locate project skills
  </permitted>
  <reserved_for_human_review>
    - Writing files outside .planning/
    - Modifying REQUIREMENTS.md beyond the traceability section
  </reserved_for_human_review>
  <exclusions>
    Use Write tool for all file creation. Never use Bash heredoc (cat << 'EOF') for file creation.
  </exclusions>
</constraints>
```

### Improvement 7: Add structured few-shot examples for phase identification judgment

```xml
<examples>
  <example>
    <input>
      Requirements: AUTH-01 (user login), AUTH-02 (user registration), CONT-01 (create post),
      CONT-02 (edit post), SOC-01 (follow user). Granularity: Standard.
    </input>
    <output>
      Phase 1: Foundation — AUTH-01, AUTH-02 (users must exist before content or social)
      Phase 2: Core Content — CONT-01, CONT-02 (content creation unblocks social)
      Phase 3: Social — SOC-01 (depends on users and content existing)
    </output>
    <commentary>
      Dependencies drove the ordering: auth before content, content before social.
      Granularity "Standard" would allow combining Content + Social if they were
      truly independent, but the dependency chain prevents it here.
    </commentary>
  </example>
</examples>
```

---

## Overall Score: 6 / 10

**Justification:**

The agent is functionally complete and operationally coherent. Its methodology is well-specified, the downstream consumer documentation is a genuine strength, and the structured return formats are production-ready. However, it diverges from the guide on several high-impact dimensions: the persona is task-description rather than identity-constraining (§6); negative instructions dominate `<anti_patterns>` without positive reframes (§5); output format instruction is fragmented across three sections (§11); there is no explicit `<constraints>` block (§14); no CoT trigger is present despite multi-step logic (§2); and the 690-line monolithic structure cannot be selectively toggled (§13, §19). The score reflects a solid operational foundation held back by structural and framing gaps that are each individually fixable.
