# Phase 58: Regression Coverage - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 4
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tests/feat-58-regression.test.cjs` | test | request-response (unit) | `tests/feat-53-config-sites-and-golden.test.cjs` | exact |
| `tests/fixtures/golden-effort-snapshot.json` | fixture | batch | `tests/fixtures/parse-model-effort.json` | exact |
| `scripts/gen-golden-effort-snapshot.mjs` | utility | batch / file-I/O | `sdk/scripts/gen-project-root.mjs` | exact |
| `tests/fixtures/parse-model-effort.json` | fixture | transform | `tests/fixtures/parse-model-effort.json` (self) | exact |

---

## Pattern Assignments

### `tests/feat-58-regression.test.cjs` (test, unit)

**Analog:** `tests/feat-53-config-sites-and-golden.test.cjs`

**Imports pattern** (lines 1-51 of analog):
```javascript
'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  resolveReasoningEffortInternal,
  resolveModelInternal,
  _resolveAgentSlot,
  parseModelEffort,
  _resetEffortWarningCacheForTests,
} = require('../get-shit-done/bin/lib/core.cjs');

const {
  MODEL_PROFILES,
} = require('../get-shit-done/bin/lib/model-catalog.cjs');

const { createTempDir } = require('./helpers.cjs');

const makeTmp = (prefix) => createTempDir(`gsd-58-${prefix}-`);
```

**writeConfig + rmr helpers** (lines 43-51 of analog):
```javascript
function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}
```

**Static golden test pattern** (lines 243-308 of analog, inverted for static use — research §Code Examples):

The analog (feat-53 lines 264-283) shows the DYNAMIC pattern to avoid: it derives `expectedEffort` from `_resolveAgentSlot` at test time. The feat-58 pattern reads from the committed fixture instead:
```javascript
// ─── TEST-01: Static golden snapshot ────────────────────────────────────────
describe('TEST-01: static golden snapshot — post-D-08 resolver values', () => {
  const fixture = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'fixtures', 'golden-effort-snapshot.json'), 'utf-8'
  ));

  for (const row of fixture.rows) {
    test(`golden: ${row.agent}/${row.profile}/${row.runtime}`, () => {
      const d = makeTmp('golden');
      _resetEffortWarningCacheForTests();
      writeConfig(d, { runtime: row.runtime, model_profile: row.profile });
      try {
        assert.strictEqual(resolveModelInternal(d, row.agent), row.expectedModel);
        assert.strictEqual(resolveReasoningEffortInternal(d, row.agent), row.expectedEffort);
      } finally { rmr(d); }
    });
  }

  for (const row of fixture.omitContract) {
    test(`omit contract: runtime=${row.runtime} → effort null`, () => {
      const d = makeTmp('omit');
      _resetEffortWarningCacheForTests();
      writeConfig(d, { runtime: row.runtime, model_profile: row.sampleProfile });
      try {
        assert.strictEqual(resolveReasoningEffortInternal(d, row.sampleAgent), null);
      } finally { rmr(d); }
    });
  }
});
```

**Matrix iteration pattern** (analog lines 244-262 — how feat-53 sets up per-profile beforeEach):
```javascript
// feat-53 analog: iterates agents = Object.keys(MODEL_PROFILES), profiles = [...].
// feat-58 does NOT use this for TEST-01 (fixture drives iteration).
// Reuse for TEST-03 per-runtime omit contract if emitting inline (not via fixture):
const KNOWN_RUNTIMES = require('../get-shit-done/bin/lib/model-catalog.cjs').KNOWN_RUNTIMES;
const RUNTIMES_WITH_REASONING_EFFORT = require('../get-shit-done/bin/lib/model-catalog.cjs').RUNTIMES_WITH_REASONING_EFFORT;
const nonEffortRuntimes = [...KNOWN_RUNTIMES].filter(r => !RUNTIMES_WITH_REASONING_EFFORT.has(r));
```

**Error handling / cleanup pattern** (analog lines 253-262):
```javascript
// beforeEach/afterEach with rmr cleanup — use try/finally in flat tests instead:
try {
  // assertions
} finally { rmr(d); }
```

---

### `tests/fixtures/golden-effort-snapshot.json` (fixture, batch)

**Analog:** `tests/fixtures/parse-model-effort.json` (lines 1-14)

**Fixture shape of analog:**
```json
[
  { "input": "opus", "expectedModel": "opus", "expectedEffort": null },
  { "input": "opus;high", "expectedModel": "opus", "expectedEffort": "high" },
  { "input": "openrouter:anthropic/claude-opus", "expectedModel": "openrouter:anthropic/claude-opus", "expectedEffort": null }
]
```

**New fixture shape** (from RESEARCH.md §Q1):
```json
{
  "generated": "2026-06-06",
  "description": "Static post-D-08 golden: agent × profile × runtime",
  "rows": [
    {
      "agent": "gsd-planner",
      "profile": "quality",
      "runtime": "claude",
      "expectedModel": "<literal-string>",
      "expectedEffort": "<literal-string-or-null>"
    }
  ],
  "omitContract": [
    {
      "runtime": "gemini",
      "sampleAgent": "gsd-executor",
      "sampleProfile": "balanced",
      "expectedEffort": null
    }
  ]
}
```

Key design rules from CONTEXT.md D-01 / D-02:
- `rows`: 33 agents × 4 profiles (quality/balanced/budget/inherit) × 2 runtimes (claude/codex) = up to 264 effort rows.
- `omitContract`: 1 row per non-effort runtime (13 runtimes: KNOWN_RUNTIMES minus {claude, codex}).
- ALL `expectedModel` and `expectedEffort` values are **literal strings** produced by running `scripts/gen-golden-effort-snapshot.mjs` once and committing the output. The test reads them; the resolver cannot shift them.
- Haiku agents always have `expectedEffort: null` regardless of profile (RESEARCH.md §Q4 — haiku guard fires before D-08 floor at core.cjs:1663).

---

### `scripts/gen-golden-effort-snapshot.mjs` (utility, file-I/O)

**Analog:** `sdk/scripts/gen-project-root.mjs`

**Imports pattern** (analog lines 1-16):
```javascript
#!/usr/bin/env node
/**
 * Regenerates tests/fixtures/golden-effort-snapshot.json.
 * Run: node scripts/gen-golden-effort-snapshot.mjs
 */

import { writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
```

**Atomic write pattern** (analog lines 86-99 — mandatory, prevents truncate race #260531-rej):
```javascript
const outPath = fileURLToPath(new URL('../tests/fixtures/golden-effort-snapshot.json', import.meta.url));
const tmpPath = `${outPath}.tmp-${process.pid}-${Date.now()}`;
try {
  await writeFile(tmpPath, JSON.stringify(fixture, null, 2), 'utf-8');
  await rename(tmpPath, outPath);
} catch (err) {
  await unlink(tmpPath).catch(() => {});
  throw err;
}
console.log(`Written: ${outPath}`);
```

**Core matrix iteration** (from RESEARCH.md §Q1 and §Q2):
```javascript
const {
  resolveReasoningEffortInternal,
  resolveModelInternal,
} = require('./get-shit-done/bin/lib/core.cjs');
const {
  MODEL_PROFILES,
  KNOWN_RUNTIMES,
  RUNTIMES_WITH_REASONING_EFFORT,
} = require('./get-shit-done/bin/lib/model-catalog.cjs');

const agents = Object.keys(MODEL_PROFILES);
const profiles = ['quality', 'balanced', 'budget', 'inherit'];
const effortRuntimes = [...RUNTIMES_WITH_REASONING_EFFORT]; // ['claude', 'codex']
const nonEffortRuntimes = [...KNOWN_RUNTIMES].filter(r => !RUNTIMES_WITH_REASONING_EFFORT.has(r));
```

**Entry-point guard** (analog line ~103-106):
```javascript
// Only run when invoked directly (not imported)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) main().catch(err => { console.error(err); process.exit(1); });
```

---

### `tests/fixtures/parse-model-effort.json` (fixture, transform — MODIFY)

**Current content** (all 14 lines, read directly):
```json
[
  { "input": "opus", "expectedModel": "opus", "expectedEffort": null },
  { "input": "opus;high", "expectedModel": "opus", "expectedEffort": "high" },
  { "input": "opus;low", "expectedModel": "opus", "expectedEffort": "low" },
  { "input": "opus;medium", "expectedModel": "opus", "expectedEffort": "medium" },
  { "input": "opus;xhigh", "expectedModel": "opus", "expectedEffort": "xhigh" },
  { "input": "opus;max", "expectedModel": "opus", "expectedEffort": "max" },
  { "input": "openrouter:anthropic/claude-opus", "expectedModel": "openrouter:anthropic/claude-opus", "expectedEffort": null },
  { "input": "opus;hihg", "expectedModel": "opus", "expectedEffort": null },
  { "input": "a;b;high", "expectedModel": "a;b", "expectedEffort": "high" },
  { "input": "a;b;hihg", "expectedModel": "a;b", "expectedEffort": null },
  { "input": "opus;", "expectedModel": "opus", "expectedEffort": null },
  { "input": "", "expectedModel": "", "expectedEffort": null }
]
```

**Two cases to ADD** (RESEARCH.md §Q3 — gaps for TEST-02):
```json
{ "input": "bedrock:us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "expectedModel": "bedrock:us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "expectedEffort": null },
{ "input": "openrouter:anthropic/claude-opus;high",
  "expectedModel": "openrouter:anthropic/claude-opus",
  "expectedEffort": "high" }
```

Rationale: multi-colon provider ID → effort null; colon-provider WITH valid suffix → effort extracted. These extend the existing parity harness (`parse-model-effort-parity.test.cjs`) automatically since it reads this same file.

---

## Shared Patterns

### `process.env.GSD_TEST_MODE` setup
**Source:** `tests/feat-53-config-sites-and-golden.test.cjs` line 20
**Apply to:** `tests/feat-58-regression.test.cjs`
```javascript
process.env.GSD_TEST_MODE = '1';
```
Must appear before any `require('../get-shit-done/bin/lib/core.cjs')` call.

### `assert/strict` vs `assert`
**Source:** `tests/feat-53-config-sites-and-golden.test.cjs` line 23
**Apply to:** `tests/feat-58-regression.test.cjs`
```javascript
const assert = require('node:assert/strict');
```
Use `assert/strict` (not bare `assert`) — this ensures `assert.strictEqual` without the `strict` qualifier on each call and avoids the `assert.ok(indexOf(...))` loose-equal trap.

### `_resetEffortWarningCacheForTests`
**Source:** `tests/feat-53-config-sites-and-golden.test.cjs` lines 255-256
**Apply to:** `tests/feat-58-regression.test.cjs` — call before each resolver invocation to prevent warning-suppression state from leaking between golden rows.
```javascript
_resetEffortWarningCacheForTests();
```

### Section banners
**Source:** `tests/feat-53-config-sites-and-golden.test.cjs` line 241
**Apply to:** `tests/feat-58-regression.test.cjs`
```javascript
// ─── TEST-01: Static golden snapshot ────────────────────────────────────────
// ─── TEST-02: Parser fixture cases ──────────────────────────────────────────
// ─── TEST-03: Per-runtime omit/translate contract ───────────────────────────
// ─── TEST-04: Antipattern guard ─────────────────────────────────────────────
```

---

## No Analog Found

All four files have analogs. No files require falling back to RESEARCH.md patterns exclusively.

---

## Key Contrast: Static vs Dynamic Golden

The central design decision for TEST-01 is the inversion of the feat-53 pattern:

| Property | feat-53 (dynamic, keep) | feat-58 (static, new) |
|----------|------------------------|-----------------------|
| Expected value source | `_resolveAgentSlot` + `parseModelEffort` at test time | Literal string in committed JSON |
| Catches wrong-but-consistent drift | No — resolver shift moves expected too | Yes — literal never moves |
| Catches same-slot invariant break | Yes | No (feat-53 owns this) |
| Analog lines | feat-53:264-283 | RESEARCH.md §Code Examples |

Planner note: the executor must run `node scripts/gen-golden-effort-snapshot.mjs` once, inspect the JSON, verify the literal values match the post-D-08 expectations described in CONTEXT.md §D-01, then commit the fixture. The test is written first with `assert.strictEqual` against fixture literals; the fixture is committed after manual verification.

---

## Metadata

**Analog search scope:** `tests/`, `sdk/scripts/`, `tests/fixtures/`
**Files scanned:** 5 analog files read
**Pattern extraction date:** 2026-06-06
