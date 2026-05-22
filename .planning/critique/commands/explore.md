# Prompt Engineering Critique: `commands/gsd/explore.md`

**Files reviewed:**
- Command stub: `commands/gsd/explore.md`
- Workflow body: `~/.claude/get-shit-done/workflows/explore.md`
- Guide: `PROMPT_ENGINEERING_GUIDE_V09.md`

> Because the command stub delegates entirely to the workflow file, this critique treats both as the effective prompt. The command stub is nearly contentless on its own — any rating of the stub alone would be misleading.

---

## Strengths

### 1. Persona aligned to task domain (§6 Role-Domain Mapping)

The guide's role-domain mapping table (§6) explicitly lists "Exploration" → "File search specialist. You excel at thoroughly navigating and exploring codebases." The workflow establishes a Socratic facilitator identity via its `<task>` tag and step structure. This is more effective than a generic "helpful assistant" framing. The `<available_agent_types>` block is appropriately narrow — one named subagent, used for one purpose — consistent with Pattern 9 (§22, minimum required tool/agent scope).

### 2. Single-question constraint is correctly framed (§5 Instruction Framing)

Step 2 states "Ask **one question at a time** (ask exactly one question at a time)." The parenthetical restatement is a deliberate intensity signal. This is a positive instruction (what to do) rather than a negative one ("don't ask multiple questions"), consistent with §5 Action 1. The bolding also draws attention appropriately given the guide's instruction-framing principles.

### 3. Explicit artifact routing table (§15 Decision Frameworks)

The output routing table in Step 4 functions as an implicit decision framework: a structured mapping of condition → action. The "When to suggest" column operationalizes the decision, removing ambiguity. This aligns with §15's pattern for comparison tables that map use cases to outcomes across multiple dimensions.

### 4. Explicit consent gate before write (§14 Constraint Enforcement / §20 Safety Patterns)

"Write artifacts only after explicit user selection" is a clean constraint, consistent with §20's authorization scope rule: "Authorization is narrow-scoped by default — confirm before expanding scope." The user interaction UI mockup makes the consent mechanism concrete.

### 5. Graceful skip condition for research (§10 Prompt Length / §13 Modular Principle)

"If the topic doesn't warrant research, skip this step entirely. Don't force it." This is a well-placed scope exclusion that prevents ritual execution of every step regardless of context. It aligns with §10's instruction to remove instructions that don't contribute to the task.

---

## Weaknesses

### 1. No persona or `<audience>` tag — generic agent framing (§6 Action 2, §1 Action 2)

**Severity: High**

The workflow opens with:
```xml
<task>
Guide the developer through exploring an idea via Socratic probing questions...
</task>
```

There is no `<persona>` block at all. The guide (§6 Action 2) states that generic expert framing produces no measurable gain, and that a persona must constrain register, voice, or domain-specific style to be effective. More critically, §1 Action 2 requires an `<audience>` tag identifying who will consume the output and with what domain knowledge. "The developer" appears only in passing prose — it is never encoded as a structured `<audience>` element.

The strengths enumeration pattern from §6 is completely absent. Compare to the guide's explicit example:
```xml
<persona>
Your strengths:
- Searching for code, configurations, and patterns across large codebases
- Analyzing multiple files to understand system architecture
</persona>
```

For a Socratic facilitator, strengths like "surface latent assumptions in technical proposals" or "identify scope creep before it lands in a plan" would bias the model toward the task's actual value.

### 2. Structural duplication between the command stub and the workflow header (§11 Action 3)

**Severity: Medium**

The command stub (`commands/gsd/explore.md`) contains:
```
<objective>
Open-ended Socratic ideation session. Guides the developer through exploring an idea via
probing questions, optionally spawns research, then routes outputs to the appropriate GSD
artifacts...
</objective>
```

The workflow (`explore.md`) opens with:
```xml
<task>
Guide the developer through exploring an idea via Socratic probing questions...
</task>

<context>
Offers mid-conversation research when useful...
</context>

<purpose>
Socratic ideation workflow. Guides the developer through exploring an idea via probing questions,
offers mid-conversation research when useful...
</purpose>
```

The `<task>`, `<context>`, and `<purpose>` tags say materially the same thing across three blocks. This violates §11 Action 3 directly: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance."

The `<context>` and `<purpose>` blocks are also redundant with each other within the workflow itself.

### 3. Missing `<output_format>` specification — success criteria buried at the end (§7 Action 1, §22 Pattern 3)

**Severity: High**

The `<success_criteria>` block appears at the very end of the workflow:
```xml
<success_criteria>
- [ ] Socratic conversation follows questioning.md principles
- [ ] Questions asked one at a time, not in batches
...
</success_criteria>
```

This violates §8 Action 1 (task instruction leads the prompt) and §22 Pattern 3 (output format specified completely and upfront). The model should know what a successful output looks like *before* it begins executing — not encounter the quality bar as a trailing checklist after 139 lines of process instructions.

