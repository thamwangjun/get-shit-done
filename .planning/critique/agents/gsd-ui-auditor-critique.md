# Critique: gsd-ui-auditor.md

**Agent:** `agents/gsd-ui-auditor.md`
**Date:** 2026-04-30
**Guide version evaluated against:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (1, 2, 3, 5, 6, 9)
- §23 Quick-Reference Checklist

---

## Strengths

### S1 — Multi-phase workflow with explicit named steps (§16)
The `<execution_flow>` block defines 8 clearly numbered steps with named phases (Load Context, Ensure .gitignore, Detect Dev Server, etc.). This matches the guide's phase pattern: "Phases create cognitive boundaries. The model completes one phase fully before beginning the next."

### S2 — Concrete output format with full schema (§7, §22 Pattern 3)
The `<output_format>` block provides a complete markdown template including exact table structure, field names, and placeholder values. Per the guide: "A fully specified format produces consistent, parseable output." The template leaves no structural ambiguity for UI-REVIEW.md.

### S3 — Structured success criteria checklist (§16)
The `<success_criteria>` block gives a checkbox list of exit conditions and named quality indicators ("Evidence-based," "Actionable fixes," "Fair scoring," "Proportional"). This provides a self-verification loop aligned with the guide's required-vs-optional-steps distinction.

### S4 — Semantic XML tag usage throughout (§4)
The agent consistently uses semantically named XML tags: `<role>`, `<project_context>`, `<upstream_input>`, `<gitignore_gate>`, `<audit_pillars>`, `<registry_audit>`, `<output_format>`, `<execution_flow>`, `<structured_returns>`, `<success_criteria>`. This is strictly preferred by the guide over markdown headers.

### S5 — Concrete, runnable audit method commands per pillar (§22 Pattern 2)
Each pillar includes specific `grep` commands with exact flags, file extensions, and expected output. Per the guide's Pattern 2: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard." The grep commands serve as that calibrating example for each pillar.

### S6 — Conditional branching for tool availability and spec existence (§5)
The agent uses explicit if/else branching: "If UI-SPEC.md exists and is approved: audit against it specifically. If no UI-SPEC exists: audit against abstract 6-pillar standards." And for screenshots: "When Playwright-MCP is available: ... When Playwright-MCP is NOT available: fall back to the CLI screenshot approach." This matches the guide's conditional instruction pattern.

### S7 — YAML frontmatter with tool constraints (§11, §17)
Frontmatter declares `tools: Read, Write, Bash, Grep, Glob` limiting tool access. The guide mandates encoding permissions in frontmatter: "This encodes identity, permissions, trigger conditions, dependencies, and safety reminders in a single, machine-readable location."

### S8 — Actionable fix standard stated explicitly (§21)
The quality indicator states: `"Change \`text-primary\` on decorative border to \`text-muted\`" not "fix colors"`. This aligns with the guide's concrete instruction pairing requirement (§22 Pattern 2) and the output efficiency principle.

### S9 — Registry safety audit is scoped and conditional (§14)
The registry audit runs only when specific preconditions are met (`components.json` exists AND UI-SPEC.md lists third-party registries). Suspicious patterns are enumerated explicitly rather than described qualitatively, and scoring impact is specified numerically ("deduct 1 point from Experience Design pillar per flagged block").

---

## Weaknesses

### W1 — Persona is generic and uses the wrong tag (§6)
**Quote from agent:** `<role>You are a GSD UI auditor. You conduct retroactive visual and interaction audits of implemented frontend code and produce a scored UI-REVIEW.md.`

The guide requires the tag `<persona>` (§4 XML vocabulary), not `<role>`. More critically, §6 states: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style to be effective." The current persona does not constrain voice, style, or behavioral posture. Compare the guide's effective example: `"You are a verification specialist. Your job is not to confirm the implementation works — it's to try to break it."` The auditor needs an analogous adversarial or critical posture stated explicitly. "GSD UI auditor" is a job title, not a behavioral constraint.

