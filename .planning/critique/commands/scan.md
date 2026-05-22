# Prompt Engineering Critique: `commands/gsd/scan.md`

**Reviewed against:** PROMPT_ENGINEERING_GUIDE_V09.md  
**Date:** 2026-04-30  
**Verdict:** Needs Work

---

## Context

`commands/gsd/scan.md` is a thin command stub — its job is to configure the command entry point (YAML frontmatter) and delegate all real logic to `~/.claude/get-shit-done/workflows/scan.md` via `@` include. This critique evaluates both files together as a functional unit, since the command stub is meaningless in isolation. The workflow file is where the substantive prompt engineering lives.

---

## Strengths

### 1. XML tag sectioning — §4 Formatting and Structure

The workflow file uses semantically named XML tags (`<task>`, `<context>`, `<purpose>`, `<process>`, `<success_criteria>`) to separate sections. This aligns directly with §4 Action 2: "wrap each in a semantically named XML tag." The tags carry semantic meaning rather than using markdown headers or `---` delimiters, which the guide rates as strictly inferior for Claude-class models.

### 2. Explicit tool permissions in frontmatter — §17 Agent and Subagent Patterns, §22 Pattern 9

The command stub's YAML frontmatter enumerates the `allowed-tools` list (`Read`, `Write`, `Bash`, `Grep`, `Glob`, `Agent`, `AskUserQuestion`). This follows §22 Pattern 9's direction to express tool permissions explicitly. It also follows §11's YAML frontmatter pattern for encapsulating agent configuration.

### 3. Focus-to-document mapping table — §15 Decision Frameworks

The workflow's `Focus-to-Document Mapping` table maps each focus flag to its concrete output documents. This follows §15's comparison table pattern: comparing options across multiple dimensions in a scannable form. It makes branching behavior explicit rather than leaving it to inference.

### 4. Success criteria checklist — §16 Multi-Phase Workflows

The `<success_criteria>` block at the end of the workflow provides a verifiable checklist of pass conditions. While the guide does not mandate this pattern explicitly, it is consistent with §16's `<required_steps universal="true">` pattern — distinguishing what must be true for the workflow to be considered complete.

### 5. Conditional branching is explicit — §5 Instruction Framing

Step 2 handles the "existing documents" branch with explicit conditional prose and a concrete user-facing message template. This matches §5's conditional instruction pattern: "If no PR number is provided… If a PR number is provided…" — behavior is branched and each path is stated clearly.

---

## Weaknesses

### 1. Duplicate content between `<context>` and `<purpose>` — §11 System vs. User Prompt Allocation, §10 Prompt Length and Compression

**Issue:** The workflow file contains two sections that say essentially the same thing:

- `<context>`: "Spawns a single gsd-codebase-mapper agent for one focus area. Use for quick targeted analysis rather than full intel update. Spawned by /gsd-scan."
- `<purpose>`: "Lightweight codebase assessment. Spawns a single gsd-codebase-mapper agent for one focus area, producing targeted documents in `.planning/codebase/`."

This directly violates §11 Action 3: "State each instruction exactly once. Repeated instructions consume context and add noise without reinforcing compliance." It also violates §10 Action 1: "Remove redundant instructions, repeated context, and boilerplate."

The `<task>` tag at the top of the workflow *also* partially duplicates this with "Lightweight codebase assessment producing targeted documents in .planning/codebase/." — that is three restatements of the same summary sentence.

**Severity:** Moderate. It adds token cost and reduces signal density without aiding compliance.

---

### 2. No output format specification for the agent prompt — §7 Output Format Handling, §22 Pattern 3

**Issue:** Step 4's agent spawn contains a minimal prompt:

```
prompt="Scan this codebase with focus: {focus}. Write results to .planning/codebase/. Produce only: {document_list}"
```

There is no output format specification for what each produced document should contain — no schema, no section list, no length guidance, no example structure. §22 Pattern 3 states: "State the required output structure, field names, ordering, and an example before the model begins its task. Format specification is part of the task definition, not an afterthought." §7 Action 1 reinforces this by requiring structured output tasks to be fully specified upfront.

The instruction is also entirely negative-by-omission: "Produce only: {document_list}" tells the agent what filenames to write, but nothing about what a well-formed ARCHITECTURE.md or STACK.md should contain. Without a schema or example, output quality is entirely dependent on the `gsd-codebase-mapper` subagent's internal defaults — which may drift across versions.

**Severity:** High. This is the core task delegation and its quality bar is undefined.

---

### 3. No `<quality_bar>` and no explicit audience — §1 Task Specification

**Issue:** §1 Action 1 requires three task components to be explicit: (a) what output is requested, (b) why it matters or how it will be used, and (c) what a correct or high-quality response looks like. §1 Action 2 requires the audience to be identified and encoded.

Neither file provides:
- A `<quality_bar>` stating what distinguishes a good scan output from a poor one (e.g., "STACK.md must enumerate all runtime dependencies with version constraints; theoretical or inferred dependencies are excluded")
- An `<audience>` tag or equivalent stating who reads these documents and with what background knowledge (a developer running `/gsd-scan` mid-session vs. a new contributor onboarding to the project has very different needs)

The guide provides the structural XML for this in §1:

```xml
<audience>{who will use the output and in what context}</audience>
<quality_bar>{what makes a good response — format, length, focus}</quality_bar>
```

Without a quality bar, the success criteria checklist in `<success_criteria>` only validates process steps ("single mapper agent spawned"), not output quality ("STACK.md covers all runtime dependencies").

