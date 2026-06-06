/**
 * Feature test for Phase 58: Regression Coverage milestone.
 *
 * TEST-01: Static golden snapshot — asserts live resolver output against
 *   committed literal values in tests/fixtures/golden-effort-snapshot.json.
 *   The resolver cannot shift expected values (contrast: feat-53 dynamic golden).
 * TEST-03: Per-runtime omit contract + translateEffortForCodex boundary —
 *   max→xhigh, pass-through for low/medium/high, null/undefined→null.
 * TEST-04: Antipattern guard — lints tests/*.test.cjs for indexOf-as-boolean
 *   on effort tokens and bare includes('medium'|'high') substring-collision
 *   patterns. Does NOT flag safe full-key-value structured strings (D-G1).
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  resolveReasoningEffortInternal,
  resolveModelInternal,
  translateEffortForCodex,
  _resetEffortWarningCacheForTests,
} = require('../get-shit-done/bin/lib/core.cjs');

const {
  KNOWN_RUNTIMES,
  RUNTIMES_WITH_REASONING_EFFORT,
} = require('../get-shit-done/bin/lib/model-catalog.cjs');

const { createTempDir } = require('./helpers.cjs');

const makeTmp = (prefix) => createTempDir(`gsd-58-${prefix}-`);

function writeConfig(projectDir, config) {
  const planningDir = path.join(projectDir, '.planning');
  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify(config, null, 2));
}

function rmr(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
}

// ─── TEST-01: Static golden snapshot ────────────────────────────────────────

describe('TEST-01: static golden snapshot — post-D-08 resolver values', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'golden-effort-snapshot.json');
  if (!fs.existsSync(fixturePath)) {
    throw new Error(
      'FATAL: tests/fixtures/golden-effort-snapshot.json is missing. ' +
      'Run: node scripts/gen-golden-effort-snapshot.mjs (plan 01 dependency).'
    );
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  if (!Array.isArray(fixture.rows) || fixture.rows.length === 0) {
    throw new Error('FATAL: golden-effort-snapshot.json has no rows — fixture is malformed.');
  }

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

// ─── TEST-03: Per-runtime omit/translate contract ───────────────────────────

describe('TEST-03: translateEffortForCodex boundary + per-runtime omit contract', () => {

  // translateEffortForCodex: max→xhigh boundary
  test('translateEffortForCodex("max") === "xhigh"', () => {
    assert.strictEqual(translateEffortForCodex('max'), 'xhigh');
  });

  test('translateEffortForCodex passes through "low"', () => {
    assert.strictEqual(translateEffortForCodex('low'), 'low');
  });

  test('translateEffortForCodex passes through "medium"', () => {
    assert.strictEqual(translateEffortForCodex('medium'), 'medium');
  });

  test('translateEffortForCodex passes through "high"', () => {
    assert.strictEqual(translateEffortForCodex('high'), 'high');
  });

  test('translateEffortForCodex(null) === null', () => {
    assert.strictEqual(translateEffortForCodex(null), null);
  });

  test('translateEffortForCodex(undefined) === null', () => {
    assert.strictEqual(translateEffortForCodex(undefined), null);
  });

  // Per-runtime omit contract: catalog-derived non-effort runtimes all return null
  // (Complement to feat-57's codex-TOML coverage — this asserts the resolver layer)
  describe('non-effort runtimes return null from resolveReasoningEffortInternal', () => {
    const nonEffortRuntimes = [...KNOWN_RUNTIMES].filter(r => !RUNTIMES_WITH_REASONING_EFFORT.has(r));

    for (const runtime of nonEffortRuntimes) {
      test(`resolveReasoningEffortInternal returns null for runtime=${runtime}`, () => {
        const d = makeTmp('non-effort');
        _resetEffortWarningCacheForTests();
        writeConfig(d, { runtime, model_profile: 'balanced' });
        try {
          assert.strictEqual(resolveReasoningEffortInternal(d, 'gsd-executor'), null);
        } finally { rmr(d); }
      });
    }
  });
});

// ─── TEST-04: Antipattern guard ──────────────────────────────────────────────

describe('TEST-04: antipattern guard — indexOf-as-boolean and bare includes substring collision', () => {

  // Regex 1: indexOf used as boolean on effort tokens
  // Flags: assert.ok(someString.indexOf('low'|'medium'|'high'|'xhigh'|'max'))
  // Rationale: indexOf returns a number (0 is falsy → false-pass; negative → fail only when absent)
  const indexOfAsBooleanRe = /assert\.ok\([^)]*\.indexOf\s*\(\s*['"](?:low|medium|high|xhigh|max)['"]\s*\)/;

  // Regex 2: bare includes('medium'|'high') — bare token collides:
  //   'xhigh'.includes('high') === true  (false-pass when value is 'xhigh' not 'high')
  //   'medium'.includes('medium') — ok for exact but allows any superset too
  // Scoped to BARE single-token includes: the regex does NOT match
  //   includes('model_reasoning_effort = "xhigh"') — safe structured key-value (D-G1)
  // The negative lookahead ensures only bare token strings (no space, no =, no _) are flagged.
  const bareIncludesRe = /assert\.ok\([^)]*\.includes\s*\(\s*['"](?:medium|high)['"]\s*\)/;

  const testsDir = __dirname;
  const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.cjs'));

  test('no test file uses indexOf-as-boolean on effort tokens', () => {
    const violations = [];
    for (const file of testFiles) {
      const src = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      const lines = src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (indexOfAsBooleanRe.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }
    assert.deepStrictEqual(violations, [],
      `indexOf-as-boolean antipattern detected in test files:\n${violations.join('\n')}`
    );
  });

  test('no test file uses bare includes("medium"|"high") in assert.ok (substring collision)', () => {
    const violations = [];
    for (const file of testFiles) {
      const src = fs.readFileSync(path.join(testsDir, file), 'utf-8');
      const lines = src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (bareIncludesRe.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }
    assert.deepStrictEqual(violations, [],
      `bare includes('medium'|'high') antipattern detected in test files:\n${violations.join('\n')}`
    );
  });

  // D-G1: verify feat-57's safe structured-string assertion is NOT flagged
  // assert.ok(toml.includes('model_reasoning_effort = "xhigh"')) must be clean
  test('D-G1: feat-57 safe structured-string includes() is not flagged by either guard', () => {
    const feat57Path = path.join(testsDir, 'feat-57-install-translation.test.cjs');
    if (!fs.existsSync(feat57Path)) {
      // If feat-57 does not exist, the guard is trivially safe — pass.
      return;
    }
    const src = fs.readFileSync(feat57Path, 'utf-8');
    const lines = src.split('\n');
    const indexOfViolations = lines.filter(l => indexOfAsBooleanRe.test(l));
    const bareIncludesViolations = lines.filter(l => bareIncludesRe.test(l));
    assert.deepStrictEqual(indexOfViolations, [],
      `feat-57 should not be flagged by indexOf guard:\n${indexOfViolations.join('\n')}`
    );
    assert.deepStrictEqual(bareIncludesViolations, [],
      `feat-57 should not be flagged by bare-includes guard:\n${bareIncludesViolations.join('\n')}`
    );
  });
});
