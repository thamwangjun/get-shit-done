# Phase 57: Install-Time Translation - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 3 (2 modified, 1 new)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `get-shit-done/bin/lib/core.cjs` (add `translateEffortForCodex` + haiku guard) | utility / resolver | transform | `parseModelEffort` (same file, core.cjs:1242) + `resolveReasoningEffortInternal` (core.cjs:1612) | exact (in-file sibling) |
| `bin/install.js` (redirect Codex effort emit seam) | config emitter | transform / file-I/O | existing `generateCodexAgentToml` body (install.js:2742-2751) + import block (install.js:159-162) | exact (modify-in-place) |
| `tests/feat-57-install-translation.test.cjs` (NEW) | test | request-response | `tests/feat-53-unified-effort-resolver.test.cjs` (resolver units) + `tests/codex-config.test.cjs` (TOML emit) + `tests/parse-model-effort.test.cjs` (pure-fn parity) | exact composite |

---

## Pattern Assignments

### `get-shit-done/bin/lib/core.cjs` (utility / transform) — two edits

**Analog A — pure helper shape + JSDoc + export:** `parseModelEffort` (core.cjs:1242-1265)

Mirror the JSDoc-first, single-`function`, null-passthrough shape. `parseModelEffort` returns plain values, never throws — same contract `translateEffortForCodex` follows. Its `@param`/`@returns` JSDoc style and `EFFORT_TOKENS` allowlist are the in-file convention to match.

JSDoc + signature pattern (core.cjs:1240-1243):
```javascript
/**
 * @returns {{model: *, effort: (string|null)}}
 */
function parseModelEffort(label) {
  if (typeof label !== 'string') return { model: label, effort: null };
```

**New helper to add** (per RESEARCH.md Code Examples; place near other effort helpers, register in exports ~2080):
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

**Export pattern** — add to the single trailing `module.exports` block alongside `resolveTierEntry` / `parseModelEffort` (core.cjs:2080-2082):
```javascript
  resolveTierEntry,
  parseModelEffort,
  EFFORT_TOKENS,
```
Add `translateEffortForCodex,` here. (CLAUDE.md convention: single trailing `module.exports`, public helper exported by name.)

---

**Analog B — haiku guard placement inside the resolver:** `resolveReasoningEffortInternal` (core.cjs:1612-1696)

The function is a numbered precedence chain (steps 0-5). `bareTier` is computed at core.cjs:1639; the catalog `codex.haiku` slot carries `reasoning_effort: "medium"`, so step 5 (`_resolveRuntimeTier`, line 1689-1690) and the D-08 floor (line 1695) would both emit `medium` for haiku unless short-circuited first.

Existing `bareTier` computation + the inherit-tier short-circuit that the new guard sits beside (core.cjs:1636-1639):
```javascript
  // RESOLVE-06: inherit/unknown resolved tier → no effort.
  if (!tier || tier === 'inherit') return null;

  // Strip any ;effort suffix before lookup (keys are bare tier aliases).
  const bareTier = parseModelEffort(tier).model;
```

Existing tail the guard must precede — step 5 + D-08 floor (core.cjs:1689-1695):
```javascript
  const entry = _resolveRuntimeTier(config, bareTier);
  if (entry?.reasoning_effort) return entry.reasoning_effort;

  // D-08: floor un-assigned {claude,codex} slots to 'medium'.
  return 'medium';
```

**New guard to insert** immediately after core.cjs:1639 (before steps 3/3a/4/5 and the floor), per D-03:
```javascript
  // D-03 (Phase 57): haiku supports no effort on any runtime. Tier-based exclusion
  // overrides the Phase 56 D-08 medium floor for haiku slots — bare haiku stays null,
  // never floors to medium, and never inherits the catalog haiku reasoning_effort.
  if (bareTier === 'haiku') return null;
```

