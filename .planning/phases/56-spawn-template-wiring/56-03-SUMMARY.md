---
phase: 56-spawn-template-wiring
plan: "03"
subsystem: spawn-templates
tags: [effort-wiring, group-b, spawn-sites, resolve-model-effort]
dependency_graph:
  requires: ["56-01"]
  provides: [group-b-effort-wiring]
  affects:
    - get-shit-done/workflows/audit-milestone.md
    - get-shit-done/workflows/debug.md
    - get-shit-done/workflows/docs-update.md
    - get-shit-done/workflows/scan.md
    - get-shit-done/workflows/secure-phase.md
    - get-shit-done/workflows/ui-phase.md
    - get-shit-done/workflows/ui-review.md
    - get-shit-done/workflows/validate-phase.md
    - get-shit-done/workflows/discuss-phase/modes/advisor.md
    - agents/gsd-debug-session-manager.md
tech_stack:
  added: []
  patterns: [resolve-model-effort-adjacent, effort-arg-carrier, legacy-jq-raw-override]
key_files:
  created: []
  modified:
    - get-shit-done/workflows/audit-milestone.md
    - get-shit-done/workflows/debug.md
    - get-shit-done/workflows/docs-update.md
    - get-shit-done/workflows/scan.md
    - get-shit-done/workflows/secure-phase.md
    - get-shit-done/workflows/ui-phase.md
    - get-shit-done/workflows/ui-review.md
    - get-shit-done/workflows/validate-phase.md
    - get-shit-done/workflows/discuss-phase/modes/advisor.md
    - agents/gsd-debug-session-manager.md
decisions:
  - "D-02 carrier confirmed: effort= Agent() argument used in all Group B spawn sites"
  - "scan.md resolved_model added: standalone resolve-model call added to define template variable that was previously unresolved"
  - "docs-update.md Option A: standalone resolve-model-effort call added; docs.cjs unchanged"
metrics:
  duration: ~20 minutes
  completed: 2026-06-04
  tasks_completed: 2
  tasks_total: 2
---

# Phase 56 Plan 03: Group B Effort Wiring Summary

Per-agent effort tokens wired into all 9 Group B standalone-resolve workflow files and the gsd-debug-session-manager.md agent orchestrator via `resolve-model-effort gsd-<agent> --raw` capture lines and `{<var>_effort_arg}` Agent() tokens.

## What Was Built

### Task 1: Wire --raw-form Group B workflows (7 files)

Added adjacent `resolve-model-effort` capture line and `{<var>_effort_arg}` Agent() token to:

- **audit-milestone.md**: `integration_checker_model_effort_arg` adjacent to `integration_checker_model` resolve; token in Agent() block
- **scan.md**: Added both `resolved_model` AND `resolved_model_effort_arg` shell assignments (the template variable `{resolved_model}` was previously undefined — no existing resolve-model call). Token in Agent() block
- **secure-phase.md**: `AUDITOR_MODEL_effort_arg` adjacent to `AUDITOR_MODEL` resolve; token in Agent() block
- **ui-phase.md**: `UI_RESEARCHER_MODEL_effort_arg` + `UI_CHECKER_MODEL_effort_arg` — both agents wired; tokens in both Agent() blocks
- **ui-review.md**: `UI_AUDITOR_MODEL_effort_arg` adjacent to `UI_AUDITOR_MODEL` resolve; token in Agent() block
- **validate-phase.md**: `AUDITOR_MODEL_effort_arg` adjacent to `AUDITOR_MODEL` resolve (gsd-nyquist-auditor); token in Agent() block
- **discuss-phase/modes/advisor.md**: `ADVISOR_MODEL_effort_arg` adjacent to `ADVISOR_MODEL` resolve; token in Agent() block (site missed by discuss-time grep)

### Task 2: Wire legacy-jq + docs-update sites (3 files)

