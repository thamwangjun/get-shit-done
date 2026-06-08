/**
 * Regression tests for audit.cjs — quick task completion detection.
 *
 * Covers the fix for #260608-k3p where scanQuickTasks only recognised
 * `status: complete` and false-flagged tasks that carry `completed: <date>`
 * (the convention used by the quick SUMMARY template).
 */

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanup } = require('./helpers.cjs');
const { auditOpenArtifacts } = require('../get-shit-done/bin/lib/audit.cjs');

// ─── Helpers ───────────────────────────────────────────────────────────────

function makePlanDir(tmpDir) {
  const planDir = path.join(tmpDir, '.planning');
  const quickDir = path.join(planDir, 'quick');
  fs.mkdirSync(quickDir, { recursive: true });
  return planDir;
}

function makeTaskDir(planDir, slug) {
  const taskDir = path.join(planDir, 'quick', slug);
  fs.mkdirSync(taskDir, { recursive: true });
  return taskDir;
}

function writeSummary(taskDir, slug, content) {
  const summaryName = `${slug}-SUMMARY.md`;
  fs.writeFileSync(path.join(taskDir, summaryName), content, 'utf8');
}

// ─── Test fixtures ─────────────────────────────────────────────────────────

let tmpDir;
let planDir;

before(() => {
  tmpDir = createTempDir('gsd-audit-test-');
  planDir = makePlanDir(tmpDir);

  // Case 1: SUMMARY with top-level `completed: <date>`, NO `status:` — should be complete
  const dir1 = makeTaskDir(planDir, '260101-aaa-completed-date-only');
  writeSummary(dir1, '260101-aaa-completed-date-only',
    '---\nphase: quick-260101-aaa\ncompleted: 2026-01-01\n---\nDeliverable complete.\n'
  );

  // Case 2: SUMMARY with `status: complete` (legacy) — should be complete
  const dir2 = makeTaskDir(planDir, '260101-bbb-status-complete');
  writeSummary(dir2, '260101-bbb-status-complete',
    '---\nphase: quick-260101-bbb\nstatus: complete\n---\nLegacy marker.\n'
  );

  // Case 3: SUMMARY with `metrics.completed` nested form — should be complete
  const dir3 = makeTaskDir(planDir, '260101-ccc-metrics-completed');
  writeSummary(dir3, '260101-ccc-metrics-completed',
    '---\nphase: quick-260101-ccc\nmetrics:\n  duration: ~5min\n  completed: 2026-01-01\n---\nNested form.\n'
  );

  // Case 4: SUMMARY with NEITHER `status:` NOR `completed:` — should be reported (open)
  const dir4 = makeTaskDir(planDir, '260101-ddd-no-completion-field');
  writeSummary(dir4, '260101-ddd-no-completion-field',
    '---\nphase: quick-260101-ddd\ntags: [investigation]\n---\nNo completion marker.\n'
  );

  // Case 5: directory with NO SUMMARY file — should be reported (missing)
  makeTaskDir(planDir, '260101-eee-no-summary-file');
  // (no SUMMARY written intentionally)
});

after(() => {
  cleanup(tmpDir);
});

// ─── Tests ─────────────────────────────────────────────────────────────────

test('quick task with top-level completed: date is NOT reported as incomplete', () => {
  const result = auditOpenArtifacts(tmpDir);
  const slugs = result.items.quick_tasks.map(i => i.slug);
  assert.ok(!slugs.some(s => s.includes('260101-aaa')),
    'completed: <date> task should be treated as complete and excluded from open list');
});

test('quick task with status: complete (legacy) is NOT reported as incomplete', () => {
  const result = auditOpenArtifacts(tmpDir);
  const slugs = result.items.quick_tasks.map(i => i.slug);
  assert.ok(!slugs.some(s => s.includes('260101-bbb')),
    'status: complete task should be excluded from open list');
});

test('quick task with nested metrics.completed is NOT reported as incomplete', () => {
  const result = auditOpenArtifacts(tmpDir);
  const slugs = result.items.quick_tasks.map(i => i.slug);
  assert.ok(!slugs.some(s => s.includes('260101-ccc')),
    'metrics.completed task should be treated as complete and excluded from open list');
});

test('quick task SUMMARY with no status or completed field IS reported as open', () => {
  const result = auditOpenArtifacts(tmpDir);
  const slugs = result.items.quick_tasks.map(i => i.slug);
  assert.ok(slugs.some(s => s.includes('260101-ddd')),
    'task with no completion field should appear in open list');
  const item = result.items.quick_tasks.find(i => i.slug.includes('260101-ddd'));
  assert.equal(item.status, 'unknown');
});

test('quick task dir with no SUMMARY file IS reported with status missing', () => {
  const result = auditOpenArtifacts(tmpDir);
  const slugs = result.items.quick_tasks.map(i => i.slug);
  assert.ok(slugs.some(s => s.includes('260101-eee')),
    'task dir with no SUMMARY should appear in open list');
  const item = result.items.quick_tasks.find(i => i.slug.includes('260101-eee'));
  assert.equal(item.status, 'missing');
});

test('counts.quick_tasks reflects only open tasks (2 open out of 5 fixtures)', () => {
  const result = auditOpenArtifacts(tmpDir);
  assert.equal(result.counts.quick_tasks, 2,
    'exactly the two open fixtures (no-field + no-summary) should be counted');
});
