'use strict';

/**
 * no-prose-artifacts.test.cjs
 *
 * Permanent corpus guard for the v2.1.0-g milestone.
 * Detects prose artifacts left behind after issue/PR citation removal across the 5 scoped
 * prompt-content directories. Complements no-issue-citations.test.cjs (which guards against
 * citation presence) by guarding against the repair artifacts that naive citation removal
 * can leave in prose (CITE-08, Phase 66 D-05/D-06/D-07).
 *
 * SCAN_DIRS:
 *   commands/, get-shit-done/workflows/, agents/,
 *   get-shit-done/references/, get-shit-done/templates/
 *
 * Artifact categories detected (per CITE-08, Phase 66 cleanup rules):
 *   double_space     — two or more consecutive spaces mid-sentence (after a non-whitespace char),
 *                      excluding table rows, box-drawing lines, comment-aligned code, and
 *                      blockquote YAML indentation.
 *   empty_parens     — () not preceded by a word character (i.e., not a function call like
 *                      Task(), Agent(), require()) and not followed by '=>' (arrow function).
 *   space_before_comma — word character immediately followed by space + comma (` ,`), a
 *                        canonical citation-removal artifact (e.g. "fix , and" from "fix #N, and").
 *   space_before_period — word character followed by space + period (` .`) followed by whitespace
 *                         or end-of-line, excluding lines containing file-path indicators.
 *
 * Exclusion policy:
 *   - Frontmatter blocks: YAML frontmatter (lines between opening/closing `---` when
 *     frontmatter starts on line 1) are excluded from scanning (matching D-09 in citation test).
 *   - Fenced code blocks: triple-backtick fences are excluded from scanning (matching D-10).
 *   - Table rows: lines whose trimmed content starts with `|` are excluded (markdown tables
 *     use spacing for column alignment).
 *   - Box-drawing / arrow lines: lines containing Unicode box-drawing or arrow characters
 *     are excluded (ASCII art diagrams use multiple spaces for layout).
 *   - Blockquote lines: lines whose trimmed content starts with `>` are excluded (blockquotes
 *     often contain indented YAML examples with alignment spacing).
 *   - Comment-aligned lines: lines with two-or-more spaces immediately before `# ` are
 *     excluded (shell command/comment alignment is conventional).
 *   - Backtick-followed-by-spaces: double space immediately after a closing backtick is
 *     excluded (inline code span alignment, e.g. `cmd`  then ...).
 *   - YAML key-value alignment: lines where a quoted value is followed by spaces and another
 *     `key:` are excluded (e.g. gate-prompt options: `label: "X"   description: "Y"`).
 *   - Compressed numbered lists: lines matching `N. WORD  N. WORD` patterns are excluded
 *     (docs that compress multiple list items to one line for readability).
 *   - Function-call empty parens: () preceded by a word character is a function call — excluded.
 *   - Arrow function: () immediately followed by `=>` is an arrow function — excluded.
 *   - File-path context for period: lines containing `find .`, `./`, `.ext` or similar
 *     path indicators are excluded from space-before-period checks.
 *
 * This test is GREEN after Phase 66 citation cleanup and prose repair pass.
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

// Unicode box-drawing and arrow characters used in ASCII diagrams.
// Lines containing any of these are excluded from double-space detection.
const BOX_CHARS = new Set([
  '│', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼',
  '═', '╔', '╗', '╚', '╝', '╠', '╣', '╦', '╩', '╬',
  '─', '║', '▼', '▲', '▶', '◀', '►', '◄', '↓', '↑', '→', '←',
]);

// Mid-sentence double space: two or more spaces between two non-whitespace chars.
// Applied after table/box/blockquote exclusions.
const DOUBLE_SPACE_RE = /\S  +\S/;

// Empty parentheses NOT preceded by a word character (excludes function calls like
// Task(), Agent(), require(), eval()) and NOT followed by '=>' (arrow functions).
// Detects citation-removal artifacts like '(#3097)' → '()'.
const EMPTY_PAREN_RE = /(?<!\w)\(\)(?!\s*=>)/;

// Space before comma: word char + space + comma (space or end-of-line).
// Canonical citation artifact: "fix #3097, and" → "fix , and" if number not cleaned.
const SPACE_BEFORE_COMMA_RE = /\w ,(?:\s|$)/;

// Space before period: word char + space + period (space or end-of-line).
// Applied only on lines without file-path indicators (see exclusion in scanContent).
const SPACE_BEFORE_PERIOD_RE = /\w \.(?:\s|$)/;

// File-path indicator pattern: excludes lines with `find .`, `./`, `.ext` patterns.
// Prevents false positives from shell commands (`find . -name`) and file paths.
const FILE_PATH_IN_LINE_RE = /(?:find\s+\.|\.\/|\.\\|node_modules|\.\w{1,5}[/\\ "'`])/;

/**
 * Scan content for prose artifact patterns left behind by citation removal.
 * Applies frontmatter exclusion, code-fence exclusion, and structural exclusions
 * (tables, box-drawing, blockquotes, aligned comments).
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

    // ── Structural exclusions for double-space and related checks ─────────────

    // Skip table rows: markdown tables use spacing for column alignment.
    const isTableRow = trimmed.startsWith('|');

    // Skip lines with box-drawing or arrow characters: ASCII diagrams use
    // multi-space layout that is not a prose artifact.
    const hasBoxChars = [...line].some(c => BOX_CHARS.has(c));

    // Skip blockquote lines: blockquotes often contain YAML examples with
    // alignment spacing (e.g. '>     severity: BLOCKER').
    const isBlockquote = trimmed.startsWith('>');

    // Skip lines with comment-alignment (e.g. 'cmd   # Run all tests').
    const hasCommentAlignment = /  +#\s/.test(line);

    // Skip lines where double space follows a closing backtick span
    // (e.g. '`Skill()`  then loop' — alignment after inline code).
    const hasBacktickDoubleSpace = /`  +\w/.test(line);

    // Skip YAML-style key-value alignment: 'label: "value"   description: "..."'
    // Matches lines where a quoted value is followed by two or more spaces then
    // another key: pattern (e.g. gate-prompt option lines with aligned fields).
    const hasYamlKeyAlign = /"  +\w+:/.test(line);

    // Skip compressed numbered lists: 'N. WORD  N. WORD' on one line.
    const isCompressedList = /\d+\.\s+\w+  +\d+\./.test(line);

    const skipForDoubleSpace = isTableRow || hasBoxChars || isBlockquote
      || hasCommentAlignment || hasBacktickDoubleSpace || hasYamlKeyAlign || isCompressedList;

    // ── Double-space detection ────────────────────────────────────────────────
    if (!skipForDoubleSpace && DOUBLE_SPACE_RE.test(line)) {
      hits.push({ lineNumber, text: '(double space)', category: 'double_space', contextLine: trimmed });
    }

    // ── Empty-parentheses detection ───────────────────────────────────────────
    if (EMPTY_PAREN_RE.test(line)) {
      hits.push({ lineNumber, text: '()', category: 'empty_parens', contextLine: trimmed });
    }

    // ── Space-before-comma detection ──────────────────────────────────────────
    if (SPACE_BEFORE_COMMA_RE.test(line)) {
      hits.push({ lineNumber, text: ' ,', category: 'space_before_comma', contextLine: trimmed });
    }

    // ── Space-before-period detection ─────────────────────────────────────────
    // Skip lines that contain file-path context (find ., ./, .ext patterns).
    if (!FILE_PATH_IN_LINE_RE.test(line) && SPACE_BEFORE_PERIOD_RE.test(line)) {
      hits.push({ lineNumber, text: ' .', category: 'space_before_period', contextLine: trimmed });
    }
  }

  return hits;
}

// ─── Unit tests: scanContent() — prose artifact detection ────────────────────

describe('scanContent() — prose artifact detection', () => {

  // ── Double-space detection ──────────────────────────────────────────────────

  test('double_space positive: mid-sentence double space produces one hit', () => {
    const hits = scanContent('This fix was applied  here in the codebase');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 1, 'should detect one double_space hit');
    assert.equal(ds[0].category, 'double_space', 'category should be double_space');
  });

  test('double_space negative: leading indentation only does not produce hit', () => {
    const hits = scanContent('  - list item with leading indent');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'leading indentation must not be flagged');
  });

  test('double_space negative: table row alignment does not produce hit', () => {
    const hits = scanContent('| col A  | col B  | col C  |');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'table row alignment must not be flagged');
  });

  test('double_space negative: box-drawing line does not produce hit', () => {
    const hits = scanContent('│  Component A  │  Component B  │');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'box-drawing line must not be flagged');
  });

  test('double_space negative: comment-aligned command line does not produce hit', () => {
    const hits = scanContent('npm test                 # Run all tests');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'comment-aligned command line must not be flagged');
  });

  test('double_space negative: backtick-then-double-space does not produce hit', () => {
    const hits = scanContent('Use `Skill(skill="gsd-verify-work")`  then loop to dashboard.');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'double space after backtick code span must not be flagged');
  });

  test('double_space negative: compressed numbered list does not produce hit', () => {
    const hits = scanContent('1. README  2. ARCHITECTURE  3. GETTING-STARTED');
    const ds = hits.filter(h => h.category === 'double_space');
    assert.equal(ds.length, 0, 'compressed numbered list must not be flagged');
  });

  // ── Empty-parentheses detection ─────────────────────────────────────────────

  test('empty_parens positive: standalone () produces one hit', () => {
    const hits = scanContent('See the issue tracker () for more details');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 1, 'should detect one empty_parens hit');
    assert.equal(ep[0].category, 'empty_parens', 'category should be empty_parens');
  });

  test('empty_parens negative: function call Task() does not produce hit', () => {
    const hits = scanContent('Spawned via Task() invocation');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 0, 'function call Task() must not be flagged');
  });

  test('empty_parens negative: function call Agent() does not produce hit', () => {
    const hits = scanContent('After calling Agent() above, stop working');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 0, 'function call Agent() must not be flagged');
  });

  test('empty_parens negative: function call require() does not produce hit', () => {
    const hits = scanContent('For deps imported via require(), set to require');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 0, 'function call require() must not be flagged');
  });

  test('empty_parens negative: arrow function () => does not produce hit', () => {
    const hits = scanContent('describe("suite", () => { it("test") })');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 0, 'arrow function () => must not be flagged');
  });

  test('empty_parens negative: method call jwt.verify() does not produce hit', () => {
    const hits = scanContent('validate before jwt.verify() call');
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 0, 'method call jwt.verify() must not be flagged');
  });

  // ── Space-before-comma detection ────────────────────────────────────────────

  test('space_before_comma positive: word-space-comma produces one hit', () => {
    const hits = scanContent('The fix applied , and tested in production');
    const sc = hits.filter(h => h.category === 'space_before_comma');
    assert.equal(sc.length, 1, 'should detect one space_before_comma hit');
    assert.equal(sc[0].category, 'space_before_comma', 'category should be space_before_comma');
  });

  test('space_before_comma negative: normal comma without leading space does not produce hit', () => {
    const hits = scanContent('Fix applied, and tested');
    const sc = hits.filter(h => h.category === 'space_before_comma');
    assert.equal(sc.length, 0, 'normal comma must not be flagged');
  });

  test('space_before_comma negative: comma after non-word char does not produce hit', () => {
    const hits2 = scanContent('items: [a, b] done');
    const sc = hits2.filter(h => h.category === 'space_before_comma');
    assert.equal(sc.length, 0, 'comma after bracket must not be flagged');
  });

  // ── Space-before-period detection ───────────────────────────────────────────

  test('space_before_period positive: word-space-period-space produces one hit', () => {
    const hits = scanContent('Completed the task . Review the output');
    const sp = hits.filter(h => h.category === 'space_before_period');
    assert.equal(sp.length, 1, 'should detect one space_before_period hit');
    assert.equal(sp[0].category, 'space_before_period', 'category should be space_before_period');
  });

  test('space_before_period negative: file path find . does not produce hit', () => {
    const hits = scanContent('find . -name "*.md" | head');
    const sp = hits.filter(h => h.category === 'space_before_period');
    assert.equal(sp.length, 0, 'find . shell pattern must not be flagged');
  });

  test('space_before_period negative: ./ relative path does not produce hit', () => {
    const hits = scanContent('Run via ./scripts/build.sh');
    const sp = hits.filter(h => h.category === 'space_before_period');
    assert.equal(sp.length, 0, 'relative path ./ must not be flagged');
  });

  // ── Exclusion state machines ────────────────────────────────────────────────

  test('frontmatter exclusion: artifacts inside frontmatter produce zero hits', () => {
    const content = '---\nname: gsd-agent\ndescription: Fix applied  here\n---\nbody text';
    const hits = scanContent(content);
    assert.equal(hits.length, 0, 'frontmatter content must not be scanned');
  });

  test('code fence exclusion: artifacts inside fence produce zero hits', () => {
    const content = '```\nSee () for details\n```\n';
    const hits = scanContent(content);
    assert.equal(hits.length, 0, 'content inside code fence must not be scanned');
  });

  test('non-line-1 --- is not frontmatter: artifact after thematic break is detected', () => {
    const content = 'body line\n---\nSee the issue () here';
    const hits = scanContent(content);
    const ep = hits.filter(h => h.category === 'empty_parens');
    assert.equal(ep.length, 1, 'artifact after thematic break must be detected');
  });

  test('multiple artifacts in one line produce multiple hits', () => {
    const content = 'Fix () applied  here , done';
    const hits = scanContent(content);
    const categories = hits.map(h => h.category).sort();
    assert.ok(categories.includes('empty_parens'), 'empty_parens should be detected');
    assert.ok(categories.includes('double_space'), 'double_space should be detected');
    assert.ok(categories.includes('space_before_comma'), 'space_before_comma should be detected');
  });

});

// ─── Corpus tests ─────────────────────────────────────────────────────────────

describe('corpus scan — no prose artifacts', () => {
  for (const file of ALL_FILES) {
    const relPath = path.relative(PROJECT_ROOT, file).split(path.sep).join('/');
    test(`no prose artifacts in ${relPath}`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      const hits = scanContent(content);
      const enumerated = hits
        .map(h => `  ${relPath}:${h.lineNumber} [${h.category}]\n      ${h.contextLine}`)
        .join('\n');
      assert.deepStrictEqual(hits, [],
        `Prose artifacts in ${relPath}. Remove double spaces, empty parens, and space-before-punctuation left by citation removal.\n${enumerated}`
      );
    });
  }
});
