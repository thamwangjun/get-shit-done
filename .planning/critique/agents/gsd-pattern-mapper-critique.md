# Critique: gsd-pattern-mapper.md

**Agent:** `gsd-pattern-mapper.md`
**Critique date:** 2026-04-30
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09

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
- §17 Agent and Subagent Patterns
- §19 Modularity and Composition
- §21 Tone and Style Rules
- §22 Production Patterns (Patterns 1, 2, 3, 5)

---

## Strengths

### §1 Task Specification — quality bar is explicit
The `<downstream_consumer>` section clearly states who consumes the output (`gsd-planner`), how each section is used, and the quality bar: "Be concrete, not abstract. 'Copy auth pattern from `src/controllers/users.ts` lines 12-25' not 'follow the auth pattern.'" This directly satisfies §1 Action 1's requirement to make explicit what a correct response looks like.

### §4 Formatting and Structure — semantic XML tags used throughout
The prompt uses semantically named XML tags (`<role>`, `<project_context>`, `<upstream_input>`, `<downstream_consumer>`, `<execution_flow>`, `<output_format>`, `<structured_returns>`, `<critical_rules>`, `<success_criteria>`). This aligns with §4 Action 2: "wrap each in a semantically named XML tag."

### §14 Constraint Enforcement — explicit permission pairs present
The read-only constraint is paired with a positive permission statement. From `<role>`: "You MUST NOT modify any source code files. The only file you write is PATTERNS.md." The `<critical_rules>` section reinforces this with specific tool guidance ("All other file access is read-only (Read, Bash, Glob, Grep)"). This satisfies §14's pattern of pairing every restriction with what IS permitted.

### §17 Agent and Subagent Patterns — self-contained and structured return provided
The agent includes a `<structured_returns>` block with a well-defined completion report format. It specifies the output file path using `$PHASE_DIR/$PADDED_PHASE-PATTERNS.md`, enabling the orchestrator to locate the artifact predictably. This partially satisfies §17's requirement for self-contained agent prompts.

### §22 Production Pattern 3 — output format specified completely and upfront
The `<output_format>` section provides a full PATTERNS.md template with header, file classification table, per-file pattern assignment structure, shared patterns section, and no-analog table. The guide's Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task." This is well executed.

### §8 Context Placement — task instruction leads the prompt
The `<role>` tag opens the prompt body with the agent's identity and primary task. Background context (`<project_context>`, `<upstream_input>`) follows in the middle. The primary input (codebase, phase files) is handled last during execution. This respects §8's placement hierarchy.

### §10 Prompt Length and Compression — early stopping rule reduces wasted work
The `<critical_rules>` section contains: "Stop at 3–5 analogs: Once you have enough strong matches, write PATTERNS.md. Broader search produces diminishing returns and wastes tokens." This reflects §10 Action 1's intent and aligns with §3 Action 2's diminishing-returns reasoning for example counts.

---

## Weaknesses

### §6 Persona Assignment — generic role framing, reframe pattern missing
**Guide reference:** §6 Action 2 states "A persona must constrain register, voice, or domain-specific style to be effective." §6 Role-domain mapping table notes that "Exploration" maps to "File search specialist. You excel at thoroughly navigating and exploring codebases."

**Agent quote:** `"You are a GSD pattern mapper."`

This is the entire persona statement. It is a generic label — equivalent to the guide's "ineffective" example `"You are an expert data scientist"`. It does not constrain voice, register, analytical style, or decision bias. The reframe pattern from §6 (`"Your job is NOT X — it's Y"`) is also absent. For an agent whose risk is producing vague, non-actionable pattern maps, the reframe pattern would directly address that failure mode: e.g., "Your job is NOT to describe patterns in prose — it's to extract copy-pasteable code excerpts."

Additionally, §6 Strengths listing shows that explicitly enumerating what the agent is good at biases behavior toward those capabilities. No strengths list exists in this prompt.

### §11 System vs. User Prompt Allocation — YAML frontmatter incomplete
**Guide reference:** §11 YAML frontmatter as agent configuration requires encoding: `agentType`, `model`, `disallowedTools`, `whenToUse`, `criticalSystemReminder`, and `permissionMode`.

**Agent quote (frontmatter):**
```
name: gsd-pattern-mapper
description: Analyzes codebase for existing patterns...
tools: Read, Bash, Glob, Grep, Write
color: magenta
```

The frontmatter is missing:
- `agentMetadata.agentType` — no machine-readable agent type
- `agentMetadata.model` — no model assignment
- `agentMetadata.disallowedTools` — tools are listed as `tools:` (allowed list) but the guide's pattern uses `disallowedTools:` within `agentMetadata`, and more critically, there is no `permissionMode: 'dontAsk'` for a read-mostly agent
- `agentMetadata.whenToUse` — the `description:` field serves this purpose loosely, but §17 states `whenToUse` should be "action-specific, not capability-generic"; the current description is capability-generic
- `agentMetadata.criticalSystemReminder` — the read-only constraint is buried inside `<role>` rather than surfaced as a top-level machine-readable safety reminder

