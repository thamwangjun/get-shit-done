// allow-test-rule: source-text-is-the-product
// The workflow/agent .md files are the deployed contract.
// These assertions guard that Phase 56 effort-wiring tokens are present
// and cannot regress silently.

/**
 * Phase 56 effort-wiring regression guard
 *
 * GAP A (56-02): 8 Group A init-fed workflows must carry their
 *   pre-built effort token variable names adjacent to model= lines.
 *
 * GAP B (56-03): 10 Group B standalone-resolve sites must carry a
 *   `resolve-model-effort gsd-<agent>` capture line.
 *
 * plan-phase.md intentionally uses `_effort_param` (not `_model_effort_arg`)
 * to avoid tripping the args?\b regex in this file's sibling test.
 * That deviation is documented in 56-02-SUMMARY.md and 56-VERIFICATION.md.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  } catch (err) {
    throw new Error('[phase-56-effort-wiring] failed to read ' + rel + ': ' + err.message);
  }
}

// ─── GAP A: Group A init-fed workflows ──────────────────────────────────────

describe('phase-56 GAP A: Group A init-fed workflows carry effort token variables', () => {

  test('execute-phase.md carries executor_model_effort_arg and verifier_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/execute-phase.md');
    assert.ok(
      content.includes('executor_model_effort_arg'),
      'execute-phase.md must define/reference executor_model_effort_arg'
    );
    assert.ok(
      content.includes('verifier_model_effort_arg'),
      'execute-phase.md must define/reference verifier_model_effort_arg'
    );
  });

  test('execute-plan.md carries executor_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/execute-plan.md');
    assert.ok(
      content.includes('executor_model_effort_arg'),
      'execute-plan.md must define/reference executor_model_effort_arg'
    );
  });

  test('plan-phase.md carries researcher_model_effort_arg, planner_model_effort_arg, checker_model_effort_arg', () => {
    // 56-02-SUMMARY.md and 56-VERIFICATION.md described an _effort_param suffix
    // deviation, but the actual file uses _model_effort_arg throughout — the
    // deviation was corrected before final commit (grep of the live file confirms).
    const content = read('get-shit-done/workflows/plan-phase.md');
    assert.ok(
      content.includes('researcher_model_effort_arg'),
      'plan-phase.md must define/reference researcher_model_effort_arg'
    );
    assert.ok(
      content.includes('planner_model_effort_arg'),
      'plan-phase.md must define/reference planner_model_effort_arg'
    );
    assert.ok(
      content.includes('checker_model_effort_arg'),
      'plan-phase.md must define/reference checker_model_effort_arg'
    );
  });

  test('quick.md carries planner_model_effort_arg, executor_model_effort_arg, checker_model_effort_arg, verifier_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/quick.md');
    for (const token of [
      'planner_model_effort_arg',
      'executor_model_effort_arg',
      'checker_model_effort_arg',
      'verifier_model_effort_arg',
    ]) {
      assert.ok(content.includes(token), 'quick.md must define/reference ' + token);
    }
  });

  test('new-project.md carries researcher_model_effort_arg, synthesizer_model_effort_arg, roadmapper_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/new-project.md');
    for (const token of [
      'researcher_model_effort_arg',
      'synthesizer_model_effort_arg',
      'roadmapper_model_effort_arg',
    ]) {
      assert.ok(content.includes(token), 'new-project.md must define/reference ' + token);
    }
  });

  test('new-milestone.md carries researcher_model_effort_arg, synthesizer_model_effort_arg, roadmapper_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/new-milestone.md');
    for (const token of [
      'researcher_model_effort_arg',
      'synthesizer_model_effort_arg',
      'roadmapper_model_effort_arg',
    ]) {
      assert.ok(content.includes(token), 'new-milestone.md must define/reference ' + token);
    }
  });

  test('verify-work.md carries planner_model_effort_arg and checker_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/verify-work.md');
    assert.ok(
      content.includes('planner_model_effort_arg'),
      'verify-work.md must define/reference planner_model_effort_arg'
    );
    assert.ok(
      content.includes('checker_model_effort_arg'),
      'verify-work.md must define/reference checker_model_effort_arg'
    );
  });

  test('map-codebase.md carries mapper_model_effort_arg', () => {
    const content = read('get-shit-done/workflows/map-codebase.md');
    assert.ok(
      content.includes('mapper_model_effort_arg'),
      'map-codebase.md must define/reference mapper_model_effort_arg'
    );
  });

});

// ─── GAP B: Group B standalone-resolve sites ────────────────────────────────

describe('phase-56 GAP B: Group B standalone-resolve sites carry resolve-model-effort capture lines', () => {

  test('audit-milestone.md has resolve-model-effort gsd-integration-checker', () => {
    const content = read('get-shit-done/workflows/audit-milestone.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-integration-checker'),
      'audit-milestone.md must contain "resolve-model-effort gsd-integration-checker"'
    );
  });

  test('scan.md has resolve-model-effort gsd-codebase-mapper', () => {
    const content = read('get-shit-done/workflows/scan.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-codebase-mapper'),
      'scan.md must contain "resolve-model-effort gsd-codebase-mapper"'
    );
  });

  test('secure-phase.md has resolve-model-effort gsd-security-auditor', () => {
    const content = read('get-shit-done/workflows/secure-phase.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-security-auditor'),
      'secure-phase.md must contain "resolve-model-effort gsd-security-auditor"'
    );
  });

  test('ui-phase.md has resolve-model-effort gsd-ui-researcher AND gsd-ui-checker', () => {
    const content = read('get-shit-done/workflows/ui-phase.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-ui-researcher'),
      'ui-phase.md must contain "resolve-model-effort gsd-ui-researcher"'
    );
    assert.ok(
      content.includes('resolve-model-effort gsd-ui-checker'),
      'ui-phase.md must contain "resolve-model-effort gsd-ui-checker"'
    );
  });

  test('ui-review.md has resolve-model-effort gsd-ui-auditor', () => {
    const content = read('get-shit-done/workflows/ui-review.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-ui-auditor'),
      'ui-review.md must contain "resolve-model-effort gsd-ui-auditor"'
    );
  });

  test('validate-phase.md has resolve-model-effort gsd-nyquist-auditor', () => {
    const content = read('get-shit-done/workflows/validate-phase.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-nyquist-auditor'),
      'validate-phase.md must contain "resolve-model-effort gsd-nyquist-auditor"'
    );
  });

  test('discuss-phase/modes/advisor.md has resolve-model-effort gsd-advisor-researcher', () => {
    const content = read('get-shit-done/workflows/discuss-phase/modes/advisor.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-advisor-researcher'),
      'advisor.md must contain "resolve-model-effort gsd-advisor-researcher"'
    );
  });

  test('debug.md has resolve-model-effort gsd-debugger', () => {
    const content = read('get-shit-done/workflows/debug.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-debugger'),
      'debug.md must contain "resolve-model-effort gsd-debugger"'
    );
  });

  test('agents/gsd-debug-session-manager.md has resolve-model-effort gsd-debugger and defines debugger_model_effort_arg', () => {
    const content = read('agents/gsd-debug-session-manager.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-debugger'),
      'gsd-debug-session-manager.md must contain "resolve-model-effort gsd-debugger"'
    );
    assert.ok(
      content.includes('debugger_model_effort_arg'),
      'gsd-debug-session-manager.md must define/reference debugger_model_effort_arg'
    );
  });

  test('docs-update.md has resolve-model-effort gsd-doc-writer', () => {
    const content = read('get-shit-done/workflows/docs-update.md');
    assert.ok(
      content.includes('resolve-model-effort gsd-doc-writer'),
      'docs-update.md must contain "resolve-model-effort gsd-doc-writer"'
    );
  });

});
