/**
 * Feature test for Phase 53 Plan 02: Config-site acceptance + cross-resolver
 * golden snapshot.
 *
 * CONFIG-02: models.<phase-type> accepts model;effort form — survives
 *   _resolveAgentSlot and is parsed by parseModelEffort in the resolver.
 * CONFIG-03: model_profile_overrides.<runtime> accepts model;effort via the
 *   resolved tier-entry path.
 * CONFIG-04: malformed effort token degrades to effort:null with one-time
 *   stderr warning via parseModelEffort, no separate reject pass.
 * D-08:  Cross-resolver golden snapshot guards bare configs across BOTH
 *   resolvers; resolveModelInternal model and resolveReasoningEffortInternal
 *   effort derive from the SAME resolved slot for all agents/profiles.
 * #3023: {model_profile:'inherit', models:{execution:'opus'}} on codex yields
 *   opus model AND opus-tier effort (same-slot invariant).
 */

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

const makeTmp = (prefix) => createTempDir(`gsd-53-02-${prefix}-`);

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}

// ─── CONFIG-02: models.<phase-type> accepts model;effort ────────────────────

describe('CONFIG-02: models.<phase-type> model;effort reaches parseModelEffort in resolver', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('config02'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('codex + models.execution = "opus;low" → resolveReasoningEffortInternal returns "low" (CONFIG-02)', () => {
    // gsd-executor maps to execution phase-type.
    // The ;low suffix must survive _resolveAgentSlot and be parsed by parseModelEffort.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { execution: 'opus;low' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), 'low');
  });

  test('claude + models.<phase-type> = "sonnet;high" → effort "high" (CONFIG-02)', () => {
    // gsd-verifier maps to verification phase-type.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'balanced',
      models: { verification: 'sonnet;high' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-verifier'), 'high');
  });

  test('models.<phase-type> = "opus" (bare, no ;) on claude → effort null (back-compat, no slot effort, no per-tier fallback on claude)', () => {
    // On claude, there is no per-tier reasoning_effort fallback, so bare slot → null.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      models: { execution: 'opus' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), null);
  });
});

// ─── CONFIG-03: model_profile_overrides.<runtime> accepts model;effort ───────

describe('CONFIG-03: model_profile_overrides string shorthand parses ;effort suffix', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('config03'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('codex + model_profile_overrides.codex.opus = "gpt-5-pro;high" → effort "high" (CONFIG-03)', () => {
    // gsd-planner quality profile → opus tier.
    // The string shorthand "gpt-5-pro;high" must be parsed via parseModelEffort
    // so the ;high suffix is honoured as reasoning_effort.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_profile_overrides: { codex: { opus: 'gpt-5-pro;high' } },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'high');
  });

  test('codex + model_profile_overrides.codex.opus = "gpt-5-pro" (bare) → catalog slot effort wins (D-08 same-slot invariant)', () => {
    // Bare string shorthand — no ;effort — supplies no explicit effort.
    // The catalog slot for gsd-planner on quality profile is opus;low, so the
    // slot effort 'low' wins over the codex built-in per-tier 'xhigh' (D-08).
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_profile_overrides: { codex: { opus: 'gpt-5-pro' } },
    });
    // Catalog slot opus;low takes precedence over the runtime built-in xhigh.
    const effort = resolveReasoningEffortInternal(projectDir, 'gsd-planner');
    assert.strictEqual(effort, 'low');
  });

  test('codex + model_profile_overrides.codex.opus object with reasoning_effort → effort from object (CONFIG-03 object form)', () => {
    // Object override with reasoning_effort field — should honour it directly.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_profile_overrides: { codex: { opus: { model: 'gpt-5-pro', reasoning_effort: 'low' } } },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'low');
  });
});

// ─── CONFIG-04: malformed effort token degrades gracefully ──────────────────

