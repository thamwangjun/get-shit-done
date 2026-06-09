'use strict';

/**
 * no-issue-citations.test.cjs
 *
 * Permanent corpus guard for the v2.1.0-g milestone.
 * Detects inline issue/PR number citations across the 5 scoped prompt-content directories
 * and fails RED until Phase 66 cleans up all violations.
 *
 * SCAN_DIRS:
 *   commands/, get-shit-done/workflows/, agents/,
 *   get-shit-done/references/, get-shit-done/templates/
 *
 * Citation categories detected (per D-07, Phase 64 taxonomy):
 *   inline        — #NNN standalone (not in hex color, not a heading marker)
 *   parenthetical — (#NNN) wrapped in parentheses
 *   feat-form     — feat-NNNN with 3+ digit tracker ID
 *
 * Allowlist policy:
 *   - PLACEHOLDER_DIGITS: exact-value Set of allowlisted integers. Includes:
 *     - Illustrative placeholder numbers (#1, #2, #45, #123) — used as examples in
 *       prompt content and must not be flagged as real issue/PR citations.
 *     - Functional cross-references validated by other test files:
 *       #2924 — worktree HEAD attachment safety ref required by worktree-cleanup.test.cjs
 *       #1729 — explore-integration deferral ref required by thinking-partner.test.cjs
 *   - Frontmatter blocks: YAML frontmatter (lines between opening/closing `---` when
 *     frontmatter starts on line 1) are excluded from scanning (per D-09).
 *   - Fenced code blocks: triple-backtick fences are excluded from scanning (per D-10).
 *   - Hex color lookbehind: `(?<![0-9a-fA-F#])` prevents matching hex color tails
 *     (e.g., the `#70` suffix of `#e8c170`) as inline citations (per D-11).
 *
 * This test is GREEN after Phase 66 citation cleanup and allowlist finalization.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// Directories containing prompt files to scan (per D-08, Phase 64 scan scope)
const SCAN_DIRS = [
  'commands',
  'get-shit-done/workflows',
  'agents',
  'get-shit-done/references',
  'get-shit-done/templates',
];

// Allowlist of illustrative placeholder digits per Phase 64 FINDINGS Allowlist Candidates table.
// #45 is included defensively (no real corpus hit) per D-05.
// These values (#1, #2, #45, #123) are used as illustrative examples in prompt content
// and must not be flagged as real issue/PR citations.
// Illustrative placeholder numbers used as examples in prompt content (#1, #2, #45, #123).
// Also includes functional cross-references that other test files validate and require:
//   #1729 — explore-integration deferral decision (thinking-partner.test.cjs validates its presence)
//   #2439 — gsd-sdk pre-flight guard contract (bug-2439-set-profile-gsd-sdk-preflight.test.cjs)
//   #2924 — worktree HEAD attachment safety ref (worktree-cleanup.test.cjs validates its presence)
const PLACEHOLDER_DIGITS = new Set([1, 2, 45, 123, 1729, 2439, 2924]);

// inline / parenthetical: #NNN where N is one or more digits.
// The lookbehind (?<![0-9a-fA-F#]) prevents matching hex color tails (e.g., the `#70`
// suffix of `#e8c170`) and ## heading markers (per D-11).
// Regex source: Phase 64 citation scanner (inline detection, hex lookbehind).
const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;

// feat-form: feat-NNNN with 3+ digit tracker IDs.
// feat-3347 is the confirmed canonical hit (Phase 64 FINDINGS).
// Regex source: Phase 64 citation scanner (feat-form detection).
const FEAT_FORM_RE = /\bfeat-(\d{3,})\b/g;

// ─── File collection ──────────────────────────────────────────────────────────

/**
 * Recursively collect all .md files under dir.
 * Tolerates missing directories (ENOENT) silently; re-throws unexpected errors.
 *
 * @param {string} dir
 * @returns {string[]}
 */
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

// All markdown files across SCAN_DIRS — collected once at module scope so that
// each corpus describe block can reference ALL_FILES directly, avoiding multiple
// identical filesystem traversals and providing a single point-of-truth for SCAN_DIRS changes.
// (collectMarkdownFiles is a function declaration and is hoisted above this initializer.)
const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * Scan content for inline, parenthetical, and feat-form citation patterns.
 * Applies frontmatter exclusion (D-09), code-fence exclusion (D-10),
 * hex lookbehind (D-11), and PLACEHOLDER_DIGITS allowlist (D-04).
 *
 * @param {string} content - Full file content
 * @returns {Array<{ lineNumber: number, text: string, category: string, contextLine: string }>}
 */