**Severity:** High. The absence of a quality bar means the agent has no calibration target for correctness.

---

### 4. `<required_reading>` is a circular self-reference — §8 Context Placement, §17 Agent and Subagent Patterns

**Issue:** The workflow file contains:

```xml
<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>
```

This instruction tells the model to read the file that is already being read as part of invoking it. The `execution_context` in the command stub points to this workflow via `@~/.claude/get-shit-done/workflows/scan.md`. The `<required_reading>` tag adds no information and is structurally circular.

§17 states: "Each agent prompt must be fully self-contained when spawned." An instruction to "read files referenced by the invoking prompt's execution_context" breaks self-containment by making the workflow dependent on a lookup in the parent prompt — which may not be available when the workflow is included directly or tested in isolation.

**Severity:** Low-moderate. Does not block execution in normal use but violates the self-containment principle and adds noise.

---

### 5. Negative instruction framing in error path — §5 Instruction Framing

**Issue:** The validation error path says:

```
If invalid:
Unknown focus area: "{input}". Valid options: tech, arch, quality, concerns, tech+arch
Exit.
```

The error message itself is fine. The weakness is in Step 1's overall framing: the validation instruction is written as a guard ("if invalid, exit") with no positive statement of what success looks like. §5 Action 1 requires converting negative framing to positive equivalents. The positive form would be: "Resolve the focus by matching the user's input against the valid set. If no match is found, emit the error message and stop."

This is a minor framing issue rather than a structural problem, but the guide is explicit that negative-as-primary-directive framing should be converted.

**Severity:** Low.

---

## Specific Rewrites

### Rewrite 1: Collapse duplicate context into a single `<context>` block

**Current (workflow file, lines 5–17):**

```xml
<task>
Lightweight codebase assessment producing targeted documents in .planning/codebase/.
</task>

<context>
Spawns a single gsd-codebase-mapper agent for one focus area. Use for quick targeted analysis rather than full intel update. Spawned by /gsd-scan.
</context>

<purpose>
Lightweight codebase assessment. Spawns a single gsd-codebase-mapper agent for one focus area,
producing targeted documents in `.planning/codebase/`.
</purpose>
```

**Rewrite:**

```xml
<task>
Run a focused codebase scan for one area, producing targeted documents in .planning/codebase/.
Accepts a --focus flag: tech, arch, quality, concerns, or tech+arch (default).
Spawns one gsd-codebase-mapper agent. Lightweight alternative to /gsd-map-codebase.
</task>
```

Drop `<purpose>` entirely. Move the "spawned by /gsd-scan" note into a `<system_note>` if it is needed at all. This satisfies §11 Action 3 (each instruction once) and §10 Action 1 (no redundant content).

---

### Rewrite 2: Add output format specification and quality bar to the agent prompt

**Current (Step 4):**

```
Task(
  prompt="Scan this codebase with focus: {focus}. Write results to .planning/codebase/. Produce only: {document_list}",
  subagent_type="gsd-codebase-mapper",
  model="{resolved_model}"
)
```

**Rewrite:**

Add a `<quality_bar>` tag before the `<process>` section defining what a well-formed document looks like per focus area, then reference it in the spawned agent prompt:

```xml
<quality_bar>
Each produced document must:
- Cover only what is directly observable in the codebase (no inferred or speculative content)
- Use h2 sections for each major component or concern
- Include file paths when referencing code locations
- Stay under 400 lines per document

Per-focus standards:
- STACK.md: enumerate runtime dependencies with version constraints from package manifests; note any pinned vs. range versions
- ARCHITECTURE.md: describe top-level module boundaries and their communication patterns; include a dependency direction summary
- CONVENTIONS.md: list observed naming, structure, and style patterns with at least one concrete code example per convention
- CONCERNS.md: each concern must include: what was observed, where (file path), and why it is a concern
</quality_bar>
```

Then update the agent prompt in Step 4:

```
Task(
  prompt="Scan this codebase with focus: {focus}. Write results to .planning/codebase/. Produce only: {document_list}. Apply the quality bar: {quality_bar_contents}",
  subagent_type="gsd-codebase-mapper",
  model="{resolved_model}"
)
```

This directly satisfies §22 Pattern 3 (output format specified upfront) and §1 Action 1c (quality bar explicit).

---

### Rewrite 3: Add `<audience>` to ground document purpose

**Add after `<task>`:**

```xml
<audience>
The developer who invoked /gsd-scan in an active coding session. They have domain knowledge
of the project but need a rapid, structured reference — not a tutorial. Documents are consumed
during planning and referenced when writing phase plans or reviewing architecture decisions.
</audience>
```

This satisfies §1 Action 2 and anchors the register and depth of every produced document. Without it, the mapper agent has no basis for calibrating detail level: a STACK.md written for a new team member reads differently from one written for the project author doing a quick architecture check.

---

## Overall Verdict

**Needs Work**

The command stub is appropriately thin — its YAML frontmatter is well-formed and the delegation pattern is sound. The workflow file has good structural bones: XML-tagged sections, a clear mapping table, and explicit conditional branching. However, the two highest-leverage gaps — the undefined output format for the spawned agent, and the missing quality bar — mean the command cannot reliably produce consistent output across runs or model versions. These are not polish issues; they are the core specification of what the command is supposed to produce, and they are absent. The redundancy across `<task>`, `<context>`, and `<purpose>` is a secondary but straightforward fix.
