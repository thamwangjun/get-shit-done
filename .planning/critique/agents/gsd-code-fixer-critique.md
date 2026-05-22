# Critique: gsd-code-fixer.md

**Agent:** `gsd-code-fixer.md`

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §10 Prompt Length and Compression
- §11 System vs. User Prompt Allocation
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §21 Tone and Style Rules
- §22 Production Patterns (§22.1, §22.2, §22.3, §22.5, §22.9)
- §23 Quick-Reference Checklist

---

## Strengths

### §16 Multi-Phase Workflows — Explicit phase structure with named XML steps
The agent uses `<step name="...">` tags to divide execution into four clearly bounded phases (`load_context`, `parse_findings`, `apply_fixes`, `write_fix_report`). This matches the guide's pattern of creating cognitive boundaries so the model completes one phase fully before beginning the next.

### §14 Constraint Enforcement — Hard exclusion-style critical rules
The `<critical_rules>` section enumerates a concrete permission/exclusion list with 12 distinct, imperative entries. This closely follows the guide's hard-exclusion list pattern (§14) and the explicit permission-pair principle: most entries are positive ("DO use Edit tool") with a corresponding negative ("DO NOT use Write tool for rollback").

### §14 / §22.9 — Reversibility-scoped action model
The `<rollback_strategy>` models the guide's reversibility framework precisely: rollback uses `git checkout -- {file}` (reversible, local, no confirmation needed) while commits are made only after verification passes. The per-finding commit atomicity aligns with the guide's blast-radius minimization principle.

### §16 — Required vs. optional steps distinguished
The `<verification_strategy>` distinguishes Tier 1 (ALWAYS REQUIRED), Tier 2 (PREFERRED), and Tier 3 (FALLBACK). This maps directly to the guide's `<required_steps universal="true">` vs. `<type_specific_strategy>` distinction.

### §4 — Semantically named XML tags
The agent wraps every major logical section in named XML tags: `<role>`, `<project_context>`, `<fix_strategy>`, `<rollback_strategy>`, `<verification_strategy>`, `<finding_parser>`, `<execution_flow>`, `<critical_rules>`, `<partial_success>`, `<success_criteria>`. This satisfies §4's directive to separate prompt sections with semantically named XML tags.

### §22.3 — Output format specified completely
The `<write_fix_report>` step provides a complete, templated output format with YAML frontmatter schema, status-value enumeration, and a full markdown body scaffold including field names, ordering, and placeholder syntax. This matches §22.3's requirement that output structure be fully specified before the model begins the task.

### §17 — Self-contained agent prompt
The agent documents its spawn context, config parsing, required-reading protocol, and all operational rules in a single file. It does not rely on inherited context from a parent agent, satisfying §17's self-contained agent requirement.

---

## Weaknesses

### §6 Persona Assignment — Generic role framing; no reframe pattern applied
**Guide reference:** §6 Action 2, §6 Role-domain mapping table, §6 Strengths listing.

The `<role>` block reads:
> "You are a GSD code fixer. You apply fixes to issues found by the gsd-code-reviewer agent."

This is a generic identity — the guide classifies this form as ineffective and states that "Generic expert framing produces no measurable accuracy gain." The guide's role-domain table maps verification/fixing tasks to specific, adversarial-leaning personas. There is no strengths enumeration and no reframe pattern. The persona does not constrain register, voice, or behavioral bias in any way. The tag used is `<role>` rather than `<persona>`, breaking the shared vocabulary (§4 XML tag vocabulary).

### §1 Task Specification — Audience and quality bar absent
**Guide reference:** §1 Action 2, §1 Action 3, §1 template (`<task>`, `<audience>`, `<quality_bar>`).

The prompt contains no `<audience>` tag and no `<quality_bar>` tag. The guide requires explicit encoding of who will consume the output (here: the orchestrating workflow agent) and what makes a high-quality response. There is also no constraint-conflict audit (`<constraint_check>`) despite the agent imposing multiple conflicting-pressure constraints (e.g., "apply intelligent fixes" vs. "skip if context differs" — the boundary between them is undefined and left to model judgment).

### §5 Instruction Framing — Negative instructions not converted; no priority ordering
**Guide reference:** §5 Action 1, §5 Priority ordering.

The `<critical_rules>` section contains multiple negated primary directives:
- `"DO NOT modify files unrelated to the finding"`
- `"DO NOT create new files unless..."`
- `"DO NOT run the full test suite between fixes"`
- `"DO NOT leave uncommitted changes"`

The guide's conversion table requires these be rewritten as positive specifications of desired behavior. The current form is valid as supplementary safety emphasis, but the guide explicitly restricts negated forms to one context (the reframe pattern in §6) and mandates conversion otherwise.

Additionally, when multiple criteria compete (e.g., "apply intelligent fix" vs. "skip if context differs"), no explicit priority ordering is given. The guide requires `<priority_order>` with explicit ranking when multiple signals conflict.

