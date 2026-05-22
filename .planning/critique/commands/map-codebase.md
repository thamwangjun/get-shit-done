# Critique: `commands/gsd/map-codebase.md`

Reviewed against: Prompt Engineering Guide V09
Date: 2026-04-30

---

## Strengths

### §17 Agent and Subagent Patterns — Parallel spawning pattern is present and correct

The `<process>` block specifies spawning 4 parallel mapper agents in a single pass and collecting only confirmations (not document contents). This matches the guide's pattern exactly:

> "spawn one background agent per work unit... Launch them all in a single message block so they run in parallel."
> "Subagent output is terse (for the orchestrating model)."

The orchestrator-collects-confirmations design is the right call for keeping context usage minimal — this reflects a genuine understanding of §17's intent.

### §16 Multi-Phase Workflows — Process is sequenced into explicit steps

The `<process>` block defines 7 numbered steps with clear sequencing and dependencies (check → create → spawn → wait → verify → commit → offer next steps). This follows §16's phase pattern principle: "Phases create cognitive boundaries. The model completes one phase fully before beginning the next."

### §1 Task Specification — Quality bar is represented via `<success_criteria>`

The `<success_criteria>` block uses a checkbox list that makes completeness verifiable rather than vague. The guide's Action 1 asks for an explicit quality bar — this block provides one, even if it's underspecified (see Weaknesses).

### §19 Modularity and Composition — `<when_to_use>` states both inclusions and exclusions

The `<when_to_use>` section enumerates both when to use and when to skip the command. This matches §19's explicit scope boundary pattern:

> "state both what to include and what falls outside scope with equal specificity"

This is the clearest application of guide principles in the file.

---

## Weaknesses

### Issue 1: §4 Formatting — No XML tag structure; prose and markdown headers used instead

The file mixes XML-style tags (`<objective>`, `<process>`) with plain markdown bold (`**Load project state if exists:**`, `**Use map-codebase for:**`) and a raw `@` file-include directive. This violates §4 Action 2 directly:

> "Use XML tags to separate prompt sections... This is strictly better than markdown headers or `---` delimiters for Claude-class models."

Specific violations:
- The `<context>` block uses markdown bold headers for sub-sections instead of named child tags (e.g., `<project_state_check>`, `<invocation_timing>`).
- `<when_to_use>` is a custom tag but its content is pure markdown bullet lists. The guide recommends `<include>` / `<exclude>` child tags inside a `<scope>` wrapper (§19).
- `<objective>` is not a tag from the guide's vocabulary. The correct top-level tag is `<task>` (§4, XML tag vocabulary table).
- `<execution_context>` with a bare `@` path reference is opaque — its semantics are undefined inside the prompt itself.

### Issue 2: §6 Persona Assignment — No persona assigned despite the guide requiring one for orchestrator agents

This is an orchestrator command that makes decisions (when to spawn, what to verify, what to offer next). The guide's §6 role-domain mapping table gives an explicit example for this case:

> "Exploration → 'File search specialist. You excel at thoroughly navigating and exploring codebases.'"

No `<persona>` block exists. For an orchestrator role, the guide recommends a specific identity that constrains decision register — e.g., a codebase mapping coordinator rather than a generic assistant. The absence means the model defaults to generic assistant behavior at every decision point.

The guide also recommends enumerating strengths explicitly (§6 "Strengths listing"):
```xml
<persona>
Your strengths:
- Spawning and coordinating parallel subagents
- Synthesizing high-level confirmation signals without reading full output
- Verifying file-system outcomes via line counts and existence checks
</persona>
```

### Issue 3: §1 Task Specification — Audience is absent; quality bar is underspecified

§1 Action 2 requires the audience to be encoded explicitly in the prompt. The command has no `<audience>` tag and no inference of who consumes the output (a developer onboarding to a brownfield codebase? A GSD orchestrator routing to the next command?).

§1 Action 1 also asks for what a correct high-quality response looks like. The `<success_criteria>` block specifies only that 7 documents exist — it says nothing about what quality those documents must meet, what makes a bad mapping versus a good one, or how to handle partial failures (3 of 4 agents complete). This is a structural gap, not just a missing field.

Additionally, `<success_criteria>` uses a markdown checkbox list (`- [ ]`) rather than a `<quality_bar>` tag as specified in §1:
```xml
<quality_bar>{what makes a good response — format, length, focus}</quality_bar>
```