### §5 Instruction Framing — negative instructions not converted
**Guide reference:** §5 Action 1: "Scan for negated instructions ('do not', 'avoid', 'never' as primary directives). Rewrite each as a positive specification of the desired behavior."

**Agent quotes with negated instructions:**
- `"You MUST NOT modify any source code files."` (in `<role>`)
- `"Never re-read a range already in context."` (in `<critical_rules>`)
- `"Never use Bash(cat << 'EOF') or heredoc commands for file creation."` (twice: in `<role>` and `<critical_rules>`)
- `"Do NOT load full AGENTS.md files"` (in `<project_context>`)
- `"All codebase interaction is read-only... Never use Bash(cat << 'EOF')..."` (in `<role>`)

The guide's conversion table handles the first case directly: `"Do not X"` → positive statement of what to do. For example: `"You MUST NOT modify any source code files"` → `"Write only to PATTERNS.md in the phase directory; treat all other files as read-only."` The repeated negative instructions also violate §11 Action 3: "State each instruction exactly once."

**Duplication count:** The heredoc prohibition appears at least twice verbatim, the read-only constraint appears three times across `<role>` and `<critical_rules>`.

### §1 Task Specification — audience not encoded
**Guide reference:** §1 Action 2: "Identify the audience. Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

The agent's downstream consumer (`gsd-planner`) is named but its constraints and consumption model are described only from the output perspective. The prompt does not encode the invoking orchestrator's context, the developer who may debug pattern mapping failures, or the assumption that the planner has no access to the codebase itself. This gap means the agent has no signal about the precision level required by its consumer.

### §3 Few-Shot Example Construction — no examples for the classification judgment
**Guide reference:** §3 Action 1–4, and §22 Production Pattern 2: "Accompany each qualitative instruction with at least one concrete example that demonstrates the target standard."

The agent asks the model to classify files by role and data flow, select analogs by ranking criteria, and assess match quality (`exact`, `role-match`, `partial`). All three are judgment tasks. The output format provides an illustrative table, but there are no worked examples showing:
- How to classify an ambiguous file (e.g., a file that is both a hook and a service)
- How to apply the ranking criteria when two analogs score equally
- What `exact` vs. `role-match` means in practice with a concrete before/after comparison

The PATTERNS.md template uses `[... same structure ...]` as a placeholder rather than a second worked example, leaving the format calibration incomplete.

### §7 Output Format Handling — no reasoning-then-format separation for judgment steps
**Guide reference:** §7 Action 1: "When structured output (JSON, XML) is required, split the task into two steps: first elicit free-form reasoning, then format the conclusion."

The classification and analog selection steps (Steps 2–3) are judgment-heavy. The prompt does not instruct the agent to reason before classifying — it moves directly from input to table output. An `<analysis>` scratchpad step (§2, §7) before producing the classification table would improve accuracy on ambiguous cases.

### §14 Constraint Enforcement — no confidence threshold for analog match quality
**Guide reference:** §14 Confidence thresholds: "For outputs that could have false positives, specify minimum confidence numerically."

The match quality column uses qualitative labels: `exact`, `role-match`, `partial`. The guide (§14, §22 Pattern 6) states that numeric thresholds beat qualitative terms. No threshold is given for when a partial match is good enough to reference vs. when the planner should fall back to RESEARCH.md. The `## No Analog Found` table addresses the zero-match case but leaves the low-match case undefined.

---

## Concrete Improvements

### Improvement 1: Replace the generic persona with a specific, reframe-anchored persona with strengths

Replace the opening `<role>` persona statement with:

```xml
<persona>
You are a codebase pattern specialist. Your job is NOT to describe patterns in general terms — it is to extract copy-pasteable code excerpts that a planner can insert directly into implementation plans.

"The project uses express Router" is NOT a pattern assignment. "Copy lines 12-25 from src/controllers/users.ts — that is the request handler + validation + error handling pattern" IS a pattern assignment.

Your strengths:
- Searching for the closest existing analog to each new file by role and data flow
- Extracting minimal, precise code excerpts (imports, auth guards, core pattern, error handling) from analog files
- Identifying shared cross-cutting patterns that apply to multiple files
- Stopping analog search once 3-5 strong matches are found and writing PATTERNS.md immediately
</persona>
```

This applies §6 Action 2 (specific persona), §6 reframe pattern (displaces the vague-description prior), and §6 Strengths listing.

### Improvement 2: Convert negative instructions to positive equivalents and deduplicate

Replace all negative-framed rules in `<role>` and `<critical_rules>` with positive equivalents, stated once each:

| Current (negative, repeated) | Replacement (positive, once) |
|-------------------------------|------------------------------|
| `"You MUST NOT modify any source code files."` | `"Write only to PATTERNS.md in the phase directory; all other file access is read-only."` |
| `"Never re-read a range already in context."` | `"For each file, make exactly one Read call (or multiple non-overlapping targeted reads for large files). Extract all needed content in that pass."` |
| `"Never use Bash(cat << 'EOF') or heredoc commands"` (×2) | `"Use the Write tool for all file creation."` — stated once in `<critical_rules>` only |
| `"Do NOT load full AGENTS.md files"` | `"Load only SKILL.md and specific rules/*.md files; skip AGENTS.md."` |

