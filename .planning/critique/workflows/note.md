# Critique: note.md

## Summary

The `note.md` workflow is a functionally complete and well-organized inline workflow that covers three subcommands (append, list, promote) with clear step-by-step logic, helpful edge case handling, and a success checklist. Its greatest strengths are its explicit branching logic, its verbatim-capture constraint, and its scoped storage model. However, the prompt falls short of the guide's standards in several key areas: it uses markdown headers and step tags instead of the guide's semantically richer XML vocabulary; it lacks an explicit `<output_format>` block specifying the exact confirmation line format; it uses mostly negative-framing constraints in places where positive equivalents are required; and it has no persona, no audience declaration, and no quality bar defined. Several instructions also appear in more than one location, violating the single-canonical-location rule. Overall it reads as a solid first draft that would benefit from a structural pass and a constraint audit.

---

## Strengths

- **Explicit conditional branching (Section 5, Section 16):** The `parse_subcommand` step uses a clear truth table mapping argument patterns to subcommands. This eliminates model ambiguity at the routing decision and directly implements the guide's conditional instruction pattern.

- **Constraint precision on the append path (Section 14):** The two constraints "Never modify the note text" and "Never ask questions" are stated emphatically, and the verbatim-capture rule is enforced in context. This is consistent with the guide's constraint enforcement approach.

- **Edge case enumeration (Section 14 — Precedents):** The `<edge_cases>` block explicitly resolves eight known ambiguities, including the `list`-as-note-text collision and the `--global` flag position independence. This is the guide's precedent pattern applied well.

- **Success checklist (Section 23):** The `<success_criteria>` block at the end provides a testable acceptance list. This is directionally aligned with the guide's quality bar requirement (Section 1, Action 1).

- **Context placement: task first (Section 8, Action 1):** The `<purpose>` tag leads the file, establishing task intent before process detail. This is correct.

- **Slug collision handling (Section 14):** The `-2`, `-3` suffix rule for duplicate slugs on the same date is an explicit, enumerated rule rather than a vague "handle duplicates" instruction. Specific and testable.

---

## Issues

### Issue 1: No XML structural vocabulary — uses ad hoc tags and markdown (Section 4, Action 2)

**Principle:** Section 4 Action 2 requires prompt sections to be wrapped in semantically named XML tags from the guide's canonical vocabulary. Section 11 notes that each instruction belongs in exactly one location and format.

**What's wrong:** The workflow uses `<purpose>`, `<required_reading>`, `<process>`, `<step name="...">`, `<edge_cases>`, and `<success_criteria>` — none of which appear in the guide's XML tag vocabulary (Section 4). The guide defines `<task>`, `<constraints>`, `<output_format>`, `<context>`, `<examples>`, `<quality_bar>`, and `<audience>` as the canonical top-level tags. Inside `<process>`, markdown bold headers (`**Note storage format.**`) mix with XML step tags, creating ambiguous hierarchy. The guide states XML tags are strictly better than markdown headers for Claude-class models because tag names carry semantic meaning.

**Fix:** Restructure using the canonical vocabulary:
```xml
<task>
  Zero-friction idea capture. One Write call, one confirmation line.
</task>

<context>
  Notes are stored as individual markdown files under...
</context>

<constraints>
  <permitted>...</permitted>
  <exclusions>...</exclusions>
</constraints>

<output_format>
  Confirm with exactly one line: `Noted ({scope}): {note text}`
</output_format>
```
The `<step>` elements inside the process can be retained as sub-structure within a `<task>` block, but should not replace the top-level canonical tags.

---

### Issue 2: Missing audience, quality bar, and explicit intent declaration (Section 1, Actions 1–2)

**Principle:** Section 1 Action 1 requires the prompt to make explicit: (a) what output is being requested, (b) why it matters, and (c) what a correct/high-quality response looks like. Action 2 requires the audience to be encoded explicitly.

**What's wrong:** The `<purpose>` block states what the workflow does but not who uses it, why it matters in context, or what distinguishes a high-quality execution from a mediocre one. There is no `<audience>` tag and no `<quality_bar>` tag. The success criteria checklist partially fills this gap but is placed at the end (low-attention position per Section 8) and uses checkbox format rather than a quality bar declaration.

