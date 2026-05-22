# Critique: explore.md

## Summary

The `explore.md` workflow is well-structured for its conversational intent and demonstrates solid
procedural clarity: steps are numbered and ordered logically, the output routing table is a clear
decision aid, and the success criteria checklist provides useful self-verification. However, the
prompt is written entirely in plain markdown prose and nested code fences, making no use of the
XML tag vocabulary the guide prescribes for separating prompt sections, constraints, output format,
and persona. Key guide requirements are absent or underspecified: there is no explicit persona, no
`<output_format>` block, no `<constraints>` block with paired permissions, no concrete few-shot
examples for Socratic questioning behavior, no tie-breaking rule for when the conversation should
end early, and no YAML frontmatter encoding the agent's identity and tool permissions. The workflow
reads as a developer runbook rather than a production-grade LLM prompt, and would benefit
substantially from a structural pass applying the guide's XML vocabulary, constraint pairing, and
persona framing.

---

## Strengths

- **Section 16 — Multi-Phase Workflows:** The six-step process structure creates clear cognitive
  boundaries between opening, questioning, research, crystallization, writing, and closing —
  matching the guide's phase pattern principle.

- **Section 15 — Decision Frameworks:** The output routing table (Step 4) is an excellent
  application of the comparison table pattern: it maps artifact type, destination, and trigger
  condition across rows, making branching logic scannable and unambiguous.

- **Section 5 — Instruction Framing (Conditional Instructions):** The `[Yes, research this] /
  [No, let's keep exploring]` branch and the explicit "If yes... If no..." logic in Step 3 are
  clean conditional framings. The workflow does not leave branching behavior implicit.

- **Section 5 — Negative to Positive Conversion:** Most instructions are framed positively
  ("Ask one question at a time", "Share findings and continue"). The one exception ("Never write
  artifacts without explicit user selection") is appropriately a hard prohibition — it matches a
  safety constraint rather than a behavioral style rule.

- **Section 14 — Constraint Enforcement (Scope Exclusions):** The parenthetical "Don't force it"
  on the research offer step implicitly limits over-triggering, though this is informal and
  not paired with a concrete permission.

- **Section 19 — Modularity:** The `<required_reading>` block shows awareness of modular
  composition by referencing external files (`questioning.md`, `domain-probes.md`) rather than
  inlining all questioning principles — keeping the file focused.

- **Section 23 — Checklist (Success Criteria):** The `<success_criteria>` block at the end is a
  genuine structural asset: it gives the agent a self-verification loop and mirrors the guide's
  checklist philosophy.

---

## Issues

### Issue 1 — No Persona (Section 6, Action 1 and Action 2)

**Principle:** A persona scoped to the exact domain biases behavior toward that role consistently.
Generic or absent personas leave the agent defaulting to generic assistant behavior.

**What's wrong:** There is no `<persona>` block. The guide's role-domain mapping table (Section 6)
explicitly identifies "Exploration" as a task type requiring a specific persona, and offers
"File search specialist. You excel at thoroughly navigating and exploring codebases." as an
example — but for ideation/Socratic exploration, a different domain-specific identity is needed.
Without a persona, the model has no register or voice constraint, making the tone of questions
unpredictable across runs.

**Concrete fix:**
```xml
<persona>
You are a Socratic product thinking partner. Your job is not to give answers — it is to
ask the single most clarifying question that moves the developer's thinking forward.

Your strengths:
- Surfacing unstated assumptions behind a proposal
- Identifying scope and constraint tensions before they become implementation problems
- Knowing when a conversation has reached a natural conclusion and routing outputs cleanly
</persona>
```

---

### Issue 2 — No XML Tag Structure Separating Prompt Sections (Section 4, Action 2)

**Principle:** When a prompt contains multiple distinct sections, wrap each in a semantically named
XML tag. Tags carry richer signal than markdown headers or prose delimiters.

**What's wrong:** The entire prompt uses markdown prose, code fences, and `##` headers as structure.
The guide states XML tags are "strictly better than markdown headers or `---` delimiters for
Claude-class models." The `<purpose>`, `<required_reading>`, `<available_agent_types>`,
`<process>`, and `<success_criteria>` tags are a partial start — but the content inside
`<process>` is still untagged markdown. The instruction body, output format, and constraints are
not separated into `<task>`, `<output_format>`, and `<constraints>` tags.

**Concrete fix:** Wrap the core instructional content inside `<process>` into semantic sub-tags:
```xml
<task>
  Guide the developer through a Socratic exploration of their idea using the principles
  in questioning.md and domain-probes.md, then route crystallized outputs to GSD artifacts.
</task>

<constraints>
  <permitted>
    - Ask one question per exchange
    - Offer a research agent after 2–3 exchanges when factual gaps exist
    - Write artifact files only after explicit user selection
  </permitted>
  <reserved_for_human_review>
    - Writing any artifact (note, todo, seed, requirement, phase) without user confirmation
  </reserved_for_human_review>
</constraints>

<output_format>
  Close each session with the exact block specified in Step 6, including topic, output count,
  and list of created files.
</output_format>
```

---

### Issue 3 — No Concrete Few-Shot Examples for Socratic Questioning (Section 3 and Section 22, Pattern 2)

**Principle:** Abstract instructions ("ask probing questions", "conversation should feel natural")
must be paired with calibrating examples. Qualitative terms are subjective; examples make them
measurable.

**What's wrong:** Step 2 instructs "questions should probe: constraints, tradeoffs, users, scope,
dependencies, risks" but provides no single example question or exchange. The guide (Section 22,
Pattern 2) requires "every abstract instruction paired with a calibrating example." Without
examples, the model calibrates "one question at a time" and "natural, not formulaic" against its
own prior — which varies across runs.

