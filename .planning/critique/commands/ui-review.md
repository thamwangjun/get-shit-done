# Prompt Engineering Critique: `commands/gsd/ui-review.md`

**Verdict: Adequate**

The command file is structurally sound as a thin dispatch layer, but it carries several structural weaknesses that reduce clarity and robustness. The workflow it delegates to (`~/.claude/get-shit-done/workflows/ui-review.md`) is considerably more complete — the critique covers both.

---

## Strengths

### 1. Permitted/Reserved constraint pair (§14 Constraint Enforcement)

The workflow uses `<permitted>` and `<reserved_for_human_review>` tags correctly, pairing restrictions with equally concrete permission grants. Every restriction identifies a specific class of action, and every permission is equally specific. This matches §14's explicit permission pairs pattern precisely.

### 2. Output format specified as a completion checklist (§7 Output Format Handling, §22 Pattern 3)

The `<output_format>` block at the end of the workflow lists six checkbox conditions that together define "done". This is a strong application of §22 Pattern 3 (output format specified completely and upfront), and it doubles as a self-consistency gate: the orchestrator cannot claim success until all six conditions are verifiable. The format is closed, not open-ended.

### 3. Conditional branching is explicit (§5 Instruction Framing — Conditional instructions)

The workflow handles the existing-review branch explicitly: present via `AskUserQuestion`, offer two options, and specify the action for each. It also handles `TEXT_MODE` for non-Claude runtimes with a clear conditional rule. These match §5's pattern for conditional instructions: "If X, do Y. If Z, do W."

### 4. Persona scoped to domain (§6 Persona Assignment, §22 Pattern 1)

The `gsd-ui-auditor` subagent type is referenced by exact name and role. The workflow doesn't define the persona inline — it defers to the agent's own prompt file. This is consistent with §19's modular principle: each component has a single responsibility, and persona belongs in the agent file, not the dispatch layer.

### 5. Spawning indicator and status output follow ui-brand (§21 Tone and Style Rules)

The workflow references `ui-brand.md` explicitly and uses the defined banner format with `GSD ►` prefix, the `◆ Spawning UI auditor...` indicator, and the score summary table. This is consistent with §21's active-voice, imperative output style and with §22 Pattern 3's requirement that format be completely specified.

---

## Weaknesses

### 1. The command file provides no task specification — it is a pure forward (§1 Task Specification, §8 Context Placement)

**Severity: High**

`commands/gsd/ui-review.md` contains five tags: `<objective>`, `<execution_context>`, `<context>`, and `<process>`. None of them satisfy §1 Action 1's three required components: (a) what output is requested, (b) why that output matters, (c) what a correct response looks like.

- `<objective>` states what the command produces, but not why or what "correct" means.
- `<context>` provides only the `$ARGUMENTS` placeholder.
- `<process>` is a one-line delegation to the workflow file.

Per §8 Action 1, the task instruction must lead the prompt. The command file opens with `<objective>` — a reasonable approximation — but this tag is not in the guide's XML vocabulary (§4). The guide-standard tag is `<task>`. This is a vocabulary deviation that reduces signal quality.

The `<execution_context>` tag (containing `@` file references) is also not in the §4 vocabulary. The correct enclosing tag for injected references is `<context>`, with the injected paths as `<input>` or inline references inside named sub-tags.

**Impact:** The LLM reading this command sees ambiguous semantic signals. `<objective>` is not a known structural tag; `<execution_context>` is not a known structural tag. The model must infer meaning from content alone, losing the semantic signal the guide prioritizes.

### 2. The workflow's `<process>` mixes plain prose, bash blocks, and markdown headers with no XML structure separating phases (§4 Formatting and Structure, §16 Multi-Phase Workflows)

**Severity: High**

The workflow defines five phases (0 through 5, plus an "Automated UI Verification" section inserted mid-document as a plain markdown `##` header). The guide's §16 pattern for multi-phase workflows is explicit:

```xml
<phase id="1" name="Research and Plan" mode="plan">
  ...
</phase>
```

Instead, the workflow uses `## 0. Initialize`, `## 1. Detect Input State`, etc. — markdown headers, not XML phase tags. The "Automated UI Verification" block is placed between Phase 4 and Phase 5 as a floating `##` section, breaking the sequential phase structure entirely. Per §16, phases should create cognitive boundaries; a floating section between two numbered phases undermines this.

The mixed structure (bash code blocks + markdown + bare prose) violates §4 Action 2's rule: "when a prompt contains multiple distinct sections, wrap each in a semantically named XML tag."

**Impact:** The model cannot reliably identify where one phase ends and another begins. The misplaced "Automated UI Verification" block is particularly likely to be executed out of sequence or skipped, depending on how the model tokenizes the document.

### 3. No quality bar or audience definition in either file (§1 Task Specification Actions 1–2)

**Severity: Medium**

Neither the command file nor the workflow defines:
- Who will consume the output (the audience)
- What makes a correct or high-quality audit (the quality bar)

The workflow states: "Audits against a UI-SPEC.md design contract when one exists; falls back to abstract 6-pillar standards otherwise." But "abstract 6-pillar standards" is not defined anywhere in the visible text — it is entirely implicit. The `ui-brand.md` reference defines terminal output formatting, not audit quality standards for the six pillars.

Per §1 Action 1, the quality bar must be explicit: what a correct or high-quality response looks like. A scoring rubric (1–4 per pillar) is mentioned in the command's `<objective>` but the rubric criteria — what distinguishes a 1 from a 4 — are nowhere defined. This is a classic example of §22 Pattern 2's warning: "qualitative terms like 'concise' and 'clear' are subjective; examples make them measurable." Without rubric examples, the auditor calibrates against its own priors, producing inconsistent scores across runs.

