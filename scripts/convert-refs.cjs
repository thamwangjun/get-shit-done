#!/usr/bin/env node
/**
 * convert-refs.cjs
 *
 * Applies D-06 and D-07 transformations to .md files in four target directories:
 *   - commands/gsd/
 *   - agents/
 *   - get-shit-done/workflows/
 *   - get-shit-done/references/
 *
 * D-06: Install-time static GSD refs → Eta include tags (bare-line only)
 *   !`cat $HOME/.claude/get-shit-done/X`  →  {%~ include('get-shit-done/X') %}
 *   !`cat ~/.claude/get-shit-done/X`      →  {%~ include('get-shit-done/X') %}
 *   @~/.claude/get-shit-done/X            →  {%~ include('get-shit-done/X') %}
 *   @$HOME/.claude/get-shit-done/X        →  {%~ include('get-shit-done/X') %}
 *
 * D-07: Runtime .planning/ bare-line refs → bash cat form
 *   @.planning/X  →  !`cat .planning/X`
 *   !`cat .planning/X`  →  retain unchanged (idempotent)
 *
 * D-08: Inline @~ within prose is RETAINED as-is — only bare lines are converted.
 * A "bare line" is one whose trimmed content is ENTIRELY the reference pattern.
 *
 * Run with --dry-run to preview changes without writing.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const dryRun = process.argv.includes('--dry-run');

const REPO_ROOT = path.join(__dirname, '..');

const TARGET_DIRS = [
  path.join(REPO_ROOT, 'commands', 'gsd'),
  path.join(REPO_ROOT, 'agents'),
  path.join(REPO_ROOT, 'get-shit-done', 'workflows'),
  path.join(REPO_ROOT, 'get-shit-done', 'references'),
];

// ─── File collection ───────────────────────────────────────────────────────

/**
 * Recursively collect all .md files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectMdFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

// ─── Path safety ───────────────────────────────────────────────────────────

/**
 * Returns true if a relative path tail extracted from a ref pattern is safe
 * to use in an Eta include tag. Rejects paths containing traversal segments
 * (`..`) or absolute-path markers.
 * @param {string} tail
 * @returns {boolean}
 */
function isSafePath(tail) {
  return !/(?:^|\/)\.\.(?:\/|$)/.test(tail) && !path.isAbsolute(tail);
}

// ─── Line transformation ────────────────────────────────────────────────────

// D-06 regexes — match lines that are ENTIRELY the pattern (no other content)
const RE_CAT_HOME  = /^!\`cat \$HOME\/\.claude\/get-shit-done\/(.+)\`$/;
const RE_CAT_TILDE = /^!\`cat ~\/\.claude\/get-shit-done\/(.+)\`$/;
const RE_AT_TILDE  = /^@~\/\.claude\/get-shit-done\/(.+)$/;
const RE_AT_HOME   = /^@\$HOME\/\.claude\/get-shit-done\/(.+)$/;

// D-07 regex — bare @.planning/X line
const RE_AT_PLANNING = /^@\.planning\/(.+)$/;

// D-07 idempotent guard — already in bash cat form
const RE_CAT_PLANNING = /^!\`cat \.planning\//;

/**
 * Transform a single line applying D-06 and D-07 rules.
 * The trimmed value must be ENTIRELY the pattern (bare-line constraint, D-08).
 *
 * @param {string} line  - the raw line (may have leading whitespace)
 * @returns {string|null} - transformed line, or null if no change
 */
function transformLine(line) {
  const trimmed = line.trim();

  // Extract leading whitespace to preserve indentation
  const indent = line.slice(0, line.length - line.trimStart().length);

  // D-06: !`cat $HOME/.claude/get-shit-done/X`
  let m = RE_CAT_HOME.exec(trimmed);
  if (m) {
    if (!isSafePath(m[1])) {
      process.stderr.write(`WARN: skipping unsafe path in D-06 pattern: ${m[1]}\n`);
      return null;
    }
    return `${indent}{%~ include('get-shit-done/${m[1]}') %}`;
  }

  // D-06: !`cat ~/.claude/get-shit-done/X`
  m = RE_CAT_TILDE.exec(trimmed);
  if (m) {
    if (!isSafePath(m[1])) {
      process.stderr.write(`WARN: skipping unsafe path in D-06 pattern: ${m[1]}\n`);
      return null;
    }
    return `${indent}{%~ include('get-shit-done/${m[1]}') %}`;
  }

  // D-06: @~/.claude/get-shit-done/X
  m = RE_AT_TILDE.exec(trimmed);
  if (m) {
    if (!isSafePath(m[1])) {
      process.stderr.write(`WARN: skipping unsafe path in D-06 pattern: ${m[1]}\n`);
      return null;
    }
    return `${indent}{%~ include('get-shit-done/${m[1]}') %}`;
  }

  // D-06: @$HOME/.claude/get-shit-done/X
  m = RE_AT_HOME.exec(trimmed);
  if (m) {
    if (!isSafePath(m[1])) {
      process.stderr.write(`WARN: skipping unsafe path in D-06 pattern: ${m[1]}\n`);
      return null;
    }
    return `${indent}{%~ include('get-shit-done/${m[1]}') %}`;
  }

  // D-07 idempotent: already !`cat .planning/X` — retain
  if (RE_CAT_PLANNING.test(trimmed)) return null;

  // D-07: @.planning/X → !`cat .planning/X`
  m = RE_AT_PLANNING.exec(trimmed);
  if (m) return `${indent}!\`cat .planning/${m[1]}\``;

  return null; // no change
}