### §7 Output Format Handling — No reasoning-first output structure for REVIEW-FIX.md
**Guide reference:** §7 Action 2, §22.3 Production Pattern 3.

The `<write_fix_report>` step specifies the output schema but places summary counters before per-finding detail, and there is no structured reasoning field in the per-finding output. For a task involving judgment calls (skip vs. fix, adapt vs. reject), the guide requires reasoning fields to precede conclusion fields. The per-finding result schema:
```javascript
{
  finding_id: "CR-01",
  status: "fixed" | "skipped",
  files_modified: [...],
  commit_hash: "...",
  skip_reason: "..."
}
```
has no `reasoning` or `assessment` field preceding `status` — the model's decision rationale is lost.

### §3 Few-Shot Examples — No few-shot examples for ambiguous judgment calls
**Guide reference:** §3, §22.2 Production Pattern 2.

The agent requires non-trivial judgment: when to adapt a fix vs. skip, how to interpret prose-only Fix sections, how to scope multi-file findings. The guide requires every abstract qualitative instruction to be paired with at least one concrete example. Despite `<finding_parser>` describing three Fix content variants (inline code, multi-file references, prose-only), there are no `<examples>` blocks showing input-output pairs for the parsing or adaptation decisions. The absence means the model must rely entirely on its priors for ambiguous cases.

### §11 System vs. User Prompt Allocation — YAML frontmatter incomplete
**Guide reference:** §11 YAML frontmatter as agent configuration.

The frontmatter contains only `name`, `description`, `tools`, and `color`. The guide specifies a richer schema:
```yaml
agentMetadata:
  agentType: '...'
  model: '...'
  permissionMode: '...'
  disallowedTools: [...]
  whenToUse: '...'
  criticalSystemReminder: '...'
```
There is no `agentType`, no `model` assignment, no `permissionMode`, no `whenToUse` trigger description, and no `criticalSystemReminder`. The commented-out `hooks` key suggests awareness of this pattern but no implementation. The guide is explicit that these machine-readable fields encode identity, permissions, and trigger conditions in a single auditable location.

### §22.9 / §14 — Tool permissions not scope-narrowed
**Guide reference:** §22 Pattern 9.

The frontmatter declares `tools: Read, Edit, Write, Bash, Grep, Glob` — full whole-tool grants with no prefix scoping. The guide requires the narrowest patterns that satisfy the task:
```yaml
allowed-tools:
  - Bash(git checkout:*)
  - Bash(git rev-parse:*)
  - Bash(node -c:*)
  - Bash(npx tsc:*)
  - Read
  - Edit
  - Glob
  - Grep
```
Whole-tool `Bash` access with no prefix leaves the permission boundary undefined and violates the blast-radius minimization principle.

### §8 Context Placement — Task instruction not at the very start
**Guide reference:** §8 Action 1.

The guide requires the task instruction to lead the prompt for maximum attention weighting. The first section is `<role>` — a brief identity statement — followed by `<project_context>` (background procedure) before the agent ever states what output is being requested or why. The `<execution_flow>` (the actual task) appears midway through the document. The guide's prescribed order is: task instruction first, background context in the middle, primary input last.

---

## Concrete Improvements

### 1. Rewrite `<role>` as `<persona>` with reframe pattern and strengths
Replace the generic identity with a domain-specific persona that uses the reframe pattern and enumerates concrete strengths:

```xml
<persona>
You are a surgical code fixer. Your job is not to apply review suggestions mechanically —
it is to read the actual source file, understand the current code state, and apply the
smallest correct change that resolves the finding without breaking surrounding logic.

Your strengths:
- Adapting fix suggestions to code that has changed since the review was written
- Detecting when a fix suggestion no longer applies and skipping cleanly rather than forcing
- Applying targeted edits (Edit tool) rather than full-file rewrites
- Committing each fix atomically with a traceable conventional commit message
</persona>
```

### 2. Add `<audience>` and `<quality_bar>` tags

```xml
<audience>
You are spawned by the gsd-code-review-fix orchestrator workflow. Your output (REVIEW-FIX.md
and per-finding git commits) is consumed by the orchestrator to determine whether to
proceed to the verifier phase. The orchestrator reads the YAML frontmatter `status` field
and the commit log — it does not read prose summaries.
</audience>

<quality_bar>
A high-quality run: (1) attempts every in-scope finding, (2) commits only verified fixes,
(3) rolls back every failed fix before moving on, (4) produces a REVIEW-FIX.md whose
`fixed` + `skipped` counts equal `findings_in_scope`, and (5) leaves no uncommitted
changes in the working tree.
</quality_bar>
```

### 3. Convert negative critical rules to positive equivalents

Current (guide-violating):
> "DO NOT modify files unrelated to the finding"

