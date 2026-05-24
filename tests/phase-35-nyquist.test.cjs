/**
 * Phase 35 Nyquist Validation Tests
 *
 * Persistent, repeatable behavioral tests verifying the git backup branches
 * and tag created in Phase 35 (backup-and-soft-reset) exist, regardless of
 * current HEAD position.
 *
 * These automate the three requirements previously classified manual-only in
 * VALIDATION.md:
 *   - GITOPS-01: backup branches exist
 *   - GITOPS-01: tag v1.41.2 exists
 *   - GITOPS-02: v1.41.2 is an ancestor of HEAD
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('child_process');

// ─── Helpers ─────────────────────────────────────────────────────────

function git(args) {
  return execFileSync('git', Array.isArray(args) ? args : args.split(' '), {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Phase 35 — Backup and soft reset verification (GITOPS-01, GITOPS-02)', () => {

  // Task 35-01-01 / GITOPS-01 — backup-thamw-main-before-squash exists
  test('backup-thamw-main-before-squash branch exists', () => {
    const result = git(['branch', '--list', 'backup-thamw-main-before-squash']);
    assert.ok(
      result.includes('backup-thamw-main-before-squash'),
      'Branch backup-thamw-main-before-squash must exist (created during Phase 35 GITOPS-01 backup step)'
    );
  });

  // Task 35-01-01 / GITOPS-01 — backup-thamw-main-with-planning exists
  test('backup-thamw-main-with-planning branch exists', () => {
    const result = git(['branch', '--list', 'backup-thamw-main-with-planning']);
    assert.ok(
      result.includes('backup-thamw-main-with-planning'),
      'Branch backup-thamw-main-with-planning must exist (created during Phase 35 GITOPS-01 backup step)'
    );
  });

  // Task 35-01-01 / GITOPS-01 — both backup branches listed together
  test('both backup branches are listed by wildcard glob', () => {
    const result = git(['branch', '--list', 'backup-thamw-main-*']);
    const lines = result.split('\n').map(l => l.trim()).filter(Boolean);
    assert.ok(
      lines.includes('backup-thamw-main-before-squash'),
      `backup-thamw-main-before-squash missing from branch list. Got: ${lines.join(', ')}`
    );
    assert.ok(
      lines.includes('backup-thamw-main-with-planning'),
      `backup-thamw-main-with-planning missing from branch list. Got: ${lines.join(', ')}`
    );
    assert.strictEqual(
      lines.filter(l => l.startsWith('backup-thamw-main-')).length,
      2,
      `Expected exactly 2 backup-thamw-main-* branches, got: ${lines.join(', ')}`
    );
  });

  // Task 35-01-01 / GITOPS-01 — tag v1.41.2 exists
  test('tag v1.41.2 exists in the repository', () => {
    const result = git(['tag', '-l', 'v1.41.2']);
    assert.strictEqual(
      result,
      'v1.41.2',
      'Tag v1.41.2 must exist — it is the soft-reset target recorded in GITOPS-01'
    );
  });

  // Task 35-01-02 / GITOPS-02 — v1.41.2 is an ancestor of HEAD
  test('v1.41.2 is an ancestor of HEAD (soft-reset prerequisite preserved)', () => {
    const { status } = spawnSync('git', ['merge-base', '--is-ancestor', 'v1.41.2', 'HEAD'], {
      stdio: 'pipe',
    });
    assert.strictEqual(
      status,
      0,
      'git merge-base --is-ancestor v1.41.2 HEAD must exit 0 — v1.41.2 must be reachable from HEAD (GITOPS-02)'
    );
  });

});
