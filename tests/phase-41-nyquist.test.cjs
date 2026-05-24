/**
 * Phase 41 Nyquist Validation Tests
 *
 * Persistent, repeatable behavioral tests verifying the Phase 41
 * final-verification-parity-audit artifacts and commit history,
 * regardless of current HEAD.
 *
 * Gaps covered:
 *   G-01 (VALID-01): 41-VERIFICATION.md exists with status: passed,
 *                    contains "backup-thamw-main-before-squash", VALID-01, VALID-02
 *   G-02 (VALID-01): ROADMAP.md Phase 39 row shows "Complete" and "2026-05-22"
 *   G-03 (VALID-01): 41-01-SUMMARY.md exists and contains VALID-01, VALID-02, D-07
 *   G-04:            Phase-41 commits exist in git history
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const VERIFICATION_PATH = path.join(
  REPO_ROOT,
  '.planning',
  'phases',
  '41-final-verification-parity-audit',
  '41-VERIFICATION.md'
);
const SUMMARY_PATH = path.join(
  REPO_ROOT,
  '.planning',
  'phases',
  '41-final-verification-parity-audit',
  '41-01-SUMMARY.md'
);
const ROADMAP_PATH = path.join(REPO_ROOT, '.planning', 'ROADMAP.md');

// Known phase-41 commits referenced in the PLAN/SUMMARY
const PHASE_41_COMMITS = [
  'e9ebb1bd', // docs(phase-41): complete final verification and parity audit
  '87d32f2e', // STATE.md gap-closure commit
  'b1ebe73b',
  '195ed50b',
];

// ─── Helpers ─────────────────────────────────────────────────────────

function git(args) {
  return execFileSync('git', Array.isArray(args) ? args : args.split(' '), {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

// ─── G-01: 41-VERIFICATION.md content ───────────────────────────────

describe('G-01 — 41-VERIFICATION.md exists and contains required content', () => {

  test('41-VERIFICATION.md file exists on disk', () => {
    assert.ok(
      fs.existsSync(VERIFICATION_PATH),
      `41-VERIFICATION.md must exist at ${VERIFICATION_PATH}`
    );
  });

  test('41-VERIFICATION.md frontmatter contains status: passed', () => {
    const content = fs.readFileSync(VERIFICATION_PATH, 'utf8');
    assert.ok(
      content.includes('status: passed'),
      '41-VERIFICATION.md must contain "status: passed" in frontmatter'
    );
  });

  test('41-VERIFICATION.md contains the parity diff anchor string backup-thamw-main-before-squash', () => {
    const content = fs.readFileSync(VERIFICATION_PATH, 'utf8');
    assert.ok(
      content.includes('backup-thamw-main-before-squash'),
      '41-VERIFICATION.md must contain "backup-thamw-main-before-squash" (proving the diff command was run and captured)'
    );
  });

  test('41-VERIFICATION.md contains VALID-01 requirement row', () => {
    const content = fs.readFileSync(VERIFICATION_PATH, 'utf8');
    assert.ok(
      content.includes('VALID-01'),
      '41-VERIFICATION.md must contain "VALID-01" in the requirements coverage table'
    );
  });

  test('41-VERIFICATION.md contains VALID-02 requirement row', () => {
    const content = fs.readFileSync(VERIFICATION_PATH, 'utf8');
    assert.ok(
      content.includes('VALID-02'),
      '41-VERIFICATION.md must contain "VALID-02" in the requirements coverage table'
    );
  });

});

// ─── G-02: ROADMAP.md Phase 39 row ──────────────────────────────────

describe('G-02 — ROADMAP.md Phase 39 row shows Complete and 2026-05-22', () => {

  test('ROADMAP.md file exists on disk', () => {
    assert.ok(
      fs.existsSync(ROADMAP_PATH),
      `ROADMAP.md must exist at ${ROADMAP_PATH}`
    );
  });

  test('ROADMAP.md Phase 39 row status column reads Complete (not Pending)', () => {
    const content = fs.readFileSync(ROADMAP_PATH, 'utf8');
    const lines = content.split('\n');
    const phase39Line = lines.find(
      l => l.includes('39.') && l.includes('Stage and Commit Tests')
    );
    assert.ok(
      phase39Line,
      'ROADMAP.md must contain a row for Phase 39 Stage and Commit Tests'
    );
    assert.ok(
      phase39Line.includes('Complete'),
      `Phase 39 row must contain "Complete"; got: "${phase39Line.trim()}"`
    );
    assert.ok(
      !phase39Line.includes('Pending'),
      `Phase 39 row must NOT show "Pending"; got: "${phase39Line.trim()}"`
    );
  });

  test('ROADMAP.md Phase 39 row completion date reads 2026-05-22', () => {
    const content = fs.readFileSync(ROADMAP_PATH, 'utf8');
    const lines = content.split('\n');
    const phase39Line = lines.find(
      l => l.includes('39.') && l.includes('Stage and Commit Tests')
    );
    assert.ok(
      phase39Line,
      'ROADMAP.md must contain a row for Phase 39 Stage and Commit Tests'
    );
    assert.ok(
      phase39Line.includes('2026-05-22'),
      `Phase 39 row must contain completion date "2026-05-22"; got: "${phase39Line.trim()}"`
    );
  });

});

// ─── G-03: 41-01-SUMMARY.md content ─────────────────────────────────

describe('G-03 — 41-01-SUMMARY.md exists and contains required content', () => {

  test('41-01-SUMMARY.md file exists on disk', () => {
    assert.ok(
      fs.existsSync(SUMMARY_PATH),
      `41-01-SUMMARY.md must exist at ${SUMMARY_PATH}`
    );
  });

  test('41-01-SUMMARY.md contains VALID-01', () => {
    const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
    assert.ok(
      content.includes('VALID-01'),
      '41-01-SUMMARY.md must contain "VALID-01" (requirements coverage)'
    );
  });

  test('41-01-SUMMARY.md contains VALID-02', () => {
    const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
    assert.ok(
      content.includes('VALID-02'),
      '41-01-SUMMARY.md must contain "VALID-02" (requirements coverage)'
    );
  });

  test('41-01-SUMMARY.md contains D-07 (documents the ROADMAP inline fix decision)', () => {
    const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
    assert.ok(
      content.includes('D-07'),
      '41-01-SUMMARY.md must contain "D-07" (documents the ROADMAP.md inline fix decision per plan acceptance criterion)'
    );
  });

});

// ─── G-04: Phase-41 commits exist in git history ─────────────────────

describe('G-04 — Phase-41 commits exist in git history', () => {

  for (const hash of PHASE_41_COMMITS) {
    test(`commit ${hash} exists in git history`, () => {
      const type = git(['cat-file', '-t', hash]);
      assert.strictEqual(
        type,
        'commit',
        `Commit ${hash} must exist in git history as a commit object`
      );
    });
  }

  test('commit e9ebb1bd has the docs(phase-41) conventional commit message', () => {
    const message = git(['log', '-n', '1', '--pretty=format:%s', 'e9ebb1bd']);
    assert.ok(
      message.includes('docs(phase-41)'),
      `Commit e9ebb1bd subject must contain "docs(phase-41)"; got: "${message}"`
    );
  });

  test('commit e9ebb1bd subject matches the plan-specified message', () => {
    const message = git(['log', '-n', '1', '--pretty=format:%s', 'e9ebb1bd']);
    assert.strictEqual(
      message,
      'docs(phase-41): complete final verification and parity audit',
      'Commit message must match the plan-specified conventional commit subject exactly'
    );
  });

});
