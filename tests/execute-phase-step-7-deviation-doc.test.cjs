// allow-test-rule: source-text-is-the-product
// The workflow .md file is the installed AI contract — its text IS what the orchestrator
// executes at runtime. Testing structural content of step 7 guards against accidental
// deletion of the cross-wave-deviation cleanup documentation (#3264).

/**
 * Regression tests for #3264: cross-wave-dependency deviation cleanup documentation
 *
 * Guards that step 7 of execute-phase.md documents both skip conditions and
 * contains a self-contained cleanup-tail snippet for the deviation path.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  'get-shit-done',
  'workflows',
  'execute-phase.md',
);

/**
 * Locate the step 7 block in the workflow file.
 * Returns the substring from "7." up to (but not including) "8.".
 * Throws if the block cannot be found.
 */
function extractStep7Block(content) {
  const start = content.indexOf('\n7.');
  assert.ok(start !== -1, 'execute-phase.md must contain a step 7 block');

  const end = content.indexOf('\n8.', start + 1);
  assert.ok(end !== -1, 'execute-phase.md must contain a step 8 block after 7');

  return content.slice(start, end);
}

describe('execute-phase step 7: cross-wave-deviation cleanup documentation (#3264)', () => {
  function readWorkflow() {
    try {
      return fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    } catch (err) {
      throw new Error(`failed to read workflow fixture at ${WORKFLOW_PATH}: ${err.message}`);
    }
  }

  test('workflow file exists', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'workflows/execute-phase.md should exist');
  });

  test('step 7 block exists and is bounded', () => {
    // extractStep7Block throws on failure — this test validates the helper itself
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(block.length > 0, 'step 7 block must be non-empty');
  });

  test('step 7 documents the standard wave contract', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('Standard wave contract'),
      'step 7 must name the standard wave contract explicitly',
    );
  });

  test('step 7 names cross-wave dependency deviation as a supported execution mode', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('Cross-wave dependency deviation'),
      'step 7 must name the cross-wave dependency deviation as a supported mode',
    );
  });

  test('cleanup-tail snippet contains git worktree prune', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('git worktree prune'),
      'step 7 cleanup-tail snippet must include git worktree prune',
    );
  });

  test('cleanup-tail snippet contains git worktree remove --force', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('git worktree remove') && block.includes('--force'),
      'step 7 cleanup-tail snippet must include git worktree remove --force',
    );
  });

  test('cleanup-tail snippet contains git worktree unlock', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('git worktree unlock'),
      'step 7 cleanup-tail snippet must include git worktree unlock',
    );
  });

  test('cleanup-tail snippet contains git branch -D', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('git branch -D'),
      'step 7 cleanup-tail snippet must include git branch -D',
    );
  });

  test('skip conditions enumerate empty-WAVE_WORKTREE_PLANS case', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('WAVE_WORKTREE_PLANS'),
      'step 7 must document the empty-WAVE_WORKTREE_PLANS skip condition',
    );
  });

  test('skip conditions enumerate custom-merge-deviation case', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    // The deviation skip condition must reference the cleanup-tail as the alternative
    assert.ok(
      block.includes('cleanup-tail'),
      'step 7 must document the custom-merge-deviation skip condition with a pointer to the cleanup-tail',
    );
  });

  test('cleanup-tail uses wave manifest instead of agent namespace discovery', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.ok(
      block.includes('WAVE_WORKTREE_MANIFEST'),
      'cleanup-tail must consume the current wave manifest',
    );
    assert.ok(
      block.includes('avoid touching unrelated active agents'),
      'cleanup-tail must document why manifest-scoped cleanup is required',
    );
  });

  test('cleanup-tail does not rediscover global agent worktrees', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    assert.doesNotMatch(
      block,
      /git worktree list --porcelain.*\.claude\/worktrees\/agent-/s,
      'cleanup-tail must not parse global git worktree list output for agent worktrees',
    );
    assert.ok(
      block.includes('IFS= read -r'),
      'cleanup-tail still reads manifest paths line-by-line to preserve paths with whitespace',
    );
  });
});
