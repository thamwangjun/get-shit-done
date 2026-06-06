# Phase 55: Catalog Schema + User Handover - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `sdk/src/model-catalog.ts` | model/type | transform | itself (existing interfaces) | exact |
| `sdk/shared/model-catalog.json` | config | transform | itself (existing structure) | exact |
| `get-shit-done/bin/lib/core.cjs` — `resolveModelInternal` | utility | transform | `resolveReasoningEffortInternal` in same file (already calls `parseModelEffort`) | role-match |
| `sdk/src/query/config-query.ts` — `resolveModel` handler | service | request-response | override path in same function (already calls `parseModelEffort`) | exact |

## Pattern Assignments

---

### `sdk/src/model-catalog.ts` — interface widening (CATALOG-01 / CATALOG-03)

**Analog:** itself — existing interface definitions at lines 11–25.

**Current interfaces to change** (lines 11–25):
```typescript
interface AgentCatalogEntry {
  golden: 'opus' | 'sonnet' | 'haiku';   // widen to string
  balanced: 'opus' | 'sonnet' | 'haiku'; // widen to string
  budget: 'opus' | 'sonnet' | 'haiku';   // widen to string
  phaseType: string;
  routingTier: 'light' | 'standard' | 'heavy';
}

interface ModelCatalog {
  profiles: string[];
  phaseTypes: string[];
  adaptiveTierMap: Record<'light' | 'standard' | 'heavy', 'opus' | 'sonnet' | 'haiku'>; // widen value to string
  runtimeTierDefaults: RuntimeTierTable;
  agents: Record<string, AgentCatalogEntry>;
}
```

**After pattern** (exact text to produce, per RESEARCH.md Code Examples):
```typescript
// Profile slot values accept plain tier aliases ('opus', 'sonnet', 'haiku') or
// 'model;effort' strings (e.g. 'opus;high'). The ';' delimiter is intentional —
// provider IDs like 'openrouter:anthropic/...' use ':' which never conflicts.
// parseModelEffort() validates effort tokens against EFFORT_TOKENS at runtime.
//
// adaptiveTierMap values follow the same syntax and resolve at precedence step 3
// (same level as per-agent profile slots, not as a step-4 fallback).
// RESOLVE-02: per-agent override → phase-type slot → profile slot/adaptiveTierMap → omit.
interface AgentCatalogEntry {
  golden: string;    // was: 'opus' | 'sonnet' | 'haiku'
  balanced: string;  // was: 'opus' | 'sonnet' | 'haiku'
  budget: string;    // was: 'opus' | 'sonnet' | 'haiku'
  phaseType: string;
  routingTier: 'light' | 'standard' | 'heavy';
}

interface ModelCatalog {
  profiles: string[];
  phaseTypes: string[];
  adaptiveTierMap: Record<'light' | 'standard' | 'heavy', string>;  // was: ...'haiku'
  runtimeTierDefaults: RuntimeTierTable;
  agents: Record<string, AgentCatalogEntry>;
}
```

**Invariant: do NOT widen** (lines 69, 79):
```typescript
// These stay narrow — intentional:
export function resolveRuntimeTierDefault(runtime: string, alias: 'opus' | 'sonnet' | 'haiku'): ...
// EFFORT_TOKENS stays unchanged — only the interface field types widen
```

**Validation command:** `cd sdk && npx tsc --noEmit`

---

### `sdk/shared/model-catalog.json` — schema annotation (D-03)

**Analog:** itself — existing JSON structure. Profile slot values are already plain strings in JSON; no structural change is needed.

