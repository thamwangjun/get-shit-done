# Critique: help.md

## Summary

`help.md` is a competently written command reference that succeeds as human-readable documentation but falls short as a prompt. The file's `<purpose>` tag constrains the agent to output-only mode and the `<reference>` tag wraps structured content, which shows awareness of Section 4's XML vocabulary — but the prompt engineering stops there. The workflow lacks an explicit task specification, audience definition, quality bar, output format constraints, persona, and any instruction-framing discipline. Because the file's sole job is to render a static reference block unchanged, many guide principles are genuinely not applicable; however, the principles that do apply — task specification, instruction framing, output format, and context placement — are either absent or handled only implicitly.

---

## Strengths

- **Section 4 Action 2 — XML tag usage.** The file uses semantically named XML tags (`<purpose>`, `<reference>`) to separate meta-instruction from content, which is directionally correct.
- **Section 11 Action 3 — Single canonical instruction location.** The `<purpose>` block states the agent's job exactly once with no repetition.
- **Section 19 — Single responsibility.** The file has one concern: render the GSD command reference. It does not attempt to mix concerns.
- **Section 10 Action 1 — Prompt length discipline.** The reference content itself is well-scoped: every command has a description, usage example, and result where relevant — no filler.
- **Section 21 — Active voice for commands.** Command descriptions throughout the reference use imperative present tense consistently ("Initialize new project", "Map an existing codebase", "Execute all plans").

---

## Issues

### Issue 1 — No explicit task specification (Section 1, Actions 1–2)

**Principle:** Extract the three task components — what output is requested, why it matters, and what a correct response looks like. Encode the audience explicitly.

**What's missing:** The `<purpose>` tag instructs the agent to "output ONLY the reference content" but does not state: (a) who the audience is (a developer new to GSD? an experienced user?), (b) why the output matters (onboarding, mid-session lookup?), or (c) what a correct response looks like beyond "no commentary".

**Concrete fix:** Replace the current `<purpose>` block with:

```xml
<task>Render the GSD command reference exactly as written below.</task>
<audience>A developer using Claude Code who has invoked /gsd-help. They need a complete, scannable command list — no prior GSD knowledge assumed.</audience>
<quality_bar>Output is the reference block verbatim. No preamble, no git status, no next-step suggestions, no analysis. Success = the reference renders completely and nothing else appears.</quality_bar>
```

---

### Issue 2 — Negative instruction not converted to positive equivalent (Section 5, Action 1)

**Principle:** Convert "do not", "avoid", and "never" phrasing to positive specifications of desired behavior.

**What's missing:** The `<purpose>` block uses three negative directives: "Do NOT add project-specific analysis", "Do NOT add … git status", "Do NOT add … next-step suggestions, or any commentary". These tell the agent what to withhold but do not say what to produce instead.

**Concrete fix:** Convert the negative list to a single positive instruction:

```xml
<task>
Output the reference block below in its entirety. Your entire response is the reference content — nothing precedes it and nothing follows it.
</task>
```

This eliminates all three negative clauses by specifying the complete desired output shape positively.

---

### Issue 3 — No output format specification (Section 7; Section 22, Pattern 3)

**Principle:** State the required output structure completely and upfront. Machine-parsed output must include exact format requirements.

**What's missing:** The `<purpose>` tag says "Output ONLY the reference content" but does not specify: whether to include the outer `<reference>` tags in the rendered output, whether to preserve markdown formatting, or whether to strip any wrapper. A model could render the raw XML tags, strip them, or add a heading — all are consistent with the instruction as written.

**Concrete fix:** Add an explicit output format block:

```xml
<output_format>
Respond with the contents of the <reference> block below, rendered as markdown. Do not include the <reference> XML tags themselves. Do not add any text before or after the markdown content.
</output_format>
```

---

### Issue 4 — Context placement is inverted (Section 8, Actions 1–2)

**Principle:** Place the task instruction at the very start of the prompt (highest attention). Place the primary content the model must act on at the very end (highest attention). Background context goes in the middle.

