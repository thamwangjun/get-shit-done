---
phase: 53-unified-effort-resolver
fixed_at: 2026-06-02T00:00:00Z
review_path: .planning/phases/53-unified-effort-resolver/53-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 5
skipped: 3
status: partial
---

# Phase 53: Code Review Fix Report

**Fixed at:** 2026-06-02
**Source review:** .planning/phases/53-unified-effort-resolver/53-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (4 warnings + 4 info)
- Fixed: 5
- Skipped: 3

All 417 phase-relevant tests pass after the fixes (feat-3023, issue-2517,
feat-53-config-sites-and-golden, feat-53-unified-effort-resolver,
parse-model-effort). The full `npm test` failures observed in the isolated
worktree (install.js / windsurf / runtime-converters) were caused solely by the
worktree lacking an installed `node_modules` and are unrelated to these changes —
each passed once the main repo's `node_modules` was linked.

## Fixed Issues

### WR-01: `models.<phase_type>` slot accepts unknown tier values silently (no warn)

**Files modified:** `get-shit-done/bin/lib/core.cjs`
**Commit:** cfce5c61
**Applied fix:** Added a one-shot stderr warning in `_resolveAgentSlotFromConfig`
(the renamed slot resolver) when a non-empty `models.<phase_type>` base alias is
not in `VALID_TIERS`. Keyed by `models::<phaseType>::<value>` against the
existing `_warnedConfigKeys` Set so a typo warns exactly once before falling back
to the profile tier — matching the runtime/effort warning gates.

### WR-02: `formatAgentToModelMapAsTable` assumes every map value is a string

**Files modified:** `get-shit-done/bin/lib/model-catalog.cjs`
**Commit:** e7aca1f6
**Applied fix:** Introduced a `val = (m) => String(m ?? '')` coercion helper and
routed every `.length`/`.padEnd` call through it, so undefined or non-string
catalog-derived values render as `''` instead of throwing in this display helper.

### WR-04: resolvers load config twice per call

**Files modified:** `get-shit-done/bin/lib/core.cjs`
**Commit:** af809a8b
**Applied fix:** Split `_resolveAgentSlot(cwd, agentType)` into a thin
`loadConfig` wrapper plus a new `_resolveAgentSlotFromConfig(config, agentType)`
that takes an already-loaded config. `resolveModelInternal` and
`resolveReasoningEffortInternal` now call the config-taking variant with the
config they already loaded, eliminating the redundant second `loadConfig` (and
its migration writeback / one-shot warn side effects) on the hot path. The
`_resolveAgentSlot` wrapper is preserved for existing callers and tests.

### IN-01: unmapped-agent fallback ignores `adaptive` profile

**Files modified:** `get-shit-done/bin/lib/core.cjs`
**Commit:** 18f67909
**Applied fix:** Added an inline comment in the step-5 unmapped-agent fallback
documenting that an unknown agent carries no routing metadata, so `adaptive` has
no per-agent tier to resolve against and intentionally falls through to the
`sonnet` default — making the asymmetry with the mapped path explicit. (Chose
the "document inline" option from the review rather than adding a misleading
explicit `adaptive` arm that would still resolve to `sonnet`.)

### IN-02: `MODEL_ALIAS_MAP` silently produces `undefined` values

**Files modified:** `get-shit-done/bin/lib/model-catalog.cjs`
**Commit:** 544c43da
**Applied fix:** Added `.filter(([, entry]) => entry?.model)` before
`Object.fromEntries`, matching the `RUNTIME_PROFILE_MAP` pattern, so entries
lacking a `model` field are dropped and the table never carries `undefined`
values.

## Skipped Issues

### WR-03: `VALID_PHASE_TYPES` has two independent definitions that can drift

**File:** `get-shit-done/bin/lib/model-catalog.cjs:51` and `get-shit-done/bin/lib/core.cjs:9`
**Reason:** skipped: code context differs from review — already resolved. The
review's premise (two independent derivations) no longer holds at current head:
`model-profiles.cjs` re-exports `VALID_PHASE_TYPES` directly from
`model-catalog.cjs` (it has no independent `new Set(...)` derivation), and
`core.cjs:9` imports from `model-profiles.cjs`. There is already exactly one
source of truth (`model-catalog.cjs`), so the recommended fix is already in
place. No code change applied.
**Original issue:** Two modules each materialize their own `VALID_PHASE_TYPES`
Set, inviting drift.

### IN-03: Three separate tier-validation surfaces with inconsistent warn behavior

**File:** `get-shit-done/bin/lib/core.cjs:1156-1206`
**Reason:** skipped: tracked as tech-debt by the finding itself ("Track as
tech-debt; consider a single `validateTierValue(value, context)` helper"). This
is a cross-cutting consolidation refactor of three distinct validation sites
spanning a much larger surface than any single finding; applying it as part of an
automated fix pass would broaden scope and risk beyond the issue at hand. WR-01
(now fixed) closes the specific behavioral gap this info finding referenced.
**Original issue:** Three tier-validation surfaces with inconsistent warning
behavior; consolidation would reduce divergence risk.

### IN-04: Effort/config warning caches are process-global with no production reset

**File:** `get-shit-done/bin/lib/core.cjs:1225,1254-1255,1269-1271`
**Reason:** skipped: no action required — the finding explicitly states "No
action required for CLI use." The unbounded-growth concern only materializes if
`core.cjs` is embedded in a long-running host (e.g. the SDK session-runner),
which is not current usage. Flagged for awareness only.
**Original issue:** Module-level warn-cache Sets grow for the process lifetime;
unbounded only under a hypothetical long-running host.

---

_Fixed: 2026-06-02_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
