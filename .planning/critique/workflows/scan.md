# Critique: scan.md

## Summary

`scan.md` is a compact, procedurally clear workflow for lightweight codebase scanning. Its step-by-step structure is easy to follow and the focus-to-document mapping table is a practical affordance. However, the prompt relies heavily on markdown prose and code blocks rather than the XML tag vocabulary prescribed throughout the guide, leaving key structural signals implicit. The task intent is partially stated but the audience and quality bar are absent. Instruction framing mixes negative-adjacent conditionals with positive ones inconsistently, and the output format for the spawned subagent is unspecified. The workflow also lacks a frontmatter block defining agent metadata, permitted tools, and model configuration — all of which the guide treats as required for any spawned-agent workflow. These are structural omissions, not cosmetic ones, and they would degrade reliability at the boundaries the guide is most concerned about.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — phase structure present.** The five-step process (parse, check, create, spawn, report) maps cleanly to the phase pattern. Steps are sequenced with clear dependencies.
- **Section 16 — scenario-based branching for existing documents.** The "Overwrite?" prompt in Step 2 handles a branching condition explicitly rather than silently, which matches the scenario-handling principle.
- **Section 19 (Modularity) — single responsibility.** The workflow is tightly scoped to one concern: spawn one mapper agent for one focus area. It does not attempt to do everything `gsd-map-codebase` does.
- **Section 14 (Constraint Enforcement) — explicit exclusion scope.** The `<available_agent_types>` block restricts the subagent to exactly one valid type and explicitly warns against fallback. This is in the spirit of the hard-exclusion and narrow-permission patterns.
- **Section 7 (Output Format) — report template present.** Step 5 provides a concrete output template with named fields. This partially satisfies Section 22 Pattern 3 (output format specified upfront).
- **Section 16 — success criteria checklist.** The `<success_criteria>` block at the end enumerates verifiable completion conditions, which aligns with the criteria-before-choosing pattern from Section 15.

---

## Issues

### Issue 1 — Task specification incomplete: audience and quality bar absent
**Guide reference:** Section 1 Actions 1–2; Section 23 checklist item "Intent, audience, and quality bar are all explicit."

**What's wrong:** The `<purpose>` block states what the workflow does (lightweight codebase assessment, targeted documents) but does not identify who will consume the output or what a high-quality scan result looks like. A developer invoking `/gsd-scan` for the first time has no signal about what constitutes a complete, usable output.

**Concrete fix:** Expand `<purpose>` or add `<audience>` and `<quality_bar>` tags:
```xml
<audience>
Developer working in a GSD-managed project who needs a quick, readable snapshot of one
codebase dimension without running a full 4-area parallel scan.
</audience>

<quality_bar>
Each produced document is self-contained, covers its named focus area completely, and
contains no speculative or invented information. Documents are written for a developer
unfamiliar with this specific codebase.
</quality_bar>
```

---

### Issue 2 — No XML tag structure for prompt sections; markdown prose used throughout
**Guide reference:** Section 4 Action 2; Section 4 XML tag vocabulary; Section 23 checklist item "Prompt sections are separated by semantically named XML tags."

**What's wrong:** The workflow uses a mix of `##` markdown headers, fenced code blocks, and HTML-style tags (`<purpose>`, `<process>`, `<success_criteria>`). Only `<purpose>`, `<available_agent_types>`, `<process>`, and `<success_criteria>` are XML-tagged. The five steps inside `<process>` are markdown headers, not `<phase>` tags. The `<required_reading>` block is an ad-hoc tag not in the guide's vocabulary.

**Concrete fix:** Replace the `<process>` / markdown-header interior with proper `<phase>` tags per Section 16:
```xml
<phase id="1" name="Parse and validate focus">
  Parse the user's input for --focus <area>. Default to tech+arch if not specified.
  Valid values: tech, arch, quality, concerns, tech+arch.
  On invalid input, emit: Unknown focus area: "{input}". Valid options: tech, arch, quality, concerns, tech+arch
  Then exit.
</phase>

<phase id="2" name="Check for existing documents">
  ...
</phase>
```
Replace `<required_reading>` with `<system_note>` (guide vocabulary, Section 8):
```xml
<system_note>
Read all files referenced by the invoking prompt's execution_context before starting.
</system_note>
```

