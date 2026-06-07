'use strict';

/**
 * Step Numbering Scan
 *
 * Regression guard for the v2.1.0-d whole-integer step numbering milestone.
 * Detects two violation classes:
 *   1. Decimal step labels: "Step N.M" headings (Pattern A/B) and "N.M." ordered-list
 *      items (Pattern D) at columns 0-2.
 *   2. Out-of-order step numbering: per-section sequence validation that flags both
 *      reversed sequences and gaps.
 *
 * SCAN_DIRS:    agents/, get-shit-done/workflows/, commands/gsd/
 * EXCLUDED:     get-shit-done/workflows/{plan-phase,new-milestone,new-project}.md
 *               (Pattern C files — `## N.N.` headings without "Step" keyword;
 *                deferred to follow-on milestone per CONTEXT.md D-07)
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan
const SCAN_DIRS = [
  'agents',
  'get-shit-done/workflows',
  'commands/gsd',
];

// Pattern C files excluded from all corpus subtests (per CONTEXT.md D-07)
const PATTERN_C_EXCLUDES = new Set([
  'get-shit-done/workflows/plan-phase.md',
  'get-shit-done/workflows/new-milestone.md',
  'get-shit-done/workflows/new-project.md',
]);

// ─── File collection ─────────────────────────────────────────────────────────

// All markdown files across SCAN_DIRS — collected once at module scope so that
// each corpus describe block can reference ALL_FILES directly, avoiding multiple
// identical filesystem traversals and providing a single point-of-truth for SCAN_DIRS changes.
// (collectMarkdownFiles is a function declaration and is hoisted above this initializer.)
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

// Filter out Pattern C files from corpus subtests
const SCAN_FILES = ALL_FILES.filter(f =>
  !PATTERN_C_EXCLUDES.has(path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
);

// ─── Detection ───────────────────────────────────────────────────────────────

// Pattern A/B: bold or plain "Step N.M" decimal labels and "Step Na" letter-suffix labels.
// Both are violations requiring renumbering to whole integers (user decision, UAT gap closure).
// Matches either: digit-dot-digit (Step 7.0, Step 2.5) or digit-letter (Step 7a, Step 7b).
// D-05: no indentation guard — all leading whitespace allowed.
const STEP_DECIMAL_RE = /(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i;

/**
 * Scan content for decimal step labels.
 *
 * @param {string} content - Full file content
 * @returns {{ patternAB: Array<{lineNumber, line}>, patternD: Array<{lineNumber, line}> }}
 */
function scanContent(content) {
  const lines = content.split('\n');
  const patternAB = []; // Pattern A/B: "Step N.M" bold/plain headings
  const patternD = [];  // Pattern D: "N.M." ordered-list items at columns 0-2
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code fence state
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Pattern A/B: "Step N.M" with leading boundary (start of line, space, or **)
    if (STEP_DECIMAL_RE.test(line)) {
      patternAB.push({ lineNumber: i + 1, line: trimmed });
    }

    // Pattern D: ordered-list decimal items at columns 0-2 only (RESEARCH.md Pitfall 5)
    if (/^\s{0,2}\d+\.\d+\./.test(line)) {
      patternD.push({ lineNumber: i + 1, line: trimmed });
    }
  }

  return { patternAB, patternD };
}

/**
 * Scan content for out-of-order step numbering.
 * Resets per-section on ## and ### headings (D-04).
 * Flags both reversed sequences and gaps (D-03).
 *
 * @param {string} content - Full file content
 * @returns {Array<{lineNumber, expected, actual, line}>}
 */
