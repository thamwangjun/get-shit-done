# Critique: `commands/gsd/manager.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Overall Verdict

**Needs Work**

The file is a thin routing stub, not a prompt. It delegates all behavioral logic to an external workflow file (`@~/.claude/get-shit-done/workflows/manager.md`) that is not present in the prompt itself. This makes the command file nearly unverifiable against the guide — most sections cannot be assessed because the substance lives elsewhere. What is present in the file has structural and framing issues that the guide explicitly prohibits.

---

## Strengths

### Frontmatter as agent configuration (§11, §17)

The YAML frontmatter encodes `name`, `description`, and `allowed-tools`. This matches the guide's pattern for encoding identity and permissions in a single, machine-readable location (§11: "YAML frontmatter as agent configuration"). The `allowed-tools` list is present, which is better than no list.

### Scoped tool list present (§22 Pattern 9)

The `allowed-tools` block names specific tools (`Read`, `Write`, `Bash`, `Glob`, `Grep`, `AskUserQuestion`, `Skill`, `Task`). This is directionally correct per §22 Pattern 9, which requires tool permissions scoped to minimum required patterns rather than whole-tool grants.

### Context placement: task instruction leads (§8)

The `<objective>` tag appears first in the body, placing the task instruction at the start of the prompt. This is consistent with §8 Action 1: "Place the task instruction at the very start of the prompt."

---

## Weaknesses

### 1. Whole-tool Bash grant violates minimum-permission principle (§22 Pattern 9, §11)

`allowed-tools` lists `Bash` with no prefix restriction. The guide (§22 Pattern 9) states: "Narrow permissions make the skill's intended behavior explicit, limit blast radius if the agent goes off-path, and make permission grants auditable at a glance. Whole-tool grants (e.g. `Bash` with no prefix) leave the permission boundary undefined."

For a command center that reads files and dispatches agents, broad Bash access is unnecessary. The guide's example:

```yaml
allowed-tools:
  - Bash(git log:*)
  - Bash(git status:*)
```

shows how to scope Bash grants to specific command prefixes.

### 2. No persona defined; task framing uses markdown bold instead of XML (§4, §6)

The `<objective>` tag contains instructions but the body mixes markdown bold (`**Creates/Updates:**`, `**After:**`) with XML structure. §4 Action 2 states: "When a prompt contains multiple distinct sections, wrap each in a semantically named XML tag." Markdown headers inside XML-tagged sections are redundant structure that reduces signal clarity.

More critically, there is no `<persona>` block. §6 Action 1 states personas are appropriate for "open-ended, stylistic, or requires a specific voice" tasks. A command center that makes recommendations and drives UX decisions across phases fits that criterion — the interactive, decision-making nature of a dashboard manager benefits from a constrained persona that specifies how it communicates status, how assertive it is, and how it frames recommendations.

### 3. Process section is a single imperative with no scenario-based branching (§16, §5)

The entire `<process>` block reads:

> Execute the manager workflow from @~/.claude/get-shit-done/workflows/manager.md end-to-end. Maintain the dashboard refresh loop until the user exits or all phases complete.

This violates §16 (Multi-Phase Workflows): "Handle multiple scenarios explicitly rather than leaving the model to infer." A command center is inherently multi-scenario: what happens if STATE.md is missing? What if all phases are already complete on launch? What if the user triggers a discuss vs. an execute vs. an exit? None of these branches are expressed here. §5 (Instruction Framing) also requires explicit conditional branching: "When behavior depends on context, use explicit conditional branching."

The guide's scenario pattern (§16):

```xml
<scenarios>
  <scenario id="1" condition="all_phases_complete">...</scenario>
  <scenario id="2" condition="roadmap_missing">...</scenario>
  <scenario id="3" condition="active_milestone">...</scenario>
</scenarios>
```

is the correct form for a command that behaves differently depending on project state.

### 4. No output format specification (§7, §22 Pattern 3)

There is no `<output_format>` tag. §7 Action 1 and §22 Pattern 3 both require output format to be specified completely and upfront. For a dashboard command, this matters: the format of the phase status table, the structure of recommendations, the wording of dispatch confirmations — none are specified. The guide states: "A fully specified format produces consistent, parseable output. An implicit format produces structure that varies per call."

### 5. Negative constraint framing (§5 Action 1)

The `<objective>` section uses a negative framing: "No files created directly." §5 Action 1 explicitly requires converting negative instructions to positive equivalents: "Before emitting any prompt, scan for negated instructions. Rewrite each as a positive specification of the desired behavior."

