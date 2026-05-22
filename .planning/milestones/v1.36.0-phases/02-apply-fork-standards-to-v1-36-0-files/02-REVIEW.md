---
phase: 02-apply-fork-standards-to-v1-36-0-files
reviewed: 2026-04-15T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - agents/gsd-advisor-researcher.md
  - agents/gsd-ai-researcher.md
  - agents/gsd-code-fixer.md
  - agents/gsd-code-reviewer.md
  - agents/gsd-codebase-mapper.md
  - agents/gsd-debug-session-manager.md
  - agents/gsd-debugger.md
  - agents/gsd-doc-verifier.md
  - agents/gsd-doc-writer.md
  - agents/gsd-domain-researcher.md
  - agents/gsd-eval-auditor.md
  - agents/gsd-executor.md
  - agents/gsd-integration-checker.md
  - agents/gsd-intel-updater.md
  - agents/gsd-nyquist-auditor.md
  - agents/gsd-pattern-mapper.md
  - agents/gsd-phase-researcher.md
  - agents/gsd-security-auditor.md
  - commands/gsd/graphify.md
  - get-shit-done/workflows/discuss-phase.md
  - get-shit-done/workflows/eval-review.md
  - get-shit-done/workflows/execute-phase.md
  - get-shit-done/workflows/verify-work.md
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

These files are agent and workflow definitions — the source code for the GSD meta-prompting framework. Review focused on correctness of agent contracts, spawn patterns, instruction consistency, and adherence to project-enforced conventions from `agent-frontmatter.test.cjs`.

All 135 existing tests pass against these files. The issues identified here are bugs and inconsistencies that testing does not yet catch, plus code quality concerns around duplicated documentation patterns.

The most significant issues are: (1) `eval-review.md` spawning `gsd-eval-auditor` using the legacy agent-file-read pattern rather than `subagent_type=`, which bypasses agent capability scoping and post-`/clear` recovery; and (2) `discuss-phase.md` spawning `gsd-advisor-researcher` as `general-purpose` with a `@`-prefixed agent read instruction that escapes the banned-pattern test by one character.

## Warnings

### WR-01: eval-review workflow uses legacy agent-read spawn pattern

**File:** `get-shit-done/workflows/eval-review.md:81`
**Issue:** The workflow builds a subagent prompt containing `Read ~/.claude/agents/gsd-eval-auditor.md for instructions.` and then says "Spawn as Task with model `AUDITOR_MODEL`" — but the Task call omits `subagent_type`. This means the orchestrator spawns a `general-purpose` agent that reads its own agent file at startup instead of using the named `gsd-eval-auditor` type. Post-`/clear`, Claude Code loses the agent context loaded from the agent file reference, causing silent capability degradation. The test at `tests/agent-frontmatter.test.cjs:112` checks for the string `First, read ~/.claude/agents/gsd-` but this file uses `Read ~/.claude/agents/gsd-` (without "First,"), so it escapes test coverage.
**Fix:** Replace the prose spawn instruction with an explicit Task call using `subagent_type="gsd-eval-auditor"` and move the agent-file content into the prompt via a `<files_to_read>` block, consistent with how `execute-phase.md` and `verify-work.md` spawn their agents:
```markdown
Task(
  prompt="""
<files_to_read>
- ~/.claude/agents/gsd-eval-auditor.md
- {summary_paths}
- {plan_paths}
- {ai_spec_path if exists}
</files_to_read>

<input>
ai_spec_path: {ai_spec_path or "none"}
phase_dir: {phase_dir}
phase_number: {phase_number}
phase_name: {phase_name}
padded_phase: {padded_phase}
state: {A or B}
</input>
""",
  subagent_type="gsd-eval-auditor",
  model="{AUDITOR_MODEL}",
  description="Eval audit for Phase {phase_number}"
)
```

---

### WR-02: discuss-phase workflow spawns gsd-advisor-researcher as general-purpose

**File:** `get-shit-done/workflows/discuss-phase.md:596`
**Issue:** The `spawn_advisor_researchers` step spawns `gsd-advisor-researcher` with `subagent_type="general-purpose"` and uses `First, read @~/.claude/agents/gsd-advisor-researcher.md for your role and instructions.` in the prompt body. The `@`-prefix bypasses the test at `tests/agent-frontmatter.test.cjs:112` (which checks for the `~`-prefixed form without `@`), but the underlying problem is identical: the agent runs as general-purpose rather than under its declared tool permissions (`Read, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*`). This means tool restrictions from the agent frontmatter are not applied, and the advisor can access tools it should not have.
**Fix:** Replace `subagent_type="general-purpose"` with `subagent_type="gsd-advisor-researcher"` and remove the `First, read` instruction — the subagent_type mechanism loads agent context automatically:
```markdown
Task(
  prompt="<gray_area>{area_name}: {area_description}</gray_area>
<phase_context>{phase_goal}</phase_context>
<project_context>{project_name and description}</project_context>
<calibration_tier>{calibration_tier}</calibration_tier>

Research this gray area and return a structured comparison table with rationale.
${AGENT_SKILLS_ADVISOR}",
  subagent_type="gsd-advisor-researcher",
  model="{ADVISOR_MODEL}",
  description="Research: {area_name}"
)
```