function scanForOutOfOrder(content) {
  const lines = content.split('\n');
  const violations = [];
  let inCodeBlock = false;
  let expectedNext = null; // null = no sequence active; integer = next expected step

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code fence state
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Section boundary: ## or ### heading resets the counter (D-04)
    if (/^#{2,3}\s/.test(line)) {
      expectedNext = null;
      continue;
    }

    // Whole-integer step only — anchored to line start to avoid mid-sentence cross-references
    // (e.g. "in Step 8, see..." must not trigger); negative lookahead excludes decimal labels,
    // other digits, and letter-suffix labels (a-z); handles Step 0 as a valid starting label.
    // Phase 50 Plan 1 hardening: list markers (`- **Step 3:**`, `* **Step 3:**`, `+ **Step 3:**`,
    // `1. **Step 3:**`) and blockquote markers (`> **Step 3:**`) are now detected. The corpus
    // had no such patterns as of 2026-05-30, but upstream merges could introduce them. The fix
    // strips leading list/blockquote markers via `/^(\s*(?:[-*+]|\d+\.|>)\s*)+/` before matching,
    // and widens the anchor from `^\s*\*?\*?` to `^[\s*]*` (allows leading whitespace/asterisks).
    const stripped = line.replace(/^(\s*(?:[-*+]|\d+\.|>)\s*)+/, '');
    const stepMatch = stripped.match(/^[\s*]*Step\s+(\d+)(?![\.\da-z])/i);
    if (stepMatch) {
      const n = parseInt(stepMatch[1], 10);
      if (expectedNext === null) {
        // Start sequence at whatever number appears first (handles Step 0)
        expectedNext = n + 1;
      } else if (n !== expectedNext) {
        violations.push({ lineNumber: i + 1, expected: expectedNext, actual: n, line: trimmed });
        // Advance from actual, not expected, to limit cascading errors
        expectedNext = n + 1;
      } else {
        expectedNext = n + 1;
      }
    }
  }

  return violations;
}

function collectMarkdownFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Tolerate missing directories (ENOENT) only — skip them silently.
    // Re-throw unexpected errors so they surface rather than causing silent empty scans.
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}

// ─── Unit tests: scanContent() ───────────────────────────────────────────────

describe('scanContent() — decimal detection', () => {
  test('flags Pattern A/B "**Step 2.5**" heading', () => {
    const { patternAB } = scanContent('**Step 2.5:** do thing\n');
    assert.equal(patternAB.length, 1, 'should detect one Pattern A/B violation');
  });

  test('flags Pattern A/B "Step 7.0" (zero fractional digit, D-08)', () => {
    const { patternAB } = scanContent('**Step 7.0 — branch label**\n');
    assert.equal(patternAB.length, 1, 'Step N.0 is a violation per D-08');
  });

  test('flags Pattern A/B with indentation (D-05: no indentation guard)', () => {
    const { patternAB } = scanContent('   **Step 7.0** indented sub-step\n');
    assert.equal(patternAB.length, 1, 'indented Step N.M must still be flagged');
  });

  test('flags letter-suffix step (Step 7a) as violation', () => {
    const { patternAB } = scanContent('**Step 7a:** branch label\n');
    assert.equal(patternAB.length, 1, 'letter-suffix steps are violations requiring renumbering to whole integers');
  });

  test('does not flag whole-integer step (Step 7)', () => {
    const { patternAB } = scanContent('**Step 7:** do thing\n');
    assert.equal(patternAB.length, 0, 'whole-integer steps must not be flagged');
  });

  test('flags Pattern D ordered-list decimal "5.5. text"', () => {
    const { patternD } = scanContent('5.5. **Worktree cleanup**\n');
    assert.equal(patternD.length, 1, 'ordered-list decimal item should be flagged');
  });

  test('does not flag Pattern D inside code block', () => {
    const { patternD } = scanContent('```\n5.5. inside fence\n```\n');
    assert.equal(patternD.length, 0, 'Pattern D inside code fence must not be flagged');
  });
});

// ─── Unit tests: scanForOutOfOrder() ─────────────────────────────────────────

