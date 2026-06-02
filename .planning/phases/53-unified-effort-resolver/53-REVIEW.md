---
phase: 53-unified-effort-resolver
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - get-shit-done/bin/lib/core.cjs
  - get-shit-done/bin/lib/model-catalog.cjs
  - tests/feat-3023-model-phase-types.test.cjs
  - tests/issue-2517-runtime-aware-profiles.test.cjs
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 53: Code Review Report

**Reviewed:** 2026-06-02
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the unified effort/model resolver work: `core.cjs` resolver chain
(`resolveModelInternal`, `resolveReasoningEffortInternal`, `resolveTierEntry`,
`_resolveAgentSlot`, `parseModelEffort`, `_warnUnknownProfileOverrides`),
`model-catalog.cjs` (catalog loading + derived maps), and the two feature test
suites (#3023 phase-type map, #2517 runtime-aware profiles).

Overall the resolver logic is correct against its documented precedence and the
test suites are thorough (precedence, field-merge, allowlist gating, back-compat,
warning paths). No correctness or security blocker found. The findings below are
robustness and maintainability concerns — chiefly redundant `loadConfig` calls,
an inconsistent tier allowlist between the warning path and the resolver path, an
unreset effort-warning cache that can cause cross-test bleed, and a few naming /
dead-export nits.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `_resolveAgentSlot` re-invokes `loadConfig`, causing redundant disk reads and a config-migration write storm

**File:** `get-shit-done/bin/lib/core.cjs:1353`, `1382-1405`, `1565-1601`
**Issue:** `resolveModelInternal` calls `loadConfig(cwd)` (line 1383), then calls
`_resolveAgentSlot(cwd, agentType)` (line 1405), which calls `loadConfig(cwd)`
*again* (line 1353). `resolveReasoningEffortInternal` does the same: `loadConfig`
at line 1566, then `_resolveAgentSlot` at line 1585 reloads it. Each
`resolveModelInternal` therefore parses `config.json` twice; the effort path can
parse it three times within a single agent resolution.

Beyond wasted parsing, `loadConfig` is not side-effect-free: when legacy-key
normalization or sub-repo sync triggers `configDirty`, it writes `config.json`
back to disk (lines 312, 379). Calling it 2–3× per resolution multiplies those
writes and the `detectSubRepos` filesystem scans, and in a workstream/parallel
context increases the window for the redundant writes to interleave.

**Fix:** Have `_resolveAgentSlot` accept an already-loaded config object instead
of re-loading, and pass the caller's `config` down:
```js
function _resolveAgentSlot(config, agentType) {
  const profile = String(config.model_profile || 'balanced').toLowerCase();
  // ...unchanged...
}
// callers:
const config = loadConfig(cwd);
const tier = _resolveAgentSlot(config, agentType);
```
This preserves behavior while collapsing to one `loadConfig` per resolution.

### WR-02: Tier allowlist diverges between the warning path and the resolver path (`inherit` warns but resolves)

**File:** `get-shit-done/bin/lib/core.cjs:1153`, `1192`, `1366`
**Issue:** `RUNTIME_OVERRIDE_TIERS` is `{opus, sonnet, haiku}` (line 1153) and is
used by `_warnUnknownProfileOverrides` to validate `model_profile_overrides`
tier keys (line 1192). The resolver's `VALID_TIERS` is
`{opus, sonnet, haiku, inherit}` (line 1366). The two sets are maintained
independently and disagree on `inherit`.

Effect: a config of
`model_profile_overrides: { codex: { inherit: "..." } }` is a tier the resolver
chain treats as a recognized base alias in `_resolveAgentSlot`, yet
`_warnUnknownProfileOverrides` would emit "unknown tier \"inherit\"". The two
spellings of "what is a valid tier" can drift further as tiers are added,
producing either false-positive warnings or silently unvalidated keys.

**Fix:** Derive both from a single shared constant (or from
`Object.keys(catalog.runtimeTierDefaults.claude)` plus the explicit `inherit`
sentinel) so the warning gate and the resolver never disagree on the tier
vocabulary.

### WR-03: `_warnedEffortLabels` cache has a reset helper that is never wired into the test suites — risk of cross-test warning bleed

**File:** `get-shit-done/bin/lib/core.cjs:1225`, `1269-1271`; `tests/feat-3023-model-phase-types.test.cjs`; `tests/issue-2517-runtime-aware-profiles.test.cjs`
**Issue:** `parseModelEffort` dedupes its "unknown effort suffix" warning via the
module-level `_warnedEffortLabels` Set (line 1225). `_resetEffortWarningCacheForTests`
exists (line 1269) and is exported (line 1991), but neither reviewed test suite
imports or calls it — only `_resetRuntimeWarningCacheForTests` is reset in
`beforeEach`. The #3023 suite feeds malformed slots (`models: { research: 'haiku3' }`
at line 192, `models: { research: 'openai/gpt-5' }` at line 206) which flow through
`parseModelEffort` and populate `_warnedEffortLabels`. Because the cache is
process-global and never cleared, any future test that asserts a warning *fires*
for one of those labels will silently get a false pass when run after these tests
(order-dependent flake). The dead-but-exported reset helper signals the reset was
intended but not completed.

