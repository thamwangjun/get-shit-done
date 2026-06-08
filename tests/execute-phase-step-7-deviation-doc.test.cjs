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
 * Locate the worktree-cleanup block in the workflow file.
 *
 * 260608-fwg: the rewrite re-numbered worktree cleanup from step 7 to step 8 (the
 * "Worktree cleanup" step that carries the Cleanup-tail snippet, the four git worktree
 * commands, and the "When to skip step 8" conditions). The helper now anchors on the
 * "8. **Worktree cleanup" header and runs to step 9, so the cleanup assertions below run
 * against the correct region. The function name is retained for history continuity.
 *
 * Returns the substring from "8. **Worktree cleanup" up to (but not including) "9.".
 * Throws if the block cannot be found.
 */
function extractStep7Block(content) {
  const start = content.indexOf('8. **Worktree cleanup');
  assert.ok(start !== -1, 'execute-phase.md must contain a worktree-cleanup step (step 8)');

  const end = content.indexOf('\n9.', start + 1);
  assert.ok(end !== -1, 'execute-phase.md must contain a step 9 block after the cleanup step');

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
    // 260608-fwg (D-02): the literal "Standard wave contract" phrase vanished in the
    // rewrite. The standard (non-deviation) wave path now survives as the "When to skip
    // step 8" prose, whose first bullet handles the standard case where no plan used
    // worktree isolation. Re-pointed to that surviving wording, preserving the intent that
    // the standard wave contract is documented alongside the deviation path.
    // FLAG: a SEPARATE workflow-edit task may restore an explicit "standard wave contract" heading.
    assert.ok(
      block.includes('When to skip step 8'),
      'cleanup step must document the standard wave path via the skip conditions',
    );
  });

  test('step 7 names cross-wave dependency deviation as a supported execution mode', () => {
    const content = readWorkflow();
    const block = extractStep7Block(content);
    // 260608-fwg: rewrite hyphenated the phrase to "cross-wave-dependency deviation".
    assert.ok(
      block.includes('cross-wave-dependency deviation'),
      'cleanup step must name the cross-wave dependency deviation as a supported mode',
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
    // 260608-fwg (D-02): the literal "avoid touching unrelated active agents" rationale
    // vanished. The manifest-scoped guarantee survives structurally: the cleanup-tail reads
    // worktree paths exclusively from WAVE_WORKTREE_MANIFEST via a node one-liner and iterates
    // `w.worktree_path` — never rediscovering global agent worktrees. Re-pointed to the
    // surviving manifest-path-iteration wording, preserving the manifest-scoped intent.
    // FLAG: a SEPARATE workflow-edit task may restore the explicit rationale comment.
    assert.ok(
      block.includes('w.worktree_path'),
      'cleanup-tail must iterate worktree paths sourced from the wave manifest, not global discovery',
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
