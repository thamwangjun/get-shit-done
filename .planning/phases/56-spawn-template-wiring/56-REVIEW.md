---
phase: 56-spawn-template-wiring
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - agents/gsd-debug-session-manager.md
  - get-shit-done/bin/gsd-tools.cjs
  - get-shit-done/bin/lib/commands.cjs
  - get-shit-done/bin/lib/core.cjs
  - get-shit-done/workflows/audit-milestone.md
  - get-shit-done/workflows/debug.md
  - get-shit-done/workflows/discuss-phase/modes/advisor.md
  - get-shit-done/workflows/docs-update.md
  - get-shit-done/workflows/execute-phase.md
  - get-shit-done/workflows/execute-plan.md
  - get-shit-done/workflows/map-codebase.md
  - get-shit-done/workflows/new-milestone.md
  - get-shit-done/workflows/new-project.md
  - get-shit-done/workflows/plan-phase.md
  - get-shit-done/workflows/quick.md
  - get-shit-done/workflows/scan.md
  - get-shit-done/workflows/secure-phase.md
  - get-shit-done/workflows/ui-phase.md
  - get-shit-done/workflows/ui-review.md
  - get-shit-done/workflows/validate-phase.md
  - get-shit-done/workflows/verify-work.md
  - tests/commands.test.cjs
  - tests/core.test.cjs
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 56: Code Review Report

**Reviewed:** 2026-06-04
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 56 wires reasoning-effort resolution into spawn sites. The implementation is broadly sound: `resolveReasoningEffortInternal` is correctly inserted, the new `cmdResolveModelEffort` handler and `resolve-model-effort` dispatch case match their analogs, init.cjs emits `*_effort` fields for every Group A workflow, and the parse/shell/Agent() wiring is consistent across the 20 spawn-site files. Tests cover the floor, inertness, inherit, and token-format cases.

No correctness-breaking defects were found. The findings are pattern deviations from the agreed spec (PATTERNS.md), a fragile shell guard discrepancy between Group B sites, define-after-use ordering in the agent prompt, and stale in-code line references. None block shipping, but several should be fixed for maintainability and to honor the phase's own uniformity goal.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Agent file uses `resolve-model | jq` instead of `resolve-model-effort`, diverging from the new command this phase added

**File:** `agents/gsd-debug-session-manager.md:98`
**Issue:** The whole point of phase 56 was to add the `resolve-model-effort` command so spawn sites stop hand-rolling effort extraction. Every other legacy-jp site (`debug.md:37`) was migrated to `resolve-model-effort --raw`, but the session-manager agent still does its own jq transform off `resolve-model`:
```bash
debugger_model_effort_arg=$(gsd-sdk query resolve-model gsd-debugger 2>/dev/null | jq -r 'if .effort then "effort=\"\(.effort)\"" else "" end' 2>/dev/null || echo "")
```
PATTERNS.md line 198 explicitly specifies the effort line for legacy jq sites as `resolve-model-effort gsd-debugger --raw`. This works today (resolve-model JSON includes `.effort`), but it duplicates the token-formatting logic the new command exists to centralize — a future change to token format must now be made in two places.
**Fix:** Replace with the standardized command, matching `debug.md:37`:
```bash
debugger_model_effort_arg=$(gsd-sdk query resolve-model-effort gsd-debugger --raw 2>/dev/null || echo "")
```

### WR-02: Group B `--raw` sites lack the failure guard that debug.md uses, risking an error string injected into the Agent() block

**File:** `get-shit-done/workflows/validate-phase.md:39` (also `ui-review.md:39`, `secure-phase.md:39`, `scan.md:56`, `ui-phase.md:52,54`, `audit-milestone.md:40`, `docs-update.md:31`, `discuss-phase/modes/advisor.md:41`)
**Issue:** These sites resolve the effort token with no error handling:
```bash
AUDITOR_MODEL_effort_arg=$($GSD_SDK query resolve-model-effort gsd-nyquist-auditor --raw)
```
whereas the legacy sites guard it (`debug.md:37`: `... --raw 2>/dev/null || echo ""`). If the SDK call fails (missing binary, parse error, non-zero exit), the unguarded sites leave the variable empty or, worse, capture stderr noise that then interpolates into `{AUDITOR_MODEL_effort_arg}` inside the `Agent()` call — producing a malformed spawn argument. The adjacent `resolve-model --raw` lines share the same exposure, so this is consistent with prior art, but the phase had the opportunity to harden the new lines and did not.
**Fix:** Append the same guard used at the legacy sites so a resolver failure degrades to an empty token rather than a malformed argument:
```bash
AUDITOR_MODEL_effort_arg=$($GSD_SDK query resolve-model-effort gsd-nyquist-auditor --raw 2>/dev/null || echo "")
```

### WR-03: Effort token interpolated in `Agent()` template before the bash block that defines it

