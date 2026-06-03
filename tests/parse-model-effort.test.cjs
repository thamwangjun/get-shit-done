'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const core = require('../get-shit-done/bin/lib/core.cjs');
const {
  MODEL_PROFILES,
} = require('../get-shit-done/bin/lib/model-profiles.cjs');

// ─── Shared helper ───────────────────────────────────────────────────────────

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function makeTmpWithConfig(config) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-snap-'));
  writeConfig(d, config);
  return d;
}

test('parseModelEffort is exported as a function', () => {
  assert.strictEqual(typeof core.parseModelEffort, 'function');
});

test('parseModelEffort splits model;effort on the effort allowlist', () => {
  assert.deepStrictEqual(core.parseModelEffort('opus;high'), { model: 'opus', effort: 'high' });
});

test('parseModelEffort treats every allowlist token as a valid effort suffix', () => {
  for (const token of ['low', 'medium', 'high', 'xhigh', 'max']) {
    assert.deepStrictEqual(
      core.parseModelEffort(`opus;${token}`),
      { model: 'opus', effort: token }
    );
  }
});

test('parseModelEffort never treats a colon as a delimiter', () => {
  assert.deepStrictEqual(
    core.parseModelEffort('openrouter:anthropic/claude-opus'),
    { model: 'openrouter:anthropic/claude-opus', effort: null }
  );
});

test('parseModelEffort returns bare model with null effort (backward-compatible)', () => {
  assert.deepStrictEqual(core.parseModelEffort('opus'), { model: 'opus', effort: null });
});

test('parseModelEffort splits on lastIndexOf(";") so embedded semicolons stay in model', () => {
  assert.deepStrictEqual(core.parseModelEffort('a;b;high'), { model: 'a;b', effort: 'high' });
  // unknown suffix after the last ';' degrades to null effort, base keeps earlier ';'
  assert.deepStrictEqual(core.parseModelEffort('a;b;hihg'), { model: 'a;b', effort: null });
});

test('parseModelEffort strips and warns on a typo suffix, exactly once per label', () => {
  core._resetEffortWarningCacheForTests();
  const writes = [];
  const orig = process.stderr.write;
  process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
  try {
    assert.deepStrictEqual(core.parseModelEffort('opus;hihg'), { model: 'opus', effort: null });
    assert.deepStrictEqual(core.parseModelEffort('opus;hihg'), { model: 'opus', effort: null });
  } finally {
    process.stderr.write = orig;
  }
  assert.strictEqual(writes.length, 1, 'exactly one warning per distinct label');
  assert.match(writes[0], /gsd: warning —/);
  assert.match(writes[0], /hihg/);
});

test('parseModelEffort warn-reset helper allows the same label to warn again', () => {
  core._resetEffortWarningCacheForTests();
  const writes = [];
  const orig = process.stderr.write;
  process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
  try {
    core.parseModelEffort('opus;zzz');
    core._resetEffortWarningCacheForTests();
    core.parseModelEffort('opus;zzz');
  } finally {
    process.stderr.write = orig;
  }
  assert.strictEqual(writes.length, 2);
});

test('parseModelEffort with no ";" never warns', () => {
  core._resetEffortWarningCacheForTests();
  const writes = [];
  const orig = process.stderr.write;
  process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
  try {
    core.parseModelEffort('opus');
    core.parseModelEffort('openrouter:anthropic/claude-opus');
  } finally {
    process.stderr.write = orig;
  }
  assert.strictEqual(writes.length, 0);
});

test('parseModelEffort tolerates non-string input without throwing', () => {
  assert.deepStrictEqual(core.parseModelEffort(null), { model: null, effort: null });
  assert.deepStrictEqual(core.parseModelEffort(undefined), { model: undefined, effort: null });
  const obj = {};
  assert.deepStrictEqual(core.parseModelEffort(obj), { model: obj, effort: null });
});

// ─── _resolveAgentSlot tests (52-02) ─────────────────────────────────────────

describe('_resolveAgentSlot — shared tier resolver (52-02)', () => {
  test('_resolveAgentSlot is exported as a function', () => {
    assert.strictEqual(typeof core._resolveAgentSlot, 'function');
  });

  test('_resolveAgentSlot returns a single slot string for gsd-executor on balanced', () => {
    const d = makeTmpWithConfig({ model_profile: 'balanced' });
    const slot = core._resolveAgentSlot(d, 'gsd-executor');
    assert.strictEqual(slot, 'sonnet;medium'); // hand-assigned slot includes ;effort suffix (D-102)
  });

  test('_resolveAgentSlot returns inherit when profile is inherit and no phase-type override', () => {
    const d = makeTmpWithConfig({ model_profile: 'inherit' });
    const slot = core._resolveAgentSlot(d, 'gsd-executor');
    assert.strictEqual(slot, 'inherit');
  });

  test('_resolveAgentSlot honors phase-type override over profile', () => {
    // execution phase-type → gsd-executor; override to opus
    const d = makeTmpWithConfig({ model_profile: 'balanced', models: { execution: 'opus' } });
    const slot = core._resolveAgentSlot(d, 'gsd-executor');
    assert.strictEqual(slot, 'opus');
  });
});