Remove duplicate statements from `<role>` once they appear in `<critical_rules>`.

### Improvement 3: Complete the YAML frontmatter per §11/§17

Replace the current frontmatter with:

```yaml
---
name: gsd-pattern-mapper
description: >
  Spawned by /gsd-plan-phase before planning. Given a phase directory, reads
  CONTEXT.md and RESEARCH.md, searches the codebase for the closest existing
  analog per new file, and writes PATTERNS.md with concrete code excerpts for
  the planner to reference.
tools: Read, Bash, Glob, Grep, Write
color: magenta
agentMetadata:
  agentType: PatternMapper
  model: sonnet
  permissionMode: dontAsk
  disallowedTools:
    - Edit
    - NotebookEdit
    - Agent
  whenToUse: >
    Use after /gsd-discuss-phase and /gsd-research-phase complete and before
    /gsd-plan-phase begins planning. Invoke when CONTEXT.md and/or RESEARCH.md
    exist in the phase directory and PATTERNS.md does not yet exist.
  criticalSystemReminder: >
    CRITICAL: READ-ONLY agent. Write only to PATTERNS.md in the phase
    directory. All other file access is read-only. Never edit source files.
---
```

### Improvement 4: Add a worked classification example and calibrate match quality with a threshold rule

Add an `<examples>` block after `<execution_flow>` Step 2 with one complete worked classification case covering an ambiguous file. Also add a numeric threshold to the match quality taxonomy:

```xml
<examples>
  <example>
    <input>File to classify: src/hooks/useAuth.ts — "a React hook that reads auth state from context and redirects unauthenticated users"</input>
    <output>
      Role: hook (not middleware — it runs in React, not in the server request pipeline)
      Data Flow: request-response (reads auth state, returns redirect signal on each render)
      Search query: Glob("**/hooks/**/*.{ts,tsx}") then Grep("useContext.*[Aa]uth", type: "tsx")
      Analog candidate: src/hooks/usePermissions.ts — same role (hook), same data flow (reads context, returns derived state)
      Match quality: exact
    </output>
    <commentary>
      The file name contains "Auth" which could suggest middleware, but the hook/ path and
      React-context access pattern make the role unambiguous. Always prefer role by location
      and access pattern over name alone.
    </commentary>
  </example>
</examples>

<!-- Match quality thresholds — apply to the Match Quality column in PATTERNS.md -->
<match_quality_thresholds>
  exact      — same role AND same data flow; planner should copy the pattern directly
  role-match — same role, different data flow; planner should adapt the structural skeleton
  partial    — different role, same data flow; use only if no role-match exists
  none       — no match found; planner uses RESEARCH.md exclusively

  Report a match only if confidence in the role classification is >= 0.8.
  When in doubt between role-match and partial, report partial — over-claiming
  match quality causes the planner to copy incompatible patterns.
</match_quality_thresholds>
```

This satisfies §3 (worked example with commentary), §22 Pattern 2 (abstract instruction paired with calibrating example), and §14 (numeric confidence threshold replacing qualitative labels).

### Improvement 5: Add an analysis scratchpad step before classification output

In `<execution_flow>` Step 2, before writing the classification table, instruct the agent to reason:

```xml
## Step 2: Classify Files

Before populating the classification table, wrap your reasoning in <analysis> tags:
- For each file, state the evidence for the role assignment (path, name, inferred behavior)
- Note any ambiguous cases where two roles are plausible and state which you chose and why
- List data flow candidates and confirm the primary one

Then produce the classification table from this reasoning.
```

This applies §2 (CoT/scratchpad before output) and §7 Action 1 (reasoning before structured output).

---

## Overall Score: 6 / 10

**Justification:** The agent is operationally solid. Its execution flow is detailed and well-sequenced, the output format is fully specified with a concrete template, the downstream consumer relationship is clearly modeled, and the read-only constraint is practically enforced. These are meaningful strengths that make the agent usable as-is.

The score is held at 6 by four systematic gaps against the guide: (1) the persona is a generic label with no behavioral constraints, missing both the reframe pattern and the strengths list that §6 shows produce measurable improvement; (2) the YAML frontmatter is incomplete, omitting `agentMetadata` fields that §11/§17 treat as required for agentic deployment; (3) multiple negative instructions are repeated verbatim across sections in violation of §5 Action 1 and §11 Action 3; and (4) the classification judgment task — the agent's core reasoning step — has no worked example and no numeric confidence threshold, leaving the model calibrating against its own prior rather than against a demonstrated standard. None of these gaps are blocking, but all are concrete and fixable, and each one addresses a failure mode (vague outputs, misconfigured deployment, instruction drift, imprecise match labeling) that the guide's rules were written to prevent.