---

## Specific Rewrites

### Rewrite 1: Replace non-standard tags in `commands/gsd/ui-review.md` with guide vocabulary

**Current:**

```markdown
<objective>
Conduct a retroactive 6-pillar visual audit. Produces UI-REVIEW.md with
graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ui-review.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute @~/.claude/get-shit-done/workflows/ui-review.md end-to-end.
Preserve all workflow gates.
</process>
```

**Rewrite:**

```xml
<task>
Conduct a retroactive 6-pillar visual audit of the specified phase's
implemented frontend code. Produce {phase_num}-UI-REVIEW.md with a
graded assessment (1–4 per pillar, 24 total). Works on any project.
</task>

<audience>
Developer who implemented the phase. Needs specific, actionable findings
per pillar — not general UI advice.
</audience>

<quality_bar>
Audit is complete when all six pillars are scored, each finding cites
a specific file or component, and at least one fix recommendation is
provided per pillar scoring below 3.
</quality_bar>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<input>
Execute the workflow defined in:
@~/.claude/get-shit-done/workflows/ui-review.md
Preserve all workflow gates without skipping.
</input>
```

**Why:** `<task>`, `<audience>`, `<quality_bar>`, `<context>`, and `<input>` are all in §4's vocabulary table. `<objective>` and `<execution_context>` are not. The rewrite also makes the quality bar explicit — audit completeness criteria are now unambiguous.

---

### Rewrite 2: Wrap workflow phases in `<phase>` tags and move the Playwright block into Phase 4

**Current structure (abbreviated):**

```markdown
## 0. Initialize
...bash...

## 1. Detect Input State
...prose...

## 2. Gather Context Paths
...prose...

## 3. Spawn gsd-ui-auditor
...prose + Task() call...

## 4. Handle Return
...prose...

## Automated UI Verification (when Playwright-MCP is available)
...prose...

## 5. Commit (if configured)
...bash...
```

**Rewrite (structure only — content unchanged):**

```xml
<phase id="0" name="Initialize">
  ...bash init block...
</phase>

<phase id="1" name="Detect Input State">
  ...prose + exit condition...
</phase>

<phase id="2" name="Gather Context Paths">
  ...prose...
</phase>

<phase id="3" name="Spawn gsd-ui-auditor">
  ...prose + Task() call...
</phase>

<phase id="4" name="Handle Return">
  ...score summary display...

  <scenario condition="playwright_mcp_available">
    Navigate to each component, screenshot, compare against spec,
    add findings to relevant pillar in UI-REVIEW.md. Flag items
    requiring human judgment as needs_human_review: true.
  </scenario>

  <scenario condition="playwright_mcp_unavailable">
    Skip Playwright pass. Audit uses code-only review.
  </scenario>
</phase>

<phase id="5" name="Commit">
  ...bash commit block...
</phase>
```

**Why:** §16's `<phase>` tags create unambiguous cognitive boundaries. The Playwright block becomes `<scenario>` branches within Phase 4 (where its output is consumed), eliminating the floating section that currently sits between phases. §16's `<scenario>` pattern is designed for exactly this: branching behavior based on a runtime condition.

---

### Rewrite 3: Add a rubric to the workflow's `<context>` block

**Current:**

```xml
<context>
Standalone workflow — operates on any project, GSD-managed or not.
Audits against a UI-SPEC.md design contract when one exists; falls back to abstract 6-pillar standards otherwise.
Six pillars: Copywriting, Visuals, Color, Typography, Spacing, Experience Design (4 points each, 24 total).
</context>
```

**Rewrite:**

```xml
<context>
Standalone workflow — operates on any project, GSD-managed or not.
Audits against a UI-SPEC.md design contract when one exists; falls back to abstract 6-pillar standards otherwise.
Six pillars: Copywriting, Visuals, Color, Typography, Spacing, Experience Design (4 points each, 24 total).

<quality_bar>
Scoring rubric — apply to each pillar:
- 4: Fully meets standard. No actionable issues identified.
- 3: Meets standard with minor issues. At most one low-severity finding.
- 2: Partially meets standard. One or more medium-severity findings that degrade UX.
- 1: Does not meet standard. One or more high-severity findings or systematic failures.

Each finding below 4 must cite: specific file or component, observed behavior,
and a concrete fix recommendation. Findings without a specific citation are invalid.
</quality_bar>
</context>
```

**Why:** §1 Action 1 requires the quality bar to be explicit. §22 Pattern 2 requires at least one concrete example to calibrate qualitative terms. Without this rubric, "abstract 6-pillar standards" is undefined — the auditor uses its own priors, producing scores that vary across runs on the same codebase. The rubric anchors the 1–4 scale to observable behaviors rather than impressions.

---

## Overall Verdict: Adequate

The command file functions as intended and delegates cleanly to a workflow that handles the substantive work. The workflow itself has several genuine strengths: explicit constraint pairs (§14), conditional branching (§5), and a checklist-based completion definition (§7). These are non-trivial and reflect deliberate design.

The primary deficiencies are structural: non-standard XML vocabulary in the command layer (§4), flat markdown headers where phase tags belong (§16), a floating out-of-sequence section (§16), and an undefined quality bar for the scoring rubric (§1). None of these are fatal — the workflow produces useful output — but they reduce signal precision and create conditions for inconsistent scoring across runs.

The three rewrites above address the highest-leverage gaps. Rewrite 1 (vocabulary alignment) and Rewrite 3 (rubric) are low-effort and high-impact. Rewrite 2 (phase structure) is the largest change and the most structurally correct, but the current document will function adequately without it if Rewrites 1 and 3 are applied.
