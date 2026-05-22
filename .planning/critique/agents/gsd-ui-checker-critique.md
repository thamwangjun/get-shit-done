# Critique: gsd-ui-checker.md

**Agent:** `gsd-ui-checker.md`

**Date:** 2026-04-30

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure
- §5 Instruction Framing
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns
- §14 Constraint Enforcement
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns

---

## Strengths

### §7 / §22 Pattern 3 — Output format fully specified upfront
The `<verdict_format>` and `<structured_returns>` sections define both the human-readable summary table and the two machine-parseable return blocks (APPROVED / BLOCKED) completely before any task execution. Field names, row structure, and fill-in templates are all provided. This matches the guide's requirement that "format specification is part of the task definition, not an afterthought."

### §14 — Constraint enforcement is granular and concrete
Each dimension has explicit, binary BLOCK / FLAG / PASS criteria. BLOCK conditions are enumerated as discrete triggerable clauses ("Accent reserved-for list is empty or says 'all interactive elements'"), not qualitative summaries. This matches the guide's preference for hard exclusion lists over qualitative descriptions (§14) and Pattern 6's confidence-threshold / scope-filter approach. The guide states: "numeric thresholds beat qualitative terms like 'high confidence'" — the checker achieves the same precision through named string matching rather than numeric thresholds, which is appropriate for this deterministic domain.

### §17 — Agent is explicitly self-contained and read-only scoped
The `<critical_rules>` block establishes read-only identity, one-read-per-file discipline, and no-file-creation constraints. The frontmatter `tools:` list (Read, Bash, Glob, Grep) applies Pattern 9's minimum-required tool scope. The agent documents its orchestration parent (`/gsd-ui-phase`) and its trigger condition, satisfying `whenToUse` intent from §17.

### §6 — Reframe pattern used correctly in the role block
The mindset section uses the pattern "A UI-SPEC can have all sections filled in but still produce design debt if..." — this is the reframe pattern from §6 ("Your job is NOT X — it's Y"), redirecting the checker away from shallow section-presence verification toward semantic quality checking. This is one of the stronger persona framings in the file.

### §5 — Conditional instruction for registry dimension skip
> "Skip this dimension entirely if `workflow.ui_safety_gate` is explicitly set to `false` in `.planning/config.json`. If the key is absent, treat as enabled."

This matches the guide's conditional instruction template from §5 ("If no PR number is provided… If a PR number is provided…") — a concrete runtime branch with a safe default.

### §22 Pattern 2 — Abstract instructions paired with calibrating examples
Each dimension includes an `Example issue:` YAML block showing exactly what a BLOCK or FLAG entry looks like. This directly satisfies Pattern 2: "accompany each qualitative instruction with at least one concrete example that demonstrates the target standard."

### §19 — Scope exclusions are explicit
The `<success_criteria>` quality indicators include a "No false positives" rule: "Only BLOCK on criteria defined in dimensions, not subjective opinion." This is the exclusion-side of the guide's `<scope><exclude>` requirement.

---

## Weaknesses

### §4 / §11 — Mixed tag vocabulary; non-standard root tags throughout
**Severity: High**

The guide specifies a canonical XML tag vocabulary (§4 tag table). The agent uses `<role>`, `<project_context>`, `<upstream_input>`, `<verification_dimensions>`, `<verdict_format>`, `<structured_returns>`, `<critical_rules>`, and `<success_criteria>` — none of which appear in the guide's standard tag set. The guide's top-level structural tags are `<task>`, `<persona>`, `<context>`, `<input>`, `<output_format>`, `<constraints>`, `<examples>`, `<audience>`, and `<quality_bar>`.

The role block in particular mixes persona definition with task definition and constraint definition:

> `<role>You are a GSD UI checker. Verify that UI-SPEC.md contracts are complete... You are read-only — never modify UI-SPEC.md.`

Per §4, these should be split: identity into `<persona>`, task into `<task>`, and read-only constraint into `<constraints>`. The current conflation makes it harder for the model to distinguish behavioral identity from task scope from permissions.

### §6 — Persona is vague and generic; strengths not enumerated
**Severity: Medium**

The entire persona is:
> `"You are a GSD UI checker."`

This is the exact anti-pattern §6 warns against: "Generic expert framing ('you are an expert data scientist') produces no measurable accuracy gain." The guide's `<persona>` pattern requires constraining register, voice, or domain-specific style, and explicitly enumerates strengths:

```xml
<persona>
Your strengths:
- Searching for code, configurations, and patterns across large codebases
- ...
</persona>
```

