# Prompt Critique: `commands/gsd/audit-fix.md`

**Date:** 2026-04-30
**Reviewer:** Prompt Engineering Critic (claude-sonnet-4-6)
**Guide version:** PROMPT_ENGINEERING_GUIDE_V09.md

---

## Context

The command file (`commands/gsd/audit-fix.md`) is a thin routing stub — it declares
frontmatter metadata and then delegates all content to an external workflow file
(`~/.claude/get-shit-done/workflows/audit-fix.md`). This critique evaluates both
layers together, since the command stub's only substantive job is to correctly
describe and route to the workflow. The workflow itself is the actual prompt content
the model receives.

---

## Strengths

### 1. Multi-Phase Workflow Structure (§16)

The workflow uses explicit `<step name="...">` tags to create cognitive phase
boundaries, consistent with §16's phase pattern. Steps are named, sequential, and
each completes before the next begins: `parse-arguments` → `run-audit` →
`classify-findings` → `present-classification` → `fix-loop` → `report`. This is
a strong structural choice.

### 2. Scenario-Based Branching with Explicit Conditions (§16)

The `--dry-run` branch is explicit: "If `--dry-run` was specified, stop here and
exit." The failure path in `fix-loop` is equally explicit: revert, log, halt. This
matches §16's guidance on scenario-based branching — multiple paths handled
explicitly rather than left to model inference.

### 3. Classification Heuristics with Uncertainty Handling (§14)

The `classify-findings` step enumerates distinct signal lists for auto-fixable vs.
manual-only with "When uncertain, always classify as manual-only." This is a valid
tie-breaking rule anchored to the domain's cost asymmetry (§5, tie-breaking
instructions) — where a false auto-fix is more costly than a false manual-only.

### 4. Concrete Output Format with Example (§7, §22 Pattern 3)

The `present-classification` step includes a filled markdown table example. The
`report` step includes a filled summary template. §22 Pattern 3 requires the output
structure be specified with an example before the model begins — both steps satisfy
this.

### 5. `<success_criteria>` Block (§1 Action 1)

The workflow closes with explicit success criteria — a direct encoding of §1's
"quality bar" component. The criteria are specific and testable: "Tests pass after
each committed fix", "Every commit message contains the finding ID", etc.

### 6. Tool Permission Scoping (§22 Pattern 9)

The frontmatter `allowed-tools` list is narrow and deliberate: Read, Write, Edit,
Bash, Grep, Glob, Agent, AskUserQuestion. No wildcard grants.

---

## Weaknesses

### 1. The Command Stub Adds No Value — It Is a Redundant Indirection Layer (§10, §11 Action 3)

The command file is 9 lines of prose wrapping a single `@include`. The `<objective>`
repeats content already in the workflow's `<purpose>`. The `<process>` tag says
"execute the workflow" — which is what the `@include` already does. This violates
§11 Action 3 ("State each instruction exactly once") and §10 Action 1 (remove
redundant content). The stub currently creates two authorship surfaces for the same
description, which will diverge over time.

The `<objective>` in the command file and the `<purpose>` + `<task>` in the workflow
file express the same intent three times. Per §10, this is unnecessary length that
degrades performance.

**Severity:** Medium. The redundancy is currently in sync, but it is a maintenance
liability with no compensating benefit.

### 2. No XML Tag Vocabulary Compliance — Mixed Tag Semantics (§4 Action 2)

The workflow uses `<step name="...">` as its primary structural unit, but the guide's
canonical tag vocabulary (§4, XML tag vocabulary table) specifies `<phase id="..."
name="...">` for named workflow stages. The `<step>` tag is not in the vocabulary,
which means it carries no shared semantic weight in a composed prompt system (§19).

Additionally, `<objective>` in the command file is not in the vocabulary. The correct
tag is `<task>` (primary instruction) or `<goal>` (overall objective in agent
decomposition). Using non-vocabulary tags reduces interoperability between modules
(§19 modularity principle).

**Severity:** Medium. The tags work functionally but undermine composability.

### 3. No Persona — Missing Role Identity for a Complex Autonomous Agent (§6)

The workflow describes an autonomous pipeline that classifies findings, spawns
executor agents, runs tests, reverts changes, and commits code. This is a high-stakes
agentic task with significant blast radius. §6 Action 1 says to assign a persona when
the task is complex and requires a specific decision-making voice. §22 Pattern 1
requires role identity scoped to the exact domain.

There is no persona at all. The model receives no framing about what kind of agent it
is, what its decision-making priorities are (e.g., "prefer false negatives over false
positives on auto-fixability"), or what register to use in its outputs. For a task
that halts entire pipelines on test failure, the agent's identity and risk posture
matter.

**Severity:** High. The absence of persona on an autonomous agent with irreversible
actions (commits, reverts) leaves risk posture implicit.

### 4. Constraint Permissions Are Implicit, Not Paired (§14)

The workflow instructs the agent to: run tests, spawn agents, commit to git, revert
files, and stop the pipeline. None of these actions are wrapped in `<constraints>`
with paired `<permitted>` / `<confirm_with_user>` / `<take_freely>` tags.

§14 requires every restriction to be paired with what IS permitted, stated equally
concretely. §15's reversibility framework specifically covers commits, reverts, and
agent spawning. The workflow's success criteria mention that "failed fixes are
reverted cleanly" — but the constraint scope for irreversible actions (git commits,
agent spawning) is never declared in the prompt.