**Fix:** Add an explicit audience and quality bar after the purpose:
```xml
<audience>
  A developer agent invoked via /gsd-note. Runs inline without subagents.
  The caller expects instant, silent capture — no confirmation dialogs, no follow-up questions.
</audience>

<quality_bar>
  A correct execution: one file written, one confirmation line output, zero questions asked.
  An incorrect execution: any question posed to the user, any modification to the note text,
  any failure to fall back to global scope when .planning/ is absent.
</quality_bar>
```

---

### Issue 3: Negative instruction framing not converted to positive equivalents (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions ("do not", "avoid", "never") to be converted to positive specifications before emitting a prompt.

**What's wrong:** The constraints block contains three negative instructions stated as primary directives:
- "Never modify the note text"
- "Never ask questions"
- "Do NOT create `.planning/` if it doesn't exist"

These violate the conversion rule. The guide provides a mechanical conversion table: "Do not X" → "Do Y instead."

**Fix:** Convert mechanically:
- "Never modify the note text" → "Capture the note text verbatim, including typos and punctuation."
- "Never ask questions" → "Write the file and emit one confirmation line. Proceed immediately."
- "Do NOT create `.planning/` if it doesn't exist" → "When `.planning/` is absent, write to global scope silently and continue."

---

### Issue 4: Output format is implicit and under-specified (Section 7; Section 22, Pattern 3)

**Principle:** Section 22 Pattern 3 states the required output structure must be specified completely and upfront. Section 7 Action 1 recommends splitting reasoning from formatting. The guide's machine-parsed output pattern (Section 7) requires exact format specification with literal string requirements.

**What's wrong:** The confirmation line format (`Noted ({scope}): {note text}`) is buried inside the `append` step prose, not surfaced in a dedicated `<output_format>` block. The `promote` confirmation format (`Promoted note {N} to todo {id}: {note text}`) is similarly embedded in step 10. Neither format is declared at the top level before the process begins. The `list` display format is better — it uses a fenced code block example — but it too lacks an enclosing `<output_format>` tag.

**Fix:** Add a top-level `<output_format>` block enumerating all three confirmation formats before the process steps begin:
```xml
<output_format>
  Each subcommand produces exactly one output line:

  append:  Noted (project): {verbatim note text}
           Noted (global): {verbatim note text}

  promote: Promoted note {N} to todo {id}: {verbatim note text}

  list:    [Multi-line display — see list step for template]

  No other prose, preamble, or explanation is emitted.
</output_format>
```

---

### Issue 5: The TEXT_MODE conditional in `<purpose>` belongs in `<constraints>` or a `<system_note>` (Section 8, Action 3; Section 11, Action 1)

**Principle:** Section 8 Action 3 assigns background/supplementary context to the middle position. Section 11 Action 1 requires persistent, cross-cutting instructions to be separated from task-specific ones. Section 8's `<system_note>` tag is designed for out-of-band meta-instructions.

**What's wrong:** The TEXT_MODE runtime adaptation rule is embedded in the `<purpose>` tag — the highest-attention position — alongside the primary task description. It is a runtime context modifier, not part of the core task definition. Mixing it with purpose degrades the signal of both.

**Fix:** Extract to a `<system_note>` block placed after the `<task>` and before the process steps:
```xml
<system_note>
TEXT_MODE: Set TEXT_MODE=true if --text appears in $ARGUMENTS or text_mode from init JSON
is true. When active, replace every AskUserQuestion call with a plain-text numbered list.
This enables compatibility with non-Claude runtimes.
</system_note>
```

---

### Issue 6: Duplicate instructions across sections — violates single-location rule (Section 11, Action 3)

**Principle:** Section 11 Action 3 states each instruction must appear in exactly one location. Repeated instructions consume context and add noise.

**What's wrong:** The scope-determination logic (project vs. global) is described in the `storage_format` step and then partially repeated in the `append` step ("1. Determine scope (project or global) per storage format above") and the `promote` step ("4. Requires `.planning/` directory..."). The `--global` flag stripping rule appears in `storage_format` and is partially restated in `edge_cases` item 6. The note file frontmatter format appears in `storage_format` and is referenced again in `list` step 3.

