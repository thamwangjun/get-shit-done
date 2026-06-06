---
phase: 56-spawn-template-wiring
fixed_at: 2026-06-04T00:00:00Z
review_path: .planning/phases/56-spawn-template-wiring/56-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 7
skipped: 1
status: partial
---

# Phase 56: Code Review Fix Report

**Fixed at:** 2026-06-04
**Source review:** .planning/phases/56-spawn-template-wiring/56-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8
- Fixed: 7
- Skipped: 1

## Fixed Issues

### WR-01: Agent file uses `resolve-model | jq` instead of `resolve-model-effort`

**Files modified:** `agents/gsd-debug-session-manager.md`
**Commit:** 8792c075
**Applied fix:** Replaced the hand-rolled `resolve-model gsd-debugger | jq ...` effort extraction with the standardized `gsd-sdk query resolve-model-effort gsd-debugger --raw 2>/dev/null || echo ""`, matching `debug.md:37` and PATTERNS.md line 198.

### WR-03: Effort token interpolated in `Agent()` before the bash block that defines it

**Files modified:** `agents/gsd-debug-session-manager.md`
**Commit:** 8792c075
**Applied fix:** Moved the bash resolve block (which assigns `debugger_model` and `debugger_model_effort_arg`) above the `Agent()` template block so the define-before-use contract is unambiguous. Committed together with WR-01 since both touch the same region.

### WR-02: Group B `--raw` sites lack the failure guard debug.md uses

**Files modified:** `get-shit-done/workflows/scan.md`, `get-shit-done/workflows/secure-phase.md`, `get-shit-done/workflows/ui-review.md`, `get-shit-done/workflows/validate-phase.md`, `get-shit-done/workflows/audit-milestone.md`, `get-shit-done/workflows/ui-phase.md` (2 lines), `get-shit-done/workflows/docs-update.md`, `get-shit-done/workflows/discuss-phase/modes/advisor.md`
**Commit:** 33c4e631
**Applied fix:** Appended ` 2>/dev/null || echo ""` to all 9 unguarded `resolve-model-effort --raw` lines so a resolver failure degrades to an empty token rather than injecting stderr noise into the `Agent()` block.

### WR-04: plan-phase.md describes effort-param derivation in prose only

**Files modified:** `get-shit-done/workflows/plan-phase.md`
**Commit:** 659d1a37
**Applied fix:** Replaced the prose-only narration at line 59 with a concrete, copyable shell block deriving `researcher_model_effort_arg` / `planner_model_effort_arg` / `checker_model_effort_arg` using the same `[ -n ... ] && [ ... != "null" ] && echo ... || echo ""` pattern as sibling Group A workflows.

### IN-02: Inconsistent effort-arg variable naming across spawn sites

**Files modified:** `get-shit-done/workflows/plan-phase.md`
**Commit:** 659d1a37
**Applied fix:** Renamed `*_effort_param` to `*_model_effort_arg` (per PATTERNS.md line 280) at all interpolation sites in plan-phase.md. Committed together with WR-04 since both touch the same file and concept.

### IN-01: Stale line-number references in core.cjs comments

**Files modified:** `get-shit-done/bin/lib/core.cjs`
**Commit:** defda322
**Applied fix:** Replaced hardcoded line-number references ("line 1566", "line 1617", "line 1635") in comments with construct-by-name references that do not drift on edits. Verified with `node -c`.

### IN-04: SC#4 inertness test relies on an implicit `runtime`-unset precondition

**Files modified:** `tests/core.test.cjs`
**Commit:** ec71aedb
**Applied fix:** Added a documenting comment plus an explicit `assert.strictEqual(loadConfig(tmpDir).runtime, undefined, ...)` precondition at the start of the SC#4 test, so a future change to the default fixture (adding a `runtime`) would fail loudly rather than silently flipping the test from exercising the gate to exercising the floor. Test verified passing.

## Skipped Issues

### IN-03: Uppercase token variable naming deviates from convention at Group B sites

**File:** `get-shit-done/workflows/validate-phase.md:39` (and `ui-review.md`, `ui-phase.md`, `secure-phase.md`)
**Reason:** skipped: reviewer explicitly recommends leaving as-is. The finding's own Fix section states "Optional — leave as-is for local consistency, or normalize the base variable names in a separate cleanup." The mixed-case `AUDITOR_MODEL_effort_arg` form mirrors the pre-existing `AUDITOR_MODEL` base variable at those sites, so it is locally consistent. Normalizing would require touching the base variable names (out of scope for this finding) and was flagged "for awareness; not a defect."
**Original issue:** Group B sites use SCREAMING_CASE base names producing awkward mixed-case `AUDITOR_MODEL_effort_arg`, diverging from the lowercase `*_model_effort_arg` used in Group A.

---

_Fixed: 2026-06-04_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
