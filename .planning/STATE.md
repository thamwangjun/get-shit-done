---
gsd_state_version: 1.0
milestone: v2.1.0-f
milestone_name: Testing Coverage Gaps
status: executing
last_updated: "2026-06-07T07:18:21.064Z"
last_activity: 2026-06-07 -- Phase 59 execution started
progress:
  total_phases: 18
  completed_phases: 0
  total_plans: 1
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-07 after v2.1.0-f milestone start)

**Core value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships
**Current focus:** Phase 59 — comment-cleanup

## Current Position

Phase: 59 (comment-cleanup) — EXECUTING
Plan: 1 of 1
Status: Executing Phase 59
Last activity: 2026-06-07 -- Phase 59 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 134 (prior milestones)
- Average duration: — (metrics not retroactively enabled for completed phases)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- [v2.1.0-f roadmap]: 5-phase risk-ordered sequence: comment deletion → effort wiring (pure append) → submodule exclusion → rubric inlining → security test rewrite. Front-loads zero-risk changes; SFC-01 goes last because it is the only mutation that changes an existing test from skipped to active.
- [v2.1.0-f roadmap]: EWC-04 (code-review-fix.md) and EWC-07 (ingest-docs.md) each need assertions for TWO agents — four tokens each, not two.
- [v2.1.0-f roadmap]: WSC-01 assertions must be scoped within the `<task_commit_protocol>` XML block slice (not full file) to prevent vacuous passes from documentation text.
- [v2.1.0-f roadmap]: GAP-K and GAP-M2 are one physical location (lines 133–139 of debug-session-management.test.cjs) — treated as one phase (SFC-01, Phase 63).

### Plan-Time Verification Flags

- **Phase 60 (EWC-04/EWC-07):** Keep `read()` call inside each individual `test()` block to prevent copy-paste errors where the wrong agent name is asserted for the wrong file.
- **Phase 61 (WSC-01):** Slice from `executorSrc.indexOf('<task_commit_protocol>')` to `executorSrc.indexOf('</task_commit_protocol>')` before asserting — do not search the full file.
- **Phase 63 (SFC-01):** Replace both the `{ skip: '...' }` option and the `DATA_START` assertion body in one edit; removing the skip alone while keeping the stale assertion produces an immediate hard FAIL.

### Key Risk

SFC-01 (Phase 63) is the only edit that changes test status from skipped to active. If any earlier phase introduces a failure, it is attributable to that phase alone — not Phase 63 — because the sequence is strictly ordered.

### Coverage

All 11 v2.1.0-f requirements mapped to Phases 59–63; each maps to exactly one phase. No orphans, no duplicates.

### Pending Todos

None.

### Blockers/Concerns

None. Research is HIGH confidence across all five phases.

## Session Continuity

Last activity: 2026-06-07 — Roadmap written for v2.1.0-f
Stopped at: Phase 59 context gathered
Resume file: .planning/phases/59-comment-cleanup/59-CONTEXT.md

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-06-06:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 52: 52-UAT.md (testing, 0 pending scenarios) | deferred |
| quick_task | 260529-dxz-address-phase-45-and-phase-46-tech-debts | unknown |
| quick_task | 260529-inw-compare-test-suite-of-current-branch-vs- | unknown |
| quick_task | 260529-nyk-revert-observability-layer-to-v1-01-0 | unknown |
| quick_task | 260530-6ks-investigate-3-test-failures-isinstalleda | unknown |
| quick_task | 260530-6xt-investigate-failing-test-import-command- | unknown |
| quick_task | 260530-710-fix-the-regex-with-option-a | unknown |
| quick_task | 260530-e5j-update-roadmap-letter-suffix-scope | unknown |
| quick_task | 260531-mg7-convert-eta-includes-of-summary-md-and-t | unknown |
| quick_task | 260531-mvd-replace-dead-context-window-ternary-gate | unknown |
| quick_task | 260531-ncu-address-intg-02-test-exclusion-list-todo | unknown |
| quick_task | 260601-bfj-root-cause-and-fix-the-flaky-scaffolds-c | unknown |
| quick_task | 260603-execute-phase-context-analysis | missing |
| quick_task | 260604-qzi-harden-gsd-quick-skill-against-orchestra | unknown |
| quick_task | 260604-r78-fix-brittle-anchor-in-research-phase-pro | unknown |
| quick_task | 260604-so1-fix-mktemp-bsd-gnu-incompatibility-in-qu | unknown |
| quick_task | 260604-swm-fix-mktemp-bsd-gnu-bug-in-ship-md-and-ad | unknown |
| quick_task | 260604-tev-fix-gsd-quick-losing-summary-md-in-workt | unknown |
| quick_task | 260606-tbq-fix-3-sdk-effort-resolution-gaps-in-sdk- | unknown |
| quick_task | 260606-vf5-fix-v2-1-0-e-audit-gaps-expose-03-sdk-co | unknown |