### W2 — No quality bar or audience declaration (§1)
The guide's Action 1 requires three explicit components: (a) what output is requested, (b) why it matters, (c) what a correct response looks like. The agent specifies (a) and gestures at (c) in `<success_criteria>`, but (b) — why the audit matters and how its output will be consumed — is absent. Action 2 requires explicit audience encoding. The orchestrator (`/gsd-ui-review`) that consumes the structured return is never named as the audience, and the downstream consumer of UI-REVIEW.md (a human developer triaging fixes) is never specified. Without audience context, the scoring register and finding depth are uncalibrated.

### W3 — Negative instructions used as primary directives (§5)
**Quote from agent:** `"Do NOT load full \`AGENTS.md\` files (100KB+ context cost)"`
**Quote from agent:** `"never use \`Bash(cat << 'EOF')\` or heredoc commands for file creation"`

The guide's Action 1 (§5) mandates converting negative instructions to positive equivalents: "Before emitting any prompt, scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior." The agent has multiple negative-primary directives that should be rewritten. For example: "Do NOT load full AGENTS.md files" → "Load only the SKILL.md file from each skill subdirectory." And "never use Bash heredoc" → "Use the Write tool exclusively to create files."

### W4 — Tool permissions are not scoped to minimum patterns (§22 Pattern 9)
**Quote from agent:** `tools: Read, Write, Bash, Grep, Glob`

The guide's Pattern 9 states: "Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access." Granting bare `Bash` is a whole-tool grant with undefined permission boundary. The audit uses only specific Bash operations (grep, find, curl, mkdir, cat for .gitignore, npx playwright, npx shadcn). These should be expressed as scoped patterns: `Bash(grep:*)`, `Bash(find:*)`, `Bash(curl:*)`, `Bash(mkdir:*)`, `Bash(npx playwright:*)`, `Bash(npx shadcn:*)`. Bare `Bash` leaves the blast radius undefined.

### W5 — No `whenToUse` or `agentType` in frontmatter (§11, §17)
**Quote from agent frontmatter (complete):** `name: gsd-ui-auditor`, `description: ...`, `tools: ...`, `color: ...`

The guide's §17 mandates: "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic." The frontmatter lacks `agentMetadata` entirely — no `agentType`, no `whenToUse`, no `permissionMode`, no `disallowedTools`. Per §11: "Encodes identity (`agentType`, `model`), permissions (`disallowedTools`), trigger conditions (`whenToUse`), dependencies (`variables`), and safety reminders (`criticalSystemReminder`) in a single, machine-readable location." The `description` field partially compensates for `whenToUse` but is not machine-readable in the same way for orchestrators.

### W6 — Context placement inverted from guide prescription (§8)
The prompt opens with `<role>` (persona), then `<project_context>`, then `<upstream_input>`, then the operational content blocks, with `<execution_flow>` near the end. The guide's §8 mandates: "Place the task instruction at the very start of the prompt" and "Place the primary document or input at the very end." The actual task instruction (what the agent must do and how to execute it) is buried after persona and context preamble. `<execution_flow>` — the operative instruction — should lead or be in primary position, not appear after 350+ lines of operational reference material. The audit pillar commands, which the model most needs to act on during execution, are in the middle — the lowest-attention zone.

### W7 — No explicit priority ordering when criteria conflict (§5)
The agent specifies two baselines — UI-SPEC.md and abstract 6-pillar standards — but gives no priority rule beyond "if exists, use it." There is no tie-breaking when the spec is partially complete (some pillars specified, others not). There is no guidance on what to do if UI-SPEC.md exists but is not marked "approved." The guide §5 requires: "When multiple considerations apply, list them with explicit priority." The agent leaves this to inference.

