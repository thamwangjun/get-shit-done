/**
 * Feature test for Phase 53: Unified Effort Resolver
 *
 * Tests the rewritten resolveReasoningEffortInternal function:
 *   - {claude, codex} allowlist as outermost gate (RESOLVE-01, D-02)
 *   - Unified precedence chain on _resolveAgentSlot (RESOLVE-02, D-06)
 *   - Slot ;effort overrides Codex per-tier reasoning_effort fallback (RESOLVE-03)
 *   - max verbatim on both claude and codex paths — no resolver clamp (RESOLVE-04, D-03)
 *   - Non-{claude,codex} runtimes hard no-op (RESOLVE-05, D-02)
 *   - inherit profile / resolved inherit tier → null (RESOLVE-06)
 *   - model_overrides[agent] ;effort accepted; bare override → null (CONFIG-01, D-01)
 *   - Malformed effort token warns + degrades to null via parseModelEffort (CONFIG-04, D-05)
 *   - Bare-config back-compat invariant: effort null everywhere
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  resolveReasoningEffortInternal,
  _resetEffortWarningCacheForTests,
} = require('../get-shit-done/bin/lib/core.cjs');

const { createTempDir } = require('./helpers.cjs');

const makeTmp = (prefix) => createTempDir(`gsd-53-${prefix}-`);

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}

// ─── claude path: slot ;effort emission ────────────────────────────────────

describe('Phase 53: claude runtime emits slot effort', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('claude-slot'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('claude + quality profile + models.execution = "opus;high" → effort "high" (RESOLVE-01)', () => {
    // gsd-executor maps to execution phase-type. Setting models.execution to
    // "opus;high" exercises the slot ;effort path routed through _resolveAgentSlot.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      models: { execution: 'opus;high' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), 'high');
  });

  test('claude + bare config (no ;effort) → effort null (back-compat invariant)', () => {
    // No ;effort suffix anywhere — the resolver must return null.
    // model_overrides forces a bare 'opus' so catalog slot effort (CATALOG-02) doesn't fire.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'opus' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });

  test('claude + model_overrides[agent] = "opus;max" → effort "max" verbatim — no clamp (D-03)', () => {
    // Per D-03: max is a valid Claude effort level. The resolver must return
    // "max" verbatim — no max→xhigh clamp on the claude path.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'opus;max' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'max');
  });

  test('claude + model_overrides[agent] = "openai/gpt-5.4" (bare, no ;) → effort null (D-01)', () => {
    // Bare override — no ;effort suffix — parseModelEffort returns effort: null.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'openai/gpt-5.4' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });
});

// ─── codex path: slot effort wins over per-tier fallback ────────────────────

describe('Phase 53: codex runtime — slot effort over per-tier fallback (RESOLVE-03)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('codex-slot'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('codex + quality profile, no ;effort → per-tier fallback "xhigh" (gsd-planner opus row)', () => {
    // When slot carries no ;effort, the Codex per-tier reasoning_effort is the fallback.
    // gsd-planner quality profile → opus tier → runtimeTierDefaults.codex.opus.reasoning_effort = 'xhigh'
    // models.planning overrides the catalog slot with a bare 'opus' (no ;effort) so the
    // Codex per-tier fallback fires. Using model_overrides would short-circuit at step 1.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { planning: 'opus' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'xhigh');
  });

  test('codex + models.<phase-type> = "opus;low" → slot effort "low" WINS over per-tier xhigh (RESOLVE-03)', () => {
    // Slot ;effort takes priority over the Codex per-tier reasoning_effort fallback.
    // gsd-planner maps to planning phase-type.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { planning: 'opus;low' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'low');
  });

  test('codex + models.<phase-type> = "opus;max" → resolver returns "max" VERBATIM (RESOLVE-04, D-03)', () => {
    // This pins the resolver-side contract of RESOLVE-04: the resolver does NOT
    // clamp max→xhigh. max→xhigh is the downstream Codex emit boundary's job (Phase 54/57).
    // gsd-planner maps to planning phase-type.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { planning: 'opus;max' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'max');
  });
});

// ─── allowlist gate: non-{claude,codex} runtimes hard no-op ─────────────────

describe('Phase 53: non-{claude,codex} runtime hard no-op (RESOLVE-05, D-02)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('allowlist'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('opencode + model_overrides[agent] = "opus;high" → effort null (RESOLVE-05/D-02 absolute gate)', () => {
    // The {claude, codex} allowlist is the outermost gate — runs before override emit.
    // Non-{claude,codex} installs with override ;effort still return null.
    writeConfig(projectDir, {
      runtime: 'opencode',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'opus;high' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });
});

// ─── no runtime set: defaults to claude path ────────────────────────────────

describe('Phase 53: no runtime set → claude path; bare config → null', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('no-runtime'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('no runtime set + bare config → null', () => {
    writeConfig(projectDir, { model_profile: 'balanced' });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });
});

// ─── inherit resolution: all paths → null (RESOLVE-06) ──────────────────────

describe('Phase 53: inherit paths → null (RESOLVE-06)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('inherit'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('codex + model_profile=inherit, no phase-type override → null (resolved tier = inherit)', () => {
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'inherit',
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });

  test('codex + models.<phase-type> = "inherit" (explicit phase-type inherit) → null (RESOLVE-06)', () => {
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      models: { planning: 'inherit' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });

  test('claude + model_profile=inherit, no phase-type → null', () => {
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'inherit',
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), null);
  });
});

// ─── malformed effort token: warn + degrade to null (CONFIG-04, D-05) ───────

describe('Phase 53: malformed effort token degrades gracefully (CONFIG-04/D-05)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('malformed'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('malformed slot "opus;hihg" → effort null with one-time stderr warning', () => {
    // "hihg" is a typo'd effort token. parseModelEffort must warn once and degrade.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      models: { planning: 'opus;hihg' },
    });
    const stderrChunks = [];
    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk, ...args) => {
      stderrChunks.push(String(chunk));
      return origWrite(chunk, ...args);
    };
    let effort;
    try {
      effort = resolveReasoningEffortInternal(projectDir, 'gsd-planner');
    } finally {
      process.stderr.write = origWrite;
    }
    assert.strictEqual(effort, null);
    const warned = stderrChunks.some((c) => c.includes('hihg'));
    assert.ok(warned, `expected a one-time stderr warning mentioning "hihg"; got: ${JSON.stringify(stderrChunks)}`);
  });
});
