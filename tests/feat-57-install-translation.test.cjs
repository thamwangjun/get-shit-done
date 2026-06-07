'use strict';

/**
 * Feature test for Phase 57: Install-Time Translation
 *
 * RED test file — all assertions reference behavior that does NOT yet exist
 * in the current source. This file MUST fail against unmodified source.
 *
 * Covers:
 *   INSTALL-01 — translateEffortForCodex helper in core.cjs
 *   INSTALL-02 — haiku-tier omit (no medium floor for haiku)
 *   INSTALL-02 — Codex TOML emit: max→xhigh, haiku emits no model_reasoning_effort
 */

// Enable test exports from install.js (skips main CLI logic)
process.env.GSD_TEST_MODE = '1';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = require('../get-shit-done/bin/lib/core.cjs');
const {
  resolveReasoningEffortInternal,
  _resetEffortWarningCacheForTests,
} = core;

const { createTempDir } = require('./helpers.cjs');

const {
  generateCodexAgentToml,
  readGsdRuntimeProfileResolver,
} = require('../bin/install.js');

// ─── Shared helpers ───────────────────────────────────────────────────────────

const makeTmp = (prefix) => createTempDir(`gsd-57-${prefix}-`);

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}

// ─── Unit: translateEffortForCodex export check ───────────────────────────────

describe('Phase 57: translateEffortForCodex export', () => {
  test('translateEffortForCodex is exported as a function (INSTALL-01)', () => {
    // This MUST fail RED — the function does not yet exist in core.cjs.
    assert.strictEqual(typeof core.translateEffortForCodex, 'function');
  });
});

// ─── Unit: translateEffortForCodex behavior ───────────────────────────────────

describe('Phase 57: translateEffortForCodex translations (INSTALL-01)', () => {
  test('translateEffortForCodex("max") === "xhigh"', () => {
    // max is the Claude canonical form; Codex requires "xhigh"
    assert.strictEqual(core.translateEffortForCodex('max'), 'xhigh');
  });

  test('translateEffortForCodex("low") passes through unchanged', () => {
    assert.strictEqual(core.translateEffortForCodex('low'), 'low');
  });

  test('translateEffortForCodex("medium") passes through unchanged', () => {
    assert.strictEqual(core.translateEffortForCodex('medium'), 'medium');
  });

  test('translateEffortForCodex("high") passes through unchanged', () => {
    assert.strictEqual(core.translateEffortForCodex('high'), 'high');
  });

  test('translateEffortForCodex(null) === null', () => {
    assert.strictEqual(core.translateEffortForCodex(null), null);
  });

  test('translateEffortForCodex(undefined) === null', () => {
    assert.strictEqual(core.translateEffortForCodex(undefined), null);
  });
});

// ─── Unit: resolver Claude-form-neutral (no xhigh from resolver) ──────────────

describe('Phase 57: resolver returns max verbatim on both runtimes (D-03 / RESOLVE-04)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('resolver-max'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('claude + model_overrides[agent] = "opus;max" → resolver returns "max", not "xhigh"', () => {
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'opus;max' },
    });
    // Resolver must return 'max' (Claude form). Translation is a Codex-emit concern.
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'max');
  });

  test('codex + model_overrides[agent] = "opus;max" → resolver returns "max", not "xhigh"', () => {
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_overrides: { 'gsd-planner': 'opus;max' },
    });
    // Resolver is neutral — translation only at the Codex TOML emit boundary.
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-planner'), 'max');
  });
});

// ─── Unit: haiku → null (bare tier, no medium floor) ─────────────────────────

describe('Phase 57: haiku tier omits effort entirely (INSTALL-02 / D-03)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('haiku-null'); _resetEffortWarningCacheForTests(); });
  afterEach(() => { rmr(projectDir); });

  test('codex + haiku slot → null (no medium floor for haiku)', () => {
    // gsd-verifier maps to the verification phase-type → haiku tier on 'budget' profile.
    // The haiku-tier exclusion must win over D-08's medium floor.
    // This MUST fail RED — D-08 currently floors haiku to 'medium'.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'budget',
    });
    // 'budget' profile maps verification agents to haiku tier.
    // Exact agent name doesn't matter — any haiku-tier slot should yield null.
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-verifier'), null);
  });

  test('claude + haiku slot → null (haiku omits on all runtimes)', () => {
    // Same exclusion applies on claude runtime for haiku-tier agents.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'budget',
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-verifier'), null);
  });

  test('codex + model_overrides[agent] = "haiku;high" → null (explicit override, D-02 / A1)', () => {
    // The haiku-tier exclusion wins over an explicit ;effort suffix (haiku;high → null).
    // This is the A1 explicit-override path required by plan D-02.
    // This MUST fail RED — current resolver returns 'high' from parseModelEffort(override).effort.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_overrides: { 'gsd-executor': 'haiku;high' },
    });
    assert.strictEqual(resolveReasoningEffortInternal(projectDir, 'gsd-executor'), null);
  });
});