Rewrite:
> "Scope each fix to the exact files referenced in the finding. Read and modify only those files."

Current:
> "DO NOT create new files unless the fix explicitly requires it"

Rewrite:
> "Create new files only when the REVIEW.md Fix section explicitly requires it (e.g., a missing import module). Document any new file creation in REVIEW-FIX.md."

### 4. Add `reasoning` field to per-finding result schema and REVIEW-FIX.md output

In `<apply_fixes>` step g, extend the result schema:
```javascript
{
  finding_id: "CR-01",
  assessment: "Fix suggestion matches current code at auth.ts:42; adapted condition check from === to !== per current logic",
  status: "fixed" | "skipped",
  files_modified: ["path/to/file1"],
  commit_hash: "abc1234",
  skip_reason: null
}
```

In REVIEW-FIX.md per-finding body, add an **Assessment:** field before **Applied fix:** so the model's adaptation reasoning is surfaced and auditable.

### 5. Add few-shot examples for the three Fix content variant cases

```xml
<examples>
  <example>
    <input>Fix section: "Add null check before accessing user.profile.avatar"</input>
    <output>Prose-only fix. Read the file at the cited line. Locate the property access chain.
Insert: `if (!user.profile) return;` on the line before the access. Apply with Edit tool.</output>
    <commentary>Prose-only fixes require interpreting intent. Map the description to the
    narrowest syntactic change that satisfies it.</commentary>
  </example>

  <example>
    <input>Fix section references `src/api/auth.ts` in File: line and `src/types/user.ts`
    in Fix prose.</input>
    <output>Multi-file finding. Collect both paths into `files` array. Apply edits to each.
Commit both files in a single atomic commit: `fix(02): CR-01 ... src/api/auth.ts src/types/user.ts`</output>
    <commentary>Multi-file findings must be committed atomically so the codebase is never
    left in a half-fixed state.</commentary>
  </example>

  <example>
    <input>Fix section contains a code fence. Inside the fence, a line reads `### Example`.
    </input>
    <output>The `### Example` inside the fence is NOT a finding boundary. Track fence
    open/close state. Continue scanning for the real next `### ` heading outside the fence.
    </output>
    <commentary>Fence-opaque parsing prevents false splits at markdown headings embedded
    in code examples.</commentary>
  </example>
</examples>
```

### 6. Expand YAML frontmatter to guide-compliant schema

```yaml
---
name: gsd-code-fixer
description: Applies fixes to code review findings from REVIEW.md. Reads source files, applies intelligent fixes, and commits each fix atomically. Spawned by /gsd-code-review-fix.
tools: Read, Edit, Write, Bash, Grep, Glob
color: "#10B981"
agentMetadata:
  agentType: 'CodeFixer'
  model: 'sonnet'
  permissionMode: 'dontAsk'
  allowedTools:
    - Bash(git checkout:*)
    - Bash(git rev-parse:*)
    - Bash(node -c:*)
    - Bash(npx tsc:*)
    - Bash(python -c:*)
    - Bash(node -e:*)
    - Bash(gsd-sdk query commit:*)
    - Read
    - Edit
    - Write
    - Glob
    - Grep
  whenToUse: >
    Spawned automatically by /gsd-code-review-fix to apply fixes to CR-* and WR-* findings
    in a REVIEW.md file. Not for direct invocation.
  criticalSystemReminder: >
    CRITICAL: Commit each fix atomically before moving to the next finding. Never leave
    uncommitted changes. Roll back via `git checkout -- {file}` on any verification failure.
---
```

### 7. Reorder document to place task instruction first (§8)

Move `<execution_flow>` (the task) to immediately follow `<persona>` / `<audience>` / `<quality_bar>`. Place `<project_context>`, `<finding_parser>`, `<verification_strategy>`, and `<rollback_strategy>` in the middle as background reference. Place `<critical_rules>` and `<success_criteria>` last as the input-adjacent closure. This matches the guide's attention-gradient: task first, context middle, constraints last.

---

## Overall Score: 6 / 10

**Justification:** The agent is operationally sophisticated — the rollback protocol, 3-tier verification, atomic-commit pattern, and partial-success semantics are genuinely well-designed and align with several of the guide's highest-leverage patterns (§14, §16, §22.9 in spirit). However, it fails four of the guide's most foundational structural requirements: the persona is generic and mislabeled, the audience and quality bar are absent, the YAML frontmatter is missing its machine-readable `agentMetadata` block, and the document order places background procedures before the task instruction. The absence of few-shot examples for the most ambiguous judgment calls (prose-only Fix sections, multi-file detection, fence-opaque parsing) leaves the model's behavior at those branch points underdetermined. These are not cosmetic issues — §6's persona requirements, §1's task specification requirements, and §8's context placement requirements are all marked as high-impact in the guide. A score of 6 reflects strong operational design anchored to a structurally incomplete prompt scaffold.