### W8 — No few-shot examples for scoring calibration (§3, §22 Pattern 2)
The 1-4 scoring scale has qualitative definitions ("No issues found, exceeds contract" for 4, "Significant issues, contract not met" for 1). The guide's Pattern 2 states: "Qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable." Without a concrete example of a finding that earns 2 vs. 3, two agents auditing the same codebase will score divergently. A single calibrating example per score boundary for even one pillar would substantially reduce variance.

### W9 — `$PADDED_PHASE` template variable used but not declared (§13)
**Quote from agent:** `"$SCREENSHOT_DIR=".planning/ui-reviews/${PADDED_PHASE}-$(date +%Y%m%d-%H%M%S)"` and `"Write to: \`$PHASE_DIR/$PADDED_PHASE-UI-REVIEW.md\`"`

The guide §13 requires variables declared in frontmatter: `variables: [GLOB_TOOL_NAME, GREP_TOOL_NAME]`. `$PADDED_PHASE` and `$PHASE_DIR` appear in shell commands and output paths but are never declared as template variables in the frontmatter. If the orchestrator does not inject them, the bash commands will silently use empty strings, creating files in the wrong location or with malformed names. The fallback syntax `${VAR||"(default value)"}` from §13 should also be applied.

### W10 — Structured return format does not match guide's subagent pattern (§17)
**Quote from agent:** The `<structured_returns>` block emits a markdown code block with a section header `## UI REVIEW COMPLETE`.

The guide §17 specifies: "When you complete the task, respond with a concise report covering what was done and any key findings — the caller will relay this to the user, so it only needs the essentials." The structured return block is markdown-heavy and duplicates the full pillar table already in UI-REVIEW.md. A subagent return should be terse. The current format contains redundant repetition of data the orchestrator can read directly from the written file. Per §11: "Each instruction appears in exactly one location."

---

## Concrete Improvements

### I1 — Replace `<role>` with a behaviorally constraining `<persona>` using the reframe pattern

Current:
```xml
<role>
You are a GSD UI auditor. You conduct retroactive visual and interaction audits...
</role>
```

Rewrite:
```xml
<persona>
You are a UI quality specialist. Your job is not to document what the developer built —
it is to find where the implementation falls short of the design contract or accepted UX standards.

Approach each pillar with the assumption that something is wrong until evidence proves otherwise.
Report only what you can cite with file paths and line numbers. Suppress findings you cannot evidence.
</persona>
```

This uses the guide's reframe pattern (§6), constrains behavioral posture (critical, evidence-first), and adds the specificity the guide requires for effective personas.

### I2 — Add `audience` and `quality_bar` blocks after `<persona>`

```xml
<audience>
Primary consumer: the `/gsd-ui-review` orchestrator, which parses the structured return and routes
the UI-REVIEW.md to the developer. Secondary consumer: the developer triaging the top 3 priority fixes.
Write findings for a developer who can act on a file:line reference immediately.
</audience>

<quality_bar>
A high-quality audit provides: (1) every score backed by at least one concrete file:line citation,
(2) top 3 fixes stated as specific code changes (not categories), (3) scores that distinguish
between a codebase with 2 hardcoded hex colors (score 3) and one with 40 (score 1).
</quality_bar>
```

### I3 — Rewrite negative instructions as positive equivalents

| Current (negative) | Rewrite (positive) |
|---|---|
| "Do NOT load full `AGENTS.md` files (100KB+ context cost)" | "Load only `SKILL.md` from each skill subdirectory. Skip `AGENTS.md` entirely." |
| "never use `Bash(cat << 'EOF')` or heredoc commands for file creation" | "Use the Write tool exclusively to create files." |
| "No data", "No results" flagged without specifying action | "Flag each generic string with its file:line and the specific replacement to propose." |

### I4 — Scope Bash tool permissions in frontmatter

Replace:
```yaml
tools: Read, Write, Bash, Grep, Glob
```

