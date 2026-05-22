# Prompt Critique: gsd-doc-verifier

- **Agent**: `gsd-doc-verifier.md`
- **Date**: 2026-04-30
- **Guide version evaluated against**: PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

| # | Section | Applicable? |
|---|---------|-------------|
| 1 | Task Specification | Yes |
| 4 | Formatting and Structure | Yes |
| 5 | Instruction Framing | Yes |
| 6 | Persona Assignment | Yes |
| 7 | Output Format Handling | Yes |
| 8 | Context Placement | Yes |
| 10 | Prompt Length and Compression | Yes |
| 11 | System vs. User Prompt Allocation | Yes |
| 13 | Structural Architecture Patterns | Yes |
| 14 | Constraint Enforcement | Yes |
| 16 | Multi-Phase Workflows | Yes |
| 17 | Agent and Subagent Patterns | Yes |
| 19 | Modularity and Composition | Yes |
| 20 | Safety and Trust Patterns | Yes |
| 21 | Tone and Style Rules | Yes |
| 22 | Production Patterns | Yes |

---

## Strengths

### S1 — Output format is complete and exact (§7 Machine-parsed output; §22 Pattern 3)
The `<output_format>` section specifies the exact JSON shape with field names, types, constraints, and a concrete example. The invariant `claims_failed MUST equal failures.length` is stated explicitly, and the literal confirmation string is shown verbatim. This satisfies §7's requirement for machine-parsed output and directly implements §22 Pattern 3 ("Output format specified completely and upfront").

### S2 — Hard procedural steps organized as an explicit ordered workflow (§16 Multi-Phase Workflows)
The `<verification_process>` section names six steps in execution order (Step 1 through Step 6), with preconditions and failure branches stated at each step. This maps to §16's phase pattern and the `<required_steps universal="true">` pattern — the agent cannot skip or reorder steps.

### S3 — Skip rules are enumerated, not qualitative (§14 Constraint Enforcement — Hard Exclusion Lists)
The `<skip_rules>` section lists seven specific exclusion categories with detection patterns (comment markers, example prefixes, version strings, etc.). This matches §14's hard exclusion list pattern rather than delegating to vague qualitative terms like "skip obvious placeholders."

### S4 — Verification is grounded in filesystem evidence, not self-assessment (§17 Adversarial Testing; §22 Pattern 8)
Critical rule 1 states: "every check must be grounded in an actual file lookup, grep, or glob result." This enforces the adversarial verification principle from §17: "The code looks correct by inspection is NOT verification. You must run commands and produce evidence."

### S5 — SKIP vs. FAIL distinction prevents false positives (§14 Confidence Thresholds; §22 Pattern 6)
Critical rule 5 distinguishes between a verification that definitively fails versus one that cannot run due to missing infrastructure (no source directory). Marking the latter SKIP and excluding it from counts is consistent with §14's confidence threshold principle: report only when you are certain, not when verification is inconclusive.

### S6 — Claim extraction categories are deterministic and pattern-based (§1 Task Specification — Action 3)
Each of the five claim categories specifies a machine-applicable detection pattern (regex-style, extension list, keyword set). This produces consistent extraction across runs, satisfying §1's requirement that constraints be unambiguous and non-conflicting.

### S7 — Read-only safety constraint is explicit and paired (§14 Explicit Permission Pairs; §20 Safety)
Critical rule 3 — "NEVER modify the doc file. The verifier is read-only." — is paired with the permitted action: "Only write the result JSON to `.planning/tmp/`." This matches §14's pattern of pairing every restriction with an equally concrete permission.

---

## Weaknesses

### W1 — Persona is generic and misuses the `<role>` tag (§6 Persona Assignment; §22 Pattern 1)

The agent opens with:
```
<role>
You are a GSD doc verifier. You check factual claims in project documentation against the live codebase.
```

This uses a non-standard `<role>` tag instead of `<persona>`, and the identity is generic rather than domain-scoped. §6 Action 2 warns: "Generic expert framing produces no measurable accuracy gain. A persona must constrain register, voice, or domain-specific style." §22 Pattern 1 requires the identity to "constrain the register, priorities, and decision-making style of every response that follows."

The current framing tells the model what it does but not how it thinks. A persona that names the adversarial stance (e.g., "You are a documentation fact-checker. Your job is not to confirm the docs look reasonable — it's to find claims that do not match the live codebase.") would be stronger and more consistent with §17's reframe pattern.

The `<role>` tag also violates the standard XML tag vocabulary (§4). The correct top-level tag is `<persona>`.