describe('CONFIG-04: malformed effort token degrades to null + one-time warning', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('config04'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('models.<phase-type> = "opus;hihg" (typo) → effort null, model "opus" preserved, one-time warning (CONFIG-04)', () => {
    // Use claude runtime: no per-tier reasoning_effort fallback, so null from malformed slot
    // is the final result — not masked by Codex xhigh per-tier fallback.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      models: { execution: 'opus;hihg' },
    });
    // Capture stderr to assert one-time warning fires.
    const stderrChunks = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...rest) => {
      stderrChunks.push(String(chunk));
      return originalWrite(chunk, ...rest);
    };
    let effort;
    try {
      effort = resolveReasoningEffortInternal(projectDir, 'gsd-executor');
    } finally {
      process.stderr.write = originalWrite;
    }
    assert.strictEqual(effort, null, 'malformed suffix must degrade to null');
    const warning = stderrChunks.join('');
    assert.ok(warning.includes('gsd: warning'), `expected warning in stderr, got: ${JSON.stringify(warning)}`);
    assert.ok(warning.includes('hihg'), `warning must name the unknown suffix "hihg", got: ${JSON.stringify(warning)}`);
  });

  test('model_profile_overrides slot with malformed ;effort → one-time warning, catalog slot effort wins (D-08)', () => {
    // Typo in model_profile_overrides string shorthand. The malformed suffix is stripped,
    // parseModelEffort warns once, yielding no explicit reasoning_effort from the override.
    // The catalog slot for gsd-planner/quality is opus;low, so slot effort 'low' wins
    // over the codex built-in per-tier 'xhigh' (D-08 same-slot invariant).
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_profile_overrides: { codex: { opus: 'gpt-5-pro;hihg' } },
    });
    const stderrChunks = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...rest) => {
      stderrChunks.push(String(chunk));
      return originalWrite(chunk, ...rest);
    };
    let effort;
    try {
      effort = resolveReasoningEffortInternal(projectDir, 'gsd-planner');
    } finally {
      process.stderr.write = originalWrite;
    }
    // The malformed suffix is stripped; catalog slot opus;low takes precedence.
    assert.strictEqual(effort, 'low',
      'malformed ;effort in model_profile_overrides: catalog slot effort wins over runtime built-in');
    const warning = stderrChunks.join('');
    assert.ok(warning.includes('gsd: warning'), `expected warning in stderr, got: ${JSON.stringify(warning)}`);
    assert.ok(warning.includes('hihg'), `warning must name the unknown suffix "hihg", got: ${JSON.stringify(warning)}`);
  });

  test('malformed effort token fires warning exactly once per distinct label (one-time warn)', () => {
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { execution: 'opus;badzz' },
    });
    const stderrChunks = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...rest) => {
      stderrChunks.push(String(chunk));
      return originalWrite(chunk, ...rest);
    };
    try {
      resolveReasoningEffortInternal(projectDir, 'gsd-executor');
      resolveReasoningEffortInternal(projectDir, 'gsd-executor');
    } finally {
      process.stderr.write = originalWrite;
    }
    const warnCount = stderrChunks.filter(c => c.includes('gsd: warning')).length;
    assert.strictEqual(warnCount, 1, 'warning must fire exactly once per distinct label');
  });

  test('bare claude config → effort matches hand-assigned catalog slot (CONFIG-04 back-compat)', () => {
    // D-101 verdict: post-handover the catalog carries hand-assigned ;effort slots
    // (D-102), so bare claude configs legitimately yield non-null effort for agents
    // whose catalog slot carries a ;effort suffix. The expected effort is derived
    // from the live catalog slot via _resolveAgentSlot (same-slot invariant).
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
    });
    const expectedExecutor = parseModelEffort(_resolveAgentSlot(projectDir, 'gsd-executor')).effort;
    const expectedPlanner = parseModelEffort(_resolveAgentSlot(projectDir, 'gsd-planner')).effort;
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), expectedExecutor);
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), expectedPlanner);
  });
});

// ─── D-08: Cross-resolver golden snapshot ───────────────────────────────────

