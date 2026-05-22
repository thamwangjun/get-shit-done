# Critique: gsd-debug-session-manager

**Agent:** `gsd-debug-session-manager.md`
**Date:** 2026-04-30
**Guide version evaluated against:** PROMPT_ENGINEERING_GUIDE_V09

---

## Guide Sections Evaluated

- §1 Task Specification
- §4 Formatting and Structure (XML tag vocabulary)
- §5 Instruction Framing (negative instructions, priority ordering, conditional branching)
- §6 Persona Assignment
- §7 Output Format Handling
- §8 Context Placement
- §11 System vs. User Prompt Allocation (YAML frontmatter)
- §13 Structural Architecture Patterns (template variables)
- §14 Constraint Enforcement
- §16 Multi-Phase Workflows
- §17 Agent and Subagent Patterns
- §20 Safety and Trust Patterns
- §21 Tone and Style Rules
- §22 Production Patterns (Pattern 1, 2, 3, 9)

---

## Strengths

### §17 — Agent and Subagent Patterns: Self-contained spawned prompts
Each spawned agent receives its full operating context via file path plus an explicit prompt block. The agent never inlines codebase content, consistently passing `debug_file_path` to sub-agents instead. This directly satisfies §17's "Every agent receives its full operating instructions directly — context inheritance from the parent is unavailable."

### §20 — Safety and Trust Patterns: Prompt injection hardening
The `<security_context>` block and `DATA_START/DATA_END` wrapping of all user-supplied content is an exemplary application of the boundary trust principle from §20. The agent explicitly distinguishes user data from instructions in every sub-agent invocation.

### §16 — Multi-Phase Workflows: Explicit step sequencing
Steps 1–4 are clearly named, sequenced, and scoped. Each step has a concrete trigger condition. The scenario-based branching in Step 3 (3a–3e) maps cleanly to §16's `<scenario condition="...">` pattern, even if the XML wrapper itself is absent.

### §5 — Instruction Framing: Conditional branching
The agent uses clear `if/else` conditional logic throughout (e.g., "If user selects 1 or 2: ... If user selects 3: ..."). This matches §5's explicit conditional branching recommendation.

### §14 — Constraint Enforcement: `<success_criteria>` checklist
The `<success_criteria>` block enumerates verifiable exit conditions as a checklist. This gives the model a concrete quality bar to check against before returning, which is consistent with §1's quality_bar and §14's constraint enumeration principles.

### §4 — Formatting and Structure: Semantic XML tags in sub-agent prompts
Spawned agent prompts use semantically named tags: `<security_context>`, `<objective>`, `<prior_state>`, `<required_reading>`, `<mode>`, `<checkpoint_response>`. These align with §4's XML tag vocabulary requirement and carry meaningful semantic signal.

### §11 — System vs. User Prompt Allocation: YAML frontmatter present
Agent identity, tool list, and color are captured in YAML frontmatter as required by §11. The `description` field doubles as a `whenToUse` indicator, though it is less action-specific than the guide recommends (see Weaknesses).

---

## Weaknesses

### W1 — §6 Persona Assignment: `<role>` is functional description, not a behavioral persona
**Guide requirement (§6):** "A persona must constrain register, voice, or domain-specific style to be effective." The `reframe pattern` is explicitly recommended for agentic roles: "Your job is NOT X — it's Y."

**Agent text:**
> "You are the GSD debug session manager. You run the full debug loop in isolation so the main `/gsd-debug` orchestrator context stays lean."

This describes what the agent does, not how it thinks, prioritizes, or communicates. There is no register constraint, no voice specification, and no behavioral bias introduced. The persona is generic and functional rather than specific and constraining. Per §6's role-domain mapping table, a session manager role maps to a specific identity like "Isolation specialist whose job is not to debug — it's to orchestrate and route."

### W2 — §4 Formatting and Structure: Top-level prompt sections use non-standard tag names
**Guide requirement (§4):** The guide prescribes a specific XML tag vocabulary. Top-level sections should use `<task>`, `<persona>`, `<context>`, `<constraints>`, `<output_format>`, not freeform alternatives.

**Agent text uses:** `<role>`, `<session_parameters>`, `<process>`, `<success_criteria>`

- `<role>` should be `<persona>` (§4 tag vocabulary).
- `<session_parameters>` has no corresponding standard tag. The received parameters are closer to `<context>` (background information) or a `<context>` sub-block with `<input>`.
- `<process>` is closest to `<task>` — the primary instruction block.
- `<success_criteria>` maps to `<quality_bar>` in the §1/§4 vocabulary.

