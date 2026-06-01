'use strict';
process.env.GSD_TEST_MODE = '1';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  parseModelEffort,
  EFFORT_TOKENS,
  _resetEffortWarningCacheForTests,
} = require('../get-shit-done/bin/lib/core.cjs');
const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'parse-model-effort.json'), 'utf-8')
);

// Canonical allowlist — the TS parity suite (sdk/src/parse-model-effort.test.ts)
// asserts the same ordered list, so the two EFFORT_TOKENS Sets cannot drift
// without one side failing (IN-02 / WR-01 drift class).
const CANONICAL_EFFORT_TOKENS = ['low', 'medium', 'high', 'xhigh', 'max'];

// Shared warning template — must stay string-identical to the TS mirror in
// sdk/src/model-catalog.ts (WR-01). Builds the exact stderr line emitted for an
// unknown (non-empty) effort suffix.
function expectedWarning(suffix, label, base) {
  return (
    `gsd: warning — unknown effort suffix "${suffix}" in "${label}". ` +
    `Allowed efforts: ${CANONICAL_EFFORT_TOKENS.join(', ')}. ` +
    `Ignoring suffix and using model "${base}".\n`
  );
}

describe('parseModelEffort CJS parity (shared fixture)', () => {
  for (const c of cases) {
    test(`${c.input} → { model: ${c.expectedModel}, effort: ${c.expectedEffort} }`, () => {
      assert.deepStrictEqual(
        parseModelEffort(c.input),
        { model: c.expectedModel, effort: c.expectedEffort }
      );
    });
  }
});

describe('parseModelEffort allowlist parity', () => {
  test('EFFORT_TOKENS matches the canonical list mirrored on the TS side', () => {
    assert.deepStrictEqual([...EFFORT_TOKENS], CANONICAL_EFFORT_TOKENS);
  });
});

describe('parseModelEffort warning-path parity (WR-02)', () => {
  function captureStderr(fn) {
    const writes = [];
    const orig = process.stderr.write;
    process.stderr.write = (chunk) => { writes.push(String(chunk)); return true; };
    try { fn(); } finally { process.stderr.write = orig; }
    return writes;
  }

  test('unknown suffix emits the exact shared warning text', () => {
    _resetEffortWarningCacheForTests();
    const writes = captureStderr(() => parseModelEffort('opus;hihg'));
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(writes[0], expectedWarning('hihg', 'opus;hihg', 'opus'));
  });

  test('warns exactly once per distinct label, then again after reset', () => {
    _resetEffortWarningCacheForTests();
    let writes = captureStderr(() => {
      parseModelEffort('opus;zzz');
      parseModelEffort('opus;zzz');
    });
    assert.strictEqual(writes.length, 1, 'warn-once per label');

    writes = captureStderr(() => {
      _resetEffortWarningCacheForTests();
      parseModelEffort('opus;zzz');
    });
    assert.strictEqual(writes.length, 1, 'reset re-arms the warning');
  });

  test('empty suffix (trailing ";") is silent — no warning (WR-04)', () => {
    _resetEffortWarningCacheForTests();
    const writes = captureStderr(() => {
      const r = parseModelEffort('opus;');
      assert.deepStrictEqual(r, { model: 'opus', effort: null });
    });
    assert.strictEqual(writes.length, 0);
  });
});
