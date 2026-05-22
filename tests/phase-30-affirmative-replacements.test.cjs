'use strict';

/**
 * Phase 30 FIX-08 Affirmative Replacements
 *
 * Asserts that every negative directive removed in Phase 30 was replaced with
 * affirmative instruction text — not merely deleted. The negative-framing-scan
 * proves negatives are ABSENT; this test proves the affirmative replacements
 * are PRESENT.
 *
 * Coverage:
 *   - Plan 01 (agents/): expected_patterns block rename in gsd-doc-classifier.md
 *     and gsd-doc-synthesizer.md
 *   - Plan 02 (workflows/): 7 workflow files, one affirmative string per file
 *     (plus the three-string check for fast.md)
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}

// ─── Plan 01: agents/ affirmative replacements ───────────────────────────────

describe('Phase 30 Plan 01 — agents/ affirmative replacements', () => {
  test('agents/gsd-doc-classifier.md contains expected_patterns block (anti_patterns renamed)', () => {
    const content = readFile('agents/gsd-doc-classifier.md');
    assert.ok(
      content.includes('expected_patterns'),
      'gsd-doc-classifier.md must contain "expected_patterns" — the <anti_patterns> block rename from Plan 01 Task 1'
    );
  });

  test('agents/gsd-doc-synthesizer.md contains expected_patterns block (anti_patterns renamed)', () => {
    const content = readFile('agents/gsd-doc-synthesizer.md');
    assert.ok(
      content.includes('expected_patterns'),
      'gsd-doc-synthesizer.md must contain "expected_patterns" — the <anti_patterns> block rename from Plan 01 Task 1'
    );
  });
});

// ─── Plan 02: workflows/ affirmative replacements ────────────────────────────

describe('Phase 30 Plan 02 — workflows/ affirmative replacements', () => {
  test('get-shit-done/workflows/extract-learnings.md contains "continues silently" (mustNot replacement)', () => {
    const content = readFile('get-shit-done/workflows/extract-learnings.md');
    assert.ok(
      content.includes('continues silently'),
      'extract-learnings.md must contain "continues silently" — the affirmative replacement for "must not fail or warn" from Plan 02 Task 1'
    );
  });

  test('get-shit-done/workflows/graduation.md contains "out of scope for re-surfacing" (mustNot replacement)', () => {
    const content = readFile('get-shit-done/workflows/graduation.md');
    assert.ok(
      content.includes('out of scope for re-surfacing'),
      'graduation.md must contain "out of scope for re-surfacing" — the affirmative replacement for "must not re-surface" from Plan 02 Task 1'
    );
  });

  test('get-shit-done/workflows/settings-integrations.md contains "Keep the answer out of subsequent question descriptions" (mustNot replacement)', () => {
    const content = readFile('get-shit-done/workflows/settings-integrations.md');
    assert.ok(
      content.includes('Keep the answer out of subsequent question descriptions'),
      'settings-integrations.md must contain the affirmative replacement for "must not be echoed back" from Plan 02 Task 1'
    );
  });

  test('get-shit-done/workflows/fast.md contains all three prohibited replacements', () => {
    const content = readFile('get-shit-done/workflows/fast.md');
    assert.ok(
      content.includes('Run this workflow inline'),
      'fast.md must contain "Run this workflow inline" — affirmative replacement for line 93 prohibited'
    );
    assert.ok(
      content.includes('Keep work confined'),
      'fast.md must contain "Keep work confined" — affirmative replacement for line 94 prohibited'
    );
    assert.ok(
      content.includes('Execute directly'),
      'fast.md must contain "Execute directly" — affirmative replacement for line 95 prohibited'
    );
  });

  test('get-shit-done/workflows/autonomous.md contains "invoke discuss at most once" (prohibited replacement)', () => {
    const content = readFile('get-shit-done/workflows/autonomous.md');
    assert.ok(
      content.includes('invoke discuss at most once'),
      'autonomous.md must contain "invoke discuss at most once" — affirmative replacement for "re-invoking it ... is prohibited" from Plan 02 Task 1'
    );
  });

  test('get-shit-done/workflows/undo.md contains "Use git reset only for" (prohibited replacement)', () => {
    const content = readFile('get-shit-done/workflows/undo.md');
    assert.ok(
      content.includes('Use git reset only for'),
      'undo.md must contain "Use git reset only for" — affirmative replacement for "Using git reset is prohibited" from Plan 02 Task 1'
    );
  });

  test('get-shit-done/workflows/plan-phase.md contains both "Do not create, rename, or switch git branches" and "keep the current branch unchanged" (bug-2388-compatible form)', () => {
    const content = readFile('get-shit-done/workflows/plan-phase.md');
    assert.ok(
      content.includes('Do not create, rename, or switch git branches'),
      'plan-phase.md must retain the "Do not...branch" phrasing required by the bug-2388 regression test'
    );
    assert.ok(
      content.includes('keep the current branch unchanged'),
      'plan-phase.md must contain "keep the current branch unchanged" — the em-dash affirmative complement that satisfies the scanner via hasPositiveComplement()'
    );
  });
});