---

### WR-03: eval-review workflow missing available_agent_types section

**File:** `get-shit-done/workflows/eval-review.md:1-156`
**Issue:** `eval-review.md` spawns a named GSD subagent (`gsd-eval-auditor`) but has no `<available_agent_types>` section. The test at `tests/agent-frontmatter.test.cjs:155-196` requires every workflow that uses `subagent_type=` to list those agents in `<available_agent_types>`. However, because `eval-review.md` currently uses the prose spawn pattern (no `subagent_type=`), the test does not catch this — fixing WR-01 would immediately surface this as a test failure. This must be addressed together with WR-01.
**Fix:** After adding `subagent_type="gsd-eval-auditor"` (WR-01 fix), add the required section:
```markdown
<available_agent_types>
- gsd-eval-auditor — Scores eval dimension coverage, writes EVAL-REVIEW.md
</available_agent_types>
```

---

## Info

### IN-01: Context7 method name inconsistency in tool_strategy section of gsd-advisor-researcher

**File:** `agents/gsd-advisor-researcher.md:122`
**Issue:** The `<tool_strategy>` section at line 122 documents the Context7 flow as: `2. mcp__context7__query-docs with resolved ID + specific query`. However, the `<documentation_lookup>` section at line 33 correctly uses `mcp__context7__get-library-docs`. The two names refer to different tool endpoints. Using `mcp__context7__query-docs` (which is not the canonical name) could cause the agent to call a nonexistent tool when following the tool_strategy section rather than the documentation_lookup section. The same inconsistency exists in `gsd-phase-researcher.md:173`.
**Fix:** Change `mcp__context7__query-docs` to `mcp__context7__get-library-docs` in the tool_strategy sections of both agents to match the documentation_lookup section and all other agents in the codebase.

---

### IN-02: discuss-phase workflow missing available_agent_types section

**File:** `get-shit-done/workflows/discuss-phase.md:1`
**Issue:** `discuss-phase.md` spawns `gsd-planner` via `subagent_type="gsd-planner"` (inferred from the power-mode path referencing planner, and confirm at line 596 where `general-purpose` is used for advisor). Checking the full workflow, no `<available_agent_types>` section is present even though multiple named agents are spawned. After a `/clear`, the orchestrator may fall back to `general-purpose` for agents not listed, silently breaking capabilities. This is the same class of issue as WR-03.
**Fix:** Add an `<available_agent_types>` section listing all spawned agent types (at minimum `gsd-advisor-researcher`, and any others spawned in power-mode/chain paths).

---

### IN-03: gsd-intel-updater has empty hooks comment with no content

**File:** `agents/gsd-intel-updater.md:6`
**Issue:** The frontmatter contains `# hooks:` with no trailing placeholder comment block (unlike all other write-capable agents which have a commented `PostToolUse` block). While this technically passes the test (which only checks for `# hooks:` presence), it provides no copy-paste starting point for future hook configuration, inconsistent with the pattern established in every other file-writing agent.
**Fix:** Add the standard commented hooks template to match the project convention:
```yaml
# hooks:
#   PostToolUse:
#     - matcher: "Write|Edit"
#       hooks:
#         - type: command
#           command: "echo 'intel updated' 2>/dev/null || true"
```

---

## Gap Closure Review (02-04)

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** quick
**Scope:** Gap closure — verify `<available_agent_types>` block inserted into `get-shit-done/workflows/discuss-phase.md`
**Addresses:** IN-02 from initial review (missing `<available_agent_types>` section)

### Assessment: PASS — block is well-formed and correctly placed

The 5-line `<available_agent_types>` block was inserted at lines 23-26, between `</required_reading>` (line 21) and `<downstream_awareness>` (line 28), with a blank line on each side. Checks performed:

**Placement:** Correct. The block sits immediately after `</required_reading>` and before `<downstream_awareness>`, consistent with the placement convention used in other workflow files (e.g., `eval-review.md` after its fix).

**Tag well-formedness:** Correct. Opening tag `<available_agent_types>` at line 23, closing tag `</available_agent_types>` at line 26, no extra whitespace or nesting issues.

**Agent name accuracy:** Correct. The block lists `gsd-advisor-researcher`, which exactly matches the `subagent_type="gsd-advisor-researcher"` at line 599 — the only named subagent spawned in this workflow.

**Description accuracy:** The listed description "Researches gray areas and returns structured comparison tables" accurately reflects the agent's role as documented in `agents/gsd-advisor-researcher.md`.

**Preamble line:** The block includes the standard preamble `Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):` at line 24, consistent with the project convention for this section.

**Residual note:** IN-02 from the initial review is now closed. WR-02 (the spawn using `subagent_type="general-purpose"` at line 599) was addressed separately and is confirmed fixed — line 599 now reads `subagent_type="gsd-advisor-researcher"`. The `<available_agent_types>` block correctly reflects this corrected spawn.

No new issues found in the gap closure change.

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard (initial) / quick (gap closure 02-04)_