**JSON cannot carry real comments.** Per D-03 (Claude's Discretion), the comment is placed either as a `"_schema_note"` key at the top level or (preferred) as a multiline comment block in `sdk/src/model-catalog.ts` above `AgentCatalogEntry`. The TS interface comment block (shown above) is the primary annotation.

**Optional JSON annotation pattern** — add after the opening brace, before `"profiles"`:
```json
{
  "_schema_note": "Profile slot values (golden/balanced/budget) and adaptiveTierMap values accept plain tier aliases ('opus', 'sonnet', 'haiku') or 'model;effort' strings (e.g. 'opus;high'). Delimiter is ';' not ':'. Do NOT pre-fill effort values — see sdk/src/model-catalog.ts AgentCatalogEntry for the authoritative type definition.",
  "profiles": ["quality", "balanced", "budget", "adaptive", "inherit"],
  ...
}
```

**Existing adaptiveTierMap structure** (lines 4–8 — no structural change):
```json
"adaptiveTierMap": {
  "heavy": "opus",
  "standard": "sonnet",
  "light": "haiku"
}
```

**Constraint:** Do NOT pre-fill effort values. The `agents` section entries keep their current bare `"opus"` / `"sonnet"` / `"haiku"` values. CATALOG-02 is user-owned.

---

### `get-shit-done/bin/lib/core.cjs` — `resolveModelInternal` one-line fix (Pitfall 1)

**Analog:** `resolveReasoningEffortInternal` in the same file — already calls `parseModelEffort(tier).model` at line 1632 to strip the `;effort` suffix before using the bare tier. The model resolver must mirror this pattern.

**Current code at line 1474** (the bug — `tier` may carry `";effort"` suffix after CATALOG-02):
```javascript
  const alias = tier;
```

**After fix** (strip suffix before alias lookup):
```javascript
  const alias = parseModelEffort(tier).model;
  // parseModelEffort('opus;medium').model === 'opus'
  // parseModelEffort('opus').model === 'opus'  (no-op for bare aliases)
```

**Context: lines 1470–1483** (full local context for the change):
```javascript
  // Gate on tier (not profile) so a valid phase-type override beats
  // profile=inherit (#3030 CR Major).
  if (tier === 'inherit') return 'inherit';
  // `tier` is guaranteed truthy here: agentModels exists, and MODEL_PROFILES
  // entries always define `balanced`, so `agentModels[profile] || agentModels.balanced`
  // resolves to a string. Keep the local for readability — no defensive fallback.
  const alias = tier;  // <-- CHANGE THIS LINE

  // resolve_model_ids: true — map alias to full Claude model ID.
  if (config.resolve_model_ids) {
    return MODEL_ALIAS_MAP[alias] || alias;
  }

  return alias;
}
```

**Analog pattern for reference** — `resolveReasoningEffortInternal` at lines 1626–1632:
```javascript
  const tier = _resolveAgentSlotFromConfig(config, agentType);
  // ...
  const slotEffort = parseModelEffort(tier).effort;
  // ...
  const bareTier = parseModelEffort(tier).model;  // <-- this is the pattern to mirror
```

**Why `parseModelEffort` is safe as a no-op for bare values:**
`parseModelEffort('opus')` returns `{ model: 'opus', effort: null }` — `.model` is identical to the input for bare tier aliases. Zero behavior change on an unmodified catalog.

**Verification:** After fix, `gsd-tools.cjs query resolve-model gsd-planner` must output `model: opus` (not `model: opus;medium`) when a slot carries `"opus;medium"`.

---

### `sdk/src/query/config-query.ts` — `resolveModel` handler alias fix (Pitfall 1, SDK side)

**Analog:** Override path in the same function (lines 256–257) — already calls `parseModelEffort(override).model` to strip the suffix. The profile slot path must mirror this.

**Current code at line 289** (the bug — `agentModels[profile]` may carry `";effort"` suffix):
```typescript
  const alias = agentModels[profile] || agentModels['balanced'] || 'sonnet';
```

**After fix:**
```typescript
  const rawAlias = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  const alias = (parseModelEffort(rawAlias).model as string) || rawAlias;
```

**Context: lines 285–295** (surrounding code for orientation):
```typescript
  if (profile === 'inherit') {
    return { data: { model: 'inherit', profile, effort: null } };
  }

  const alias = agentModels[profile] || agentModels['balanced'] || 'sonnet';  // <-- CHANGE
  const phaseType = AGENT_TO_PHASE_TYPE[agentType];
  const phaseTier = phaseType && typeof (config as Record<string, unknown>).models === 'object'
    ? ((config as Record<string, unknown>).models as Record<string, unknown>)[phaseType]
    : undefined;
  const tier = typeof phaseTier === 'string' ? phaseTier : alias;
  const runtimeTier = resolveRuntimeTier(config as Record<string, unknown>, tier);
```

**Analog pattern in same function** (lines 256–257 — already correct):
```typescript
  const overrideEffort = effortAllowed ? (parseModelEffort(override).effort ?? null) : null;
  const overrideModel = (parseModelEffort(override).model as string) || override;
```

**Note:** `parseModelEffort` is already imported at line 32 of `config-query.ts` — no new import needed.

---

## Shared Patterns

### `parseModelEffort` — suffix stripping (apply to both resolver fixes)

**Source:** `sdk/src/model-catalog.ts` lines 100–120 (TS) and `get-shit-done/bin/lib/core.cjs` lines 1242+ (CJS mirror)

**Contract:**
```typescript
parseModelEffort('opus')         // → { model: 'opus', effort: null }   — no-op for bare alias
parseModelEffort('opus;medium')  // → { model: 'opus', effort: 'medium' }
parseModelEffort('opus;')        // → { model: 'opus', effort: null }   — trailing semicolon stripped silently
parseModelEffort('opus;unknown') // → { model: 'opus', effort: null }   — invalid token, one-time stderr warning
```

**Apply to:** Any place a catalog slot value is used as a model identifier. Specifically the two lines being changed in this phase.

---

### Completeness check script (post-handover, D-04)

**Source:** Designed in RESEARCH.md §Completeness Check Script Design; no existing analog — first use.

**Script location:** `.planning/phases/55-catalog-schema-user-handover/check-completeness.js`

**Pattern** (from RESEARCH.md verified design):
```javascript
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = process.cwd();
const { resolveReasoningEffortInternal } = require(
  path.join(projectRoot, 'get-shit-done/bin/lib/core.cjs')
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'sdk/shared/model-catalog.json'), 'utf-8')
);

// Create a temp dir with minimal config so the allowlist gate passes.
// Pitfall 2: without runtime:'claude' the gate returns null for every agent.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-catalog-check-'));
fs.writeFileSync(
  path.join(tmpDir, 'config.json'),
  JSON.stringify({ runtime: 'claude', model_profile: 'balanced' })
);

const agents = Object.keys(catalog.agents);
const missing = agents.filter(a => resolveReasoningEffortInternal(tmpDir, a) === null);
fs.rmSync(tmpDir, { recursive: true });

if (missing.length > 0) {
  console.error(`FAIL: ${missing.length} agents missing effort assignment:`);
  missing.forEach(a => console.error(`  - ${a}`));
  process.exit(1);
}
console.log(`PASS: all ${agents.length} agents have assigned effort values.`);
```

**Critical detail (Pitfall 2):** The temp `config.json` MUST include `{ "runtime": "claude", "model_profile": "balanced" }`. A temp dir with no `config.json` causes `resolveReasoningEffortInternal` to return `null` for every agent at the first-line gate, reporting 33 false failures.

**Run command:** `node .planning/phases/55-catalog-schema-user-handover/check-completeness.js` (from project root)

---

### Back-compat invariant (carry forward from Phase 53/54)

**Source:** `get-shit-done/bin/lib/core.cjs` line 1626: `parseModelEffort(tier).effort` returns `null` for bare `"opus"` / `"sonnet"` / `"haiku"` catalog values.

**Applies to:** All four files. On a bare catalog (no `;effort` suffixes), every resolver returns `effort: null` and every model resolver returns the plain tier alias unchanged. Zero behavior change until CATALOG-02 assignment.

---

## No Analog Found

No files in this phase are entirely novel. All four files already exist; the completeness check script is new but is a straightforward Node.js script using only already-verified patterns from `core.cjs`.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.planning/phases/55-catalog-schema-user-handover/check-completeness.js` | utility/script | batch | New file with no codebase analog, but designed entirely from existing `resolveReasoningEffortInternal` contract — see Completeness check script pattern above |

---

## Metadata

**Analog search scope:** `sdk/src/`, `sdk/shared/`, `get-shit-done/bin/lib/`
**Files read:** `sdk/src/model-catalog.ts` (128 lines, complete), `sdk/shared/model-catalog.json` (first 30 lines), `get-shit-done/bin/lib/core.cjs` (targeted reads: lines 1360–1483), `sdk/src/query/config-query.ts` (targeted reads: lines 228–339)
**Pattern extraction date:** 2026-06-02
