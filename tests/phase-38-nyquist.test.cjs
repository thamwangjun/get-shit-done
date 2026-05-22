/**
 * Phase 38 Nyquist Validation Tests
 *
 * Persistent, repeatable behavioral tests verifying the Batch 3 commit
 * (8d9992fe) exists with correct properties regardless of current HEAD.
 *
 * These replace the point-in-time shell one-liners in VALIDATION.md that
 * broke when HEAD moved past the Batch 3 commit.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');

const BATCH_3_COMMIT = '8d9992fe';
const EXPECTED_MESSAGE = 'refactor(prompts): refactor workflows, agents, and templates (Batch 3)';

// The exact 61 files from the PLAN, sorted alphabetically.
const EXPECTED_FILES = [
  'README.ja-JP.md',
  'README.ko-KR.md',
  'README.md',
  'README.pt-BR.md',
  'README.zh-CN.md',
  'agents/gsd-advisor-researcher.md',
  'agents/gsd-assumptions-analyzer.md',
  'agents/gsd-code-fixer.md',
  'agents/gsd-code-reviewer.md',
  'agents/gsd-codebase-mapper.md',
  'agents/gsd-debugger.md',
  'agents/gsd-doc-classifier.md',
  'agents/gsd-doc-synthesizer.md',
  'agents/gsd-doc-verifier.md',
  'agents/gsd-doc-writer.md',
  'agents/gsd-eval-auditor.md',
  'agents/gsd-executor.md',
  'agents/gsd-intel-updater.md',
  'agents/gsd-pattern-mapper.md',
  'agents/gsd-phase-researcher.md',
  'agents/gsd-plan-checker.md',
  'agents/gsd-planner.md',
  'agents/gsd-roadmapper.md',
  'agents/gsd-security-auditor.md',
  'agents/gsd-ui-checker.md',
  'agents/gsd-ui-researcher.md',
  'agents/gsd-verifier.md',
  'commands/gsd/discuss-phase.md',
  'commands/gsd/docs-update.md',
  'commands/gsd/execute-phase.md',
  'docs/DEVELOPMENT.md',
  'docs/FEATURES.md',
  'docs/GETTING-STARTED.md',
  'docs/INVENTORY-MANIFEST.json',
  'docs/INVENTORY.md',
  'docs/SDK-LOCAL-DEV.md',
  'docs/TESTING.md',
  'docs/USER-GUIDE.md',
  'docs/zh-CN/README.md',
  'get-shit-done/workflows/autonomous.md',
  'get-shit-done/workflows/discuss-phase-assumptions.md',
  'get-shit-done/workflows/docs-update.md',
  'get-shit-done/workflows/edit-phase.md',
  'get-shit-done/workflows/execute-phase.md',
  'get-shit-done/workflows/extract-learnings.md',
  'get-shit-done/workflows/fast.md',
  'get-shit-done/workflows/graduation.md',
  'get-shit-done/workflows/import.md',
  'get-shit-done/workflows/insert-phase.md',
  'get-shit-done/workflows/join-discord.md',
  'get-shit-done/workflows/map-codebase.md',
  'get-shit-done/workflows/new-workspace.md',
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/reapply-patches.md',
  'get-shit-done/workflows/remove-phase.md',
  'get-shit-done/workflows/secure-phase.md',
  'get-shit-done/workflows/set-profile.md',
  'get-shit-done/workflows/settings-integrations.md',
  'get-shit-done/workflows/spike.md',
  'get-shit-done/workflows/undo.md',
  'get-shit-done/workflows/verify-phase.md',
];

// ─── Helpers ─────────────────────────────────────────────────────────

function git(args) {
  return execFileSync('git', Array.isArray(args) ? args : args.split(' '), {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Phase 38 — Batch 3 commit verification', () => {

  // T-38-01: STAGE-03 — Validate commit exists and has correct message
  test('commit 8d9992fe exists in history', () => {
    const result = git(['cat-file', '-t', BATCH_3_COMMIT]);
    assert.strictEqual(result, 'commit',
      `Commit ${BATCH_3_COMMIT} must exist in git history`);
  });

  test('commit 8d9992fe has correct conventional commit message', () => {
    const message = git(['log', '-n', '1', '--pretty=format:%s', BATCH_3_COMMIT]);
    assert.strictEqual(message, EXPECTED_MESSAGE,
      `Commit message must be exactly: "${EXPECTED_MESSAGE}"`);
  });

  // Task 38-01-01: STAGE-03, T-38-01 — Validate staging targets (exact subset)
  test('commit 8d9992fe contains exactly 61 files — correct count', () => {
    const raw = git(['show', '--name-only', '--pretty=format:', BATCH_3_COMMIT]);
    const files = raw.split('\n').filter(Boolean).sort();
    assert.strictEqual(files.length, 61,
      `Wanted 61 files, got ${files.length}. Missing or extra files detected.`);
  });

  test('every file in commit 8d9992fe is in the expected Batch 3 set', () => {
    const raw = git(['show', '--name-only', '--pretty=format:', BATCH_3_COMMIT]);
    const committedFiles = new Set(raw.split('\n').filter(Boolean));
    const expectedSet = new Set(EXPECTED_FILES);

    const unexpected = [...committedFiles].filter(f => !expectedSet.has(f));
    assert.deepStrictEqual(unexpected, [],
      `Found ${unexpected.length} file(s) in commit not in expected Batch 3 set: ${unexpected.join(', ')}`);
  });

  // Task 38-01-02: STAGE-03 — Validate commit message and history
  test('no expected Batch 3 file is missing from commit 8d9992fe', () => {
    const raw = git(['show', '--name-only', '--pretty=format:', BATCH_3_COMMIT]);
    const committedSet = new Set(raw.split('\n').filter(Boolean));

    const missing = EXPECTED_FILES.filter(f => !committedSet.has(f));
    assert.deepStrictEqual(missing, [],
      `Found ${missing.length} expected file(s) missing from commit: ${missing.join(', ')}`);
  });

  test('commit 8d9992fe files exactly match expected list (round-trip)', () => {
    const raw = git(['show', '--name-only', '--pretty=format:', BATCH_3_COMMIT]);
    const committed = raw.split('\n').filter(Boolean).sort();
    assert.deepStrictEqual(committed, EXPECTED_FILES,
      'Committed file list must exactly match the expected Batch 3 set');
  });

  test('commit 8d9992fe only modified Batch 3 files (no staged extras post-commit)', () => {
    // Verify the commit's tree matches the parent's tree for non-Batch-3 files.
    // diff-tree with the commit vs its parent should ONLY list expected files.
    const diff = git(['diff-tree', '--no-commit-id', '--name-only', '-r', BATCH_3_COMMIT]);
    const diffFiles = new Set(diff.split('\n').filter(Boolean));
    const expectedSet = new Set(EXPECTED_FILES);

    const unexpected = [...diffFiles].filter(f => !expectedSet.has(f));
    assert.deepStrictEqual(unexpected, [],
      `Commit diff contains ${unexpected.length} unexpected file(s): ${unexpected.join(', ')}`);
  });

});