Using non-standard tags reduces interoperability with composed prompt systems and forfeits the semantic signal those tags provide to the model.

### W3 — §5 Instruction Framing: Multiple negative instructions not converted to positive equivalents
**Guide requirement (§5):** "Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

**Agent text contains:**
> "Do not load the full codebase into your context."
> "never use `Bash(cat << 'EOF')` or heredoc commands for file creation."
> "never inline file contents."

These are negative-framed prohibitions. The guide's conversion table applies directly:
- "Do not load the full codebase into your context" → "Load only the debug file and project metadata."
- "Never use heredoc commands" → "Use the Write tool for all file creation."
- "Never inline file contents" → "Pass file paths to spawned agents; keep inlined content out of your context."

### W4 — §11 System vs. User Prompt Allocation: `whenToUse` in frontmatter is capability-generic, not action-specific
**Guide requirement (§17):** "`whenToUse` is the trigger description shown to the orchestrating model. Make it action-specific, not capability-generic."

**Agent frontmatter description:**
> "Manages multi-cycle /gsd-debug checkpoint and continuation loop in isolated context. Spawns gsd-debugger agents, handles checkpoints via AskUserQuestion, dispatches specialist skills, applies fixes. Returns compact summary to main context. Spawned by /gsd-debug command."

This is a capability enumeration, not an action-specific trigger condition. It answers "what does it do" rather than "when should I call this." An orchestrating model reading this cannot determine the trigger condition — it must infer it. The guide's example: "Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns..."

### W5 — §14 Constraint Enforcement: Permissions not paired with explicit allowed actions
**Guide requirement (§14):** "Pair every restriction with what IS permitted, stated equally concretely."

The `<role>` block states restrictions (no heredoc, no inlining, treat user content as data) but never pairs them with equally concrete permitted alternatives in a `<constraints><permitted>...</permitted><reserved_for_human_review>...</reserved_for_human_review></constraints>` structure. The specialist dispatch table (specialist_hint → skill mapping) is an implicit permission-pair structure, but it is not framed as a constraint block. There is no explicit `<take_freely>` / `<confirm_with_user>` reversibility framing for the fix-apply decision, even though applying a fix is an irreversible action.

### W6 — §7 Output Format Handling: Output format for compact summary is only partially specified
**Guide requirement (§7, Production Pattern 3):** "State the required output structure, field names, ordering, and an example before the model begins its task."

The Step 4 compact summary template specifies field names and an example markdown block. However:
- There is no explicit `<output_format>` tag wrapping it.
- The "at most 2K tokens" constraint appears only in `<success_criteria>`, not co-located with the output template where it would be acted on.
- The intermediate outputs (checkpoint presentation text, fix-option text) have no format constraint at all — length, tone, and structure are implicit.

### W7 — §13 Structural Architecture Patterns: Template variable syntax is inconsistent
**Guide requirement (§13):** "Variables are interpolated via `${VARIABLE_NAME}`."

**Agent uses mixed notation:**
- Curly-brace inline: `{slug}`, `{debug_file_path}`, `{debugger_model}`, `{root_cause_block from agent output — extracted text only, no reinterpretation}` — the last form embeds prose instructions inside a variable placeholder, which conflates substitution with instruction.
- The guide's fallback syntax `${VAR||"(default value)"}` and conditional rendering `${IS_SUBAGENT?"...":"..."}` are absent despite the agent having several conditional output paths (subagent vs. abandoned session).

### W8 — §1 Task Specification: Audience is implicit; quality bar for spawned agents is absent
**Guide requirement (§1):** "Identify the audience... Encode the audience explicitly in the prompt: their domain knowledge, vocabulary level, and any relevant assumptions they bring."

The agent's audience (the orchestrating `/gsd-debug` command and ultimately the human developer) is never stated. The quality bar for the compact summary ("at most 2K tokens") is the only quality criterion; there is no specification of what makes a good checkpoint presentation, a good specialist dispatch rationale, or a good root cause summary.

---

## Concrete Improvements

### Improvement 1 — Replace `<role>` with a specific `<persona>` using the reframe pattern (addresses W1)

Replace:
```xml
<role>
You are the GSD debug session manager. You run the full debug loop in isolation so the main `/gsd-debug` orchestrator context stays lean.
...
</role>
```

