'use strict';
process.env.GSD_TEST_MODE = '1';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { parseModelEffort } = require('../get-shit-done/bin/lib/core.cjs');
const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'parse-model-effort.json'), 'utf-8')
);

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
