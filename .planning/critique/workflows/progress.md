# Critique: progress.md

## Summary

`progress.md` is a dense, functionally mature workflow that handles a broad routing problem competently. Its XML step structure, branching decision tables, and code-block examples demonstrate solid structural instincts. However, the file is written primarily as internal procedural documentation rather than as a model-facing prompt. The task specification, audience, and quality bar are implicit; the output format is described through prose and markdown templates rather than a structured `<output_format>` block; and the prompt lacks a persona, leaving the model to self-select its register. Several instructions are framed negatively or conditionally without explicit tie-breaking, and the workflow's 600+ lines violate the compression principle without applying modularisation. Correcting these would measurably reduce variance in the model's routing decisions and output structure.

---

## Strengths

- **Section 16 (Multi-Phase Workflows) — Phase pattern applied correctly.** The workflow correctly uses `<step name="...">` tags to create named cognitive boundaries (init_context, load, analyze_roadmap, recent, position, report, route, edge_cases, forensic_audit). Each step is discrete and the model can complete one before proceeding.

- **Section 15 (Decision Frameworks) — Routing tables are clear and directive.** The "Route based on counts" and "Route based on milestone status" decision tables (Step 2 and Step 3) give the model a deterministic mapping from a boolean condition to a named action. This is exactly the ASCII decision tree / comparison table pattern from Section 15.

- **Section 5 (Instruction Framing) — Conditional instructions are explicit.** Branching within Route B (CONTEXT.md exists vs. not exists; UI vs. no UI) uses `if/else` prose clearly, matching the Section 5 conditional instruction pattern.

- **Section 4 (Formatting and Structure) — XML tags used for top-level sections.** `<purpose>`, `<required_reading>`, `<process>`, `<step>`, and `<success_criteria>` are all semantically named, not bare markdown headers. This is consistent with the Section 4 vocabulary.

- **Section 8 (Context Placement) — Task instruction leads.** `<purpose>` appears first and `<success_criteria>` closes the file, loosely following the instruction-first, quality-bar-last ordering recommended in Section 8.

- **Section 19 (Modularity) — `gsd-sdk query` calls centralise parsing.** The workflow delegates structured data extraction to SDK calls (`roadmap.analyze`, `state-snapshot`, `progress.bar`) rather than in-lining raw file parsing. This is single-responsibility thinking at the tool level.

---

## Issues

### Issue 1 — Missing task specification (Section 1, Actions 1–2)

**Principle:** Section 1 requires the prompt to make explicit: (a) what output is requested, (b) why it matters, and (c) what a correct response looks like. It also requires the audience to be encoded.

**What is missing:** The `<purpose>` block describes the workflow at a high level but does not define what a *correct* execution of progress looks like, who the model is serving (a developer mid-session? an automated orchestrator?), or what failure looks like. There is no `<quality_bar>` or `<audience>` tag.

**Fix:** Add a `<task>` / `<audience>` / `<quality_bar>` block immediately after `<purpose>`:

```xml
<task>
Generate a structured progress report for the current GSD project and route the user
to the single most appropriate next action. Do not ask clarifying questions.
</task>

<audience>
A software developer mid-session who knows GSD terminology. They need the report to be
fast to scan and the routing suggestion to be immediately actionable with a copy-pasteable
command.
</audience>

<quality_bar>
A correct output: (1) renders a progress bar and Recent Work/Current Position/What's Next
sections, (2) selects exactly one route (A–F) and emits the corresponding command block,
(3) is readable in under 30 seconds. Emitting multiple competing routes, or asking the
user to choose, is a failure.
</quality_bar>
```

---

### Issue 2 — No persona assigned (Section 6, Actions 1–2; Section 22, Pattern 1)

**Principle:** Section 6 Action 1 says to assign a persona for open-ended or stylistic tasks. Section 22 Pattern 1 says the identity should be scoped to the exact domain, not a generic role.

**What is missing:** The workflow has no `<persona>` block. The model defaults to generic assistant register when generating the report, which introduces tone and verbosity variance across runs.