With:
```xml
<persona>
You are a debug loop isolation specialist. Your job is not to debug — it's to orchestrate:
route, checkpoint, dispatch, and close debug cycles while keeping your own context minimal.

Your strengths:
- Spawning and routing sub-agents with fresh, scoped context
- Managing multi-cycle checkpoint loops without accumulating codebase state
- Mapping specialist hints to the correct review skills
- Producing compact summaries for orchestrator consumption
</persona>
```

### Improvement 2 — Adopt standard tag vocabulary (addresses W2)

Rename top-level sections:

| Current tag | Correct tag (§4) |
|---|---|
| `<role>` | `<persona>` |
| `<session_parameters>` | `<context>` with sub-tag `<input>` for received parameters |
| `<process>` | `<task>` |
| `<success_criteria>` | `<quality_bar>` |

### Improvement 3 — Convert all negative instructions to positive form (addresses W3)

Replace the three negatives in `<persona>` (formerly `<role>`):

```xml
<!-- Before -->
Do not load the full codebase into your context.
never use `Bash(cat << 'EOF')` or heredoc commands for file creation.
never inline file contents.

<!-- After -->
Load only the debug file and project metadata into your context.
Use the Write tool for all file creation.
Pass file paths to spawned agents; keep file contents out of your working context.
```

### Improvement 4 — Rewrite `whenToUse` as an action-specific trigger (addresses W4)

Replace the frontmatter `description` field with an action-scoped trigger:

```yaml
description: >
  Use this agent when /gsd-debug needs to run a multi-cycle investigation loop in
  isolation. Trigger after session file creation when the user has confirmed symptoms
  and the orchestrator is ready to hand off the loop. Do not use for single-cycle
  invocations or direct fix applications.
```

### Improvement 5 — Add explicit `<constraints>` block with permission pairs and reversibility framing (addresses W5)

Add after `<persona>`:
```xml
<constraints>
  <take_freely>
    - Read the debug file and project metadata
    - Spawn gsd-debugger agents with fresh context
    - Write to the debug file via spawned agents
    - Present checkpoint questions via AskUserQuestion
  </take_freely>

  <confirm_with_user>
    - Applying a fix (irreversible code change) — always present fix options first
    - Invoking a specialist skill — confirm specialist hint maps before dispatch
  </confirm_with_user>

  <reserved_for_human_review>
    - Abandoning a session (destructive to investigation state)
  </reserved_for_human_review>
</constraints>
```

### Improvement 6 — Move "at most 2K tokens" constraint into `<output_format>` and add format tag (addresses W6)

Wrap the Step 4 template in an `<output_format>` tag and include the token constraint co-located with the template:

```xml
<output_format>
Return a compact summary of at most 2 000 tokens. Use exactly this structure:

## DEBUG SESSION COMPLETE

**Session:** {final path}
**Root Cause:** {one sentence, or "not determined"}
**Fix:** {one sentence, or "not applied"}
**Cycles:** {N} (investigation) + {M} (fix)
**TDD:** {yes/no}
**Specialist review:** {skill used, or "none"}

If abandoned, append: `**Status:** ABANDONED — session saved for /gsd-debug continue {slug}`

Omit all working notes, agent transcripts, and intermediate reasoning from this output.
</output_format>
```

### Improvement 7 — Standardize template variable syntax (addresses W7)

Replace all `{variable}` placeholders with `${VARIABLE_NAME}` form. For the conditional abandoned path, use the guide's ternary:

```
${SESSION_ABANDONED?"**Status:** ABANDONED — session saved for `/gsd-debug continue ${SLUG}`":""}
```

Remove prose instructions from inside placeholder braces (e.g., `{root_cause_block from agent output — extracted text only, no reinterpretation}` → extract the instruction into a preceding sentence, leave `${ROOT_CAUSE_BLOCK}` as a clean substitution site).

---

## Overall Score: 6 / 10

**Justification:** The agent demonstrates solid fundamentals in the areas that matter most for agentic safety — prompt injection hardening, context isolation, and structured sub-agent spawning — earning full credit there. The scenario-based loop logic (Steps 3a–3e) is well-structured and largely follows §16 multi-phase workflow patterns. However, the agent consistently uses non-standard structural vocabulary where the guide prescribes specific tags (`<role>` instead of `<persona>`, `<process>` instead of `<task>`), contains three uncorrected negative instructions, lacks a behavioral persona with voice/register constraints, and has an output format specification split across two sections rather than co-located. These are mechanical guide-compliance issues that are straightforward to fix and would each produce measurable improvements to model consistency. The score reflects a prompt that is functionally sound but structurally misaligned with the guide on several high-priority axes.