describe('scanForOutOfOrder() — synthetic content', () => {
  test('flags reversed sequence Step 1, Step 3, Step 2', () => {
    const c = ['## Section', '**Step 1:** a', '**Step 3:** b', '**Step 2:** c'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 2, 'both Step 3 and Step 2 are out of order');
  });

  test('flags gap Step 1, Step 3 (missing Step 2)', () => {
    const c = ['## Section', '**Step 1:** a', '**Step 3:** b'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 1, 'gap should be flagged');
  });

  test('does not flag sequence Step 0, Step 1, Step 2', () => {
    const c = ['## Section', '**Step 0:** a', '**Step 1:** b', '**Step 2:** c'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 0, 'Step 0 followed by Step 1, Step 2 is a valid sequence');
  });

  test('resets sequence on ## heading', () => {
    const c = ['## A', '**Step 1:** a', '## B', '**Step 1:** restart'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 0, 'new section resets counter');
  });

  test('resets sequence on ### heading', () => {
    const c = ['## A', '**Step 1:** a', '### Subsection', '**Step 1:** restart'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 0, 'subsection heading also resets counter');
  });

  test('ignores Step references inside code blocks', () => {
    const c = ['## A', '**Step 5:** a', '```', 'Step 1 inside', 'Step 2 inside', '```', '**Step 6:** b'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 0, 'code-fenced steps must not affect sequence tracking');
  });

  test('detects out-of-order steps preceded by dash list markers', () => {
    const c = ['## Section', '- **Step 3:** reversed', '- **Step 1:** also reversed'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 1, 'reversed list-marker steps are now detected — Step 1 after baseline Step 3 must produce one violation');
  });

  test('detects out-of-order steps preceded by numbered-list markers', () => {
    const c = ['## Section', '1. **Step 3:** reversed', '2. **Step 1:** also reversed'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 1, 'reversed numbered-list steps are now detected — Step 1 after baseline Step 3 must produce one violation');
  });

  test('detects out-of-order steps preceded by blockquote markers', () => {
    const c = ['## Section', '> **Step 3:** reversed', '> **Step 1:** also reversed'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 1, 'reversed blockquote steps are now detected — Step 1 after baseline Step 3 must produce one violation');
  });

  test('detects out-of-order steps preceded by asterisk list markers', () => {
    const c = ['## Section', '* **Step 3:** reversed', '* **Step 1:** also reversed'].join('\n');
    const violations = scanForOutOfOrder(c);
    assert.equal(violations.length, 1, 'reversed asterisk-list steps are now detected — Step 1 after baseline Step 3 must produce one violation');
  });
});

// ─── Corpus tests (D-06: one subtest per file per pattern) ───────────────────

describe('corpus scan — decimal step labels (Pattern A/B)', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no decimal Pattern A/B labels in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const { patternAB } = scanContent(content);
      assert.deepStrictEqual(patternAB, [],
        `Decimal step labels in ${relPath}. Renumber to whole integers (Phase 49 will fix).\n${
          patternAB.map(l => `  line ${l.lineNumber}: ${l.line}`).join('\n')
        }`
      );
    });
  }
});

describe('corpus scan — decimal ordered-list items (Pattern D)', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no decimal Pattern D items in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const { patternD } = scanContent(content);
      assert.deepStrictEqual(patternD, [],
        `Decimal ordered-list items in ${relPath}. Renumber to whole integers (Phase 49 will fix).\n${
          patternD.map(l => `  line ${l.lineNumber}: ${l.line}`).join('\n')
        }`
      );
    });
  }
});

describe('corpus scan — out-of-order step numbering', () => {
  for (const file of SCAN_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no out-of-order step numbering in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const violations = scanForOutOfOrder(content);
      assert.deepStrictEqual(violations, [],
        `Out-of-order step numbering in ${relPath}. Steps must be sequential whole integers.\n${
          violations.map(v => `  line ${v.lineNumber}: expected Step ${v.expected}, got Step ${v.actual}: ${v.line}`).join('\n')
        }`
      );
    });
  }
});
