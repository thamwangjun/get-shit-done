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
  if (arg === '--') continue; // allow shell/npm-injected separator
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

// ─── Citation detector regexes (D-04, D-05, D-10) ────────────────────────────

// inline / parenthetical: #NNN where N is one or more digits.
// The lookbehind (?<![0-9a-fA-F#]) prevents matching hex color tails (e.g.
// the tail of #e8c170) and ## heading markers.
// Known false-positive: 3-digit all-numeric CSS hex colors (#123, #456, #999)
// pass the lookbehind because no hex character precedes the '#' at a word
// boundary. In practice these are rare in prompt markdown files, but any
// purely-numeric 3-digit color value will be reported as an 'inline' citation.
// If project citation numbers are known to always be 4+ digits, a stricter
// regex (e.g. #(\d{4,})) can eliminate this class of false positives.
const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;

// word-form: "issue NNN", "PR NNN", "pull request NNN" with 2+ digits
const WORD_FORM_RE = /\b(?:issue|PR|pull request)\s+(\d{2,})\b/gi;

// feat-form: feat-NNNN with 3+ digit tracker IDs (D-05; feat-3347 is the confirmed canonical hit)
const FEAT_FORM_RE = /\bfeat-(\d{3,})\b/g;

// ─── Main driver ──────────────────────────────────────────────────────────────

/**
 * Collect all .md files from SCAN_DIRS and scan them for citation patterns.
 * Returns an array of { file, line, text, category } hit objects.
 *
 * @param {string} projectRoot  Root directory to resolve SCAN_DIRS against
 * @param {string[]} scanDirs   Relative subdirectories to scan
 * @returns {{ file: string, line: number, text: string, category: string }[]}
 */
function main(projectRoot, scanDirs) {
  const allFiles = [];
  for (const dir of scanDirs) {
    allFiles.push(...collectMarkdownFiles(path.join(projectRoot, dir)));
  }

  const hits = [];

  for (const filePath of allFiles) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') continue; // file disappeared between collect and read — benign
      const errRelPath = path.relative(projectRoot, filePath).split(path.sep).join('/');
      process.stderr.write(`Warning: could not read ${errRelPath}: ${err.message}\n`);
      continue;
    }

    const relPath = path.relative(projectRoot, filePath).split(path.sep).join('/');
    const lines = content.split('\n');

    let inCodeBlock    = false;
    let inFrontmatter  = false;
    let frontmatterDone = false;

    for (let i = 0; i < lines.length; i++) {
      const line    = lines[i];
      const trimmed = line.trim();
      const lineNumber = i + 1;

      // ── Frontmatter toggle (D-10) ──────────────────────────────────────────
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

      // ── Code-fence toggle (symmetric skip, D-10) ───────────────────────────
      if (/^```/.test(trimmed)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // ── Inline / parenthetical detection ───────────────────────────────────
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

      // ── Word-form detection ─────────────────────────────────────────────────
      WORD_FORM_RE.lastIndex = 0;
      while ((m = WORD_FORM_RE.exec(line)) !== null) {
        hits.push({ file: relPath, line: lineNumber, text: m[0], category: 'word-form' });
      }

      // ── Feat-form detection ─────────────────────────────────────────────────
      FEAT_FORM_RE.lastIndex = 0;
      while ((m = FEAT_FORM_RE.exec(line)) !== null) {
        hits.push({ file: relPath, line: lineNumber, text: m[0], category: 'feat-form' });
      }
    }

    // Warn if a code fence was opened but never closed — citations after the
    // open fence were silently skipped, which is a correctness failure for an
    // audit/discovery script.
    if (inCodeBlock) {
      process.stderr.write(`Warning: unclosed code fence in ${relPath} — citations after open fence may be missed\n`);
    }
  }

  return hits;
}

if (require.main === module) {
  const hits = main(PROJECT_ROOT, SCAN_DIRS);
  const out = JSON.stringify(hits, null, 2) + '\n';
  fs.writeSync(1, out);
  process.exit(0);
}

module.exports = { collectMarkdownFiles, main };