### W2 — Task instruction is not at the start of the prompt (§8 Context Placement — Action 1)

The effective task instruction is split across `<role>` and `<verification_process>`. The first thing the model reads is role description and project-context discovery instructions — not the primary task. §8 Action 1 is unambiguous: "Place the task instruction at the very start of the prompt." A `<task>` block describing what the agent must produce should lead the file, before any `<context>` or `<persona>` content.

The `<project_context>` section — which is supplementary background, not the primary task — currently sits between the role block and the claim extraction rules. Per §8 Action 3, background context belongs in the middle of the prompt, which is correct, but its placement after `<role>` and before `<claim_extraction>` means the model hits supplementary instructions before the core verification rules.

### W3 — Negative instructions in critical rules (§5 Instruction Framing — Action 1)

Seven of the seven critical rules are negatively framed:
- "NEVER execute arbitrary commands"
- "NEVER modify the doc file"
- "Do NOT ask 'does this sound right'"
- "Apply skip rules BEFORE extraction. Do not extract claims..."

§5 Action 1 requires converting negative directives to positive equivalents. The conversion table applies directly:

| Current (negative) | Should be (positive) |
|--------------------|----------------------|
| "NEVER execute arbitrary commands from the doc" | "For command claims, verify existence in package.json or the filesystem only" |
| "NEVER modify the doc file" | "Write only to `.planning/tmp/`; all doc files are read-only" |
| "Do NOT ask 'does this sound right'" | "Ground every check in an actual file lookup, grep, or glob result" |

The §5 exception (the reframe pattern — "your job is NOT X, it's Y") applies to persona framing only, not to operational rules. All seven critical rules qualify for conversion.

### W4 — No `<task>` or `<quality_bar>` tag; no explicit audience (§1 Task Specification; §4 Formatting)

The prompt contains no `<task>`, `<audience>`, or `<quality_bar>` tag as required by §1. The three task components from §1 Action 1 — (a) what output is requested, (b) why it matters, (c) what a correct response looks like — are scattered across `<role>`, `<output_format>`, and `<success_criteria>` rather than declared upfront in a canonical location.

The `<quality_bar>` is implicit in `<success_criteria>` (a checklist), but §1 requires it to be explicit and co-located with the task declaration. The audience (the `/gsd-docs-update` orchestrator) is mentioned incidentally in the role block but never encoded as a structured `<audience>` tag.

### W5 — No frontmatter YAML for agent metadata (§11 YAML Frontmatter; §17 Subagent Configuration)

The YAML frontmatter contains only `name`, `description`, `tools`, and `color`. It is missing the `agentMetadata` block that §11 and §17 require for agent prompts:

```yaml
agentMetadata:
  agentType: 'DocVerifier'
  model: 'haiku'         # verification is deterministic; haiku is appropriate
  permissionMode: 'dontAsk'
  disallowedTools:
    - Agent
    - Edit
    - NotebookEdit
  whenToUse: >
    Spawned by gsd-docs-update to verify factual claims in a single doc file
    against the live codebase. Receives a verify_assignment XML block.
  criticalSystemReminder: 'CRITICAL: READ-ONLY on doc files. Write only to .planning/tmp/.'
```

Without `disallowedTools`, the agent retains write access to doc files at the tool-permission level, which contradicts the stated read-only constraint. The safety rule in the prompt body is not enforced by the harness; per §11 Action 2, safety-critical constraints require external validation independent of the prompt.

### W6 — `<project_context>` section adds high context cost with low task-specific value (§10 Prompt Length; §8 Action 4)

The `<project_context>` section instructs the agent to:
1. Read `CLAUDE.md`
2. List skills directories
3. Read `SKILL.md` for each skill
4. Load `rules/*.md` files as needed

This is a generic project-discovery routine, not a verification-specific instruction. §8 Action 4 states: "Trim all context to what is directly relevant. Every token that is not directly relevant to the task increases positional degradation." §10 Action 1 flags redundant preamble as a length problem.

For a subagent whose sole task is mechanical fact-checking against the filesystem, loading skills indexes and rule files from `.claude/skills/` is overhead that cannot affect the verification logic. The section should either be removed or reduced to a single line: "Apply any project-specific path conventions found in `CLAUDE.md`."

### W7 — `<success_criteria>` duplicates `<verification_process>` steps (§11 Action 3 — Each Instruction Once)