**Concrete fix:** Add an `<examples>` block inside or after Step 2:
```xml
<examples>
  <example>
    <input>Developer says: "I want to add real-time notifications to the app."</input>
    <output>Who needs to see those notifications — just the user who triggered the event,
    or other users in the same session?</output>
    <commentary>One question. Targets the recipient scope constraint before touching
    implementation.</commentary>
  </example>
  <example>
    <input>Developer says: "I'm thinking of replacing our REST API with GraphQL."</input>
    <output>What's the friction you're hitting with REST that GraphQL would fix?</output>
    <commentary>Probes the problem behind the solution rather than accepting the
    solution framing.</commentary>
  </example>
</examples>
```

---

### Issue 4 — Missing Tie-Breaking Rule for Conversation End (Section 5, Instruction Framing)

**Principle:** When multiple criteria apply simultaneously, list them with explicit priority.
Add explicit tie-breaking rules when the model might be uncertain.

**What's wrong:** Step 2 says "2-5 exchanges" and Step 4 says "after 3-6 exchanges" — these ranges
overlap and slightly conflict (2–5 vs. 3–6). More critically, there is no tie-breaking rule for
when to move from questioning to crystallization. "Natural conclusions" and "developer signals
readiness" are subjective triggers. The model has no cost asymmetry anchor: is it worse to end too
early (leaving ideas underexplored) or too late (wasting the developer's time)?

**Concrete fix:** Add a tie-breaking rule at the boundary between Step 2 and Step 4:
```xml
<tie_breaking>
  When uncertain whether to ask another question or move to crystallization:
  err toward asking one more question. An underexplored idea produces weak artifacts;
  an over-explored idea only costs one extra exchange.
  Move to crystallization when the developer has stated a direction, not just a topic.
</tie_breaking>
```
Also resolve the exchange count conflict: pick one range ("3–5 exchanges") and use it consistently.

---

### Issue 5 — No YAML Frontmatter Encoding Agent Identity and Tool Permissions (Section 11 and Section 17)

**Principle:** Agent prompt files must encode identity, permissions, trigger conditions, and
disallowed tools in machine-readable frontmatter so the orchestrator can configure the agent
correctly without parsing the prose body.

**What's wrong:** The file has no YAML frontmatter. The guide (Section 11) specifies the exact
frontmatter schema for agent prompts, including `agentType`, `model`, `disallowedTools`,
`whenToUse`, and `criticalSystemReminder`. The guide (Section 17) reinforces that `whenToUse`
must be action-specific, not capability-generic. Without frontmatter, the orchestrating model
cannot determine when to invoke this agent, which tools to restrict, or what model tier to use.

**Concrete fix:** Add frontmatter at the file's top:
```markdown
<!--
name: 'Workflow: Explore'
description: Socratic ideation workflow for crystallizing ideas into GSD artifacts
variables: []
agentMetadata:
  agentType: 'Explore'
  model: 'sonnet'
  whenToUse: >
    Use when the developer wants to think through a feature idea, architectural question,
    or problem before committing to a plan. Triggers on "explore", "let's think about",
    "I'm not sure about", or open-ended ideation requests.
  criticalSystemReminder: 'CRITICAL: Do not write any artifact file without explicit user confirmation.'
-->
```

---

## Quick-Reference Checklist Score

Scored against Section 23 of the guide as applied to `explore.md`:

| Checklist Item | Result | Notes |
|---|---|---|
| **Task Specification** | | |
| Intent, audience, and quality bar are all explicit | FAIL | Intent is present; audience and quality bar are absent |
| All constraints are compatible — no conflicts | FAIL | Exchange count range conflicts (2–5 vs. 3–6) |
| **Chain-of-Thought** | | |
| CoT included only for math/symbolic/multi-step logic | N/A | Not a reasoning task |
| **Few-Shot Examples** | | |
| Examples selected by semantic similarity | FAIL | No examples present |
| 2–5 examples total | FAIL | Zero examples |
| Ordered simple → complex | FAIL | No examples to order |
| Examples span diverse sub-types | FAIL | No examples present |
| Format consistent across examples | FAIL | No examples present |
| **Formatting** | | |
| Instruction complete before formatting applied | PASS | Steps are fully specified before structure |
| Prompt sections separated by semantically named XML tags | FAIL | Markdown headers used inside `<process>`; no `<task>`, `<constraints>`, `<output_format>` |
| At least 3 format variants tested | N/A | Pre-production workflow file, not a tuned prompt |
| **Instruction Framing** | | |
| Negative instructions converted to positive equivalents | PASS | One justified prohibition remains; rest are positive |
| Priority order explicit when multiple criteria apply | FAIL | No explicit priority ordering between steps or questioning dimensions |
| Tie-breaking rules match domain's cost asymmetry | FAIL | No tie-breaking rule at the questioning/crystallization boundary |
| **Persona** | | |
| Persona included only for open-ended/stylistic tasks | FAIL | This is a stylistic/open-ended task — persona is warranted but absent |
| Persona is specific (constrains voice/register) | FAIL | No persona present |
| Persona descriptor is gender-neutral | N/A | No persona present |
| **Output Format** | | |
| Structured output uses two-step reasoning-then-format | N/A | Not a structured output task |
| Machine-parsed output uses exact format specification | PASS | Step 6 closing block is exact and literal |
| **Context Placement** | | |
| Task instruction is at the start of the prompt | FAIL | `<purpose>` leads but `<task>` is absent; instructional body is mid-file inside `<process>` |
| Primary input is at the end | N/A | No variable input; developer's topic is runtime |
| Background context is in the middle | PASS | `<required_reading>` and `<available_agent_types>` are correctly mid-file |
| Irrelevant context has been removed | PASS | File is lean; no obvious padding |
| Time-sensitive injected context labeled as snapshot | N/A | No runtime context injected |
| **Self-Consistency** | | |
| Applied only to tasks with a single correct answer | N/A | Open-ended conversational task |
| **Prompt Length** | | |
| Redundant instructions and repeated context removed | PASS | No obvious redundancy |
| **System/User Split** | | |
| Persistent instructions in system prompt | N/A | Workflow file, not split into system/user |
| Each instruction appears in exactly one location | PASS | No duplication detected |
| **Agent / Subagent** | | |
| Agent prompts are fully self-contained | PASS | Research agent task string is complete inline |
| All file paths in agent output are absolute | FAIL | Output destinations in Step 4 use relative paths (`.planning/notes/...`) |
| Parallel agents launched in single message block | N/A | Only one research agent spawned at a time |
| **Structural Architecture** | | |
| Large prompts decomposed into atomic modules | PASS | Delegates to `questioning.md` and `domain-probes.md` |
| Template variables use `${VARIABLE_NAME}` syntax | PASS | `{topic}`, `{slug}` etc. use consistent placeholder syntax (minor: not `${...}` form) |
| **Constraint Enforcement** | | |
| Every restriction paired with an equally concrete permission | FAIL | "Never write artifacts without selection" has no paired `<permitted>` list |
| Hard exclusion lists are enumerated | N/A | No filtering task |
| **Decision Frameworks** | | |
| Multi-option recommendations use decision tree or table | PASS | Output routing table in Step 4 |
| Criteria checklists gate complex approaches | PASS | `<success_criteria>` block |
| **Multi-Phase Workflows** | | |
| Complex tasks organized into named phases | PASS | Six numbered steps with clear names |
| Required steps distinguished from type-specific steps | FAIL | Step 3 (research offer) is optional but not structurally marked as optional |
| Scenario-based branching handles multiple paths | PASS | Yes/No research branch is explicit |
| **Memory and Continuity** | | |
| Memory templates use XML tags as section labels | N/A | No memory template in this file |
| **Modularity** | | |
| Each component has a single responsibility | PASS | Each step handles one concern |
| Scope boundaries state inclusions and exclusions | FAIL | No `<scope>` block; exclusions (what the workflow does NOT do) are not stated |
| **Safety and Trust** | | |
| Dual-use capabilities state permissions before restrictions | FAIL | Prohibition appears without a prior permissions statement |
| **Tone and Style** | | |
| Size constraints use numeric limits | PASS | "200 words" limit on research agent output; "3-5 key findings" |
| Instructions use imperative present tense | PASS | Consistently imperative throughout |
| Working notes in analysis tags, not user-facing output | N/A | No analysis blocks needed here |
| **Optimization** | | |
| Prompt flagged as draft for automated optimization | FAIL | Not flagged |

---

## Recommendations

Listed in priority order by impact on model behavior consistency:

**1. Add a domain-specific persona with strengths listing (Issue 1 — Section 6)**
This is the single highest-leverage change. Without a persona, voice and questioning register
vary per run. Add a `<persona>` block that names the Socratic thinking partner role and
enumerates 3–4 strengths (surfacing assumptions, scoping constraints, knowing when to close).
This anchors all six steps in a consistent behavioral frame.

**2. Add 2–3 concrete few-shot examples of Socratic questions (Issue 3 — Section 3 / Section 22 Pattern 2)**
"Probe constraints, tradeoffs, users, scope" is an abstract instruction that the model
calibrates against its own prior. Two or three example exchanges (input: developer statement,
output: the one question asked, commentary: why this question) are sufficient to demonstrate
what "one good Socratic question" looks like in this workflow's domain.

**3. Add XML `<task>`, `<constraints>`, and `<output_format>` tags inside the process body (Issue 2 — Section 4, Action 2)**
Wrap the top-level task statement, the hard prohibition on writing without confirmation, and
the Step 6 closing block in their canonical XML tags. This is a structural change with no
content loss — it signals to the model which sections carry the heaviest weight and makes
the constraint parseable independently of the prose.

**4. Add a tie-breaking rule and resolve the exchange count conflict (Issue 4 — Section 5)**
Align the "2–5 exchanges" and "3–6 exchanges" ranges to a single value, then add an explicit
tie-breaking rule stating which error (ending too early vs. too late) is more expensive in
this domain. This is a small addition that removes a genuine ambiguity at the most
consequential decision point in the workflow.

**5. Add YAML frontmatter with `agentType`, `whenToUse`, and `disallowedTools` (Issue 5 — Section 11 / Section 17)**
This makes the workflow machine-readable to the GSD orchestrator without requiring prompt
parsing. The `whenToUse` field is the trigger the orchestrating model reads to decide whether
to invoke this workflow — without it, dispatch relies on name matching alone, which is fragile.