// ─── File transformation ────────────────────────────────────────────────────

/**
 * Apply transformations to all lines in a file.
 * Only writes if the content actually changed (idempotent).
 *
 * @param {string} filePath
 * @returns {{ changed: boolean, linesChanged: number }}
 */
function transformFile(filePath) {
  let original;
  try {
    original = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    process.stderr.write(`ERROR reading ${filePath}: ${err.message}\n`);
    return { changed: false, linesChanged: 0 };
  }

  const lines = original.split('\n');
  const out   = [];
  let linesChanged = 0;

  for (let i = 0; i < lines.length; i++) {
    const transformed = transformLine(lines[i]);
    if (transformed !== null && transformed !== lines[i]) {
      if (dryRun) {
        process.stdout.write(`  line ${i + 1}: ${lines[i].trim()} → ${transformed.trim()}\n`);
      }
      out.push(transformed);
      linesChanged++;
    } else {
      out.push(lines[i]);
    }
  }

  if (linesChanged === 0) return { changed: false, linesChanged: 0 };

  const result = out.join('\n');
  if (!dryRun) {
    try {
      fs.writeFileSync(filePath, result, 'utf-8');
    } catch (err) {
      process.stderr.write(`ERROR writing ${filePath}: ${err.message}\n`);
      return { changed: false, linesChanged: 0 };
    }
  }

  return { changed: true, linesChanged };
}

// ─── Main ───────────────────────────────────────────────────────────────────

let totalFiles    = 0;
let changedFiles  = 0;
let totalLines    = 0;

for (const dir of TARGET_DIRS) {
  const files = collectMdFiles(dir);
  for (const filePath of files) {
    totalFiles++;
    const rel = path.relative(REPO_ROOT, filePath);
    const { changed, linesChanged } = transformFile(filePath);
    if (changed || (dryRun && linesChanged > 0)) {
      process.stdout.write(`${dryRun ? '[dry-run] would change' : 'changed'}: ${rel} (${linesChanged} line${linesChanged !== 1 ? 's' : ''})\n`);
      changedFiles++;
      totalLines += linesChanged;
    }
  }
}

process.stdout.write(`\nSummary: ${totalFiles} files processed, ${changedFiles} files ${dryRun ? 'would be ' : ''}changed, ${totalLines} lines ${dryRun ? 'would be ' : ''}transformed\n`);

if (!dryRun && changedFiles === 0 && totalFiles > 0) {
  process.stdout.write('All files already up to date (idempotent).\n');
}

process.exit(0);