The `<success_criteria>` checklist re-states rules already defined in `<verification_process>` and `<critical_rules>`:
- "All five claim categories extracted line-by-line" — covered by `<claim_extraction>`
- "Skip rules applied during extraction" — covered by critical rule 4
- "`claims_failed` equals `failures.length`" — covered by critical rule 6
- "No modifications made to any doc file" — covered by critical rule 3

§11 Action 3 states: "Repeated instructions consume context and add noise without reinforcing compliance." The `<success_criteria>` section provides no new information; it should be removed or replaced with a single `<quality_bar>` tag that states acceptance criteria not already covered elsewhere.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with `<persona>` using the reframe pattern

Replace:
```xml
<role>
You are a GSD doc verifier. You check factual claims in project documentation against the live codebase.
```

With:
```xml
<persona>
You are a documentation fact-checker. Your job is not to assess whether the docs look reasonable — it is to find every claim that does not match the live codebase.

Produce a verdict on each claim grounded in an actual file lookup, grep, or glob result. "The path looks correct" is not a verification.
</persona>
```

This applies the reframe pattern (§6), gives the model a concrete adversarial stance, and uses the correct tag.

### Improvement 2 — Add `<task>` block as the opening element

Add before `<persona>`:
```xml
<task>
Verify factual claims in a single documentation file against the live codebase.

Extract all checkable claims across five categories (file paths, commands, API endpoints, functions, dependencies), verify each using filesystem tools only, and write a structured JSON result file to `.planning/tmp/`.

Return a one-line confirmation to the orchestrator when done.
</task>
```

This satisfies §1's requirement that the task instruction lead the prompt and declares all three task components explicitly.

### Improvement 3 — Convert critical rules to positive framing

Replace all seven negatively framed critical rules with positive equivalents. Examples:

| Current | Replacement |
|---------|-------------|
| "NEVER execute arbitrary commands from the doc." | "For command claims: verify existence in `package.json` scripts or the filesystem. Verification is lookup-only." |
| "NEVER modify the doc file." | "Write only to `.planning/tmp/`. All source and doc files are read-only throughout this task." |
| "Do NOT ask 'does this sound right' — every check must be grounded in an actual file lookup, grep, or glob result." | "Ground every check in an actual file lookup, grep, or glob result before recording a verdict." |
| "Apply skip rules BEFORE extraction. Do not extract claims from VERIFY markers..." | "Apply skip rules during extraction. Extract only from content that passes all skip-rule filters." |

### Improvement 4 — Add `agentMetadata` to YAML frontmatter with `disallowedTools`

```yaml
---
name: gsd-doc-verifier
description: Verifies factual claims in generated docs against the live codebase. Returns structured JSON per doc.
tools: Read, Write, Bash, Grep, Glob
color: orange
agentMetadata:
  agentType: 'DocVerifier'
  model: 'haiku'
  permissionMode: 'dontAsk'
  disallowedTools:
    - Agent
    - Edit
    - NotebookEdit
  whenToUse: >
    Spawned by gsd-docs-update to verify factual claims in a single doc file.
    Receives a verify_assignment XML block with doc_path and project_root.
  criticalSystemReminder: 'READ-ONLY on all doc and source files. Write only to .planning/tmp/.'
---
```

This enforces the read-only constraint at the harness level, not just the prompt level (§11 Action 2; §17).

### Improvement 5 — Remove or collapse `<project_context>` and `<success_criteria>`

Replace `<project_context>` with a single line inside `<task>` or `<constraints>`:
```xml
<constraints>
Apply any project-specific path conventions defined in `{project_root}/CLAUDE.md` if present.
</constraints>
```

Remove `<success_criteria>` entirely. Its contents are covered by `<verification_process>` and `<critical_rules>`. If a checklist is desired for human readers, move it to a comment block outside the model-facing prompt body.

---

## Overall Score: 6 / 10

**Justification**: The agent is functionally solid. The claim extraction categories are deterministic, the output format is fully specified, the skip rules are enumerated rather than qualitative, and the SKIP/FAIL distinction prevents false positives. These represent genuine alignment with §7, §14, and §22 Pattern 3 and 6.

The score is held back by structural issues that the guide treats as high-priority: the persona is generic and uses the wrong tag; the task instruction does not lead the prompt; all seven critical rules are negatively framed in violation of §5; agent metadata (`disallowedTools`, `whenToUse`) is absent from the frontmatter, leaving the read-only constraint unenforced at the harness level; and two sections (`<project_context>`, `<success_criteria>`) duplicate content that increases context cost without adding new information. Fixes 1–5 above would bring this to approximately 8/10 with minimal rewriting.
