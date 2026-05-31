'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const core = require('../get-shit-done/bin/lib/core.cjs');

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
