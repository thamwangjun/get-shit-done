'use strict';

process.env.GSD_TEST_MODE = '1';

/**
 * Guards against the BSD/GNU mktemp incompatibility introduced when a suffix
 * is placed AFTER the trailing X-run inside the mktemp template string.
 *
 * Background:
 *   BSD mktemp (macOS) only substitutes a trailing contiguous run of X's.
 *   If a suffix such as `.md` or `.json` appears after the X's INSIDE the
 *   quoted template (e.g. `mktemp "${TMPDIR:-/tmp}/gsd-pr-body.XXXXXX.md"`),
 *   BSD leaves the X's literal and creates the file with the literal name —
 *   resulting in a fixed, predictable temp-file name (collision and security
 *   risk).  GNU mktemp (Linux) handles the suffix transparently, masking the
 *   bug in CI.
 *
 * Portable form (already used in execute-phase.md and quick.md):
 *   TMPFILE="$(mktemp "${TMPDIR:-/tmp}/gsd-something-XXXXXX").suffix"
 *   — the X-run terminates the mktemp template; the suffix is appended
 *   outside the command substitution.
 *
 * This test scans all `get-shit-done/workflows/*.md` files and fails if any
 * mktemp invocation places a suffix (a non-whitespace, non-quote character)
 * immediately after the trailing X-run inside the same template string.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const WORKFLOWS_DIR = path.join(REPO_ROOT, 'get-shit-done', 'workflows');

/**
 * Recursively collect all *.md files under a directory.
 *
 * @param {string} dir - Absolute path to search.
 * @returns {string[]} Sorted list of absolute file paths.
 */
function listMarkdownFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results.sort();
}

/**
 * Scan a single file for non-portable mktemp patterns.
 *
 * A line is a violation when a mktemp template places a suffix (dot + chars)
 * AFTER the trailing X-run inside the quoted/unquoted template string.
 *
 * Detection patterns:
 *   Pattern A (double-quoted template):
 *     mktemp[^\n]*"[^"]*X{3,}[^"\s]
 *     Catches: mktemp "${TMPDIR:-/tmp}/gsd-name.XXXXXX.md"
 *     Does NOT catch portable form: mktemp "...XXXXXX").md  — closing " is right after X's
 *
 *   Pattern B (unquoted / single-quoted template):
 *     mktemp[^\n]*[^"'\s]X{3,}\.[A-Za-z]
 *     Catches: mktemp /tmp/gsd-name-XXXXXX.json
 *     Does NOT catch portable form: mktemp /tmp/gsd-name-XXXXXX").json  — ) follows X's
 *
 * @param {string} filePath - Absolute path to the file to scan.
 * @returns {{ file: string, line: number, text: string }[]} Violations found.
 */
function scanFile(filePath) {
  const relFile = path.relative(REPO_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  // Detect non-portable mktemp templates where a suffix follows the trailing X-run.
  //
  // The portable form closes the mktemp template string immediately after the X-run:
  //   mktemp "${TMPDIR:-/tmp}/gsd-name-XXXXXX"     — X's followed by closing "
  //   mktemp "${TMPDIR:-/tmp}/gsd-name-XXXXXX")    — X's followed by closing ")
  //
  // The non-portable form places a dot-suffix INSIDE the template:
  //   mktemp "${TMPDIR:-/tmp}/gsd-name.XXXXXX.md"  — X's followed by .md
  //   mktemp /tmp/gsd-name-XXXXXX.json             — X's followed by .json
  //
  // Pattern: a mktemp invocation whose template string contains X{3,} immediately
  // followed by a literal dot (the start of a file extension) — this is the
  // distinguishing mark of the non-portable BSD-incompatible form.
  const badPattern = /mktemp\b[^\n]*X{3,}\./;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (badPattern.test(line)) {
      violations.push({ file: relFile, line: i + 1, text: line.trim() });
    }
  }

  return violations;
}

// ── Test suite ──────────────────────────────────────────────────────────────

describe('portable mktemp templates', () => {
  test('no workflow places a suffix after the trailing mktemp X-run', () => {
    const files = listMarkdownFiles(WORKFLOWS_DIR);
    assert.ok(
      files.length > 0,
      'No workflow *.md files found — check WORKFLOWS_DIR path: ' + WORKFLOWS_DIR,
    );

    const allViolations = [];
    for (const f of files) {
      allViolations.push(...scanFile(f));
    }

    if (allViolations.length > 0) {
      const details = allViolations
        .map((v) => `  ${v.file}:${v.line}  ${v.text}`)
        .join('\n');
      assert.fail(
        `${allViolations.length} non-portable mktemp template(s) found.\n\n` +
        `BSD mktemp only substitutes a trailing X-run; a suffix inside the template\n` +
        `string creates a fixed-name temp file (collision / security risk).\n\n` +
        `Offending lines:\n${details}\n\n` +
        `Portable fix: move the suffix OUTSIDE the command substitution:\n` +
        `  Bad:  TMPFILE=$(mktemp "\${TMPDIR:-/tmp}/gsd-name.XXXXXX.md")\n` +
        `  Good: TMPFILE="\$(mktemp "\${TMPDIR:-/tmp}/gsd-name-XXXXXX").md"\n`,
      );
    }
  });
});
