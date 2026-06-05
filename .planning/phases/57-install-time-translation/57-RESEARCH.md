# Phase 57: Install-Time Translation - Research

**Researched:** 2026-06-05
**Domain:** GSD installer (`bin/install.js`) Codex TOML emit + core effort resolver (`core.cjs`)
**Confidence:** HIGH (all findings verified by reading current source + runtime probes)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** `install.js` obtains per-agent canonical effort by **reusing the core resolver** (`resolveReasoningEffortInternal` / `resolveTierEntry` in `core.cjs`), same path the SDK uses — including the Phase 56 medium floor, the `{claude,codex}` allowlist gate, and the haiku exclusion (D-03). One source of truth; install translates to Codex form only at the emit boundary. Re-deriving effort locally was rejected (re-implements floor/allowlist, risks SDK-vs-install divergence).
- **D-02:** The `max`→`xhigh` translation lives in a **shared `translateEffortForCodex(effort)` helper in `core.cjs`**, invoked only at the Codex TOML emit. Resolver stays Claude-form-neutral. Because haiku is already `null` from the resolver, this helper only ever sees opus/sonnet effort. Inlining at the emit site rejected (not independently testable).
- **D-03:** **Haiku supports no effort values at all.** Exclusion is **tier-based**: any slot resolving to the **haiku tier omits effort entirely on every runtime**, and there is **no `medium` floor for haiku** — a bare haiku slot stays `null`. This **overrides Phase 56 D-08's floor** for haiku-tier slots. Both the haiku omit and the floor exclusion live **in the resolver** — by the time the Codex boundary sees a value, haiku is already `null`.
- **D-04:** **Codex-emit-only.** install.js changes confined to the Codex TOML emit. Claude install path untouched; Claude effort is carried by Phase 56 spawn templates resolved live at spawn.

### Claude's Discretion
- Exact name/signature/registration of `translateEffortForCodex` (intended name; confirm against core.cjs export conventions).
- Precise wiring point inside `generateCodexAgentToml` (the existing `entry.reasoning_effort` block is the natural seam).
- How the haiku tier is detected in the resolver (alias `haiku` vs the bare-tier lookup already present).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INSTALL-01 | `bin/install.js` translates Claude `effort` to Codex `reasoning_effort` only at the Codex emit boundary; the runtime-agnostic resolver stays effort-format-neutral | New `translateEffortForCodex` in core.cjs (Finding 2/3); invoked only at install.js:2748–2749 (Finding 1). Resolver emits Claude-form `max` verbatim today (verified) |
| INSTALL-02 | Effort materializes correctly per runtime at install time — Claude effort preserved, Codex translated, unsupported runtimes omit | Claude path untouched (D-04). Codex sourcing redirected through floored core resolver (Finding 1). Haiku omit + allowlist gate enforced in resolver (Finding 2/4) |
</phase_requirements>

## Summary

Phase 57 has a single load-bearing structural problem: **the Codex install emit path does NOT currently go through the floored core resolver.** Today `generateCodexAgentToml` (install.js:2742–2751) calls `runtimeResolver.resolve(agentName)`, which is built by `readGsdRuntimeProfileResolver` (install.js:1449–1512) and ultimately calls `gsdResolveTierEntry` → `resolveTierEntry` in core.cjs — a pure per-tier `RUNTIME_PROFILE_MAP` lookup. That lookup knows nothing about the allowlist gate, the medium floor, per-agent overrides, the precedence chain, or the haiku exclusion. It just returns the catalog tier's `reasoning_effort` verbatim.

This is verified by runtime probe: `resolveTierEntry({runtime:'codex',tier:'haiku'})` returns `{model:'gpt-5.4-mini', reasoning_effort:'medium'}` — meaning **the current installer already emits `model_reasoning_effort = "medium"` for haiku Codex agents**, which D-03 explicitly forbids. The catalog `codex.haiku` tier carries `reasoning_effort: "medium"` (verified).

