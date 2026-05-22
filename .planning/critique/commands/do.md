# Critique: `commands/gsd/do.md`

Evaluated against: Prompt Engineering Guide V09

---

## Strengths

### XML tag structure (§4 Formatting and Structure)

The command file uses semantically named XML tags (`<objective>`, `<execution_context>`, `<context>`, `<process>`) to separate prompt sections. This aligns with §4 Action 2, which requires that each distinct section be wrapped in a tag whose name reflects what the section *is*, not just where it starts. The tags are unambiguous and machine-parseable.

### Positive instruction framing in the objective (§5 Instruction Framing)

The `<objective>` block uses positive, directive language: "Acts as a smart dispatcher — never does the work itself. Matches intent to the best GSD command using routing rules, confirms the match, then hands off." This is a correct application of the reframe pattern from §6 Persona Assignment — it displaces the model's default tendency to act on the content it receives by explicitly stating what the agent's job is *not*, then what it *is*.

### Input is placed last (§8 Context Placement)

`<context>$ARGUMENTS</context>` appears at the end of the prompt, consistent with §8 Action 2: "Place the primary document or input at the very end of the prompt." This correctly exploits recency bias for the primary content the model must act on.

### Conditional handling of empty input (§5 Instruction Framing — Conditional Instructions)

The workflow (referenced via `@~/.claude/get-shit-done/workflows/do.md`) includes explicit conditional branching: if `$ARGUMENTS` is empty, ask via `AskUserQuestion` before continuing. This matches §5's pattern for conditional instructions: "If no PR number is provided in the args, run `gh pr list`…"

### Routing table is comprehensive and deterministic

The routing table in the workflow covers 20+ intent types, uses "first matching" rule application, and provides a rationale column. This is close to the decision tree pattern from §15 Decision Frameworks, which recommends that "each branch has one clear recommendation."

---

## Weaknesses

### No persona assigned for a task type that warrants one (§6 Persona Assignment)

The command has no `<persona>` block. However, the task type — routing/dispatching, requiring a specific decision-making voice — is exactly the case §6 says benefits from a specific persona. The guide's role-domain mapping table (§6) provides a clear analogue: "File search specialist. You excel at thoroughly navigating and exploring codebases." For a dispatcher, the equivalent would specify decision-making priorities and voice, not generic expertise. The absence means the model has no role-constrained identity to lean into, and defaults to generic assistant behavior — the exact failure mode §6 warns against.

**Severity:** Medium. The task works without a persona, but the dispatcher pattern is subtle enough that behavioral drift (e.g., the model doing the work rather than routing) is a real risk without the role constraint.

### `<process>` tag contains only an external reference — no inline intent, quality bar, or audience (§1 Task Specification)

The `<process>` block reads: "Execute the do workflow from `@~/.claude/get-shit-done/workflows/do.md` end-to-end. Route user intent to the best GSD command and invoke it." This is the entirety of the instruction. §1 Action 1 requires three explicit components: (a) what output is being requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. None of (b) or (c) appear anywhere in the command file. The audience (`<audience>`) and quality bar (`<quality_bar>`) tags from §1 are absent entirely.

The command file relies on the referenced workflow for all substance. This creates a coupling problem: the command file alone is not independently understandable (violating §19 Modularity), and the `<process>` tag provides no signal the model could fall back on if the referenced file were unavailable or misloaded.

**Severity:** High. §19 requires each prompt component to be "independently understandable." The command file currently fails this test.

### Negative instruction in `<objective>` that should be restructured (§5 Instruction Framing, Action 1)

The objective contains: "never does the work itself." While §6 permits the "NOT X — it's Y" reframe pattern for persona displacement, §5 Action 1 requires that negative instructions be the exception and states the rule mechanically: scan for negated instructions and convert to positive equivalents unless the reframe pattern applies. Here, "never does the work itself" could be made positive: "Dispatches exclusively — hands off all execution to the chosen GSD command." The negative form does correctly set up a positive contrast ("Matches intent … confirms the match, then hands off"), so this is a borderline case, but the pure negative clause "never does the work itself" on its own line could be refactored more cleanly.