function scanContent(content) {
  const lines = content.split('\n');
  const hits = [];

  let inCodeBlock = false;
  let inFrontmatter = false;
  let frontmatterDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    // ── Frontmatter toggle (D-09) ────────────────────────────────────────────
    // Only active before frontmatterDone; YAML frontmatter must begin on line 1
    // by specification — a --- on any later line is a thematic break, not frontmatter.
    // Both the opening and closing --- lines are skipped (continue after toggle).
    if (!frontmatterDone && trimmed === '---') {
      if (!inFrontmatter && lineNumber === 1) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        inFrontmatter = false;
        frontmatterDone = true;
        continue;
      }
      // else: a '---' thematic break with no frontmatter open — treat as normal content line
    }
    if (inFrontmatter) continue;

    // ── Code-fence toggle (D-10) ─────────────────────────────────────────────
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // ── Inline / parenthetical detection ─────────────────────────────────────
    INLINE_RE.lastIndex = 0;
    let m;
    while ((m = INLINE_RE.exec(line)) !== null) {
      const digit = parseInt(m[1], 10);
      // Skip PLACEHOLDER_DIGITS allowlist (D-04)
      if (PLACEHOLDER_DIGITS.has(digit)) continue;

      const matchStart = m.index;
      const matchEnd = matchStart + m[0].length;

      // Parenthetical: immediately preceded by '(' and followed by ')'
      const charBefore = matchStart > 0 ? line[matchStart - 1] : '';
      const charAfter = matchEnd < line.length ? line[matchEnd] : '';
      const category = (charBefore === '(' && charAfter === ')') ? 'parenthetical' : 'inline';

      hits.push({ lineNumber, text: m[0], category, contextLine: trimmed });
    }

    // ── Feat-form detection ───────────────────────────────────────────────────
    FEAT_FORM_RE.lastIndex = 0;
    while ((m = FEAT_FORM_RE.exec(line)) !== null) {
      hits.push({ lineNumber, text: m[0], category: 'feat-form', contextLine: trimmed });
    }
  }

  return hits;
}

// ─── Unit tests: scanContent() — inline citation detection ───────────────────

describe('scanContent() — inline citation detection', () => {
  test('INLINE_RE positive: #3097 produces one inline hit', () => {
    const hits = scanContent('Fix applied in #3097 worktree guard');
    assert.equal(hits.length, 1, 'should detect one hit');
    assert.equal(hits[0].text, '#3097', 'text should be #3097');
    assert.equal(hits[0].category, 'inline', 'category should be inline');
  });

  test('parenthetical category: (#3097) produces one parenthetical hit', () => {
    const hits = scanContent('See the fix (#3097) for details');
    assert.equal(hits.length, 1, 'should detect one hit');
    assert.equal(hits[0].text, '#3097', 'text should be #3097');
    assert.equal(hits[0].category, 'parenthetical', 'category should be parenthetical');
  });

  test('FEAT_FORM_RE positive: feat-3347 produces one feat-form hit', () => {
    const hits = scanContent('This was introduced in feat-3347 auto-update');
    assert.equal(hits.length, 1, 'should detect one hit');
    assert.equal(hits[0].text, 'feat-3347', 'text should be feat-3347');
    assert.equal(hits[0].category, 'feat-form', 'category should be feat-form');
  });

  test('hex color exemption (D-11): #e8c170 produces zero hits', () => {
    const hits = scanContent('Use color `#e8c170` for highlight nodes');
    assert.equal(hits.length, 0, 'hex color tail must not be flagged');
  });

  test('PLACEHOLDER_DIGITS exemption (D-04): #1, #2, #45, #123 produce zero hits', () => {
    const hits = scanContent('Examples: step #1, step #2, item #45, issue #123 are placeholders');
    assert.equal(hits.length, 0, 'illustrative placeholder digits must not be flagged');
  });
});

// ─── Unit tests: scanContent() — exclusion state machines ────────────────────

describe('scanContent() — exclusion state machines', () => {
  test('heading marker exemption: ## Section and ### Subsection produce zero hits', () => {
    const hits = scanContent('## Section heading\n### Subsection heading\n');
    assert.equal(hits.length, 0, 'heading markers must not be flagged as citations');
  });

  test('frontmatter exclusion (D-09): color: "#A78BFA" inside frontmatter produces zero hits', () => {
    const content = '---\nname: gsd-agent\ncolor: \'#A78BFA\'\n---\nbody text';
    const hits = scanContent(content);
    assert.equal(hits.length, 0, 'frontmatter color value must not be flagged');
  });

  test('code fence exclusion (D-10): #3456 inside fence produces zero hits', () => {
    const content = '```\n#3456 inside fence\n```\n';
    const hits = scanContent(content);
    assert.equal(hits.length, 0, 'citation inside code fence must not be flagged');
  });

  test('non-line-1 --- is not frontmatter: #3456 after thematic break produces one hit', () => {
    const content = 'body line\n---\n#3456 after thematic break';
    const hits = scanContent(content);
    assert.equal(hits.length, 1, 'citation after a non-frontmatter --- must be detected');
    assert.equal(hits[0].text, '#3456', 'text should be #3456');
  });
});

// ─── Corpus tests ─────────────────────────────────────────────────────────────

describe('corpus scan — no issue citations', () => {
  for (const file of ALL_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no citations in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const hits = scanContent(content);
      const enumerated = hits
        .map(h => `  ${relPath}:${h.lineNumber} ${h.text} (${h.category})\n      ${h.contextLine}`)
        .join('\n');
      assert.deepStrictEqual(hits, [],
        `Citations in ${relPath}. Remove issue/PR number citations from prompt content.\n${enumerated}\nTo add an allowlist exemption: add the digit to PLACEHOLDER_DIGITS`
      );
    });
  }
});