**Decision flag for planner (RESEARCH A1 / Open Q1):** the per-agent override path returns at core.cjs:1626 BEFORE this guard. If D-03's "haiku omits on every runtime, full stop" must beat an explicit `model_overrides.x = "haiku;high"`, the override branch (line 1625-1627) also needs a `parseModelEffort(override).model === 'haiku'` check. Confirm before locking.

---

### `bin/install.js` (config emitter / transform) — two edits

**Analog A — import pattern:** install.js:159-162

Current import destructures core.cjs with renamed bindings (`gsd*` prefix):
```javascript
const {
  RUNTIME_PROFILE_MAP: GSD_RUNTIME_PROFILE_MAP,
  resolveTierEntry: gsdResolveTierEntry,
} = require(path.join(_gsdLibDir, 'core.cjs'));
```
Add `resolveReasoningEffortInternal: gsdResolveReasoningEffort,` and `translateEffortForCodex: gsdTranslateEffortForCodex,` to this destructure (same `gsd*`-rename convention).

**Analog B — the emit seam to redirect:** `generateCodexAgentToml` (install.js:2719-2761)

Current seam — model AND effort both sourced from the same per-tier `entry` (install.js:2745-2751):
```javascript
  } else if (runtimeResolver) {
    const entry = runtimeResolver.resolve(resolvedName) || runtimeResolver.resolve(agentName);
    if (entry?.model) {
      lines.push(`model = ${JSON.stringify(entry.model)}`);
      if (entry.reasoning_effort) {
        lines.push(`model_reasoning_effort = ${JSON.stringify(entry.reasoning_effort)}`);
      }
    }
  }
```