**Severity:** Low. The intent is clear; this is a polish issue, not a failure mode.

### No output format specification for the routing confirmation step (§7 Output Format Handling, §22 Pattern 3)

The command file has no `<output_format>` block. The workflow defines a routing display format (the `━━━` box), but this is buried in the external workflow file. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought." The routing confirmation output — the one artifact the user actually sees from this command before dispatch — has no format specification in the command file itself.

**Severity:** Medium. The format exists in the workflow, but its absence from the command file means a model reading only `do.md` has no output anchor.

### Allowed tools list is not scoped to minimum required patterns (§22 Pattern 9)

The command file declares:

```yaml
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
```

`Bash` with no prefix grants unrestricted shell access. §22 Pattern 9 requires: "Express allowed tools as the narrowest patterns that satisfy the task, specifying command prefixes and tool name patterns rather than granting whole-tool access." For a pure dispatcher, the Bash requirement should be scoped to the specific commands actually needed (e.g., `Bash(gsd-sdk:*)` or `Bash(grep:*)` for config checking). An unrestricted `Bash` grant expands blast radius if the model goes off-path.

**Severity:** Medium. Low probability of misuse in practice, but the permission boundary is undefined, which §22 Pattern 9 flags as a direct problem.

---

## Specific Rewrites

### Issue 1 (High): `<process>` provides no standalone quality bar or fallback instruction

**Current:**
```xml
<process>
Execute the do workflow from @~/.claude/get-shit-done/workflows/do.md end-to-end.
Route user intent to the best GSD command and invoke it.
</process>
```

**Rewrite:**
```xml
<process>
Execute the do workflow from @~/.claude/get-shit-done/workflows/do.md end-to-end.

Your sole output is a routing decision and a dispatch. A correct response:
- Identifies exactly one GSD command that matches the input intent
- Displays the routing decision before invoking the command
- Invokes the command with $ARGUMENTS as args, then stops
- Does not execute, plan, or produce any work product itself

Route user intent to the best GSD command and invoke it.
</process>

<quality_bar>
Routing is correct when: the chosen command is the one a GSD expert would select for the stated intent, the routing rationale is one clear sentence, and no work is done directly.
</quality_bar>
```

This adds the quality bar required by §1 Action 1 inline in the command file, making it independently understandable without the workflow file.

---

### Issue 2 (Medium): No persona to constrain dispatcher behavior

**Current:** No `<persona>` block.

**Rewrite — add between `<objective>` and `<execution_context>`:**
```xml
<persona>
You are a GSD command dispatcher. Your job is not to solve the user's task — it is to identify which GSD command should solve it and hand off immediately.

Decision-making priorities:
1. Match the user's *intent* (not their literal words) to the routing table
2. When intent is ambiguous across 2-3 routes, ask — do not guess
3. After dispatching, stop — the invoked command owns all subsequent work
</persona>
```

This applies §6 Action 2 (specific, role-constrained persona) and §6's reframe pattern to explicitly displace the model's default "be helpful by doing the work" prior.

---

### Issue 3 (Medium): `Bash` tool grant is unscoped

**Current:**
```yaml
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
```

**Rewrite:**
```yaml
allowed-tools:
  - Read
  - Bash(gsd-sdk query *)
  - AskUserQuestion
```

The workflow's only Bash usage is `gsd-sdk query state.load` for project existence checking. Scoping Bash to `gsd-sdk query *` expresses the actual permission boundary, limits blast radius, and makes the grant auditable at a glance per §22 Pattern 9.

---

## Overall Verdict

**Adequate**

The command file is structurally sound: XML tags are correctly used, input placement is correct, conditional handling exists, and the routing logic (in the workflow) is comprehensive. The critical gap is that the command file is not independently understandable — it is a thin shell over an external workflow file with no inline quality bar, no persona, and no output format specification. For a dispatcher command where the entire value is the routing decision, these omissions mean the model has no role identity to maintain and no success criteria to evaluate its own output against. The issues are fixable with targeted additions; the underlying routing architecture is solid.