**Fix:** Add a `<persona>` block with explicit register constraints and the reframe pattern from Section 6:

```xml
<persona>
You are a project navigator. Your job is not to explain GSD or coach the user —
it is to read state, compute position, and output one actionable next command.

Write in present tense, active voice. Use the report template exactly as specified.
Omit preamble, transitional prose, and commentary not called for by the template.
</persona>
```

---

### Issue 3 — Output format not formally specified (Section 7; Section 22, Pattern 3)

**Principle:** Section 7 Action 1 and Section 22 Pattern 3 require the output format to be stated completely and upfront before the model begins its task, including field names, ordering, and an example.

**What is missing:** The report template in the `<step name="report">` block is embedded mid-workflow in a fenced code block. It is not wrapped in `<output_format>` tags, it is not placed before the process steps, and several sub-fields (Recent Work item format, Blockers format) are described only qualitatively.

**Fix:** Extract the report template into a top-level `<output_format>` block placed before `<process>`, with an explicit note on required vs. optional sections:

```xml
<output_format>
Render the progress report using exactly this structure. Omit optional sections when
their data is absent — do not render empty sections.

# {Project Name}

**Progress:** {PROGRESS_BAR}
**Profile:** {quality|balanced|budget|inherit}
**Discuss mode:** {discuss|auto}

## Recent Work
- [{Phase}-{Plan}]: {one-line accomplishment from summary-extract}   (repeat 2–3 lines)

## Current Position
Phase {N} of {total}: {phase-name}
Plan {M} of {phase-total}: {status}
CONTEXT: {✓ if has_context | - if not}

## Key Decisions Made                    (omit if empty)
- {decision text}

## Blockers / Concerns                   (omit if empty)
- {blocker text}

## Pending Todos                         (omit if count = 0)
- {N} pending — /gsd-check-todos to review

## Active Debug Sessions                 (omit if count = 0)
- {N} active — /gsd-debug to continue

## Verification Debt                     (omit if outstanding_debt = 0)
| Phase | File | Issue |
...

## What's Next
{Route command block — exactly one block from Routes A–F}
</output_format>
```

---

### Issue 4 — Negative instructions present (Section 5, Action 1)

**Principle:** Section 5 Action 1 requires all negative instructions to be converted to positive equivalents before emission.

**What is missing:** The forensic audit step uses a soft negative: "If `--forensic` is NOT present in ARGUMENTS: skip this step entirely." This is a valid conditional but is framed negatively first. More importantly, within the success criteria, "User confirms before any action" implicitly prohibits autonomous execution without a positive statement of what the model should present instead.

**Fix — success criteria:**

```
# Before (negative/implicit):
- User confirms before any action

# After (positive, explicit):
- Present the routing suggestion as a copy-pasteable command block;
  require the user to run it manually. Take no autonomous action.
```

**Fix — forensic step guard:**

```
# Before:
If `--forensic` is NOT present in ARGUMENTS: skip this step entirely.

# After:
Run this step only when `--forensic` is present in ARGUMENTS.
```

---

### Issue 5 — No tie-breaking rule for ambiguous routing conditions (Section 5; Section 22, Pattern 4)

**Principle:** Section 5 and Pattern 4 require a tie-breaking rule whenever the model may be uncertain, calibrated to the domain's cost asymmetry.

**What is missing:** Step 2's routing table has `summaries = plans AND plans > 0 → Phase complete → Go to Step 3`. But the file does not specify what to do when `ls` commands return 0 due to a filesystem race, or when `wc -l` returns unexpectedly. More concretely, the table is silent on what to do when both `uat_partial > 0` and `summaries < plans` are true simultaneously — both Route A and Route E.2 fire.

**Fix:** Add an explicit priority order to the Step 2 routing table header:

```xml
<priority_order>
Route selection precedence when multiple conditions are true:
1. uat_partial > 0 → Route E.2 (incomplete testing blocks all else)
2. uat_with_gaps > 0 → Route E (gap plans needed before executing)
3. summaries < plans → Route A (execute existing plans)
4. summaries = plans AND plans > 0 → Step 3 (check milestone status)
5. plans = 0 → Route B (plan first)

When in doubt, default to the lowest-numbered matching route.
</priority_order>
```