### Issue 4: §5 Instruction Framing — Negative instructions present without positive conversion

The `<when_to_use>` section includes:
- "Skip map-codebase for: Greenfield projects with no code yet (nothing to map)"
- "Skip map-codebase for: Trivial codebases (<5 files)"

§5 Action 1 requires converting negative instructions to positive equivalents:
> "Before emitting any prompt, scan for negated instructions... Rewrite each as a positive specification of the desired behavior."

These "skip" instructions should be reframed as the positive condition under which the command applies.

### Issue 5: §14 Constraint Enforcement — No `<constraints>` block; tool permissions are unscoped

The frontmatter lists `allowed-tools` but the prompt body has no `<constraints>` block defining what the orchestrator may and may not do. Per §14, every restriction should be paired with an equally concrete permission statement. Per §17 and Pattern 9, tool permissions should be scoped to minimum required patterns.

`Write` is listed in `allowed-tools`, but based on the stated design ("The orchestrator only receives confirmations, keeping context usage minimal") the orchestrator should not write documents directly — that's delegated to agents. If `Write` is included only for the directory creation step, the constraint should say so explicitly.

---

## Specific Rewrites

### Rewrite 1: Replace `<objective>` with `<task>` and add `<persona>` + `<audience>`

Current:
```xml
<objective>
Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.
...
</objective>
```

Rewrite:
```xml
<persona>
You are a codebase mapping coordinator. Your role is to spawn and direct parallel mapper agents,
verify their output exists and meets structure requirements, and surface a clear next-step to the user.

Your strengths:
- Coordinating parallel subagents without reading their full output
- Verifying filesystem outcomes via existence checks and line counts
- Routing the user to the correct next GSD command based on project state
</persona>

<task>
Analyze the existing codebase by spawning 4 parallel gsd-codebase-mapper agents. Each agent
writes documents directly to .planning/codebase/. Collect only confirmations — do not read
document contents. Verify all 7 documents exist, then commit and offer next steps.
</task>

<audience>
A developer onboarding to an unfamiliar or brownfield codebase, or refreshing an existing
codebase map before a planning or refactoring session.
</audience>
```

### Rewrite 2: Replace `<when_to_use>` with `<scope>` using `<include>` / `<exclude>` child tags and convert negative instructions to positive

Current:
```xml
<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization...
**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>
```

Rewrite:
```xml
<scope>
  <include>
    - Brownfield projects before initialization (understand existing code first)
    - Refreshing the codebase map after significant changes
    - Onboarding to an unfamiliar codebase
    - Before major refactoring (establish current state baseline)
    - When STATE.md references outdated codebase info
  </include>

  <exclude>
    - Greenfield projects: run /gsd-new-project first, then map-codebase after code exists
    - Codebases with fewer than 5 files: use /gsd-scan for lightweight assessment instead
  </exclude>
</scope>
```

The `<exclude>` entries are rewritten as positive redirections (what to do instead), not just stop signals.

### Rewrite 3: Replace `<success_criteria>` with a `<quality_bar>` tag and add partial-failure handling

Current:
```xml
<success_criteria>
- [ ] .planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>
```

Rewrite:
```xml
<quality_bar>
A successful run produces all 7 documents in .planning/codebase/ with non-trivial content
(each file must exceed 20 lines). The orchestrator confirms via line count — not by reading
content.

Partial failure handling:
- If 1–2 agents fail: report which documents are missing, re-spawn those agents only.
- If 3+ agents fail: abort, report the failure, and ask the user to re-run the command.
- If documents exist but are empty (0 lines): treat as failure, re-spawn the responsible agent.

Success is confirmed when: all 7 files exist, each exceeds 20 lines, and the commit completes.
</quality_bar>
```

---

## Overall Verdict

**Needs Work**

The command demonstrates structural awareness (parallel agents, confirmation-only orchestration, explicit scope boundaries) but fails on three foundational guide requirements: no persona for the orchestrating agent (§6), no audience specification (§1), and widespread use of markdown formatting where XML tags are required (§4). The quality bar is present in spirit but too thin to be actionable — it says "documents follow template structure" without defining what structure compliance means or how to recover from partial failure. These are not cosmetic issues; each directly degrades the consistency and reliability of the command's output.