---

### Issue 3 — Subagent prompt is underspecified: no task, context, or output format passed to the agent
**Guide reference:** Section 17 "Self-contained agent prompts"; Section 22 Pattern 3; Section 23 checklist item "Agent prompts are fully self-contained."

**What's wrong:** Step 4 constructs the mapper agent's prompt as a bare string:
```
prompt="Scan this codebase with focus: {focus}. Write results to .planning/codebase/. Produce only: {document_list}"
```
This prompt omits: (a) the codebase root path, (b) what constitutes a complete document for each focus area, (c) the output format expected within each document, and (d) which tools are permitted. The guide requires each spawned agent to receive its full operating instructions directly, since context inheritance from the parent is unavailable.

**Concrete fix:** Expand the agent prompt to be self-contained using the `<task>` / `<unit_task>` / `<output_format>` / `<constraints>` structure from Section 17:
```xml
<task>
  <goal>Produce a targeted codebase assessment document for one focus area.</goal>
  <unit_task>
    Focus: {focus}
    Output path: .planning/codebase/
    Produce only these documents: {document_list}
    Codebase root: {absolute_cwd}
  </unit_task>
  <output_format>
    Each document must be a standalone markdown file. Include only information directly
    observed in the codebase. Do not speculate or invent. Each section must cite the
    source file or directory it describes.
  </output_format>
  <constraints>
    <permitted>Read files, run grep/find/ls/git log. Write only to .planning/codebase/.</permitted>
    <reserved_for_human_review>Creating or modifying any source files.</reserved_for_human_review>
  </constraints>
</task>
```

---

### Issue 4 — No frontmatter block: agent metadata, tool permissions, and model are inline-only
**Guide reference:** Section 11 "YAML frontmatter as agent configuration"; Section 17 "Subagent configuration in frontmatter"; Section 22 Pattern 9; Section 23 checklist item "Agent prompts are fully self-contained."

**What's wrong:** The workflow passes `model="{resolved_model}"` as a runtime argument in Step 4, but there is no frontmatter block defining the agent's identity, disallowed tools, `whenToUse` description, or `criticalSystemReminder`. Without frontmatter, the orchestrating model has no machine-readable description of when to invoke this workflow, and no tool-permission boundary is enforced at the agent level.

**Concrete fix:** Add a frontmatter block at the top of the file:
```markdown
<!--
name: 'Workflow: Scan'
description: Lightweight codebase assessment — spawns one mapper agent for one focus area
variables:
  - resolved_model
agentMetadata:
  agentType: 'scan'
  whenToUse: >
    Use when the developer wants a fast, targeted codebase snapshot for one focus area
    (tech, arch, quality, or concerns) without running a full parallel scan.
  disallowedTools:
    - Edit
    - Write
    - NotebookEdit
  criticalSystemReminder: 'This workflow is READ-ONLY except for writing to .planning/codebase/.'
-->
```

---

### Issue 5 — No tie-breaking rule for the focus-resolution default
**Guide reference:** Section 5 "Tie-breaking instructions"; Section 23 checklist item "Tie-breaking rules match the domain's cost asymmetry."

**What's wrong:** Step 1 defaults to `tech+arch` when no `--focus` is specified, but provides no rationale and no tie-breaking instruction for ambiguous inputs (e.g., `--focus tech arch` or `--focus Tech`). A user passing a near-valid value gets the generic invalid-input error rather than a helpful resolution.

**Concrete fix:** Add a tie-breaking instruction immediately after the validation rule:
```xml
<tie_breaking>
When the focus argument is unrecognized but closely resembles a valid option (e.g., "Tech"
instead of "tech", or "architecture" instead of "arch"), normalize to lowercase and match
to the closest valid option. Inform the user: "Interpreted '--focus {input}' as '{matched}'.
Proceeding." If no close match exists, emit the invalid-input error and exit.
</tie_breaking>
```