**Redirect target** (per RESEARCH Architecture Patterns):
- `model` stays sourced from `entry.model` (`runtimeResolver.resolve()`) — UNCHANGED (Pitfall 2: don't drop the Codex-native model).
- `reasoning_effort` moves to: `translateEffortForCodex(resolveReasoningEffortInternal(projectDir, gsd-<agentName>))`, emitted only when truthy.

**cwd threading (RESEARCH A2, recommended):** extend `readGsdRuntimeProfileResolver` (install.js:1449-1512) — which already returns `{ runtime, resolve(agentName) }` at lines 1498-1511 and already probes the project dir at lines 1460-1472 — with a sibling `resolveEffort(agentName)` that calls `gsdResolveReasoningEffort(probeDir, agentName)`. Mirrors the existing `resolve(agentName)` shape; keeps the cwd-probe in one place. Capture `probeDir` from the existing walk-up loop so the resolver closes over it.

Existing resolver-object shape to mirror (install.js:1498-1511):
```javascript
  return {
    runtime: merged.runtime,
    resolve(agentName) {
      ...
      return gsdResolveTierEntry({ runtime: merged.runtime, tier, overrides: ... });
    },
  };
```

**Call site** (install.js:5018-5019) stays unchanged if the effort resolver is folded into the existing `runtimeResolver` object:
```javascript
    const runtimeResolver = readGsdRuntimeProfileResolver(targetDir);
    const tomlContent = generateCodexAgentToml(name, content, modelOverrides, runtimeResolver);
```

**Exports** already in place — `generateCodexAgentToml` (install.js:11402) and `readGsdRuntimeProfileResolver` (install.js:11412) are exported under `GSD_TEST_MODE`; no export change needed.

---

### `tests/feat-57-install-translation.test.cjs` (test) — NEW, composite of three analogs

**Analog A — resolver units + temp config:** `tests/feat-53-unified-effort-resolver.test.cjs`

Mirror: `process.env.GSD_TEST_MODE='1'` at top; `node:test` + `node:assert/strict`; `createTempDir` from `./helpers.cjs`; local `writeConfig(projectDir, config)` planting `.planning/config.json`; `_resetEffortWarningCacheForTests()` in `beforeEach`; per-suite temp dir cleanup in `afterEach`.

Setup pattern (feat-53:18-49):
```javascript
process.env.GSD_TEST_MODE = '1';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { resolveReasoningEffortInternal, _resetEffortWarningCacheForTests } =
  require('../get-shit-done/bin/lib/core.cjs');
const { createTempDir } = require('./helpers.cjs');

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}
```
Assertion style (feat-53:59): `assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), 'high');`

Use for: resolver-stays-Claude-form-neutral (never `xhigh`), haiku→`null` on claude AND codex (no medium floor) — INSTALL-01/INSTALL-02 unit rows.

**Analog B — Codex TOML emit integration:** `tests/codex-config.test.cjs`

Mirror: `process.env.GSD_TEST_MODE='1'`; the `before()` hook that builds `hooks/dist/` on demand (codex-config:30-39) if exercising full `install`; import `generateCodexAgentToml` + `readGsdRuntimeProfileResolver` from `../bin/install.js` (codex-config:41-55). Assert presence/absence of the `model_reasoning_effort` line in the returned TOML string.

Use for: opus slot assigned `max` emits `model_reasoning_effort = "xhigh"`; bare opus/sonnet emits `"medium"` (floor); haiku-tier emits NO `model_reasoning_effort` line; non-`{claude,codex}` install emits no effort — INSTALL-02 integration rows.

**Analog C — pure-fn parity (table over tokens):** `tests/parse-model-effort.test.cjs`

Mirror the loop-over-allowlist + exact-equality assertion shape (parse-model-effort:28-43):
```javascript
test('parseModelEffort is exported as a function', () => {
  assert.strictEqual(typeof core.parseModelEffort, 'function');
});
test('... every allowlist token ...', () => {
  for (const token of ['low', 'medium', 'high', 'xhigh', 'max']) {
    assert.deepStrictEqual(core.parseModelEffort(`opus;${token}`), { model: 'opus', effort: token });
  }
});
```

Use for `translateEffortForCodex` units: `'max'→'xhigh'`; `'low'/'medium'/'high'` pass through; `null→null`. **TEST-04:** exact `assert.strictEqual` / `assert.equal` — no `indexOf`/substring on `medium`/`high`.

---

## Shared Patterns

### Effort resolution = single source of truth (D-01)
**Source:** `resolveReasoningEffortInternal` (core.cjs:1612)
**Apply to:** both core.cjs (haiku guard lives here) and install.js (sources effort from here, never re-derives from catalog). Anti-pattern to avoid: keeping `entry.reasoning_effort` as the install-side effort source.

### Claude→Codex translation = boundary concern (D-02)
**Source:** new `translateEffortForCodex` (core.cjs)
**Apply to:** only the install.js Codex emit seam (install.js:2748-2749). Resolver stays Claude-form-neutral (returns `max` verbatim).

### Temp-config test fixture
**Source:** `writeConfig(projectDir, config)` + `createTempDir` (`tests/helpers.cjs`, used in feat-53 + parse-model-effort)
**Apply to:** all new resolver/integration tests. No new fixtures needed (RESEARCH Wave 0).

### Exact-equality assertions (TEST-04)
**Source:** parse-model-effort.test.cjs (`assert.deepStrictEqual` / `assert.strictEqual`)
**Apply to:** all translation/resolver assertions. No `indexOf`/substring on effort tokens.

### Import-rename convention
**Source:** install.js:159-162 (`gsd*`-prefixed destructure bindings)
**Apply to:** new core.cjs imports in install.js.

## No Analog Found

None — every new/modified file has an in-repo, line-anchored analog.

## Metadata

**Analog search scope:** `get-shit-done/bin/lib/core.cjs`, `bin/install.js`, `tests/`
**Files scanned:** core.cjs (resolver + helpers + exports), install.js (import, resolver, emit seam, call site, exports), feat-53/codex-config/parse-model-effort test files
**Pattern extraction date:** 2026-06-05