// ─── Integration: Codex TOML emit — model_reasoning_effort ───────────────────

describe('Phase 57: Codex TOML emit via generateCodexAgentToml (INSTALL-02)', () => {
  let projectDir;
  beforeEach(() => { projectDir = makeTmp('codex-toml'); });
  afterEach(() => { rmr(projectDir); });

  // Minimal agent content to pass to generateCodexAgentToml
  const AGENT_CONTENT = `---
name: gsd-executor
description: GSD executor agent
tools: [Read, Bash, Edit, Write]
color: "#ff0000"
---

Executor instructions here.
`;

  test('Codex TOML emits model_reasoning_effort = "xhigh" for opus slot assigned max (INSTALL-01)', () => {
    // opus slot with ;max override → generateCodexAgentToml must emit xhigh.
    // This MUST fail RED — today the emit does not route through translateEffortForCodex.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'quality',
      model_overrides: { 'gsd-executor': 'opus;max' },
    });
    const runtimeResolver = readGsdRuntimeProfileResolver(projectDir);
    const modelOverrides = { 'gsd-executor': 'opus;max' };
    const toml = generateCodexAgentToml('gsd-executor', AGENT_CONTENT, modelOverrides, runtimeResolver);
    // model_overrides path wins — the override is 'opus;max'. After translation, effort = xhigh.
    // The test asserts the full line to avoid substring false-passes on the model value.
    assert.ok(
      toml.includes('model_reasoning_effort = "xhigh"'),
      `Expected TOML to contain 'model_reasoning_effort = "xhigh"' but got:\n${toml}`
    );
  });

  test('Codex TOML emits model_reasoning_effort = "high" for bare opus/sonnet slot (D-08 floor, translated)', () => {
    // gsd-executor balanced is sonnet;high in the catalog → effort 'high' on codex.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'balanced',
    });
    const runtimeResolver = readGsdRuntimeProfileResolver(projectDir);
    const toml = generateCodexAgentToml('gsd-executor', AGENT_CONTENT, null, runtimeResolver);
    assert.ok(
      toml.includes('model_reasoning_effort = "high"'),
      `Expected TOML to contain 'model_reasoning_effort = "high"' but got:\n${toml}`
    );
  });

  test('Codex TOML emits NO model_reasoning_effort line for haiku-tier agent (D-03)', () => {
    // haiku omits entirely — no model_reasoning_effort line at all.
    // This MUST fail RED — today generateCodexAgentToml emits medium for haiku.
    writeConfig(projectDir, {
      runtime: 'codex',
      model_profile: 'budget',
    });
    const runtimeResolver = readGsdRuntimeProfileResolver(projectDir);
    const HAIKU_AGENT_CONTENT = `---
name: gsd-verifier
description: GSD verifier agent
tools: [Read, Bash]
color: "#00ff00"
---

Verifier instructions here.
`;
    const toml = generateCodexAgentToml('gsd-verifier', HAIKU_AGENT_CONTENT, null, runtimeResolver);
    assert.ok(
      !toml.includes('model_reasoning_effort'),
      `Expected TOML to NOT contain 'model_reasoning_effort' for haiku-tier but got:\n${toml}`
    );
  });

  test('Claude install path does not emit model_reasoning_effort (D-04: Codex-emit-only)', () => {
    // A runtimeResolver for 'claude' must never produce model_reasoning_effort in TOML.
    writeConfig(projectDir, {
      runtime: 'claude',
      model_profile: 'quality',
    });
    const runtimeResolver = readGsdRuntimeProfileResolver(projectDir);
    // When runtime is claude, generateCodexAgentToml should still work but
    // the resolver provides no reasoning_effort for claude (no RUNTIME_PROFILE_MAP entry).
    const toml = generateCodexAgentToml('gsd-executor', AGENT_CONTENT, null, runtimeResolver);
    assert.ok(
      !toml.includes('model_reasoning_effort'),
      `Expected no model_reasoning_effort on claude path but got:\n${toml}`
    );
  });
});
