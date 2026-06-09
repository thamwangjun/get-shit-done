#!/usr/bin/env node
/**
 * scan-citations.cjs
 *
 * Multi-pattern citation scanner for the 5 scoped prompt-content directories.
 * Emits a JSON array of { file, line, text, category } hit objects to stdout.
 *
 * Phase 64 / CITE-01 discovery script. Implements:
 *   D-08: CommonJS discovery script at scripts/scan-citations.cjs
 *   D-09: Outputs JSON to stdout; exits 0
 *   D-10: One-pass scan for all citation patterns; frontmatter blocks and
 *         fenced code blocks are excluded from hits
 *
 * Citation taxonomy (D-04, D-05):
 *   inline        — #NNN (standalone, not inside a hex color or heading marker)
 *   parenthetical — (#NNN) — inline hit wrapped in parentheses
 *   word-form     — "issue NNN", "PR NNN", "pull request NNN"
 *   feat-form     — feat-NNNN (3+ digit tracker ID, e.g. feat-3347)
 *
 * Usage:
 *   node scripts/scan-citations.cjs          # emit JSON to stdout
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Argument validation ──────────────────────────────────────────────────────

for (const arg of process.argv.slice(2)) {
  process.stderr.write(`Unknown flag: ${arg}\nUsage: node scripts/scan-citations.cjs\n`);
  process.exit(1);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.join(__dirname, '..');

// Phase 64 citation scan scope (CONTEXT.md domain — all 5 scoped prompt-content dirs)
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

const ALL_FILES = [];
for (const dir of SCAN_DIRS) {
  ALL_FILES.push(...collectMarkdownFiles(path.join(PROJECT_ROOT, dir)));
}

// ─── Citation detector regexes (D-04, D-05, D-10) ────────────────────────────

// inline / parenthetical: #NNN where N is one or more digits.
// The lookbehind (?<![0-9a-fA-F#]) prevents matching hex color tails (e.g.
// the tail of #e8c170) and ## heading markers.
const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;

// word-form: "issue NNN", "PR NNN", "pull request NNN" with 2+ digits
const WORD_FORM_RE = /\b(?:issue|PR|pull request)\s+(\d{2,})\b/gi;

// feat-form: feat-NNNN with 3+ digit tracker IDs (D-05; feat-3347 is the confirmed canonical hit)
const FEAT_FORM_RE = /\bfeat-(\d{3,})\b/g;

// ─── Main driver ──────────────────────────────────────────────────────────────

const hits = [];

for (const filePath of ALL_FILES) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    continue; // skip unreadable files silently
  }

  const relPath = path.relative(PROJECT_ROOT, filePath).split(path.sep).join('/');
  const lines = content.split('\n');

  let inCodeBlock    = false;
  let inFrontmatter  = false;
  let frontmatterDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line    = lines[i];
    const trimmed = line.trim();
    const lineNumber = i + 1;

    // ── Frontmatter toggle (D-10) ────────────────────────────────────────────
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

    // ── Code-fence toggle (symmetric skip, D-10) ─────────────────────────────
    if (/^```/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // ── Inline / parenthetical detection ─────────────────────────────────────
    INLINE_RE.lastIndex = 0;
    let m;
    while ((m = INLINE_RE.exec(line)) !== null) {
      const matchStart = m.index;
      const matchEnd   = matchStart + m[0].length;

      // Parenthetical: immediately preceded by '(' and followed by ')'
      const charBefore = matchStart > 0 ? line[matchStart - 1] : '';
      const charAfter  = matchEnd < line.length ? line[matchEnd] : '';
      const category   = (charBefore === '(' && charAfter === ')') ? 'parenthetical' : 'inline';

      hits.push({ file: relPath, line: lineNumber, text: m[0], category });
    }

    // ── Word-form detection ───────────────────────────────────────────────────
    WORD_FORM_RE.lastIndex = 0;
    while ((m = WORD_FORM_RE.exec(line)) !== null) {
      hits.push({ file: relPath, line: lineNumber, text: m[0], category: 'word-form' });
    }

    // ── Feat-form detection ───────────────────────────────────────────────────
    FEAT_FORM_RE.lastIndex = 0;
    while ((m = FEAT_FORM_RE.exec(line)) !== null) {
      hits.push({ file: relPath, line: lineNumber, text: m[0], category: 'feat-form' });
    }
  }
}

process.stdout.write(JSON.stringify(hits, null, 2) + '\n');
process.exit(0);