**What's missing:** The current structure is `<purpose>` (instruction) → `<reference>` (content to render). While this looks correct, the `<purpose>` block is only two lines, sandwiched before a 660-line reference block. In practice, the instruction is at the start (correct) but there is no content at the end to anchor attention — the reference itself is the content, and it ends at line 667. A closing output cue after the reference would exploit recency bias.

**Concrete fix:** Add a closing output cue after the closing `</reference>` tag:

```xml
</reference>

<output_format>
Now render the reference above. Start your response immediately with the first `#` heading.
</output_format>
```

This places a task-reinforcing signal at the very end of the prompt, exploiting the model's end-of-context attention.

---

### Issue 5 — No constraint enforcement for scope creep (Section 14; Section 5 priority ordering)

**Principle:** Pair every restriction with an equally concrete permission. When multiple criteria apply, list them with explicit priority.

**What's missing:** The `<purpose>` block prohibits several output types (analysis, git status, next-step suggestions, commentary) but does not state what is permitted. A model that is uncertain whether a brief transition sentence counts as "commentary" has no tie-breaking rule.

**Concrete fix:** Add an explicit permitted/excluded constraint pair:

```xml
<constraints>
  <permitted>The exact markdown content of the reference block, rendered verbatim.</permitted>
  <excluded>Any text not present in the reference block: preamble, git status, project analysis, next-step suggestions, transition sentences, or closing remarks.</excluded>
  <tie_breaking>When uncertain whether any addition is permitted, omit it. The reference content is complete as written.</tie_breaking>
</constraints>
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide. Items marked N/A are genuinely inapplicable to a static reference-rendering workflow.

| Checklist Item | Score | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Audience and quality bar are absent |
| All constraints are compatible — no conflicts | PASS | No conflicting constraints |
| **Chain of Thought** | | |
| CoT included only for math/symbolic/multi-step tasks | N/A | No reasoning task |
| CoT trigger used correctly | N/A | |
| Reasoning elicited before the answer | N/A | |
| CoT traces treated as heuristic | N/A | |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | N/A | No few-shot examples needed |
| 2–5 examples total | N/A | |
| Ordered simple → complex | N/A | |
| Examples span diverse sub-types | N/A | |
| Format consistent across examples | N/A | |
| Example order fixed across evaluation runs | N/A | |
| **Formatting** | | |
| Instruction complete and clear before formatting applied | FAIL | Instruction is underspecified (Issue 1) |
| Prompt sections separated by semantically named XML tags | PASS | `<purpose>` and `<reference>` tags present |
| At least 3 format variants will be tested | N/A | Static render task; format variance not meaningful |
| **Instruction Framing** | | |
| All negative instructions converted to positive equivalents | FAIL | Three "Do NOT" directives (Issue 2) |
| Priority order explicit when multiple criteria apply | FAIL | No priority ordering; no tie-breaking rule (Issue 5) |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule present |
| **Persona** | | |
| Persona included only for open-ended or stylistic tasks | PASS | No persona — correct for this task type |
| Persona is specific, not generic | N/A | No persona |
| Persona descriptor is gender-neutral | N/A | No persona |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | Not a reasoning task |
| Single-call JSON places reasoning fields first | N/A | Not JSON output |
| Constrained decoding adopted only after free-form proven insufficient | N/A | |
| Machine-parsed output uses exact format specification | FAIL | Output format is not specified (Issue 3) |
| **Context Placement** | | |
| Task instruction is at the start of the prompt | PASS | `<purpose>` leads |
| Primary document or input is at the end | FAIL | No closing output cue after reference block (Issue 4) |
| Background context is in the middle | N/A | No background context |
| All irrelevant context has been removed | PASS | File contains only what is needed |
| Time-sensitive injected context is labeled as a snapshot | N/A | No runtime context injection |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | |
| Inference budget permits 15–20 samples | N/A | |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No redundancy |
| Long prompts compressed before sending | N/A | Reference content is intentionally complete |
| RAG context is extracted relevant passage only | N/A | |
| **System/User Split** | | |
| Persistent instructions are in system prompt | N/A | Workflow file, not a system/user split context |
| Task-specific instructions are in user prompt | N/A | |
| Each instruction appears in exactly one location | PASS | One `<purpose>` block, no duplication |
| Safety-critical constraints have external validation | N/A | No safety-critical behavior |
| **Agent/Subagent** | | |
| Agent prompts are fully self-contained | PASS | File is self-contained |
| All file paths in agent output are absolute | N/A | No file paths in output |
| Parallel agents launched in a single message block | N/A | |
| Adversarial probes specified for verification agents | N/A | |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic modules | PASS | Single-concern file |
| Template variables use ${VARIABLE_NAME} syntax with fallback | N/A | No template variables |
| Modules compose at runtime via variable substitution | N/A | |
| **Constraint Enforcement** | | |
| Every restriction paired with an equally concrete permission | FAIL | Restrictions listed without corresponding permissions (Issue 5) |
| Hard exclusion lists enumerated, not described qualitatively | FAIL | Exclusions are described qualitatively ("any commentary") |
| Known edge cases have precedent-style rulings | FAIL | No tie-breaking for ambiguous cases |
| Confidence thresholds are numeric, not qualitative | N/A | No filtering task |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or comparison table | N/A | |
| Criteria checklists gate complex approaches | N/A | |
| Action permissions framed around reversibility | N/A | |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into explicit named phases | N/A | Single-step render task |
| Required steps distinguished from type-specific | N/A | |
| Scenario-based branching handles multiple paths explicitly | N/A | No branching |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | |
| Compaction summaries include discoveries and failed approaches | N/A | |
| Next steps tied to user's most recent explicit request | N/A | |
| **Modularity** | | |
| Each prompt component has a single responsibility | PASS | Single-concern file |
| Scope boundaries state both inclusions and exclusions | FAIL | Inclusions not explicitly stated; exclusions only |
| **Safety and Trust** | | |
| Validation at system boundaries only | N/A | |
| Dual-use capabilities state permissions before restrictions | N/A | |
| Authorization is narrow-scoped | N/A | |
| **Tone and Style** | | |
| Size constraints use numeric limits, not qualitative descriptors | FAIL | No output size constraints specified at all |
| Instructions use imperative present tense | PASS | "Output ONLY the reference content" |
| Working notes in analysis tags, not user-facing output | N/A | |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |
| Correct optimizer selected | N/A | Static render; optimization not meaningful |
| Held-out test set reserved before optimization | N/A | |