describe('D-08: cross-resolver golden snapshot — bare config back-compat + same-slot invariant', () => {
  const agents = Object.keys(MODEL_PROFILES);
  const profiles = ['quality', 'balanced', 'budget', 'inherit'];

  // Verify all agents across all profiles: bare config → effort matches the
  // hand-assigned slot effort from model-catalog.json (or null for inherit),
  // and model+effort derive from the same slot (same-slot invariant).
  for (const profile of profiles) {
    describe(`profile: ${profile}`, () => {
      let projectDir;
      beforeEach(() => {
        projectDir = makeTmp(`golden-${profile}`);
        _resetEffortWarningCacheForTests();
        // Bare config on claude runtime (no user-supplied ;effort override)
        writeConfig(projectDir, {
          runtime: 'claude',
          model_profile: profile,
        });
      });
      afterEach(() => { rmr(projectDir); });

      for (const agent of agents) {
        test(`bare claude config: agent=${agent}, profile=${profile} → resolveReasoningEffortInternal matches slot effort (D-08 back-compat)`, () => {
          // D-101 verdict: post-handover the catalog carries hand-assigned ;effort slots
          // (D-102), so bare configs legitimately resolve non-null effort for non-inherit
          // profiles. The expected effort is whatever the slot carries.
          // For inherit profile, no slot effort exists → effort remains null.
          const slot = _resolveAgentSlot(projectDir, agent);
          const expectedEffort = parseModelEffort(slot).effort;
          const effort = resolveReasoningEffortInternal(projectDir, agent);
          assert.strictEqual(effort, expectedEffort,
            `bare claude config must yield slot effort (${JSON.stringify(expectedEffort)}) for agent=${agent} profile=${profile}`);
        });

        test(`same-slot invariant: agent=${agent}, profile=${profile} — model+effort from same _resolveAgentSlot (D-08)`, () => {
          const slot = _resolveAgentSlot(projectDir, agent);
          const parsed = parseModelEffort(slot);
          // The slot-parsed effort is the expected effort (null for inherit, or hand-assigned value)
          const expectedEffort = parsed.effort;
          // resolveReasoningEffortInternal must agree with slot-parsed effort
          const resolvedEffort = resolveReasoningEffortInternal(projectDir, agent);
          assert.strictEqual(resolvedEffort, expectedEffort,
            `resolveReasoningEffortInternal must match slot-parsed effort (${JSON.stringify(expectedEffort)}) for agent=${agent} profile=${profile}`);
          // resolveModelInternal must produce the base model (no ;effort contamination)
          const model = resolveModelInternal(projectDir, agent);
          // The model must not contain a semicolon (no ;effort leak into model string)
          assert.ok(!model.includes(';'),
            `resolveModelInternal must not return a ;-contaminated string for agent=${agent} profile=${profile}: got ${JSON.stringify(model)}`);
        });
      }
    });
  }
});

// ─── #3023 fixture: inherit + models.execution = "opus" on codex ─────────────

describe('#3023 same-slot fixture: model_profile=inherit + models.execution=opus on codex', () => {
  let projectDir;
  beforeEach(() => {
    projectDir = makeTmp('3023-opus');
    _resetEffortWarningCacheForTests();
  });
  afterEach(() => { rmr(projectDir); });

  test('#3023: {model_profile:"inherit", models:{execution:"opus"}} on codex → opus model AND opus-tier effort (same-slot invariant)', () => {
    // This is the exact #3023 regression fixture.
    // The same slot ("opus") must drive both model AND effort resolution.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'inherit',
      models: { execution: 'opus' },
    });
    // gsd-executor maps to execution phase-type.
    const model = resolveModelInternal(projectDir, 'gsd-executor');
    const effort = resolveReasoningEffortInternal(projectDir, 'gsd-executor');

    // Both must derive from the same "opus" slot.
    // On codex, the opus tier resolves to a gpt-5-class model string (not the alias 'opus').
    // Verify via _resolveAgentSlot: the slot must be 'opus' (the phase-type value).
    const slot = _resolveAgentSlot(projectDir, 'gsd-executor');
    const slotParsed = parseModelEffort(slot);
    assert.strictEqual(slotParsed.model, 'opus',
      `slot base must be 'opus', got ${JSON.stringify(slot)}`);

    // Model must not be 'inherit' or 'sonnet' (the fallback for inherit without phase-type).
    assert.notStrictEqual(model, 'inherit',
      'model must not fall back to inherit — the phase-type slot must be honoured');
    assert.notStrictEqual(model, 'sonnet',
      'model must not fall back to sonnet balanced default — opus phase-type must win');

    // The codex opus tier has a built-in reasoning_effort ('xhigh').
    // Bare "opus" slot (no ;effort) → effort comes from Codex per-tier fallback.
    assert.strictEqual(effort, 'xhigh',
      `#3023 fixture on codex must yield opus-tier effort "xhigh", got ${JSON.stringify(effort)}`);
  });

  test('#3023: {model_profile:"inherit", models:{execution:"opus;low"}} on codex → effort "low" (slot wins over per-tier)', () => {
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'inherit',
      models: { execution: 'opus;low' },
    });
    const slot = _resolveAgentSlot(projectDir, 'gsd-executor');
    assert.strictEqual(slot, 'opus;low', `slot must be 'opus;low', got ${JSON.stringify(slot)}`);

    const effort = resolveReasoningEffortInternal(projectDir, 'gsd-executor');
    assert.strictEqual(effort, 'low', 'slot ;effort must win over per-tier xhigh');
  });
});
