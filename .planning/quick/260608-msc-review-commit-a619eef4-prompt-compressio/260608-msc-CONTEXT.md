---
name: 260608-msc-context
description: Discussion decisions for execute-phase.md compression fidelity review
metadata:
  type: project
---

# Quick Task 260608-msc: execute-phase.md fidelity restoration - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Task Boundary

Commit a619eef4 compressed `get-shit-done/workflows/execute-phase.md` from ~1722 to ~704 lines (~59% reduction). A thorough fidelity analysis identified 17 semantic/operational losses. This task restores them using compressed prose — smallest possible line additions that preserve correctness.

</domain>

<decisions>
## Implementation Decisions

### Scope
Restore all 17 identified losses (Critical + High + Medium severity).

### Writing style
Compressed prose: restore the semantics, not the wordcount. Match the style of the post-compression file. No verbatim copy-paste of original walls of text.

### Agent list descriptions
Restore one-line descriptions next to each agent name in `<available_agent_types>`.

### Priority order for applying changes
Apply in document order (top to bottom), not by severity tier.

### Claude's Discretion
- Exact wording of restored prose (must match compressed file's register)
- Whether to inline short restorations or add sub-bullets
- Grouping of closely-related losses into a single edit if it reduces total diff size

</decisions>

<specifics>
## Specific Losses to Restore (17 items)

### Critical (restore first)
1. **`response_language` injection** — In `initialize` step: "If `response_language` is set: include `response_language: {value}` in all spawned subagent prompts." Parse JSON must include `response_language`.
2. **Per-plan worktree dispatch gate** — In `execute_waves`, dispatch must gate on `USE_WORKTREES_FOR_PLAN` (per-plan), NOT project-level `USE_WORKTREES`. Original: "The dispatch branches MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`."
3. **REQUIRED ORDER truncation risk** — In executor spawn prompt: "No text between Write and commit (truncation risk; #2070 rescue is not primary defense)."
4. **Copilot fallback parallel-with-spot-check** — In `runtime_compatibility`: Copilot can attempt parallel spawning when user explicitly requests it — but rely on spot-check fallback (commits visible + SUMMARY.md exists) to detect completion.
5. **Worktree cleanup "when to skip"** — Restore the three conditions under which worktree cleanup is skipped.

### High
6. **Submodule per-plan justification** — Why per-plan worktree decisions exist: avoids blanket disabling that penalizes unrelated plans. Reference that decision flows into `execute_waves`.
7. **Quota-exceeded routing specifics** — "Do not offer 'retry now'. Run spot-check first; if SUMMARY.md missing but commits exist, route to safe-resume instead of immediate redispatch."
8. **Dirty working tree warning in cross-AI** — After cross-AI failure: warn about uncommitted changes before retry. "Review `git status` and `git diff` before proceeding."
9. **TDD `--force-mvp-gate` escape hatch** — Document `/gsd execute-phase {phase} --force-mvp-gate` in TDD review section. Clarify: violations are blocking under MVP+TDD=true, advisory otherwise.

### Medium
10. **Heartbeat interval vs. threshold distinction** — Two separate config values: `EXECUTOR_STALL_INTERVAL_MINUTES` (how often to poll) vs. `EXECUTOR_STALL_THRESHOLD_MINUTES` (how long with no activity before pausing). Restore the distinction in wait-for-agents section.
11. **Reference file purpose annotations** — In executor prompt `<reference_usage>`: restore when to consult each file (executor-examples.md for deviations/checkpoints, checkpoints.md for checkpoint tasks, tdd.md for TDD tasks, summary.md template for SUMMARY.md structure).
12. **Worktree auto-detection mechanism** — In executor spawn note: execute-plan.md detects worktree mode via `.git` being a file (not a directory), then skips STATE.md/ROADMAP.md updates automatically.
13. **HUMAN-UAT.md structure** — In verify_phase_goal / human_needed path: restore the 3-step flow (persist UAT items, commit, present to user) and the file structure fields downstream tools depend on.
14. **Auto-mode checkpoint type specifics** — In checkpoint_handling auto-mode: human-verify → spawn with `user_response="approved"`; decision → spawn with first option; human-action → cannot be automated (auth gates).
15. **Interactive mode presenter format** — Restore exact format: `## Plan {id}: {name} | Objective: ... | Tasks: N | Options: Execute / Review first / Skip / Stop` and the "Review first" re-ask flow.
16. **Schema drift false-positive explanation** — Restore: schema drift gate prevents false-positive verification (build/types pass but database out of sync). Include "recommended" guidance in option text.
17. **Offer_next command suggestion recommendations** — Restore "← recommended if no CONTEXT.md" markers, case distinction (CONTEXT.md exists vs. doesn't), and caveat that `/gsd-transition` is not a real command.

</specifics>

<canonical_refs>
## Canonical References

- Pre-compression version: `git show a619eef4^:get-shit-done/workflows/execute-phase.md`
- Post-compression version: `get-shit-done/workflows/execute-phase.md` (current HEAD)
- Compression commit: `a619eef4`
</canonical_refs>
