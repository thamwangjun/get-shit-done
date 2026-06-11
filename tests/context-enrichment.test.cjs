// allow-test-rule: source-text-is-the-product
// Workflow .md / agent .md / command .md / reference .md files — their text
// IS what the runtime loads. Testing text content tests the deployed contract.
// Per CONTRIBUTING.md exception matrix.

/**
 * GSD Tools Tests - Adaptive Context Enrichment for 1M Models
 *
 * Tests for feat/1m-context-enrichment-1473b:
 *   - Workflow template syntax validation (CONTEXT_WINDOW conditionals)
 *   - execute-phase.md enrichment blocks (executor + verifier)
 *   - plan-phase.md cross-phase context gating
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Workflow template syntax validation
// ─────────────────────────────────────────────────────────────────────────────

describe('execute-phase.md context enrichment', () => {
  const EXECUTE_WORKFLOW_PATH = path.join(__dirname, '..', 'gsd-core', 'workflows', 'execute-phase.md');

  test('verifier prompt includes files_to_read block', () => {
    const content = fs.readFileSync(EXECUTE_WORKFLOW_PATH, 'utf-8');
    assert.ok(
      content.includes('<files_to_read>'),
      'execute-phase.md should contain <files_to_read> opening tag'
    );
    assert.ok(
      content.includes('</files_to_read>'),
      'execute-phase.md should contain </files_to_read> closing tag'
    );
    const verifierSection = content.substring(content.lastIndexOf('<files_to_read>'));
    assert.ok(
      verifierSection.includes('PLAN.md'),
      'verifier files_to_read should reference PLAN.md'
    );
    assert.ok(
      verifierSection.includes('SUMMARY.md'),
      'verifier files_to_read should reference SUMMARY.md'
    );
    assert.ok(
      verifierSection.includes('REQUIREMENTS.md'),
      'verifier files_to_read should reference REQUIREMENTS.md'
    );
  });
});

describe('plan-phase.md context enrichment', () => {
  const PLAN_WORKFLOW_PATH = path.join(__dirname, '..', 'gsd-core', 'workflows', 'plan-phase.md');

  test('contains CONTEXT_WINDOW conditional for prior CONTEXT.md', () => {
    const content = fs.readFileSync(PLAN_WORKFLOW_PATH, 'utf-8');
    assert.ok(
      content.includes('CONTEXT_WINDOW'),
      'plan-phase.md should reference CONTEXT_WINDOW variable'
    );
    assert.ok(
      content.includes('config-get context_window'),
      'plan-phase.md should read context_window via config-get'
    );
    assert.ok(
      content.includes('CONTEXT_WINDOW >= 500000'),
      'plan-phase.md should gate cross-phase context on CONTEXT_WINDOW >= 500000'
    );
    assert.ok(
      content.includes('CONTEXT.md'),
      'plan-phase.md should reference CONTEXT.md in cross-phase enrichment'
    );
  });

  test('enrichment block mentions cross-phase decision consistency', () => {
    const content = fs.readFileSync(PLAN_WORKFLOW_PATH, 'utf-8');
    // The enrichment should explain why prior context matters
    assert.ok(
      content.includes('cross-phase') || content.includes('Cross-phase'),
      'plan-phase.md should mention cross-phase context'
    );
    assert.ok(
      content.includes('SUMMARY.md'),
      'plan-phase.md should reference prior SUMMARY.md files'
    );
  });

  test('default CONTEXT_WINDOW fallback is 200000', () => {
    const content = fs.readFileSync(PLAN_WORKFLOW_PATH, 'utf-8');
    assert.ok(
      content.includes('|| echo "200000"'),
      'plan-phase.md should default CONTEXT_WINDOW to 200000'
    );
  });
});
