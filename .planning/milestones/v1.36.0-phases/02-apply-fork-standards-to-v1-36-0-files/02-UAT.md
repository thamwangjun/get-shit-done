---
status: complete
phase: 02-apply-fork-standards-to-v1-36-0-files
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-04-16T06:52:08Z
updated: 2026-04-16T06:55:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Negative-Framing Scanner Passes
expected: Run `node --test tests/negative-framing-scan.test.cjs`. All 34 files pass with 0 violations. No new scanner failures introduced by phase 02 changes.
result: pass

### 2. Agent Frontmatter Tests Pass
expected: Run `node --test tests/agent-frontmatter.test.cjs`. All 135 agent frontmatter checks pass — no YAML broken by edits.
result: issue
reported: "134/135 — discuss-phase.md spawns gsd-advisor-researcher but has no <available_agent_types> section — after /clear, orchestrator may fall back to general-purpose (#1357)"
severity: major

### 3. graphify.md — STOP Line Removed
expected: Open `commands/gsd/graphify.md`. The line `STOP -- DO NOT READ THIS FILE` is absent. The file should contain `Display results and stop.`, `Display status and stop.`, and `Display diff and stop.` instead of the old `**STOP** after displaying X. Do not spawn an agent.` patterns.
result: pass

### 4. Global Agent Boilerplate Replaced
expected: Run `grep -r "Do NOT load full" agents/`. Zero matches returned. Run `grep -r "Load specific agent files only" agents/`. Exactly 13 matches returned — one in each of: gsd-code-fixer.md, gsd-codebase-mapper.md, gsd-debugger.md, gsd-doc-verifier.md, gsd-doc-writer.md, gsd-executor.md, gsd-code-reviewer.md, gsd-intel-updater.md, gsd-integration-checker.md, gsd-eval-auditor.md, gsd-nyquist-auditor.md, gsd-pattern-mapper.md, gsd-security-auditor.md.
result: pass

### 5. gsd-advisor-researcher.md — Affirmative Language
expected: Open `agents/gsd-advisor-researcher.md`. Three affirmative replacements should be present: (1) `Scope research to the single assigned gray area only`, (2) `Use qualitative labels (Low / Medium / High) in the Complexity column — omit time estimates`, (3) `Limit analysis output to the single rationale paragraph — write the table and stop`. None of the old `Do NOT` forms present.
result: pass

### 6. execute-phase.md and verify-work.md — Affirmative Language
expected: Open `get-shit-done/workflows/execute-phase.md`. Lines that previously said `Do NOT run phase verification` and `Do NOT mark the phase complete` should now read `Proceed to the next step — phase verification is handled separately` and `Leave ROADMAP.md and STATE.md unchanged — the orchestrator handles that update`. In `get-shit-done/workflows/verify-work.md`, the line previously saying `Do NOT add commentary before or after the block.` should now read `Output the block only — omit all commentary before and after.`
result: pass

### 7. discuss-phase.md — Affirmative Language
expected: Open `get-shit-done/workflows/discuss-phase.md`. The line previously reading `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.` should now read `When "Other" is selected with empty text, accept the input and proceed.`
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "All 135 agent frontmatter checks pass after phase 02 edits"
  status: failed
  reason: "134/135 — discuss-phase.md spawns gsd-advisor-researcher but has no <available_agent_types> section — after /clear, orchestrator may fall back to general-purpose (#1357)"
  severity: major
  test: 2
  root_cause: "discuss-phase.md spawns gsd-advisor-researcher at line 594 via subagent_type= but has no <available_agent_types> section; test #1357 requires any workflow spawning a named agent to declare it so the orchestrator doesn't fall back to general-purpose after /clear"
  artifacts:
    - path: "get-shit-done/workflows/discuss-phase.md"
      issue: "missing <available_agent_types> section"
  missing:
    - "Add <available_agent_types> block after </required_reading> (line 21), listing gsd-advisor-researcher"
  debug_session: ""