The positive rewrite would be: "Reads files only — dispatches work to existing GSD commands and background Task agents."

### 6. `<execution_context>` tag is not part of the guide's tag vocabulary (§4)

The tag `<execution_context>` does not appear in §4's XML tag vocabulary. Its purpose (injecting external file references) maps most closely to `<context>` with runtime injection sub-tags (`<log_path>`, or a custom named sub-tag). Using an undocumented tag works against interoperability — the guide (§4) specifies: "A shared vocabulary makes composed prompts predictable and composed modules interoperable."

---

## Specific Rewrites

### Rewrite 1: Scope the Bash grant and add read-only constraint pair (§22 Pattern 9, §14)

**Current:**
```yaml
allowed-tools:
  - Bash
```

**Rewrite:**
```yaml
allowed-tools:
  - Bash(git log:*)
  - Bash(git status:*)
  - Bash(cat:*)
  - Bash(ls:*)
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
  - Task
```

And add a constraint block to pair the restriction with what is permitted:

```xml
<constraints>
  <take_freely>
    Read files, list directories, query git history, render the dashboard, ask the user questions.
  </take_freely>
  <confirm_with_user>
    Dispatching a background Task agent (plan or execute). These are externally visible and long-running.
  </confirm_with_user>
</constraints>
```

This satisfies §14's "explicit permission pairs" requirement and §22 Pattern 9's minimum-permission principle.

---

### Rewrite 2: Replace the single-line `<process>` with scenario-based branching (§16, §5)

**Current:**
```xml
<process>
Execute the manager workflow from @~/.claude/get-shit-done/workflows/manager.md end-to-end.
Maintain the dashboard refresh loop until the user exits or all phases complete.
</process>
```

**Rewrite:**
```xml
<process>
Load the manager workflow from @~/.claude/get-shit-done/workflows/manager.md.

<scenarios>
  <scenario id="1" condition="STATE.md or ROADMAP.md not found">
    Inform the user: "No active milestone found. Run `/gsd-new-milestone` to create one."
    Do not render the dashboard. Await user action.
  </scenario>

  <scenario id="2" condition="all phases complete">
    Render the dashboard showing all phases as complete.
    Recommend the milestone lifecycle command (`/gsd-complete-milestone`) as the next action.
    Await user confirmation before dispatching.
  </scenario>

  <scenario id="3" condition="active milestone with phases in progress or pending">
    Render the phase dashboard per the workflow.
    Recommend the optimal next action for each ready phase.
    Maintain the dashboard refresh loop: re-render after each dispatch or user action.
    Exit when the user explicitly requests exit or all phases complete.
  </scenario>
</scenarios>
</process>
```

---

### Rewrite 3: Add a specific persona and output format (§6, §7, §22 Pattern 3)

**Add before `<objective>`:**
```xml
<persona>
You are a project management command center for a GSD milestone. Your role is to surface
phase status clearly, surface the highest-leverage next action, and dispatch work on request.
Communicate in imperative present tense. Keep status output structured and scannable.
Recommendations are direct: state what to do and why in one sentence each.
</persona>
```

**Add after `<process>`:**
```xml
<output_format>
Dashboard format: render a markdown table with columns: Phase #, Name, Status, Recommended Action.
Status values: Pending | Discussing | Planning | Executing | Done | Blocked.

Recommendations: one line per phase, starting with a verb. Example:
- "Execute Phase 3 — plan is approved and no blocking dependencies remain."
- "Discuss Phase 4 — no plan exists yet."

Dispatch confirmations: one sentence naming the agent being launched and the phase it targets.
Do not emit exploratory reasoning in the dashboard output. Reserve working notes for internal analysis only.
</output_format>
```

---

## Summary Table

| Dimension | Guide Section | Status |
|---|---|---|
| Frontmatter with tool list | §11, §17 | Pass (partial — Bash too broad) |
| Task instruction leads | §8 | Pass |
| Persona defined | §6 | Fail — absent |
| XML tag vocabulary compliance | §4 | Fail — `<execution_context>` non-standard |
| Positive instruction framing | §5 | Fail — "No files created" |
| Output format specified | §7, §22 P3 | Fail — absent |
| Scenario-based branching | §16 | Fail — single imperative |
| Constraint pairs (permit + restrict) | §14 | Fail — absent |
| Minimum Bash permission scope | §22 P9 | Fail — whole-tool grant |