No strengths are enumerated. A more effective persona would be: "You are a UI contract verification specialist. Your job is not to confirm the UI-SPEC is filled in — it's to find design debt before it enters planning." (See §6's reframe pattern applied at the persona level rather than buried in a sub-bullet of `<role>`.)

### §1 — Audience is implicit; quality bar is absent as a named field
**Severity: Medium**

The guide's §1 Action 2 requires explicitly encoding the audience ("their domain knowledge, vocabulary level, and any relevant assumptions they bring"). The agent's implicit audience — the `/gsd-ui-phase` orchestrating agent — is never named, nor is the developer who eventually reads the structured return. No `<audience>` tag exists.

Similarly, §1 Action 1 requires making explicit "what a correct or high-quality response looks like." The agent has a `<success_criteria>` block that partially fills this role, but it is a checklist of completion states, not a quality bar (the guide distinguishes: quality bar = "what makes a good response — format, length, focus"). The distinction between "task is complete" and "task output is high quality" is lost.

### §8 — Context placement violates instruction-first ordering
**Severity: Medium**

The guide's §8 Action 1 states: "Place the task instruction at the very start of the prompt." The current ordering is:

1. `<role>` (mixed persona + task + constraints)
2. `<project_context>` (background — correctly in middle by function, but not tagged as `<context>`)
3. `<upstream_input>` (input description — should be near end or in `<input>`)
4. `<verification_dimensions>` (the core task logic)
5. `<verdict_format>` / `<structured_returns>` (output format)
6. `<critical_rules>` (constraints)
7. `<success_criteria>` (quality bar)

Per §8 ordering, the output format specification (`<output_format>`) and constraints (`<constraints>`) should come before the detailed dimension logic, and the primary input (`<input>` — the UI-SPEC.md file) should close the prompt. The current structure buries the output format after 200+ lines of dimension criteria.

### §5 — Negative instructions not converted to positive equivalents
**Severity: Low-Medium**

The `<critical_rules>` section relies on negative framing throughout:
> "No re-reads"
> "No source edits"
> "No file creation"

Per §5 Action 1, these should be converted to positive equivalents:
- "No re-reads" → "Read each file exactly once; all dimension checks operate against that in-context copy."
- "No source edits" → "Report findings only; the researcher agent handles all writes to UI-SPEC.md."
- "No file creation" → "Return all output as structured text to the orchestrator."

The guide provides a mechanical conversion table for exactly this transformation.

### §14 — Permission pair is incomplete; no `<permitted>` block
**Severity: Low-Medium**

§14 requires pairing every restriction with an equally concrete statement of what IS permitted. The agent defines what it cannot do (no edits, no file creation) but never explicitly states what it can do with tools. A `<constraints>` block with `<permitted>` / `<reserved_for_human_review>` tags (§14 pattern) would complete this:

```xml
<constraints>
  <permitted>
    - Read any file in the repository using the Read, Glob, and Grep tools
    - Run read-only Bash commands (cat, find, ls, git log)
  </permitted>
  <reserved_for_human_review>
    - Modifying or creating any file
    - Writing to UI-SPEC.md (researcher agent handles all writes)
  </reserved_for_human_review>
</constraints>
```

### §11 — YAML frontmatter is minimal; missing agentMetadata fields
**Severity: Low**

The guide's §11 YAML frontmatter pattern includes `agentType`, `model`, `permissionMode`, `disallowedTools`, `whenToUse`, and `criticalSystemReminder`. The agent's frontmatter only has `name`, `description`, `tools`, and `color`:

```yaml
name: gsd-ui-checker
description: Validates UI-SPEC.md design contracts against 6 quality dimensions...
tools: Read, Bash, Glob, Grep
color: "#22D3EE"
```

Missing: `disallowedTools` (to prevent the agent from accidentally using Edit/Write if the tools list were ever expanded), and `criticalSystemReminder` (which would reinforce the read-only constraint at the metadata level). The `whenToUse` description is present in prose form inside `<role>` but is not surfaced in frontmatter where the orchestrating model reads it.

---

## Concrete Improvements

### Improvement 1: Restructure root tags to guide vocabulary

Replace custom root tags with the guide's canonical set. Proposed restructuring:

```xml
<persona>
You are a UI contract verification specialist. Your job is not to confirm that the UI-SPEC
has all sections filled in — it's to find design debt before it reaches planning.

Your strengths:
- Detecting generic copy that will produce unmaintainable UI ("Submit", "OK", "Cancel")
- Identifying missing empty/error states before implementation begins
- Catching color and typography contracts that are too vague to implement consistently
- Verifying registry safety evidence vs. stated intent
</persona>

<task>
Verify the UI-SPEC.md design contract against 6 quality dimensions. Produce a BLOCK, FLAG,
or PASS verdict for each dimension and an overall APPROVED or BLOCKED status.

Read all files in any <required_reading> block before performing any checks. Run all 6
dimension checks against the single in-context copy — do not reload files.
</task>

<context>
[project_context content — CLAUDE.md + project skills discovery — moves here]
</context>

<input>
[upstream_input content — UI-SPEC.md, CONTEXT.md, RESEARCH.md mapping table — moves here]
</input>

<output_format>
[verdict_format + structured_returns content — moves here]
</output_format>

<constraints>
  <permitted>
    - Read any file using Read, Glob, Grep tools
    - Run read-only Bash commands
  </permitted>
  <reserved_for_human_review>
    - Modifying UI-SPEC.md or any project file
    - Creating files
  </reserved_for_human_review>
  [critical_rules content — moves here as positive equivalents]
</constraints>

<quality_bar>
[success_criteria content — moves here]
</quality_bar>
```

### Improvement 2: Convert negative critical_rules to positive equivalents

Current (negative):
```
- **No re-reads:** Once a file is loaded... do not read it again.
- **No source edits:** This agent is read-only.
- **No file creation:** This agent is read-only — never create files...
```

Improved (positive):
```
- **Single read per file:** Load each file exactly once; run all 6 dimension checks
  against the in-context copy. For files over 2,000 lines, use Grep to locate the
  relevant section first, then Read with offset/limit.
- **Report only:** Deliver all findings as a structured return to the orchestrator.
  The researcher agent owns all writes to UI-SPEC.md.
- **Return text only:** All output is delivered as structured markdown to the caller.
```

### Improvement 3: Add explicit audience and quality bar

After the task definition, add:

```xml
<audience>
Primary consumer: the /gsd-ui-phase orchestrating agent, which parses the structured
return to decide whether to proceed to plan-phase or route back to the researcher.
Secondary consumer: the developer reviewing the BLOCKED / APPROVED report.

The orchestrator reads machine-parseable verdict lines; the developer reads the
human-readable dimension table and fix descriptions.
</audience>

<quality_bar>
A high-quality verification:
- Cites the exact UI-SPEC.md text that triggered each BLOCK or FLAG verdict
- Provides a specific fix ("Replace 'Submit' with 'Create Account'"), not a category fix
- Never BLOCKs on criteria not defined in the 6 dimensions (no subjective opinion)
- Respects CONTEXT.md locked decisions — do not flag choices the user explicitly made
</quality_bar>
```

### Improvement 4: Expand YAML frontmatter with agentMetadata

```yaml
---
name: gsd-ui-checker
description: >
  Validates UI-SPEC.md design contracts against 6 quality dimensions (copywriting, visuals,
  color, typography, spacing, registry safety). Produces BLOCK/FLAG/PASS per dimension and
  an overall APPROVED/BLOCKED verdict. Spawned by /gsd-ui-phase after researcher completes.
tools: Read, Bash, Glob, Grep
color: "#22D3EE"
agentMetadata:
  agentType: UIChecker
  permissionMode: dontAsk
  disallowedTools:
    - Edit
    - Write
    - NotebookEdit
    - Agent
  whenToUse: >
    UI design contract checker. Use after gsd-ui-researcher creates UI-SPEC.md and before
    gsd-plan-phase runs. Also use for re-verification after researcher revises a blocked spec.
  criticalSystemReminder: >
    CRITICAL: This is a READ-ONLY agent. Never modify UI-SPEC.md or create any file.
    Deliver all findings as structured text output only.
---
```

### Improvement 5: Move output format before dimension criteria

Per §8 (context placement) and §22 Pattern 3 (output format upfront), move `<verdict_format>` and `<structured_returns>` to immediately after the `<task>` block, before the 6 dimension definitions. The model should know the output shape before reading 200 lines of dimension criteria. This reduces the chance that dimension-checking logic contaminates the final format production.

---

## Overall Score: 6 / 10

**Justification:** The agent has strong operational content — the 6-dimension framework is precise, the BLOCK/FLAG/PASS criteria are concrete and non-ambiguous, the examples are well-calibrated, and the read-only constraint is clearly enforced in practice. The structured return format is complete and machine-parseable.

The score is held back by structural issues rather than content issues: non-standard tag vocabulary throughout (§4), a one-sentence generic persona with no strengths enumeration (§6), ordering that puts output format specification after 200 lines of criteria (§8), pervasive negative instruction framing (§5), and incomplete frontmatter (§11). These are all mechanical conformance gaps — none require rethinking the agent's domain logic. A rewrite applying the improvements above would lift this to a 8–9 without changing any verification behavior.