Additionally, there is no `<output_format>` block at all. The Step 6 close template is partial — it specifies what to say in the closing message but does not define constraints on response length, tone register, or how conversation turns should be formatted throughout the session. The guide (§21) requires numeric size constraints ("2–12 words", "under 8 words") rather than qualitative guidance.

### 4. Negative instruction buried in Step 2 (§5 Action 1)

**Severity: Low–Medium**

Step 2 contains:
> "Conversation should feel natural, not formulaic. Avoid rigid sequences."

The guide (§5 Action 1) requires converting negative instructions to positive equivalents. "Avoid rigid sequences" does not specify what the desired behavior is. Compare to the guide's conversion table:

| Original | Rewrite |
|---|---|
| "Avoid rigid sequences" | "Follow the developer's energy — go deeper on whichever aspect generates the most signal" |
| "not formulaic" | "Adapt pacing and question angle to each response before choosing the next question" |

The following sentence ("Follow the developer's energy — if they're excited about one aspect, go deeper there") partially recovers this, but it arrives as an afterthought rather than as the primary instruction.

---

## Specific Rewrites

### Rewrite 1: Add a `<persona>` block with strengths enumeration (fixes Weakness 1)

Insert this block immediately after the `<task>` tag, before `<context>`:

```xml
<persona>
You are a Socratic ideation specialist embedded in a developer's planning workflow.

Your role is not to suggest solutions — it is to surface what the developer does not yet know
they need to consider.

Your strengths:
- Identifying unstated assumptions in technical proposals before they become costly decisions
- Distinguishing scope that belongs in this session from scope that belongs in a future phase
- Recognizing when "or" / "versus" framing signals a real tradeoff worth exploring vs. a false choice
- Asking one precise question that unlocks multiple downstream answers
</persona>

<audience>
A software developer mid-project who has a half-formed idea or technical question. They are
working within the GSD planning system and expect Socratic questioning, not solutions. They
have domain knowledge of the codebase but may not have considered second-order consequences
of the idea they are exploring.
</audience>
```

The reframe pattern (§6) applies here: "Your job is NOT to suggest solutions — it's to surface what they don't yet know they need to consider." This displaces the model's default assistant prior of providing answers.

### Rewrite 2: Move `<success_criteria>` to the front as `<quality_bar>`, and add `<output_format>` (fixes Weakness 3)

Remove the trailing `<success_criteria>` block. Replace with two blocks immediately after `<persona>` and `<audience>`:

```xml
<quality_bar>
A successful explore session:
- Produces at least one developer insight that was not present in the opening message
- Asks exactly one question per turn — never two or three bundled questions
- Offers research only when a specific factual gap was surfaced, not as a routine step
- Routes outputs to the correct artifact type with an explicit rationale
- Writes no artifact without explicit user selection

A failing session:
- Asks multiple questions per turn (forces the developer to choose which to answer)
- Offers research as a ritual step regardless of whether a question was surfaced
- Writes artifacts without explicit confirmation
</quality_bar>

<output_format>
Throughout the session:
- Each turn: 1 question + optional reflection (2–4 sentences max per reflection)
- Research offer: 2 sentences, with binary choice on the same line
- Artifact proposal: bullet list (max 4 items), each with type + destination + one-sentence rationale
- Closing summary: use the Step 6 template; keep the artifact list under 5 lines

Do not present working notes, intermediate thinking, or alternatives not selected. Surface
only what the developer needs for the next decision.
</output_format>
```

### Rewrite 3: Collapse the three-block duplication in the workflow header (fixes Weakness 2)

Remove `<context>` and `<purpose>` entirely. Fold the non-redundant content from `<context>` ("Spawned by /gsd-explore") into a single `<system_note>` tag per §8 Meta-instruction injection:

```xml
<system_note>
This workflow is invoked by the /gsd-explore command. The developer may pass an optional
topic argument (e.g. `/gsd-explore authentication strategy`). If no argument is present,
begin with the open-ended prompt in Step 1.
</system_note>
```

The workflow `<task>` becomes the sole statement of purpose:

```xml
<task>
Guide the developer through exploring an idea via Socratic probing questions, then route
crystallized outputs to GSD artifacts.
</task>
```

Three blocks → one block + one metadata note. No information is lost.

---

## Overall Verdict

**Needs Work**

The workflow has a competent process structure — the step sequence, the artifact routing table, and the consent gate are all well-designed. But it fails on two high-severity guide principles: it has no persona (leaving the model to default to generic assistant behavior throughout a session that specifically requires it to *not* answer questions), and it specifies the quality bar only as a trailing checklist rather than upfront as a `<quality_bar>` + `<output_format>`. These are not cosmetic issues — they affect how the model enters the task and what it optimizes for. The structural duplication in the header is a medium-severity mechanical problem that wastes context tokens without adding signal. All three issues have straightforward, localized fixes that do not require rethinking the step structure.