---

### Issue 6 — Negative-adjacent instruction in Step 2 bash block without positive pairing
**Guide reference:** Section 5 Action 1 "Convert negative instructions to positive equivalents."

**What's wrong:** Step 2 includes:
```bash
INIT=$(gsd-sdk query init.map-codebase 2>/dev/null || echo "{}")
```
The `2>/dev/null` silently suppresses errors. While this is idiomatic shell, the prose instruction around it does not explain what to do when the SDK query fails vs. when it succeeds — the workflow jumps directly to checking for existing documents. The conditional is implicit and the fallback behavior (`"{}"`) is unexplained.

**Concrete fix:** Add a conditional instruction that makes the branching explicit:
```
If the SDK query returns valid JSON, use it to determine which documents are expected.
If the query fails or returns "{}", proceed using the focus-to-document mapping table directly.
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are not applicable to a workflow orchestration prompt of this type.

| Checklist Item | Score |
|---|---|
| **Task Specification** | |
| Intent, audience, and quality bar are all explicit | FAIL |
| All constraints are compatible — no conflicts | PASS |
| **Chain of Thought** | |
| CoT is included only for math/symbolic/multi-step logic tasks | N/A |
| CoT trigger used correctly | N/A |
| Reasoning elicited before answer | N/A |
| CoT traces treated as heuristic | N/A |
| **Few-Shot Examples** | |
| Examples selected by semantic similarity | N/A |
| 2–5 examples total | N/A |
| Ordered simple → complex | N/A |
| Examples span diverse sub-types | N/A |
| Format consistent across examples | N/A |
| Example order fixed across eval runs | N/A |
| **Formatting** | |
| Instruction complete and clear before formatting applied | PASS |
| Prompt sections separated by semantically named XML tags | FAIL |
| At least 3 format variants tested on target model | N/A |
| **Instruction Framing** | |
| All negative instructions converted to positive equivalents | FAIL |
| Priority order explicit when multiple criteria apply | N/A |
| Tie-breaking rules match domain's cost asymmetry | FAIL |
| **Persona** | |
| Persona included only for open-ended/stylistic tasks | N/A |
| Persona is specific, not generic | N/A |
| Persona descriptor is gender-neutral | N/A |
| **Output Format** | |
| Structured output uses two-step reasoning-then-format | N/A |
| Single-call JSON places reasoning fields before answer fields | N/A |
| Constrained decoding adopted only after free-form proved insufficient | N/A |
| Machine-parsed output uses exact format specification | FAIL |
| **Context Placement** | |
| Task instruction is at the start of the prompt | PASS |
| Primary document or input is at the end | N/A |
| Background context is in the middle | PASS |
| All irrelevant context removed | PASS |
| Time-sensitive injected context labeled as snapshot | N/A |
| **Self-Consistency** | |
| Applied only to tasks with a single correct answer | N/A |
| Inference budget permits 15–20 samples | N/A |
| **Prompt Length** | |
| Redundant instructions and repeated context removed | PASS |
| Long prompts compressed before sending | N/A |
| RAG context is extracted relevant passage only | N/A |
| **System/User Split** | |
| Persistent instructions in system prompt | N/A |
| Task-specific instructions in user prompt | N/A |
| Each instruction appears in exactly one location | PASS |
| Safety-critical constraints have external validation | FAIL |
| **Agent/Subagent** | |
| Agent prompts are fully self-contained | FAIL |
| All file paths in agent output are absolute | FAIL |
| Parallel agents launched in a single message block | N/A (single agent) |
| Adversarial probes specified for verification agents | N/A |
| **Structural Architecture** | |
| Large prompts decomposed into atomic single-responsibility modules | PASS |
| Template variables use ${VARIABLE_NAME} syntax with fallback | FAIL |
| Modules compose at runtime via variable substitution, not copy-paste | PASS |
| **Constraint Enforcement** | |
| Every restriction paired with an equally concrete permission | FAIL |
| Hard exclusion lists enumerated, not qualitative | N/A |
| Known edge cases have precedent-style rulings | FAIL |
| Confidence thresholds are numeric, not qualitative | N/A |
| **Decision Frameworks** | |
| Multi-option recommendations use explicit decision tree or comparison table | PASS |
| Criteria checklists gate complex approaches | PASS |
| Action permissions framed around reversibility | FAIL |
| **Multi-Phase Workflows** | |
| Complex tasks organized into explicit named phases | FAIL |
| Required steps distinguished from type-specific steps | N/A |
| Scenario-based branching handles multiple paths explicitly | PASS |
| **Memory and Continuity** | |
| Memory templates use XML tags as section labels | N/A |
| Compaction summaries include discoveries and failed approaches | N/A |
| Next steps tied to user's most recent explicit request | N/A |
| **Modularity** | |
| Each prompt component has a single responsibility | PASS |
| Scope boundaries state both inclusions and exclusions | FAIL |
| **Safety and Trust** | |
| Validation at system boundaries only; internal interfaces trusted | PASS |
| Dual-use capabilities state permissions before restrictions | N/A |
| Authorization is narrow-scoped; each action confirmed before expanding | FAIL |
| **Tone and Style** | |
| Size constraints use numeric limits, not qualitative descriptors | N/A |
| Instructions use imperative present tense | PASS |
| Working notes in analysis tags, not user-facing output | N/A |
| **Optimization** | |
| Prompt flagged as draft for automated optimization | FAIL |
| Correct optimizer selected | N/A |
| Held-out test set reserved before optimization begins | N/A |

**Summary score: 13 PASS / 12 FAIL / 28 N/A** (of 53 items)

---

## Recommendations

Listed in priority order by impact on reliability and correctness.

### 1. Make the spawned subagent prompt self-contained (Issue 3)
**Why first:** This is the highest-risk gap. The mapper agent receives a two-sentence prompt with no output format, no tool permissions, no quality criteria, and no absolute path context. Every call to the mapper agent is operating underspecified. Apply the `<task>` / `<unit_task>` / `<output_format>` / `<constraints>` structure from Section 17. This is the change most likely to produce measurably better and more consistent document output.

### 2. Add YAML frontmatter with agent metadata and tool permissions (Issue 4)
**Why second:** Without frontmatter, there is no machine-readable `whenToUse` trigger description, no `disallowedTools` list, and no `criticalSystemReminder`. The orchestrating model cannot reliably select this workflow over alternatives, and no tool permission boundary is enforced at the agent level. Add the frontmatter block per Section 11 and Section 17.

### 3. Add explicit audience and quality bar to the task specification (Issue 1)
**Why third:** The workflow's purpose is stated but the audience is implicit and the quality bar is absent. This means the mapper agent — and any developer reading the workflow — has no calibration standard for what "done" looks like. Two sentences in `<audience>` and `<quality_bar>` tags resolve this at low cost per Section 1 Actions 1–2.

### 4. Convert markdown step headers to `<phase>` tags and fix XML tag vocabulary (Issue 2)
**Why fourth:** The interior of `<process>` uses `##` markdown headers, which carry no semantic meaning to the model. Replacing them with `<phase id="N" name="...">` tags per Section 16 makes the phase boundaries explicit and machine-parseable. Replace the non-vocabulary `<required_reading>` tag with `<system_note>` per Section 8.

### 5. Add a tie-breaking rule for focus-argument resolution (Issue 5)
**Why fifth:** The current invalid-input path is a hard exit with no recovery for near-matches. Per Section 5, tie-breaking rules should match the domain's cost asymmetry. Here, over-resolution (inferring `tech` from `Tech`) is far cheaper than a hard exit that forces the user to re-invoke. A four-line tie-breaking instruction eliminates an unnecessary friction point.