**Primary recommendation:** Make two changes. (1) In `core.cjs resolveReasoningEffortInternal`, add a haiku-tier exclusion that returns `null` BEFORE the medium floor (and before the step-5 runtime-tier fallback) so haiku resolves to `null` regardless of catalog values. (2) In install.js, redirect the Codex effort source from the per-tier `resolveTierEntry.reasoning_effort` to the floored `resolveReasoningEffortInternal` result, then pass that Claude-form value through the new `translateEffortForCodex` helper at the emit site (install.js:2748–2749). The model field continues to come from `resolveTierEntry` (unchanged); only the `reasoning_effort` source moves.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Canonical effort resolution (floor, allowlist, haiku-exclude, precedence) | core.cjs `resolveReasoningEffortInternal` | — | D-01 single source of truth |
| Claude-form → Codex-form translation (`max`→`xhigh`) | core.cjs `translateEffortForCodex` | — | D-02 boundary concern, one unit-testable fn |
| Codex `.toml` materialization (emit `model_reasoning_effort`) | install.js `generateCodexAgentToml` | — | Codex has no inline spawn arg; static TOML is its only effort surface |
| Model-field tier resolution (Codex-native model IDs) | core.cjs `resolveTierEntry` (via install resolver) | — | Unchanged — only effort source moves |
| Claude effort delivery | Phase 56 spawn templates (live `Agent()` arg) | — | D-04 install.js does nothing Claude-side |

## Standard Stack

No external packages. This phase touches only `.js`/`.cjs` in-repo. Node.js built-in `--test` runner + `c8` coverage (existing project tooling). No `## Package Legitimacy Audit` needed — zero external installs.

## Architecture Patterns

### Current Codex effort emit path (the seam to redirect)

```
generateCodexAgentToml(agentName, ...)                       install.js:2719
  └─ runtimeResolver.resolve(resolvedName)                   install.js:2745
       └─ (built by) readGsdRuntimeProfileResolver           install.js:1449
            └─ gsdResolveTierEntry({runtime, tier, overrides})  install.js:1505
                 └─ resolveTierEntry(...)  [core.cjs:1295]   ← PER-TIER MAP LOOKUP ONLY
                      returns { model, reasoning_effort? }    ← NO floor/allowlist/haiku
  └─ if (entry.reasoning_effort)                              install.js:2748  ← EMIT SEAM
       lines.push(`model_reasoning_effort = ${...}`)          install.js:2749
```

The emit conditional at **install.js:2748–2749** is the natural wiring point (CONTEXT D-discretion confirms). Today `entry.reasoning_effort` comes from the per-tier `resolveTierEntry`. Phase 57 must source it instead from the floored `resolveReasoningEffortInternal`, then translate.

### Target Codex effort emit path

```
generateCodexAgentToml(agentName, ...)
  └─ model:  entry.model  from runtimeResolver.resolve()  ← UNCHANGED
  └─ effort: claudeFormEffort = resolveReasoningEffortInternal(projectDir, gsd-<agentName>)
             codexEffort       = translateEffortForCodex(claudeFormEffort)   ← max→xhigh
       if (codexEffort)  lines.push(`model_reasoning_effort = ${JSON.stringify(codexEffort)}`)
```

**Wiring constraint (must resolve at plan time):** `resolveReasoningEffortInternal(cwd, agentType)` takes a **cwd** (project dir, to `loadConfig`) and an **agentType** (e.g. `gsd-debugger`). The install resolver currently resolves by `agentName`/`resolvedName` (the frontmatter `name`). The planner must thread the project dir and the canonical agent key into the emit path. Options:
- Extend `readGsdRuntimeProfileResolver` to also expose an effort resolver bound to the resolved project dir (it already walks up to find `.planning/config.json` at install.js:1460–1472 — reuse that probe to get the cwd), OR
- Have `generateCodexAgentToml` receive the project dir + call `resolveReasoningEffortInternal` directly.
  Recommendation: extend the existing resolver object returned at install.js:1498–1511 with a sibling `resolveEffort(agentName) -> claudeFormEffort | null` that internally calls `resolveReasoningEffortInternal(probeDir, agentName)`. Keeps the cwd-probe logic in one place and mirrors the existing `resolve(agentName)` shape (D-01 reuse intent).

### Anti-Patterns to Avoid
- **Re-deriving effort from the catalog slot in install.js** — exactly what D-01 rejects. The per-tier `resolveTierEntry.reasoning_effort` is the current (wrong) source; do not keep using it for effort.
- **Inlining `max`→`xhigh` at the emit site** — D-02 rejects; use the shared helper.
- **Adding haiku exclusion only at the install boundary** — D-03 requires it in the resolver so SDK/install agree.

## Code Examples

### Core resolver: haiku exclusion BEFORE the floor (core.cjs)

Current tail of `resolveReasoningEffortInternal` (verified, core.cjs:1684–1696):