**Summary score:** 8 PASS / 11 FAIL / 34 N/A

The high N/A count reflects the workflow's nature as a static render task. Of the 19 scoreable items, 8 pass and 11 fail — a 42% pass rate on applicable criteria.

---

## Recommendations

Prioritized by impact:

**1. Convert all negative instructions to a positive output spec (Section 5, Action 1 — addresses Issue 2)**

The three "Do NOT" clauses are the highest-leverage fix because they define the entire behavioral contract. Replacing them with a single positive statement ("Your entire response is the reference content — nothing precedes it and nothing follows it") eliminates ambiguity at the instruction level and removes the risk that a model treats "commentary" differently than intended.

**2. Add an explicit output format block (Section 7; Section 22, Pattern 3 — addresses Issue 3)**

Specify whether to include or strip the `<reference>` XML tags, whether to preserve or alter markdown formatting, and what the first token of the response should be. This is a one-to-three line addition that removes all output shape ambiguity.

**3. Add audience and quality bar to the task specification (Section 1, Actions 1–2 — addresses Issue 1)**

Two sentences — one naming the audience ("a developer who invoked /gsd-help") and one defining success ("the reference renders completely and nothing else appears") — satisfy the Section 1 requirement and give the model a self-check criterion.

**4. Add a constraint pair with a tie-breaking rule (Section 14; Section 5 tie-breaking — addresses Issue 5)**

Pair the current exclusion list with an explicit permission statement and add a single tie-breaking rule ("when uncertain, omit"). This resolves edge cases like whether a transition sentence or a section heading counts as "commentary."

**5. Add a closing output cue after the reference block (Section 8, Action 2 — addresses Issue 4)**

A two-line `<output_format>` block placed after `</reference>` exploits end-of-context attention and reinforces the task instruction at the point where the model begins generating. This is a minimal change with meaningful attention-placement benefit.