**File:** `agents/gsd-debug-session-manager.md:90`
**Issue:** The `Agent()` template block (lines 86-93) interpolates `{debugger_model_effort_arg}` at line 90, but the bash that assigns it appears afterward at line 98, under the prose "Resolve the debugger model before spawning." An agent reading top-to-bottom sees the placeholder used before any instruction to compute it. Correctness depends on the agent honoring the prose ordering rather than the visual ordering. The other Group B workflows place the resolve block before the Agent() block; this file inverts it.
**Fix:** Move the bash resolve block (lines 95-99) above the `Agent()` template block, or add an explicit forward reference at line 90 (e.g. "token computed in the bash block below") so the define-before-use contract is unambiguous.

### WR-04: plan-phase.md describes effort-param derivation in prose only — no concrete shell assignment like sibling Group A workflows

**File:** `get-shit-done/workflows/plan-phase.md:59`
**Issue:** Every other Group A workflow (`execute-phase.md:90-91`, `quick.md:150-153`, `verify-work.md:57-58`, `new-project.md:81-83`, `new-milestone.md:242-244`, `map-codebase.md:91`) emits an explicit, copyable shell line:
```bash
planner_model_effort_arg=$([ -n "$planner_effort" ] && [ "$planner_effort" != "null" ] && echo "effort=\"$planner_effort\"" || echo "")
```
plan-phase.md instead only narrates it: "Then derive effort params: `researcher_effort_param` / `planner_effort_param` / `checker_effort_param` — each is `effort="<value>"` when the field is non-null, else `""`." It also uses a different variable suffix (`_effort_param` vs the `_effort_arg` used everywhere else). The prose leaves the empty/null handling to the agent to re-derive, and the naming inconsistency makes cross-file pattern-matching harder. This is the only Group A site that diverges on both counts.
**Fix:** Add the concrete shell block matching the siblings and rename to `*_effort_arg` for consistency:
```bash
researcher_effort_param=$([ -n "$researcher_effort" ] && [ "$researcher_effort" != "null" ] && echo "effort=\"$researcher_effort\"" || echo "")
planner_effort_param=$([ -n "$planner_effort" ] && [ "$planner_effort" != "null" ] && echo "effort=\"$planner_effort\"" || echo "")
checker_effort_param=$([ -n "$checker_effort" ] && [ "$checker_effort" != "null" ] && echo "effort=\"$checker_effort\"" || echo "")
```

## Info

### IN-01: Stale line-number references in core.cjs comments

**File:** `get-shit-done/bin/lib/core.cjs:1632` and `:1693`
**Issue:** Line 1632 comment reads "reuse the config loaded at line 1566" but `loadConfig` is actually called at line 1613. Line 1693 reads "The allowlist gate (line 1617)" but the gate (`if (!config.runtime || ...) return null`) is at line 1618. Hardcoded line numbers in comments drift on every edit and mislead readers.
**Fix:** Reference the construct by name instead of line number, e.g. "reuse the `config` loaded at the top of `resolveReasoningEffortInternal`" and "The allowlist gate above already ensures...".

### IN-02: Inconsistent effort-arg variable naming across spawn sites

**File:** `get-shit-done/workflows/plan-phase.md:536` (vs `execute-phase.md:90`)
**Issue:** The codebase uses two naming conventions for the same concept: `*_model_effort_arg` (most sites) and `*_effort_param` (plan-phase.md only). PATTERNS.md line 280 mandates `{existing_model_var}_effort_arg`. Single convention aids grep-ability and future automated wiring.
**Fix:** Standardize on `*_model_effort_arg` (or `*_effort_arg`) everywhere; update plan-phase.md.

### IN-03: Uppercase token variable naming deviates from convention at Group B sites

**File:** `get-shit-done/workflows/validate-phase.md:39`, `ui-review.md:39`, `ui-phase.md:52,54`, `secure-phase.md:39`
**Issue:** These use SCREAMING_CASE base names like `AUDITOR_MODEL_effort_arg` and `UI_RESEARCHER_MODEL_effort_arg`, producing the awkward mixed-case `AUDITOR_MODEL_effort_arg`. This mirrors the pre-existing `AUDITOR_MODEL` variable at those sites, so it is locally consistent, but it diverges from the lowercase `*_model_effort_arg` used in Group A. Flagged for awareness; not a defect.
**Fix:** Optional — leave as-is for local consistency, or normalize the base variable names in a separate cleanup.

### IN-04: SC#4 inertness test and D-08 floor test rely on an implicit precondition that is never asserted together

**File:** `tests/core.test.cjs:2036` (SC#4) and `:2072` (D-08)
**Issue:** SC#4 asserts `resolveReasoningEffortInternal` returns `null` for bare-catalog projects, while D-08 asserts it returns `'medium'`. These do not conflict only because SC#4's `createTempProject()` leaves `runtime` unset (allowlist gate → null) while D-08 sets `runtime: 'claude'`. The distinguishing precondition (presence/absence of `runtime`) is implicit in the fixture rather than stated in the SC#4 test, so a future change to the default fixture (adding a `runtime`) would silently flip SC#4 from testing the gate to testing the floor, masking a regression.
**Fix:** Add an explicit `writeConfig({})`-style assertion or a comment in the SC#4 test documenting that the null result depends on `runtime` being unset, so the precondition is self-evident.

---

_Reviewed: 2026-06-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