With:
```yaml
tools:
  - Read
  - Write
  - Grep
  - Glob
  - Bash(grep:*)
  - Bash(find:*)
  - Bash(curl:*)
  - Bash(mkdir:*)
  - Bash(cat:*)
  - Bash(test:*)
  - Bash(npx playwright:*)
  - Bash(npx shadcn:*)
```

### I5 — Add `agentMetadata` block to frontmatter

```yaml
agentMetadata:
  agentType: 'UIAuditor'
  permissionMode: 'dontAsk'
  whenToUse: >
    Retroactive 6-pillar visual audit of implemented frontend code. Use after a phase
    execution completes and frontend files have been written. Produces a scored
    UI-REVIEW.md with top 3 priority fixes and file:line evidence per pillar.
  criticalSystemReminder: 'CRITICAL: Do not modify source files. Audit is read-only except for writing UI-REVIEW.md.'
  disallowedTools:
    - Edit
    - NotebookEdit
    - Agent
    - ExitPlanMode
```

### I6 — Declare template variables in frontmatter with fallbacks

Add to frontmatter:
```yaml
variables:
  - PADDED_PHASE
  - PHASE_DIR
```

And in the execution flow, guard against missing values:
```bash
PADDED_PHASE="${PADDED_PHASE:-unknown-phase}"
PHASE_DIR="${PHASE_DIR:-.planning}"
```

### I7 — Add scoring calibration examples for at least one pillar

Add to `<audit_pillars>` under the score definitions:

```xml
<examples>
  <example>
    <input>4 hardcoded hex colors in one component, all matching the design system tokens</input>
    <output>Color: 2/4 — Hardcoded values found; swap to CSS custom properties even if values match</output>
    <commentary>Score 2, not 1, because values are correct — the issue is maintainability not intent.</commentary>
  </example>
  <example>
    <input>All spacing uses Tailwind scale values; two instances of arbitrary [18px] for alignment fix</input>
    <output>Spacing: 3/4 — Two arbitrary values found at Button.tsx:44 and Card.tsx:91; no systematic drift</output>
    <commentary>Score 3, not 2, because exceptions are isolated and the overall system is consistent.</commentary>
  </example>
</examples>
```

### I8 — Add explicit priority ordering for spec-vs-abstract baseline conflict

Add to `<upstream_input>`:

```xml
<priority_order>
  1. UI-SPEC.md approved sections — audit against contract exactly
  2. UI-SPEC.md unapproved or partial sections — treat as guidance, not contract; note deviation without penalizing
  3. No UI-SPEC.md — audit against abstract 6-pillar standards; note absence as context, not a finding
</priority_order>

<tie_breaking>
  When a pillar is partially specified in UI-SPEC.md (some values declared, others absent),
  audit declared values against the contract and audit undeclared values against abstract standards.
  Score the pillar against whichever baseline applies to the majority of findings.
</tie_breaking>
```

---

## Overall Score: 6/10

**Justification:**

The agent is operationally solid. It has well-defined phases, concrete audit commands, a complete output template, conditional branching, and explicit success criteria — all genuine strengths that would produce consistent, actionable output in most runs.

The score is held back by a cluster of structural gaps against guide standards:

- The persona is a job title without behavioral constraint (W1), which is the guide's most-emphasized failure mode for personas.
- Bare `Bash` tool grant and missing `agentMetadata` are hardening gaps that leave the permission boundary undefined and the orchestrator trigger undeclared (W4, W5).
- Template variables `$PADDED_PHASE` and `$PHASE_DIR` are used but undeclared, creating a silent failure path if the orchestrator does not inject them (W9).
- Negative instructions as primary directives (W3) and inverted context placement (W6) are mechanical guide violations that compound over a long prompt.
- The absence of scoring examples (W8) means the 1–4 scale will drift across invocations — the exact problem the guide's calibrating-example pattern is designed to prevent.

The agent earns a 6 rather than a 5 because the operational content (pillar commands, conditional flows, registry audit, output template) is well-designed and substantively complete. The weaknesses are primarily structural and framing issues rather than fundamental logic errors.