The `allowed-tools` frontmatter covers tool-level permissions, but does not address
action-level permissions (e.g., "confirm before committing if > N files changed").

**Severity:** Medium.

### 5. `run-audit` Step Has Fragile Shell Logic Injected as Prompt Instruction (§8 Action 4)

The `run-audit` step includes a bash heredoc:
```bash
INIT=$(gsd-sdk query audit-uat 2>/dev/null || echo "{}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

This is runtime orchestration code injected into a prose instruction prompt. It
violates §8 Action 4 (trim all context to what is directly relevant) — the model
does not need to see this initialization logic; the framework handles it. If the
model interprets this as something to copy-paste into a bash call, behavior becomes
unpredictable. This belongs in the orchestration layer, not the prompt.

**Severity:** Low-Medium. Likely harmless if the model correctly identifies this as
context, but it is noise that could mislead.

---

## Specific Rewrites

### Rewrite 1: Collapse the Command Stub (addresses Weakness 1)

**Current command file (`commands/gsd/audit-fix.md`) body:**
```
<objective>
Run an audit, classify findings as auto-fixable vs manual-only, then autonomously fix
auto-fixable issues with test verification and atomic commits.

Flags:
- `--max N` — maximum findings to fix (default: 5)
- `--severity high|medium|all` — minimum severity to process (default: medium)
- `--dry-run` — classify findings without fixing (shows classification table)
- `--source <audit>` — which audit to run (default: audit-uat)
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/audit-fix.md
</execution_context>

<process>
Execute the audit-fix workflow from @~/.claude/get-shit-done/workflows/audit-fix.md end-to-end.
</process>
```

**Proposed replacement:**
```
@~/.claude/get-shit-done/workflows/audit-fix.md
```

The workflow already contains `<task>`, `<purpose>`, flag documentation, and
`<success_criteria>`. The stub's `<objective>` duplicates the workflow's `<purpose>`.
The `<process>` tag is a no-op instruction. Strip both; let the `@include` speak for
itself. The frontmatter (`argument-hint`, `allowed-tools`) is the only substantive
content in the stub and should be preserved.

---

### Rewrite 2: Add a Domain-Scoped Persona (addresses Weakness 3)

Add at the top of the workflow (before `<process>`):

```xml
<persona>
You are an autonomous audit-fix agent. Your job is to find and fix only what is
certain — not to maximize fix count.

When classifying a finding, your default answer is manual-only. Reclassify to
auto-fixable only when all three conditions hold: a specific file is referenced, the
change is a single-file edit, and the expected behavior after the fix is unambiguous.

A test failure means the codebase state is unknown. Stop the pipeline immediately
and do not attempt further fixes.
</persona>
```

This encodes the agent's risk posture explicitly (§6 reframe pattern: "your job is
not to maximize fixes — it's to fix only what is safe to fix"), matches §22 Pattern
1 (role scoped to exact domain), and eliminates ambiguity about how to resolve
uncertainty at the boundary between auto-fixable and manual-only.

---

### Rewrite 3: Add Structured Constraints Block (addresses Weakness 4)

Add after `<persona>`, before `<process>`:

```xml
<constraints>
  <take_freely>
    - Read any file in the repository
    - Run tests (npm test, pytest, etc.)
    - Run read-only git commands (git status, git diff, git log)
    - Spawn executor agents for auto-fixable findings
    - Stage and commit files for findings that pass tests
    - Revert changed files when tests fail (git checkout --)
  </take_freely>

  <confirm_with_user>
    - Committing changes that touch more than 5 files in a single finding fix
    - Any change that modifies configuration, environment, or dependency files
  </confirm_with_user>

  <reserved_for_human_review>
    - All manual-only findings — surface these in the final report; do not attempt fixes
    - Any finding where classification is uncertain — err on manual-only
  </reserved_for_human_review>
</constraints>
```

This converts the implicit action permissions into explicit paired constraints per
§14, and applies the reversibility framework from §15 to the specific actions this
agent takes.

---

## Overall Verdict

**Adequate — with one High-severity gap.**

The workflow layer is structurally competent: multi-phase steps, explicit branching,
concrete output formats, working classification heuristics, and a `<success_criteria>`
block. These satisfy §16, §7, and §1's quality bar component.

The command stub is redundant overhead that violates §10 and §11, but it is a
maintenance problem, not a functional one.

The critical gap is the absence of a persona on an autonomous agent that makes
irreversible decisions (git commits, agent spawning, pipeline halts). For a tool
with this blast radius, the agent's risk posture must be declared explicitly —
implicit defaults produce inconsistent behavior at the exact decision boundaries
that matter most. Adding the 9-line persona block in Rewrite 2 would close this gap.
