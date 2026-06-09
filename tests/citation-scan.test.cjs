'use strict';

/**
 * citation-scan.test.cjs
 *
 * Nyquist validation tests for Phase 64 (citation-pattern-exploration).
 * Covers all seven gaps identified in the adversarial audit:
 *
 *   CITE-01: All 4 citation categories present in scanner output
 *   CITE-02: 64-FINDINGS.md has the required 3-column schema
 *   D-04:    Unit tests for inline/parenthetical/word-form/feat-form regex taxonomy
 *   D-05:    Regression — feat-3347 detected as feat-form
 *   D-08:    Zero-dependency CommonJS structure (file existence + shebang)
 *   D-09:    JSON stdout + exit 0 smoke test
 *   D-10:    Frontmatter and code-block exclusion logic
 *
 * Structure mirrors tests/step-numbering-scan.test.cjs (the primary analog):
 *   - Unit tests of the scanner's exported logic first
 *   - Corpus / smoke tests that invoke the script last
 *
 * Scanner invocation (D-09): node scripts/scan-citations.cjs → JSON array to stdout, exit 0
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const SCANNER_PATH = path.join(PROJECT_ROOT, 'scripts', 'scan-citations.cjs');
const FINDINGS_PATH = path.join(
  PROJECT_ROOT,
  '.planning', 'phases', '64-citation-pattern-exploration', '64-FINDINGS.md'
);

// ─── Load the scanner's exported functions for unit testing ──────────────────
// The scanner wraps its main() execution in require.main === module, so
// requiring it here is safe — no side effects are triggered.
const { collectMarkdownFiles, main: scannerMain } = require('../scripts/scan-citations.cjs');

// ─── D-08: Zero-dependency CommonJS structure ─────────────────────────────────

describe('D-08 — zero-dependency CommonJS structure', () => {
  test('scripts/scan-citations.cjs exists at the declared path', () => {
    assert.ok(
      fs.existsSync(SCANNER_PATH),
      `scripts/scan-citations.cjs not found at ${SCANNER_PATH}`
    );
  });

  test('first line is the correct shebang #!/usr/bin/env node', () => {
    const content = fs.readFileSync(SCANNER_PATH, 'utf-8');
    const firstLine = content.split('\n')[0];
    assert.equal(
      firstLine,
      '#!/usr/bin/env node',
      `Expected shebang on line 1, got: ${JSON.stringify(firstLine)}`
    );
  });

  test('uses only built-in Node.js modules (fs and path — no require of non-built-ins)', () => {
    const content = fs.readFileSync(SCANNER_PATH, 'utf-8');
    // Extract all require() calls
    const requireCalls = [...content.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)]
      .map(m => m[1]);
    const BUILT_INS = new Set(['fs', 'path', 'node:fs', 'node:path']);
    for (const dep of requireCalls) {
      assert.ok(
        BUILT_INS.has(dep),
        `Non-built-in require found: '${dep}' — D-08 requires zero external dependencies`
      );
    }
  });

  test('uses CommonJS exports (module.exports), not ESM', () => {
    const content = fs.readFileSync(SCANNER_PATH, 'utf-8');
    assert.ok(
      content.includes('module.exports'),
      'scripts/scan-citations.cjs must use module.exports (CommonJS) — ESM not permitted'
    );
    assert.ok(
      !content.includes('export default') && !content.includes('export {'),
      'No ESM export syntax allowed in a CommonJS module'
    );
  });

  test('exports collectMarkdownFiles and main', () => {
    assert.equal(typeof collectMarkdownFiles, 'function', 'collectMarkdownFiles must be exported');
    assert.equal(typeof scannerMain, 'function', 'main must be exported');
  });
});

// ─── D-09: JSON stdout + exit 0 smoke test ────────────────────────────────────

describe('D-09 — JSON stdout + exit 0', () => {
  test('node scripts/scan-citations.cjs exits with code 0', () => {
    const result = spawnSync(process.execPath, [SCANNER_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    assert.equal(
      result.status,
      0,
      `Expected exit code 0, got ${result.status}. stderr: ${result.stderr}`
    );
  });

  test('stdout is valid JSON', () => {
    const result = spawnSync(process.execPath, [SCANNER_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, `Scanner did not exit 0. stderr: ${result.stderr}`);
    let parsed;
    assert.doesNotThrow(
      () => { parsed = JSON.parse(result.stdout); },
      'stdout must be valid JSON'
    );
    assert.ok(Array.isArray(parsed), 'JSON output must be an array');
  });

  test('stdout JSON array contains objects with file, line, text, category fields', () => {
    const result = spawnSync(process.execPath, [SCANNER_PATH], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0, `Scanner did not exit 0. stderr: ${result.stderr}`);
    const hits = JSON.parse(result.stdout);
    assert.ok(hits.length > 0, 'Scanner must return at least one hit in the corpus');
    const first = hits[0];
    assert.ok('file' in first, 'Hit objects must have a "file" field');
    assert.ok('line' in first, 'Hit objects must have a "line" field');
    assert.ok('text' in first, 'Hit objects must have a "text" field');
    assert.ok('category' in first, 'Hit objects must have a "category" field');
  });

  test('unknown flags cause exit 1 with usage message on stderr', () => {
    const result = spawnSync(process.execPath, [SCANNER_PATH, '--unknown-flag'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    assert.equal(
      result.status,
      1,
      `Expected exit code 1 for unknown flag, got ${result.status}`
    );
    assert.ok(
      result.stderr.includes('Unknown flag'),
      `Expected "Unknown flag" in stderr, got: ${JSON.stringify(result.stderr)}`
    );
  });

  test('bare -- separator is accepted (exit 0)', () => {
    // Fix IN-03: allow bare -- separator injected by npm or shell
    const result = spawnSync(process.execPath, [SCANNER_PATH, '--'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    assert.equal(
      result.status,
      0,
      `Expected exit code 0 for bare --, got ${result.status}. stderr: ${result.stderr}`
    );
  });
});

// ─── D-04: Unit tests for citation regex taxonomy ─────────────────────────────
// The scanner's main() function is the primary testable unit that implements
// D-04 detection. We create synthetic temp directories with known content
// and assert the correct categories are returned.

describe('D-04 — citation regex taxonomy (unit)', () => {
  // Helper: create a temp dir with a single .md file, run scanner main() on it,
  // return the hits array.
  function scanSyntheticContent(mdContent) {
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-scan-test-'));
    const mdFile = path.join(tmpDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent, 'utf-8');
    const hits = scannerMain(path.dirname(tmpDir), [path.basename(tmpDir)]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return hits;
  }

  test('inline: #NNN in prose is classified as "inline"', () => {
    const hits = scanSyntheticContent('See issue #1234 for details.\n');
    const inline = hits.filter(h => h.category === 'inline');
    assert.equal(inline.length, 1, `Expected 1 inline hit, got ${inline.length}`);
    assert.equal(inline[0].text, '#1234', `Expected text "#1234", got "${inline[0].text}"`);
  });

  test('parenthetical: (#NNN) is classified as "parenthetical" not "inline"', () => {
    const hits = scanSyntheticContent('Fixed in the latest merge (#5678).\n');
    const paren = hits.filter(h => h.category === 'parenthetical');
    const inline = hits.filter(h => h.category === 'inline');
    assert.equal(paren.length, 1, `Expected 1 parenthetical hit, got ${paren.length}`);
    assert.equal(inline.length, 0, `Expected 0 inline hits (parenthetical must not be double-counted), got ${inline.length}`);
    assert.equal(paren[0].text, '#5678', `Expected text "#5678", got "${paren[0].text}"`);
  });

  test('word-form: "issue 42" is classified as "word-form"', () => {
    const hits = scanSyntheticContent('Tracked in issue 42 on the backlog.\n');
    const wordForm = hits.filter(h => h.category === 'word-form');
    assert.equal(wordForm.length, 1, `Expected 1 word-form hit, got ${wordForm.length}`);
    assert.ok(wordForm[0].text.includes('42'), `Expected text to include "42", got "${wordForm[0].text}"`);
  });

  test('word-form: "PR 99" is classified as "word-form"', () => {
    const hits = scanSyntheticContent('Merged in PR 99 last week.\n');
    const wordForm = hits.filter(h => h.category === 'word-form');
    assert.equal(wordForm.length, 1, `Expected 1 word-form hit, got ${wordForm.length}`);
  });

  test('word-form: "pull request 100" is classified as "word-form"', () => {
    const hits = scanSyntheticContent('See pull request 100 for the fix.\n');
    const wordForm = hits.filter(h => h.category === 'word-form');
    assert.equal(wordForm.length, 1, `Expected 1 word-form hit for "pull request 100", got ${wordForm.length}`);
  });

  test('feat-form: feat-NNNN (3+ digits) is classified as "feat-form"', () => {
    const hits = scanSyntheticContent('This implements feat-1234 in the pipeline.\n');
    const featForm = hits.filter(h => h.category === 'feat-form');
    assert.equal(featForm.length, 1, `Expected 1 feat-form hit, got ${featForm.length}`);
    assert.equal(featForm[0].text, 'feat-1234', `Expected text "feat-1234", got "${featForm[0].text}"`);
  });

  test('feat-form: feat-NN (2 digits) is NOT classified (3+ digit requirement)', () => {
    const hits = scanSyntheticContent('This is feat-12 short form.\n');
    const featForm = hits.filter(h => h.category === 'feat-form');
    assert.equal(featForm.length, 0, `feat-NN (2 digits) must not match — minimum is 3 digits, got ${featForm.length} hits`);
  });

  test('inline: hex color #e8c170 (6-char hex) is NOT classified as inline', () => {
    // The lookbehind (?<![0-9a-fA-F#]) prevents matching mid-hex-color tails,
    // but a standalone #e8c170 where 'e8c' follows '#' contains hex chars — the
    // lookbehind checks the char BEFORE '#', not after. However, the INLINE_RE
    // uses \d+ (digits only), so #e8c170 won't match because 'e8c' is not digits.
    const hits = scanSyntheticContent('Color is #e8c170 for emphasis.\n');
    const inline = hits.filter(h => h.category === 'inline');
    assert.equal(inline.length, 0, `Hex color #e8c170 must not be classified as inline (non-digit chars prevent match), got ${inline.length} hits`);
  });

  test('inline: ## heading marker does not produce a citation hit', () => {
    // ## followed by a word — the lookbehind (?<![0-9a-fA-F#]) prevents matching
    // after a '#' character, so ##Heading never matches #Heading as inline.
    const hits = scanSyntheticContent('## My Heading\n### Sub-section\n');
    assert.equal(hits.length, 0, `Heading markers must not produce citation hits, got ${hits.length}`);
  });

  test('only known categories are produced (no unexpected category strings)', () => {
    const content = [
      'See #100 for inline.',
      'Fixed (#200) parenthetical.',
      'Merged PR 300 word-form.',
      'Implements feat-4000 feat-form.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const VALID_CATEGORIES = new Set(['inline', 'parenthetical', 'word-form', 'feat-form']);
    for (const hit of hits) {
      assert.ok(
        VALID_CATEGORIES.has(hit.category),
        `Unexpected category "${hit.category}" in hit: ${JSON.stringify(hit)}`
      );
    }
  });
});

// ─── D-05: Regression — feat-3347 detected as feat-form ──────────────────────

describe('D-05 — feat-3347 regression', () => {
  test('scanner detects feat-3347 in the live corpus', () => {
    const SCAN_DIRS = [
      'commands',
      'get-shit-done/workflows',
      'agents',
      'get-shit-done/references',
      'get-shit-done/templates',
    ];
    const hits = scannerMain(PROJECT_ROOT, SCAN_DIRS);
    const feat3347Hits = hits.filter(h => h.text === 'feat-3347');
    assert.ok(
      feat3347Hits.length >= 1,
      `feat-3347 must appear in scanner output at least once. Got 0 hits. ` +
      `Check get-shit-done/references/planner-graphify-auto-update.md line 62.`
    );
  });

  test('feat-3347 hit is classified as "feat-form"', () => {
    const SCAN_DIRS = [
      'commands',
      'get-shit-done/workflows',
      'agents',
      'get-shit-done/references',
      'get-shit-done/templates',
    ];
    const hits = scannerMain(PROJECT_ROOT, SCAN_DIRS);
    const feat3347Hits = hits.filter(h => h.text === 'feat-3347');
    assert.ok(feat3347Hits.length >= 1, 'feat-3347 must be found in the corpus');
    for (const hit of feat3347Hits) {
      assert.equal(
        hit.category,
        'feat-form',
        `feat-3347 must be classified as "feat-form", got "${hit.category}" in ${hit.file}:${hit.line}`
      );
    }
  });

  test('feat-3347 is found in get-shit-done/references/planner-graphify-auto-update.md', () => {
    const SCAN_DIRS = [
      'commands',
      'get-shit-done/workflows',
      'agents',
      'get-shit-done/references',
      'get-shit-done/templates',
    ];
    const hits = scannerMain(PROJECT_ROOT, SCAN_DIRS);
    const hit = hits.find(
      h => h.text === 'feat-3347' &&
           h.file.includes('planner-graphify-auto-update')
    );
    assert.ok(
      hit !== undefined,
      'feat-3347 must be found in planner-graphify-auto-update.md — this is the D-05 canonical hit'
    );
    assert.equal(hit.line, 62, `D-05 canonical hit must be on line 62, got line ${hit.line}`);
  });
});

// ─── D-10: Frontmatter and code-block exclusion logic ────────────────────────

describe('D-10 — frontmatter and code-block exclusion', () => {
  function scanSyntheticContent(mdContent) {
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-scan-exclusion-'));
    const mdFile = path.join(tmpDir, 'test.md');
    fs.writeFileSync(mdFile, mdContent, 'utf-8');
    const hits = scannerMain(path.dirname(tmpDir), [path.basename(tmpDir)]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return hits;
  }

  test('citations inside YAML frontmatter block are excluded', () => {
    const content = [
      '---',
      'title: Issue #1234',
      'color: "#5678"',
      '---',
      '',
      'Normal prose here.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    // #1234 and #5678 are inside frontmatter — must produce 0 hits
    const citationsFromFrontmatter = hits.filter(
      h => h.text === '#1234' || h.text === '#5678'
    );
    assert.equal(
      citationsFromFrontmatter.length,
      0,
      `Citations inside YAML frontmatter must be excluded. Found: ${JSON.stringify(citationsFromFrontmatter)}`
    );
  });

  test('citation after frontmatter close is included', () => {
    const content = [
      '---',
      'title: No citations here',
      '---',
      '',
      'See #9999 for the fix.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const hit = hits.find(h => h.text === '#9999');
    assert.ok(
      hit !== undefined,
      'Citation #9999 after frontmatter close must be included in hits'
    );
    assert.equal(hit.category, 'inline');
  });

  test('citations inside fenced code blocks are excluded', () => {
    const content = [
      'Before the fence.',
      '```bash',
      'echo "See #2000 for context"',
      'git commit -m "fix(#2001): something"',
      '```',
      'After the fence.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const insideFence = hits.filter(h => h.text === '#2000' || h.text === '#2001');
    assert.equal(
      insideFence.length,
      0,
      `Citations inside code fences must be excluded. Found: ${JSON.stringify(insideFence)}`
    );
  });

  test('citation before and after a code fence are both included', () => {
    const content = [
      'See #3001 before the fence.',
      '```',
      '#3002 inside — excluded',
      '```',
      'See #3003 after the fence.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const before = hits.find(h => h.text === '#3001');
    const after = hits.find(h => h.text === '#3003');
    const inside = hits.find(h => h.text === '#3002');
    assert.ok(before !== undefined, '#3001 before fence must be included');
    assert.ok(after !== undefined, '#3003 after fence must be included');
    assert.ok(inside === undefined, '#3002 inside fence must be excluded');
  });

  test('--- thematic break after frontmatter is not treated as another frontmatter start', () => {
    // After frontmatter closes, a subsequent --- is a thematic break — content
    // on surrounding lines must still be scanned.
    const content = [
      '---',
      'title: test',
      '---',
      '',
      'See #4001 here.',
      '',
      '---',
      '',
      'See #4002 after thematic break.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const h4001 = hits.find(h => h.text === '#4001');
    const h4002 = hits.find(h => h.text === '#4002');
    assert.ok(h4001 !== undefined, '#4001 before thematic break must be included');
    assert.ok(h4002 !== undefined, '#4002 after thematic break must be included');
  });

  test('file with no frontmatter: all citations are included', () => {
    const content = [
      'This file has no frontmatter.',
      'See #5001 and (#5002) for context.',
    ].join('\n') + '\n';
    const hits = scanSyntheticContent(content);
    const h5001 = hits.find(h => h.text === '#5001');
    const h5002 = hits.find(h => h.text === '#5002');
    assert.ok(h5001 !== undefined, '#5001 must be included');
    assert.ok(h5002 !== undefined, '#5002 must be included');
    assert.equal(h5001.category, 'inline');
    assert.equal(h5002.category, 'parenthetical');
  });
});

// ─── CITE-01: Corpus test — all citation categories present in scanner output ─

describe('CITE-01 — all citation categories documented in scanner output', () => {
  // Run the scanner against the live corpus once at module scope via the exported
  // main() function to avoid multiple filesystem traversals.
  const SCAN_DIRS = [
    'commands',
    'get-shit-done/workflows',
    'agents',
    'get-shit-done/references',
    'get-shit-done/templates',
  ];
  const corpusHits = scannerMain(PROJECT_ROOT, SCAN_DIRS);

  test('scanner produces at least one "inline" hit in the corpus', () => {
    const count = corpusHits.filter(h => h.category === 'inline').length;
    assert.ok(
      count >= 60,
      `Expected >= 60 inline hits (SUMMARY confirms 64 baseline). Got ${count}. ` +
      `If count is 0, the scanner is broken. If < 60, corpus may have been cleaned.`
    );
  });

  test('scanner produces at least one "parenthetical" hit in the corpus', () => {
    const count = corpusHits.filter(h => h.category === 'parenthetical').length;
    assert.ok(
      count >= 1,
      `Expected at least 1 parenthetical hit. Got ${count}.`
    );
  });

  test('"word-form" category is part of the taxonomy (zero hits confirmed in corpus)', () => {
    // word-form produces 0 hits in the 5 scoped dirs — this is a confirmed finding,
    // not a bug. This test documents the taxonomy is implemented, not that hits exist.
    // The taxonomy must be implemented in the scanner's code even if no hits are found.
    // We verify this by asserting the scanner's exported regexes can detect word-form
    // when given synthetic input (see D-04 tests above).
    // For the corpus: assert word-form hits are exactly 0 (confirmed baseline).
    const wordFormCount = corpusHits.filter(h => h.category === 'word-form').length;
    assert.equal(
      wordFormCount,
      0,
      `word-form corpus count should be 0 (confirmed in 64-FINDINGS.md). Got ${wordFormCount}.`
    );
  });

  test('scanner produces at least one "feat-form" hit in the corpus', () => {
    const count = corpusHits.filter(h => h.category === 'feat-form').length;
    assert.ok(
      count >= 1,
      `Expected at least 1 feat-form hit (feat-3347 is the D-05 canonical hit). Got ${count}.`
    );
  });

  test('all hit objects have exactly the required schema fields', () => {
    assert.ok(corpusHits.length > 0, 'Corpus must have at least one hit');
    for (const hit of corpusHits) {
      assert.ok(typeof hit.file === 'string' && hit.file.length > 0, `hit.file must be a non-empty string: ${JSON.stringify(hit)}`);
      assert.ok(typeof hit.line === 'number' && hit.line >= 1, `hit.line must be a positive integer: ${JSON.stringify(hit)}`);
      assert.ok(typeof hit.text === 'string' && hit.text.length > 0, `hit.text must be a non-empty string: ${JSON.stringify(hit)}`);
      assert.ok(typeof hit.category === 'string' && hit.category.length > 0, `hit.category must be a non-empty string: ${JSON.stringify(hit)}`);
    }
  });

  test('all categories in output are from the defined taxonomy', () => {
    const VALID_CATEGORIES = new Set(['inline', 'parenthetical', 'word-form', 'feat-form']);
    for (const hit of corpusHits) {
      assert.ok(
        VALID_CATEGORIES.has(hit.category),
        `Unexpected category "${hit.category}" found in hit: ${JSON.stringify(hit)}`
      );
    }
  });

  test('all file paths in hits use forward-slash separators (POSIX-normalized)', () => {
    for (const hit of corpusHits) {
      assert.ok(
        !hit.file.includes('\\'),
        `hit.file must use forward slashes, got: "${hit.file}"`
      );
    }
  });
});

// ─── CITE-02: 64-FINDINGS.md has the required 3-column schema ────────────────

describe('CITE-02 — 64-FINDINGS.md structural schema', () => {
  let findingsContent;

  test('64-FINDINGS.md exists at the expected path', () => {
    assert.ok(
      fs.existsSync(FINDINGS_PATH),
      `64-FINDINGS.md not found at ${FINDINGS_PATH}`
    );
    findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
  });

  test('64-FINDINGS.md contains a ## Summary section', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    assert.ok(
      findingsContent.includes('## Summary'),
      '64-FINDINGS.md must contain a "## Summary" section (D-03)'
    );
  });

  test('64-FINDINGS.md contains a ## Findings Table section', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    assert.ok(
      findingsContent.includes('## Findings Table'),
      '64-FINDINGS.md must contain a "## Findings Table" section (D-02)'
    );
  });

  test('64-FINDINGS.md contains a ## Allowlist Candidates section', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    assert.ok(
      findingsContent.includes('## Allowlist Candidates'),
      '64-FINDINGS.md must contain a "## Allowlist Candidates" section (D-06)'
    );
  });

  test('64-FINDINGS.md table header has exactly 3 columns: file:line | matched_text | category', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    // The D-02 schema mandates exactly these three columns in this order.
    assert.ok(
      findingsContent.includes('file:line'),
      '64-FINDINGS.md Findings Table must include "file:line" column header (D-02)'
    );
    assert.ok(
      findingsContent.includes('matched_text'),
      '64-FINDINGS.md Findings Table must include "matched_text" column header (D-02)'
    );
    assert.ok(
      findingsContent.includes('category'),
      '64-FINDINGS.md Findings Table must include "category" column header (D-02)'
    );
    // Verify column order by finding a line with all three in order
    const lines = findingsContent.split('\n');
    const headerLine = lines.find(l =>
      l.includes('file:line') && l.includes('matched_text') && l.includes('category')
    );
    assert.ok(
      headerLine !== undefined,
      'No single line in 64-FINDINGS.md has all three required columns: file:line, matched_text, category'
    );
    // Check order: file:line must come before matched_text, which must come before category
    const posFileCol = headerLine.indexOf('file:line');
    const posTextCol = headerLine.indexOf('matched_text');
    const posCatCol  = headerLine.indexOf('category');
    assert.ok(
      posFileCol < posTextCol,
      `Column order violation: "file:line" (pos ${posFileCol}) must appear before "matched_text" (pos ${posTextCol})`
    );
    assert.ok(
      posTextCol < posCatCol,
      `Column order violation: "matched_text" (pos ${posTextCol}) must appear before "category" (pos ${posCatCol})`
    );
  });

  test('64-FINDINGS.md documents feat-3347 as a feat-form hit', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    assert.ok(
      findingsContent.includes('feat-3347'),
      '64-FINDINGS.md must document "feat-3347" in the Findings Table (D-05)'
    );
    assert.ok(
      findingsContent.includes('feat-form'),
      '64-FINDINGS.md must include "feat-form" category entries (D-04)'
    );
    // The feat-3347 row must appear with feat-form on the same line or nearby
    const lines = findingsContent.split('\n');
    const feat3347Line = lines.find(l => l.includes('feat-3347') && l.includes('feat-form'));
    assert.ok(
      feat3347Line !== undefined,
      'A single row in 64-FINDINGS.md must contain both "feat-3347" and "feat-form" (D-05 — canonical hit with correct category)'
    );
  });

  test('64-FINDINGS.md references planner-graphify-auto-update.md (D-05 provenance)', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    assert.ok(
      findingsContent.includes('planner-graphify-auto-update'),
      '64-FINDINGS.md must reference "planner-graphify-auto-update" — D-05 canonical file'
    );
  });

  test('64-FINDINGS.md Allowlist Candidates section has all 4 required candidate rows', () => {
    if (!findingsContent) {
      findingsContent = fs.readFileSync(FINDINGS_PATH, 'utf-8');
    }
    // D-06 requires exactly 4 rows: hex colors, heading markers, placeholders, frontmatter
    const lowerContent = findingsContent.toLowerCase();
    assert.ok(
      lowerContent.includes('hex color'),
      '64-FINDINGS.md Allowlist Candidates must have a "Hex color" row (D-06)'
    );
    assert.ok(
      lowerContent.includes('heading marker'),
      '64-FINDINGS.md Allowlist Candidates must have a "Heading marker" row (D-06)'
    );
    assert.ok(
      lowerContent.includes('placeholder'),
      '64-FINDINGS.md Allowlist Candidates must have a "placeholder" row (D-06)'
    );
    assert.ok(
      lowerContent.includes('frontmatter'),
      '64-FINDINGS.md Allowlist Candidates must have a "frontmatter" row (D-06)'
    );
  });
});
