// allow-test-rule: source-text-is-the-product
// Workflow .md / agent .md / command .md / reference .md files — their text
// IS what the runtime loads. Testing text content tests the deployed contract.
// Per CONTRIBUTING.md exception matrix.
'use strict';


/**
 * Prompt Thinning Tests (#1978)
 *
 * Validates need-based (functionality-based) reference loading. The earlier
 * context-window ternary gates (`${CONTEXT_WINDOW ... ? ... : ...}`) were dead
 * code — neither eta nor Claude Code substitution evaluates JS ternaries, so
 * they rendered as literal text (quick-260531-mvd). Cross-phase context files
 * are now always listed in each subagent's files_to_read, and extended example
 * references load on demand by need rather than by model size.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const EXECUTE_PHASE = path.join(__dirname, '..', 'gsd-core', 'workflows', 'execute-phase.md');
const EXECUTOR_AGENT = path.join(__dirname, '..', 'agents', 'gsd-executor.md');
const PLANNER_AGENT = path.join(__dirname, '..', 'agents', 'gsd-planner.md');
const EXECUTOR_EXAMPLES_REF = path.join(__dirname, '..', 'gsd-core', 'references', 'executor-examples.md');
const PLANNER_ANTIPATTERNS_REF = path.join(__dirname, '..', 'gsd-core', 'references', 'planner-antipatterns.md');

describe('prompt thinning — sub-200K context window support (#1978)', () => {

  describe('execute-phase.md — need-based reference loading', () => {
    test('contains no dead CONTEXT_WINDOW ternary gate', () => {
      const content = fs.readFileSync(EXECUTE_PHASE, 'utf-8');
      assert.ok(
        !content.includes('CONTEXT_WINDOW'),
        'execute-phase.md must contain no CONTEXT_WINDOW ternary or variable (dead code removed in quick-260531-mvd)'
      );
    });

    test('references executor-examples.md for on-demand loading', () => {
      const content = fs.readFileSync(EXECUTE_PHASE, 'utf-8');
      assert.ok(
        content.includes('executor-examples.md'),
        'execute-phase.md must reference executor-examples.md for need-based loading'
      );
    });
  });

  describe('gsd-executor.md — reference to extracted examples', () => {
    test('references executor-examples.md for extended examples', () => {
      const content = fs.readFileSync(EXECUTOR_AGENT, 'utf-8');
      assert.ok(
        content.includes('executor-examples.md'),
        'gsd-executor.md must reference executor-examples.md for extended deviation/checkpoint examples'
      );
    });
  });

  describe('gsd-planner.md — reference to extracted anti-patterns', () => {
    test('references planner-antipatterns.md for extended anti-patterns', () => {
      const content = fs.readFileSync(PLANNER_AGENT, 'utf-8');
      assert.ok(
        content.includes('planner-antipatterns.md'),
        'gsd-planner.md must reference planner-antipatterns.md for extended checkpoint anti-patterns and specificity examples'
      );
    });
  });

  describe('executor-examples.md — extracted reference file', () => {
    test('file exists', () => {
      assert.ok(
        fs.existsSync(EXECUTOR_EXAMPLES_REF),
        'gsd-core/references/executor-examples.md must exist'
      );
    });

    test('contains deviation rule examples', () => {
      const content = fs.readFileSync(EXECUTOR_EXAMPLES_REF, 'utf-8');
      assert.ok(
        content.includes('Rule 1') || content.includes('RULE 1'),
        'executor-examples.md must contain deviation rule examples'
      );
    });

    test('contains checkpoint examples', () => {
      const content = fs.readFileSync(EXECUTOR_EXAMPLES_REF, 'utf-8');
      assert.ok(
        content.includes('checkpoint') || content.includes('Checkpoint'),
        'executor-examples.md must contain checkpoint examples'
      );
    });

    test('contains edge case examples', () => {
      const content = fs.readFileSync(EXECUTOR_EXAMPLES_REF, 'utf-8');
      assert.ok(
        content.includes('Edge case') || content.includes('edge case') || content.includes('Edge Case'),
        'executor-examples.md must contain edge case guidance'
      );
    });
  });

  describe('planner-antipatterns.md — extracted reference file', () => {
    test('file exists', () => {
      assert.ok(
        fs.existsSync(PLANNER_ANTIPATTERNS_REF),
        'gsd-core/references/planner-antipatterns.md must exist'
      );
    });

    test('contains checkpoint anti-patterns', () => {
      const content = fs.readFileSync(PLANNER_ANTIPATTERNS_REF, 'utf-8');
      assert.ok(
        content.includes('anti-pattern') || content.includes('Anti-Pattern') || content.includes('Bad'),
        'planner-antipatterns.md must contain checkpoint anti-pattern examples'
      );
    });

    test('contains specificity examples', () => {
      const content = fs.readFileSync(PLANNER_ANTIPATTERNS_REF, 'utf-8');
      assert.ok(
        content.includes('TOO VAGUE') || content.includes('Specificity') || content.includes('specificity'),
        'planner-antipatterns.md must contain specificity examples'
      );
    });
  });

  describe('cross-phase context always provided', () => {
    test('executor files_to_read always lists CONTEXT/RESEARCH/prior-wave entries (no ternary gate)', () => {
      const content = fs.readFileSync(EXECUTE_PHASE, 'utf-8');
      assert.ok(
        content.includes('*-CONTEXT.md') && content.includes('*-RESEARCH.md'),
        'cross-phase CONTEXT.md and RESEARCH.md entries must be listed'
      );
      assert.ok(
        !content.includes('CONTEXT_WINDOW'),
        'no context-window ternary may gate the cross-phase entries'
      );
    });
  });
});
