# Prompt Engineering Critique: `commands/gsd/note.md`

**Files reviewed:**
- Command: `commands/gsd/note.md`
- Workflow: `~/.claude/get-shit-done/workflows/note.md`
- Guide: `PROMPT_ENGINEERING_GUIDE_V09.md`

---

## Strengths

### XML structural tagging is used correctly (§4 Formatting and Structure)

The command file uses `<objective>`, `<execution_context>`, `<context>`, and `<process>` as top-level semantic tags. The workflow file uses the full guide-prescribed vocabulary: `<task>`, `<constraints>`, `<permitted>`, `<priority_order>`, `<process>`, `<edge_cases>`, and `<quality_bar>`. This matches §4 Action 2 exactly — sections are separated by semantically named XML tags, not markdown headers or `---` delimiters.

### `<priority_order>` is explicit and correctly placed (§5 Instruction Framing)

The workflow defines a four-item `<priority_order>` block with numbered entries covering scope resolution, subcommand disambiguation, verbatim capture, and confirmation format. This directly satisfies §5's requirement for explicit ordering when multiple criteria apply, and eliminates the ambiguity that arises when the model must infer priority.

### `<permitted>` / `<reserved>` constraint pairing (§14 Constraint Enforcement)

The `<constraints>` block pairs each permission with its restriction: `<permitted>` lists allowed file operations; `<reserved>` lists what is prohibited. This follows §14's explicit permission pairs pattern — every restriction is accompanied by a statement of what IS permitted.

### Subcommand disambiguation with decision tables (§15 Decision Frameworks)

The `parse_subcommand` step uses a top-to-bottom match table with a clear tiebreak ("first match wins") and an explicit critical note on the edge case (`/gsd-note list of groceries` → append). This directly applies §15's "ASCII decision trees make 'it depends' situations tractable" principle, in table form.

### `<quality_bar>` is concrete and measurable (§1 Task Specification)

The workflow's `<quality_bar>` block states four criteria in terms of observable, testable behaviors ("one Write call", "character-for-character", "sequential numbers"). This satisfies §1 Action 1's requirement to specify "what a correct or high-quality response looks like" — not qualitatively but in terms of verifiable outcomes.

### Edge cases enumerated as a structured table (§14 Constraint Enforcement — Precedents)

The `<edge_cases>` table lists eight known boundary scenarios with their required behavior. This matches §14's precedents pattern: "specific edge-case rulings that override general rules." Each row is a ruling, not a general principle.

---

## Weaknesses

### 1. The command file is a thin pass-through with no standalone value (§19 Modularity and Composition; §17 Agent and Subagent Patterns)

`commands/gsd/note.md` contains four tags: `<objective>`, `<execution_context>`, `<context>`, and `<process>`. The actual task, constraints, and decision logic live entirely in the workflow file referenced via `@`. The command file adds only a three-sentence `<objective>` summary and the `@` references.

Per §17, "each agent prompt must be fully self-contained when spawned." Per §19, each prompt component should be "independently understandable." This command file fails both: it is neither self-contained nor independently understandable — it is only meaningful as a pointer to the workflow file.

The `<objective>` block also duplicates content that the workflow's `<task>` already states more completely. Per §11 Action 3, "each instruction appears in exactly one location."

### 2. No output format specification in the command file (§7 Output Format Handling; §22 Pattern 3)

The command file specifies no `<output_format>` tag. The confirmation line format ("Noted (project): {note text}") and list display template exist in the workflow, not the command. The command-level prompt that a model first reads contains zero output format guidance.

Per §22 Pattern 3: "Output format specified completely and upfront — state the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought."

The command file's `<process>` block contains only: "Execute the note workflow from @~/.claude/get-shit-done/workflows/note.md end-to-end." This is an execution pointer, not an instruction. The model has no output expectations until it reads the referenced file — a violation of §8 Action 1 (task instruction must lead).

### 3. Negative/ambiguous framing in `<reserved>` (§5 Instruction Framing, Action 1)

The workflow's `<reserved>` block lists three restrictions:

```
- Create `.planning/` if it does not already exist — fall back to global scope silently
- Ask the user any clarifying question — capture verbatim and confirm, always
- Modify note text in any way, including correcting typos or reformatting
```

Per §5 Action 1, negative instructions must be converted to positive equivalents. Two of these three entries are negated directives ("do not ask", "do not modify"). They are stated as things that are reserved/forbidden rather than as positive specifications of desired behavior.

Additionally, the tag name `<reserved>` is non-standard. The guide's tag vocabulary (§4) defines `<reserved_for_human_review>` for actions requiring human confirmation — a semantically different concept from "things the agent must never do." The mismatch between the tag name and its actual semantics (it means `<prohibited>`, not `<reserved_for_human_review>`) creates ambiguity.

---

## Specific Rewrites

### Rewrite 1 — Make the command file independently instructive (fixes Weakness 1 and 2)

**Current `<process>` block:**
```xml
<process>
Execute the note workflow from @~/.claude/get-shit-done/workflows/note.md end-to-end.
Capture the note, list notes, or promote to todo — depending on arguments.
</process>
```

**Suggested replacement:**
```xml
<task>
Capture a timestamped note, list existing notes, or promote a note to a todo — depending
on the argument. Complete in one Write call with one confirmation line. No questions asked.
</task>

<output_format>
Append: one line — `Noted (project|global): {note text verbatim}`
List: grouped by scope with sequential numbers for active notes
Promote: one line — `Promoted note {N} to todo {id}: {note text}`
Error: one line stating the problem — then stop
</output_format>

<process>
Execute the note workflow from @~/.claude/get-shit-done/workflows/note.md end-to-end.
</process>
```

This makes the command file independently instructive at the response-format level while still delegating step-by-step logic to the workflow. A model reading only the command file now knows what output is expected.

### Rewrite 2 — Convert `<reserved>` negatives to positive equivalents and fix tag name (fixes Weakness 3)

**Current:**
```xml
<reserved>
  - Create `.planning/` if it does not already exist — fall back to global scope silently
  - Ask the user any clarifying question — capture verbatim and confirm, always
  - Modify note text in any way, including correcting typos or reformatting
</reserved>
```

**Suggested replacement:**
```xml
<exclusions>
  - When `.planning/` is absent: fall back to global scope silently without creating the directory
  - Capture the argument verbatim and confirm with one line — never pause for clarification
  - Store note text character-for-character as given, including typos and original punctuation
</exclusions>
```

Changes: tag renamed from `<reserved>` (undefined in the guide's vocabulary, collides with `<reserved_for_human_review>`) to `<exclusions>` (defined in §4 as "categories of output automatically excluded from consideration"). Each item rewritten from a prohibition into a positive behavioral statement per §5 Action 1's conversion table.

### Rewrite 3 — Add `<audience>` to the command file (fixes §1 Action 2 gap)

The command file omits `<audience>` entirely. The guide's §1 Action 2 states the audience must be encoded explicitly. For this command the audience is the developer in a Claude Code session who needs zero-friction capture without being prompted.

**Add to command file after `<objective>`:**
```xml
<audience>
A developer mid-work in Claude Code who needs to capture a thought in one command with no
friction. Speed and fidelity to the original text matter more than formatting or validation.
</audience>
```

This is not just boilerplate — it encodes the "no questions" constraint at the audience level, reinforcing the workflow's single-line confirmation requirement with a motivation the model can reason from.

---

## Overall Verdict

**Adequate**

The workflow file (`~/.claude/get-shit-done/workflows/note.md`) is well-engineered: structured with guide-prescribed tags, priority ordering, explicit edge-case rulings, and a concrete quality bar. It would score Strong on its own.

The command file (`commands/gsd/note.md`) drags the overall rating down. It treats itself as a routing stub and delegates all substance to the workflow reference, leaving the command-level prompt with no output format specification, a redundant `<objective>` that duplicates the workflow's `<task>`, and no audience encoding. The `<reserved>` tag in the workflow also introduces non-standard vocabulary and framing violations.

The command file needs to become a first-class prompt component — not a launcher. Three targeted rewrites above address the top issues without requiring a redesign of the workflow.