// ─── Shell-safety regression (52-02, T-52-SC) ────────────────────────────────

describe('resolveModelInternal shell-safety — override path strips ";" (52-02)', () => {
  test('model_overrides with "model;effort" value returns .model with no ";"', () => {
    const d = makeTmpWithConfig({ model_overrides: { 'gsd-executor': 'opus;high' } });
    const resolved = core.resolveModelInternal(d, 'gsd-executor');
    assert.strictEqual(resolved.includes(';'), false, `resolved model must not contain ";": got "${resolved}"`);
    assert.strictEqual(resolved, 'opus');
  });

  test('model_overrides with bare full ID (no ";") passes through verbatim', () => {
    const d = makeTmpWithConfig({ model_overrides: { 'gsd-executor': 'openai/gpt-5.4' } });
    const resolved = core.resolveModelInternal(d, 'gsd-executor');
    assert.strictEqual(resolved, 'openai/gpt-5.4');
  });
});

// ─── Pre-change golden snapshot (52-02) ──────────────────────────────────────
// Frozen before the _resolveAgentSlot / parseModelEffort refactor in Task 2.
// Must pass byte-identical BEFORE and AFTER the refactor lands.

describe('resolveModelInternal golden snapshot — pre-change baseline (52-02)', () => {
  // Frozen expected values captured against the UNMODIFIED core.cjs.
  const EXPECTED = {
    'gsd-planner':              { quality: 'opus',   balanced: 'opus',   budget: 'sonnet', inherit: 'inherit' },
    'gsd-roadmapper':           { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-executor':             { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-phase-researcher':     { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-project-researcher':   { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-debugger':             { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-codebase-mapper':      { quality: 'sonnet', balanced: 'haiku',  budget: 'haiku',  inherit: 'inherit' },
    'gsd-verifier':             { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-plan-checker':         { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-integration-checker':  { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-nyquist-auditor':      { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-pattern-mapper':       { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-ui-researcher':        { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-ui-checker':           { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-ui-auditor':           { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-doc-writer':           { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-doc-verifier':         { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-advisor-researcher':   { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-ai-researcher':        { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-assumptions-analyzer': { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-code-fixer':           { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-code-reviewer':        { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-debug-session-manager':{ quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-doc-classifier':       { quality: 'sonnet', balanced: 'haiku',  budget: 'haiku',  inherit: 'inherit' },
    'gsd-doc-synthesizer':      { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-domain-researcher':    { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-eval-auditor':         { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-eval-planner':         { quality: 'opus',   balanced: 'opus',   budget: 'sonnet', inherit: 'inherit' },
    'gsd-framework-selector':   { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-intel-updater':        { quality: 'opus',   balanced: 'sonnet', budget: 'haiku',  inherit: 'inherit' },
    'gsd-security-auditor':     { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
    'gsd-user-profiler':        { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet', inherit: 'inherit' },
  };

  const PROFILES = ['quality', 'balanced', 'budget', 'inherit'];

  test('all MODEL_PROFILES agents × profiles match frozen snapshot', () => {
    const agents = Object.keys(MODEL_PROFILES);
    // Verify every agent in snapshot is present in MODEL_PROFILES (guard against catalog shrink)
    for (const agent of Object.keys(EXPECTED)) {
      assert.ok(agents.includes(agent), `snapshot agent '${agent}' missing from MODEL_PROFILES`);
    }
    const actual = {};
    for (const agent of agents) {
      actual[agent] = {};
      for (const p of PROFILES) {
        const d = makeTmpWithConfig({ model_profile: p });
        actual[agent][p] = core.resolveModelInternal(d, agent);
      }
    }
    assert.deepStrictEqual(actual, EXPECTED);
  });

  test('representative config: resolve_model_ids omit returns empty string', () => {
    const d = makeTmpWithConfig({ resolve_model_ids: 'omit' });
    assert.strictEqual(core.resolveModelInternal(d, 'gsd-executor'), '');
  });

  test('representative config: non-claude runtime returns runtime model', () => {
    const d = makeTmpWithConfig({ runtime: 'codex' });
    assert.strictEqual(core.resolveModelInternal(d, 'gsd-executor'), 'gpt-5.3-codex');
  });

  test('representative config: model_profile:inherit + models.execution:opus returns opus (#3030)', () => {
    const d = makeTmpWithConfig({ model_profile: 'inherit', models: { execution: 'opus' } });
    assert.strictEqual(core.resolveModelInternal(d, 'gsd-executor'), 'opus');
  });
});
