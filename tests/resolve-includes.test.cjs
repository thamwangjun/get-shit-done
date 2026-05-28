/**
 * GSD Tools Tests - resolve-includes
 *
 * Unit tests for the resolveIncludes() pure function in bin/install.js.
 * Five tests, four mapping to phase 44 success criteria plus depth-limit (RESV-07):
 *   1. Bare @~/.claude/ line inlining
 *   2. Conditional guard (${...} template expression) pass-through
 *   3. Circular-include detection error
 *   4. Missing-file error
 *   5. Depth-limit error at depth >= 3
 */

'use strict';

process.env.GSD_TEST_MODE = '1';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { resolveIncludes } = require('../bin/install.js');

// ─── Test 1 — bare @~/.claude/ inlining ────────────────────────────────────

test('inlines bare @~/.claude/ reference by reading file at sourceRoot path', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    const dir = path.join(sourceRoot, 'get-shit-done', 'workflows');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'sample.md'), '# Sample\nsome content\n', 'utf8');

    const content = 'preamble\n@~/.claude/get-shit-done/workflows/sample.md\npostamble\n';
    const result = resolveIncludes(content, sourceRoot, new Set());

    assert.ok(result.includes('# Sample'), 'result should contain inlined heading');
    assert.ok(!result.includes('@~/.claude/'), 'result should not contain the original @~/.claude/ reference');
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

// ─── Test 2 — conditional guard pass-through ───────────────────────────────

test('passes ${...} template expression containing @~ verbatim without expansion', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    // The exact conditional pattern from execute-phase.md:619 — must not be expanded
    const content = "line before\n${CONTEXT_WINDOW < 200000 ? '' : '@~/.claude/get-shit-done/references/executor-examples.md'}\nline after\n";
    const result = resolveIncludes(content, sourceRoot, new Set());

    assert.ok(result.includes('${CONTEXT_WINDOW < 200000 ?'), 'template expression should be passed through verbatim');
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

// ─── Test 3 — circular include detection ──────────────────────────────────

test('throws with full include chain on circular reference', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    const dir = path.join(sourceRoot, 'get-shit-done');
    fs.mkdirSync(dir, { recursive: true });

    // a.md references b.md, b.md references a.md
    fs.writeFileSync(path.join(dir, 'a.md'), '@~/.claude/get-shit-done/b.md\n', 'utf8');
    fs.writeFileSync(path.join(dir, 'b.md'), '@~/.claude/get-shit-done/a.md\n', 'utf8');

    const aPath = path.join(sourceRoot, 'get-shit-done', 'a.md');
    // Seed seen with a.md's resolved path to simulate the call stack already processing a.md
    const seenWithA = new Set([aPath]);

    const aContent = fs.readFileSync(aPath, 'utf8');

    assert.throws(
      () => resolveIncludes(aContent, sourceRoot, seenWithA, 0),
      (err) => {
        assert.ok(err instanceof Error, 'should throw an Error');
        assert.ok(err.message.includes('a.md'), 'error message should contain a.md');
        assert.ok(err.message.includes('b.md'), 'error message should contain b.md');
        return true;
      }
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

// ─── Test 4 — missing file error ─────────────────────────────────────────

test('throws naming both source file and unresolvable path when referenced file is missing', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    const content = '@~/.claude/no/such/file.md\n';

    assert.throws(
      () => resolveIncludes(content, sourceRoot, new Set()),
      (err) => {
        assert.ok(err instanceof Error, 'should throw an Error');
        assert.ok(err.message.includes('no/such/file.md'), 'error message should contain the missing path');
        return true;
      }
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});

// ─── Test 5 — depth-limit error (RESV-07) ────────────────────────────────────

test('throws descriptive error when include depth reaches limit', () => {
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ri-test-'));
  try {
    const dir = path.join(sourceRoot, 'get-shit-done');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'deep.md'), '# Deep\n', 'utf8');

    const content = '@~/.claude/get-shit-done/deep.md\n';

    assert.throws(
      () => resolveIncludes(content, sourceRoot, new Set(), 3),
      (err) => {
        assert.ok(err instanceof Error, 'should throw an Error');
        assert.ok(err.message.includes('depth'), 'error message should mention depth');
        return true;
      }
    );
  } finally {
    fs.rmSync(sourceRoot, { recursive: true, force: true });
  }
});
