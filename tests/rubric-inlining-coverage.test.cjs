'use strict';

// allow-test-rule: source-text-is-the-product
// gsd-user-profiler.md is an agent definition file; its deployed text is the
// product that Claude Code loads at runtime. String assertions are the correct
// test form per the project convention in agent-frontmatter.test.cjs.

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const userProfiler = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-user-profiler.md'), 'utf8');

describe('phase-62: rubric inlining coverage', () => {
  test('gsd-user-profiler load_rubric step references Eta-inlined rubric', () => {
    assert.ok(userProfiler.includes('<step name="load_rubric">'), 'gsd-user-profiler.md missing load_rubric step');
    assert.ok(userProfiler.includes('user-profiling.md'), 'gsd-user-profiler.md missing rubric filename reference');
    assert.ok(userProfiler.includes('included above in the `<reference>` block'), 'gsd-user-profiler.md load_rubric step missing inlining phrase');
  });
});
