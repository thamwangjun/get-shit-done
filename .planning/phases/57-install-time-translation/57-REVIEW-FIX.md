---
phase: 57-install-time-translation
fixed_at: 2026-06-06T00:00:00Z
review_path: .planning/phases/57-install-time-translation/57-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 57: Code Review Fix Report

**Fixed at:** 2026-06-06
**Source review:** .planning/phases/57-install-time-translation/57-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Phase 57 leaves the test suite RED — stale haiku effort assertion not updated

**Files modified:** `tests/issue-2517-runtime-aware-profiles.test.cjs`
**Commit:** 8265cb4d
**Applied fix:** Updated the duplicate haiku assertion to expect `null` (Phase 57 D-03 omit behavior) and renamed the test to `haiku tier -> gpt-5.4-mini with NO reasoning_effort (Phase 57 D-03)`. The `issue-2517` and `feat-57` test files now pass 97/97.

### WR-01: `resolveEffort()` ignores `~/.gsd/defaults.json`, diverging from `resolve()` precedence

**Files modified:** `bin/install.js`
**Commit:** af418325
**Applied fix:** Gated `resolveEffort` on `!merged.runtime || !probedProjectDir` so the effort path honors the same runtime precedence as the model path. A home-only config (no per-project `.planning/`) intentionally produces no effort line, and the contract is now explicit in code + comment, so the model and effort emit paths no longer silently diverge.

### WR-02: `?? resolveEffort(agentName)` collapses an intentional haiku `null` and double-loads config

**Files modified:** `bin/install.js`
**Commit:** f75b03c5
**Applied fix:** Replaced `resolveEffort(resolvedName) ?? resolveEffort(agentName)` with a single resolution against a canonical `effortName` (`resolvedName` when it resolves, else `agentName`). This stops `??` from treating an intentional haiku `null` as "absent" and probing a second slot, and removes the redundant per-agent config re-load.

### WR-03: Effort emit decoupled from model emit — no invariant ties the two TOML lines together

**Files modified:** `bin/install.js`
**Commit:** f75b03c5
**Applied fix:** Introduced a `modelEmitted` flag set in both the `model_overrides` branch and the tier-resolved branch, and gated the effort emit on `modelEmitted`. The model line and effort line are now paired — if no model line is emitted, no effort line is emitted. Verified against the `INSTALL-01` test that requires the `opus;max` model_overrides path to still emit `model_reasoning_effort = "xhigh"`.

### IN-01: Stale doc-comment lists haiku effort as "medium"

**Files modified:** `tests/issue-2517-runtime-aware-profiles.test.cjs`
**Commit:** 7e820adb
**Applied fix:** Updated the file header comment from `haiku -> gpt-5.4-mini (medium)` to `haiku -> gpt-5.4-mini (no reasoning_effort)`.

### IN-02: Stale `resolve()` contract comment after the effort seam moved

**Files modified:** `bin/install.js`
**Commits:** 64a8d42f (JSDoc), f75b03c5 (inline emit-block comment trim)
**Applied fix:** Documented `resolveEffort(agentName) -> string|null` in the resolver JSDoc return shape, and trimmed the inline `#2517` comment so it no longer advertises reasoning_effort emit from the `resolve()` path (effort is now routed exclusively through `resolveEffort()` at the TOML boundary).

## Notes

- The in-scope review targets (`tests/issue-2517-runtime-aware-profiles.test.cjs`, `tests/feat-57-install-translation.test.cjs`) pass 97/97 after the fixes.
- The full `npm test` run surfaces 46 PRE-EXISTING failures in `tests/feat-53-config-sites-and-golden.test.cjs` (D-08 golden-snapshot / same-slot-invariant tests) plus unrelated `npm audit` and bare-line `@~` survivor failures. These were confirmed pre-existing — they fail with the install.js fixes stashed (i.e. on the base commit) and are NOT part of the Phase 57 review findings. The D-08 failures are the same class of stale haiku assertion as CR-01 but were not flagged in REVIEW.md, so they fall outside this fix scope and should be raised as a follow-up review item.

---

_Fixed: 2026-06-06_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
