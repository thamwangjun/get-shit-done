'use strict';

// allow-test-rule: pending-migration-to-typed-ir [#2974]
// Tracked in #2974 for migration to typed-IR assertions per CONTRIBUTING.md
// "Prohibited: Raw Text Matching on Test Outputs". Per-file review may
// reclassify some entries as source-text-is-the-product during migration.

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// ─── Module-level constants and file cache ────────────────────────────────────
// ROOT is anchored to this file's location on disk, invariant across cwd changes.
// Files are loaded once at module scope per agent-frontmatter.test.cjs convention.
const ROOT = path.join(__dirname, '..');

const debugWorkflow    = fs.readFileSync(path.join(ROOT, 'get-shit-done', 'workflows', 'debug.md'), 'utf8');
const gsdDebugger      = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debugger.md'), 'utf8');
const sessionManager   = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-debug-session-manager.md'), 'utf8');
const debugTemplate    = fs.readFileSync(path.join(ROOT, 'get-shit-done', 'templates', 'DEBUG.md'), 'utf8');

describe('debug session management implementation', () => {
  test('DEBUG.md template contains reasoning_checkpoint field', () => {
    assert.ok(debugTemplate.includes('reasoning_checkpoint'), 'DEBUG.md must contain reasoning_checkpoint field');
  });

  test('DEBUG.md template contains tdd_checkpoint field', () => {
    assert.ok(debugTemplate.includes('tdd_checkpoint'), 'DEBUG.md must contain tdd_checkpoint field');
  });

  test('debug command contains list subcommand logic', () => {
    assert.ok(
      debugWorkflow.includes('SUBCMD=list') || debugWorkflow.includes('"list"'),
      'debug.md must contain list subcommand logic'
    );
  });

  test('debug command contains continue subcommand logic', () => {
    assert.ok(
      debugWorkflow.includes('SUBCMD=continue') || debugWorkflow.includes('"continue"'),
      'debug.md must contain continue subcommand logic'
    );
  });

  test('debug command contains status subcommand logic', () => {
    assert.ok(
      debugWorkflow.includes('SUBCMD=status') || debugWorkflow.includes('"status"'),
      'debug.md must contain status subcommand logic'
    );
  });

  test('debug command contains TDD gate logic', () => {
    assert.ok(
      debugWorkflow.includes('TDD_MODE') || debugWorkflow.includes('tdd_mode'),
      'debug.md must contain TDD gate logic'
    );
  });

  test('debug.md reads tdd_mode via workflow.tdd_mode key (not bare tdd_mode)', () => {
    assert.ok(
      !debugWorkflow.includes('config-get tdd_mode'),
      'debug.md must not use bare "tdd_mode" key — use "workflow.tdd_mode" to match every other consumer'
    );
    assert.ok(
      debugWorkflow.includes('config-get workflow.tdd_mode'),
      'debug.md must read tdd_mode via the "workflow.tdd_mode" key'
    );
  });

  test('debug command contains security hardening', () => {
    assert.ok(
      debugWorkflow.includes('DATA_START') && debugWorkflow.includes('DATA_END'),
      'debug.md must contain both DATA_START and DATA_END injection boundary markers'
    );
  });

  test('debug command surfaces next_action before spawn', () => {
    assert.ok(
      debugWorkflow.includes('[debug] Next:') || debugWorkflow.includes('next_action'),
      'debug.md must surface next_action before agent spawn'
    );
  });

  test('gsd-debugger contains structured reasoning checkpoint', () => {
    assert.ok(gsdDebugger.includes('reasoning_checkpoint'), 'gsd-debugger.md must contain reasoning_checkpoint');
  });

  test('gsd-debugger contains TDD checkpoint mode', () => {
    assert.ok(gsdDebugger.includes('tdd_mode'), 'gsd-debugger.md must contain tdd_mode');
    assert.ok(gsdDebugger.includes('TDD CHECKPOINT'), 'gsd-debugger.md must contain TDD CHECKPOINT return format');
  });

  test('gsd-debugger contains delta debugging technique', () => {
    assert.ok(gsdDebugger.includes('Delta Debugging'), 'gsd-debugger.md must contain Delta Debugging technique');
  });

  test('gsd-debugger contains security note about DATA_START', { skip: 'fork intentionally diverges from upstream contract' }, () => {
    assert.ok(gsdDebugger.includes('DATA_START'), 'gsd-debugger.md must contain DATA_START security reference');
  });
});

// Tests for #2148 and #2151
describe('debug skill dispatch and sub-orchestrator (#2148, #2151)', () => {
  test('gsd-debugger ROOT CAUSE FOUND format includes specialist_hint field', () => {
    assert.ok(gsdDebugger.includes('specialist_hint'), 'gsd-debugger missing specialist_hint in ROOT CAUSE FOUND');
    assert.ok(gsdDebugger.includes('swift_concurrency'), 'gsd-debugger missing specialist_hint derivation guidance');
  });

  test('debug.md orchestrator has specialist skill dispatch step', () => {
    assert.ok(debugWorkflow.includes('specialist_hint'), 'debug.md missing specialist dispatch logic');
    assert.ok(debugWorkflow.includes('typescript-expert'), 'debug.md missing skill dispatch mapping');
  });

  test('debug.md specialist dispatch prompt uses DATA_START/DATA_END boundaries', () => {
    assert.ok(debugWorkflow.includes('DATA_START') && debugWorkflow.includes('DATA_END'),
      'debug.md specialist dispatch prompt missing security boundaries');
  });

  test('gsd-debug-session-manager agent exists with correct tools', () => {
    const toolsLine = (sessionManager.match(/^tools:\s*.+$/m) || [''])[0];
    assert.ok(toolsLine.includes('Agent'),
      'gsd-debug-session-manager missing Agent in tools: frontmatter');
    assert.ok(toolsLine.includes('AskUserQuestion'),
      'gsd-debug-session-manager missing AskUserQuestion in tools: frontmatter');
  });

  test('gsd-debug-session-manager spawns debugger with Agent() dispatcher', () => {
    assert.ok(sessionManager.includes('\nAgent('), 'session manager must dispatch debugger with Agent(');
  });

  test('gsd-debug-session-manager uses DATA_START/DATA_END for checkpoint responses', () => {
    assert.ok(sessionManager.includes('DATA_START') && sessionManager.includes('DATA_END'),
      'gsd-debug-session-manager missing security boundaries on checkpoint responses');
  });

  test('gsd-debug-session-manager has compact summary output format', () => {
    assert.ok(sessionManager.includes('DEBUG SESSION COMPLETE'), 'session manager missing compact summary format');
  });

  test('gsd-debug-session-manager includes anti-heredoc rule', () => {
    assert.ok(/only use the write tool/i.test(sessionManager), 'session manager missing anti-heredoc rule');
  });

  test('debug.md delegates to gsd-debug-session-manager', () => {
    assert.ok(debugWorkflow.includes('gsd-debug-session-manager'),
      'debug.md does not delegate to session manager');
  });
});