- **debug.md**: `debugger_model_effort_arg` added in --raw form adjacent to jq-form resolve-model line; both Agent() blocks (continue + new session) carry the token. jq model line left unchanged per plan
- **gsd-debug-session-manager.md**: `debugger_model_effort_arg` added in --raw form adjacent to jq-form resolve; Agent() block carries token. YAML frontmatter (lines 1-12) untouched — body-only edit
- **docs-update.md**: standalone `doc_writer_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-doc-writer --raw)` added adjacent to docs-init call (Option A); all 10 Agent() `model="{doc_writer_model}"` sites carry `{doc_writer_model_effort_arg}` token via replace_all. docs.cjs unchanged

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| scan.md model resolve | Added standalone resolve-model call for gsd-codebase-mapper | Template var `{resolved_model}` was undefined — INIT loaded but no parse extraction; adding resolve-model + resolve-model-effort makes both shell vars available |
| docs-update.md | Option A (standalone call) | Per RESEARCH.md D-06 and plan action — no docs.cjs modification; standalone query is authoritative |
| docs-update.md replace_all | Replace all 10 model= occurrences atomically | All 10 Agent() blocks have identical `model="{doc_writer_model}",\n  run_in_background=true` pattern; replace_all safe |

## Verification

```
grep -rn "resolve-model-effort gsd-" <all 10 files>
→ 11 lines found (ui-phase.md has 2; all others have 1 each)

git status get-shit-done/bin/lib/docs.cjs → no change (Option A confirmed)

npm test → 3968 pass, 0 fail, 4 skipped
```

Fork gates confirmed: 3968 pass, 0 fail (agent-frontmatter, negative-framing, step-numbering, cross-file-refs gates all held).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] scan.md had undefined {resolved_model} template variable**

- **Found during:** Task 1 implementation
- **Issue:** scan.md referenced `{resolved_model}` in Agent() block but had no shell assignment for it. `init.map-codebase` emits `mapper_model` (not `resolved_model`), and no explicit resolve-model call existed. The template variable would be interpolated as literal `{resolved_model}` at runtime.
- **Fix:** Added `resolved_model=$($GSD_SDK query resolve-model gsd-codebase-mapper --raw)` line adjacent to (and immediately after) the INIT block, then added `resolved_model_effort_arg` on the next line per plan pattern.
- **Files modified:** get-shit-done/workflows/scan.md
- **Commit:** af9ae5ef

## Commits

| Task | Commit | Files |
|---|---|---|
| Task 1: Group B --raw-form workflows | af9ae5ef | audit-milestone.md, scan.md, secure-phase.md, ui-phase.md, ui-review.md, validate-phase.md, advisor.md |
| Task 2: Legacy-jq + docs-update | 6efcad09 | debug.md, gsd-debug-session-manager.md, docs-update.md |

## Known Stubs

None — all effort tokens are wired to live resolve-model-effort queries.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. Token values are enum-constrained by the Plan 01 query (T-56-B1 accepted per plan threat model).

## Self-Check: PASSED

- audit-milestone.md: `resolve-model-effort gsd-integration-checker` line present ✓
- scan.md: `resolve-model-effort gsd-codebase-mapper` line present ✓
- secure-phase.md: `resolve-model-effort gsd-security-auditor` line present ✓
- ui-phase.md: 2 resolve-model-effort lines (researcher + checker) present ✓
- ui-review.md: `resolve-model-effort gsd-ui-auditor` line present ✓
- validate-phase.md: `resolve-model-effort gsd-nyquist-auditor` line present ✓
- advisor.md: `resolve-model-effort gsd-advisor-researcher` line present ✓
- debug.md: `resolve-model-effort gsd-debugger` (--raw) present; jq line unchanged ✓
- gsd-debug-session-manager.md: `resolve-model-effort gsd-debugger` (--raw) present; frontmatter untouched ✓
- docs-update.md: `resolve-model-effort gsd-doc-writer` standalone capture present; docs.cjs unchanged ✓
- Commit af9ae5ef exists ✓
- Commit 6efcad09 exists ✓