**Fix:** Consolidate scope determination into a single `<context>` block that all steps reference. Use a single sentence in each step: "Apply scope rules from the context block." Remove duplicate frontmatter format from all steps except `storage_format`.

---

## Quick-Reference Checklist Score

Scored against Section 23. Items are scored against the workflow as-is — not what it could be.

**Task Specification**
- [ ] FAIL — Intent, audience, and quality bar are all explicit in the prompt. Audience and quality bar are absent.
- [ ] PASS — No conflicting constraints identified (verbatim capture and instant output are compatible).

**Chain of Thought**
- [ ] N/A — No reasoning is required; this is a deterministic routing task. CoT correctly omitted.
- [ ] N/A — CoT trigger not applicable.
- [ ] N/A — Reasoning before answer not applicable.
- [ ] N/A — CoT traces not applicable.

**Few-Shot Examples**
- [ ] FAIL — No few-shot examples present. The list display format uses a code block example, but no input→output examples are provided for the append or promote paths. Given the slug generation rule (first ~4 meaningful words, strip articles/prepositions) a calibrating example is warranted per Section 22 Pattern 2.
- [ ] N/A — Count limit not applicable (no examples).
- [ ] N/A — Ordering not applicable.
- [ ] N/A — Diversity not applicable.
- [ ] N/A — Format consistency not applicable.
- [ ] N/A — Order fixed across eval runs not applicable.

**Formatting**
- [ ] PASS — Instruction is complete and clear (functionally, the workflow is fully specified).
- [ ] FAIL — Prompt sections are not separated by semantically named XML tags from the canonical vocabulary (Section 4).
- [ ] FAIL — No evidence of 3 format variants tested on the target model.

**Instruction Framing**
- [ ] FAIL — Three negative instructions ("Never modify", "Never ask", "Do NOT create") have not been converted to positive equivalents.
- [ ] N/A — No multi-criteria priority ordering needed for this workflow.
- [ ] N/A — Tie-breaking not applicable (routing table is deterministic).

**Persona**
- [ ] N/A — This is a deterministic routing workflow, not a stylistic or open-ended task. Persona correctly omitted per Section 6 Action 1.

**Output Format**
- [ ] N/A — No structured output (JSON/XML) generated; free-form single-line confirmations are used.
- [ ] N/A — Single-call JSON not applicable.
- [ ] N/A — Constrained decoding not applicable.
- [ ] FAIL — Machine-parsed output (the confirmation line) lacks a dedicated `<output_format>` block with exact literal string specification per Section 7.

**Context Placement**
- [ ] PASS — Task instruction (`<purpose>`) leads the prompt.
- [ ] N/A — No primary document input.
- [ ] FAIL — The TEXT_MODE runtime adaptation rule is in the high-attention `<purpose>` position rather than the middle/system-note position.
- [ ] PASS — No irrelevant context present.
- [ ] N/A — No time-sensitive injected context.

**Self-Consistency**
- [ ] N/A — Task has no single verifiable correct answer requiring sampling. Correctly omitted.
- [ ] N/A — Not applicable.

**Prompt Length**
- [ ] FAIL — Duplicate instructions across sections (scope logic, --global rule, frontmatter format) add length without adding clarity. Not yet compressed.
- [ ] N/A — Long-context compression not applicable (prompt is moderate length).
- [ ] N/A — RAG not applicable.

**System/User Split**
- [ ] N/A — This is a workflow file, not a live system/user prompt pair.
- [ ] N/A — Not applicable.
- [ ] FAIL — The --global flag rule, scope determination logic, and frontmatter format appear in more than one location.
- [ ] N/A — No safety-critical external validation required.

**Agent/Subagent**
- [ ] PASS — The workflow is explicitly inline (no Task, no AskUserQuestion, no Bash per the purpose line). Self-contained.
- [ ] N/A — No file paths in agent output.
- [ ] N/A — No parallel agents.
- [ ] N/A — No adversarial probes required.