**Fix:** Call `_resetEffortWarningCacheForTests()` in the `beforeEach` of any
suite that exercises `parseModelEffort` warning paths, alongside the existing
`_resetRuntimeWarningCacheForTests()` call.

### WR-04: `parseModelEffort` is applied to non-string phase-type slot values without distinguishing typo from malformed config

**File:** `get-shit-done/bin/lib/core.cjs:1369`, `1242-1243`
**Issue:** `_resolveAgentSlot` computes
`phaseTypeTierBase = phaseTypeTier ? parseModelEffort(phaseTypeTier).model : undefined`
(line 1369). `config.models[phaseType]` is user-authored JSON and can be a
non-string (e.g. `models: { research: 123 }` or `models: { research: ["opus"] }`).
`parseModelEffort` returns `{ model: label }` verbatim for non-strings (line 1243),
so `phaseTypeTierBase` becomes the number/array, `VALID_TIERS.has(...)` is false,
and the slot is silently ignored with no diagnostic. A user who typed a malformed
value gets no warning (unlike the string-typo path, which warns) and silently
falls back to profile — the failure is invisible.

**Fix:** When `phaseTypeTier` is present but not a string, emit a one-time stderr
warning (mirroring the `parseModelEffort` typo warning) before falling back, so a
malformed `models.<phase_type>` value surfaces at resolution time instead of
degrading silently.

## Info

### IN-01: `_resolveAgentSlot` recomputes `profile`/`agentModels` that `resolveModelInternal` already has

**File:** `get-shit-done/bin/lib/core.cjs:1354-1355`, `1403-1404`
**Issue:** `resolveModelInternal` computes `profile` (line 1403) and `agentModels`
(line 1404) and then calls `_resolveAgentSlot`, which recomputes both from a
freshly-loaded config (lines 1354-1355). Duplicated derivation invites the two
copies to drift if one is edited. Folds naturally into the WR-01 fix.
**Fix:** Once `_resolveAgentSlot` takes the shared config, derive `profile`/`agentModels`
once and reuse.

### IN-02: Stale "five named slots" comment vs. six phase types

**File:** `get-shit-done/bin/lib/core.cjs:481-484`
**Issue:** The comment says "Six named slots
(planning/discuss/research/execution/verification/completion)" — that is correct
(six). However the inline list elsewhere and prose should be cross-checked; the
catalog (`phaseTypes`) is the single source of truth and the comment hardcodes the
list, which will silently drift if `phaseTypes` changes.
**Fix:** Reference `VALID_PHASE_TYPES` / `catalog.phaseTypes` rather than restating
the list in prose.

### IN-03: `RUNTIME_PROFILE_MAP` silently drops all-null runtimes, which is correct but undocumented at the consumer

**File:** `get-shit-done/bin/lib/model-catalog.cjs:75-84`
**Issue:** Runtimes whose tiers are all `null` (kilo, cline, cursor, windsurf,
augment, trae, codebuddy, antigravity) are filtered out of `RUNTIME_PROFILE_MAP`
(line 83) yet remain in `KNOWN_RUNTIMES` (line 86). This is intentional and tested
(issue-2517 lines 706-753), but the asymmetry — "known runtime, no profile map
entry" — is non-obvious to a reader of `resolveTierEntry`, which relies on
`RUNTIME_PROFILE_MAP[runtime]?.[tier]` returning undefined for them.
**Fix:** Add a one-line comment at the `.filter` explaining that all-null runtimes
are intentionally excluded so they fall through to the Claude-safe default.

### IN-04: Catalog co-located candidate path is silently absent in the dev tree

**File:** `get-shit-done/bin/lib/model-catalog.cjs:22`
**Issue:** The first candidate (`bin/shared/model-catalog.json`) does not exist in
the source repo; resolution always falls to candidate #2 (`sdk/shared/...`). This
is by design (candidate #1 is written by `bin/install.js`), and the recoverable-
error handling (lines 37-42) is correct. No action required, but the dev-time
reliance on candidate ordering is worth a test that asserts candidate #2 resolves
when #1 is absent, to catch accidental reordering.
**Fix:** Optional — add a resolution-order regression test.

### IN-05: `model_overrides` empty-string value is treated as "no override" rather than rejected

**File:** `get-shit-done/bin/lib/core.cjs:1390-1393`, `1577-1580`
**Issue:** `if (override)` (lines 1391, 1578) treats `model_overrides: { agent: "" }`
as absent and falls through to tier resolution. Similarly a slot like `";low"`
parses to `{ model: "" }`. An empty model id is almost certainly a config mistake
and would currently resolve to a profile/tier model with no diagnostic.
**Fix:** Consider warning when an override or parsed model resolves to an empty
string, so a malformed override surfaces rather than silently disappearing.

---

_Reviewed: 2026-06-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