---

### Issue 6 — Prompt length; no compression or modularisation (Section 10; Section 22, Pattern 5)

**Principle:** Section 10 Action 1 says to flag prompts that exceed necessary length. Section 22 Pattern 5 says large prompts should be decomposed into atomic, single-responsibility modules.

**What is missing:** At 620 lines, `progress.md` combines the main report flow, 6 forensic audit checks, all 6 route templates, edge case handling, and the success criteria in a single monolithic file. The forensic audit section alone (~110 lines) is infrequently triggered (only on `--forensic`) but consumes context on every invocation.

**Fix:** Extract the forensic audit into a separate file (e.g., `progress-forensic.md`) and reference it via template variable:

```
${FORENSIC_MODE?"## Forensic Integrity Audit\n${FORENSIC_AUDIT_STEPS}":""}
```

Similarly, the 6 named route templates could live in a `progress-routes.md` include, keeping the main workflow file under ~200 lines.

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | `<purpose>` is present but audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No constraint conflicts detected |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step | N/A | This is an orchestration workflow, not an inference task |
| CoT trigger phrasing correct | N/A | |
| Reasoning elicited before answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot section |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete and clear before formatting applied | FAIL | Output format is embedded mid-workflow rather than declared upfront |
| Prompt sections separated by semantically named XML tags | PASS | `<step name="...">` tags are semantically named |
| At least 3 format variants tested on target model | FAIL | No evidence of variant testing |
| **Instruction Framing** | | |
| All negative instructions converted to positive equivalents | FAIL | "If NOT present … skip" and "User confirms before any action" are negatively framed |
| Priority order explicit when multiple criteria apply | FAIL | Step 2 routing table has no priority order for simultaneous conditions |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule specified |
| **Persona** | | |
| Persona included for open-ended or stylistic tasks | FAIL | No persona block present |
| Persona is specific (constrains voice/register) | FAIL | (absent) |
| Persona descriptor is gender-neutral | N/A | (absent) |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | Not a structured output task |
| Single-call JSON places reasoning fields before answer fields | N/A | |
| Constrained decoding only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format with literal strings | PASS | Route command blocks are literal and copy-pasteable |
| **Context Placement** | | |
| Task instruction is at the start of the prompt | PASS | `<purpose>` leads |
| Primary document or input is at the end of the prompt | PASS | `<success_criteria>` closes |
| Background context is in the middle | PASS | Process steps are in the middle |
| All irrelevant context has been removed | PASS | No obvious padding |
| Time-sensitive injected context labeled as snapshot | N/A | No injected runtime context in the file itself |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | FAIL | Forensic audit (110 lines, conditional) bloats every invocation |
| Long prompts compressed before sending | FAIL | No compression applied; 620 lines with no modularisation |
| RAG context is extracted relevant passage only | N/A | |
| **System / User Split** | | |
| Persistent instructions in system prompt | N/A | File is a workflow/skill, not split across system/user |
| Task-specific instructions in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | No obvious duplication |
| Safety-critical constraints have external validation | N/A | |
| **Agent / Subagent** | | |
| Agent prompts are fully self-contained | PASS | All SDK calls are self-contained within the file |
| All file paths in agent output are absolute | FAIL | Route command blocks use relative paths (e.g., `.planning/phases/`) |
| Parallel agents launched in single message block | N/A | |
| Adversarial probes specified for verification agents | N/A | |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic single-responsibility modules | FAIL | 620-line monolith mixing report, routing, forensics, and edge cases |
| Template variables use ${VARIABLE_NAME} syntax with fallback | PASS | `${GSD_WS}`, `${PROJECT_CODE}`, `${DISCUSS_MODE}` are used consistently |
| Modules compose at runtime via variable substitution, not copy-paste | FAIL | Forensic section is copy-pasted inline rather than referenced |
| **Constraint Enforcement** | | |
| Every restriction paired with equally concrete permission | N/A | No restriction/permission pairs in this file |
| Hard exclusion lists are enumerated, not qualitative | N/A | |
| Known edge cases have precedent-style rulings | FAIL | Edge cases are listed in prose but not as structured precedent rulings |
| Confidence thresholds are numeric, not qualitative | N/A | |
| **Decision Frameworks** | | |
| Multi-option recommendations use explicit decision tree or comparison table | PASS | Step 2 and Step 3 routing tables are well-structured |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` checklist present |
| Action permissions framed around reversibility | N/A | |
| **Multi-Phase Workflows** | | |
| Complex tasks organised into explicit named phases | PASS | `<step name="...">` tags create named phases |
| Required steps distinguished from type-specific steps | FAIL | No explicit `<required_steps universal="true">` separation |
| Scenario-based branching handles multiple paths explicitly | PASS | Routes A–F handle all branching paths |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | PASS | Routing always derives from verified artifact counts, not assumptions |
| **Modularity** | | |
| Each prompt component has a single responsibility | FAIL | Main workflow + forensic audit + all routes in one file |
| Scope boundaries state both inclusions and exclusions | FAIL | `<success_criteria>` states inclusions only; no exclusions defined |
| **Safety and Trust** | | |
| Validation at system boundaries only | PASS | SDK calls handle external data; inline code only post-processes |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization is narrow-scoped | PASS | Workflow only reports; does not take autonomous action |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | FAIL | "1 line from summary-extract" is the only numeric constraint; "Recent Work" count is not bounded numerically |
| Instructions use imperative present tense | PASS | Most step instructions are imperative ("Find the first PLAN.md", "Read ROADMAP.md") |
| Working notes in analysis tags, not user-facing output | PASS | Internal bash blocks are clearly framed as process steps, not output |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | No optimization flag or note |
| Correct optimizer selected | FAIL | Not specified |
| Held-out test set reserved before optimization begins | FAIL | Not specified |

**Summary score: 14 PASS, 16 FAIL, 21 N/A** out of 51 applicable items.

---

## Recommendations

Listed in priority order by impact on output consistency.

### 1. Add `<task>`, `<audience>`, and `<quality_bar>` blocks (Section 1, Actions 1–2)

This is the highest-impact gap. Without a quality bar, the model has no calibration point for when the progress report is "good enough" and when to stop elaborating. Defining audience vocabulary (GSD terms are acceptable; no explanation needed) also reduces unnecessary preamble. Write and insert the three blocks as shown in Issue 1 above.

### 2. Add a `<persona>` block scoped to the navigator role (Section 6, Actions 1–2; Section 22, Pattern 1)

A persona is justified here because the output register matters: a terse, directive tone produces a faster-to-scan report than a conversational one. The reframe pattern ("your job is not to explain GSD — it is to output one command") directly corrects the most common failure mode (over-explaining). Implement as shown in Issue 2 above.

### 3. Elevate `<output_format>` to a top-level block before `<process>` (Section 7; Section 22, Pattern 3)

The report template is currently embedded inside a step. This means the model does not see the full expected structure before it begins executing steps, which allows format drift. Moving the template into a top-level `<output_format>` block and adding numeric constraints (e.g., "Recent Work: 2–3 lines maximum") directly reduces output variance. Implement as shown in Issue 3 above.

### 4. Add a `<priority_order>` block to the Step 2 routing table (Section 5; Section 22, Pattern 4)

Simultaneous route conditions (both UAT gaps and unexecuted plans present) are a real runtime scenario. The current table is silent on precedence. A four-line priority block eliminates ambiguity entirely. Implement as shown in Issue 5 above.

### 5. Extract the forensic audit into a separate module (Section 10, Action 1; Section 19; Section 22, Pattern 5)

The forensic audit is 110 lines of conditionally executed logic that fires on `--forensic` only. Including it inline in every invocation adds context cost with no benefit on the 95%+ of invocations where `--forensic` is absent. Extracting it into `progress-forensic.md` and injecting via template variable reduces the baseline file to approximately 500 lines immediately, and enables independent iteration on the forensic checks without touching the main routing logic.