**Structural Architecture**
- [ ] PASS — This workflow has a single responsibility (note capture).
- [ ] N/A — No template variables used (this is a runtime workflow, not a composed module).
- [ ] N/A — Not applicable.

**Constraint Enforcement**
- [ ] FAIL — Restrictions are not paired with equally concrete permissions. The "Never ask questions" constraint has no paired "Do proceed by writing and confirming" positive.
- [ ] PASS — Edge cases are enumerated specifically (8 items), not described qualitatively.
- [ ] PASS — Known edge cases have precedent-style rulings (edge_cases block).
- [ ] N/A — No confidence thresholds required.

**Decision Frameworks**
- [ ] PASS — The subcommand routing uses an explicit truth table (equivalent to a decision tree).
- [ ] N/A — No complex approach gating required.
- [ ] N/A — Reversibility framework not applicable.

**Multi-Phase Workflows**
- [ ] PASS — Three subcommands are organized as named steps.
- [ ] PASS — Mandatory steps are present and specific.
- [ ] PASS — Branching paths (append/list/promote) are handled explicitly.

**Memory and Continuity**
- [ ] N/A — This workflow writes files but does not use agent memory templates.
- [ ] N/A — Not applicable.
- [ ] N/A — Not applicable.

**Modularity**
- [ ] PASS — Single responsibility: note capture and management only.
- [ ] FAIL — No explicit `<scope>` block with inclusions and exclusions. The exclusion boundary (what this workflow does NOT do) is not stated.

**Safety and Trust**
- [ ] N/A — No system boundary validation required.
- [ ] N/A — No dual-use capabilities.
- [ ] N/A — No authorization scoping required.

**Tone and Style**
- [ ] N/A — No numeric size constraints needed for the output lines (they are template-formatted, not length-bounded).
- [ ] PASS — Step instructions use imperative present tense ("Determine scope", "Ensure the notes directory exists", "Generate slug").
- [ ] N/A — No working notes in user-facing output.

**Optimization**
- [ ] FAIL — Prompt is not flagged as a draft for automated optimization.
- [ ] N/A — Single-prompt workflow; OPRO would be the correct optimizer if pursued.
- [ ] FAIL — No held-out test set mentioned.

---

## Recommendations

**Priority 1 — Restructure top-level sections using canonical XML vocabulary (Section 4, Action 2)**
Replace `<purpose>`, `<process>`, `<edge_cases>`, and `<success_criteria>` with `<task>`, `<context>`, `<constraints>`, and `<output_format>`. This is the highest-leverage change: it brings the file into alignment with the guide's structural standard, makes it composable with other modules, and improves model attention routing by using semantically meaningful tag names. Extract the TEXT_MODE block into a `<system_note>` tag.

**Priority 2 — Add an explicit `<output_format>` block before the process steps (Section 7; Section 22, Pattern 3)**
Declare all three confirmation line formats (append, list, promote) in a dedicated top-level block before any step logic. This ensures the model knows the required output shape before reading how to produce it — output format specification is part of the task definition, not an implementation detail to discover mid-step.

**Priority 3 — Convert all negative instructions to positive equivalents (Section 5, Action 1)**
Replace "Never modify the note text", "Never ask questions", and "Do NOT create .planning/" with their positive counterparts (see Issue 3 fix above). This is a mechanical change that removes ambiguity about what the model should do in the restricted cases.

**Priority 4 — Add audience and quality bar declarations (Section 1, Actions 1–2)**
Add an `<audience>` tag describing the invocation context (inline agent, no subagents, developer-facing) and a `<quality_bar>` tag defining what a correct execution looks like in positive, testable terms. Move the success criteria checklist into or adjacent to the quality bar, in the high-attention leading position.

**Priority 5 — Eliminate duplicate instructions and consolidate scope logic (Section 11, Action 3)**
Audit scope-determination logic, --global flag stripping, and frontmatter format across all steps. Consolidate each into exactly one canonical location. All other steps reference the canonical location by name rather than restating the rule. This reduces prompt length, reduces noise, and prevents the rules from diverging in future edits.