```javascript
  // 5. Runtime-tier entry fallback (CONFIG-03 / RESOLVE-03)
  const entry = _resolveRuntimeTier(config, bareTier);
  if (entry?.reasoning_effort) return entry.reasoning_effort;

  // D-08: floor un-assigned {claude,codex} slots to 'medium'.
  return 'medium';
```

The haiku exclusion must fire **before step 5 and before the floor**, because the catalog `codex.haiku` entry carries `reasoning_effort: "medium"` (verified) — step 5 would emit it otherwise. The cleanest placement is right after `bareTier` is computed (core.cjs:1639), so explicit overrides still error/warn normally but a bare haiku slot, a haiku catalog slot with no `;effort`, and the floor are all short-circuited to `null`:

```javascript
  const bareTier = parseModelEffort(tier).model;

  // D-03 (Phase 57): haiku supports no effort on any runtime. Tier-based exclusion
  // overrides the Phase 56 D-08 medium floor for haiku slots — bare haiku stays null,
  // never floors to medium, and never inherits the catalog haiku reasoning_effort.
  if (bareTier === 'haiku') return null;
```

> **Planner decision (Claude's discretion in CONTEXT):** placing the guard at line ~1639 means an *explicit* per-agent override like `model_overrides.x = "haiku;high"` would already have returned at step 1 (core.cjs:1626) BEFORE this guard, emitting `high`. Confirm against D-03's intent: "haiku omits effort on every runtime, full stop." If the user wants the tier exclusion to win even over an explicit suffix, the guard must also cover the override path (resolve the override's model via `parseModelEffort`, check `=== 'haiku'`). The roadmap/CONTEXT phrasing ("tier-based... omits entirely") suggests the stronger reading — flag for confirmation. **[ASSUMED]** that haiku-with-explicit-suffix is rare/non-existent in practice; verify before locking.

### New helper: translateEffortForCodex (core.cjs, export ~2080)

```javascript
/**
 * Translate canonical Claude-form effort to Codex model_reasoning_effort.
 * Only the max→xhigh clamp differs (RESOLVE-04 / D-02); low|medium|high pass through.
 * Invoked only at the Codex TOML emit boundary; the resolver stays Claude-form-neutral.
 * @param {string|null} effort  Claude-form effort (low|medium|high|max) or null.
 * @returns {string|null} Codex-form effort, or null (omit) when input is null.
 */
function translateEffortForCodex(effort) {
  if (effort == null) return null;
  return effort === 'max' ? 'xhigh' : effort;
}
```

Add to the `module.exports` block alongside `resolveTierEntry` / `parseModelEffort` (core.cjs:2080–2081) and import into install.js next to `gsdResolveTierEntry` (install.js:161).

### Import in install.js (install.js:159–162, current)

```javascript
const {
  RUNTIME_PROFILE_MAP: GSD_RUNTIME_PROFILE_MAP,
  resolveTierEntry: gsdResolveTierEntry,
  // ADD:
  resolveReasoningEffortInternal: gsdResolveReasoningEffort,
  translateEffortForCodex: gsdTranslateEffortForCodex,
} = require(path.join(_gsdLibDir, 'core.cjs'));
```

Both new functions are reachable the same way `gsdResolveTierEntry` already is (verified import path, core.cjs:2073–2081 exports).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Effort precedence/floor/allowlist at install | Local catalog re-read | `resolveReasoningEffortInternal` | D-01; avoids SDK/install divergence |
| max→xhigh clamp | Inline ternary at emit | `translateEffortForCodex` | D-02; unit-testable, reused |
| Project-dir discovery for cwd | New walk-up loop | Reuse install.js:1460–1472 probe | Already finds `.planning/config.json` |

## Runtime State Inventory

Not applicable — this is a code change (.js/.cjs), not a rename/migration. No stored data, live-service config, OS-registered state, secrets, or build artifacts embed effort strings. The Codex `.toml` files are regenerated on every install from `generateCodexAgentToml`, so the new behavior materializes on next install with no migration needed. **None — verified: effort is computed at install time, not stored in versioned state.**

## Common Pitfalls

### Pitfall 1: Haiku catalog tier silently re-emits medium
**What goes wrong:** The Codex catalog `haiku` tier carries `reasoning_effort: "medium"` (verified). If the haiku exclusion is added only at the floor (step-D-08) and not before step-5, `_resolveRuntimeTier` returns the catalog `medium` and step-5 emits it — D-03 violated.
**How to avoid:** Place the `bareTier === 'haiku'` guard before step 5 (right after core.cjs:1639), not just before the floor.
**Warning signs:** A test asserting `resolveReasoningEffortInternal` for a haiku-tier codex agent returns `null` fails with `'medium'`.

### Pitfall 2: Model field accidentally lost when redirecting effort source
**What goes wrong:** install.js:2746–2750 currently emits `model` AND `reasoning_effort` from the same `entry`. If you replace `entry` wholesale with the effort resolver, you drop the Codex-native model.
**How to avoid:** Keep `entry.model` from `runtimeResolver.resolve()`; source ONLY the effort separately. Two values, two sources.

### Pitfall 3: cwd mismatch — resolver returns null for every agent
**What goes wrong:** `resolveReasoningEffortInternal(cwd, ...)` returns `null` immediately if `config.runtime` is absent or not in `{claude,codex}` (core.cjs:1618). Passing a wrong/empty cwd → `loadConfig` finds no config → null → no effort ever emitted, masking the whole feature as a silent no-op.
**How to avoid:** Thread the same probed project dir used at install.js:1460–1472; add a test that a codex install with a real `.planning/config.json` emits `model_reasoning_effort` for an opus-tier agent.

### Pitfall 4: indexOf-as-boolean / substring collision on medium/high
**What goes wrong:** (carried from TEST-04) `'medium'.indexOf('med')` style truthiness or substring matching can false-pass.
**How to avoid:** New tests assert exact string equality (`assert.equal(effort, 'xhigh')`), never substring/indexOf.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Codex effort from per-tier `resolveTierEntry.reasoning_effort` (catalog verbatim) | Floored core resolver + `translateEffortForCodex` at emit | Phase 57 (this) | Haiku omits; bare opus/sonnet floor to medium→translated; max→xhigh |
| haiku codex emits catalog `medium` | haiku omits effort entirely | Phase 57 D-03 | Removes incorrect haiku effort |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Haiku-with-explicit-`;effort` suffix is rare/nonexistent, so placing the haiku guard after the override step (step 1) is acceptable | Code Examples | If a user sets `model_overrides.x="haiku;high"`, effort `high` would emit despite D-03's "every runtime, full stop." Confirm intended precedence: tier-exclusion vs explicit override |
| A2 | Extending `readGsdRuntimeProfileResolver` with a `resolveEffort` sibling is the preferred cwd-threading approach | Architecture Patterns | If planner prefers passing cwd into `generateCodexAgentToml` directly, signature changes ripple to install.js:5018–5019 and the export/test at install.js:11402 |

## Open Questions

1. **Does the haiku tier exclusion override an explicit per-agent `;effort` suffix?**
   - What we know: D-03 says "haiku omits on every runtime, full stop" (tier-based). Step 1 of the resolver returns the override effort BEFORE any tier lookup (core.cjs:1626).
   - What's unclear: whether an explicit `model_overrides.x = "haiku;high"` should still omit.
   - Recommendation: implement the stronger reading (tier wins) by checking `parseModelEffort(override).model === 'haiku'` in the override branch too; flag to user at plan/discuss time. (See A1.)

## Environment Availability

Not applicable — no external tools/services. Node.js >=22 + npm test runner already present (project requirement).

## Validation Architecture

> Nyquist validation enabled (no `workflow.nyquist_validation: false` in config).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` runner + `c8` coverage |
| Config file | none (package.json `test` script: `node --test tests/`) |
| Quick run command | `node --test tests/feat-57-install-translation.test.cjs` (new) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INSTALL-01 | `translateEffortForCodex('max')==='xhigh'`; `'low'/'medium'/'high'` pass through; `null`→`null` | unit | `node --test tests/feat-57-install-translation.test.cjs` | ❌ Wave 0 |
| INSTALL-01 | Resolver stays Claude-form-neutral: `resolveReasoningEffortInternal` never returns `xhigh` (returns `max` verbatim) | unit | same | ❌ Wave 0 |
| INSTALL-02 | Codex install emits `model_reasoning_effort = "xhigh"` for an opus slot assigned `max`; `"medium"` for a bare opus/sonnet slot (floor) | integration | `node --test tests/feat-57-install-translation.test.cjs` | ❌ Wave 0 |
| INSTALL-02 | Codex install emits NO `model_reasoning_effort` line for a haiku-tier agent (D-03) | integration | same | ❌ Wave 0 |
| INSTALL-02 | `resolveReasoningEffortInternal` returns `null` for any haiku-tier slot on claude AND codex (no medium floor) | unit | same | ❌ Wave 0 |
| INSTALL-02 | Non-`{claude,codex}` install emits no effort; Claude install path TOML unchanged (D-04 — Codex-only) | integration | same | ❌ Wave 0 |
| TEST-04 | Assertions use exact string equality, no indexOf/substring on medium/high | unit | same | ❌ Wave 0 |
| TEST-05 | `npm test` green, ≥70% coverage on `bin/lib/*.cjs` | suite | `npm run test:coverage` | existing |

### Test patterns to mirror
- **Resolver unit tests:** follow `tests/feat-53-unified-effort-resolver.test.cjs` — uses `createTempDir` (from `tests/helpers.cjs`), `writeConfig(projectDir, {...})` to plant `.planning/config.json`, `_resetEffortWarningCacheForTests()` in `beforeEach`, imports `resolveReasoningEffortInternal` from core.cjs. Set `process.env.GSD_TEST_MODE='1'`.
- **Install Codex TOML tests:** follow `tests/codex-config.test.cjs` and `tests/bug-3427-3433-codex-install-shape.test.cjs` — call `generateCodexAgentToml(...)` (exported at install.js:11402) and/or `readGsdRuntimeProfileResolver(targetDir)` (exported install.js:11412), assert on the returned TOML string for presence/absence of `model_reasoning_effort`.
- **Parser/translation parity:** mirror `tests/parse-model-effort.test.cjs` for the pure `translateEffortForCodex` unit tests.

### Sampling Rate
- **Per task commit:** `node --test tests/feat-57-install-translation.test.cjs`
- **Per wave merge:** `node --test tests/feat-53-unified-effort-resolver.test.cjs tests/codex-config.test.cjs tests/feat-57-install-translation.test.cjs`
- **Phase gate:** `npm run test:coverage` green (≥70% on `bin/lib/*.cjs`) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/feat-57-install-translation.test.cjs` — covers INSTALL-01, INSTALL-02, TEST-04 (new file)
- [ ] No new fixtures needed — `createTempDir` + `writeConfig` helpers in `tests/helpers.cjs` suffice
- [ ] Framework install: none — built-in runner already used

### Fork quality gates (must stay green)
This phase touches only `.js`/`.cjs` — no prompt-content renumbering. `tests/agent-frontmatter.test.cjs`, negative-framing, step-numbering, cross-file-refs are unaffected but must still pass in the full suite.

## Sources

### Primary (HIGH confidence)
- `bin/install.js` — `generateCodexAgentToml` (2719–2761), emit seam (2748–2749), `readGsdRuntimeProfileResolver` (1449–1512), import (159–162), exports (11402, 11412), install call site (5018–5019) — read directly this session.
- `get-shit-done/bin/lib/core.cjs` — `parseModelEffort` (1242–1265), `resolveTierEntry` (1295), `resolveReasoningEffortInternal` (1612–1696), exports (2073–2081) — read directly.
- `get-shit-done/bin/lib/model-catalog.cjs` — `RUNTIME_PROFILE_MAP` (80–89), `RUNTIMES_WITH_REASONING_EFFORT = {claude,codex}` (97) — read directly.
- Runtime probe: `resolveTierEntry({runtime:'codex',tier:'haiku'})` → `{model:'gpt-5.4-mini',reasoning_effort:'medium'}`; `codex.haiku` catalog carries `reasoning_effort:'medium'` — executed this session.
- `tests/feat-53-unified-effort-resolver.test.cjs`, `tests/phase-56-effort-wiring.test.cjs` — read for test patterns.
- CONTEXT.md (D-01..D-04), Phase 53/56 CONTEXT, REQUIREMENTS.md INSTALL-01/02 — read directly.

## Metadata

**Confidence breakdown:**
- Codex emit path / seam: HIGH — read current source, confirmed `resolveTierEntry` bypass via runtime probe.
- Core resolver / haiku placement: HIGH — read full function, confirmed catalog haiku=medium forces guard before step 5.
- Translation helper / imports: HIGH — verified export/import conventions in source.
- Test patterns: HIGH — read existing Phase 53/56 + codex-config tests.

**Research date:** 2026-06-05
**Valid until:** 2026-07-05 (stable in-repo code; line numbers may drift if files edited)
